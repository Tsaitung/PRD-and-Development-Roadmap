/**
 * 批號追溯控制器
 * WMS-BTM Batch Tracking Controller
 * 
 * 提供批號管理的RESTful API接口
 */

import { Request, Response, NextFunction } from 'express';
import { BatchTrackingService } from '../services/batch-tracking.service';
import { BatchEntity, BatchQuery } from '../entities/batch.entity';
import { body, param, query, validationResult } from 'express-validator';

export class BatchTrackingController {
  private batchService: BatchTrackingService;
  
  constructor() {
    this.batchService = new BatchTrackingService();
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.batchService.on('batch:created', (batch) => {
      console.log(`Batch created: ${batch.batchNo}`);
    });
    
    this.batchService.on('batch:issued', (data) => {
      console.log(`Batch issued: ${data.batch.batchNo}, Qty: ${data.quantity}`);
    });
    
    this.batchService.on('batch:statusChanged', (data) => {
      console.log(`Batch status changed: ${data.batch.batchNo} from ${data.oldStatus} to ${data.newStatus}`);
    });
  }
  
  /**
   * 創建批號
   * POST /api/wms/batches
   */
  createBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 驗證輸入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const result = await this.batchService.createBatch(req.body);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            batchNo: result.batchNo,
            quantity: result.quantity,
            balance: result.newBalance
          },
          message: 'Batch created successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: 'Failed to create batch'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 查詢批號列表
   * GET /api/wms/batches
   */
  queryBatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: BatchQuery = {
        batchNo: req.query.batchNo as string,
        itemCode: req.query.itemCode as string,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        warehouse: req.query.warehouse as string,
        supplier: req.query.supplier as string,
        availableQtyMin: req.query.availableQtyMin ? Number(req.query.availableQtyMin) : undefined,
        availableQtyMax: req.query.availableQtyMax ? Number(req.query.availableQtyMax) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string || 'batchNo',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
      };
      
      const batches = await this.batchService.queryBatches(query);
      
      res.json({
        success: true,
        data: batches,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: batches.length
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 獲取批號詳情
   * GET /api/wms/batches/:batchNo
   */
  getBatchDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchNo = req.params.batchNo;
      const batch = await this.batchService.getBatchDetail(batchNo);
      
      if (batch) {
        res.json({
          success: true,
          data: batch
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Batch ${batchNo} not found`
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號追溯 - 向上追溯
   * GET /api/wms/batches/:batchNo/trace-upstream
   */
  traceUpstream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchNo = req.params.batchNo;
      const levels = req.query.levels ? Number(req.query.levels) : 3;
      
      const traceData = await this.batchService.traceUpstream(batchNo, levels);
      
      res.json({
        success: true,
        data: traceData,
        levels
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號追溯 - 向下追溯
   * GET /api/wms/batches/:batchNo/trace-downstream
   */
  traceDownstream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchNo = req.params.batchNo;
      const levels = req.query.levels ? Number(req.query.levels) : 3;
      
      const traceData = await this.batchService.traceDownstream(batchNo, levels);
      
      res.json({
        success: true,
        data: traceData,
        levels
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號發貨
   * POST /api/wms/batches/:batchNo/issue
   */
  issueBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const batchNo = req.params.batchNo;
      const { quantity, reference } = req.body;
      
      const result = await this.batchService.issueBatch(batchNo, quantity, reference);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            batchNo: result.batchNo,
            quantity: result.quantity,
            newBalance: result.newBalance,
            traceabilityUpdated: result.traceabilityUpdated
          },
          message: 'Batch issued successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          warnings: result.warnings,
          message: 'Failed to issue batch'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號接收
   * POST /api/wms/batches/:batchNo/receive
   */
  receiveBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const batchNo = req.params.batchNo;
      const { quantity, reference } = req.body;
      
      const result = await this.batchService.receiveBatch(batchNo, quantity, reference);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            batchNo: result.batchNo,
            quantity: result.quantity,
            newBalance: result.newBalance
          },
          message: 'Batch received successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: 'Failed to receive batch'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號轉移
   * POST /api/wms/batches/:batchNo/transfer
   */
  transferBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const batchNo = req.params.batchNo;
      const { quantity, fromLocation, toLocation } = req.body;
      
      const result = await this.batchService.transferBatch(
        batchNo, 
        quantity, 
        fromLocation, 
        toLocation
      );
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            batchNo: result.batchNo,
            quantity: result.quantity
          },
          message: 'Batch transferred successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: 'Failed to transfer batch'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號合併
   * POST /api/wms/batches/merge
   */
  mergeBatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { sourceBatches, targetBatchNo } = req.body;
      
      const result = await this.batchService.mergeBatches(sourceBatches, targetBatchNo);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            batchNo: result.batchNo,
            quantity: result.quantity
          },
          message: 'Batches merged successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: 'Failed to merge batches'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 批號分割
   * POST /api/wms/batches/:batchNo/split
   */
  splitBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const batchNo = req.params.batchNo;
      const { splits } = req.body;
      
      const result = await this.batchService.splitBatch(batchNo, splits);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            batchNo: result.batchNo,
            quantity: result.quantity
          },
          warnings: result.warnings,
          message: 'Batch split successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: 'Failed to split batch'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 更新批號狀態
   * PUT /api/wms/batches/:batchNo/status
   */
  updateBatchStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const batchNo = req.params.batchNo;
      const { status, reason } = req.body;
      
      const result = await this.batchService.updateBatchStatus(batchNo, status, reason);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            batchNo: result.batchNo
          },
          warnings: result.warnings,
          message: 'Batch status updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: 'Failed to update batch status'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 檢查過期批號
   * POST /api/wms/batches/check-expiry
   */
  checkExpiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expiredBatches = await this.batchService.checkExpiry();
      
      res.json({
        success: true,
        data: {
          expiredCount: expiredBatches.length,
          expiredBatches
        },
        message: `Found ${expiredBatches.length} expired batches`
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * 生成追溯報告
   * GET /api/wms/batches/:batchNo/traceability-report
   */
  generateTraceabilityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchNo = req.params.batchNo;
      const report = await this.batchService.generateTraceabilityReport(batchNo);
      
      res.json({
        success: true,
        data: report,
        message: 'Traceability report generated successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 驗證規則
 */
export const batchValidators = {
  createBatch: [
    body('itemCode').notEmpty().withMessage('Item code is required'),
    body('itemName').notEmpty().withMessage('Item name is required'),
    body('batchInfo.quantity.initial').isNumeric().withMessage('Initial quantity must be a number'),
    body('batchInfo.quantity.unit').notEmpty().withMessage('Unit is required')
  ],
  
  issueBatch: [
    param('batchNo').notEmpty().withMessage('Batch number is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('reference.docType').notEmpty().withMessage('Reference document type is required'),
    body('reference.docNo').notEmpty().withMessage('Reference document number is required')
  ],
  
  receiveBatch: [
    param('batchNo').notEmpty().withMessage('Batch number is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0')
  ],
  
  transferBatch: [
    param('batchNo').notEmpty().withMessage('Batch number is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('fromLocation').notEmpty().withMessage('From location is required'),
    body('toLocation').notEmpty().withMessage('To location is required')
  ],
  
  mergeBatches: [
    body('sourceBatches').isArray().withMessage('Source batches must be an array'),
    body('sourceBatches').notEmpty().withMessage('At least one source batch is required')
  ],
  
  splitBatch: [
    param('batchNo').notEmpty().withMessage('Batch number is required'),
    body('splits').isArray().withMessage('Splits must be an array'),
    body('splits.*.quantity').isNumeric().withMessage('Split quantity must be a number')
  ],
  
  updateStatus: [
    param('batchNo').notEmpty().withMessage('Batch number is required'),
    body('status').isIn(['active', 'quarantine', 'blocked', 'expired', 'consumed'])
      .withMessage('Invalid status')
  ]
};