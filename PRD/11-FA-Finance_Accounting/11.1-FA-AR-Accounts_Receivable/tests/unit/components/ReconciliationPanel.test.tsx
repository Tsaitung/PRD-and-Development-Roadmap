import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import ReconciliationPanel from '../../../components/ReconciliationPanel';
import { testDataBuilders } from '../../setup';

describe('ReconciliationPanel Component', () => {
  const mockReconciliation = testDataBuilders.createTestReconciliation();

  const defaultProps = {
    reconciliation: mockReconciliation,
    loading: false,
    onMatch: vi.fn(),
    onAdjust: vi.fn(),
    onComplete: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render reconciliation panel', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    expect(screen.getByText('銀行對帳')).toBeInTheDocument();
    expect(screen.getByText('期間: 2025-08-01 至 2025-08-20')).toBeInTheDocument();
  });

  it('should display bank account info', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    expect(screen.getByText('銀行帳號: 123-456-789')).toBeInTheDocument();
    expect(screen.getByText('銀行名稱: 測試銀行')).toBeInTheDocument();
  });

  it('should show balance summary', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    expect(screen.getByText('期初餘額: NT$ 1,000,000')).toBeInTheDocument();
    expect(screen.getByText('期末餘額: NT$ 1,250,000')).toBeInTheDocument();
    expect(screen.getByText('總存款: NT$ 350,000')).toBeInTheDocument();
    expect(screen.getByText('總提款: NT$ 100,000')).toBeInTheDocument();
  });

  it('should display matching status', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    expect(screen.getByText('已配對: 45')).toBeInTheDocument();
    expect(screen.getByText('未配對: 3')).toBeInTheDocument();
    
    const progressBar = screen.getByTestId('matching-progress');
    expect(progressBar).toHaveAttribute('value', '93.75'); // 45/48 * 100
  });

  it('should show bank transactions', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const transactionsTable = screen.getByTestId('bank-transactions');
    expect(within(transactionsTable).getByText('DEP-001')).toBeInTheDocument();
    expect(within(transactionsTable).getByText('客戶付款')).toBeInTheDocument();
    expect(within(transactionsTable).getByText('NT$ 50,000')).toBeInTheDocument();
  });

  it('should indicate matched transactions', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const matchedRow = screen.getByTestId('transaction-DEP-001');
    expect(matchedRow).toHaveClass('bg-green-50');
    expect(within(matchedRow).getByText('已配對')).toBeInTheDocument();
  });

  it('should display discrepancies', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const discrepanciesTab = screen.getByRole('tab', { name: /差異/ });
    fireEvent.click(discrepanciesTab);
    
    expect(screen.getByText('銀行金額: NT$ 50,000')).toBeInTheDocument();
    expect(screen.getByText('系統金額: NT$ 49,970')).toBeInTheDocument();
    expect(screen.getByText('差額: NT$ 30')).toBeInTheDocument();
    expect(screen.getByText('調查中')).toBeInTheDocument();
  });

  it('should handle manual matching', async () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const unmatchedTab = screen.getByRole('tab', { name: /未配對/ });
    fireEvent.click(unmatchedTab);
    
    const bankTransaction = screen.getByTestId('unmatched-bank-001');
    fireEvent.click(bankTransaction);
    
    const paymentSelect = screen.getByLabelText(/選擇付款/);
    fireEvent.change(paymentSelect, { target: { value: 'PAY_002' } });
    
    const matchBtn = screen.getByRole('button', { name: /配對/ });
    fireEvent.click(matchBtn);
    
    await waitFor(() => {
      expect(defaultProps.onMatch).toHaveBeenCalledWith({
        bank_transaction_id: 'unmatched-bank-001',
        payment_id: 'PAY_002',
      });
    });
  });

  it('should create adjustment entry', async () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const adjustBtn = screen.getByRole('button', { name: /新增調整/ });
    fireEvent.click(adjustBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const typeSelect = screen.getByLabelText(/調整類型/);
    fireEvent.change(typeSelect, { target: { value: 'bank_fee' } });
    
    const amountInput = screen.getByLabelText(/金額/);
    fireEvent.change(amountInput, { target: { value: '30' } });
    
    const descInput = screen.getByLabelText(/說明/);
    fireEvent.change(descInput, { target: { value: '銀行手續費' } });
    
    const saveBtn = screen.getByRole('button', { name: /儲存/ });
    fireEvent.click(saveBtn);
    
    expect(defaultProps.onAdjust).toHaveBeenCalledWith({
      type: 'bank_fee',
      amount: 30,
      description: '銀行手續費',
    });
  });

  it('should filter transactions', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const filterSelect = screen.getByLabelText(/篩選/);
    fireEvent.change(filterSelect, { target: { value: 'unmatched' } });
    
    waitFor(() => {
      const transactions = screen.getAllByTestId(/transaction-/);
      transactions.forEach(t => {
        expect(t).not.toHaveClass('bg-green-50');
      });
    });
  });

  it('should search transactions', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋交易/);
    fireEvent.change(searchInput, { target: { value: 'DEP-001' } });
    
    waitFor(() => {
      expect(screen.getByText('DEP-001')).toBeInTheDocument();
      expect(screen.queryByText('DEP-002')).not.toBeInTheDocument();
    });
  });

  it('should complete reconciliation', async () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const completeBtn = screen.getByRole('button', { name: /完成對帳/ });
    fireEvent.click(completeBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/確認完成對帳/)).toBeInTheDocument();
    });
    
    const notesInput = screen.getByLabelText(/備註/);
    fireEvent.change(notesInput, { target: { value: '對帳完成，差異已調整' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認完成/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onComplete).toHaveBeenCalledWith({
      reconciliation_id: 'REC_TEST_001',
      notes: '對帳完成，差異已調整',
    });
  });

  it('should show reconciliation status', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('進行中');
    expect(statusBadge).toHaveClass('bg-yellow-100');
  });

  it('should display approval info for completed reconciliation', () => {
    const completedRec = {
      ...mockReconciliation,
      status: 'completed',
      reconciled_by: 'USER_001',
      approved_by: 'MANAGER_001',
    };
    
    renderWithProviders(
      <ReconciliationPanel {...defaultProps} reconciliation={completedRec} />
    );
    
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('對帳人: USER_001')).toBeInTheDocument();
    expect(screen.getByText('核准人: MANAGER_001')).toBeInTheDocument();
  });

  it('should import bank statement', async () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const importBtn = screen.getByRole('button', { name: /匯入對帳單/ });
    fireEvent.click(importBtn);
    
    const file = new File(['statement'], 'statement.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/選擇檔案/);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('statement.csv')).toBeInTheDocument();
    });
  });

  it('should export reconciliation report', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
    fireEvent.click(exportBtn);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith({
      reconciliation_id: 'REC_TEST_001',
      format: 'excel',
    });
  });

  it('should show auto-match suggestions', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const suggestionsTab = screen.getByRole('tab', { name: /建議配對/ });
    fireEvent.click(suggestionsTab);
    
    expect(screen.getByText('建議配對項目')).toBeInTheDocument();
    expect(screen.getByText('信心度: 95%')).toBeInTheDocument();
  });

  it('should undo match', async () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const matchedRow = screen.getByTestId('transaction-DEP-001');
    const undoBtn = within(matchedRow).getByRole('button', { name: /取消配對/ });
    
    fireEvent.click(undoBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByRole('button', { name: /確認取消/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onMatch).toHaveBeenCalledWith({
      bank_transaction_id: 'DEP-001',
      payment_id: null,
      action: 'unmatch',
    });
  });

  it('should show variance analysis', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} />);
    
    const analysisTab = screen.getByRole('tab', { name: /分析/ });
    fireEvent.click(analysisTab);
    
    expect(screen.getByText('差異分析')).toBeInTheDocument();
    expect(screen.getByTestId('variance-chart')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<ReconciliationPanel {...defaultProps} reconciliation={null} />);
    
    expect(screen.getByText(/沒有對帳資料/)).toBeInTheDocument();
  });
});