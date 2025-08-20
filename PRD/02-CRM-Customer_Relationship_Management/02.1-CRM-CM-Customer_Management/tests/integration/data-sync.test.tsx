import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import DataSyncManager from '../../../components/DataSyncManager';
import { testDataBuilders } from '../../setup';

const server = setupServer(
  rest.post('/api/v1/customers/sync', async (req, res, ctx) => {
    const body = await req.json();
    
    return res(ctx.json({
      sync_id: `SYNC_${Date.now()}`,
      status: 'in_progress',
      total_records: body.customer_ids.length,
      synced: 0,
    }));
  }),
  
  rest.get('/api/v1/customers/sync/:syncId/status', (req, res, ctx) => {
    const { syncId } = req.params;
    
    return res(ctx.json({
      sync_id: syncId,
      status: 'completed',
      total_records: 10,
      synced: 10,
      failed: 0,
      errors: [],
    }));
  }),
  
  rest.post('/api/v1/customers/batch-update', async (req, res, ctx) => {
    const body = await req.json();
    
    return res(ctx.json({
      updated: body.updates.length,
      failed: 0,
      errors: [],
    }));
  })
);

describe('Customer Data Synchronization', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Real-time Sync', () => {
    it('should sync individual customer changes', async () => {
      renderWithProviders(<DataSyncManager customerId="ENT_TEST_001" />);
      
      const syncBtn = screen.getByRole('button', { name: /同步資料/ });
      fireEvent.click(syncBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/同步中/)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/同步完成/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle sync conflicts', async () => {
      server.use(
        rest.post('/api/v1/customers/sync', async (req, res, ctx) => {
          return res(ctx.json({
            sync_id: 'SYNC_CONFLICT',
            status: 'conflict',
            conflicts: [
              {
                field: 'company_name',
                local: '測試公司A',
                remote: '測試公司B',
                timestamp: new Date().toISOString(),
              }
            ],
          }));
        })
      );
      
      renderWithProviders(<DataSyncManager customerId="COM_TEST_001" />);
      
      const syncBtn = screen.getByRole('button', { name: /同步資料/ });
      fireEvent.click(syncBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/發現衝突/)).toBeInTheDocument();
      });
      
      const resolveBtn = screen.getByRole('button', { name: /解決衝突/ });
      expect(resolveBtn).toBeInTheDocument();
    });

    it('should retry failed sync', async () => {
      let attemptCount = 0;
      
      server.use(
        rest.post('/api/v1/customers/sync', async (req, res, ctx) => {
          attemptCount++;
          if (attemptCount === 1) {
            return res(ctx.status(500));
          }
          return res(ctx.json({
            sync_id: 'SYNC_RETRY',
            status: 'completed',
          }));
        })
      );
      
      renderWithProviders(<DataSyncManager customerId="ENT_TEST_001" />);
      
      const syncBtn = screen.getByRole('button', { name: /同步資料/ });
      fireEvent.click(syncBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/同步失敗/)).toBeInTheDocument();
      });
      
      const retryBtn = screen.getByRole('button', { name: /重試/ });
      fireEvent.click(retryBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/同步完成/)).toBeInTheDocument();
      });
      
      expect(attemptCount).toBe(2);
    });
  });

  describe('Batch Sync', () => {
    it('should sync multiple customers', async () => {
      const customerIds = ['ENT_TEST_001', 'COM_TEST_001', 'STO_TEST_001'];
      
      renderWithProviders(<DataSyncManager customerIds={customerIds} />);
      
      const batchSyncBtn = screen.getByRole('button', { name: /批量同步/ });
      fireEvent.click(batchSyncBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/同步進度: 0\/3/)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/同步進度: 3\/3/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show sync progress', async () => {
      server.use(
        rest.get('/api/v1/customers/sync/:syncId/status', (req, res, ctx) => {
          const progress = [
            { synced: 3, status: 'in_progress' },
            { synced: 6, status: 'in_progress' },
            { synced: 10, status: 'completed' },
          ];
          
          const index = Math.floor(Math.random() * 3);
          return res(ctx.json({
            sync_id: req.params.syncId,
            status: progress[index].status,
            total_records: 10,
            synced: progress[index].synced,
            failed: 0,
          }));
        })
      );
      
      renderWithProviders(<DataSyncManager customerIds={Array(10).fill('TEST')} />);
      
      const batchSyncBtn = screen.getByRole('button', { name: /批量同步/ });
      fireEvent.click(batchSyncBtn);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Field-level Updates', () => {
    it('should update specific fields only', async () => {
      renderWithProviders(
        <DataSyncManager 
          customerId="COM_TEST_001"
          fields={['billing_info', 'payment_info']}
        />
      );
      
      const syncBtn = screen.getByRole('button', { name: /同步帳務資料/ });
      fireEvent.click(syncBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/帳務資料同步完成/)).toBeInTheDocument();
      });
    });

    it('should validate field updates', async () => {
      server.use(
        rest.post('/api/v1/customers/batch-update', async (req, res, ctx) => {
          const body = await req.json();
          
          return res(ctx.json({
            updated: 0,
            failed: body.updates.length,
            errors: [
              { field: 'payment_term', message: '付款條件超出允許範圍' },
            ],
          }));
        })
      );
      
      renderWithProviders(
        <DataSyncManager 
          customerId="COM_TEST_001"
          fields={['payment_info']}
        />
      );
      
      const syncBtn = screen.getByRole('button', { name: /同步付款資料/ });
      fireEvent.click(syncBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/付款條件超出允許範圍/)).toBeInTheDocument();
      });
    });
  });
});