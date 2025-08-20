import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import StockAdjustment from '../../../components/StockAdjustment';
import { testDataBuilders } from '../../setup';

describe('StockAdjustment Component', () => {
  const mockItem = testDataBuilders.createTestInventoryItem();
  
  const defaultProps = {
    item: mockItem,
    onAdjust: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render adjustment form', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    expect(screen.getByText('庫存調整')).toBeInTheDocument();
    expect(screen.getByText('SKU_TEST_001 - 測試商品A')).toBeInTheDocument();
    expect(screen.getByText('目前庫存: 500')).toBeInTheDocument();
  });

  it('should display adjustment types', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText(/調整類型/);
    fireEvent.click(typeSelect);
    
    expect(screen.getByText('盤點調整')).toBeInTheDocument();
    expect(screen.getByText('損壞報廢')).toBeInTheDocument();
    expect(screen.getByText('遺失')).toBeInTheDocument();
    expect(screen.getByText('退貨入庫')).toBeInTheDocument();
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('should calculate new quantity on increase', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '50' } });
    
    const increaseRadio = screen.getByLabelText(/增加/);
    fireEvent.click(increaseRadio);
    
    expect(screen.getByText('調整後庫存: 550')).toBeInTheDocument();
  });

  it('should calculate new quantity on decrease', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '50' } });
    
    const decreaseRadio = screen.getByLabelText(/減少/);
    fireEvent.click(decreaseRadio);
    
    expect(screen.getByText('調整後庫存: 450')).toBeInTheDocument();
  });

  it('should validate negative stock', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '600' } });
    
    const decreaseRadio = screen.getByLabelText(/減少/);
    fireEvent.click(decreaseRadio);
    
    const submitBtn = screen.getByRole('button', { name: /確認調整/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/庫存不可為負值/)).toBeInTheDocument();
    });
  });

  it('should require reason for adjustment', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '50' } });
    
    const submitBtn = screen.getByRole('button', { name: /確認調整/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/請輸入調整原因/)).toBeInTheDocument();
    });
  });

  it('should submit valid adjustment', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText(/調整類型/);
    fireEvent.change(typeSelect, { target: { value: 'damage' } });
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '10' } });
    
    const decreaseRadio = screen.getByLabelText(/減少/);
    fireEvent.click(decreaseRadio);
    
    const reasonInput = screen.getByLabelText(/調整原因/);
    fireEvent.change(reasonInput, { target: { value: '運輸過程破損' } });
    
    const submitBtn = screen.getByRole('button', { name: /確認調整/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(defaultProps.onAdjust).toHaveBeenCalledWith({
        item_id: 'INV_TEST_001',
        adjustment_type: 'damage',
        quantity: -10,
        reason: '運輸過程破損',
        before_quantity: 500,
        after_quantity: 490,
      });
    });
  });

  it('should handle cancel', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const cancelBtn = screen.getByRole('button', { name: /取消/ });
    fireEvent.click(cancelBtn);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should show adjustment history', () => {
    const history = [
      testDataBuilders.createTestStockAdjustment(),
      testDataBuilders.createTestStockAdjustment({
        adjustment_id: 'ADJ_002',
        adjustment_type: 'count',
        quantity: 5,
        reason: '盤點調整',
      }),
    ];
    
    renderWithProviders(
      <StockAdjustment {...defaultProps} adjustmentHistory={history} />
    );
    
    const historyTab = screen.getByRole('tab', { name: /調整記錄/ });
    fireEvent.click(historyTab);
    
    expect(screen.getByText('損壞報廢')).toBeInTheDocument();
    expect(screen.getByText('-10')).toBeInTheDocument();
    expect(screen.getByText('盤點調整')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('should require approval for large adjustments', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '200' } });
    
    await waitFor(() => {
      expect(screen.getByText(/需要主管核准/)).toBeInTheDocument();
      expect(screen.getByLabelText(/核准人員/)).toBeInTheDocument();
    });
  });

  it('should upload supporting documents', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const file = new File(['document'], 'adjustment.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/附件/);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('adjustment.pdf')).toBeInTheDocument();
    });
  });

  it('should show cost impact', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/調整數量/);
    fireEvent.change(quantityInput, { target: { value: '10' } });
    
    const decreaseRadio = screen.getByLabelText(/減少/);
    fireEvent.click(decreaseRadio);
    
    expect(screen.getByText(/成本影響: -$500/)).toBeInTheDocument(); // 10 * $50
  });

  it('should validate adjustment date', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInput = screen.getByLabelText(/調整日期/);
    fireEvent.change(dateInput, { 
      target: { value: tomorrow.toISOString().split('T')[0] } 
    });
    
    const submitBtn = screen.getByRole('button', { name: /確認調整/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/調整日期不可為未來日期/)).toBeInTheDocument();
    });
  });

  it('should auto-fill for cycle count adjustment', () => {
    renderWithProviders(<StockAdjustment {...defaultProps} cycleCountId="COUNT_001" />);
    
    expect(screen.getByDisplayValue('盤點調整')).toBeInTheDocument();
    expect(screen.getByDisplayValue('週期盤點 COUNT_001')).toBeInTheDocument();
  });

  it('should show preview before confirmation', async () => {
    renderWithProviders(<StockAdjustment {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/調整類型/), { target: { value: 'damage' } });
    fireEvent.change(screen.getByLabelText(/調整數量/), { target: { value: '10' } });
    fireEvent.click(screen.getByLabelText(/減少/));
    fireEvent.change(screen.getByLabelText(/調整原因/), { target: { value: '破損' } });
    
    const previewBtn = screen.getByRole('button', { name: /預覽/ });
    fireEvent.click(previewBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/調整預覽/)).toBeInTheDocument();
      expect(screen.getByText(/原始庫存: 500/)).toBeInTheDocument();
      expect(screen.getByText(/調整數量: -10/)).toBeInTheDocument();
      expect(screen.getByText(/最終庫存: 490/)).toBeInTheDocument();
    });
  });
});