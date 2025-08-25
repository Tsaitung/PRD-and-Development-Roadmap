"""
Order Management (OM) 單元測試
測試訂單管理功能的核心邏輯
"""

import pytest
from unittest.mock import Mock, patch, MagicMock, call
from datetime import datetime, timedelta
from decimal import Decimal
import json


class TestOrderCreation:
    """測試訂單建立功能"""
    
    @pytest.fixture
    def order_service(self):
        """建立訂單服務實例"""
        from src.modules.om.services.order_service import OrderService
        return OrderService()
    
    def test_create_standard_order(self, order_service):
        """測試建立標準訂單"""
        # Arrange
        order_data = {
            'customer_id': 'CUST001',
            'delivery_date': datetime.now() + timedelta(days=1),
            'items': [
                {'product_id': 'PROD001', 'quantity': 100, 'unit_price': 50},
                {'product_id': 'PROD002', 'quantity': 200, 'unit_price': 30}
            ],
            'delivery_address': '台北市信義區信義路100號',
            'payment_terms': 'NET30',
            'notes': '請早上送達'
        }
        
        # Act
        order = order_service.create_order(**order_data)
        
        # Assert
        assert order['order_id'] is not None
        assert order['status'] == 'PENDING'
        assert order['total_amount'] == 11000  # (100*50 + 200*30)
        assert order['created_at'] is not None
    
    def test_validate_minimum_order_value(self, order_service):
        """測試最小訂單金額驗證"""
        # Arrange
        order_data = {
            'customer_id': 'CUST001',
            'delivery_date': datetime.now() + timedelta(days=1),
            'items': [
                {'product_id': 'PROD001', 'quantity': 1, 'unit_price': 50}
            ]
        }
        order_service.minimum_order_value = 1000
        
        # Act & Assert
        with pytest.raises(ValueError) as exc_info:
            order_service.create_order(**order_data)
        assert 'Minimum order value' in str(exc_info.value)
    
    def test_check_inventory_availability(self, order_service):
        """測試庫存可用性檢查"""
        # Arrange
        order_items = [
            {'product_id': 'PROD001', 'quantity': 1000}
        ]
        order_service.inventory_service.check_availability = Mock(return_value=False)
        
        # Act
        result = order_service.validate_inventory(order_items)
        
        # Assert
        assert result is False
        order_service.inventory_service.check_availability.assert_called_once()
    
    def test_apply_customer_discount(self, order_service):
        """測試套用客戶折扣"""
        # Arrange
        customer_id = 'CUST001'
        base_amount = 10000
        order_service.customer_service.get_discount_rate = Mock(return_value=0.10)
        
        # Act
        final_amount = order_service.apply_customer_discount(customer_id, base_amount)
        
        # Assert
        assert final_amount == 9000  # 10000 * (1 - 0.10)
    
    def test_order_validation_rules(self, order_service):
        """測試訂單驗證規則"""
        # Arrange
        order_data = {
            'customer_id': 'CUST001',
            'delivery_date': datetime.now() - timedelta(days=1),  # 過去的日期
            'items': []  # 空訂單
        }
        
        # Act
        validation_errors = order_service.validate_order(order_data)
        
        # Assert
        assert len(validation_errors) >= 2
        assert any('delivery date' in error.lower() for error in validation_errors)
        assert any('items' in error.lower() for error in validation_errors)


class TestOrderProcessing:
    """測試訂單處理流程"""
    
    @pytest.fixture
    def processing_service(self):
        """建立訂單處理服務"""
        from src.modules.om.services.processing_service import OrderProcessingService
        return OrderProcessingService()
    
    def test_order_status_transition(self, processing_service):
        """測試訂單狀態轉換"""
        # Arrange
        order_id = 'ORD20250825001'
        valid_transitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'HOLD'],
            'SHIPPED': ['DELIVERED', 'RETURNED']
        }
        
        # Act & Assert
        for current_status, allowed_next in valid_transitions.items():
            for next_status in allowed_next:
                result = processing_service.validate_status_transition(
                    current_status, next_status
                )
                assert result is True
    
    def test_auto_confirm_order(self, processing_service):
        """測試自動確認訂單"""
        # Arrange
        order = {
            'order_id': 'ORD001',
            'customer_id': 'CUST001',
            'status': 'PENDING',
            'payment_verified': True,
            'inventory_reserved': True
        }
        
        # Act
        result = processing_service.auto_confirm_order(order)
        
        # Assert
        assert result['status'] == 'CONFIRMED'
        assert result['confirmed_at'] is not None
        assert result['confirmed_by'] == 'SYSTEM'
    
    def test_split_order_by_warehouse(self, processing_service):
        """測試依倉庫分割訂單"""
        # Arrange
        order_items = [
            {'product_id': 'PROD001', 'quantity': 100, 'warehouse': 'WH01'},
            {'product_id': 'PROD002', 'quantity': 200, 'warehouse': 'WH02'},
            {'product_id': 'PROD003', 'quantity': 150, 'warehouse': 'WH01'}
        ]
        
        # Act
        split_orders = processing_service.split_by_warehouse(order_items)
        
        # Assert
        assert len(split_orders) == 2
        assert 'WH01' in split_orders
        assert 'WH02' in split_orders
        assert len(split_orders['WH01']) == 2
        assert len(split_orders['WH02']) == 1
    
    def test_calculate_delivery_schedule(self, processing_service):
        """測試計算配送排程"""
        # Arrange
        order = {
            'order_id': 'ORD001',
            'customer_id': 'CUST001',
            'delivery_date': datetime(2025, 8, 26, 9, 0),
            'delivery_window': 'MORNING',  # 早上 6-12 點
            'zone': 'NORTH'
        }
        
        # Act
        schedule = processing_service.calculate_delivery_schedule(order)
        
        # Assert
        assert schedule['estimated_departure'] is not None
        assert schedule['estimated_arrival'] is not None
        assert schedule['route_id'] is not None
        assert schedule['driver_id'] is not None
    
    @patch('src.modules.om.services.processing_service.send_notification')
    def test_order_confirmation_notification(self, mock_send, processing_service):
        """測試訂單確認通知"""
        # Arrange
        order = {
            'order_id': 'ORD001',
            'customer_id': 'CUST001',
            'customer_email': 'customer@example.com',
            'total_amount': 10000
        }
        
        # Act
        processing_service.send_confirmation_notification(order)
        
        # Assert
        mock_send.assert_called_once()
        call_args = mock_send.call_args[0]
        assert order['customer_email'] in call_args
        assert 'confirmation' in call_args[1].lower()


class TestOrderAllocation:
    """測試訂單分配功能"""
    
    @pytest.fixture
    def allocation_service(self):
        """建立訂單分配服務"""
        from src.modules.om.services.allocation_service import AllocationService
        return AllocationService()
    
    def test_allocate_to_production(self, allocation_service):
        """測試分配到生產"""
        # Arrange
        order_items = [
            {'product_id': 'PROD001', 'quantity': 100, 'type': 'MANUFACTURED'},
            {'product_id': 'PROD002', 'quantity': 200, 'type': 'PURCHASED'}
        ]
        
        # Act
        allocations = allocation_service.allocate_items(order_items)
        
        # Assert
        assert allocations['production'] == ['PROD001']
        assert allocations['procurement'] == ['PROD002']
    
    def test_priority_based_allocation(self, allocation_service):
        """測試基於優先級的分配"""
        # Arrange
        orders = [
            {'order_id': 'ORD001', 'priority': 1, 'quantity': 100},
            {'order_id': 'ORD002', 'priority': 3, 'quantity': 150},
            {'order_id': 'ORD003', 'priority': 2, 'quantity': 80}
        ]
        available_quantity = 250
        
        # Act
        allocated = allocation_service.allocate_by_priority(orders, available_quantity)
        
        # Assert
        assert allocated['ORD001'] == 100  # 優先級 1，全部滿足
        assert allocated['ORD003'] == 80   # 優先級 2，全部滿足
        assert allocated['ORD002'] == 70   # 優先級 3，部分滿足
    
    def test_batch_allocation_optimization(self, allocation_service):
        """測試批次分配優化"""
        # Arrange
        orders = [
            {'order_id': 'ORD001', 'items': [{'product_id': 'P1', 'qty': 10}]},
            {'order_id': 'ORD002', 'items': [{'product_id': 'P1', 'qty': 15}]},
            {'order_id': 'ORD003', 'items': [{'product_id': 'P2', 'qty': 20}]}
        ]
        
        # Act
        batches = allocation_service.optimize_batch_allocation(orders)
        
        # Assert
        assert len(batches) == 2  # P1 和 P2 各一批
        assert batches[0]['product_id'] == 'P1'
        assert batches[0]['total_quantity'] == 25
    
    def test_zone_based_allocation(self, allocation_service):
        """測試基於區域的分配"""
        # Arrange
        order = {
            'order_id': 'ORD001',
            'delivery_zone': 'NORTH',
            'items': [{'product_id': 'PROD001', 'quantity': 100}]
        }
        warehouses = [
            {'id': 'WH01', 'zone': 'NORTH', 'capacity': 1000},
            {'id': 'WH02', 'zone': 'SOUTH', 'capacity': 2000}
        ]
        
        # Act
        allocated_warehouse = allocation_service.allocate_to_warehouse(order, warehouses)
        
        # Assert
        assert allocated_warehouse == 'WH01'  # 選擇同區域的倉庫


class TestOrderReturn:
    """測試訂單退貨功能"""
    
    @pytest.fixture
    def return_service(self):
        """建立退貨服務"""
        from src.modules.om.services.return_service import ReturnService
        return ReturnService()
    
    def test_create_return_request(self, return_service):
        """測試建立退貨申請"""
        # Arrange
        return_data = {
            'order_id': 'ORD001',
            'reason': 'QUALITY_ISSUE',
            'items': [
                {'product_id': 'PROD001', 'quantity': 10, 'issue': '產品損壞'}
            ],
            'customer_comment': '收到時發現包裝破損',
            'photos': ['photo1.jpg', 'photo2.jpg']
        }
        
        # Act
        rma = return_service.create_return_request(**return_data)
        
        # Assert
        assert rma['rma_number'] is not None
        assert rma['status'] == 'PENDING_APPROVAL'
        assert rma['created_at'] is not None
    
    def test_validate_return_window(self, return_service):
        """測試驗證退貨時效"""
        # Arrange
        order_date = datetime.now() - timedelta(days=35)
        return_policy_days = 30
        
        # Act
        is_valid = return_service.validate_return_window(order_date, return_policy_days)
        
        # Assert
        assert is_valid is False
    
    def test_calculate_refund_amount(self, return_service):
        """測試計算退款金額"""
        # Arrange
        return_items = [
            {'product_id': 'PROD001', 'quantity': 5, 'unit_price': 100},
            {'product_id': 'PROD002', 'quantity': 10, 'unit_price': 50}
        ]
        restocking_fee_rate = 0.10  # 10% 重新入庫費
        
        # Act
        refund = return_service.calculate_refund(return_items, restocking_fee_rate)
        
        # Assert
        assert refund['subtotal'] == 1000  # 5*100 + 10*50
        assert refund['restocking_fee'] == 100  # 1000 * 0.10
        assert refund['total_refund'] == 900  # 1000 - 100
    
    def test_auto_approve_return(self, return_service):
        """測試自動核准退貨"""
        # Arrange
        return_request = {
            'rma_number': 'RMA001',
            'order_amount': 5000,
            'return_amount': 500,
            'customer_tier': 'GOLD',
            'reason': 'QUALITY_ISSUE'
        }
        auto_approve_rules = {
            'max_amount': 1000,
            'eligible_tiers': ['GOLD', 'PLATINUM'],
            'eligible_reasons': ['QUALITY_ISSUE', 'WRONG_ITEM']
        }
        
        # Act
        result = return_service.auto_approve(return_request, auto_approve_rules)
        
        # Assert
        assert result['approved'] is True
        assert result['approval_type'] == 'AUTO'


class TestOrderAnalytics:
    """測試訂單分析功能"""
    
    @pytest.fixture
    def analytics_service(self):
        """建立訂單分析服務"""
        from src.modules.om.services.analytics_service import OrderAnalyticsService
        return OrderAnalyticsService()
    
    def test_calculate_order_metrics(self, analytics_service):
        """測試計算訂單指標"""
        # Arrange
        orders = [
            {'order_id': 'ORD001', 'amount': 10000, 'status': 'DELIVERED'},
            {'order_id': 'ORD002', 'amount': 15000, 'status': 'DELIVERED'},
            {'order_id': 'ORD003', 'amount': 8000, 'status': 'CANCELLED'},
            {'order_id': 'ORD004', 'amount': 12000, 'status': 'PROCESSING'}
        ]
        
        # Act
        metrics = analytics_service.calculate_metrics(orders)
        
        # Assert
        assert metrics['total_orders'] == 4
        assert metrics['completed_orders'] == 2
        assert metrics['completion_rate'] == 0.5
        assert metrics['total_revenue'] == 25000  # 只計算 DELIVERED
        assert metrics['average_order_value'] == 12500
    
    def test_identify_order_patterns(self, analytics_service):
        """測試識別訂單模式"""
        # Arrange
        order_history = [
            {'date': '2025-08-01', 'day': 'THU', 'amount': 10000},
            {'date': '2025-08-08', 'day': 'THU', 'amount': 12000},
            {'date': '2025-08-15', 'day': 'THU', 'amount': 11000},
            {'date': '2025-08-22', 'day': 'THU', 'amount': 13000}
        ]
        
        # Act
        patterns = analytics_service.identify_patterns(order_history)
        
        # Assert
        assert 'weekly' in patterns
        assert patterns['weekly']['day'] == 'THU'
        assert patterns['weekly']['confidence'] > 0.8
    
    def test_forecast_demand(self, analytics_service):
        """測試需求預測"""
        # Arrange
        historical_data = [
            {'month': '2025-01', 'quantity': 1000},
            {'month': '2025-02', 'quantity': 1200},
            {'month': '2025-03', 'quantity': 1100},
            {'month': '2025-04', 'quantity': 1300},
            {'month': '2025-05', 'quantity': 1400},
            {'month': '2025-06', 'quantity': 1350}
        ]
        
        # Act
        forecast = analytics_service.forecast_next_month(historical_data)
        
        # Assert
        assert forecast['predicted_quantity'] > 1300
        assert forecast['confidence_interval'] is not None
        assert forecast['trend'] == 'INCREASING'
    
    def test_customer_order_segmentation(self, analytics_service):
        """測試客戶訂單分群"""
        # Arrange
        customer_orders = [
            {'customer_id': 'C1', 'frequency': 25, 'avg_value': 5000},
            {'customer_id': 'C2', 'frequency': 5, 'avg_value': 15000},
            {'customer_id': 'C3', 'frequency': 30, 'avg_value': 3000},
            {'customer_id': 'C4', 'frequency': 2, 'avg_value': 2000}
        ]
        
        # Act
        segments = analytics_service.segment_customers(customer_orders)
        
        # Assert
        assert 'high_frequency_high_value' in segments
        assert 'low_frequency_high_value' in segments
        assert 'high_frequency_low_value' in segments
        assert 'low_frequency_low_value' in segments
        assert 'C1' in segments['high_frequency_high_value']
        assert 'C2' in segments['low_frequency_high_value']


class TestOrderIntegration:
    """測試訂單整合功能"""
    
    @pytest.fixture
    def integration_service(self):
        """建立整合服務"""
        from src.modules.om.services.integration_service import OrderIntegrationService
        return OrderIntegrationService()
    
    def test_sync_with_inventory(self, integration_service):
        """測試與庫存系統同步"""
        # Arrange
        order = {
            'order_id': 'ORD001',
            'items': [
                {'product_id': 'PROD001', 'quantity': 100}
            ]
        }
        integration_service.inventory_api.reserve = Mock(return_value=True)
        
        # Act
        result = integration_service.sync_inventory_reservation(order)
        
        # Assert
        assert result is True
        integration_service.inventory_api.reserve.assert_called_once()
    
    def test_sync_with_production(self, integration_service):
        """測試與生產系統同步"""
        # Arrange
        production_order = {
            'order_id': 'ORD001',
            'items': [
                {'product_id': 'PROD001', 'quantity': 100, 'due_date': '2025-08-26'}
            ]
        }
        integration_service.mes_api.create_work_order = Mock(
            return_value={'work_order_id': 'WO001'}
        )
        
        # Act
        work_order = integration_service.create_production_order(production_order)
        
        # Assert
        assert work_order['work_order_id'] == 'WO001'
        integration_service.mes_api.create_work_order.assert_called_once()
    
    def test_sync_with_logistics(self, integration_service):
        """測試與物流系統同步"""
        # Arrange
        shipment_data = {
            'order_id': 'ORD001',
            'delivery_address': '台北市信義區',
            'delivery_date': '2025-08-26',
            'items': [{'product_id': 'P1', 'quantity': 10, 'weight': 50}]
        }
        integration_service.logistics_api.create_shipment = Mock(
            return_value={'tracking_number': 'TRK123456'}
        )
        
        # Act
        shipment = integration_service.create_shipment(shipment_data)
        
        # Assert
        assert shipment['tracking_number'] == 'TRK123456'
    
    def test_sync_with_finance(self, integration_service):
        """測試與財務系統同步"""
        # Arrange
        invoice_data = {
            'order_id': 'ORD001',
            'customer_id': 'CUST001',
            'amount': 10000,
            'tax': 500,
            'payment_terms': 'NET30'
        }
        integration_service.finance_api.create_invoice = Mock(
            return_value={'invoice_number': 'INV20250825001'}
        )
        
        # Act
        invoice = integration_service.create_invoice(invoice_data)
        
        # Assert
        assert invoice['invoice_number'] == 'INV20250825001'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])