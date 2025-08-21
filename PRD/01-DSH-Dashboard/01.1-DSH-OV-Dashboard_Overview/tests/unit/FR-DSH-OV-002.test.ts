/**
 * 單元測試: FR-DSH-OV-002 即時通知中心
 * 測試檔案路徑: tests/unit/FR-DSH-OV-002.test.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotificationService } from '@/modules/dashboard/services/NotificationService';
import { WebSocketClient } from '@/modules/dashboard/websocket/WebSocketClient';
import { Notification } from '@/modules/dashboard/types';

describe('FR-DSH-OV-002: 即時通知中心', () => {
  let notificationService: NotificationService;
  let wsClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    wsClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;
    notificationService = new NotificationService(wsClient);
  });

  describe('通知推送', () => {
    it('新通知應在1秒內推送至用戶端', async () => {
      // Arrange
      const notification: Notification = {
        id: '1',
        userId: 'user1',
        type: 'business',
        priority: 'urgent',
        title: '緊急訂單',
        content: '訂單 #12345 需要立即處理',
        isRead: false,
        createdAt: new Date()
      };

      // Act
      const startTime = Date.now();
      await notificationService.pushNotification(notification);
      const pushTime = Date.now() - startTime;

      // Assert
      expect(pushTime).toBeLessThan(1000);
      expect(wsClient.emit).toHaveBeenCalledWith('notification', notification);
    });

    it('應正確分類通知類型', () => {
      // Arrange
      const notifications: Notification[] = [
        { type: 'system', priority: 'normal' } as Notification,
        { type: 'business', priority: 'urgent' } as Notification,
        { type: 'personal', priority: 'normal' } as Notification,
      ];

      // Act
      const categorized = notificationService.categorizeNotifications(notifications);

      // Assert
      expect(categorized.system).toHaveLength(1);
      expect(categorized.business).toHaveLength(1);
      expect(categorized.personal).toHaveLength(1);
    });
  });

  describe('已讀管理', () => {
    it('批量標記已讀應清除未讀標記', async () => {
      // Arrange
      const unreadIds = ['1', '2', '3'];
      
      // Act
      await notificationService.markAllAsRead(unreadIds);
      const unreadCount = await notificationService.getUnreadCount();

      // Assert
      expect(unreadCount).toBe(0);
    });
  });

  describe('WebSocket重連', () => {
    it('連線中斷時應自動重連', async () => {
      // Arrange
      wsClient.connect.mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce(undefined);

      // Act
      await notificationService.handleDisconnection();

      // Assert
      expect(wsClient.connect).toHaveBeenCalledTimes(2);
    });

    it('重連後應載入離線期間的通知', async () => {
      // Arrange
      const offlineNotifications = [
        { id: '1', createdAt: new Date() } as Notification,
        { id: '2', createdAt: new Date() } as Notification,
      ];
      
      // Act
      const loaded = await notificationService.loadOfflineNotifications();

      // Assert
      expect(loaded).toHaveLength(2);
    });
  });
});