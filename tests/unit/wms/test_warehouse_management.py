"""
Warehouse Management System (WMS) 單元測試
測試倉儲管理功能的核心邏輯
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal
import json


class TestInventoryManagement:
    """測試庫存管理功能"""
    
    @pytest.fixture
    def inventory_service(self):
        """建立庫存服務實例"""
        from src.modules.wms.services.inventory_service import InventoryService
        return InventoryService()
    
    def test_update_inventory_level(self, inventory_service):
        """測試更新庫存水位"""
        # Arrange
        product_id = 'PROD001'
        warehouse_id = 'WH01'
        quantity_change = 100
        transaction_type = 'INBOUND'
        
        # Act
        new_level = inventory_service.update_inventory(
            product_id, warehouse_id, quantity_change, transaction_type
        )
        
        # Assert
        assert new_level['product_id'] == product_id
        assert new_level['warehouse_id'] == warehouse_id
        assert new_level['quantity'] >= quantity_change
        assert new_level['last_updated'] is not None
    
    def test_check_stock_availability(self, inventory_service):
        """測試檢查庫存可用性"""
        # Arrange
        inventory_service.db.get_stock_level = Mock(return_value=500)
        inventory_service.db.get_reserved_quantity = Mock(return_value=100)
        
        # Act
        available = inventory_service.check_availability('PROD001', 'WH01', 300)
        
        # Assert
        assert available is True  # 500 - 100 = 400 可用，需求 300
    
    def test_low_stock_alert(self, inventory_service):
        """測試低庫存警報"""
        # Arrange
        inventory_items = [
            {'product_id': 'PROD001', 'quantity': 50, 'min_level': 100},
            {'product_id': 'PROD002', 'quantity': 200, 'min_level': 150},
            {'product_id': 'PROD003', 'quantity': 30, 'min_level': 80}
        ]
        
        # Act
        alerts = inventory_service.check_low_stock(inventory_items)
        
        # Assert
        assert len(alerts) == 2  # PROD001 和 PROD003
        assert alerts[0]['product_id'] == 'PROD001'
        assert alerts[0]['shortage'] == 50  # 100 - 50
    
    def test_calculate_reorder_point(self, inventory_service):
        """測試計算再訂購點"""
        # Arrange
        product_data = {
            'average_daily_usage': 100,
            'lead_time_days': 7,
            'safety_stock_days': 3
        }
        
        # Act
        reorder_point = inventory_service.calculate_reorder_point(**product_data)
        
        # Assert
        assert reorder_point == 1000  # (100 * 7) + (100 * 3)
    
    def test_inventory_valuation(self, inventory_service):
        """測試庫存估值"""
        # Arrange
        inventory_items = [
            {'product_id': 'P1', 'quantity': 100, 'unit_cost': 50},
            {'product_id': 'P2', 'quantity': 200, 'unit_cost': 30},
            {'product_id': 'P3', 'quantity': 150, 'unit_cost': 40}
        ]
        
        # Act
        valuation = inventory_service.calculate_inventory_value(inventory_items)
        
        # Assert
        assert valuation['total_value'] == 17000  # (100*50 + 200*30 + 150*40)
        assert valuation['item_count'] == 3
        assert valuation['total_quantity'] == 450


class TestReceivingAndPutaway:
    """測試收貨與上架功能"""
    
    @pytest.fixture
    def receiving_service(self):
        """建立收貨服務"""
        from src.modules.wms.services.receiving_service import ReceivingService
        return ReceivingService()
    
    def test_create_receiving_order(self, receiving_service):
        """測試建立收貨單"""
        # Arrange
        po_data = {
            'po_number': 'PO20250825001',
            'supplier_id': 'SUPP001',
            'expected_date': datetime.now() + timedelta(days=1),
            'items': [
                {'product_id': 'PROD001', 'quantity': 100, 'unit': 'kg'},
                {'product_id': 'PROD002', 'quantity': 200, 'unit': 'pcs'}
            ]
        }
        
        # Act
        receiving_order = receiving_service.create_receiving_order(**po_data)
        
        # Assert
        assert receiving_order['receiving_id'] is not None
        assert receiving_order['status'] == 'PENDING'
        assert len(receiving_order['items']) == 2
    
    def test_quality_inspection(self, receiving_service):
        """測試品質檢驗"""
        # Arrange
        inspection_data = {
            'receiving_id': 'RCV001',
            'product_id': 'PROD001',
            'total_quantity': 100,
            'sample_size': 10,
            'defects_found': 1
        }
        acceptance_criteria = {
            'max_defect_rate': 0.05,  # 5% 缺陷率上限
            'min_sample_size': 10
        }
        
        # Act
        result = receiving_service.perform_inspection(
            inspection_data, acceptance_criteria
        )
        
        # Assert
        assert result['passed'] is False  # 10% 缺陷率 > 5% 上限
        assert result['defect_rate'] == 0.10
        assert result['action'] == 'REJECT'
    
    def test_putaway_location_assignment(self, receiving_service):
        """測試上架位置分配"""
        # Arrange
        product = {
            'product_id': 'PROD001',
            'category': 'FROZEN',
            'quantity': 100,
            'unit': 'kg'
        }
        available_locations = [
            {'location_id': 'A-01-01', 'zone': 'FROZEN', 'capacity': 50},
            {'location_id': 'A-01-02', 'zone': 'FROZEN', 'capacity': 80},
            {'location_id': 'B-01-01', 'zone': 'CHILLED', 'capacity': 100}
        ]
        
        # Act
        assigned_locations = receiving_service.assign_putaway_location(
            product, available_locations
        )
        
        # Assert
        assert len(assigned_locations) == 2  # 需要 2 個 FROZEN 位置
        assert assigned_locations[0]['location_id'] == 'A-01-02'  # 優先大容量
        assert assigned_locations[0]['quantity'] == 80
        assert assigned_locations[1]['quantity'] == 20
    
    def test_cross_docking_detection(self, receiving_service):
        """測試越庫配送檢測"""
        # Arrange
        receiving_item = {
            'product_id': 'PROD001',
            'quantity': 100,
            'arrival_time': datetime.now()
        }
        pending_orders = [
            {
                'order_id': 'ORD001',
                'product_id': 'PROD001',
                'quantity': 80,
                'delivery_time': datetime.now() + timedelta(hours=4)
            }
        ]
        
        # Act
        cross_dock = receiving_service.check_cross_docking(
            receiving_item, pending_orders
        )
        
        # Assert
        assert cross_dock['eligible'] is True
        assert cross_dock['order_id'] == 'ORD001'
        assert cross_dock['quantity'] == 80


class TestPickingAndPacking:
    """測試揀貨與包裝功能"""
    
    @pytest.fixture
    def picking_service(self):
        """建立揀貨服務"""
        from src.modules.wms.services.picking_service import PickingService
        return PickingService()
    
    def test_generate_picking_list(self, picking_service):
        """測試產生揀貨單"""
        # Arrange
        order_items = [
            {'product_id': 'P1', 'quantity': 10, 'location': 'A-01-01'},
            {'product_id': 'P2', 'quantity': 20, 'location': 'B-02-03'},
            {'product_id': 'P3', 'quantity': 15, 'location': 'A-01-02'}
        ]
        
        # Act
        picking_list = picking_service.generate_picking_list(order_items)
        
        # Assert
        assert len(picking_list) == 3
        # 應該按位置排序以優化路徑
        assert picking_list[0]['location'] == 'A-01-01'
        assert picking_list[1]['location'] == 'A-01-02'
        assert picking_list[2]['location'] == 'B-02-03'
    
    def test_wave_picking_optimization(self, picking_service):
        """測試波次揀貨優化"""
        # Arrange
        orders = [
            {'order_id': 'O1', 'zone': 'A', 'priority': 1},
            {'order_id': 'O2', 'zone': 'B', 'priority': 2},
            {'order_id': 'O3', 'zone': 'A', 'priority': 1},
            {'order_id': 'O4', 'zone': 'C', 'priority': 3}
        ]
        max_wave_size = 2
        
        # Act
        waves = picking_service.create_picking_waves(orders, max_wave_size)
        
        # Assert
        assert len(waves) == 2
        assert waves[0]['orders'] == ['O1', 'O3']  # 同區域同優先級
        assert waves[1]['orders'] == ['O2', 'O4']
    
    def test_validate_picked_items(self, picking_service):
        """測試驗證揀貨項目"""
        # Arrange
        expected_items = [
            {'product_id': 'P1', 'quantity': 10},
            {'product_id': 'P2', 'quantity': 20}
        ]
        picked_items = [
            {'product_id': 'P1', 'quantity': 10, 'barcode': '1234567890'},
            {'product_id': 'P2', 'quantity': 18, 'barcode': '0987654321'}  # 短揀
        ]
        
        # Act
        validation = picking_service.validate_picking(expected_items, picked_items)
        
        # Assert
        assert validation['is_valid'] is False
        assert len(validation['discrepancies']) == 1
        assert validation['discrepancies'][0]['product_id'] == 'P2'
        assert validation['discrepancies'][0]['shortage'] == 2
    
    def test_calculate_packing_requirements(self, picking_service):
        """測試計算包裝需求"""
        # Arrange
        items = [
            {'product_id': 'P1', 'quantity': 100, 'unit_volume': 0.001},  # 1L per unit
            {'product_id': 'P2', 'quantity': 50, 'unit_volume': 0.002}   # 2L per unit
        ]
        box_sizes = [
            {'type': 'SMALL', 'volume': 0.01, 'max_weight': 5},     # 10L
            {'type': 'MEDIUM', 'volume': 0.05, 'max_weight': 20},   # 50L
            {'type': 'LARGE', 'volume': 0.1, 'max_weight': 50}      # 100L
        ]
        
        # Act
        packing_plan = picking_service.calculate_packing(items, box_sizes)
        
        # Assert
        assert packing_plan['total_volume'] == 0.2  # 100*0.001 + 50*0.002
        assert len(packing_plan['boxes']) == 2
        assert packing_plan['boxes'][0]['type'] == 'LARGE'


class TestBatchAndTraceability:
    """測試批號與追溯功能"""
    
    @pytest.fixture
    def batch_service(self):
        """建立批號服務"""
        from src.modules.wms.services.batch_service import BatchService
        return BatchService()
    
    def test_create_batch_number(self, batch_service):
        """測試建立批號"""
        # Arrange
        batch_data = {
            'product_id': 'PROD001',
            'quantity': 100,
            'production_date': datetime(2025, 8, 25),
            'expiry_date': datetime(2025, 9, 25),
            'supplier_batch': 'SUP-BATCH-001'
        }
        
        # Act
        batch = batch_service.create_batch(**batch_data)
        
        # Assert
        assert batch['batch_number'] is not None
        assert 'PROD001' in batch['batch_number']
        assert '20250825' in batch['batch_number']
        assert batch['status'] == 'ACTIVE'
    
    def test_fifo_batch_allocation(self, batch_service):
        """測試 FIFO 批號分配"""
        # Arrange
        available_batches = [
            {'batch_number': 'B001', 'quantity': 50, 'expiry_date': datetime(2025, 9, 1)},
            {'batch_number': 'B002', 'quantity': 100, 'expiry_date': datetime(2025, 8, 28)},
            {'batch_number': 'B003', 'quantity': 75, 'expiry_date': datetime(2025, 9, 5)}
        ]
        required_quantity = 120
        
        # Act
        allocated = batch_service.allocate_fifo(available_batches, required_quantity)
        
        # Assert
        assert len(allocated) == 2
        assert allocated[0]['batch_number'] == 'B002'  # 最早到期
        assert allocated[0]['allocated_quantity'] == 100
        assert allocated[1]['batch_number'] == 'B001'  # 次早到期
        assert allocated[1]['allocated_quantity'] == 20
    
    def test_batch_expiry_warning(self, batch_service):
        """測試批號到期預警"""
        # Arrange
        batches = [
            {
                'batch_number': 'B001',
                'product_id': 'P1',
                'expiry_date': datetime.now() + timedelta(days=3),
                'quantity': 100
            },
            {
                'batch_number': 'B002',
                'product_id': 'P2',
                'expiry_date': datetime.now() + timedelta(days=30),
                'quantity': 200
            },
            {
                'batch_number': 'B003',
                'product_id': 'P3',
                'expiry_date': datetime.now() - timedelta(days=1),
                'quantity': 50
            }
        ]
        warning_days = 7
        
        # Act
        warnings = batch_service.check_expiry_warnings(batches, warning_days)
        
        # Assert
        assert len(warnings) == 2  # B001 即將到期，B003 已過期
        assert warnings[0]['batch_number'] == 'B003'
        assert warnings[0]['status'] == 'EXPIRED'
        assert warnings[1]['batch_number'] == 'B001'
        assert warnings[1]['status'] == 'EXPIRING_SOON'
    
    def test_product_traceability(self, batch_service):
        """測試產品追溯"""
        # Arrange
        batch_number = 'BATCH-20250825-001'
        batch_service.db.get_batch_history = Mock(return_value=[
            {'event': 'RECEIVED', 'date': '2025-08-25', 'location': 'WH01'},
            {'event': 'INSPECTED', 'date': '2025-08-25', 'result': 'PASS'},
            {'event': 'STORED', 'date': '2025-08-25', 'location': 'A-01-01'},
            {'event': 'PICKED', 'date': '2025-08-26', 'order': 'ORD001'}
        ])
        
        # Act
        trace = batch_service.trace_product(batch_number)
        
        # Assert
        assert len(trace) == 4
        assert trace[0]['event'] == 'RECEIVED'
        assert trace[-1]['event'] == 'PICKED'


class TestInventoryAdjustment:
    """測試庫存調整功能"""
    
    @pytest.fixture
    def adjustment_service(self):
        """建立庫存調整服務"""
        from src.modules.wms.services.adjustment_service import AdjustmentService
        return AdjustmentService()
    
    def test_cycle_count_variance(self, adjustment_service):
        """測試週期盤點差異"""
        # Arrange
        system_quantity = 100
        physical_quantity = 95
        tolerance_percentage = 0.02  # 2% 容差
        
        # Act
        variance = adjustment_service.calculate_variance(
            system_quantity, physical_quantity, tolerance_percentage
        )
        
        # Assert
        assert variance['difference'] == -5
        assert variance['percentage'] == -0.05
        assert variance['requires_adjustment'] is True  # 5% > 2% 容差
    
    def test_create_adjustment_record(self, adjustment_service):
        """測試建立調整記錄"""
        # Arrange
        adjustment_data = {
            'product_id': 'PROD001',
            'warehouse_id': 'WH01',
            'adjustment_type': 'CYCLE_COUNT',
            'system_quantity': 100,
            'physical_quantity': 95,
            'reason': '盤點差異',
            'user_id': 'USER001'
        }
        
        # Act
        record = adjustment_service.create_adjustment(**adjustment_data)
        
        # Assert
        assert record['adjustment_id'] is not None
        assert record['quantity_adjusted'] == -5
        assert record['status'] == 'PENDING_APPROVAL'
        assert record['created_by'] == 'USER001'
    
    def test_inventory_transfer(self, adjustment_service):
        """測試庫存移轉"""
        # Arrange
        transfer_data = {
            'product_id': 'PROD001',
            'quantity': 50,
            'from_location': 'A-01-01',
            'to_location': 'B-02-02',
            'reason': '優化存儲空間'
        }
        
        # Act
        transfer = adjustment_service.create_transfer(**transfer_data)
        
        # Assert
        assert transfer['transfer_id'] is not None
        assert transfer['status'] == 'IN_TRANSIT'
        assert transfer['from_location'] == 'A-01-01'
        assert transfer['to_location'] == 'B-02-02'
    
    def test_damaged_goods_handling(self, adjustment_service):
        """測試損壞貨物處理"""
        # Arrange
        damage_report = {
            'product_id': 'PROD001',
            'batch_number': 'BATCH001',
            'quantity': 10,
            'damage_type': 'WATER_DAMAGE',
            'location': 'A-01-01',
            'discovered_by': 'USER001'
        }
        
        # Act
        result = adjustment_service.report_damaged_goods(damage_report)
        
        # Assert
        assert result['damage_id'] is not None
        assert result['inventory_adjusted'] is True
        assert result['quarantine_location'] is not None
        assert result['notification_sent'] is True


class TestWarehouseOperations:
    """測試倉庫作業功能"""
    
    @pytest.fixture
    def operations_service(self):
        """建立倉庫作業服務"""
        from src.modules.wms.services.operations_service import WarehouseOperationsService
        return WarehouseOperationsService()
    
    def test_calculate_storage_utilization(self, operations_service):
        """測試計算儲位利用率"""
        # Arrange
        warehouse_data = {
            'total_locations': 1000,
            'occupied_locations': 750,
            'total_volume': 10000,  # m³
            'used_volume': 7500     # m³
        }
        
        # Act
        utilization = operations_service.calculate_utilization(warehouse_data)
        
        # Assert
        assert utilization['location_utilization'] == 0.75
        assert utilization['volume_utilization'] == 0.75
        assert utilization['status'] == 'OPTIMAL'  # 75% 是理想利用率
    
    def test_abc_analysis(self, operations_service):
        """測試 ABC 分析"""
        # Arrange
        products = [
            {'product_id': 'P1', 'annual_value': 500000, 'turnover': 100},
            {'product_id': 'P2', 'annual_value': 300000, 'turnover': 80},
            {'product_id': 'P3', 'annual_value': 150000, 'turnover': 60},
            {'product_id': 'P4', 'annual_value': 30000, 'turnover': 20},
            {'product_id': 'P5', 'annual_value': 20000, 'turnover': 10}
        ]
        
        # Act
        abc_classification = operations_service.perform_abc_analysis(products)
        
        # Assert
        assert 'P1' in abc_classification['A']  # 高價值高週轉
        assert 'P2' in abc_classification['A'] or 'P2' in abc_classification['B']
        assert 'P4' in abc_classification['C'] or 'P5' in abc_classification['C']
    
    def test_optimize_warehouse_layout(self, operations_service):
        """測試優化倉庫佈局"""
        # Arrange
        picking_frequency = {
            'P1': 100,  # 高頻率
            'P2': 80,
            'P3': 20,   # 低頻率
            'P4': 10
        }
        available_zones = [
            {'zone': 'HOT', 'distance': 10},   # 近距離
            {'zone': 'WARM', 'distance': 30},
            {'zone': 'COLD', 'distance': 50}   # 遠距離
        ]
        
        # Act
        layout = operations_service.optimize_layout(picking_frequency, available_zones)
        
        # Assert
        assert layout['P1'] == 'HOT'  # 高頻率放近處
        assert layout['P4'] == 'COLD'  # 低頻率放遠處
    
    def test_labor_productivity_metrics(self, operations_service):
        """測試人力生產力指標"""
        # Arrange
        daily_metrics = {
            'date': '2025-08-25',
            'total_picks': 1000,
            'total_hours': 80,  # 10 人 * 8 小時
            'errors': 5,
            'workers': 10
        }
        
        # Act
        productivity = operations_service.calculate_productivity(daily_metrics)
        
        # Assert
        assert productivity['picks_per_hour'] == 12.5  # 1000/80
        assert productivity['picks_per_worker'] == 100  # 1000/10
        assert productivity['error_rate'] == 0.005  # 5/1000
        assert productivity['accuracy'] == 0.995


if __name__ == '__main__':
    pytest.main([__file__, '-v'])