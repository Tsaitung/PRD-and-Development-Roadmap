/**
 * 單元測試: FR-DSH-OV-001 關鍵指標展示
 * 測試檔案路徑: tests/unit/FR-DSH-OV-001.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DashboardService } from '@/modules/dashboard/services/DashboardService';
import { MetricsAPI } from '@/modules/dashboard/api/MetricsAPI';
import { DashboardMetric } from '@/modules/dashboard/types';

describe('FR-DSH-OV-001: 關鍵指標展示', () => {
  let dashboardService: DashboardService;
  let metricsAPI: jest.Mocked<MetricsAPI>;

  beforeEach(() => {
    metricsAPI = {
      getMetrics: jest.fn(),
      getMetricHistory: jest.fn(),
    } as any;
    dashboardService = new DashboardService(metricsAPI);
  });

  describe('指標載入', () => {
    it('應在3秒內載入所有關鍵指標', async () => {
      // Arrange
      const mockMetrics: DashboardMetric[] = [
        {
          id: '1',
          type: 'sales',
          value: 1000000,
          unit: 'TWD',
          trend: 'up',
          changeRate: 5.2,
          timestamp: new Date(),
          metadata: {}
        }
      ];
      metricsAPI.getMetrics.mockResolvedValue(mockMetrics);

      // Act
      const startTime = Date.now();
      const result = await dashboardService.loadDashboardMetrics();
      const loadTime = Date.now() - startTime;

      // Assert
      expect(result).toEqual(mockMetrics);
      expect(loadTime).toBeLessThan(3000);
      expect(metricsAPI.getMetrics).toHaveBeenCalledWith({ period: 'today' });
    });

    it('應正確計算環比增長率', async () => {
      // Arrange
      const currentValue = 1000000;
      const previousValue = 950000;
      
      // Act
      const growthRate = dashboardService.calculateGrowthRate(currentValue, previousValue);
      
      // Assert
      expect(growthRate).toBeCloseTo(5.26, 2);
    });
  });

  describe('自動更新', () => {
    it('應每5分鐘自動更新一次數據', async () => {
      // Arrange
      jest.useFakeTimers();
      const updateSpy = jest.spyOn(dashboardService, 'refreshMetrics');

      // Act
      dashboardService.startAutoRefresh(5 * 60 * 1000);
      jest.advanceTimersByTime(5 * 60 * 1000);

      // Assert
      expect(updateSpy).toHaveBeenCalledTimes(1);
      
      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('錯誤處理', () => {
    it('API服務不可用時應顯示錯誤提示', async () => {
      // Arrange
      metricsAPI.getMetrics.mockRejectedValue(new Error('Service Unavailable'));

      // Act & Assert
      await expect(dashboardService.loadDashboardMetrics()).rejects.toThrow('Service Unavailable');
    });

    it('應提供手動重試機制', async () => {
      // Arrange
      metricsAPI.getMetrics
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce([]);

      // Act
      const firstAttempt = dashboardService.loadDashboardMetrics();
      await expect(firstAttempt).rejects.toThrow('Network Error');
      
      const retryAttempt = await dashboardService.retryLoadMetrics();
      
      // Assert
      expect(retryAttempt).toEqual([]);
      expect(metricsAPI.getMetrics).toHaveBeenCalledTimes(2);
    });
  });
});