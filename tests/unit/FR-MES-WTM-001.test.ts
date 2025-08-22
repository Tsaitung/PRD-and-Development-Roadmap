/**
 * 單元測試：FR-MES-WTM-001 工作站配置管理
 * 模組：MES-WTM (Manufacturing Execution System - Workstation & Task Management)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkstationService } from '../../src/modules/mes/workstation/services/WorkstationService';
import { WorkstationRepository } from '../../src/modules/mes/workstation/repositories/WorkstationRepository';
import { CapacityCalculator } from '../../src/modules/mes/workstation/utils/CapacityCalculator';
import { Workstation, WorkstationCapacity, WorkstationType } from '../../src/modules/mes/workstation/types';

// Mock dependencies
jest.mock('../../src/modules/mes/workstation/repositories/WorkstationRepository');
jest.mock('../../src/modules/mes/workstation/utils/CapacityCalculator');

describe('FR-MES-WTM-001: 工作站配置管理', () => {
  let workstationService: WorkstationService;
  let mockRepository: jest.Mocked<WorkstationRepository>;
  let mockCapacityCalculator: jest.Mocked<CapacityCalculator>;

  beforeEach(() => {
    mockRepository = new WorkstationRepository() as jest.Mocked<WorkstationRepository>;
    mockCapacityCalculator = new CapacityCalculator() as jest.Mocked<CapacityCalculator>;
    workstationService = new WorkstationService(mockRepository, mockCapacityCalculator);
  });

  describe('工作站建立', () => {
    it('應該成功創建新工作站', async () => {
      // Arrange
      const newWorkstation = {
        name: '包裝站A',
        type: 'packaging' as WorkstationType,
        location: '一樓生產區',
        capacity: {
          hourlyOutput: 500,
          maxOperators: 5,
          minOperators: 2
        },
        requiredSkills: ['packaging_basic', 'quality_check'],
        equipment: ['sealing_machine', 'scale']
      };
      
      const createdWorkstation: Workstation = {
        id: 'WS001',
        code: 'PKG-A',
        ...newWorkstation,
        status: 'active',
        currentTask: undefined,
        operatorCount: 0
      };
      
      mockRepository.create.mockResolvedValue(createdWorkstation);

      // Act
      const result = await workstationService.createWorkstation(newWorkstation);

      // Assert
      expect(result).toEqual(createdWorkstation);
      expect(result.status).toBe('active');
      expect(mockRepository.create).toHaveBeenCalledWith(newWorkstation);
    });

    it('應該驗證工作站名稱唯一性', async () => {
      // Arrange
      const duplicateName = '包裝站A';
      mockRepository.findByName.mockResolvedValue({
        id: 'WS001',
        name: duplicateName
      } as Workstation);

      // Act & Assert
      await expect(
        workstationService.createWorkstation({ name: duplicateName })
      ).rejects.toThrow('Workstation name already exists');
    });

    it('應該驗證產能參數合理性', async () => {
      // Arrange
      const invalidCapacity = {
        name: '測試站',
        type: 'packaging' as WorkstationType,
        capacity: {
          hourlyOutput: -100,
          maxOperators: 0,
          minOperators: 5
        }
      };

      // Act & Assert
      await expect(
        workstationService.createWorkstation(invalidCapacity)
      ).rejects.toThrow('Invalid capacity configuration');
    });
  });

  describe('工作站更新', () => {
    it('應該更新工作站產能配置', async () => {
      // Arrange
      const workstationId = 'WS001';
      const updatedCapacity: WorkstationCapacity = {
        hourlyOutput: 600,
        maxOperators: 6,
        minOperators: 3
      };
      
      const existingWorkstation: Workstation = {
        id: workstationId,
        code: 'PKG-A',
        name: '包裝站A',
        type: 'packaging',
        location: '一樓生產區',
        capacity: {
          hourlyOutput: 500,
          maxOperators: 5,
          minOperators: 2
        },
        requiredSkills: [],
        equipment: [],
        status: 'active',
        operatorCount: 3
      };
      
      mockRepository.findById.mockResolvedValue(existingWorkstation);
      mockRepository.updateCapacity.mockResolvedValue({
        ...existingWorkstation,
        capacity: updatedCapacity
      });

      // Act
      const result = await workstationService.updateCapacity(workstationId, updatedCapacity);

      // Assert
      expect(result.capacity).toEqual(updatedCapacity);
      expect(mockRepository.updateCapacity).toHaveBeenCalledWith(workstationId, updatedCapacity);
    });

    it('應該同步更新排程系統', async () => {
      // Arrange
      const workstationId = 'WS001';
      const updates = { status: 'maintenance' as const };
      mockRepository.update.mockResolvedValue({ id: workstationId, ...updates } as Workstation);
      
      // Act
      await workstationService.updateWorkstation(workstationId, updates);

      // Assert
      expect(mockCapacityCalculator.recalculateSchedule).toHaveBeenCalledWith(workstationId);
    });

    it('應該驗證人員需求不超過最大值', async () => {
      // Arrange
      const workstationId = 'WS001';
      const workstation: Workstation = {
        id: workstationId,
        capacity: { maxOperators: 5, minOperators: 2, hourlyOutput: 500 }
      } as Workstation;
      
      mockRepository.findById.mockResolvedValue(workstation);

      // Act & Assert
      await expect(
        workstationService.assignOperators(workstationId, 6)
      ).rejects.toThrow('Exceeds maximum operator capacity');
    });
  });

  describe('工作站狀態管理', () => {
    it('應該正確處理設備故障', async () => {
      // Arrange
      const workstationId = 'WS001';
      const failureReason = '封口機故障';
      
      mockRepository.updateStatus.mockResolvedValue({
        id: workstationId,
        status: 'maintenance',
        capacity: { hourlyOutput: 0 }
      } as Workstation);

      // Act
      const result = await workstationService.reportEquipmentFailure(
        workstationId,
        failureReason
      );

      // Assert
      expect(result.status).toBe('maintenance');
      expect(result.capacity.hourlyOutput).toBe(0);
      expect(mockRepository.createMaintenanceLog).toHaveBeenCalledWith({
        workstationId,
        reason: failureReason,
        timestamp: expect.any(Date)
      });
    });

    it('應該自動通知維修人員', async () => {
      // Arrange
      const workstationId = 'WS001';
      const mockNotificationService = jest.fn();
      workstationService.setNotificationService(mockNotificationService);

      // Act
      await workstationService.reportEquipmentFailure(workstationId, '設備故障');

      // Assert
      expect(mockNotificationService).toHaveBeenCalledWith({
        type: 'maintenance_required',
        workstationId,
        priority: 'high'
      });
    });

    it('應該追蹤工作站稼動率', async () => {
      // Arrange
      const workstationId = 'WS001';
      const dateRange = {
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31')
      };
      
      mockRepository.getUtilizationRate.mockResolvedValue(0.85);

      // Act
      const utilizationRate = await workstationService.getUtilizationRate(
        workstationId,
        dateRange
      );

      // Assert
      expect(utilizationRate).toBe(0.85);
      expect(mockRepository.getUtilizationRate).toHaveBeenCalledWith(
        workstationId,
        dateRange
      );
    });
  });

  describe('技能需求管理', () => {
    it('應該驗證操作員技能匹配', async () => {
      // Arrange
      const workstationId = 'WS001';
      const operatorId = 'OP001';
      const workstation: Workstation = {
        id: workstationId,
        requiredSkills: ['packaging_advanced', 'quality_control']
      } as Workstation;
      
      const operatorSkills = ['packaging_basic'];
      
      mockRepository.findById.mockResolvedValue(workstation);
      mockRepository.getOperatorSkills.mockResolvedValue(operatorSkills);

      // Act & Assert
      await expect(
        workstationService.assignOperator(workstationId, operatorId)
      ).rejects.toThrow('Operator lacks required skills');
    });

    it('應該允許具備所需技能的操作員', async () => {
      // Arrange
      const workstationId = 'WS001';
      const operatorId = 'OP001';
      const workstation: Workstation = {
        id: workstationId,
        requiredSkills: ['packaging_basic'],
        operatorCount: 2,
        capacity: { maxOperators: 5 }
      } as Workstation;
      
      const operatorSkills = ['packaging_basic', 'packaging_advanced'];
      
      mockRepository.findById.mockResolvedValue(workstation);
      mockRepository.getOperatorSkills.mockResolvedValue(operatorSkills);
      mockRepository.assignOperator.mockResolvedValue(true);

      // Act
      const result = await workstationService.assignOperator(workstationId, operatorId);

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.assignOperator).toHaveBeenCalledWith(workstationId, operatorId);
    });
  });

  describe('工作站拓撲管理', () => {
    it('應該生成工作站拓撲圖', async () => {
      // Arrange
      const mockWorkstations: Workstation[] = [
        {
          id: 'WS001',
          name: '清洗站',
          type: 'washing',
          location: '入口區'
        } as Workstation,
        {
          id: 'WS002',
          name: '切割站',
          type: 'cutting',
          location: '加工區'
        } as Workstation,
        {
          id: 'WS003',
          name: '包裝站',
          type: 'packaging',
          location: '出口區'
        } as Workstation
      ];
      
      mockRepository.findAll.mockResolvedValue(mockWorkstations);

      // Act
      const topology = await workstationService.getWorkstationTopology();

      // Assert
      expect(topology.nodes).toHaveLength(3);
      expect(topology.edges).toBeDefined();
      expect(topology.flow).toContain('washing -> cutting -> packaging');
    });

    it('應該支援拖放式配置更新', async () => {
      // Arrange
      const layoutUpdate = {
        workstationId: 'WS001',
        newPosition: { x: 100, y: 200 },
        newLocation: '二樓生產區'
      };

      mockRepository.updateLayout.mockResolvedValue(true);

      // Act
      const result = await workstationService.updateLayout(layoutUpdate);

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.updateLayout).toHaveBeenCalledWith(layoutUpdate);
    });
  });

  describe('產能衝突檢測', () => {
    it('應該檢測產能衝突', async () => {
      // Arrange
      const workstationId = 'WS001';
      const plannedOutput = 1000;
      const workstation: Workstation = {
        id: workstationId,
        capacity: { hourlyOutput: 500 },
        operatorCount: 3
      } as Workstation;
      
      mockRepository.findById.mockResolvedValue(workstation);

      // Act
      const hasConflict = await workstationService.checkCapacityConflict(
        workstationId,
        plannedOutput,
        2 // hours
      );

      // Assert
      expect(hasConflict).toBe(false); // 500 * 2 = 1000, no conflict
    });

    it('應該警告產能不足', async () => {
      // Arrange
      const workstationId = 'WS001';
      const plannedOutput = 2000;
      const workstation: Workstation = {
        id: workstationId,
        capacity: { hourlyOutput: 500 }
      } as Workstation;
      
      mockRepository.findById.mockResolvedValue(workstation);

      // Act
      const warning = await workstationService.checkCapacityConflict(
        workstationId,
        plannedOutput,
        2 // hours
      );

      // Assert
      expect(warning).toBe(true);
      expect(warning.message).toContain('Insufficient capacity');
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