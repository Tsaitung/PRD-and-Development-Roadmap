// Business Intelligence & Analytics Module Types

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  type: 'executive' | 'operational' | 'financial' | 'sales' | 'inventory' | 'production' | 'custom';
  layout: DashboardLayout;
  widgets: Widget[];
  filters: DashboardFilter[];
  refreshInterval?: number; // in seconds
  isPublic: boolean;
  isDefault: boolean;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  responsive: boolean;
}

export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'map' | 'gauge' | 'heatmap' | 'timeline';
  title: string;
  description?: string;
  dataSource: DataSource;
  visualization: VisualizationConfig;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval?: number;
  interactive: boolean;
  drillDown?: DrillDownConfig;
}

export interface DataSource {
  type: 'query' | 'api' | 'calculation' | 'aggregation';
  query?: string;
  endpoint?: string;
  parameters?: Record<string, any>;
  aggregations?: AggregationConfig[];
  timeRange?: TimeRange;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'bubble' | 'radar' | 'funnel';
  colors?: string[];
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  axes?: {
    x?: AxisConfig;
    y?: AxisConfig;
  };
  thresholds?: Threshold[];
  format?: FormatConfig;
}

export interface AxisConfig {
  label: string;
  type: 'linear' | 'logarithmic' | 'category' | 'datetime';
  min?: number;
  max?: number;
  format?: string;
}

export interface Threshold {
  value: number;
  color: string;
  label?: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
}

export interface FormatConfig {
  numberFormat?: string;
  dateFormat?: string;
  currency?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export interface DrillDownConfig {
  enabled: boolean;
  targetDashboard?: string;
  targetWidget?: string;
  parameters?: string[];
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'text';
  dataSource?: DataSource;
  options?: FilterOption[];
  defaultValue?: any;
  required: boolean;
  affectsWidgets: string[]; // Widget IDs
}

export interface FilterOption {
  value: any;
  label: string;
  group?: string;
}

export interface AggregationConfig {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct' | 'percentile';
  alias?: string;
  groupBy?: string[];
}

export interface TimeRange {
  type: 'fixed' | 'relative' | 'rolling';
  start?: Date;
  end?: Date;
  relativeValue?: number;
  relativeUnit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
}

export interface KPI {
  id: string;
  name: string;
  description?: string;
  category: string;
  formula: string;
  unit?: string;
  target?: number;
  thresholds?: KPIThreshold[];
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  dataSource: DataSource;
  trend?: TrendConfig;
  alerts?: AlertConfig[];
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIThreshold {
  level: 'critical' | 'warning' | 'good' | 'excellent';
  min?: number;
  max?: number;
  color: string;
  notification?: boolean;
}

export interface TrendConfig {
  enabled: boolean;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  direction: 'up' | 'down' | 'stable';
  percentage?: number;
}

export interface AlertConfig {
  id: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  frequency: 'once' | 'hourly' | 'daily';
  active: boolean;
}

export interface AlertChannel {
  type: 'email' | 'sms' | 'webhook' | 'system';
  recipients?: string[];
  webhook?: string;
  template?: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'adhoc' | 'template';
  template?: ReportTemplate;
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  parameters?: ReportParameter[];
  distribution?: Distribution[];
  lastGenerated?: Date;
  nextScheduled?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  layout: 'portrait' | 'landscape';
  sections: ReportSection[];
  header?: ReportHeader;
  footer?: ReportFooter;
  styles?: Record<string, any>;
}

export interface ReportSection {
  id: string;
  type: 'title' | 'text' | 'table' | 'chart' | 'image' | 'pagebreak';
  content?: string;
  dataSource?: DataSource;
  visualization?: VisualizationConfig;
  position?: number;
  conditional?: string;
}

export interface ReportHeader {
  logo?: string;
  title: string;
  subtitle?: string;
  showDate: boolean;
  showPageNumber: boolean;
}

export interface ReportFooter {
  text?: string;
  showPageNumber: boolean;
  showGeneratedTime: boolean;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone?: string;
}

export interface ReportParameter {
  name: string;
  type: 'date' | 'string' | 'number' | 'select';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: any[];
}

export interface Distribution {
  type: 'email' | 'ftp' | 'api' | 'storage';
  recipients?: string[];
  ftpConfig?: FTPConfig;
  apiConfig?: APIConfig;
  storageConfig?: StorageConfig;
}

export interface FTPConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  directory: string;
}

export interface APIConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  authentication?: {
    type: 'basic' | 'bearer' | 'apikey';
    credentials: Record<string, string>;
  };
}

export interface StorageConfig {
  provider: 's3' | 'azure' | 'gcs' | 'local';
  bucket?: string;
  path: string;
  public: boolean;
}

export interface AnalyticsQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  parameters?: QueryParameter[];
  resultType: 'single' | 'list' | 'matrix';
  cacheable: boolean;
  cacheTime?: number;
  tags?: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  validation?: string;
}

export interface DataInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number; // 0-100
  impact?: string;
  recommendation?: string;
  dataPoints?: any[];
  metadata?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering' | 'timeseries';
  algorithm: string;
  features: string[];
  target: string;
  accuracy?: number;
  trainingData?: {
    startDate: Date;
    endDate: Date;
    recordCount: number;
  };
  parameters?: Record<string, any>;
  lastTrainedAt?: Date;
  nextTrainingAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Results
export interface AnalyticsResult {
  query: string;
  executedAt: Date;
  executionTime: number; // in ms
  data: any[];
  metadata?: {
    columns?: ColumnMetadata[];
    rowCount?: number;
    hasMore?: boolean;
  };
  error?: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  aggregation?: string;
}

export interface DashboardData {
  dashboardId: string;
  widgets: WidgetData[];
  filters: Record<string, any>;
  refreshedAt: Date;
}

export interface WidgetData {
  widgetId: string;
  data: any;
  metadata?: Record<string, any>;
  error?: string;
  lastUpdated: Date;
}

// Request/Response Types
export interface CreateDashboardRequest {
  name: string;
  description?: string;
  type: string;
  layout: DashboardLayout;
  widgets: Partial<Widget>[];
  filters?: DashboardFilter[];
  isPublic?: boolean;
}

export interface ExecuteQueryRequest {
  query?: string;
  queryId?: string;
  parameters?: Record<string, any>;
  format?: 'json' | 'csv' | 'excel';
  limit?: number;
  offset?: number;
}

export interface GenerateReportRequest {
  reportId?: string;
  templateId?: string;
  parameters?: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  distribution?: Distribution[];
}

export interface GetInsightsRequest {
  category?: string;
  severity?: string[];
  dateRange?: TimeRange;
  limit?: number;
  includeAcknowledged?: boolean;
}