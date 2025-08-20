import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import RouteManagement from '../../../pages/RouteManagement';
import { logisticsApiHandlers } from '../mocks/logistics-api';
import { testDataBuilders } from '../setup';

const server = setupServer(...logisticsApiHandlers);

describe('Route Optimization Workflow Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Daily Route Planning', () => {
    it('should display pending orders for routing', async () => {
      renderWithProviders(<RouteManagement />);

      await waitFor(() => {
        expect(screen.getByText(/待排程訂單/)).toBeInTheDocument();
        expect(screen.getByText(/40 筆訂單/)).toBeInTheDocument();
      });

      // Check order list
      expect(screen.getByText('客戶A')).toBeInTheDocument();
      expect(screen.getByText('台北市信義區')).toBeInTheDocument();
    });

    it('should run route optimization', async () => {
      renderWithProviders(<RouteManagement />);

      await waitFor(() => {
        expect(screen.getByText(/待排程訂單/)).toBeInTheDocument();
      });

      // Start optimization
      const optimizeBtn = screen.getByRole('button', { name: /優化路線/ });
      fireEvent.click(optimizeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/路線優化設定/)).toBeInTheDocument();
      });

      // Configure optimization
      const maxDistance = screen.getByLabelText(/最大路線距離/);
      fireEvent.change(maxDistance, { target: { value: '100' } });

      // Select drivers
      const driver1 = screen.getByLabelText('張司機');
      const driver2 = screen.getByLabelText('李司機');
      expect(driver1).toBeChecked();
      expect(driver2).toBeChecked();

      // Run optimization
      const runBtn = screen.getByRole('button', { name: /開始優化/ });
      fireEvent.click(runBtn);

      // Wait for progress
      await waitFor(() => {
        expect(screen.getByText(/優化中/)).toBeInTheDocument();
      });

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/優化完成/)).toBeInTheDocument();
        expect(screen.getByText(/產生 5 條路線/)).toBeInTheDocument();
        expect(screen.getByText(/節省 18%/)).toBeInTheDocument();
      });

      // Apply optimization
      const applyBtn = screen.getByRole('button', { name: /套用優化結果/ });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(/路線已建立/)).toBeInTheDocument();
      });
    });

    it('should manually create routes', async () => {
      renderWithProviders(<RouteManagement />);

      // Open manual routing
      const manualBtn = screen.getByRole('button', { name: /手動排程/ });
      fireEvent.click(manualBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/手動建立路線/)).toBeInTheDocument();
      });

      // Select driver and vehicle
      const driverSelect = screen.getByLabelText(/選擇司機/);
      fireEvent.change(driverSelect, { target: { value: 'DRV_001' } });

      const vehicleSelect = screen.getByLabelText(/選擇車輛/);
      fireEvent.change(vehicleSelect, { target: { value: 'VEH_001' } });

      // Add orders to route
      const order1 = screen.getByTestId('order-ORD_001');
      const order2 = screen.getByTestId('order-ORD_002');
      fireEvent.click(order1);
      fireEvent.click(order2);

      // Reorder stops
      const moveUpBtn = screen.getByTestId('move-up-ORD_002');
      fireEvent.click(moveUpBtn);

      // Save route
      const saveBtn = screen.getByRole('button', { name: /建立路線/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/路線已建立/)).toBeInTheDocument();
      });
    });
  });

  describe('Route Monitoring', () => {
    it('should display active routes dashboard', async () => {
      renderWithProviders(<RouteManagement />);

      // Switch to monitoring tab
      const monitorTab = screen.getByRole('tab', { name: /路線監控/ });
      fireEvent.click(monitorTab);

      await waitFor(() => {
        expect(screen.getByText(/進行中路線/)).toBeInTheDocument();
        expect(screen.getByText('RT-20250820-002')).toBeInTheDocument();
        expect(screen.getByText('李司機')).toBeInTheDocument();
        expect(screen.getByText('3/8 站')).toBeInTheDocument();
      });
    });

    it('should track route in real-time', async () => {
      renderWithProviders(<RouteManagement />);

      // Switch to monitoring
      const monitorTab = screen.getByRole('tab', { name: /路線監控/ });
      fireEvent.click(monitorTab);

      await waitFor(() => {
        expect(screen.getByText('RT-20250820-002')).toBeInTheDocument();
      });

      // Open route tracking
      const trackBtn = screen.getByRole('button', { name: /即時追蹤/ });
      fireEvent.click(trackBtn);

      await waitFor(() => {
        expect(screen.getByTestId('route-map')).toBeInTheDocument();
        expect(screen.getByText(/當前位置/)).toBeInTheDocument();
        expect(screen.getByText('25.0330, 121.5654')).toBeInTheDocument();
      });

      // Check ETA updates
      expect(screen.getByText(/下一站 ETA: 10:15/)).toBeInTheDocument();
    });

    it('should handle delivery completion', async () => {
      renderWithProviders(<RouteManagement />);

      // Open active route
      const monitorTab = screen.getByRole('tab', { name: /路線監控/ });
      fireEvent.click(monitorTab);

      await waitFor(() => {
        expect(screen.getByText('RT-20250820-002')).toBeInTheDocument();
      });

      const viewBtn = screen.getByRole('button', { name: /查看詳情/ });
      fireEvent.click(viewBtn);

      // Complete current stop
      const completeBtn = screen.getByRole('button', { name: /完成配送/ });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/配送確認/)).toBeInTheDocument();
      });

      // Add signature
      const signaturePad = screen.getByTestId('signature-pad');
      fireEvent.mouseDown(signaturePad);
      fireEvent.mouseMove(signaturePad);
      fireEvent.mouseUp(signaturePad);

      // Confirm
      const confirmBtn = screen.getByRole('button', { name: /確認完成/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/配送已完成/)).toBeInTheDocument();
        expect(screen.getByText('4/8 站')).toBeInTheDocument();
      });
    });

    it('should handle delivery issues', async () => {
      renderWithProviders(<RouteManagement />);

      // Open route details
      const monitorTab = screen.getByRole('tab', { name: /路線監控/ });
      fireEvent.click(monitorTab);

      await waitFor(() => {
        expect(screen.getByText('RT-20250820-002')).toBeInTheDocument();
      });

      const viewBtn = screen.getByRole('button', { name: /查看詳情/ });
      fireEvent.click(viewBtn);

      // Report issue
      const issueBtn = screen.getByRole('button', { name: /回報問題/ });
      fireEvent.click(issueBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select issue type
      const issueType = screen.getByLabelText(/問題類型/);
      fireEvent.change(issueType, { target: { value: 'customer_unavailable' } });

      // Add description
      const description = screen.getByLabelText(/描述/);
      fireEvent.change(description, { target: { value: '客戶不在，已聯絡' } });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /提交/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/問題已回報/)).toBeInTheDocument();
        expect(screen.getByTestId('issue-badge')).toBeInTheDocument();
      });
    });
  });

  describe('Route Reassignment', () => {
    it('should reassign route to different driver', async () => {
      renderWithProviders(<RouteManagement />);

      // Find route needing reassignment
      await waitFor(() => {
        expect(screen.getByText('RT-20250820-001')).toBeInTheDocument();
      });

      // Open reassignment
      const moreBtn = screen.getByTestId('more-actions-ROUTE_TEST_001');
      fireEvent.click(moreBtn);

      const reassignOption = screen.getByText('重新分配');
      fireEvent.click(reassignOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/重新分配路線/)).toBeInTheDocument();
      });

      // Select new driver
      const newDriver = screen.getByLabelText(/新司機/);
      fireEvent.change(newDriver, { target: { value: 'DRV_003' } });

      // Select new vehicle
      const newVehicle = screen.getByLabelText(/新車輛/);
      fireEvent.change(newVehicle, { target: { value: 'VEH_003' } });

      // Add reason
      const reason = screen.getByLabelText(/原因/);
      fireEvent.change(reason, { target: { value: '原司機請假' } });

      // Confirm
      const confirmBtn = screen.getByRole('button', { name: /確認重新分配/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/路線已重新分配/)).toBeInTheDocument();
        expect(screen.getByText('王司機')).toBeInTheDocument();
      });
    });

    it('should merge routes', async () => {
      renderWithProviders(<RouteManagement />);

      // Select routes to merge
      const route1Checkbox = screen.getByTestId('select-ROUTE_TEST_001');
      const route2Checkbox = screen.getByTestId('select-ROUTE_002');
      fireEvent.click(route1Checkbox);
      fireEvent.click(route2Checkbox);

      // Open bulk actions
      const bulkBtn = screen.getByRole('button', { name: /批量操作/ });
      fireEvent.click(bulkBtn);

      const mergeOption = screen.getByText('合併路線');
      fireEvent.click(mergeOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/合併 2 條路線/)).toBeInTheDocument();
      });

      // Select primary driver
      const primaryDriver = screen.getByLabelText(/主要司機/);
      fireEvent.change(primaryDriver, { target: { value: 'DRV_001' } });

      // Confirm merge
      const confirmBtn = screen.getByRole('button', { name: /確認合併/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/路線已合併/)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics and Reporting', () => {
    it('should display route performance analytics', async () => {
      renderWithProviders(<RouteManagement />);

      // Switch to analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /分析報表/ });
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText(/今日統計/)).toBeInTheDocument();
        expect(screen.getByText(/總路線: 25/)).toBeInTheDocument();
        expect(screen.getByText(/準時率: 92.5%/)).toBeInTheDocument();
        expect(screen.getByText(/總里程: 1125.5 km/)).toBeInTheDocument();
      });

      // View detailed metrics
      expect(screen.getByTestId('delivery-rate-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cost-breakdown-chart')).toBeInTheDocument();
    });

    it('should generate route reports', async () => {
      renderWithProviders(<RouteManagement />);

      // Go to analytics
      const analyticsTab = screen.getByRole('tab', { name: /分析報表/ });
      fireEvent.click(analyticsTab);

      // Generate report
      const reportBtn = screen.getByRole('button', { name: /產生報表/ });
      fireEvent.click(reportBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Configure report
      const reportType = screen.getByLabelText(/報表類型/);
      fireEvent.change(reportType, { target: { value: 'daily_summary' } });

      const dateInput = screen.getByLabelText(/日期/);
      fireEvent.change(dateInput, { target: { value: '2025-08-20' } });

      // Generate
      const generateBtn = screen.getByRole('button', { name: /產生/ });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表已產生/)).toBeInTheDocument();
      });

      // Export report
      const exportBtn = screen.getByRole('button', { name: /匯出PDF/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表已匯出/)).toBeInTheDocument();
      });
    });

    it('should compare optimization scenarios', async () => {
      renderWithProviders(<RouteManagement />);

      // Go to analytics
      const analyticsTab = screen.getByRole('tab', { name: /分析報表/ });
      fireEvent.click(analyticsTab);

      // Open comparison tool
      const compareBtn = screen.getByRole('button', { name: /方案比較/ });
      fireEvent.click(compareBtn);

      await waitFor(() => {
        expect(screen.getByText(/優化方案比較/)).toBeInTheDocument();
        expect(screen.getByText(/最短距離/)).toBeInTheDocument();
        expect(screen.getByText(/準時率優先/)).toBeInTheDocument();
        expect(screen.getByText(/成本最優/)).toBeInTheDocument();
      });

      // View comparison details
      const distanceTab = screen.getByRole('tab', { name: /最短距離/ });
      fireEvent.click(distanceTab);

      expect(screen.getByText(/總距離: 1020 km/)).toBeInTheDocument();
      expect(screen.getByText(/預估成本: $15,800/)).toBeInTheDocument();
    });
  });
});