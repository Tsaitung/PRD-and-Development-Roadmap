import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import PriceBulkEditor from '../../../components/PriceBulkEditor';

describe('PriceBulkEditor Component', () => {
  const defaultProps = {
    selectedItems: ['PRC_001', 'PRC_002', 'PRC_003'],
    onApply: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should render bulk edit options', () => {
    renderWithProviders(<PriceBulkEditor {...defaultProps} />);
    
    expect(screen.getByText(/批量編輯 3 個項目/)).toBeInTheDocument();
    expect(screen.getByLabelText(/調整方式/)).toBeInTheDocument();
    expect(screen.getByLabelText(/調整數值/)).toBeInTheDocument();
  });

  it('should handle percentage adjustment', async () => {
    renderWithProviders(<PriceBulkEditor {...defaultProps} />);
    
    const adjustmentType = screen.getByLabelText(/調整方式/);
    fireEvent.change(adjustmentType, { target: { value: 'percentage' } });
    
    const adjustmentValue = screen.getByLabelText(/調整數值/);
    fireEvent.change(adjustmentValue, { target: { value: '10' } });
    
    const applyBtn = screen.getByRole('button', { name: /套用/ });
    fireEvent.click(applyBtn);
    
    await waitFor(() => {
      expect(defaultProps.onApply).toHaveBeenCalledWith({
        items: ['PRC_001', 'PRC_002', 'PRC_003'],
        adjustment_type: 'percentage',
        adjustment_value: 10,
      });
    });
  });

  it('should handle fixed amount adjustment', async () => {
    renderWithProviders(<PriceBulkEditor {...defaultProps} />);
    
    const adjustmentType = screen.getByLabelText(/調整方式/);
    fireEvent.change(adjustmentType, { target: { value: 'fixed' } });
    
    const adjustmentValue = screen.getByLabelText(/調整數值/);
    fireEvent.change(adjustmentValue, { target: { value: '50' } });
    
    const increaseRadio = screen.getByLabelText(/增加/);
    fireEvent.click(increaseRadio);
    
    const applyBtn = screen.getByRole('button', { name: /套用/ });
    fireEvent.click(applyBtn);
    
    await waitFor(() => {
      expect(defaultProps.onApply).toHaveBeenCalledWith({
        items: ['PRC_001', 'PRC_002', 'PRC_003'],
        adjustment_type: 'fixed',
        adjustment_value: 50,
        direction: 'increase',
      });
    });
  });

  it('should validate adjustment value', async () => {
    renderWithProviders(<PriceBulkEditor {...defaultProps} />);
    
    const adjustmentValue = screen.getByLabelText(/調整數值/);
    fireEvent.change(adjustmentValue, { target: { value: '-10' } });
    
    const applyBtn = screen.getByRole('button', { name: /套用/ });
    fireEvent.click(applyBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/調整數值必須大於0/)).toBeInTheDocument();
    });
  });

  it('should show preview of changes', async () => {
    renderWithProviders(<PriceBulkEditor {...defaultProps} />);
    
    const adjustmentType = screen.getByLabelText(/調整方式/);
    fireEvent.change(adjustmentType, { target: { value: 'percentage' } });
    
    const adjustmentValue = screen.getByLabelText(/調整數值/);
    fireEvent.change(adjustmentValue, { target: { value: '5' } });
    
    const previewBtn = screen.getByRole('button', { name: /預覽變更/ });
    fireEvent.click(previewBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/預計影響 3 個價格項目/)).toBeInTheDocument();
      expect(screen.getByText(/平均調整幅度: 5%/)).toBeInTheDocument();
    });
  });
});