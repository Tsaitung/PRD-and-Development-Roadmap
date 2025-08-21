import { rest } from 'msw';
import { testDataBuilders } from '../setup';

export const financeApiHandlers = [
  // Invoice endpoints
  rest.get('/api/v1/invoices', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const customerId = req.url.searchParams.get('customer_id');
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 20;

    let invoices = [
      testDataBuilders.createTestInvoice(),
      testDataBuilders.createTestInvoice({
        invoice_id: 'INV_002',
        invoice_number: 'INV-2025-08-002',
        status: 'paid',
        paid_amount: 103000,
        balance_due: 0,
      }),
      testDataBuilders.createTestInvoice({
        invoice_id: 'INV_003',
        invoice_number: 'INV-2025-08-003',
        status: 'overdue',
        due_date: new Date('2025-07-31'),
      }),
    ];

    // Apply filters
    if (status) {
      invoices = invoices.filter(inv => inv.status === status);
    }
    if (customerId) {
      invoices = invoices.filter(inv => inv.customer_id === customerId);
    }

    return res(
      ctx.json({
        invoices: invoices.slice((page - 1) * limit, page * limit),
        total: invoices.length,
        page,
        limit,
      })
    );
  }),

  rest.get('/api/v1/invoices/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestInvoice({ invoice_id: id }))
    );
  }),

  rest.post('/api/v1/invoices', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestInvoice({
        ...body,
        invoice_id: `INV_${Date.now()}`,
        invoice_number: `INV-2025-08-${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/invoices/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestInvoice({ invoice_id: id }),
        ...body,
        updated_at: new Date(),
      })
    );
  }),

  rest.delete('/api/v1/invoices/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json({ success: true, invoice_id: id })
    );
  }),

  rest.post('/api/v1/invoices/:id/send', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        invoice_id: id,
        sent_to: body.email,
        sent_date: new Date(),
        status: 'sent',
      })
    );
  }),

  rest.post('/api/v1/invoices/:id/void', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        invoice_id: id,
        status: 'voided',
        void_reason: body.reason,
        voided_by: body.user_id,
        voided_at: new Date(),
      })
    );
  }),

  // Payment endpoints
  rest.get('/api/v1/payments', (req, res, ctx) => {
    const customerId = req.url.searchParams.get('customer_id');
    const invoiceId = req.url.searchParams.get('invoice_id');
    const dateFrom = req.url.searchParams.get('date_from');
    const dateTo = req.url.searchParams.get('date_to');

    let payments = [
      testDataBuilders.createTestPayment(),
      testDataBuilders.createTestPayment({
        payment_id: 'PAY_002',
        payment_number: 'PAY-2025-08-002',
        amount: 53000,
        payment_type: 'full',
      }),
    ];

    if (customerId) {
      payments = payments.filter(p => p.customer_id === customerId);
    }
    if (invoiceId) {
      payments = payments.filter(p => p.invoice_id === invoiceId);
    }

    return res(
      ctx.json({
        payments,
        total: payments.length,
      })
    );
  }),

  rest.get('/api/v1/payments/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestPayment({ payment_id: id }))
    );
  }),

  rest.post('/api/v1/payments', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestPayment({
        ...body,
        payment_id: `PAY_${Date.now()}`,
        payment_number: `PAY-2025-08-${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/payments/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestPayment({ payment_id: id }),
        ...body,
        updated_at: new Date(),
      })
    );
  }),

  rest.post('/api/v1/payments/:id/refund', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        refund_id: `REF_${Date.now()}`,
        payment_id: id,
        amount: body.amount,
        reason: body.reason,
        status: 'processing',
        created_at: new Date(),
      })
    );
  }),

  // Customer account endpoints
  rest.get('/api/v1/customers/:customerId/account', (req, res, ctx) => {
    const { customerId } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestCustomerAccount({ 
        customer_id: customerId 
      }))
    );
  }),

  rest.put('/api/v1/customers/:customerId/credit-limit', (req, res, ctx) => {
    const { customerId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        customer_id: customerId,
        credit_limit: body.credit_limit,
        approved_by: body.approved_by,
        approved_at: new Date(),
      })
    );
  }),

  // Credit memo endpoints
  rest.get('/api/v1/credit-memos', (req, res, ctx) => {
    const customerId = req.url.searchParams.get('customer_id');
    const status = req.url.searchParams.get('status');

    let creditMemos = [
      testDataBuilders.createTestCreditMemo(),
      testDataBuilders.createTestCreditMemo({
        credit_memo_id: 'CM_002',
        credit_memo_number: 'CM-2025-08-002',
        status: 'applied',
        applied_amount: 10500,
        balance: 0,
      }),
    ];

    if (customerId) {
      creditMemos = creditMemos.filter(cm => cm.customer_id === customerId);
    }
    if (status) {
      creditMemos = creditMemos.filter(cm => cm.status === status);
    }

    return res(ctx.json({ credit_memos: creditMemos }));
  }),

  rest.post('/api/v1/credit-memos', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestCreditMemo({
        ...body,
        credit_memo_id: `CM_${Date.now()}`,
        credit_memo_number: `CM-2025-08-${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.post('/api/v1/credit-memos/:id/apply', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        credit_memo_id: id,
        invoice_id: body.invoice_id,
        applied_amount: body.amount,
        applied_date: new Date(),
      })
    );
  }),

  // Statement endpoints
  rest.get('/api/v1/statements', (req, res, ctx) => {
    const customerId = req.url.searchParams.get('customer_id');
    const month = req.url.searchParams.get('month');

    const statements = [
      testDataBuilders.createTestStatement(),
      testDataBuilders.createTestStatement({
        statement_id: 'STMT_002',
        statement_number: 'STMT-2025-07-001',
        period_start: new Date('2025-07-01'),
        period_end: new Date('2025-07-31'),
      }),
    ];

    return res(ctx.json({ statements }));
  }),

  rest.post('/api/v1/statements/generate', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestStatement({
        customer_id: body.customer_id,
        period_start: new Date(body.period_start),
        period_end: new Date(body.period_end),
        statement_id: `STMT_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.post('/api/v1/statements/:id/send', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        statement_id: id,
        sent_to: body.email,
        sent_date: new Date(),
        delivery_method: body.method || 'email',
      })
    );
  }),

  // Collection endpoints
  rest.get('/api/v1/collections', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const priority = req.url.searchParams.get('priority');

    let collections = [
      testDataBuilders.createTestCollection(),
      testDataBuilders.createTestCollection({
        collection_id: 'COLL_002',
        case_number: 'COLL-2025-08-002',
        collection_status: 'resolved',
        priority: 'medium',
      }),
    ];

    if (status) {
      collections = collections.filter(c => c.collection_status === status);
    }
    if (priority) {
      collections = collections.filter(c => c.priority === priority);
    }

    return res(ctx.json({ collections }));
  }),

  rest.get('/api/v1/collections/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestCollection({ collection_id: id }))
    );
  }),

  rest.post('/api/v1/collections/:id/actions', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        collection_id: id,
        action_id: `ACT_${Date.now()}`,
        ...body,
        created_at: new Date(),
      })
    );
  }),

  rest.post('/api/v1/collections/:id/payment-plan', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        collection_id: id,
        plan_id: `PLAN_${Date.now()}`,
        installments: body.installments,
        status: 'active',
        created_at: new Date(),
      })
    );
  }),

  // Reconciliation endpoints
  rest.get('/api/v1/reconciliations', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const month = req.url.searchParams.get('month');

    const reconciliations = [
      testDataBuilders.createTestReconciliation(),
      testDataBuilders.createTestReconciliation({
        reconciliation_id: 'REC_002',
        status: 'completed',
        matched_transactions: 50,
        unmatched_transactions: 0,
      }),
    ];

    return res(ctx.json({ reconciliations }));
  }),

  rest.get('/api/v1/reconciliations/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestReconciliation({ 
        reconciliation_id: id 
      }))
    );
  }),

  rest.post('/api/v1/reconciliations', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestReconciliation({
        ...body,
        reconciliation_id: `REC_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.post('/api/v1/reconciliations/:id/match', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        reconciliation_id: id,
        bank_transaction_id: body.bank_transaction_id,
        payment_id: body.payment_id,
        matched: true,
        matched_at: new Date(),
      })
    );
  }),

  rest.put('/api/v1/reconciliations/:id/complete', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        reconciliation_id: id,
        status: 'completed',
        completed_by: body.user_id,
        completed_at: new Date(),
      })
    );
  }),

  // Report endpoints
  rest.get('/api/v1/reports/aging', (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    
    return res(
      ctx.json(testDataBuilders.createTestAgingReport({
        report_date: date ? new Date(date) : new Date(),
      }))
    );
  }),

  rest.get('/api/v1/reports/tax', (req, res, ctx) => {
    const periodStart = req.url.searchParams.get('period_start');
    const periodEnd = req.url.searchParams.get('period_end');
    
    return res(
      ctx.json(testDataBuilders.createTestTaxReport({
        period_start: periodStart ? new Date(periodStart) : new Date('2025-08-01'),
        period_end: periodEnd ? new Date(periodEnd) : new Date('2025-08-31'),
      }))
    );
  }),

  rest.post('/api/v1/reports/tax/:id/file', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        report_id: id,
        filing_status: 'filed',
        filed_date: new Date(),
        filed_by: body.user_id,
        reference_number: `TAX-REF-${Date.now()}`,
      })
    );
  }),

  // Dunning letter endpoints
  rest.get('/api/v1/dunning-letters', (req, res, ctx) => {
    const customerId = req.url.searchParams.get('customer_id');
    const status = req.url.searchParams.get('status');

    let letters = [
      testDataBuilders.createTestDunningLetter(),
      testDataBuilders.createTestDunningLetter({
        letter_id: 'DUN_002',
        letter_number: 'DUN-2025-08-002',
        letter_type: 'reminder_2',
        days_overdue: 40,
      }),
    ];

    if (customerId) {
      letters = letters.filter(l => l.customer_id === customerId);
    }

    return res(ctx.json({ dunning_letters: letters }));
  }),

  rest.post('/api/v1/dunning-letters', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDunningLetter({
        ...body,
        letter_id: `DUN_${Date.now()}`,
        letter_number: `DUN-2025-08-${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.post('/api/v1/dunning-letters/:id/send', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        letter_id: id,
        delivery_status: 'sent',
        sent_date: new Date(),
        sent_to: body.email,
      })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/v1/ar/dashboard', (req, res, ctx) => {
    return res(
      ctx.json({
        total_outstanding: 780000,
        overdue_amount: 280000,
        current_month_invoiced: 500000,
        current_month_collected: 420000,
        collection_rate: 0.84,
        average_days_to_pay: 32,
        customers_at_risk: 5,
        pending_approvals: 3,
      })
    );
  }),

  // Export endpoints
  rest.post('/api/v1/ar/export', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json({
        file_url: '/exports/ar_report_20250820.xlsx',
        format: body.format || 'excel',
        record_count: body.type === 'invoices' ? 150 : 100,
        created_at: new Date(),
      })
    );
  }),
];