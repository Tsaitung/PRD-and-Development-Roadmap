import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import VehicleAssignment from '../../../components/VehicleAssignment';
import { testDataBuilders } from '../../setup';

describe('VehicleAssignment Component', () => {
  const mockAssignments = [
    testDataBuilders.createTestVehicleAssignment(),
    testDataBuilders.createTestVehicleAssignment({
      assignment_id: 'ASSIGN_002',
      vehicle_id: 'VEH_002',
      driver_id: 'DRV_002',
      status: 'completed',
      end_date: new Date('2025-08-19'),
      mileage_end: 45120,
      fuel_end: 20,
    }),
  ];

  const mockDrivers = [
    testDataBuilders.createTestDriver(),
    testDataBuilders.createTestDriver({ driver_id: 'DRV_002', name: '李司機' }),
  ];

  const mockVehicles = [
    testDataBuilders.createTestVehicle(),
    testDataBuilders.createTestVehicle({ vehicle_id: 'VEH_002', plate_number: 'TPE-5678' }),
  ];

  const defaultProps = {
    assignments: mockAssignments,
    drivers: mockDrivers,
    vehicles: mockVehicles,
    loading: false,
    onAssign: vi.fn(),
    onReturn: vi.fn(),
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render active assignments', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    expect(screen.getByText('VEH_TEST_001')).toBeInTheDocument();
    expect(screen.getByText('測試司機')).toBeInTheDocument();
    expect(screen.getByText('使用中')).toBeInTheDocument();
  });

  it('should display assignment details', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    expect(screen.getByText('用途: 日常配送')).toBeInTheDocument();
    expect(screen.getByText('開始里程: 45000 km')).toBeInTheDocument();
    expect(screen.getByText('開始油量: 45 L')).toBeInTheDocument();
  });

  it('should create new assignment', async () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const assignBtn = screen.getByRole('button', { name: /新增分配/ });
    fireEvent.click(assignBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const vehicleSelect = screen.getByLabelText(/選擇車輛/);
    fireEvent.change(vehicleSelect, { target: { value: 'VEH_002' } });
    
    const driverSelect = screen.getByLabelText(/選擇司機/);
    fireEvent.change(driverSelect, { target: { value: 'DRV_002' } });
    
    const purposeSelect = screen.getByLabelText(/用途/);
    fireEvent.change(purposeSelect, { target: { value: 'delivery' } });
    
    const mileageInput = screen.getByLabelText(/起始里程/);
    fireEvent.change(mileageInput, { target: { value: '45000' } });
    
    const fuelInput = screen.getByLabelText(/起始油量/);
    fireEvent.change(fuelInput, { target: { value: '50' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認分配/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onAssign).toHaveBeenCalledWith({
      vehicle_id: 'VEH_002',
      driver_id: 'DRV_002',
      purpose: 'delivery',
      mileage_start: 45000,
      fuel_start: 50,
    });
  });

  it('should return vehicle', async () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const returnBtn = screen.getAllByRole('button', { name: /歸還車輛/ })[0];
    fireEvent.click(returnBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/車輛歸還/)).toBeInTheDocument();
    });
    
    const mileageInput = screen.getByLabelText(/結束里程/);
    fireEvent.change(mileageInput, { target: { value: '45150' } });
    
    const fuelInput = screen.getByLabelText(/剩餘油量/);
    fireEvent.change(fuelInput, { target: { value: '25' } });
    
    const conditionSelect = screen.getByLabelText(/車況/);
    fireEvent.change(conditionSelect, { target: { value: 'good' } });
    
    const notesInput = screen.getByLabelText(/備註/);
    fireEvent.change(notesInput, { target: { value: '正常歸還' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認歸還/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onReturn).toHaveBeenCalledWith('ASSIGN_TEST_001', {
      mileage_end: 45150,
      fuel_end: 25,
      condition_end: 'good',
      notes: '正常歸還',
    });
  });

  it('should show assignment history', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const historyTab = screen.getByRole('tab', { name: /歷史記錄/ });
    fireEvent.click(historyTab);
    
    expect(screen.getByText('VEH_002')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('行駛: 120 km')).toBeInTheDocument();
  });

  it('should calculate fuel consumption', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const historyTab = screen.getByRole('tab', { name: /歷史記錄/ });
    fireEvent.click(historyTab);
    
    const completedAssignment = screen.getByTestId('assignment-ASSIGN_002');
    expect(completedAssignment).toHaveTextContent('油耗: 25 L');
    expect(completedAssignment).toHaveTextContent('效率: 4.8 km/L');
  });

  it('should filter assignments by status', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態篩選/);
    fireEvent.change(statusFilter, { target: { value: 'active' } });
    
    expect(screen.getByText('ASSIGN_TEST_001')).toBeInTheDocument();
    expect(screen.queryByText('ASSIGN_002')).not.toBeInTheDocument();
  });

  it('should filter by date range', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/開始日期/);
    fireEvent.change(startDate, { target: { value: '2025-08-01' } });
    
    const endDate = screen.getByLabelText(/結束日期/);
    fireEvent.change(endDate, { target: { value: '2025-08-31' } });
    
    const filterBtn = screen.getByRole('button', { name: /篩選/ });
    fireEvent.click(filterBtn);
    
    expect(screen.getByText('ASSIGN_TEST_001')).toBeInTheDocument();
  });

  it('should display assignment timeline', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const timelineTab = screen.getByRole('tab', { name: /時間軸/ });
    fireEvent.click(timelineTab);
    
    expect(screen.getByTestId('assignment-timeline')).toBeInTheDocument();
    expect(screen.getByText('2025-08-20 07:00')).toBeInTheDocument();
  });

  it('should show vehicle availability status', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const availabilityPanel = screen.getByTestId('vehicle-availability');
    expect(availabilityPanel).toHaveTextContent('VEH_TEST_001: 使用中');
    expect(availabilityPanel).toHaveTextContent('VEH_002: 可用');
  });

  it('should validate assignment conflicts', async () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const assignBtn = screen.getByRole('button', { name: /新增分配/ });
    fireEvent.click(assignBtn);
    
    // Try to assign already assigned vehicle
    const vehicleSelect = screen.getByLabelText(/選擇車輛/);
    fireEvent.change(vehicleSelect, { target: { value: 'VEH_TEST_001' } });
    
    await waitFor(() => {
      expect(screen.getByText(/車輛已被分配/)).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByRole('button', { name: /確認分配/ });
    expect(confirmBtn).toBeDisabled();
  });

  it('should update assignment notes', async () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const editNotesBtn = screen.getAllByRole('button', { name: /編輯備註/ })[0];
    fireEvent.click(editNotesBtn);
    
    const notesInput = screen.getByLabelText(/備註/);
    fireEvent.change(notesInput, { target: { value: '更新備註內容' } });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('ASSIGN_TEST_001', {
      notes: '更新備註內容',
    });
  });

  it('should export assignment report', () => {
    const onExport = vi.fn();
    renderWithProviders(<VehicleAssignment {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      type: 'assignments',
      format: 'excel',
      dateRange: expect.any(Object),
    });
  });

  it('should display assignment statistics', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const statsPanel = screen.getByTestId('assignment-stats');
    expect(statsPanel).toHaveTextContent('總分配: 2');
    expect(statsPanel).toHaveTextContent('使用中: 1');
    expect(statsPanel).toHaveTextContent('已完成: 1');
  });

  it('should show driver assignment history', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const driverSelect = screen.getByLabelText(/司機篩選/);
    fireEvent.change(driverSelect, { target: { value: 'DRV_TEST_001' } });
    
    expect(screen.getByText('ASSIGN_TEST_001')).toBeInTheDocument();
    expect(screen.queryByText('ASSIGN_002')).not.toBeInTheDocument();
  });

  it('should handle emergency assignment', async () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} />);
    
    const emergencyBtn = screen.getByRole('button', { name: /緊急分配/ });
    fireEvent.click(emergencyBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/緊急車輛分配/)).toBeInTheDocument();
    });
    
    const reasonInput = screen.getByLabelText(/緊急原因/);
    fireEvent.change(reasonInput, { target: { value: '原車輛故障' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onAssign).toHaveBeenCalledWith(
      expect.objectContaining({ emergency: true })
    );
  });

  it('should show loading state', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<VehicleAssignment {...defaultProps} assignments={[]} />);
    
    expect(screen.getByText(/沒有分配記錄/)).toBeInTheDocument();
  });
});