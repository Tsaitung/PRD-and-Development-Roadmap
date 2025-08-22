/**
 * 單元測試: FR-BDM-UNIT-002 新增單位
 * 測試檔案路徑: tests/unit/FR-BDM-UNIT-002.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UnitService } from '@/modules/bdm/unit/services/UnitService';
import { UnitRepository } from '@/modules/bdm/unit/repositories/UnitRepository';
import { CreateUnitDto } from '@/modules/bdm/unit/dto/CreateUnitDto';
import { Unit, UnitType } from '@/modules/bdm/unit/types';

describe('FR-BDM-UNIT-002: 新增單位', () => {
  let unitService: UnitService;
  let unitRepository: jest.Mocked<UnitRepository>;

  beforeEach(() => {
    unitRepository = {
      findByName: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
    } as any;
    unitService = new UnitService(unitRepository);
  });

  describe('資料驗證', () => {
    it('應拒絕重複的單位名稱', async () => {
      // Arrange
      const existingUnit = { id: '1', unitName: '公斤' } as Unit;
      unitRepository.findByName.mockResolvedValue(existingUnit);
      
      const newUnit: CreateUnitDto = {
        unitName: '公斤',
        unitType: UnitType.WEIGHT,
        variance: 5,
        isExact: false,
        conversionToKG: 1.0
      };

      // Act & Assert
      await expect(unitService.createUnit(newUnit))
        .rejects.toThrow('單位名稱已存在');
    });

    it('應驗證誤差範圍在0-100之間', async () => {
      // Arrange
      const invalidUnit: CreateUnitDto = {
        unitName: '測試單位',
        unitType: UnitType.WEIGHT,
        variance: 150, // 無效值
        isExact: false,
        conversionToKG: 1.0
      };

      // Act & Assert
      await expect(unitService.createUnit(invalidUnit))
        .rejects.toThrow('誤差範圍必須在0-100之間');
    });

    it('應驗證換算率大於0', async () => {
      // Arrange
      const invalidUnit: CreateUnitDto = {
        unitName: '測試單位',
        unitType: UnitType.WEIGHT,
        variance: 5,
        isExact: false,
        conversionToKG: -1 // 無效值
      };

      // Act & Assert
      await expect(unitService.createUnit(invalidUnit))
        .rejects.toThrow('換算率必須大於0');
    });
  });

  describe('成功新增', () => {
    it('應成功新增有效的單位資料', async () => {
      // Arrange
      unitRepository.findByName.mockResolvedValue(null);
      const newUnit: CreateUnitDto = {
        unitName: '台斤',
        unitType: UnitType.WEIGHT,
        variance: 3,
        isExact: false,
        conversionToKG: 0.6
      };
      
      const createdUnit = {
        id: 'new-id',
        ...newUnit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      unitRepository.create.mockResolvedValue(createdUnit);

      // Act
      const result = await unitService.createUnit(newUnit);

      // Assert
      expect(result).toEqual(createdUnit);
      expect(unitRepository.create).toHaveBeenCalledWith(newUnit);
    });

    it('新增後應立即在列表中顯示', async () => {
      // Arrange
      unitRepository.findByName.mockResolvedValue(null);
      const newUnit: CreateUnitDto = {
        unitName: '盎司',
        unitType: UnitType.WEIGHT,
        variance: 2,
        isExact: false,
        conversionToKG: 0.02835
      };

      // Act
      await unitService.createUnit(newUnit);

      // Assert
      // 驗證會觸發列表更新事件
      expect(unitService.getLastEvent()).toEqual({
        type: 'UNIT_CREATED',
        data: expect.objectContaining({ unitName: '盎司' })
      });
    });
  });

  describe('效能需求', () => {
    it('應在合理時間內完成新增操作', async () => {
      // Arrange
      unitRepository.findByName.mockResolvedValue(null);
      unitRepository.create.mockResolvedValue({} as Unit);

      // Act
      const startTime = Date.now();
      await unitService.createUnit({} as CreateUnitDto);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(1000); // 小於1秒
    });
  });
});