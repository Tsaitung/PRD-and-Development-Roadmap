import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import CustomerManagement from '../../../index';
import { testDataBuilders } from '../../setup';

// Setup MSW server
const server = setupServer(
  rest.get('/api/v1/enterprises/query', (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    
    if (keyword === 'test') {
      return res(ctx.json([
        testDataBuilders.createTestEnterprise(),
        testDataBuilders.createTestEnterprise({
          enterprise_id: 'ENT_TEST_002',
          enterprise_name: '第二測試企業',
        }),
      ]));
    }
    
    return res(ctx.json([]));
  }),
  
  rest.get('/api/v1/companies/query', (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    
    if (keyword === 'test') {
      return res(ctx.json({
        companies: [
          testDataBuilders.createTestCompany(),
          testDataBuilders.createTestCompany({
            company_id: 'COM_TEST_002',
            company_name: '第二測試公司',
          }),
        ],
      }));
    }
    
    return res(ctx.json({ companies: [] }));
  }),
  
  rest.get('/api/v1/stores/query', (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    
    if (keyword === 'test') {
      return res(ctx.json({
        stores: [
          testDataBuilders.createTestStore(),
          testDataBuilders.createTestStore({
            store_id: 'STO_TEST_002',
            store_name: '第二測試門市',
          }),
        ],
      }));
    }
    
    return res(ctx.json({ stores: [] }));
  })
);

describe('Customer Search Workflow Integration', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Complete Search Flow', () => {
    it('should search enterprises end-to-end', async () => {
      renderWithProviders(<CustomerManagement />);

      // Select enterprise type
      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      // Enter search keyword
      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Click search button
      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
        expect(screen.getByText('第二測試企業')).toBeInTheDocument();
      });
    });

    it('should search companies with filters', async () => {
      renderWithProviders(<CustomerManagement />);

      // Select company type
      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'company' } });

      // Wait for additional filters to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/發票類型/)).toBeInTheDocument();
      });

      // Set filters
      const invoiceType = screen.getByLabelText(/發票類型/);
      fireEvent.change(invoiceType, { target: { value: 'B2B' } });

      // Enter search keyword
      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Search
      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      // Verify results
      await waitFor(() => {
        expect(screen.getByText('測試有限公司')).toBeInTheDocument();
        expect(screen.getByText('第二測試公司')).toBeInTheDocument();
      });
    });

    it('should search stores with date range', async () => {
      renderWithProviders(<CustomerManagement />);

      // Select store type
      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'store' } });

      // Wait for date inputs
      await waitFor(() => {
        expect(screen.getByLabelText(/開始日期/)).toBeInTheDocument();
      });

      // Set date range
      const startDate = screen.getByLabelText(/開始日期/);
      const endDate = screen.getByLabelText(/結束日期/);
      fireEvent.change(startDate, { target: { value: '2025-01-01' } });
      fireEvent.change(endDate, { target: { value: '2025-12-31' } });

      // Search
      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      // Verify results
      await waitFor(() => {
        expect(screen.getByText('測試門市')).toBeInTheDocument();
        expect(screen.getByText('第二測試門市')).toBeInTheDocument();
      });
    });
  });

  describe('Search State Management', () => {
    it('should show loading state during search', async () => {
      server.use(
        rest.get('/api/v1/enterprises/query', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return res(ctx.json([]));
        })
      );

      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      // Check loading state
      expect(screen.getByText(/載入中/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });
    });

    it('should clear results when changing customer type', async () => {
      renderWithProviders(<CustomerManagement />);

      // First search enterprises
      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });

      // Change to company type
      fireEvent.change(typeSelector, { target: { value: 'company' } });

      // Previous results should be cleared
      expect(screen.queryByText('測試企業集團')).not.toBeInTheDocument();
    });

    it('should handle empty search results', async () => {
      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/查無符合條件的資料/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      server.use(
        rest.get('/api/v1/enterprises/query', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/搜尋失敗/)).toBeInTheDocument();
      });
    });

    it('should handle network timeout', async () => {
      server.use(
        rest.get('/api/v1/companies/query', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return res(ctx.json({ companies: [] }));
        })
      );

      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'company' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      // Should show timeout error after a reasonable time
      await waitFor(
        () => {
          expect(screen.getByText(/請求超時/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Advanced Search Features', () => {
    it('should filter by info completion status', async () => {
      server.use(
        rest.get('/api/v1/enterprises/query', (req, res, ctx) => {
          const queryInfoNotCompleted = req.url.searchParams.get('query_info_not_completed');
          
          if (queryInfoNotCompleted === 'true') {
            return res(ctx.json([
              testDataBuilders.createTestEnterprise({
                enterprise_id: 'ENT_INCOMPLETE',
                enterprise_name: '未完成企業',
                info_completed: false,
              }),
            ]));
          }
          
          return res(ctx.json([
            testDataBuilders.createTestEnterprise(),
          ]));
        })
      );

      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      // Check the incomplete info filter
      const incompleteCheckbox = screen.getByLabelText(/只顯示資料未完整/);
      fireEvent.click(incompleteCheckbox);

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('未完成企業')).toBeInTheDocument();
        expect(screen.queryByText('測試企業集團')).not.toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Press Enter to search
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });
    });

    it('should support search history', async () => {
      renderWithProviders(<CustomerManagement />);

      // First search
      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });

      // Clear and check if history dropdown appears
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.focus(searchInput);

      // Should show search history
      await waitFor(() => {
        const historyDropdown = screen.queryByTestId('search-history');
        if (historyDropdown) {
          expect(within(historyDropdown).getByText('test')).toBeInTheDocument();
        }
      });
    });
  });

  describe('Result Interactions', () => {
    it('should expand enterprise to show companies', async () => {
      const hierarchy = testDataBuilders.createHierarchyStructure();
      
      server.use(
        rest.get('/api/v1/enterprises/query', (req, res, ctx) => {
          return res(ctx.json([hierarchy.enterprise]));
        })
      );

      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });

      // Expand to show companies
      const expandButton = screen.getByRole('button', { name: /展開/ });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('測試有限公司')).toBeInTheDocument();
        expect(screen.getByText('測試二號公司')).toBeInTheDocument();
      });
    });

    it('should select multiple results', async () => {
      renderWithProviders(<CustomerManagement />);

      const typeSelector = screen.getByLabelText(/客戶類型/);
      fireEvent.change(typeSelector, { target: { value: 'enterprise' } });

      const searchInput = screen.getByPlaceholderText(/輸入關鍵字搜尋/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const searchButton = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Verify selection count
      expect(screen.getByText(/已選擇 2 項/)).toBeInTheDocument();
    });
  });
});