import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import HierarchyManagement from '../../../components/HierarchyManagement';
import { testDataBuilders } from '../../setup';

const server = setupServer(
  rest.get('/api/v1/customers/:id/hierarchy', (req, res, ctx) => {
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
    
    return res(ctx.status(404));
  }),
  
  rest.post('/api/v1/customers/:parentId/add-child', async (req, res, ctx) => {
    const body = await req.json();
    const newChild = {
      ...body,
      id: `NEW_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    return res(ctx.json(newChild));
  }),
  
  rest.put('/api/v1/customers/:id/move', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.json({ success: true, new_parent_id: body.new_parent_id }));
  })
);

describe('Customer Hierarchy Management', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Hierarchy Display', () => {
    it('should display three-tier hierarchy', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });
      
      expect(screen.getByText('測試有限公司')).toBeInTheDocument();
      expect(screen.getByText('測試二號公司')).toBeInTheDocument();
      
      const firstCompany = screen.getByTestId('company-COM_TEST_001');
      const expandBtn = within(firstCompany).getByRole('button', { name: /展開/ });
      fireEvent.click(expandBtn);
      
      await waitFor(() => {
        expect(screen.getByText('測試門市')).toBeInTheDocument();
        expect(screen.getByText('測試二號門市')).toBeInTheDocument();
      });
    });

    it('should show hierarchy statistics', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText(/下轄公司: 2/)).toBeInTheDocument();
        expect(screen.getByText(/總門市數: 4/)).toBeInTheDocument();
      });
    });

    it('should handle empty hierarchy', async () => {
      server.use(
        rest.get('/api/v1/customers/:id/hierarchy', (req, res, ctx) => {
          return res(ctx.json({
            enterprise: testDataBuilders.createTestEnterprise(),
            companies: [],
            stores: [],
            total_companies: 0,
            total_stores: 0,
          }));
        })
      );
      
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText(/尚無下轄公司/)).toBeInTheDocument();
      });
    });
  });

  describe('Add Child Operations', () => {
    it('should add company to enterprise', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      });
      
      const addBtn = screen.getByRole('button', { name: /新增公司/ });
      fireEvent.click(addBtn);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText(/公司名稱/);
      const taxIdInput = screen.getByLabelText(/統一編號/);
      
      fireEvent.change(nameInput, { target: { value: '新測試公司' } });
      fireEvent.change(taxIdInput, { target: { value: '98765432' } });
      
      const submitBtn = screen.getByRole('button', { name: /確認新增/ });
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/新增成功/)).toBeInTheDocument();
      });
    });

    it('should add store to company', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試有限公司')).toBeInTheDocument();
      });
      
      const company = screen.getByTestId('company-COM_TEST_001');
      const addStoreBtn = within(company).getByRole('button', { name: /新增門市/ });
      fireEvent.click(addStoreBtn);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText(/門市名稱/);
      fireEvent.change(nameInput, { target: { value: '新測試門市' } });
      
      const submitBtn = screen.getByRole('button', { name: /確認新增/ });
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/新增成功/)).toBeInTheDocument();
      });
    });
  });

  describe('Move Operations', () => {
    it('should move store between companies', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試門市')).toBeInTheDocument();
      });
      
      const store = screen.getByTestId('store-STO_TEST_001');
      const moveBtn = within(store).getByRole('button', { name: /移動/ });
      fireEvent.click(moveBtn);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const targetSelect = screen.getByLabelText(/目標公司/);
      fireEvent.change(targetSelect, { target: { value: 'COM_TEST_002' } });
      
      const confirmBtn = screen.getByRole('button', { name: /確認移動/ });
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/移動成功/)).toBeInTheDocument();
      });
    });

    it('should prevent invalid moves', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試有限公司')).toBeInTheDocument();
      });
      
      const company = screen.getByTestId('company-COM_TEST_001');
      const moveBtn = within(company).getByRole('button', { name: /移動/ });
      fireEvent.click(moveBtn);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText(/無法移動：此公司下還有門市/)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should support bulk selection', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試有限公司')).toBeInTheDocument();
      });
      
      const selectAll = screen.getByRole('checkbox', { name: /全選/ });
      fireEvent.click(selectAll);
      
      const selectedCount = screen.getByText(/已選擇: \d+/);
      expect(selectedCount).toBeInTheDocument();
    });

    it('should bulk move stores', async () => {
      renderWithProviders(<HierarchyManagement enterpriseId="ENT_TEST_001" />);
      
      await waitFor(() => {
        expect(screen.getByText('測試門市')).toBeInTheDocument();
      });
      
      const store1 = screen.getByTestId('select-STO_TEST_001');
      const store2 = screen.getByTestId('select-STO_TEST_002');
      
      fireEvent.click(store1);
      fireEvent.click(store2);
      
      const bulkMoveBtn = screen.getByRole('button', { name: /批量移動/ });
      fireEvent.click(bulkMoveBtn);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const targetSelect = screen.getByLabelText(/目標公司/);
      fireEvent.change(targetSelect, { target: { value: 'COM_TEST_002' } });
      
      const confirmBtn = screen.getByRole('button', { name: /確認批量移動/ });
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/批量移動成功: 2筆/)).toBeInTheDocument();
      });
    });
  });
});