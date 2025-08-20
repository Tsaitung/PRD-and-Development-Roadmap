import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import DriverSchedule from '../../../components/DriverSchedule';
import { testDataBuilders } from '../../setup';

describe('DriverSchedule Component', () => {
  const mockSchedules = [
    testDataBuilders.createTestDriverSchedule(),
    testDataBuilders.createTestDriverSchedule({
      schedule_id: 'SCH_002',
      date: new Date('2025-08-21'),
      shift: 'afternoon',
      start_time: '14:00',
      end_time: '22:00',
    }),
    testDataBuilders.createTestDriverSchedule({
      schedule_id: 'SCH_003',
      date: new Date('2025-08-22'),
      status: 'completed',
      actual_start: '08:05',
      actual_end: '18:10',
      overtime_hours: 0.2,
    }),
  ];

  const defaultProps = {
    driverId: 'DRV_TEST_001',
    schedules: mockSchedules,
    loading: false,
    onCreateSchedule: vi.fn(),
    onUpdateSchedule: vi.fn(),
    onDeleteSchedule: vi.fn(),
    onSwapShift: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  it('should render schedule calendar', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    expect(screen.getByTestId('schedule-calendar')).toBeInTheDocument();
    expect(screen.getByText('2025年8月')).toBeInTheDocument();
  });

  it('should display daily schedules', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    expect(screen.getByText('08:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('早班')).toBeInTheDocument();
  });

  it('should show schedule status', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    expect(screen.getByText('已排班')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('should display assigned vehicle', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const scheduleCard = screen.getByTestId('schedule-SCH_TEST_001');
    expect(within(scheduleCard).getByText('VEH_TEST_001')).toBeInTheDocument();
  });

  it('should show assigned routes', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const scheduleCard = screen.getByTestId('schedule-SCH_TEST_001');
    expect(within(scheduleCard).getByText('ROUTE_001')).toBeInTheDocument();
    expect(within(scheduleCard).getByText('ROUTE_002')).toBeInTheDocument();
  });

  it('should display break times', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const scheduleCard = screen.getByTestId('schedule-SCH_TEST_001');
    fireEvent.click(scheduleCard);
    
    waitFor(() => {
      expect(screen.getByText('午餐: 12:00 - 13:00')).toBeInTheDocument();
      expect(screen.getByText('休息: 15:00 - 15:15')).toBeInTheDocument();
    });
  });

  it('should create new schedule', async () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const addBtn = screen.getByRole('button', { name: /新增排班/ });
    fireEvent.click(addBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const dateInput = screen.getByLabelText(/日期/);
    fireEvent.change(dateInput, { target: { value: '2025-08-25' } });
    
    const shiftSelect = screen.getByLabelText(/班次/);
    fireEvent.change(shiftSelect, { target: { value: 'morning' } });
    
    const vehicleSelect = screen.getByLabelText(/車輛/);
    fireEvent.change(vehicleSelect, { target: { value: 'VEH_001' } });
    
    const saveBtn = screen.getByRole('button', { name: /建立排班/ });
    fireEvent.click(saveBtn);
    
    expect(defaultProps.onCreateSchedule).toHaveBeenCalledWith({
      date: '2025-08-25',
      shift: 'morning',
      vehicle_id: 'VEH_001',
    });
  });

  it('should edit existing schedule', async () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const editBtn = screen.getAllByRole('button', { name: /編輯/ })[0];
    fireEvent.click(editBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const endTimeInput = screen.getByLabelText(/結束時間/);
    fireEvent.change(endTimeInput, { target: { value: '19:00' } });
    
    const updateBtn = screen.getByRole('button', { name: /更新/ });
    fireEvent.click(updateBtn);
    
    expect(defaultProps.onUpdateSchedule).toHaveBeenCalledWith(
      'SCH_TEST_001',
      expect.objectContaining({ end_time: '19:00' })
    );
  });

  it('should delete schedule with confirmation', async () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const deleteBtn = screen.getAllByRole('button', { name: /刪除/ })[0];
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/確認刪除排班/)).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByRole('button', { name: /確認刪除/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onDeleteSchedule).toHaveBeenCalledWith('SCH_TEST_001');
  });

  it('should swap shifts between drivers', async () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const swapBtn = screen.getAllByRole('button', { name: /換班/ })[0];
    fireEvent.click(swapBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/換班申請/)).toBeInTheDocument();
    });
    
    const targetDriverSelect = screen.getByLabelText(/目標司機/);
    fireEvent.change(targetDriverSelect, { target: { value: 'DRV_002' } });
    
    const reasonInput = screen.getByLabelText(/原因/);
    fireEvent.change(reasonInput, { target: { value: '個人事務' } });
    
    const submitBtn = screen.getByRole('button', { name: /提交申請/ });
    fireEvent.click(submitBtn);
    
    expect(defaultProps.onSwapShift).toHaveBeenCalledWith({
      schedule_id: 'SCH_TEST_001',
      target_driver: 'DRV_002',
      reason: '個人事務',
    });
  });

  it('should display overtime hours', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const completedSchedule = screen.getByTestId('schedule-SCH_003');
    expect(within(completedSchedule).getByText('加班: 0.2 小時')).toBeInTheDocument();
  });

  it('should show actual vs scheduled times', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const completedSchedule = screen.getByTestId('schedule-SCH_003');
    expect(within(completedSchedule).getByText('實際: 08:05 - 18:10')).toBeInTheDocument();
  });

  it('should filter schedules by month', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const nextMonthBtn = screen.getByRole('button', { name: /下個月/ });
    fireEvent.click(nextMonthBtn);
    
    expect(screen.getByText('2025年9月')).toBeInTheDocument();
  });

  it('should display weekly view', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const viewToggle = screen.getByRole('button', { name: /週檢視/ });
    fireEvent.click(viewToggle);
    
    expect(screen.getByTestId('weekly-view')).toBeInTheDocument();
    expect(screen.getByText('週一')).toBeInTheDocument();
    expect(screen.getByText('週日')).toBeInTheDocument();
  });

  it('should show schedule conflicts', () => {
    const conflictSchedule = testDataBuilders.createTestDriverSchedule({
      schedule_id: 'SCH_CONFLICT',
      conflict: true,
      conflict_reason: '與其他排班重疊',
    });
    
    renderWithProviders(
      <DriverSchedule {...defaultProps} schedules={[...mockSchedules, conflictSchedule]} />
    );
    
    const conflictCard = screen.getByTestId('schedule-SCH_CONFLICT');
    expect(conflictCard).toHaveClass('border-red-500');
    expect(within(conflictCard).getByText('排班衝突')).toBeInTheDocument();
  });

  it('should export schedule', () => {
    const onExport = vi.fn();
    renderWithProviders(<DriverSchedule {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出排班表/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      driver_id: 'DRV_TEST_001',
      month: '2025-08',
      format: 'excel',
    });
  });

  it('should display schedule summary', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    expect(screen.getByText(/本月排班: 3 天/)).toBeInTheDocument();
    expect(screen.getByText(/總工時: 80 小時/)).toBeInTheDocument();
    expect(screen.getByText(/加班時數: 0.2 小時/)).toBeInTheDocument();
  });

  it('should handle bulk schedule creation', async () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const bulkBtn = screen.getByRole('button', { name: /批量排班/ });
    fireEvent.click(bulkBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const startDate = screen.getByLabelText(/開始日期/);
    fireEvent.change(startDate, { target: { value: '2025-08-25' } });
    
    const endDate = screen.getByLabelText(/結束日期/);
    fireEvent.change(endDate, { target: { value: '2025-08-31' } });
    
    const patternSelect = screen.getByLabelText(/排班模式/);
    fireEvent.change(patternSelect, { target: { value: '5days' } });
    
    const createBtn = screen.getByRole('button', { name: /建立/ });
    fireEvent.click(createBtn);
    
    expect(defaultProps.onCreateSchedule).toHaveBeenCalled();
  });

  it('should copy schedule to another date', async () => {
    renderWithProviders(<DriverSchedule {...defaultProps} />);
    
    const copyBtn = screen.getAllByRole('button', { name: /複製/ })[0];
    fireEvent.click(copyBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const targetDate = screen.getByLabelText(/目標日期/);
    fireEvent.change(targetDate, { target: { value: '2025-08-26' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認複製/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onCreateSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2025-08-26' })
    );
  });

  it('should show loading state', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<DriverSchedule {...defaultProps} schedules={[]} />);
    
    expect(screen.getByText(/沒有排班資料/)).toBeInTheDocument();
  });
});