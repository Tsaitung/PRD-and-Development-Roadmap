import { rest } from 'msw';
import { testDataBuilders } from '../setup';

export const wmsApiHandlers = [
  // Inventory endpoints
  rest.get('/api/v1/inventory', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 20;
    const warehouse = req.url.searchParams.get('warehouse');
    const category = req.url.searchParams.get('category');
    const status = req.url.searchParams.get('status');
    const search = req.url.searchParams.get('search');

    let items = [
      testDataBuilders.createTestInventoryItem(),
      testDataBuilders.createTestInventoryItem({
        item_id: 'INV_TEST_002',
        sku: 'SKU_TEST_002',
        product_name: '測試商品B',
        current_stock: 80,
        status: 'low',
      }),
      testDataBuilders.createTestInventoryItem({
        item_id: 'INV_TEST_003',
        sku: 'SKU_TEST_003',
        product_name: '測試商品C',
        current_stock: 0,
        status: 'out_of_stock',
      }),
    ];

    // Apply filters
    if (warehouse) {
      items = items.filter(item => item.warehouse_id === warehouse);
    }
    if (category) {
      items = items.filter(item => item.category === category);
    }
    if (status) {
      items = items.filter(item => item.status === status);
    }
    if (search) {
      items = items.filter(item => 
        item.product_name.includes(search) || 
        item.sku.includes(search)
      );
    }

    return res(
      ctx.json({
        items: items.slice((page - 1) * limit, page * limit),
        total: items.length,
        page,
        limit,
      })
    );
  }),

  rest.get('/api/v1/inventory/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestInventoryItem({ item_id: id }))
    );
  }),

  rest.put('/api/v1/inventory/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestInventoryItem({ item_id: id }),
        ...body,
        updated_at: new Date(),
      })
    );
  }),

  rest.post('/api/v1/inventory/adjust', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestStockAdjustment(body))
    );
  }),

  rest.post('/api/v1/inventory/transfer', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestTransferOrder(body))
    );
  }),

  // Stock movements
  rest.get('/api/v1/inventory/movements', (req, res, ctx) => {
    const item_id = req.url.searchParams.get('item_id');
    const type = req.url.searchParams.get('type');
    const date_from = req.url.searchParams.get('date_from');
    const date_to = req.url.searchParams.get('date_to');

    let movements = [
      testDataBuilders.createTestStockMovement(),
      testDataBuilders.createTestStockMovement({
        movement_id: 'MOV_TEST_002',
        movement_type: 'outbound',
        quantity: -50,
        notes: '銷售出貨',
      }),
      testDataBuilders.createTestStockMovement({
        movement_id: 'MOV_TEST_003',
        movement_type: 'internal',
        quantity: 30,
        from_location: 'A-01-02',
        to_location: 'B-02-03',
        notes: '內部調撥',
      }),
    ];

    if (item_id) {
      movements = movements.filter(m => m.item_id === item_id);
    }
    if (type) {
      movements = movements.filter(m => m.movement_type === type);
    }

    return res(
      ctx.json({
        movements,
        total: movements.length,
      })
    );
  }),

  // Stock alerts
  rest.get('/api/v1/inventory/alerts', (req, res, ctx) => {
    const type = req.url.searchParams.get('type');
    const severity = req.url.searchParams.get('severity');
    const resolved = req.url.searchParams.get('resolved');

    let alerts = [
      testDataBuilders.createTestStockAlert(),
      testDataBuilders.createTestStockAlert({
        alert_id: 'ALERT_TEST_002',
        alert_type: 'expiring',
        item_id: 'INV_TEST_002',
        product_name: '測試商品B',
        severity: 'medium',
        action_required: '即將過期，需要促銷',
      }),
      testDataBuilders.createTestStockAlert({
        alert_id: 'ALERT_TEST_003',
        alert_type: 'overstock',
        item_id: 'INV_TEST_003',
        product_name: '測試商品C',
        current_stock: 1500,
        threshold: 1000,
        severity: 'low',
        action_required: '庫存過多，減少採購',
      }),
    ];

    if (type) {
      alerts = alerts.filter(a => a.alert_type === type);
    }
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    if (resolved !== null) {
      alerts = alerts.filter(a => a.resolved === (resolved === 'true'));
    }

    return res(
      ctx.json({
        alerts,
        total: alerts.length,
      })
    );
  }),

  // Warehouses
  rest.get('/api/v1/warehouses', (req, res, ctx) => {
    const warehouses = [
      testDataBuilders.createTestWarehouse(),
      testDataBuilders.createTestWarehouse({
        warehouse_id: 'WH_002',
        warehouse_name: '中區倉庫',
        location: '台中市西屯區',
        used_capacity: 5200,
      }),
      testDataBuilders.createTestWarehouse({
        warehouse_id: 'WH_003',
        warehouse_name: '南區倉庫',
        location: '高雄市前鎮區',
        used_capacity: 4800,
      }),
    ];

    return res(ctx.json(warehouses));
  }),

  // Batch information
  rest.get('/api/v1/inventory/batches/:itemId', (req, res, ctx) => {
    const { itemId } = req.params;
    
    const batches = [
      testDataBuilders.createTestBatchInfo({ item_id: itemId }),
      testDataBuilders.createTestBatchInfo({
        batch_id: 'BATCH_TEST_002',
        batch_number: 'BATCH_20250815_001',
        item_id: itemId,
        quantity: 150,
        expiry_date: new Date('2025-09-10'),
      }),
    ];

    return res(ctx.json(batches));
  }),

  // Cycle count
  rest.post('/api/v1/inventory/cycle-count', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestCycleCount(body))
    );
  }),

  rest.get('/api/v1/inventory/cycle-counts', (req, res, ctx) => {
    const warehouse = req.url.searchParams.get('warehouse');
    const date_from = req.url.searchParams.get('date_from');
    const date_to = req.url.searchParams.get('date_to');

    let counts = [
      testDataBuilders.createTestCycleCount(),
      testDataBuilders.createTestCycleCount({
        count_id: 'COUNT_TEST_002',
        count_date: new Date('2025-08-15'),
        location: 'B-02',
        accuracy_rate: 96,
      }),
    ];

    if (warehouse) {
      counts = counts.filter(c => c.warehouse_id === warehouse);
    }

    return res(
      ctx.json({
        counts,
        total: counts.length,
      })
    );
  }),

  // Reports
  rest.get('/api/v1/inventory/report/:type', (req, res, ctx) => {
    const { type } = req.params;
    const date = req.url.searchParams.get('date');
    const warehouse = req.url.searchParams.get('warehouse');

    if (type === 'daily') {
      return res(
        ctx.json(testDataBuilders.createTestInventoryReport({
          report_type: 'daily_stock',
          report_date: date ? new Date(date) : new Date('2025-08-20'),
          warehouse_id: warehouse || 'WH_001',
        }))
      );
    }

    if (type === 'summary') {
      return res(
        ctx.json(testDataBuilders.createTestInventorySummary({
          summary_date: date ? new Date(date) : new Date('2025-08-20'),
        }))
      );
    }

    return res(ctx.status(404));
  }),

  // Stock valuation
  rest.get('/api/v1/inventory/valuation', (req, res, ctx) => {
    const method = req.url.searchParams.get('method') || 'fifo';
    const warehouse = req.url.searchParams.get('warehouse');

    const valuation = {
      method,
      warehouse_id: warehouse || 'all',
      total_value: 25000000,
      items: [
        { item_id: 'INV_001', name: '商品A', quantity: 500, unit_cost: 50, total_value: 25000 },
        { item_id: 'INV_002', name: '商品B', quantity: 450, unit_cost: 60, total_value: 27000 },
        { item_id: 'INV_003', name: '商品C', quantity: 400, unit_cost: 45, total_value: 18000 },
      ],
      valuation_date: new Date('2025-08-20'),
    };

    return res(ctx.json(valuation));
  }),

  // ABC analysis
  rest.get('/api/v1/inventory/abc-analysis', (req, res, ctx) => {
    const analysis = {
      analysis_date: new Date('2025-08-20'),
      categories: {
        A: {
          items: 150,
          value: 15000000,
          percentage: 60,
          items_list: [
            { item_id: 'INV_001', name: '商品A', annual_value: 3000000 },
            { item_id: 'INV_002', name: '商品B', annual_value: 2800000 },
          ],
        },
        B: {
          items: 300,
          value: 7500000,
          percentage: 30,
          items_list: [
            { item_id: 'INV_010', name: '商品J', annual_value: 800000 },
            { item_id: 'INV_011', name: '商品K', annual_value: 750000 },
          ],
        },
        C: {
          items: 1050,
          value: 2500000,
          percentage: 10,
          items_list: [
            { item_id: 'INV_100', name: '商品AA', annual_value: 50000 },
            { item_id: 'INV_101', name: '商品AB', annual_value: 45000 },
          ],
        },
      },
    };

    return res(ctx.json(analysis));
  }),

  // Export
  rest.post('/api/v1/inventory/export', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json({
        file_url: '/exports/inventory_20250820.xlsx',
        format: body.format || 'excel',
        record_count: 1500,
        created_at: new Date(),
      })
    );
  }),
];