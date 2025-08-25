"""
Dashboard Overview (DSH-OV) 單元測試
測試 Dashboard 總覽功能的核心邏輯
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import json


class TestDashboardMetrics:
    """測試儀表板指標計算"""
    
    @pytest.fixture
    def mock_database(self):
        """模擬資料庫連接"""
        with patch('src.modules.dsh.services.database') as mock_db:
            yield mock_db
    
    @pytest.fixture
    def dashboard_service(self, mock_database):
        """建立 Dashboard Service 實例"""
        from src.modules.dsh.services.dashboard_service import DashboardService
        return DashboardService(mock_database)
    
    def test_calculate_daily_revenue(self, dashboard_service):
        """測試計算每日營收"""
        # Arrange
        mock_orders = [
            {'date': '2025-08-25', 'amount': 10000},
            {'date': '2025-08-25', 'amount': 15000},
            {'date': '2025-08-25', 'amount': 8000}
        ]
        dashboard_service.db.get_orders.return_value = mock_orders
        
        # Act
        revenue = dashboard_service.calculate_daily_revenue('2025-08-25')
        
        # Assert
        assert revenue == 33000
        dashboard_service.db.get_orders.assert_called_once_with(date='2025-08-25')
    
    def test_calculate_order_completion_rate(self, dashboard_service):
        """測試計算訂單完成率"""
        # Arrange
        dashboard_service.db.get_order_stats.return_value = {
            'total': 100,
            'completed': 85,
            'cancelled': 10,
            'pending': 5
        }
        
        # Act
        completion_rate = dashboard_service.calculate_order_completion_rate()
        
        # Assert
        assert completion_rate == 85.0
    
    def test_get_inventory_alerts(self, dashboard_service):
        """測試取得庫存警報"""
        # Arrange
        mock_inventory = [
            {'item': '蒜頭', 'quantity': 50, 'min_threshold': 100},
            {'item': '薑', 'quantity': 200, 'min_threshold': 150},
            {'item': '洋蔥', 'quantity': 30, 'min_threshold': 80}
        ]
        dashboard_service.db.get_inventory_levels.return_value = mock_inventory
        
        # Act
        alerts = dashboard_service.get_inventory_alerts()
        
        # Assert
        assert len(alerts) == 2  # 蒜頭和洋蔥低於門檻
        assert alerts[0]['item'] == '蒜頭'
        assert alerts[1]['item'] == '洋蔥'


class TestDashboardNotifications:
    """測試儀表板通知功能"""
    
    @pytest.fixture
    def notification_service(self):
        """建立通知服務實例"""
        from src.modules.dsh.services.notification_service import NotificationService
        return NotificationService()
    
    def test_create_system_notification(self, notification_service):
        """測試建立系統通知"""
        # Arrange
        notification_data = {
            'type': 'SYSTEM',
            'title': '系統維護通知',
            'message': '系統將於今晚 10 點進行維護',
            'priority': 'HIGH'
        }
        
        # Act
        notification = notification_service.create_notification(**notification_data)
        
        # Assert
        assert notification['id'] is not None
        assert notification['type'] == 'SYSTEM'
        assert notification['priority'] == 'HIGH'
        assert notification['created_at'] is not None
    
    def test_filter_notifications_by_priority(self, notification_service):
        """測試依優先級篩選通知"""
        # Arrange
        notifications = [
            {'id': 1, 'priority': 'HIGH', 'title': '緊急通知'},
            {'id': 2, 'priority': 'LOW', 'title': '一般通知'},
            {'id': 3, 'priority': 'HIGH', 'title': '重要更新'}
        ]
        
        # Act
        high_priority = notification_service.filter_by_priority(notifications, 'HIGH')
        
        # Assert
        assert len(high_priority) == 2
        assert all(n['priority'] == 'HIGH' for n in high_priority)
    
    @patch('src.modules.dsh.services.notification_service.send_email')
    def test_send_notification_email(self, mock_send_email, notification_service):
        """測試發送通知郵件"""
        # Arrange
        notification = {
            'title': '訂單異常',
            'message': '訂單 #12345 處理異常',
            'recipients': ['admin@example.com']
        }
        mock_send_email.return_value = True
        
        # Act
        result = notification_service.send_email_notification(notification)
        
        # Assert
        assert result is True
        mock_send_email.assert_called_once()


class TestDashboardWidgets:
    """測試儀表板小工具"""
    
    @pytest.fixture
    def widget_manager(self):
        """建立小工具管理器"""
        from src.modules.dsh.widgets.widget_manager import WidgetManager
        return WidgetManager()
    
    def test_load_user_widgets(self, widget_manager):
        """測試載入使用者小工具配置"""
        # Arrange
        user_id = 'user123'
        expected_widgets = [
            {'id': 'revenue', 'position': {'x': 0, 'y': 0}},
            {'id': 'orders', 'position': {'x': 1, 'y': 0}},
            {'id': 'inventory', 'position': {'x': 0, 'y': 1}}
        ]
        widget_manager.storage.get_user_widgets = Mock(return_value=expected_widgets)
        
        # Act
        widgets = widget_manager.load_user_widgets(user_id)
        
        # Assert
        assert len(widgets) == 3
        assert widgets[0]['id'] == 'revenue'
    
    def test_save_widget_layout(self, widget_manager):
        """測試儲存小工具布局"""
        # Arrange
        user_id = 'user123'
        layout = [
            {'id': 'revenue', 'position': {'x': 2, 'y': 0}},
            {'id': 'orders', 'position': {'x': 0, 'y': 1}}
        ]
        widget_manager.storage.save_user_layout = Mock(return_value=True)
        
        # Act
        result = widget_manager.save_layout(user_id, layout)
        
        # Assert
        assert result is True
        widget_manager.storage.save_user_layout.assert_called_once_with(user_id, layout)
    
    def test_widget_data_refresh(self, widget_manager):
        """測試小工具資料刷新"""
        # Arrange
        widget_id = 'revenue'
        mock_data = {'total': 100000, 'change': '+5%'}
        widget_manager.data_source.fetch_widget_data = Mock(return_value=mock_data)
        
        # Act
        data = widget_manager.refresh_widget_data(widget_id)
        
        # Assert
        assert data['total'] == 100000
        assert data['change'] == '+5%'


class TestDashboardPerformance:
    """測試儀表板效能相關功能"""
    
    def test_dashboard_load_time(self):
        """測試儀表板載入時間"""
        # Arrange
        from src.modules.dsh.services.dashboard_service import DashboardService
        service = DashboardService()
        
        # Act
        start_time = datetime.now()
        service.load_dashboard_data(user_id='test_user')
        load_time = (datetime.now() - start_time).total_seconds()
        
        # Assert
        assert load_time < 2.0  # 載入時間應小於 2 秒
    
    def test_concurrent_widget_loading(self):
        """測試並發載入多個小工具"""
        # Arrange
        from src.modules.dsh.widgets.widget_manager import WidgetManager
        manager = WidgetManager()
        widget_ids = ['revenue', 'orders', 'inventory', 'logistics', 'production']
        
        # Act
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(manager.load_widget, wid) for wid in widget_ids]
            results = [f.result() for f in futures]
        
        # Assert
        assert len(results) == 5
        assert all(r is not None for r in results)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])