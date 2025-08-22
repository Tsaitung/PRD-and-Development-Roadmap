import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { 
  InventorySnapshot, 
  InventoryQueryParams, 
  StockAdjustmentRequest,
  TransferRequest 
} from './types';

export const getInventoryOverview = async (params: InventoryQueryParams) => {
  const { 
    warehouseId, 
    minQuantity = 0, 
    maxQuantity,
    page = 1, 
    limit = 20, 
    sortBy = 'quantity',
    sortOrder = 'desc' 
  } = params;

  // Build query
  let whereConditions = ['1=1'];
  const queryParams: any[] = [];
  
  if (warehouseId) {
    queryParams.push(warehouseId);
    whereConditions.push(`inv.warehouse_id = $${queryParams.length}`);
  }
  
  if (minQuantity !== undefined) {
    queryParams.push(minQuantity);
    whereConditions.push(`inv.quantity >= $${queryParams.length}`);
  }
  
  if (maxQuantity !== undefined) {
    queryParams.push(maxQuantity);
    whereConditions.push(`inv.quantity <= $${queryParams.length}`);
  }

  const whereClause = whereConditions.join(' AND ');
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM inventory_snapshots inv
    WHERE ${whereClause}
  `;
  
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get inventory data
  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT 
      inv.*,
      i.item_code,
      i.item_name,
      i.specification,
      w.warehouse_code,
      w.warehouse_name
    FROM inventory_snapshots inv
    JOIN items i ON inv.item_id = i.id
    JOIN warehouses w ON inv.warehouse_id = w.id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;

  const dataResult = await query(dataQuery, queryParams);

  // Get summary statistics
  const summaryQuery = `
    SELECT 
      COUNT(DISTINCT item_id) as total_items,
      SUM(quantity) as total_quantity,
      SUM(total_value) as total_value,
      AVG(quantity) as avg_quantity
    FROM inventory_snapshots
    WHERE ${whereClause}
  `;

  const summaryResult = await query(summaryQuery, queryParams.slice(0, -2));

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    summary: summaryResult.rows[0]
  };
};

export const getInventoryByItem = async (warehouseId: string, itemId: string) => {
  const cacheKey = `inventory:${warehouseId}:${itemId}`;
  
  // Try to get from cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await query(
    `SELECT 
      inv.*,
      i.item_code,
      i.item_name,
      i.specification,
      i.base_unit_id,
      u.unit_name,
      w.warehouse_code,
      w.warehouse_name
    FROM inventory_snapshots inv
    JOIN items i ON inv.item_id = i.id
    JOIN warehouses w ON inv.warehouse_id = w.id
    LEFT JOIN units u ON i.base_unit_id = u.id
    WHERE inv.warehouse_id = $1 AND inv.item_id = $2`,
    [warehouseId, itemId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const inventory = result.rows[0];
  
  // Cache for 5 minutes
  await cache.set(cacheKey, inventory, 300);
  
  return inventory;
};

export const adjustInventory = async (request: StockAdjustmentRequest & { createdBy: string }) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get current inventory
    const currentResult = await client.query(
      'SELECT * FROM inventory_snapshots WHERE warehouse_id = $1 AND item_id = $2 FOR UPDATE',
      [request.warehouseId, request.itemId]
    );

    if (currentResult.rows.length === 0) {
      throw new AppError('Inventory record not found', 404);
    }

    const current = currentResult.rows[0];
    let newQuantity: number;

    switch (request.adjustmentType) {
      case 'increase':
        newQuantity = current.quantity + request.quantity;
        break;
      case 'decrease':
        newQuantity = current.quantity - request.quantity;
        if (newQuantity < 0) {
          throw new AppError('Insufficient inventory', 400);
        }
        break;
      case 'set':
        newQuantity = request.quantity;
        break;
      default:
        throw new AppError('Invalid adjustment type', 400);
    }

    // Update inventory snapshot
    await client.query(
      `UPDATE inventory_snapshots 
       SET quantity = $1, 
           available_qty = available_qty + ($1 - quantity),
           updated_at = NOW()
       WHERE warehouse_id = $2 AND item_id = $3`,
      [newQuantity, request.warehouseId, request.itemId]
    );

    // Create transaction record
    const transactionResult = await client.query(
      `INSERT INTO inventory_transactions 
       (transaction_no, transaction_type, warehouse_id, item_id, 
        quantity, reference_type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        `ADJ-${Date.now()}`,
        'adjust',
        request.warehouseId,
        request.itemId,
        request.quantity,
        request.reason,
        request.notes,
        request.createdBy
      ]
    );

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`inventory:${request.warehouseId}:${request.itemId}`);

    return {
      transaction: transactionResult.rows[0],
      newQuantity
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const transferInventory = async (request: TransferRequest & { createdBy: string }) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check source inventory
    const sourceResult = await client.query(
      'SELECT * FROM inventory_snapshots WHERE warehouse_id = $1 AND item_id = $2 FOR UPDATE',
      [request.fromWarehouseId, request.itemId]
    );

    if (sourceResult.rows.length === 0) {
      throw new AppError('Source inventory not found', 404);
    }

    const sourceInventory = sourceResult.rows[0];
    
    if (sourceInventory.available_qty < request.quantity) {
      throw new AppError('Insufficient available quantity', 400);
    }

    // Update source warehouse
    await client.query(
      `UPDATE inventory_snapshots 
       SET quantity = quantity - $1,
           available_qty = available_qty - $1,
           in_transit_qty = in_transit_qty + $1,
           updated_at = NOW()
       WHERE warehouse_id = $2 AND item_id = $3`,
      [request.quantity, request.fromWarehouseId, request.itemId]
    );

    // Check/create destination inventory
    const destResult = await client.query(
      'SELECT * FROM inventory_snapshots WHERE warehouse_id = $1 AND item_id = $2',
      [request.toWarehouseId, request.itemId]
    );

    if (destResult.rows.length === 0) {
      // Create new inventory record
      await client.query(
        `INSERT INTO inventory_snapshots 
         (warehouse_id, item_id, quantity, available_qty, reserved_qty, in_transit_qty)
         VALUES ($1, $2, 0, 0, 0, $3)`,
        [request.toWarehouseId, request.itemId, request.quantity]
      );
    } else {
      // Update existing
      await client.query(
        `UPDATE inventory_snapshots 
         SET in_transit_qty = in_transit_qty + $1,
             updated_at = NOW()
         WHERE warehouse_id = $2 AND item_id = $3`,
        [request.quantity, request.toWarehouseId, request.itemId]
      );
    }

    // Create transfer transactions
    const transferNo = `TRF-${Date.now()}`;
    
    // Out transaction
    await client.query(
      `INSERT INTO inventory_transactions 
       (transaction_no, transaction_type, warehouse_id, item_id, 
        quantity, reference_type, reference_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        transferNo,
        'out',
        request.fromWarehouseId,
        request.itemId,
        -request.quantity,
        'transfer',
        request.toWarehouseId,
        request.notes,
        request.createdBy
      ]
    );

    // In transaction (pending)
    const inTransResult = await client.query(
      `INSERT INTO inventory_transactions 
       (transaction_no, transaction_type, warehouse_id, item_id, 
        quantity, reference_type, reference_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        transferNo,
        'transfer',
        request.toWarehouseId,
        request.itemId,
        request.quantity,
        'transfer',
        request.fromWarehouseId,
        request.notes,
        request.createdBy
      ]
    );

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`inventory:${request.fromWarehouseId}:${request.itemId}`);
    await cache.del(`inventory:${request.toWarehouseId}:${request.itemId}`);

    return {
      transferNo,
      transaction: inTransResult.rows[0],
      status: 'in_transit'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getInventoryTransactions = async (filters: any) => {
  const { 
    warehouseId, 
    itemId, 
    transactionType,
    dateFrom,
    dateTo,
    page = 1, 
    limit = 50 
  } = filters;

  let whereConditions = ['1=1'];
  const queryParams: any[] = [];
  
  if (warehouseId) {
    queryParams.push(warehouseId);
    whereConditions.push(`t.warehouse_id = $${queryParams.length}`);
  }
  
  if (itemId) {
    queryParams.push(itemId);
    whereConditions.push(`t.item_id = $${queryParams.length}`);
  }
  
  if (transactionType) {
    queryParams.push(transactionType);
    whereConditions.push(`t.transaction_type = $${queryParams.length}`);
  }
  
  if (dateFrom) {
    queryParams.push(dateFrom);
    whereConditions.push(`t.created_at >= $${queryParams.length}`);
  }
  
  if (dateTo) {
    queryParams.push(dateTo);
    whereConditions.push(`t.created_at <= $${queryParams.length}`);
  }

  const whereClause = whereConditions.join(' AND ');
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM inventory_transactions t
    WHERE ${whereClause}
  `;
  
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get transaction data
  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT 
      t.*,
      i.item_code,
      i.item_name,
      w.warehouse_code,
      w.warehouse_name,
      u.full_name as created_by_name
    FROM inventory_transactions t
    JOIN items i ON t.item_id = i.id
    JOIN warehouses w ON t.warehouse_id = w.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;

  const dataResult = await query(dataQuery, queryParams);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getLowStockAlerts = async (warehouseId?: string) => {
  const whereClause = warehouseId ? 'AND inv.warehouse_id = $1' : '';
  const params = warehouseId ? [warehouseId] : [];

  const result = await query(
    `SELECT 
      inv.*,
      i.item_code,
      i.item_name,
      i.min_stock_qty,
      w.warehouse_code,
      w.warehouse_name,
      (inv.quantity - i.min_stock_qty) as shortage
    FROM inventory_snapshots inv
    JOIN items i ON inv.item_id = i.id
    JOIN warehouses w ON inv.warehouse_id = w.id
    WHERE inv.quantity < i.min_stock_qty
      AND i.min_stock_qty IS NOT NULL
      ${whereClause}
    ORDER BY (inv.quantity / NULLIF(i.min_stock_qty, 0)) ASC`,
    params
  );

  return result.rows;
};

export const getExpiryAlerts = async (warehouseId: string, daysAhead: number = 30) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysAhead);

  const result = await query(
    `SELECT 
      b.*,
      i.item_code,
      i.item_name,
      w.warehouse_code,
      w.warehouse_name,
      DATE_PART('day', b.expiry_date - NOW()) as days_until_expiry
    FROM inventory_batches b
    JOIN items i ON b.item_id = i.id
    JOIN warehouses w ON b.warehouse_id = w.id
    WHERE b.warehouse_id = $1
      AND b.expiry_date <= $2
      AND b.status = 'available'
      AND b.quantity > 0
    ORDER BY b.expiry_date ASC`,
    [warehouseId, expiryDate]
  );

  return result.rows;
};