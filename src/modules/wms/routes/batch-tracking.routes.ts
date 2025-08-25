/**
 * 批號追溯路由
 * WMS-BTM Batch Tracking Routes
 */

import { Router } from 'express';
import { BatchTrackingController, batchValidators } from '../controllers/batch-tracking.controller';

export class BatchTrackingRoutes {
  private router: Router;
  private controller: BatchTrackingController;
  
  constructor() {
    this.router = Router();
    this.controller = new BatchTrackingController();
    this.setupRoutes();
  }
  
  private setupRoutes(): void {
    // 基本CRUD操作
    this.router.post(
      '/batches',
      batchValidators.createBatch,
      this.controller.createBatch
    );
    
    this.router.get(
      '/batches',
      this.controller.queryBatches
    );
    
    this.router.get(
      '/batches/:batchNo',
      this.controller.getBatchDetail
    );
    
    // 追溯功能
    this.router.get(
      '/batches/:batchNo/trace-upstream',
      this.controller.traceUpstream
    );
    
    this.router.get(
      '/batches/:batchNo/trace-downstream',
      this.controller.traceDownstream
    );
    
    this.router.get(
      '/batches/:batchNo/traceability-report',
      this.controller.generateTraceabilityReport
    );
    
    // 批號操作
    this.router.post(
      '/batches/:batchNo/issue',
      batchValidators.issueBatch,
      this.controller.issueBatch
    );
    
    this.router.post(
      '/batches/:batchNo/receive',
      batchValidators.receiveBatch,
      this.controller.receiveBatch
    );
    
    this.router.post(
      '/batches/:batchNo/transfer',
      batchValidators.transferBatch,
      this.controller.transferBatch
    );
    
    this.router.post(
      '/batches/merge',
      batchValidators.mergeBatches,
      this.controller.mergeBatches
    );
    
    this.router.post(
      '/batches/:batchNo/split',
      batchValidators.splitBatch,
      this.controller.splitBatch
    );
    
    // 狀態管理
    this.router.put(
      '/batches/:batchNo/status',
      batchValidators.updateStatus,
      this.controller.updateBatchStatus
    );
    
    // 維護功能
    this.router.post(
      '/batches/check-expiry',
      this.controller.checkExpiry
    );
  }
  
  getRouter(): Router {
    return this.router;
  }
}

// 導出路由實例
export const batchTrackingRoutes = new BatchTrackingRoutes().getRouter();