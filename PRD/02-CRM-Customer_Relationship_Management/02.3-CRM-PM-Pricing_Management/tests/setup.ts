import { vi } from 'vitest';
import { testDataFactory } from '@/PRD/test-infrastructure/test-utils/test-data-factory';

// CRM-PM specific test data builders
export const testDataBuilders = {
  // Create test price table entry
  createTestPriceTable: (overrides = {}) => ({
    price_id: 'PRC_TEST_001',
    customer_id: 'CUS_TEST_001',
    customer_type: 'company' as const,
    product_id: 'PROD_TEST_001',
    product_name: '測試商品A',
    price: 100,
    discount_rate: 0.95,
    price_type: 'special' as const,
    effective_date: new Date('2025-01-01'),
    expiry_date: new Date('2025-12-31'),
    priority: 1,
    status: 'active' as const,
    created_by: 'USER_001',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  }),

  // Create market price item
  createTestMarketPriceItem: (overrides = {}) => ({
    item_id: 'MKT_TEST_001',
    product_id: 'PROD_MKT_001',
    product_name: '時價商品A',
    date: new Date('2025-08-20'),
    market_price: 150,
    source: '市場報價系統',
    status: 'pending' as const,
    applied_orders: [],
    created_at: new Date('2025-08-20'),
    updated_by: 'SYSTEM',
    ...overrides,
  }),

  // Create price history record
  createTestPriceHistory: (overrides = {}) => ({
    history_id: 'HIST_TEST_001',
    price_id: 'PRC_TEST_001',
    old_price: 100,
    new_price: 110,
    change_reason: '成本上漲調整',
    changed_by: 'USER_001',
    changed_at: new Date('2025-08-15'),
    approval_status: 'approved',
    approved_by: 'MANAGER_001',
    ...overrides,
  }),

  // Create price adjustment batch
  createTestPriceAdjustment: (overrides = {}) => ({
    adjustment_id: 'ADJ_TEST_001',
    adjustment_type: 'percentage' as const,
    adjustment_value: 5,
    scope: {
      customer_ids: ['CUS_TEST_001', 'CUS_TEST_002'],
      product_ids: ['PROD_001', 'PROD_002'],
      categories: ['CAT_001'],
    },
    effective_date: new Date('2025-09-01'),
    status: 'pending' as const,
    created_by: 'USER_001',
    created_at: new Date('2025-08-20'),
    ...overrides,
  }),

  // Create price approval request
  createTestPriceApproval: (overrides = {}) => ({
    approval_id: 'APR_TEST_001',
    price_changes: [
      {
        price_id: 'PRC_TEST_001',
        old_price: 100,
        new_price: 120,
        product_name: '測試商品A',
      },
    ],
    request_reason: '市場競爭調整',
    impact_analysis: {
      affected_customers: 10,
      revenue_impact: -5000,
      margin_impact: 2,
    },
    requested_by: 'USER_001',
    requested_at: new Date('2025-08-20'),
    status: 'pending' as const,
    ...overrides,
  }),

  // Create pricing rule
  createTestPricingRule: (overrides = {}) => ({
    rule_id: 'RULE_TEST_001',
    rule_name: '大量採購折扣',
    rule_type: 'volume_discount' as const,
    conditions: {
      min_quantity: 100,
      max_quantity: 500,
      customer_type: ['company', 'enterprise'],
    },
    actions: {
      discount_type: 'percentage',
      discount_value: 5,
    },
    priority: 10,
    active: true,
    effective_date: new Date('2025-01-01'),
    expiry_date: new Date('2025-12-31'),
    ...overrides,
  }),

  // Create complex pricing scenario
  createTestPricingScenario: () => ({
    enterprise: {
      customer_id: 'ENT_001',
      customer_type: 'enterprise',
      customer_name: '測試企業集團',
      prices: [
        testDataBuilders.createTestPriceTable({
          customer_id: 'ENT_001',
          customer_type: 'enterprise',
          priority: 3,
          price: 95,
        }),
      ],
    },
    company: {
      customer_id: 'COM_001',
      customer_type: 'company',
      customer_name: '測試有限公司',
      parent_id: 'ENT_001',
      prices: [
        testDataBuilders.createTestPriceTable({
          customer_id: 'COM_001',
          customer_type: 'company',
          priority: 2,
          price: 98,
        }),
      ],
    },
    store: {
      customer_id: 'STO_001',
      customer_type: 'store',
      customer_name: '測試門市',
      parent_id: 'COM_001',
      prices: [
        testDataBuilders.createTestPriceTable({
          customer_id: 'STO_001',
          customer_type: 'store',
          priority: 1,
          price: 100,
        }),
      ],
    },
  }),

  // Create batch price import data
  createTestBatchImport: (count = 10) => ({
    import_id: 'IMP_TEST_001',
    file_name: 'price_import_20250820.xlsx',
    total_records: count,
    items: Array.from({ length: count }, (_, i) => ({
      row: i + 2,
      customer_id: `CUS_${String(i + 1).padStart(3, '0')}`,
      product_id: `PROD_${String(i + 1).padStart(3, '0')}`,
      price: 100 + i * 10,
      effective_date: '2025-09-01',
      validation_status: 'valid',
    })),
    uploaded_by: 'USER_001',
    uploaded_at: new Date('2025-08-20'),
  }),
};

// Mock timers for date-sensitive tests
export const setupTimers = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-08-20'));
  return () => vi.useRealTimers();
};

// Mock localStorage for pricing cache
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  global.localStorage = {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    length: Object.keys(store).length,
  } as Storage;
};

// Setup common mocks
export const setupCommonMocks = () => {
  mockLocalStorage();
  
  // Mock window.confirm for price changes
  global.confirm = vi.fn(() => true);
  
  // Mock window.alert for notifications
  global.alert = vi.fn();
  
  // Mock console methods
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };
};