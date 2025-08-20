import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import DriverManagement from '../../../components/DriverManagement';
import { testDataBuilders } from '../../setup';

describe('DriverManagement Component', () => {
  const mockDrivers = [
    testDataBuilders.createTestDriver(),
    testDataBuilders.createTestDriver({
      driver_id: 'DRV_002',
      driver_name: '李司機',
      status: 'on_route',
      today_routes: 2,
      today_distance: 85.5,
    }),
    testDataBuilders.createTestDriver({
      driver_id: 'DRV_003',
      driver_name: '王司機',
      status: 'break',
      today_routes: 1,
      today_distance: 42.3,
    }),
  ];

  const defaultProps = {
    drivers: mockDrivers,
    loading: false,
    onUpdateStatus: vi.fn(),
    onAssignRoute: vi.fn(),
    onViewDetails: vi.fn(),
  };

  it('should display driver list', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    expect(screen.getByText('測試司機')).toBeInTheDocument();
    expect(screen.getByText('李司機')).toBeInTheDocument();
    expect(screen.getByText('王司機')).toBeInTheDocument();
  });

  it('should show driver status', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    expect(screen.getByText('可用')).toBeInTheDocument();
    expect(screen.getByText('配送中')).toBeInTheDocument();
    expect(screen.getByText('休息中')).toBeInTheDocument();
  });

  it('should display today statistics', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    expect(screen.getByText('0 趟')).toBeInTheDocument();
    expect(screen.getByText('2 趟')).toBeInTheDocument();
    expect(screen.getByText('85.5 km')).toBeInTheDocument();
  });

  it('should show driver rating', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const rating = screen.getByTestId('driver-rating-DRV_TEST_001');
    expect(rating).toHaveTextContent('4.8');
  });

  it('should update driver status', async () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const statusBtn = screen.getAllByRole('button', { name: /更改狀態/ })[0];
    fireEvent.click(statusBtn);
    
    const breakOption = screen.getByText('休息');
    fireEvent.click(breakOption);
    
    expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith('DRV_TEST_001', 'break');
  });

  it('should filter drivers by status', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態篩選/);
    fireEvent.change(statusFilter, { target: { value: 'available' } });
    
    expect(screen.getByText('測試司機')).toBeInTheDocument();
    expect(screen.queryByText('李司機')).not.toBeInTheDocument();
  });

  it('should display license expiry warning', () => {
    const expiringDriver = testDataBuilders.createTestDriver({
      license_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    renderWithProviders(
      <DriverManagement {...defaultProps} drivers={[expiringDriver]} />
    );
    
    expect(screen.getByTestId('license-warning')).toBeInTheDocument();
    expect(screen.getByText(/駕照即將到期/)).toBeInTheDocument();
  });

  it('should show vehicle assignment', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const vehicleInfo = screen.getByTestId('assigned-vehicle-DRV_002');
    expect(vehicleInfo).toHaveTextContent('VEH_002');
  });

  it('should handle route assignment', async () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const assignBtn = screen.getAllByRole('button', { name: /分配路線/ })[0];
    fireEvent.click(assignBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const routeSelect = screen.getByLabelText(/選擇路線/);
    fireEvent.change(routeSelect, { target: { value: 'ROUTE_001' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認分配/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onAssignRoute).toHaveBeenCalledWith('DRV_TEST_001', 'ROUTE_001');
  });

  it('should display driver zones', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    expect(screen.getByText('北區, 中區')).toBeInTheDocument();
  });

  it('should show experience years', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    expect(screen.getByText('5 年經驗')).toBeInTheDocument();
  });

  it('should display driver utilization', () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const utilization = screen.getByTestId('driver-utilization-DRV_002');
    expect(utilization).toHaveTextContent('80%'); // 2 routes
  });

  it('should show driver availability calendar', async () => {
    renderWithProviders(<DriverManagement {...defaultProps} />);
    
    const calendarBtn = screen.getByRole('button', { name: /查看排班/ });
    fireEvent.click(calendarBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('driver-calendar')).toBeInTheDocument();
    });
  });

  it('should export driver report', () => {
    const onExport = vi.fn();
    renderWithProviders(<DriverManagement {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      drivers: mockDrivers,
    });
  });
});