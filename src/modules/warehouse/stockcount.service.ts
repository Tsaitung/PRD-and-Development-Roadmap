import { query, getClient } from '../../database/connection';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

export interface StockCountSession {
  id: string;
  sessionCode: string;
  warehouseId: string;
  countType: 'full' | 'cycle' | 'spot';
  status: 'planned' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  plannedDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  items?: StockCountItem[];
}

export interface StockCountItem {
  id: string;
  sessionId: string;
  itemId: string;
  systemQty: number;
  countedQty?: number;
  variance?: number;
  variancePercent?: number;
  countedBy?: string;
  countedAt?: Date;
  notes?: string;
  status: 'pending' | 'counted' | 'verified' | 'adjusted';
}

export interface StockCountRequest {
  warehouseId: string;
  countType: 'full' | 'cycle' | 'spot';
  itemIds?: string[];
  plannedDate?: Date;
  notes?: string;
  createdBy: string;
}

export const createStockCountSession = async (request: StockCountRequest) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create counting session
    const sessionCode = `CNT-${Date.now()}`;
    const sessionResult = await client.query(
      `INSERT INTO stock_count_sessions 
       (session_code, warehouse_id, count_type, status, planned_date, 
        notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        sessionCode,
        request.warehouseId,
        request.countType,
        'planned',
        request.plannedDate || new Date(),
        request.notes,
        request.createdBy
      ]
    );

    const session = sessionResult.rows[0];

    // Determine items to count
    let itemsQuery: string;
    let itemsParams: any[];

    if (request.countType === 'full') {
      // Count all items in warehouse
      itemsQuery = `
        SELECT DISTINCT item_id, quantity
        FROM inventory_snapshots
        WHERE warehouse_id = $1
      `;
      itemsParams = [request.warehouseId];
    } else if (request.itemIds && request.itemIds.length > 0) {
      // Count specific items
      itemsQuery = `
        SELECT item_id, quantity
        FROM inventory_snapshots
        WHERE warehouse_id = $1 AND item_id = ANY($2)
      `;
      itemsParams = [request.warehouseId, request.itemIds];
    } else {
      // Cycle count - select random items or high-value items
      itemsQuery = `
        SELECT item_id, quantity
        FROM inventory_snapshots
        WHERE warehouse_id = $1
        ORDER BY total_value DESC NULLS LAST, RANDOM()
        LIMIT 20
      `;
      itemsParams = [request.warehouseId];
    }

    const itemsResult = await client.query(itemsQuery, itemsParams);

    // Create count items
    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO stock_count_items 
         (session_id, item_id, system_qty, status)
         VALUES ($1, $2, $3, $4)`,
        [session.id, item.item_id, item.quantity, 'pending']
      );
    }

    await client.query('COMMIT');

    // Get complete session with items
    const fullSession = await getStockCountSession(session.id);
    
    return fullSession;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const startStockCount = async (sessionId: string) => {
  const result = await query(
    `UPDATE stock_count_sessions 
     SET status = 'in_progress', 
         started_at = NOW()
     WHERE id = $1 AND status = 'planned'
     RETURNING *`,
    [sessionId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Session not found or already started', 404);
  }

  return result.rows[0];
};

export const submitItemCount = async (
  sessionId: string,
  itemId: string,
  countedQty: number,
  countedBy: string,
  notes?: string
) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Update count item
    const updateResult = await client.query(
      `UPDATE stock_count_items 
       SET counted_qty = $1,
           variance = $1 - system_qty,
           variance_percent = CASE 
             WHEN system_qty > 0 THEN ((($1 - system_qty) / system_qty) * 100)
             ELSE NULL
           END,
           counted_by = $2,
           counted_at = NOW(),
           notes = $3,
           status = 'counted'
       WHERE session_id = $4 AND item_id = $5
       RETURNING *`,
      [countedQty, countedBy, notes, sessionId, itemId]
    );

    if (updateResult.rows.length === 0) {
      throw new AppError('Count item not found', 404);
    }

    // Check if all items are counted
    const pendingResult = await client.query(
      `SELECT COUNT(*) as pending
       FROM stock_count_items
       WHERE session_id = $1 AND status = 'pending'`,
      [sessionId]
    );

    if (parseInt(pendingResult.rows[0].pending) === 0) {
      // All items counted, move to review
      await client.query(
        `UPDATE stock_count_sessions 
         SET status = 'review'
         WHERE id = $1`,
        [sessionId]
      );
    }

    await client.query('COMMIT');

    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getStockCountSession = async (sessionId: string) => {
  const sessionResult = await query(
    `SELECT s.*, u.full_name as created_by_name
     FROM stock_count_sessions s
     LEFT JOIN users u ON s.created_by = u.id
     WHERE s.id = $1`,
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Stock count session not found', 404);
  }

  const itemsResult = await query(
    `SELECT 
      sci.*,
      i.item_code,
      i.item_name,
      u.full_name as counted_by_name
     FROM stock_count_items sci
     JOIN items i ON sci.item_id = i.id
     LEFT JOIN users u ON sci.counted_by = u.id
     WHERE sci.session_id = $1
     ORDER BY i.item_code`,
    [sessionId]
  );

  return {
    ...sessionResult.rows[0],
    items: itemsResult.rows
  };
};

export const getVarianceReport = async (sessionId: string) => {
  const result = await query(
    `SELECT 
      sci.*,
      i.item_code,
      i.item_name,
      i.specification,
      ic.amount as unit_cost,
      (sci.variance * ic.amount) as variance_value
     FROM stock_count_items sci
     JOIN items i ON sci.item_id = i.id
     LEFT JOIN item_costs ic ON i.id = ic.item_id 
       AND ic.is_active = true
       AND ic.cost_type = 'standard'
     WHERE sci.session_id = $1 
       AND sci.variance != 0
     ORDER BY ABS(sci.variance * COALESCE(ic.amount, 0)) DESC`,
    [sessionId]
  );

  const summary = await query(
    `SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN variance != 0 THEN 1 END) as items_with_variance,
      SUM(system_qty) as total_system_qty,
      SUM(counted_qty) as total_counted_qty,
      SUM(CASE WHEN variance > 0 THEN variance ELSE 0 END) as total_surplus,
      SUM(CASE WHEN variance < 0 THEN ABS(variance) ELSE 0 END) as total_shortage,
      AVG(ABS(variance_percent)) as avg_variance_percent
     FROM stock_count_items
     WHERE session_id = $1`,
    [sessionId]
  );

  return {
    items: result.rows,
    summary: summary.rows[0]
  };
};

export const approveAndAdjust = async (
  sessionId: string,
  approvedBy: string,
  adjustItems: boolean = true
) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get session details
    const sessionResult = await client.query(
      `SELECT * FROM stock_count_sessions 
       WHERE id = $1 AND status = 'review'
       FOR UPDATE`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('Session not found or not ready for approval', 404);
    }

    const session = sessionResult.rows[0];

    if (adjustItems) {
      // Get all items with variance
      const itemsResult = await client.query(
        `SELECT * FROM stock_count_items 
         WHERE session_id = $1 AND variance != 0`,
        [sessionId]
      );

      // Adjust inventory for each item
      for (const item of itemsResult.rows) {
        // Update inventory snapshot
        await client.query(
          `UPDATE inventory_snapshots 
           SET quantity = $1,
               available_qty = available_qty + $2,
               last_counted_at = NOW(),
               updated_at = NOW()
           WHERE warehouse_id = $3 AND item_id = $4`,
          [
            item.counted_qty,
            item.variance,
            session.warehouse_id,
            item.item_id
          ]
        );

        // Create adjustment transaction
        await client.query(
          `INSERT INTO inventory_transactions 
           (transaction_no, transaction_type, warehouse_id, item_id,
            quantity, reference_type, reference_id, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            `ADJ-${sessionId}-${item.item_id}`,
            'adjust',
            session.warehouse_id,
            item.item_id,
            item.variance,
            'stock_count',
            sessionId,
            `Stock count adjustment: ${item.notes || 'No notes'}`,
            approvedBy
          ]
        );

        // Update count item status
        await client.query(
          `UPDATE stock_count_items 
           SET status = 'adjusted'
           WHERE session_id = $1 AND item_id = $2`,
          [sessionId, item.item_id]
        );
      }
    }

    // Complete the session
    await client.query(
      `UPDATE stock_count_sessions 
       SET status = 'completed',
           completed_at = NOW(),
           approved_by = $2
       WHERE id = $1`,
      [sessionId, approvedBy]
    );

    await client.query('COMMIT');

    logger.info({
      message: 'Stock count session completed',
      sessionId,
      approvedBy,
      adjusted: adjustItems
    });

    return {
      success: true,
      sessionId,
      status: 'completed',
      adjustmentsApplied: adjustItems
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getStockCountHistory = async (
  warehouseId: string,
  limit: number = 10
) => {
  const result = await query(
    `SELECT 
      s.*,
      u.full_name as created_by_name,
      (SELECT COUNT(*) FROM stock_count_items WHERE session_id = s.id) as item_count,
      (SELECT COUNT(*) FROM stock_count_items 
       WHERE session_id = s.id AND variance != 0) as variance_count
     FROM stock_count_sessions s
     LEFT JOIN users u ON s.created_by = u.id
     WHERE s.warehouse_id = $1
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [warehouseId, limit]
  );

  return result.rows;
};