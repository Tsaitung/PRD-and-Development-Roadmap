import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvoices, usePayments, useAgingReport, useReconciliation } from '../../../hooks/useAccounting';
import { testDataBuilders } from '../../setup';
import * as accountingService from '../../../services/accountingService';

vi.mock('../../../services/accountingService');

describe('Accounting Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useInvoices', () => {
    it('should fetch invoices successfully', async () => {
      const mockInvoices = [
        testDataBuilders.createTestInvoice(),
        testDataBuilders.createTestInvoice({ invoice_id: 'INV_002' }),
      ];

      vi.mocked(accountingService.getInvoices).mockResolvedValue({
        invoices: mockInvoices,
        total: 2,
      });

      const { result } = renderHook(() => useInvoices(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.invoices).toHaveLength(2);
      expect(result.current.data?.invoices[0].invoice_id).toBe('INV_TEST_001');
    });

    it('should filter invoices by status', async () => {
      const mockInvoices = [
        testDataBuilders.createTestInvoice({ status: 'pending' }),
      ];

      vi.mocked(accountingService.getInvoices).mockResolvedValue({
        invoices: mockInvoices,
        total: 1,
      });

      const { result } = renderHook(
        () => useInvoices({ status: 'pending' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(accountingService.getInvoices).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should filter invoices by customer', async () => {
      const mockInvoices = [
        testDataBuilders.createTestInvoice({ customer_id: 'CUST_001' }),
      ];

      vi.mocked(accountingService.getInvoices).mockResolvedValue({
        invoices: mockInvoices,
        total: 1,
      });

      const { result } = renderHook(
        () => useInvoices({ customer_id: 'CUST_001' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(accountingService.getInvoices).toHaveBeenCalledWith({ customer_id: 'CUST_001' });
    });

    it('should handle error state', async () => {
      vi.mocked(accountingService.getInvoices).mockRejectedValue(
        new Error('Failed to fetch invoices')
      );

      const { result } = renderHook(() => useInvoices(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to fetch invoices');
    });

    it('should refetch invoices', async () => {
      const mockInvoices = [testDataBuilders.createTestInvoice()];

      vi.mocked(accountingService.getInvoices).mockResolvedValue({
        invoices: mockInvoices,
        total: 1,
      });

      const { result } = renderHook(() => useInvoices(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.refetch();

      await waitFor(() => {
        expect(accountingService.getInvoices).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('usePayments', () => {
    it('should fetch payments successfully', async () => {
      const mockPayments = [
        testDataBuilders.createTestPayment(),
        testDataBuilders.createTestPayment({ payment_id: 'PAY_002' }),
      ];

      vi.mocked(accountingService.getPayments).mockResolvedValue({
        payments: mockPayments,
        total: 2,
      });

      const { result } = renderHook(() => usePayments(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.payments).toHaveLength(2);
      expect(result.current.data?.payments[0].payment_id).toBe('PAY_TEST_001');
    });

    it('should filter payments by date range', async () => {
      const mockPayments = [
        testDataBuilders.createTestPayment(),
      ];

      vi.mocked(accountingService.getPayments).mockResolvedValue({
        payments: mockPayments,
        total: 1,
      });

      const { result } = renderHook(
        () => usePayments({ 
          date_from: '2025-08-01',
          date_to: '2025-08-31',
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(accountingService.getPayments).toHaveBeenCalledWith({
        date_from: '2025-08-01',
        date_to: '2025-08-31',
      });
    });

    it('should handle loading state', () => {
      vi.mocked(accountingService.getPayments).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => usePayments(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useAgingReport', () => {
    it('should fetch aging report successfully', async () => {
      const mockAgingReport = testDataBuilders.createTestAgingReport();

      vi.mocked(accountingService.getAgingReport).mockResolvedValue(mockAgingReport);

      const { result } = renderHook(
        () => useAgingReport('2025-08-20'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.summary.total_outstanding).toBe(780000);
    });

    it('should refetch on date change', async () => {
      const mockAgingReport = testDataBuilders.createTestAgingReport();

      vi.mocked(accountingService.getAgingReport).mockResolvedValue(mockAgingReport);

      const { result, rerender } = renderHook(
        ({ date }) => useAgingReport(date),
        {
          wrapper,
          initialProps: { date: '2025-08-20' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      rerender({ date: '2025-08-21' });

      await waitFor(() => {
        expect(accountingService.getAgingReport).toHaveBeenCalledWith('2025-08-21');
      });
    });

    it('should handle error state', async () => {
      vi.mocked(accountingService.getAgingReport).mockRejectedValue(
        new Error('Failed to fetch aging report')
      );

      const { result } = renderHook(
        () => useAgingReport('2025-08-20'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to fetch aging report');
    });
  });

  describe('useReconciliation', () => {
    it('should fetch reconciliation successfully', async () => {
      const mockReconciliation = testDataBuilders.createTestReconciliation();

      vi.mocked(accountingService.getReconciliation).mockResolvedValue(mockReconciliation);

      const { result } = renderHook(
        () => useReconciliation('REC_TEST_001'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.reconciliation_id).toBe('REC_TEST_001');
      expect(result.current.data?.matched_transactions).toBe(45);
    });

    it('should handle real-time updates', async () => {
      const mockReconciliation = testDataBuilders.createTestReconciliation();

      vi.mocked(accountingService.getReconciliation).mockResolvedValue(mockReconciliation);

      const { result } = renderHook(
        () => useReconciliation('REC_TEST_001', { refetchInterval: 5000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(accountingService.getReconciliation).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle null reconciliation ID', () => {
      const { result } = renderHook(
        () => useReconciliation(null),
        { wrapper }
      );

      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });
});