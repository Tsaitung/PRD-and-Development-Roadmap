import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRoutes } from '../../../hooks/useRoutes';
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

describe('useRoutes Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useRouteList', () => {
    it('should fetch route list', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteList({ date: '2025-08-20' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.routes).toBeDefined();
      expect(Array.isArray(result.current.data.routes)).toBe(true);
    });

    it('should handle loading state', () => {
      const { result } = renderHook(
        () => useRoutes.useRouteList(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should refetch on date change', async () => {
      const { result, rerender } = renderHook(
        ({ date }) => useRoutes.useRouteList({ date }),
        {
          wrapper: createWrapper(),
          initialProps: { date: '2025-08-20' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const firstData = result.current.data;

      rerender({ date: '2025-08-21' });

      await waitFor(() => {
        expect(result.current.data).not.toBe(firstData);
      });
    });
  });

  describe('useRouteDetails', () => {
    it('should fetch route details with stops', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteDetails('ROUTE_001'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.route).toBeDefined();
      expect(result.current.data.stops).toBeDefined();
      expect(result.current.data.tracking).toBeDefined();
    });
  });

  describe('useOptimizeRoutes', () => {
    it('should optimize routes', async () => {
      const { result } = renderHook(
        () => useRoutes.useOptimizeRoutes(),
        { wrapper: createWrapper() }
      );

      const request = {
        optimization_date: '2025-08-20',
        orders: ['ORD_001', 'ORD_002'],
        available_drivers: ['DRV_001'],
        available_vehicles: ['VEH_001'],
      };

      result.current.mutate(request);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.routes_created).toBeGreaterThan(0);
    });

    it('should handle optimization error', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Optimization failed'));

      const { result } = renderHook(
        () => useRoutes.useOptimizeRoutes(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ orders: [] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useRouteTracking', () => {
    it('should track route in real-time', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteTracking('ROUTE_001', { interval: 5000 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.latitude).toBeDefined();
      expect(result.current.data.longitude).toBeDefined();
    });

    it('should auto-refresh tracking data', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteTracking('ROUTE_001', { interval: 1000 }),
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

  describe('useCompleteStop', () => {
    it('should complete delivery stop', async () => {
      const { result } = renderHook(
        () => useRoutes.useCompleteStop(),
        { wrapper: createWrapper() }
      );

      const completionData = {
        route_id: 'ROUTE_001',
        stop_id: 'STOP_001',
        signature: 'base64_signature',
        photo: 'base64_photo',
      };

      result.current.mutate(completionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.status).toBe('completed');
    });

    it('should update route progress after completion', async () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useRoutes.useCompleteStop(),
        { wrapper }
      );

      result.current.mutate({
        route_id: 'ROUTE_001',
        stop_id: 'STOP_001',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith(['route', 'ROUTE_001']);
    });
  });

  describe('useReassignRoute', () => {
    it('should reassign route to different driver', async () => {
      const { result } = renderHook(
        () => useRoutes.useReassignRoute(),
        { wrapper: createWrapper() }
      );

      const reassignData = {
        route_id: 'ROUTE_001',
        driver_id: 'DRV_002',
        vehicle_id: 'VEH_002',
      };

      result.current.mutate(reassignData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.driver_id).toBe('DRV_002');
    });
  });

  describe('useRouteAnalytics', () => {
    it('should fetch route analytics', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteAnalytics({ date: '2025-08-20', period: 'daily' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data.total_routes).toBeDefined();
      expect(result.current.data.on_time_delivery_rate).toBeDefined();
    });

    it('should support different periods', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteAnalytics({ period: 'weekly' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data.period).toBe('weekly');
    });
  });

  describe('useDriverAvailability', () => {
    it('should fetch available drivers', async () => {
      const { result } = renderHook(
        () => useRoutes.useDriverAvailability({ date: '2025-08-20' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data.available)).toBe(true);
      expect(Array.isArray(result.current.data.on_route)).toBe(true);
    });
  });

  describe('useVehicleAvailability', () => {
    it('should fetch available vehicles', async () => {
      const { result } = renderHook(
        () => useRoutes.useVehicleAvailability({ date: '2025-08-20' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data.available)).toBe(true);
      expect(Array.isArray(result.current.data.in_use)).toBe(true);
    });
  });

  describe('useRouteEvents', () => {
    it('should subscribe to route events', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteEvents('ROUTE_001'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data.events)).toBe(true);
    });

    it('should receive real-time updates', async () => {
      const { result } = renderHook(
        () => useRoutes.useRouteEvents('ROUTE_001', { realtime: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Simulate event
      const newEvent = testDataBuilders.createTestDeliveryEvent();
      
      await waitFor(() => {
        expect(result.current.data.events).toContainEqual(
          expect.objectContaining({ event_id: newEvent.event_id })
        );
      });
    });
  });
});