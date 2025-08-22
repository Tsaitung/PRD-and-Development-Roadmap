/**
 * 單元測試: FR-BDM-UNIT-003 編輯單位
 * 測試檔案路徑: tests/unit/FR-BDM-UNIT-003.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UnitService } from '@/modules/bdm/unit/services/UnitService';
import { UnitRepository } from '@/modules/bdm/unit/repositories/UnitRepository';
import { AuditLogService } from '@/modules/bdm/unit/services/AuditLogService';
import { UpdateUnitDto } from '@/modules/bdm/unit/dto/UpdateUnitDto';
import { Unit } from '@/modules/bdm/unit/types';

describe('FR-BDM-UNIT-003: 編輯單位', () => {
  let unitService: UnitService;
  let unitRepository: jest.Mocked<UnitRepository>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    unitRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      checkVersion: jest.fn(),
    } as any;
    
    auditLogService = {
      logChange: jest.fn(),
    } as any;
    
    unitService = new UnitService(unitRepository, auditLogService);
  });

  describe('資料載入', () => {
    it('應正確載入當前單位資料', async () => {
      // Arrange
      const currentUnit: Unit = {
        id: '1',
        unitName: '公斤',
        unitType: 'weight',
        variance: 5,
        isExact: false,
        conversionToKG: 1.0,
        version: 'v1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      };
      unitRepository.findById.mockResolvedValue(currentUnit);

      // Act
      const result = await unitService.getUnitForEdit('1');

      // Assert
      expect(result).toEqual(currentUnit);
    });
  });

  describe('版本控制', () => {
    it('應檢測並處理併發修改衝突', async () => {
      // Arrange
      const unitId = '1';
      const updateDto: UpdateUnitDto = {
        unitName: '公斤(更新)',
        variance: 3,
        version: 'v1'
      };
      
      // 模擬版本衝突
      unitRepository.checkVersion.mockResolvedValue(false);

      // Act & Assert
      await expect(unitService.updateUnit(unitId, updateDto))
        .rejects.toThrow('版本衝突，請重新載入最新資料');
    });

    it('版本匹配時應成功更新', async () => {
      // Arrange
      const unitId = '1';
      const currentUnit: Unit = {
        id: unitId,
        unitName: '公斤',
        variance: 5,
        version: 'v1'
      } as Unit;
      
      const updateDto: UpdateUnitDto = {
        unitName: '公斤(更新)',
        variance: 3,
        version: 'v1'
      };
      
      unitRepository.findById.mockResolvedValue(currentUnit);
      unitRepository.checkVersion.mockResolvedValue(true);
      unitRepository.update.mockResolvedValue({
        ...currentUnit,
        ...updateDto,
        version: 'v2',
        updated_at: new Date().toISOString()
      });

      // Act
      const result = await unitService.updateUnit(unitId, updateDto);

      // Assert
      expect(result.unitName).toBe('公斤(更新)');
      expect(result.version).toBe('v2');
    });
  });

  describe('審計追蹤', () => {
    it('應記錄所有修改歷史', async () => {
      // Arrange
      const unitId = '1';
      const oldData = { unitName: '公斤', variance: 5 };
      const newData = { unitName: '公斤(更新)', variance: 3 };
      
      unitRepository.findById.mockResolvedValue(oldData as Unit);
      unitRepository.checkVersion.mockResolvedValue(true);
      unitRepository.update.mockResolvedValue(newData as Unit);

      // Act
      await unitService.updateUnit(unitId, newData as UpdateUnitDto);

      // Assert
      expect(auditLogService.logChange).toHaveBeenCalledWith({
        unitId,
        action: 'UPDATE',
        oldData,
        newData,
        changedBy: expect.any(String),
        changedAt: expect.any(Date)
      });
    });
  });

  describe('即時更新', () => {
    it('修改後應立即反映在列表中', async () => {
      // Arrange
      const unitId = '1';
      const updateDto: UpdateUnitDto = {
        unitName: '新名稱',
        version: 'v1'
      };
      
      unitRepository.findById.mockResolvedValue({ id: unitId, version: 'v1' } as Unit);
      unitRepository.checkVersion.mockResolvedValue(true);
      unitRepository.update.mockResolvedValue({ 
        id: unitId, 
        ...updateDto,
        version: 'v2' 
      } as Unit);

      // Act
      await unitService.updateUnit(unitId, updateDto);

      // Assert
      // 驗證觸發列表更新事件
      expect(unitService.getLastEvent()).toEqual({
        type: 'UNIT_UPDATED',
        data: expect.objectContaining({ 
          id: unitId,
          unitName: '新名稱' 
        })
      });
    });
  });
});