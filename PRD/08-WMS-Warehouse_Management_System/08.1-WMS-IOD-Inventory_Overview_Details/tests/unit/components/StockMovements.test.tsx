import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import StockMovements from '../../../components/StockMovements';
import { testDataBuilders } from '../../setup';

describe('StockMovements Component', () => {
  const mockMovements = [
    testDataBuilders.createTestStockMovement(),
    testDataBuilders.createTestStockMovement({
      movement_id: 'MOV_002',
      movement_type: 'outbound',
      quantity: -50,
      notes: '銷售出貨',
    }),
    testDataBuilders.createTestStockMovement({
      movement_id: 'MOV_003',
      movement_type: 'internal',
      from_location: 'A-01-02',
      to_location: 'B-02-03',
      quantity: 30,
      notes: '內部調撥',
    }),
  ];

  const defaultProps = {
    movements: mockMovements,
    loading: false,
    onFilter: vi.fn(),
    onExport: vi.fn(),
  };

  it('should display movement records', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    expect(screen.getByText('MOV_TEST_001')).toBeInTheDocument();
    expect(screen.getByText('採購入庫')).toBeInTheDocument();
    expect(screen.getByText('+100')).toBeInTheDocument();
  });

  it('should show movement types with icons', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    expect(screen.getByTestId('inbound-icon')).toBeInTheDocument();
    expect(screen.getByTestId('outbound-icon')).toBeInTheDocument();
    expect(screen.getByTestId('internal-icon')).toBeInTheDocument();
  });

  it('should display locations', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    // Inbound
    expect(screen.getByText('→ A-01-02')).toBeInTheDocument();
    
    // Internal transfer
    expect(screen.getByText('A-01-02 → B-02-03')).toBeInTheDocument();
  });

  it('should show quantity with colors', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const inboundQty = screen.getByText('+100');
    expect(inboundQty).toHaveClass('text-green-600');
    
    const outboundQty = screen.getByText('-50');
    expect(outboundQty).toHaveClass('text-red-600');
    
    const internalQty = screen.getByText('30');
    expect(internalQty).toHaveClass('text-blue-600');
  });

  it('should filter by movement type', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const typeFilter = screen.getByLabelText(/類型/);
    fireEvent.change(typeFilter, { target: { value: 'inbound' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      type: 'inbound',
    });
  });

  it('should filter by date range', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const fromDate = screen.getByLabelText(/開始日期/);
    fireEvent.change(fromDate, { target: { value: '2025-08-01' } });
    
    const toDate = screen.getByLabelText(/結束日期/);
    fireEvent.change(toDate, { target: { value: '2025-08-31' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      date_from: '2025-08-01',
      date_to: '2025-08-31',
    });
  });

  it('should display reference information', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    expect(screen.getByText('採購單: PO_001')).toBeInTheDocument();
  });

  it('should show created by information', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    expect(screen.getByText('USER_001')).toBeInTheDocument();
  });

  it('should display timestamps', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    expect(screen.getByText(/2025-08-20 09:00/)).toBeInTheDocument();
  });

  it('should show movement status', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    expect(screen.getAllByText('已完成')).toHaveLength(3);
  });

  it('should display timeline view', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const timelineBtn = screen.getByRole('button', { name: /時間軸檢視/ });
    fireEvent.click(timelineBtn);
    
    expect(screen.getByTestId('movement-timeline')).toBeInTheDocument();
  });

  it('should group by date', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const groupBtn = screen.getByRole('button', { name: /按日期分組/ });
    fireEvent.click(groupBtn);
    
    expect(screen.getByText('2025年8月20日')).toBeInTheDocument();
  });

  it('should calculate daily summary', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const summarySection = screen.getByTestId('daily-summary');
    expect(summarySection).toHaveTextContent('入庫: +100');
    expect(summarySection).toHaveTextContent('出庫: -50');
    expect(summarySection).toHaveTextContent('內部: 30');
    expect(summarySection).toHaveTextContent('淨變動: +80');
  });

  it('should export movements', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith({
      format: 'excel',
      movements: mockMovements,
    });
  });

  it('should show loading state', () => {
    renderWithProviders(<StockMovements {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<StockMovements {...defaultProps} movements={[]} />);
    
    expect(screen.getByText(/沒有庫存異動記錄/)).toBeInTheDocument();
  });

  it('should search movements', () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋異動記錄/);
    fireEvent.change(searchInput, { target: { value: 'PO_001' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({
      search: 'PO_001',
    });
  });

  it('should show movement details on click', async () => {
    renderWithProviders(<StockMovements {...defaultProps} />);
    
    const movementRow = screen.getByTestId('movement-row-MOV_TEST_001');
    fireEvent.click(movementRow);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/異動詳情/)).toBeInTheDocument();
      expect(screen.getByText(/商品: INV_TEST_001/)).toBeInTheDocument();
    });
  });

  it('should highlight recent movements', () => {
    const recentMovement = testDataBuilders.createTestStockMovement({
      created_at: new Date(),
    });
    
    renderWithProviders(
      <StockMovements {...defaultProps} movements={[recentMovement]} />
    );
    
    const movementRow = screen.getByTestId('movement-row-MOV_TEST_001');
    expect(movementRow).toHaveClass('bg-blue-50');
  });

  it('should show batch information', () => {
    const movementWithBatch = testDataBuilders.createTestStockMovement({
      batch_number: 'BATCH_001',
    });
    
    renderWithProviders(
      <StockMovements {...defaultProps} movements={[movementWithBatch]} />
    );
    
    expect(screen.getByText('批次: BATCH_001')).toBeInTheDocument();
  });
});