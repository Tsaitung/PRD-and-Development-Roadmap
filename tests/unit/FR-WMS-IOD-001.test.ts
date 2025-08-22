/**
 * 單元測試：FR-WMS-IOD-001 即時庫存總覽
 * 模組：WMS-IOD (Warehouse Management System - Inventory Overview & Details)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InventoryService } from '../../src/modules/wms/inventory/services/InventoryService';
import { InventoryRepository } from '../../src/modules/wms/inventory/repositories/InventoryRepository';
import { CacheService } from '../../src/shared/services/CacheService';
import { InventorySnapshot, InventoryMetrics } from '../../src/modules/wms/inventory/types';

// Mock dependencies
jest.mock('../../src/modules/wms/inventory/repositories/InventoryRepository');
jest.mock('../../src/shared/services/CacheService');

describe('FR-WMS-IOD-001: 即時庫存總覽', () => {
  let inventoryService: InventoryService;
  let mockRepository: jest.Mocked<InventoryRepository>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockRepository = new InventoryRepository() as jest.Mocked<InventoryRepository>;
    mockCache = new CacheService() as jest.Mocked<CacheService>;
    inventoryService = new InventoryService(mockRepository, mockCache);
  });

  describe('庫存總覽查詢', () => {
    it('應該在2秒內返回庫存統計數據', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const mockMetrics: InventoryMetrics = {
        totalValue: 15680000,
        totalItems: 1250,
        totalSKUs: 450,
        averageTurnover: 12.5,
        lastUpdated: new Date()
      };
      mockRepository.getInventoryMetrics.mockResolvedValue(mockMetrics);

      // Act
      const startTime = Date.now();
      const result = await inventoryService.getInventoryOverview(warehouseId);
      const responseTime = Date.now() - startTime;

      // Assert
      expect(result).toEqual(mockMetrics);
      expect(responseTime).toBeLessThan(2000);
      expect(mockRepository.getInventoryMetrics).toHaveBeenCalledWith(warehouseId);
    });

    it('應該支援多倉庫篩選', async () => {
      // Arrange
      const warehouseIds = ['WH001', 'WH002', 'WH003'];
      const mockSnapshots: InventorySnapshot[] = [
        {
          id: '1',
          warehouseId: 'WH001',
          itemId: 'ITEM001',
          quantity: 100,
          availableQty: 80,
          reservedQty: 20,
          inTransitQty: 0,
          unitCost: 100,
          totalValue: 10000,
          lastUpdated: new Date(),
          batchDetails: []
        }
      ];
      mockRepository.getInventoryByWarehouses.mockResolvedValue(mockSnapshots);

      // Act
      const result = await inventoryService.getMultiWarehouseInventory(warehouseIds);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockRepository.getInventoryByWarehouses).toHaveBeenCalledWith(warehouseIds);
    });

    it('應該正確計算庫存周轉率', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31')
      };
      const expectedTurnover = 12.5;
      mockRepository.calculateTurnoverRate.mockResolvedValue(expectedTurnover);

      // Act
      const turnoverRate = await inventoryService.calculateTurnoverRate(
        warehouseId,
        dateRange
      );

      // Assert
      expect(turnoverRate).toBe(expectedTurnover);
      expect(mockRepository.calculateTurnoverRate).toHaveBeenCalledWith(
        warehouseId,
        dateRange
      );
    });
  });

  describe('庫齡分析', () => {
    it('應該正確分類庫齡分布', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const mockAgingData = {
        '0-7days': 45,
        '8-30days': 30,
        '31-90days': 20,
        'over90days': 5
      };
      mockRepository.getInventoryAging.mockResolvedValue(mockAgingData);

      // Act
      const agingAnalysis = await inventoryService.getInventoryAging(warehouseId);

      // Assert
      expect(agingAnalysis).toEqual(mockAgingData);
      expect(agingAnalysis['0-7days']).toBe(45);
      expect(agingAnalysis['over90days']).toBe(5);
    });

    it('應該識別過期庫存', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const mockExpiredItems = [
        { itemId: 'ITEM001', batchNo: 'B001', expiryDate: new Date('2025-01-01'), quantity: 50 },
        { itemId: 'ITEM002', batchNo: 'B002', expiryDate: new Date('2025-01-15'), quantity: 30 }
      ];
      mockRepository.getExpiredInventory.mockResolvedValue(mockExpiredItems);

      // Act
      const expiredItems = await inventoryService.getExpiredInventory(warehouseId);

      // Assert
      expect(expiredItems).toHaveLength(2);
      expect(expiredItems[0].quantity).toBe(50);
    });
  });

  describe('快取機制', () => {
    it('應該使用快取提升查詢效能', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const cacheKey = `inventory:overview:${warehouseId}`;
      const cachedData: InventoryMetrics = {
        totalValue: 10000000,
        totalItems: 1000,
        totalSKUs: 400,
        averageTurnover: 10,
        lastUpdated: new Date()
      };
      mockCache.get.mockResolvedValue(cachedData);

      // Act
      const result = await inventoryService.getInventoryOverview(warehouseId);

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
      expect(mockRepository.getInventoryMetrics).not.toHaveBeenCalled();
    });

    it('應該在快取未命中時查詢資料庫', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const cacheKey = `inventory:overview:${warehouseId}`;
      mockCache.get.mockResolvedValue(null);
      const freshData: InventoryMetrics = {
        totalValue: 20000000,
        totalItems: 1500,
        totalSKUs: 500,
        averageTurnover: 15,
        lastUpdated: new Date()
      };
      mockRepository.getInventoryMetrics.mockResolvedValue(freshData);

      // Act
      const result = await inventoryService.getInventoryOverview(warehouseId);

      // Assert
      expect(result).toEqual(freshData);
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
      expect(mockRepository.getInventoryMetrics).toHaveBeenCalledWith(warehouseId);
      expect(mockCache.set).toHaveBeenCalledWith(cacheKey, freshData, 300);
    });
  });

  describe('異常處理', () => {
    it('應該處理無權限倉庫查詢', async () => {
      // Arrange
      const unauthorizedWarehouseId = 'WH999';
      mockRepository.getInventoryMetrics.mockRejectedValue(
        new Error('Unauthorized access to warehouse')
      );

      // Act & Assert
      await expect(
        inventoryService.getInventoryOverview(unauthorizedWarehouseId)
      ).rejects.toThrow('Unauthorized access to warehouse');
    });

    it('應該檢測並警告負庫存', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const mockAnomalies = [
        { itemId: 'ITEM001', quantity: -10, message: 'Negative stock detected' }
      ];
      mockRepository.detectInventoryAnomalies.mockResolvedValue(mockAnomalies);

      // Act
      const anomalies = await inventoryService.detectInventoryAnomalies(warehouseId);

      // Assert
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].quantity).toBeLessThan(0);
      expect(anomalies[0].message).toContain('Negative stock');
    });

    it('應該處理計算超時', async () => {
      // Arrange
      const warehouseId = 'WH001';
      mockRepository.getInventoryMetrics.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 3000))
      );

      // Act & Assert
      await expect(
        inventoryService.getInventoryOverview(warehouseId, { timeout: 2000 })
      ).rejects.toThrow('Query timeout');
    });
  });

  describe('資料驗證', () => {
    it('應該驗證倉庫ID格式', async () => {
      // Arrange
      const invalidWarehouseId = '';

      // Act & Assert
      await expect(
        inventoryService.getInventoryOverview(invalidWarehouseId)
      ).rejects.toThrow('Invalid warehouse ID');
    });

    it('應該驗證日期範圍合理性', async () => {
      // Arrange
      const warehouseId = 'WH001';
      const invalidDateRange = {
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01')
      };

      // Act & Assert
      await expect(
        inventoryService.calculateTurnoverRate(warehouseId, invalidDateRange)
      ).rejects.toThrow('Invalid date range');
    });
  });
});

/**
 * 測試覆蓋率目標：
 * - 語句覆蓋率 (Statement Coverage): > 80%
 * - 分支覆蓋率 (Branch Coverage): > 75%
 * - 功能覆蓋率 (Function Coverage): > 90%
 * - 行覆蓋率 (Line Coverage): > 80%
 */