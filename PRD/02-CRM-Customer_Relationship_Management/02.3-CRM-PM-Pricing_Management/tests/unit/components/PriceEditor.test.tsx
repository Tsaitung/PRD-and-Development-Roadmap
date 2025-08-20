import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import PriceEditor from '../../../components/PriceEditor';
import { testDataBuilders } from '../../setup';

describe('PriceEditor Component', () => {
  const mockPrice = testDataBuilders.createTestPriceTable();
  
  const defaultProps = {
    price: null,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    customers: [
      { id: 'CUS_001', name: '客戶A', type: 'company' },
      { id: 'CUS_002', name: '客戶B', type: 'store' },
    ],
    products: [
      { id: 'PROD_001', name: '商品A', base_price: 100 },
      { id: 'PROD_002', name: '商品B', base_price: 200 },
    ],
  };

  it('should render form for new price', () => {
    renderWithProviders(<PriceEditor {...defaultProps} />);
    
    expect(screen.getByLabelText(/客戶/)).toBeInTheDocument();
    expect(screen.getByLabelText(/商品/)).toBeInTheDocument();
    expect(screen.getByLabelText(/價格/)).toBeInTheDocument();
    expect(screen.getByLabelText(/生效日期/)).toBeInTheDocument();
  });

  it('should populate form when editing', () => {
    renderWithProviders(<PriceEditor {...defaultProps} price={mockPrice} />);
    
    expect(screen.getByDisplayValue(mockPrice.customer_id)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockPrice.product_id)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockPrice.price.toString())).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithProviders(<PriceEditor {...defaultProps} />);
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/請選擇客戶/)).toBeInTheDocument();
      expect(screen.getByText(/請選擇商品/)).toBeInTheDocument();
      expect(screen.getByText(/請輸入價格/)).toBeInTheDocument();
    });
  });

  it('should validate price range', async () => {
    renderWithProviders(<PriceEditor {...defaultProps} />);
    
    const priceInput = screen.getByLabelText(/價格/);
    fireEvent.change(priceInput, { target: { value: '-10' } });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/價格必須大於0/)).toBeInTheDocument();
    });
  });

  it('should calculate discount rate', () => {
    renderWithProviders(<PriceEditor {...defaultProps} />);
    
    const productSelect = screen.getByLabelText(/商品/);
    fireEvent.change(productSelect, { target: { value: 'PROD_001' } });
    
    const priceInput = screen.getByLabelText(/價格/);
    fireEvent.change(priceInput, { target: { value: '95' } });
    
    expect(screen.getByText(/折扣率: 95%/)).toBeInTheDocument();
  });

  it('should handle date range validation', async () => {
    renderWithProviders(<PriceEditor {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/生效日期/);
    const endDate = screen.getByLabelText(/失效日期/);
    
    fireEvent.change(startDate, { target: { value: '2025-12-31' } });
    fireEvent.change(endDate, { target: { value: '2025-01-01' } });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/失效日期必須晚於生效日期/)).toBeInTheDocument();
    });
  });

  it('should submit valid form', async () => {
    renderWithProviders(<PriceEditor {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
    fireEvent.change(screen.getByLabelText(/商品/), { target: { value: 'PROD_001' } });
    fireEvent.change(screen.getByLabelText(/價格/), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/生效日期/), { target: { value: '2025-09-01' } });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'CUS_001',
          product_id: 'PROD_001',
          price: 150,
        })
      );
    });
  });
});