import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

// User Profile Types
export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  socialLinks?: SocialLink[];
  skills?: string[];
  languages?: string[];
  achievements?: Achievement[];
  statistics?: UserStatistics;
  activityHistory?: Activity[];
  notifications?: Notification[];
  settings?: ProfileSettings;
  privacy?: PrivacySettings;
  lastUpdated: Date;
}

export interface SocialLink {
  platform: 'linkedin' | 'github' | 'twitter' | 'facebook' | 'instagram' | 'website';
  url: string;
  verified: boolean;
}

export interface Achievement {
  id: string;
  type: 'milestone' | 'certification' | 'award' | 'badge';
  title: string;
  description: string;
  icon?: string;
  earnedDate: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
}

export interface UserStatistics {
  totalOrders: number;
  totalTransactions: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  memberSince: Date;
  loginCount: number;
  lastLoginDate?: Date;
  productivityScore: number;
  completionRate: number;
}

export interface Activity {
  id: string;
  type: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  archived: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface ProfileSettings {
  displayName: string;
  publicProfile: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  newsletter: boolean;
  marketingEmails: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'connections';
  activityVisibility: 'all' | 'connections' | 'none';
  searchable: boolean;
  showOnlineStatus: boolean;
  dataRetention: number; // days
  allowDataExport: boolean;
}

// Get User Profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const cacheKey = `profile:${userId}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Get profile data
  const profileResult = await query(
    `SELECT p.*,
            u.username,
            u.email,
            u.first_name,
            u.last_name,
            u.display_name,
            u.department,
            u.position,
            u.created_at as member_since
     FROM user_profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1`,
    [userId]
  );

  if (!profileResult.rows.length) {
    return null;
  }

  const profile = profileResult.rows[0];

  // Get statistics
  const stats = await getUserStatistics(userId);

  // Get recent activities
  const activities = await getRecentActivities(userId, 10);

  // Get unread notifications
  const notifications = await getNotifications(userId, { unreadOnly: true });

  // Get achievements
  const achievements = await getUserAchievements(userId);

  const fullProfile: UserProfile = {
    id: profile.id,
    userId: profile.user_id,
    bio: profile.bio,
    avatar: profile.avatar,
    coverImage: profile.cover_image,
    socialLinks: profile.social_links || [],
    skills: profile.skills || [],
    languages: profile.languages || [],
    achievements,
    statistics: stats,
    activityHistory: activities,
    notifications,
    settings: profile.settings,
    privacy: profile.privacy,
    lastUpdated: profile.updated_at
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, fullProfile, 300);

  return fullProfile;
};

// Update User Profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Update profile
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }

    if (updates.avatar !== undefined) {
      updateFields.push(`avatar = $${paramCount++}`);
      values.push(updates.avatar);
    }

    if (updates.coverImage !== undefined) {
      updateFields.push(`cover_image = $${paramCount++}`);
      values.push(updates.coverImage);
    }

    if (updates.socialLinks !== undefined) {
      updateFields.push(`social_links = $${paramCount++}`);
      values.push(JSON.stringify(updates.socialLinks));
    }

    if (updates.skills !== undefined) {
      updateFields.push(`skills = $${paramCount++}`);
      values.push(updates.skills);
    }

    if (updates.languages !== undefined) {
      updateFields.push(`languages = $${paramCount++}`);
      values.push(updates.languages);
    }

    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(updates.settings));
    }

    if (updates.privacy !== undefined) {
      updateFields.push(`privacy = $${paramCount++}`);
      values.push(JSON.stringify(updates.privacy));
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      await client.query(
        `UPDATE user_profiles 
         SET ${updateFields.join(', ')}
         WHERE user_id = $${paramCount}`,
        values
      );
    }

    // Log activity
    await logActivity(client, userId, 'profile_update', 'Updated profile');

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`profile:${userId}`);

    logger.info(`Profile updated for user: ${userId}`);
    return getUserProfile(userId);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating profile:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get User Statistics
async function getUserStatistics(userId: string): Promise<UserStatistics> {
  const statsResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM orders WHERE customer_id = $1) as total_orders,
      (SELECT COUNT(*) FROM transactions WHERE user_id = $1) as total_transactions,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = $1) as total_spent,
      (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE customer_id = $1) as avg_order_value,
      (SELECT MAX(order_date) FROM orders WHERE customer_id = $1) as last_order_date,
      (SELECT created_at FROM users WHERE id = $1) as member_since,
      (SELECT COUNT(*) FROM audit_logs WHERE user_id = $1 AND action = 'login') as login_count,
      (SELECT MAX(timestamp) FROM audit_logs WHERE user_id = $1 AND action = 'login') as last_login_date`,
    [userId]
  );

  const stats = statsResult.rows[0];

  return {
    totalOrders: parseInt(stats.total_orders) || 0,
    totalTransactions: parseInt(stats.total_transactions) || 0,
    totalSpent: parseFloat(stats.total_spent) || 0,
    averageOrderValue: parseFloat(stats.avg_order_value) || 0,
    lastOrderDate: stats.last_order_date,
    memberSince: stats.member_since,
    loginCount: parseInt(stats.login_count) || 0,
    lastLoginDate: stats.last_login_date,
    productivityScore: calculateProductivityScore(stats),
    completionRate: calculateCompletionRate(stats)
  };
}

// Get Recent Activities
async function getRecentActivities(userId: string, limit: number = 20): Promise<Activity[]> {
  const result = await query(
    `SELECT 
      id,
      action as type,
      action,
      COALESCE(details::text, '') as description,
      details as metadata,
      timestamp
     FROM audit_logs
     WHERE user_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    action: row.action,
    description: row.description || `Performed ${row.action}`,
    metadata: row.metadata,
    timestamp: row.timestamp
  }));
}

// Notification Management
export const getNotifications = async (
  userId: string,
  options?: {
    unreadOnly?: boolean;
    category?: string;
    limit?: number;
  }
): Promise<Notification[]> => {
  let query = `
    SELECT *
    FROM notifications
    WHERE user_id = $1 AND archived = false
  `;
  const params = [userId];
  let paramCount = 2;

  if (options?.unreadOnly) {
    query += ` AND read = false`;
  }

  if (options?.category) {
    query += ` AND category = $${paramCount++}`;
    params.push(options.category);
  }

  query += ` ORDER BY created_at DESC`;

  if (options?.limit) {
    query += ` LIMIT $${paramCount++}`;
    params.push(options.limit);
  }

  const result = await query(query, params);

  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
    read: row.read,
    archived: row.archived,
    createdAt: row.created_at,
    readAt: row.read_at
  }));
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  await query(
    `UPDATE notifications 
     SET read = true, read_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );

  // Clear cache
  await cache.del(`notifications:${userId}:unread`);
};

export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'read' | 'archived' | 'createdAt' | 'readAt'>
): Promise<void> => {
  await query(
    `INSERT INTO notifications (
      user_id, type, category, title, message,
      action_url, action_label, read, archived
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, false)`,
    [
      userId, notification.type, notification.category,
      notification.title, notification.message,
      notification.actionUrl, notification.actionLabel
    ]
  );

  // Send real-time notification if user is online
  await sendRealtimeNotification(userId, notification);

  // Clear cache
  await cache.del(`notifications:${userId}:unread`);
};

// Achievement System
async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const result = await query(
    `SELECT *
     FROM user_achievements
     WHERE user_id = $1 AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
     ORDER BY earned_date DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    icon: row.icon,
    earnedDate: row.earned_date,
    expiryDate: row.expiry_date,
    metadata: row.metadata
  }));
}

export const grantAchievement = async (
  userId: string,
  achievement: Omit<Achievement, 'id' | 'earnedDate'>
): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check if achievement already exists
    const existing = await client.query(
      `SELECT id FROM user_achievements 
       WHERE user_id = $1 AND type = $2 AND title = $3`,
      [userId, achievement.type, achievement.title]
    );

    if (existing.rows.length) {
      throw new AppError('Achievement already granted', 400);
    }

    // Grant achievement
    await client.query(
      `INSERT INTO user_achievements (
        user_id, type, title, description, icon,
        expiry_date, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId, achievement.type, achievement.title,
        achievement.description, achievement.icon,
        achievement.expiryDate, JSON.stringify(achievement.metadata)
      ]
    );

    // Create notification
    await createNotification(userId, {
      type: 'success',
      category: 'achievement',
      title: 'New Achievement!',
      message: `You've earned: ${achievement.title}`,
      actionUrl: '/profile/achievements'
    });

    // Log activity
    await logActivity(client, userId, 'achievement_earned', `Earned ${achievement.title}`);

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`profile:${userId}`);

    logger.info(`Achievement granted to user ${userId}: ${achievement.title}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error granting achievement:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Activity Tracking
async function logActivity(
  client: any,
  userId: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (
      user_id, action, resource, resource_id, details, result
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, action, 'profile', userId, JSON.stringify(metadata), 'success']
  );
}

// Export User Data (GDPR compliance)
export const exportUserData = async (userId: string): Promise<any> => {
  const userData = {
    profile: await getUserProfile(userId),
    activities: await getRecentActivities(userId, 1000),
    notifications: await query(
      'SELECT * FROM notifications WHERE user_id = $1',
      [userId]
    ).then(r => r.rows),
    orders: await query(
      'SELECT * FROM orders WHERE customer_id = $1',
      [userId]
    ).then(r => r.rows),
    audit_logs: await query(
      'SELECT * FROM audit_logs WHERE user_id = $1',
      [userId]
    ).then(r => r.rows)
  };

  // Log data export
  await query(
    `INSERT INTO audit_logs (
      user_id, action, resource, resource_id, details, result
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, 'data_export', 'user', userId, null, 'success']
  );

  return userData;
};

// Delete User Data (Right to be forgotten)
export const deleteUserData = async (
  userId: string,
  requestedBy: string
): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Anonymize user data instead of hard delete
    await client.query(
      `UPDATE users 
       SET username = $1,
           email = $2,
           first_name = 'Deleted',
           last_name = 'User',
           display_name = 'Deleted User',
           phone_number = NULL,
           status = 'deleted',
           deactivated_at = CURRENT_TIMESTAMP,
           deactivated_by = $3
       WHERE id = $4`,
      [`deleted_${userId}`, `deleted_${userId}@example.com`, requestedBy, userId]
    );

    // Delete profile data
    await client.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM session_tokens WHERE user_id = $1', [userId]);

    // Log deletion
    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, result
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [requestedBy, 'data_deletion', 'user', userId, null, 'success']
    );

    await client.query('COMMIT');

    // Clear all caches
    await cache.del(`profile:${userId}`);
    await cache.del(`user:${userId}`);
    await cache.del(`user:permissions:${userId}`);

    logger.info(`User data deleted: ${userId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting user data:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Helper functions
function calculateProductivityScore(stats: any): number {
  // Simple productivity calculation based on activity
  const orderScore = Math.min(stats.total_orders * 2, 50);
  const transactionScore = Math.min(stats.total_transactions, 30);
  const loginScore = Math.min(stats.login_count / 10, 20);
  
  return Math.round(orderScore + transactionScore + loginScore);
}

function calculateCompletionRate(stats: any): number {
  // Calculate task/order completion rate
  // This is a placeholder - would need actual completion data
  return 85;
}

async function sendRealtimeNotification(
  userId: string,
  notification: any
): Promise<void> {
  // Implementation for real-time notification via WebSocket/SSE
  logger.info(`Real-time notification sent to user ${userId}`);
}