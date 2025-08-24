// Dashboard Module Types

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'calendar' | 'map' | 'table' | 'custom';
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  refreshInterval?: number; // in seconds
  dataSource: DataSource;
  visualization: VisualizationConfig;
  filters?: WidgetFilter[];
  actions?: WidgetAction[];
  permissions?: string[];
  isVisible: boolean;
  isResizable: boolean;
  isDraggable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z: number; // layer order
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DataSource {
  type: 'api' | 'database' | 'cache' | 'realtime' | 'static';
  endpoint?: string;
  query?: string;
  parameters?: Record<string, any>;
  aggregation?: AggregationConfig;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface AggregationConfig {
  groupBy?: string[];
  metrics?: AggregationMetric[];
  timeRange?: TimeRange;
  interval?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface AggregationMetric {
  field: string;
  function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
  alias?: string;
}

export interface TimeRange {
  type: 'relative' | 'absolute' | 'rolling';
  value?: string; // e.g., 'last_7_days', '2024-01-01/2024-01-31'
  startDate?: Date;
  endDate?: Date;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'bubble' | 'heatmap' | 'gauge';
  colors?: string[];
  legend?: LegendConfig;
  axes?: AxesConfig;
  tooltip?: TooltipConfig;
  animation?: boolean;
  stacked?: boolean;
  showDataLabels?: boolean;
  thresholds?: Threshold[];
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
}

export interface AxesConfig {
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
}

export interface AxisConfig {
  label?: string;
  type?: 'linear' | 'logarithmic' | 'category' | 'time';
  min?: number;
  max?: number;
  tickInterval?: number;
  format?: string;
  gridLines?: boolean;
}

export interface TooltipConfig {
  enabled: boolean;
  format?: string;
  shared?: boolean;
}

export interface Threshold {
  value: number;
  color: string;
  label?: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
}

export interface WidgetFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
  label?: string;
  isActive: boolean;
}

export interface WidgetAction {
  id: string;
  type: 'drill_down' | 'export' | 'refresh' | 'navigate' | 'custom';
  label: string;
  icon?: string;
  url?: string;
  handler?: string;
  permissions?: string[];
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  theme?: DashboardTheme;
  filters?: DashboardFilter[];
  permissions: DashboardPermission[];
  isPublic: boolean;
  isDefault: boolean;
  tags?: string[];
  owner: string;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
  padding?: number;
  responsive?: ResponsiveConfig[];
}

export interface ResponsiveConfig {
  breakpoint: number;
  columns: number;
  layout?: 'stack' | 'hide' | 'resize';
}

export interface DashboardTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontFamily?: string;
  fontSize?: string;
}

export interface DashboardFilter {
  id: string;
  field: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: FilterOption[];
  defaultValue?: any;
  required?: boolean;
  affectsWidgets?: string[]; // widget IDs
}

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

export interface DashboardPermission {
  role: string;
  actions: ('view' | 'edit' | 'delete' | 'share')[];
}

export interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: TrendData[];
  icon?: string;
  color?: string;
  unit?: string;
  format?: string;
  sparkline?: boolean;
  target?: number;
  progress?: number;
}

export interface TrendData {
  date: Date;
  value: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isArchived: boolean;
  expiresAt?: Date;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target: string;
  targetType: string;
  targetId?: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
  result: 'success' | 'failure' | 'pending';
  duration?: number; // in ms
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  name: string;
  description?: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  frequency: AlertFrequency;
  recipients: AlertRecipient[];
  actions: AlertAction[];
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'contains' | 'change';
  threshold: any;
  duration?: number; // in minutes
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  timeWindow?: number; // in minutes
}

export interface AlertFrequency {
  type: 'immediate' | 'throttle' | 'schedule';
  value?: number; // throttle period in minutes
  schedule?: string; // cron expression
}

export interface AlertRecipient {
  type: 'user' | 'role' | 'email' | 'webhook';
  value: string;
  channels: ('email' | 'sms' | 'push' | 'slack' | 'teams')[];
}

export interface AlertAction {
  type: 'notify' | 'execute' | 'escalate' | 'log';
  config: Record<string, any>;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'adhoc' | 'realtime';
  format: 'pdf' | 'excel' | 'csv' | 'html' | 'json';
  template?: string;
  data: ReportDataConfig;
  schedule?: ReportSchedule;
  distribution: ReportDistribution[];
  parameters?: ReportParameter[];
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ReportDataConfig {
  sources: DataSource[];
  joins?: DataJoin[];
  filters?: ReportFilter[];
  groupBy?: string[];
  orderBy?: OrderByConfig[];
  limit?: number;
}

export interface DataJoin {
  leftTable: string;
  rightTable: string;
  leftField: string;
  rightField: string;
  type: 'inner' | 'left' | 'right' | 'full';
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
  isParameter?: boolean;
}

export interface OrderByConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  cronExpression?: string;
  timezone?: string;
}

export interface ReportDistribution {
  type: 'email' | 'ftp' | 'api' | 'storage';
  recipients?: string[];
  config?: Record<string, any>;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: any[];
}

// Request/Response Types
export interface GetDashboardRequest {
  dashboardId?: string;
  category?: string;
  includeWidgets?: boolean;
}

export interface CreateWidgetRequest {
  dashboardId: string;
  type: string;
  title: string;
  dataSource: DataSource;
  visualization?: VisualizationConfig;
  position?: WidgetPosition;
  size?: WidgetSize;
}

export interface UpdateWidgetRequest {
  title?: string;
  position?: WidgetPosition;
  size?: WidgetSize;
  dataSource?: DataSource;
  visualization?: VisualizationConfig;
  filters?: WidgetFilter[];
}

export interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    inventoryValue: number;
    pendingTasks: number;
    systemHealth: number;
  };
  trends: {
    revenueTrend: TrendData[];
    ordersTrend: TrendData[];
    customersTrend: TrendData[];
  };
  performance: {
    topProducts: any[];
    topCustomers: any[];
    lowStock: any[];
    overduePayments: any[];
  };
  alerts: Alert[];
  activities: Activity[];
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: string[];
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}