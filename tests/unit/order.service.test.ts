import * as orderService from '../../src/modules/order/service';
import { query, getClient } from '../../src/database/connection';
import { cache } from '../../src/database/redis';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/database/connection');
jest.mock('../../src/database/redis');
jest.mock('../../src/utils/logger');

describe('Order Service Unit Tests', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    (getClient as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('createOrder', () => {
    it('should create order with pricing calculation', async () => {
      const mockCustomer = {
        id: 'customer-1',
        credit_limit: 100000,
        payment_terms: 'NET30'
      };

      const mockPricing = {
        items: [
          {
            itemId: 'item-1',
            quantity: 100,
            unitPrice: 50,
            originalPrice: 60,
            discountAmount: 1000,
            taxAmount: 250,
            subtotal: 5000
          }
        ],
        subtotal: 5000,
        discountAmount: 1000,
        taxAmount: 250,
        shippingFee: 100,
        totalAmount: 4350,
        availableCredit: 0,
        creditApplied: 0,
        promotions: [] as any[]
      };

      // Mock customer validation
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCustomer] }) // Customer check
        .mockResolvedValueOnce({ rows: [{ seq: 1 }] }) // Order number generation
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-1', unit_price: 60, original_price: 60 }] 
        }) // Item price query
        .mockResolvedValueOnce({ 
          rows: [{ id: 'order-1', order_no: 'SO20250822001' }] 
        }) // Order creation
        .mockResolvedValueOnce(undefined) // Order item creation
        .mockResolvedValueOnce(undefined) // Inventory reservation
        .mockResolvedValueOnce(undefined) // Order activity log
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);
      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      // Mock getOrderById
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'order-1',
          order_no: 'SO20250822001',
          customer_id: 'customer-1',
          total_amount: 4350
        }]
      }).mockResolvedValueOnce({
        rows: [{
          item_id: 'item-1',
          ordered_qty: 100,
          unit_price: 50
        }]
      });

      const result = await orderService.createOrder({
        customerId: 'customer-1',
        items: [
          {
            itemId: 'item-1',
            quantity: 100
          }
        ],
        deliveryAddress: {
          addressLine1: '123 Main St',
          city: 'Taipei',
          country: 'Taiwan'
        },
        createdBy: 'user-1'
      });

      expect(result).toBeDefined();
      expect(result.orderNo).toBe('SO20250822001');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(cache.del).toHaveBeenCalledWith('customer:orders:customer-1');
    });

    it('should throw error for inactive customer', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // No customer found

      await expect(
        orderService.createOrder({
          customerId: 'invalid-customer',
          items: [],
          deliveryAddress: {
            addressLine1: '123 Main St',
            city: 'Taipei',
            country: 'Taiwan'
          },
          createdBy: 'user-1'
        })
      ).rejects.toThrow('Customer not found or inactive');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status with valid transition', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        customer_id: 'customer-1'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // Get order
        .mockResolvedValueOnce(undefined) // Update order
        .mockResolvedValueOnce(undefined) // Update items
        .mockResolvedValueOnce(undefined) // Log activity
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);
      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockOrder, status: 'confirmed' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await orderService.updateOrderStatus('order-1', {
        status: 'confirmed',
        notes: 'Order confirmed',
        notifyCustomer: true,
        updatedBy: 'user-1'
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('confirmed');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject invalid status transition', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'delivered'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }); // Get order

      await expect(
        orderService.updateOrderStatus('order-1', {
          status: 'pending',
          updatedBy: 'user-1'
        })
      ).rejects.toThrow('Invalid status transition from delivered to pending');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should release inventory when order is cancelled', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'confirmed'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // Get order
        .mockResolvedValueOnce({ 
          rows: [
            { item_id: 'item-1', ordered_qty: 100 },
            { item_id: 'item-2', ordered_qty: 50 }
          ] 
        }) // Get order items for release
        .mockResolvedValueOnce(undefined) // Release inventory item 1
        .mockResolvedValueOnce(undefined) // Release inventory item 2
        .mockResolvedValueOnce(undefined) // Update order
        .mockResolvedValueOnce(undefined) // Update items
        .mockResolvedValueOnce(undefined) // Log activity
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);
      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);
      
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockOrder, status: 'cancelled' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await orderService.updateOrderStatus('order-1', {
        status: 'cancelled',
        notes: 'Customer cancelled',
        updatedBy: 'user-1'
      });

      expect(result.status).toBe('cancelled');
      
      // Verify inventory release queries
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE inventory_snapshots'),
        expect.arrayContaining([100, 'item-1'])
      );
    });
  });

  describe('calculateOrderPricing', () => {
    it('should calculate pricing with tier and quantity discounts', async () => {
      // Mock customer tier
      (query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ tier_level: 3, customer_type: 'wholesaler' }] 
        })
        // Mock item prices
        .mockResolvedValueOnce({ 
          rows: [{
            id: 'item-1',
            item_code: 'ITEM001',
            item_name: 'Product 1',
            unit_price: 100,
            original_price: 100
          }]
        })
        .mockResolvedValueOnce({ 
          rows: [{
            id: 'item-2',
            item_code: 'ITEM002',
            item_name: 'Product 2',
            unit_price: 50,
            original_price: 50
          }]
        });

      const result = await orderService.calculateOrderPricing({
        customerId: 'customer-1',
        items: [
          { itemId: 'item-1', quantity: 100 },  // Should get quantity discount
          { itemId: 'item-2', quantity: 200 }   // Should get quantity discount
        ]
      });

      expect(result.items).toHaveLength(2);
      
      // Check tier 3 discount (10%) + quantity discount (5% for 100+)
      const item1 = result.items[0];
      expect(item1.unitPrice).toBeLessThan(100); // Should have discounts applied
      expect(item1.discountAmount).toBeGreaterThan(0);
      
      expect(result.subtotal).toBeGreaterThan(0);
      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.totalAmount).toBe(
        result.subtotal - result.discountAmount + result.taxAmount + result.shippingFee
      );
    });

    it('should apply free shipping for orders over threshold', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ 
          rows: [{ tier_level: 1, customer_type: 'retailer' }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{
            id: 'item-1',
            unit_price: 1000,
            original_price: 1000
          }]
        });

      const result = await orderService.calculateOrderPricing({
        customerId: 'customer-1',
        items: [
          { itemId: 'item-1', quantity: 10 } // Total > 5000
        ]
      });

      expect(result.shippingFee).toBe(0); // Free shipping
    });
  });

  describe('searchOrders', () => {
    it('should search orders with filters', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_no: 'SO20250822001',
          customer_name: 'Customer A',
          total_amount: 5000,
          status: 'confirmed'
        },
        {
          id: 'order-2',
          order_no: 'SO20250822002',
          customer_name: 'Customer B',
          total_amount: 3000,
          status: 'pending'
        }
      ];

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // Count
        .mockResolvedValueOnce({ rows: mockOrders }); // Orders

      const result = await orderService.searchOrders({
        status: ['pending', 'confirmed'],
        minAmount: 1000,
        page: 1,
        limit: 10
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      
      // Verify filter conditions in query
      const queryCall = (query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('o.status = ANY($');
      expect(queryCall[0]).toContain('o.total_amount >= $');
    });

    it('should handle search term across multiple fields', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await orderService.searchOrders({
        searchTerm: 'SO2025',
        page: 1,
        limit: 20
      });

      const queryCall = (query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('o.order_no ILIKE $');
      expect(queryCall[0]).toContain('c.customer_name ILIKE $');
      expect(queryCall[1]).toContain('%SO2025%');
    });
  });

  describe('getOrderStatistics', () => {
    it('should calculate order statistics', async () => {
      const mockStats = {
        total_orders: '100',
        total_revenue: '500000',
        average_order_value: '5000'
      };

      const mockStatusBreakdown = [
        { status: 'completed', count: '80' },
        { status: 'pending', count: '15' },
        { status: 'cancelled', count: '5' }
      ];

      const mockChannelBreakdown = [
        { sales_channel: 'direct', count: '60' },
        { sales_channel: 'online', count: '40' }
      ];

      const mockTopProducts = [
        { item_id: 'item-1', item_name: 'Product 1', quantity: '1000', revenue: '100000' }
      ];

      const mockDailyOrders = [
        { date: '2025-08-22', count: '10', revenue: '50000' }
      ];

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockStats] })
        .mockResolvedValueOnce({ rows: mockStatusBreakdown })
        .mockResolvedValueOnce({ rows: mockChannelBreakdown })
        .mockResolvedValueOnce({ rows: mockTopProducts })
        .mockResolvedValueOnce({ rows: mockDailyOrders });

      const result = await orderService.getOrderStatistics();

      expect(result.totalOrders).toBe(100);
      expect(result.totalRevenue).toBe(500000);
      expect(result.averageOrderValue).toBe(5000);
      expect(result.ordersByStatus['completed']).toBe(80);
      expect(result.ordersByChannel['direct']).toBe(60);
      expect(result.topProducts).toHaveLength(1);
      expect(result.dailyOrders).toHaveLength(1);

      // Verify caching
      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('orders:statistics'),
        result,
        600
      );
    });

    it('should return cached statistics if available', async () => {
      const cachedStats = {
        totalOrders: 50,
        totalRevenue: 250000,
        averageOrderValue: 5000,
        ordersByStatus: {},
        ordersByChannel: {},
        topProducts: [] as any[],
        dailyOrders: [] as any[]
      };

      (cache.get as jest.Mock).mockResolvedValue(cachedStats);

      const result = await orderService.getOrderStatistics();

      expect(result).toEqual(cachedStats);
      expect(query).not.toHaveBeenCalled();
    });
  });
});