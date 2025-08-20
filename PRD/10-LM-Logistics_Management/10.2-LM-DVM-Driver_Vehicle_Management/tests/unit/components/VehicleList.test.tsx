import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import VehicleList from '../../../components/VehicleList';
import { testDataBuilders } from '../../setup';

describe('VehicleList Component', () => {
  const mockVehicles = [
    testDataBuilders.createTestVehicle(),
    testDataBuilders.createTestVehicle({
      vehicle_id: 'VEH_002',
      plate_number: 'TPE-5678',
      type: 'van',
      status: 'active',
      availability: 'in_use',
      current_driver: 'DRV_002',
    }),
    testDataBuilders.createTestVehicle({
      vehicle_id: 'VEH_003',
      plate_number: 'TPE-9012',
      type: 'large_truck',
      status: 'maintenance',
      availability: 'unavailable',
    }),
  ];

  const defaultProps = {
    vehicles: mockVehicles,
    loading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
    onAssign: vi.fn(),
    onFilter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render vehicle list', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText('TPE-1234')).toBeInTheDocument();
    expect(screen.getByText('TPE-5678')).toBeInTheDocument();
    expect(screen.getByText('TPE-9012')).toBeInTheDocument();
  });

  it('should display vehicle types', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText('小型貨車')).toBeInTheDocument();
    expect(screen.getByText('廂型車')).toBeInTheDocument();
    expect(screen.getByText('大型貨車')).toBeInTheDocument();
  });

  it('should show vehicle status', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const activeStatus = screen.getAllByText('運行中');
    expect(activeStatus).toHaveLength(2);
    expect(screen.getByText('維修中')).toBeInTheDocument();
  });

  it('should display availability status', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const availableChip = screen.getByTestId('availability-VEH_TEST_001');
    expect(availableChip).toHaveTextContent('可用');
    expect(availableChip).toHaveClass('bg-green-100');
    
    const inUseChip = screen.getByTestId('availability-VEH_002');
    expect(inUseChip).toHaveTextContent('使用中');
    expect(inUseChip).toHaveClass('bg-blue-100');
    
    const unavailableChip = screen.getByTestId('availability-VEH_003');
    expect(unavailableChip).toHaveTextContent('不可用');
    expect(unavailableChip).toHaveClass('bg-red-100');
  });

  it('should show vehicle specifications', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText('載重: 1500 kg')).toBeInTheDocument();
    expect(screen.getByText('容積: 12 m³')).toBeInTheDocument();
    expect(screen.getByText('燃料: 柴油')).toBeInTheDocument();
  });

  it('should display insurance status', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText('保險有效')).toBeInTheDocument();
    expect(screen.getByText('2026-03-31')).toBeInTheDocument();
  });

  it('should show maintenance status', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText('下次保養: 2025-10-15')).toBeInTheDocument();
    expect(screen.getByText('里程: 45000 km')).toBeInTheDocument();
  });

  it('should display assigned driver', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const vehicleCard = screen.getByTestId('vehicle-card-VEH_002');
    expect(within(vehicleCard).getByText('司機: DRV_002')).toBeInTheDocument();
  });

  it('should filter vehicles by type', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const typeFilter = screen.getByLabelText(/車輛類型/);
    fireEvent.change(typeFilter, { target: { value: 'small_truck' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      type: 'small_truck',
    });
  });

  it('should filter vehicles by status', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態/);
    fireEvent.change(statusFilter, { target: { value: 'active' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      status: 'active',
    });
  });

  it('should handle view details action', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const viewBtn = screen.getAllByRole('button', { name: /查看詳情/ })[0];
    fireEvent.click(viewBtn);
    
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('VEH_TEST_001');
  });

  it('should handle edit action', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const editBtn = screen.getAllByRole('button', { name: /編輯/ })[0];
    fireEvent.click(editBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('VEH_TEST_001');
  });

  it('should handle assign driver action', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const assignBtn = screen.getAllByRole('button', { name: /分配司機/ })[0];
    fireEvent.click(assignBtn);
    
    waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/分配司機/)).toBeInTheDocument();
    });
    
    const driverSelect = screen.getByLabelText(/選擇司機/);
    fireEvent.change(driverSelect, { target: { value: 'DRV_001' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認分配/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onAssign).toHaveBeenCalledWith('VEH_TEST_001', 'DRV_001');
  });

  it('should search vehicles by plate number', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋車牌號碼/);
    fireEvent.change(searchInput, { target: { value: 'TPE-5' } });
    
    waitFor(() => {
      expect(screen.queryByText('TPE-1234')).not.toBeInTheDocument();
      expect(screen.getByText('TPE-5678')).toBeInTheDocument();
      expect(screen.queryByText('TPE-9012')).not.toBeInTheDocument();
    });
  });

  it('should sort vehicles', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const sortSelect = screen.getByLabelText(/排序/);
    fireEvent.change(sortSelect, { target: { value: 'mileage_asc' } });
    
    const vehicleCards = screen.getAllByTestId(/vehicle-card-/);
    expect(vehicleCards[0]).toHaveTextContent('TPE-1234'); // Lowest mileage
  });

  it('should display fuel efficiency', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText('油耗: 8.5 km/l')).toBeInTheDocument();
  });

  it('should show vehicle features', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const vehicleCard = screen.getByTestId('vehicle-card-VEH_TEST_001');
    fireEvent.click(vehicleCard);
    
    waitFor(() => {
      expect(screen.getByText('GPS')).toBeInTheDocument();
      expect(screen.getByText('溫控')).toBeInTheDocument();
      expect(screen.getByText('升降尾門')).toBeInTheDocument();
    });
  });

  it('should display registration expiry warning', () => {
    const expiringVehicle = testDataBuilders.createTestVehicle({
      registration: {
        number: 'REG-2020-001',
        expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        inspection_due: new Date('2025-09-30'),
      },
    });
    
    renderWithProviders(
      <VehicleList {...defaultProps} vehicles={[expiringVehicle]} />
    );
    
    expect(screen.getByTestId('expiry-warning')).toBeInTheDocument();
    expect(screen.getByText(/註冊即將到期/)).toBeInTheDocument();
  });

  it('should show inspection due warning', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    expect(screen.getByText(/檢驗到期: 2025-09-30/)).toBeInTheDocument();
    expect(screen.getByTestId('inspection-warning')).toBeInTheDocument();
  });

  it('should display GPS tracking status', () => {
    renderWithProviders(<VehicleList {...defaultProps} />);
    
    const trackingIndicator = screen.getByTestId('tracking-status-VEH_TEST_001');
    expect(trackingIndicator).toHaveClass('bg-green-500');
    expect(screen.getByText('GPS 在線')).toBeInTheDocument();
  });

  it('should export vehicle list', () => {
    const onExport = vi.fn();
    renderWithProviders(<VehicleList {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      data: mockVehicles,
    });
  });

  it('should show loading state', () => {
    renderWithProviders(<VehicleList {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<VehicleList {...defaultProps} vehicles={[]} />);
    
    expect(screen.getByText(/沒有車輛資料/)).toBeInTheDocument();
  });
});