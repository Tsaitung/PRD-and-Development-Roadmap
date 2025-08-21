import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import CustomerStatement from '../../../components/CustomerStatement';
import { testDataBuilders } from '../../setup';

describe('CustomerStatement Component', () => {
  const mockStatement = testDataBuilders.createTestStatement();
  const mockCustomer = testDataBuilders.createTestCustomerAccount();

  const defaultProps = {
    statement: mockStatement,
    customer: mockCustomer,
    loading: false,
    onGenerate: vi.fn(),
    onSend: vi.fn(),
    onPrint: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render statement header', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('客戶對帳單')).toBeInTheDocument();
    expect(screen.getByText('STMT-2025-08-001')).toBeInTheDocument();
    expect(screen.getByText('測試客戶A')).toBeInTheDocument();
  });

  it('should display statement period', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('期間: 2025-08-01 至 2025-08-31')).toBeInTheDocument();
  });

  it('should show opening and closing balance', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('期初餘額: NT$ 80,000')).toBeInTheDocument();
    expect(screen.getByText('期末餘額: NT$ 120,000')).toBeInTheDocument();
  });

  it('should display transaction list', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('期初餘額')).toBeInTheDocument();
    expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
    expect(screen.getByText('銷售發票')).toBeInTheDocument();
    expect(screen.getByText('PAY-2025-08-001')).toBeInTheDocument();
    expect(screen.getByText('付款')).toBeInTheDocument();
  });

  it('should show transaction amounts', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const transactions = screen.getByTestId('transactions-table');
    expect(within(transactions).getByText('NT$ 103,000')).toBeInTheDocument();
    expect(within(transactions).getByText('(NT$ 50,000)')).toBeInTheDocument();
  });

  it('should display running balance', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const transactions = screen.getByTestId('transactions-table');
    expect(within(transactions).getByText('NT$ 80,000')).toBeInTheDocument();
    expect(within(transactions).getByText('NT$ 183,000')).toBeInTheDocument();
    expect(within(transactions).getByText('NT$ 133,000')).toBeInTheDocument();
  });

  it('should show summary totals', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('總發票金額: NT$ 150,000')).toBeInTheDocument();
    expect(screen.getByText('總付款金額: NT$ 100,000')).toBeInTheDocument();
    expect(screen.getByText('總信用額: NT$ 10,000')).toBeInTheDocument();
  });

  it('should display aging details', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const agingSection = screen.getByTestId('aging-section');
    expect(within(agingSection).getByText('INV-2025-07-015')).toBeInTheDocument();
    expect(within(agingSection).getByText('逾期 5 天')).toBeInTheDocument();
    expect(within(agingSection).getByText('NT$ 30,000')).toBeInTheDocument();
  });

  it('should highlight overdue amount', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const overdueAmount = screen.getByTestId('overdue-amount');
    expect(overdueAmount).toHaveTextContent('逾期金額: NT$ 30,000');
    expect(overdueAmount).toHaveClass('text-red-600');
  });

  it('should generate new statement', async () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const generateBtn = screen.getByRole('button', { name: /產生對帳單/ });
    fireEvent.click(generateBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const startDate = screen.getByLabelText(/開始日期/);
    fireEvent.change(startDate, { target: { value: '2025-09-01' } });
    
    const endDate = screen.getByLabelText(/結束日期/);
    fireEvent.change(endDate, { target: { value: '2025-09-30' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認產生/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onGenerate).toHaveBeenCalledWith({
      customer_id: 'CUST_001',
      period_start: '2025-09-01',
      period_end: '2025-09-30',
    });
  });

  it('should send statement to customer', async () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const sendBtn = screen.getByRole('button', { name: /發送對帳單/ });
    fireEvent.click(sendBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const emailInput = screen.getByLabelText(/收件人/);
    expect(emailInput).toHaveValue('billing@test.com');
    
    const ccInput = screen.getByLabelText(/副本/);
    fireEvent.change(ccInput, { target: { value: 'manager@test.com' } });
    
    const messageInput = screen.getByLabelText(/訊息/);
    fireEvent.change(messageInput, { target: { value: '請查收本月對帳單' } });
    
    const sendConfirmBtn = screen.getByRole('button', { name: /確認發送/ });
    fireEvent.click(sendConfirmBtn);
    
    expect(defaultProps.onSend).toHaveBeenCalledWith({
      statement_id: 'STMT_TEST_001',
      email: 'billing@test.com',
      cc: 'manager@test.com',
      message: '請查收本月對帳單',
    });
  });

  it('should print statement', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const printBtn = screen.getByRole('button', { name: /列印/ });
    fireEvent.click(printBtn);
    
    expect(defaultProps.onPrint).toHaveBeenCalled();
  });

  it('should export statement', async () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
    
    const pdfOption = screen.getByText('PDF');
    fireEvent.click(pdfOption);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith({
      format: 'pdf',
      statement_id: 'STMT_TEST_001',
    });
  });

  it('should show customer contact info', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('聯絡人: 張經理')).toBeInTheDocument();
    expect(screen.getByText('電話: 02-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('Email: contact@test.com')).toBeInTheDocument();
  });

  it('should display payment terms', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('付款條件: 月結30天')).toBeInTheDocument();
  });

  it('should show credit limit information', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('信用額度: NT$ 500,000')).toBeInTheDocument();
    expect(screen.getByText('已用額度: NT$ 150,000')).toBeInTheDocument();
    expect(screen.getByText('可用額度: NT$ 350,000')).toBeInTheDocument();
  });

  it('should filter transactions by type', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const filterSelect = screen.getByLabelText(/交易類型/);
    fireEvent.change(filterSelect, { target: { value: 'invoice' } });
    
    waitFor(() => {
      expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
      expect(screen.queryByText('PAY-2025-08-001')).not.toBeInTheDocument();
    });
  });

  it('should show payment history', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const historyTab = screen.getByRole('tab', { name: /付款歷史/ });
    fireEvent.click(historyTab);
    
    expect(screen.getByText('準時付款率: 85%')).toBeInTheDocument();
    expect(screen.getByText('平均付款天數: 28 天')).toBeInTheDocument();
  });

  it('should display notes section', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    expect(screen.getByText('備註')).toBeInTheDocument();
    expect(screen.getByText('優良客戶')).toBeInTheDocument();
  });

  it('should show statement status', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} />);
    
    const sentStatement = {
      ...mockStatement,
      sent_date: new Date('2025-09-01'),
      sent_to: 'billing@test.com',
    };
    
    renderWithProviders(
      <CustomerStatement {...defaultProps} statement={sentStatement} />
    );
    
    expect(screen.getByText('已發送: 2025-09-01')).toBeInTheDocument();
    expect(screen.getByText('收件人: billing@test.com')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<CustomerStatement {...defaultProps} statement={null} />);
    
    expect(screen.getByText(/沒有對帳單資料/)).toBeInTheDocument();
  });
});