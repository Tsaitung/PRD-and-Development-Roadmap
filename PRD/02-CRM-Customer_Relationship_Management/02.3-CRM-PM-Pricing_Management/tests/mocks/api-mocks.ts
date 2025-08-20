import { rest } from 'msw';
import { testDataBuilders } from '../setup';

const API_BASE = '/api/v1';

// 價格管理 API Mocks
export const pricingApiHandlers = [
  // 搜尋價格
  rest.get(`${API_BASE}/pricing/search`, (req, res, ctx) => {
    const customerId = req.url.searchParams.get('customer_id');
    const productId = req.url.searchParams.get('product_id');
    const effectiveDate = req.url.searchParams.get('effective_date');
    const priceType = req.url.searchParams.get('price_type');

    const prices = [
      testDataBuilders.createTestPriceTable(),
      testDataBuilders.createTestPriceTable({
        price_id: 'PRC_TEST_002',
        product_id: 'PROD_TEST_002',
        product_name: '測試商品B',
        price: 200,
      }),
    ];

    let filtered = prices;

    if (customerId) {
      filtered = filtered.filter(p => p.customer_id === customerId);
    }

    if (productId) {
      filtered = filtered.filter(p => p.product_id === productId);
    }

    if (priceType) {
      filtered = filtered.filter(p => p.price_type === priceType);
    }

    return res(ctx.json({
      prices: filtered,
      total: filtered.length,
    }));
  }),

  // 取得價格詳情
  rest.get(`${API_BASE}/pricing/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'PRC_TEST_001') {
      return res(ctx.json(testDataBuilders.createTestPriceTable()));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Price not found' }));
  }),

  // 新增價格
  rest.post(`${API_BASE}/pricing`, async (req, res, ctx) => {
    const body = await req.json();
    
    if (!body.customer_id || !body.items) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing required fields' })
      );
    }

    const created = body.items.map((item: any, index: number) => ({
      ...item,
      price_id: `PRC_NEW_${Date.now()}_${index}`,
      created_at: new Date().toISOString(),
    }));

    return res(ctx.status(201), ctx.json({
      success: true,
      data: {
        created: created.length,
        prices: created,
      },
    }));
  }),

  // 更新價格
  rest.put(`${API_BASE}/pricing/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    const updated = {
      ...body,
      price_id: id,
      updated_at: new Date().toISOString(),
    };

    return res(ctx.json(updated));
  }),

  // 批量設定價格
  rest.post(`${API_BASE}/pricing/bulk`, async (req, res, ctx) => {
    const body = await req.json();

    if (!body.prices || !Array.isArray(body.prices)) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Invalid bulk data' })
      );
    }

    return res(ctx.json({
      success: true,
      data: {
        created: body.prices.length,
        updated: 0,
        failed: 0,
        errors: [],
      },
    }));
  }),

  // 時價回填
  rest.post(`${API_BASE}/pricing/reprice`, async (req, res, ctx) => {
    const body = await req.json();

    const results = {
      processed: body.items?.length || 0,
      updated: body.items?.length || 0,
      failed: 0,
      orders_affected: Math.floor(Math.random() * 100),
    };

    return res(ctx.json({
      success: true,
      data: results,
    }));
  }),

  // 價格歷史
  rest.get(`${API_BASE}/pricing/history`, (req, res, ctx) => {
    const priceId = req.url.searchParams.get('price_id');
    const startDate = req.url.searchParams.get('start_date');
    const endDate = req.url.searchParams.get('end_date');

    const history = [
      testDataBuilders.createTestPriceHistory(),
      testDataBuilders.createTestPriceHistory({
        history_id: 'HIST_TEST_002',
        old_price: 110,
        new_price: 105,
        change_reason: '促銷活動',
        changed_at: new Date('2025-08-10'),
      }),
    ];

    return res(ctx.json({
      history: history,
      total: history.length,
    }));
  }),

  // 價格審批
  rest.post(`${API_BASE}/pricing/approval`, async (req, res, ctx) => {
    const body = await req.json();

    const approval = {
      ...testDataBuilders.createTestPriceApproval(),
      ...body,
      approval_id: `APR_${Date.now()}`,
      requested_at: new Date().toISOString(),
    };

    return res(ctx.status(201), ctx.json(approval));
  }),

  // 審批價格變更
  rest.put(`${API_BASE}/pricing/approval/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    if (!['approved', 'rejected'].includes(body.action)) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Invalid action' })
      );
    }

    return res(ctx.json({
      approval_id: id,
      status: body.action,
      approved_by: body.user_id,
      approved_at: new Date().toISOString(),
      comments: body.comments,
    }));
  }),

  // 價格規則
  rest.get(`${API_BASE}/pricing/rules`, (req, res, ctx) => {
    const active = req.url.searchParams.get('active');

    const rules = [
      testDataBuilders.createTestPricingRule(),
      testDataBuilders.createTestPricingRule({
        rule_id: 'RULE_TEST_002',
        rule_name: '季節性折扣',
        rule_type: 'seasonal_discount',
      }),
    ];

    let filtered = rules;
    if (active === 'true') {
      filtered = filtered.filter(r => r.active);
    }

    return res(ctx.json({
      rules: filtered,
      total: filtered.length,
    }));
  }),

  // 批量匯入價格
  rest.post(`${API_BASE}/pricing/import`, async (req, res, ctx) => {
    const formData = await req.body;
    
    // Simulate file processing
    const importResult = testDataBuilders.createTestBatchImport();
    
    return res(ctx.json({
      success: true,
      import_id: importResult.import_id,
      total_records: importResult.total_records,
      valid: importResult.total_records,
      invalid: 0,
      errors: [],
    }));
  }),

  // 價格計算
  rest.post(`${API_BASE}/pricing/calculate`, async (req, res, ctx) => {
    const body = await req.json();

    const calculations = body.items.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      base_price: 100,
      customer_price: 95,
      discount_applied: 5,
      final_price: 95 * item.quantity,
      applied_rules: ['RULE_TEST_001'],
    }));

    return res(ctx.json({
      calculations: calculations,
      total_amount: calculations.reduce((sum: number, c: any) => sum + c.final_price, 0),
    }));
  }),

  // 市場價格更新
  rest.get(`${API_BASE}/pricing/market-prices`, (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    const status = req.url.searchParams.get('status');

    const marketPrices = [
      testDataBuilders.createTestMarketPriceItem(),
      testDataBuilders.createTestMarketPriceItem({
        item_id: 'MKT_TEST_002',
        product_id: 'PROD_MKT_002',
        product_name: '時價商品B',
        market_price: 200,
        status: 'confirmed',
      }),
    ];

    let filtered = marketPrices;
    if (status) {
      filtered = filtered.filter(m => m.status === status);
    }

    return res(ctx.json({
      market_prices: filtered,
      total: filtered.length,
    }));
  }),

  // 價格比較
  rest.get(`${API_BASE}/pricing/compare`, (req, res, ctx) => {
    const productId = req.url.searchParams.get('product_id');
    const customerIds = req.url.searchParams.getAll('customer_ids');

    const comparisons = customerIds.map(customerId => ({
      customer_id: customerId,
      customer_name: `客戶${customerId}`,
      product_id: productId,
      product_name: '測試商品',
      price: Math.floor(Math.random() * 50) + 80,
      discount_rate: Math.random() * 0.2 + 0.8,
      effective_date: '2025-01-01',
    }));

    return res(ctx.json({
      comparisons: comparisons,
      min_price: Math.min(...comparisons.map(c => c.price)),
      max_price: Math.max(...comparisons.map(c => c.price)),
      avg_price: comparisons.reduce((sum, c) => sum + c.price, 0) / comparisons.length,
    }));
  }),
];

// 錯誤場景處理
export const pricingErrorHandlers = [
  // 價格衝突
  rest.post(`${API_BASE}/pricing`, (req, res, ctx) => {
    return res(
      ctx.status(409),
      ctx.json({ 
        error: 'Price conflict',
        conflicts: [
          {
            customer_id: 'CUS_001',
            product_id: 'PROD_001',
            existing_price: 100,
            new_price: 110,
          },
        ],
      })
    );
  }),

  // 審批權限不足
  rest.put(`${API_BASE}/pricing/approval/:id`, (req, res, ctx) => {
    return res(
      ctx.status(403),
      ctx.json({ error: 'Insufficient permission for approval' })
    );
  }),

  // 匯入檔案格式錯誤
  rest.post(`${API_BASE}/pricing/import`, (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({ 
        error: 'Invalid file format',
        details: 'Expected Excel file with .xlsx extension',
      })
    );
  }),
];