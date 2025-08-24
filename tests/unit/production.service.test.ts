import * as productionService from '../../src/modules/production/service';
import { query, getClient } from '../../src/database/connection';
import { cache } from '../../src/database/redis';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/database/connection');
jest.mock('../../src/database/redis');
jest.mock('../../src/utils/logger');

describe('Production Service Unit Tests', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    (getClient as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('createWorkOrder', () => {
    it('should create work order with production tasks', async () => {
      const mockBOM = [
        { material_id: 'mat-1', quantity: 10, unit: 'kg' },
        { material_id: 'mat-2', quantity: 5, unit: 'pcs' }
      ];

      const mockWorkstations = [
        { id: 'ws-1', name: 'Cutting Station' },
        { id: 'ws-2', name: 'Packing Station' }
      ];

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ seq: 1 }] }) // Work order number
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-1', item_name: 'Product A', item_code: 'PA001' }] 
        }) // Item validation
        .mockResolvedValueOnce({ rows: mockBOM }) // Get BOM
        .mockResolvedValueOnce({ rows: mockWorkstations }) // Get workstations
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'wo-1', 
            work_order_no: 'WO20250822001',
            status: 'pending'
          }] 
        }) // Insert work order
        .mockResolvedValueOnce(undefined) // Create task 1
        .mockResolvedValueOnce(undefined) // Create task 2
        .mockResolvedValueOnce(undefined) // Material reservation 1
        .mockResolvedValueOnce(undefined) // Material reservation 2
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      // Mock getWorkOrderById
      (query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'wo-1',
            work_order_no: 'WO20250822001',
            item_id: 'item-1',
            planned_quantity: 100,
            status: 'pending'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { task_name: 'Cutting', sequence: 1 },
            { task_name: 'Packing', sequence: 2 }
          ]
        });

      const result = await productionService.createWorkOrder({
        itemId: 'item-1',
        plannedQuantity: 100,
        plannedStartDate: new Date('2025-08-23'),
        plannedEndDate: new Date('2025-08-25'),
        priority: 'high',
        notes: 'Rush order',
        createdBy: 'user-1'
      });

      expect(result).toBeDefined();
      expect(result.workOrderNo).toBe('WO20250822001');
      expect(result.tasks).toHaveLength(2);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(cache.del).toHaveBeenCalledWith('production:work_orders:pending');
    });

    it('should throw error for item without BOM', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ seq: 1 }] }) // Work order number
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-1', item_name: 'Product A' }] 
        }) // Item validation
        .mockResolvedValueOnce({ rows: [] }); // No BOM found

      await expect(
        productionService.createWorkOrder({
          itemId: 'item-1',
          plannedQuantity: 100,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(),
          createdBy: 'user-1'
        })
      ).rejects.toThrow('Bill of Materials not found for item');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status with valid transition', async () => {
      const mockTask = {
        id: 'task-1',
        work_order_id: 'wo-1',
        status: 'pending',
        workstation_id: 'ws-1'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTask] }) // Get task
        .mockResolvedValueOnce(undefined) // Update task
        .mockResolvedValueOnce(undefined) // Log activity
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      // Mock getProductionTaskById
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          ...mockTask,
          status: 'in_progress',
          actual_start_time: new Date().toISOString()
        }]
      });

      const result = await productionService.updateTaskStatus('task-1', {
        status: 'in_progress',
        workstationId: 'ws-1',
        operatorId: 'op-1',
        notes: 'Starting production',
        updatedBy: 'user-1'
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('in_progress');
      expect(result.actualStartTime).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(cache.del).toHaveBeenCalled();
    });

    it('should record quality metrics when task is completed', async () => {
      const mockTask = {
        id: 'task-1',
        status: 'in_progress',
        actual_quantity: 95
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTask] }) // Get task
        .mockResolvedValueOnce(undefined) // Update task
        .mockResolvedValueOnce(undefined) // Insert quality metrics
        .mockResolvedValueOnce(undefined) // Update work order quantity
        .mockResolvedValueOnce(undefined) // Log activity
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      // Mock getProductionTaskById
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          ...mockTask,
          status: 'completed',
          actual_end_time: new Date().toISOString()
        }]
      });

      const result = await productionService.updateTaskStatus('task-1', {
        status: 'completed',
        actualQuantity: 95,
        qualityMetrics: {
          passRate: 0.95,
          defectRate: 0.05,
          reworkRate: 0.02
        },
        updatedBy: 'user-1'
      });

      expect(result.status).toBe('completed');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quality_metrics'),
        expect.any(Array)
      );
    });

    it('should reject invalid status transition', async () => {
      const mockTask = {
        id: 'task-1',
        status: 'completed'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTask] }); // Get task

      await expect(
        productionService.updateTaskStatus('task-1', {
          status: 'pending',
          updatedBy: 'user-1'
        })
      ).rejects.toThrow('Invalid status transition from completed to pending');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('calculateOEE', () => {
    it('should calculate OEE metrics correctly', async () => {
      const mockWorkstationData = {
        workstation_id: 'ws-1',
        total_runtime: 480, // 8 hours in minutes
        downtime: 60, // 1 hour downtime
        planned_quantity: 1000,
        actual_quantity: 900,
        good_quantity: 850
      };

      (query as jest.Mock).mockResolvedValueOnce({
        rows: [mockWorkstationData]
      });

      const result = await productionService.calculateOEE({
        workstationId: 'ws-1',
        startDate: new Date('2025-08-22'),
        endDate: new Date('2025-08-23')
      });

      expect(result).toBeDefined();
      
      // Availability = (480 - 60) / 480 = 87.5%
      expect(result.availability).toBeCloseTo(0.875, 2);
      
      // Performance = 900 / 1000 = 90%
      expect(result.performance).toBeCloseTo(0.9, 2);
      
      // Quality = 850 / 900 = 94.4%
      expect(result.quality).toBeCloseTo(0.944, 2);
      
      // OEE = 0.875 * 0.9 * 0.944 = 74.4%
      expect(result.oee).toBeCloseTo(0.744, 2);
      
      expect(result.totalRuntime).toBe(480);
      expect(result.downtime).toBe(60);
    });

    it('should handle zero production gracefully', async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          workstation_id: 'ws-1',
          total_runtime: 480,
          downtime: 480, // All downtime
          planned_quantity: 100,
          actual_quantity: 0,
          good_quantity: 0
        }]
      });

      const result = await productionService.calculateOEE({
        workstationId: 'ws-1',
        startDate: new Date('2025-08-22'),
        endDate: new Date('2025-08-23')
      });

      expect(result.availability).toBe(0);
      expect(result.performance).toBe(0);
      expect(result.quality).toBe(0);
      expect(result.oee).toBe(0);
    });
  });

  describe('getWorkstationMetrics', () => {
    it('should return workstation performance metrics', async () => {
      const mockMetrics = [
        {
          workstation_id: 'ws-1',
          workstation_name: 'Cutting Station',
          task_count: 50,
          completed_tasks: 45,
          avg_cycle_time: 30,
          utilization_rate: 0.85,
          current_status: 'running'
        },
        {
          workstation_id: 'ws-2',
          workstation_name: 'Packing Station',
          task_count: 40,
          completed_tasks: 38,
          avg_cycle_time: 15,
          utilization_rate: 0.75,
          current_status: 'idle'
        }
      ];

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);
      (query as jest.Mock).mockResolvedValueOnce({ rows: mockMetrics });

      const result = await productionService.getWorkstationMetrics({
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31')
      });

      expect(result).toHaveLength(2);
      expect(result[0].workstationName).toBe('Cutting Station');
      expect(result[0].completionRate).toBeCloseTo(0.9, 2);
      expect(result[1].utilizationRate).toBe(0.75);

      // Verify caching
      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('production:metrics:workstation'),
        result,
        300
      );
    });

    it('should return cached metrics if available', async () => {
      const cachedMetrics = [
        {
          workstationId: 'ws-1',
          workstationName: 'Cutting Station',
          taskCount: 25,
          completedTasks: 20,
          completionRate: 0.8,
          avgCycleTime: 25,
          utilizationRate: 0.8,
          currentStatus: 'running'
        }
      ];

      (cache.get as jest.Mock).mockResolvedValue(cachedMetrics);

      const result = await productionService.getWorkstationMetrics({
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31')
      });

      expect(result).toEqual(cachedMetrics);
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('getProductionDashboard', () => {
    it('should return comprehensive production dashboard', async () => {
      const mockWorkOrders = [
        { status: 'in_progress', count: '5' },
        { status: 'pending', count: '10' },
        { status: 'completed', count: '15' }
      ];

      const mockEfficiency = {
        avg_oee: 0.75,
        avg_availability: 0.85,
        avg_performance: 0.90,
        avg_quality: 0.98
      };

      const mockBottlenecks = [
        {
          workstation_id: 'ws-1',
          workstation_name: 'Cutting Station',
          pending_tasks: 25,
          avg_wait_time: 120
        }
      ];

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockWorkOrders })
        .mockResolvedValueOnce({ rows: [mockEfficiency] })
        .mockResolvedValueOnce({ rows: mockBottlenecks })
        .mockResolvedValueOnce({ rows: [] }); // Recent activities

      const result = await productionService.getProductionDashboard();

      expect(result).toBeDefined();
      expect(result.workOrderSummary.inProgress).toBe(5);
      expect(result.workOrderSummary.pending).toBe(10);
      expect(result.workOrderSummary.completed).toBe(15);
      expect(result.efficiency.avgOEE).toBe(0.75);
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.timestamp).toBeDefined();

      // Verify caching
      expect(cache.set).toHaveBeenCalledWith(
        'production:dashboard',
        result,
        60
      );
    });
  });

  // State transition tests commented out - helper functions not yet implemented
  // describe('Production State Transitions', () => {
  //   it('should validate work order status transitions', () => {});
  //   it('should validate production task status transitions', () => {});
  // });
});