import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as orderService from '../../../services/orderService';
import { testDataBuilders } from '../../setup';

vi.mock('#libs/services2/request', () => ({
  request: vi.fn(),
  postWithResponse: vi.fn(),
  putWithResponse: vi.fn(),
  deleteRequest: vi.fn(),
  patchWithResponse: vi.fn(),
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchOrders', () => {
    it('should search orders with filters', async () => {
      const filters = {
        date_from: '2025-08-01',
        date_to: '2025-08-31',
        customer_id: 'CUS_001',
        status: 'confirmed',
        keyword: 'test',
      };

      const result = await orderService.searchOrders(filters);

      expect(result).toBeDefined();
      expect(result.orders).toBeDefined();
      expect(Array.isArray(result.orders)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const filters = {
        page: 2,
        limit: 50,
      };

      const result = await orderService.searchOrders(filters);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should validate date range', async () => {
      const filters = {
        date_from: '2025-08-31',
        date_to: '2025-08-01',
      };

      await expect(orderService.searchOrders(filters)).rejects.toThrow('Invalid date range');
    });
  });

  describe('createOrder', () => {
    it('should create new order', async () => {
      const orderData = {
        customer_id: 'CUS_001',
        delivery_date: '2025-08-21',
        delivery_time: '09:00-12:00',
        delivery_address: '台北市信義區測試路100號',
        items: [
          { product_id: 'PROD_001', quantity: 10, unit_price: 100 },
        ],
      };

      const result = await orderService.createOrder(orderData);

      expect(result).toBeDefined();
      expect(result.order_id).toBeDefined();
      expect(result.order_number).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidOrder = {
        customer_id: 'CUS_001',
        // Missing items
      };

      await expect(orderService.createOrder(invalidOrder)).rejects.toThrow('Items are required');
    });

    it('should calculate order totals', async () => {
      const orderData = {
        customer_id: 'CUS_001',
        delivery_date: '2025-08-21',
        items: [
          { product_id: 'PROD_001', quantity: 10, unit_price: 100 },
          { product_id: 'PROD_002', quantity: 5, unit_price: 200 },
        ],
      };

      const result = await orderService.createOrder(orderData);

      expect(result.subtotal).toBe(2000);
      expect(result.total_amount).toBeGreaterThan(2000); // Including tax
    });
  });

  describe('updateOrder', () => {
    it('should update order details', async () => {
      const updates = {
        delivery_date: '2025-08-22',
        delivery_time: '14:00-17:00',
        notes: 'Updated notes',
      };

      const result = await orderService.updateOrder('ORD_001', updates);

      expect(result.order_id).toBe('ORD_001');
      expect(result.delivery_date).toBe('2025-08-22');
    });

    it('should prevent updating shipped orders', async () => {
      const updates = {
        items: [{ product_id: 'PROD_001', quantity: 20 }],
      };

      await expect(
        orderService.updateOrder('ORD_SHIPPED', updates)
      ).rejects.toThrow('Cannot update shipped order');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const result = await orderService.updateOrderStatus('ORD_001', 'confirmed');

      expect(result.status).toBe('confirmed');
      expect(result.updated_at).toBeDefined();
    });

    it('should validate status transition', async () => {
      await expect(
        orderService.updateOrderStatus('ORD_001', 'invalid_status')
      ).rejects.toThrow('Invalid status');
    });

    it('should prevent invalid status transitions', async () => {
      await expect(
        orderService.updateOrderStatus('ORD_COMPLETED', 'pending')
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('duplicateOrder', () => {
    it('should duplicate order with new delivery date', async () => {
      const result = await orderService.duplicateOrder('ORD_001', {
        delivery_date: '2025-08-25',
      });

      expect(result.order_id).not.toBe('ORD_001');
      expect(result.delivery_date).toBe('2025-08-25');
      expect(result.status).toBe('pending');
    });

    it('should copy all items from original order', async () => {
      const result = await orderService.duplicateOrder('ORD_001');

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('calculateOrderAmount', () => {
    it('should calculate order amount with tax', async () => {
      const items = [
        { product_id: 'PROD_001', quantity: 10, unit_price: 100 },
        { product_id: 'PROD_002', quantity: 5, unit_price: 200 },
      ];

      const result = await orderService.calculateOrderAmount({
        items,
        customer_id: 'CUS_001',
      });

      expect(result.subtotal).toBe(2000);
      expect(result.tax).toBe(100); // 5% tax
      expect(result.total).toBe(2100);
    });

    it('should apply customer discount', async () => {
      const items = [
        { product_id: 'PROD_001', quantity: 10, unit_price: 100 },
      ];

      const result = await orderService.calculateOrderAmount({
        items,
        customer_id: 'CUS_VIP',
        apply_discount: true,
      });

      expect(result.discount).toBeGreaterThan(0);
      expect(result.total).toBeLessThan(result.subtotal + result.tax);
    });

    it('should add shipping fee', async () => {
      const items = [
        { product_id: 'PROD_001', quantity: 1, unit_price: 100 },
      ];

      const result = await orderService.calculateOrderAmount({
        items,
        customer_id: 'CUS_001',
        delivery_address: '偏遠地區',
      });

      expect(result.shipping_fee).toBeGreaterThan(0);
    });
  });

  describe('checkStock', () => {
    it('should check stock availability', async () => {
      const items = [
        { product_id: 'PROD_001', quantity: 10 },
        { product_id: 'PROD_002', quantity: 5 },
      ];

      const result = await orderService.checkStock(items);

      expect(result.all_available).toBeDefined();
      expect(Array.isArray(result.stock_status)).toBe(true);
      expect(result.stock_status[0]).toHaveProperty('available_quantity');
    });

    it('should identify out of stock items', async () => {
      const items = [
        { product_id: 'PROD_001', quantity: 1000 },
      ];

      const result = await orderService.checkStock(items);

      expect(result.all_available).toBe(false);
      expect(result.stock_status[0].in_stock).toBe(false);
    });
  });

  describe('exportOrders', () => {
    it('should export orders to Excel', async () => {
      const exportOptions = {
        order_ids: ['ORD_001', 'ORD_002'],
        format: 'excel',
        include_items: true,
      };

      const result = await orderService.exportOrders(exportOptions);

      expect(result.file_url).toBeDefined();
      expect(result.format).toBe('excel');
      expect(result.record_count).toBe(2);
    });

    it('should export filtered orders', async () => {
      const exportOptions = {
        filters: {
          date_from: '2025-08-01',
          date_to: '2025-08-31',
          status: 'confirmed',
        },
        format: 'csv',
      };

      const result = await orderService.exportOrders(exportOptions);

      expect(result.file_url).toBeDefined();
      expect(result.format).toBe('csv');
    });
  });

  describe('getOrderSummary', () => {
    it('should get daily order summary', async () => {
      const result = await orderService.getOrderSummary({
        date: '2025-08-20',
        period: 'daily',
      });

      expect(result.total_orders).toBeDefined();
      expect(result.total_amount).toBeDefined();
      expect(result.top_customers).toBeDefined();
      expect(result.top_products).toBeDefined();
    });

    it('should get monthly summary', async () => {
      const result = await orderService.getOrderSummary({
        date: '2025-08-01',
        period: 'monthly',
      });

      expect(result.summary_date).toBeDefined();
      expect(result.average_order_value).toBeDefined();
    });
  });

  describe('validateOrder', () => {
    it('should validate complete order', () => {
      const order = testDataBuilders.createTestOrderWithItems();
      const errors = orderService.validateOrder(order);

      expect(errors).toHaveLength(0);
    });

    it('should identify missing customer', () => {
      const order = { ...testDataBuilders.createTestOrder(), customer_id: '' };
      const errors = orderService.validateOrder(order);

      expect(errors).toContain('Customer is required');
    });

    it('should identify invalid delivery date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const order = { 
        ...testDataBuilders.createTestOrder(), 
        delivery_date: yesterday,
      };
      const errors = orderService.validateOrder(order);

      expect(errors).toContain('Delivery date cannot be in the past');
    });
  });
});