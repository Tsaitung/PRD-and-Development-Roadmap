import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import {
  WorkOrder,
  ProductionTask,
  CreateWorkOrderRequest,
  UpdateTaskStatusRequest,
  ProductionMetrics,
  WorkstationMetricsQuery,
  ProductionDashboard
} from './types';

export const createWorkOrder = async (
  request: CreateWorkOrderRequest & { createdBy: string }
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Generate work order number
    const workOrderNo = `WO-${Date.now()}`;

    // Create work order
    const woResult = await client.query(
      `INSERT INTO work_orders 
       (work_order_no, item_id, planned_quantity, unit_id,
        planned_start, planned_end, priority, status,
        quality_check_required, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        workOrderNo,
        request.itemId,
        request.plannedQuantity,
        request.unitId,
        request.plannedStart,
        request.plannedEnd,
        request.priority || 0,
        'pending',
        request.qualityCheckRequired || false,
        request.createdBy
      ]
    );

    const workOrder = woResult.rows[0];

    // Auto-generate production tasks based on item routing
    const routingResult = await client.query(
      `SELECT * FROM item_routings 
       WHERE item_id = $1 
       ORDER BY sequence`,
      [request.itemId]
    );

    if (routingResult.rows.length > 0) {
      for (const routing of routingResult.rows) {
        const taskNo = `TSK-${workOrderNo}-${routing.sequence}`;
        
        await client.query(
          `INSERT INTO production_tasks 
           (task_no, work_order_id, workstation_id, 
            planned_quantity, planned_start, planned_end, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            taskNo,
            workOrder.id,
            routing.workstation_id,
            request.plannedQuantity,
            routing.sequence === 1 ? request.plannedStart : null,
            routing.sequence === routingResult.rows.length ? request.plannedEnd : null,
            'pending'
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Get complete work order with tasks
    const completeWO = await getWorkOrderWithTasks(workOrder.id);
    
    // Clear dashboard cache
    await cache.del('production:dashboard');
    
    return completeWO;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getWorkOrderWithTasks = async (workOrderId: string) => {
  const woResult = await query(
    `SELECT 
      wo.*,
      i.item_code,
      i.item_name,
      u.unit_name
     FROM work_orders wo
     JOIN items i ON wo.item_id = i.id
     JOIN units u ON wo.unit_id = u.id
     WHERE wo.id = $1`,
    [workOrderId]
  );

  if (woResult.rows.length === 0) {
    throw new AppError('Work order not found', 404);
  }

  const tasksResult = await query(
    `SELECT 
      pt.*,
      ws.station_name,
      ws.station_type
     FROM production_tasks pt
     JOIN workstations ws ON pt.workstation_id = ws.id
     WHERE pt.work_order_id = $1
     ORDER BY pt.planned_start`,
    [workOrderId]
  );

  return {
    ...woResult.rows[0],
    tasks: tasksResult.rows
  };
};

export const updateTaskStatus = async (
  taskId: string,
  request: UpdateTaskStatusRequest & { updatedBy: string }
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get current task with lock
    const taskResult = await client.query(
      `SELECT * FROM production_tasks 
       WHERE id = $1 FOR UPDATE`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new AppError('Production task not found', 404);
    }

    const task = taskResult.rows[0];

    // Validate status transition
    if (!isValidStatusTransition(task.status, request.status)) {
      throw new AppError(
        `Invalid status transition from ${task.status} to ${request.status}`,
        400
      );
    }

    // Update task
    const updateFields = ['status = $1'];
    const updateParams = [request.status];
    let paramCount = 1;

    if (request.status === 'in_progress' && !task.actual_start) {
      paramCount++;
      updateFields.push(`actual_start = $${paramCount}`);
      updateParams.push(new Date());
    }

    if (request.status === 'completed') {
      paramCount++;
      updateFields.push(`actual_end = $${paramCount}`);
      updateParams.push(new Date());
      
      if (request.completedQuantity !== undefined) {
        paramCount++;
        updateFields.push(`completed_quantity = $${paramCount}`);
        updateParams.push(request.completedQuantity);
      }
      
      if (request.defectQuantity !== undefined) {
        paramCount++;
        updateFields.push(`defect_quantity = $${paramCount}`);
        updateParams.push(request.defectQuantity);
      }
    }

    if (request.notes) {
      paramCount++;
      updateFields.push(`quality_notes = $${paramCount}`);
      updateParams.push(request.notes);
    }

    paramCount++;
    updateParams.push(taskId);

    await client.query(
      `UPDATE production_tasks 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}`,
      updateParams
    );

    // Update work order progress
    if (request.status === 'completed') {
      await updateWorkOrderProgress(client, task.work_order_id);
    }

    // Log operator assignments
    if (request.operatorIds && request.operatorIds.length > 0) {
      for (const operatorId of request.operatorIds) {
        await client.query(
          `INSERT INTO task_operators 
           (task_id, operator_id, assigned_at, assigned_by)
           VALUES ($1, $2, NOW(), $3)
           ON CONFLICT (task_id, operator_id) DO NOTHING`,
          [taskId, operatorId, request.updatedBy]
        );
      }
    }

    await client.query('COMMIT');

    // Get updated task
    const updatedTask = await query(
      `SELECT 
        pt.*,
        ws.station_name,
        array_agg(
          json_build_object(
            'id', o.id,
            'name', o.full_name
          )
        ) FILTER (WHERE o.id IS NOT NULL) as operators
       FROM production_tasks pt
       JOIN workstations ws ON pt.workstation_id = ws.id
       LEFT JOIN task_operators tao ON pt.id = tao.task_id
       LEFT JOIN users o ON tao.operator_id = o.id
       WHERE pt.id = $1
       GROUP BY pt.id, ws.station_name`,
      [taskId]
    );

    return updatedTask.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getWorkstationMetrics = async (
  query: WorkstationMetricsQuery
): Promise<ProductionMetrics[]> => {
  let whereConditions = ['1=1'];
  const params: any[] = [];

  if (query.workstationId) {
    params.push(query.workstationId);
    whereConditions.push(`pt.workstation_id = $${params.length}`);
  }

  params.push(query.dateFrom, query.dateTo);
  whereConditions.push(
    `pt.actual_start >= $${params.length - 1} AND pt.actual_end <= $${params.length}`
  );

  const whereClause = whereConditions.join(' AND ');

  const metricsQuery = `
    WITH task_metrics AS (
      SELECT 
        pt.workstation_id,
        DATE(pt.actual_start) as production_date,
        SUM(pt.completed_quantity) as total_output,
        SUM(pt.defect_quantity) as total_defects,
        COUNT(*) as task_count,
        AVG(
          EXTRACT(EPOCH FROM (pt.actual_end - pt.actual_start)) / 3600
        ) as avg_cycle_time,
        SUM(
          CASE 
            WHEN pt.status = 'completed' THEN pt.completed_quantity 
            ELSE 0 
          END
        ) as good_output
      FROM production_tasks pt
      WHERE ${whereClause}
      GROUP BY pt.workstation_id, DATE(pt.actual_start)
    ),
    downtime_metrics AS (
      SELECT 
        workstation_id,
        DATE(downtime_start) as production_date,
        SUM(
          EXTRACT(EPOCH FROM (downtime_end - downtime_start)) / 60
        ) as downtime_minutes
      FROM workstation_downtime
      WHERE downtime_start >= $${params.length - 1} 
        AND downtime_end <= $${params.length}
      GROUP BY workstation_id, DATE(downtime_start)
    )
    SELECT 
      tm.workstation_id,
      tm.production_date as date,
      tm.total_output,
      COALESCE(tm.total_defects, 0) as defect_quantity,
      CASE 
        WHEN tm.total_output > 0 
        THEN (tm.total_defects::float / tm.total_output) * 100
        ELSE 0
      END as defect_rate,
      COALESCE(dm.downtime_minutes, 0) as downtime_minutes,
      ws.hourly_capacity,
      CASE
        WHEN ws.hourly_capacity > 0 
        THEN (tm.total_output::float / (ws.hourly_capacity * 8)) * 100
        ELSE 0
      END as efficiency,
      -- OEE Calculation
      CASE
        WHEN tm.total_output > 0 THEN
          ((tm.good_output::float / tm.total_output) * -- Quality
           (tm.total_output::float / (ws.hourly_capacity * 8)) * -- Performance
           ((480 - COALESCE(dm.downtime_minutes, 0))::float / 480)) * 100 -- Availability
        ELSE 0
      END as oee
    FROM task_metrics tm
    JOIN workstations ws ON tm.workstation_id = ws.id
    LEFT JOIN downtime_metrics dm 
      ON tm.workstation_id = dm.workstation_id 
      AND tm.production_date = dm.production_date
    ORDER BY tm.production_date, tm.workstation_id`;

  const result = await query(metricsQuery, params);
  
  return result.rows.map(row => ({
    workstationId: row.workstation_id,
    date: row.date,
    totalOutput: parseInt(row.total_output),
    defectRate: parseFloat(row.defect_rate),
    efficiency: parseFloat(row.efficiency),
    downtimeMinutes: parseInt(row.downtime_minutes),
    oee: parseFloat(row.oee),
    qualityRate: row.total_output > 0 
      ? ((row.total_output - row.defect_quantity) / row.total_output) * 100 
      : 0,
    performanceRate: parseFloat(row.efficiency),
    availabilityRate: ((480 - row.downtime_minutes) / 480) * 100
  }));
};

export const getProductionDashboard = async (): Promise<ProductionDashboard> => {
  // Try to get from cache
  const cached = await cache.get('production:dashboard');
  if (cached) {
    return cached;
  }

  // Get summary statistics
  const summaryQuery = `
    SELECT 
      COUNT(*) FILTER (WHERE status IN ('in_progress', 'scheduled')) as active_work_orders,
      COUNT(*) FILTER (
        WHERE status = 'completed' 
        AND DATE(actual_end) = CURRENT_DATE
      ) as completed_today,
      (
        SELECT COUNT(*) 
        FROM production_tasks 
        WHERE status = 'in_progress'
      ) as in_progress_tasks,
      (
        SELECT AVG(completed_quantity::float / planned_quantity) * 100
        FROM work_orders 
        WHERE status = 'completed' 
        AND actual_end >= CURRENT_DATE - INTERVAL '7 days'
      ) as average_efficiency,
      (
        SELECT AVG(defect_quantity::float / NULLIF(completed_quantity, 0)) * 100
        FROM production_tasks
        WHERE status = 'completed'
        AND actual_end >= CURRENT_DATE - INTERVAL '7 days'
      ) as defect_rate
    FROM work_orders`;

  const summaryResult = await query(summaryQuery);

  // Get workstation status
  const workstationsQuery = `
    SELECT 
      ws.id,
      ws.station_code,
      ws.station_name,
      ws.status,
      COUNT(pt.id) FILTER (WHERE pt.status = 'in_progress') as active_tasks,
      ws.hourly_capacity,
      COALESCE(
        AVG(pt.completed_quantity::float / NULLIF(pt.planned_quantity, 0)) * 100,
        0
      ) as efficiency
    FROM workstations ws
    LEFT JOIN production_tasks pt 
      ON ws.id = pt.workstation_id 
      AND pt.actual_start >= CURRENT_DATE - INTERVAL '7 days'
    WHERE ws.status != 'inactive'
    GROUP BY ws.id
    ORDER BY ws.station_code`;

  const workstationsResult = await query(workstationsQuery);

  // Get recent work orders
  const recentWOQuery = `
    SELECT 
      wo.*,
      i.item_code,
      i.item_name
    FROM work_orders wo
    JOIN items i ON wo.item_id = i.id
    ORDER BY wo.created_at DESC
    LIMIT 10`;

  const recentWOResult = await query(recentWOQuery);

  // Generate alerts
  const alerts = [];
  
  // Check for delayed work orders
  const delayedWOs = await query(
    `SELECT work_order_no, planned_end 
     FROM work_orders 
     WHERE status = 'in_progress' 
     AND planned_end < NOW()`
  );
  
  for (const wo of delayedWOs.rows) {
    alerts.push({
      type: 'delay' as const,
      message: `Work order ${wo.work_order_no} is delayed`,
      severity: 'high' as const,
      timestamp: new Date()
    });
  }

  // Check for high defect rates
  const highDefectTasks = await query(
    `SELECT 
      pt.task_no,
      ws.station_name,
      (pt.defect_quantity::float / NULLIF(pt.completed_quantity, 0)) * 100 as defect_rate
     FROM production_tasks pt
     JOIN workstations ws ON pt.workstation_id = ws.id
     WHERE pt.status = 'completed'
     AND pt.actual_end >= CURRENT_DATE
     AND pt.defect_quantity > 0
     AND (pt.defect_quantity::float / NULLIF(pt.completed_quantity, 0)) > 0.05`
  );

  for (const task of highDefectTasks.rows) {
    alerts.push({
      type: 'quality' as const,
      message: `High defect rate (${task.defect_rate.toFixed(1)}%) at ${task.station_name}`,
      severity: 'medium' as const,
      timestamp: new Date()
    });
  }

  const dashboard: ProductionDashboard = {
    summary: {
      activeWorkOrders: parseInt(summaryResult.rows[0].active_work_orders),
      completedToday: parseInt(summaryResult.rows[0].completed_today),
      inProgressTasks: parseInt(summaryResult.rows[0].in_progress_tasks),
      averageEfficiency: parseFloat(summaryResult.rows[0].average_efficiency) || 0,
      defectRate: parseFloat(summaryResult.rows[0].defect_rate) || 0
    },
    workstations: workstationsResult.rows.map(ws => ({
      id: ws.id,
      name: ws.station_name,
      status: ws.status,
      currentLoad: parseInt(ws.active_tasks),
      efficiency: parseFloat(ws.efficiency) || 0
    })),
    recentWorkOrders: recentWOResult.rows,
    alerts
  };

  // Cache for 5 minutes
  await cache.set('production:dashboard', dashboard, 300);

  return dashboard;
};

// Helper functions
function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const transitions: Record<string, string[]> = {
    'pending': ['scheduled', 'ready', 'cancelled'],
    'scheduled': ['ready', 'in_progress', 'cancelled'],
    'ready': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'paused', 'cancelled'],
    'paused': ['in_progress', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  return transitions[currentStatus]?.includes(newStatus) || false;
}

async function updateWorkOrderProgress(client: any, workOrderId: string) {
  // Calculate total completed quantity
  const progressResult = await client.query(
    `SELECT 
      SUM(completed_quantity) as total_completed,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
     FROM production_tasks
     WHERE work_order_id = $1`,
    [workOrderId]
  );

  const progress = progressResult.rows[0];

  // Update work order
  let woStatus = 'in_progress';
  if (progress.completed_tasks === progress.total_tasks) {
    woStatus = 'completed';
  }

  await client.query(
    `UPDATE work_orders 
     SET completed_quantity = $1,
         status = $2,
         actual_end = CASE WHEN $2 = 'completed' THEN NOW() ELSE actual_end END,
         updated_at = NOW()
     WHERE id = $3`,
    [progress.total_completed || 0, woStatus, workOrderId]
  );
}