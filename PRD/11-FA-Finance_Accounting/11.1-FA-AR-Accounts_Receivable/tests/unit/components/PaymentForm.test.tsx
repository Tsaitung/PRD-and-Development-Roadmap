import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import PaymentForm from '../../../components/PaymentForm';
import { testDataBuilders } from '../../setup';

describe('PaymentForm Component', () => {
  const mockInvoice = testDataBuilders.createTestInvoice();
  
  const defaultProps = {
    invoice: mockInvoice,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment form with invoice details', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    expect(screen.getByText('記錄付款')).toBeInTheDocument();
    expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
    expect(screen.getByText('測試客戶A')).toBeInTheDocument();
    expect(screen.getByText('應付金額: NT$ 103,000')).toBeInTheDocument();
  });

  it('should display balance due', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    expect(screen.getByText('餘額: NT$ 103,000')).toBeInTheDocument();
  });

  it('should handle full payment', async () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const fullPaymentRadio = screen.getByLabelText(/全額付款/);
    fireEvent.click(fullPaymentRadio);
    
    expect(screen.getByDisplayValue('103000')).toBeInTheDocument();
    
    const paymentDate = screen.getByLabelText(/付款日期/);
    fireEvent.change(paymentDate, { target: { value: '2025-08-20' } });
    
    const paymentMethod = screen.getByLabelText(/付款方式/);
    fireEvent.change(paymentMethod, { target: { value: 'bank_transfer' } });
    
    const reference = screen.getByLabelText(/參考編號/);
    fireEvent.change(reference, { target: { value: 'REF-001' } });
    
    const submitBtn = screen.getByRole('button', { name: /確認付款/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        invoice_id: 'INV_TEST_001',
        amount: 103000,
        payment_type: 'full',
        payment_date: '2025-08-20',
        payment_method: 'bank_transfer',
        reference_number: 'REF-001',
      });
    });
  });

  it('should handle partial payment', async () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const partialPaymentRadio = screen.getByLabelText(/部分付款/);
    fireEvent.click(partialPaymentRadio);
    
    const amountInput = screen.getByLabelText(/付款金額/);
    fireEvent.change(amountInput, { target: { value: '50000' } });
    
    const submitBtn = screen.getByRole('button', { name: /確認付款/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50000,
          payment_type: 'partial',
        })
      );
    });
  });

  it('should validate payment amount', async () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const partialPaymentRadio = screen.getByLabelText(/部分付款/);
    fireEvent.click(partialPaymentRadio);
    
    const amountInput = screen.getByLabelText(/付款金額/);
    fireEvent.change(amountInput, { target: { value: '200000' } });
    
    const submitBtn = screen.getByRole('button', { name: /確認付款/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/付款金額不能超過應付餘額/)).toBeInTheDocument();
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should show payment methods', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const methodSelect = screen.getByLabelText(/付款方式/);
    fireEvent.click(methodSelect);
    
    expect(screen.getByText('銀行轉帳')).toBeInTheDocument();
    expect(screen.getByText('支票')).toBeInTheDocument();
    expect(screen.getByText('現金')).toBeInTheDocument();
    expect(screen.getByText('信用卡')).toBeInTheDocument();
  });

  it('should handle bank details for bank transfer', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const methodSelect = screen.getByLabelText(/付款方式/);
    fireEvent.change(methodSelect, { target: { value: 'bank_transfer' } });
    
    expect(screen.getByLabelText(/銀行名稱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/銀行帳號/)).toBeInTheDocument();
    
    const bankName = screen.getByLabelText(/銀行名稱/);
    fireEvent.change(bankName, { target: { value: '測試銀行' } });
    
    const bankAccount = screen.getByLabelText(/銀行帳號/);
    fireEvent.change(bankAccount, { target: { value: '123-456-789' } });
  });

  it('should handle check details for check payment', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const methodSelect = screen.getByLabelText(/付款方式/);
    fireEvent.change(methodSelect, { target: { value: 'check' } });
    
    expect(screen.getByLabelText(/支票號碼/)).toBeInTheDocument();
    expect(screen.getByLabelText(/到期日/)).toBeInTheDocument();
    
    const checkNumber = screen.getByLabelText(/支票號碼/);
    fireEvent.change(checkNumber, { target: { value: 'CHK-001' } });
  });

  it('should calculate transaction fee', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const feeInput = screen.getByLabelText(/手續費/);
    fireEvent.change(feeInput, { target: { value: '30' } });
    
    expect(screen.getByText('淨額: NT$ 102,970')).toBeInTheDocument();
  });

  it('should handle payment notes', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const notesInput = screen.getByLabelText(/備註/);
    fireEvent.change(notesInput, { target: { value: '客戶提前付款' } });
    
    const submitBtn = screen.getByRole('button', { name: /確認付款/ });
    fireEvent.click(submitBtn);
    
    waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: '客戶提前付款',
        })
      );
    });
  });

  it('should upload payment receipt', async () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const file = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/上傳收據/);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
    });
  });

  it('should show applied credits if available', () => {
    const invoiceWithCredit = {
      ...mockInvoice,
      available_credits: 10000,
    };
    
    renderWithProviders(<PaymentForm {...defaultProps} invoice={invoiceWithCredit} />);
    
    expect(screen.getByText('可用信用額: NT$ 10,000')).toBeInTheDocument();
    
    const applyCredit = screen.getByLabelText(/使用信用額/);
    fireEvent.click(applyCredit);
    
    expect(screen.getByText('付款金額: NT$ 93,000')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const submitBtn = screen.getByRole('button', { name: /確認付款/ });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/請選擇付款日期/)).toBeInTheDocument();
      expect(screen.getByText(/請選擇付款方式/)).toBeInTheDocument();
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const cancelBtn = screen.getByRole('button', { name: /取消/ });
    fireEvent.click(cancelBtn);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should show payment summary', () => {
    renderWithProviders(<PaymentForm {...defaultProps} />);
    
    const partialPaymentRadio = screen.getByLabelText(/部分付款/);
    fireEvent.click(partialPaymentRadio);
    
    const amountInput = screen.getByLabelText(/付款金額/);
    fireEvent.change(amountInput, { target: { value: '50000' } });
    
    expect(screen.getByText('付款後餘額: NT$ 53,000')).toBeInTheDocument();
  });

  it('should disable form when loading', () => {
    renderWithProviders(<PaymentForm {...defaultProps} loading={true} />);
    
    const submitBtn = screen.getByRole('button', { name: /確認付款/ });
    expect(submitBtn).toBeDisabled();
    
    const amountInput = screen.getByLabelText(/付款金額/);
    expect(amountInput).toBeDisabled();
  });

  it('should handle multiple currency', () => {
    const invoiceUSD = {
      ...mockInvoice,
      currency: 'USD',
      total_amount: 3500,
      balance_due: 3500,
    };
    
    renderWithProviders(<PaymentForm {...defaultProps} invoice={invoiceUSD} />);
    
    expect(screen.getByText('應付金額: USD 3,500')).toBeInTheDocument();
    expect(screen.getByText('餘額: USD 3,500')).toBeInTheDocument();
  });

  it('should show exchange rate for foreign currency', () => {
    const invoiceUSD = {
      ...mockInvoice,
      currency: 'USD',
      exchange_rate: 31.5,
    };
    
    renderWithProviders(<PaymentForm {...defaultProps} invoice={invoiceUSD} />);
    
    expect(screen.getByText('匯率: 31.5')).toBeInTheDocument();
    expect(screen.getByLabelText(/本幣金額/)).toBeInTheDocument();
  });
});