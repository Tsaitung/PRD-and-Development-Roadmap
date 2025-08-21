import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accountingService } from '../../../services/accountingService';
import { testDataBuilders } from '../../setup';

describe('Accounting Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Invoice Operations', () => {
    it('should fetch invoices list', async () => {
      const mockInvoices = [
        testDataBuilders.createTestInvoice(),
        testDataBuilders.createTestInvoice({ invoice_id: 'INV_002' }),
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invoices: mockInvoices, total: 2 }),
      });

      const result = await accountingService.getInvoices();
      
      expect(result.invoices).toHaveLength(2);
      expect(result.invoices[0].invoice_id).toBe('INV_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/invoices'),
        expect.any(Object)
      );
    });

    it('should get single invoice by ID', async () => {
      const mockInvoice = testDataBuilders.createTestInvoice();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoice,
      });

      const result = await accountingService.getInvoice('INV_TEST_001');
      
      expect(result.invoice_id).toBe('INV_TEST_001');
      expect(result.invoice_number).toBe('INV-2025-08-001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/invoices/INV_TEST_001'),
        expect.any(Object)
      );
    });

    it('should create new invoice', async () => {
      const newInvoice = {
        customer_id: 'CUST_001',
        items: [],
        payment_terms: 'net_30',
      };

      const mockCreatedInvoice = testDataBuilders.createTestInvoice({
        ...newInvoice,
        invoice_id: 'INV_NEW_001',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedInvoice,
      });

      const result = await accountingService.createInvoice(newInvoice);
      
      expect(result.customer_id).toBe('CUST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/invoices'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newInvoice),
        })
      );
    });

    it('should update invoice', async () => {
      const updates = { status: 'paid' };
      const mockUpdatedInvoice = testDataBuilders.createTestInvoice({
        ...updates,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedInvoice,
      });

      const result = await accountingService.updateInvoice('INV_TEST_001', updates);
      
      expect(result.status).toBe('paid');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/invoices/INV_TEST_001'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });

    it('should send invoice', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, sent_to: 'customer@test.com' }),
      });

      const result = await accountingService.sendInvoice('INV_TEST_001', {
        email: 'customer@test.com',
      });
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/invoices/INV_TEST_001/send'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should void invoice', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'voided', void_reason: 'Customer cancelled' }),
      });

      const result = await accountingService.voidInvoice('INV_TEST_001', {
        reason: 'Customer cancelled',
      });
      
      expect(result.status).toBe('voided');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/invoices/INV_TEST_001/void'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Payment Operations', () => {
    it('should fetch payments list', async () => {
      const mockPayments = [
        testDataBuilders.createTestPayment(),
        testDataBuilders.createTestPayment({ payment_id: 'PAY_002' }),
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ payments: mockPayments, total: 2 }),
      });

      const result = await accountingService.getPayments();
      
      expect(result.payments).toHaveLength(2);
      expect(result.payments[0].payment_id).toBe('PAY_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/payments'),
        expect.any(Object)
      );
    });

    it('should record payment', async () => {
      const paymentData = {
        invoice_id: 'INV_001',
        amount: 50000,
        payment_method: 'bank_transfer',
      };

      const mockPayment = testDataBuilders.createTestPayment({
        ...paymentData,
        payment_id: 'PAY_NEW_001',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayment,
      });

      const result = await accountingService.recordPayment(paymentData);
      
      expect(result.amount).toBe(50000);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/payments'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(paymentData),
        })
      );
    });

    it('should process refund', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          refund_id: 'REF_001',
          amount: 10000,
          status: 'processing',
        }),
      });

      const result = await accountingService.refundPayment('PAY_001', {
        amount: 10000,
        reason: 'Product return',
      });
      
      expect(result.refund_id).toBe('REF_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/payments/PAY_001/refund'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Customer Account Operations', () => {
    it('should get customer account', async () => {
      const mockAccount = testDataBuilders.createTestCustomerAccount();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount,
      });

      const result = await accountingService.getCustomerAccount('CUST_001');
      
      expect(result.customer_id).toBe('CUST_001');
      expect(result.credit_limit).toBe(500000);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/customers/CUST_001/account'),
        expect.any(Object)
      );
    });

    it('should update credit limit', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          customer_id: 'CUST_001',
          credit_limit: 600000,
          approved_by: 'MANAGER_001',
        }),
      });

      const result = await accountingService.updateCreditLimit('CUST_001', {
        credit_limit: 600000,
        approved_by: 'MANAGER_001',
      });
      
      expect(result.credit_limit).toBe(600000);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/customers/CUST_001/credit-limit'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('Statement Operations', () => {
    it('should generate statement', async () => {
      const mockStatement = testDataBuilders.createTestStatement();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatement,
      });

      const result = await accountingService.generateStatement({
        customer_id: 'CUST_001',
        period_start: '2025-08-01',
        period_end: '2025-08-31',
      });
      
      expect(result.statement_id).toBe('STMT_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/statements/generate'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should send statement', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          sent_to: 'billing@test.com',
          sent_date: new Date(),
        }),
      });

      const result = await accountingService.sendStatement('STMT_001', {
        email: 'billing@test.com',
      });
      
      expect(result.sent_to).toBe('billing@test.com');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/statements/STMT_001/send'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Collection Operations', () => {
    it('should get collections', async () => {
      const mockCollections = [
        testDataBuilders.createTestCollection(),
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collections: mockCollections }),
      });

      const result = await accountingService.getCollections();
      
      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].collection_id).toBe('COLL_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/collections'),
        expect.any(Object)
      );
    });

    it('should add collection action', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          action_id: 'ACT_NEW_001',
          action_type: 'phone_call',
        }),
      });

      const result = await accountingService.addCollectionAction('COLL_001', {
        action_type: 'phone_call',
        description: 'Called customer',
      });
      
      expect(result.action_id).toBe('ACT_NEW_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/collections/COLL_001/actions'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should create payment plan', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          plan_id: 'PLAN_001',
          installments: 3,
          status: 'active',
        }),
      });

      const result = await accountingService.createPaymentPlan('COLL_001', {
        installments: 3,
        amount_per_installment: 10000,
      });
      
      expect(result.plan_id).toBe('PLAN_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/collections/COLL_001/payment-plan'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Reconciliation Operations', () => {
    it('should get reconciliations', async () => {
      const mockReconciliations = [
        testDataBuilders.createTestReconciliation(),
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reconciliations: mockReconciliations }),
      });

      const result = await accountingService.getReconciliations();
      
      expect(result.reconciliations).toHaveLength(1);
      expect(result.reconciliations[0].reconciliation_id).toBe('REC_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reconciliations'),
        expect.any(Object)
      );
    });

    it('should match transactions', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          matched: true,
          matched_at: new Date(),
        }),
      });

      const result = await accountingService.matchTransaction('REC_001', {
        bank_transaction_id: 'BANK_001',
        payment_id: 'PAY_001',
      });
      
      expect(result.matched).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reconciliations/REC_001/match'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should complete reconciliation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: 'completed',
          completed_at: new Date(),
        }),
      });

      const result = await accountingService.completeReconciliation('REC_001', {
        user_id: 'USER_001',
      });
      
      expect(result.status).toBe('completed');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reconciliations/REC_001/complete'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('Report Operations', () => {
    it('should get aging report', async () => {
      const mockAgingReport = testDataBuilders.createTestAgingReport();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgingReport,
      });

      const result = await accountingService.getAgingReport('2025-08-20');
      
      expect(result.summary.total_outstanding).toBe(780000);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reports/aging?date=2025-08-20'),
        expect.any(Object)
      );
    });

    it('should get tax report', async () => {
      const mockTaxReport = testDataBuilders.createTestTaxReport();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTaxReport,
      });

      const result = await accountingService.getTaxReport({
        period_start: '2025-08-01',
        period_end: '2025-08-31',
      });
      
      expect(result.summary.total_tax_collected).toBe(95000);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reports/tax'),
        expect.any(Object)
      );
    });

    it('should file tax report', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          filing_status: 'filed',
          reference_number: 'TAX-REF-001',
        }),
      });

      const result = await accountingService.fileTaxReport('TAX_001', {
        user_id: 'USER_001',
      });
      
      expect(result.filing_status).toBe('filed');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reports/tax/TAX_001/file'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(accountingService.getInvoices()).rejects.toThrow('Network error');
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(accountingService.getInvoice('INVALID_ID')).rejects.toThrow('Not Found');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(accountingService.getInvoices()).rejects.toThrow('Invalid JSON');
    });
  });
});