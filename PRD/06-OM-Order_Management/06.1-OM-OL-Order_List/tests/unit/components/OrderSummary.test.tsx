import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderSummary from '../../../components/OrderSummary';
import { testDataBuilders } from '../../setup';

describe('OrderSummary Component', () => {
  const mockSummary = testDataBuilders.createTestOrderSummary();
  
  const defaultProps = {
    summary: mockSummary,
    loading: false,
    onDateChange: vi.fn(),
    onPeriodChange: vi.fn(),
  };

  it('should display order statistics', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    expect(screen.getByText(/總訂單數: 50/)).toBeInTheDocument();
    expect(screen.getByText(/待確認: 5/)).toBeInTheDocument();
    expect(screen.getByText(/已確認: 20/)).toBeInTheDocument();
    expect(screen.getByText(/處理中: 15/)).toBeInTheDocument();
    expect(screen.getByText(/已出貨: 8/)).toBeInTheDocument();
    expect(screen.getByText(/已完成: 2/)).toBeInTheDocument();
  });

  it('should display revenue information', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    expect(screen.getByText(/總營業額: 500,000/)).toBeInTheDocument();
    expect(screen.getByText(/平均訂單金額: 10,000/)).toBeInTheDocument();
    expect(screen.getByText(/總商品數: 1,500/)).toBeInTheDocument();
  });

  it('should display top customers', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    expect(screen.getByText('客戶A')).toBeInTheDocument();
    expect(screen.getByText(/10 筆訂單/)).toBeInTheDocument();
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
    
    expect(screen.getByText('客戶B')).toBeInTheDocument();
    expect(screen.getByText(/8 筆訂單/)).toBeInTheDocument();
    expect(screen.getByText(/80,000/)).toBeInTheDocument();
  });

  it('should display top products', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    expect(screen.getByText('商品A')).toBeInTheDocument();
    expect(screen.getByText(/數量: 100/)).toBeInTheDocument();
    expect(screen.getByText(/金額: 50,000/)).toBeInTheDocument();
    
    expect(screen.getByText('商品B')).toBeInTheDocument();
    expect(screen.getByText(/數量: 80/)).toBeInTheDocument();
    expect(screen.getByText(/金額: 40,000/)).toBeInTheDocument();
  });

  it('should handle date change', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    const dateInput = screen.getByLabelText(/選擇日期/);
    fireEvent.change(dateInput, { target: { value: '2025-08-19' } });
    
    expect(defaultProps.onDateChange).toHaveBeenCalledWith('2025-08-19');
  });

  it('should handle period change', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    const periodSelect = screen.getByLabelText(/統計週期/);
    fireEvent.change(periodSelect, { target: { value: 'weekly' } });
    
    expect(defaultProps.onPeriodChange).toHaveBeenCalledWith('weekly');
  });

  it('should show loading state', () => {
    renderWithProviders(<OrderSummary {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display chart visualization', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    expect(screen.getByTestId('order-status-chart')).toBeInTheDocument();
    expect(screen.getByTestId('revenue-trend-chart')).toBeInTheDocument();
  });

  it('should show percentage breakdown', () => {
    renderWithProviders(<OrderSummary {...defaultProps} />);
    
    expect(screen.getByText(/待確認 10%/)).toBeInTheDocument();
    expect(screen.getByText(/已確認 40%/)).toBeInTheDocument();
    expect(screen.getByText(/處理中 30%/)).toBeInTheDocument();
  });

  it('should export summary report', () => {
    const onExport = vi.fn();
    renderWithProviders(<OrderSummary {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalled();
  });
});