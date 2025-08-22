/**
 * 單元測試：FR-FA-AR-001 應收帳款建立與管理
 * 模組：FA-AR (Finance & Accounting - Accounts Receivable)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ARService } from '../../src/modules/fa/ar/services/ARService';
import { ARRepository } from '../../src/modules/fa/ar/repositories/ARRepository';
import { CreditService } from '../../src/modules/fa/ar/services/CreditService';
import { ARInvoice, Payment, PaymentTerm } from '../../src/modules/fa/ar/types';

// Mock dependencies
jest.mock('../../src/modules/fa/ar/repositories/ARRepository');
jest.mock('../../src/modules/fa/ar/services/CreditService');

describe('FR-FA-AR-001: 應收帳款建立與管理', () => {
  let arService: ARService;
  let mockRepository: jest.Mocked<ARRepository>;
  let mockCreditService: jest.Mocked<CreditService>;

  beforeEach(() => {
    mockRepository = new ARRepository() as jest.Mocked<ARRepository>;
    mockCreditService = new CreditService() as jest.Mocked<CreditService>;
    arService = new ARService(mockRepository, mockCreditService);
  });

  describe('應收帳款建立', () => {
    it('應該根據出貨單自動產生應收帳款', async () => {
      // Arrange
      const shipmentData = {
        orderNo: 'SO20250822001',
        customerId: 'CUST001',
        shipmentDate: new Date('2025-08-22'),
        items: [
          { itemId: 'ITEM001', quantity: 100, unitPrice: 1000, amount: 100000 }
        ],
        subtotal: 100000,
        tax: 5000,
        totalAmount: 105000
      };

      const paymentTerms: PaymentTerm = {
        code: 'NET30',
        days: 30,
        description: '月結30天'
      };

      const createdInvoice: ARInvoice = {
        id: 'INV001',
        invoiceNo: 'INV20250822001',
        customerId: 'CUST001',
        orderNo: 'SO20250822001',
        invoiceDate: new Date('2025-08-22'),
        dueDate: new Date('2025-09-21'),
        amount: 100000,
        tax: 5000,
        totalAmount: 105000,
        paidAmount: 0,
        status: 'open',
        paymentTerms: 'NET30'
      };

      mockRepository.getPaymentTerms.mockResolvedValue(paymentTerms);
      mockRepository.createInvoice.mockResolvedValue(createdInvoice);
      mockCreditService.checkCreditLimit.mockResolvedValue({ passed: true, availableCredit: 500000 });

      // Act
      const result = await arService.createInvoiceFromShipment(shipmentData);

      // Assert
      expect(result).toEqual(createdInvoice);
      expect(result.dueDate).toEqual(new Date('2025-09-21'));
      expect(result.status).toBe('open');
      expect(mockCreditService.checkCreditLimit).toHaveBeenCalledWith('CUST001', 105000);
    });

    it('應該根據付款條件計算到期日', async () => {
      // Arrange
      const invoiceDate = new Date('2025-08-22');
      const paymentTerms = [
        { code: 'NET30', days: 30 },
        { code: 'NET60', days: 60 },
        { code: 'COD', days: 0 }
      ];

      // Act & Assert
      for (const term of paymentTerms) {
        mockRepository.getPaymentTerms.mockResolvedValue(term);
        const dueDate = await arService.calculateDueDate(invoiceDate, term.code);
        
        const expectedDate = new Date(invoiceDate);
        expectedDate.setDate(expectedDate.getDate() + term.days);
        
        expect(dueDate).toEqual(expectedDate);
      }
    });

    it('應該檢查客戶信用額度', async () => {
      // Arrange
      const customerId = 'CUST001';
      const invoiceAmount = 500000;
      
      mockCreditService.checkCreditLimit.mockResolvedValue({
        passed: false,
        availableCredit: 100000,
        currentLimit: 300000,
        usedCredit: 200000
      });

      // Act & Assert
      await expect(
        arService.createInvoice({
          customerId,
          totalAmount: invoiceAmount
        })
      ).rejects.toThrow('Exceeds credit limit');
    });

    it('應該處理部分出貨的應收帳款', async () => {
      // Arrange
      const orderNo = 'SO20250822001';
      const partialShipments = [
        { shipmentNo: 'SH001', amount: 50000 },
        { shipmentNo: 'SH002', amount: 30000 },
        { shipmentNo: 'SH003', amount: 25000 }
      ];

      for (const shipment of partialShipments) {
        mockRepository.createInvoice.mockResolvedValueOnce({
          invoiceNo: `INV-${shipment.shipmentNo}`,
          totalAmount: shipment.amount
        } as ARInvoice);
      }

      // Act
      const invoices = await arService.createPartialInvoices(orderNo, partialShipments);

      // Assert
      expect(invoices).toHaveLength(3);
      expect(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)).toBe(105000);
    });
  });

  describe('應收帳款更新', () => {
    it('應該更新應收帳款狀態', async () => {
      // Arrange
      const invoiceId = 'INV001';
      const updates = {
        status: 'overdue' as const,
        notes: '已逾期7天'
      };

      mockRepository.updateInvoice.mockResolvedValue({
        id: invoiceId,
        ...updates
      } as ARInvoice);

      // Act
      const result = await arService.updateInvoiceStatus(invoiceId, updates.status, updates.notes);

      // Assert
      expect(result.status).toBe('overdue');
      expect(result.notes).toBe('已逾期7天');
      expect(mockRepository.updateInvoice).toHaveBeenCalledWith(invoiceId, updates);
    });

    it('應該自動更新客戶餘額', async () => {
      // Arrange
      const customerId = 'CUST001';
      const invoiceAmount = 100000;
      
      mockRepository.updateCustomerBalance.mockResolvedValue(true);

      // Act
      await arService.createInvoice({
        customerId,
        totalAmount: invoiceAmount
      });

      // Assert
      expect(mockRepository.updateCustomerBalance).toHaveBeenCalledWith(
        customerId,
        invoiceAmount
      );
    });
  });

  describe('發票號碼管理', () => {
    it('應該自動產生唯一發票號碼', async () => {
      // Arrange
      const currentDate = new Date('2025-08-22');
      const expectedPattern = /^INV20250822\d{3}$/;
      
      mockRepository.getNextInvoiceNumber.mockResolvedValue('INV20250822001');

      // Act
      const invoiceNo = await arService.generateInvoiceNumber(currentDate);

      // Assert
      expect(invoiceNo).toMatch(expectedPattern);
      expect(mockRepository.getNextInvoiceNumber).toHaveBeenCalledWith(currentDate);
    });

    it('應該防止重複開票', async () => {
      // Arrange
      const orderNo = 'SO20250822001';
      
      mockRepository.findInvoiceByOrder.mockResolvedValue({
        id: 'INV001',
        orderNo
      } as ARInvoice);

      // Act & Assert
      await expect(
        arService.createInvoice({ orderNo })
      ).rejects.toThrow('Invoice already exists for this order');
    });
  });

  describe('金額計算與驗證', () => {
    it('應該正確計算含稅金額', async () => {
      // Arrange
      const invoiceData = {
        amount: 100000,
        taxRate: 0.05
      };

      // Act
      const calculation = await arService.calculateInvoiceTotal(invoiceData);

      // Assert
      expect(calculation.subtotal).toBe(100000);
      expect(calculation.tax).toBe(5000);
      expect(calculation.total).toBe(105000);
    });

    it('應該檢測金額異常', async () => {
      // Arrange
      const anomalousInvoice = {
        amount: -1000,
        customerId: 'CUST001'
      };

      // Act & Assert
      await expect(
        arService.createInvoice(anomalousInvoice)
      ).rejects.toThrow('Invalid invoice amount');
    });

    it('應該支援多幣別轉換', async () => {
      // Arrange
      const foreignInvoice = {
        amount: 1000,
        currency: 'USD',
        exchangeRate: 31.5
      };

      // Act
      const twdAmount = await arService.convertToBaseCurrency(foreignInvoice);

      // Assert
      expect(twdAmount).toBe(31500);
    });
  });

  describe('應收帳款查詢', () => {
    it('應該查詢客戶所有未結清發票', async () => {
      // Arrange
      const customerId = 'CUST001';
      const openInvoices: ARInvoice[] = [
        {
          id: 'INV001',
          customerId,
          status: 'open',
          totalAmount: 100000,
          paidAmount: 0
        } as ARInvoice,
        {
          id: 'INV002',
          customerId,
          status: 'partial',
          totalAmount: 50000,
          paidAmount: 20000
        } as ARInvoice
      ];

      mockRepository.findOpenInvoices.mockResolvedValue(openInvoices);

      // Act
      const result = await arService.getCustomerOpenInvoices(customerId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('open');
      expect(result[1].status).toBe('partial');
    });

    it('應該計算客戶應收餘額', async () => {
      // Arrange
      const customerId = 'CUST001';
      const mockBalance = {
        totalInvoiced: 500000,
        totalPaid: 350000,
        balance: 150000,
        overdueAmount: 50000
      };

      mockRepository.calculateCustomerBalance.mockResolvedValue(mockBalance);

      // Act
      const balance = await arService.getCustomerBalance(customerId);

      // Assert
      expect(balance.balance).toBe(150000);
      expect(balance.overdueAmount).toBe(50000);
    });

    it('應該支援日期範圍查詢', async () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31')
      };

      const invoicesInRange: ARInvoice[] = [
        { id: 'INV001', invoiceDate: new Date('2025-08-15') } as ARInvoice,
        { id: 'INV002', invoiceDate: new Date('2025-08-20') } as ARInvoice
      ];

      mockRepository.findInvoicesByDateRange.mockResolvedValue(invoicesInRange);

      // Act
      const result = await arService.getInvoicesByDateRange(dateRange);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].invoiceDate).toBeInstanceOf(Date);
    });
  });

  describe('爭議處理', () => {
    it('應該標記爭議發票', async () => {
      // Arrange
      const invoiceId = 'INV001';
      const disputeReason = '金額計算錯誤';
      
      mockRepository.markAsDisputed.mockResolvedValue({
        id: invoiceId,
        status: 'disputed',
        disputeReason
      } as ARInvoice);

      // Act
      const result = await arService.markInvoiceAsDisputed(invoiceId, disputeReason);

      // Assert
      expect(result.status).toBe('disputed');
      expect(result.disputeReason).toBe(disputeReason);
      expect(mockRepository.markAsDisputed).toHaveBeenCalledWith(invoiceId, disputeReason);
    });

    it('應該暫停爭議發票的催收', async () => {
      // Arrange
      const invoiceId = 'INV001';
      
      mockRepository.pauseCollection.mockResolvedValue(true);

      // Act
      await arService.markInvoiceAsDisputed(invoiceId, '客戶爭議');

      // Assert
      expect(mockRepository.pauseCollection).toHaveBeenCalledWith(invoiceId);
    });
  });

  describe('審計日誌', () => {
    it('應該記錄所有金額修改', async () => {
      // Arrange
      const invoiceId = 'INV001';
      const amountChange = {
        from: 100000,
        to: 95000,
        reason: '給予折扣'
      };

      mockRepository.logAmountChange.mockResolvedValue(true);

      // Act
      await arService.adjustInvoiceAmount(invoiceId, amountChange);

      // Assert
      expect(mockRepository.logAmountChange).toHaveBeenCalledWith({
        invoiceId,
        ...amountChange,
        changedBy: expect.any(String),
        changedAt: expect.any(Date)
      });
    });

    it('應該追蹤發票狀態變更', async () => {
      // Arrange
      const invoiceId = 'INV001';
      const statusChange = {
        from: 'open',
        to: 'paid'
      };

      mockRepository.logStatusChange.mockResolvedValue(true);

      // Act
      await arService.updateInvoiceStatus(invoiceId, 'paid');

      // Assert
      expect(mockRepository.logStatusChange).toHaveBeenCalledWith({
        invoiceId,
        ...statusChange,
        timestamp: expect.any(Date)
      });
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