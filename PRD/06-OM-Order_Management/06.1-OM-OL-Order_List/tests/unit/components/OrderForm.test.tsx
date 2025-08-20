import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderForm from '../../../components/OrderForm';
import { testDataBuilders } from '../../setup';

describe('OrderForm Component', () => {
  const mockCustomers = [
    { id: 'CUS_001', name: '客戶A', type: 'company' },
    { id: 'CUS_002', name: '客戶B', type: 'store' },
  ];

  const mockProducts = [
    { id: 'PROD_001', name: '商品A', price: 100, stock: 100 },
    { id: 'PROD_002', name: '商品B', price: 200, stock: 50 },
  ];

  const defaultProps = {
    order: null,
    customers: mockCustomers,
    products: mockProducts,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form for new order', () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/客戶/)).toBeInTheDocument();
    expect(screen.getByLabelText(/配送日期/)).toBeInTheDocument();
    expect(screen.getByLabelText(/配送時間/)).toBeInTheDocument();
    expect(screen.getByLabelText(/配送地址/)).toBeInTheDocument();
  });

  it('should populate form when editing', () => {
    const existingOrder = testDataBuilders.createTestOrderWithItems();
    
    renderWithProviders(<OrderForm {...defaultProps} order={existingOrder} />);
    
    expect(screen.getByDisplayValue(existingOrder.customer_id)).toBeInTheDocument();
    expect(screen.getByDisplayValue(existingOrder.delivery_address)).toBeInTheDocument();
  });

  it('should add items to order', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    // Select product
    const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
    fireEvent.click(addItemBtn);
    
    const productSelect = screen.getByTestId('product-select-0');
    fireEvent.change(productSelect, { target: { value: 'PROD_001' } });
    
    const quantityInput = screen.getByTestId('quantity-input-0');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    // Check subtotal calculation
    await waitFor(() => {
      expect(screen.getByText(/500/)).toBeInTheDocument(); // 5 * 100
    });
  });

  it('should remove items from order', () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    // Add two items
    const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
    fireEvent.click(addItemBtn);
    fireEvent.click(addItemBtn);
    
    expect(screen.getAllByTestId(/product-select-/)).toHaveLength(2);
    
    // Remove first item
    const removeBtn = screen.getAllByRole('button', { name: /移除/ })[0];
    fireEvent.click(removeBtn);
    
    expect(screen.getAllByTestId(/product-select-/)).toHaveLength(1);
  });

  it('should validate required fields', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/請選擇客戶/)).toBeInTheDocument();
      expect(screen.getByText(/請選擇配送日期/)).toBeInTheDocument();
      expect(screen.getByText(/請新增至少一項商品/)).toBeInTheDocument();
    });
  });

  it('should validate delivery date', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const deliveryDate = screen.getByLabelText(/配送日期/);
    fireEvent.change(deliveryDate, { 
      target: { value: yesterday.toISOString().split('T')[0] } 
    });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/配送日期不可為過去日期/)).toBeInTheDocument();
    });
  });

  it('should calculate order total', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    // Select customer
    fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
    
    // Add items
    const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
    fireEvent.click(addItemBtn);
    
    fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: 'PROD_001' } });
    fireEvent.change(screen.getByTestId('quantity-input-0'), { target: { value: '10' } });
    
    fireEvent.click(addItemBtn);
    fireEvent.change(screen.getByTestId('product-select-1'), { target: { value: 'PROD_002' } });
    fireEvent.change(screen.getByTestId('quantity-input-1'), { target: { value: '5' } });
    
    await waitFor(() => {
      const subtotal = screen.getByTestId('order-subtotal');
      expect(subtotal).toHaveTextContent('2000'); // (10*100) + (5*200)
      
      const tax = screen.getByTestId('order-tax');
      expect(tax).toHaveTextContent('100'); // 2000 * 0.05
      
      const total = screen.getByTestId('order-total');
      expect(total).toHaveTextContent('2100'); // 2000 + 100
    });
  });

  it('should check stock availability', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
    fireEvent.click(addItemBtn);
    
    fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: 'PROD_002' } });
    fireEvent.change(screen.getByTestId('quantity-input-0'), { target: { value: '100' } });
    
    await waitFor(() => {
      expect(screen.getByText(/庫存不足/)).toBeInTheDocument();
    });
  });

  it('should save draft order', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
    
    const saveDraftBtn = screen.getByRole('button', { name: /儲存草稿/ });
    fireEvent.click(saveDraftBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/草稿已儲存/)).toBeInTheDocument();
    });
  });

  it('should submit valid order', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
    fireEvent.change(screen.getByLabelText(/配送日期/), { target: { value: '2025-08-21' } });
    fireEvent.change(screen.getByLabelText(/配送時間/), { target: { value: '09:00-12:00' } });
    fireEvent.change(screen.getByLabelText(/配送地址/), { target: { value: '台北市信義區測試路100號' } });
    
    // Add item
    const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
    fireEvent.click(addItemBtn);
    fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: 'PROD_001' } });
    fireEvent.change(screen.getByTestId('quantity-input-0'), { target: { value: '5' } });
    
    // Submit
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'CUS_001',
          delivery_date: '2025-08-21',
          items: expect.arrayContaining([
            expect.objectContaining({
              product_id: 'PROD_001',
              quantity: 5,
            }),
          ]),
        })
      );
    });
  });

  it('should apply customer discount', async () => {
    renderWithProviders(<OrderForm {...defaultProps} />);
    
    // Select VIP customer with discount
    fireEvent.change(screen.getByLabelText(/客戶/), { target: { value: 'CUS_001' } });
    
    // Add item
    const addItemBtn = screen.getByRole('button', { name: /新增商品/ });
    fireEvent.click(addItemBtn);
    fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: 'PROD_001' } });
    fireEvent.change(screen.getByTestId('quantity-input-0'), { target: { value: '10' } });
    
    // Check discount applied
    const discountCheckbox = screen.getByLabelText(/套用客戶折扣/);
    fireEvent.click(discountCheckbox);
    
    await waitFor(() => {
      const discount = screen.getByTestId('order-discount');
      expect(discount).toHaveTextContent('50'); // 5% discount on 1000
    });
  });
});