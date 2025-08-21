import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import AgingReport from '../../../components/AgingReport';
import { testDataBuilders } from '../../setup';

describe('AgingReport Component', () => {
  const mockAgingData = testDataBuilders.createTestAgingReport();

  const defaultProps = {
    data: mockAgingData,
    loading: false,
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    onCustomerClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render aging report summary', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    expect(screen.getByText('應收帳款帳齡分析')).toBeInTheDocument();
    expect(screen.getByText('總應收: NT$ 780,000')).toBeInTheDocument();
  });

  it('should display aging buckets', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    expect(screen.getByText('未逾期')).toBeInTheDocument();
    expect(screen.getByText('NT$ 500,000')).toBeInTheDocument();
    
    expect(screen.getByText('逾期 1-30 天')).toBeInTheDocument();
    expect(screen.getByText('NT$ 150,000')).toBeInTheDocument();
    
    expect(screen.getByText('逾期 31-60 天')).toBeInTheDocument();
    expect(screen.getByText('NT$ 80,000')).toBeInTheDocument();
    
    expect(screen.getByText('逾期 61-90 天')).toBeInTheDocument();
    expect(screen.getByText('NT$ 30,000')).toBeInTheDocument();
    
    expect(screen.getByText('逾期 90天以上')).toBeInTheDocument();
    expect(screen.getByText('NT$ 20,000')).toBeInTheDocument();
  });

  it('should show percentage distribution', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    expect(screen.getByText('64.1%')).toBeInTheDocument(); // Current
    expect(screen.getByText('19.2%')).toBeInTheDocument(); // 1-30
    expect(screen.getByText('10.3%')).toBeInTheDocument(); // 31-60
  });

  it('should display customer details', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    expect(screen.getByText('測試客戶A')).toBeInTheDocument();
    expect(screen.getByText('信用額度: NT$ 500,000')).toBeInTheDocument();
    expect(screen.getByText('總計: NT$ 100,000')).toBeInTheDocument();
    
    expect(screen.getByText('測試客戶B')).toBeInTheDocument();
    expect(screen.getByText('信用額度: NT$ 300,000')).toBeInTheDocument();
    expect(screen.getByText('總計: NT$ 150,000')).toBeInTheDocument();
  });

  it('should display aging chart', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const chart = screen.getByTestId('aging-chart');
    expect(chart).toBeInTheDocument();
  });

  it('should handle customer click', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const customerRow = screen.getByTestId('customer-CUST_001');
    fireEvent.click(customerRow);
    
    expect(defaultProps.onCustomerClick).toHaveBeenCalledWith('CUST_001');
  });

  it('should filter by risk level', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const riskFilter = screen.getByLabelText(/風險等級/);
    fireEvent.change(riskFilter, { target: { value: 'high' } });
    
    waitFor(() => {
      const visibleRows = screen.getAllByTestId(/customer-/);
      expect(visibleRows.length).toBeLessThan(mockAgingData.details.length);
    });
  });

  it('should sort by amount', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const sortBtn = screen.getByRole('button', { name: /總計/ });
    fireEvent.click(sortBtn);
    
    const rows = screen.getAllByTestId(/customer-/);
    expect(rows[0]).toHaveTextContent('測試客戶B'); // Higher amount
    expect(rows[1]).toHaveTextContent('測試客戶A');
  });

  it('should display risk analysis', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const analysisTab = screen.getByRole('tab', { name: /風險分析/ });
    fireEvent.click(analysisTab);
    
    expect(screen.getByText('高風險金額: NT$ 50,000')).toBeInTheDocument();
    expect(screen.getByText('中風險金額: NT$ 100,000')).toBeInTheDocument();
    expect(screen.getByText('低風險金額: NT$ 630,000')).toBeInTheDocument();
  });

  it('should show collection metrics', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    expect(screen.getByText('收款率: 92%')).toBeInTheDocument();
    expect(screen.getByText('平均收款天數: 35 天')).toBeInTheDocument();
  });

  it('should highlight overdue amounts', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const overdueCell = screen.getByTestId('overdue-CUST_001');
    expect(overdueCell).toHaveClass('text-red-600');
  });

  it('should expand customer details', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const expandBtn = screen.getByTestId('expand-CUST_001');
    fireEvent.click(expandBtn);
    
    waitFor(() => {
      expect(screen.getByText('發票明細')).toBeInTheDocument();
      expect(screen.getByText('聯絡資訊')).toBeInTheDocument();
      expect(screen.getByText('收款歷史')).toBeInTheDocument();
    });
  });

  it('should export aging report', async () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const formatSelect = screen.getByLabelText(/格式/);
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });
    
    const confirmBtn = screen.getByRole('button', { name: /確認匯出/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith({
      format: 'pdf',
      data: mockAgingData,
    });
  });

  it('should refresh data', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const refreshBtn = screen.getByRole('button', { name: /重新整理/ });
    fireEvent.click(refreshBtn);
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  it('should filter by date', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const dateInput = screen.getByLabelText(/截至日期/);
    fireEvent.change(dateInput, { target: { value: '2025-08-31' } });
    
    expect(defaultProps.onRefresh).toHaveBeenCalledWith({
      date: '2025-08-31',
    });
  });

  it('should show trend analysis', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const trendTab = screen.getByRole('tab', { name: /趨勢分析/ });
    fireEvent.click(trendTab);
    
    expect(screen.getByTestId('aging-trend-chart')).toBeInTheDocument();
    expect(screen.getByText('帳齡改善')).toBeInTheDocument();
  });

  it('should display DSO metric', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    expect(screen.getByText('DSO (應收帳款週轉天數): 35 天')).toBeInTheDocument();
  });

  it('should show credit utilization', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const customerRow = screen.getByTestId('customer-CUST_001');
    const utilization = within(customerRow).getByTestId('credit-utilization');
    
    expect(utilization).toHaveTextContent('20%'); // 100,000 / 500,000
  });

  it('should handle print action', () => {
    renderWithProviders(<AgingReport {...defaultProps} />);
    
    const printBtn = screen.getByRole('button', { name: /列印/ });
    fireEvent.click(printBtn);
    
    expect(window.print).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    renderWithProviders(<AgingReport {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<AgingReport {...defaultProps} data={null} />);
    
    expect(screen.getByText(/沒有帳齡資料/)).toBeInTheDocument();
  });
});