import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import DriverList from '../../../components/DriverList';
import { testDataBuilders } from '../../setup';

describe('DriverList Component', () => {
  const mockDrivers = [
    testDataBuilders.createTestDriver(),
    testDataBuilders.createTestDriver({
      driver_id: 'DRV_002',
      name: '李司機',
      availability: 'on_route',
      current_route: 'ROUTE_002',
      performance: { rating: 4.6, on_time_rate: 92 },
    }),
    testDataBuilders.createTestDriver({
      driver_id: 'DRV_003',
      name: '王司機',
      status: 'on_leave',
      availability: 'unavailable',
    }),
  ];

  const defaultProps = {
    drivers: mockDrivers,
    loading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
    onFilter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render driver list', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    expect(screen.getByText('測試司機')).toBeInTheDocument();
    expect(screen.getByText('李司機')).toBeInTheDocument();
    expect(screen.getByText('王司機')).toBeInTheDocument();
  });

  it('should display driver status', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    expect(screen.getByText('在職')).toBeInTheDocument();
    expect(screen.getByText('請假中')).toBeInTheDocument();
  });

  it('should show availability status', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const availableChip = screen.getByTestId('availability-DRV_TEST_001');
    expect(availableChip).toHaveTextContent('可用');
    expect(availableChip).toHaveClass('bg-green-100');
    
    const onRouteChip = screen.getByTestId('availability-DRV_002');
    expect(onRouteChip).toHaveTextContent('配送中');
    expect(onRouteChip).toHaveClass('bg-blue-100');
    
    const unavailableChip = screen.getByTestId('availability-DRV_003');
    expect(unavailableChip).toHaveTextContent('不可用');
    expect(unavailableChip).toHaveClass('bg-gray-100');
  });

  it('should display performance rating', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const rating1 = screen.getByTestId('rating-DRV_TEST_001');
    expect(rating1).toHaveTextContent('4.8');
    
    const rating2 = screen.getByTestId('rating-DRV_002');
    expect(rating2).toHaveTextContent('4.6');
  });

  it('should show license information', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    expect(screen.getByText('DL-123456789')).toBeInTheDocument();
    expect(screen.getByText('專業駕照')).toBeInTheDocument();
  });

  it('should display license expiry warning', () => {
    const expiringDriver = testDataBuilders.createTestDriver({
      license_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    
    renderWithProviders(
      <DriverList {...defaultProps} drivers={[expiringDriver]} />
    );
    
    expect(screen.getByTestId('expiry-warning')).toBeInTheDocument();
    expect(screen.getByText(/駕照即將到期/)).toBeInTheDocument();
  });

  it('should filter drivers by status', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態/);
    fireEvent.change(statusFilter, { target: { value: 'active' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      status: 'active',
    });
  });

  it('should filter drivers by availability', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const availabilityFilter = screen.getByLabelText(/可用性/);
    fireEvent.change(availabilityFilter, { target: { value: 'available' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      availability: 'available',
    });
  });

  it('should handle view details action', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const viewBtn = screen.getAllByRole('button', { name: /查看詳情/ })[0];
    fireEvent.click(viewBtn);
    
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('DRV_TEST_001');
  });

  it('should handle edit action', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const editBtn = screen.getAllByRole('button', { name: /編輯/ })[0];
    fireEvent.click(editBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('DRV_TEST_001');
  });

  it('should handle delete action with confirmation', async () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const deleteBtn = screen.getAllByRole('button', { name: /刪除/ })[0];
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/確認刪除司機/)).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByRole('button', { name: /確認刪除/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('DRV_TEST_001');
  });

  it('should display contact information', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    expect(screen.getByText('0912-345-678')).toBeInTheDocument();
    expect(screen.getByText('driver001@test.com')).toBeInTheDocument();
  });

  it('should show assigned vehicle', () => {
    const driverWithVehicle = testDataBuilders.createTestDriver({
      assigned_vehicle: 'VEH_001',
    });
    
    renderWithProviders(
      <DriverList {...defaultProps} drivers={[driverWithVehicle]} />
    );
    
    expect(screen.getByText('VEH_001')).toBeInTheDocument();
  });

  it('should display skills and certifications', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const driverCard = screen.getByTestId('driver-card-DRV_TEST_001');
    fireEvent.click(driverCard);
    
    waitFor(() => {
      expect(screen.getByText('一般貨物')).toBeInTheDocument();
      expect(screen.getByText('溫控運輸')).toBeInTheDocument();
      expect(screen.getByText('危險品')).toBeInTheDocument();
      expect(screen.getByText('安全訓練')).toBeInTheDocument();
      expect(screen.getByText('防禦駕駛')).toBeInTheDocument();
    });
  });

  it('should search drivers by name', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋司機/);
    fireEvent.change(searchInput, { target: { value: '李' } });
    
    waitFor(() => {
      expect(screen.queryByText('測試司機')).not.toBeInTheDocument();
      expect(screen.getByText('李司機')).toBeInTheDocument();
      expect(screen.queryByText('王司機')).not.toBeInTheDocument();
    });
  });

  it('should sort drivers', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const sortSelect = screen.getByLabelText(/排序/);
    fireEvent.change(sortSelect, { target: { value: 'rating_desc' } });
    
    const driverCards = screen.getAllByTestId(/driver-card-/);
    expect(driverCards[0]).toHaveTextContent('測試司機'); // Rating 4.8
    expect(driverCards[1]).toHaveTextContent('李司機'); // Rating 4.6
  });

  it('should show loading state', () => {
    renderWithProviders(<DriverList {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<DriverList {...defaultProps} drivers={[]} />);
    
    expect(screen.getByText(/沒有司機資料/)).toBeInTheDocument();
  });

  it('should export driver list', () => {
    const onExport = vi.fn();
    renderWithProviders(<DriverList {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      data: mockDrivers,
    });
  });

  it('should show hire date and experience', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    expect(screen.getByText(/入職日期: 2020-01-15/)).toBeInTheDocument();
    expect(screen.getByText(/5 年經驗/)).toBeInTheDocument();
  });

  it('should display emergency contact', () => {
    renderWithProviders(<DriverList {...defaultProps} />);
    
    const moreBtn = screen.getAllByRole('button', { name: /更多/ })[0];
    fireEvent.click(moreBtn);
    
    waitFor(() => {
      expect(screen.getByText('緊急聯絡人')).toBeInTheDocument();
      expect(screen.getByText('0923-456-789')).toBeInTheDocument();
      expect(screen.getByText('配偶')).toBeInTheDocument();
    });
  });
});