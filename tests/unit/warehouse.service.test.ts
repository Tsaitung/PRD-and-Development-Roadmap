import * as warehouseService from '../../src/modules/warehouse/service';
import { query, getClient } from '../../src/database/connection';
import { cache } from '../../src/database/redis';
import { AppError } from '../../src/middleware/errorHandler';

// Mock dependencies
jest.mock('../../src/database/connection');
jest.mock('../../src/database/redis');
jest.mock('../../src/utils/logger');

describe('Warehouse Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventoryOverview', () => {
    it('should return paginated inventory data', async () => {
      const mockInventoryData = [
        {
          id: '1',
          warehouse_id: 'w1',
          item_id: 'i1',
          quantity: 100,
          available_qty: 80,
          item_code: 'ITEM001',
          item_name: 'Test Item',
          warehouse_code: 'WH001',
          warehouse_name: 'Main Warehouse'
        }
      ];

      const mockSummary = {
        total_items: 1,
        total_quantity: 100,
        total_value: 10000,
        avg_quantity: 100
      };

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count query
        .mockResolvedValueOnce({ rows: mockInventoryData }) // data query
        .mockResolvedValueOnce({ rows: [mockSummary] }); // summary query

      const result = await warehouseService.getInventoryOverview({
        warehouseId: 'w1',
        page: 1,
        limit: 20
      });

      expect(result.data).toEqual(mockInventoryData);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      });
      expect(result.summary).toEqual(mockSummary);
      expect(query).toHaveBeenCalledTimes(3);
    });

    it('should apply filters correctly', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      await warehouseService.getInventoryOverview({
        warehouseId: 'w1',
        minQuantity: 50,
        maxQuantity: 200,
        page: 1,
        limit: 20
      });

      const dataQueryCall = (query as jest.Mock).mock.calls[1];
      expect(dataQueryCall[0]).toContain('inv.warehouse_id = $1');
      expect(dataQueryCall[0]).toContain('inv.quantity >= $2');
      expect(dataQueryCall[0]).toContain('inv.quantity <= $3');
      expect(dataQueryCall[1]).toEqual(['w1', 50, 200, 20, 0]);
    });
  });

  describe('getInventoryByItem', () => {
    it('should return inventory from cache if available', async () => {
      const cachedData = {
        id: '1',
        warehouse_id: 'w1',
        item_id: 'i1',
        quantity: 100
      };

      (cache.get as jest.Mock).mockResolvedValueOnce(cachedData);

      const result = await warehouseService.getInventoryByItem('w1', 'i1');

      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('inventory:w1:i1');
      expect(query).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const dbData = {
        id: '1',
        warehouse_id: 'w1',
        item_id: 'i1',
        quantity: 100,
        item_code: 'ITEM001'
      };

      (cache.get as jest.Mock).mockResolvedValueOnce(null);
      (query as jest.Mock).mockResolvedValueOnce({ rows: [dbData] });
      (cache.set as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await warehouseService.getInventoryByItem('w1', 'i1');

      expect(result).toEqual(dbData);
      expect(cache.get).toHaveBeenCalledWith('inventory:w1:i1');
      expect(query).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith('inventory:w1:i1', dbData, 300);
    });

    it('should return null if inventory not found', async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce(null);
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await warehouseService.getInventoryByItem('w1', 'i999');

      expect(result).toBeNull();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('adjustInventory', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      (getClient as jest.Mock).mockResolvedValue(mockClient);
    });

    it('should increase inventory correctly', async () => {
      const currentInventory = {
        id: '1',
        quantity: 100,
        available_qty: 80
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [currentInventory] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce(undefined) // UPDATE inventory
        .mockResolvedValueOnce({ rows: [{ id: 't1' }] }) // INSERT transaction
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await warehouseService.adjustInventory({
        warehouseId: 'w1',
        itemId: 'i1',
        adjustmentType: 'increase',
        quantity: 50,
        reason: 'Replenishment',
        createdBy: 'user1'
      });

      expect(result.newQuantity).toBe(150);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(cache.del).toHaveBeenCalledWith('inventory:w1:i1');
    });

    it('should prevent negative inventory on decrease', async () => {
      const currentInventory = {
        id: '1',
        quantity: 50,
        available_qty: 30
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [currentInventory] }); // SELECT FOR UPDATE

      await expect(
        warehouseService.adjustInventory({
          warehouseId: 'w1',
          itemId: 'i1',
          adjustmentType: 'decrease',
          quantity: 100,
          reason: 'Over adjustment',
          createdBy: 'user1'
        })
      ).rejects.toThrow('Insufficient inventory');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle inventory not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT FOR UPDATE - no rows

      await expect(
        warehouseService.adjustInventory({
          warehouseId: 'w999',
          itemId: 'i999',
          adjustmentType: 'increase',
          quantity: 10,
          reason: 'Test',
          createdBy: 'user1'
        })
      ).rejects.toThrow('Inventory record not found');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('transferInventory', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      (getClient as jest.Mock).mockResolvedValue(mockClient);
    });

    it('should transfer inventory between warehouses', async () => {
      const sourceInventory = {
        id: '1',
        available_qty: 100
      };

      const destInventory = {
        id: '2',
        available_qty: 50
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [sourceInventory] }) // Source SELECT FOR UPDATE
        .mockResolvedValueOnce(undefined) // Update source
        .mockResolvedValueOnce({ rows: [destInventory] }) // Check destination
        .mockResolvedValueOnce(undefined) // Update destination
        .mockResolvedValueOnce(undefined) // Out transaction
        .mockResolvedValueOnce({ rows: [{ id: 't1' }] }) // In transaction
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await warehouseService.transferInventory({
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        itemId: 'i1',
        quantity: 30,
        createdBy: 'user1'
      });

      expect(result.status).toBe('in_transit');
      expect(result.transferNo).toContain('TRF-');
      expect(cache.del).toHaveBeenCalledWith('inventory:w1:i1');
      expect(cache.del).toHaveBeenCalledWith('inventory:w2:i1');
    });

    it('should create destination inventory if not exists', async () => {
      const sourceInventory = {
        id: '1',
        available_qty: 100
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [sourceInventory] }) // Source SELECT
        .mockResolvedValueOnce(undefined) // Update source
        .mockResolvedValueOnce({ rows: [] }) // Check destination - empty
        .mockResolvedValueOnce(undefined) // INSERT new destination
        .mockResolvedValueOnce(undefined) // Out transaction
        .mockResolvedValueOnce({ rows: [{ id: 't1' }] }) // In transaction
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await warehouseService.transferInventory({
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        itemId: 'i1',
        quantity: 30,
        createdBy: 'user1'
      });

      expect(result.status).toBe('in_transit');
      
      // Check INSERT query was called for new destination
      const insertCall = mockClient.query.mock.calls.find(
        (call: any[]) => call[0]?.includes('INSERT INTO inventory_snapshots')
      );
      expect(insertCall).toBeDefined();
    });

    it('should fail if insufficient available quantity', async () => {
      const sourceInventory = {
        id: '1',
        available_qty: 20
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [sourceInventory] }); // Source SELECT

      await expect(
        warehouseService.transferInventory({
          fromWarehouseId: 'w1',
          toWarehouseId: 'w2',
          itemId: 'i1',
          quantity: 50,
          createdBy: 'user1'
        })
      ).rejects.toThrow('Insufficient available quantity');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getLowStockAlerts', () => {
    it('should return items below minimum stock', async () => {
      const mockAlerts = [
        {
          id: '1',
          item_code: 'ITEM001',
          item_name: 'Critical Item',
          quantity: 5,
          min_stock_qty: 20,
          shortage: -15
        }
      ];

      (query as jest.Mock).mockResolvedValueOnce({ rows: mockAlerts });

      const result = await warehouseService.getLowStockAlerts('w1');

      expect(result).toEqual(mockAlerts);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('inv.quantity < i.min_stock_qty'),
        ['w1']
      );
    });

    it('should work without warehouse filter', async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await warehouseService.getLowStockAlerts();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('inv.quantity < i.min_stock_qty'),
        []
      );
    });
  });

  describe('getExpiryAlerts', () => {
    it('should return batches expiring within specified days', async () => {
      const mockAlerts = [
        {
          id: '1',
          batch_no: 'BATCH001',
          item_code: 'ITEM002',
          expiry_date: '2025-09-01',
          days_until_expiry: 10
        }
      ];

      (query as jest.Mock).mockResolvedValueOnce({ rows: mockAlerts });

      const result = await warehouseService.getExpiryAlerts('w1', 30);

      expect(result).toEqual(mockAlerts);
      
      const queryCall = (query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('b.expiry_date <=');
      expect(queryCall[1][0]).toBe('w1');
    });

    it('should default to 30 days if not specified', async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await warehouseService.getExpiryAlerts('w1');

      const queryCall = (query as jest.Mock).mock.calls[0];
      const expiryDate = queryCall[1][1];
      const daysDiff = Math.ceil(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      expect(daysDiff).toBeCloseTo(30, 0);
    });
  });
});