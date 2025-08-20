import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import RouteTracker from '../../../components/RouteTracker';
import { testDataBuilders } from '../../setup';

describe('RouteTracker Component', () => {
  const mockRoute = testDataBuilders.createTestDeliveryRoute({
    status: 'in_progress',
    completed_stops: 3,
  });

  const mockStops = [
    testDataBuilders.createTestDeliveryStop({ status: 'completed' }),
    testDataBuilders.createTestDeliveryStop({ 
      stop_id: 'STOP_002', 
      stop_sequence: 2,
      status: 'completed' 
    }),
    testDataBuilders.createTestDeliveryStop({ 
      stop_id: 'STOP_003', 
      stop_sequence: 3,
      status: 'completed' 
    }),
    testDataBuilders.createTestDeliveryStop({ 
      stop_id: 'STOP_004', 
      stop_sequence: 4,
      status: 'in_progress' 
    }),
    testDataBuilders.createTestDeliveryStop({ 
      stop_id: 'STOP_005', 
      stop_sequence: 5,
      status: 'pending' 
    }),
  ];

  const mockTracking = testDataBuilders.createTestRouteTracking({
    current_stop: 'STOP_004',
    next_stop: 'STOP_005',
  });

  const defaultProps = {
    route: mockRoute,
    stops: mockStops,
    tracking: mockTracking,
    onUpdateLocation: vi.fn(),
    onCompleteStop: vi.fn(),
    onReportIssue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display route information', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    expect(screen.getByText('RT-20250820-001')).toBeInTheDocument();
    expect(screen.getByText('張司機')).toBeInTheDocument();
    expect(screen.getByText('TPE-1234')).toBeInTheDocument();
  });

  it('should show route progress', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const progressBar = screen.getByTestId('route-progress-bar');
    expect(progressBar).toHaveStyle({ width: '37.5%' }); // 3/8 stops
    expect(screen.getByText('3/8 站完成')).toBeInTheDocument();
  });

  it('should display current location', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    expect(screen.getByText(/當前位置/)).toBeInTheDocument();
    expect(screen.getByText('25.0330, 121.5654')).toBeInTheDocument();
    expect(screen.getByText('35 km/h')).toBeInTheDocument();
  });

  it('should show stop list with status', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const stop1 = screen.getByTestId('stop-STOP_TEST_001');
    expect(stop1).toHaveClass('completed');
    
    const stop4 = screen.getByTestId('stop-STOP_004');
    expect(stop4).toHaveClass('in-progress');
    
    const stop5 = screen.getByTestId('stop-STOP_005');
    expect(stop5).toHaveClass('pending');
  });

  it('should display ETA for next stop', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    expect(screen.getByText(/下一站 ETA/)).toBeInTheDocument();
    expect(screen.getByText('10:15')).toBeInTheDocument();
    expect(screen.getByText('2.5 km')).toBeInTheDocument();
  });

  it('should handle stop completion', async () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const completeBtn = screen.getByRole('button', { name: /完成當前站點/ });
    fireEvent.click(completeBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/確認完成配送/)).toBeInTheDocument();
    });
    
    // Add signature
    const signaturePad = screen.getByTestId('signature-pad');
    fireEvent.mouseDown(signaturePad);
    fireEvent.mouseMove(signaturePad);
    fireEvent.mouseUp(signaturePad);
    
    // Take photo
    const photoBtn = screen.getByRole('button', { name: /拍照/ });
    fireEvent.click(photoBtn);
    
    // Confirm completion
    const confirmBtn = screen.getByRole('button', { name: /確認完成/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onCompleteStop).toHaveBeenCalledWith('STOP_004', {
      signature: expect.any(String),
      photo: expect.any(String),
    });
  });

  it('should update GPS location', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const updateLocationBtn = screen.getByRole('button', { name: /更新位置/ });
    fireEvent.click(updateLocationBtn);
    
    expect(defaultProps.onUpdateLocation).toHaveBeenCalledWith({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      timestamp: expect.any(Date),
    });
  });

  it('should show real-time map', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    expect(screen.getByTestId('route-map')).toBeInTheDocument();
    expect(screen.getByTestId('driver-marker')).toBeInTheDocument();
    expect(screen.getAllByTestId(/stop-marker-/)).toHaveLength(5);
  });

  it('should report delivery issue', async () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const issueBtn = screen.getByRole('button', { name: /回報問題/ });
    fireEvent.click(issueBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/回報配送問題/)).toBeInTheDocument();
    });
    
    // Select issue type
    const issueType = screen.getByLabelText(/問題類型/);
    fireEvent.change(issueType, { target: { value: 'customer_unavailable' } });
    
    // Add description
    const description = screen.getByLabelText(/問題描述/);
    fireEvent.change(description, { target: { value: '客戶不在家' } });
    
    // Submit issue
    const submitBtn = screen.getByRole('button', { name: /提交/ });
    fireEvent.click(submitBtn);
    
    expect(defaultProps.onReportIssue).toHaveBeenCalledWith({
      stop_id: 'STOP_004',
      issue_type: 'customer_unavailable',
      description: '客戶不在家',
    });
  });

  it('should display time deviation alerts', () => {
    const delayedTracking = testDataBuilders.createTestRouteTracking({
      eta_next_stop: new Date('2025-08-20T10:45:00'), // 30 minutes late
    });
    
    renderWithProviders(
      <RouteTracker {...defaultProps} tracking={delayedTracking} />
    );
    
    expect(screen.getByTestId('delay-alert')).toBeInTheDocument();
    expect(screen.getByText(/預計延遲 30 分鐘/)).toBeInTheDocument();
  });

  it('should show navigation instructions', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const navigateBtn = screen.getByRole('button', { name: /導航至下一站/ });
    fireEvent.click(navigateBtn);
    
    expect(screen.getByTestId('navigation-panel')).toBeInTheDocument();
    expect(screen.getByText(/前往 STOP_005/)).toBeInTheDocument();
  });

  it('should display stop details on click', async () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const stop = screen.getByTestId('stop-STOP_TEST_001');
    fireEvent.click(stop);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('客戶A')).toBeInTheDocument();
      expect(screen.getByText('台北市信義區測試路100號')).toBeInTheDocument();
      expect(screen.getByText('09:00-12:00')).toBeInTheDocument();
    });
  });

  it('should handle offline mode', () => {
    renderWithProviders(<RouteTracker {...defaultProps} offline={true} />);
    
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    expect(screen.getByText(/離線模式/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /同步資料/ })).toBeInTheDocument();
  });

  it('should show delivery notes', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const notesBtn = screen.getByRole('button', { name: /查看備註/ });
    fireEvent.click(notesBtn);
    
    expect(screen.getByText('請按門鈴')).toBeInTheDocument();
  });

  it('should display customer contact info', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const contactBtn = screen.getByRole('button', { name: /聯絡客戶/ });
    fireEvent.click(contactBtn);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/撥打電話/)).toBeInTheDocument();
    expect(screen.getByText(/發送簡訊/)).toBeInTheDocument();
  });

  it('should track driver break time', async () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const breakBtn = screen.getByRole('button', { name: /休息/ });
    fireEvent.click(breakBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/休息中/)).toBeInTheDocument();
      expect(screen.getByTestId('break-timer')).toBeInTheDocument();
    });
    
    const resumeBtn = screen.getByRole('button', { name: /結束休息/ });
    fireEvent.click(resumeBtn);
    
    expect(screen.queryByText(/休息中/)).not.toBeInTheDocument();
  });

  it('should calculate remaining time', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const remainingTime = screen.getByTestId('remaining-time');
    expect(remainingTime).toHaveTextContent(/預計剩餘時間: \d+ 分鐘/);
  });

  it('should show route statistics', () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const statsBtn = screen.getByRole('button', { name: /統計資料/ });
    fireEvent.click(statsBtn);
    
    expect(screen.getByText(/平均停留時間/)).toBeInTheDocument();
    expect(screen.getByText(/總行駛距離/)).toBeInTheDocument();
    expect(screen.getByText(/準時率/)).toBeInTheDocument();
  });

  it('should handle route reassignment notification', () => {
    const reassignedRoute = {
      ...mockRoute,
      status: 'reassigned',
      driver_id: 'DRV_002',
    };
    
    renderWithProviders(
      <RouteTracker {...defaultProps} route={reassignedRoute} />
    );
    
    expect(screen.getByTestId('reassignment-alert')).toBeInTheDocument();
    expect(screen.getByText(/路線已重新分配/)).toBeInTheDocument();
  });

  it('should export delivery proof', async () => {
    renderWithProviders(<RouteTracker {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出配送證明/ });
    fireEvent.click(exportBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/正在產生配送證明/)).toBeInTheDocument();
    });
  });
});