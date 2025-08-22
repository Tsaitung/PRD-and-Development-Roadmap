/**
 * 單元測試：FR-PM-SRM-001 供應商主檔管理
 * 模組：PM-SRM (Purchasing Management - Supplier Relationship Management)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SupplierService } from '../../src/modules/pm/supplier/services/SupplierService';
import { SupplierRepository } from '../../src/modules/pm/supplier/repositories/SupplierRepository';
import { ValidationService } from '../../src/shared/services/ValidationService';
import { Supplier, SupplierContact, SupplierCertification } from '../../src/modules/pm/supplier/types';

// Mock dependencies
jest.mock('../../src/modules/pm/supplier/repositories/SupplierRepository');
jest.mock('../../src/shared/services/ValidationService');

describe('FR-PM-SRM-001: 供應商主檔管理', () => {
  let supplierService: SupplierService;
  let mockRepository: jest.Mocked<SupplierRepository>;
  let mockValidation: jest.Mocked<ValidationService>;

  beforeEach(() => {
    mockRepository = new SupplierRepository() as jest.Mocked<SupplierRepository>;
    mockValidation = new ValidationService() as jest.Mocked<ValidationService>;
    supplierService = new SupplierService(mockRepository, mockValidation);
  });

  describe('供應商建立', () => {
    it('應該成功創建新供應商', async () => {
      // Arrange
      const newSupplier = {
        name: '優質農產有限公司',
        taxId: '12345678',
        type: 'manufacturer' as const,
        contacts: [
          {
            name: '王大明',
            title: '業務經理',
            phone: '0912-345678',
            email: 'wang@example.com',
            isPrimary: true
          }
        ],
        suppliedItems: ['ITEM001', 'ITEM002']
      };

      const createdSupplier: Supplier = {
        id: 'SUP001',
        code: 'SUP20250822001',
        ...newSupplier,
        status: 'active',
        rating: 0,
        certifications: [],
        bankAccounts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockValidation.validateTaxId.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(createdSupplier);

      // Act
      const result = await supplierService.createSupplier(newSupplier);

      // Assert
      expect(result).toEqual(createdSupplier);
      expect(result.status).toBe('active');
      expect(mockValidation.validateTaxId).toHaveBeenCalledWith('12345678');
      expect(mockRepository.create).toHaveBeenCalledWith(newSupplier);
    });

    it('應該自動檢查統編重複', async () => {
      // Arrange
      const duplicateTaxId = '12345678';
      mockRepository.findByTaxId.mockResolvedValue({
        id: 'SUP001',
        taxId: duplicateTaxId
      } as Supplier);

      // Act & Assert
      await expect(
        supplierService.createSupplier({ taxId: duplicateTaxId })
      ).rejects.toThrow('Supplier with this tax ID already exists');
    });

    it('應該驗證統編格式正確性', async () => {
      // Arrange
      const invalidTaxId = '1234';
      mockValidation.validateTaxId.mockResolvedValue(false);

      // Act & Assert
      await expect(
        supplierService.createSupplier({ taxId: invalidTaxId })
      ).rejects.toThrow('Invalid tax ID format');
    });

    it('應該自動帶入公司基本資料', async () => {
      // Arrange
      const taxId = '12345678';
      const companyInfo = {
        name: '優質農產有限公司',
        address: '台北市信義區信義路100號',
        capital: 10000000
      };
      
      mockValidation.fetchCompanyInfo.mockResolvedValue(companyInfo);
      mockRepository.create.mockResolvedValue({} as Supplier);

      // Act
      await supplierService.createSupplierWithAutoFill(taxId);

      // Assert
      expect(mockValidation.fetchCompanyInfo).toHaveBeenCalledWith(taxId);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: companyInfo.name,
          address: companyInfo.address
        })
      );
    });
  });

  describe('供應商資料更新', () => {
    it('應該更新供應商基本資料', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const updates = {
        address: '新北市板橋區文化路200號',
        contacts: [
          {
            name: '李小華',
            title: '採購經理',
            phone: '0923-456789',
            email: 'lee@example.com',
            isPrimary: true
          }
        ]
      };

      const updatedSupplier: Supplier = {
        id: supplierId,
        ...updates
      } as Supplier;

      mockRepository.update.mockResolvedValue(updatedSupplier);

      // Act
      const result = await supplierService.updateSupplier(supplierId, updates);

      // Assert
      expect(result.address).toBe(updates.address);
      expect(result.contacts[0].name).toBe('李小華');
      expect(mockRepository.update).toHaveBeenCalledWith(supplierId, updates);
    });

    it('應該記錄供應商資料變更歷史', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const updates = { status: 'inactive' as const };
      
      mockRepository.update.mockResolvedValue({} as Supplier);
      mockRepository.createChangeLog.mockResolvedValue(true);

      // Act
      await supplierService.updateSupplier(supplierId, updates);

      // Assert
      expect(mockRepository.createChangeLog).toHaveBeenCalledWith({
        supplierId,
        changes: updates,
        changedBy: expect.any(String),
        changedAt: expect.any(Date)
      });
    });
  });

  describe('認證管理', () => {
    it('應該記錄供應商認證資料', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const certification: SupplierCertification = {
        id: 'CERT001',
        supplierId,
        type: 'ISO22000',
        certificateNo: 'ISO22000-2025-001',
        issueDate: new Date('2025-01-01'),
        expiryDate: new Date('2026-01-01'),
        issuingBody: 'SGS',
        documentUrl: 'https://example.com/cert.pdf'
      };

      mockRepository.addCertification.mockResolvedValue(certification);

      // Act
      const result = await supplierService.addCertification(supplierId, certification);

      // Assert
      expect(result).toEqual(certification);
      expect(result.type).toBe('ISO22000');
      expect(mockRepository.addCertification).toHaveBeenCalledWith(supplierId, certification);
    });

    it('應該設定認證到期提醒', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const certification = {
        type: 'HACCP',
        expiryDate: new Date('2025-09-01')
      };

      mockRepository.addCertification.mockResolvedValue(certification as SupplierCertification);
      mockRepository.createReminder.mockResolvedValue(true);

      // Act
      await supplierService.addCertification(supplierId, certification);

      // Assert
      expect(mockRepository.createReminder).toHaveBeenCalledWith({
        supplierId,
        type: 'certification_expiry',
        reminderDate: expect.any(Date), // 30 days before expiry
        message: expect.stringContaining('HACCP')
      });
    });

    it('應該檢查認證有效性', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const expiredCert = {
        type: 'Organic',
        expiryDate: new Date('2024-01-01')
      };

      // Act & Assert
      await expect(
        supplierService.addCertification(supplierId, expiredCert)
      ).rejects.toThrow('Certificate has already expired');
    });
  });

  describe('供應品項管理', () => {
    it('應該建立供應商與品項關聯', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const itemIds = ['ITEM001', 'ITEM002', 'ITEM003'];
      
      mockRepository.linkItems.mockResolvedValue(true);
      mockRepository.updateItemSuppliers.mockResolvedValue(true);

      // Act
      const result = await supplierService.linkSuppliedItems(supplierId, itemIds);

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.linkItems).toHaveBeenCalledWith(supplierId, itemIds);
      expect(mockRepository.updateItemSuppliers).toHaveBeenCalledWith(itemIds, supplierId);
    });

    it('應該驗證品項存在性', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const invalidItemIds = ['INVALID001'];
      
      mockRepository.validateItems.mockResolvedValue(false);

      // Act & Assert
      await expect(
        supplierService.linkSuppliedItems(supplierId, invalidItemIds)
      ).rejects.toThrow('One or more items do not exist');
    });

    it('應該在品項主檔顯示供應商資訊', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const itemId = 'ITEM001';
      
      const supplierInfo = {
        supplierId,
        supplierName: '優質農產',
        supplierCode: 'SUP001'
      };

      mockRepository.getSupplierInfoForItem.mockResolvedValue(supplierInfo);

      // Act
      const result = await supplierService.getItemSupplierInfo(itemId);

      // Assert
      expect(result).toContain(supplierInfo);
      expect(result[0].supplierName).toBe('優質農產');
    });
  });

  describe('供應商查詢', () => {
    it('應該支援多條件查詢', async () => {
      // Arrange
      const searchCriteria = {
        type: 'manufacturer',
        status: 'active',
        minRating: 4.0
      };

      const mockSuppliers: Supplier[] = [
        {
          id: 'SUP001',
          name: '供應商A',
          type: 'manufacturer',
          status: 'active',
          rating: 4.5
        } as Supplier,
        {
          id: 'SUP002',
          name: '供應商B',
          type: 'manufacturer',
          status: 'active',
          rating: 4.2
        } as Supplier
      ];

      mockRepository.search.mockResolvedValue(mockSuppliers);

      // Act
      const result = await supplierService.searchSuppliers(searchCriteria);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].rating).toBeGreaterThanOrEqual(4.0);
      expect(mockRepository.search).toHaveBeenCalledWith(searchCriteria);
    });

    it('應該支援供應商名稱模糊查詢', async () => {
      // Arrange
      const keyword = '農產';
      
      mockRepository.searchByName.mockResolvedValue([
        { id: 'SUP001', name: '優質農產有限公司' } as Supplier,
        { id: 'SUP002', name: '新鮮農產股份有限公司' } as Supplier
      ]);

      // Act
      const result = await supplierService.searchByKeyword(keyword);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toContain('農產');
      expect(result[1].name).toContain('農產');
    });

    it('應該查詢供應商合作歷史', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-08-31')
      };

      const mockHistory = {
        totalOrders: 50,
        totalAmount: 1500000,
        averageDeliveryDays: 3,
        qualityIssues: 2
      };

      mockRepository.getSupplierHistory.mockResolvedValue(mockHistory);

      // Act
      const history = await supplierService.getSupplierHistory(supplierId, dateRange);

      // Assert
      expect(history.totalOrders).toBe(50);
      expect(history.totalAmount).toBe(1500000);
      expect(mockRepository.getSupplierHistory).toHaveBeenCalledWith(supplierId, dateRange);
    });
  });

  describe('資料驗證', () => {
    it('應該驗證必填欄位', async () => {
      // Arrange
      const incompleteSupplier = {
        type: 'manufacturer'
        // Missing required fields: name, taxId
      };

      // Act & Assert
      await expect(
        supplierService.createSupplier(incompleteSupplier)
      ).rejects.toThrow('Missing required fields');
    });

    it('應該驗證Email格式', async () => {
      // Arrange
      const invalidContact = {
        name: '測試聯絡人',
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(
        supplierService.validateContact(invalidContact)
      ).rejects.toThrow('Invalid email format');
    });

    it('應該驗證電話號碼格式', async () => {
      // Arrange
      const invalidContact = {
        name: '測試聯絡人',
        phone: '123'
      };

      // Act & Assert
      await expect(
        supplierService.validateContact(invalidContact)
      ).rejects.toThrow('Invalid phone number format');
    });
  });

  describe('黑名單管理', () => {
    it('應該將供應商加入黑名單', async () => {
      // Arrange
      const supplierId = 'SUP001';
      const reason = '多次品質問題';
      
      mockRepository.addToBlacklist.mockResolvedValue(true);
      mockRepository.blockNewOrders.mockResolvedValue(true);

      // Act
      const result = await supplierService.addToBlacklist(supplierId, reason);

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.addToBlacklist).toHaveBeenCalledWith(supplierId, reason);
      expect(mockRepository.blockNewOrders).toHaveBeenCalledWith(supplierId);
    });

    it('應該阻止向黑名單供應商下單', async () => {
      // Arrange
      const blacklistedSupplierId = 'SUP999';
      mockRepository.isBlacklisted.mockResolvedValue(true);

      // Act & Assert
      await expect(
        supplierService.createPurchaseOrder(blacklistedSupplierId, {})
      ).rejects.toThrow('Cannot create order for blacklisted supplier');
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