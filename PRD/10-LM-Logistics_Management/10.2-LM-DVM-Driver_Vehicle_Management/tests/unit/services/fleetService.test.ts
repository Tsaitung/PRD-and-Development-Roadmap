import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fleetService } from '../../../services/fleetService';
import { testDataBuilders } from '../../setup';

describe('Fleet Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Driver Operations', () => {
    it('should fetch drivers list', async () => {
      const mockDrivers = [
        testDataBuilders.createTestDriver(),
        testDataBuilders.createTestDriver({ driver_id: 'DRV_002' }),
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drivers: mockDrivers, total: 2 }),
      });

      const result = await fleetService.getDrivers();
      
      expect(result.drivers).toHaveLength(2);
      expect(result.drivers[0].driver_id).toBe('DRV_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers'),
        expect.any(Object)
      );
    });

    it('should get single driver by ID', async () => {
      const mockDriver = testDataBuilders.createTestDriver();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDriver,
      });

      const result = await fleetService.getDriver('DRV_TEST_001');
      
      expect(result.driver_id).toBe('DRV_TEST_001');
      expect(result.name).toBe('測試司機');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers/DRV_TEST_001'),
        expect.any(Object)
      );
    });

    it('should create new driver', async () => {
      const newDriver = {
        name: '新司機',
        phone: '0911-222-333',
        license_number: 'DL-987654321',
      };

      const mockCreatedDriver = testDataBuilders.createTestDriver({
        ...newDriver,
        driver_id: 'DRV_NEW_001',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedDriver,
      });

      const result = await fleetService.createDriver(newDriver);
      
      expect(result.name).toBe('新司機');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newDriver),
        })
      );
    });

    it('should update driver', async () => {
      const updates = { status: 'on_leave' };
      const mockUpdatedDriver = testDataBuilders.createTestDriver({
        ...updates,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedDriver,
      });

      const result = await fleetService.updateDriver('DRV_TEST_001', updates);
      
      expect(result.status).toBe('on_leave');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers/DRV_TEST_001'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });

    it('should delete driver', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await fleetService.deleteDriver('DRV_TEST_001');
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers/DRV_TEST_001'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should get driver performance', async () => {
      const mockPerformance = {
        driver_id: 'DRV_TEST_001',
        metrics: {
          on_time_rate: 95.5,
          customer_rating: 4.8,
          safety_score: 98,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerformance,
      });

      const result = await fleetService.getDriverPerformance('DRV_TEST_001', 'monthly');
      
      expect(result.metrics.on_time_rate).toBe(95.5);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers/DRV_TEST_001/performance?period=monthly'),
        expect.any(Object)
      );
    });
  });

  describe('Vehicle Operations', () => {
    it('should fetch vehicles list', async () => {
      const mockVehicles = [
        testDataBuilders.createTestVehicle(),
        testDataBuilders.createTestVehicle({ vehicle_id: 'VEH_002' }),
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vehicles: mockVehicles, total: 2 }),
      });

      const result = await fleetService.getVehicles();
      
      expect(result.vehicles).toHaveLength(2);
      expect(result.vehicles[0].vehicle_id).toBe('VEH_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles'),
        expect.any(Object)
      );
    });

    it('should get single vehicle by ID', async () => {
      const mockVehicle = testDataBuilders.createTestVehicle();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVehicle,
      });

      const result = await fleetService.getVehicle('VEH_TEST_001');
      
      expect(result.vehicle_id).toBe('VEH_TEST_001');
      expect(result.plate_number).toBe('TPE-1234');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles/VEH_TEST_001'),
        expect.any(Object)
      );
    });

    it('should create new vehicle', async () => {
      const newVehicle = {
        plate_number: 'TPE-9999',
        type: 'van',
        brand: 'Toyota',
        model: 'Hiace',
      };

      const mockCreatedVehicle = testDataBuilders.createTestVehicle({
        ...newVehicle,
        vehicle_id: 'VEH_NEW_001',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedVehicle,
      });

      const result = await fleetService.createVehicle(newVehicle);
      
      expect(result.plate_number).toBe('TPE-9999');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newVehicle),
        })
      );
    });

    it('should update vehicle', async () => {
      const updates = { status: 'maintenance' };
      const mockUpdatedVehicle = testDataBuilders.createTestVehicle({
        ...updates,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedVehicle,
      });

      const result = await fleetService.updateVehicle('VEH_TEST_001', updates);
      
      expect(result.status).toBe('maintenance');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles/VEH_TEST_001'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });

    it('should get vehicle maintenance history', async () => {
      const mockMaintenance = {
        vehicle_id: 'VEH_TEST_001',
        last_service: new Date('2025-07-15'),
        next_service: new Date('2025-10-15'),
        history: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMaintenance,
      });

      const result = await fleetService.getVehicleMaintenance('VEH_TEST_001');
      
      expect(result.vehicle_id).toBe('VEH_TEST_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles/VEH_TEST_001/maintenance'),
        expect.any(Object)
      );
    });
  });

  describe('Schedule Operations', () => {
    it('should get driver schedule', async () => {
      const mockSchedule = testDataBuilders.createTestDriverSchedule();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchedule,
      });

      const result = await fleetService.getDriverSchedule('DRV_TEST_001', '2025-08-20');
      
      expect(result.driver_id).toBe('DRV_TEST_001');
      expect(result.shift).toBe('morning');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers/DRV_TEST_001/schedule?date=2025-08-20'),
        expect.any(Object)
      );
    });

    it('should create driver schedule', async () => {
      const newSchedule = {
        date: '2025-08-25',
        shift: 'morning',
        vehicle_id: 'VEH_001',
      };

      const mockCreatedSchedule = testDataBuilders.createTestDriverSchedule({
        ...newSchedule,
        driver_id: 'DRV_TEST_001',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedSchedule,
      });

      const result = await fleetService.createDriverSchedule('DRV_TEST_001', newSchedule);
      
      expect(result.shift).toBe('morning');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/drivers/DRV_TEST_001/schedule'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newSchedule),
        })
      );
    });
  });

  describe('Assignment Operations', () => {
    it('should assign vehicle to driver', async () => {
      const assignment = {
        driver_id: 'DRV_001',
        mileage_start: 45000,
        fuel_start: 50,
      };

      const mockAssignment = testDataBuilders.createTestVehicleAssignment({
        ...assignment,
        vehicle_id: 'VEH_001',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssignment,
      });

      const result = await fleetService.assignVehicle('VEH_001', assignment);
      
      expect(result.driver_id).toBe('DRV_001');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles/VEH_001/assign'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(assignment),
        })
      );
    });

    it('should return vehicle', async () => {
      const returnData = {
        assignment_id: 'ASSIGN_001',
        mileage: 45150,
        fuel: 25,
        condition: 'good',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, ...returnData }),
      });

      const result = await fleetService.returnVehicle('VEH_001', returnData);
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vehicles/VEH_001/return'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(returnData),
        })
      );
    });
  });

  describe('Fleet Summary', () => {
    it('should get fleet summary', async () => {
      const mockSummary = testDataBuilders.createTestFleetSummary();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await fleetService.getFleetSummary('2025-08-20');
      
      expect(result.total_vehicles).toBe(25);
      expect(result.active_vehicles).toBe(20);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/fleet/summary?date=2025-08-20'),
        expect.any(Object)
      );
    });

    it('should export fleet data', async () => {
      const exportParams = {
        type: 'drivers',
        format: 'excel',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ file_url: '/exports/fleet_20250820.xlsx' }),
      });

      const result = await fleetService.exportFleetData(exportParams);
      
      expect(result.file_url).toBe('/exports/fleet_20250820.xlsx');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/fleet/export'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(exportParams),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(fleetService.getDrivers()).rejects.toThrow('Network error');
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fleetService.getDriver('INVALID_ID')).rejects.toThrow('Not Found');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(fleetService.getDrivers()).rejects.toThrow('Invalid JSON');
    });
  });
});