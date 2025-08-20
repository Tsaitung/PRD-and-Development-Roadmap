import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import MarketPriceManagement from '../../../pages/MarketPriceManagement';
import { testDataBuilders } from '../setup';

const server = setupServer(
  rest.get('/api/v1/pricing/market-prices', (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    const status = req.url.searchParams.get('status');

    const marketPrices = [
      testDataBuilders.createTestMarketPriceItem(),
      testDataBuilders.createTestMarketPriceItem({
        item_id: 'MKT_TEST_002',
        product_id: 'PROD_MKT_002',
        product_name: '時價商品B',
        market_price: 200,
        status: 'confirmed',
      }),
      testDataBuilders.createTestMarketPriceItem({
        item_id: 'MKT_TEST_003',
        product_id: 'PROD_MKT_003',
        product_name: '時價商品C',
        market_price: 180,
        status: 'applied',
        applied_orders: ['ORD_001', 'ORD_002'],
      }),
    ];

    let filtered = marketPrices;
    if (status) {
      filtered = filtered.filter(m => m.status === status);
    }

    return res(ctx.json({
      market_prices: filtered,
      total: filtered.length,
    }));
  }),

  rest.post('/api/v1/pricing/reprice', async (req, res, ctx) => {
    const body = await req.json();
    
    return res(ctx.json({
      success: true,
      data: {
        processed: body.items.length,
        updated: body.items.length,
        failed: 0,
        orders_affected: body.items.length * 5,
        details: body.items.map((id: string) => ({
          item_id: id,
          status: 'success',
          orders_updated: 5,
        })),
      },
    }));
  }),

  rest.put('/api/v1/pricing/market-prices/:id/confirm', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(ctx.json({
      item_id: id,
      status: 'confirmed',
      confirmed_by: 'USER_001',
      confirmed_at: new Date().toISOString(),
    }));
  }),

  rest.post('/api/v1/pricing/market-prices/upload', async (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      uploaded: 10,
      errors: [],
    }));
  })
);

describe('Market Price and Reprice Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Market Price Display', () => {
    it('should display market prices by status', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品A')).toBeInTheDocument();
        expect(screen.getByText('時價商品B')).toBeInTheDocument();
        expect(screen.getByText('時價商品C')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText('待確認')).toBeInTheDocument();
      expect(screen.getByText('已確認')).toBeInTheDocument();
      expect(screen.getByText('已套用')).toBeInTheDocument();
    });

    it('should filter by status', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品A')).toBeInTheDocument();
      });

      // Filter pending only
      const statusFilter = screen.getByLabelText(/狀態/);
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('時價商品A')).toBeInTheDocument();
        expect(screen.queryByText('時價商品B')).not.toBeInTheDocument();
        expect(screen.queryByText('時價商品C')).not.toBeInTheDocument();
      });
    });

    it('should display applied orders count', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品C')).toBeInTheDocument();
      });

      const appliedRow = screen.getByTestId('market-price-MKT_TEST_003');
      expect(within(appliedRow).getByText(/已套用至 2 筆訂單/)).toBeInTheDocument();
    });
  });

  describe('Price Confirmation', () => {
    it('should confirm pending prices', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品A')).toBeInTheDocument();
      });

      // Find pending item
      const pendingRow = screen.getByTestId('market-price-MKT_TEST_001');
      const confirmBtn = within(pendingRow).getByRole('button', { name: /確認/ });
      
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/確認此市場價格？/)).toBeInTheDocument();
      });

      const dialogConfirmBtn = screen.getByRole('button', { name: /確定/ });
      fireEvent.click(dialogConfirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/價格確認成功/)).toBeInTheDocument();
      });
    });

    it('should batch confirm multiple prices', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品A')).toBeInTheDocument();
      });

      // Select multiple pending items
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First item
      
      const batchConfirmBtn = screen.getByRole('button', { name: /批量確認/ });
      expect(batchConfirmBtn).toBeEnabled();
      
      fireEvent.click(batchConfirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/確認 1 個價格項目？/)).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /確定/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/批量確認成功/)).toBeInTheDocument();
      });
    });
  });

  describe('Reprice Operations', () => {
    it('should execute reprice for confirmed items', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品B')).toBeInTheDocument();
      });

      // Select confirmed item
      const confirmedRow = screen.getByTestId('market-price-MKT_TEST_002');
      const checkbox = within(confirmedRow).getByRole('checkbox');
      fireEvent.click(checkbox);

      // Click reprice
      const repriceBtn = screen.getByRole('button', { name: /執行回填/ });
      fireEvent.click(repriceBtn);

      await waitFor(() => {
        expect(screen.getByText(/確認執行價格回填？/)).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /確認回填/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/回填成功/)).toBeInTheDocument();
        expect(screen.getByText(/影響 5 筆訂單/)).toBeInTheDocument();
      });
    });

    it('should show reprice preview', async () => {
      renderWithProviders(<MarketPriceManagement />);

      await waitFor(() => {
        expect(screen.getByText('時價商品B')).toBeInTheDocument();
      });

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[2]); // Confirmed item

      // Preview reprice
      const previewBtn = screen.getByRole('button', { name: /預覽影響/ });
      fireEvent.click(previewBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/預計影響訂單/)).toBeInTheDocument();
        expect(screen.getByText(/預計更新金額/)).toBeInTheDocument();
      });
    });

    it('should handle reprice by date range', async () => {
      renderWithProviders(<MarketPriceManagement />);

      // Open batch reprice dialog
      const batchRepriceBtn = screen.getByRole('button', { name: /批量回填/ });
      fireEvent.click(batchRepriceBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set date range
      fireEvent.change(screen.getByLabelText(/開始日期/), { target: { value: '2025-08-01' } });
      fireEvent.change(screen.getByLabelText(/結束日期/), { target: { value: '2025-08-20' } });

      // Execute
      const executeBtn = screen.getByRole('button', { name: /執行/ });
      fireEvent.click(executeBtn);

      await waitFor(() => {
        expect(screen.getByText(/批量回填完成/)).toBeInTheDocument();
      });
    });
  });

  describe('Market Price Upload', () => {
    it('should upload market prices from file', async () => {
      renderWithProviders(<MarketPriceManagement />);

      // Open upload dialog
      const uploadBtn = screen.getByRole('button', { name: /上傳市價/ });
      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select file
      const file = new File(['market price data'], 'market_prices.csv', {
        type: 'text/csv',
      });

      const fileInput = screen.getByLabelText(/選擇檔案/);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Set date
      fireEvent.change(screen.getByLabelText(/價格日期/), { target: { value: '2025-08-20' } });

      // Upload
      const submitBtn = screen.getByRole('button', { name: /上傳/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/上傳成功/)).toBeInTheDocument();
        expect(screen.getByText(/已上傳 10 筆價格/)).toBeInTheDocument();
      });
    });

    it('should validate upload data', async () => {
      server.use(
        rest.post('/api/v1/pricing/market-prices/upload', async (req, res, ctx) => {
          return res(ctx.json({
            success: false,
            uploaded: 8,
            errors: [
              { row: 3, error: '商品代碼不存在' },
              { row: 7, error: '價格格式錯誤' },
            ],
          }));
        })
      );

      renderWithProviders(<MarketPriceManagement />);

      const uploadBtn = screen.getByRole('button', { name: /上傳市價/ });
      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const file = new File(['invalid data'], 'market_prices.csv', {
        type: 'text/csv',
      });

      const fileInput = screen.getByLabelText(/選擇檔案/);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole('button', { name: /上傳/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/部分資料上傳失敗/)).toBeInTheDocument();
        expect(screen.getByText(/第 3 行: 商品代碼不存在/)).toBeInTheDocument();
        expect(screen.getByText(/第 7 行: 價格格式錯誤/)).toBeInTheDocument();
      });
    });
  });

  describe('Reprice History', () => {
    it('should display reprice history', async () => {
      renderWithProviders(<MarketPriceManagement />);

      // Switch to history tab
      const historyTab = screen.getByRole('tab', { name: /回填歷史/ });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/回填日期/)).toBeInTheDocument();
        expect(screen.getByText(/影響訂單數/)).toBeInTheDocument();
        expect(screen.getByText(/執行人/)).toBeInTheDocument();
      });
    });

    it('should show reprice details', async () => {
      renderWithProviders(<MarketPriceManagement />);

      const historyTab = screen.getByRole('tab', { name: /回填歷史/ });
      fireEvent.click(historyTab);

      await waitFor(() => {
        const viewDetailBtns = screen.getAllByRole('button', { name: /查看詳情/ });
        fireEvent.click(viewDetailBtns[0]);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/回填明細/)).toBeInTheDocument();
        expect(screen.getByText(/商品清單/)).toBeInTheDocument();
        expect(screen.getByText(/影響訂單/)).toBeInTheDocument();
      });
    });
  });
});