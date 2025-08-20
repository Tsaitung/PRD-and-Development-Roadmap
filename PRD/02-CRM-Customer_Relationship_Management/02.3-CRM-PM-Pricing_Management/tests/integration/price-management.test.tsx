import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import PriceManagement from '../../../pages/PriceManagement';
import { pricingApiHandlers } from '../mocks/api-mocks';
import { testDataBuilders } from '../setup';

const server = setupServer(...pricingApiHandlers);

describe('Price Management Integration', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Price Search and Display', () => {
    it('should search and display prices', async () => {
      renderWithProviders(<PriceManagement />);

      // Select customer
      const customerSelect = screen.getByLabelText(/選擇客戶/);
      fireEvent.change(customerSelect, { target: { value: 'CUS_TEST_001' } });

      // Click search
      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should filter by product', async () => {
      renderWithProviders(<PriceManagement />);

      // Enter product search
      const productInput = screen.getByPlaceholderText(/輸入商品名稱或代碼/);
      fireEvent.change(productInput, { target: { value: 'PROD_TEST_001' } });

      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
        expect(screen.queryByText('測試商品B')).not.toBeInTheDocument();
      });
    });

    it('should filter by date range', async () => {
      renderWithProviders(<PriceManagement />);

      const effectiveDate = screen.getByLabelText(/生效日期/);
      fireEvent.change(effectiveDate, { target: { value: '2025-08-20' } });

      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        const results = screen.getAllByTestId(/price-row/);
        expect(results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Price CRUD Operations', () => {
    it('should create new price', async () => {
      renderWithProviders(<PriceManagement />);

      // Open create dialog
      const addBtn = screen.getByRole('button', { name: /新增價格/ });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
      fireEvent.change(screen.getByLabelText(/商品/), { target: { value: 'PROD_001' } });
      fireEvent.change(screen.getByLabelText(/價格/), { target: { value: '150' } });
      fireEvent.change(screen.getByLabelText(/生效日期/), { target: { value: '2025-09-01' } });

      // Submit
      const saveBtn = screen.getByRole('button', { name: /儲存/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/價格新增成功/)).toBeInTheDocument();
      });
    });

    it('should edit existing price', async () => {
      renderWithProviders(<PriceManagement />);

      // Load prices
      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Click edit
      const editBtn = screen.getAllByRole('button', { name: /編輯/ })[0];
      fireEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Modify price
      const priceInput = screen.getByLabelText(/價格/);
      fireEvent.change(priceInput, { target: { value: '120' } });

      // Save
      const saveBtn = screen.getByRole('button', { name: /儲存/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/價格更新成功/)).toBeInTheDocument();
      });
    });

    it('should delete price with confirmation', async () => {
      renderWithProviders(<PriceManagement />);

      // Load prices
      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Click delete
      const deleteBtn = screen.getAllByRole('button', { name: /刪除/ })[0];
      fireEvent.click(deleteBtn);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/確定要刪除此價格設定？/)).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /確認刪除/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/價格刪除成功/)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk price adjustment', async () => {
      renderWithProviders(<PriceManagement />);

      // Load prices
      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      // Open bulk edit
      const bulkEditBtn = screen.getByRole('button', { name: /批量調整/ });
      fireEvent.click(bulkEditBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set adjustment
      fireEvent.change(screen.getByLabelText(/調整方式/), { target: { value: 'percentage' } });
      fireEvent.change(screen.getByLabelText(/調整數值/), { target: { value: '5' } });

      // Apply
      const applyBtn = screen.getByRole('button', { name: /套用/ });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(/批量調整成功/)).toBeInTheDocument();
      });
    });

    it('should import prices from file', async () => {
      renderWithProviders(<PriceManagement />);

      // Open import dialog
      const importBtn = screen.getByRole('button', { name: /匯入價格/ });
      fireEvent.click(importBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select file
      const file = new File(['price data'], 'prices.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fileInput = screen.getByLabelText(/選擇檔案/);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Upload
      const uploadBtn = screen.getByRole('button', { name: /上傳/ });
      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(screen.getByText(/匯入成功/)).toBeInTheDocument();
      });
    });

    it('should export prices to Excel', async () => {
      renderWithProviders(<PriceManagement />);

      // Load prices
      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Export
      const exportBtn = screen.getByRole('button', { name: /匯出/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText(/匯出格式/)).toBeInTheDocument();
      });

      const excelOption = screen.getByLabelText(/Excel/);
      fireEvent.click(excelOption);

      const confirmExportBtn = screen.getByRole('button', { name: /確認匯出/ });
      fireEvent.click(confirmExportBtn);

      // Check download initiated
      await waitFor(() => {
        expect(screen.getByText(/匯出成功/)).toBeInTheDocument();
      });
    });
  });

  describe('Price Priority Management', () => {
    it('should display price hierarchy', async () => {
      renderWithProviders(<PriceManagement />);

      // Select store-level customer
      const customerSelect = screen.getByLabelText(/選擇客戶/);
      fireEvent.change(customerSelect, { target: { value: 'STO_001' } });

      const searchBtn = screen.getByRole('button', { name: /搜尋/ });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText(/企業價格/)).toBeInTheDocument();
        expect(screen.getByText(/公司價格/)).toBeInTheDocument();
        expect(screen.getByText(/門市價格/)).toBeInTheDocument();
      });
    });

    it('should calculate effective price', async () => {
      renderWithProviders(<PriceManagement />);

      // Open price calculator
      const calcBtn = screen.getByRole('button', { name: /價格試算/ });
      fireEvent.click(calcBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Input parameters
      fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'STO_001' } });
      fireEvent.change(screen.getByLabelText(/商品/), { target: { value: 'PROD_001' } });
      fireEvent.change(screen.getByLabelText(/數量/), { target: { value: '100' } });

      // Calculate
      const calculateBtn = screen.getByRole('button', { name: /計算/ });
      fireEvent.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByText(/基礎價格/)).toBeInTheDocument();
        expect(screen.getByText(/客戶價格/)).toBeInTheDocument();
        expect(screen.getByText(/數量折扣/)).toBeInTheDocument();
        expect(screen.getByText(/最終價格/)).toBeInTheDocument();
      });
    });
  });
});