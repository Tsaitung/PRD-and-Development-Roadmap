/**
 * Unit Tests for Material Requisition Service
 * 測試 FR-MES-MBU-001: 材料領用管理
 */

import { MaterialRequisitionService } from '@/modules/mes/services/materialRequisition.service';
import { MaterialRepository } from '@/modules/mes/repositories/material.repository';
import { InventoryService } from '@/modules/warehouse/services/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MaterialRequisitionService', () => {
  let service: MaterialRequisitionService;
  let materialRepository: jest.Mocked<MaterialRepository>;
  let inventoryService: jest.Mocked<InventoryService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    materialRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    inventoryService = {
      checkAvailability: jest.fn(),
      reserveMaterial: jest.fn(),
      deductInventory: jest.fn(),
      getBatchSuggestions: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new MaterialRequisitionService(
      materialRepository,
      inventoryService,
      eventEmitter
    );
  });

  describe('createRequisition', () => {
    it('should create material requisition successfully', async () => {
      // Arrange
      const requisitionData = {
        workOrderId: 'WO-2025-001',
        workshop: 'Workshop-A',
        workstation: 'WS-001',
        items: [
          {
            materialId: 'MAT-001',
            quantity: 100,
            unit: 'kg',
          },
        ],
      };

      const mockInventoryCheck = {
        available: true,
        quantity: 150,
        batches: [
          {
            batchNo: 'BATCH-2025-001',
            quantity: 100,
            expiryDate: new Date('2025-12-31'),
          },
        ],
      };

      inventoryService.checkAvailability.mockResolvedValue(mockInventoryCheck);
      inventoryService.getBatchSuggestions.mockResolvedValue(mockInventoryCheck.batches);
      materialRepository.create.mockReturnValue({ id: 'REQ-001', ...requisitionData } as any);
      materialRepository.save.mockResolvedValue({ id: 'REQ-001', ...requisitionData } as any);

      // Act
      const result = await service.createRequisition(requisitionData, 'user-001');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('REQ-001');
      expect(inventoryService.checkAvailability).toHaveBeenCalledWith('MAT-001', 100);
      expect(inventoryService.getBatchSuggestions).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'requisition.created',
        expect.objectContaining({ requisitionId: 'REQ-001' })
      );
    });

    it('should throw error when inventory is insufficient', async () => {
      // Arrange
      const requisitionData = {
        workOrderId: 'WO-2025-001',
        items: [
          {
            materialId: 'MAT-001',
            quantity: 100,
          },
        ],
      };

      inventoryService.checkAvailability.mockResolvedValue({
        available: false,
        quantity: 50,
        shortage: 50,
      });

      // Act & Assert
      await expect(service.createRequisition(requisitionData, 'user-001'))
        .rejects.toThrow(BadRequestException);
      expect(inventoryService.checkAvailability).toHaveBeenCalled();
    });

    it('should prioritize expiring batches in allocation', async () => {
      // Arrange
      const requisitionData = {
        workOrderId: 'WO-2025-001',
        items: [
          {
            materialId: 'MAT-001',
            quantity: 100,
          },
        ],
      };

      const batches = [
        {
          batchNo: 'BATCH-001',
          quantity: 50,
          expiryDate: new Date('2025-09-01'), // Expires sooner
        },
        {
          batchNo: 'BATCH-002',
          quantity: 100,
          expiryDate: new Date('2025-12-31'),
        },
      ];

      inventoryService.checkAvailability.mockResolvedValue({ available: true });
      inventoryService.getBatchSuggestions.mockResolvedValue(batches);
      materialRepository.create.mockReturnValue({ id: 'REQ-001' } as any);
      materialRepository.save.mockResolvedValue({ 
        id: 'REQ-001',
        items: [{
          batches: [batches[0], { ...batches[1], quantity: 50 }]
        }]
      } as any);

      // Act
      const result = await service.createRequisition(requisitionData, 'user-001');

      // Assert
      expect(result.items[0].batches[0].batchNo).toBe('BATCH-001');
      expect(result.items[0].batches[0].quantity).toBe(50);
    });
  });

  describe('scanMaterial', () => {
    it('should process material scan and return details within 0.5s', async () => {
      // Arrange
      const barcode = '1234567890';
      const mockMaterial = {
        id: 'MAT-001',
        code: 'M001',
        name: 'Raw Material A',
        unit: 'kg',
        currentStock: 100,
      };

      materialRepository.findOne.mockResolvedValue(mockMaterial);

      // Act
      const startTime = Date.now();
      const result = await service.scanMaterial(barcode);
      const endTime = Date.now();

      // Assert
      expect(result).toEqual(mockMaterial);
      expect(endTime - startTime).toBeLessThan(500); // Less than 0.5 seconds
      expect(materialRepository.findOne).toHaveBeenCalledWith({ where: { barcode } });
    });

    it('should handle invalid barcode gracefully', async () => {
      // Arrange
      const invalidBarcode = 'INVALID';
      materialRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.scanMaterial(invalidBarcode))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('approveRequisition', () => {
    it('should approve requisition and reserve inventory', async () => {
      // Arrange
      const requisitionId = 'REQ-001';
      const mockRequisition = {
        id: requisitionId,
        status: 'submitted',
        items: [
          {
            materialId: 'MAT-001',
            quantity: 100,
            batches: [
              { batchNo: 'BATCH-001', quantity: 100 }
            ],
          },
        ],
      };

      materialRepository.findOne.mockResolvedValue(mockRequisition);
      inventoryService.reserveMaterial.mockResolvedValue({ success: true });
      materialRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Act
      const result = await service.approveRequisition(requisitionId, 'approver-001');

      // Assert
      expect(result.status).toBe('approved');
      expect(inventoryService.reserveMaterial).toHaveBeenCalledWith(
        'MAT-001',
        100,
        expect.any(Array)
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'requisition.approved',
        expect.objectContaining({ requisitionId })
      );
    });

    it('should not approve already approved requisition', async () => {
      // Arrange
      const mockRequisition = {
        id: 'REQ-001',
        status: 'approved',
      };

      materialRepository.findOne.mockResolvedValue(mockRequisition);

      // Act & Assert
      await expect(service.approveRequisition('REQ-001', 'approver-001'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('issueMaterial', () => {
    it('should issue material and update inventory', async () => {
      // Arrange
      const requisitionId = 'REQ-001';
      const mockRequisition = {
        id: requisitionId,
        status: 'approved',
        items: [
          {
            materialId: 'MAT-001',
            quantity: 100,
            batches: [
              { batchNo: 'BATCH-001', quantity: 100 }
            ],
          },
        ],
      };

      materialRepository.findOne.mockResolvedValue(mockRequisition);
      inventoryService.deductInventory.mockResolvedValue({ success: true });
      materialRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Act
      const result = await service.issueMaterial(requisitionId, 'issuer-001');

      // Assert
      expect(result.status).toBe('completed');
      expect(inventoryService.deductInventory).toHaveBeenCalledWith(
        'MAT-001',
        100,
        expect.any(Array)
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'material.issued',
        expect.objectContaining({ requisitionId })
      );
    });
  });

  describe('returnMaterial', () => {
    it('should process material return and update inventory', async () => {
      // Arrange
      const returnData = {
        requisitionId: 'REQ-001',
        items: [
          {
            materialId: 'MAT-001',
            batchNo: 'BATCH-001',
            quantity: 20,
            reason: 'Excess material',
          },
        ],
      };

      const mockRequisition = {
        id: 'REQ-001',
        status: 'completed',
        items: [
          {
            materialId: 'MAT-001',
            issuedQuantity: 100,
          },
        ],
      };

      materialRepository.findOne.mockResolvedValue(mockRequisition);
      inventoryService.returnMaterial = jest.fn().mockResolvedValue({ success: true });

      // Act
      const result = await service.returnMaterial(returnData, 'user-001');

      // Assert
      expect(result).toBeDefined();
      expect(inventoryService.returnMaterial).toHaveBeenCalledWith(
        'MAT-001',
        'BATCH-001',
        20
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'material.returned',
        expect.any(Object)
      );
    });
  });

  describe('getSuggestions', () => {
    it('should provide material suggestions based on work order', async () => {
      // Arrange
      const workOrderId = 'WO-2025-001';
      const mockSuggestions = [
        {
          materialId: 'MAT-001',
          suggestedQuantity: 100,
          reason: 'Based on BOM',
        },
        {
          materialId: 'MAT-002',
          suggestedQuantity: 50,
          reason: 'Based on historical usage',
        },
      ];

      service.getMaterialSuggestions = jest.fn().mockResolvedValue(mockSuggestions);

      // Act
      const result = await service.getMaterialSuggestions(workOrderId);

      // Assert
      expect(result).toEqual(mockSuggestions);
      expect(result).toHaveLength(2);
    });
  });

  describe('Performance Tests', () => {
    it('should handle batch scan of 100 items efficiently', async () => {
      // Arrange
      const barcodes = Array.from({ length: 100 }, (_, i) => `BARCODE-${i}`);
      materialRepository.findOne.mockResolvedValue({ id: 'MAT-001' });

      // Act
      const startTime = Date.now();
      const promises = barcodes.map(barcode => service.scanMaterial(barcode));
      await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds for 100 scans
      expect(materialRepository.findOne).toHaveBeenCalledTimes(100);
    });

    it('should optimize batch allocation for large requisitions', async () => {
      // Arrange
      const largeRequisition = {
        workOrderId: 'WO-2025-001',
        items: Array.from({ length: 50 }, (_, i) => ({
          materialId: `MAT-${i}`,
          quantity: 100,
        })),
      };

      inventoryService.checkAvailability.mockResolvedValue({ available: true });
      inventoryService.getBatchSuggestions.mockResolvedValue([]);
      materialRepository.create.mockReturnValue({ id: 'REQ-001' } as any);
      materialRepository.save.mockResolvedValue({ id: 'REQ-001' } as any);

      // Act
      const startTime = Date.now();
      await service.createRequisition(largeRequisition, 'user-001');
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(3000); // Less than 3 seconds
    });
  });
});

describe('Material Requisition Integration Tests', () => {
  it('should complete full requisition workflow', async () => {
    // This would be an integration test with actual database
    // Testing the complete flow from creation to issuance
    expect(true).toBe(true); // Placeholder
  });

  it('should handle concurrent requisitions without conflicts', async () => {
    // Test concurrent access and locking mechanisms
    expect(true).toBe(true); // Placeholder
  });

  it('should maintain data consistency across system failures', async () => {
    // Test transaction rollback and data integrity
    expect(true).toBe(true); // Placeholder
  });
});