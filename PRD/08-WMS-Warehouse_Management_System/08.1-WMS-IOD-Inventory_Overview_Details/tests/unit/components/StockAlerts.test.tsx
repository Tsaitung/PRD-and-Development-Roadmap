import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import StockAlerts from '../../../components/StockAlerts';
import { testDataBuilders } from '../../setup';

describe('StockAlerts Component', () => {
  const mockAlerts = [
    testDataBuilders.createTestStockAlert(),
    testDataBuilders.createTestStockAlert({
      alert_id: 'ALERT_002',
      alert_type: 'expiring',
      severity: 'medium',
      product_name: '商品B',
      action_required: '即將過期，需要促銷',
    }),
    testDataBuilders.createTestStockAlert({
      alert_id: 'ALERT_003',
      alert_type: 'overstock',
      severity: 'low',
      product_name: '商品C',
      current_stock: 1500,
      threshold: 1000,
      action_required: '庫存過多，減少採購',
    }),
  ];

  const defaultProps = {
    alerts: mockAlerts,
    loading: false,
    onResolve: vi.fn(),
    onDismiss: vi.fn(),
    onFilter: vi.fn(),
  };

  it('should display alerts', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    expect(screen.getByText('測試商品A')).toBeInTheDocument();
    expect(screen.getByText('商品B')).toBeInTheDocument();
    expect(screen.getByText('商品C')).toBeInTheDocument();
  });

  it('should show alert types with icons', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    expect(screen.getByTestId('low-stock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('expiring-icon')).toBeInTheDocument();
    expect(screen.getByTestId('overstock-icon')).toBeInTheDocument();
  });

  it('should display severity badges', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const highSeverity = screen.getByTestId('severity-high');
    expect(highSeverity).toHaveClass('bg-red-100');
    
    const mediumSeverity = screen.getByTestId('severity-medium');
    expect(mediumSeverity).toHaveClass('bg-yellow-100');
    
    const lowSeverity = screen.getByTestId('severity-low');
    expect(lowSeverity).toHaveClass('bg-blue-100');
  });

  it('should show action required', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    expect(screen.getByText('需要補貨')).toBeInTheDocument();
    expect(screen.getByText('即將過期，需要促銷')).toBeInTheDocument();
    expect(screen.getByText('庫存過多，減少採購')).toBeInTheDocument();
  });

  it('should display stock levels', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    expect(screen.getByText('目前庫存: 80')).toBeInTheDocument();
    expect(screen.getByText('閾值: 100')).toBeInTheDocument();
  });

  it('should filter by alert type', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const typeFilter = screen.getByLabelText(/警報類型/);
    fireEvent.change(typeFilter, { target: { value: 'low_stock' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      type: 'low_stock',
    });
  });

  it('should filter by severity', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const severityFilter = screen.getByLabelText(/嚴重程度/);
    fireEvent.change(severityFilter, { target: { value: 'high' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      severity: 'high',
    });
  });

  it('should handle resolve action', async () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const resolveBtn = screen.getAllByRole('button', { name: /處理/ })[0];
    fireEvent.click(resolveBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/處理警報/)).toBeInTheDocument();
    });
    
    const actionSelect = screen.getByLabelText(/處理方式/);
    fireEvent.change(actionSelect, { target: { value: 'reorder' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認處理/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onResolve).toHaveBeenCalledWith('ALERT_TEST_001', {
      action: 'reorder',
    });
  });

  it('should handle dismiss action', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const dismissBtn = screen.getAllByRole('button', { name: /忽略/ })[0];
    fireEvent.click(dismissBtn);
    
    expect(defaultProps.onDismiss).toHaveBeenCalledWith('ALERT_TEST_001');
  });

  it('should show alert statistics', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const stats = screen.getByTestId('alert-statistics');
    expect(stats).toHaveTextContent('總警報: 3');
    expect(stats).toHaveTextContent('高優先: 1');
    expect(stats).toHaveTextContent('中優先: 1');
    expect(stats).toHaveTextContent('低優先: 1');
  });

  it('should group alerts by type', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const groupBtn = screen.getByRole('button', { name: /按類型分組/ });
    fireEvent.click(groupBtn);
    
    expect(screen.getByText('低庫存 (1)')).toBeInTheDocument();
    expect(screen.getByText('即將過期 (1)')).toBeInTheDocument();
    expect(screen.getByText('庫存過多 (1)')).toBeInTheDocument();
  });

  it('should sort alerts by severity', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const sortSelect = screen.getByLabelText(/排序/);
    fireEvent.change(sortSelect, { target: { value: 'severity_desc' } });
    
    const alertCards = screen.getAllByTestId(/alert-card-/);
    expect(alertCards[0]).toHaveTextContent('測試商品A'); // High severity
  });

  it('should show resolved alerts', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const showResolvedCheckbox = screen.getByLabelText(/顯示已處理/);
    fireEvent.click(showResolvedCheckbox);
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      resolved: true,
    });
  });

  it('should bulk resolve alerts', async () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const selectAll = screen.getByTestId('select-all-alerts');
    fireEvent.click(selectAll);
    
    const bulkResolveBtn = screen.getByRole('button', { name: /批量處理/ });
    fireEvent.click(bulkResolveBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/批量處理 3 個警報/)).toBeInTheDocument();
    });
  });

  it('should export alerts', () => {
    const onExport = vi.fn();
    renderWithProviders(<StockAlerts {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出警報/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      alerts: mockAlerts,
    });
  });

  it('should show alert timeline', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const timelineBtn = screen.getByRole('button', { name: /時間軸/ });
    fireEvent.click(timelineBtn);
    
    expect(screen.getByTestId('alert-timeline')).toBeInTheDocument();
  });

  it('should display alert age', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    expect(screen.getByText(/2 小時前/)).toBeInTheDocument(); // Assuming current time
  });

  it('should show related items for alerts', async () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const alertCard = screen.getByTestId('alert-card-ALERT_TEST_001');
    fireEvent.click(alertCard);
    
    await waitFor(() => {
      expect(screen.getByText(/相關商品/)).toBeInTheDocument();
      expect(screen.getByText('INV_TEST_001')).toBeInTheDocument();
    });
  });

  it('should display notification settings', () => {
    renderWithProviders(<StockAlerts {...defaultProps} />);
    
    const settingsBtn = screen.getByRole('button', { name: /通知設定/ });
    fireEvent.click(settingsBtn);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email 通知/)).toBeInTheDocument();
    expect(screen.getByLabelText(/系統通知/)).toBeInTheDocument();
  });
});