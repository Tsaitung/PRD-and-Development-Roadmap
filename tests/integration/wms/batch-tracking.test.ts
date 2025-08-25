/**
 * 批號追溯系統整合測試
 * WMS-BTM Batch Tracking Integration Tests
 */

import request from 'supertest';
import { BatchTrackingService } from '../../../src/modules/wms/services/batch-tracking.service';

describe('WMS Batch Tracking System', () => {
  const baseUrl = 'http://localhost:3000';
  const apiPath = '/api/wms';
  let testBatchNo: string;
  let service: BatchTrackingService;
  
  beforeAll(() => {
    service = new BatchTrackingService();
  });
  
  describe('Batch Creation', () => {
    it('should create a new batch successfully', async () => {
      const batchData = {
        itemCode: 'VEG-001',
        itemName: '有機蔬菜',
        itemType: 'raw_material',
        specification: '500g/包',
        batchInfo: {
          productionDate: new Date('2025-01-15'),
          expiryDate: new Date('2025-01-25'),
          quantity: {
            initial: 1000,
            unit: 'PCS'
          },
          supplier: {
            code: 'SUP-001',
            name: '有機農場A',
            deliveryNote: 'DN-2025-001'
          },
          location: {
            warehouse: 'WH-01',
            zone: 'A',
            bin: 'A-01-01'
          }
        },
        quality: {
          certificates: [{
            type: 'organic',
            number: 'ORG-2025-001',
            issueDate: new Date('2025-01-01'),
            expiryDate: new Date('2025-12-31'),
            issuer: '有機認證機構'
          }]
        }
      };
      
      const result = await service.createBatch(batchData);
      
      expect(result.success).toBe(true);
      expect(result.batchNo).toBeDefined();
      expect(result.quantity).toBe(1000);
      expect(result.newBalance).toBe(1000);
      
      testBatchNo = result.batchNo;
    });
    
    it('should reject duplicate batch numbers', async () => {
      const batchData = {
        batchNo: testBatchNo,
        itemCode: 'VEG-001',
        itemName: '有機蔬菜',
        batchInfo: {
          quantity: { initial: 500, unit: 'PCS' }
        }
      };
      
      const result = await service.createBatch(batchData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain(`Batch ${testBatchNo} already exists`);
    });
    
    it('should create batch with serial numbers', async () => {
      const batchData = {
        itemCode: 'EQUIP-001',
        itemName: '農業設備',
        itemType: 'finished_goods',
        serialNo: 'SN-2025-001',
        batchInfo: {
          quantity: { initial: 1, unit: 'PCS' }
        }
      };
      
      const result = await service.createBatch(batchData);
      
      expect(result.success).toBe(true);
      
      const batch = await service.getBatchDetail(result.batchNo);
      expect(batch?.serialNo).toBe('SN-2025-001');
    });
  });
  
  describe('Batch Query', () => {
    beforeAll(async () => {
      // 創建測試數據
      await service.createBatch({
        itemCode: 'VEG-002',
        itemName: '有機番茄',
        batchInfo: {
          quantity: { initial: 500, unit: 'KG' },
          status: 'active'
        }
      });
      
      await service.createBatch({
        itemCode: 'VEG-003',
        itemName: '有機黃瓜',
        batchInfo: {
          quantity: { initial: 300, unit: 'KG' },
          status: 'quarantine'
        }
      });
    });
    
    it('should query batches by item code', async () => {
      const batches = await service.queryBatches({
        itemCode: 'VEG-001'
      });
      
      expect(batches.length).toBeGreaterThan(0);
      expect(batches[0].itemCode).toBe('VEG-001');
    });
    
    it('should query batches by status', async () => {
      const batches = await service.queryBatches({
        status: ['active']
      });
      
      expect(batches.length).toBeGreaterThan(0);
      batches.forEach(batch => {
        expect(batch.batchInfo.status).toBe('active');
      });
    });
    
    it('should query batches by available quantity', async () => {
      const batches = await service.queryBatches({
        availableQtyMin: 100,
        availableQtyMax: 600
      });
      
      batches.forEach(batch => {
        expect(batch.batchInfo.quantity.available).toBeGreaterThanOrEqual(100);
        expect(batch.batchInfo.quantity.available).toBeLessThanOrEqual(600);
      });
    });
    
    it('should support pagination', async () => {
      const page1 = await service.queryBatches({
        page: 1,
        limit: 2
      });
      
      const page2 = await service.queryBatches({
        page: 2,
        limit: 2
      });
      
      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
      expect(page1[0]?.batchNo).not.toBe(page2[0]?.batchNo);
    });
  });
  
  describe('Batch Operations', () => {
    let operationBatchNo: string;
    
    beforeAll(async () => {
      const result = await service.createBatch({
        itemCode: 'PROD-001',
        itemName: '加工產品',
        batchInfo: {
          quantity: { initial: 1000, unit: 'PCS' }
        }
      });
      operationBatchNo = result.batchNo;
    });
    
    it('should issue batch successfully', async () => {
      const result = await service.issueBatch(operationBatchNo, 200, {
        docType: 'sales_order',
        docNo: 'SO-2025-001',
        customer: 'CUST-001'
      });
      
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(200);
      expect(result.newBalance).toBe(800);
      expect(result.traceabilityUpdated).toBe(true);
    });
    
    it('should reject issue when insufficient quantity', async () => {
      const result = await service.issueBatch(operationBatchNo, 2000, {
        docType: 'sales_order',
        docNo: 'SO-2025-002'
      });
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Insufficient quantity');
    });
    
    it('should receive batch successfully', async () => {
      const result = await service.receiveBatch(operationBatchNo, 100, {
        docType: 'return_order',
        docNo: 'RO-2025-001'
      });
      
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(100);
      expect(result.newBalance).toBe(900);
    });
    
    it('should transfer batch between locations', async () => {
      const result = await service.transferBatch(
        operationBatchNo,
        500,
        'WH-01-A-01',
        'WH-02-B-01'
      );
      
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(500);
    });
  });
  
  describe('Batch Merge and Split', () => {
    it('should merge multiple batches', async () => {
      // 創建源批次
      const batch1 = await service.createBatch({
        itemCode: 'MERGE-001',
        itemName: '合併測試產品',
        batchInfo: { quantity: { initial: 100, unit: 'KG' } }
      });
      
      const batch2 = await service.createBatch({
        itemCode: 'MERGE-001',
        itemName: '合併測試產品',
        batchInfo: { quantity: { initial: 150, unit: 'KG' } }
      });
      
      // 執行合併
      const result = await service.mergeBatches(
        [batch1.batchNo, batch2.batchNo],
        'MERGED-BATCH-001'
      );
      
      expect(result.success).toBe(true);
      expect(result.batchNo).toBe('MERGED-BATCH-001');
      expect(result.quantity).toBe(250);
      
      // 檢查追溯信息
      const mergedBatch = await service.getBatchDetail('MERGED-BATCH-001');
      expect(mergedBatch?.traceability.upstream?.parentBatches).toHaveLength(2);
    });
    
    it('should split batch into multiple batches', async () => {
      // 創建源批次
      const sourceBatch = await service.createBatch({
        itemCode: 'SPLIT-001',
        itemName: '分割測試產品',
        batchInfo: { quantity: { initial: 1000, unit: 'PCS' } }
      });
      
      // 執行分割
      const result = await service.splitBatch(sourceBatch.batchNo, [
        { quantity: 300 },
        { quantity: 200 },
        { quantity: 100 }
      ]);
      
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(600);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Created new batches');
      
      // 檢查源批次剩餘數量
      const source = await service.getBatchDetail(sourceBatch.batchNo);
      expect(source?.batchInfo.quantity.current).toBe(400);
    });
  });
  
  describe('Batch Traceability', () => {
    let parentBatchNo: string;
    let childBatchNo: string;
    
    beforeAll(async () => {
      // 創建父批次
      const parent = await service.createBatch({
        itemCode: 'RAW-001',
        itemName: '原材料',
        batchInfo: { quantity: { initial: 1000, unit: 'KG' } }
      });
      parentBatchNo = parent.batchNo;
      
      // 創建子批次並建立關聯
      const child = await service.createBatch({
        itemCode: 'PROD-002',
        itemName: '成品',
        batchInfo: { quantity: { initial: 800, unit: 'KG' } },
        traceability: {
          upstream: {
            parentBatches: [{
              batchNo: parentBatchNo,
              itemCode: 'RAW-001',
              quantity: 1000,
              unit: 'KG',
              consumedDate: new Date()
            }]
          }
        }
      });
      childBatchNo = child.batchNo;
      
      // 更新父批次的下游信息
      const parentBatch = await service.getBatchDetail(parentBatchNo);
      if (parentBatch) {
        parentBatch.traceability.downstream = {
          childBatches: [{
            batchNo: childBatchNo,
            itemCode: 'PROD-002',
            quantity: 800,
            unit: 'KG',
            producedDate: new Date()
          }]
        };
      }
    });
    
    it('should trace upstream to find raw materials', async () => {
      const trace = await service.traceUpstream(childBatchNo, 3);
      
      expect(trace.batchNo).toBe(childBatchNo);
      expect(trace.parents).toHaveLength(1);
      expect(trace.parents[0].batchNo).toBe(parentBatchNo);
      expect(trace.parents[0].itemCode).toBe('RAW-001');
    });
    
    it('should trace downstream to find finished products', async () => {
      const trace = await service.traceDownstream(parentBatchNo, 3);
      
      expect(trace.batchNo).toBe(parentBatchNo);
      expect(trace.children).toHaveLength(1);
      expect(trace.children[0].batchNo).toBe(childBatchNo);
      expect(trace.children[0].itemCode).toBe('PROD-002');
    });
    
    it('should generate comprehensive traceability report', async () => {
      const report = await service.generateTraceabilityReport(childBatchNo);
      
      expect(report.reportId).toBeDefined();
      expect(report.batch.batchNo).toBe(childBatchNo);
      expect(report.upstream).toBeDefined();
      expect(report.downstream).toBeDefined();
      expect(report.quality).toBeDefined();
      expect(report.transactions).toBeDefined();
    });
  });
  
  describe('Batch Status Management', () => {
    let statusBatchNo: string;
    
    beforeAll(async () => {
      const result = await service.createBatch({
        itemCode: 'STATUS-001',
        itemName: '狀態測試產品',
        batchInfo: { quantity: { initial: 500, unit: 'PCS' } }
      });
      statusBatchNo = result.batchNo;
    });
    
    it('should update batch status to quarantine', async () => {
      const result = await service.updateBatchStatus(
        statusBatchNo,
        'quarantine',
        'Quality inspection pending'
      );
      
      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      
      const batch = await service.getBatchDetail(statusBatchNo);
      expect(batch?.batchInfo.status).toBe('quarantine');
      expect(batch?.batchInfo.quantity.available).toBe(0);
    });
    
    it('should update batch status back to active', async () => {
      const result = await service.updateBatchStatus(
        statusBatchNo,
        'active',
        'Quality inspection passed'
      );
      
      expect(result.success).toBe(true);
      
      const batch = await service.getBatchDetail(statusBatchNo);
      expect(batch?.batchInfo.status).toBe('active');
      expect(batch?.batchInfo.quantity.available).toBeGreaterThan(0);
    });
    
    it('should block expired batches', async () => {
      const result = await service.updateBatchStatus(
        statusBatchNo,
        'expired',
        'Batch expired'
      );
      
      expect(result.success).toBe(true);
      
      const batch = await service.getBatchDetail(statusBatchNo);
      expect(batch?.batchInfo.status).toBe('expired');
      expect(batch?.alerts?.length).toBeGreaterThan(0);
    });
  });
  
  describe('Batch Expiry Management', () => {
    it('should detect and update expired batches', async () => {
      // 創建已過期批次
      await service.createBatch({
        batchNo: 'EXPIRED-001',
        itemCode: 'EXP-001',
        itemName: '過期產品',
        batchInfo: {
          productionDate: new Date('2024-01-01'),
          expiryDate: new Date('2024-12-31'),
          quantity: { initial: 100, unit: 'PCS' }
        }
      });
      
      // 創建未過期批次
      await service.createBatch({
        batchNo: 'ACTIVE-001',
        itemCode: 'ACT-001',
        itemName: '有效產品',
        batchInfo: {
          productionDate: new Date('2025-01-01'),
          expiryDate: new Date('2025-12-31'),
          quantity: { initial: 100, unit: 'PCS' }
        }
      });
      
      // 執行過期檢查
      const expiredBatches = await service.checkExpiry();
      
      expect(expiredBatches).toContain('EXPIRED-001');
      expect(expiredBatches).not.toContain('ACTIVE-001');
      
      // 檢查狀態更新
      const expiredBatch = await service.getBatchDetail('EXPIRED-001');
      expect(expiredBatch?.batchInfo.status).toBe('expired');
    });
  });
  
  describe('API Endpoint Tests', () => {
    it('should create batch via API', async () => {
      const response = await request(baseUrl)
        .post(`${apiPath}/batches`)
        .send({
          itemCode: 'API-001',
          itemName: 'API測試產品',
          itemType: 'finished_goods',
          batchInfo: {
            quantity: {
              initial: 1000,
              unit: 'PCS'
            }
          }
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batchNo).toBeDefined();
    });
    
    it('should query batches via API', async () => {
      const response = await request(baseUrl)
        .get(`${apiPath}/batches`)
        .query({
          status: 'active',
          page: 1,
          limit: 10
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });
    
    it('should get batch detail via API', async () => {
      const response = await request(baseUrl)
        .get(`${apiPath}/batches/${testBatchNo}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batchNo).toBe(testBatchNo);
    });
    
    it('should generate traceability report via API', async () => {
      const response = await request(baseUrl)
        .get(`${apiPath}/batches/${testBatchNo}/traceability-report`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reportId).toBeDefined();
      expect(response.body.data.batch.batchNo).toBe(testBatchNo);
    });
  });
});