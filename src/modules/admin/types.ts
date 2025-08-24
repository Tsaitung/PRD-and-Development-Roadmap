// System Administration Module Types

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  phoneNumber?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  roles: Role[];
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  preferences: UserPreferences;
  loginAttempts: number;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
  sessionTokens?: SessionToken[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deactivatedAt?: Date;
  deactivatedBy?: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope?: 'own' | 'department' | 'organization';
  conditions?: PermissionCondition[];
  description?: string;
  isActive: boolean;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface SessionToken {
  id: string;
  token: string;
  type: 'access' | 'refresh';
  deviceInfo?: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface DeviceInfo {
  deviceId?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  location?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  shortcuts?: KeyboardShortcut[];
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    categories: string[];
  };
  push: {
    enabled: boolean;
    categories: string[];
  };
  sms: {
    enabled: boolean;
    categories: string[];
  };
  inApp: {
    enabled: boolean;
    showPopup: boolean;
    playSound: boolean;
  };
}

export interface DashboardPreferences {
  defaultDashboardId?: string;
  widgets: string[];
  layout: 'grid' | 'list' | 'cards';
  refreshInterval: number;
}

export interface KeyboardShortcut {
  key: string;
  action: string;
  description: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  changes?: AuditChange[];
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  duration?: number; // in ms
  timestamp: Date;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface SystemConfiguration {
  id: string;
  category: string;
  key: string;
  value: any;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  displayName: string;
  description?: string;
  isPublic: boolean;
  isEditable: boolean;
  isEncrypted: boolean;
  validation?: ConfigValidation;
  defaultValue?: any;
  possibleValues?: any[];
  dependsOn?: string[];
  affectsCache: boolean;
  requiresRestart: boolean;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ConfigValidation {
  type: 'regex' | 'range' | 'enum' | 'custom';
  pattern?: string;
  min?: number;
  max?: number;
  values?: any[];
  customValidator?: string;
  errorMessage?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  components: ComponentHealth[];
  metrics: SystemMetrics;
  alerts: HealthAlert[];
}

export interface ComponentHealth {
  name: string;
  type: 'database' | 'cache' | 'queue' | 'storage' | 'api' | 'service';
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    memory: number;
  };
}

export interface HealthAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolvedAt?: Date;
}

export interface Backup {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  source: string;
  destination: string;
  size: number;
  compression: boolean;
  encrypted: boolean;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  files?: BackupFile[];
  metadata?: Record<string, any>;
  retention: number; // days
  createdBy: string;
  error?: string;
}

export interface BackupFile {
  path: string;
  size: number;
  checksum: string;
  encrypted: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  type: 'system' | 'maintenance' | 'report' | 'cleanup' | 'backup' | 'custom';
  schedule: TaskSchedule;
  command?: string;
  script?: string;
  parameters?: Record<string, any>;
  timeout?: number; // seconds
  retryPolicy?: RetryPolicy;
  notifications?: TaskNotification[];
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastStatus?: 'success' | 'failure' | 'skipped';
  lastDuration?: number;
  createdAt: Date;
  createdBy: string;
}

export interface TaskSchedule {
  type: 'cron' | 'interval' | 'once';
  expression?: string; // cron expression
  interval?: number; // seconds
  runAt?: Date; // for once type
  timezone?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // seconds
  backoffMultiplier?: number;
  maxDelay?: number;
}

export interface TaskNotification {
  event: 'start' | 'success' | 'failure' | 'timeout';
  channels: string[];
  recipients: string[];
}

export interface License {
  id: string;
  licenseKey: string;
  type: 'trial' | 'standard' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  issueDate: Date;
  expiryDate: Date;
  maxUsers?: number;
  maxTransactions?: number;
  features: string[];
  restrictions?: LicenseRestriction[];
  company: string;
  contactEmail: string;
  lastValidated?: Date;
  checksum: string;
}

export interface LicenseRestriction {
  feature: string;
  limit?: number;
  expiryDate?: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'file' | 'email' | 'sms';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  configuration: IntegrationConfig;
  credentials?: IntegrationCredentials;
  mappings?: FieldMapping[];
  schedule?: TaskSchedule;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'failure' | 'partial';
  lastSyncRecords?: number;
  errorCount: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface IntegrationConfig {
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  rateLimit?: {
    requests: number;
    period: number;
  };
}

export interface IntegrationCredentials {
  type: 'apikey' | 'oauth' | 'basic' | 'token';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  expiresAt?: Date;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: any;
  required: boolean;
}

// Request/Response Types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: string[];
  department?: string;
  position?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  status?: 'active' | 'inactive' | 'suspended';
  roles?: string[];
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  logoutOtherSessions?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Partial<User>;
  requiresTwoFactor?: boolean;
}

export interface SystemConfigUpdateRequest {
  category: string;
  settings: Record<string, any>;
  applyImmediately?: boolean;
}

export interface BackupRequest {
  type: 'full' | 'incremental' | 'differential';
  components: string[];
  compression?: boolean;
  encryption?: boolean;
  destination: string;
  retention?: number;
}

export interface RestoreRequest {
  backupId: string;
  components?: string[];
  targetEnvironment?: string;
  validateOnly?: boolean;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'success' | 'failure';
  page?: number;
  limit?: number;
}