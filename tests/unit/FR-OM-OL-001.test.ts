/**
 * FR-OM-OL-001: 訂單列表顯示測試
 * 
 * @module OrderListServiceTest
 * @version 1.0.0
 * @since 2025-08-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderListService } from '@/modules/order/services/orderList.service';
import { Order } from '@/modules/order/entities/order.entity';
import { OrderItem } from '@/modules/order/entities/orderItem.entity';
import { CacheService } from '@/common/services/cache.service';
import { 
  OrderFilter, 
  OrderStatus, 
  OrderListResponse,
  BatchOperationRequest 
} from '@/modules/order/types/order.types';
import { AppError } from '@/common/errors/app.error';
import { OrderFactory } from '@/tests/factories/order.factory';

describe('FR-OM-OL-001: 訂單列表顯示', () => {
  let service: OrderListService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let cacheService: jest.Mocked<CacheService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderListService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn()
              }
            }
          }
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            find: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn()
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<OrderListService>(OrderListService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    cacheService = module.get(CacheService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderList', () => {
    it('應該返回分頁的訂單列表', async () => {
      // Arrange
      const filter: OrderFilter = {
        page: 1,
        pageSize: 10,
        status: [OrderStatus.PENDING, OrderStatus.CONFIRMED]
      };

      const mockOrders = OrderFactory.createBatch(10);
      const total = 100;

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockOrders, total]),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalOrders: '100',
          totalAmount: '1000000',
          avgOrderValue: '10000',
          uniqueCustomers: '50'
        })
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.getOrderList(filter);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(10);
      expect(result.pagination).toEqual({
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10
      });
      expect(result.statistics).toEqual({
        totalOrders: 100,
        totalAmount: 1000000,
        avgOrderValue: 10000,
        uniqueCustomers: 50
      });

      // 驗證查詢建構
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('order.customer', 'customer');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('order.items', 'items');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status IN (:...status)',
        { status: [OrderStatus.PENDING, OrderStatus.CONFIRMED] }
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);

      // 驗證快取
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('應該從快取返回結果（如果存在）', async () => {
      // Arrange
      const filter: OrderFilter = { page: 1, pageSize: 10 };
      const cachedResult: OrderListResponse = {
        data: OrderFactory.createBatch(10),
        pagination: {
          total: 100,
          page: 1,
          pageSize: 10,
          totalPages: 10
        },
        statistics: {
          totalOrders: 100,
          totalAmount: 1000000,
          avgOrderValue: 10000,
          uniqueCustomers: 50
        },
        timestamp: new Date()
      };

      cacheService.get.mockResolvedValue(cachedResult);

      // Act
      const result = await service.getOrderList(filter);

      // Assert
      expect(result).toEqual(cachedResult);
      expect(orderRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('當沒有訂單時，應該返回空列表', async () => {
      // Arrange
      const filter: OrderFilter = { page: 1, pageSize: 10 };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalOrders: '0',
          totalAmount: '0',
          avgOrderValue: '0',
          uniqueCustomers: '0'
        })
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.getOrderList(filter);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.statistics.totalOrders).toBe(0);
    });

    it('當查詢失敗時，應該拋出錯誤', async () => {
      // Arrange
      const filter: OrderFilter = { page: 1, pageSize: 10 };
      const error = new Error('Database connection failed');

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(error)
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      cacheService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getOrderList(filter)).rejects.toThrow(AppError);
    });
  });

  describe('searchOrders', () => {
    it('應該支援多條件組合搜尋', async () => {
      // Arrange
      const searchParams = {
        orderNo: 'ORD-2025',
        customerSearch: '測試客戶',
        dateRange: {
          start: new Date('2025-08-01'),
          end: new Date('2025-08-31')
        },
        amountRange: {
          min: 1000,
          max: 10000
        },
        statuses: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
        page: 1,
        pageSize: 20
      };

      const mockOrders = OrderFactory.createBatch(5);
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockOrders, 5])
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      // Act
      const result = await service.searchOrders(searchParams);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.orderNo LIKE :orderNo',
        { orderNo: '%ORD-2025%' }
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.orderDate BETWEEN :startDate AND :endDate',
        expect.any(Object)
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.totalAmount BETWEEN :minAmount AND :maxAmount',
        expect.any(Object)
      );
    });

    it('應該支援產品搜尋', async () => {
      // Arrange
      const searchParams = {
        productSearch: '產品A',
        page: 1,
        pageSize: 10
      };

      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      // Act
      await service.searchOrders(searchParams);

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = order.id AND oi.product_name LIKE :product)',
        { product: '%產品A%' }
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('應該成功更新訂單狀態', async () => {
      // Arrange
      const orderId = 'order-001';
      const oldStatus = OrderStatus.PENDING;
      const newStatus = OrderStatus.CONFIRMED;
      const reason = '客戶確認訂單';
      const userId = 'user-001';

      const mockOrder = OrderFactory.create({
        id: orderId,
        status: oldStatus
      });

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(mockOrder),
          save: jest.fn().mockResolvedValue({ ...mockOrder, status: newStatus })
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn()
      };

      orderRepository.manager.connection.createQueryRunner.mockReturnValue(queryRunner as any);

      // Act
      const result = await service.updateOrderStatus(orderId, newStatus, reason, userId);

      // Assert
      expect(result.status).toBe(newStatus);
      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.status.changed',
        expect.objectContaining({
          orderId,
          oldStatus,
          newStatus,
          userId
        })
      );
      expect(cacheService.del).toHaveBeenCalledWith(`order-detail:${orderId}`);
    });

    it('應該拒絕非法的狀態轉換', async () => {
      // Arrange
      const orderId = 'order-001';
      const mockOrder = OrderFactory.create({
        id: orderId,
        status: OrderStatus.COMPLETED
      });

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(mockOrder)
        },
        rollbackTransaction: jest.fn(),
        release: jest.fn()
      };

      orderRepository.manager.connection.createQueryRunner.mockReturnValue(queryRunner as any);

      // Act & Assert
      await expect(
        service.updateOrderStatus(orderId, OrderStatus.PENDING)
      ).rejects.toThrow('Invalid status transition');
      
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('當訂單不存在時應該拋出404錯誤', async () => {
      // Arrange
      const orderId = 'non-existent';
      
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(null)
        },
        rollbackTransaction: jest.fn(),
        release: jest.fn()
      };

      orderRepository.manager.connection.createQueryRunner.mockReturnValue(queryRunner as any);

      // Act & Assert
      await expect(
        service.updateOrderStatus(orderId, OrderStatus.CONFIRMED)
      ).rejects.toThrow(new AppError('Order not found', 404));
    });
  });

  describe('batchOperation', () => {
    it('應該成功執行批次狀態更新', async () => {
      // Arrange
      const request: BatchOperationRequest = {
        orderIds: ['order-001', 'order-002', 'order-003'],
        operation: 'updateStatus',
        parameters: {
          status: OrderStatus.CONFIRMED,
          userId: 'user-001'
        },
        reason: '批次確認訂單'
      };

      // Mock 個別更新成功
      const updateStatusSpy = jest.spyOn(service, 'updateOrderStatus');
      updateStatusSpy.mockResolvedValue({} as Order);

      // Act
      const result = await service.batchOperation(request);

      // Assert
      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.total).toBe(3);
      expect(updateStatusSpy).toHaveBeenCalledTimes(3);
    });

    it('應該處理部分失敗的情況', async () => {
      // Arrange
      const request: BatchOperationRequest = {
        orderIds: ['order-001', 'order-002', 'order-003'],
        operation: 'updateStatus',
        parameters: {
          status: OrderStatus.CONFIRMED,
          userId: 'user-001'
        }
      };

      // Mock 部分更新失敗
      const updateStatusSpy = jest.spyOn(service, 'updateOrderStatus');
      updateStatusSpy
        .mockResolvedValueOnce({} as Order)
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce({} as Order);

      // Act
      const result = await service.batchOperation(request);

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].orderId).toBe('order-002');
      expect(result.failed[0].error).toBe('Update failed');
    });

    it('應該拒絕不支援的操作', async () => {
      // Arrange
      const request: BatchOperationRequest = {
        orderIds: ['order-001'],
        operation: 'unsupported' as any,
        parameters: {}
      };

      // Act & Assert
      await expect(service.batchOperation(request))
        .rejects
        .toThrow('Unsupported operation: unsupported');
    });
  });

  describe('getOrderDetail', () => {
    it('應該返回完整的訂單詳情', async () => {
      // Arrange
      const orderId = 'order-001';
      const mockOrder = OrderFactory.create({
        id: orderId,
        items: [
          {
            id: 'item-001',
            productId: 'prod-001',
            productName: '產品A',
            quantity: 10,
            unitPrice: 100,
            subtotal: 1000
          }
        ]
      });

      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.getOrderDetail(orderId);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: orderId },
        relations: expect.arrayContaining([
          'items',
          'customer',
          'deliveryLogs',
          'statusHistory'
        ])
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        `order-detail:${orderId}`,
        mockOrder,
        600
      );
    });

    it('應該從快取返回訂單詳情', async () => {
      // Arrange
      const orderId = 'order-001';
      const cachedOrder = OrderFactory.create({ id: orderId });
      
      cacheService.get.mockResolvedValue(cachedOrder);

      // Act
      const result = await service.getOrderDetail(orderId);

      // Assert
      expect(result).toEqual(cachedOrder);
      expect(orderRepository.findOne).not.toHaveBeenCalled();
    });

    it('當訂單不存在時應該拋出404錯誤', async () => {
      // Arrange
      const orderId = 'non-existent';
      
      orderRepository.findOne.mockResolvedValue(null);
      cacheService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getOrderDetail(orderId))
        .rejects
        .toThrow(new AppError('Order not found', 404));
    });
  });

  describe('exportOrders', () => {
    it('應該成功匯出訂單為Excel格式', async () => {
      // Arrange
      const filter: OrderFilter = {
        dateRange: {
          start: new Date('2025-08-01'),
          end: new Date('2025-08-31')
        }
      };
      const format = 'excel';
      const columns = ['orderNo', 'customerName', 'totalAmount', 'status'];

      const mockOrders = OrderFactory.createBatch(10);
      const mockExportUrl = 'https://storage.example.com/exports/orders-20250824.xlsx';

      // Mock private methods
      const getOrdersForExportSpy = jest.spyOn(service as any, 'getOrdersForExport');
      getOrdersForExportSpy.mockResolvedValue(mockOrders);

      const exportToExcelSpy = jest.spyOn(service as any, 'exportToExcel');
      exportToExcelSpy.mockResolvedValue(mockExportUrl);

      const recordExportHistorySpy = jest.spyOn(service as any, 'recordExportHistory');
      recordExportHistorySpy.mockResolvedValue(undefined);

      // Act
      const result = await service.exportOrders(filter, format as any, columns);

      // Assert
      expect(result).toBe(mockExportUrl);
      expect(getOrdersForExportSpy).toHaveBeenCalledWith(filter);
      expect(exportToExcelSpy).toHaveBeenCalledWith(mockOrders, columns);
      expect(recordExportHistorySpy).toHaveBeenCalled();
    });

    it('應該拒絕不支援的匯出格式', async () => {
      // Arrange
      const filter: OrderFilter = {};
      const format = 'unsupported';

      // Act & Assert
      await expect(service.exportOrders(filter, format as any))
        .rejects
        .toThrow('Unsupported export format: unsupported');
    });
  });
});

describe('效能測試', () => {
  let service: OrderListService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderListService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {}
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn()
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<OrderListService>(OrderListService);
    orderRepository = module.get(getRepositoryToken(Order));
    cacheService = module.get(CacheService);
  });

  it('應該在合理時間內處理大量訂單查詢', async () => {
    // Arrange
    const filter: OrderFilter = { page: 1, pageSize: 100 };
    const mockOrders = OrderFactory.createBatch(100);

    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockOrders, 10000]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalOrders: '10000',
        totalAmount: '100000000',
        avgOrderValue: '10000',
        uniqueCustomers: '1000'
      })
    };

    orderRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    cacheService.get.mockResolvedValue(null);

    // Act
    const startTime = Date.now();
    await service.getOrderList(filter);
    const endTime = Date.now();

    // Assert
    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
  });
});