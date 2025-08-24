import { query, getClient } from '../../database/connection';
import { cache } from '../../database/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import {
  Invoice,
  Payment,
  JournalEntry,
  ChartOfAccount,
  CreateInvoiceRequest,
  ProcessPaymentRequest,
  FinancialReportRequest,
  TaxCalculationRequest,
  TaxCalculationResponse,
  AccountsReceivable,
  AccountsPayable
} from './types';

// Invoice Management
export const createInvoice = async (request: CreateInvoiceRequest & { createdBy: string }): Promise<Invoice> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Generate invoice number
    const invoicePrefix = request.invoiceType === 'sales' ? 'INV' : 'BILL';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_no FROM '${invoicePrefix}${dateStr}(\\d+)') AS INTEGER)), 0) + 1 as seq
       FROM invoices 
       WHERE invoice_no LIKE '${invoicePrefix}${dateStr}%'`
    );
    const invoiceNo = `${invoicePrefix}${dateStr}${String(seqResult.rows[0].seq).padStart(3, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const processedItems = request.items.map(item => {
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
        discountAmount,
        taxAmount,
        lineTotal
      };
    });

    const totalAmount = subtotal - totalDiscount + totalTax;

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_no, invoice_type, customer_id, supplier_id, order_id,
        invoice_date, due_date, currency, exchange_rate,
        subtotal, tax_amount, discount_amount, shipping_fee, total_amount,
        paid_amount, balance_amount, status, payment_terms, notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        invoiceNo, request.invoiceType, request.customerId, request.supplierId, request.orderId,
        request.invoiceDate, request.dueDate, 'TWD', 1,
        subtotal, totalTax, totalDiscount, 0, totalAmount,
        0, totalAmount, 'pending', request.paymentTerms, request.notes,
        request.createdBy
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Create invoice items
    for (const item of processedItems) {
      await client.query(
        `INSERT INTO invoice_items (
          invoice_id, item_id, description, quantity, unit_price,
          discount_rate, discount_amount, tax_rate, tax_amount, line_total,
          account_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          invoice.id, item.itemId, item.description, item.quantity, item.unitPrice,
          item.discountRate || 0, item.discountAmount, item.taxRate || 0, item.taxAmount, item.lineTotal,
          item.accountCode
        ]
      );
    }

    // Create journal entry for the invoice
    await createJournalEntryForInvoice(client, invoice, processedItems);

    // Update AR/AP
    if (request.invoiceType === 'sales') {
      await updateAccountsReceivable(client, invoice);
    } else {
      await updateAccountsPayable(client, invoice);
    }

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`invoices:${request.invoiceType}:pending`);
    if (request.customerId) await cache.del(`customer:invoices:${request.customerId}`);
    if (request.supplierId) await cache.del(`supplier:bills:${request.supplierId}`);

    logger.info(`Invoice created: ${invoiceNo}`);
    return getInvoiceById(invoice.id);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating invoice:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Payment Processing
export const processPayment = async (request: ProcessPaymentRequest & { createdBy: string }): Promise<Payment> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get invoice details
    const invoiceResult = await client.query(
      'SELECT * FROM invoices WHERE id = $1 FOR UPDATE',
      [request.invoiceId]
    );

    if (!invoiceResult.rows.length) {
      throw new AppError('Invoice not found', 404);
    }

    const invoice = invoiceResult.rows[0];

    // Validate payment amount
    if (request.amount > invoice.balance_amount) {
      throw new AppError('Payment amount exceeds invoice balance', 400);
    }

    // Generate payment number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(payment_no FROM 'PAY${dateStr}(\\d+)') AS INTEGER)), 0) + 1 as seq
       FROM payments 
       WHERE payment_no LIKE 'PAY${dateStr}%'`
    );
    const paymentNo = `PAY${dateStr}${String(seqResult.rows[0].seq).padStart(3, '0')}`;

    // Create payment record
    const paymentResult = await client.query(
      `INSERT INTO payments (
        payment_no, payment_type, payment_method, reference_type, reference_id,
        amount, currency, exchange_rate, local_amount, payment_date,
        bank_account, transaction_id, status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        paymentNo, 
        invoice.invoice_type === 'sales' ? 'incoming' : 'outgoing',
        request.paymentMethod, 'invoice', request.invoiceId,
        request.amount, invoice.currency, invoice.exchange_rate, request.amount * invoice.exchange_rate,
        request.paymentDate, request.bankAccount, request.transactionId,
        'completed', request.notes, request.createdBy
      ]
    );

    const payment = paymentResult.rows[0];

    // Update invoice
    const newPaidAmount = parseFloat(invoice.paid_amount) + request.amount;
    const newBalance = parseFloat(invoice.total_amount) - newPaidAmount;
    const newStatus = newBalance === 0 ? 'paid' : 'partial';

    await client.query(
      `UPDATE invoices 
       SET paid_amount = $1, balance_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newPaidAmount, newBalance, newStatus, request.invoiceId]
    );

    // Create journal entry for payment
    await createJournalEntryForPayment(client, payment, invoice);

    // Update AR/AP
    if (invoice.invoice_type === 'sales') {
      await client.query(
        `UPDATE accounts_receivable 
         SET paid_amount = paid_amount + $1, 
             balance_amount = balance_amount - $1,
             last_payment_date = $2,
             status = CASE WHEN balance_amount - $1 = 0 THEN 'paid' ELSE status END
         WHERE invoice_id = $3`,
        [request.amount, request.paymentDate, request.invoiceId]
      );
    } else {
      await client.query(
        `UPDATE accounts_payable 
         SET paid_amount = paid_amount + $1, 
             balance_amount = balance_amount - $1,
             status = CASE WHEN balance_amount - $1 = 0 THEN 'paid' ELSE status END
         WHERE bill_id = $3`,
        [request.amount, request.paymentDate, request.invoiceId]
      );
    }

    await client.query('COMMIT');

    // Clear cache
    await cache.del(`invoice:${request.invoiceId}`);
    await cache.del(`payments:recent`);

    logger.info(`Payment processed: ${paymentNo} for invoice ${invoice.invoice_no}`);
    return payment;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error processing payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Journal Entry Creation
async function createJournalEntryForInvoice(client: any, invoice: any, items: any[]) {
  const entryNo = `JE${invoice.invoice_no}`;
  
  // Create journal entry header
  const entryResult = await client.query(
    `INSERT INTO journal_entries (
      entry_no, entry_date, description, reference_type, reference_id,
      status, posted_date, posted_by, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      entryNo, invoice.invoice_date,
      `Invoice ${invoice.invoice_no}`, 'invoice', invoice.id,
      'posted', new Date(), invoice.created_by, invoice.created_by
    ]
  );

  const journalEntryId = entryResult.rows[0].id;

  if (invoice.invoice_type === 'sales') {
    // Debit: Accounts Receivable
    await client.query(
      `INSERT INTO journal_lines (
        journal_entry_id, account_code, account_name, debit, credit, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalEntryId, '1200', 'Accounts Receivable', invoice.total_amount, 0, `Invoice ${invoice.invoice_no}`]
    );

    // Credit: Revenue accounts (by item)
    for (const item of items) {
      const revenueAccount = item.accountCode || '4000';
      await client.query(
        `INSERT INTO journal_lines (
          journal_entry_id, account_code, account_name, debit, credit, description
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [journalEntryId, revenueAccount, 'Sales Revenue', 0, item.lineTotal - item.taxAmount, item.description]
      );
    }

    // Credit: Sales Tax Payable
    if (invoice.tax_amount > 0) {
      await client.query(
        `INSERT INTO journal_lines (
          journal_entry_id, account_code, account_name, debit, credit, description
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [journalEntryId, '2200', 'Sales Tax Payable', 0, invoice.tax_amount, 'Sales Tax']
      );
    }
  } else {
    // Purchase invoice
    // Debit: Expense/Asset accounts
    for (const item of items) {
      const expenseAccount = item.accountCode || '5000';
      await client.query(
        `INSERT INTO journal_lines (
          journal_entry_id, account_code, account_name, debit, credit, description
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [journalEntryId, expenseAccount, 'Purchase Expense', item.lineTotal - item.taxAmount, 0, item.description]
      );
    }

    // Debit: Input Tax
    if (invoice.tax_amount > 0) {
      await client.query(
        `INSERT INTO journal_lines (
          journal_entry_id, account_code, account_name, debit, credit, description
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [journalEntryId, '1300', 'Input Tax', invoice.tax_amount, 0, 'Input Tax']
      );
    }

    // Credit: Accounts Payable
    await client.query(
      `INSERT INTO journal_lines (
        journal_entry_id, account_code, account_name, debit, credit, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalEntryId, '2100', 'Accounts Payable', 0, invoice.total_amount, `Bill ${invoice.invoice_no}`]
    );
  }

  // Update general ledger
  await updateGeneralLedger(client, journalEntryId);
}

async function createJournalEntryForPayment(client: any, payment: any, invoice: any) {
  const entryNo = `JE${payment.payment_no}`;
  
  const entryResult = await client.query(
    `INSERT INTO journal_entries (
      entry_no, entry_date, description, reference_type, reference_id,
      status, posted_date, posted_by, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      entryNo, payment.payment_date,
      `Payment ${payment.payment_no} for ${invoice.invoice_no}`,
      'payment', payment.id,
      'posted', new Date(), payment.created_by, payment.created_by
    ]
  );

  const journalEntryId = entryResult.rows[0].id;

  if (payment.payment_type === 'incoming') {
    // Debit: Cash/Bank
    const cashAccount = payment.bank_account || '1000';
    await client.query(
      `INSERT INTO journal_lines (
        journal_entry_id, account_code, account_name, debit, credit, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalEntryId, cashAccount, 'Cash/Bank', payment.amount, 0, `Receipt ${payment.payment_no}`]
    );

    // Credit: Accounts Receivable
    await client.query(
      `INSERT INTO journal_lines (
        journal_entry_id, account_code, account_name, debit, credit, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalEntryId, '1200', 'Accounts Receivable', 0, payment.amount, `Invoice ${invoice.invoice_no}`]
    );
  } else {
    // Debit: Accounts Payable
    await client.query(
      `INSERT INTO journal_lines (
        journal_entry_id, account_code, account_name, debit, credit, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalEntryId, '2100', 'Accounts Payable', payment.amount, 0, `Bill ${invoice.invoice_no}`]
    );

    // Credit: Cash/Bank
    const cashAccount = payment.bank_account || '1000';
    await client.query(
      `INSERT INTO journal_lines (
        journal_entry_id, account_code, account_name, debit, credit, description
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [journalEntryId, cashAccount, 'Cash/Bank', 0, payment.amount, `Payment ${payment.payment_no}`]
    );
  }

  await updateGeneralLedger(client, journalEntryId);
}

async function updateGeneralLedger(client: any, journalEntryId: string) {
  const lines = await client.query(
    'SELECT * FROM journal_lines WHERE journal_entry_id = $1',
    [journalEntryId]
  );

  for (const line of lines.rows) {
    // Get current balance
    const balanceResult = await client.query(
      `SELECT COALESCE(
        (SELECT balance FROM general_ledger 
         WHERE account_code = $1 
         ORDER BY created_at DESC LIMIT 1), 0
      ) as current_balance`,
      [line.account_code]
    );

    const currentBalance = parseFloat(balanceResult.rows[0].current_balance);
    const newBalance = currentBalance + line.debit - line.credit;

    // Insert GL entry
    await client.query(
      `INSERT INTO general_ledger (
        account_code, transaction_date, reference_type, reference_no,
        description, debit, credit, balance, journal_entry_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        line.account_code, new Date(), 'journal', journalEntryId,
        line.description, line.debit, line.credit, newBalance, journalEntryId
      ]
    );

    // Update account balance
    await client.query(
      `UPDATE chart_of_accounts 
       SET current_balance = $1, updated_at = CURRENT_TIMESTAMP
       WHERE account_code = $2`,
      [newBalance, line.account_code]
    );
  }
}

async function updateAccountsReceivable(client: any, invoice: any) {
  await client.query(
    `INSERT INTO accounts_receivable (
      customer_id, customer_name, invoice_id, invoice_no, invoice_date,
      due_date, original_amount, paid_amount, balance_amount, days_overdue,
      aging_bucket, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      invoice.customer_id,
      await getCustomerName(client, invoice.customer_id),
      invoice.id, invoice.invoice_no, invoice.invoice_date,
      invoice.due_date, invoice.total_amount, 0, invoice.total_amount, 0,
      '0-30', 'current'
    ]
  );
}

async function updateAccountsPayable(client: any, invoice: any) {
  await client.query(
    `INSERT INTO accounts_payable (
      supplier_id, supplier_name, bill_id, bill_no, bill_date,
      due_date, original_amount, paid_amount, balance_amount, days_until_due,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      invoice.supplier_id,
      await getSupplierName(client, invoice.supplier_id),
      invoice.id, invoice.invoice_no, invoice.invoice_date,
      invoice.due_date, invoice.total_amount, 0, invoice.total_amount,
      Math.ceil((invoice.due_date - invoice.invoice_date) / (1000 * 60 * 60 * 24)),
      'pending'
    ]
  );
}

async function getCustomerName(client: any, customerId: string): Promise<string> {
  const result = await client.query(
    'SELECT customer_name FROM customers WHERE id = $1',
    [customerId]
  );
  return result.rows[0]?.customer_name || 'Unknown Customer';
}

async function getSupplierName(client: any, supplierId: string): Promise<string> {
  const result = await client.query(
    'SELECT supplier_name FROM suppliers WHERE id = $1',
    [supplierId]
  );
  return result.rows[0]?.supplier_name || 'Unknown Supplier';
}

export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  const result = await query(
    `SELECT i.*, 
            json_agg(
              json_build_object(
                'id', ii.id,
                'itemId', ii.item_id,
                'description', ii.description,
                'quantity', ii.quantity,
                'unitPrice', ii.unit_price,
                'discountRate', ii.discount_rate,
                'discountAmount', ii.discount_amount,
                'taxRate', ii.tax_rate,
                'taxAmount', ii.tax_amount,
                'lineTotal', ii.line_total,
                'accountCode', ii.account_code
              )
            ) as items
     FROM invoices i
     LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
     WHERE i.id = $1
     GROUP BY i.id`,
    [invoiceId]
  );

  return result.rows[0] || null;
};

// Financial Reports
export const generateFinancialReport = async (request: FinancialReportRequest): Promise<any> => {
  const cacheKey = `report:${request.reportType}:${request.startDate}:${request.endDate}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  let reportData: any;

  switch (request.reportType) {
    case 'balance_sheet':
      reportData = await generateBalanceSheet(request.endDate);
      break;
    case 'income_statement':
      reportData = await generateIncomeStatement(request.startDate, request.endDate);
      break;
    case 'cash_flow':
      reportData = await generateCashFlow(request.startDate, request.endDate);
      break;
    case 'aged_receivables':
      reportData = await generateAgedReceivables(request.endDate);
      break;
    case 'aged_payables':
      reportData = await generateAgedPayables(request.endDate);
      break;
    default:
      throw new AppError('Invalid report type', 400);
  }

  const report = {
    reportType: request.reportType,
    reportName: getReportName(request.reportType),
    reportPeriod: {
      startDate: request.startDate,
      endDate: request.endDate
    },
    generatedDate: new Date(),
    data: reportData,
    format: request.format || 'json'
  };

  // Cache for 30 minutes
  await cache.set(cacheKey, report, 1800);

  return report;
};

async function generateBalanceSheet(asOfDate: Date): Promise<any> {
  // Assets
  const assetsResult = await query(
    `SELECT 
      coa.account_type,
      coa.account_subtype,
      coa.account_code,
      coa.account_name,
      coa.current_balance
     FROM chart_of_accounts coa
     WHERE coa.account_type IN ('asset')
       AND coa.is_active = true
     ORDER BY coa.account_code`
  );

  // Liabilities
  const liabilitiesResult = await query(
    `SELECT 
      coa.account_type,
      coa.account_subtype,
      coa.account_code,
      coa.account_name,
      coa.current_balance
     FROM chart_of_accounts coa
     WHERE coa.account_type IN ('liability')
       AND coa.is_active = true
     ORDER BY coa.account_code`
  );

  // Equity
  const equityResult = await query(
    `SELECT 
      coa.account_type,
      coa.account_subtype,
      coa.account_code,
      coa.account_name,
      coa.current_balance
     FROM chart_of_accounts coa
     WHERE coa.account_type IN ('equity')
       AND coa.is_active = true
     ORDER BY coa.account_code`
  );

  const totalAssets = assetsResult.rows.reduce((sum, row) => sum + parseFloat(row.current_balance), 0);
  const totalLiabilities = liabilitiesResult.rows.reduce((sum, row) => sum + parseFloat(row.current_balance), 0);
  const totalEquity = equityResult.rows.reduce((sum, row) => sum + parseFloat(row.current_balance), 0);

  return {
    asOfDate,
    assets: {
      accounts: assetsResult.rows,
      total: totalAssets
    },
    liabilities: {
      accounts: liabilitiesResult.rows,
      total: totalLiabilities
    },
    equity: {
      accounts: equityResult.rows,
      total: totalEquity
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
  };
}

async function generateIncomeStatement(startDate: Date, endDate: Date): Promise<any> {
  // Revenue
  const revenueResult = await query(
    `SELECT 
      coa.account_subtype,
      coa.account_code,
      coa.account_name,
      COALESCE(SUM(gl.credit - gl.debit), 0) as amount
     FROM chart_of_accounts coa
     LEFT JOIN general_ledger gl ON coa.account_code = gl.account_code
       AND gl.transaction_date BETWEEN $1 AND $2
     WHERE coa.account_type = 'revenue'
       AND coa.is_active = true
     GROUP BY coa.account_code, coa.account_name, coa.account_subtype
     ORDER BY coa.account_code`,
    [startDate, endDate]
  );

  // Expenses
  const expenseResult = await query(
    `SELECT 
      coa.account_subtype,
      coa.account_code,
      coa.account_name,
      COALESCE(SUM(gl.debit - gl.credit), 0) as amount
     FROM chart_of_accounts coa
     LEFT JOIN general_ledger gl ON coa.account_code = gl.account_code
       AND gl.transaction_date BETWEEN $1 AND $2
     WHERE coa.account_type = 'expense'
       AND coa.is_active = true
     GROUP BY coa.account_code, coa.account_name, coa.account_subtype
     ORDER BY coa.account_code`,
    [startDate, endDate]
  );

  const totalRevenue = revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
  const totalExpenses = expenseResult.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
  const netIncome = totalRevenue - totalExpenses;

  return {
    period: { startDate, endDate },
    revenue: {
      accounts: revenueResult.rows,
      total: totalRevenue
    },
    expenses: {
      accounts: expenseResult.rows,
      total: totalExpenses
    },
    netIncome,
    profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
  };
}

async function generateCashFlow(startDate: Date, endDate: Date): Promise<any> {
  // Operating activities
  const operatingResult = await query(
    `SELECT 
      cf.flow_type,
      cf.direction,
      cf.category,
      SUM(CASE WHEN cf.direction = 'inflow' THEN cf.amount ELSE -cf.amount END) as net_amount
     FROM cash_flows cf
     WHERE cf.flow_type = 'operating'
       AND cf.date BETWEEN $1 AND $2
     GROUP BY cf.flow_type, cf.direction, cf.category`,
    [startDate, endDate]
  );

  // Investing activities
  const investingResult = await query(
    `SELECT 
      cf.flow_type,
      cf.direction,
      cf.category,
      SUM(CASE WHEN cf.direction = 'inflow' THEN cf.amount ELSE -cf.amount END) as net_amount
     FROM cash_flows cf
     WHERE cf.flow_type = 'investing'
       AND cf.date BETWEEN $1 AND $2
     GROUP BY cf.flow_type, cf.direction, cf.category`,
    [startDate, endDate]
  );

  // Financing activities
  const financingResult = await query(
    `SELECT 
      cf.flow_type,
      cf.direction,
      cf.category,
      SUM(CASE WHEN cf.direction = 'inflow' THEN cf.amount ELSE -cf.amount END) as net_amount
     FROM cash_flows cf
     WHERE cf.flow_type = 'financing'
       AND cf.date BETWEEN $1 AND $2
     GROUP BY cf.flow_type, cf.direction, cf.category`,
    [startDate, endDate]
  );

  const operatingCashFlow = operatingResult.rows.reduce((sum, row) => sum + parseFloat(row.net_amount), 0);
  const investingCashFlow = investingResult.rows.reduce((sum, row) => sum + parseFloat(row.net_amount), 0);
  const financingCashFlow = financingResult.rows.reduce((sum, row) => sum + parseFloat(row.net_amount), 0);

  return {
    period: { startDate, endDate },
    operating: {
      activities: operatingResult.rows,
      total: operatingCashFlow
    },
    investing: {
      activities: investingResult.rows,
      total: investingCashFlow
    },
    financing: {
      activities: financingResult.rows,
      total: financingCashFlow
    },
    netCashFlow: operatingCashFlow + investingCashFlow + financingCashFlow
  };
}

async function generateAgedReceivables(asOfDate: Date): Promise<any> {
  const result = await query(
    `SELECT 
      ar.aging_bucket,
      COUNT(*) as invoice_count,
      SUM(ar.balance_amount) as total_amount,
      json_agg(
        json_build_object(
          'customerId', ar.customer_id,
          'customerName', ar.customer_name,
          'invoiceNo', ar.invoice_no,
          'invoiceDate', ar.invoice_date,
          'dueDate', ar.due_date,
          'balanceAmount', ar.balance_amount,
          'daysOverdue', ar.days_overdue
        )
      ) as details
     FROM accounts_receivable ar
     WHERE ar.balance_amount > 0
       AND ar.status != 'written_off'
     GROUP BY ar.aging_bucket
     ORDER BY 
       CASE ar.aging_bucket 
         WHEN '0-30' THEN 1
         WHEN '31-60' THEN 2
         WHEN '61-90' THEN 3
         WHEN '91-120' THEN 4
         WHEN '120+' THEN 5
       END`
  );

  const totalReceivables = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

  return {
    asOfDate,
    agingBuckets: result.rows,
    totalReceivables,
    summary: {
      current: result.rows.find(r => r.aging_bucket === '0-30')?.total_amount || 0,
      overdue30: result.rows.find(r => r.aging_bucket === '31-60')?.total_amount || 0,
      overdue60: result.rows.find(r => r.aging_bucket === '61-90')?.total_amount || 0,
      overdue90: result.rows.find(r => r.aging_bucket === '91-120')?.total_amount || 0,
      overdue120: result.rows.find(r => r.aging_bucket === '120+')?.total_amount || 0
    }
  };
}

async function generateAgedPayables(asOfDate: Date): Promise<any> {
  const result = await query(
    `SELECT 
      CASE 
        WHEN ap.days_until_due > 30 THEN '30+'
        WHEN ap.days_until_due > 0 THEN '1-30'
        WHEN ap.days_until_due > -30 THEN 'Due'
        WHEN ap.days_until_due > -60 THEN 'Overdue 1-30'
        WHEN ap.days_until_due > -90 THEN 'Overdue 31-60'
        ELSE 'Overdue 60+'
      END as aging_bucket,
      COUNT(*) as bill_count,
      SUM(ap.balance_amount) as total_amount,
      json_agg(
        json_build_object(
          'supplierId', ap.supplier_id,
          'supplierName', ap.supplier_name,
          'billNo', ap.bill_no,
          'billDate', ap.bill_date,
          'dueDate', ap.due_date,
          'balanceAmount', ap.balance_amount,
          'daysUntilDue', ap.days_until_due
        )
      ) as details
     FROM accounts_payable ap
     WHERE ap.balance_amount > 0
       AND ap.status != 'disputed'
     GROUP BY aging_bucket
     ORDER BY 
       CASE aging_bucket
         WHEN '30+' THEN 1
         WHEN '1-30' THEN 2
         WHEN 'Due' THEN 3
         WHEN 'Overdue 1-30' THEN 4
         WHEN 'Overdue 31-60' THEN 5
         WHEN 'Overdue 60+' THEN 6
       END`
  );

  const totalPayables = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

  return {
    asOfDate,
    agingBuckets: result.rows,
    totalPayables,
    summary: {
      notDue: result.rows.filter(r => r.aging_bucket.includes('30+') || r.aging_bucket === '1-30')
        .reduce((sum, r) => sum + parseFloat(r.total_amount), 0),
      due: result.rows.find(r => r.aging_bucket === 'Due')?.total_amount || 0,
      overdue: result.rows.filter(r => r.aging_bucket.includes('Overdue'))
        .reduce((sum, r) => sum + parseFloat(r.total_amount), 0)
    }
  };
}

function getReportName(reportType: string): string {
  const reportNames: Record<string, string> = {
    balance_sheet: 'Balance Sheet',
    income_statement: 'Income Statement',
    cash_flow: 'Cash Flow Statement',
    aged_receivables: 'Aged Receivables Report',
    aged_payables: 'Aged Payables Report',
    trial_balance: 'Trial Balance',
    general_ledger: 'General Ledger Report'
  };
  return reportNames[reportType] || 'Financial Report';
}

// Tax Calculation
export const calculateTax = async (request: TaxCalculationRequest): Promise<TaxCalculationResponse> => {
  const taxDetails = [];
  let subtotal = 0;
  let totalTax = 0;

  for (const item of request.items) {
    // Get tax rate
    const taxResult = await query(
      'SELECT * FROM tax_rates WHERE tax_code = $1 AND is_active = true',
      [item.taxCode]
    );

    if (!taxResult.rows.length) {
      throw new AppError(`Tax code ${item.taxCode} not found`, 404);
    }

    const taxRate = taxResult.rows[0];
    const amount = item.amount * (item.quantity || 1);
    
    let taxAmount: number;
    let taxableAmount: number;

    if (request.isInclusive || taxRate.is_inclusive) {
      // Tax inclusive calculation
      taxableAmount = amount / (1 + taxRate.rate / 100);
      taxAmount = amount - taxableAmount;
    } else {
      // Tax exclusive calculation
      taxableAmount = amount;
      taxAmount = amount * (taxRate.rate / 100);
    }

    subtotal += taxableAmount;
    totalTax += taxAmount;

    taxDetails.push({
      taxCode: taxRate.tax_code,
      taxName: taxRate.tax_name,
      rate: taxRate.rate,
      taxAmount
    });
  }

  return {
    subtotal,
    taxDetails,
    totalTax,
    totalAmount: subtotal + totalTax
  };
};