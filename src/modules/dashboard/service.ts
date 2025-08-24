import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import {
  Dashboard,
  DashboardWidget,
  DashboardMetrics,
  MetricCard,
  Notification,
  Activity,
  Alert,
  Report,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  TrendData
} from './types';

// Dashboard Management
export const getDashboard = async (userId: string, dashboardId?: string): Promise<Dashboard> => {
  const cacheKey = `dashboard:${userId}:${dashboardId || 'default'}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  let dashboard;

  if (dashboardId) {
    // Get specific dashboard
    const result = await query(
      `SELECT d.*, 
              array_agg(DISTINCT dw.*) as widgets
       FROM dashboards d
       LEFT JOIN dashboard_widgets dw ON d.id = dw.dashboard_id
       WHERE d.id = $1 AND (d.owner = $2 OR d.is_public = true OR $2 = ANY(d.shared_with))
       GROUP BY d.id`,
      [dashboardId, userId]
    );

    if (!result.rows.length) {
      throw new AppError('Dashboard not found or access denied', 404);
    }

    dashboard = result.rows[0];
  } else {
    // Get default dashboard for user
    const result = await query(
      `SELECT d.*, 
              array_agg(DISTINCT dw.*) as widgets
       FROM dashboards d
       LEFT JOIN dashboard_widgets dw ON d.id = dw.dashboard_id
       WHERE d.is_default = true AND d.category = (
         SELECT department FROM users WHERE id = $1
       )
       GROUP BY d.id
       LIMIT 1`,
      [userId]
    );

    if (!result.rows.length) {
      // Create default dashboard
      dashboard = await createDefaultDashboard(userId);
    } else {
      dashboard = result.rows[0];
    }
  }

  // Update last accessed
  await query(
    'UPDATE dashboards SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = $1',
    [dashboard.id]
  );

  // Cache for 5 minutes
  await cache.set(cacheKey, dashboard, 300);

  return dashboard;
};

// Create Dashboard Widget
export const createWidget = async (
  request: CreateWidgetRequest & { createdBy: string }
): Promise<DashboardWidget> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check dashboard access
    const dashboardResult = await client.query(
      'SELECT * FROM dashboards WHERE id = $1 AND (owner = $2 OR $2 = ANY(shared_with))',
      [request.dashboardId, request.createdBy]
    );

    if (!dashboardResult.rows.length) {
      throw new AppError('Dashboard not found or access denied', 404);
    }

    // Create widget
    const widgetResult = await client.query(
      `INSERT INTO dashboard_widgets (
        dashboard_id, type, title, description, position, size,
        refresh_interval, data_source, visualization, filters,
        is_visible, is_resizable, is_draggable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        request.dashboardId, request.type, request.title, null,
        JSON.stringify(request.position || { x: 0, y: 0, z: 0 }),
        JSON.stringify(request.size || { width: 4, height: 3 }),
        30, JSON.stringify(request.dataSource),
        JSON.stringify(request.visualization || {}),
        JSON.stringify([]), true, true, true
      ]
    );

    const widget = widgetResult.rows[0];

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`dashboard:*:${request.dashboardId}`);

    logger.info(`Widget created: ${widget.id}`);
    return widget;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating widget:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get Dashboard Metrics
export const getDashboardMetrics = async (userId: string, timeRange?: string): Promise<DashboardMetrics> => {
  const cacheKey = `metrics:${userId}:${timeRange || 'today'}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Calculate date range
  const endDate = new Date();
  const startDate = getStartDate(timeRange || 'last_30_days');

  // Get overview metrics
  const overview = await getOverviewMetrics(startDate, endDate);
  
  // Get trends
  const trends = await getTrendData(startDate, endDate);
  
  // Get performance data
  const performance = await getPerformanceData(startDate, endDate);
  
  // Get recent alerts
  const alerts = await getRecentAlerts(userId);
  
  // Get recent activities
  const activities = await getRecentActivities(userId);

  const metrics: DashboardMetrics = {
    overview,
    trends,
    performance,
    alerts,
    activities
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, metrics, 300);

  return metrics;
};

// Notification Management
export const getNotifications = async (
  userId: string,
  options?: {
    unread?: boolean;
    category?: string;
    limit?: number;
  }
): Promise<Notification[]> => {
  let queryStr = `
    SELECT *
    FROM notifications
    WHERE user_id = $1 AND is_archived = false
  `;
  const params = [userId];
  let paramCount = 2;

  if (options?.unread) {
    queryStr += ' AND is_read = false';
  }

  if (options?.category) {
    queryStr += ` AND category = $${paramCount++}`;
    params.push(options.category);
  }

  queryStr += ' ORDER BY timestamp DESC';

  if (options?.limit) {
    queryStr += ` LIMIT $${paramCount++}`;
    params.push(options.limit);
  }

  const result = await query(queryStr, params);

  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    message: row.message,
    timestamp: row.timestamp,
    priority: row.priority,
    source: row.source,
    actionRequired: row.action_required,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
    metadata: row.metadata,
    isRead: row.is_read,
    isArchived: row.is_archived,
    expiresAt: row.expires_at
  }));
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  await query(
    `UPDATE notifications 
     SET is_read = true, read_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );

  // Clear cache
  await cache.del(`notifications:${userId}:unread`);
};

export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isArchived'>
): Promise<void> => {
  await query(
    `INSERT INTO notifications (
      user_id, type, category, title, message, priority,
      source, action_required, action_url, action_label,
      metadata, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      userId, notification.type, notification.category,
      notification.title, notification.message, notification.priority,
      notification.source, notification.actionRequired,
      notification.actionUrl, notification.actionLabel,
      JSON.stringify(notification.metadata), notification.expiresAt
    ]
  );

  // Send real-time notification
  await sendRealtimeNotification(userId, notification);

  // Clear cache
  await cache.del(`notifications:${userId}:*`);
};

// Alert Management
export const getAlerts = async (userId: string): Promise<Alert[]> => {
  const result = await query(
    `SELECT a.*
     FROM alerts a
     JOIN alert_recipients ar ON a.id = ar.alert_id
     WHERE a.is_active = true
       AND (ar.type = 'user' AND ar.value = $1
         OR ar.type = 'role' AND ar.value IN (
           SELECT r.name FROM roles r
           JOIN user_roles ur ON r.id = ur.role_id
           WHERE ur.user_id = $1
         ))
     ORDER BY a.severity DESC, a.last_triggered DESC`,
    [userId]
  );

  return result.rows;
};

export const triggerAlert = async (alertId: string): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get alert details
    const alertResult = await client.query(
      'SELECT * FROM alerts WHERE id = $1 AND is_active = true',
      [alertId]
    );

    if (!alertResult.rows.length) {
      throw new AppError('Alert not found or inactive', 404);
    }

    const alert = alertResult.rows[0];

    // Check frequency throttling
    if (alert.frequency.type === 'throttle') {
      const lastTriggered = alert.last_triggered;
      if (lastTriggered) {
        const throttlePeriod = alert.frequency.value * 60 * 1000; // Convert to ms
        if (Date.now() - lastTriggered.getTime() < throttlePeriod) {
          logger.info(`Alert ${alertId} throttled`);
          return;
        }
      }
    }

    // Get recipients
    const recipientsResult = await client.query(
      'SELECT * FROM alert_recipients WHERE alert_id = $1',
      [alertId]
    );

    // Send notifications to recipients
    for (const recipient of recipientsResult.rows) {
      await sendAlertNotification(alert, recipient);
    }

    // Execute actions
    const actionsResult = await client.query(
      'SELECT * FROM alert_actions WHERE alert_id = $1',
      [alertId]
    );

    for (const action of actionsResult.rows) {
      await executeAlertAction(action);
    }

    // Update alert
    await client.query(
      `UPDATE alerts 
       SET last_triggered = CURRENT_TIMESTAMP,
           trigger_count = trigger_count + 1
       WHERE id = $1`,
      [alertId]
    );

    // Create alert history
    await client.query(
      `INSERT INTO alert_history (
        alert_id, triggered_at, condition_met, recipients_notified
      ) VALUES ($1, $2, $3, $4)`,
      [alertId, new Date(), true, recipientsResult.rows.length]
    );

    await client.query('COMMIT');

    logger.info(`Alert triggered: ${alertId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error triggering alert:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Report Management
export const generateReport = async (
  reportId: string,
  parameters?: Record<string, any>
): Promise<any> => {
  const client = await getClient();
  
  try {
    // Get report configuration
    const reportResult = await client.query(
      'SELECT * FROM reports WHERE id = $1 AND is_active = true',
      [reportId]
    );

    if (!reportResult.rows.length) {
      throw new AppError('Report not found or inactive', 404);
    }

    const report = reportResult.rows[0];

    // Build and execute query
    const data = await executeReportQuery(report.data, parameters);

    // Format data based on report format
    const formattedData = await formatReportData(data, report.format, report.template);

    // Distribute report if configured
    if (report.distribution && report.distribution.length > 0) {
      await distributeReport(report, formattedData);
    }

    // Update report execution
    await client.query(
      `UPDATE reports 
       SET last_run = CURRENT_TIMESTAMP,
           next_run = $1
       WHERE id = $2`,
      [calculateNextRun(report.schedule), reportId]
    );

    // Create report history
    await client.query(
      `INSERT INTO report_history (
        report_id, generated_at, parameters, rows_count, file_size
      ) VALUES ($1, $2, $3, $4, $5)`,
      [reportId, new Date(), JSON.stringify(parameters), data.length, formattedData.size]
    );

    logger.info(`Report generated: ${reportId}`);
    return formattedData;

  } catch (error) {
    logger.error('Error generating report:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Helper functions
async function createDefaultDashboard(userId: string): Promise<Dashboard> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get user department
    const userResult = await client.query(
      'SELECT department FROM users WHERE id = $1',
      [userId]
    );

    const department = userResult.rows[0]?.department || 'general';

    // Create dashboard
    const dashboardResult = await client.query(
      `INSERT INTO dashboards (
        name, description, category, layout, theme,
        is_public, is_default, owner
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        'Default Dashboard',
        'Auto-generated default dashboard',
        department,
        JSON.stringify({ type: 'grid', columns: 12, gap: 16 }),
        JSON.stringify({}),
        false, true, userId
      ]
    );

    const dashboard = dashboardResult.rows[0];

    // Create default widgets based on department
    const defaultWidgets = getDefaultWidgets(department);
    
    for (const widget of defaultWidgets) {
      await client.query(
        `INSERT INTO dashboard_widgets (
          dashboard_id, type, title, position, size,
          data_source, visualization
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          dashboard.id, widget.type, widget.title,
          JSON.stringify(widget.position), JSON.stringify(widget.size),
          JSON.stringify(widget.dataSource), JSON.stringify(widget.visualization)
        ]
      );
    }

    await client.query('COMMIT');

    return dashboard;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function getDefaultWidgets(department: string): any[] {
  const commonWidgets = [
    {
      type: 'metric',
      title: 'Total Revenue',
      position: { x: 0, y: 0, z: 1 },
      size: { width: 3, height: 2 },
      dataSource: { type: 'api', endpoint: '/api/metrics/revenue' },
      visualization: {}
    },
    {
      type: 'metric',
      title: 'Active Orders',
      position: { x: 3, y: 0, z: 1 },
      size: { width: 3, height: 2 },
      dataSource: { type: 'api', endpoint: '/api/metrics/orders' },
      visualization: {}
    },
    {
      type: 'chart',
      title: 'Revenue Trend',
      position: { x: 0, y: 2, z: 1 },
      size: { width: 6, height: 4 },
      dataSource: { type: 'api', endpoint: '/api/trends/revenue' },
      visualization: { chartType: 'line' }
    },
    {
      type: 'list',
      title: 'Recent Activities',
      position: { x: 6, y: 0, z: 1 },
      size: { width: 6, height: 6 },
      dataSource: { type: 'api', endpoint: '/api/activities' },
      visualization: {}
    }
  ];

  // Add department-specific widgets
  switch (department) {
    case 'sales':
      commonWidgets.push({
        type: 'chart',
        title: 'Sales Pipeline',
        position: { x: 0, y: 6, z: 1 },
        size: { width: 12, height: 4 },
        dataSource: { type: 'api', endpoint: '/api/sales/pipeline' },
        visualization: { chartType: 'bar' }
      });
      break;
    case 'warehouse':
      commonWidgets.push({
        type: 'table',
        title: 'Low Stock Items',
        position: { x: 0, y: 6, z: 1 },
        size: { width: 12, height: 4 },
        dataSource: { type: 'api', endpoint: '/api/inventory/low-stock' },
        visualization: {}
      });
      break;
  }

  return commonWidgets;
}

function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'yesterday':
      return new Date(now.setDate(now.getDate() - 1));
    case 'last_7_days':
      return new Date(now.setDate(now.getDate() - 7));
    case 'last_30_days':
      return new Date(now.setDate(now.getDate() - 30));
    case 'last_90_days':
      return new Date(now.setDate(now.getDate() - 90));
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'last_month':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case 'this_year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

async function getOverviewMetrics(startDate: Date, endDate: Date): Promise<any> {
  const metrics = await query(
    `SELECT 
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_date BETWEEN $1 AND $2) as total_revenue,
      (SELECT COUNT(*) FROM orders WHERE order_date BETWEEN $1 AND $2) as total_orders,
      (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE order_date BETWEEN $1 AND $2) as active_customers,
      (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory) as inventory_value,
      (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
      (SELECT AVG(health_score) FROM system_health WHERE checked_at BETWEEN $1 AND $2) as system_health`,
    [startDate, endDate]
  );

  return {
    totalRevenue: parseFloat(metrics.rows[0].total_revenue) || 0,
    totalOrders: parseInt(metrics.rows[0].total_orders) || 0,
    activeCustomers: parseInt(metrics.rows[0].active_customers) || 0,
    inventoryValue: parseFloat(metrics.rows[0].inventory_value) || 0,
    pendingTasks: parseInt(metrics.rows[0].pending_tasks) || 0,
    systemHealth: parseFloat(metrics.rows[0].system_health) || 100
  };
}

async function getTrendData(startDate: Date, endDate: Date): Promise<any> {
  // Revenue trend
  const revenueResult = await query(
    `SELECT DATE(order_date) as date, SUM(total_amount) as value
     FROM orders
     WHERE order_date BETWEEN $1 AND $2
     GROUP BY DATE(order_date)
     ORDER BY date`,
    [startDate, endDate]
  );

  // Orders trend
  const ordersResult = await query(
    `SELECT DATE(order_date) as date, COUNT(*) as value
     FROM orders
     WHERE order_date BETWEEN $1 AND $2
     GROUP BY DATE(order_date)
     ORDER BY date`,
    [startDate, endDate]
  );

  // Customers trend
  const customersResult = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as value
     FROM customers
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [startDate, endDate]
  );

  return {
    revenueTrend: revenueResult.rows,
    ordersTrend: ordersResult.rows,
    customersTrend: customersResult.rows
  };
}

async function getPerformanceData(startDate: Date, endDate: Date): Promise<any> {
  // Top products
  const topProductsResult = await query(
    `SELECT p.product_name, SUM(oi.quantity) as sales_count, SUM(oi.line_total) as revenue
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.order_date BETWEEN $1 AND $2
     GROUP BY p.id, p.product_name
     ORDER BY revenue DESC
     LIMIT 10`,
    [startDate, endDate]
  );

  // Top customers
  const topCustomersResult = await query(
    `SELECT c.customer_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
     FROM customers c
     JOIN orders o ON c.id = o.customer_id
     WHERE o.order_date BETWEEN $1 AND $2
     GROUP BY c.id, c.customer_name
     ORDER BY total_spent DESC
     LIMIT 10`,
    [startDate, endDate]
  );

  // Low stock items
  const lowStockResult = await query(
    `SELECT item_name, quantity, reorder_point
     FROM inventory
     WHERE quantity <= reorder_point
     ORDER BY quantity ASC
     LIMIT 10`
  );

  // Overdue payments
  const overdueResult = await query(
    `SELECT i.invoice_no, c.customer_name, i.total_amount, i.due_date
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     WHERE i.status = 'overdue' AND i.due_date < CURRENT_DATE
     ORDER BY i.due_date ASC
     LIMIT 10`
  );

  return {
    topProducts: topProductsResult.rows,
    topCustomers: topCustomersResult.rows,
    lowStock: lowStockResult.rows,
    overduePayments: overdueResult.rows
  };
}

async function getRecentAlerts(userId: string): Promise<Alert[]> {
  const result = await query(
    `SELECT a.*
     FROM alerts a
     JOIN alert_recipients ar ON a.id = ar.alert_id
     WHERE a.is_active = true
       AND ar.value = $1
       AND a.last_triggered >= NOW() - INTERVAL '24 hours'
     ORDER BY a.last_triggered DESC
     LIMIT 10`,
    [userId]
  );

  return result.rows;
}

async function getRecentActivities(userId: string): Promise<Activity[]> {
  const result = await query(
    `SELECT al.*,
            u.username as user_name,
            u.avatar as user_avatar
     FROM activity_logs al
     JOIN users u ON al.user_id = u.id
     WHERE al.timestamp >= NOW() - INTERVAL '24 hours'
     ORDER BY al.timestamp DESC
     LIMIT 20`
  );

  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    action: row.action,
    target: row.target,
    targetType: row.target_type,
    targetId: row.target_id,
    description: row.description || `${row.user_name} ${row.action} ${row.target}`,
    timestamp: row.timestamp,
    ipAddress: row.ip_address,
    deviceInfo: row.device_info,
    result: row.result,
    duration: row.duration,
    metadata: row.metadata
  }));
}

async function sendRealtimeNotification(userId: string, notification: any): Promise<void> {
  // Implementation for real-time notification via WebSocket/SSE
  logger.info(`Real-time notification sent to user ${userId}`);
}

async function sendAlertNotification(alert: any, recipient: any): Promise<void> {
  // Implementation for sending alert notifications
  logger.info(`Alert notification sent: ${alert.id} to ${recipient.value}`);
}

async function executeAlertAction(action: any): Promise<void> {
  // Implementation for executing alert actions
  logger.info(`Alert action executed: ${action.type}`);
}

async function executeReportQuery(dataConfig: any, parameters?: Record<string, any>): Promise<any[]> {
  // Implementation for executing report queries
  return [];
}

async function formatReportData(data: any[], format: string, template?: string): Promise<any> {
  // Implementation for formatting report data
  return { data, format, size: JSON.stringify(data).length };
}

async function distributeReport(report: any, data: any): Promise<void> {
  // Implementation for distributing reports
  logger.info(`Report distributed: ${report.id}`);
}

function calculateNextRun(schedule: any): Date | null {
  if (!schedule) return null;
  
  const now = new Date();
  switch (schedule.frequency) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1));
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7));
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    default:
      return null;
  }
}