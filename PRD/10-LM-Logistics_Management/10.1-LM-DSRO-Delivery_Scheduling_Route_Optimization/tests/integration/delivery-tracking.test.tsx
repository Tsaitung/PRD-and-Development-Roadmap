import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import DeliveryTracking from '../../../pages/DeliveryTracking';
import { logisticsApiHandlers } from '../mocks/logistics-api';
import { testDataBuilders } from '../setup';

const server = setupServer(...logisticsApiHandlers);

describe('Delivery Tracking Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20T10:00:00'));
    
    // Mock geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 25.0330,
              longitude: 121.5654,
              accuracy: 10,
            },
          });
        }),
        watchPosition: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Driver Mobile App', () => {
    it('should display assigned route for driver', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" />);

      await waitFor(() => {
        expect(screen.getByText('今日路線')).toBeInTheDocument();
        expect(screen.getByText('RT-20250820-001')).toBeInTheDocument();
        expect(screen.getByText('8 個配送點')).toBeInTheDocument();
      });

      // Check route status
      expect(screen.getByText('已規劃')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /開始配送/ })).toBeInTheDocument();
    });

    it('should start route and update status', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /開始配送/ })).toBeInTheDocument();
      });

      // Start route
      const startBtn = screen.getByRole('button', { name: /開始配送/ });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(screen.getByText(/確認開始配送/)).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /確認/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText('配送中')).toBeInTheDocument();
        expect(screen.getByText(/下一站/)).toBeInTheDocument();
      });
    });

    it('should navigate to next stop', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" routeId="ROUTE_002" />);

      await waitFor(() => {
        expect(screen.getByText('配送中')).toBeInTheDocument();
        expect(screen.getByText('3/8 完成')).toBeInTheDocument();
      });

      // Show current stop details
      expect(screen.getByText('當前站點: #4')).toBeInTheDocument();
      expect(screen.getByText('客戶D')).toBeInTheDocument();
      expect(screen.getByText('台北市松山區測試路400號')).toBeInTheDocument();

      // Navigate button
      const navigateBtn = screen.getByRole('button', { name: /導航/ });
      fireEvent.click(navigateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('navigation-view')).toBeInTheDocument();
        expect(screen.getByText(/預計到達: 10:15/)).toBeInTheDocument();
      });
    });

    it('should complete delivery with proof', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" routeId="ROUTE_002" />);

      await waitFor(() => {
        expect(screen.getByText('當前站點: #4')).toBeInTheDocument();
      });

      // Arrive at stop
      const arriveBtn = screen.getByRole('button', { name: /到達/ });
      fireEvent.click(arriveBtn);

      await waitFor(() => {
        expect(screen.getByText('已到達')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /完成配送/ })).toBeInTheDocument();
      });

      // Complete delivery
      const completeBtn = screen.getByRole('button', { name: /完成配送/ });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByText(/配送確認/)).toBeInTheDocument();
      });

      // Add signature
      const signatureCanvas = screen.getByTestId('signature-canvas');
      fireEvent.mouseDown(signatureCanvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(signatureCanvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(signatureCanvas);

      // Take photo
      const photoBtn = screen.getByRole('button', { name: /拍照/ });
      fireEvent.click(photoBtn);

      // Mock camera capture
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
      });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /確認完成/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/配送完成/)).toBeInTheDocument();
        expect(screen.getByText('4/8 完成')).toBeInTheDocument();
      });
    });

    it('should handle delivery exceptions', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" routeId="ROUTE_002" />);

      await waitFor(() => {
        expect(screen.getByText('當前站點: #4')).toBeInTheDocument();
      });

      // Report issue
      const issueBtn = screen.getByRole('button', { name: /回報問題/ });
      fireEvent.click(issueBtn);

      await waitFor(() => {
        expect(screen.getByText(/配送問題回報/)).toBeInTheDocument();
      });

      // Select issue type
      const issueType = screen.getByLabelText(/問題類型/);
      fireEvent.change(issueType, { target: { value: 'customer_unavailable' } });

      // Add details
      const details = screen.getByLabelText(/詳細說明/);
      fireEvent.change(details, { target: { value: '多次按門鈴無人應答' } });

      // Choose action
      const actionSelect = screen.getByLabelText(/處理方式/);
      fireEvent.change(actionSelect, { target: { value: 'skip_return_later' } });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /提交/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/問題已記錄/)).toBeInTheDocument();
        expect(screen.getByTestId('issue-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Location Tracking', () => {
    it('should update driver location continuously', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" routeId="ROUTE_002" />);

      await waitFor(() => {
        expect(screen.getByTestId('current-location')).toBeInTheDocument();
      });

      // Initial location
      expect(screen.getByText('25.0330, 121.5654')).toBeInTheDocument();

      // Simulate location update
      const updateLocationBtn = screen.getByRole('button', { name: /更新位置/ });
      fireEvent.click(updateLocationBtn);

      // Mock new location
      navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => {
        success({
          coords: {
            latitude: 25.0340,
            longitude: 121.5664,
            accuracy: 10,
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('25.0340, 121.5664')).toBeInTheDocument();
      });
    });

    it('should calculate and update ETA', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" routeId="ROUTE_002" />);

      await waitFor(() => {
        expect(screen.getByText(/下一站 ETA/)).toBeInTheDocument();
      });

      // Initial ETA
      expect(screen.getByText('10:15')).toBeInTheDocument();

      // Simulate traffic delay
      server.use(
        rest.get('/api/v1/routes/:id/tracking', (req, res, ctx) => {
          return res(
            ctx.json(testDataBuilders.createTestRouteTracking({
              eta_next_stop: new Date('2025-08-20T10:25:00'),
              traffic_condition: 'heavy',
            }))
          );
        })
      );

      // Refresh tracking
      const refreshBtn = screen.getByRole('button', { name: /重新整理/ });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByText('10:25')).toBeInTheDocument();
        expect(screen.getByText(/交通壅塞/)).toBeInTheDocument();
      });
    });

    it('should show offline mode when connection lost', async () => {
      renderWithProviders(<DeliveryTracking driverId="DRV_001" routeId="ROUTE_002" />);

      await waitFor(() => {
        expect(screen.getByText('配送中')).toBeInTheDocument();
      });

      // Simulate offline
      server.use(
        rest.get('/api/v1/routes/:id/tracking', (req, res, ctx) => {
          return res.networkError('Failed to connect');
        })
      );

      // Try to update
      const refreshBtn = screen.getByRole('button', { name: /重新整理/ });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
        expect(screen.getByText(/離線模式/)).toBeInTheDocument();
      });

      // Should still allow local operations
      const arriveBtn = screen.getByRole('button', { name: /到達/ });
      expect(arriveBtn).not.toBeDisabled();
    });
  });

  describe('Customer Tracking Portal', () => {
    it('should display delivery status for customer', async () => {
      renderWithProviders(<DeliveryTracking orderId="ORD_001" mode="customer" />);

      await waitFor(() => {
        expect(screen.getByText('訂單配送狀態')).toBeInTheDocument();
        expect(screen.getByText('訂單編號: ORD_001')).toBeInTheDocument();
      });

      // Show delivery info
      expect(screen.getByText('預計送達: 11:00-12:00')).toBeInTheDocument();
      expect(screen.getByText('司機: 張司機')).toBeInTheDocument();
      expect(screen.getByText('車號: TPE-1234')).toBeInTheDocument();
    });

    it('should show real-time driver location on map', async () => {
      renderWithProviders(<DeliveryTracking orderId="ORD_001" mode="customer" />);

      await waitFor(() => {
        expect(screen.getByTestId('delivery-map')).toBeInTheDocument();
      });

      // Check map elements
      expect(screen.getByTestId('driver-marker')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-marker')).toBeInTheDocument();
      expect(screen.getByTestId('route-line')).toBeInTheDocument();

      // Show distance
      expect(screen.getByText(/距離: 2.5 km/)).toBeInTheDocument();
    });

    it('should update delivery progress', async () => {
      renderWithProviders(<DeliveryTracking orderId="ORD_001" mode="customer" />);

      await waitFor(() => {
        expect(screen.getByTestId('delivery-progress')).toBeInTheDocument();
      });

      // Progress steps
      expect(screen.getByText('訂單確認')).toHaveClass('completed');
      expect(screen.getByText('準備配送')).toHaveClass('completed');
      expect(screen.getByText('配送中')).toHaveClass('active');
      expect(screen.getByText('已送達')).toHaveClass('pending');
    });

    it('should allow customer to contact driver', async () => {
      renderWithProviders(<DeliveryTracking orderId="ORD_001" mode="customer" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /聯絡司機/ })).toBeInTheDocument();
      });

      const contactBtn = screen.getByRole('button', { name: /聯絡司機/ });
      fireEvent.click(contactBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/聯絡方式/)).toBeInTheDocument();
      });

      // Contact options
      expect(screen.getByRole('button', { name: /撥打電話/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /發送訊息/ })).toBeInTheDocument();
    });

    it('should show delivery completion notification', async () => {
      renderWithProviders(<DeliveryTracking orderId="ORD_001" mode="customer" />);

      // Simulate delivery completion
      server.use(
        rest.get('/api/v1/orders/:id/delivery', (req, res, ctx) => {
          return res(
            ctx.json({
              status: 'delivered',
              delivered_at: new Date('2025-08-20T11:45:00'),
              signature: 'signature_url',
              photo: 'photo_url',
            })
          );
        })
      );

      // Poll for updates
      await waitFor(
        () => {
          expect(screen.getByText(/訂單已送達/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Show proof of delivery
      expect(screen.getByText('送達時間: 11:45')).toBeInTheDocument();
      expect(screen.getByTestId('signature-image')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-photo')).toBeInTheDocument();
    });
  });

  describe('Manager Dashboard', () => {
    it('should display all active routes overview', async () => {
      renderWithProviders(<DeliveryTracking mode="manager" />);

      await waitFor(() => {
        expect(screen.getByText('配送監控中心')).toBeInTheDocument();
      });

      // Summary stats
      expect(screen.getByText('進行中路線: 20')).toBeInTheDocument();
      expect(screen.getByText('已完成: 5')).toBeInTheDocument();
      expect(screen.getByText('延遲: 2')).toBeInTheDocument();

      // Route list
      expect(screen.getByTestId('active-routes-table')).toBeInTheDocument();
    });

    it('should show alerts for delayed deliveries', async () => {
      renderWithProviders(<DeliveryTracking mode="manager" />);

      await waitFor(() => {
        expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
      });

      // Delay alerts
      expect(screen.getByText(/RT-20250820-005 延遲 15 分鐘/)).toBeInTheDocument();
      expect(screen.getByText(/RT-20250820-008 延遲 30 分鐘/)).toBeInTheDocument();

      // Action buttons
      const alertItem = screen.getByTestId('alert-RT-20250820-005');
      const contactBtn = within(alertItem).getByRole('button', { name: /聯絡司機/ });
      const reassignBtn = within(alertItem).getByRole('button', { name: /重新分配/ });
      
      expect(contactBtn).toBeInTheDocument();
      expect(reassignBtn).toBeInTheDocument();
    });

    it('should provide route intervention options', async () => {
      renderWithProviders(<DeliveryTracking mode="manager" />);

      await waitFor(() => {
        expect(screen.getByTestId('active-routes-table')).toBeInTheDocument();
      });

      // Select problematic route
      const routeRow = screen.getByTestId('route-row-ROUTE_005');
      fireEvent.click(routeRow);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/路線詳情: RT-20250820-005/)).toBeInTheDocument();
      });

      // Intervention options
      expect(screen.getByRole('button', { name: /優化剩餘路線/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /分配支援司機/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /調整配送順序/ })).toBeInTheDocument();
    });
  });
});