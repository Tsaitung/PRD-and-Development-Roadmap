/**
 * Order-Inventory Integration Service
 * 訂單與庫存整合服務
 * 
 * @module OrderInventoryIntegration
 * @version 1.0.0
 * @since 2025-08-25
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, QueryRunner } from 'typeorm';
import { OrderListService } from '@/modules/order/services/orderList.service';
import { OrderCreateService } from '@/modules/order/services/orderCreate.service';
import { InventoryService } from '@/modules/warehouse/services/inventory.service';
import { 
  OrderStatus, 
  OrderEvents,
  InventoryEvents,
  IntegrationEvents 
} from '@/common/events';
import { AppError } from '@/common/errors/app.error';
import { NotificationService } from '@/common/services/notification.service';
import { MetricsService } from '@/common/services/metrics.service';
import * as moment from 'moment';

@Injectable()
export class OrderInventoryIntegration {
  private readonly logger = new Logger(OrderInventoryIntegration.name);
  
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderListService: OrderListService,
    private readonly orderCreateService: OrderCreateService,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * 整合流程 1: 訂單確認與庫存分配
   * 當訂單狀態變更為確認時，自動分配庫存
   */
  @OnEvent(OrderEvents.STATUS_CHANGED)
  async handleOrderStatusChange(payload: {
    orderId: string;
    oldStatus: OrderStatus;
    newStatus: OrderStatus;
    userId: string;
  }): Promise<void> {
    const { orderId, oldStatus, newStatus, userId } = payload;
    
    try {
      // 訂單確認 -> 分配庫存
      if (oldStatus === OrderStatus.PENDING && newStatus === OrderStatus.CONFIRMED) {
        await this.allocateInventoryForOrder(orderId, userId);
      }
      
      // 訂單取消 -> 釋放庫存
      if (newStatus === OrderStatus.CANCELLED) {
        await this.releaseInventoryForOrder(orderId, userId);
      }
      
      // 訂單完成 -> 扣減庫存
      if (newStatus === OrderStatus.COMPLETED) {
        await this.deductInventoryForOrder(orderId, userId);
      }
      
      // 記錄指標
      this.metricsService.incrementCounter('order_inventory_integration', {
        action: 'status_change',
        from_status: oldStatus,
        to_status: newStatus
      });
      
    } catch (error) {
      this.logger.error(
        `Failed to handle order status change for ${orderId}: ${error.message}`,
        error.stack
      );
      
      // 發送錯誤通知
      await this.notificationService.sendAlert({
        type: 'integration_error',
        severity: 'high',
        message: `訂單庫存整合失敗: ${orderId}`,
        details: error.message
      });
      
      throw error;
    }
  }

  /**
   * 整合流程 2: 庫存變動影響訂單
   * 當庫存不足時，自動調整相關訂單
   */
  @OnEvent(InventoryEvents.LOW_STOCK)
  async handleLowStock(payload: {
    itemId: string;
    warehouseId: string;
    currentQty: number;
    safetyStock: number;
  }): Promise<void> {
    const { itemId, warehouseId, currentQty } = payload;
    
    try {
      // 查找受影響的待確認訂單
      const affectedOrders = await this.findOrdersAffectedByLowStock(
        itemId,
        warehouseId,
        currentQty
      );
      
      if (affectedOrders.length > 0) {
        // 通知相關人員
        await this.notifyLowStockImpact(itemId, affectedOrders);
        
        // 自動調整訂單優先級
        await this.adjustOrderPriorities(affectedOrders, currentQty);
      }
      
      // 觸發自動補貨流程
      this.eventEmitter.emit(IntegrationEvents.TRIGGER_REPLENISHMENT, {
        itemId,
        warehouseId,
        currentQty,
        suggestedQty: this.calculateReplenishmentQty(payload)
      });
      
    } catch (error) {
      this.logger.error(
        `Failed to handle low stock for item ${itemId}: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 整合流程 3: 可用庫存即時查詢
   * 提供考慮訂單預留的真實可用庫存
   */
  async getAvailableInventory(
    itemId: string,
    warehouseId?: string,
    considerReservations: boolean = true
  ): Promise<{
    physical: number;
    available: number;
    reserved: number;
    inTransit: number;
    pendingOrders: number;
  }> {
    try {
      // 取得實體庫存
      const physicalInventory = await this.inventoryService.getInventory(
        itemId,
        warehouseId
      );
      
      // 取得預留數量
      const reservations = considerReservations
        ? await this.getActiveReservations(itemId, warehouseId)
        : 0;
      
      // 取得在途數量
      const inTransit = await this.getInTransitQuantity(itemId, warehouseId);
      
      // 取得待處理訂單數量
      const pendingOrders = await this.getPendingOrderQuantity(itemId, warehouseId);
      
      // 計算真實可用庫存
      const available = physicalInventory.quantity - reservations + inTransit - pendingOrders;
      
      return {
        physical: physicalInventory.quantity,
        available: Math.max(0, available),
        reserved: reservations,
        inTransit,
        pendingOrders
      };
      
    } catch (error) {
      this.logger.error(
        `Failed to get available inventory for ${itemId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * 整合流程 4: 訂單可行性檢查
   * 在建立訂單前檢查是否可滿足
   */
  async checkOrderFeasibility(
    orderItems: Array<{
      productId: string;
      quantity: number;
      requiredDate: Date;
    }>,
    options: {
      warehouseId?: string;
      allowPartial?: boolean;
      checkProduction?: boolean;
    } = {}
  ): Promise<{
    isFeasible: boolean;
    feasibleItems: any[];
    infeasibleItems: any[];
    suggestions: any[];
  }> {
    const feasibleItems = [];
    const infeasibleItems = [];
    const suggestions = [];
    
    for (const item of orderItems) {
      // 檢查可用庫存
      const availability = await this.getAvailableInventory(
        item.productId,
        options.warehouseId
      );
      
      if (availability.available >= item.quantity) {
        feasibleItems.push({
          ...item,
          availableQty: availability.available,
          fulfillmentType: 'stock'
        });
      } else {
        // 檢查是否可透過生產滿足
        if (options.checkProduction) {
          const productionCapacity = await this.checkProductionCapacity(
            item.productId,
            item.quantity - availability.available,
            item.requiredDate
          );
          
          if (productionCapacity.canProduce) {
            feasibleItems.push({
              ...item,
              availableQty: availability.available,
              productionQty: item.quantity - availability.available,
              fulfillmentType: 'mixed',
              productionLeadTime: productionCapacity.leadTime
            });
          } else {
            infeasibleItems.push(item);
            
            // 提供替代建議
            suggestions.push({
              itemId: item.productId,
              suggestion: await this.generateFulfillmentSuggestion(item, availability)
            });
          }
        } else {
          infeasibleItems.push(item);
        }
      }
    }
    
    return {
      isFeasible: infeasibleItems.length === 0 || 
                 (options.allowPartial && feasibleItems.length > 0),
      feasibleItems,
      infeasibleItems,
      suggestions
    };
  }

  /**
   * 整合流程 5: 批次庫存分配
   * 為多個訂單優化分配庫存
   */
  async batchAllocateInventory(
    orderIds: string[],
    allocationStrategy: 'FIFO' | 'PRIORITY' | 'FAIR' = 'FIFO'
  ): Promise<{
    allocated: Array<{ orderId: string; items: any[] }>;
    partial: Array<{ orderId: string; items: any[] }>;
    failed: Array<{ orderId: string; reason: string }>;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');
    
    try {
      // 取得所有訂單詳情
      const orders = await this.getOrdersWithItems(orderIds, queryRunner);
      
      // 根據策略排序訂單
      const sortedOrders = this.sortOrdersByStrategy(orders, allocationStrategy);
      
      // 取得所有相關品項的庫存
      const inventoryMap = await this.buildInventoryMap(orders, queryRunner);
      
      const allocated = [];
      const partial = [];
      const failed = [];
      
      // 逐個訂單分配庫存
      for (const order of sortedOrders) {
        const allocationResult = await this.allocateInventoryToOrder(
          order,
          inventoryMap,
          queryRunner
        );
        
        if (allocationResult.status === 'full') {
          allocated.push({
            orderId: order.id,
            items: allocationResult.items
          });
        } else if (allocationResult.status === 'partial') {
          partial.push({
            orderId: order.id,
            items: allocationResult.items
          });
        } else {
          failed.push({
            orderId: order.id,
            reason: allocationResult.reason
          });
        }
      }
      
      await queryRunner.commitTransaction();
      
      // 發送分配完成事件
      this.eventEmitter.emit(IntegrationEvents.BATCH_ALLOCATION_COMPLETED, {
        allocated: allocated.length,
        partial: partial.length,
        failed: failed.length
      });
      
      return { allocated, partial, failed };
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Batch allocation failed: ${error.message}`,
        error.stack
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 定時任務: 清理過期的庫存預留
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredReservations(): Promise<void> {
    try {
      const expiredReservations = await this.inventoryService.findExpiredReservations();
      
      for (const reservation of expiredReservations) {
        await this.inventoryService.releaseReservation(reservation.id);
        
        // 通知相關訂單
        if (reservation.referenceType === 'order') {
          await this.notificationService.send({
            type: 'reservation_expired',
            data: {
              orderId: reservation.referenceNo,
              itemId: reservation.itemId,
              quantity: reservation.quantity
            }
          });
        }
      }
      
      this.logger.log(`Cleaned up ${expiredReservations.length} expired reservations`);
      
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired reservations: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 定時任務: 庫存與訂單對帳
   */
  @Cron('0 2 * * *') // 每天凌晨2點執行
  async reconcileInventoryAndOrders(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // 取得所有活躍的庫存預留
      const reservations = await this.inventoryService.getActiveReservations();
      
      // 取得所有相關的訂單
      const orderIds = reservations
        .filter(r => r.referenceType === 'order')
        .map(r => r.referenceNo);
      
      const orders = await this.orderListService.getOrdersByIds(orderIds);
      
      // 對帳並修正差異
      const discrepancies = [];
      
      for (const reservation of reservations) {
        const order = orders.find(o => o.id === reservation.referenceNo);
        
        if (!order) {
          // 訂單不存在，釋放預留
          discrepancies.push({
            type: 'orphan_reservation',
            reservation,
            action: 'release'
          });
          await this.inventoryService.releaseReservation(reservation.id);
        } else if (order.status === OrderStatus.CANCELLED) {
          // 訂單已取消，釋放預留
          discrepancies.push({
            type: 'cancelled_order_reservation',
            reservation,
            order,
            action: 'release'
          });
          await this.inventoryService.releaseReservation(reservation.id);
        }
      }
      
      // 記錄對帳結果
      if (discrepancies.length > 0) {
        await this.logReconciliationResult({
          date: new Date(),
          discrepancies,
          duration: Date.now() - startTime
        });
        
        // 發送對帳報告
        await this.notificationService.sendReport({
          type: 'inventory_reconciliation',
          data: {
            discrepancyCount: discrepancies.length,
            details: discrepancies
          }
        });
      }
      
      this.logger.log(
        `Reconciliation completed. Found ${discrepancies.length} discrepancies`
      );
      
    } catch (error) {
      this.logger.error(
        `Reconciliation failed: ${error.message}`,
        error.stack
      );
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * 為訂單分配庫存
   */
  private async allocateInventoryForOrder(
    orderId: string,
    userId: string
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const order = await this.orderListService.getOrderDetail(orderId);
      
      for (const item of order.items) {
        // 檢查可用庫存
        const availability = await this.getAvailableInventory(
          item.productId,
          order.warehouseId
        );
        
        if (availability.available < item.quantity) {
          throw new AppError(
            `Insufficient inventory for product ${item.productCode}`,
            400
          );
        }
        
        // 建立庫存預留
        await this.inventoryService.reserveStock({
          itemId: item.productId,
          quantity: item.quantity,
          warehouseId: order.warehouseId,
          referenceType: 'order',
          referenceNo: orderId,
          expiresAt: moment(order.deliveryDate).add(1, 'day').toDate()
        });
      }
      
      await queryRunner.commitTransaction();
      
      // 發送分配成功事件
      this.eventEmitter.emit(IntegrationEvents.INVENTORY_ALLOCATED, {
        orderId,
        userId,
        timestamp: new Date()
      });
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 釋放訂單的庫存預留
   */
  private async releaseInventoryForOrder(
    orderId: string,
    userId: string
  ): Promise<void> {
    try {
      const reservations = await this.inventoryService.getReservationsByReference(
        'order',
        orderId
      );
      
      for (const reservation of reservations) {
        await this.inventoryService.releaseReservation(reservation.id);
      }
      
      this.logger.log(`Released ${reservations.length} reservations for order ${orderId}`);
      
    } catch (error) {
      this.logger.error(
        `Failed to release inventory for order ${orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * 扣減訂單的實際庫存
   */
  private async deductInventoryForOrder(
    orderId: string,
    userId: string
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const order = await this.orderListService.getOrderDetail(orderId);
      
      for (const item of order.items) {
        // 扣減庫存
        await this.inventoryService.deductStock({
          itemId: item.productId,
          quantity: item.quantity,
          warehouseId: order.warehouseId,
          referenceType: 'order',
          referenceNo: orderId,
          reason: 'order_fulfillment'
        });
      }
      
      // 釋放相關預留
      await this.releaseInventoryForOrder(orderId, userId);
      
      await queryRunner.commitTransaction();
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 查找受低庫存影響的訂單
   */
  private async findOrdersAffectedByLowStock(
    itemId: string,
    warehouseId: string,
    availableQty: number
  ): Promise<any[]> {
    // 實作查找邏輯
    return [];
  }

  /**
   * 通知低庫存影響
   */
  private async notifyLowStockImpact(
    itemId: string,
    affectedOrders: any[]
  ): Promise<void> {
    // 實作通知邏輯
  }

  /**
   * 調整訂單優先級
   */
  private async adjustOrderPriorities(
    orders: any[],
    availableQty: number
  ): Promise<void> {
    // 實作優先級調整邏輯
  }

  /**
   * 計算補貨數量
   */
  private calculateReplenishmentQty(data: any): number {
    // 實作補貨數量計算邏輯
    return 0;
  }

  /**
   * 其他輔助方法實作...
   */
  private async getActiveReservations(
    itemId: string,
    warehouseId?: string
  ): Promise<number> {
    return 0;
  }

  private async getInTransitQuantity(
    itemId: string,
    warehouseId?: string
  ): Promise<number> {
    return 0;
  }

  private async getPendingOrderQuantity(
    itemId: string,
    warehouseId?: string
  ): Promise<number> {
    return 0;
  }

  private async checkProductionCapacity(
    productId: string,
    quantity: number,
    requiredDate: Date
  ): Promise<any> {
    return { canProduce: false, leadTime: 0 };
  }

  private async generateFulfillmentSuggestion(
    item: any,
    availability: any
  ): Promise<any> {
    return {};
  }

  private async getOrdersWithItems(
    orderIds: string[],
    queryRunner: QueryRunner
  ): Promise<any[]> {
    return [];
  }

  private sortOrdersByStrategy(
    orders: any[],
    strategy: string
  ): any[] {
    return orders;
  }

  private async buildInventoryMap(
    orders: any[],
    queryRunner: QueryRunner
  ): Promise<Map<string, any>> {
    return new Map();
  }

  private async allocateInventoryToOrder(
    order: any,
    inventoryMap: Map<string, any>,
    queryRunner: QueryRunner
  ): Promise<any> {
    return { status: 'full', items: [] };
  }

  private async logReconciliationResult(result: any): Promise<void> {
    // 實作對帳結果記錄
  }
}