/**
 * FR-CRM-CM-005: Company-Store-Unit 階層關係管理測試
 * 測試 Company/Store/Unit 三層架構的完整功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  Company,
  Store,
  Unit,
  CompanyStatus,
  StoreStatus,
  UnitStatus,
  CompanyHierarchy,
  CreateCompanyRequest,
  CreateStoreRequest,
  CreateUnitRequest,
  migrateCustomerToCompany,
  createDefaultUnit
} from '../../src/modules/customer/types';
import { CustomerService } from '../../src/modules/customer/service';
import { AppError } from '../../src/middleware/errorHandler';

// Mock dependencies
jest.mock('../../src/database/connection');
jest.mock('../../src/database/redis');

describe('FR-CRM-CM-005: Company-Store-Unit 階層關係管理', () => {
  let customerService: CustomerService;
  let mockClient: any;

  beforeEach(() => {
    customerService = new CustomerService();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('Company 管理', () => {
    it('應該成功創建 Company 並自動建立預設 Unit', async () => {
      // Arrange
      const createRequest: CreateCompanyRequest = {
        companyName: '測試企業股份有限公司',
        unicode: '12345678',
        companyAddress: {
          addressLine1: '信義路五段7號',
          city: '台北市',
          country: '台灣'
        },
        companyPhone: '02-1234-5678',
        contactEmail: 'test@company.com',
        businessCategory: '製造業',
        pricingSet: 'PRICE_SET_A',
        paymentTerms: '月結30天',
        creditLimit: 1000000,
        settlementDay: 25,
        createDefaultUnit: true
      };

      const expectedCompany: Company = {
        id: 'comp-001',
        companyCode: 'COMP-2025-0001',
        companyName: createRequest.companyName,
        unicode: createRequest.unicode,
        status: CompanyStatus.ACTIVE,
        companyAddress: createRequest.companyAddress,
        companyPhone: createRequest.companyPhone,
        contactEmail: createRequest.contactEmail,
        businessCategory: createRequest.businessCategory,
        pricingSet: createRequest.pricingSet,
        paymentTerms: { terms: createRequest.paymentTerms },
        creditLimit: createRequest.creditLimit,
        settlementDay: createRequest.settlementDay,
        createdBy: 'user-001',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check duplicate unicode
        .mockResolvedValueOnce({ rows: [expectedCompany] }) // Insert company
        .mockResolvedValueOnce({ rows: [{ id: 'unit-001' }] }); // Insert default unit

      // Act
      const result = await customerService.createCompany(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.companyCode).toBe('COMP-2025-0001');
      expect(result.companyName).toBe(createRequest.companyName);
      expect(result.unicode).toBe(createRequest.unicode);
      expect(result.units).toHaveLength(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('應該拒絕重複的統一編號', async () => {
      // Arrange
      const createRequest: CreateCompanyRequest = {
        companyName: '重複企業',
        unicode: '12345678',
        createDefaultUnit: true
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'existing-company' }] }); // Duplicate found

      // Act & Assert
      await expect(customerService.createCompany(createRequest))
        .rejects
        .toThrow(new AppError('統一編號已存在', 400));
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Store 管理', () => {
    it('應該成功為 Company 新增 Store', async () => {
      // Arrange
      const companyId = 'comp-001';
      const createRequest: CreateStoreRequest = {
        storeName: '台北信義門市',
        companyId,
        storeAddress: {
          addressLine1: '松高路9號',
          city: '台北市',
          country: '台灣'
        },
        zipcode: '110',
        deliveryWindow: {
          weekday: {
            startTime: '09:00',
            endTime: '18:00'
          },
          weekend: {
            startTime: '10:00',
            endTime: '17:00'
          }
        },
        contactPerson: '張經理',
        contactPhone: '02-8780-1234',
        instructionForDriver: '請從側門進入'
      };

      const expectedStore: Store = {
        id: 'store-001',
        storeCode: 'STORE-2025-0001',
        storeName: createRequest.storeName,
        companyId: createRequest.companyId,
        status: StoreStatus.ACTIVE,
        storeAddress: createRequest.storeAddress,
        zipcode: createRequest.zipcode,
        deliveryWindow: createRequest.deliveryWindow,
        contactPerson: createRequest.contactPerson,
        contactPhone: createRequest.contactPhone,
        instructionForDriver: createRequest.instructionForDriver,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: companyId }] }) // Company exists
        .mockResolvedValueOnce({ rows: [expectedStore] }); // Insert store

      // Act
      const result = await customerService.createStore(companyId, createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.storeCode).toBe('STORE-2025-0001');
      expect(result.storeName).toBe(createRequest.storeName);
      expect(result.companyId).toBe(companyId);
      expect(result.deliveryWindow).toEqual(createRequest.deliveryWindow);
    });

    it('應該拒絕為不存在的 Company 建立 Store', async () => {
      // Arrange
      const invalidCompanyId = 'invalid-comp';
      const createRequest: CreateStoreRequest = {
        storeName: '無效門市',
        companyId: invalidCompanyId,
        storeAddress: {
          addressLine1: '測試路1號',
          city: '測試市',
          country: '台灣'
        }
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }); // Company not found

      // Act & Assert
      await expect(customerService.createStore(invalidCompanyId, createRequest))
        .rejects
        .toThrow(new AppError('Company not found', 404));
    });

    it('應該檢測重複的 Store 地址', async () => {
      // Arrange
      const companyId = 'comp-001';
      const createRequest: CreateStoreRequest = {
        storeName: '重複門市',
        companyId,
        storeAddress: {
          addressLine1: '已存在的地址',
          city: '台北市',
          country: '台灣'
        }
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: companyId }] }) // Company exists
        .mockResolvedValueOnce({ rows: [{ id: 'existing-store' }] }); // Duplicate address

      // Act & Assert
      await expect(customerService.createStore(companyId, createRequest))
        .rejects
        .toThrow(new AppError('此地址已存在', 400));
    });
  });

  describe('Unit 管理', () => {
    it('應該在創建 Company 時自動建立預設 Unit', async () => {
      // Arrange
      const company: Company = {
        id: 'comp-001',
        companyCode: 'COMP-2025-0001',
        companyName: '測試企業',
        status: CompanyStatus.ACTIVE,
        createdBy: 'user-001',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const unit = createDefaultUnit(company);

      // Assert
      expect(unit).toBeDefined();
      expect(unit.unitCode).toBe('UNIT-COMP-2025-0001');
      expect(unit.unitName).toBe(company.companyName);
      expect(unit.companyId).toBe(company.id);
      expect(unit.unitType).toBe('default');
      expect(unit.canPlaceOrders).toBe(true);
      expect(unit.status).toBe(UnitStatus.ACTIVE);
    });

    it('應該支援為 Company 建立多個 Unit', async () => {
      // Arrange
      const companyId = 'comp-001';
      const createRequest: CreateUnitRequest = {
        unitName: '採購部門',
        companyId,
        unitType: 'department',
        authorizationScope: ['purchase', 'inventory'],
        canPlaceOrders: true,
        maxOrderAmount: 500000
      };

      const expectedUnit: Unit = {
        id: 'unit-002',
        unitCode: 'UNIT-2025-0002',
        unitName: createRequest.unitName,
        companyId: createRequest.companyId,
        status: UnitStatus.ACTIVE,
        unitType: createRequest.unitType,
        authorizationScope: createRequest.authorizationScope,
        canPlaceOrders: createRequest.canPlaceOrders,
        orderApprovalRequired: createRequest.maxOrderAmount ? true : false,
        maxOrderAmount: createRequest.maxOrderAmount,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: companyId }] }) // Company exists
        .mockResolvedValueOnce({ rows: [expectedUnit] }); // Insert unit

      // Act
      const result = await customerService.createUnit(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.unitName).toBe(createRequest.unitName);
      expect(result.unitType).toBe('department');
      expect(result.maxOrderAmount).toBe(500000);
      expect(result.orderApprovalRequired).toBe(true);
    });
  });

  describe('階層關係查詢', () => {
    it('應該返回完整的 Company-Store-Unit 階層', async () => {
      // Arrange
      const companyId = 'comp-001';
      const expectedHierarchy: CompanyHierarchy = {
        company: {
          id: companyId,
          companyCode: 'COMP-2025-0001',
          companyName: '測試企業',
          status: CompanyStatus.ACTIVE,
          createdBy: 'user-001',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        stores: [
          {
            id: 'store-001',
            storeCode: 'STORE-001',
            storeName: '台北門市',
            companyId,
            status: StoreStatus.ACTIVE,
            storeAddress: {
              addressLine1: '信義路',
              city: '台北市',
              country: '台灣'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'store-002',
            storeCode: 'STORE-002',
            storeName: '台中門市',
            companyId,
            status: StoreStatus.ACTIVE,
            storeAddress: {
              addressLine1: '台灣大道',
              city: '台中市',
              country: '台灣'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        units: [
          {
            id: 'unit-001',
            unitCode: 'UNIT-001',
            unitName: '測試企業',
            companyId,
            status: UnitStatus.ACTIVE,
            unitType: 'default',
            canPlaceOrders: true,
            orderApprovalRequired: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [expectedHierarchy.company] }) // Get company
        .mockResolvedValueOnce({ rows: expectedHierarchy.stores }) // Get stores
        .mockResolvedValueOnce({ rows: expectedHierarchy.units }); // Get units

      // Act
      const result = await customerService.getCompanyHierarchy(companyId);

      // Assert
      expect(result).toBeDefined();
      expect(result.company.id).toBe(companyId);
      expect(result.stores).toHaveLength(2);
      expect(result.units).toHaveLength(1);
      expect(result.stores[0].companyId).toBe(companyId);
      expect(result.units[0].companyId).toBe(companyId);
    });

    it('應該處理沒有 Store 的 Company', async () => {
      // Arrange
      const companyId = 'comp-002';

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: companyId }] }) // Get company
        .mockResolvedValueOnce({ rows: [] }) // No stores
        .mockResolvedValueOnce({ rows: [{ id: 'unit-001' }] }); // Has unit

      // Act
      const result = await customerService.getCompanyHierarchy(companyId);

      // Assert
      expect(result.stores).toHaveLength(0);
      expect(result.units).toHaveLength(1);
    });
  });

  describe('資料遷移', () => {
    it('應該正確將舊的 Customer 資料遷移到 Company', () => {
      // Arrange
      const oldCustomer = {
        id: 'cust-001',
        customerCode: 'CUST-001',
        customerName: '舊客戶企業',
        customerNameEn: 'Old Customer Corp',
        customerType: 'enterprise',
        taxId: '87654321',
        status: 'active',
        billingAddress: {
          addressLine1: '舊地址',
          city: '台北市',
          country: '台灣'
        },
        primaryContact: {
          name: '王經理',
          phone: '02-9999-8888',
          email: 'wang@old.com'
        },
        industry: '科技業',
        businessLicense: 'LIC-123',
        establishedDate: new Date('2000-01-01'),
        pricingTier: 'TIER_A',
        paymentTerms: { terms: '月結60天' },
        creditLimit: 2000000,
        creditUsed: 500000,
        currency: 'TWD',
        tags: ['VIP', '長期客戶'],
        customFields: { field1: 'value1' },
        notes: '重要客戶',
        createdBy: 'admin',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      // Act
      const company = migrateCustomerToCompany(oldCustomer as any);

      // Assert
      expect(company.id).toBe(oldCustomer.id);
      expect(company.companyCode).toBe(oldCustomer.customerCode);
      expect(company.companyName).toBe(oldCustomer.customerName);
      expect(company.unicode).toBe(oldCustomer.taxId);
      expect(company.companyAddress).toEqual(oldCustomer.billingAddress);
      expect(company.companyPhone).toBe(oldCustomer.primaryContact.phone);
      expect(company.contactEmail).toBe(oldCustomer.primaryContact.email);
      expect(company.pricingSet).toBe(oldCustomer.pricingTier);
      expect(company.creditLimit).toBe(oldCustomer.creditLimit);
      expect(company.tags).toEqual(oldCustomer.tags);
    });
  });

  describe('驗證規則', () => {
    it('應該驗證 Unit 和 Store 屬於同一個 Company', async () => {
      // Arrange
      const unitId = 'unit-001';
      const storeId = 'store-001';

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ company_id: 'comp-001' }] }); // Valid relation

      // Act
      const isValid = await customerService.validateUnitStoreRelation(unitId, storeId);

      // Assert
      expect(isValid).toBe(true);
    });

    it('應該拒絕不同 Company 的 Unit 和 Store 關聯', async () => {
      // Arrange
      const unitId = 'unit-001';
      const storeId = 'store-999';

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }); // Invalid relation

      // Act & Assert
      await expect(customerService.validateUnitStoreRelation(unitId, storeId))
        .rejects
        .toThrow(new AppError('Store does not belong to the same company as Unit', 400));
    });

    it('應該檢查刪除 Company 前是否有關聯的 Store 和 Unit', async () => {
      // Arrange
      const companyId = 'comp-001';

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // Has 2 stores
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }); // Has 1 unit

      // Act & Assert
      await expect(customerService.deleteCompany(companyId))
        .rejects
        .toThrow(new AppError('Cannot delete company with existing stores or units', 400));
    });
  });
});

describe('Performance Tests', () => {
  it('應該在合理時間內處理大量 Store 查詢', async () => {
    // Arrange
    const companyId = 'comp-001';
    const storeCount = 100;
    const stores = Array.from({ length: storeCount }, (_, i) => ({
      id: `store-${i}`,
      storeCode: `STORE-${i}`,
      storeName: `門市 ${i}`,
      companyId,
      status: StoreStatus.ACTIVE,
      storeAddress: {
        addressLine1: `地址 ${i}`,
        city: '台北市',
        country: '台灣'
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: stores })
    };

    // Act
    const startTime = Date.now();
    const result = await customerService.getStoresByCompanyId(companyId);
    const endTime = Date.now();

    // Assert
    expect(result).toHaveLength(storeCount);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
});