import { rest } from 'msw';
import { testDataBuilders } from '../setup';

const API_BASE = '/api/v1';

// 客戶管理 API Mocks
export const customerApiHandlers = [
  // 搜尋企業
  rest.get(`${API_BASE}/enterprises/query`, (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    const queryInfoNotCompleted = req.url.searchParams.get('query_info_not_completed');

    const enterprises = [
      testDataBuilders.createTestEnterprise(),
      testDataBuilders.createTestEnterprise({
        enterprise_id: 'ENT_TEST_002',
        enterprise_name: '第二測試企業',
        info_completed: false,
      }),
    ];

    let filtered = enterprises;

    if (keyword) {
      filtered = filtered.filter(e => 
        e.enterprise_name.includes(keyword) ||
        e.enterprise_id.includes(keyword)
      );
    }

    if (queryInfoNotCompleted === 'true') {
      filtered = filtered.filter(e => !e.info_completed);
    }

    return res(ctx.json(filtered));
  }),

  // 搜尋公司
  rest.get(`${API_BASE}/companies/query`, (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    const invoiceType = req.url.searchParams.get('invoice_type');
    const closingDate = req.url.searchParams.get('closing_date');
    const paymentTerm = req.url.searchParams.get('payment_term');

    const companies = [
      testDataBuilders.createTestCompany(),
      testDataBuilders.createTestCompany({
        company_id: 'COM_TEST_002',
        company_name: '第二測試公司',
      }),
    ];

    let filtered = companies;

    if (keyword) {
      filtered = filtered.filter(c => 
        c.company_name.includes(keyword) ||
        c.company_id.includes(keyword) ||
        c.unicode?.includes(keyword)
      );
    }

    if (invoiceType) {
      filtered = filtered.filter(c => 
        c.billing_info?.invoice_type === invoiceType
      );
    }

    if (closingDate) {
      filtered = filtered.filter(c => 
        c.billing_info?.closing_date === parseInt(closingDate)
      );
    }

    if (paymentTerm) {
      filtered = filtered.filter(c => 
        c.accounting_info?.payment_term === parseInt(paymentTerm)
      );
    }

    return res(ctx.json({ companies: filtered }));
  }),

  // 搜尋門市
  rest.get(`${API_BASE}/stores/query`, (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    const startDate = req.url.searchParams.get('start_date');
    const endDate = req.url.searchParams.get('end_date');
    const activeState = req.url.searchParams.get('active_state');

    const stores = [
      testDataBuilders.createTestStore(),
      testDataBuilders.createTestStore({
        store_id: 'STO_TEST_002',
        store_name: '第二測試門市',
        active_state: 'inactive',
      }),
    ];

    let filtered = stores;

    if (keyword) {
      filtered = filtered.filter(s => 
        s.store_name.includes(keyword) ||
        s.store_id.includes(keyword) ||
        s.store_phone?.includes(keyword)
      );
    }

    if (activeState) {
      filtered = filtered.filter(s => s.active_state === activeState);
    }

    return res(ctx.json({ stores: filtered }));
  }),

  // 取得企業詳情
  rest.get(`${API_BASE}/customers/enterprise/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'ENT_TEST_001') {
      const hierarchy = testDataBuilders.createHierarchyStructure();
      return res(ctx.json(hierarchy.enterprise));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Enterprise not found' }));
  }),

  // 取得公司詳情
  rest.get(`${API_BASE}/customers/company/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'COM_TEST_001') {
      return res(ctx.json(testDataBuilders.createTestCompany()));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Company not found' }));
  }),

  // 取得門市詳情
  rest.get(`${API_BASE}/customers/store/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'STO_TEST_001') {
      return res(ctx.json(testDataBuilders.createTestStore()));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Store not found' }));
  }),

  // 新增客戶
  rest.post(`${API_BASE}/customers`, async (req, res, ctx) => {
    const body = await req.json();
    
    if (!body.customer_type || !body.customer_name) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing required fields' })
      );
    }

    const newCustomer = {
      ...body,
      customer_id: `${body.customer_type.toUpperCase()}_NEW_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return res(ctx.status(201), ctx.json(newCustomer));
  }),

  // 更新客戶
  rest.put(`${API_BASE}/customers/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    if (!id) {
      return res(ctx.status(400), ctx.json({ error: 'Invalid customer ID' }));
    }

    const updatedCustomer = {
      ...body,
      customer_id: id,
      updated_at: new Date().toISOString(),
    };

    return res(ctx.json(updatedCustomer));
  }),

  // 刪除客戶
  rest.delete(`${API_BASE}/customers/:id`, (req, res, ctx) => {
    const { id } = req.params;

    if (!id) {
      return res(ctx.status(400), ctx.json({ error: 'Invalid customer ID' }));
    }

    return res(ctx.json({ success: true, deleted_id: id }));
  }),

  // 取得階層關係
  rest.get(`${API_BASE}/customers/:id/hierarchy`, (req, res, ctx) => {
    const { id } = req.params;

    if (id === 'ENT_TEST_001') {
      const hierarchy = testDataBuilders.createHierarchyStructure();
      return res(ctx.json({
        enterprise: hierarchy.enterprise,
        companies: hierarchy.companies,
        stores: hierarchy.stores,
        total_companies: hierarchy.companies.length,
        total_stores: hierarchy.stores.length,
      }));
    }

    return res(ctx.status(404), ctx.json({ error: 'Customer not found' }));
  }),

  // 批量匯入客戶
  rest.post(`${API_BASE}/customers/batch-import`, async (req, res, ctx) => {
    const body = await req.json();

    if (!body.customers || !Array.isArray(body.customers)) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Invalid import data' })
      );
    }

    const results = {
      success: body.customers.length,
      failed: 0,
      errors: [],
      imported: body.customers.map((c, index) => ({
        ...c,
        customer_id: `IMPORT_${Date.now()}_${index}`,
        created_at: new Date().toISOString(),
      })),
    };

    return res(ctx.json(results));
  }),

  // 檢查統編重複
  rest.get(`${API_BASE}/customers/check-tax-id/:taxId`, (req, res, ctx) => {
    const { taxId } = req.params;

    // 模擬已存在的統編
    const existingTaxIds = ['12345678', '87654321'];

    if (existingTaxIds.includes(taxId as string)) {
      return res(ctx.json({ 
        exists: true, 
        customer: {
          customer_id: 'COM_EXISTING',
          customer_name: '已存在的公司',
          tax_id: taxId,
        }
      }));
    }

    return res(ctx.json({ exists: false }));
  }),

  // 取得客戶統計
  rest.get(`${API_BASE}/customers/statistics`, (req, res, ctx) => {
    return res(ctx.json({
      total_enterprises: 10,
      total_companies: 50,
      total_stores: 200,
      active_stores: 180,
      inactive_stores: 20,
      complete_info_rate: 0.85,
      monthly_growth: 0.05,
    }));
  }),
];

// 錯誤場景處理
export const customerErrorHandlers = [
  // 模擬網路錯誤
  rest.get(`${API_BASE}/enterprises/query`, (req, res) => {
    return res.networkError('Network error');
  }),

  // 模擬伺服器錯誤
  rest.get(`${API_BASE}/companies/query`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),

  // 模擬認證錯誤
  rest.get(`${API_BASE}/stores/query`, (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({ error: 'Unauthorized' })
    );
  }),
];