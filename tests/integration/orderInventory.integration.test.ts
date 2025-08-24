/**
 * Order-Inventory Integration Tests
 * 訂單與庫存整合測試
 * 
 * @module OrderInventoryIntegrationTest
 * @version 1.0.0
 * @since 2025-08-25
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderInventoryIntegration } from '@/modules/integration/orderInventory.integration';
import { OrderListService } from '@/modules/order/services/orderList.service';
import { OrderCreateService } from '@/modules/order/services/orderCreate.service';
import { InventoryService } from '@/modules/warehouse/services/inventory.service';
import { NotificationService } from '@/common/services/notification.service';
import { MetricsService } from '@/common/services/metrics.service';
import { 
  OrderStatus, 
  OrderEvents,
  InventoryEvents,
  IntegrationEvents 
} from '@/common/events';
import { AppError } from '@/common/errors/app.error';
import * as moment from 'moment';

describe('OrderInventoryIntegration', () => {
  let integration: OrderInventoryIntegration;
  let dataSource: jest.Mocked<DataSource>;
  let orderListService: jest.Mocked<OrderListService>;
  let orderCreateService: jest.Mocked<OrderCreateService>;
  let inventoryService: jest.Mocked<InventoryService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let notificationService: jest.Mocked<NotificationService>;
  let metricsService: jest.Mocked<MetricsService>;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderInventoryIntegration,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner)
          }
        },
        {
          provide: OrderListService,
          useValue: {
            getOrderDetail: jest.fn(),
            getOrdersByIds: jest.fn(),
            updateOrderStatus: jest.fn()
          }
        },
        {
          provide: OrderCreateService,
          useValue: {
            createOrder: jest.fn(),
            checkOrderFeasibility: jest.fn()
          }
        },
        {
          provide: InventoryService,
          useValue: {
            getInventory: jest.fn(),
            reserveStock: jest.fn(),
            releaseReservation: jest.fn(),
            deductStock: jest.fn(),
            checkAvailability: jest.fn(),
            findExpiredReservations: jest.fn(),
            getActiveReservations: jest.fn(),
            getReservationsByReference: jest.fn()
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        },
        {
          provide: NotificationService,
          useValue: {
            send: jest.fn(),
            sendAlert: jest.fn(),
            sendReport: jest.fn()
          }
        },
        {
          provide: MetricsService,
          useValue: {
            incrementCounter: jest.fn(),
            recordGauge: jest.fn(),
            recordHistogram: jest.fn()
          }
        }
      ]
    }).compile();

    integration = module.get<OrderInventoryIntegration>(OrderInventoryIntegration);
    dataSource = module.get(DataSource);
    orderListService = module.get(OrderListService);
    orderCreateService = module.get(OrderCreateService);
    inventoryService = module.get(InventoryService);
    eventEmitter = module.get(EventEmitter2);
    notificationService = module.get(NotificationService);
    metricsService = module.get(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('整合流程 1: 訂單確認與庫存分配', () => {
    it('當訂單狀態從 PENDING 變更為 CONFIRMED 時，應自動分配庫存', async () => {
      // Arrange
      const payload = {
        orderId: 'order-001',
        oldStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.CONFIRMED,
        userId: 'user-001'
      };

      const mockOrder = {
        id: 'order-001',
        items: [
          { productId: 'prod-001', quantity: 10, productCode: 'P001' },
          { productId: 'prod-002', quantity: 5, productCode: 'P002' }
        ],
        warehouseId: 'warehouse-001',
        deliveryDate: moment().add(3, 'days').toDate()
      };

      orderListService.getOrderDetail.mockResolvedValue(mockOrder as any);
      inventoryService.getInventory.mockResolvedValue({ quantity: 100 } as any);
      inventoryService.reserveStock.mockResolvedValue({ id: 'reservation-001' } as any);

      // Act
      await integration.handleOrderStatusChange(payload);

      // Assert
      expect(orderListService.getOrderDetail).toHaveBeenCalledWith('order-001');
      expect(inventoryService.reserveStock).toHaveBeenCalledTimes(2);
      expect(inventoryService.reserveStock).toHaveBeenCalledWith({
        itemId: 'prod-001',
        quantity: 10,
        warehouseId: 'warehouse-001',
        referenceType: 'order',
        referenceNo: 'order-001',
        expiresAt: expect.any(Date)
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        IntegrationEvents.INVENTORY_ALLOCATED,
        expect.objectContaining({
          orderId: 'order-001',
          userId: 'user-001'
        })
      );
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'order_inventory_integration',
        expect.objectContaining({
          action: 'status_change',
          from_status: OrderStatus.PENDING,
          to_status: OrderStatus.CONFIRMED
        })
      );
    });

    it('當庫存不足時，應拋出錯誤並回滾交易', async () => {
      // Arrange
      const payload = {
        orderId: 'order-001',
        oldStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.CONFIRMED,
        userId: 'user-001'
      };

      const mockOrder = {
        id: 'order-001',
        items: [{ productId: 'prod-001', quantity: 100, productCode: 'P001' }],
        warehouseId: 'warehouse-001'
      };

      orderListService.getOrderDetail.mockResolvedValue(mockOrder as any);
      
      // Mock 可用庫存查詢
      const getAvailableInventorySpy = jest.spyOn(integration, 'getAvailableInventory');
      getAvailableInventorySpy.mockResolvedValue({
        physical: 50,
        available: 30,
        reserved: 20,
        inTransit: 0,
        pendingOrders: 0
      });

      // Act & Assert
      await expect(integration.handleOrderStatusChange(payload))
        .rejects
        .toThrow('Insufficient inventory for product P001');
      
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(notificationService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'integration_error',
          severity: 'high',
          message: expect.stringContaining('訂單庫存整合失敗')
        })
      );
    });

    it('當訂單取消時，應釋放已預留的庫存', async () => {
      // Arrange
      const payload = {
        orderId: 'order-001',
        oldStatus: OrderStatus.CONFIRMED,
        newStatus: OrderStatus.CANCELLED,
        userId: 'user-001'
      };

      const mockReservations = [
        { id: 'res-001', itemId: 'prod-001', quantity: 10 },
        { id: 'res-002', itemId: 'prod-002', quantity: 5 }
      ];

      inventoryService.getReservationsByReference.mockResolvedValue(mockReservations as any);
      inventoryService.releaseReservation.mockResolvedValue(undefined);

      // Act
      await integration.handleOrderStatusChange(payload);

      // Assert
      expect(inventoryService.getReservationsByReference).toHaveBeenCalledWith('order', 'order-001');
      expect(inventoryService.releaseReservation).toHaveBeenCalledTimes(2);
      expect(inventoryService.releaseReservation).toHaveBeenCalledWith('res-001');
      expect(inventoryService.releaseReservation).toHaveBeenCalledWith('res-002');
    });
  });

  describe('整合流程 2: 庫存變動影響訂單', () => {
    it('當庫存低於安全存量時，應通知受影響的訂單', async () => {
      // Arrange
      const payload = {
        itemId: 'prod-001',
        warehouseId: 'warehouse-001',
        currentQty: 10,
        safetyStock: 50
      };

      const affectedOrders = [
        { id: 'order-001', itemQuantity: 15, priority: 1 },
        { id: 'order-002', itemQuantity: 20, priority: 2 }
      ];

      // Mock private methods
      const findOrdersSpy = jest.spyOn(integration as any, 'findOrdersAffectedByLowStock');
      findOrdersSpy.mockResolvedValue(affectedOrders);

      const notifySpy = jest.spyOn(integration as any, 'notifyLowStockImpact');
      notifySpy.mockResolvedValue(undefined);

      const adjustSpy = jest.spyOn(integration as any, 'adjustOrderPriorities');
      adjustSpy.mockResolvedValue(undefined);

      // Act
      await integration.handleLowStock(payload);

      // Assert
      expect(findOrdersSpy).toHaveBeenCalledWith('prod-001', 'warehouse-001', 10);
      expect(notifySpy).toHaveBeenCalledWith('prod-001', affectedOrders);
      expect(adjustSpy).toHaveBeenCalledWith(affectedOrders, 10);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        IntegrationEvents.TRIGGER_REPLENISHMENT,
        expect.objectContaining({
          itemId: 'prod-001',
          warehouseId: 'warehouse-001',
          currentQty: 10
        })
      );
    });
  });

  describe('整合流程 3: 可用庫存即時查詢', () => {
    it('應正確計算考慮預留的可用庫存', async () => {
      // Arrange
      const itemId = 'prod-001';
      const warehouseId = 'warehouse-001';

      inventoryService.getInventory.mockResolvedValue({
        quantity: 100,
        warehouseId: 'warehouse-001'
      } as any);

      // Mock private helper methods
      const getActiveReservationsSpy = jest.spyOn(integration as any, 'getActiveReservations');
      getActiveReservationsSpy.mockResolvedValue(30);

      const getInTransitQuantitySpy = jest.spyOn(integration as any, 'getInTransitQuantity');
      getInTransitQuantitySpy.mockResolvedValue(20);

      const getPendingOrderQuantitySpy = jest.spyOn(integration as any, 'getPendingOrderQuantity');
      getPendingOrderQuantitySpy.mockResolvedValue(15);

      // Act
      const result = await integration.getAvailableInventory(itemId, warehouseId);

      // Assert
      expect(result).toEqual({
        physical: 100,
        available: 75, // 100 - 30 + 20 - 15
        reserved: 30,
        inTransit: 20,
        pendingOrders: 15
      });
      expect(inventoryService.getInventory).toHaveBeenCalledWith(itemId, warehouseId);
    });

    it('不考慮預留時應返回實體庫存', async () => {
      // Arrange
      const itemId = 'prod-001';
      
      inventoryService.getInventory.mockResolvedValue({
        quantity: 100
      } as any);

      // Mock helper methods
      jest.spyOn(integration as any, 'getInTransitQuantity').mockResolvedValue(0);
      jest.spyOn(integration as any, 'getPendingOrderQuantity').mockResolvedValue(0);

      // Act
      const result = await integration.getAvailableInventory(
        itemId,
        undefined,
        false // considerReservations = false
      );

      // Assert
      expect(result.available).toBe(100);
      expect(result.reserved).toBe(0);
    });
  });

  describe('整合流程 4: 訂單可行性檢查', () => {
    it('應正確判斷訂單是否可滿足', async () => {
      // Arrange
      const orderItems = [
        { productId: 'prod-001', quantity: 10, requiredDate: new Date() },
        { productId: 'prod-002', quantity: 20, requiredDate: new Date() }
      ];

      // Mock available inventory for each item
      const getAvailableInventorySpy = jest.spyOn(integration, 'getAvailableInventory');
      getAvailableInventorySpy
        .mockResolvedValueOnce({
          physical: 50,
          available: 30,
          reserved: 10,
          inTransit: 5,
          pendingOrders: 15
        })
        .mockResolvedValueOnce({
          physical: 100,
          available: 80,
          reserved: 10,
          inTransit: 0,
          pendingOrders: 10
        });

      // Act
      const result = await integration.checkOrderFeasibility(orderItems);

      // Assert
      expect(result.isFeasible).toBe(true);
      expect(result.feasibleItems).toHaveLength(2);
      expect(result.infeasibleItems).toHaveLength(0);
      expect(result.feasibleItems[0]).toMatchObject({
        productId: 'prod-001',
        quantity: 10,
        availableQty: 30,
        fulfillmentType: 'stock'
      });
    });

    it('應識別不可滿足的品項並提供建議', async () => {
      // Arrange
      const orderItems = [
        { productId: 'prod-001', quantity: 100, requiredDate: new Date() }
      ];

      const getAvailableInventorySpy = jest.spyOn(integration, 'getAvailableInventory');
      getAvailableInventorySpy.mockResolvedValue({
        physical: 50,
        available: 30,
        reserved: 20,
        inTransit: 0,
        pendingOrders: 0
      });

      // Mock suggestion generation
      const generateSuggestionSpy = jest.spyOn(integration as any, 'generateFulfillmentSuggestion');
      generateSuggestionSpy.mockResolvedValue({
        type: 'partial_fulfillment',
        availableQty: 30,
        suggestedAction: 'Split order or wait for replenishment'
      });

      // Act
      const result = await integration.checkOrderFeasibility(orderItems);

      // Assert
      expect(result.isFeasible).toBe(false);
      expect(result.feasibleItems).toHaveLength(0);
      expect(result.infeasibleItems).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toMatchObject({
        itemId: 'prod-001',
        suggestion: expect.objectContaining({
          type: 'partial_fulfillment'
        })
      });
    });
  });

  describe('整合流程 5: 批次庫存分配', () => {
    it('應按FIFO策略成功分配庫存給多個訂單', async () => {
      // Arrange
      const orderIds = ['order-001', 'order-002', 'order-003'];
      
      const mockOrders = [
        {
          id: 'order-001',
          orderDate: new Date('2025-08-20'),
          items: [{ productId: 'prod-001', quantity: 10 }]
        },
        {
          id: 'order-002',
          orderDate: new Date('2025-08-21'),
          items: [{ productId: 'prod-001', quantity: 15 }]
        },
        {
          id: 'order-003',
          orderDate: new Date('2025-08-22'),
          items: [{ productId: 'prod-001', quantity: 20 }]
        }
      ];

      // Mock helper methods
      const getOrdersWithItemsSpy = jest.spyOn(integration as any, 'getOrdersWithItems');
      getOrdersWithItemsSpy.mockResolvedValue(mockOrders);

      const sortOrdersByStrategySpy = jest.spyOn(integration as any, 'sortOrdersByStrategy');
      sortOrdersByStrategySpy.mockReturnValue(mockOrders); // FIFO: already sorted by date

      const buildInventoryMapSpy = jest.spyOn(integration as any, 'buildInventoryMap');
      const inventoryMap = new Map([
        ['prod-001', { available: 30, reserved: 0 }]
      ]);
      buildInventoryMapSpy.mockResolvedValue(inventoryMap);

      const allocateInventoryToOrderSpy = jest.spyOn(integration as any, 'allocateInventoryToOrder');
      allocateInventoryToOrderSpy
        .mockResolvedValueOnce({ status: 'full', items: [] })    // order-001: 10 units
        .mockResolvedValueOnce({ status: 'full', items: [] })    // order-002: 15 units
        .mockResolvedValueOnce({ status: 'partial', items: [] }); // order-003: only 5 available

      // Act
      const result = await integration.batchAllocateInventory(orderIds, 'FIFO');

      // Assert
      expect(result.allocated).toHaveLength(2);
      expect(result.partial).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(result.allocated[0].orderId).toBe('order-001');
      expect(result.allocated[1].orderId).toBe('order-002');
      expect(result.partial[0].orderId).toBe('order-003');
      
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        IntegrationEvents.BATCH_ALLOCATION_COMPLETED,
        expect.objectContaining({
          allocated: 2,
          partial: 1,
          failed: 0
        })
      );
    });

    it('發生錯誤時應回滾所有分配', async () => {
      // Arrange
      const orderIds = ['order-001'];
      
      const getOrdersWithItemsSpy = jest.spyOn(integration as any, 'getOrdersWithItems');
      getOrdersWithItemsSpy.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(integration.batchAllocateInventory(orderIds))
        .rejects
        .toThrow('Database error');
      
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('定時任務', () => {
    describe('cleanupExpiredReservations', () => {
      it('應清理過期的庫存預留並通知相關訂單', async () => {
        // Arrange
        const expiredReservations = [
          {
            id: 'res-001',
            referenceType: 'order',
            referenceNo: 'order-001',
            itemId: 'prod-001',
            quantity: 10
          },
          {
            id: 'res-002',
            referenceType: 'order',
            referenceNo: 'order-002',
            itemId: 'prod-002',
            quantity: 5
          }
        ];

        inventoryService.findExpiredReservations.mockResolvedValue(expiredReservations as any);
        inventoryService.releaseReservation.mockResolvedValue(undefined);

        // Act
        await integration.cleanupExpiredReservations();

        // Assert
        expect(inventoryService.findExpiredReservations).toHaveBeenCalled();
        expect(inventoryService.releaseReservation).toHaveBeenCalledTimes(2);
        expect(notificationService.send).toHaveBeenCalledTimes(2);
        expect(notificationService.send).toHaveBeenCalledWith({
          type: 'reservation_expired',
          data: expect.objectContaining({
            orderId: 'order-001',
            itemId: 'prod-001',
            quantity: 10
          })
        });
      });
    });

    describe('reconcileInventoryAndOrders', () => {
      it('應對帳並修正孤立的預留', async () => {
        // Arrange
        const activeReservations = [
          {
            id: 'res-001',
            referenceType: 'order',
            referenceNo: 'order-001',
            itemId: 'prod-001'
          },
          {
            id: 'res-002',
            referenceType: 'order',
            referenceNo: 'order-999', // Non-existent order
            itemId: 'prod-002'
          }
        ];

        const existingOrders = [
          { id: 'order-001', status: OrderStatus.CONFIRMED }
        ];

        inventoryService.getActiveReservations.mockResolvedValue(activeReservations as any);
        orderListService.getOrdersByIds.mockResolvedValue(existingOrders as any);
        inventoryService.releaseReservation.mockResolvedValue(undefined);

        const logReconciliationResultSpy = jest.spyOn(integration as any, 'logReconciliationResult');
        logReconciliationResultSpy.mockResolvedValue(undefined);

        // Act
        await integration.reconcileInventoryAndOrders();

        // Assert
        expect(inventoryService.getActiveReservations).toHaveBeenCalled();
        expect(orderListService.getOrdersByIds).toHaveBeenCalledWith(['order-001', 'order-999']);
        expect(inventoryService.releaseReservation).toHaveBeenCalledWith('res-002');
        expect(notificationService.sendReport).toHaveBeenCalledWith({
          type: 'inventory_reconciliation',
          data: expect.objectContaining({
            discrepancyCount: 1
          })
        });
      });

      it('應釋放已取消訂單的預留', async () => {
        // Arrange
        const activeReservations = [
          {
            id: 'res-001',
            referenceType: 'order',
            referenceNo: 'order-001',
            itemId: 'prod-001'
          }
        ];

        const cancelledOrder = [
          { id: 'order-001', status: OrderStatus.CANCELLED }
        ];

        inventoryService.getActiveReservations.mockResolvedValue(activeReservations as any);
        orderListService.getOrdersByIds.mockResolvedValue(cancelledOrder as any);
        inventoryService.releaseReservation.mockResolvedValue(undefined);

        // Act
        await integration.reconcileInventoryAndOrders();

        // Assert
        expect(inventoryService.releaseReservation).toHaveBeenCalledWith('res-001');
        expect(notificationService.sendReport).toHaveBeenCalled();
      });
    });
  });

  describe('錯誤處理', () => {
    it('應正確處理並記錄網路錯誤', async () => {
      // Arrange
      const payload = {
        orderId: 'order-001',
        oldStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.CONFIRMED,
        userId: 'user-001'
      };

      orderListService.getOrderDetail.mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(integration.handleOrderStatusChange(payload))
        .rejects
        .toThrow('Network timeout');

      expect(notificationService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'integration_error',
          severity: 'high'
        })
      );
    });

    it('應處理並發修改衝突', async () => {
      // Arrange
      const orderIds = ['order-001', 'order-002'];
      
      // Simulate concurrent modification error
      const getOrdersWithItemsSpy = jest.spyOn(integration as any, 'getOrdersWithItems');
      getOrdersWithItemsSpy.mockRejectedValue(new Error('Deadlock detected'));

      // Act & Assert
      await expect(integration.batchAllocateInventory(orderIds))
        .rejects
        .toThrow('Deadlock detected');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('效能測試', () => {
    it('應在合理時間內處理大批量訂單分配', async () => {
      // Arrange
      const orderIds = Array.from({ length: 100 }, (_, i) => `order-${i + 1}`);
      const mockOrders = orderIds.map(id => ({
        id,
        items: [{ productId: 'prod-001', quantity: 1 }]
      }));

      jest.spyOn(integration as any, 'getOrdersWithItems').mockResolvedValue(mockOrders);
      jest.spyOn(integration as any, 'sortOrdersByStrategy').mockReturnValue(mockOrders);
      jest.spyOn(integration as any, 'buildInventoryMap').mockResolvedValue(new Map());
      jest.spyOn(integration as any, 'allocateInventoryToOrder').mockResolvedValue({
        status: 'full',
        items: []
      });

      // Act
      const startTime = Date.now();
      await integration.batchAllocateInventory(orderIds);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        IntegrationEvents.BATCH_ALLOCATION_COMPLETED,
        expect.any(Object)
      );
    });
  });
});