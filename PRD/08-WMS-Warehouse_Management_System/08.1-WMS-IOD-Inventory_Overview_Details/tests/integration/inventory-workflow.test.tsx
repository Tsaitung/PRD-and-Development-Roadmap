import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import InventoryManagement from '../../../pages/InventoryManagement';
import { wmsApiHandlers } from '../mocks/wms-api';
import { testDataBuilders } from '../setup';

const server = setupServer(...wmsApiHandlers);

describe('Inventory Management Workflow Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Inventory List and Search', () => {
    it('should display and search inventory items', async () => {
      renderWithProviders(<InventoryManagement />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('SKU_TEST_001')).toBeInTheDocument();
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Search for specific item
      const searchInput = screen.getByPlaceholderText(/搜尋商品/);
      fireEvent.change(searchInput, { target: { value: '商品B' } });

      await waitFor(() => {
        expect(screen.queryByText('測試商品A')).not.toBeInTheDocument();
        expect(screen.getByText('測試商品B')).toBeInTheDocument();
      });
    });

    it('should filter by warehouse', async () => {
      renderWithProviders(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Filter by warehouse
      const warehouseSelect = screen.getByLabelText(/倉庫/);
      fireEvent.change(warehouseSelect, { target: { value: 'WH_002' } });

      await waitFor(() => {
        // Should show filtered results
        expect(screen.getByText(/中區倉庫/)).toBeInTheDocument();
      });
    });

    it('should filter by stock status', async () => {
      renderWithProviders(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Filter by low stock
      const statusFilter = screen.getByLabelText(/庫存狀態/);
      fireEvent.change(statusFilter, { target: { value: 'low' } });

      await waitFor(() => {
        expect(screen.queryByText('測試商品A')).not.toBeInTheDocument();
        expect(screen.getByText('測試商品B')).toBeInTheDocument();
      });
    });
  });

  describe('Stock Adjustment Workflow', () => {
    it('should adjust stock levels', async () => {
      renderWithProviders(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Open adjustment dialog
      const adjustBtn = screen.getAllByRole('button', { name: /調整/ })[0];
      fireEvent.click(adjustBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/庫存調整/)).toBeInTheDocument();
      });

      // Fill adjustment form
      const typeSelect = screen.getByLabelText(/調整類型/);
      fireEvent.change(typeSelect, { target: { value: 'damage' } });

      const quantityInput = screen.getByLabelText(/調整數量/);
      fireEvent.change(quantityInput, { target: { value: '10' } });

      const decreaseRadio = screen.getByLabelText(/減少/);
      fireEvent.click(decreaseRadio);

      const reasonInput = screen.getByLabelText(/調整原因/);
      fireEvent.change(reasonInput, { target: { value: '運輸破損' } });

      // Submit adjustment
      const submitBtn = screen.getByRole('button', { name: /確認調整/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/調整成功/)).toBeInTheDocument();
        expect(screen.getByText('490')).toBeInTheDocument(); // New stock level
      });
    });

    it('should require approval for large adjustments', async () => {
      renderWithProviders(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Open adjustment dialog
      const adjustBtn = screen.getAllByRole('button', { name: /調整/ })[0];
      fireEvent.click(adjustBtn);

      // Enter large adjustment
      fireEvent.change(screen.getByLabelText(/調整數量/), { target: { value: '200' } });
      fireEvent.click(screen.getByLabelText(/減少/));
      fireEvent.change(screen.getByLabelText(/調整原因/), { target: { value: '大量報廢' } });

      await waitFor(() => {
        expect(screen.getByText(/需要主管核准/)).toBeInTheDocument();
        expect(screen.getByLabelText(/核准人員/)).toBeInTheDocument();
      });

      // Fill approval info
      const approverInput = screen.getByLabelText(/核准人員/);
      fireEvent.change(approverInput, { target: { value: 'MANAGER_001' } });

      const submitBtn = screen.getByRole('button', { name: /提交核准/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/已提交核准/)).toBeInTheDocument();
      });
    });
  });

  describe('Stock Transfer Workflow', () => {
    it('should create stock transfer between warehouses', async () => {
      renderWithProviders(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Select items for transfer
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first item

      // Open transfer dialog
      const transferBtn = screen.getByRole('button', { name: /調撥/ });
      fireEvent.click(transferBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/庫存調撥/)).toBeInTheDocument();
      });

      // Fill transfer form
      const fromWarehouse = screen.getByLabelText(/來源倉庫/);
      fireEvent.change(fromWarehouse, { target: { value: 'WH_001' } });

      const toWarehouse = screen.getByLabelText(/目標倉庫/);
      fireEvent.change(toWarehouse, { target: { value: 'WH_002' } });

      const quantityInput = screen.getByLabelText(/調撥數量/);
      fireEvent.change(quantityInput, { target: { value: '50' } });

      const dateInput = screen.getByLabelText(/預計日期/);
      fireEvent.change(dateInput, { target: { value: '2025-08-22' } });

      // Submit transfer
      const submitBtn = screen.getByRole('button', { name: /確認調撥/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/調撥單已建立/)).toBeInTheDocument();
        expect(screen.getByText(/TR-20250820-/)).toBeInTheDocument();
      });
    });
  });

  describe('Cycle Count Workflow', () => {
    it('should perform cycle count and update inventory', async () => {
      renderWithProviders(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試商品A')).toBeInTheDocument();
      });

      // Start cycle count
      const cycleCountBtn = screen.getByRole('button', { name: /週期盤點/ });
      fireEvent.click(cycleCountBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/週期盤點/)).toBeInTheDocument();
      });

      // Select warehouse and location
      const warehouseSelect = screen.getByLabelText(/倉庫/);
      fireEvent.change(warehouseSelect, { target: { value: 'WH_001' } });

      const locationInput = screen.getByLabelText(/盤點位置/);
      fireEvent.change(locationInput, { target: { value: 'A-01' } });

      // Start counting
      const startBtn = screen.getByRole('button', { name: /開始盤點/ });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(screen.getByText(/盤點清單/)).toBeInTheDocument();
      });

      // Enter counted quantities
      const countInputs = screen.getAllByLabelText(/實際數量/);
      fireEvent.change(countInputs[0], { target: { value: '495' } }); // Small discrepancy

      // Submit count
      const submitBtn = screen.getByRole('button', { name: /提交盤點/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/盤點完成/)).toBeInTheDocument();
        expect(screen.getByText(/準確率: 99%/)).toBeInTheDocument();
        expect(screen.getByText(/差異: 1 項/)).toBeInTheDocument();
      });

      // Auto-adjust option
      const autoAdjustCheckbox = screen.getByLabelText(/自動調整差異/);
      fireEvent.click(autoAdjustCheckbox);

      const confirmBtn = screen.getByRole('button', { name: /確認調整/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/庫存已更新/)).toBeInTheDocument();
      });
    });
  });

  describe('Stock Alerts Management', () => {
    it('should display and handle stock alerts', async () => {
      renderWithProviders(<InventoryManagement />);

      // Switch to alerts tab
      const alertsTab = screen.getByRole('tab', { name: /庫存警報/ });
      fireEvent.click(alertsTab);

      await waitFor(() => {
        expect(screen.getByText(/低庫存/)).toBeInTheDocument();
        expect(screen.getByText(/即將過期/)).toBeInTheDocument();
      });

      // Handle low stock alert
      const handleBtn = screen.getAllByRole('button', { name: /處理/ })[0];
      fireEvent.click(handleBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/處理警報/)).toBeInTheDocument();
      });

      // Select action
      const actionSelect = screen.getByLabelText(/處理方式/);
      fireEvent.change(actionSelect, { target: { value: 'create_po' } });

      const quantityInput = screen.getByLabelText(/採購數量/);
      fireEvent.change(quantityInput, { target: { value: '200' } });

      const submitBtn = screen.getByRole('button', { name: /建立採購單/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/採購單已建立/)).toBeInTheDocument();
        expect(screen.getByText(/警報已處理/)).toBeInTheDocument();
      });
    });

    it('should bulk handle multiple alerts', async () => {
      renderWithProviders(<InventoryManagement />);

      // Switch to alerts tab
      const alertsTab = screen.getByRole('tab', { name: /庫存警報/ });
      fireEvent.click(alertsTab);

      await waitFor(() => {
        expect(screen.getByText(/低庫存/)).toBeInTheDocument();
      });

      // Select multiple alerts
      const selectAll = screen.getByTestId('select-all-alerts');
      fireEvent.click(selectAll);

      // Bulk handle
      const bulkBtn = screen.getByRole('button', { name: /批量處理/ });
      fireEvent.click(bulkBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/批量處理 3 個警報/)).toBeInTheDocument();
      });

      const actionSelect = screen.getByLabelText(/批量動作/);
      fireEvent.change(actionSelect, { target: { value: 'dismiss_low_priority' } });

      const confirmBtn = screen.getByRole('button', { name: /確認處理/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/已處理 1 個低優先級警報/)).toBeInTheDocument();
      });
    });
  });

  describe('Inventory Reports', () => {
    it('should generate and export inventory report', async () => {
      renderWithProviders(<InventoryManagement />);

      // Switch to reports tab
      const reportsTab = screen.getByRole('tab', { name: /報表/ });
      fireEvent.click(reportsTab);

      await waitFor(() => {
        expect(screen.getByText(/庫存報表/)).toBeInTheDocument();
      });

      // Select report type
      const reportType = screen.getByLabelText(/報表類型/);
      fireEvent.change(reportType, { target: { value: 'daily_stock' } });

      // Select date
      const dateInput = screen.getByLabelText(/報表日期/);
      fireEvent.change(dateInput, { target: { value: '2025-08-20' } });

      // Generate report
      const generateBtn = screen.getByRole('button', { name: /產生報表/ });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表已產生/)).toBeInTheDocument();
        expect(screen.getByText(/總項目: 150/)).toBeInTheDocument();
        expect(screen.getByText(/總價值: $5,000,000/)).toBeInTheDocument();
      });

      // Export report
      const exportBtn = screen.getByRole('button', { name: /匯出Excel/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表已匯出/)).toBeInTheDocument();
      });
    });

    it('should generate ABC analysis', async () => {
      renderWithProviders(<InventoryManagement />);

      // Switch to reports tab
      const reportsTab = screen.getByRole('tab', { name: /報表/ });
      fireEvent.click(reportsTab);

      // Select ABC analysis
      const reportType = screen.getByLabelText(/報表類型/);
      fireEvent.change(reportType, { target: { value: 'abc_analysis' } });

      // Generate analysis
      const generateBtn = screen.getByRole('button', { name: /產生分析/ });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/ABC 分析/)).toBeInTheDocument();
        expect(screen.getByText(/A類: 150 項 (60%)/)).toBeInTheDocument();
        expect(screen.getByText(/B類: 300 項 (30%)/)).toBeInTheDocument();
        expect(screen.getByText(/C類: 1050 項 (10%)/)).toBeInTheDocument();
      });
    });
  });
});