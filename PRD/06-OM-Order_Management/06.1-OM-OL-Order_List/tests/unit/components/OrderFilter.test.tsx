import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderFilter from '../../../components/OrderFilter';

describe('OrderFilter Component', () => {
  const defaultProps = {
    onFilterChange: vi.fn(),
    onReset: vi.fn(),
    customers: [
      { id: 'CUS_001', name: '客戶A' },
      { id: 'CUS_002', name: '客戶B' },
    ],
  };

  it('should render all filter fields', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    expect(screen.getByLabelText(/開始日期/)).toBeInTheDocument();
    expect(screen.getByLabelText(/結束日期/)).toBeInTheDocument();
    expect(screen.getByLabelText(/客戶/)).toBeInTheDocument();
    expect(screen.getByLabelText(/訂單狀態/)).toBeInTheDocument();
    expect(screen.getByLabelText(/付款狀態/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/搜尋訂單編號/)).toBeInTheDocument();
  });

  it('should handle date range filter', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/開始日期/);
    const endDate = screen.getByLabelText(/結束日期/);
    
    fireEvent.change(startDate, { target: { value: '2025-08-01' } });
    fireEvent.change(endDate, { target: { value: '2025-08-31' } });
    
    const applyBtn = screen.getByRole('button', { name: /套用篩選/ });
    fireEvent.click(applyBtn);
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      date_from: '2025-08-01',
      date_to: '2025-08-31',
    });
  });

  it('should handle customer filter', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    const customerSelect = screen.getByLabelText(/客戶/);
    fireEvent.change(customerSelect, { target: { value: 'CUS_001' } });
    
    const applyBtn = screen.getByRole('button', { name: /套用篩選/ });
    fireEvent.click(applyBtn);
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: 'CUS_001',
      })
    );
  });

  it('should handle status filter', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText(/訂單狀態/);
    fireEvent.change(statusSelect, { target: { value: 'confirmed' } });
    
    const applyBtn = screen.getByRole('button', { name: /套用篩選/ });
    fireEvent.click(applyBtn);
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'confirmed',
      })
    );
  });

  it('should handle keyword search', async () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋訂單編號/);
    fireEvent.change(searchInput, { target: { value: 'SO-20250820' } });
    
    // Debounced search
    await waitFor(() => {
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'SO-20250820',
        })
      );
    }, { timeout: 500 });
  });

  it('should reset filters', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    // Set some filters first
    const customerSelect = screen.getByLabelText(/客戶/);
    fireEvent.change(customerSelect, { target: { value: 'CUS_001' } });
    
    const resetBtn = screen.getByRole('button', { name: /重置/ });
    fireEvent.click(resetBtn);
    
    expect(defaultProps.onReset).toHaveBeenCalled();
    expect(customerSelect).toHaveValue('');
  });

  it('should show quick filters', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    const todayBtn = screen.getByRole('button', { name: /今日訂單/ });
    fireEvent.click(todayBtn);
    
    const today = new Date().toISOString().split('T')[0];
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        date_from: today,
        date_to: today,
      })
    );
  });

  it('should filter by priority', () => {
    renderWithProviders(<OrderFilter {...defaultProps} />);
    
    const urgentCheckbox = screen.getByLabelText(/緊急訂單/);
    fireEvent.click(urgentCheckbox);
    
    const applyBtn = screen.getByRole('button', { name: /套用篩選/ });
    fireEvent.click(applyBtn);
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'urgent',
      })
    );
  });
});