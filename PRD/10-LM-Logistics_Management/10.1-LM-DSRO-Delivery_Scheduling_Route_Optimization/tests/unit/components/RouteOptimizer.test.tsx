import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import RouteOptimizer from '../../../components/RouteOptimizer';
import { testDataBuilders } from '../../setup';

describe('RouteOptimizer Component', () => {
  const mockOrders = [
    { order_id: 'ORD_001', customer_name: '客戶A', address: '台北市信義區', packages: 3 },
    { order_id: 'ORD_002', customer_name: '客戶B', address: '台北市大安區', packages: 2 },
    { order_id: 'ORD_003', customer_name: '客戶C', address: '台北市中山區', packages: 4 },
  ];

  const mockDrivers = [
    testDataBuilders.createTestDriver(),
    testDataBuilders.createTestDriver({ driver_id: 'DRV_002', driver_name: '李司機' }),
  ];

  const mockVehicles = [
    testDataBuilders.createTestVehicle(),
    testDataBuilders.createTestVehicle({ vehicle_id: 'VEH_002', vehicle_number: 'TPE-9012' }),
  ];

  const defaultProps = {
    date: new Date('2025-08-20'),
    orders: mockOrders,
    drivers: mockDrivers,
    vehicles: mockVehicles,
    onOptimize: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render optimization form', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    expect(screen.getByText('路線優化')).toBeInTheDocument();
    expect(screen.getByText(/3 筆訂單/)).toBeInTheDocument();
    expect(screen.getByText(/2 位司機/)).toBeInTheDocument();
    expect(screen.getByText(/2 輛車/)).toBeInTheDocument();
  });

  it('should display optimization parameters', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    expect(screen.getByLabelText(/最大路線距離/)).toBeInTheDocument();
    expect(screen.getByLabelText(/最大路線時間/)).toBeInTheDocument();
    expect(screen.getByLabelText(/每路線最大站點/)).toBeInTheDocument();
  });

  it('should select optimization goals', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const minimizeDistance = screen.getByLabelText(/最短距離/);
    const maximizeOnTime = screen.getByLabelText(/準時率最大化/);
    const balanceRoutes = screen.getByLabelText(/平衡路線/);
    
    expect(minimizeDistance).toBeChecked();
    expect(maximizeOnTime).toBeChecked();
    expect(balanceRoutes).toBeChecked();
  });

  it('should adjust constraint parameters', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const maxDistance = screen.getByLabelText(/最大路線距離/);
    fireEvent.change(maxDistance, { target: { value: '120' } });
    
    const maxTime = screen.getByLabelText(/最大路線時間/);
    fireEvent.change(maxTime, { target: { value: '540' } });
    
    expect(maxDistance).toHaveValue(120);
    expect(maxTime).toHaveValue(540);
  });

  it('should handle driver selection', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const driverCheckboxes = screen.getAllByRole('checkbox', { name: /司機/ });
    fireEvent.click(driverCheckboxes[0]); // Uncheck first driver
    
    expect(screen.getByText(/1 位司機/)).toBeInTheDocument();
  });

  it('should handle vehicle selection', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const vehicleCheckboxes = screen.getAllByRole('checkbox', { name: /車輛/ });
    fireEvent.click(vehicleCheckboxes[1]); // Uncheck second vehicle
    
    expect(screen.getByText(/1 輛車/)).toBeInTheDocument();
  });

  it('should preview optimization request', async () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const previewBtn = screen.getByRole('button', { name: /預覽優化/ });
    fireEvent.click(previewBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/優化預覽/)).toBeInTheDocument();
      expect(screen.getByText(/預計產生 1-2 條路線/)).toBeInTheDocument();
    });
  });

  it('should start optimization', async () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const optimizeBtn = screen.getByRole('button', { name: /開始優化/ });
    fireEvent.click(optimizeBtn);
    
    await waitFor(() => {
      expect(defaultProps.onOptimize).toHaveBeenCalledWith(
        expect.objectContaining({
          optimization_date: expect.any(Date),
          total_orders: 3,
          available_drivers: 2,
          available_vehicles: 2,
        })
      );
    });
  });

  it('should show optimization progress', async () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const optimizeBtn = screen.getByRole('button', { name: /開始優化/ });
    fireEvent.click(optimizeBtn);
    
    expect(screen.getByText(/優化中/)).toBeInTheDocument();
    expect(screen.getByTestId('optimization-progress')).toBeInTheDocument();
  });

  it('should display optimization results', async () => {
    const onOptimize = vi.fn(() => Promise.resolve(
      testDataBuilders.createTestOptimizationResult()
    ));
    
    renderWithProviders(<RouteOptimizer {...defaultProps} onOptimize={onOptimize} />);
    
    const optimizeBtn = screen.getByRole('button', { name: /開始優化/ });
    fireEvent.click(optimizeBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/優化完成/)).toBeInTheDocument();
      expect(screen.getByText(/產生 5 條路線/)).toBeInTheDocument();
      expect(screen.getByText(/總距離: 225.5 km/)).toBeInTheDocument();
      expect(screen.getByText(/節省: 18%/)).toBeInTheDocument();
    });
  });

  it('should apply time window constraints', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const timeWindowCheckbox = screen.getByLabelText(/考慮時間窗口/);
    fireEvent.click(timeWindowCheckbox);
    
    const flexibilitySlider = screen.getByLabelText(/時間窗口彈性/);
    fireEvent.change(flexibilitySlider, { target: { value: '60' } });
    
    expect(flexibilitySlider).toHaveValue('60');
  });

  it('should set vehicle capacity constraints', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const capacityCheckbox = screen.getByLabelText(/車輛容量限制/);
    fireEvent.click(capacityCheckbox);
    
    expect(screen.getByLabelText(/重量限制/)).toBeInTheDocument();
    expect(screen.getByLabelText(/體積限制/)).toBeInTheDocument();
  });

  it('should handle zone constraints', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const zoneCheckbox = screen.getByLabelText(/區域限制/);
    fireEvent.click(zoneCheckbox);
    
    expect(screen.getByText(/北區/)).toBeInTheDocument();
    expect(screen.getByText(/中區/)).toBeInTheDocument();
    expect(screen.getByText(/南區/)).toBeInTheDocument();
  });

  it('should save optimization template', async () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    // Configure settings
    fireEvent.change(screen.getByLabelText(/最大路線距離/), { target: { value: '150' } });
    
    // Save template
    const saveTemplateBtn = screen.getByRole('button', { name: /儲存範本/ });
    fireEvent.click(saveTemplateBtn);
    
    const templateName = screen.getByLabelText(/範本名稱/);
    fireEvent.change(templateName, { target: { value: '週末配送優化' } });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/範本已儲存/)).toBeInTheDocument();
    });
  });

  it('should load optimization template', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const templateSelect = screen.getByLabelText(/選擇範本/);
    fireEvent.change(templateSelect, { target: { value: 'default_weekday' } });
    
    // Should auto-fill parameters
    expect(screen.getByLabelText(/最大路線距離/)).toHaveValue(100);
    expect(screen.getByLabelText(/最大路線時間/)).toHaveValue(480);
  });

  it('should handle optimization error', async () => {
    const onOptimize = vi.fn(() => Promise.reject(new Error('優化失敗')));
    
    renderWithProviders(<RouteOptimizer {...defaultProps} onOptimize={onOptimize} />);
    
    const optimizeBtn = screen.getByRole('button', { name: /開始優化/ });
    fireEvent.click(optimizeBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/優化失敗/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /重試/ })).toBeInTheDocument();
    });
  });

  it('should show cost estimation', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const showCostCheckbox = screen.getByLabelText(/顯示成本估算/);
    fireEvent.click(showCostCheckbox);
    
    expect(screen.getByText(/預估成本/)).toBeInTheDocument();
    expect(screen.getByText(/燃料成本/)).toBeInTheDocument();
    expect(screen.getByText(/人工成本/)).toBeInTheDocument();
  });

  it('should compare optimization scenarios', async () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const compareBtn = screen.getByRole('button', { name: /比較方案/ });
    fireEvent.click(compareBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/方案比較/)).toBeInTheDocument();
      expect(screen.getByText(/最短距離優先/)).toBeInTheDocument();
      expect(screen.getByText(/準時率優先/)).toBeInTheDocument();
      expect(screen.getByText(/成本最優/)).toBeInTheDocument();
    });
  });

  it('should handle cancel action', () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} />);
    
    const cancelBtn = screen.getByRole('button', { name: /取消/ });
    fireEvent.click(cancelBtn);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should validate minimum requirements', async () => {
    renderWithProviders(<RouteOptimizer {...defaultProps} orders={[]} />);
    
    const optimizeBtn = screen.getByRole('button', { name: /開始優化/ });
    fireEvent.click(optimizeBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/沒有訂單需要優化/)).toBeInTheDocument();
    });
  });
});