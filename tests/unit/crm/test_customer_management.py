"""
Customer Management (CRM-CM) 單元測試
測試客戶管理功能的核心邏輯
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import json


class TestCustomerCRUD:
    """測試客戶 CRUD 操作"""
    
    @pytest.fixture
    def customer_service(self):
        """建立客戶服務實例"""
        from src.modules.crm.services.customer_service import CustomerService
        return CustomerService()
    
    def test_create_customer(self, customer_service):
        """測試建立新客戶"""
        # Arrange
        customer_data = {
            'name': '測試餐廳',
            'contact_person': '王經理',
            'phone': '0912345678',
            'email': 'test@restaurant.com',
            'address': '台北市信義區信義路100號',
            'tax_id': '12345678',
            'customer_type': 'RESTAURANT'
        }
        
        # Act
        customer = customer_service.create_customer(**customer_data)
        
        # Assert
        assert customer['id'] is not None
        assert customer['name'] == '測試餐廳'
        assert customer['status'] == 'ACTIVE'
        assert customer['created_at'] is not None
    
    def test_update_customer_info(self, customer_service):
        """測試更新客戶資訊"""
        # Arrange
        customer_id = 'CUST001'
        updates = {
            'contact_person': '李經理',
            'phone': '0987654321',
            'email': 'new@restaurant.com'
        }
        customer_service.db.update_customer = Mock(return_value=True)
        
        # Act
        result = customer_service.update_customer(customer_id, updates)
        
        # Assert
        assert result is True
        customer_service.db.update_customer.assert_called_once_with(customer_id, updates)
    
    def test_search_customers(self, customer_service):
        """測試搜尋客戶"""
        # Arrange
        search_criteria = {
            'keyword': '餐廳',
            'customer_type': 'RESTAURANT',
            'status': 'ACTIVE'
        }
        mock_results = [
            {'id': 'CUST001', 'name': '美味餐廳'},
            {'id': 'CUST002', 'name': '幸福餐廳'}
        ]
        customer_service.db.search_customers = Mock(return_value=mock_results)
        
        # Act
        results = customer_service.search_customers(**search_criteria)
        
        # Assert
        assert len(results) == 2
        assert results[0]['name'] == '美味餐廳'
    
    def test_delete_customer_soft_delete(self, customer_service):
        """測試軟刪除客戶"""
        # Arrange
        customer_id = 'CUST001'
        customer_service.db.soft_delete_customer = Mock(return_value=True)
        
        # Act
        result = customer_service.delete_customer(customer_id, soft_delete=True)
        
        # Assert
        assert result is True
        customer_service.db.soft_delete_customer.assert_called_once_with(customer_id)


class TestCustomerSegmentation:
    """測試客戶分級功能"""
    
    @pytest.fixture
    def segmentation_service(self):
        """建立客戶分級服務"""
        from src.modules.crm.services.segmentation_service import SegmentationService
        return SegmentationService()
    
    def test_calculate_customer_tier(self, segmentation_service):
        """測試計算客戶等級"""
        # Arrange
        customer_metrics = {
            'monthly_revenue': 500000,  # 月營收 50 萬
            'order_frequency': 25,       # 月下單 25 次
            'average_order_value': 20000,
            'payment_on_time_rate': 0.95
        }
        
        # Act
        tier = segmentation_service.calculate_tier(customer_metrics)
        
        # Assert
        assert tier == 'GOLD'  # 依據業務規則應為金級客戶
    
    def test_apply_tier_discount(self, segmentation_service):
        """測試套用等級折扣"""
        # Arrange
        tier_discounts = {
            'PLATINUM': 0.15,
            'GOLD': 0.10,
            'SILVER': 0.05,
            'BRONZE': 0.02
        }
        base_price = 10000
        customer_tier = 'GOLD'
        
        # Act
        final_price = segmentation_service.apply_tier_discount(
            base_price, customer_tier, tier_discounts
        )
        
        # Assert
        assert final_price == 9000  # 10000 * (1 - 0.10)
    
    def test_segment_customers_by_value(self, segmentation_service):
        """測試依價值分群客戶"""
        # Arrange
        customers = [
            {'id': 'C1', 'total_revenue': 1000000},
            {'id': 'C2', 'total_revenue': 500000},
            {'id': 'C3', 'total_revenue': 100000},
            {'id': 'C4', 'total_revenue': 2000000}
        ]
        
        # Act
        segments = segmentation_service.segment_by_value(customers)
        
        # Assert
        assert 'high_value' in segments
        assert 'medium_value' in segments
        assert 'low_value' in segments
        assert 'C4' in [c['id'] for c in segments['high_value']]


class TestPricingManagement:
    """測試定價管理功能"""
    
    @pytest.fixture
    def pricing_service(self):
        """建立定價服務"""
        from src.modules.crm.services.pricing_service import PricingService
        return PricingService()
    
    def test_calculate_dynamic_price(self, pricing_service):
        """測試動態定價計算"""
        # Arrange
        base_cost = 100
        market_factors = {
            'demand_level': 1.2,      # 需求高
            'supply_level': 0.8,      # 供應低
            'seasonality': 1.1,       # 旺季
            'competition': 0.95       # 競爭激烈
        }
        
        # Act
        price = pricing_service.calculate_dynamic_price(base_cost, market_factors)
        
        # Assert
        expected_price = base_cost * 1.2 * (2 - 0.8) * 1.1 * 0.95
        assert abs(price - expected_price) < 0.01
    
    def test_apply_volume_discount(self, pricing_service):
        """測試量體折扣"""
        # Arrange
        unit_price = 100
        quantity = 500
        volume_tiers = [
            {'min_qty': 0, 'max_qty': 99, 'discount': 0},
            {'min_qty': 100, 'max_qty': 499, 'discount': 0.05},
            {'min_qty': 500, 'max_qty': None, 'discount': 0.10}
        ]
        
        # Act
        total_price = pricing_service.apply_volume_discount(
            unit_price, quantity, volume_tiers
        )
        
        # Assert
        assert total_price == 45000  # 100 * 500 * (1 - 0.10)
    
    def test_seasonal_price_adjustment(self, pricing_service):
        """測試季節性價格調整"""
        # Arrange
        base_price = 1000
        current_date = datetime(2025, 12, 25)  # 聖誕節
        seasonal_rules = [
            {
                'name': 'Christmas',
                'start_date': datetime(2025, 12, 20),
                'end_date': datetime(2025, 12, 26),
                'adjustment': 1.3  # 漲價 30%
            }
        ]
        
        # Act
        adjusted_price = pricing_service.apply_seasonal_adjustment(
            base_price, current_date, seasonal_rules
        )
        
        # Assert
        assert adjusted_price == 1300


class TestCustomerService:
    """測試客戶服務與客訴管理"""
    
    @pytest.fixture
    def complaint_service(self):
        """建立客訴服務"""
        from src.modules.crm.services.complaint_service import ComplaintService
        return ComplaintService()
    
    def test_create_complaint_ticket(self, complaint_service):
        """測試建立客訴工單"""
        # Arrange
        complaint_data = {
            'customer_id': 'CUST001',
            'type': 'QUALITY',
            'title': '產品品質問題',
            'description': '收到的蔬菜有部分腐爛',
            'order_id': 'ORD20250825001',
            'priority': 'HIGH'
        }
        
        # Act
        ticket = complaint_service.create_ticket(**complaint_data)
        
        # Assert
        assert ticket['ticket_id'] is not None
        assert ticket['status'] == 'OPEN'
        assert ticket['priority'] == 'HIGH'
        assert ticket['created_at'] is not None
    
    def test_escalate_complaint(self, complaint_service):
        """測試客訴升級處理"""
        # Arrange
        ticket_id = 'TKT001'
        escalation_reason = '客戶要求退款且態度強硬'
        complaint_service.db.get_ticket = Mock(return_value={
            'ticket_id': ticket_id,
            'priority': 'MEDIUM',
            'assigned_to': 'agent001'
        })
        
        # Act
        result = complaint_service.escalate_ticket(ticket_id, escalation_reason)
        
        # Assert
        assert result['priority'] == 'URGENT'
        assert result['escalated'] is True
        assert result['escalation_reason'] == escalation_reason
    
    def test_complaint_resolution_sla(self, complaint_service):
        """測試客訴解決 SLA"""
        # Arrange
        tickets = [
            {
                'ticket_id': 'TKT001',
                'priority': 'HIGH',
                'created_at': datetime.now() - timedelta(hours=2),
                'resolved_at': datetime.now()
            },
            {
                'ticket_id': 'TKT002',
                'priority': 'HIGH',
                'created_at': datetime.now() - timedelta(hours=5),
                'resolved_at': None  # 未解決
            }
        ]
        sla_config = {
            'HIGH': timedelta(hours=4),  # 高優先級 4 小時內解決
            'MEDIUM': timedelta(hours=8),
            'LOW': timedelta(hours=24)
        }
        
        # Act
        sla_status = complaint_service.check_sla_compliance(tickets, sla_config)
        
        # Assert
        assert sla_status['TKT001']['compliant'] is True
        assert sla_status['TKT002']['compliant'] is False
        assert sla_status['TKT002']['overdue'] is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])