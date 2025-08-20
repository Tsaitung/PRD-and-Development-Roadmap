import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderSummaryDashboard from '../../../pages/OrderSummaryDashboard';
import { testDataBuilders } from '../setup';

const server = setupServer(
  rest.get('/api/v1/orders/summary', (req, res, ctx) => {
    const date = req.url.searchParams.get('date') || '2025-08-20';
    const period = req.url.searchParams.get('period') || 'daily';

    const summary = testDataBuilders.createTestOrderSummary({
      summary_date: new Date(date),
      total_orders: period === 'monthly' ? 1500 : 50,
      total_amount: period === 'monthly' ? 15000000 : 500000,
    });

    return res(ctx.json(summary));
  }),

  rest.get('/api/v1/orders/statistics/trend', (req, res, ctx) => {
    const period = req.url.searchParams.get('period');
    
    const trend = {
      labels: period === 'monthly' 
        ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月']
        : ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
      datasets: [
        {
          label: '訂單數',
          data: period === 'monthly'
            ? [120, 150, 180, 160, 200, 190, 210, 230]
            : [45, 52, 48, 55, 60, 35, 30],
        },
        {
          label: '營業額',
          data: period === 'monthly'
            ? [1200000, 1500000, 1800000, 1600000, 2000000, 1900000, 2100000, 2300000]
            : [450000, 520000, 480000, 550000, 600000, 350000, 300000],
        },
      ],
    };

    return res(ctx.json(trend));
  }),

  rest.get('/api/v1/orders/statistics/products', (req, res, ctx) => {
    const products = [
      { product_id: 'PROD_001', product_name: '商品A', sales: 500, revenue: 250000 },
      { product_id: 'PROD_002', product_name: '商品B', sales: 450, revenue: 225000 },
      { product_id: 'PROD_003', product_name: '商品C', sales: 380, revenue: 190000 },
      { product_id: 'PROD_004', product_name: '商品D', sales: 320, revenue: 160000 },
      { product_id: 'PROD_005', product_name: '商品E', sales: 280, revenue: 140000 },
    ];

    return res(ctx.json(products));
  })
);

describe('Order Summary Dashboard Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Summary Display', () => {
    it('should display daily summary', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/2025年8月20日 訂單統計/)).toBeInTheDocument();
        expect(screen.getByText(/總訂單數: 50/)).toBeInTheDocument();
        expect(screen.getByText(/總營業額: 500,000/)).toBeInTheDocument();
      });
    });

    it('should switch to weekly view', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      const periodSelect = screen.getByLabelText(/統計週期/);
      fireEvent.change(periodSelect, { target: { value: 'weekly' } });

      await waitFor(() => {
        expect(screen.getByText(/本週訂單統計/)).toBeInTheDocument();
      });
    });

    it('should switch to monthly view', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      const periodSelect = screen.getByLabelText(/統計週期/);
      fireEvent.change(periodSelect, { target: { value: 'monthly' } });

      await waitFor(() => {
        expect(screen.getByText(/2025年8月 訂單統計/)).toBeInTheDocument();
        expect(screen.getByText(/總訂單數: 1,500/)).toBeInTheDocument();
        expect(screen.getByText(/總營業額: 15,000,000/)).toBeInTheDocument();
      });
    });

    it('should change date and refresh data', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      const dateInput = screen.getByLabelText(/選擇日期/);
      fireEvent.change(dateInput, { target: { value: '2025-08-19' } });

      await waitFor(() => {
        expect(screen.getByText(/2025年8月19日 訂單統計/)).toBeInTheDocument();
      });
    });
  });

  describe('Status Breakdown', () => {
    it('should display order status distribution', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/待確認: 5/)).toBeInTheDocument();
        expect(screen.getByText(/已確認: 20/)).toBeInTheDocument();
        expect(screen.getByText(/處理中: 15/)).toBeInTheDocument();
        expect(screen.getByText(/已出貨: 8/)).toBeInTheDocument();
        expect(screen.getByText(/已完成: 2/)).toBeInTheDocument();
      });
    });

    it('should show status percentage', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/待確認.*10%/)).toBeInTheDocument();
        expect(screen.getByText(/已確認.*40%/)).toBeInTheDocument();
        expect(screen.getByText(/處理中.*30%/)).toBeInTheDocument();
      });
    });

    it('should display status chart', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('status-pie-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Top Customers and Products', () => {
    it('should display top customers', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText('客戶A')).toBeInTheDocument();
        expect(screen.getByText(/10 筆訂單/)).toBeInTheDocument();
        expect(screen.getByText(/100,000/)).toBeInTheDocument();
      });
    });

    it('should display top products', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText(/數量: 100/)).toBeInTheDocument();
        expect(screen.getByText(/金額: 50,000/)).toBeInTheDocument();
      });
    });

    it('should load more products', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText('商品A')).toBeInTheDocument();
      });

      const loadMoreBtn = screen.getByRole('button', { name: /載入更多/ });
      fireEvent.click(loadMoreBtn);

      await waitFor(() => {
        expect(screen.getByText('商品E')).toBeInTheDocument();
      });
    });
  });

  describe('Trend Charts', () => {
    it('should display order trend chart', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('order-trend-chart')).toBeInTheDocument();
      });
    });

    it('should display revenue trend chart', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('revenue-trend-chart')).toBeInTheDocument();
      });
    });

    it('should update charts on period change', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('order-trend-chart')).toBeInTheDocument();
      });

      const periodSelect = screen.getByLabelText(/統計週期/);
      fireEvent.change(periodSelect, { target: { value: 'monthly' } });

      await waitFor(() => {
        // Chart should show monthly data
        expect(screen.getByText(/1月/)).toBeInTheDocument();
        expect(screen.getByText(/8月/)).toBeInTheDocument();
      });
    });
  });

  describe('Export and Actions', () => {
    it('should export summary report', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/總訂單數/)).toBeInTheDocument();
      });

      const exportBtn = screen.getByRole('button', { name: /匯出報表/ });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const pdfOption = screen.getByLabelText(/PDF/);
      fireEvent.click(pdfOption);

      const confirmBtn = screen.getByRole('button', { name: /確認匯出/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表匯出成功/)).toBeInTheDocument();
      });
    });

    it('should print summary', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/總訂單數/)).toBeInTheDocument();
      });

      const printBtn = screen.getByRole('button', { name: /列印/ });
      fireEvent.click(printBtn);

      expect(window.print).toHaveBeenCalled();
    });

    it('should refresh data', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/總訂單數: 50/)).toBeInTheDocument();
      });

      const refreshBtn = screen.getByRole('button', { name: /重新整理/ });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByText(/總訂單數: 50/)).toBeInTheDocument();
      });
    });
  });

  describe('Comparison Features', () => {
    it('should compare with previous period', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/總訂單數/)).toBeInTheDocument();
      });

      const compareCheckbox = screen.getByLabelText(/與上期比較/);
      fireEvent.click(compareCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/較昨日/)).toBeInTheDocument();
        expect(screen.getByText(/↑ 10%/)).toBeInTheDocument();
      });
    });

    it('should compare year over year', async () => {
      renderWithProviders(<OrderSummaryDashboard />);

      const periodSelect = screen.getByLabelText(/統計週期/);
      fireEvent.change(periodSelect, { target: { value: 'monthly' } });

      await waitFor(() => {
        expect(screen.getByText(/2025年8月/)).toBeInTheDocument();
      });

      const yoyCheckbox = screen.getByLabelText(/年度比較/);
      fireEvent.click(yoyCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/較去年同期/)).toBeInTheDocument();
        expect(screen.getByText(/↑ 25%/)).toBeInTheDocument();
      });
    });
  });
});