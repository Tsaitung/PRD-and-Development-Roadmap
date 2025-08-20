import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import FleetDashboard from '../../../components/FleetDashboard';
import { testDataBuilders } from '../../setup';

describe('FleetDashboard Component', () => {
  const mockFleetSummary = testDataBuilders.createTestFleetSummary();
  
  const mockDrivers = [
    testDataBuilders.createTestDriver(),
    testDataBuilders.createTestDriver({ 
      driver_id: 'DRV_002', 
      name: '李司機',
      availability: 'on_route',
    }),
    testDataBuilders.createTestDriver({ 
      driver_id: 'DRV_003', 
      name: '王司機',
      status: 'on_leave',
    }),
  ];

  const mockVehicles = [
    testDataBuilders.createTestVehicle(),
    testDataBuilders.createTestVehicle({ 
      vehicle_id: 'VEH_002',
      availability: 'in_use',
    }),
    testDataBuilders.createTestVehicle({ 
      vehicle_id: 'VEH_003',
      status: 'maintenance',
    }),
  ];

  const defaultProps = {
    summary: mockFleetSummary,
    drivers: mockDrivers,
    vehicles: mockVehicles,
    loading: false,
    onRefresh: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render fleet summary statistics', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    expect(screen.getByText('車隊總覽')).toBeInTheDocument();
    expect(screen.getByText('總車輛: 25')).toBeInTheDocument();
    expect(screen.getByText('運行中: 20')).toBeInTheDocument();
    expect(screen.getByText('維修中: 3')).toBeInTheDocument();
  });

  it('should display driver statistics', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    expect(screen.getByText('總司機: 30')).toBeInTheDocument();
    expect(screen.getByText('可用: 22')).toBeInTheDocument();
    expect(screen.getByText('配送中: 18')).toBeInTheDocument();
    expect(screen.getByText('請假: 3')).toBeInTheDocument();
  });

  it('should show fleet utilization rate', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const utilizationCard = screen.getByTestId('utilization-card');
    expect(utilizationCard).toHaveTextContent('車隊使用率');
    expect(utilizationCard).toHaveTextContent('85%');
  });

  it('should display performance metrics', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    expect(screen.getByText('準時配送率: 94.5%')).toBeInTheDocument();
    expect(screen.getByText('車輛停機時間: 2.5%')).toBeInTheDocument();
    expect(screen.getByText('事故率: 0.5%')).toBeInTheDocument();
  });

  it('should show fuel efficiency metrics', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    expect(screen.getByText('平均油耗: 8.2 km/L')).toBeInTheDocument();
    expect(screen.getByText('每日燃料: 450 L')).toBeInTheDocument();
    expect(screen.getByText('燃料成本: $6.5/km')).toBeInTheDocument();
  });

  it('should display maintenance alerts', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const alertsSection = screen.getByTestId('maintenance-alerts');
    expect(alertsSection).toHaveTextContent('保養到期: 5 輛');
    expect(screen.getByRole('button', { name: /查看詳情/ })).toBeInTheDocument();
  });

  it('should show document expiry warnings', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const documentsSection = screen.getByTestId('documents-expiring');
    expect(documentsSection).toHaveTextContent('文件到期: 8 份');
  });

  it('should display real-time vehicle tracking', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const mapSection = screen.getByTestId('fleet-map');
    expect(mapSection).toBeInTheDocument();
    expect(screen.getByText('即時車輛位置')).toBeInTheDocument();
  });

  it('should show driver availability chart', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const chartSection = screen.getByTestId('driver-availability-chart');
    expect(chartSection).toBeInTheDocument();
  });

  it('should display vehicle status distribution', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const pieChart = screen.getByTestId('vehicle-status-pie-chart');
    expect(pieChart).toBeInTheDocument();
  });

  it('should refresh dashboard data', async () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const refreshBtn = screen.getByRole('button', { name: /重新整理/ });
    fireEvent.click(refreshBtn);
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('資料已更新')).toBeInTheDocument();
    });
  });

  it('should filter dashboard by date range', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const dateFilter = screen.getByLabelText(/日期範圍/);
    fireEvent.change(dateFilter, { target: { value: 'last_7_days' } });
    
    expect(screen.getByText('過去7天')).toBeInTheDocument();
  });

  it('should display cost analysis', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const costTab = screen.getByRole('tab', { name: /成本分析/ });
    fireEvent.click(costTab);
    
    expect(screen.getByText('燃料成本')).toBeInTheDocument();
    expect(screen.getByText('維修成本')).toBeInTheDocument();
    expect(screen.getByText('人力成本')).toBeInTheDocument();
  });

  it('should show route efficiency trends', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const trendsTab = screen.getByRole('tab', { name: /趨勢分析/ });
    fireEvent.click(trendsTab);
    
    const trendChart = screen.getByTestId('efficiency-trend-chart');
    expect(trendChart).toBeInTheDocument();
  });

  it('should display top performing drivers', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const leaderboard = screen.getByTestId('driver-leaderboard');
    expect(leaderboard).toHaveTextContent('最佳司機');
    expect(leaderboard).toHaveTextContent('測試司機');
    expect(leaderboard).toHaveTextContent('4.8 ⭐');
  });

  it('should show vehicle utilization heatmap', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const heatmap = screen.getByTestId('utilization-heatmap');
    expect(heatmap).toBeInTheDocument();
    expect(screen.getByText('車輛使用熱圖')).toBeInTheDocument();
  });

  it('should export dashboard report', async () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
    fireEvent.click(exportBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const formatSelect = screen.getByLabelText(/格式/);
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認匯出/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith({ format: 'pdf' });
  });

  it('should display KPI cards', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const kpiSection = screen.getByTestId('kpi-cards');
    expect(kpiSection).toHaveTextContent('平均里程: 180 km/天');
    expect(kpiSection).toHaveTextContent('車隊使用率: 85%');
    expect(kpiSection).toHaveTextContent('準時率: 94.5%');
  });

  it('should show quick actions', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /分配車輛/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /排班管理/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /維修申請/ })).toBeInTheDocument();
  });

  it('should display alerts and notifications', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} />);
    
    const alertsPanel = screen.getByTestId('alerts-panel');
    expect(alertsPanel).toHaveTextContent('緊急通知');
    expect(alertsPanel).toHaveTextContent('5 輛車需要保養');
    expect(alertsPanel).toHaveTextContent('8 份文件即將到期');
  });

  it('should show loading state', () => {
    renderWithProviders(<FleetDashboard {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorProps = {
      ...defaultProps,
      error: '無法載入資料',
    };
    
    renderWithProviders(<FleetDashboard {...errorProps} />);
    
    expect(screen.getByText('無法載入資料')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重試/ })).toBeInTheDocument();
  });
});