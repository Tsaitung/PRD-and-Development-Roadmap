import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders, useOrderDetail, useOrderSummary, useOrderActions } from '../../../hooks/useOrders';
import { testDataBuilders } from '../../setup';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useOrders Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch orders with filters', async () => {
    const { result } = renderHook(
      () => useOrders({
        date_from: '2025-08-01',
        date_to: '2025-08-31',
        status: 'confirmed',
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data?.orders)).toBe(true);
  });

  it('should handle pagination', async () => {
    const { result, rerender } = renderHook(
      ({ page }) => useOrders({ page }),
      { 
        wrapper: createWrapper(),
        initialProps: { page: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstPageData = result.current.data;

    rerender({ page: 2 });

    await waitFor(() => {
      expect(result.current.data?.page).toBe(2);
    });

    expect(result.current.data).not.toBe(firstPageData);
  });

  it('should search orders by keyword', async () => {
    const { result } = renderHook(
      () => useOrders({ keyword: 'SO-20250820' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const orders = result.current.data?.orders;
    expect(orders?.every(o => o.order_number.includes('SO-20250820'))).toBe(true);
  });

  it('should filter by customer', async () => {
    const { result } = renderHook(
      () => useOrders({ customer_id: 'CUS_001' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const orders = result.current.data?.orders;
    expect(orders?.every(o => o.customer_id === 'CUS_001')).toBe(true);
  });
});

describe('useOrderDetail Hook', () => {
  it('should fetch order detail with items', async () => {
    const { result } = renderHook(
      () => useOrderDetail('ORD_TEST_001'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.order_id).toBe('ORD_TEST_001');
    expect(Array.isArray(result.current.data?.items)).toBe(true);
  });

  it('should fetch order history', async () => {
    const { result } = renderHook(
      () => useOrderDetail('ORD_TEST_001', { includeHistory: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.history).toBeDefined();
    expect(Array.isArray(result.current.history)).toBe(true);
  });

  it('should handle order not found', async () => {
    const { result } = renderHook(
      () => useOrderDetail('INVALID_ORDER'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('not found');
  });
});

describe('useOrderSummary Hook', () => {
  it('should fetch daily summary', async () => {
    const { result } = renderHook(
      () => useOrderSummary({ date: '2025-08-20', period: 'daily' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.total_orders).toBeGreaterThan(0);
  });

  it('should fetch weekly summary', async () => {
    const { result } = renderHook(
      () => useOrderSummary({ date: '2025-08-20', period: 'weekly' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.top_customers).toBeDefined();
    expect(result.current.data?.top_products).toBeDefined();
  });

  it('should refresh on date change', async () => {
    const { result, rerender } = renderHook(
      ({ date }) => useOrderSummary({ date, period: 'daily' }),
      { 
        wrapper: createWrapper(),
        initialProps: { date: '2025-08-20' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstData = result.current.data;

    rerender({ date: '2025-08-21' });

    await waitFor(() => {
      expect(result.current.data?.summary_date).not.toBe(firstData?.summary_date);
    });
  });
});

describe('useOrderActions Hook', () => {
  it('should create new order', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    const orderData = {
      customer_id: 'CUS_001',
      delivery_date: '2025-08-21',
      items: [
        { product_id: 'PROD_001', quantity: 10, unit_price: 100 },
      ],
    };

    await result.current.createOrder(orderData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should update order status', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    await result.current.updateOrderStatus('ORD_001', 'confirmed');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should duplicate order', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    const duplicatedOrder = await result.current.duplicateOrder('ORD_001', {
      delivery_date: '2025-08-22',
    });

    expect(duplicatedOrder).toBeDefined();
    expect(duplicatedOrder.order_id).not.toBe('ORD_001');
  });

  it('should batch update orders', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    const orderIds = ['ORD_001', 'ORD_002', 'ORD_003'];
    const batchResult = await result.current.batchUpdateStatus(orderIds, 'confirmed');

    expect(batchResult.updated).toBe(3);
    expect(batchResult.failed).toBe(0);
  });

  it('should handle order cancellation', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    await result.current.cancelOrder('ORD_001', '客戶取消');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should export orders', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    const exportResult = await result.current.exportOrders({
      order_ids: ['ORD_001', 'ORD_002'],
      format: 'excel',
    });

    expect(exportResult.file_url).toBeDefined();
    expect(exportResult.format).toBe('excel');
  });

  it('should check stock availability', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    const stockCheck = await result.current.checkStock([
      { product_id: 'PROD_001', quantity: 10 },
      { product_id: 'PROD_002', quantity: 5 },
    ]);

    expect(stockCheck.all_available).toBeDefined();
    expect(Array.isArray(stockCheck.stock_status)).toBe(true);
  });

  it('should handle return order', async () => {
    const { result } = renderHook(
      () => useOrderActions(),
      { wrapper: createWrapper() }
    );

    const returnData = {
      items: [{ product_id: 'PROD_001', quantity: 2, reason: '損壞' }],
      return_reason: 'defective',
      return_type: 'refund',
    };

    const returnOrder = await result.current.createReturn('ORD_001', returnData);

    expect(returnOrder.return_id).toBeDefined();
    expect(returnOrder.original_order_id).toBe('ORD_001');
  });
});