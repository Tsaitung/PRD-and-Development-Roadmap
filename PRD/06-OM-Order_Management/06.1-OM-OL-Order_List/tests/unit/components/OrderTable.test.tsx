import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderTable from '../../../components/OrderTable';
import { testDataBuilders } from '../../setup';

describe('OrderTable Component', () => {
  const mockOrders = testDataBuilders.createTestBatchOrders(5);
  
  const defaultProps = {
    orders: mockOrders,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onStatusChange: vi.fn(),
    onDuplicate: vi.fn(),
    onView: vi.fn(),
    loading: false,
    selectedOrders: [],
    onSelectionChange: vi.fn(),
  };

  it('should render order table with data', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    expect(screen.getByText('SO-20250820-001')).toBeInTheDocument();
    expect(screen.getByText('測試客戶1')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();
  });

  it('should display order status badges', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    expect(screen.getByText('待確認')).toBeInTheDocument();
    expect(screen.getByText('已確認')).toBeInTheDocument();
    expect(screen.getByText('處理中')).toBeInTheDocument();
  });

  it('should show delivery date and time', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const firstRow = screen.getByTestId('order-row-0');
    expect(within(firstRow).getByText(/2025-08-21/)).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const editButtons = screen.getAllByRole('button', { name: /編輯/ });
    fireEvent.click(editButtons[0]);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('ORD_TEST_001');
  });

  it('should handle view details action', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const viewButtons = screen.getAllByRole('button', { name: /檢視/ });
    fireEvent.click(viewButtons[0]);
    
    expect(defaultProps.onView).toHaveBeenCalledWith('ORD_TEST_001');
  });

  it('should handle status change', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const statusButtons = screen.getAllByTestId(/status-btn/);
    fireEvent.click(statusButtons[0]);
    
    const confirmOption = screen.getByText('確認訂單');
    fireEvent.click(confirmOption);
    
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith('ORD_TEST_001', 'confirmed');
  });

  it('should support row selection', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First row checkbox
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['ORD_TEST_001']);
  });

  it('should select all rows', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(
      mockOrders.map(o => o.order_id)
    );
  });

  it('should duplicate order', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const moreButtons = screen.getAllByTestId(/more-actions/);
    fireEvent.click(moreButtons[0]);
    
    const duplicateOption = screen.getByText('複製訂單');
    fireEvent.click(duplicateOption);
    
    expect(defaultProps.onDuplicate).toHaveBeenCalledWith('ORD_TEST_001');
  });

  it('should show loading state', () => {
    renderWithProviders(<OrderTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    renderWithProviders(<OrderTable {...defaultProps} orders={[]} />);
    
    expect(screen.getByText(/暫無訂單資料/)).toBeInTheDocument();
  });

  it('should highlight priority orders', () => {
    const urgentOrder = testDataBuilders.createTestOrder({
      order_id: 'ORD_URGENT',
      priority: 'urgent',
    });
    
    renderWithProviders(
      <OrderTable {...defaultProps} orders={[urgentOrder]} />
    );
    
    const urgentBadge = screen.getByText('緊急');
    expect(urgentBadge).toHaveClass('badge-urgent');
  });

  it('should show payment status', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    expect(screen.getByText('未付款')).toBeInTheDocument();
  });

  it('should sort by column', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    const dateHeader = screen.getByText('訂單日期');
    fireEvent.click(dateHeader);
    
    // Verify sort indicator appears
    expect(screen.getByTestId('sort-asc')).toBeInTheDocument();
    
    fireEvent.click(dateHeader);
    expect(screen.getByTestId('sort-desc')).toBeInTheDocument();
  });
});