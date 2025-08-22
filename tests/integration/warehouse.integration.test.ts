import request from 'supertest';
import { Pool } from 'pg';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Import app components
import routes from '../../src/routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { notFoundHandler } from '../../src/middleware/notFoundHandler';

describe('Warehouse API Integration Tests', () => {
  let app: express.Application;
  let pool: Pool;
  let authToken: string;
  let testWarehouseId: string;
  let testItemId: string;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Setup test database connection
    pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'tsaitung_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'password'
    });

    // Create test user token
    authToken = jwt.sign(
      {
        id: uuidv4(),
        username: 'testuser',
        email: 'test@tsaitung.com',
        roleId: uuidv4(),
        permissions: [
          'warehouse.adjust',
          'warehouse.transfer',
          'warehouse.batch.create',
          'warehouse.stockcount.create'
        ]
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await pool.end();
  });

  async function setupTestData() {
    // Create test warehouse
    const warehouseResult = await pool.query(
      `INSERT INTO warehouses (warehouse_code, warehouse_name, warehouse_type)
       VALUES ($1, $2, $3) RETURNING id`,
      ['TEST-WH-001', 'Test Warehouse', 'main']
    );
    testWarehouseId = warehouseResult.rows[0].id;

    // Create test item
    const itemResult = await pool.query(
      `INSERT INTO items (item_code, item_name, specification)
       VALUES ($1, $2, $3) RETURNING id`,
      ['TEST-ITEM-001', 'Test Item', 'Test Specification']
    );
    testItemId = itemResult.rows[0].id;

    // Create initial inventory
    await pool.query(
      `INSERT INTO inventory_snapshots 
       (warehouse_id, item_id, quantity, available_qty, reserved_qty, in_transit_qty)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testWarehouseId, testItemId, 100, 80, 20, 0]
    );
  }

  async function cleanupTestData() {
    await pool.query('DELETE FROM inventory_transactions WHERE warehouse_id = $1', [testWarehouseId]);
    await pool.query('DELETE FROM inventory_snapshots WHERE warehouse_id = $1', [testWarehouseId]);
    await pool.query('DELETE FROM items WHERE id = $1', [testItemId]);
    await pool.query('DELETE FROM warehouses WHERE id = $1', [testWarehouseId]);
  }

  describe('GET /api/v1/warehouses/inventory', () => {
    it('should return inventory overview without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/warehouses/inventory')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter inventory by warehouse', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/${testWarehouseId}/inventory`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].warehouseId).toBe(testWarehouseId);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/v1/warehouses/inventory?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/v1/warehouses/:warehouseId/adjust', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/warehouses/${testWarehouseId}/adjust`)
        .send({
          itemId: testItemId,
          adjustmentType: 'increase',
          quantity: 10,
          reason: 'Test adjustment'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('No token provided');
    });

    it('should adjust inventory with valid token', async () => {
      const response = await request(app)
        .post(`/api/v1/warehouses/${testWarehouseId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: testItemId,
          adjustmentType: 'increase',
          quantity: 10,
          reason: 'Stock replenishment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Inventory adjusted successfully');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data).toHaveProperty('newQuantity');
      expect(response.body.data.newQuantity).toBe(110);
    });

    it('should validate adjustment request', async () => {
      const response = await request(app)
        .post(`/api/v1/warehouses/${testWarehouseId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: 'not-a-uuid',
          adjustmentType: 'invalid-type',
          quantity: -10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it('should prevent negative inventory', async () => {
      const response = await request(app)
        .post(`/api/v1/warehouses/${testWarehouseId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: testItemId,
          adjustmentType: 'decrease',
          quantity: 1000,
          reason: 'Over adjustment'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Insufficient inventory');
    });
  });

  describe('Batch Management', () => {
    let testBatchId: string;

    it('should create a new batch', async () => {
      const response = await request(app)
        .post('/api/v1/warehouses/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          batchNo: `BATCH-${Date.now()}`,
          itemId: testItemId,
          warehouseId: testWarehouseId,
          quantity: 50,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          qualityGrade: 'A'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      testBatchId = response.body.data.id;
    });

    it('should get batches by item', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/batches/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should quarantine a batch', async () => {
      const response = await request(app)
        .put(`/api/v1/warehouses/batches/${testBatchId}/quarantine`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Quality issue detected'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('quarantine');
    });
  });

  describe('Stock Counting', () => {
    let sessionId: string;

    it('should create a stock count session', async () => {
      const response = await request(app)
        .post('/api/v1/warehouses/stockcount/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId: testWarehouseId,
          countType: 'spot',
          itemIds: [testItemId],
          notes: 'Test stock count'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('sessionCode');
      sessionId = response.body.data.id;
    });

    it('should get stock count session details', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/stockcount/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
      expect(response.body.data).toHaveProperty('items');
    });

    it('should start stock count', async () => {
      const response = await request(app)
        .put(`/api/v1/warehouses/stockcount/sessions/${sessionId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should submit item count', async () => {
      const response = await request(app)
        .post(`/api/v1/warehouses/stockcount/sessions/${sessionId}/items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          countedQty: 105,
          notes: 'Counted manually'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.countedQty).toBe(105);
      expect(response.body.data.status).toBe('counted');
    });

    it('should get variance report', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/stockcount/sessions/${sessionId}/variance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('summary');
    });
  });

  describe('Alerts and Monitoring', () => {
    it('should get low stock alerts', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/${testWarehouseId}/alerts/low-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });

    it('should get expiry alerts', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/${testWarehouseId}/alerts/expiry?days=30`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });

    it('should get inventory transactions', async () => {
      const response = await request(app)
        .get(`/api/v1/warehouses/${testWarehouseId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          itemId: testItemId,
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });
  });
});