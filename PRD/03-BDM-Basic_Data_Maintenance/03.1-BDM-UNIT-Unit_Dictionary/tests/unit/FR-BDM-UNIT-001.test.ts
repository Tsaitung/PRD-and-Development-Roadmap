/**
 * 單元測試: FR-BDM-UNIT-001 單位列表管理
 * 測試檔案路徑: tests/unit/FR-BDM-UNIT-001.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UnitService } from '@/modules/bdm/unit/services/UnitService';
import { UnitRepository } from '@/modules/bdm/unit/repositories/UnitRepository';
import { Unit, UnitType } from '@/modules/bdm/unit/types';

describe('FR-BDM-UNIT-001: 單位列表管理', () => {
  let unitService: UnitService;
  let unitRepository: jest.Mocked<UnitRepository>;

  beforeEach(() => {
    unitRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    } as any;
    unitService = new UnitService(unitRepository);
  });

  describe('單位列表載入', () => {
    it('應在2秒內載入單位列表', async () => {
      // Arrange
      const mockUnits: Unit[] = [
        {
          id: '1',
          unitName: '公斤',
          unitType: UnitType.WEIGHT,
          variance: 5,
          isExact: false,
          conversionToKG: 1.0,
          isActive: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      unitRepository.findAll.mockResolvedValue({
        data: mockUnits,
        total: 1,
        page: 1,
        limit: 20
      });

      // Act
      const startTime = Date.now();
      const result = await unitService.getUnits({ page: 1, limit: 20 });
      const loadTime = Date.now() - startTime;

      // Assert
      expect(result.data).toEqual(mockUnits);
      expect(loadTime).toBeLessThan(2000);
    });

    it('應支援分頁每頁20筆', async () => {
      // Arrange
      const page = 2;
      const limit = 20;

      // Act
      await unitService.getUnits({ page, limit });

      // Assert
      expect(unitRepository.findAll).toHaveBeenCalledWith({
        page,
        limit,
        orderBy: 'created_at',
        order: 'desc'
      });
    });
  });

  describe('搜尋功能', () => {
    it('應在500ms內返回搜尋結果', async () => {
      // Arrange
      const searchTerm = '公斤';
      unitRepository.search.mockResolvedValue([]);

      // Act
      const startTime = Date.now();
      await unitService.searchUnits(searchTerm);
      const searchTime = Date.now() - startTime;

      // Assert
      expect(searchTime).toBeLessThan(500);
    });

    it('搜尋應不區分大小寫', async () => {
      // Arrange
      const mockUnit = {
        id: '1',
        unitName: '公斤',
        unitType: UnitType.WEIGHT
      } as Unit;
      unitRepository.search.mockResolvedValue([mockUnit]);

      // Act
      const result1 = await unitService.searchUnits('公斤');
      const result2 = await unitService.searchUnits('公斤');

      // Assert
      expect(result1).toEqual(result2);
      expect(unitRepository.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('排序功能', () => {
    it('預設應按創建時間倒序排列', async () => {
      // Act
      await unitService.getUnits({});

      // Assert
      expect(unitRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'created_at',
          order: 'desc'
        })
      );
    });

    it('應支援按單位名稱排序', async () => {
      // Act
      await unitService.getUnits({ orderBy: 'unitName', order: 'asc' });

      // Assert
      expect(unitRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'unitName',
          order: 'asc'
        })
      );
    });
  });
});