import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderManagement from '../../../pages/OrderManagement';
import { orderApiHandlers } from '../mocks/api-mocks';
import { testDataBuilders } from '../setup';

const server = setupServer(...orderApiHandlers);

describe('Order Management Workflow Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20T10:00:00'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Order List and Search', () => {
    it('should load and display orders', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
        expect(screen.getByText('測試客戶1')).toBeInTheDocument();
      });

      // Check pagination
      expect(screen.getByText(/第 1 頁/)).toBeInTheDocument();
    });

    it('should search orders by keyword', async () => {
      renderWithProviders(<OrderManagement />);

      const searchInput = screen.getByPlaceholderText(/搜尋訂單編號/);
      fireEvent.change(searchInput, { target: { value: 'SO-20250820-001' } });

      await waitFor(() => {
        const orderRows = screen.getAllByTestId(/order-row/);
        expect(orderRows).toHaveLength(1);
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });
    });

    it('should filter orders by status', async () => {
      renderWithProviders(<OrderManagement />);

      const statusFilter = screen.getByLabelText(/訂單狀態/);
      fireEvent.change(statusFilter, { target: { value: 'confirmed' } });

      const applyBtn = screen.getByRole('button', { name: /套用篩選/ });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        const statusBadges = screen.getAllByText('已確認');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });

    it('should filter orders by date range', async () => {
      renderWithProviders(<OrderManagement />);

      const startDate = screen.getByLabelText(/開始日期/);
      const endDate = screen.getByLabelText(/結束日期/);

      fireEvent.change(startDate, { target: { value: '2025-08-01' } });
      fireEvent.change(endDate, { target: { value: '2025-08-31' } });

      const applyBtn = screen.getByRole('button', { name: /套用篩選/ });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(/2025年8月訂單/)).toBeInTheDocument();
      });
    });
  });

  describe('Order CRUD Operations', () => {
    it('should create new order', async () => {
      renderWithProviders(<OrderManagement />);

      // Open create dialog
      const addBtn = screen.getByRole('button', { name: /新增訂單/ });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill order form
      fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
      fireEvent.change(screen.getByLabelText(/配送日期/), { target: { value: '2025-08-21' } });
      fireEvent.change(screen.getByLabelText(/配送時間/), { target: { value: '09:00-12:00' } });
      fireEvent.change(screen.getByLabelText(/配送地址/), { target: { value: '台北市信義區測試路100號' } });

      // Add items
      const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
      fireEvent.click(addItemBtn);

      fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: 'PROD_001' } });
      fireEvent.change(screen.getByTestId('quantity-input-0'), { target: { value: '10' } });

      // Save order
      const saveBtn = screen.getByRole('button', { name: /儲存訂單/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/訂單建立成功/)).toBeInTheDocument();
      });
    });

    it('should edit existing order', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Click edit button
      const editBtn = screen.getAllByRole('button', { name: /編輯/ })[0];
      fireEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Modify order
      const notesInput = screen.getByLabelText(/備註/);
      fireEvent.change(notesInput, { target: { value: '更新的備註' } });

      const saveBtn = screen.getByRole('button', { name: /儲存變更/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/訂單更新成功/)).toBeInTheDocument();
      });
    });

    it('should duplicate order', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Open more actions menu
      const moreBtn = screen.getAllByTestId('more-actions')[0];
      fireEvent.click(moreBtn);

      const duplicateOption = screen.getByText('複製訂單');
      fireEvent.click(duplicateOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set new delivery date
      fireEvent.change(screen.getByLabelText(/配送日期/), { target: { value: '2025-08-22' } });

      const confirmBtn = screen.getByRole('button', { name: /確認複製/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/訂單複製成功/)).toBeInTheDocument();
      });
    });

    it('should cancel order with reason', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Change status to cancelled
      const statusBtn = screen.getAllByTestId('status-btn')[0];
      fireEvent.click(statusBtn);

      const cancelOption = screen.getByText('取消訂單');
      fireEvent.click(cancelOption);

      // Enter cancellation reason
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/取消原因/);
      fireEvent.change(reasonInput, { target: { value: '客戶要求取消' } });

      const confirmBtn = screen.getByRole('button', { name: /確認取消/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/訂單已取消/)).toBeInTheDocument();
      });
    });
  });

  describe('Batch Operations', () => {
    it('should batch update order status', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Select multiple orders
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First order
      fireEvent.click(checkboxes[2]); // Second order

      expect(screen.getByText(/已選擇 2 筆/)).toBeInTheDocument();

      // Batch update status
      const batchStatusBtn = screen.getByRole('button', { name: /批量更新狀態/ });
      fireEvent.click(batchStatusBtn);

      const confirmedOption = screen.getByText('確認訂單');
      fireEvent.click(confirmedOption);

      await waitFor(() => {
        expect(screen.getByText(/批量更新成功: 2 筆訂單/)).toBeInTheDocument();
      });
    });

    it('should batch export orders', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Select orders
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);
      fireEvent.click(checkboxes[3]);

      // Export selected
      const exportBtn = screen.getByRole('button', { name: /匯出選中/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const excelOption = screen.getByLabelText(/Excel/);
      fireEvent.click(excelOption);

      const confirmExportBtn = screen.getByRole('button', { name: /確認匯出/ });
      fireEvent.click(confirmExportBtn);

      await waitFor(() => {
        expect(screen.getByText(/匯出成功/)).toBeInTheDocument();
      });
    });

    it('should batch print orders', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Select orders
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      // Print selected
      const printBtn = screen.getByRole('button', { name: /列印選中/ });
      fireEvent.click(printBtn);

      await waitFor(() => {
        expect(screen.getByText(/準備列印 2 筆訂單/)).toBeInTheDocument();
      });
    });
  });

  describe('Order Status Workflow', () => {
    it('should follow correct status transitions', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Find pending order
      const pendingOrder = screen.getByTestId('order-row-0');
      const statusBtn = within(pendingOrder).getByTestId('status-btn');

      // Pending → Confirmed
      fireEvent.click(statusBtn);
      fireEvent.click(screen.getByText('確認訂單'));

      await waitFor(() => {
        expect(within(pendingOrder).getByText('已確認')).toBeInTheDocument();
      });

      // Confirmed → Processing
      fireEvent.click(statusBtn);
      fireEvent.click(screen.getByText('開始處理'));

      await waitFor(() => {
        expect(within(pendingOrder).getByText('處理中')).toBeInTheDocument();
      });

      // Processing → Shipped
      fireEvent.click(statusBtn);
      fireEvent.click(screen.getByText('標記出貨'));

      await waitFor(() => {
        expect(within(pendingOrder).getByText('已出貨')).toBeInTheDocument();
      });
    });

    it('should prevent invalid status transitions', async () => {
      renderWithProviders(<OrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
      });

      // Find completed order
      const completedOrder = screen.getByTestId('order-row-4');
      const statusBtn = within(completedOrder).getByTestId('status-btn');

      fireEvent.click(statusBtn);

      // Should not have option to go back to pending
      expect(screen.queryByText('改為待確認')).not.toBeInTheDocument();
    });
  });

  describe('Stock Validation', () => {
    it('should check stock when creating order', async () => {
      renderWithProviders(<OrderManagement />);

      const addBtn = screen.getByRole('button', { name: /新增訂單/ });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Add item with large quantity
      const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
      fireEvent.click(addItemBtn);

      fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: 'PROD_001' } });
      fireEvent.change(screen.getByTestId('quantity-input-0'), { target: { value: '1000' } });

      // Check stock button
      const checkStockBtn = screen.getByRole('button', { name: /檢查庫存/ });
      fireEvent.click(checkStockBtn);

      await waitFor(() => {
        expect(screen.getByText(/庫存不足/)).toBeInTheDocument();
      });
    });
  });
});