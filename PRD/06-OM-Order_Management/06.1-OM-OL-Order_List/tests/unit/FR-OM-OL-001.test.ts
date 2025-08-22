/**
 * 單元測試: FR-OM-OL-001 訂單列表展示與查詢
 * 測試檔案路徑: tests/unit/FR-OM-OL-001.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OrderService } from '@/modules/om/services/OrderService';
import { OrderRepository } from '@/modules/om/repositories/OrderRepository';
import { Order, OrderStatus, OrderSearchParams } from '@/modules/om/types';

describe('FR-OM-OL-001: 訂單列表展示與查詢', () => {
  let orderService: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    orderRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
    } as any;
    orderService = new OrderService(orderRepository);
  });

  describe('訂單列表載入', () => {
    it('應在3秒內載入最近100筆訂單', async () => {
      // Arrange
      const mockOrders: Order[] = Array(100).fill(null).map((_, i) => ({
        id: `order-${i}`,
        orderNo: `ORD-2025-${String(i).padStart(4, '0')}`,
        customerName: `客戶${i}`,
        orderDate: new Date('2025-08-22'),
        status: OrderStatus.PENDING,
        totalAmount: 10000 + i * 100,
        paymentStatus: 'unpaid'
      }));
      
      orderRepository.findAll.mockResolvedValue({
        data: mockOrders,
        total: 100,
        page: 1,
        limit: 100
      });

      // Act
      const startTime = Date.now();
      const result = await orderService.getOrders({ page: 1, limit: 100 });
      const loadTime = Date.now() - startTime;

      // Assert
      expect(result.data).toHaveLength(100);
      expect(loadTime).toBeLessThan(3000);
    });

    it('應支援分頁載入', async () => {
      // Arrange
      const page = 2;
      const limit = 50;

      // Act
      await orderService.getOrders({ page, limit });

      // Assert
      expect(orderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page, limit })
      );
    });
  });

  describe('訂單搜尋', () => {
    it('應在500ms內返回訂單編號搜尋結果', async () => {
      // Arrange
      const orderNo = 'ORD-2025-0001';
      const mockOrder: Order = {
        id: '1',
        orderNo,
        customerName: 'ABC公司',
        status: OrderStatus.PENDING
      } as Order;
      
      orderRepository.search.mockResolvedValue([mockOrder]);

      // Act
      const startTime = Date.now();
      const result = await orderService.searchOrders({ orderNo });
      const searchTime = Date.now() - startTime;

      // Assert
      expect(result).toContainEqual(mockOrder);
      expect(searchTime).toBeLessThan(500);
    });

    it('應支援多條件組合查詢', async () => {
      // Arrange
      const searchParams: OrderSearchParams = {
        status: OrderStatus.PENDING,
        customerId: 'C001',
        dateFrom: '2025-08-01',
        dateTo: '2025-08-31'
      };

      // Act
      await orderService.searchOrders(searchParams);

      // Assert
      expect(orderRepository.search).toHaveBeenCalledWith(searchParams);
    });
  });

  describe('排序功能', () => {
    it('預設應按訂單日期倒序排列', async () => {
      // Act
      await orderService.getOrders({});

      // Assert
      expect(orderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'orderDate',
          order: 'desc'
        })
      );
    });

    it('應支援按狀態排序', async () => {
      // Act
      await orderService.getOrders({ 
        orderBy: 'status', 
        order: 'asc' 
      });

      // Assert
      expect(orderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'status',
          order: 'asc'
        })
      );
    });
  });

  describe('權限控制', () => {
    it('應過濾無權限查看的訂單', async () => {
      // Arrange
      const userId = 'user1';
      const mockOrders = [
        { id: '1', createdBy: userId, customerName: '客戶A' },
        { id: '2', createdBy: 'user2', customerName: '客戶B' },
      ] as Order[];
      
      orderRepository.findAll.mockResolvedValue({
        data: mockOrders,
        total: 2
      });

      // Act
      const result = await orderService.getOrdersForUser(userId);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].createdBy).toBe(userId);
    });
  });

  describe('統計資訊', () => {
    it('應返回訂單統計摘要', async () => {
      // Arrange
      orderRepository.count.mockResolvedValue({
        total: 1500,
        pending: 150,
        processing: 300,
        completed: 1000
      });

      // Act
      const summary = await orderService.getOrderSummary();

      // Assert
      expect(summary).toEqual({
        totalOrders: 1500,
        pendingOrders: 150,
        processingOrders: 300,
        completedOrders: 1000
      });
    });
  });
});