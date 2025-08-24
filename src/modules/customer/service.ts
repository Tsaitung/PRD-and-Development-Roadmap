import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import {
  Customer,
  CustomerCredit,
  CustomerAnalytics,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilter,
  CreditAdjustmentRequest,
  CustomerTier
} from './types';

export const createCustomer = async (
  request: CreateCustomerRequest & { createdBy: string }
): Promise<Customer> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check for duplicate tax ID
    if (request.taxId) {
      const existing = await client.query(
        'SELECT id FROM customers WHERE tax_id = $1',
        [request.taxId]
      );
      
      if (existing.rows.length > 0) {
        throw new AppError('Customer with this tax ID already exists', 400);
      }
    }

    // Generate customer code
    const customerCode = await generateCustomerCode(request.customerType);

    // Determine initial tier level
    const tierLevel = determineTierLevel(request.creditLimit || 0);

    // Create customer record
    const customerResult = await client.query(
      `INSERT INTO customers 
       (customer_code, customer_name, customer_type, tier_level, status,
        tax_id, credit_limit, payment_terms, billing_address,
        contact_person, contact_phone, contact_email,
        sales_rep_id, tags, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        customerCode,
        request.customerName,
        request.customerType,
        tierLevel,
        'active',
        request.taxId,
        request.creditLimit || 0,
        request.paymentTerms || 'NET30',
        JSON.stringify(request.billingAddress),
        request.primaryContact.name,
        request.primaryContact.phone,
        request.primaryContact.email,
        request.salesRepId,
        request.tags ? JSON.stringify(request.tags) : null,
        request.notes,
        request.createdBy
      ]
    );

    const customer = customerResult.rows[0];

    // Create shipping address if different from billing
    if (request.shippingAddress) {
      await client.query(
        `INSERT INTO customer_addresses 
         (customer_id, address_type, address_data, is_default)
         VALUES ($1, $2, $3, $4)`,
        [customer.id, 'shipping', JSON.stringify(request.shippingAddress), true]
      );
    }

    // Initialize credit record
    if (request.creditLimit && request.creditLimit > 0) {
      await client.query(
        `INSERT INTO customer_credits 
         (customer_id, credit_limit, used_credit, available_credit,
          risk_score, risk_category, credit_status, last_review_date, next_review_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          customer.id,
          request.creditLimit,
          0,
          request.creditLimit,
          100, // Initial perfect score
          'low',
          'active',
          new Date(),
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
        ]
      );
    }

    // Create welcome interaction
    await client.query(
      `INSERT INTO customer_interactions 
       (customer_id, interaction_type, channel, subject, description,
        status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        customer.id,
        'email',
        'email',
        'Welcome to 菜蟲農食',
        'New customer onboarding',
        'closed',
        request.createdBy
      ]
    );

    await client.query('COMMIT');

    // Clear cache
    await cache.del('customers:list');
    await cache.del('customers:statistics');

    // Get complete customer data
    return await getCustomerById(customer.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateCustomer = async (
  customerId: string,
  request: UpdateCustomerRequest & { updatedBy: string }
): Promise<Customer> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get current customer
    const currentResult = await client.query(
      'SELECT * FROM customers WHERE id = $1 FOR UPDATE',
      [customerId]
    );

    if (currentResult.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const current = currentResult.rows[0];

    // Build update query
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramCount = 0;

    const updateFields = [
      'customerName', 'customerType', 'tierLevel', 'status',
      'creditLimit', 'paymentTerms', 'discountRate', 'tags', 'notes'
    ];

    for (const field of updateFields) {
      if (request[field] !== undefined) {
        paramCount++;
        updates.push(`${toSnakeCase(field)} = $${paramCount}`);
        params.push(request[field]);
      }
    }

    if (request.primaryContact) {
      paramCount++;
      updates.push(`contact_person = $${paramCount}`);
      params.push(request.primaryContact.name);
      
      if (request.primaryContact.phone) {
        paramCount++;
        updates.push(`contact_phone = $${paramCount}`);
        params.push(request.primaryContact.phone);
      }
      
      if (request.primaryContact.email) {
        paramCount++;
        updates.push(`contact_email = $${paramCount}`);
        params.push(request.primaryContact.email);
      }
    }

    params.push(customerId);
    await client.query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${params.length}`,
      params
    );

    // Update credit limit if changed
    if (request.creditLimit !== undefined && request.creditLimit !== current.credit_limit) {
      await updateCreditLimit(client, customerId, request.creditLimit, request.updatedBy);
    }

    // Log changes
    await client.query(
      `INSERT INTO audit_logs 
       (table_name, record_id, action, old_values, new_values, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'customers',
        customerId,
        'update',
        JSON.stringify(current),
        JSON.stringify(request),
        request.updatedBy
      ]
    );

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`customer:${customerId}`);
    await cache.del('customers:list');

    return await getCustomerById(customerId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getCustomerById = async (customerId: string): Promise<Customer | null> => {
  // Try cache first
  const cached = await cache.get(`customer:${customerId}`);
  if (cached) {
    return cached;
  }

  const customerResult = await query(
    `SELECT 
      c.*,
      cc.credit_limit,
      cc.used_credit,
      cc.available_credit,
      cc.risk_score,
      cc.risk_category,
      u.full_name as sales_rep_name
     FROM customers c
     LEFT JOIN customer_credits cc ON c.id = cc.customer_id
     LEFT JOIN users u ON c.sales_rep_id = u.id
     WHERE c.id = $1`,
    [customerId]
  );

  if (customerResult.rows.length === 0) {
    return null;
  }

  const customer = customerResult.rows[0];

  // Get shipping addresses
  const addressResult = await query(
    `SELECT * FROM customer_addresses 
     WHERE customer_id = $1 
     ORDER BY is_default DESC, created_at`,
    [customerId]
  );

  // Get recent interactions
  const interactionResult = await query(
    `SELECT * FROM customer_interactions 
     WHERE customer_id = $1 
     ORDER BY created_at DESC 
     LIMIT 5`,
    [customerId]
  );

  // Get analytics
  const analyticsResult = await query(
    `SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      SUM(o.total_amount) as total_spent,
      AVG(o.total_amount) as average_order_value,
      MAX(o.order_date) as last_purchase_date,
      MIN(o.order_date) as first_purchase_date
     FROM sales_orders o
     WHERE o.customer_id = $1 AND o.status != 'cancelled'`,
    [customerId]
  );

  const enrichedCustomer = {
    ...customer,
    shippingAddresses: addressResult.rows.map(a => JSON.parse(a.address_data)),
    recentInteractions: interactionResult.rows,
    analytics: analyticsResult.rows[0]
  };

  // Cache for 10 minutes
  await cache.set(`customer:${customerId}`, enrichedCustomer, 600);

  return enrichedCustomer;
};

export const searchCustomers = async (filter: CustomerFilter) => {
  let whereConditions: string[] = ['1=1'];
  const params: any[] = [];

  if (filter.search) {
    params.push(`%${filter.search}%`);
    whereConditions.push(
      `(c.customer_name ILIKE $${params.length} OR 
        c.customer_code ILIKE $${params.length} OR 
        c.tax_id ILIKE $${params.length} OR
        c.contact_phone ILIKE $${params.length})`
    );
  }

  if (filter.customerType && filter.customerType.length > 0) {
    params.push(filter.customerType);
    whereConditions.push(`c.customer_type = ANY($${params.length})`);
  }

  if (filter.status && filter.status.length > 0) {
    params.push(filter.status);
    whereConditions.push(`c.status = ANY($${params.length})`);
  }

  if (filter.tierLevel && filter.tierLevel.length > 0) {
    params.push(filter.tierLevel);
    whereConditions.push(`c.tier_level = ANY($${params.length})`);
  }

  if (filter.salesRepId) {
    params.push(filter.salesRepId);
    whereConditions.push(`c.sales_rep_id = $${params.length}`);
  }

  if (filter.hasOverdue) {
    whereConditions.push(
      `EXISTS (
        SELECT 1 FROM accounts_receivable ar 
        WHERE ar.customer_id = c.id 
        AND ar.status = 'overdue'
      )`
    );
  }

  const whereClause = whereConditions.join(' AND ');
  const sortBy = filter.sortBy || 'created_at';
  const sortOrder = filter.sortOrder || 'desc';
  const limit = filter.limit || 20;
  const offset = ((filter.page || 1) - 1) * limit;

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total);

  // Get customers with analytics
  params.push(limit, offset);
  const customersResult = await query(
    `SELECT 
      c.*,
      cc.available_credit,
      cc.risk_category,
      COUNT(DISTINCT o.id) as order_count,
      SUM(o.total_amount) as total_spent,
      MAX(o.order_date) as last_order_date
     FROM customers c
     LEFT JOIN customer_credits cc ON c.id = cc.customer_id
     LEFT JOIN sales_orders o ON c.id = o.customer_id AND o.status != 'cancelled'
     WHERE ${whereClause}
     GROUP BY c.id, cc.customer_id, cc.available_credit, cc.risk_category
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: customersResult.rows,
    pagination: {
      page: filter.page || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getCustomerAnalytics = async (customerId: string): Promise<CustomerAnalytics> => {
  // Check cache
  const cacheKey = `customer:analytics:${customerId}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Get order statistics
  const orderStats = await query(
    `SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_spent,
      AVG(total_amount) as average_order_value,
      MAX(order_date) as last_order_date,
      MIN(order_date) as first_order_date,
      AVG(DATE_PART('day', 
        LEAD(order_date) OVER (ORDER BY order_date) - order_date
      )) as order_frequency
     FROM sales_orders
     WHERE customer_id = $1 AND status != 'cancelled'`,
    [customerId]
  );

  // Get top products
  const topProducts = await query(
    `SELECT 
      i.id as product_id,
      i.item_name as product_name,
      SUM(oi.ordered_qty) as quantity,
      SUM(oi.subtotal) as revenue
     FROM sales_order_items oi
     JOIN sales_orders o ON oi.order_id = o.id
     JOIN items i ON oi.item_id = i.id
     WHERE o.customer_id = $1 AND o.status != 'cancelled'
     GROUP BY i.id, i.item_name
     ORDER BY revenue DESC
     LIMIT 10`,
    [customerId]
  );

  // Get monthly spend pattern
  const monthlySpend = await query(
    `SELECT 
      TO_CHAR(order_date, 'YYYY-MM') as month,
      SUM(total_amount) as amount,
      COUNT(*) as order_count
     FROM sales_orders
     WHERE customer_id = $1 
       AND status != 'cancelled'
       AND order_date >= CURRENT_DATE - INTERVAL '12 months'
     GROUP BY TO_CHAR(order_date, 'YYYY-MM')
     ORDER BY month`,
    [customerId]
  );

  // Calculate CLV (simplified)
  const stats = orderStats.rows[0];
  const avgOrderValue = parseFloat(stats.average_order_value || 0);
  const orderFrequency = parseFloat(stats.order_frequency || 365);
  const estimatedLifespan = 3; // years
  const clv = (avgOrderValue * (365 / orderFrequency) * estimatedLifespan);

  // Calculate churn probability
  const lastOrderDays = stats.last_order_date ? 
    Math.floor((Date.now() - new Date(stats.last_order_date).getTime()) / (1000 * 60 * 60 * 24)) : 999;
  
  const churnProbability = calculateChurnProbability(lastOrderDays, orderFrequency);

  const analytics: CustomerAnalytics = {
    customerId,
    totalOrders: parseInt(stats.total_orders),
    totalSpent: parseFloat(stats.total_spent || 0),
    averageOrderValue: avgOrderValue,
    orderFrequency: orderFrequency,
    lastOrderDays,
    topCategories: [], // Would need additional query
    topProducts: topProducts.rows,
    monthlySpend: monthlySpend.rows,
    peakSeason: identifyPeakSeason(monthlySpend.rows),
    marketingResponseRate: 0, // Would need campaign data
    supportTickets: 0, // Would need support data
    satisfactionScore: undefined,
    npsScore: undefined,
    churnProbability,
    paymentRisk: 0, // Would need payment history
    clv,
    percentileRank: 0, // Would need comparative analysis
    segmentRank: 0,
    calculatedAt: new Date()
  };

  // Cache for 1 hour
  await cache.set(cacheKey, analytics, 3600);

  return analytics;
};

export const adjustCustomerCredit = async (
  request: CreditAdjustmentRequest & { adjustedBy: string }
): Promise<CustomerCredit> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get current credit
    const currentResult = await client.query(
      'SELECT * FROM customer_credits WHERE customer_id = $1 FOR UPDATE',
      [request.customerId]
    );

    if (currentResult.rows.length === 0) {
      // Initialize credit record if doesn't exist
      await client.query(
        `INSERT INTO customer_credits 
         (customer_id, credit_limit, used_credit, available_credit, 
          risk_score, risk_category, credit_status, last_review_date, next_review_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          request.customerId,
          request.amount,
          0,
          request.amount,
          100,
          'low',
          'active',
          new Date(),
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        ]
      );
    } else {
      const current = currentResult.rows[0];
      let newLimit: number;

      switch (request.adjustmentType) {
        case 'increase':
          newLimit = current.credit_limit + request.amount;
          break;
        case 'decrease':
          newLimit = Math.max(0, current.credit_limit - request.amount);
          break;
        case 'set':
          newLimit = request.amount;
          break;
        default:
          throw new AppError('Invalid adjustment type', 400);
      }

      // Update credit limit
      const updateQuery = request.isTemporary ?
        `UPDATE customer_credits 
         SET temporary_limit = $1, 
             temporary_limit_expiry = $2,
             last_review_date = NOW(),
             updated_at = NOW()
         WHERE customer_id = $3` :
        `UPDATE customer_credits 
         SET credit_limit = $1, 
             available_credit = $1 - used_credit,
             last_review_date = NOW(),
             updated_at = NOW()
         WHERE customer_id = $2`;

      const updateParams = request.isTemporary ?
        [newLimit, request.expiryDate, request.customerId] :
        [newLimit, request.customerId];

      await client.query(updateQuery, updateParams);
    }

    // Log credit adjustment
    await client.query(
      `INSERT INTO credit_adjustments 
       (customer_id, adjustment_type, amount, reason, 
        is_temporary, expiry_date, approved_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        request.customerId,
        request.adjustmentType,
        request.amount,
        request.reason,
        request.isTemporary || false,
        request.expiryDate,
        request.approvedBy || request.adjustedBy
      ]
    );

    await client.query('COMMIT');

    // Get updated credit record
    const updatedResult = await client.query(
      'SELECT * FROM customer_credits WHERE customer_id = $1',
      [request.customerId]
    );

    // Clear cache
    await cache.del(`customer:${request.customerId}`);
    await cache.del(`customer:credit:${request.customerId}`);

    return updatedResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getCustomerTiers = async (): Promise<CustomerTier[]> => {
  const result = await query(
    `SELECT * FROM customer_tiers 
     WHERE is_active = true 
     ORDER BY level`,
    []
  );

  return result.rows;
};

// Helper functions
async function generateCustomerCode(customerType: string): Promise<string> {
  const prefix = customerType.substring(0, 3).toUpperCase();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  
  const countResult = await query(
    `SELECT COUNT(*) + 1 as seq 
     FROM customers 
     WHERE customer_code LIKE $1`,
    [`${prefix}${year}%`]
  );
  
  const seq = String(countResult.rows[0].seq).padStart(5, '0');
  return `${prefix}${year}${seq}`;
}

function determineTierLevel(creditLimit: number): number {
  if (creditLimit >= 1000000) return 5; // Platinum
  if (creditLimit >= 500000) return 4;  // Gold
  if (creditLimit >= 100000) return 3;  // Silver
  if (creditLimit >= 50000) return 2;   // Bronze
  return 1; // Basic
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function calculateChurnProbability(lastOrderDays: number, avgFrequency: number): number {
  if (lastOrderDays > avgFrequency * 3) return 0.9; // Very high
  if (lastOrderDays > avgFrequency * 2) return 0.6; // High
  if (lastOrderDays > avgFrequency * 1.5) return 0.3; // Medium
  return 0.1; // Low
}

function identifyPeakSeason(monthlyData: any[]): string | undefined {
  if (monthlyData.length === 0) return undefined;
  
  const sorted = [...monthlyData].sort((a, b) => b.amount - a.amount);
  const topMonth = sorted[0];
  
  if (topMonth) {
    const month = new Date(topMonth.month + '-01').toLocaleString('default', { month: 'long' });
    return month;
  }
  
  return undefined;
}

async function updateCreditLimit(client: any, customerId: string, newLimit: number, updatedBy: string) {
  await client.query(
    `UPDATE customer_credits 
     SET credit_limit = $1,
         available_credit = $1 - used_credit,
         last_review_date = NOW(),
         updated_at = NOW()
     WHERE customer_id = $2`,
    [newLimit, customerId]
  );
}