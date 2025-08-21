import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test data builders for FA-AR module
export const testDataBuilders = {
  createTestInvoice: (overrides = {}) => ({
    invoice_id: 'INV_TEST_001',
    invoice_number: 'INV-2025-08-001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    customer_type: 'company',
    issue_date: new Date('2025-08-01'),
    due_date: new Date('2025-08-31'),
    payment_terms: 'net_30',
    status: 'pending',
    currency: 'TWD',
    subtotal: 100000,
    tax_rate: 0.05,
    tax_amount: 5000,
    discount_amount: 2000,
    total_amount: 103000,
    paid_amount: 0,
    balance_due: 103000,
    items: [
      {
        item_id: 'ITEM_001',
        product_id: 'PROD_001',
        product_name: '產品A',
        quantity: 100,
        unit_price: 500,
        discount_rate: 0,
        tax_rate: 0.05,
        amount: 50000,
      },
      {
        item_id: 'ITEM_002',
        product_id: 'PROD_002',
        product_name: '產品B',
        quantity: 50,
        unit_price: 1000,
        discount_rate: 0.04,
        tax_rate: 0.05,
        amount: 48000,
      },
    ],
    billing_address: {
      street: '測試路100號',
      city: '台北市',
      state: '台灣',
      postal_code: '10058',
      country: 'TW',
    },
    notes: '月結30天',
    attachments: [],
    created_by: 'USER_001',
    created_at: new Date('2025-08-01'),
    updated_at: new Date('2025-08-01'),
    ...overrides,
  }),

  createTestPayment: (overrides = {}) => ({
    payment_id: 'PAY_TEST_001',
    payment_number: 'PAY-2025-08-001',
    invoice_id: 'INV_TEST_001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    payment_date: new Date('2025-08-15'),
    payment_method: 'bank_transfer',
    payment_type: 'partial',
    amount: 50000,
    currency: 'TWD',
    reference_number: 'REF-2025-08-001',
    bank_account: '123-456-789',
    bank_name: '測試銀行',
    transaction_fee: 30,
    net_amount: 49970,
    status: 'completed',
    reconciliation_status: 'matched',
    reconciliation_date: new Date('2025-08-16'),
    notes: '部分付款',
    attachments: ['receipt_001.pdf'],
    created_by: 'USER_001',
    created_at: new Date('2025-08-15'),
    updated_at: new Date('2025-08-16'),
    ...overrides,
  }),

  createTestCustomerAccount: (overrides = {}) => ({
    account_id: 'ACC_TEST_001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    customer_type: 'company',
    credit_limit: 500000,
    credit_used: 150000,
    credit_available: 350000,
    payment_terms: 'net_30',
    discount_rate: 0.02,
    tax_exempt: false,
    tax_id: '12345678',
    currency: 'TWD',
    account_status: 'active',
    risk_level: 'low',
    aging_summary: {
      current: 50000,
      overdue_1_30: 30000,
      overdue_31_60: 20000,
      overdue_61_90: 0,
      overdue_over_90: 0,
      total_outstanding: 100000,
    },
    payment_history: {
      on_time_rate: 0.85,
      average_days_to_pay: 28,
      total_paid: 1500000,
      total_invoices: 45,
      last_payment_date: new Date('2025-08-15'),
    },
    contact_info: {
      primary_contact: '張經理',
      phone: '02-1234-5678',
      email: 'contact@test.com',
      billing_email: 'billing@test.com',
    },
    notes: '優良客戶',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestCreditMemo: (overrides = {}) => ({
    credit_memo_id: 'CM_TEST_001',
    credit_memo_number: 'CM-2025-08-001',
    original_invoice_id: 'INV_TEST_001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    issue_date: new Date('2025-08-10'),
    reason: 'product_return',
    status: 'approved',
    currency: 'TWD',
    credit_amount: 10000,
    tax_amount: 500,
    total_amount: 10500,
    applied_amount: 0,
    balance: 10500,
    items: [
      {
        item_id: 'CM_ITEM_001',
        product_id: 'PROD_001',
        product_name: '產品A',
        quantity: 10,
        unit_price: 500,
        amount: 5000,
        reason: '品質問題退貨',
      },
    ],
    approval_info: {
      approved_by: 'MANAGER_001',
      approved_date: new Date('2025-08-10'),
      approval_notes: '已確認退貨',
    },
    created_by: 'USER_001',
    created_at: new Date('2025-08-10'),
    updated_at: new Date('2025-08-10'),
    ...overrides,
  }),

  createTestStatement: (overrides = {}) => ({
    statement_id: 'STMT_TEST_001',
    statement_number: 'STMT-2025-08-001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    statement_date: new Date('2025-08-31'),
    period_start: new Date('2025-08-01'),
    period_end: new Date('2025-08-31'),
    currency: 'TWD',
    opening_balance: 80000,
    total_invoiced: 150000,
    total_payments: 100000,
    total_credits: 10000,
    closing_balance: 120000,
    overdue_amount: 30000,
    transactions: [
      {
        date: new Date('2025-08-01'),
        type: 'opening_balance',
        reference: '',
        description: '期初餘額',
        debit: 80000,
        credit: 0,
        balance: 80000,
      },
      {
        date: new Date('2025-08-05'),
        type: 'invoice',
        reference: 'INV-2025-08-001',
        description: '銷售發票',
        debit: 103000,
        credit: 0,
        balance: 183000,
      },
      {
        date: new Date('2025-08-15'),
        type: 'payment',
        reference: 'PAY-2025-08-001',
        description: '付款',
        debit: 0,
        credit: 50000,
        balance: 133000,
      },
    ],
    aging_details: [
      {
        invoice_number: 'INV-2025-07-015',
        invoice_date: new Date('2025-07-15'),
        due_date: new Date('2025-08-15'),
        amount: 30000,
        days_overdue: 5,
      },
    ],
    sent_date: null,
    sent_to: null,
    created_at: new Date('2025-08-31'),
    updated_at: new Date('2025-08-31'),
    ...overrides,
  }),

  createTestCollection: (overrides = {}) => ({
    collection_id: 'COLL_TEST_001',
    case_number: 'COLL-2025-08-001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    total_outstanding: 50000,
    overdue_amount: 50000,
    days_overdue: 45,
    collection_status: 'in_progress',
    priority: 'high',
    assigned_to: 'COLLECTOR_001',
    collector_name: '收款專員A',
    actions: [
      {
        action_id: 'ACT_001',
        action_date: new Date('2025-08-10'),
        action_type: 'phone_call',
        description: '電話催收',
        result: '承諾8/20付款',
        next_action_date: new Date('2025-08-20'),
        performed_by: 'COLLECTOR_001',
      },
      {
        action_id: 'ACT_002',
        action_date: new Date('2025-08-15'),
        action_type: 'email',
        description: '發送催收通知',
        result: '已發送',
        next_action_date: new Date('2025-08-18'),
        performed_by: 'COLLECTOR_001',
      },
    ],
    invoices: [
      {
        invoice_number: 'INV-2025-07-001',
        amount: 50000,
        due_date: new Date('2025-07-31'),
        days_overdue: 20,
      },
    ],
    payment_plan: null,
    legal_action: false,
    notes: '客戶承諾月底前清償',
    created_at: new Date('2025-08-10'),
    updated_at: new Date('2025-08-15'),
    ...overrides,
  }),

  createTestReconciliation: (overrides = {}) => ({
    reconciliation_id: 'REC_TEST_001',
    reconciliation_date: new Date('2025-08-20'),
    period_start: new Date('2025-08-01'),
    period_end: new Date('2025-08-20'),
    status: 'in_progress',
    bank_account: '123-456-789',
    bank_name: '測試銀行',
    starting_balance: 1000000,
    ending_balance: 1250000,
    total_deposits: 350000,
    total_withdrawals: 100000,
    matched_transactions: 45,
    unmatched_transactions: 3,
    discrepancies: [
      {
        date: new Date('2025-08-15'),
        bank_amount: 50000,
        system_amount: 49970,
        difference: 30,
        type: 'deposit',
        status: 'investigating',
        notes: '可能是手續費',
      },
    ],
    bank_transactions: [
      {
        date: new Date('2025-08-15'),
        reference: 'DEP-001',
        description: '客戶付款',
        amount: 50000,
        type: 'deposit',
        matched: true,
        matched_payment_id: 'PAY_TEST_001',
      },
    ],
    adjustments: [],
    reconciled_by: 'USER_001',
    approved_by: null,
    created_at: new Date('2025-08-20'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestAgingReport: (overrides = {}) => ({
    report_id: 'AGE_TEST_001',
    report_date: new Date('2025-08-20'),
    currency: 'TWD',
    summary: {
      current: 500000,
      overdue_1_30: 150000,
      overdue_31_60: 80000,
      overdue_61_90: 30000,
      overdue_over_90: 20000,
      total_outstanding: 780000,
    },
    details: [
      {
        customer_id: 'CUST_001',
        customer_name: '測試客戶A',
        credit_limit: 500000,
        current: 50000,
        overdue_1_30: 30000,
        overdue_31_60: 20000,
        overdue_61_90: 0,
        overdue_over_90: 0,
        total: 100000,
        percentage: 12.8,
      },
      {
        customer_id: 'CUST_002',
        customer_name: '測試客戶B',
        credit_limit: 300000,
        current: 100000,
        overdue_1_30: 50000,
        overdue_31_60: 0,
        overdue_61_90: 0,
        overdue_over_90: 0,
        total: 150000,
        percentage: 19.2,
      },
    ],
    risk_analysis: {
      high_risk_amount: 50000,
      medium_risk_amount: 100000,
      low_risk_amount: 630000,
      collection_rate: 0.92,
      average_days_outstanding: 35,
    },
    generated_by: 'SYSTEM',
    created_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestTaxReport: (overrides = {}) => ({
    report_id: 'TAX_TEST_001',
    report_type: 'output_tax',
    period_type: 'monthly',
    period_start: new Date('2025-08-01'),
    period_end: new Date('2025-08-31'),
    tax_rate: 0.05,
    currency: 'TWD',
    summary: {
      total_sales: 2000000,
      taxable_sales: 1900000,
      tax_exempt_sales: 100000,
      total_tax_collected: 95000,
      tax_credits: 5000,
      net_tax_payable: 90000,
    },
    transactions: [
      {
        date: new Date('2025-08-05'),
        invoice_number: 'INV-2025-08-001',
        customer_name: '測試客戶A',
        amount: 100000,
        tax_amount: 5000,
        tax_rate: 0.05,
      },
    ],
    filing_status: 'draft',
    filing_deadline: new Date('2025-09-15'),
    filed_date: null,
    filed_by: null,
    reference_number: null,
    created_at: new Date('2025-08-31'),
    updated_at: new Date('2025-08-31'),
    ...overrides,
  }),

  createTestDunningLetter: (overrides = {}) => ({
    letter_id: 'DUN_TEST_001',
    letter_number: 'DUN-2025-08-001',
    customer_id: 'CUST_001',
    customer_name: '測試客戶A',
    letter_type: 'reminder_1',
    template_id: 'TMPL_REMINDER_1',
    send_date: new Date('2025-08-20'),
    due_amount: 50000,
    days_overdue: 20,
    invoices: [
      {
        invoice_number: 'INV-2025-07-001',
        amount: 50000,
        due_date: new Date('2025-07-31'),
      },
    ],
    message: '貴公司尚有款項未付，請儘速處理。',
    delivery_method: 'email',
    delivery_status: 'sent',
    recipient_email: 'billing@test.com',
    response_deadline: new Date('2025-08-27'),
    response_received: false,
    created_by: 'SYSTEM',
    created_at: new Date('2025-08-20'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),
};

// Mock API handlers
export const mockApiHandlers = {
  getInvoices: vi.fn(() => Promise.resolve({
    invoices: [testDataBuilders.createTestInvoice()],
    total: 1,
    page: 1,
    limit: 20,
  })),

  getInvoice: vi.fn((id) => Promise.resolve(
    testDataBuilders.createTestInvoice({ invoice_id: id })
  )),

  createInvoice: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestInvoice(data)
  )),

  updateInvoice: vi.fn((id, data) => Promise.resolve({
    ...testDataBuilders.createTestInvoice({ invoice_id: id }),
    ...data,
  })),

  getPayments: vi.fn(() => Promise.resolve({
    payments: [testDataBuilders.createTestPayment()],
    total: 1,
    page: 1,
    limit: 20,
  })),

  recordPayment: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestPayment(data)
  )),

  getCustomerAccount: vi.fn((customerId) => Promise.resolve(
    testDataBuilders.createTestCustomerAccount({ customer_id: customerId })
  )),

  getAgingReport: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestAgingReport()
  )),

  getStatement: vi.fn((customerId) => Promise.resolve(
    testDataBuilders.createTestStatement({ customer_id: customerId })
  )),

  getReconciliation: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestReconciliation()
  )),
};

// Global test setup
beforeAll(() => {
  // Setup any global test configuration
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});