/**
 * Order Create Service
 * FR-OM-COSR: 建立訂單與銷退服務
 * 
 * @module OrderCreateService
 * @version 1.0.0
 * @since 2025-08-25
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/orderItem.entity';
import { Customer } from '@/modules/customer/entities/customer.entity';
import { Product } from '@/modules/product/entities/product.entity';
import { Inventory } from '@/modules/warehouse/entities/inventory.entity';
import { 
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatus,
  OrderValidation,
  PricingResult,
  InventoryCheckResult,
  CreditCheckResult,
  OrderSource
} from '../types/order.types';
import { AppError } from '@/common/errors/app.error';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderEvents } from '../events/order.events';
import { InventoryService } from '@/modules/warehouse/services/inventory.service';
import { PricingService } from '@/modules/pricing/services/pricing.service';
import { CreditService } from '@/modules/finance/services/credit.service';
import { NotificationService } from '@/common/services/notification.service';
import * as moment from 'moment';

@Injectable()
export class OrderCreateService {
  private readonly logger = new Logger(OrderCreateService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService,
    private readonly creditService: CreditService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * FR-OM-COSR-001: 建立訂單
   * 完整的訂單建立流程，包含驗證、定價、庫存檢查、信用檢查
   */
  async createOrder(
    request: CreateOrderRequest,
    userId: string
  ): Promise<CreateOrderResponse> {
    this.logger.log(`Creating order for customer ${request.customerId}`);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      // Step 1: 驗證基本資料
      const validation = await this.validateOrderRequest(request, queryRunner);
      if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
      }

      // Step 2: 取得客戶資料
      const customer = await this.getCustomerWithValidation(
        request.customerId,
        queryRunner
      );

      // Step 3: 驗證並準備產品資料
      const products = await this.validateAndPrepareProducts(
        request.items,
        queryRunner
      );

      // Step 4: 計算價格
      const pricingResult = await this.calculatePricing(
        customer,
        request.items,
        products,
        request
      );

      // Step 5: 檢查庫存
      const inventoryCheck = await this.checkInventory(
        request.items,
        request.deliveryDate,
        request.warehouseId
      );

      if (!inventoryCheck.isAvailable && !request.allowBackorder) {
        throw new AppError(
          `庫存不足: ${inventoryCheck.unavailableItems.join(', ')}`,
          400
        );
      }

      // Step 6: 信用額度檢查
      const creditCheck = await this.checkCredit(
        customer.id,
        pricingResult.totalAmount
      );

      if (!creditCheck.isApproved && !request.overrideCredit) {
        throw new AppError(
          `信用額度不足。可用額度: ${creditCheck.availableCredit}, 訂單金額: ${pricingResult.totalAmount}`,
          400
        );
      }

      // Step 7: 生成訂單號
      const orderNo = await this.generateOrderNo(request.source);

      // Step 8: 建立訂單主檔
      const order = await this.createOrderEntity(
        queryRunner,
        {
          orderNo,
          customer,
          request,
          pricingResult,
          inventoryCheck,
          creditCheck,
          userId
        }
      );

      // Step 9: 建立訂單明細
      const orderItems = await this.createOrderItems(
        queryRunner,
        order.id,
        request.items,
        products,
        pricingResult
      );

      // Step 10: 預留庫存
      if (request.reserveInventory) {
        await this.reserveInventory(
          queryRunner,
          order.id,
          orderItems,
          request.warehouseId
        );
      }

      // Step 11: 更新信用額度
      if (!request.skipCreditUpdate) {
        await this.updateCreditUsage(
          queryRunner,
          customer.id,
          pricingResult.totalAmount
        );
      }

      // Step 12: 提交交易
      await queryRunner.commitTransaction();

      // Step 13: 發送事件和通知
      await this.sendOrderCreatedEvents(order, orderItems);

      // Step 14: 準備回應
      const response: CreateOrderResponse = {
        success: true,
        order: {
          ...order,
          items: orderItems
        },
        validationResults: validation,
        pricingResult,
        inventoryCheck,
        creditCheck,
        message: `訂單 ${orderNo} 建立成功`
      };

      this.logger.log(`Order ${orderNo} created successfully`);
      return response;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * FR-OM-COSR-002: 建立銷退單
   * 處理退貨訂單的建立
   */
  async createReturnOrder(
    originalOrderId: string,
    returnItems: any[],
    reason: string,
    userId: string
  ): Promise<CreateOrderResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 取得原訂單
      const originalOrder = await queryRunner.manager.findOne(Order, {
        where: { id: originalOrderId },
        relations: ['items', 'customer']
      });

      if (!originalOrder) {
        throw new AppError('Original order not found', 404);
      }

      // 驗證退貨項目
      this.validateReturnItems(originalOrder, returnItems);

      // 生成退貨單號
      const returnOrderNo = await this.generateReturnOrderNo(originalOrder.orderNo);

      // 建立退貨訂單
      const returnOrder = queryRunner.manager.create(Order, {
        orderNo: returnOrderNo,
        customerId: originalOrder.customerId,
        orderType: 'return',
        status: OrderStatus.PENDING,
        originalOrderId: originalOrderId,
        returnReason: reason,
        // 金額為負數
        subtotal: -returnItems.reduce((sum, item) => sum + item.subtotal, 0),
        totalAmount: -returnItems.reduce((sum, item) => sum + item.subtotal, 0),
        orderDate: new Date(),
        createdBy: userId,
        source: OrderSource.RETURN
      });

      await queryRunner.manager.save(returnOrder);

      // 建立退貨明細
      const returnOrderItems = [];
      for (const item of returnItems) {
        const returnItem = queryRunner.manager.create(OrderItem, {
          orderId: returnOrder.id,
          productId: item.productId,
          quantity: -item.quantity, // 負數數量
          unitPrice: item.unitPrice,
          subtotal: -item.subtotal,
          originalOrderItemId: item.originalItemId
        });
        returnOrderItems.push(returnItem);
      }

      await queryRunner.manager.save(returnOrderItems);

      // 釋放庫存預留
      await this.releaseInventoryReservation(
        queryRunner,
        originalOrderId,
        returnItems
      );

      // 更新信用額度（增加可用額度）
      await this.updateCreditUsage(
        queryRunner,
        originalOrder.customerId,
        -returnOrder.totalAmount
      );

      await queryRunner.commitTransaction();

      // 發送退貨通知
      await this.sendReturnOrderNotification(returnOrder, originalOrder);

      return {
        success: true,
        order: returnOrder,
        message: `退貨單 ${returnOrderNo} 建立成功`
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create return order: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * FR-OM-COSR-003: 快速建單
   * 簡化的訂單建立流程，用於常客快速下單
   */
  async quickCreateOrder(
    customerId: string,
    templateId: string,
    adjustments: any,
    userId: string
  ): Promise<CreateOrderResponse> {
    try {
      // 載入訂單模板
      const template = await this.loadOrderTemplate(customerId, templateId);
      
      if (!template) {
        throw new AppError('Order template not found', 404);
      }

      // 套用調整
      const orderRequest = this.applyTemplateAdjustments(template, adjustments);

      // 使用標準建單流程
      return await this.createOrder(orderRequest, userId);

    } catch (error) {
      this.logger.error(`Quick order creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * FR-OM-COSR-004: 批次建單
   * 支援批量匯入訂單（Excel/CSV）
   */
  async batchCreateOrders(
    orders: CreateOrderRequest[],
    userId: string,
    options: { stopOnError?: boolean; validateOnly?: boolean }
  ): Promise<{
    success: any[];
    failed: any[];
    summary: any;
  }> {
    const results = {
      success: [],
      failed: [],
      summary: {
        total: orders.length,
        succeeded: 0,
        failed: 0,
        totalAmount: 0
      }
    };

    for (const [index, orderRequest] of orders.entries()) {
      try {
        // 驗證模式
        if (options.validateOnly) {
          const validation = await this.validateOrderRequest(orderRequest);
          if (validation.isValid) {
            results.success.push({
              index,
              orderRequest,
              validation
            });
            results.summary.succeeded++;
          } else {
            results.failed.push({
              index,
              orderRequest,
              errors: validation.errors
            });
            results.summary.failed++;
          }
        } else {
          // 實際建單
          const response = await this.createOrder(orderRequest, userId);
          results.success.push({
            index,
            orderNo: response.order.orderNo,
            amount: response.order.totalAmount
          });
          results.summary.succeeded++;
          results.summary.totalAmount += response.order.totalAmount;
        }
      } catch (error) {
        results.failed.push({
          index,
          orderRequest,
          error: error.message
        });
        results.summary.failed++;

        if (options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * FR-OM-COSR-005: 訂單草稿
   * 儲存未完成的訂單草稿
   */
  async saveDraft(
    draftData: Partial<CreateOrderRequest>,
    draftId?: string,
    userId?: string
  ): Promise<{
    draftId: string;
    expiresAt: Date;
  }> {
    try {
      const draft = {
        id: draftId || this.generateDraftId(),
        data: draftData,
        userId,
        createdAt: new Date(),
        expiresAt: moment().add(7, 'days').toDate()
      };

      // 儲存到 Redis 或資料庫
      await this.saveDraftToStorage(draft);

      return {
        draftId: draft.id,
        expiresAt: draft.expiresAt
      };
    } catch (error) {
      this.logger.error(`Failed to save draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * 驗證訂單請求
   */
  private async validateOrderRequest(
    request: CreateOrderRequest,
    queryRunner?: QueryRunner
  ): Promise<OrderValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填欄位檢查
    if (!request.customerId) {
      errors.push('客戶ID為必填');
    }

    if (!request.items || request.items.length === 0) {
      errors.push('訂單必須包含至少一個品項');
    }

    // 日期驗證
    if (request.deliveryDate) {
      const deliveryDate = moment(request.deliveryDate);
      if (deliveryDate.isBefore(moment(), 'day')) {
        errors.push('交貨日期不能早於今天');
      }

      // 檢查休市日
      const isMarketClosed = await this.checkMarketClose(deliveryDate.toDate());
      if (isMarketClosed) {
        warnings.push(`${deliveryDate.format('YYYY-MM-DD')} 為休市日`);
      }
    }

    // 品項驗證
    for (const item of request.items || []) {
      if (!item.productId) {
        errors.push('品項ID為必填');
      }
      if (item.quantity <= 0) {
        errors.push(`品項 ${item.productId} 數量必須大於0`);
      }
      if (item.unitPrice && item.unitPrice < 0) {
        errors.push(`品項 ${item.productId} 單價不能為負數`);
      }
    }

    // 金額驗證
    if (request.discount && request.discount > 100) {
      errors.push('折扣不能超過100%');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date()
    };
  }

  /**
   * 取得並驗證客戶
   */
  private async getCustomerWithValidation(
    customerId: string,
    queryRunner: QueryRunner
  ): Promise<Customer> {
    const customer = await queryRunner.manager.findOne(Customer, {
      where: { id: customerId },
      relations: ['company', 'units', 'pricingTier']
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (customer.status === 'blacklisted') {
      throw new AppError('Customer is blacklisted', 403);
    }

    if (customer.status === 'inactive') {
      throw new AppError('Customer is inactive', 400);
    }

    return customer;
  }

  /**
   * 驗證並準備產品資料
   */
  private async validateAndPrepareProducts(
    items: any[],
    queryRunner: QueryRunner
  ): Promise<Map<string, Product>> {
    const productIds = items.map(item => item.productId);
    const products = await queryRunner.manager.findByIds(Product, productIds);

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new AppError(`Products not found: ${missingIds.join(', ')}`, 404);
    }

    const productMap = new Map<string, Product>();
    for (const product of products) {
      // 檢查產品狀態
      if (product.status === 'discontinued') {
        throw new AppError(`Product ${product.code} is discontinued`, 400);
      }

      if (!product.canSell) {
        throw new AppError(`Product ${product.code} is not available for sale`, 400);
      }

      productMap.set(product.id, product);
    }

    return productMap;
  }

  /**
   * 計算訂單價格
   */
  private async calculatePricing(
    customer: Customer,
    items: any[],
    products: Map<string, Product>,
    request: CreateOrderRequest
  ): Promise<PricingResult> {
    // 使用定價服務計算
    const pricingRequest = {
      customerId: customer.id,
      customerTier: customer.pricingTier,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        listPrice: products.get(item.productId).listPrice
      })),
      discountRate: request.discount,
      deliveryDate: request.deliveryDate
    };

    const pricing = await this.pricingService.calculateOrderPricing(pricingRequest);

    return {
      items: pricing.items,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      tax: pricing.tax,
      shipping: pricing.shipping,
      totalAmount: pricing.totalAmount,
      currency: pricing.currency
    };
  }

  /**
   * 檢查庫存可用性
   */
  private async checkInventory(
    items: any[],
    deliveryDate: Date,
    warehouseId?: string
  ): Promise<InventoryCheckResult> {
    const checkResults = await this.inventoryService.checkAvailability({
      items: items.map(item => ({
        itemId: item.productId,
        quantity: item.quantity,
        warehouseId: warehouseId || 'default'
      })),
      checkDate: deliveryDate
    });

    const unavailableItems = checkResults
      .filter(r => !r.isAvailable)
      .map(r => r.itemCode);

    return {
      isAvailable: unavailableItems.length === 0,
      availableItems: checkResults.filter(r => r.isAvailable).map(r => r.itemId),
      unavailableItems,
      suggestions: checkResults
        .filter(r => !r.isAvailable)
        .map(r => ({
          itemId: r.itemId,
          availableQty: r.availableQty,
          nextAvailableDate: r.nextAvailableDate,
          alternativeItems: r.alternatives
        }))
    };
  }

  /**
   * 檢查信用額度
   */
  private async checkCredit(
    customerId: string,
    orderAmount: number
  ): Promise<CreditCheckResult> {
    const creditStatus = await this.creditService.checkCreditLimit(
      customerId,
      orderAmount
    );

    return {
      isApproved: creditStatus.isApproved,
      availableCredit: creditStatus.availableCredit,
      currentUsage: creditStatus.currentUsage,
      creditLimit: creditStatus.creditLimit,
      requiresApproval: creditStatus.requiresApproval,
      approvalLevel: creditStatus.approvalLevel
    };
  }

  /**
   * 生成訂單號
   */
  private async generateOrderNo(source: OrderSource): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const prefix = this.getOrderPrefix(source);
    const sequence = await this.getNextSequence(prefix, date);
    
    return `${prefix}-${year}${month}${day}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * 取得訂單前綴
   */
  private getOrderPrefix(source: OrderSource): string {
    const prefixMap = {
      [OrderSource.MANUAL]: 'ORD',
      [OrderSource.ONLINE]: 'WEB',
      [OrderSource.API]: 'API',
      [OrderSource.IMPORT]: 'IMP',
      [OrderSource.RETURN]: 'RET',
      [OrderSource.MOBILE]: 'MOB'
    };
    return prefixMap[source] || 'ORD';
  }

  /**
   * 取得下一個序號
   */
  private async getNextSequence(prefix: string, date: Date): Promise<number> {
    // 實作序號生成邏輯（使用 Redis 或資料庫序列）
    return 1;
  }

  /**
   * 建立訂單實體
   */
  private async createOrderEntity(
    queryRunner: QueryRunner,
    data: any
  ): Promise<Order> {
    const order = queryRunner.manager.create(Order, {
      orderNo: data.orderNo,
      customerId: data.customer.id,
      customerName: data.customer.name,
      status: OrderStatus.PENDING,
      orderType: 'standard',
      source: data.request.source || OrderSource.MANUAL,
      
      // 金額資訊
      subtotal: data.pricingResult.subtotal,
      discount: data.pricingResult.discount,
      tax: data.pricingResult.tax,
      shipping: data.pricingResult.shipping,
      totalAmount: data.pricingResult.totalAmount,
      currency: data.pricingResult.currency,
      
      // 配送資訊
      deliveryAddress: data.request.deliveryAddress,
      deliveryDate: data.request.deliveryDate,
      deliveryWindow: data.request.deliveryWindow,
      
      // 付款資訊
      paymentMethod: data.request.paymentMethod,
      paymentTerms: data.customer.paymentTerms,
      
      // 其他資訊
      notes: data.request.notes,
      tags: data.request.tags,
      salesRepId: data.request.salesRepId,
      
      // 系統資訊
      orderDate: new Date(),
      createdBy: data.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await queryRunner.manager.save(order);
  }

  /**
   * 建立訂單明細
   */
  private async createOrderItems(
    queryRunner: QueryRunner,
    orderId: string,
    items: any[],
    products: Map<string, Product>,
    pricingResult: PricingResult
  ): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const [index, item] of items.entries()) {
      const product = products.get(item.productId);
      const pricingItem = pricingResult.items[index];

      const orderItem = queryRunner.manager.create(OrderItem, {
        orderId,
        lineNo: index + 1,
        productId: item.productId,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unit: item.unit || product.unit,
        unitPrice: pricingItem.unitPrice,
        listPrice: product.listPrice,
        discount: pricingItem.discount,
        subtotal: pricingItem.subtotal,
        tax: pricingItem.tax,
        totalAmount: pricingItem.totalAmount,
        
        // 額外資訊
        specifications: item.specifications,
        notes: item.notes,
        
        // 狀態
        status: 'pending',
        createdAt: new Date()
      });

      orderItems.push(orderItem);
    }

    return await queryRunner.manager.save(orderItems);
  }

  /**
   * 預留庫存
   */
  private async reserveInventory(
    queryRunner: QueryRunner,
    orderId: string,
    items: OrderItem[],
    warehouseId?: string
  ): Promise<void> {
    for (const item of items) {
      await this.inventoryService.reserveStock({
        itemId: item.productId,
        quantity: item.quantity,
        warehouseId: warehouseId || 'default',
        referenceType: 'order',
        referenceNo: orderId,
        expiresAt: moment().add(7, 'days').toDate()
      });
    }
  }

  /**
   * 更新信用額度使用
   */
  private async updateCreditUsage(
    queryRunner: QueryRunner,
    customerId: string,
    amount: number
  ): Promise<void> {
    await this.creditService.updateUsage({
      customerId,
      amount,
      type: amount > 0 ? 'increase' : 'decrease',
      reference: 'order'
    });
  }

  /**
   * 發送訂單建立事件
   */
  private async sendOrderCreatedEvents(
    order: Order,
    items: OrderItem[]
  ): Promise<void> {
    // 發送事件
    this.eventEmitter.emit(OrderEvents.ORDER_CREATED, {
      order,
      items,
      timestamp: new Date()
    });

    // 發送通知
    await this.notificationService.send({
      type: 'order_created',
      recipients: [order.customerId, order.salesRepId],
      data: {
        orderNo: order.orderNo,
        amount: order.totalAmount,
        itemCount: items.length
      }
    });
  }

  /**
   * 其他輔助方法...
   */
  private validateReturnItems(originalOrder: Order, returnItems: any[]): void {
    // 實作退貨項目驗證
  }

  private generateReturnOrderNo(originalOrderNo: string): Promise<string> {
    // 實作退貨單號生成
    return Promise.resolve(`RET-${originalOrderNo}`);
  }

  private releaseInventoryReservation(
    queryRunner: QueryRunner,
    orderId: string,
    items: any[]
  ): Promise<void> {
    // 實作庫存預留釋放
    return Promise.resolve();
  }

  private sendReturnOrderNotification(
    returnOrder: Order,
    originalOrder: Order
  ): Promise<void> {
    // 實作退貨通知
    return Promise.resolve();
  }

  private async checkMarketClose(date: Date): Promise<boolean> {
    // 實作休市日檢查
    return false;
  }

  private async loadOrderTemplate(
    customerId: string,
    templateId: string
  ): Promise<any> {
    // 實作訂單模板載入
    return null;
  }

  private applyTemplateAdjustments(template: any, adjustments: any): CreateOrderRequest {
    // 實作模板調整套用
    return {} as CreateOrderRequest;
  }

  private generateDraftId(): string {
    // 實作草稿ID生成
    return `DRAFT-${Date.now()}`;
  }

  private async saveDraftToStorage(draft: any): Promise<void> {
    // 實作草稿儲存
  }
}