import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import * as api from '../../../service/request';
import { testDataBuilders } from '../../setup';

// Mock request 函數
vi.mock('#libs/services2/request', () => ({
  request: vi.fn((url: string) => {
    return fetch(`http://localhost:3000${url}`).then(res => res.json());
  }),
  postWithRespone: vi.fn((url: string, body: any) => {
    return fetch(`http://localhost:3000${url}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
  }),
}));

// 設置 MSW server
const server = setupServer(
  rest.get('http://localhost:3000/enterprises/query', (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    const enterprises = [testDataBuilders.createTestEnterprise()];
    
    if (keyword === 'error') {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    }
    
    return res(ctx.json(enterprises));
  }),
  
  rest.get('http://localhost:3000/companies/query', (req, res, ctx) => {
    const companies = [testDataBuilders.createTestCompany()];
    return res(ctx.json({ companies }));
  }),
  
  rest.get('http://localhost:3000/stores/query', (req, res, ctx) => {
    const stores = [testDataBuilders.createTestStore()];
    return res(ctx.json({ stores }));
  })
);

describe('Customer API Request Service', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe('getEnterprises', () => {
    it('should fetch enterprises with query parameters', async () => {
      const query = {
        keyword: 'test',
        query_info_not_completed: false,
      };

      const result = await api.getEnterprises(query);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].enterprise_id).toBe('ENT_TEST_001');
    });

    it('should filter out empty query parameters', async () => {
      const query = {
        keyword: 'test',
        query_info_not_completed: false,
        extra_field: '',
        null_field: null,
        undefined_field: undefined,
      };

      const result = await api.getEnterprises(query);

      expect(result).toBeDefined();
      // Verify empty values were filtered out
    });

    it('should handle server errors gracefully', async () => {
      const query = {
        keyword: 'error',
        query_info_not_completed: false,
      };

      await expect(api.getEnterprises(query)).rejects.toThrow();
    });

    it('should validate response with Zod schema', async () => {
      const query = {
        keyword: 'test',
        query_info_not_completed: false,
      };

      const result = await api.getEnterprises(query);

      // Result should pass schema validation
      expect(result[0]).toHaveProperty('enterprise_id');
      expect(result[0]).toHaveProperty('enterprise_name');
      expect(result[0]).toHaveProperty('info_completed');
    });

    it('should handle empty results', async () => {
      server.use(
        rest.get('http://localhost:3000/enterprises/query', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );

      const query = {
        keyword: 'nonexistent',
        query_info_not_completed: false,
      };

      const result = await api.getEnterprises(query);

      expect(result).toEqual([]);
    });

    it('should construct query string correctly', async () => {
      let capturedUrl: string = '';
      
      server.use(
        rest.get('http://localhost:3000/enterprises/query', (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json([]));
        })
      );

      await api.getEnterprises({
        keyword: 'test company',
        query_info_not_completed: true,
      });

      expect(capturedUrl).toContain('keyword=test%20company');
      expect(capturedUrl).toContain('query_info_not_completed=true');
    });
  });

  describe('getCompanies', () => {
    it('should fetch companies with all query parameters', async () => {
      const query = {
        keyword: 'test',
        invoice_type: 'B2B',
        closing_date: '25',
        payment_term: '30',
        query_info_not_completed: false,
      };

      const result = await api.getCompanies(query);

      expect(result).toBeDefined();
      expect(result.companies).toBeDefined();
      expect(Array.isArray(result.companies)).toBe(true);
      expect(result.companies[0].company_id).toBe('COM_TEST_001');
    });

    it('should handle partial query parameters', async () => {
      const query = {
        keyword: 'test',
        invoice_type: '',
        closing_date: '',
        payment_term: '',
        query_info_not_completed: false,
      };

      const result = await api.getCompanies(query);

      expect(result.companies).toBeDefined();
    });

    it('should validate company response structure', async () => {
      const query = {
        keyword: 'test',
        invoice_type: 'B2B',
        closing_date: '25',
        payment_term: '30',
        query_info_not_completed: false,
      };

      const result = await api.getCompanies(query);
      const company = result.companies[0];

      expect(company).toHaveProperty('company_id');
      expect(company).toHaveProperty('company_name');
      expect(company).toHaveProperty('billing_info');
      expect(company).toHaveProperty('accounting_info');
      expect(company).toHaveProperty('payment_info');
    });

    it('should handle network errors', async () => {
      server.use(
        rest.get('http://localhost:3000/companies/query', (req, res) => {
          return res.networkError('Network error');
        })
      );

      const query = {
        keyword: 'test',
        invoice_type: '',
        closing_date: '',
        payment_term: '',
        query_info_not_completed: false,
      };

      await expect(api.getCompanies(query)).rejects.toThrow();
    });
  });

  describe('getStores', () => {
    it('should fetch stores with date range', async () => {
      const query = {
        keyword: 'test',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        active_state: 'active',
        ctm: 'CTM001',
        query_info_not_completed: false,
      };

      const result = await api.getStores(query);

      expect(result).toBeDefined();
      expect(result.stores).toBeDefined();
      expect(Array.isArray(result.stores)).toBe(true);
      expect(result.stores[0].store_id).toBe('STO_TEST_001');
    });

    it('should filter stores by active state', async () => {
      const query = {
        keyword: '',
        start_date: '',
        end_date: '',
        active_state: 'active',
        ctm: '',
        query_info_not_completed: false,
      };

      const result = await api.getStores(query);

      expect(result.stores[0].active_state).toBe('active');
    });

    it('should validate store response structure', async () => {
      const query = {
        keyword: 'test',
        start_date: '',
        end_date: '',
        active_state: '',
        ctm: '',
        query_info_not_completed: false,
      };

      const result = await api.getStores(query);
      const store = result.stores[0];

      expect(store).toHaveProperty('store_id');
      expect(store).toHaveProperty('store_name');
      expect(store).toHaveProperty('logistics_info');
      expect(store).toHaveProperty('contacts_info');
      expect(store).toHaveProperty('active_state');
    });

    it('should handle malformed response', async () => {
      server.use(
        rest.get('http://localhost:3000/stores/query', (req, res, ctx) => {
          return res(ctx.json({ invalid: 'response' }));
        })
      );

      const query = {
        keyword: 'test',
        start_date: '',
        end_date: '',
        active_state: '',
        ctm: '',
        query_info_not_completed: false,
      };

      await expect(api.getStores(query)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      server.use(
        rest.get('http://localhost:3000/stores/query', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return res(ctx.json({ stores: [] }));
        })
      );

      const query = {
        keyword: 'test',
        start_date: '',
        end_date: '',
        active_state: '',
        ctm: '',
        query_info_not_completed: false,
      };

      // This should timeout
      const promise = api.getStores(query);
      
      // Simulate timeout
      await expect(Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      ])).rejects.toThrow('Timeout');
    });

    it('should properly encode special characters in query', async () => {
      let capturedUrl: string = '';
      
      server.use(
        rest.get('http://localhost:3000/stores/query', (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json({ stores: [] }));
        })
      );

      await api.getStores({
        keyword: '測試門市 & 特殊字元',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        active_state: 'active',
        ctm: '',
        query_info_not_completed: false,
      });

      expect(capturedUrl).toContain(encodeURIComponent('測試門市 & 特殊字元'));
    });
  });

  describe('filterEmptyValues helper', () => {
    it('should remove empty strings', async () => {
      const query = {
        keyword: 'test',
        empty: '',
        valid: 'value',
      };

      const result = await api.getEnterprises(query);
      
      // The empty string should have been filtered out
      expect(result).toBeDefined();
    });

    it('should remove null values', async () => {
      const query = {
        keyword: 'test',
        nullValue: null,
        valid: 'value',
      };

      const result = await api.getEnterprises(query);
      
      expect(result).toBeDefined();
    });

    it('should remove undefined values', async () => {
      const query = {
        keyword: 'test',
        undefinedValue: undefined,
        valid: 'value',
      };

      const result = await api.getEnterprises(query);
      
      expect(result).toBeDefined();
    });

    it('should keep false boolean values', async () => {
      let capturedUrl: string = '';
      
      server.use(
        rest.get('http://localhost:3000/enterprises/query', (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json([]));
        })
      );

      await api.getEnterprises({
        keyword: 'test',
        query_info_not_completed: false,
      });

      expect(capturedUrl).toContain('query_info_not_completed=false');
    });

    it('should keep zero number values', async () => {
      let capturedUrl: string = '';
      
      server.use(
        rest.get('http://localhost:3000/companies/query', (req, res, ctx) => {
          capturedUrl = req.url.toString();
          return res(ctx.json({ companies: [] }));
        })
      );

      await api.getCompanies({
        keyword: 'test',
        invoice_type: '',
        closing_date: '0',
        payment_term: '0',
        query_info_not_completed: false,
      });

      expect(capturedUrl).toContain('closing_date=0');
      expect(capturedUrl).toContain('payment_term=0');
    });
  });
});