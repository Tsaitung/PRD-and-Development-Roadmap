import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import RouteTable from '../../../components/RouteTable';
import { testDataBuilders } from '../../setup';

describe('RouteTable Component', () => {
  const mockRoutes = [
    testDataBuilders.createTestDeliveryRoute(),
    testDataBuilders.createTestDeliveryRoute({
      route_id: 'ROUTE_002',
      route_number: 'RT-20250820-002',
      driver_name: '李司機',
      status: 'in_progress',
      completed_stops: 3,
    }),
    testDataBuilders.createTestDeliveryRoute({
      route_id: 'ROUTE_003',
      route_number: 'RT-20250820-003',
      driver_name: '王司機',
      status: 'completed',
      completed_stops: 8,
      actual_time: 235,
    }),
  ];

  const defaultProps = {
    routes: mockRoutes,
    loading: false,
    onSort: vi.fn(),
    onFilter: vi.fn(),
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
    selectedRoutes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render route list', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    expect(screen.getByText('RT-20250820-001')).toBeInTheDocument();
    expect(screen.getByText('張司機')).toBeInTheDocument();
    expect(screen.getByText('TPE-1234')).toBeInTheDocument();
  });

  it('should display route status', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    expect(screen.getByText('已規劃')).toBeInTheDocument();
    expect(screen.getByText('進行中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('should show progress indicators', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const progressBar1 = screen.getByTestId('progress-ROUTE_TEST_001');
    expect(progressBar1).toHaveTextContent('0/8');
    
    const progressBar2 = screen.getByTestId('progress-ROUTE_002');
    expect(progressBar2).toHaveTextContent('3/8');
    
    const progressBar3 = screen.getByTestId('progress-ROUTE_003');
    expect(progressBar3).toHaveTextContent('8/8');
  });

  it('should display distance and time', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    expect(screen.getByText('45.5 km')).toBeInTheDocument();
    expect(screen.getByText('240 分鐘')).toBeInTheDocument();
  });

  it('should handle sorting', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const routeHeader = screen.getByText('路線編號');
    fireEvent.click(routeHeader);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('route_number', 'asc');
    
    fireEvent.click(routeHeader);
    expect(defaultProps.onSort).toHaveBeenCalledWith('route_number', 'desc');
  });

  it('should handle row selection', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First route checkbox
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith(['ROUTE_TEST_001']);
  });

  it('should show optimization score', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const score = screen.getByTestId('optimization-score-ROUTE_TEST_001');
    expect(score).toHaveTextContent('92');
    expect(score).toHaveClass('text-green-600');
  });

  it('should display start and end locations', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    expect(screen.getAllByText('北區配送中心')).toHaveLength(6); // Start and end for 3 routes
  });

  it('should handle view details action', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const viewButtons = screen.getAllByRole('button', { name: /查看詳情/ });
    fireEvent.click(viewButtons[0]);
    
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('ROUTE_TEST_001');
  });

  it('should handle edit action', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const editButtons = screen.getAllByRole('button', { name: /編輯/ });
    fireEvent.click(editButtons[0]);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('ROUTE_TEST_001');
  });

  it('should show loading state', () => {
    renderWithProviders(<RouteTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<RouteTable {...defaultProps} routes={[]} />);
    
    expect(screen.getByText(/沒有路線資料/)).toBeInTheDocument();
  });

  it('should highlight delayed routes', () => {
    const delayedRoute = testDataBuilders.createTestDeliveryRoute({
      status: 'in_progress',
      estimated_time: 240,
      actual_time: 280, // 40 minutes delay
    });
    
    renderWithProviders(<RouteTable {...defaultProps} routes={[delayedRoute]} />);
    
    const routeRow = screen.getByTestId('route-row-ROUTE_TEST_001');
    expect(routeRow).toHaveClass('bg-red-50');
  });

  it('should show fuel estimate', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    expect(screen.getByText('8.5 L')).toBeInTheDocument();
  });

  it('should filter by status', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態/);
    fireEvent.change(statusFilter, { target: { value: 'in_progress' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      status: 'in_progress',
    });
  });

  it('should filter by date', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const dateFilter = screen.getByLabelText(/日期/);
    fireEvent.change(dateFilter, { target: { value: '2025-08-20' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      date: '2025-08-20',
    });
  });

  it('should display driver contact', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const driverCell = screen.getByTestId('driver-cell-ROUTE_TEST_001');
    fireEvent.mouseEnter(driverCell);
    
    waitFor(() => {
      expect(screen.getByText('DRV_001')).toBeInTheDocument();
      expect(screen.getByText(/聯絡/)).toBeInTheDocument();
    });
  });

  it('should show route timeline', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const timelineBtn = screen.getByRole('button', { name: /時間軸/ });
    fireEvent.click(timelineBtn);
    
    expect(screen.getByTestId('route-timeline')).toBeInTheDocument();
  });

  it('should handle bulk actions', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    // Select all routes
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    fireEvent.click(selectAllCheckbox);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith([
      'ROUTE_TEST_001',
      'ROUTE_002',
      'ROUTE_003',
    ]);
    
    // Bulk action menu should appear
    expect(screen.getByRole('button', { name: /批量操作/ })).toBeInTheDocument();
  });

  it('should export route data', () => {
    const onExport = vi.fn();
    renderWithProviders(<RouteTable {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      routes: mockRoutes,
    });
  });

  it('should show route map preview', async () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const mapBtn = screen.getAllByRole('button', { name: /地圖/ })[0];
    fireEvent.click(mapBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('route-map-modal')).toBeInTheDocument();
      expect(screen.getByText(/路線地圖/)).toBeInTheDocument();
    });
  });

  it('should display stop count badge', () => {
    renderWithProviders(<RouteTable {...defaultProps} />);
    
    const stopBadge = screen.getByTestId('stops-badge-ROUTE_TEST_001');
    expect(stopBadge).toHaveTextContent('8 站');
  });
});