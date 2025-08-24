/**
 * Inventory Service
 * FR-WMS-IOD: 庫存概況/明細服務
 * 
 * @module InventoryService
 * @version 1.0.0
 * @since 2025-08-25
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, In, Between, LessThan } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryMovement } from '../entities/inventoryMovement.entity';
import { InventoryReservation } from '../entities/inventoryReservation.entity';
import { InventoryAlert } from '../entities/inventoryAlert.entity';
import { StockCount } from '../entities/stockCount.entity';
import { 
  InventoryFilter,
  InventoryResponse,
  InventoryMetrics,
  InventoryCheckResult,
  ReservationRequest,
  StockDeductRequest,
  InventoryAdjustment,
  AlertType,
  MovementType,
  InventoryStatus
} from '../types/inventory.types';
import { AppError } from '@/common/errors/app.error';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryEvents } from '../events/inventory.events';
import { CacheService } from '@/common/services/cache.service';
import { MetricsService } from '@/common/services/metrics.service';
import * as moment from 'moment';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(InventoryReservation)
    private readonly reservationRepository: Repository<InventoryReservation>,
    @InjectRepository(InventoryAlert)
    private readonly alertRepository: Repository<InventoryAlert>,
    @InjectRepository(StockCount)
    private readonly stockCountRepository: Repository<StockCount>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * FR-WMS-IOD-001: 即時庫存查詢
   * 支援多維度即時庫存查詢，回應時間 < 500ms
   */
  async queryInventory(filter: InventoryFilter): Promise<InventoryResponse> {
    const startTime = Date.now();
    this.logger.log(`Querying inventory with filter: ${JSON.stringify(filter)}`);

    try {
      // 檢查快取
      const cacheKey = this.buildCacheKey('inventory-query', filter);
      const cached = await this.cacheService.get<InventoryResponse>(cacheKey);
      if (cached && !filter.noCache) {
        this.metricsService.recordHistogram('inventory_query_time', Date.now() - startTime, {
          source: 'cache'
        });
        return cached;
      }

      // 建構查詢
      const queryBuilder = this.inventoryRepository.createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.item', 'item')
        .leftJoinAndSelect('inventory.warehouse', 'warehouse')
        .leftJoinAndSelect('inventory.location', 'location');

      // 套用篩選條件
      if (filter.itemIds?.length) {
        queryBuilder.andWhere('inventory.itemId IN (:...itemIds)', { 
          itemIds: filter.itemIds 
        });
      }

      if (filter.warehouseIds?.length) {
        queryBuilder.andWhere('inventory.warehouseId IN (:...warehouseIds)', { 
          warehouseIds: filter.warehouseIds 
        });
      }

      if (filter.batchNo) {
        queryBuilder.andWhere('inventory.batchNo LIKE :batchNo', { 
          batchNo: `%${filter.batchNo}%` 
        });
      }

      if (filter.status) {
        queryBuilder.andWhere('inventory.status = :status', { 
          status: filter.status 
        });
      }

      if (filter.expiryDateRange) {
        queryBuilder.andWhere('inventory.expiryDate BETWEEN :startDate AND :endDate', {
          startDate: filter.expiryDateRange.start,
          endDate: filter.expiryDateRange.end
        });
      }

      // 批號即將到期篩選
      if (filter.expiringDays) {
        const expiryThreshold = moment().add(filter.expiringDays, 'days').toDate();
        queryBuilder.andWhere('inventory.expiryDate <= :expiryThreshold', { 
          expiryThreshold 
        });
      }

      // 低庫存篩選
      if (filter.lowStock) {
        queryBuilder.andWhere('inventory.onHand <= inventory.safetyStock');
      }

      // 排序
      const sortField = filter.sortBy || 'itemCode';
      const sortOrder = filter.sortOrder || 'ASC';
      queryBuilder.orderBy(`inventory.${sortField}`, sortOrder);

      // 分頁
      const page = filter.page || 1;
      const pageSize = filter.pageSize || 20;
      queryBuilder.skip((page - 1) * pageSize).take(pageSize);

      // 執行查詢
      const [data, total] = await queryBuilder.getManyAndCount();

      // 計算統計資料
      const statistics = await this.calculateInventoryStatistics(filter);

      // 組裝回應
      const response: InventoryResponse = {
        data: await this.enrichInventoryData(data),
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        statistics,
        timestamp: new Date()
      };

      // 更新快取
      await this.cacheService.set(cacheKey, response, 60); // 快取60秒

      // 記錄效能指標
      const queryTime = Date.now() - startTime;
      this.metricsService.recordHistogram('inventory_query_time', queryTime, {
        source: 'database'
      });

      if (queryTime > 500) {
        this.logger.warn(`Slow inventory query: ${queryTime}ms`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Failed to query inventory: ${error.message}`, error.stack);
      throw new AppError('Failed to query inventory', 500);
    }
  }

  /**
   * FR-WMS-IOD-003: 庫存預警管理
   * 自動監控並發送預警通知
   */
  async checkInventoryAlerts(): Promise<void> {
    try {
      // 取得所有啟用的預警規則
      const activeAlerts = await this.alertRepository.find({
        where: { status: 'active' }
      });

      for (const alert of activeAlerts) {
        const triggered = await this.evaluateAlertCondition(alert);
        
        if (triggered) {
          await this.triggerAlert(alert);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to check inventory alerts: ${error.message}`, error.stack);
    }
  }

  /**
   * FR-WMS-IOD-004: 批號與效期管理
   * 提供批號生命週期管理和效期追蹤
   */
  async getBatchDetails(batchNo: string): Promise<any> {
    try {
      const inventory = await this.inventoryRepository.findOne({
        where: { batchNo },
        relations: ['movements', 'item', 'warehouse']
      });

      if (!inventory) {
        throw new AppError('Batch not found', 404);
      }

      // 取得批號族譜
      const genealogy = await this.traceBatchGenealogy(batchNo);

      // 取得使用記錄
      const usageHistory = await this.getBatchUsageHistory(batchNo);

      return {
        inventory,
        genealogy,
        usageHistory,
        daysToExpiry: inventory.expiryDate 
          ? moment(inventory.expiryDate).diff(moment(), 'days')
          : null,
        status: this.determineBatchStatus(inventory)
      };

    } catch (error) {
      this.logger.error(`Failed to get batch details: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 取得單一品項庫存
   */
  async getInventory(itemId: string, warehouseId?: string): Promise<Inventory> {
    const where: any = { itemId };
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const inventory = await this.inventoryRepository.findOne({ where });
    
    if (!inventory) {
      // 如果沒有庫存記錄，返回零庫存
      return this.createZeroInventory(itemId, warehouseId);
    }

    return inventory;
  }

  /**
   * 預留庫存
   */
  async reserveStock(request: ReservationRequest): Promise<InventoryReservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      // 檢查可用庫存
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: { 
          itemId: request.itemId,
          warehouseId: request.warehouseId
        },
        lock: { mode: 'pessimistic_write' }
      });

      if (!inventory) {
        throw new AppError('Item not found in warehouse', 404);
      }

      const availableQty = inventory.onHand - inventory.reserved;
      if (availableQty < request.quantity) {
        throw new AppError(
          `Insufficient inventory. Available: ${availableQty}, Requested: ${request.quantity}`,
          400
        );
      }

      // 建立預留記錄
      const reservation = queryRunner.manager.create(InventoryReservation, {
        itemId: request.itemId,
        warehouseId: request.warehouseId,
        quantity: request.quantity,
        referenceType: request.referenceType,
        referenceNo: request.referenceNo,
        expiresAt: request.expiresAt || moment().add(7, 'days').toDate(),
        status: 'active',
        createdAt: new Date()
      });

      await queryRunner.manager.save(reservation);

      // 更新庫存預留數量
      inventory.reserved += request.quantity;
      inventory.available = inventory.onHand - inventory.reserved;
      await queryRunner.manager.save(inventory);

      // 記錄異動
      await this.recordMovement(queryRunner, {
        itemId: request.itemId,
        warehouseId: request.warehouseId,
        movementType: MovementType.RESERVE,
        quantity: request.quantity,
        referenceType: request.referenceType,
        referenceNo: request.referenceNo,
        reason: 'Stock reservation'
      });

      await queryRunner.commitTransaction();

      // 發送事件
      this.eventEmitter.emit(InventoryEvents.STOCK_RESERVED, {
        reservation,
        timestamp: new Date()
      });

      // 清除快取
      await this.clearInventoryCache(request.itemId, request.warehouseId);

      return reservation;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to reserve stock: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 釋放預留
   */
  async releaseReservation(reservationId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(InventoryReservation, {
        where: { id: reservationId, status: 'active' }
      });

      if (!reservation) {
        throw new AppError('Active reservation not found', 404);
      }

      // 更新庫存預留數量
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: {
          itemId: reservation.itemId,
          warehouseId: reservation.warehouseId
        },
        lock: { mode: 'pessimistic_write' }
      });

      if (inventory) {
        inventory.reserved = Math.max(0, inventory.reserved - reservation.quantity);
        inventory.available = inventory.onHand - inventory.reserved;
        await queryRunner.manager.save(inventory);
      }

      // 更新預留狀態
      reservation.status = 'released';
      reservation.releasedAt = new Date();
      await queryRunner.manager.save(reservation);

      // 記錄異動
      await this.recordMovement(queryRunner, {
        itemId: reservation.itemId,
        warehouseId: reservation.warehouseId,
        movementType: MovementType.RELEASE,
        quantity: reservation.quantity,
        referenceType: reservation.referenceType,
        referenceNo: reservation.referenceNo,
        reason: 'Reservation released'
      });

      await queryRunner.commitTransaction();

      // 發送事件
      this.eventEmitter.emit(InventoryEvents.RESERVATION_RELEASED, {
        reservationId,
        timestamp: new Date()
      });

      // 清除快取
      await this.clearInventoryCache(reservation.itemId, reservation.warehouseId);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to release reservation: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 扣減庫存
   */
  async deductStock(request: StockDeductRequest): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: {
          itemId: request.itemId,
          warehouseId: request.warehouseId
        },
        lock: { mode: 'pessimistic_write' }
      });

      if (!inventory) {
        throw new AppError('Inventory not found', 404);
      }

      if (inventory.onHand < request.quantity) {
        throw new AppError(
          `Insufficient inventory. OnHand: ${inventory.onHand}, Requested: ${request.quantity}`,
          400
        );
      }

      // 扣減庫存
      inventory.onHand -= request.quantity;
      inventory.available = inventory.onHand - inventory.reserved;
      inventory.lastMovementDate = new Date();
      
      await queryRunner.manager.save(inventory);

      // 記錄異動
      await this.recordMovement(queryRunner, {
        itemId: request.itemId,
        warehouseId: request.warehouseId,
        movementType: MovementType.OUTBOUND,
        quantity: -request.quantity,
        referenceType: request.referenceType,
        referenceNo: request.referenceNo,
        reason: request.reason || 'Stock deduction'
      });

      await queryRunner.commitTransaction();

      // 檢查低庫存
      if (inventory.onHand <= inventory.safetyStock) {
        this.eventEmitter.emit(InventoryEvents.LOW_STOCK, {
          itemId: request.itemId,
          warehouseId: request.warehouseId,
          currentQty: inventory.onHand,
          safetyStock: inventory.safetyStock
        });
      }

      // 清除快取
      await this.clearInventoryCache(request.itemId, request.warehouseId);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to deduct stock: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 檢查庫存可用性
   */
  async checkAvailability(request: {
    items: Array<{
      itemId: string;
      quantity: number;
      warehouseId: string;
    }>;
    checkDate?: Date;
  }): Promise<InventoryCheckResult[]> {
    const results: InventoryCheckResult[] = [];

    for (const item of request.items) {
      const inventory = await this.getInventory(item.itemId, item.warehouseId);
      const availableQty = inventory.onHand - inventory.reserved;
      
      const result: InventoryCheckResult = {
        itemId: item.itemId,
        itemCode: inventory.itemCode,
        requestedQty: item.quantity,
        availableQty,
        isAvailable: availableQty >= item.quantity,
        shortage: Math.max(0, item.quantity - availableQty),
        nextAvailableDate: null,
        alternatives: []
      };

      // 如果庫存不足，查找替代方案
      if (!result.isAvailable) {
        result.nextAvailableDate = await this.predictNextAvailableDate(
          item.itemId,
          item.warehouseId,
          item.quantity
        );
        result.alternatives = await this.findAlternativeItems(item.itemId);
      }

      results.push(result);
    }

    return results;
  }

  /**
   * 查找過期的預留
   */
  async findExpiredReservations(): Promise<InventoryReservation[]> {
    return await this.reservationRepository.find({
      where: {
        status: 'active',
        expiresAt: LessThan(new Date())
      }
    });
  }

  /**
   * 取得活躍的預留
   */
  async getActiveReservations(): Promise<InventoryReservation[]> {
    return await this.reservationRepository.find({
      where: { status: 'active' }
    });
  }

  /**
   * 根據參考取得預留
   */
  async getReservationsByReference(
    referenceType: string,
    referenceNo: string
  ): Promise<InventoryReservation[]> {
    return await this.reservationRepository.find({
      where: {
        referenceType,
        referenceNo,
        status: 'active'
      }
    });
  }

  /**
   * 根據訂單ID列表取得訂單
   */
  async getOrdersByIds(orderIds: string[]): Promise<any[]> {
    // This would typically query the Order entity
    // For now, returning mock implementation
    return [];
  }

  // ==================== Private Helper Methods ====================

  /**
   * 建立快取鍵
   */
  private buildCacheKey(prefix: string, params: any): string {
    const paramStr = JSON.stringify(params);
    return `${prefix}:${Buffer.from(paramStr).toString('base64')}`;
  }

  /**
   * 清除庫存快取
   */
  private async clearInventoryCache(itemId: string, warehouseId?: string): Promise<void> {
    const patterns = [
      `inventory-query:*`,
      `inventory-item:${itemId}*`
    ];
    
    if (warehouseId) {
      patterns.push(`inventory-warehouse:${warehouseId}*`);
    }

    for (const pattern of patterns) {
      await this.cacheService.delPattern(pattern);
    }
  }

  /**
   * 豐富庫存資料
   */
  private async enrichInventoryData(inventories: Inventory[]): Promise<any[]> {
    return inventories.map(inv => ({
      ...inv,
      daysToExpiry: inv.expiryDate 
        ? moment(inv.expiryDate).diff(moment(), 'days')
        : null,
      isLowStock: inv.onHand <= inv.safetyStock,
      isExpiring: inv.expiryDate 
        ? moment(inv.expiryDate).isBefore(moment().add(30, 'days'))
        : false,
      turnoverRate: this.calculateTurnoverRate(inv),
      stockAge: moment().diff(inv.receivedDate, 'days')
    }));
  }

  /**
   * 計算庫存統計
   */
  private async calculateInventoryStatistics(filter: InventoryFilter): Promise<any> {
    const queryBuilder = this.inventoryRepository.createQueryBuilder('inventory');

    // Apply same filters
    if (filter.warehouseIds?.length) {
      queryBuilder.andWhere('inventory.warehouseId IN (:...warehouseIds)', { 
        warehouseIds: filter.warehouseIds 
      });
    }

    const stats = await queryBuilder
      .select('COUNT(DISTINCT inventory.itemId)', 'totalSKUs')
      .addSelect('SUM(inventory.onHand)', 'totalQuantity')
      .addSelect('SUM(inventory.onHand * inventory.unitCost)', 'totalValue')
      .addSelect('COUNT(CASE WHEN inventory.onHand <= inventory.safetyStock THEN 1 END)', 'lowStockItems')
      .addSelect('COUNT(CASE WHEN inventory.expiryDate <= :thirtyDays THEN 1 END)', 'expiringItems')
      .setParameter('thirtyDays', moment().add(30, 'days').toDate())
      .getRawOne();

    return {
      totalSKUs: parseInt(stats.totalSKUs) || 0,
      totalQuantity: parseFloat(stats.totalQuantity) || 0,
      totalValue: parseFloat(stats.totalValue) || 0,
      lowStockItems: parseInt(stats.lowStockItems) || 0,
      expiringItems: parseInt(stats.expiringItems) || 0,
      averageValue: stats.totalSKUs > 0 
        ? parseFloat(stats.totalValue) / parseInt(stats.totalSKUs)
        : 0
    };
  }

  /**
   * 評估預警條件
   */
  private async evaluateAlertCondition(alert: InventoryAlert): Promise<boolean> {
    // Implementation would evaluate specific alert conditions
    return false;
  }

  /**
   * 觸發預警
   */
  private async triggerAlert(alert: InventoryAlert): Promise<void> {
    this.eventEmitter.emit(InventoryEvents.ALERT_TRIGGERED, {
      alert,
      timestamp: new Date()
    });

    // Update last triggered
    alert.lastTriggeredAt = new Date();
    alert.triggerCount++;
    await this.alertRepository.save(alert);
  }

  /**
   * 追蹤批號族譜
   */
  private async traceBatchGenealogy(batchNo: string): Promise<any> {
    // Implementation would trace batch genealogy
    return {};
  }

  /**
   * 取得批號使用歷史
   */
  private async getBatchUsageHistory(batchNo: string): Promise<any[]> {
    return await this.movementRepository.find({
      where: { batchNo },
      order: { movementDate: 'DESC' }
    });
  }

  /**
   * 判斷批號狀態
   */
  private determineBatchStatus(inventory: Inventory): string {
    if (!inventory.expiryDate) return 'normal';
    
    const daysToExpiry = moment(inventory.expiryDate).diff(moment(), 'days');
    
    if (daysToExpiry < 0) return 'expired';
    if (daysToExpiry <= 7) return 'critical';
    if (daysToExpiry <= 30) return 'warning';
    
    return 'normal';
  }

  /**
   * 建立零庫存記錄
   */
  private createZeroInventory(itemId: string, warehouseId?: string): Inventory {
    const inventory = new Inventory();
    inventory.itemId = itemId;
    inventory.warehouseId = warehouseId || 'default';
    inventory.onHand = 0;
    inventory.available = 0;
    inventory.reserved = 0;
    inventory.frozen = 0;
    inventory.damaged = 0;
    inventory.safetyStock = 0;
    inventory.unitCost = 0;
    inventory.totalValue = 0;
    inventory.status = InventoryStatus.ACTIVE;
    return inventory;
  }

  /**
   * 記錄庫存異動
   */
  private async recordMovement(
    queryRunner: QueryRunner,
    data: any
  ): Promise<void> {
    const movement = queryRunner.manager.create(InventoryMovement, {
      movementNo: await this.generateMovementNo(),
      movementType: data.movementType,
      movementDate: new Date(),
      itemId: data.itemId,
      warehouseId: data.warehouseId,
      quantity: data.quantity,
      referenceType: data.referenceType,
      referenceNo: data.referenceNo,
      reason: data.reason,
      createdAt: new Date()
    });

    await queryRunner.manager.save(movement);
  }

  /**
   * 生成異動單號
   */
  private async generateMovementNo(): Promise<string> {
    const date = moment().format('YYYYMMDD');
    const sequence = await this.getNextSequence('MOV', new Date());
    return `MOV-${date}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * 取得下一個序號
   */
  private async getNextSequence(prefix: string, date: Date): Promise<number> {
    // Implementation would get next sequence from database or Redis
    return Math.floor(Math.random() * 999999) + 1;
  }

  /**
   * 預測下次可用日期
   */
  private async predictNextAvailableDate(
    itemId: string,
    warehouseId: string,
    requiredQty: number
  ): Promise<Date | null> {
    // Implementation would check incoming orders and production plans
    return moment().add(7, 'days').toDate();
  }

  /**
   * 查找替代品項
   */
  private async findAlternativeItems(itemId: string): Promise<any[]> {
    // Implementation would find substitute items
    return [];
  }

  /**
   * 計算週轉率
   */
  private calculateTurnoverRate(inventory: Inventory): number {
    // Simple calculation - would need historical data for accurate calculation
    if (inventory.onHand === 0) return 0;
    return 365 / (inventory.onHand / (inventory.dailyUsage || 1));
  }
}