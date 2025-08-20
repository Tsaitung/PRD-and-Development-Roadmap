import { rest } from 'msw';
import { testDataBuilders } from '../setup';

const API_BASE = '/api/v1';

// 訂單管理 API Mocks
export const orderApiHandlers = [
  // 搜尋訂單
  rest.get(`${API_BASE}/orders`, (req, res, ctx) => {
    const dateFrom = req.url.searchParams.get('date_from');
    const dateTo = req.url.searchParams.get('date_to');
    const customerId = req.url.searchParams.get('customer_id');
    const status = req.url.searchParams.get('status');
    const keyword = req.url.searchParams.get('keyword');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '20');

    const orders = testDataBuilders.createTestBatchOrders(50);
    
    let filtered = orders;

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    if (customerId) {
      filtered = filtered.filter(o => o.customer_id === customerId);
    }

    if (keyword) {
      filtered = filtered.filter(o => 
        o.order_number.includes(keyword) ||
        o.customer_name.includes(keyword)
      );
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedOrders = filtered.slice(start, end);

    return res(ctx.json({
      orders: paginatedOrders,
      total: filtered.length,
      page,
      limit,
      total_pages: Math.ceil(filtered.length / limit),
    }));
  }),

  // 取得訂單詳情
  rest.get(`${API_BASE}/orders/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'ORD_TEST_001') {
      return res(ctx.json(testDataBuilders.createTestOrderWithItems()));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Order not found' }));
  }),

  // 新增訂單
  rest.post(`${API_BASE}/orders`, async (req, res, ctx) => {
    const body = await req.json();
    
    if (!body.customer_id || !body.items || body.items.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing required fields' })
      );
    }

    const newOrder = {
      ...testDataBuilders.createTestOrder(),
      ...body,
      order_id: `ORD_NEW_${Date.now()}`,
      order_number: `SO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      created_at: new Date().toISOString(),
    };

    return res(ctx.status(201), ctx.json(newOrder));
  }),

  // 更新訂單
  rest.put(`${API_BASE}/orders/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    const updatedOrder = {
      ...body,
      order_id: id,
      updated_at: new Date().toISOString(),
    };

    return res(ctx.json(updatedOrder));
  }),

  // 刪除訂單
  rest.delete(`${API_BASE}/orders/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    return res(ctx.json({ 
      success: true, 
      deleted_id: id,
      message: '訂單已刪除',
    }));
  }),

  // 更新訂單狀態
  rest.patch(`${API_BASE}/orders/:id/status`, async (req, res, ctx) => {
    const { id } = req.params;
    const { status, reason } = await req.json();

    if (!['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'].includes(status)) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Invalid status' })
      );
    }

    return res(ctx.json({
      order_id: id,
      status,
      updated_at: new Date().toISOString(),
      updated_by: 'USER_001',
      reason,
    }));
  }),

  // 批量更新訂單狀態
  rest.post(`${API_BASE}/orders/batch/status`, async (req, res, ctx) => {
    const { order_ids, status } = await req.json();

    if (!order_ids || order_ids.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'No orders selected' })
      );
    }

    return res(ctx.json({
      success: true,
      updated: order_ids.length,
      failed: 0,
      results: order_ids.map((id: string) => ({
        order_id: id,
        status: 'success',
        new_status: status,
      })),
    }));
  }),

  // 複製訂單
  rest.post(`${API_BASE}/orders/:id/duplicate`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    const originalOrder = testDataBuilders.createTestOrderWithItems();
    const duplicatedOrder = {
      ...originalOrder,
      order_id: `ORD_DUP_${Date.now()}`,
      order_number: `SO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-DUP`,
      delivery_date: body.delivery_date || originalOrder.delivery_date,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    return res(ctx.status(201), ctx.json(duplicatedOrder));
  }),

  // 訂單歷史記錄
  rest.get(`${API_BASE}/orders/:id/history`, (req, res, ctx) => {
    const { id } = req.params;

    const history = [
      testDataBuilders.createTestOrderHistory({ order_id: id }),
      testDataBuilders.createTestOrderHistory({
        history_id: 'HIST_TEST_002',
        order_id: id,
        action: 'item_update',
        changed_at: new Date('2025-08-20T10:00:00'),
        comments: '更新商品數量',
      }),
    ];

    return res(ctx.json({
      history,
      total: history.length,
    }));
  }),

  // 訂單統計
  rest.get(`${API_BASE}/orders/summary`, (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    const period = req.url.searchParams.get('period') || 'daily';

    const summary = testDataBuilders.createTestOrderSummary({
      summary_date: date ? new Date(date) : new Date(),
    });

    return res(ctx.json(summary));
  }),

  // 訂單照片
  rest.get(`${API_BASE}/orders/:id/pictures`, (req, res, ctx) => {
    const { id } = req.params;

    const pictures = [
      testDataBuilders.createTestOrderPicture({ order_id: id }),
      testDataBuilders.createTestOrderPicture({
        picture_id: 'PIC_TEST_002',
        order_id: id,
        type: 'completed',
        caption: '完成照片',
      }),
    ];

    return res(ctx.json({
      pictures,
      total: pictures.length,
    }));
  }),

  // 上傳訂單照片
  rest.post(`${API_BASE}/orders/:id/pictures`, async (req, res, ctx) => {
    const { id } = req.params;
    
    const newPicture = {
      picture_id: `PIC_NEW_${Date.now()}`,
      order_id: id,
      type: 'processing',
      url: 'https://storage.example.com/orders/new_pic.jpg',
      thumbnail_url: 'https://storage.example.com/orders/new_pic_thumb.jpg',
      uploaded_at: new Date().toISOString(),
    };

    return res(ctx.status(201), ctx.json(newPicture));
  }),

  // 匯出訂單
  rest.post(`${API_BASE}/orders/export`, async (req, res, ctx) => {
    const body = await req.json();

    return res(ctx.json({
      success: true,
      export_id: `EXP_${Date.now()}`,
      file_url: '/exports/orders_export.xlsx',
      format: body.format || 'excel',
      record_count: body.order_ids?.length || 0,
    }));
  }),

  // 列印訂單
  rest.post(`${API_BASE}/orders/print`, async (req, res, ctx) => {
    const body = await req.json();

    return res(ctx.json({
      success: true,
      print_job_id: `PRINT_${Date.now()}`,
      pdf_url: '/prints/orders_print.pdf',
      page_count: Math.ceil((body.order_ids?.length || 1) / 3),
    }));
  }),

  // 退貨訂單
  rest.post(`${API_BASE}/orders/:id/return`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    const returnOrder = testDataBuilders.createTestReturnOrder({
      original_order_id: id,
      ...body,
    });

    return res(ctx.status(201), ctx.json(returnOrder));
  }),

  // 訂單商品庫存檢查
  rest.post(`${API_BASE}/orders/check-stock`, async (req, res, ctx) => {
    const { items } = await req.json();

    const stockStatus = items.map((item: any) => ({
      product_id: item.product_id,
      requested_quantity: item.quantity,
      available_quantity: Math.floor(Math.random() * 100) + 50,
      in_stock: true,
      reserved_quantity: 0,
    }));

    return res(ctx.json({
      all_available: stockStatus.every((s: any) => s.in_stock),
      stock_status: stockStatus,
    }));
  }),

  // 計算訂單金額
  rest.post(`${API_BASE}/orders/calculate`, async (req, res, ctx) => {
    const { items, customer_id, delivery_date } = await req.json();

    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const tax = subtotal * 0.05;
    const discount = customer_id ? subtotal * 0.02 : 0;
    const shipping_fee = 100;
    const total = subtotal + tax - discount + shipping_fee;

    return res(ctx.json({
      subtotal,
      tax,
      discount,
      shipping_fee,
      total,
      currency: 'TWD',
    }));
  }),
];

// 錯誤場景處理
export const orderErrorHandlers = [
  // 訂單衝突
  rest.post(`${API_BASE}/orders`, (req, res, ctx) => {
    return res(
      ctx.status(409),
      ctx.json({ 
        error: 'Duplicate order',
        message: '相同客戶在同一天已有類似訂單',
      })
    );
  }),

  // 庫存不足
  rest.post(`${API_BASE}/orders/check-stock`, (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({ 
        error: 'Insufficient stock',
        items: [
          { product_id: 'PROD_001', available: 5, requested: 10 },
        ],
      })
    );
  }),

  // 訂單無法取消
  rest.patch(`${API_BASE}/orders/:id/status`, (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({ 
        error: 'Cannot change status',
        message: '訂單已出貨，無法取消',
      })
    );
  }),
];