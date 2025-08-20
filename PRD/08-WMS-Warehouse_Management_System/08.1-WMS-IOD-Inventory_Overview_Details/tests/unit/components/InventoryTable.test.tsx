import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import InventoryTable from '../../../components/InventoryTable';
import { testDataBuilders } from '../../setup';

describe('InventoryTable Component', () => {
  const mockInventoryItems = [
    testDataBuilders.createTestInventoryItem(),
    testDataBuilders.createTestInventoryItem({
      item_id: 'INV_002',
      sku: 'SKU_002',
      product_name: '商品B',
      current_stock: 80,
      status: 'low',
    }),
    testDataBuilders.createTestInventoryItem({
      item_id: 'INV_003',
      sku: 'SKU_003',
      product_name: '商品C',
      current_stock: 0,
      status: 'out_of_stock',
    }),
  ];

  const defaultProps = {
    items: mockInventoryItems,
    loading: false,
    onSort: vi.fn(),
    onFilter: vi.fn(),
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    selectedItems: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render inventory items', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    expect(screen.getByText('SKU_TEST_001')).toBeInTheDocument();
    expect(screen.getByText('測試商品A')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('A-01-02')).toBeInTheDocument();
  });

  it('should display stock status correctly', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    expect(screen.getByText('正常')).toBeInTheDocument();
    expect(screen.getByText('低庫存')).toBeInTheDocument();
    expect(screen.getByText('缺貨')).toBeInTheDocument();
  });

  it('should show stock level indicators', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const normalIndicator = screen.getByTestId('stock-indicator-normal');
    const lowIndicator = screen.getByTestId('stock-indicator-low');
    const outIndicator = screen.getByTestId('stock-indicator-out');
    
    expect(normalIndicator).toHaveClass('bg-green-500');
    expect(lowIndicator).toHaveClass('bg-yellow-500');
    expect(outIndicator).toHaveClass('bg-red-500');
  });

  it('should handle sorting', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const productHeader = screen.getByText('商品名稱');
    fireEvent.click(productHeader);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('product_name', 'asc');
    
    fireEvent.click(productHeader);
    expect(defaultProps.onSort).toHaveBeenCalledWith('product_name', 'desc');
  });

  it('should handle row selection', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First item checkbox
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith(['INV_TEST_001']);
  });

  it('should handle select all', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    fireEvent.click(selectAllCheckbox);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith([
      'INV_TEST_001',
      'INV_002',
      'INV_003',
    ]);
  });

  it('should display warehouse information', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    expect(screen.getByText('北區倉庫')).toBeInTheDocument();
    expect(screen.getByText('WH_001')).toBeInTheDocument();
  });

  it('should show expiry date warning', () => {
    const itemWithExpiry = testDataBuilders.createTestInventoryItem({
      expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    });
    
    renderWithProviders(
      <InventoryTable {...defaultProps} items={[itemWithExpiry]} />
    );
    
    expect(screen.getByTestId('expiry-warning')).toBeInTheDocument();
    expect(screen.getByText(/即將過期/)).toBeInTheDocument();
  });

  it('should handle edit action', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const editButtons = screen.getAllByRole('button', { name: /編輯/ });
    fireEvent.click(editButtons[0]);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith('INV_TEST_001');
  });

  it('should handle delete action', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /刪除/ });
    fireEvent.click(deleteButtons[0]);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('INV_TEST_001');
  });

  it('should show loading state', () => {
    renderWithProviders(<InventoryTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    renderWithProviders(<InventoryTable {...defaultProps} items={[]} />);
    
    expect(screen.getByText(/沒有庫存資料/)).toBeInTheDocument();
  });

  it('should highlight low stock items', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const lowStockRow = screen.getByTestId('inventory-row-INV_002');
    expect(lowStockRow).toHaveClass('bg-yellow-50');
  });

  it('should highlight out of stock items', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const outOfStockRow = screen.getByTestId('inventory-row-INV_003');
    expect(outOfStockRow).toHaveClass('bg-red-50');
  });

  it('should display batch information', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    expect(screen.getByText('BATCH_20250820_001')).toBeInTheDocument();
  });

  it('should show stock value', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    expect(screen.getByText('$25,000')).toBeInTheDocument(); // Total value
    expect(screen.getByText('$50')).toBeInTheDocument(); // Unit cost
  });

  it('should display safety stock indicator', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const safetyStock = screen.getByTestId('safety-stock-INV_TEST_001');
    expect(safetyStock).toHaveTextContent('100');
  });

  it('should show reorder point', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const reorderPoint = screen.getByTestId('reorder-point-INV_TEST_001');
    expect(reorderPoint).toHaveTextContent('150');
  });

  it('should display reserved stock', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    expect(screen.getByText(/預留: 50/)).toBeInTheDocument();
    expect(screen.getByText(/可用: 450/)).toBeInTheDocument();
  });

  it('should handle column visibility toggle', () => {
    renderWithProviders(<InventoryTable {...defaultProps} />);
    
    const columnToggle = screen.getByRole('button', { name: /欄位設定/ });
    fireEvent.click(columnToggle);
    
    const costCheckbox = screen.getByLabelText(/顯示成本/);
    fireEvent.click(costCheckbox);
    
    expect(screen.queryByText('$50')).not.toBeInTheDocument();
  });

  it('should export table data', () => {
    const onExport = vi.fn();
    renderWithProviders(<InventoryTable {...defaultProps} onExport={onExport} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    fireEvent.click(exportBtn);
    
    expect(onExport).toHaveBeenCalledWith({
      format: 'excel',
      items: mockInventoryItems,
    });
  });
});