import { vi } from 'vitest';
import { testDataFactory } from '@/PRD/test-infrastructure/test-utils/test-data-factory';

// OM-OL specific test data builders
export const testDataBuilders = {
  // Create test order
  createTestOrder: (overrides = {}) => ({
    order_id: 'ORD_TEST_001',
    order_number: 'SO-20250820-001',
    order_date: new Date('2025-08-20'),
    customer_id: 'CUS_TEST_001',
    customer_name: '測試客戶',
    customer_type: 'company' as const,
    store_id: 'STO_TEST_001',
    store_name: '測試門市',
    status: 'confirmed' as const,
    priority: 'normal' as const,
    delivery_date: new Date('2025-08-21'),
    delivery_time: '09:00-12:00',
    delivery_address: '台北市信義區測試路100號',
    payment_method: 'monthly' as const,
    payment_status: 'unpaid' as const,
    subtotal: 10000,
    tax: 500,
    discount: 200,
    shipping_fee: 100,
    total_amount: 10400,
    currency: 'TWD',
    notes: '請小心搬運',
    internal_notes: '優質客戶',
    created_by: 'USER_001',
    created_at: new Date('2025-08-20T08:00:00'),
    updated_at: new Date('2025-08-20T08:00:00'),
    ...overrides,
  }),

  // Create order item
  createTestOrderItem: (overrides = {}) => ({
    item_id: 'ITEM_TEST_001',
    order_id: 'ORD_TEST_001',
    product_id: 'PROD_TEST_001',
    product_name: '測試商品A',
    product_code: 'SKU-001',
    category: '生鮮蔬菜',
    quantity: 10,
    unit: 'kg',
    unit_price: 100,
    discount_rate: 0,
    discount_amount: 0,
    subtotal: 1000,
    tax_rate: 0.05,
    tax_amount: 50,
    total: 1050,
    is_gift: false,
    notes: '',
    ...overrides,
  }),

  // Create order with items
  createTestOrderWithItems: (overrides = {}) => {
    const order = testDataBuilders.createTestOrder(overrides);
    const items = [
      testDataBuilders.createTestOrderItem({ order_id: order.order_id }),
      testDataBuilders.createTestOrderItem({
        item_id: 'ITEM_TEST_002',
        order_id: order.order_id,
        product_id: 'PROD_TEST_002',
        product_name: '測試商品B',
        quantity: 5,
        unit_price: 200,
        subtotal: 1000,
      }),
    ];
    return { ...order, items };
  },

  // Create order status history
  createTestOrderHistory: (overrides = {}) => ({
    history_id: 'HIST_TEST_001',
    order_id: 'ORD_TEST_001',
    action: 'status_change' as const,
    old_status: 'pending',
    new_status: 'confirmed',
    changed_by: 'USER_001',
    changed_at: new Date('2025-08-20T09:00:00'),
    comments: '客戶已確認訂單',
    ...overrides,
  }),

  // Create order summary
  createTestOrderSummary: (overrides = {}) => ({
    summary_date: new Date('2025-08-20'),
    total_orders: 50,
    pending_orders: 5,
    confirmed_orders: 20,
    processing_orders: 15,
    shipped_orders: 8,
    completed_orders: 2,
    cancelled_orders: 0,
    total_amount: 500000,
    total_items: 1500,
    average_order_value: 10000,
    top_customers: [
      { customer_id: 'CUS_001', customer_name: '客戶A', order_count: 10, total_amount: 100000 },
      { customer_id: 'CUS_002', customer_name: '客戶B', order_count: 8, total_amount: 80000 },
    ],
    top_products: [
      { product_id: 'PROD_001', product_name: '商品A', quantity: 100, amount: 50000 },
      { product_id: 'PROD_002', product_name: '商品B', quantity: 80, amount: 40000 },
    ],
    ...overrides,
  }),

  // Create order picture
  createTestOrderPicture: (overrides = {}) => ({
    picture_id: 'PIC_TEST_001',
    order_id: 'ORD_TEST_001',
    type: 'processing' as const,
    url: 'https://storage.example.com/orders/ORD_TEST_001/pic1.jpg',
    thumbnail_url: 'https://storage.example.com/orders/ORD_TEST_001/pic1_thumb.jpg',
    caption: '處理中照片',
    taken_at: new Date('2025-08-20T10:00:00'),
    uploaded_by: 'USER_001',
    uploaded_at: new Date('2025-08-20T10:05:00'),
    ...overrides,
  }),

  // Create return order
  createTestReturnOrder: (overrides = {}) => ({
    return_id: 'RET_TEST_001',
    original_order_id: 'ORD_TEST_001',
    return_number: 'RO-20250820-001',
    return_date: new Date('2025-08-20'),
    return_reason: 'defective' as const,
    return_type: 'refund' as const,
    status: 'pending' as const,
    items: [
      {
        product_id: 'PROD_001',
        quantity: 2,
        reason: '商品損壞',
      },
    ],
    refund_amount: 200,
    notes: '客戶反映商品有瑕疵',
    created_by: 'USER_001',
    created_at: new Date('2025-08-20'),
    ...overrides,
  }),

  // Create batch orders
  createTestBatchOrders: (count = 5) => {
    return Array.from({ length: count }, (_, i) => 
      testDataBuilders.createTestOrder({
        order_id: `ORD_TEST_${String(i + 1).padStart(3, '0')}`,
        order_number: `SO-20250820-${String(i + 1).padStart(3, '0')}`,
        customer_name: `測試客戶${i + 1}`,
        total_amount: 10000 + (i * 1000),
        status: ['pending', 'confirmed', 'processing', 'shipped', 'completed'][i % 5] as any,
      })
    );
  },

  // Create order filter
  createTestOrderFilter: (overrides = {}) => ({
    date_from: new Date('2025-08-01'),
    date_to: new Date('2025-08-31'),
    customer_id: null,
    status: [],
    priority: null,
    payment_status: null,
    keyword: '',
    ...overrides,
  }),

  // Create delivery info
  createTestDeliveryInfo: (overrides = {}) => ({
    delivery_id: 'DEL_TEST_001',
    order_id: 'ORD_TEST_001',
    delivery_date: new Date('2025-08-21'),
    delivery_time: '09:00-12:00',
    delivery_address: '台北市信義區測試路100號',
    contact_name: '張先生',
    contact_phone: '0912345678',
    driver_id: 'DRV_001',
    driver_name: '李司機',
    vehicle_id: 'VEH_001',
    vehicle_number: 'ABC-123',
    delivery_notes: '請提前電話通知',
    ...overrides,
  }),

  // Create payment info
  createTestPaymentInfo: (overrides = {}) => ({
    payment_id: 'PAY_TEST_001',
    order_id: 'ORD_TEST_001',
    payment_method: 'credit_card' as const,
    payment_status: 'paid' as const,
    payment_date: new Date('2025-08-20'),
    due_date: new Date('2025-09-20'),
    amount: 10400,
    paid_amount: 10400,
    balance: 0,
    invoice_number: 'INV-20250820-001',
    ...overrides,
  }),
};

// Mock timers for date-sensitive tests
export const setupTimers = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-08-20T10:00:00'));
  return () => vi.useRealTimers();
};

// Mock localStorage for order drafts
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
  
  // Mock window.confirm for order actions
  global.confirm = vi.fn(() => true);
  
  // Mock window.alert for notifications
  global.alert = vi.fn();
  
  // Mock window.print for order printing
  global.print = vi.fn();
  
  // Mock console methods
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };
};