import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import {
  Supplier,
  PurchaseOrder,
  PurchaseRequisition,
  RequestForQuotation,
  GoodsReceipt,
  SupplierPerformance,
  CreatePurchaseOrderRequest,
  CreateRFQRequest,
  EvaluateQuotesRequest,
  ReceiveGoodsRequest,
  SupplierSearchFilter,
  SupplierQuote
} from './types';

// Supplier Management
export const createSupplier = async (supplierData: Partial<Supplier> & { createdBy: string }): Promise<Supplier> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Generate supplier code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_code FROM 'SUP${dateStr}(\\d+)') AS INTEGER)), 0) + 1 as seq
       FROM suppliers 
       WHERE supplier_code LIKE 'SUP${dateStr}%'`
    );
    const supplierCode = `SUP${dateStr}${String(seqResult.rows[0].seq).padStart(3, '0')}`;

    // Check for duplicate tax ID
    if (supplierData.taxId) {
      const existing = await client.query(
        'SELECT id FROM suppliers WHERE tax_id = $1',
        [supplierData.taxId]
      );
      if (existing.rows.length) {
        throw new AppError('Supplier with this tax ID already exists', 400);
      }
    }

    // Create supplier
    const supplierResult = await client.query(
      `INSERT INTO suppliers (
        supplier_code, supplier_name, supplier_type, category, status,
        rating, payment_terms, credit_limit, currency, tax_id,
        business_license, website, notes, quality_score, delivery_score,
        price_score, response_time, lead_time, minimum_order_value,
        preferred_supplier, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        supplierCode, supplierData.supplierName, supplierData.supplierType,
        supplierData.category || [], 'active', 0,
        supplierData.paymentTerms || 'NET30', supplierData.creditLimit || 0,
        supplierData.currency || 'TWD', supplierData.taxId,
        supplierData.businessLicense, supplierData.website, supplierData.notes,
        50, 50, 50, 24, 7, supplierData.minimumOrderValue || 0,
        false, supplierData.createdBy
      ]
    );

    const supplier = supplierResult.rows[0];

    // Create supplier contacts
    if (supplierData.contacts && supplierData.contacts.length > 0) {
      for (const contact of supplierData.contacts) {
        await client.query(
          `INSERT INTO supplier_contacts (
            supplier_id, name, title, department, phone, mobile, email,
            is_primary, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            supplier.id, contact.name, contact.title, contact.department,
            contact.phone, contact.mobile, contact.email,
            contact.isPrimary, true
          ]
        );
      }
    }

    // Create supplier addresses
    if (supplierData.addresses && supplierData.addresses.length > 0) {
      for (const address of supplierData.addresses) {
        await client.query(
          `INSERT INTO supplier_addresses (
            supplier_id, address_type, address_line1, address_line2,
            city, state, postal_code, country, is_default
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            supplier.id, address.addressType, address.addressLine1,
            address.addressLine2, address.city, address.state,
            address.postalCode, address.country, address.isDefault
          ]
        );
      }
    }

    // Activity log
    await client.query(
      `INSERT INTO activity_logs (
        entity_type, entity_id, action, description, performed_by
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        'supplier', supplier.id, 'create',
        `Supplier ${supplierCode} created`, supplierData.createdBy
      ]
    );

    await client.query('COMMIT');

    // Clear cache
    await cache.del('suppliers:all');
    await cache.del('suppliers:active');

    logger.info(`Supplier created: ${supplierCode}`);
    return getSupplierById(supplier.id);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating supplier:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Purchase Order Management
export const createPurchaseOrder = async (request: CreatePurchaseOrderRequest & { createdBy: string }): Promise<PurchaseOrder> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Generate PO number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO${dateStr}(\\d+)') AS INTEGER)), 0) + 1 as seq
       FROM purchase_orders 
       WHERE po_number LIKE 'PO${dateStr}%'`
    );
    const poNumber = `PO${dateStr}${String(seqResult.rows[0].seq).padStart(3, '0')}`;

    // Get supplier details
    const supplierResult = await client.query(
      'SELECT * FROM suppliers WHERE id = $1 AND status = $2',
      [request.supplierId, 'active']
    );

    if (!supplierResult.rows.length) {
      throw new AppError('Supplier not found or inactive', 404);
    }

    const supplier = supplierResult.rows[0];

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const processedItems = await Promise.all(request.items.map(async (item) => {
      // Get item details
      const itemResult = await client.query(
        'SELECT * FROM items WHERE id = $1',
        [item.itemId]
      );

      if (!itemResult.rows.length) {
        throw new AppError(`Item ${item.itemId} not found`, 404);
      }

      const itemData = itemResult.rows[0];

      const lineSubtotal = item.quantity * item.unitPrice;
      const discountAmount = lineSubtotal * (item.discountRate || 0) / 100;
      const taxableAmount = lineSubtotal - discountAmount;
      const taxAmount = taxableAmount * (item.taxRate || 0) / 100;
      const lineTotal = taxableAmount + taxAmount;

      subtotal += lineSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        ...item,
        itemCode: itemData.item_code,
        itemName: itemData.item_name,
        description: itemData.description || item.specifications,
        unit: itemData.unit,
        discountAmount,
        taxAmount,
        lineTotal,
        receivedQuantity: 0,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        pendingQuantity: item.quantity
      };
    }));

    const totalAmount = subtotal - totalDiscount + totalTax;

    // Create purchase order
    const poResult = await client.query(
      `INSERT INTO purchase_orders (
        po_number, supplier_id, supplier_name, requisition_id, order_date,
        expected_date, status, priority, currency, exchange_rate,
        subtotal, discount_amount, tax_amount, shipping_cost, total_amount,
        payment_terms, delivery_terms, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        poNumber, request.supplierId, supplier.supplier_name, request.requisitionId,
        new Date(), request.expectedDate, 'draft', request.priority || 'normal',
        supplier.currency, 1, subtotal, totalDiscount, totalTax, 0, totalAmount,
        request.paymentTerms, request.deliveryTerms, request.notes, request.createdBy
      ]
    );

    const purchaseOrder = poResult.rows[0];

    // Create PO items
    for (const item of processedItems) {
      await client.query(
        `INSERT INTO purchase_order_items (
          po_id, item_id, item_code, item_name, description, quantity,
          unit, unit_price, discount_rate, discount_amount, tax_rate,
          tax_amount, line_total, requested_date, specifications,
          received_quantity, accepted_quantity, rejected_quantity, pending_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          purchaseOrder.id, item.itemId, item.itemCode, item.itemName,
          item.description, item.quantity, item.unit, item.unitPrice,
          item.discountRate || 0, item.discountAmount, item.taxRate || 0,
          item.taxAmount, item.lineTotal, item.requestedDate, item.specifications,
          0, 0, 0, item.quantity
        ]
      );
    }

    // Update requisition if linked
    if (request.requisitionId) {
      await client.query(
        `UPDATE purchase_requisitions 
         SET status = 'converted', converted_to_po_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [purchaseOrder.id, request.requisitionId]
      );
    }

    await client.query('COMMIT');

    // Clear cache
    await cache.del('purchase_orders:draft');
    await cache.del(`supplier:orders:${request.supplierId}`);

    logger.info(`Purchase order created: ${poNumber}`);
    return getPurchaseOrderById(purchaseOrder.id);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating purchase order:', error);
    throw error;
  } finally {
    client.release();
  }
};

// RFQ Management
export const createRFQ = async (request: CreateRFQRequest & { createdBy: string }): Promise<RequestForQuotation> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Generate RFQ number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 'RFQ${dateStr}(\\d+)') AS INTEGER)), 0) + 1 as seq
       FROM rfqs 
       WHERE rfq_number LIKE 'RFQ${dateStr}%'`
    );
    const rfqNumber = `RFQ${dateStr}${String(seqResult.rows[0].seq).padStart(3, '0')}`;

    // Create RFQ
    const rfqResult = await client.query(
      `INSERT INTO rfqs (
        rfq_number, title, description, requisition_id, status,
        issue_date, due_date, valid_until, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        rfqNumber, request.title, request.description, request.requisitionId,
        'draft', new Date(), request.dueDate, request.validUntil, request.createdBy
      ]
    );

    const rfq = rfqResult.rows[0];

    // Create RFQ items
    for (const item of request.items) {
      await client.query(
        `INSERT INTO rfq_items (
          rfq_id, item_id, description, quantity, unit, specifications,
          quality_requirements, delivery_requirements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          rfq.id, item.itemId, item.description, item.quantity, item.unit,
          item.specifications, null, null
        ]
      );
    }

    // Invite suppliers
    for (const supplierId of request.supplierIds) {
      // Get supplier details
      const supplierResult = await client.query(
        'SELECT supplier_name FROM suppliers WHERE id = $1',
        [supplierId]
      );

      if (supplierResult.rows.length) {
        await client.query(
          `INSERT INTO rfq_suppliers (
            rfq_id, supplier_id, supplier_name, invited_date, status
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            rfq.id, supplierId, supplierResult.rows[0].supplier_name,
            new Date(), 'invited'
          ]
        );

        // Send notification (placeholder)
        await notifySupplierOfRFQ(supplierId, rfq.id);
      }
    }

    // Store terms and criteria
    await client.query(
      `INSERT INTO rfq_terms (
        rfq_id, payment_terms, delivery_terms, warranty_requirements,
        quality_standards, penalty_clause, confidentiality_clause
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        rfq.id, request.terms.paymentTerms, request.terms.deliveryTerms,
        request.terms.warrantyRequirements, request.terms.qualityStandards,
        request.terms.penaltyClause, request.terms.confidentialityClause
      ]
    );

    await client.query(
      `INSERT INTO rfq_evaluation_criteria (
        rfq_id, price_weight, quality_weight, delivery_weight,
        service_weight, other_weight, minimum_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        rfq.id, request.evaluationCriteria.priceWeight,
        request.evaluationCriteria.qualityWeight, request.evaluationCriteria.deliveryWeight,
        request.evaluationCriteria.serviceWeight, request.evaluationCriteria.otherWeight,
        request.evaluationCriteria.minimumScore
      ]
    );

    await client.query('COMMIT');

    logger.info(`RFQ created: ${rfqNumber}`);
    return getRFQById(rfq.id);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating RFQ:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Quote Evaluation
export const evaluateQuotes = async (request: EvaluateQuotesRequest): Promise<SupplierQuote[]> => {
  const client = await getClient();
  
  try {
    // Get RFQ details with criteria
    const rfqResult = await client.query(
      `SELECT r.*, ec.* 
       FROM rfqs r
       JOIN rfq_evaluation_criteria ec ON r.id = ec.rfq_id
       WHERE r.id = $1`,
      [request.rfqId]
    );

    if (!rfqResult.rows.length) {
      throw new AppError('RFQ not found', 404);
    }

    const rfq = rfqResult.rows[0];
    const criteria = request.overrideCriteria || {
      priceWeight: rfq.price_weight,
      qualityWeight: rfq.quality_weight,
      deliveryWeight: rfq.delivery_weight,
      serviceWeight: rfq.service_weight,
      otherWeight: rfq.other_weight
    };

    // Get all quotes for the RFQ
    const quotesResult = await client.query(
      `SELECT q.*, s.supplier_name, sp.quality_score, sp.delivery_score, sp.price_score
       FROM supplier_quotes q
       JOIN rfq_suppliers rs ON q.rfq_supplier_id = rs.id
       JOIN suppliers s ON rs.supplier_id = s.id
       LEFT JOIN supplier_performance sp ON s.id = sp.supplier_id
       WHERE rs.rfq_id = $1 AND rs.status = 'responded'`,
      [request.rfqId]
    );

    const quotes = quotesResult.rows;

    // Calculate scores for each quote
    const evaluatedQuotes = quotes.map(quote => {
      // Price score (lower is better)
      const minPrice = Math.min(...quotes.map(q => q.total_amount));
      const priceScore = (minPrice / quote.total_amount) * 100;

      // Quality score (from supplier performance)
      const qualityScore = quote.quality_score || 50;

      // Delivery score (shorter lead time is better)
      const minLeadTime = Math.min(...quotes.map(q => q.lead_time));
      const deliveryScore = (minLeadTime / quote.lead_time) * 100;

      // Service score (from supplier performance)
      const serviceScore = ((quote.delivery_score || 50) + (quote.price_score || 50)) / 2;

      // Calculate weighted total score
      const totalScore = (
        (priceScore * criteria.priceWeight / 100) +
        (qualityScore * criteria.qualityWeight / 100) +
        (deliveryScore * criteria.deliveryWeight / 100) +
        (serviceScore * criteria.serviceWeight / 100)
      );

      return {
        ...quote,
        scores: {
          price: priceScore,
          quality: qualityScore,
          delivery: deliveryScore,
          service: serviceScore,
          total: totalScore
        }
      };
    });

    // Sort by total score
    evaluatedQuotes.sort((a, b) => b.scores.total - a.scores.total);

    // Update rankings
    await client.query('BEGIN');

    for (let i = 0; i < evaluatedQuotes.length; i++) {
      const quote = evaluatedQuotes[i];
      await client.query(
        `UPDATE supplier_quotes 
         SET score = $1, ranking = $2
         WHERE id = $3`,
        [quote.scores.total, i + 1, quote.id]
      );
    }

    // Update RFQ status
    await client.query(
      `UPDATE rfqs 
       SET status = 'evaluated', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [request.rfqId]
    );

    await client.query('COMMIT');

    logger.info(`Quotes evaluated for RFQ: ${request.rfqId}`);
    return evaluatedQuotes;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error evaluating quotes:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Goods Receipt
export const receiveGoods = async (request: ReceiveGoodsRequest & { receivedBy: string }): Promise<GoodsReceipt> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get PO details
    const poResult = await client.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [request.poId]
    );

    if (!poResult.rows.length) {
      throw new AppError('Purchase order not found', 404);
    }

    const po = poResult.rows[0];

    // Generate receipt number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 'GR${dateStr}(\\d+)') AS INTEGER)), 0) + 1 as seq
       FROM goods_receipts 
       WHERE receipt_no LIKE 'GR${dateStr}%'`
    );
    const receiptNo = `GR${dateStr}${String(seqResult.rows[0].seq).padStart(3, '0')}`;

    // Create goods receipt
    const receiptResult = await client.query(
      `INSERT INTO goods_receipts (
        receipt_no, po_id, po_number, supplier_id, supplier_name,
        receipt_date, received_by, status, warehouse_id, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        receiptNo, request.poId, po.po_number, po.supplier_id, po.supplier_name,
        new Date(), request.receivedBy, 'draft', request.warehouseId,
        request.notes, request.receivedBy
      ]
    );

    const receipt = receiptResult.rows[0];

    // Process received items
    let allReceived = true;
    let anyReceived = false;

    for (const item of request.items) {
      // Update PO item
      await client.query(
        `UPDATE purchase_order_items 
         SET received_quantity = received_quantity + $1,
             accepted_quantity = accepted_quantity + $2,
             rejected_quantity = rejected_quantity + $3,
             pending_quantity = quantity - (received_quantity + $1)
         WHERE id = $4`,
        [
          item.receivedQuantity,
          item.acceptedQuantity,
          item.rejectedQuantity || 0,
          item.poItemId
        ]
      );

      // Create receipt item
      await client.query(
        `INSERT INTO goods_receipt_items (
          receipt_id, po_item_id, item_id, received_quantity, accepted_quantity,
          rejected_quantity, rejection_reason, batch_no, expiry_date,
          quality_check_passed, storage_location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          receipt.id, item.poItemId, '', item.receivedQuantity,
          item.acceptedQuantity, item.rejectedQuantity || 0,
          item.rejectionReason, item.batchNo, item.expiryDate,
          item.qualityCheckPassed, item.storageLocation
        ]
      );

      // Update inventory if accepted
      if (item.acceptedQuantity > 0) {
        await updateInventoryFromReceipt(
          client,
          request.warehouseId,
          item,
          po.supplier_id
        );
        anyReceived = true;
      }

      // Check if all items are fully received
      const itemResult = await client.query(
        'SELECT quantity, received_quantity FROM purchase_order_items WHERE id = $1',
        [item.poItemId]
      );
      
      if (itemResult.rows[0].quantity > itemResult.rows[0].received_quantity) {
        allReceived = false;
      }
    }

    // Update PO status
    const newStatus = allReceived ? 'received' : (anyReceived ? 'partial' : po.status);
    await client.query(
      `UPDATE purchase_orders 
       SET status = $1, delivery_date = CASE WHEN $1 = 'received' THEN $2 ELSE delivery_date END
       WHERE id = $3`,
      [newStatus, new Date(), request.poId]
    );

    // Update receipt status
    await client.query(
      `UPDATE goods_receipts 
       SET status = $1
       WHERE id = $2`,
      [allReceived ? 'complete' : 'partial', receipt.id]
    );

    await client.query('COMMIT');

    logger.info(`Goods receipt created: ${receiptNo}`);
    return getGoodsReceiptById(receipt.id);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error receiving goods:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Supplier Performance Analysis
export const getSupplierPerformance = async (
  supplierId: string,
  startDate: Date,
  endDate: Date
): Promise<SupplierPerformance> => {
  const cacheKey = `supplier:performance:${supplierId}:${startDate}:${endDate}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Get supplier details
  const supplierResult = await query(
    'SELECT * FROM suppliers WHERE id = $1',
    [supplierId]
  );

  if (!supplierResult.rows.length) {
    throw new AppError('Supplier not found', 404);
  }

  const supplier = supplierResult.rows[0];

  // Calculate metrics
  const metricsResult = await query(
    `SELECT 
      COUNT(DISTINCT po.id) as total_orders,
      COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END) as completed_orders,
      COUNT(DISTINCT CASE WHEN po.delivery_date <= po.expected_date THEN po.id END) as on_time_deliveries,
      SUM(po.total_amount) as total_spend,
      AVG(EXTRACT(DAY FROM po.delivery_date - po.order_date)) as avg_lead_time,
      AVG(EXTRACT(HOUR FROM po.acknowledged_date - po.sent_date)) as avg_response_time
     FROM purchase_orders po
     WHERE po.supplier_id = $1
       AND po.order_date BETWEEN $2 AND $3`,
    [supplierId, startDate, endDate]
  );

  // Quality metrics
  const qualityResult = await query(
    `SELECT 
      COUNT(DISTINCT gri.id) as quality_issues,
      AVG(gri.rejected_quantity::FLOAT / NULLIF(gri.received_quantity, 0)) as rejection_rate
     FROM goods_receipt_items gri
     JOIN goods_receipts gr ON gri.receipt_id = gr.id
     WHERE gr.supplier_id = $1
       AND gr.receipt_date BETWEEN $2 AND $3
       AND gri.rejected_quantity > 0`,
    [supplierId, startDate, endDate]
  );

  const metrics = metricsResult.rows[0];
  const quality = qualityResult.rows[0];

  // Calculate scores
  const deliveryScore = metrics.completed_orders > 0
    ? (metrics.on_time_deliveries / metrics.completed_orders) * 100
    : 0;
  
  const qualityScore = 100 - ((quality.rejection_rate || 0) * 100);
  
  // Price score (comparison with market average)
  const priceScore = await calculatePriceScore(supplierId, startDate, endDate);
  
  const serviceScore = metrics.avg_response_time
    ? Math.max(0, 100 - (metrics.avg_response_time / 24) * 10)
    : 50;

  const overallScore = (
    deliveryScore * 0.3 +
    qualityScore * 0.3 +
    priceScore * 0.2 +
    serviceScore * 0.2
  );

  const performance: SupplierPerformance = {
    supplierId,
    supplierName: supplier.supplier_name,
    period: { startDate, endDate },
    metrics: {
      totalOrders: parseInt(metrics.total_orders) || 0,
      completedOrders: parseInt(metrics.completed_orders) || 0,
      onTimeDeliveries: parseInt(metrics.on_time_deliveries) || 0,
      qualityIssues: parseInt(quality.quality_issues) || 0,
      averageLeadTime: parseFloat(metrics.avg_lead_time) || 0,
      averageResponseTime: parseFloat(metrics.avg_response_time) || 0,
      totalSpend: parseFloat(metrics.total_spend) || 0,
      costSavings: 0, // Calculate based on negotiated discounts
      rejectionRate: parseFloat(quality.rejection_rate) || 0,
      defectRate: 0 // Calculate from quality checks
    },
    scores: {
      overall: overallScore,
      quality: qualityScore,
      delivery: deliveryScore,
      price: priceScore,
      service: serviceScore,
      compliance: 100 // Default, can be calculated from certifications
    },
    trends: {
      qualityTrend: 'stable',
      deliveryTrend: 'stable',
      priceTrend: 'stable'
    },
    recommendations: generateSupplierRecommendations(overallScore, {
      quality: qualityScore,
      delivery: deliveryScore,
      price: priceScore,
      service: serviceScore
    })
  };

  // Cache for 1 hour
  await cache.set(cacheKey, performance, 3600);

  return performance;
};

// Helper functions
async function notifySupplierOfRFQ(supplierId: string, rfqId: string): Promise<void> {
  // Implementation for sending RFQ notification to supplier
  // This could be email, API call, or system notification
  logger.info(`Notifying supplier ${supplierId} of RFQ ${rfqId}`);
}

async function updateInventoryFromReceipt(
  client: any,
  warehouseId: string,
  item: any,
  supplierId: string
): Promise<void> {
  // Update inventory with received goods
  // This would integrate with the warehouse module
  logger.info(`Updating inventory for warehouse ${warehouseId}`);
}

async function calculatePriceScore(
  supplierId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Calculate price competitiveness
  // Compare supplier prices with market average
  return 75; // Placeholder
}

function generateSupplierRecommendations(
  overallScore: number,
  scores: Record<string, number>
): string[] {
  const recommendations = [];

  if (overallScore >= 80) {
    recommendations.push('Consider for preferred supplier status');
    recommendations.push('Negotiate long-term contracts');
  }

  if (scores.quality < 70) {
    recommendations.push('Implement quality improvement program');
    recommendations.push('Increase quality inspections');
  }

  if (scores.delivery < 70) {
    recommendations.push('Review delivery schedules');
    recommendations.push('Consider safety stock adjustments');
  }

  if (scores.price > 85) {
    recommendations.push('Explore volume discount opportunities');
  }

  if (scores.service < 60) {
    recommendations.push('Schedule supplier performance review meeting');
    recommendations.push('Establish SLA agreements');
  }

  return recommendations;
}

// Data retrieval functions
export const getSupplierById = async (supplierId: string): Promise<Supplier | null> => {
  const result = await query(
    `SELECT s.*,
            json_agg(DISTINCT jsonb_build_object(
              'id', sc.id,
              'name', sc.name,
              'title', sc.title,
              'phone', sc.phone,
              'email', sc.email
            )) as contacts,
            json_agg(DISTINCT jsonb_build_object(
              'id', sa.id,
              'addressType', sa.address_type,
              'addressLine1', sa.address_line1,
              'city', sa.city,
              'country', sa.country
            )) as addresses
     FROM suppliers s
     LEFT JOIN supplier_contacts sc ON s.id = sc.supplier_id
     LEFT JOIN supplier_addresses sa ON s.id = sa.supplier_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [supplierId]
  );

  return result.rows[0] || null;
};

export const getPurchaseOrderById = async (poId: string): Promise<PurchaseOrder | null> => {
  const result = await query(
    `SELECT po.*,
            json_agg(
              json_build_object(
                'id', poi.id,
                'itemId', poi.item_id,
                'itemCode', poi.item_code,
                'itemName', poi.item_name,
                'quantity', poi.quantity,
                'unitPrice', poi.unit_price,
                'lineTotal', poi.line_total
              )
            ) as items
     FROM purchase_orders po
     LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
     WHERE po.id = $1
     GROUP BY po.id`,
    [poId]
  );

  return result.rows[0] || null;
};

export const getRFQById = async (rfqId: string): Promise<RequestForQuotation | null> => {
  const result = await query(
    `SELECT r.*,
            json_agg(DISTINCT jsonb_build_object(
              'id', ri.id,
              'description', ri.description,
              'quantity', ri.quantity,
              'unit', ri.unit
            )) as items,
            json_agg(DISTINCT jsonb_build_object(
              'id', rs.id,
              'supplierId', rs.supplier_id,
              'supplierName', rs.supplier_name,
              'status', rs.status
            )) as suppliers
     FROM rfqs r
     LEFT JOIN rfq_items ri ON r.id = ri.rfq_id
     LEFT JOIN rfq_suppliers rs ON r.id = rs.rfq_id
     WHERE r.id = $1
     GROUP BY r.id`,
    [rfqId]
  );

  return result.rows[0] || null;
};

export const getGoodsReceiptById = async (receiptId: string): Promise<GoodsReceipt | null> => {
  const result = await query(
    `SELECT gr.*,
            json_agg(
              json_build_object(
                'id', gri.id,
                'poItemId', gri.po_item_id,
                'receivedQuantity', gri.received_quantity,
                'acceptedQuantity', gri.accepted_quantity,
                'rejectedQuantity', gri.rejected_quantity
              )
            ) as items
     FROM goods_receipts gr
     LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
     WHERE gr.id = $1
     GROUP BY gr.id`,
    [receiptId]
  );

  return result.rows[0] || null;
};

// Search functions
export const searchSuppliers = async (filter: SupplierSearchFilter): Promise<any> => {
  let whereConditions = ['1=1'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (filter.search) {
    paramCount++;
    whereConditions.push(`(s.supplier_name ILIKE $${paramCount} OR s.supplier_code ILIKE $${paramCount})`);
    queryParams.push(`%${filter.search}%`);
  }

  if (filter.supplierType && filter.supplierType.length > 0) {
    paramCount++;
    whereConditions.push(`s.supplier_type = ANY($${paramCount})`);
    queryParams.push(filter.supplierType);
  }

  if (filter.status && filter.status.length > 0) {
    paramCount++;
    whereConditions.push(`s.status = ANY($${paramCount})`);
    queryParams.push(filter.status);
  }

  if (filter.minRating) {
    paramCount++;
    whereConditions.push(`s.rating >= $${paramCount}`);
    queryParams.push(filter.minRating);
  }

  if (filter.preferredOnly) {
    whereConditions.push('s.preferred_supplier = true');
  }

  const limit = filter.limit || 20;
  const offset = ((filter.page || 1) - 1) * limit;

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM suppliers s
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Data query
  paramCount++;
  queryParams.push(limit);
  paramCount++;
  queryParams.push(offset);

  const dataQuery = `
    SELECT s.*,
           COALESCE(po_stats.order_count, 0) as total_orders,
           COALESCE(po_stats.total_spend, 0) as total_spend,
           COALESCE(po_stats.last_order_date, NULL) as last_order_date
    FROM suppliers s
    LEFT JOIN (
      SELECT supplier_id,
             COUNT(*) as order_count,
             SUM(total_amount) as total_spend,
             MAX(order_date) as last_order_date
      FROM purchase_orders
      GROUP BY supplier_id
    ) po_stats ON s.id = po_stats.supplier_id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY ${filter.sortBy || 'supplier_name'} ${filter.sortOrder || 'asc'}
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `;

  const dataResult = await query(dataQuery, queryParams);

  return {
    data: dataResult.rows,
    pagination: {
      page: filter.page || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};