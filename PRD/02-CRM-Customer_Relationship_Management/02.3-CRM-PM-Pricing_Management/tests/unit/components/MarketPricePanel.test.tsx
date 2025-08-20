import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import MarketPricePanel from '../../../components/MarketPricePanel';
import { testDataBuilders } from '../../setup';

describe('MarketPricePanel Component', () => {
  const mockMarketPrices = [
    testDataBuilders.createTestMarketPriceItem(),
    testDataBuilders.createTestMarketPriceItem({
      item_id: 'MKT_TEST_002',
      product_id: 'PROD_MKT_002',
      product_name: '時價商品B',
      market_price: 200,
      status: 'confirmed',
    }),
  ];

  const defaultProps = {
    marketPrices: mockMarketPrices,
    onReprice: vi.fn(),
    onConfirm: vi.fn(),
    onReject: vi.fn(),
    loading: false,
  };

  it('should display market price items', () => {
    renderWithProviders(<MarketPricePanel {...defaultProps} />);
    
    expect(screen.getByText('時價商品A')).toBeInTheDocument();
    expect(screen.getByText('時價商品B')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should show status indicators', () => {
    renderWithProviders(<MarketPricePanel {...defaultProps} />);
    
    const pendingBadge = screen.getByText('待確認');
    const confirmedBadge = screen.getByText('已確認');
    
    expect(pendingBadge).toHaveClass('badge-warning');
    expect(confirmedBadge).toHaveClass('badge-success');
  });

  it('should enable confirm action for pending items', () => {
    renderWithProviders(<MarketPricePanel {...defaultProps} />);
    
    const rows = screen.getAllByRole('row');
    const pendingRow = rows[1]; // First data row
    
    const confirmBtn = within(pendingRow).getByRole('button', { name: /確認/ });
    expect(confirmBtn).toBeEnabled();
    
    fireEvent.click(confirmBtn);
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('MKT_TEST_001');
  });

  it('should handle batch reprice', () => {
    renderWithProviders(<MarketPricePanel {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first item
    fireEvent.click(checkboxes[2]); // Select second item
    
    const repriceBtn = screen.getByRole('button', { name: /批量回填/ });
    expect(repriceBtn).toBeEnabled();
    
    fireEvent.click(repriceBtn);
    
    expect(defaultProps.onReprice).toHaveBeenCalledWith(['MKT_TEST_001', 'MKT_TEST_002']);
  });

  it('should filter by status', () => {
    renderWithProviders(<MarketPricePanel {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態篩選/);
    fireEvent.change(statusFilter, { target: { value: 'pending' } });
    
    expect(screen.getByText('時價商品A')).toBeInTheDocument();
    expect(screen.queryByText('時價商品B')).not.toBeInTheDocument();
  });

  it('should show reprice confirmation dialog', async () => {
    renderWithProviders(<MarketPricePanel {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    
    const repriceBtn = screen.getByRole('button', { name: /批量回填/ });
    fireEvent.click(repriceBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/確認回填價格？/)).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByRole('button', { name: /確認回填/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onReprice).toHaveBeenCalled();
  });
});