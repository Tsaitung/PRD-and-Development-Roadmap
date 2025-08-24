/**
 * Order List Service
 * FR-OM-OL: 訂單列表管理服務
 * 
 * @module OrderListService
 * @version 2.0.0
 * @since 2025-08-24
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/orderItem.entity';
import { 
  OrderFilter, 
  OrderListResponse, 
  OrderStatus,
  BatchOperationRequest,
  BatchOperationResult,
  OrderStatistics
} from '../types/order.types';
import { AppError } from '@/common/errors/app.error';
import { CacheService } from '@/common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderEvents } from '../events/order.events';

@Injectable()
export class OrderListService {
  private readonly logger = new Logger(OrderListService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * FR-OM-OL-001: 取得訂單列表
   * 支援分頁、排序、自訂欄位
   */
  async getOrderList(filter: OrderFilter): Promise<OrderListResponse> {
    try {
      const cacheKey = this.buildCacheKey('order-list', filter);
      const cached = await this.cacheService.get<OrderListResponse>(cacheKey);
      
      if (cached && !filter.noCache) {
        this.logger.debug('Returning cached order list');
        return cached;
      }

      const queryBuilder = this.buildOrderQuery(filter);
      const [orders, total] = await queryBuilder.getManyAndCount();
      
      // 計算統計資料
      const statistics = await this.calculateStatistics(filter);
      
      const response: OrderListResponse = {
        data: orders,
        pagination: {
          total,
          page: filter.page || 1,
          pageSize: filter.pageSize || 50,
          totalPages: Math.ceil(total / (filter.pageSize || 50))
        },
        statistics,
        timestamp: new Date()
      };

      // 快取結果（5分鐘）
      await this.cacheService.set(cacheKey, response, 300);
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to get order list: ${error.message}`, error.stack);
      throw new AppError('Failed to retrieve order list', 500, error);
    }
  }

  /**
   * FR-OM-OL-002: 進階搜尋
   * 支援多條件組合篩選和模糊搜尋
   */
  async searchOrders(searchParams: any): Promise<OrderListResponse> {
    try {
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('order.customer', 'customer');

      // 訂單編號搜尋（支援部分匹配）
      if (searchParams.orderNo) {
        queryBuilder.andWhere('order.orderNo LIKE :orderNo', {
          orderNo: `%${searchParams.orderNo}%`
        });
      }

      // 客戶搜尋
      if (searchParams.customerSearch) {
        queryBuilder.andWhere(
          new Brackets(qb => {
            qb.where('customer.name LIKE :search', { search: `%${searchParams.customerSearch}%` })
              .orWhere('customer.code LIKE :search', { search: `%${searchParams.customerSearch}%` });
          })
        );
      }

      // 日期範圍
      if (searchParams.dateRange) {
        queryBuilder.andWhere('order.orderDate BETWEEN :startDate AND :endDate', {
          startDate: searchParams.dateRange.start,
          endDate: searchParams.dateRange.end
        });
      }

      // 金額範圍
      if (searchParams.amountRange) {
        queryBuilder.andWhere('order.totalAmount BETWEEN :minAmount AND :maxAmount', {
          minAmount: searchParams.amountRange.min,
          maxAmount: searchParams.amountRange.max
        });
      }

      // 產品搜尋
      if (searchParams.productSearch) {
        queryBuilder.andWhere(
          'EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = order.id AND oi.product_name LIKE :product)',
          { product: `%${searchParams.productSearch}%` }
        );
      }

      // 狀態篩選（多選）
      if (searchParams.statuses && searchParams.statuses.length > 0) {
        queryBuilder.andWhere('order.status IN (:...statuses)', {
          statuses: searchParams.statuses
        });
      }

      // 業務員篩選
      if (searchParams.salesRepId) {
        queryBuilder.andWhere('order.salesRepId = :salesRepId', {
          salesRepId: searchParams.salesRepId
        });
      }

      // 配送區域
      if (searchParams.deliveryRegion) {
        queryBuilder.andWhere('order.deliveryAddress->>"$.region" = :region', {
          region: searchParams.deliveryRegion
        });
      }

      // 排序
      const sortBy = searchParams.sortBy || 'orderDate';
      const sortOrder = searchParams.sortOrder || 'DESC';
      queryBuilder.orderBy(`order.${sortBy}`, sortOrder as 'ASC' | 'DESC');

      // 分頁
      const page = searchParams.page || 1;
      const pageSize = searchParams.pageSize || 50;
      queryBuilder.skip((page - 1) * pageSize).take(pageSize);

      const [orders, total] = await queryBuilder.getManyAndCount();

      // 儲存搜尋歷史
      await this.saveSearchHistory(searchParams);

      return {
        data: orders,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        statistics: await this.calculateStatistics(searchParams),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Search orders failed: ${error.message}`, error.stack);
      throw new AppError('Search operation failed', 500, error);
    }
  }

  /**
   * FR-OM-OL-003: 訂單狀態管理
   * 支援單筆或批次更新訂單狀態
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
    userId?: string
  ): Promise<Order> {
    const queryRunner = this.orderRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 取得訂單並鎖定
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // 驗證狀態轉換
      this.validateStatusTransition(order.status, newStatus);

      // 儲存舊狀態
      const oldStatus = order.status;

      // 更新狀態
      order.status = newStatus;
      order.updatedAt = new Date();
      order.updatedBy = userId;

      // 儲存變更
      await queryRunner.manager.save(order);

      // 記錄狀態變更歷史
      await this.recordStatusHistory(queryRunner, {
        orderId,
        oldStatus,
        newStatus,
        reason,
        userId,
        timestamp: new Date()
      });

      await queryRunner.commitTransaction();

      // 發送狀態變更事件
      this.eventEmitter.emit(OrderEvents.STATUS_CHANGED, {
        orderId,
        oldStatus,
        newStatus,
        userId
      });

      // 清除快取
      await this.clearOrderCache(orderId);

      this.logger.log(`Order ${orderId} status updated from ${oldStatus} to ${newStatus}`);
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update order status: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * FR-OM-OL-004: 批次操作
   * 支援批次更新、匯出、列印等操作
   */
  async batchOperation(request: BatchOperationRequest): Promise<BatchOperationResult> {
    const results: BatchOperationResult = {
      success: [],
      failed: [],
      total: request.orderIds.length,
      operation: request.operation,
      timestamp: new Date()
    };

    try {
      switch (request.operation) {
        case 'updateStatus':
          return await this.batchUpdateStatus(request);
        
        case 'export':
          return await this.batchExport(request);
        
        case 'print':
          return await this.batchPrint(request);
        
        case 'delete':
          return await this.batchDelete(request);
        
        default:
          throw new AppError(`Unsupported operation: ${request.operation}`, 400);
      }
    } catch (error) {
      this.logger.error(`Batch operation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * FR-OM-OL-005: 取得訂單詳細資訊
   */
  async getOrderDetail(orderId: string): Promise<Order> {
    try {
      // 嘗試從快取取得
      const cacheKey = `order-detail:${orderId}`;
      const cached = await this.cacheService.get<Order>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: [
          'items',
          'items.product',
          'customer',
          'customer.company',
          'customer.stores',
          'deliveryLogs',
          'statusHistory',
          'payments',
          'documents'
        ]
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // 快取結果（10分鐘）
      await this.cacheService.set(cacheKey, order, 600);

      return order;
    } catch (error) {
      this.logger.error(`Failed to get order detail: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * FR-OM-OL-006: 訂單匯出
   */
  async exportOrders(
    filter: OrderFilter,
    format: 'excel' | 'csv' | 'pdf',
    columns?: string[]
  ): Promise<string> {
    try {
      // 取得訂單資料
      const orders = await this.getOrdersForExport(filter);

      // 根據格式處理匯出
      let exportUrl: string;
      
      switch (format) {
        case 'excel':
          exportUrl = await this.exportToExcel(orders, columns);
          break;
        case 'csv':
          exportUrl = await this.exportToCsv(orders, columns);
          break;
        case 'pdf':
          exportUrl = await this.exportToPdf(orders, columns);
          break;
        default:
          throw new AppError(`Unsupported export format: ${format}`, 400);
      }

      // 記錄匯出歷史
      await this.recordExportHistory({
        filter,
        format,
        columns,
        recordCount: orders.length,
        exportUrl,
        timestamp: new Date()
      });

      return exportUrl;
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== Private Methods ====================

  /**
   * 建立訂單查詢
   */
  private buildOrderQuery(filter: OrderFilter): SelectQueryBuilder<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items');

    // 基本篩選條件
    if (filter.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', {
        customerId: filter.customerId
      });
    }

    if (filter.status && filter.status.length > 0) {
      queryBuilder.andWhere('order.status IN (:...status)', {
        status: filter.status
      });
    }

    if (filter.dateRange) {
      queryBuilder.andWhere('order.orderDate BETWEEN :start AND :end', {
        start: filter.dateRange.start,
        end: filter.dateRange.end
      });
    }

    // 排序
    const sortBy = filter.sortBy || 'orderDate';
    const sortOrder = filter.sortOrder || 'DESC';
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // 分頁
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 50;
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    return queryBuilder;
  }

  /**
   * 計算統計資料
   */
  private async calculateStatistics(filter: OrderFilter): Promise<OrderStatistics> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    // 套用相同的篩選條件
    if (filter.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', {
        customerId: filter.customerId
      });
    }

    if (filter.status && filter.status.length > 0) {
      queryBuilder.andWhere('order.status IN (:...status)', {
        status: filter.status
      });
    }

    if (filter.dateRange) {
      queryBuilder.andWhere('order.orderDate BETWEEN :start AND :end', {
        start: filter.dateRange.start,
        end: filter.dateRange.end
      });
    }

    const stats = await queryBuilder
      .select('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.totalAmount)', 'totalAmount')
      .addSelect('AVG(order.totalAmount)', 'avgOrderValue')
      .addSelect('COUNT(DISTINCT order.customerId)', 'uniqueCustomers')
      .getRawOne();

    return {
      totalOrders: parseInt(stats.totalOrders) || 0,
      totalAmount: parseFloat(stats.totalAmount) || 0,
      avgOrderValue: parseFloat(stats.avgOrderValue) || 0,
      uniqueCustomers: parseInt(stats.uniqueCustomers) || 0
    };
  }

  /**
   * 驗證狀態轉換合法性
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.RETURNED],
      [OrderStatus.COMPLETED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }
  }

  /**
   * 批次更新狀態
   */
  private async batchUpdateStatus(
    request: BatchOperationRequest
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult = {
      success: [],
      failed: [],
      total: request.orderIds.length,
      operation: 'updateStatus',
      timestamp: new Date()
    };

    for (const orderId of request.orderIds) {
      try {
        await this.updateOrderStatus(
          orderId,
          request.parameters.status,
          request.reason,
          request.parameters.userId
        );
        results.success.push({ orderId, message: 'Status updated successfully' });
      } catch (error) {
        results.failed.push({
          orderId,
          error: error.message,
          reason: error.stack
        });
      }
    }

    return results;
  }

  /**
   * 批次匯出
   */
  private async batchExport(request: BatchOperationRequest): Promise<BatchOperationResult> {
    // 實作批次匯出邏輯
    throw new Error('Method not implemented');
  }

  /**
   * 批次列印
   */
  private async batchPrint(request: BatchOperationRequest): Promise<BatchOperationResult> {
    // 實作批次列印邏輯
    throw new Error('Method not implemented');
  }

  /**
   * 批次刪除
   */
  private async batchDelete(request: BatchOperationRequest): Promise<BatchOperationResult> {
    // 實作批次刪除邏輯
    throw new Error('Method not implemented');
  }

  /**
   * 記錄狀態變更歷史
   */
  private async recordStatusHistory(queryRunner: any, history: any): Promise<void> {
    // 實作狀態歷史記錄
  }

  /**
   * 儲存搜尋歷史
   */
  private async saveSearchHistory(searchParams: any): Promise<void> {
    // 實作搜尋歷史儲存
  }

  /**
   * 清除訂單快取
   */
  private async clearOrderCache(orderId: string): Promise<void> {
    await this.cacheService.del(`order-detail:${orderId}`);
    await this.cacheService.delPattern('order-list:*');
  }

  /**
   * 建立快取鍵
   */
  private buildCacheKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {});
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * 取得匯出用訂單資料
   */
  private async getOrdersForExport(filter: OrderFilter): Promise<Order[]> {
    const queryBuilder = this.buildOrderQuery(filter);
    // 移除分頁限制
    queryBuilder.skip(0).take(0);
    return await queryBuilder.getMany();
  }

  /**
   * 匯出為 Excel
   */
  private async exportToExcel(orders: Order[], columns?: string[]): Promise<string> {
    // 實作 Excel 匯出
    throw new Error('Method not implemented');
  }

  /**
   * 匯出為 CSV
   */
  private async exportToCsv(orders: Order[], columns?: string[]): Promise<string> {
    // 實作 CSV 匯出
    throw new Error('Method not implemented');
  }

  /**
   * 匯出為 PDF
   */
  private async exportToPdf(orders: Order[], columns?: string[]): Promise<string> {
    // 實作 PDF 匯出
    throw new Error('Method not implemented');
  }

  /**
   * 記錄匯出歷史
   */
  private async recordExportHistory(history: any): Promise<void> {
    // 實作匯出歷史記錄
  }
}