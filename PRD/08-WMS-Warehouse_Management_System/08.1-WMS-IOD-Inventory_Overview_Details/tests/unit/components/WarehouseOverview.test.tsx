import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import WarehouseOverview from '../../../components/WarehouseOverview';
import { testDataBuilders } from '../../setup';

describe('WarehouseOverview Component', () => {
  const mockWarehouses = [
    testDataBuilders.createTestWarehouse(),
    testDataBuilders.createTestWarehouse({
      warehouse_id: 'WH_002',
      warehouse_name: '中區倉庫',
      used_capacity: 5200,
      available_capacity: 4800,
    }),
    testDataBuilders.createTestWarehouse({
      warehouse_id: 'WH_003',
      warehouse_name: '南區倉庫',
      used_capacity: 4800,
      available_capacity: 5200,
    }),
  ];

  const defaultProps = {
    warehouses: mockWarehouses,
    loading: false,
    onWarehouseSelect: vi.fn(),
    onRefresh: vi.fn(),
  };

  it('should display warehouse cards', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    expect(screen.getByText('測試倉庫')).toBeInTheDocument();
    expect(screen.getByText('中區倉庫')).toBeInTheDocument();
    expect(screen.getByText('南區倉庫')).toBeInTheDocument();
  });

  it('should show capacity utilization', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const warehouse1 = screen.getByTestId('warehouse-card-WH_TEST_001');
    expect(within(warehouse1).getByText('65%')).toBeInTheDocument(); // 6500/10000
    
    const warehouse2 = screen.getByTestId('warehouse-card-WH_002');
    expect(within(warehouse2).getByText('52%')).toBeInTheDocument(); // 5200/10000
  });

  it('should display capacity bars', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const capacityBar1 = screen.getByTestId('capacity-bar-WH_TEST_001');
    expect(capacityBar1).toHaveStyle({ width: '65%' });
    
    const capacityBar2 = screen.getByTestId('capacity-bar-WH_002');
    expect(capacityBar2).toHaveStyle({ width: '52%' });
  });

  it('should show warehouse status', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    expect(screen.getAllByText('運作中')).toHaveLength(3);
  });

  it('should display temperature control indicator', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const tempControlled = screen.getAllByTestId('temp-controlled-indicator');
    expect(tempControlled).toHaveLength(3);
    expect(tempControlled[0]).toHaveClass('text-blue-500');
  });

  it('should handle warehouse selection', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const selectBtn = screen.getAllByRole('button', { name: /查看詳情/ })[0];
    fireEvent.click(selectBtn);
    
    expect(defaultProps.onWarehouseSelect).toHaveBeenCalledWith('WH_TEST_001');
  });

  it('should show manager information', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    expect(screen.getByText('王經理')).toBeInTheDocument();
    expect(screen.getByText('02-1234-5678')).toBeInTheDocument();
  });

  it('should display location', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    expect(screen.getByText('台北市信義區')).toBeInTheDocument();
    expect(screen.getByText('台中市西屯區')).toBeInTheDocument();
    expect(screen.getByText('高雄市前鎮區')).toBeInTheDocument();
  });

  it('should show total summary', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const summary = screen.getByTestId('warehouse-summary');
    expect(within(summary).getByText('總倉庫數: 3')).toBeInTheDocument();
    expect(within(summary).getByText('總容量: 30,000')).toBeInTheDocument();
    expect(within(summary).getByText('已使用: 16,500')).toBeInTheDocument();
    expect(within(summary).getByText('使用率: 55%')).toBeInTheDocument();
  });

  it('should highlight high utilization warehouses', () => {
    const highUtilWarehouse = testDataBuilders.createTestWarehouse({
      warehouse_id: 'WH_HIGH',
      used_capacity: 9500,
      available_capacity: 500,
    });
    
    renderWithProviders(
      <WarehouseOverview {...defaultProps} warehouses={[highUtilWarehouse]} />
    );
    
    const warehouseCard = screen.getByTestId('warehouse-card-WH_HIGH');
    expect(warehouseCard).toHaveClass('border-red-500');
    expect(within(warehouseCard).getByText('高使用率')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle refresh', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const refreshBtn = screen.getByRole('button', { name: /重新整理/ });
    fireEvent.click(refreshBtn);
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  it('should filter by warehouse type', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const typeFilter = screen.getByLabelText(/倉庫類型/);
    fireEvent.change(typeFilter, { target: { value: 'main' } });
    
    expect(screen.getByText('測試倉庫')).toBeInTheDocument();
  });

  it('should search warehouses', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋倉庫/);
    fireEvent.change(searchInput, { target: { value: '北區' } });
    
    expect(screen.queryByText('測試倉庫')).toBeInTheDocument();
    expect(screen.queryByText('中區倉庫')).not.toBeInTheDocument();
  });

  it('should sort warehouses', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const sortSelect = screen.getByLabelText(/排序/);
    fireEvent.change(sortSelect, { target: { value: 'utilization_desc' } });
    
    const cards = screen.getAllByTestId(/warehouse-card-/);
    expect(cards[0]).toHaveTextContent('測試倉庫'); // 65% utilization
  });

  it('should display warehouse map view', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    const mapViewBtn = screen.getByRole('button', { name: /地圖檢視/ });
    fireEvent.click(mapViewBtn);
    
    expect(screen.getByTestId('warehouse-map')).toBeInTheDocument();
  });

  it('should show warehouse statistics chart', () => {
    renderWithProviders(<WarehouseOverview {...defaultProps} />);
    
    expect(screen.getByTestId('utilization-chart')).toBeInTheDocument();
    expect(screen.getByTestId('capacity-distribution-chart')).toBeInTheDocument();
  });

  it('should export warehouse report', () => {
    const onExport = vi.fn();
    renderWithProviders(<WarehouseOverview {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      warehouses: mockWarehouses,
    });
  });
});