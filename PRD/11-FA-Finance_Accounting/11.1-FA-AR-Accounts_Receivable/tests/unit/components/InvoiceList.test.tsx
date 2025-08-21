import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import InvoiceList from '../../../components/InvoiceList';
import { testDataBuilders } from '../../setup';

describe('InvoiceList Component', () => {
  const mockInvoices = [
    testDataBuilders.createTestInvoice(),
    testDataBuilders.createTestInvoice({
      invoice_id: 'INV_002',
      invoice_number: 'INV-2025-08-002',
      status: 'paid',
      paid_amount: 103000,
      balance_due: 0,
    }),
    testDataBuilders.createTestInvoice({
      invoice_id: 'INV_003',
      invoice_number: 'INV-2025-08-003',
      status: 'overdue',
      due_date: new Date('2025-07-31'),
    }),
  ];

  const defaultProps = {
    invoices: mockInvoices,
    loading: false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSend: vi.fn(),
    onRecordPayment: vi.fn(),
    onFilter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render invoice list', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2025-08-002')).toBeInTheDocument();
    expect(screen.getByText('INV-2025-08-003')).toBeInTheDocument();
  });

  it('should display invoice status', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    expect(screen.getByText('待付款')).toBeInTheDocument();
    expect(screen.getByText('已付款')).toBeInTheDocument();
    expect(screen.getByText('逾期')).toBeInTheDocument();
  });

  it('should show customer information', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const customerCells = screen.getAllByText('測試客戶A');
    expect(customerCells.length).toBeGreaterThan(0);
  });

  it('should display invoice amounts', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    expect(screen.getByText('NT$ 103,000')).toBeInTheDocument();
    expect(screen.getByText('NT$ 0')).toBeInTheDocument();
  });

  it('should show due dates', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    expect(screen.getByText('2025-08-31')).toBeInTheDocument();
    expect(screen.getByText('2025-07-31')).toBeInTheDocument();
  });

  it('should highlight overdue invoices', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const overdueRow = screen.getByTestId('invoice-row-INV_003');
    expect(overdueRow).toHaveClass('bg-red-50');
  });

  it('should filter invoices by status', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const statusFilter = screen.getByLabelText(/狀態/);
    fireEvent.change(statusFilter, { target: { value: 'pending' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      status: 'pending',
    });
  });

  it('should filter by date range', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/開始日期/);
    fireEvent.change(startDate, { target: { value: '2025-08-01' } });
    
    const endDate = screen.getByLabelText(/結束日期/);
    fireEvent.change(endDate, { target: { value: '2025-08-31' } });
    
    const applyBtn = screen.getByRole('button', { name: /套用/ });
    fireEvent.click(applyBtn);
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      date_from: '2025-08-01',
      date_to: '2025-08-31',
    });
  });

  it('should handle view invoice action', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const viewBtn = screen.getAllByRole('button', { name: /查看/ })[0];
    fireEvent.click(viewBtn);
    
    expect(defaultProps.onView).toHaveBeenCalledWith('INV_TEST_001');
  });

  it('should handle edit invoice action', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const editBtn = screen.getAllByRole('button', { name: /編輯/ })[0];
    fireEvent.click(editBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('INV_TEST_001');
  });

  it('should handle send invoice action', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const sendBtn = screen.getAllByRole('button', { name: /發送/ })[0];
    fireEvent.click(sendBtn);
    
    waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/發送發票/)).toBeInTheDocument();
    });
    
    const emailInput = screen.getByLabelText(/電子郵件/);
    fireEvent.change(emailInput, { target: { value: 'customer@test.com' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認發送/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onSend).toHaveBeenCalledWith('INV_TEST_001', {
      email: 'customer@test.com',
    });
  });

  it('should handle record payment action', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const paymentBtn = screen.getAllByRole('button', { name: /記錄付款/ })[0];
    fireEvent.click(paymentBtn);
    
    expect(defaultProps.onRecordPayment).toHaveBeenCalledWith('INV_TEST_001');
  });

  it('should search invoices by number', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋發票編號/);
    fireEvent.change(searchInput, { target: { value: 'INV-2025-08-002' } });
    
    waitFor(() => {
      expect(screen.queryByText('INV-2025-08-001')).not.toBeInTheDocument();
      expect(screen.getByText('INV-2025-08-002')).toBeInTheDocument();
      expect(screen.queryByText('INV-2025-08-003')).not.toBeInTheDocument();
    });
  });

  it('should sort invoices', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const sortSelect = screen.getByLabelText(/排序/);
    fireEvent.change(sortSelect, { target: { value: 'amount_desc' } });
    
    const invoiceRows = screen.getAllByTestId(/invoice-row-/);
    expect(invoiceRows[0]).toHaveTextContent('NT$ 103,000');
  });

  it('should display payment terms', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    expect(screen.getByText('月結30天')).toBeInTheDocument();
  });

  it('should show aging information for overdue invoices', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const overdueRow = screen.getByTestId('invoice-row-INV_003');
    expect(within(overdueRow).getByText(/逾期 20 天/)).toBeInTheDocument();
  });

  it('should handle bulk actions', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const checkbox1 = screen.getByTestId('select-INV_TEST_001');
    const checkbox2 = screen.getByTestId('select-INV_002');
    fireEvent.click(checkbox1);
    fireEvent.click(checkbox2);
    
    const bulkBtn = screen.getByRole('button', { name: /批量操作/ });
    fireEvent.click(bulkBtn);
    
    const sendOption = screen.getByText('批量發送');
    fireEvent.click(sendOption);
    
    expect(defaultProps.onSend).toHaveBeenCalledWith(['INV_TEST_001', 'INV_002']);
  });

  it('should export invoice list', () => {
    const onExport = vi.fn();
    renderWithProviders(<InvoiceList {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      data: mockInvoices,
    });
  });

  it('should show loading state', () => {
    renderWithProviders(<InvoiceList {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<InvoiceList {...defaultProps} invoices={[]} />);
    
    expect(screen.getByText(/沒有發票資料/)).toBeInTheDocument();
  });

  it('should display tax information', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const invoiceRow = screen.getByTestId('invoice-row-INV_TEST_001');
    fireEvent.click(invoiceRow);
    
    waitFor(() => {
      expect(screen.getByText('稅額: NT$ 5,000')).toBeInTheDocument();
      expect(screen.getByText('稅率: 5%')).toBeInTheDocument();
    });
  });

  it('should show invoice items summary', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const expandBtn = screen.getAllByRole('button', { name: /展開/ })[0];
    fireEvent.click(expandBtn);
    
    waitFor(() => {
      expect(screen.getByText('產品A')).toBeInTheDocument();
      expect(screen.getByText('產品B')).toBeInTheDocument();
      expect(screen.getByText('數量: 100')).toBeInTheDocument();
      expect(screen.getByText('數量: 50')).toBeInTheDocument();
    });
  });

  it('should handle void invoice action', async () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const moreBtn = screen.getAllByRole('button', { name: /更多/ })[0];
    fireEvent.click(moreBtn);
    
    const voidOption = screen.getByText('作廢');
    fireEvent.click(voidOption);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/確認作廢發票/)).toBeInTheDocument();
    });
    
    const reasonInput = screen.getByLabelText(/作廢原因/);
    fireEvent.change(reasonInput, { target: { value: '客戶取消訂單' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認作廢/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('INV_TEST_001', {
      status: 'voided',
      void_reason: '客戶取消訂單',
    });
  });

  it('should calculate totals correctly', () => {
    renderWithProviders(<InvoiceList {...defaultProps} />);
    
    const totalRow = screen.getByTestId('totals-row');
    expect(totalRow).toHaveTextContent('總計: NT$ 309,000');
    expect(totalRow).toHaveTextContent('已付: NT$ 103,000');
    expect(totalRow).toHaveTextContent('未付: NT$ 206,000');
  });
});