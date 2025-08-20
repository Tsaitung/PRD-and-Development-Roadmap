import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDrivers, useVehicles, useFleetSummary } from '../../../hooks/useFleet';
import { testDataBuilders } from '../../setup';
import * as fleetService from '../../../services/fleetService';

vi.mock('../../../services/fleetService');

describe('Fleet Hooks', () => {
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

  describe('useDrivers', () => {
    it('should fetch drivers successfully', async () => {
      const mockDrivers = [
        testDataBuilders.createTestDriver(),
        testDataBuilders.createTestDriver({ driver_id: 'DRV_002' }),
      ];

      vi.mocked(fleetService.getDrivers).mockResolvedValue({
        drivers: mockDrivers,
        total: 2,
      });

      const { result } = renderHook(() => useDrivers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.drivers).toHaveLength(2);
      expect(result.current.data?.drivers[0].driver_id).toBe('DRV_TEST_001');
    });

    it('should filter drivers by status', async () => {
      const mockDrivers = [
        testDataBuilders.createTestDriver({ status: 'active' }),
      ];

      vi.mocked(fleetService.getDrivers).mockResolvedValue({
        drivers: mockDrivers,
        total: 1,
      });

      const { result } = renderHook(
        () => useDrivers({ status: 'active' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fleetService.getDrivers).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should handle error state', async () => {
      vi.mocked(fleetService.getDrivers).mockRejectedValue(
        new Error('Failed to fetch drivers')
      );

      const { result } = renderHook(() => useDrivers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to fetch drivers');
    });

    it('should refetch drivers', async () => {
      const mockDrivers = [testDataBuilders.createTestDriver()];

      vi.mocked(fleetService.getDrivers).mockResolvedValue({
        drivers: mockDrivers,
        total: 1,
      });

      const { result } = renderHook(() => useDrivers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.refetch();

      await waitFor(() => {
        expect(fleetService.getDrivers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useVehicles', () => {
    it('should fetch vehicles successfully', async () => {
      const mockVehicles = [
        testDataBuilders.createTestVehicle(),
        testDataBuilders.createTestVehicle({ vehicle_id: 'VEH_002' }),
      ];

      vi.mocked(fleetService.getVehicles).mockResolvedValue({
        vehicles: mockVehicles,
        total: 2,
      });

      const { result } = renderHook(() => useVehicles(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.vehicles).toHaveLength(2);
      expect(result.current.data?.vehicles[0].vehicle_id).toBe('VEH_TEST_001');
    });

    it('should filter vehicles by type', async () => {
      const mockVehicles = [
        testDataBuilders.createTestVehicle({ type: 'van' }),
      ];

      vi.mocked(fleetService.getVehicles).mockResolvedValue({
        vehicles: mockVehicles,
        total: 1,
      });

      const { result } = renderHook(
        () => useVehicles({ type: 'van' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fleetService.getVehicles).toHaveBeenCalledWith({ type: 'van' });
    });

    it('should filter vehicles by availability', async () => {
      const mockVehicles = [
        testDataBuilders.createTestVehicle({ availability: 'available' }),
      ];

      vi.mocked(fleetService.getVehicles).mockResolvedValue({
        vehicles: mockVehicles,
        total: 1,
      });

      const { result } = renderHook(
        () => useVehicles({ availability: 'available' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fleetService.getVehicles).toHaveBeenCalledWith({ availability: 'available' });
    });

    it('should handle loading state', () => {
      vi.mocked(fleetService.getVehicles).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useVehicles(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useFleetSummary', () => {
    it('should fetch fleet summary successfully', async () => {
      const mockSummary = testDataBuilders.createTestFleetSummary();

      vi.mocked(fleetService.getFleetSummary).mockResolvedValue(mockSummary);

      const { result } = renderHook(
        () => useFleetSummary('2025-08-20'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.total_vehicles).toBe(25);
      expect(result.current.data?.fleet_utilization).toBe(85);
    });

    it('should refetch on date change', async () => {
      const mockSummary = testDataBuilders.createTestFleetSummary();

      vi.mocked(fleetService.getFleetSummary).mockResolvedValue(mockSummary);

      const { result, rerender } = renderHook(
        ({ date }) => useFleetSummary(date),
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
        expect(fleetService.getFleetSummary).toHaveBeenCalledWith('2025-08-21');
      });
    });

    it('should handle real-time updates', async () => {
      const mockSummary = testDataBuilders.createTestFleetSummary();

      vi.mocked(fleetService.getFleetSummary).mockResolvedValue(mockSummary);

      const { result } = renderHook(
        () => useFleetSummary('2025-08-20', { refetchInterval: 5000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(fleetService.getFleetSummary).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle error state', async () => {
      vi.mocked(fleetService.getFleetSummary).mockRejectedValue(
        new Error('Failed to fetch summary')
      );

      const { result } = renderHook(
        () => useFleetSummary('2025-08-20'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to fetch summary');
    });
  });
});