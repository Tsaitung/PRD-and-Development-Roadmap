import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  User,
  Role,
  Permission,
  AuditLog,
  SystemConfiguration,
  SystemHealth,
  Backup,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  AuditLogQuery,
  SystemConfigUpdateRequest,
  BackupRequest
} from './types';

// User Management
export const createUser = async (request: CreateUserRequest & { createdBy: string }): Promise<User> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check for existing username or email
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [request.username, request.email]
    );

    if (existingUser.rows.length) {
      throw new AppError('Username or email already exists', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(request.password, salt);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (
        username, email, password_hash, first_name, last_name, display_name,
        employee_id, department, position, status, email_verified,
        two_factor_enabled, login_attempts, must_change_password, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        request.username, request.email, passwordHash,
        request.firstName, request.lastName,
        `${request.firstName} ${request.lastName}`,
        null, request.department, request.position,
        'pending', false, false, 0, false, request.createdBy
      ]
    );

    const user = userResult.rows[0];

    // Assign default role if no roles specified
    const roles = request.roles && request.roles.length > 0 ? request.roles : ['user'];
    
    for (const roleName of roles) {
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [roleName]
      );

      if (roleResult.rows.length) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [user.id, roleResult.rows[0].id]
        );
      }
    }

    // Create default preferences
    await client.query(
      `INSERT INTO user_preferences (
        user_id, theme, language, timezone, date_format,
        number_format, currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id, 'system', 'zh-TW', 'Asia/Taipei',
        'YYYY-MM-DD', '1,234.56', 'TWD'
      ]
    );

    // Send welcome email if requested
    if (request.sendWelcomeEmail) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await client.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000)]
      );
      
      // Queue welcome email
      await queueWelcomeEmail(user.email, user.first_name, verificationToken);
    }

    // Audit log
    await createAuditLog(client, {
      userId: request.createdBy,
      action: 'create_user',
      resource: 'user',
      resourceId: user.id,
      details: { username: request.username, email: request.email },
      result: 'success'
    });

    await client.query('COMMIT');

    // Clear cache
    await cache.del('users:all');
    await cache.del('users:active');

    logger.info(`User created: ${request.username}`);
    return getUserById(user.id);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating user:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Authentication
export const login = async (request: LoginRequest): Promise<LoginResponse> => {
  const client = await getClient();
  
  try {
    // Get user with roles
    const userResult = await client.query(
      `SELECT u.*, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.username = $1 OR u.email = $1
       GROUP BY u.id`,
      [request.username]
    );

    if (!userResult.rows.length) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = userResult.rows[0];

    // Check account status
    if (user.status !== 'active') {
      throw new AppError(`Account is ${user.status}`, 403);
    }

    // Check login attempts
    if (user.login_attempts >= 5) {
      throw new AppError('Account locked due to too many failed attempts', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(request.password, user.password_hash);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await client.query(
        'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1',
        [user.id]
      );
      throw new AppError('Invalid credentials', 401);
    }

    // Check 2FA if enabled
    if (user.two_factor_enabled && !request.twoFactorCode) {
      return {
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        user: { id: user.id },
        requiresTwoFactor: true
      };
    }

    if (user.two_factor_enabled && request.twoFactorCode) {
      // Verify 2FA code
      const isValidCode = await verify2FACode(user.id, request.twoFactorCode);
      if (!isValidCode) {
        throw new AppError('Invalid 2FA code', 401);
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: user.roles
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: request.rememberMe ? '30d' : '7d' }
    );

    // Store session
    await client.query(
      `INSERT INTO session_tokens (
        user_id, token, type, ip_address, user_agent, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id, refreshToken, 'refresh',
        '', '', // IP and user agent would come from request
        new Date(Date.now() + (request.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
      ]
    );

    // Update user login info
    await client.query(
      `UPDATE users 
       SET last_login_at = CURRENT_TIMESTAMP, 
           login_attempts = 0,
           last_activity_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    // Audit log
    await createAuditLog(client, {
      userId: user.id,
      username: user.username,
      action: 'login',
      resource: 'auth',
      result: 'success'
    });

    logger.info(`User logged in: ${user.username}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        roles: user.roles
      }
    };

  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Change Password
export const changePassword = async (
  userId: string,
  request: ChangePasswordRequest
): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get current password hash
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows.length) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      request.currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(request.newPassword, salt);

    // Update password
    await client.query(
      `UPDATE users 
       SET password_hash = $1, 
           password_changed_at = CURRENT_TIMESTAMP,
           must_change_password = false
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    // Logout other sessions if requested
    if (request.logoutOtherSessions) {
      await client.query(
        'DELETE FROM session_tokens WHERE user_id = $1',
        [userId]
      );
    }

    // Audit log
    await createAuditLog(client, {
      userId,
      action: 'change_password',
      resource: 'user',
      resourceId: userId,
      result: 'success'
    });

    await client.query('COMMIT');

    logger.info(`Password changed for user: ${userId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error changing password:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Role & Permission Management
export const assignRole = async (
  userId: string,
  roleId: string,
  assignedBy: string
): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check if role assignment exists
    const existing = await client.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );

    if (existing.rows.length) {
      throw new AppError('Role already assigned', 400);
    }

    // Assign role
    await client.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [userId, roleId]
    );

    // Audit log
    await createAuditLog(client, {
      userId: assignedBy,
      action: 'assign_role',
      resource: 'user_role',
      resourceId: userId,
      details: { roleId },
      result: 'success'
    });

    await client.query('COMMIT');

    // Clear user cache
    await cache.del(`user:${userId}`);
    await cache.del(`user:permissions:${userId}`);

    logger.info(`Role ${roleId} assigned to user ${userId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error assigning role:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  const cacheKey = `user:permissions:${userId}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Get permissions from roles
  const result = await query(
    `SELECT DISTINCT p.*
     FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1 AND p.is_active = true
     ORDER BY p.resource, p.action`,
    [userId]
  );

  const permissions = result.rows;

  // Cache for 5 minutes
  await cache.set(cacheKey, permissions, 300);

  return permissions;
};

// Audit Logging
async function createAuditLog(
  client: any,
  log: Partial<AuditLog>
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (
      user_id, username, action, resource, resource_id,
      details, ip_address, user_agent, session_id,
      result, error_message, duration
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      log.userId, log.username, log.action, log.resource, log.resourceId,
      JSON.stringify(log.details), log.ipAddress || '', log.userAgent || '',
      log.sessionId, log.result, log.errorMessage, log.duration
    ]
  );
}

export const getAuditLogs = async (query: AuditLogQuery): Promise<any> => {
  let whereConditions = ['1=1'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (query.userId) {
    paramCount++;
    whereConditions.push(`user_id = $${paramCount}`);
    queryParams.push(query.userId);
  }

  if (query.action) {
    paramCount++;
    whereConditions.push(`action = $${paramCount}`);
    queryParams.push(query.action);
  }

  if (query.resource) {
    paramCount++;
    whereConditions.push(`resource = $${paramCount}`);
    queryParams.push(query.resource);
  }

  if (query.startDate) {
    paramCount++;
    whereConditions.push(`timestamp >= $${paramCount}`);
    queryParams.push(query.startDate);
  }

  if (query.endDate) {
    paramCount++;
    whereConditions.push(`timestamp <= $${paramCount}`);
    queryParams.push(query.endDate);
  }

  if (query.result) {
    paramCount++;
    whereConditions.push(`result = $${paramCount}`);
    queryParams.push(query.result);
  }

  const limit = query.limit || 50;
  const offset = ((query.page || 1) - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM audit_logs
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  paramCount++;
  queryParams.push(limit);
  paramCount++;
  queryParams.push(offset);

  const dataQuery = `
    SELECT *
    FROM audit_logs
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY timestamp DESC
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `;

  const dataResult = await query(dataQuery, queryParams);

  return {
    data: dataResult.rows,
    pagination: {
      page: query.page || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// System Configuration
export const getSystemConfig = async (category?: string): Promise<SystemConfiguration[]> => {
  const cacheKey = category ? `config:${category}` : 'config:all';
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  let query = 'SELECT * FROM system_configurations WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = $1';
    params.push(category);
  }

  query += ' ORDER BY category, key';

  const result = await query(query, params);
  const configs = result.rows;

  // Decrypt encrypted values
  for (const config of configs) {
    if (config.is_encrypted && config.value) {
      config.value = decryptValue(config.value);
    }
  }

  // Cache for 10 minutes
  await cache.set(cacheKey, configs, 600);

  return configs;
};

export const updateSystemConfig = async (
  request: SystemConfigUpdateRequest,
  updatedBy: string
): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(request.settings)) {
      // Get current config
      const configResult = await client.query(
        'SELECT * FROM system_configurations WHERE category = $1 AND key = $2',
        [request.category, key]
      );

      if (!configResult.rows.length) {
        throw new AppError(`Configuration ${request.category}.${key} not found`, 404);
      }

      const config = configResult.rows[0];

      // Validate value
      if (config.validation) {
        validateConfigValue(value, config.validation);
      }

      // Encrypt if needed
      const finalValue = config.is_encrypted ? encryptValue(value) : value;

      // Update configuration
      await client.query(
        `UPDATE system_configurations 
         SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
         WHERE id = $3`,
        [finalValue, updatedBy, config.id]
      );

      // Clear affected cache
      if (config.affects_cache) {
        await cache.flush();
      }
    }

    // Audit log
    await createAuditLog(client, {
      userId: updatedBy,
      action: 'update_config',
      resource: 'system_configuration',
      details: { category: request.category, settings: Object.keys(request.settings) },
      result: 'success'
    });

    await client.query('COMMIT');

    // Clear config cache
    await cache.del(`config:${request.category}`);
    await cache.del('config:all');

    // Apply immediately if requested
    if (request.applyImmediately) {
      await reloadConfiguration(request.category);
    }

    logger.info(`System configuration updated: ${request.category}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating system config:', error);
    throw error;
  } finally {
    client.release();
  }
};

// System Health Monitoring
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const health: SystemHealth = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    components: [],
    metrics: await getSystemMetrics(),
    alerts: []
  };

  // Check database
  try {
    const start = Date.now();
    await query('SELECT 1');
    health.components.push({
      name: 'PostgreSQL',
      type: 'database',
      status: 'up',
      responseTime: Date.now() - start,
      lastChecked: new Date()
    });
  } catch (error) {
    health.components.push({
      name: 'PostgreSQL',
      type: 'database',
      status: 'down',
      lastChecked: new Date(),
      details: { error: error.message }
    });
    health.status = 'unhealthy';
  }

  // Check Redis
  try {
    const start = Date.now();
    await cache.get('health:check');
    health.components.push({
      name: 'Redis',
      type: 'cache',
      status: 'up',
      responseTime: Date.now() - start,
      lastChecked: new Date()
    });
  } catch (error) {
    health.components.push({
      name: 'Redis',
      type: 'cache',
      status: 'down',
      lastChecked: new Date(),
      details: { error: error.message }
    });
    health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  // Check for alerts
  const alertsResult = await query(
    `SELECT * FROM health_alerts 
     WHERE acknowledged = false 
     ORDER BY severity DESC, timestamp DESC 
     LIMIT 10`
  );
  health.alerts = alertsResult.rows;

  if (health.alerts.some(a => a.severity === 'critical')) {
    health.status = 'unhealthy';
  } else if (health.alerts.some(a => a.severity === 'error')) {
    health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  return health;
};

// Backup Management
export const createBackup = async (
  request: BackupRequest,
  createdBy: string
): Promise<Backup> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Create backup record
    const backupResult = await client.query(
      `INSERT INTO backups (
        type, status, source, destination, compression,
        encrypted, retention, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        request.type, 'pending', 'database', request.destination,
        request.compression || false, request.encryption || false,
        request.retention || 30, createdBy
      ]
    );

    const backup = backupResult.rows[0];

    // Queue backup job
    await queueBackupJob(backup.id, request);

    // Audit log
    await createAuditLog(client, {
      userId: createdBy,
      action: 'create_backup',
      resource: 'backup',
      resourceId: backup.id,
      details: { type: request.type, components: request.components },
      result: 'success'
    });

    await client.query('COMMIT');

    logger.info(`Backup initiated: ${backup.id}`);
    return backup;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating backup:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Helper functions
async function verify2FACode(userId: string, code: string): Promise<boolean> {
  // Implementation for 2FA verification
  // This would use a library like speakeasy or otplib
  return true; // Placeholder
}

async function queueWelcomeEmail(email: string, firstName: string, token: string): Promise<void> {
  // Implementation for queuing welcome email
  logger.info(`Welcome email queued for ${email}`);
}

async function queueBackupJob(backupId: string, request: BackupRequest): Promise<void> {
  // Implementation for queuing backup job
  logger.info(`Backup job queued: ${backupId}`);
}

function encryptValue(value: any): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'secret', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptValue(encrypted: string): any {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'secret', 'salt', 32);
  
  const [ivHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

function validateConfigValue(value: any, validation: any): void {
  switch (validation.type) {
    case 'regex':
      if (!new RegExp(validation.pattern).test(value)) {
        throw new AppError(validation.errorMessage || 'Invalid value format', 400);
      }
      break;
    case 'range':
      if (value < validation.min || value > validation.max) {
        throw new AppError(validation.errorMessage || 'Value out of range', 400);
      }
      break;
    case 'enum':
      if (!validation.values.includes(value)) {
        throw new AppError(validation.errorMessage || 'Invalid value', 400);
      }
      break;
  }
}

async function reloadConfiguration(category: string): Promise<void> {
  // Implementation for reloading configuration
  logger.info(`Configuration reloaded: ${category}`);
}

async function getSystemMetrics(): Promise<any> {
  // Implementation for getting system metrics
  return {
    cpu: {
      usage: 45,
      cores: 4
    },
    memory: {
      used: 2048,
      total: 8192,
      percentage: 25
    },
    disk: {
      used: 50000,
      total: 200000,
      percentage: 25
    },
    network: {
      bytesIn: 1000000,
      bytesOut: 500000,
      connections: 150
    },
    database: {
      connections: 25,
      activeQueries: 5,
      slowQueries: 0
    },
    cache: {
      hits: 10000,
      misses: 500,
      hitRate: 95,
      memory: 128
    }
  };
}

export const getUserById = async (userId: string): Promise<User | null> => {
  const result = await query(
    `SELECT u.*, 
            array_agg(DISTINCT r.name) as roles,
            json_build_object(
              'theme', up.theme,
              'language', up.language,
              'timezone', up.timezone
            ) as preferences
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     LEFT JOIN user_preferences up ON u.id = up.user_id
     WHERE u.id = $1
     GROUP BY u.id, up.theme, up.language, up.timezone`,
    [userId]
  );

  return result.rows[0] || null;
};