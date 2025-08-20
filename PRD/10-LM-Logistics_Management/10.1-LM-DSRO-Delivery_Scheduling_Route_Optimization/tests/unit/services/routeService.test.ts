import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as routeService from '../../../services/routeService';
import { testDataBuilders } from '../../setup';

vi.mock('#libs/services2/request', () => ({
  request: vi.fn(),
  postWithResponse: vi.fn(),
  putWithResponse: vi.fn(),
  deleteRequest: vi.fn(),
  patchWithResponse: vi.fn(),
}));

describe('Route Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoutes', () => {
    it('should fetch routes with filters', async () => {
      const filters = {
        date: '2025-08-20',
        status: 'planned',
        driver: 'DRV_001',
        page: 1,
        limit: 20,
      };

      const result = await routeService.getRoutes(filters);

      expect(result).toBeDefined();
      expect(result.routes).toBeDefined();
      expect(Array.isArray(result.routes)).toBe(true);
      expect(result.total).toBeDefined();
    });

    it('should handle date range filtering', async () => {
      const result = await routeService.getRoutes({
        date_from: '2025-08-01',
        date_to: '2025-08-31',
      });

      expect(result.routes).toBeDefined();
      expect(result.routes.every(r => {
        const date = new Date(r.route_date);
        return date >= new Date('2025-08-01') && date <= new Date('2025-08-31');
      })).toBe(true);
    });
  });

  describe('createRoute', () => {
    it('should create new route', async () => {
      const routeData = {
        route_date: '2025-08-20',
        driver_id: 'DRV_001',
        vehicle_id: 'VEH_001',
        stops: [
          { order_id: 'ORD_001', sequence: 1 },
          { order_id: 'ORD_002', sequence: 2 },
        ],
      };

      const result = await routeService.createRoute(routeData);

      expect(result.route_id).toBeDefined();
      expect(result.route_number).toBeDefined();
      expect(result.status).toBe('planned');
    });

    it('should validate route constraints', async () => {
      const invalidRoute = {
        route_date: '2025-08-20',
        driver_id: 'DRV_001',
        vehicle_id: 'VEH_001',
        stops: [], // No stops
      };

      await expect(routeService.createRoute(invalidRoute))
        .rejects.toThrow('Route must have at least one stop');
    });
  });

  describe('optimizeRoutes', () => {
    it('should optimize route planning', async () => {
      const request = {
        optimization_date: '2025-08-20',
        warehouse_id: 'WH_001',
        orders: ['ORD_001', 'ORD_002', 'ORD_003'],
        available_drivers: ['DRV_001', 'DRV_002'],
        available_vehicles: ['VEH_001', 'VEH_002'],
        constraints: {
          max_route_distance: 100,
          max_route_duration: 480,
        },
      };

      const result = await routeService.optimizeRoutes(request);

      expect(result.result_id).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.routes_created).toBeGreaterThan(0);
      expect(result.optimization_time).toBeDefined();
    });

    it('should apply optimization goals', async () => {
      const request = {
        optimization_date: '2025-08-20',
        orders: ['ORD_001', 'ORD_002'],
        optimization_goals: ['minimize_distance', 'maximize_on_time'],
      };

      const result = await routeService.optimizeRoutes(request);

      expect(result.total_distance).toBeDefined();
      expect(result.on_time_probability).toBeGreaterThan(90);
    });

    it('should handle optimization failure', async () => {
      const request = {
        optimization_date: '2025-08-20',
        orders: [],
        available_drivers: [],
      };

      await expect(routeService.optimizeRoutes(request))
        .rejects.toThrow('No feasible solution found');
    });
  });

  describe('updateRouteStatus', () => {
    it('should update route status', async () => {
      const result = await routeService.updateRouteStatus('ROUTE_001', 'in_progress');

      expect(result.status).toBe('in_progress');
      expect(result.updated_at).toBeDefined();
    });

    it('should validate status transitions', async () => {
      await expect(
        routeService.updateRouteStatus('ROUTE_001', 'invalid_status')
      ).rejects.toThrow('Invalid status');
    });

    it('should prevent invalid transitions', async () => {
      await expect(
        routeService.updateRouteStatus('ROUTE_COMPLETED', 'planned')
      ).rejects.toThrow('Cannot transition from completed to planned');
    });
  });

  describe('trackRoute', () => {
    it('should update route tracking', async () => {
      const trackingData = {
        latitude: 25.0330,
        longitude: 121.5654,
        speed: 35,
        heading: 90,
      };

      const result = await routeService.trackRoute('ROUTE_001', trackingData);

      expect(result.tracking_id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.latitude).toBe(25.0330);
    });

    it('should calculate ETA updates', async () => {
      const trackingData = {
        latitude: 25.0330,
        longitude: 121.5654,
        current_stop: 'STOP_002',
      };

      const result = await routeService.trackRoute('ROUTE_001', trackingData);

      expect(result.eta_next_stop).toBeDefined();
      expect(result.distance_to_next).toBeDefined();
    });
  });

  describe('completeStop', () => {
    it('should mark stop as completed', async () => {
      const completionData = {
        actual_arrival: new Date('2025-08-20T09:28:00'),
        actual_duration: 12,
        signature: 'base64_signature',
        photo: 'base64_photo',
      };

      const result = await routeService.completeStop('ROUTE_001', 'STOP_001', completionData);

      expect(result.status).toBe('completed');
      expect(result.actual_arrival).toBeDefined();
      expect(result.actual_duration).toBe(12);
    });

    it('should update route progress', async () => {
      const result = await routeService.completeStop('ROUTE_001', 'STOP_001', {});

      expect(result.route_progress).toBeDefined();
      expect(result.route_progress.completed_stops).toBe(1);
    });

    it('should require signature when configured', async () => {
      await expect(
        routeService.completeStop('ROUTE_001', 'STOP_SIGNATURE_REQUIRED', {})
      ).rejects.toThrow('Signature is required');
    });
  });

  describe('reassignRoute', () => {
    it('should reassign route to different driver', async () => {
      const result = await routeService.reassignRoute('ROUTE_001', {
        driver_id: 'DRV_002',
        vehicle_id: 'VEH_002',
        reason: 'Driver unavailable',
      });

      expect(result.driver_id).toBe('DRV_002');
      expect(result.vehicle_id).toBe('VEH_002');
      expect(result.status).toBe('reassigned');
    });

    it('should validate driver availability', async () => {
      await expect(
        routeService.reassignRoute('ROUTE_001', {
          driver_id: 'DRV_ON_ROUTE',
        })
      ).rejects.toThrow('Driver is not available');
    });
  });

  describe('getRouteAnalytics', () => {
    it('should fetch route analytics', async () => {
      const result = await routeService.getRouteAnalytics({
        date: '2025-08-20',
        period: 'daily',
      });

      expect(result.total_routes).toBeDefined();
      expect(result.on_time_delivery_rate).toBeDefined();
      expect(result.average_stops_per_route).toBeDefined();
      expect(result.fuel_consumption).toBeDefined();
    });

    it('should calculate cost metrics', async () => {
      const result = await routeService.getRouteAnalytics({
        date: '2025-08-20',
        include_costs: true,
      });

      expect(result.fuel_cost).toBeDefined();
      expect(result.labor_cost).toBeDefined();
      expect(result.total_cost).toBeDefined();
      expect(result.cost_per_delivery).toBeDefined();
    });

    it('should compare with historical data', async () => {
      const result = await routeService.getRouteAnalytics({
        date: '2025-08-20',
        compare_period: 'previous_week',
      });

      expect(result.comparison).toBeDefined();
      expect(result.comparison.delivery_rate_change).toBeDefined();
      expect(result.comparison.cost_change).toBeDefined();
    });
  });

  describe('validateRoute', () => {
    it('should validate complete route', () => {
      const route = testDataBuilders.createTestDeliveryRoute();
      const errors = routeService.validateRoute(route);

      expect(errors).toHaveLength(0);
    });

    it('should identify missing driver', () => {
      const route = { ...testDataBuilders.createTestDeliveryRoute(), driver_id: null };
      const errors = routeService.validateRoute(route);

      expect(errors).toContain('Driver is required');
    });

    it('should check vehicle capacity', () => {
      const route = testDataBuilders.createTestDeliveryRoute({
        total_weight: 2000,
        vehicle_capacity: 1500,
      });
      const errors = routeService.validateRoute(route);

      expect(errors).toContain('Exceeds vehicle capacity');
    });

    it('should validate time windows', () => {
      const route = testDataBuilders.createTestDeliveryRoute({
        stops: [
          { time_window: '09:00-10:00', estimated_arrival: '11:00' },
        ],
      });
      const errors = routeService.validateRoute(route);

      expect(errors).toContain('Time window violation');
    });
  });

  describe('exportRoutes', () => {
    it('should export routes to Excel', async () => {
      const exportOptions = {
        route_ids: ['ROUTE_001', 'ROUTE_002'],
        format: 'excel',
        include_stops: true,
        include_tracking: true,
      };

      const result = await routeService.exportRoutes(exportOptions);

      expect(result.file_url).toBeDefined();
      expect(result.format).toBe('excel');
      expect(result.record_count).toBe(2);
    });

    it('should export filtered routes', async () => {
      const exportOptions = {
        filters: {
          date: '2025-08-20',
          status: 'completed',
        },
        format: 'pdf',
      };

      const result = await routeService.exportRoutes(exportOptions);

      expect(result.file_url).toBeDefined();
      expect(result.format).toBe('pdf');
    });
  });
});