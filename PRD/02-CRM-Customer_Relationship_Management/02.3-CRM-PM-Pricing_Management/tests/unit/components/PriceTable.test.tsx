import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import PriceTable from '../../../components/PriceTable';
import { testDataBuilders } from '../../setup';

describe('PriceTable Component', () => {
  const mockPrices = [
    testDataBuilders.createTestPriceTable(),
    testDataBuilders.createTestPriceTable({
      price_id: 'PRC_TEST_002',
      product_id: 'PROD_TEST_002',
      product_name: '測試商品B',
      price: 200,
    }),
  ];

  const defaultProps = {
    prices: mockPrices,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onBulkAction: vi.fn(),
    loading: false,
  };

  it('should render price table with data', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    expect(screen.getByText('測試商品A')).toBeInTheDocument();
    expect(screen.getByText('測試商品B')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should display price type badges', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    const specialBadge = screen.getByText('特殊價');
    expect(specialBadge).toHaveClass('badge-special');
  });

  it('should show effective date range', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/2025-12-31/)).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    const editButtons = screen.getAllByRole('button', { name: /編輯/ });
    fireEvent.click(editButtons[0]);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('PRC_TEST_001');
  });

  it('should handle delete with confirmation', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /刪除/ });
    fireEvent.click(deleteButtons[0]);
    
    // Confirm dialog should appear
    const confirmBtn = screen.getByRole('button', { name: /確認刪除/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('PRC_TEST_001');
  });

  it('should support row selection', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First row checkbox
    
    expect(screen.getByText(/已選擇 1 項/)).toBeInTheDocument();
  });

  it('should enable bulk actions when items selected', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    
    const bulkEditBtn = screen.getByRole('button', { name: /批量編輯/ });
    expect(bulkEditBtn).toBeEnabled();
    
    fireEvent.click(bulkEditBtn);
    expect(defaultProps.onBulkAction).toHaveBeenCalledWith('edit', ['PRC_TEST_001', 'PRC_TEST_002']);
  });

  it('should show loading state', () => {
    renderWithProviders(<PriceTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    renderWithProviders(<PriceTable {...defaultProps} prices={[]} />);
    
    expect(screen.getByText(/暫無價格資料/)).toBeInTheDocument();
  });

  it('should sort by column', () => {
    renderWithProviders(<PriceTable {...defaultProps} />);
    
    const priceHeader = screen.getByText('價格');
    fireEvent.click(priceHeader);
    
    // Check if sorted
    const prices = screen.getAllByTestId(/price-value/);
    expect(prices[0]).toHaveTextContent('100');
    expect(prices[1]).toHaveTextContent('200');
  });
});