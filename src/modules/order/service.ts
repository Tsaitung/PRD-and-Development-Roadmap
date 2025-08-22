import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import {
  Order,
  OrderItem,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderPricingRequest,
  OrderPricingResponse,
  OrderFilter,
  OrderStatistics,
  CustomerOrderHistory
} from './types';

export const createOrder = async (
  request: CreateOrderRequest & { createdBy: string }
): Promise<Order> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Validate customer
    const customerResult = await client.query(
      'SELECT id, credit_limit, payment_terms FROM customers WHERE id = $1 AND status = $2',
      [request.customerId, 'active']
    );

    if (customerResult.rows.length === 0) {
      throw new AppError('Customer not found or inactive', 404);
    }

    const customer = customerResult.rows[0];

    // Generate order number
    const orderNo = await generateOrderNumber();

    // Calculate pricing for all items
    const pricingResult = await calculateOrderPricing({
      customerId: request.customerId,
      items: request.items,
      deliveryAddress: request.deliveryAddress,
      promotionCode: request.applyPromotion
    });

    // Create order header
    const orderResult = await client.query(
      `INSERT INTO sales_orders 
       (order_no, customer_id, order_type, order_date, requested_delivery_date,
        sales_channel, sales_rep_id, subtotal, discount_amount, tax_amount,
        shipping_fee, total_amount, payment_status, payment_method, payment_terms,
        delivery_status, delivery_address, customer_notes, internal_notes,
        status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
               $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        orderNo,
        request.customerId,
        request.orderType || 'standard',
        new Date(),
        request.requestedDeliveryDate,
        request.salesChannel || 'direct',
        request.salesRepId,
        pricingResult.subtotal,
        pricingResult.discountAmount,
        pricingResult.taxAmount,
        pricingResult.shippingFee,
        pricingResult.totalAmount,
        'unpaid',
        request.paymentMethod,
        request.paymentTerms || customer.payment_terms || 'NET30',
        'pending',
        JSON.stringify(request.deliveryAddress),
        request.customerNotes,
        request.internalNotes,
        'pending',
        request.createdBy
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i];
      const pricing = pricingResult.items[i];

      await client.query(
        `INSERT INTO sales_order_items 
         (order_id, item_id, ordered_qty, unit_price, original_price,
          discount_rate, discount_amount, tax_rate, tax_amount, subtotal,
          status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          order.id,
          item.itemId,
          item.quantity,
          pricing.unitPrice,
          pricing.originalPrice,
          item.discountRate || 0,
          pricing.discountAmount,
          0.05, // Default tax rate
          pricing.taxAmount,
          pricing.subtotal,
          'pending',
          item.notes
        ]
      );

      // Reserve inventory
      await reserveInventory(client, item.itemId, item.quantity);
    }

    // Update customer credit if applicable
    if (request.paymentTerms && request.paymentTerms !== 'COD') {
      await updateCustomerCredit(client, request.customerId, pricingResult.totalAmount);
    }

    // Create order activity log
    await client.query(
      `INSERT INTO order_activities 
       (order_id, activity_type, description, created_by)
       VALUES ($1, $2, $3, $4)`,
      [order.id, 'created', 'Order created', request.createdBy]
    );

    await client.query('COMMIT');

    // Clear caches
    await cache.del(`customer:orders:${request.customerId}`);
    await cache.del('orders:statistics');

    // Get complete order with items
    return await getOrderById(order.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (
  orderId: string,
  request: UpdateOrderStatusRequest & { updatedBy: string }
): Promise<Order> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get current order status
    const orderResult = await client.query(
      'SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const currentOrder = orderResult.rows[0];

    // Validate status transition
    if (!isValidStatusTransition(currentOrder.status, request.status)) {
      throw new AppError(
        `Invalid status transition from ${currentOrder.status} to ${request.status}`,
        400
      );
    }

    // Update order status
    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [request.status];

    // Handle status-specific logic
    switch (request.status) {
      case 'confirmed':
        // Allocate inventory
        await allocateOrderInventory(client, orderId);
        break;
        
      case 'shipped':
        updates.push('delivery_status = $' + (params.length + 1));
        params.push('in_transit');
        break;
        
      case 'delivered':
        updates.push('delivery_status = $' + (params.length + 1));
        params.push('delivered');
        updates.push('actual_delivery_date = $' + (params.length + 1));
        params.push(new Date());
        break;
        
      case 'cancelled':
        // Release reserved inventory
        await releaseOrderInventory(client, orderId);
        updates.push('delivery_status = $' + (params.length + 1));
        params.push('cancelled');
        break;
    }

    params.push(orderId);
    await client.query(
      `UPDATE sales_orders SET ${updates.join(', ')} WHERE id = $${params.length}`,
      params
    );

    // Update order items status
    await client.query(
      'UPDATE sales_order_items SET status = $1 WHERE order_id = $2',
      [request.status === 'cancelled' ? 'cancelled' : 'confirmed', orderId]
    );

    // Log activity
    await client.query(
      `INSERT INTO order_activities 
       (order_id, activity_type, description, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        orderId,
        'status_change',
        `Status changed to ${request.status}`,
        request.notes,
        request.updatedBy
      ]
    );

    await client.query('COMMIT');

    // Send notification if requested
    if (request.notifyCustomer) {
      await sendOrderStatusNotification(orderId, request.status);
    }

    // Clear cache
    await cache.del(`order:${orderId}`);

    return await getOrderById(orderId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  // Try cache first
  const cached = await cache.get(`order:${orderId}`);
  if (cached) {
    return cached;
  }

  const orderResult = await query(
    `SELECT 
      o.*,
      c.customer_name,
      c.customer_code,
      u.full_name as sales_rep_name
     FROM sales_orders o
     JOIN customers c ON o.customer_id = c.id
     LEFT JOIN users u ON o.sales_rep_id = u.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await query(
    `SELECT 
      oi.*,
      i.item_code,
      i.item_name,
      i.specification,
      u.unit_name
     FROM sales_order_items oi
     JOIN items i ON oi.item_id = i.id
     LEFT JOIN units u ON oi.unit_id = u.id
     WHERE oi.order_id = $1
     ORDER BY oi.created_at`,
    [orderId]
  );

  const order = {
    ...orderResult.rows[0],
    items: itemsResult.rows
  };

  // Cache for 5 minutes
  await cache.set(`order:${orderId}`, order, 300);

  return order;
};

export const searchOrders = async (filter: OrderFilter) => {
  let whereConditions: string[] = ['1=1'];
  const params: any[] = [];

  if (filter.customerId) {
    params.push(filter.customerId);
    whereConditions.push(`o.customer_id = $${params.length}`);
  }

  if (filter.status && filter.status.length > 0) {
    params.push(filter.status);
    whereConditions.push(`o.status = ANY($${params.length})`);
  }

  if (filter.paymentStatus && filter.paymentStatus.length > 0) {
    params.push(filter.paymentStatus);
    whereConditions.push(`o.payment_status = ANY($${params.length})`);
  }

  if (filter.dateFrom) {
    params.push(filter.dateFrom);
    whereConditions.push(`o.order_date >= $${params.length}`);
  }

  if (filter.dateTo) {
    params.push(filter.dateTo);
    whereConditions.push(`o.order_date <= $${params.length}`);
  }

  if (filter.minAmount) {
    params.push(filter.minAmount);
    whereConditions.push(`o.total_amount >= $${params.length}`);
  }

  if (filter.maxAmount) {
    params.push(filter.maxAmount);
    whereConditions.push(`o.total_amount <= $${params.length}`);
  }

  if (filter.searchTerm) {
    params.push(`%${filter.searchTerm}%`);
    whereConditions.push(
      `(o.order_no ILIKE $${params.length} OR 
        c.customer_name ILIKE $${params.length} OR 
        o.reference_no ILIKE $${params.length})`
    );
  }

  const whereClause = whereConditions.join(' AND ');
  const sortBy = filter.sortBy || 'order_date';
  const sortOrder = filter.sortOrder || 'desc';
  const limit = filter.limit || 20;
  const offset = ((filter.page || 1) - 1) * limit;

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM sales_orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total);

  // Get orders
  params.push(limit, offset);
  const ordersResult = await query(
    `SELECT 
      o.*,
      c.customer_name,
      c.customer_code,
      c.customer_type,
      COUNT(oi.id) as item_count,
      SUM(oi.ordered_qty) as total_items
     FROM sales_orders o
     JOIN customers c ON o.customer_id = c.id
     LEFT JOIN sales_order_items oi ON o.id = oi.order_id
     WHERE ${whereClause}
     GROUP BY o.id, c.id
     ORDER BY o.${sortBy} ${sortOrder}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: ordersResult.rows,
    pagination: {
      page: filter.page || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const calculateOrderPricing = async (
  request: OrderPricingRequest
): Promise<OrderPricingResponse> => {
  const items: any[] = [];
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  // Get customer pricing tier
  const customerResult = await query(
    'SELECT tier_level, customer_type FROM customers WHERE id = $1',
    [request.customerId]
  );

  const customer = customerResult.rows[0];
  const tierLevel = customer?.tier_level || 1;

  // Calculate pricing for each item
  for (const requestItem of request.items) {
    // Get item price
    const priceResult = await query(
      `SELECT 
        i.id,
        i.item_code,
        i.item_name,
        COALESCE(cp.price, i.base_price) as unit_price,
        i.base_price as original_price
       FROM items i
       LEFT JOIN customer_prices cp ON i.id = cp.item_id 
         AND cp.customer_id = $1
         AND cp.is_active = true
       WHERE i.id = $2`,
      [request.customerId, requestItem.itemId]
    );

    if (priceResult.rows.length === 0) {
      throw new AppError(`Item ${requestItem.itemId} not found`, 404);
    }

    const item = priceResult.rows[0];
    
    // Apply tier discount
    const tierDiscount = getTierDiscount(tierLevel);
    const discountedPrice = item.unit_price * (1 - tierDiscount);
    
    // Apply quantity discount
    const qtyDiscount = getQuantityDiscount(requestItem.quantity);
    const finalPrice = discountedPrice * (1 - qtyDiscount);
    
    const itemSubtotal = finalPrice * requestItem.quantity;
    const discountAmount = (item.original_price - finalPrice) * requestItem.quantity;
    const taxAmount = itemSubtotal * 0.05; // 5% tax

    items.push({
      itemId: requestItem.itemId,
      quantity: requestItem.quantity,
      unitPrice: finalPrice,
      originalPrice: item.original_price,
      discountAmount,
      taxAmount,
      subtotal: itemSubtotal
    });

    subtotal += itemSubtotal;
    totalDiscount += discountAmount;
    totalTax += taxAmount;
  }

  // Calculate shipping fee
  const shippingFee = calculateShippingFee(
    request.deliveryAddress,
    subtotal,
    request.items.length
  );

  // Apply promotion if provided
  let promotionDiscount = 0;
  const promotions: any[] = [];
  
  if (request.promotionCode) {
    const promoResult = await applyPromotion(
      request.promotionCode,
      subtotal,
      request.customerId
    );
    
    if (promoResult) {
      promotionDiscount = promoResult.discountAmount;
      totalDiscount += promotionDiscount;
      promotions.push(promoResult);
    }
  }

  // Check available credit
  let availableCredit = 0;
  let creditApplied = 0;
  
  if (request.useCredit) {
    const creditResult = await query(
      `SELECT 
        credit_limit - used_credit as available_credit
       FROM customer_credits
       WHERE customer_id = $1`,
      [request.customerId]
    );
    
    if (creditResult.rows.length > 0) {
      availableCredit = creditResult.rows[0].available_credit;
      creditApplied = Math.min(availableCredit, subtotal + totalTax + shippingFee);
    }
  }

  const totalAmount = subtotal - totalDiscount + totalTax + shippingFee - creditApplied;

  return {
    items,
    subtotal,
    discountAmount: totalDiscount,
    taxAmount: totalTax,
    shippingFee,
    totalAmount,
    availableCredit,
    creditApplied,
    promotions
  };
};

export const getOrderStatistics = async (
  dateFrom?: Date,
  dateTo?: Date
): Promise<OrderStatistics> => {
  const cacheKey = `orders:statistics:${dateFrom}:${dateTo}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const params: any[] = [];
  let dateFilter = '';
  
  if (dateFrom) {
    params.push(dateFrom);
    dateFilter += ` AND order_date >= $${params.length}`;
  }
  
  if (dateTo) {
    params.push(dateTo);
    dateFilter += ` AND order_date <= $${params.length}`;
  }

  // Get overall statistics
  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_order_value
     FROM sales_orders
     WHERE status != 'cancelled' ${dateFilter}`,
    params
  );

  // Get orders by status
  const statusResult = await query(
    `SELECT 
      status,
      COUNT(*) as count
     FROM sales_orders
     WHERE 1=1 ${dateFilter}
     GROUP BY status`,
    params
  );

  // Get orders by channel
  const channelResult = await query(
    `SELECT 
      sales_channel,
      COUNT(*) as count
     FROM sales_orders
     WHERE status != 'cancelled' ${dateFilter}
     GROUP BY sales_channel`,
    params
  );

  // Get top products
  const topProductsResult = await query(
    `SELECT 
      i.id as item_id,
      i.item_name,
      SUM(oi.ordered_qty) as quantity,
      SUM(oi.subtotal) as revenue
     FROM sales_order_items oi
     JOIN sales_orders o ON oi.order_id = o.id
     JOIN items i ON oi.item_id = i.id
     WHERE o.status != 'cancelled' ${dateFilter}
     GROUP BY i.id, i.item_name
     ORDER BY revenue DESC
     LIMIT 10`,
    params
  );

  // Get daily orders (last 30 days)
  const dailyResult = await query(
    `SELECT 
      DATE(order_date) as date,
      COUNT(*) as count,
      SUM(total_amount) as revenue
     FROM sales_orders
     WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
       AND status != 'cancelled'
     GROUP BY DATE(order_date)
     ORDER BY date DESC`,
    []
  );

  const statistics: OrderStatistics = {
    totalOrders: parseInt(statsResult.rows[0].total_orders),
    totalRevenue: parseFloat(statsResult.rows[0].total_revenue || 0),
    averageOrderValue: parseFloat(statsResult.rows[0].average_order_value || 0),
    ordersByStatus: statusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {}),
    ordersByChannel: channelResult.rows.reduce((acc, row) => {
      acc[row.sales_channel] = parseInt(row.count);
      return acc;
    }, {}),
    topProducts: topProductsResult.rows.map(row => ({
      itemId: row.item_id,
      itemName: row.item_name,
      quantity: parseInt(row.quantity),
      revenue: parseFloat(row.revenue)
    })),
    dailyOrders: dailyResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
      revenue: parseFloat(row.revenue)
    }))
  };

  // Cache for 10 minutes
  await cache.set(cacheKey, statistics, 600);

  return statistics;
};

// Helper functions
async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const countResult = await query(
    `SELECT COUNT(*) + 1 as seq 
     FROM sales_orders 
     WHERE DATE(order_date) = CURRENT_DATE`
  );
  
  const seq = String(countResult.rows[0].seq).padStart(4, '0');
  return `SO${year}${month}${day}${seq}`;
}

function isValidStatusTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    'draft': ['pending', 'cancelled'],
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['ready', 'cancelled'],
    'ready': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'returned'],
    'delivered': ['completed', 'returned'],
    'completed': ['refunded'],
    'cancelled': [],
    'refunded': []
  };
  
  return transitions[from]?.includes(to) || false;
}

async function reserveInventory(client: any, itemId: string, quantity: number) {
  await client.query(
    `UPDATE inventory_snapshots 
     SET reserved_qty = reserved_qty + $1,
         available_qty = available_qty - $1
     WHERE item_id = $2 
       AND available_qty >= $1`,
    [quantity, itemId]
  );
}

async function allocateOrderInventory(client: any, orderId: string) {
  // Implementation for inventory allocation
  // This would involve selecting appropriate warehouses and batches
}

async function releaseOrderInventory(client: any, orderId: string) {
  const itemsResult = await client.query(
    'SELECT item_id, ordered_qty FROM sales_order_items WHERE order_id = $1',
    [orderId]
  );
  
  for (const item of itemsResult.rows) {
    await client.query(
      `UPDATE inventory_snapshots 
       SET reserved_qty = reserved_qty - $1,
           available_qty = available_qty + $1
       WHERE item_id = $2`,
      [item.ordered_qty, item.item_id]
    );
  }
}

async function updateCustomerCredit(client: any, customerId: string, amount: number) {
  await client.query(
    `UPDATE customer_credits 
     SET used_credit = used_credit + $1,
         available_credit = credit_limit - (used_credit + $1)
     WHERE customer_id = $2`,
    [amount, customerId]
  );
}

function getTierDiscount(tierLevel: number): number {
  const discounts: Record<number, number> = {
    1: 0,
    2: 0.05,
    3: 0.10,
    4: 0.15,
    5: 0.20
  };
  return discounts[tierLevel] || 0;
}

function getQuantityDiscount(quantity: number): number {
  if (quantity >= 1000) return 0.10;
  if (quantity >= 500) return 0.07;
  if (quantity >= 100) return 0.05;
  if (quantity >= 50) return 0.03;
  return 0;
}

function calculateShippingFee(address: any, subtotal: number, itemCount: number): number {
  // Free shipping for orders over 5000
  if (subtotal >= 5000) return 0;
  
  // Base fee + per item fee
  const baseFee = 100;
  const perItemFee = 10;
  
  return baseFee + (itemCount * perItemFee);
}

async function applyPromotion(code: string, subtotal: number, customerId: string) {
  // Simplified promotion logic
  // In real implementation, this would check promotion rules from database
  return null;
}

async function sendOrderStatusNotification(orderId: string, status: string) {
  // Implementation for sending notifications
  logger.info(`Notification sent for order ${orderId}: ${status}`);
}