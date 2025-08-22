import request from 'supertest';
import express from 'express';
import warehouseRoutes from '../routes';
import * as warehouseService from '../service';

// Mock the service
jest.mock('../service');

const app = express();
app.use(express.json());
app.use('/api/warehouses', warehouseRoutes);

describe('Warehouse API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/warehouses/inventory', () => {
    it('should return inventory overview', async () => {
      const mockData = {
        data: [
          {
            id: '123',
            warehouseId: 'w1',
            itemId: 'i1',
            quantity: 100,
            availableQty: 80,
            reservedQty: 20
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        },
        summary: {
          total_items: 1,
          total_quantity: 100,
          total_value: 10000
        }
      };

      (warehouseService.getInventoryOverview as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/warehouses/inventory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData.data);
      expect(response.body.pagination).toEqual(mockData.pagination);
      expect(response.body.summary).toEqual(mockData.summary);
    });

    it('should handle query parameters', async () => {
      (warehouseService.getInventoryOverview as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
        summary: {}
      });

      await request(app)
        .get('/api/warehouses/inventory?page=2&limit=10&minQuantity=50')
        .expect(200);

      expect(warehouseService.getInventoryOverview).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          minQuantity: 50
        })
      );
    });
  });

  describe('GET /api/warehouses/:warehouseId/inventory/:itemId', () => {
    it('should return specific inventory item', async () => {
      const mockInventory = {
        id: '123',
        warehouseId: 'w1',
        itemId: 'i1',
        quantity: 100,
        item_code: 'ITEM001',
        item_name: 'Test Item'
      };

      (warehouseService.getInventoryByItem as jest.Mock).mockResolvedValue(mockInventory);

      const response = await request(app)
        .get('/api/warehouses/w1/inventory/i1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInventory);
    });

    it('should return 404 when inventory not found', async () => {
      (warehouseService.getInventoryByItem as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/warehouses/w1/inventory/i999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Inventory record not found');
    });
  });

  describe('POST /api/warehouses/:warehouseId/adjust', () => {
    it('should adjust inventory successfully', async () => {
      const adjustmentRequest = {
        itemId: '550e8400-e29b-41d4-a716-446655440000',
        adjustmentType: 'increase',
        quantity: 50,
        reason: 'Stock replenishment',
        notes: 'Monthly restock'
      };

      const mockResult = {
        transaction: { id: 't1', transaction_no: 'ADJ-123' },
        newQuantity: 150
      };

      (warehouseService.adjustInventory as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/warehouses/w1/adjust')
        .send(adjustmentRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Inventory adjusted successfully');
      expect(response.body.data).toEqual(mockResult);
    });

    it('should validate adjustment request', async () => {
      const invalidRequest = {
        itemId: 'not-a-uuid',
        adjustmentType: 'invalid',
        quantity: -10
      };

      const response = await request(app)
        .post('/api/warehouses/w1/adjust')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('POST /api/warehouses/transfer', () => {
    it('should initiate transfer successfully', async () => {
      const transferRequest = {
        fromWarehouseId: '550e8400-e29b-41d4-a716-446655440001',
        toWarehouseId: '550e8400-e29b-41d4-a716-446655440002',
        itemId: '550e8400-e29b-41d4-a716-446655440003',
        quantity: 30,
        notes: 'Branch transfer'
      };

      const mockResult = {
        transferNo: 'TRF-123',
        transaction: { id: 't2' },
        status: 'in_transit'
      };

      (warehouseService.transferInventory as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/warehouses/transfer')
        .send(transferRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transfer initiated successfully');
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe('GET /api/warehouses/:warehouseId/alerts/low-stock', () => {
    it('should return low stock alerts', async () => {
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

      (warehouseService.getLowStockAlerts as jest.Mock).mockResolvedValue(mockAlerts);

      const response = await request(app)
        .get('/api/warehouses/w1/alerts/low-stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAlerts);
      expect(response.body.count).toBe(1);
    });
  });

  describe('GET /api/warehouses/:warehouseId/alerts/expiry', () => {
    it('should return expiry alerts', async () => {
      const mockAlerts = [
        {
          id: '1',
          batch_no: 'BATCH001',
          item_code: 'ITEM002',
          expiry_date: '2025-09-01',
          days_until_expiry: 10
        }
      ];

      (warehouseService.getExpiryAlerts as jest.Mock).mockResolvedValue(mockAlerts);

      const response = await request(app)
        .get('/api/warehouses/w1/alerts/expiry?days=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAlerts);
      expect(response.body.count).toBe(1);
    });
  });
});