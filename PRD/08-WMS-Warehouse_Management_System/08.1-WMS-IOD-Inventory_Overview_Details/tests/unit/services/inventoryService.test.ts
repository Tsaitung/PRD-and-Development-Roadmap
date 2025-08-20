import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as inventoryService from '../../../services/inventoryService';
import { testDataBuilders } from '../../setup';

vi.mock('#libs/services2/request', () => ({
  request: vi.fn(),
  postWithResponse: vi.fn(),
  putWithResponse: vi.fn(),
  deleteRequest: vi.fn(),
  patchWithResponse: vi.fn(),
}));

describe('Inventory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should fetch inventory with filters', async () => {
      const filters = {
        warehouse: 'WH_001',
        category: '生鮮蔬果',
        status: 'normal',
        search: '商品A',
        page: 1,
        limit: 20,
      };

      const result = await inventoryService.getInventory(filters);

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBeDefined();
    });

    it('should handle pagination', async () => {
      const result = await inventoryService.getInventory({
        page: 2,
        limit: 50,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should validate filter parameters', async () => {
      const invalidFilters = {
        page: -1,
        limit: 1000,
      };

      await expect(inventoryService.getInventory(invalidFilters))
        .rejects.toThrow('Invalid pagination parameters');
    });
  });

  describe('getInventoryItem', () => {
    it('should fetch single inventory item', async () => {
      const result = await inventoryService.getInventoryItem('INV_001');

      expect(result).toBeDefined();
      expect(result.item_id).toBe('INV_001');
      expect(result.product_name).toBeDefined();
    });

    it('should include stock details', async () => {
      const result = await inventoryService.getInventoryItem('INV_001');

      expect(result.current_stock).toBeDefined();
      expect(result.available_stock).toBeDefined();
      expect(result.reserved_stock).toBeDefined();
    });

    it('should handle non-existent item', async () => {
      await expect(inventoryService.getInventoryItem('INVALID_ID'))
        .rejects.toThrow('Item not found');
    });
  });

  describe('updateInventory', () => {
    it('should update inventory item', async () => {
      const updates = {
        safety_stock: 150,
        reorder_point: 200,
        location: 'B-02-03',
      };

      const result = await inventoryService.updateInventory('INV_001', updates);

      expect(result.item_id).toBe('INV_001');
      expect(result.safety_stock).toBe(150);
      expect(result.reorder_point).toBe(200);
      expect(result.location).toBe('B-02-03');
    });

    it('should validate stock levels', async () => {
      const invalidUpdates = {
        safety_stock: -10,
      };

      await expect(inventoryService.updateInventory('INV_001', invalidUpdates))
        .rejects.toThrow('Safety stock cannot be negative');
    });

    it('should update last modified timestamp', async () => {
      const result = await inventoryService.updateInventory('INV_001', {
        location: 'C-01-01',
      });

      expect(result.last_updated).toBeDefined();
      expect(new Date(result.last_updated).getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('adjustStock', () => {
    it('should create stock adjustment', async () => {
      const adjustment = {
        item_id: 'INV_001',
        adjustment_type: 'damage',
        quantity: -10,
        reason: '運輸破損',
      };

      const result = await inventoryService.adjustStock(adjustment);

      expect(result.adjustment_id).toBeDefined();
      expect(result.item_id).toBe('INV_001');
      expect(result.quantity).toBe(-10);
    });

    it('should calculate before and after quantities', async () => {
      const adjustment = {
        item_id: 'INV_001',
        adjustment_type: 'count',
        quantity: 5,
        reason: '盤點調整',
      };

      const result = await inventoryService.adjustStock(adjustment);

      expect(result.before_quantity).toBeDefined();
      expect(result.after_quantity).toBe(result.before_quantity + 5);
    });

    it('should require approval for large adjustments', async () => {
      const largeAdjustment = {
        item_id: 'INV_001',
        adjustment_type: 'damage',
        quantity: -200,
        reason: '大量破損',
      };

      const result = await inventoryService.adjustStock(largeAdjustment);

      expect(result.requires_approval).toBe(true);
      expect(result.status).toBe('pending_approval');
    });

    it('should prevent negative stock', async () => {
      const adjustment = {
        item_id: 'INV_001',
        adjustment_type: 'damage',
        quantity: -1000,
        reason: '測試',
      };

      await expect(inventoryService.adjustStock(adjustment))
        .rejects.toThrow('Adjustment would result in negative stock');
    });
  });

  describe('transferStock', () => {
    it('should create transfer order', async () => {
      const transfer = {
        from_warehouse: 'WH_001',
        to_warehouse: 'WH_002',
        items: [
          { item_id: 'INV_001', quantity: 50 },
          { item_id: 'INV_002', quantity: 30 },
        ],
        expected_date: '2025-08-22',
      };

      const result = await inventoryService.transferStock(transfer);

      expect(result.transfer_id).toBeDefined();
      expect(result.transfer_number).toBeDefined();
      expect(result.status).toBe('pending');
    });

    it('should validate stock availability', async () => {
      const transfer = {
        from_warehouse: 'WH_001',
        to_warehouse: 'WH_002',
        items: [
          { item_id: 'INV_001', quantity: 1000 },
        ],
      };

      await expect(inventoryService.transferStock(transfer))
        .rejects.toThrow('Insufficient stock for transfer');
    });

    it('should calculate transfer cost', async () => {
      const transfer = {
        from_warehouse: 'WH_001',
        to_warehouse: 'WH_003',
        items: [
          { item_id: 'INV_001', quantity: 100 },
        ],
      };

      const result = await inventoryService.transferStock(transfer);

      expect(result.estimated_cost).toBeDefined();
      expect(result.estimated_cost).toBeGreaterThan(0);
    });
  });

  describe('getStockMovements', () => {
    it('should fetch movement history', async () => {
      const filters = {
        item_id: 'INV_001',
        type: 'inbound',
        date_from: '2025-08-01',
        date_to: '2025-08-31',
      };

      const result = await inventoryService.getStockMovements(filters);

      expect(result.movements).toBeDefined();
      expect(Array.isArray(result.movements)).toBe(true);
      expect(result.total).toBeDefined();
    });

    it('should sort by date', async () => {
      const result = await inventoryService.getStockMovements({
        sort: 'date_desc',
      });

      const dates = result.movements.map(m => new Date(m.created_at).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should calculate summary statistics', async () => {
      const result = await inventoryService.getStockMovements({
        item_id: 'INV_001',
        include_summary: true,
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.total_inbound).toBeDefined();
      expect(result.summary.total_outbound).toBeDefined();
      expect(result.summary.net_change).toBeDefined();
    });
  });

  describe('getStockAlerts', () => {
    it('should fetch active alerts', async () => {
      const result = await inventoryService.getStockAlerts({
        resolved: false,
      });

      expect(result.alerts).toBeDefined();
      expect(result.alerts.every(a => !a.resolved)).toBe(true);
    });

    it('should filter by severity', async () => {
      const result = await inventoryService.getStockAlerts({
        severity: 'high',
      });

      expect(result.alerts.every(a => a.severity === 'high')).toBe(true);
    });

    it('should group by alert type', async () => {
      const result = await inventoryService.getStockAlerts({
        group_by: 'type',
      });

      expect(result.groups).toBeDefined();
      expect(result.groups.low_stock).toBeDefined();
      expect(result.groups.expiring).toBeDefined();
      expect(result.groups.overstock).toBeDefined();
    });
  });

  describe('performCycleCount', () => {
    it('should create cycle count record', async () => {
      const countData = {
        warehouse_id: 'WH_001',
        location: 'A-01',
        items: [
          { item_id: 'INV_001', counted_quantity: 495 },
          { item_id: 'INV_002', counted_quantity: 450 },
        ],
      };

      const result = await inventoryService.performCycleCount(countData);

      expect(result.count_id).toBeDefined();
      expect(result.items_counted).toBe(2);
      expect(result.accuracy_rate).toBeDefined();
    });

    it('should identify discrepancies', async () => {
      const countData = {
        warehouse_id: 'WH_001',
        location: 'A-01',
        items: [
          { item_id: 'INV_001', counted_quantity: 480 }, // Discrepancy
        ],
      };

      const result = await inventoryService.performCycleCount(countData);

      expect(result.discrepancies).toBe(1);
      expect(result.discrepancy_items).toContain('INV_001');
    });

    it('should create automatic adjustments', async () => {
      const countData = {
        warehouse_id: 'WH_001',
        location: 'A-01',
        items: [
          { item_id: 'INV_001', counted_quantity: 495 },
        ],
        auto_adjust: true,
      };

      const result = await inventoryService.performCycleCount(countData);

      expect(result.adjustments_created).toBe(1);
      expect(result.status).toBe('completed');
    });
  });

  describe('getInventoryReport', () => {
    it('should generate daily report', async () => {
      const result = await inventoryService.getInventoryReport({
        type: 'daily',
        date: '2025-08-20',
        warehouse_id: 'WH_001',
      });

      expect(result.report_type).toBe('daily_stock');
      expect(result.report_date).toBeDefined();
      expect(result.total_items).toBeDefined();
      expect(result.total_value).toBeDefined();
    });

    it('should include ABC analysis', async () => {
      const result = await inventoryService.getInventoryReport({
        type: 'abc_analysis',
      });

      expect(result.categories).toBeDefined();
      expect(result.categories.A).toBeDefined();
      expect(result.categories.B).toBeDefined();
      expect(result.categories.C).toBeDefined();
    });

    it('should calculate turnover metrics', async () => {
      const result = await inventoryService.getInventoryReport({
        type: 'turnover',
        period: 'monthly',
      });

      expect(result.turnover_rate).toBeDefined();
      expect(result.days_inventory_outstanding).toBeDefined();
      expect(result.slow_moving_items).toBeDefined();
    });
  });

  describe('validateStockLevels', () => {
    it('should identify items below safety stock', () => {
      const items = [
        { item_id: 'INV_001', current_stock: 80, safety_stock: 100 },
        { item_id: 'INV_002', current_stock: 150, safety_stock: 100 },
      ];

      const result = inventoryService.validateStockLevels(items);

      expect(result.below_safety_stock).toContain('INV_001');
      expect(result.below_safety_stock).not.toContain('INV_002');
    });

    it('should identify items at reorder point', () => {
      const items = [
        { item_id: 'INV_001', current_stock: 150, reorder_point: 150 },
      ];

      const result = inventoryService.validateStockLevels(items);

      expect(result.at_reorder_point).toContain('INV_001');
    });

    it('should identify overstock items', () => {
      const items = [
        { item_id: 'INV_001', current_stock: 1200, max_stock: 1000 },
      ];

      const result = inventoryService.validateStockLevels(items);

      expect(result.overstock).toContain('INV_001');
    });
  });

  describe('exportInventory', () => {
    it('should export to Excel format', async () => {
      const exportOptions = {
        format: 'excel',
        filters: {
          warehouse: 'WH_001',
        },
        include_movements: true,
      };

      const result = await inventoryService.exportInventory(exportOptions);

      expect(result.file_url).toBeDefined();
      expect(result.format).toBe('excel');
      expect(result.record_count).toBeDefined();
    });

    it('should export to CSV format', async () => {
      const exportOptions = {
        format: 'csv',
        columns: ['sku', 'product_name', 'current_stock', 'location'],
      };

      const result = await inventoryService.exportInventory(exportOptions);

      expect(result.format).toBe('csv');
      expect(result.file_url).toContain('.csv');
    });
  });
});