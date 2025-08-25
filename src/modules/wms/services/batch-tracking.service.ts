/**
 * 批號追溯服務
 * WMS-BTM Batch Tracking Service
 * 
 * 實現批號管理、追溯查詢、合規性檢查等核心功能
 */

import { BatchEntity, BatchQuery, BatchOperationResult } from '../entities/batch.entity';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';

export class BatchTrackingService extends EventEmitter {
  private batches: Map<string, BatchEntity> = new Map();
  private batchIndex: Map<string, Set<string>> = new Map(); // itemCode -> batchNos
  private serialIndex: Map<string, string> = new Map(); // serialNo -> batchNo
  
  constructor() {
    super();
    this.initializeService();
  }
  
  private initializeService(): void {
    console.log('Batch Tracking Service initialized');
  }
  
  /**
   * 創建新批號
   */
  async createBatch(data: Partial<BatchEntity>): Promise<BatchOperationResult> {
    try {
      // 生成批號
      const batchNo = data.batchNo || this.generateBatchNo(data.itemCode || 'UNKNOWN');
      
      // 檢查批號是否已存在
      if (this.batches.has(batchNo)) {
        return {
          success: false,
          batchNo,
          operation: 'create',
          errors: [`Batch ${batchNo} already exists`]
        };
      }
      
      // 創建批次實體
      const batch: BatchEntity = {
        id: uuidv4(),
        batchNo,
        serialNo: data.serialNo,
        itemCode: data.itemCode || '',
        itemName: data.itemName || '',
        itemType: data.itemType || 'raw_material',
        specification: data.specification,
        
        batchInfo: {
          productionDate: data.batchInfo?.productionDate || new Date(),
          expiryDate: data.batchInfo?.expiryDate,
          bestBeforeDate: data.batchInfo?.bestBeforeDate,
          manufacturer: data.batchInfo?.manufacturer,
          supplier: data.batchInfo?.supplier,
          quantity: {
            initial: data.batchInfo?.quantity?.initial || 0,
            current: data.batchInfo?.quantity?.initial || 0,
            reserved: 0,
            available: data.batchInfo?.quantity?.initial || 0,
            unit: data.batchInfo?.quantity?.unit || 'PCS'
          },
          status: 'active',
          location: data.batchInfo?.location
        },
        
        quality: {
          inspectionStatus: 'pending',
          certificates: [],
          testResults: [],
          defects: []
        },
        
        traceability: {
          upstream: data.traceability?.upstream,
          downstream: { childBatches: [], consumptionDocs: [] },
          production: data.traceability?.production
        },
        
        transactions: [],
        
        compliance: data.compliance,
        costing: data.costing,
        attributes: data.attributes,
        alerts: [],
        
        metadata: {
          createdAt: new Date(),
          createdBy: 'system',
          version: 1
        }
      };
      
      // 保存批次
      this.batches.set(batchNo, batch);
      
      // 更新索引
      this.updateIndexes(batch);
      
      // 記錄初始交易
      await this.recordTransaction(batchNo, {
        type: 'receipt',
        quantity: batch.batchInfo.quantity.initial,
        reference: { docType: 'batch_creation', docNo: batchNo }
      });
      
      // 發送事件
      this.emit('batch:created', batch);
      
      return {
        success: true,
        batchNo,
        operation: 'create',
        quantity: batch.batchInfo.quantity.initial,
        newBalance: batch.batchInfo.quantity.current
      };
      
    } catch (error) {
      console.error('Error creating batch:', error);
      return {
        success: false,
        batchNo: data.batchNo || '',
        operation: 'create',
        errors: [error.message]
      };
    }
  }
  
  /**
   * 查詢批號
   */
  async queryBatches(query: BatchQuery): Promise<BatchEntity[]> {
    let results: BatchEntity[] = [];
    
    // 基本過濾
    for (const batch of this.batches.values()) {
      let match = true;
      
      // 批號匹配
      if (query.batchNo && !batch.batchNo.includes(query.batchNo)) {
        match = false;
      }
      
      // 產品編碼匹配
      if (query.itemCode && batch.itemCode !== query.itemCode) {
        match = false;
      }
      
      // 狀態匹配
      if (query.status && !query.status.includes(batch.batchInfo.status)) {
        match = false;
      }
      
      // 生產日期範圍
      if (query.productionDateFrom && batch.batchInfo.productionDate < query.productionDateFrom) {
        match = false;
      }
      if (query.productionDateTo && batch.batchInfo.productionDate > query.productionDateTo) {
        match = false;
      }
      
      // 有效期範圍
      if (query.expiryDateFrom && batch.batchInfo.expiryDate && 
          batch.batchInfo.expiryDate < query.expiryDateFrom) {
        match = false;
      }
      if (query.expiryDateTo && batch.batchInfo.expiryDate && 
          batch.batchInfo.expiryDate > query.expiryDateTo) {
        match = false;
      }
      
      // 倉庫位置
      if (query.warehouse && batch.batchInfo.location?.warehouse !== query.warehouse) {
        match = false;
      }
      
      // 可用數量
      if (query.availableQtyMin !== undefined && 
          batch.batchInfo.quantity.available < query.availableQtyMin) {
        match = false;
      }
      if (query.availableQtyMax !== undefined && 
          batch.batchInfo.quantity.available > query.availableQtyMax) {
        match = false;
      }
      
      // 供應商
      if (query.supplier && batch.batchInfo.supplier?.code !== query.supplier) {
        match = false;
      }
      
      if (match) {
        results.push(batch);
      }
    }
    
    // 排序
    if (query.sortBy) {
      results.sort((a, b) => {
        let aVal = this.getNestedProperty(a, query.sortBy!);
        let bVal = this.getNestedProperty(b, query.sortBy!);
        
        if (query.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    // 分頁
    if (query.page && query.limit) {
      const start = (query.page - 1) * query.limit;
      results = results.slice(start, start + query.limit);
    }
    
    return results;
  }
  
  /**
   * 獲取批號詳情
   */
  async getBatchDetail(batchNo: string): Promise<BatchEntity | null> {
    return this.batches.get(batchNo) || null;
  }
  
  /**
   * 批號追溯 - 向上追溯原料來源
   */
  async traceUpstream(batchNo: string, levels: number = 3): Promise<any> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      throw new Error(`Batch ${batchNo} not found`);
    }
    
    const result = {
      batchNo,
      itemCode: batch.itemCode,
      itemName: batch.itemName,
      productionDate: batch.batchInfo.productionDate,
      parents: [] as any[]
    };
    
    if (levels > 0 && batch.traceability.upstream?.parentBatches) {
      for (const parent of batch.traceability.upstream.parentBatches) {
        const parentTrace = await this.traceUpstream(parent.batchNo, levels - 1);
        result.parents.push(parentTrace);
      }
    }
    
    return result;
  }
  
  /**
   * 批號追溯 - 向下追溯產品去向
   */
  async traceDownstream(batchNo: string, levels: number = 3): Promise<any> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      throw new Error(`Batch ${batchNo} not found`);
    }
    
    const result = {
      batchNo,
      itemCode: batch.itemCode,
      itemName: batch.itemName,
      productionDate: batch.batchInfo.productionDate,
      children: [] as any[],
      customers: [] as any[]
    };
    
    if (levels > 0) {
      // 追溯子批次
      if (batch.traceability.downstream?.childBatches) {
        for (const child of batch.traceability.downstream.childBatches) {
          const childTrace = await this.traceDownstream(child.batchNo, levels - 1);
          result.children.push(childTrace);
        }
      }
      
      // 追溯銷售記錄
      if (batch.traceability.downstream?.consumptionDocs) {
        for (const doc of batch.traceability.downstream.consumptionDocs) {
          if (doc.type === 'sales_order' && doc.customer) {
            result.customers.push({
              customer: doc.customer,
              orderNo: doc.docNo,
              date: doc.date,
              quantity: doc.quantity
            });
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * 批號發貨
   */
  async issueBatch(
    batchNo: string,
    quantity: number,
    reference: any
  ): Promise<BatchOperationResult> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      return {
        success: false,
        batchNo,
        operation: 'issue',
        errors: [`Batch ${batchNo} not found`]
      };
    }
    
    // 檢查可用數量
    if (batch.batchInfo.quantity.available < quantity) {
      return {
        success: false,
        batchNo,
        operation: 'issue',
        errors: [`Insufficient quantity. Available: ${batch.batchInfo.quantity.available}`]
      };
    }
    
    // 檢查批號狀態
    if (batch.batchInfo.status !== 'active') {
      return {
        success: false,
        batchNo,
        operation: 'issue',
        errors: [`Batch status is ${batch.batchInfo.status}, cannot issue`]
      };
    }
    
    // 檢查有效期
    if (batch.batchInfo.expiryDate && dayjs(batch.batchInfo.expiryDate).isBefore(dayjs())) {
      return {
        success: false,
        batchNo,
        operation: 'issue',
        errors: ['Batch has expired'],
        warnings: [`Expiry date: ${batch.batchInfo.expiryDate}`]
      };
    }
    
    // 更新數量
    batch.batchInfo.quantity.current -= quantity;
    batch.batchInfo.quantity.available -= quantity;
    
    // 記錄交易
    await this.recordTransaction(batchNo, {
      type: 'issue',
      quantity,
      reference,
      balanceAfter: batch.batchInfo.quantity.current
    });
    
    // 更新追溯資訊
    if (reference.customer) {
      batch.traceability.downstream = batch.traceability.downstream || {};
      batch.traceability.downstream.consumptionDocs = 
        batch.traceability.downstream.consumptionDocs || [];
      
      batch.traceability.downstream.consumptionDocs.push({
        type: 'sales_order',
        docNo: reference.docNo,
        date: new Date(),
        quantity,
        customer: reference.customer
      });
    }
    
    // 發送事件
    this.emit('batch:issued', {
      batch,
      quantity,
      reference
    });
    
    return {
      success: true,
      batchNo,
      operation: 'issue',
      quantity,
      newBalance: batch.batchInfo.quantity.current,
      traceabilityUpdated: true
    };
  }
  
  /**
   * 批號接收
   */
  async receiveBatch(
    batchNo: string,
    quantity: number,
    reference: any
  ): Promise<BatchOperationResult> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      return {
        success: false,
        batchNo,
        operation: 'receipt',
        errors: [`Batch ${batchNo} not found`]
      };
    }
    
    // 更新數量
    batch.batchInfo.quantity.current += quantity;
    batch.batchInfo.quantity.available += quantity;
    
    // 記錄交易
    await this.recordTransaction(batchNo, {
      type: 'receipt',
      quantity,
      reference,
      balanceAfter: batch.batchInfo.quantity.current
    });
    
    // 發送事件
    this.emit('batch:received', {
      batch,
      quantity,
      reference
    });
    
    return {
      success: true,
      batchNo,
      operation: 'receipt',
      quantity,
      newBalance: batch.batchInfo.quantity.current
    };
  }
  
  /**
   * 批號轉移
   */
  async transferBatch(
    batchNo: string,
    quantity: number,
    fromLocation: string,
    toLocation: string
  ): Promise<BatchOperationResult> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      return {
        success: false,
        batchNo,
        operation: 'transfer',
        errors: [`Batch ${batchNo} not found`]
      };
    }
    
    // 記錄交易
    await this.recordTransaction(batchNo, {
      type: 'transfer',
      quantity,
      from: { location: fromLocation },
      to: { location: toLocation }
    });
    
    // 更新位置
    if (batch.batchInfo.location) {
      batch.batchInfo.location.warehouse = toLocation.split('-')[0];
      batch.batchInfo.location.zone = toLocation.split('-')[1];
    }
    
    // 發送事件
    this.emit('batch:transferred', {
      batch,
      quantity,
      fromLocation,
      toLocation
    });
    
    return {
      success: true,
      batchNo,
      operation: 'transfer',
      quantity
    };
  }
  
  /**
   * 批號合併
   */
  async mergeBatches(
    sourceBatches: string[],
    targetBatchNo?: string
  ): Promise<BatchOperationResult> {
    // 驗證源批次
    const batches = sourceBatches.map(batchNo => this.batches.get(batchNo));
    const invalidBatches = sourceBatches.filter((_, i) => !batches[i]);
    
    if (invalidBatches.length > 0) {
      return {
        success: false,
        batchNo: targetBatchNo || '',
        operation: 'merge',
        errors: [`Batches not found: ${invalidBatches.join(', ')}`]
      };
    }
    
    // 檢查是否同一產品
    const itemCodes = [...new Set(batches.map(b => b?.itemCode))];
    if (itemCodes.length > 1) {
      return {
        success: false,
        batchNo: targetBatchNo || '',
        operation: 'merge',
        errors: ['Cannot merge batches of different items']
      };
    }
    
    // 創建新批號
    const newBatchNo = targetBatchNo || this.generateBatchNo(itemCodes[0]!);
    const totalQuantity = batches.reduce(
      (sum, b) => sum + (b?.batchInfo.quantity.current || 0), 
      0
    );
    
    // 創建合併批次
    const mergedBatch = await this.createBatch({
      batchNo: newBatchNo,
      itemCode: itemCodes[0],
      itemName: batches[0]!.itemName,
      itemType: batches[0]!.itemType,
      batchInfo: {
        productionDate: new Date(),
        quantity: { initial: totalQuantity, unit: batches[0]!.batchInfo.quantity.unit }
      },
      traceability: {
        upstream: {
          parentBatches: sourceBatches.map(batchNo => ({
            batchNo,
            itemCode: itemCodes[0]!,
            quantity: this.batches.get(batchNo)!.batchInfo.quantity.current,
            unit: this.batches.get(batchNo)!.batchInfo.quantity.unit,
            consumedDate: new Date()
          }))
        }
      }
    });
    
    // 消耗源批次
    for (const batchNo of sourceBatches) {
      const batch = this.batches.get(batchNo)!;
      const qty = batch.batchInfo.quantity.current;
      await this.issueBatch(batchNo, qty, {
        docType: 'batch_merge',
        docNo: newBatchNo
      });
    }
    
    return {
      success: true,
      batchNo: newBatchNo,
      operation: 'merge',
      quantity: totalQuantity
    };
  }
  
  /**
   * 批號分割
   */
  async splitBatch(
    sourceBatchNo: string,
    splits: { quantity: number; newBatchNo?: string }[]
  ): Promise<BatchOperationResult> {
    const sourceBatch = this.batches.get(sourceBatchNo);
    if (!sourceBatch) {
      return {
        success: false,
        batchNo: sourceBatchNo,
        operation: 'split',
        errors: [`Batch ${sourceBatchNo} not found`]
      };
    }
    
    // 檢查總量
    const totalSplitQty = splits.reduce((sum, s) => sum + s.quantity, 0);
    if (totalSplitQty > sourceBatch.batchInfo.quantity.available) {
      return {
        success: false,
        batchNo: sourceBatchNo,
        operation: 'split',
        errors: [`Split quantity ${totalSplitQty} exceeds available ${sourceBatch.batchInfo.quantity.available}`]
      };
    }
    
    const newBatches: string[] = [];
    
    // 創建分割批次
    for (const split of splits) {
      const newBatchNo = split.newBatchNo || this.generateBatchNo(sourceBatch.itemCode);
      
      await this.createBatch({
        batchNo: newBatchNo,
        itemCode: sourceBatch.itemCode,
        itemName: sourceBatch.itemName,
        itemType: sourceBatch.itemType,
        batchInfo: {
          productionDate: sourceBatch.batchInfo.productionDate,
          expiryDate: sourceBatch.batchInfo.expiryDate,
          quantity: { 
            initial: split.quantity, 
            unit: sourceBatch.batchInfo.quantity.unit 
          }
        },
        traceability: {
          upstream: {
            parentBatches: [{
              batchNo: sourceBatchNo,
              itemCode: sourceBatch.itemCode,
              quantity: split.quantity,
              unit: sourceBatch.batchInfo.quantity.unit,
              consumedDate: new Date()
            }]
          }
        }
      });
      
      newBatches.push(newBatchNo);
    }
    
    // 減少源批次數量
    await this.issueBatch(sourceBatchNo, totalSplitQty, {
      docType: 'batch_split',
      docNo: newBatches.join(',')
    });
    
    return {
      success: true,
      batchNo: sourceBatchNo,
      operation: 'split',
      quantity: totalSplitQty,
      warnings: [`Created new batches: ${newBatches.join(', ')}`]
    };
  }
  
  /**
   * 更新批號狀態
   */
  async updateBatchStatus(
    batchNo: string,
    status: 'active' | 'quarantine' | 'blocked' | 'expired' | 'consumed',
    reason?: string
  ): Promise<BatchOperationResult> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      return {
        success: false,
        batchNo,
        operation: 'status_update',
        errors: [`Batch ${batchNo} not found`]
      };
    }
    
    const oldStatus = batch.batchInfo.status;
    batch.batchInfo.status = status;
    
    // 更新可用數量
    if (status === 'quarantine' || status === 'blocked') {
      batch.batchInfo.quantity.available = 0;
    } else if (status === 'active' && oldStatus !== 'active') {
      batch.batchInfo.quantity.available = 
        batch.batchInfo.quantity.current - batch.batchInfo.quantity.reserved;
    }
    
    // 添加警示
    if (reason) {
      batch.alerts = batch.alerts || [];
      batch.alerts.push({
        type: 'custom',
        severity: status === 'blocked' ? 'critical' : 'warning',
        message: `Status changed to ${status}: ${reason}`,
        createdAt: new Date(),
        createdBy: 'system',
        resolved: false
      });
    }
    
    // 發送事件
    this.emit('batch:statusChanged', {
      batch,
      oldStatus,
      newStatus: status,
      reason
    });
    
    return {
      success: true,
      batchNo,
      operation: 'status_update',
      warnings: [`Status changed from ${oldStatus} to ${status}`]
    };
  }
  
  /**
   * 記錄交易
   */
  private async recordTransaction(batchNo: string, transaction: any): Promise<void> {
    const batch = this.batches.get(batchNo);
    if (!batch) return;
    
    batch.transactions.push({
      id: uuidv4(),
      type: transaction.type,
      date: new Date(),
      quantity: transaction.quantity,
      unit: batch.batchInfo.quantity.unit,
      from: transaction.from,
      to: transaction.to,
      reference: transaction.reference,
      reason: transaction.reason,
      performedBy: 'system',
      balanceAfter: transaction.balanceAfter || batch.batchInfo.quantity.current
    });
    
    // 更新版本
    batch.metadata.version++;
    batch.metadata.updatedAt = new Date();
  }
  
  /**
   * 生成批號
   */
  private generateBatchNo(itemCode: string): string {
    const date = dayjs().format('YYYYMMDD');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${itemCode}-${date}-${random}`;
  }
  
  /**
   * 更新索引
   */
  private updateIndexes(batch: BatchEntity): void {
    // 更新產品索引
    if (!this.batchIndex.has(batch.itemCode)) {
      this.batchIndex.set(batch.itemCode, new Set());
    }
    this.batchIndex.get(batch.itemCode)!.add(batch.batchNo);
    
    // 更新序號索引
    if (batch.serialNo) {
      this.serialIndex.set(batch.serialNo, batch.batchNo);
    }
  }
  
  /**
   * 獲取嵌套屬性
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }
  
  /**
   * 批號有效期檢查
   */
  async checkExpiry(): Promise<string[]> {
    const expiredBatches: string[] = [];
    const today = dayjs();
    
    for (const batch of this.batches.values()) {
      if (batch.batchInfo.expiryDate && 
          dayjs(batch.batchInfo.expiryDate).isBefore(today) &&
          batch.batchInfo.status === 'active') {
        
        await this.updateBatchStatus(batch.batchNo, 'expired', 'Auto-expired by system');
        expiredBatches.push(batch.batchNo);
      }
    }
    
    return expiredBatches;
  }
  
  /**
   * 生成追溯報告
   */
  async generateTraceabilityReport(batchNo: string): Promise<any> {
    const batch = this.batches.get(batchNo);
    if (!batch) {
      throw new Error(`Batch ${batchNo} not found`);
    }
    
    const upstream = await this.traceUpstream(batchNo, 5);
    const downstream = await this.traceDownstream(batchNo, 5);
    
    return {
      reportId: uuidv4(),
      generatedAt: new Date(),
      batch: {
        batchNo: batch.batchNo,
        itemCode: batch.itemCode,
        itemName: batch.itemName,
        productionDate: batch.batchInfo.productionDate,
        expiryDate: batch.batchInfo.expiryDate,
        status: batch.batchInfo.status,
        currentQuantity: batch.batchInfo.quantity.current,
        location: batch.batchInfo.location
      },
      upstream,
      downstream,
      quality: batch.quality,
      compliance: batch.compliance,
      transactions: batch.transactions,
      alerts: batch.alerts
    };
  }
}