import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import FleetManagement from '../../../pages/FleetManagement';
import { fleetApiHandlers } from '../mocks/fleet-api';
import { testDataBuilders } from '../setup';

const server = setupServer(...fleetApiHandlers);

describe('Fleet Management Workflow Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Driver Management', () => {
    it('should display drivers list and manage drivers', async () => {
      renderWithProviders(<FleetManagement />);

      await waitFor(() => {
        expect(screen.getByText('司機管理')).toBeInTheDocument();
        expect(screen.getByText('測試司機')).toBeInTheDocument();
        expect(screen.getByText('李司機')).toBeInTheDocument();
      });

      // Check driver status
      expect(screen.getByText('在職')).toBeInTheDocument();
      expect(screen.getByText('請假中')).toBeInTheDocument();
    });

    it('should add new driver', async () => {
      renderWithProviders(<FleetManagement />);

      const addBtn = screen.getByRole('button', { name: /新增司機/ });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill driver form
      fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '新司機' } });
      fireEvent.change(screen.getByLabelText(/電話/), { target: { value: '0933-444-555' } });
      fireEvent.change(screen.getByLabelText(/駕照號碼/), { target: { value: 'DL-111222333' } });
      fireEvent.change(screen.getByLabelText(/駕照類型/), { target: { value: 'professional' } });

      const saveBtn = screen.getByRole('button', { name: /儲存/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/司機已新增/)).toBeInTheDocument();
      });
    });

    it('should update driver status', async () => {
      renderWithProviders(<FleetManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試司機')).toBeInTheDocument();
      });

      const moreBtn = screen.getByTestId('more-actions-DRV_TEST_001');
      fireEvent.click(moreBtn);

      const changeStatusOption = screen.getByText('變更狀態');
      fireEvent.click(changeStatusOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/新狀態/);
      fireEvent.change(statusSelect, { target: { value: 'on_leave' } });

      const confirmBtn = screen.getByRole('button', { name: /確認/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/狀態已更新/)).toBeInTheDocument();
      });
    });

    it('should view driver performance', async () => {
      renderWithProviders(<FleetManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試司機')).toBeInTheDocument();
      });

      const viewBtn = screen.getByTestId('view-performance-DRV_TEST_001');
      fireEvent.click(viewBtn);

      await waitFor(() => {
        expect(screen.getByText(/績效報表/)).toBeInTheDocument();
        expect(screen.getByText('準時率: 95.5%')).toBeInTheDocument();
        expect(screen.getByText('客戶評分: 4.8')).toBeInTheDocument();
        expect(screen.getByText('安全分數: 98')).toBeInTheDocument();
      });
    });
  });

  describe('Vehicle Management', () => {
    it('should display vehicles list', async () => {
      renderWithProviders(<FleetManagement />);

      const vehicleTab = screen.getByRole('tab', { name: /車輛管理/ });
      fireEvent.click(vehicleTab);

      await waitFor(() => {
        expect(screen.getByText('TPE-1234')).toBeInTheDocument();
        expect(screen.getByText('TPE-5678')).toBeInTheDocument();
        expect(screen.getByText('TPE-9012')).toBeInTheDocument();
      });

      // Check vehicle status
      expect(screen.getByText('運行中')).toBeInTheDocument();
      expect(screen.getByText('維修中')).toBeInTheDocument();
    });

    it('should assign vehicle to driver', async () => {
      renderWithProviders(<FleetManagement />);

      const vehicleTab = screen.getByRole('tab', { name: /車輛管理/ });
      fireEvent.click(vehicleTab);

      await waitFor(() => {
        expect(screen.getByText('TPE-1234')).toBeInTheDocument();
      });

      const assignBtn = screen.getByTestId('assign-VEH_TEST_001');
      fireEvent.click(assignBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const driverSelect = screen.getByLabelText(/選擇司機/);
      fireEvent.change(driverSelect, { target: { value: 'DRV_001' } });

      const mileageInput = screen.getByLabelText(/起始里程/);
      fireEvent.change(mileageInput, { target: { value: '45000' } });

      const confirmBtn = screen.getByRole('button', { name: /確認分配/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/車輛已分配/)).toBeInTheDocument();
      });
    });

    it('should schedule vehicle maintenance', async () => {
      renderWithProviders(<FleetManagement />);

      const vehicleTab = screen.getByRole('tab', { name: /車輛管理/ });
      fireEvent.click(vehicleTab);

      await waitFor(() => {
        expect(screen.getByText('TPE-1234')).toBeInTheDocument();
      });

      const maintenanceBtn = screen.getByTestId('maintenance-VEH_TEST_001');
      fireEvent.click(maintenanceBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/安排保養/)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/保養日期/);
      fireEvent.change(dateInput, { target: { value: '2025-09-01' } });

      const typeSelect = screen.getByLabelText(/保養類型/);
      fireEvent.change(typeSelect, { target: { value: 'regular' } });

      const submitBtn = screen.getByRole('button', { name: /確認安排/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/保養已安排/)).toBeInTheDocument();
      });
    });
  });

  describe('Schedule Management', () => {
    it('should display driver schedules', async () => {
      renderWithProviders(<FleetManagement />);

      const scheduleTab = screen.getByRole('tab', { name: /排班管理/ });
      fireEvent.click(scheduleTab);

      await waitFor(() => {
        expect(screen.getByTestId('schedule-calendar')).toBeInTheDocument();
        expect(screen.getByText('2025年8月')).toBeInTheDocument();
      });

      // Check schedule entries
      expect(screen.getByText('早班')).toBeInTheDocument();
      expect(screen.getByText('08:00 - 18:00')).toBeInTheDocument();
    });

    it('should create weekly schedule', async () => {
      renderWithProviders(<FleetManagement />);

      const scheduleTab = screen.getByRole('tab', { name: /排班管理/ });
      fireEvent.click(scheduleTab);

      const weeklyBtn = screen.getByRole('button', { name: /週排班/ });
      fireEvent.click(weeklyBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select drivers
      const driver1 = screen.getByLabelText('測試司機');
      const driver2 = screen.getByLabelText('李司機');
      fireEvent.click(driver1);
      fireEvent.click(driver2);

      // Select week
      const weekSelect = screen.getByLabelText(/選擇週/);
      fireEvent.change(weekSelect, { target: { value: '2025-W35' } });

      const generateBtn = screen.getByRole('button', { name: /產生排班/ });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/排班已建立/)).toBeInTheDocument();
      });
    });

    it('should handle shift swap request', async () => {
      renderWithProviders(<FleetManagement />);

      const scheduleTab = screen.getByRole('tab', { name: /排班管理/ });
      fireEvent.click(scheduleTab);

      await waitFor(() => {
        expect(screen.getByTestId('schedule-calendar')).toBeInTheDocument();
      });

      const scheduleCard = screen.getByTestId('schedule-SCH_TEST_001');
      fireEvent.click(scheduleCard);

      const swapBtn = screen.getByRole('button', { name: /申請換班/ });
      fireEvent.click(swapBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const targetDriver = screen.getByLabelText(/換班對象/);
      fireEvent.change(targetDriver, { target: { value: 'DRV_002' } });

      const reasonInput = screen.getByLabelText(/原因/);
      fireEvent.change(reasonInput, { target: { value: '個人事務' } });

      const submitBtn = screen.getByRole('button', { name: /提交申請/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/換班申請已提交/)).toBeInTheDocument();
      });
    });
  });

  describe('Document Management', () => {
    it('should display expiring documents alert', async () => {
      renderWithProviders(<FleetManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('documents-alert')).toBeInTheDocument();
        expect(screen.getByText(/8 份文件即將到期/)).toBeInTheDocument();
      });
    });

    it('should upload driver document', async () => {
      renderWithProviders(<FleetManagement />);

      await waitFor(() => {
        expect(screen.getByText('測試司機')).toBeInTheDocument();
      });

      const documentsBtn = screen.getByTestId('documents-DRV_TEST_001');
      fireEvent.click(documentsBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const uploadBtn = screen.getByRole('button', { name: /上傳文件/ });
      fireEvent.click(uploadBtn);

      const file = new File(['content'], 'license.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/選擇檔案/);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const docTypeSelect = screen.getByLabelText(/文件類型/);
      fireEvent.change(docTypeSelect, { target: { value: 'license' } });

      const expiryInput = screen.getByLabelText(/到期日/);
      fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });

      const saveBtn = screen.getByRole('button', { name: /儲存/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/文件已上傳/)).toBeInTheDocument();
      });
    });
  });

  describe('Fleet Dashboard', () => {
    it('should display fleet overview', async () => {
      renderWithProviders(<FleetManagement />);

      const dashboardTab = screen.getByRole('tab', { name: /總覽/ });
      fireEvent.click(dashboardTab);

      await waitFor(() => {
        expect(screen.getByText('車隊總覽')).toBeInTheDocument();
        expect(screen.getByText('總車輛: 25')).toBeInTheDocument();
        expect(screen.getByText('總司機: 30')).toBeInTheDocument();
        expect(screen.getByText('車隊使用率: 85%')).toBeInTheDocument();
      });
    });

    it('should display performance metrics', async () => {
      renderWithProviders(<FleetManagement />);

      const dashboardTab = screen.getByRole('tab', { name: /總覽/ });
      fireEvent.click(dashboardTab);

      await waitFor(() => {
        expect(screen.getByText('準時配送率: 94.5%')).toBeInTheDocument();
        expect(screen.getByText('平均油耗: 8.2 km/L')).toBeInTheDocument();
        expect(screen.getByText('事故率: 0.5%')).toBeInTheDocument();
      });
    });

    it('should export fleet report', async () => {
      renderWithProviders(<FleetManagement />);

      const dashboardTab = screen.getByRole('tab', { name: /總覽/ });
      fireEvent.click(dashboardTab);

      const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const reportType = screen.getByLabelText(/報表類型/);
      fireEvent.change(reportType, { target: { value: 'monthly' } });

      const formatSelect = screen.getByLabelText(/格式/);
      fireEvent.change(formatSelect, { target: { value: 'excel' } });

      const downloadBtn = screen.getByRole('button', { name: /下載/ });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表已產生/)).toBeInTheDocument();
      });
    });
  });

  describe('Leave Management', () => {
    it('should submit leave request', async () => {
      renderWithProviders(<FleetManagement />);

      const leaveBtn = screen.getByRole('button', { name: /請假申請/ });
      fireEvent.click(leaveBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const driverSelect = screen.getByLabelText(/司機/);
      fireEvent.change(driverSelect, { target: { value: 'DRV_TEST_001' } });

      const typeSelect = screen.getByLabelText(/請假類型/);
      fireEvent.change(typeSelect, { target: { value: 'annual' } });

      const startDate = screen.getByLabelText(/開始日期/);
      fireEvent.change(startDate, { target: { value: '2025-09-01' } });

      const endDate = screen.getByLabelText(/結束日期/);
      fireEvent.change(endDate, { target: { value: '2025-09-03' } });

      const submitBtn = screen.getByRole('button', { name: /提交申請/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/請假申請已提交/)).toBeInTheDocument();
      });
    });

    it('should approve leave request', async () => {
      renderWithProviders(<FleetManagement />);

      const pendingTab = screen.getByRole('tab', { name: /待審核/ });
      fireEvent.click(pendingTab);

      await waitFor(() => {
        expect(screen.getByText(/請假申請/)).toBeInTheDocument();
      });

      const approveBtn = screen.getByRole('button', { name: /核准/ });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const substituteSelect = screen.getByLabelText(/代班司機/);
      fireEvent.change(substituteSelect, { target: { value: 'DRV_002' } });

      const confirmBtn = screen.getByRole('button', { name: /確認核准/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/請假已核准/)).toBeInTheDocument();
      });
    });
  });
});