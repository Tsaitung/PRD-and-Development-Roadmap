import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderDetail from '../../../components/OrderDetail';
import { testDataBuilders } from '../../setup';

describe('OrderDetail Component', () => {
  const mockOrder = testDataBuilders.createTestOrderWithItems();
  const mockHistory = [
    testDataBuilders.createTestOrderHistory(),
    testDataBuilders.createTestOrderHistory({
      history_id: 'HIST_002',
      action: 'item_update',
      comments: '更新商品數量',
    }),
  ];

  const defaultProps = {
    order: mockOrder,
    history: mockHistory,
    onEdit: vi.fn(),
    onStatusChange: vi.fn(),
    onPrint: vi.fn(),
    onExport: vi.fn(),
    onReturn: vi.fn(),
  };

  it('should display order basic information', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    expect(screen.getByText(mockOrder.order_number)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.customer_name)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.store_name)).toBeInTheDocument();
    expect(screen.getByText(/已確認/)).toBeInTheDocument();
  });

  it('should display delivery information', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    expect(screen.getByText(mockOrder.delivery_address)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.delivery_time)).toBeInTheDocument();
    expect(screen.getByText(/2025-08-21/)).toBeInTheDocument();
  });

  it('should display order items', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    expect(screen.getByText('測試商品A')).toBeInTheDocument();
    expect(screen.getByText('測試商品B')).toBeInTheDocument();
    expect(screen.getByText('10 kg')).toBeInTheDocument();
    expect(screen.getByText('5 kg')).toBeInTheDocument();
  });

  it('should display order totals', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    expect(screen.getByText(/小計: 10,000/)).toBeInTheDocument();
    expect(screen.getByText(/稅額: 500/)).toBeInTheDocument();
    expect(screen.getByText(/折扣: 200/)).toBeInTheDocument();
    expect(screen.getByText(/運費: 100/)).toBeInTheDocument();
    expect(screen.getByText(/總計: 10,400/)).toBeInTheDocument();
  });

  it('should display order history', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    const historyTab = screen.getByRole('tab', { name: /歷史記錄/ });
    fireEvent.click(historyTab);
    
    expect(screen.getByText('狀態變更')).toBeInTheDocument();
    expect(screen.getByText('客戶已確認訂單')).toBeInTheDocument();
    expect(screen.getByText('更新商品數量')).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    const editBtn = screen.getByRole('button', { name: /編輯訂單/ });
    fireEvent.click(editBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockOrder.order_id);
  });

  it('should handle status change', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    const statusBtn = screen.getByRole('button', { name: /更改狀態/ });
    fireEvent.click(statusBtn);
    
    const processingOption = screen.getByText('處理中');
    fireEvent.click(processingOption);
    
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith(mockOrder.order_id, 'processing');
  });

  it('should handle print action', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    const printBtn = screen.getByRole('button', { name: /列印/ });
    fireEvent.click(printBtn);
    
    expect(defaultProps.onPrint).toHaveBeenCalledWith(mockOrder.order_id);
  });

  it('should handle export action', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith(mockOrder.order_id);
  });

  it('should display notes', () => {
    renderWithProviders(<OrderDetail {...defaultProps} />);
    
    expect(screen.getByText(mockOrder.notes)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.internal_notes)).toBeInTheDocument();
  });

  it('should show return button for shipped orders', () => {
    const shippedOrder = {
      ...mockOrder,
      status: 'shipped',
    };
    
    renderWithProviders(<OrderDetail {...defaultProps} order={shippedOrder} />);
    
    const returnBtn = screen.getByRole('button', { name: /退貨/ });
    expect(returnBtn).toBeInTheDocument();
    
    fireEvent.click(returnBtn);
    expect(defaultProps.onReturn).toHaveBeenCalledWith(shippedOrder.order_id);
  });
});