import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory } from '../../../hooks/useInventory';
import { testDataBuilders } from '../../setup';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useInventory Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useInventoryList', () => {
    it('should fetch inventory list', async () => {
      const { result } = renderHook(
        () => useInventory.useInventoryList({ warehouse: 'WH_001' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.items).toBeDefined();
      expect(Array.isArray(result.current.data.items)).toBe(true);
    });

    it('should handle loading state', () => {
      const { result } = renderHook(
        () => useInventory.useInventoryList(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () => useInventory.useInventoryList(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should refetch on filter change', async () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useInventory.useInventoryList(filters),
        {
          wrapper: createWrapper(),
          initialProps: { filters: { warehouse: 'WH_001' } },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const firstData = result.current.data;

      rerender({ filters: { warehouse: 'WH_002' } });

      await waitFor(() => {
        expect(result.current.data).not.toBe(firstData);
      });
    });
  });

  describe('useInventoryItem', () => {
    it('should fetch single inventory item', async () => {
      const { result } = renderHook(
        () => useInventory.useInventoryItem('INV_001'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.item_id).toBe('INV_001');
    });

    it('should skip fetch when id is not provided', () => {
      const { result } = renderHook(
        () => useInventory.useInventoryItem(null),
        { wrapper: createWrapper() }
      );

      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useUpdateInventory', () => {
    it('should update inventory item', async () => {
      const { result } = renderHook(
        () => useInventory.useUpdateInventory(),
        { wrapper: createWrapper() }
      );

      const updates = {
        item_id: 'INV_001',
        data: {
          safety_stock: 150,
          reorder_point: 200,
        },
      };

      result.current.mutate(updates);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.safety_stock).toBe(150);
    });

    it('should handle update error', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(
        () => useInventory.useUpdateInventory(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        item_id: 'INV_001',
        data: { safety_stock: -10 },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should invalidate queries after update', async () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useInventory.useUpdateInventory(),
        { wrapper }
      );

      result.current.mutate({
        item_id: 'INV_001',
        data: { location: 'B-01-01' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith(['inventory']);
    });
  });

  describe('useStockAdjustment', () => {
    it('should create stock adjustment', async () => {
      const { result } = renderHook(
        () => useInventory.useStockAdjustment(),
        { wrapper: createWrapper() }
      );

      const adjustment = {
        item_id: 'INV_001',
        adjustment_type: 'damage',
        quantity: -10,
        reason: '破損',
      };

      result.current.mutate(adjustment);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.adjustment_id).toBeDefined();
    });

    it('should show optimistic update', async () => {
      const { result } = renderHook(
        () => useInventory.useStockAdjustment({ optimistic: true }),
        { wrapper: createWrapper() }
      );

      const adjustment = {
        item_id: 'INV_001',
        adjustment_type: 'count',
        quantity: 5,
        reason: '盤點',
      };

      result.current.mutate(adjustment);

      // Check optimistic update
      expect(result.current.variables).toEqual(adjustment);
    });
  });

  describe('useStockTransfer', () => {
    it('should create transfer order', async () => {
      const { result } = renderHook(
        () => useInventory.useStockTransfer(),
        { wrapper: createWrapper() }
      );

      const transfer = {
        from_warehouse: 'WH_001',
        to_warehouse: 'WH_002',
        items: [
          { item_id: 'INV_001', quantity: 50 },
        ],
      };

      result.current.mutate(transfer);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.transfer_id).toBeDefined();
    });
  });

  describe('useStockMovements', () => {
    it('should fetch stock movements', async () => {
      const { result } = renderHook(
        () => useInventory.useStockMovements({ item_id: 'INV_001' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.movements).toBeDefined();
      expect(Array.isArray(result.current.data.movements)).toBe(true);
    });

    it('should support pagination', async () => {
      const { result } = renderHook(
        () => useInventory.useStockMovements({ page: 2, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data.page).toBe(2);
      expect(result.current.data.limit).toBe(10);
    });
  });

  describe('useStockAlerts', () => {
    it('should fetch stock alerts', async () => {
      const { result } = renderHook(
        () => useInventory.useStockAlerts(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.alerts).toBeDefined();
    });

    it('should filter by severity', async () => {
      const { result } = renderHook(
        () => useInventory.useStockAlerts({ severity: 'high' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const alerts = result.current.data.alerts;
      expect(alerts.every(a => a.severity === 'high')).toBe(true);
    });

    it('should auto-refresh alerts', async () => {
      const { result } = renderHook(
        () => useInventory.useStockAlerts({ autoRefresh: true, interval: 1000 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const firstData = result.current.data;

      await waitFor(
        () => {
          expect(result.current.dataUpdatedAt).toBeGreaterThan(firstData.updatedAt);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('useCycleCount', () => {
    it('should perform cycle count', async () => {
      const { result } = renderHook(
        () => useInventory.useCycleCount(),
        { wrapper: createWrapper() }
      );

      const countData = {
        warehouse_id: 'WH_001',
        location: 'A-01',
        items: [
          { item_id: 'INV_001', counted_quantity: 495 },
        ],
      };

      result.current.mutate(countData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.count_id).toBeDefined();
    });
  });

  describe('useInventoryReport', () => {
    it('should fetch inventory report', async () => {
      const { result } = renderHook(
        () => useInventory.useInventoryReport({
          type: 'daily',
          date: '2025-08-20',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.report_type).toBe('daily_stock');
    });

    it('should cache report data', async () => {
      const queryClient = new QueryClient();
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result: result1 } = renderHook(
        () => useInventory.useInventoryReport({ type: 'daily' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      const { result: result2 } = renderHook(
        () => useInventory.useInventoryReport({ type: 'daily' }),
        { wrapper }
      );

      // Should use cached data
      expect(result2.current.isSuccess).toBe(true);
      expect(result2.current.data).toBe(result1.current.data);
    });
  });

  describe('useInventorySearch', () => {
    it('should search inventory items', async () => {
      const { result } = renderHook(
        () => useInventory.useInventorySearch('商品A'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.items).toBeDefined();
      expect(result.current.data.items[0].product_name).toContain('商品A');
    });

    it('should debounce search', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      const { result, rerender } = renderHook(
        ({ query }) => useInventory.useInventorySearch(query, { debounce: 500 }),
        {
          wrapper: createWrapper(),
          initialProps: { query: '商' },
        }
      );

      // Quick changes
      rerender({ query: '商品' });
      rerender({ query: '商品A' });

      // Should only make one request after debounce
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});