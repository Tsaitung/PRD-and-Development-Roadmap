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

// Test data builders for WMS-IOD module
export const testDataBuilders = {
  createTestInventoryItem: (overrides = {}) => ({
    item_id: 'INV_TEST_001',
    sku: 'SKU_TEST_001',
    product_name: '測試商品A',
    category: '生鮮蔬果',
    unit: '公斤',
    current_stock: 500,
    available_stock: 450,
    reserved_stock: 50,
    safety_stock: 100,
    reorder_point: 150,
    max_stock: 1000,
    location: 'A-01-02',
    warehouse_id: 'WH_001',
    warehouse_name: '北區倉庫',
    last_updated: new Date('2025-08-20T10:00:00'),
    status: 'normal',
    expiry_date: new Date('2025-09-20'),
    batch_number: 'BATCH_20250820_001',
    supplier_id: 'SUP_001',
    supplier_name: '供應商A',
    unit_cost: 50,
    total_value: 25000,
    ...overrides,
  }),

  createTestWarehouse: (overrides = {}) => ({
    warehouse_id: 'WH_TEST_001',
    warehouse_name: '測試倉庫',
    warehouse_type: 'main',
    location: '台北市信義區',
    capacity: 10000,
    used_capacity: 6500,
    available_capacity: 3500,
    manager: '王經理',
    contact: '02-1234-5678',
    status: 'active',
    temperature_controlled: true,
    ...overrides,
  }),

  createTestStockMovement: (overrides = {}) => ({
    movement_id: 'MOV_TEST_001',
    movement_type: 'inbound',
    item_id: 'INV_TEST_001',
    quantity: 100,
    from_location: null,
    to_location: 'A-01-02',
    reference_type: 'purchase_order',
    reference_id: 'PO_001',
    created_by: 'USER_001',
    created_at: new Date('2025-08-20T09:00:00'),
    notes: '採購入庫',
    status: 'completed',
    ...overrides,
  }),

  createTestStockAlert: (overrides = {}) => ({
    alert_id: 'ALERT_TEST_001',
    alert_type: 'low_stock',
    item_id: 'INV_TEST_001',
    product_name: '測試商品A',
    current_stock: 80,
    threshold: 100,
    severity: 'high',
    created_at: new Date('2025-08-20T08:00:00'),
    resolved: false,
    action_required: '需要補貨',
    ...overrides,
  }),

  createTestStockAdjustment: (overrides = {}) => ({
    adjustment_id: 'ADJ_TEST_001',
    item_id: 'INV_TEST_001',
    adjustment_type: 'damage',
    quantity: -10,
    reason: '商品破損',
    before_quantity: 500,
    after_quantity: 490,
    adjusted_by: 'USER_001',
    adjusted_at: new Date('2025-08-20T11:00:00'),
    approved_by: 'MANAGER_001',
    notes: '運輸過程破損',
    ...overrides,
  }),

  createTestInventoryReport: (overrides = {}) => ({
    report_id: 'REP_TEST_001',
    report_type: 'daily_stock',
    report_date: new Date('2025-08-20'),
    warehouse_id: 'WH_001',
    total_items: 150,
    total_value: 5000000,
    low_stock_items: 12,
    out_of_stock_items: 3,
    expiring_items: 8,
    stock_accuracy: 98.5,
    turnover_rate: 4.2,
    ...overrides,
  }),

  createTestBatchInfo: (overrides = {}) => ({
    batch_id: 'BATCH_TEST_001',
    batch_number: 'BATCH_20250820_001',
    item_id: 'INV_TEST_001',
    quantity: 200,
    manufacturing_date: new Date('2025-08-15'),
    expiry_date: new Date('2025-09-15'),
    supplier_id: 'SUP_001',
    received_date: new Date('2025-08-18'),
    quality_check: 'passed',
    certificates: ['QC_001', 'CERT_001'],
    ...overrides,
  }),

  createTestCycleCount: (overrides = {}) => ({
    count_id: 'COUNT_TEST_001',
    count_date: new Date('2025-08-20'),
    warehouse_id: 'WH_001',
    location: 'A-01',
    items_counted: 50,
    discrepancies: 3,
    accuracy_rate: 94,
    counted_by: 'USER_001',
    approved_by: 'MANAGER_001',
    status: 'completed',
    notes: '月度盤點',
    ...overrides,
  }),

  createTestTransferOrder: (overrides = {}) => ({
    transfer_id: 'TRANS_TEST_001',
    transfer_number: 'TR-20250820-001',
    from_warehouse: 'WH_001',
    to_warehouse: 'WH_002',
    items: [
      {
        item_id: 'INV_TEST_001',
        quantity: 50,
        unit: '公斤',
      },
    ],
    request_date: new Date('2025-08-20'),
    expected_date: new Date('2025-08-21'),
    status: 'pending',
    requested_by: 'USER_002',
    notes: '補貨需求',
    ...overrides,
  }),

  createTestInventorySummary: (overrides = {}) => ({
    summary_date: new Date('2025-08-20'),
    total_items: 1500,
    total_warehouses: 5,
    total_value: 25000000,
    stock_health: {
      healthy: 1200,
      low: 250,
      critical: 50,
    },
    top_items: [
      { item_id: 'INV_001', name: '商品A', quantity: 500, value: 250000 },
      { item_id: 'INV_002', name: '商品B', quantity: 450, value: 225000 },
      { item_id: 'INV_003', name: '商品C', quantity: 400, value: 200000 },
    ],
    warehouse_utilization: [
      { warehouse_id: 'WH_001', name: '北區倉庫', utilization: 85 },
      { warehouse_id: 'WH_002', name: '中區倉庫', utilization: 72 },
      { warehouse_id: 'WH_003', name: '南區倉庫', utilization: 68 },
    ],
    stock_movements: {
      inbound: 850,
      outbound: 720,
      internal: 130,
    },
    alerts_summary: {
      low_stock: 45,
      expiring: 28,
      overstock: 12,
    },
    ...overrides,
  }),
};

// Mock API handlers
export const mockApiHandlers = {
  getInventory: vi.fn(() => Promise.resolve({
    items: [testDataBuilders.createTestInventoryItem()],
    total: 1,
    page: 1,
    limit: 20,
  })),

  getInventoryItem: vi.fn((id) => Promise.resolve(
    testDataBuilders.createTestInventoryItem({ item_id: id })
  )),

  updateInventory: vi.fn((id, data) => Promise.resolve({
    ...testDataBuilders.createTestInventoryItem({ item_id: id }),
    ...data,
  })),

  adjustStock: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestStockAdjustment(data)
  )),

  transferStock: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestTransferOrder(data)
  )),

  getStockMovements: vi.fn(() => Promise.resolve({
    movements: [testDataBuilders.createTestStockMovement()],
    total: 1,
  })),

  getStockAlerts: vi.fn(() => Promise.resolve({
    alerts: [testDataBuilders.createTestStockAlert()],
    total: 1,
  })),

  getInventoryReport: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestInventoryReport()
  )),

  performCycleCount: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestCycleCount(data)
  )),

  getInventorySummary: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestInventorySummary()
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