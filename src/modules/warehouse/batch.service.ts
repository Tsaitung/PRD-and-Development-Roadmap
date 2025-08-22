import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

export interface BatchCreateRequest {
  batchNo: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  productionDate?: Date;
  expiryDate?: Date;
  supplierId?: string;
  supplierBatchNo?: string;
  qualityGrade?: string;
  location?: string;
}

export interface BatchTransferRequest {
  batchId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
  createdBy: string;
}

export const createBatch = async (request: BatchCreateRequest) => {
  // Check if batch number already exists
  const existingBatch = await query(
    'SELECT id FROM inventory_batches WHERE batch_no = $1',
    [request.batchNo]
  );

  if (existingBatch.rows.length > 0) {
    throw new AppError('Batch number already exists', 400);
  }

  const result = await query(
    `INSERT INTO inventory_batches 
     (batch_no, item_id, warehouse_id, quantity, production_date, 
      expiry_date, supplier_id, supplier_batch_no, quality_grade, 
      location, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      request.batchNo,
      request.itemId,
      request.warehouseId,
      request.quantity,
      request.productionDate,
      request.expiryDate,
      request.supplierId,
      request.supplierBatchNo,
      request.qualityGrade,
      request.location,
      'available'
    ]
  );

  // Update inventory snapshot
  await updateInventoryForBatch(
    request.warehouseId,
    request.itemId,
    request.quantity,
    'increase'
  );

  return result.rows[0];
};

export const getBatchesByItem = async (
  itemId: string,
  warehouseId?: string,
  includeExpired: boolean = false
) => {
  let whereConditions = ['b.item_id = $1'];
  const params: any[] = [itemId];

  if (warehouseId) {
    params.push(warehouseId);
    whereConditions.push(`b.warehouse_id = $${params.length}`);
  }

  if (!includeExpired) {
    whereConditions.push(
      `(b.expiry_date IS NULL OR b.expiry_date > NOW())`
    );
  }

  const whereClause = whereConditions.join(' AND ');

  const result = await query(
    `SELECT 
      b.*,
      i.item_code,
      i.item_name,
      w.warehouse_code,
      w.warehouse_name,
      CASE 
        WHEN b.expiry_date IS NOT NULL THEN 
          DATE_PART('day', b.expiry_date - NOW())
        ELSE NULL
      END as days_until_expiry
    FROM inventory_batches b
    JOIN items i ON b.item_id = i.id
    JOIN warehouses w ON b.warehouse_id = w.id
    WHERE ${whereClause}
    ORDER BY b.expiry_date ASC NULLS LAST, b.created_at ASC`,
    params
  );

  return result.rows;
};

export const transferBatch = async (request: BatchTransferRequest) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get batch details with lock
    const batchResult = await client.query(
      `SELECT * FROM inventory_batches 
       WHERE id = $1 AND warehouse_id = $2 FOR UPDATE`,
      [request.batchId, request.fromWarehouseId]
    );

    if (batchResult.rows.length === 0) {
      throw new AppError('Batch not found in source warehouse', 404);
    }

    const batch = batchResult.rows[0];

    if (batch.quantity < request.quantity) {
      throw new AppError('Insufficient batch quantity', 400);
    }

    if (batch.status !== 'available') {
      throw new AppError(`Batch is ${batch.status}, cannot transfer`, 400);
    }

    if (batch.quantity === request.quantity) {
      // Transfer entire batch
      await client.query(
        `UPDATE inventory_batches 
         SET warehouse_id = $1, location = NULL, updated_at = NOW()
         WHERE id = $2`,
        [request.toWarehouseId, request.batchId]
      );
    } else {
      // Split batch
      await client.query(
        `UPDATE inventory_batches 
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE id = $2`,
        [request.quantity, request.batchId]
      );

      // Create new batch in destination
      await client.query(
        `INSERT INTO inventory_batches 
         (batch_no, item_id, warehouse_id, quantity, production_date,
          expiry_date, supplier_id, supplier_batch_no, quality_grade, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          `${batch.batch_no}-T${Date.now()}`,
          batch.item_id,
          request.toWarehouseId,
          request.quantity,
          batch.production_date,
          batch.expiry_date,
          batch.supplier_id,
          batch.supplier_batch_no,
          batch.quality_grade,
          'available'
        ]
      );
    }

    // Update inventory snapshots
    await updateInventoryForBatch(
      request.fromWarehouseId,
      batch.item_id,
      request.quantity,
      'decrease'
    );

    await updateInventoryForBatch(
      request.toWarehouseId,
      batch.item_id,
      request.quantity,
      'increase'
    );

    // Create transfer record
    const transferNo = `BTF-${Date.now()}`;
    await client.query(
      `INSERT INTO inventory_transactions 
       (transaction_no, transaction_type, warehouse_id, item_id,
        batch_id, quantity, reference_type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        transferNo,
        'transfer',
        request.fromWarehouseId,
        batch.item_id,
        request.batchId,
        -request.quantity,
        'batch_transfer',
        request.notes,
        request.createdBy
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      transferNo,
      quantity: request.quantity
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const quarantineBatch = async (
  batchId: string,
  reason: string,
  userId: string
) => {
  const result = await query(
    `UPDATE inventory_batches 
     SET status = 'quarantine', 
         updated_at = NOW(),
         notes = $2
     WHERE id = $1 AND status = 'available'
     RETURNING *`,
    [batchId, reason]
  );

  if (result.rows.length === 0) {
    throw new AppError('Batch not found or already quarantined', 404);
  }

  // Log the quarantine action
  await query(
    `INSERT INTO system_logs 
     (log_level, module, action, message, details, user_id)
     VALUES ('warn', 'warehouse', 'batch_quarantine', $1, $2, $3)`,
    [
      `Batch ${result.rows[0].batch_no} quarantined`,
      JSON.stringify({ batchId, reason }),
      userId
    ]
  );

  return result.rows[0];
};

async function updateInventoryForBatch(
  warehouseId: string,
  itemId: string,
  quantity: number,
  operation: 'increase' | 'decrease'
) {
  const operator = operation === 'increase' ? '+' : '-';
  
  const result = await query(
    `UPDATE inventory_snapshots 
     SET quantity = quantity ${operator} $1,
         available_qty = available_qty ${operator} $1,
         updated_at = NOW()
     WHERE warehouse_id = $2 AND item_id = $3
     RETURNING *`,
    [quantity, warehouseId, itemId]
  );

  if (result.rows.length === 0 && operation === 'increase') {
    // Create new inventory record if doesn't exist
    await query(
      `INSERT INTO inventory_snapshots 
       (warehouse_id, item_id, quantity, available_qty, reserved_qty, in_transit_qty)
       VALUES ($1, $2, $3, $3, 0, 0)`,
      [warehouseId, itemId, quantity]
    );
  }

  // Clear cache
  await cache.del(`inventory:${warehouseId}:${itemId}`);
}