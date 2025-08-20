import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePricing, usePriceCalculation, useMarketPrices } from '../../../hooks/usePricing';
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

describe('usePricing Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch prices with filters', async () => {
    const { result } = renderHook(
      () => usePricing({
        customer_id: 'CUS_001',
        price_type: 'special',
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data?.prices)).toBe(true);
  });

  it('should handle price creation', async () => {
    const { result } = renderHook(
      () => usePricing({}),
      { wrapper: createWrapper() }
    );

    const newPrice = {
      customer_id: 'CUS_001',
      product_id: 'PROD_001',
      price: 150,
      effective_date: new Date('2025-09-01'),
    };

    await result.current.createPrice(newPrice);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle price update', async () => {
    const { result } = renderHook(
      () => usePricing({}),
      { wrapper: createWrapper() }
    );

    const updates = {
      price: 120,
      effective_date: new Date('2025-10-01'),
    };

    await result.current.updatePrice('PRC_001', updates);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle bulk price operations', async () => {
    const { result } = renderHook(
      () => usePricing({}),
      { wrapper: createWrapper() }
    );

    const bulkData = {
      prices: [
        { customer_id: 'CUS_001', product_id: 'PROD_001', price: 100 },
        { customer_id: 'CUS_002', product_id: 'PROD_002', price: 200 },
      ],
    };

    await result.current.bulkCreatePrices(bulkData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should cache price data', async () => {
    const { result, rerender } = renderHook(
      () => usePricing({ customer_id: 'CUS_001' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstData = result.current.data;

    rerender();

    expect(result.current.data).toBe(firstData);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('usePriceCalculation Hook', () => {
  it('should calculate prices with rules', async () => {
    const { result } = renderHook(
      () => usePriceCalculation(),
      { wrapper: createWrapper() }
    );

    const items = [
      { product_id: 'PROD_001', quantity: 10 },
      { product_id: 'PROD_002', quantity: 5 },
    ];

    const calculation = await result.current.calculate({
      customer_id: 'CUS_001',
      items,
    });

    expect(calculation).toBeDefined();
    expect(calculation.calculations).toHaveLength(2);
    expect(calculation.total_amount).toBeGreaterThan(0);
  });

  it('should apply volume discounts', async () => {
    const { result } = renderHook(
      () => usePriceCalculation(),
      { wrapper: createWrapper() }
    );

    const calculation = await result.current.calculate({
      customer_id: 'CUS_001',
      items: [{ product_id: 'PROD_001', quantity: 100 }],
    });

    expect(calculation.calculations[0].discount_applied).toBeGreaterThan(0);
    expect(calculation.calculations[0].applied_rules).toContain('volume_discount');
  });

  it('should handle priority-based pricing', async () => {
    const { result } = renderHook(
      () => usePriceCalculation(),
      { wrapper: createWrapper() }
    );

    const calculation = await result.current.calculate({
      customer_id: 'STO_001', // Store level
      items: [{ product_id: 'PROD_001', quantity: 1 }],
    });

    // Should use store-level price (highest priority)
    expect(calculation.calculations[0].final_price).toBe(100);
  });
});

describe('useMarketPrices Hook', () => {
  it('should fetch market prices', async () => {
    const { result } = renderHook(
      () => useMarketPrices({ date: '2025-08-20' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data?.market_prices)).toBe(true);
  });

  it('should handle reprice operation', async () => {
    const { result } = renderHook(
      () => useMarketPrices({}),
      { wrapper: createWrapper() }
    );

    const repriceData = {
      items: ['MKT_001', 'MKT_002'],
      apply_date: '2025-08-20',
    };

    await result.current.reprice(repriceData);

    await waitFor(() => {
      expect(result.current.repriceStatus).toBe('success');
    });
  });

  it('should confirm market price', async () => {
    const { result } = renderHook(
      () => useMarketPrices({}),
      { wrapper: createWrapper() }
    );

    await result.current.confirmPrice('MKT_001');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should filter by status', async () => {
    const { result } = renderHook(
      () => useMarketPrices({ status: 'pending' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const prices = result.current.data?.market_prices;
    expect(prices?.every(p => p.status === 'pending')).toBe(true);
  });
});