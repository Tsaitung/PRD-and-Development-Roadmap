"""
Manufacturing Execution System (MES) 單元測試
測試生產管理功能的核心邏輯
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal
import json


class TestProductionScheduling:
    """測試生產排程功能"""
    
    @pytest.fixture
    def scheduling_service(self):
        """建立排程服務實例"""
        from src.modules.mes.services.scheduling_service import ProductionSchedulingService
        return ProductionSchedulingService()
    
    def test_create_work_order(self, scheduling_service):
        """測試建立工單"""
        # Arrange
        work_order_data = {
            'product_id': 'PROD001',
            'quantity': 1000,
            'due_date': datetime.now() + timedelta(days=3),
            'priority': 'HIGH',
            'customer_order': 'ORD20250825001',
            'bom_id': 'BOM001'
        }
        
        # Act
        work_order = scheduling_service.create_work_order(**work_order_data)
        
        # Assert
        assert work_order['work_order_id'] is not None
        assert work_order['status'] == 'PLANNED'
        assert work_order['scheduled_start'] is not None
        assert work_order['scheduled_end'] is not None
        assert work_order['created_at'] is not None
    
    def test_calculate_production_capacity(self, scheduling_service):
        """測試計算產能"""
        # Arrange
        workstation_data = {
            'workstation_id': 'WS001',
            'capacity_per_hour': 100,
            'efficiency_rate': 0.85,
            'available_hours': 8,
            'planned_downtime': 0.5  # 小時
        }
        
        # Act
        capacity = scheduling_service.calculate_capacity(**workstation_data)
        
        # Assert
        assert capacity['theoretical_capacity'] == 800  # 100 * 8
        assert capacity['effective_capacity'] == 637.5  # 100 * (8-0.5) * 0.85
        assert capacity['utilization_target'] == 0.85
    
    def test_schedule_optimization(self, scheduling_service):
        """測試排程優化"""
        # Arrange
        work_orders = [
            {'id': 'WO001', 'product': 'P1', 'quantity': 100, 'priority': 2, 'setup_time': 30},
            {'id': 'WO002', 'product': 'P1', 'quantity': 150, 'priority': 1, 'setup_time': 30},
            {'id': 'WO003', 'product': 'P2', 'quantity': 200, 'priority': 3, 'setup_time': 45}
        ]
        
        # Act
        optimized_schedule = scheduling_service.optimize_schedule(work_orders)
        
        # Assert
        # 應該按優先級排序，相同產品連續生產以減少換線
        assert optimized_schedule[0]['id'] == 'WO002'  # 最高優先級
        assert optimized_schedule[1]['id'] == 'WO001'  # 相同產品，避免換線
        assert optimized_schedule[2]['id'] == 'WO003'  # 最低優先級
    
    def test_resource_allocation(self, scheduling_service):
        """測試資源分配"""
        # Arrange
        work_order = {
            'work_order_id': 'WO001',
            'product_id': 'PROD001',
            'quantity': 500,
            'required_skills': ['CUTTING', 'PACKING']
        }
        available_resources = [
            {'worker_id': 'W001', 'skills': ['CUTTING', 'PACKING'], 'available': True},
            {'worker_id': 'W002', 'skills': ['CUTTING'], 'available': True},
            {'worker_id': 'W003', 'skills': ['PACKING'], 'available': False}
        ]
        
        # Act
        allocated = scheduling_service.allocate_resources(work_order, available_resources)
        
        # Assert
        assert 'W001' in allocated['workers']  # 有所需技能且可用
        assert 'W003' not in allocated['workers']  # 不可用
        assert allocated['skill_coverage'] == 1.0  # 100% 技能覆蓋
    
    def test_bottleneck_detection(self, scheduling_service):
        """測試瓶頸檢測"""
        # Arrange
        production_flow = [
            {'station': 'CUTTING', 'capacity': 100, 'current_load': 95},
            {'station': 'PROCESSING', 'capacity': 150, 'current_load': 120},
            {'station': 'PACKING', 'capacity': 80, 'current_load': 78}
        ]
        
        # Act
        bottlenecks = scheduling_service.detect_bottlenecks(production_flow)
        
        # Assert
        assert bottlenecks['primary_bottleneck'] == 'PACKING'  # 最低產能
        assert bottlenecks['utilization']['CUTTING'] == 0.95
        assert bottlenecks['utilization']['PACKING'] == 0.975  # 最高利用率


class TestWorkstationManagement:
    """測試工作站管理功能"""
    
    @pytest.fixture
    def workstation_service(self):
        """建立工作站服務"""
        from src.modules.mes.services.workstation_service import WorkstationService
        return WorkstationService()
    
    def test_workstation_assignment(self, workstation_service):
        """測試工作站分配"""
        # Arrange
        task = {
            'task_id': 'TASK001',
            'product_id': 'PROD001',
            'operation': 'CUTTING',
            'quantity': 100
        }
        workstations = [
            {'id': 'WS001', 'type': 'CUTTING', 'status': 'IDLE', 'efficiency': 0.9},
            {'id': 'WS002', 'type': 'CUTTING', 'status': 'BUSY', 'efficiency': 0.95},
            {'id': 'WS003', 'type': 'PACKING', 'status': 'IDLE', 'efficiency': 0.85}
        ]
        
        # Act
        assigned = workstation_service.assign_workstation(task, workstations)
        
        # Assert
        assert assigned == 'WS001'  # CUTTING 類型且 IDLE 狀態
    
    def test_workstation_status_tracking(self, workstation_service):
        """測試工作站狀態追蹤"""
        # Arrange
        workstation_id = 'WS001'
        status_update = {
            'status': 'RUNNING',
            'current_task': 'TASK001',
            'operator': 'OP001',
            'start_time': datetime.now()
        }
        
        # Act
        result = workstation_service.update_status(workstation_id, status_update)
        
        # Assert
        assert result['workstation_id'] == workstation_id
        assert result['status'] == 'RUNNING'
        assert result['status_history'] is not None
        assert result['last_updated'] is not None
    
    def test_calculate_oee(self, workstation_service):
        """測試計算 OEE (整體設備效率)"""
        # Arrange
        metrics = {
            'planned_time': 480,  # 分鐘
            'actual_runtime': 420,
            'ideal_cycle_time': 1,  # 分鐘/件
            'total_production': 400,
            'good_production': 380
        }
        
        # Act
        oee = workstation_service.calculate_oee(**metrics)
        
        # Assert
        assert oee['availability'] == 0.875  # 420/480
        assert oee['performance'] == 0.952  # (400*1)/420
        assert oee['quality'] == 0.95  # 380/400
        assert abs(oee['oee'] - 0.792) < 0.01  # 0.875 * 0.952 * 0.95
    
    def test_maintenance_scheduling(self, workstation_service):
        """測試維護排程"""
        # Arrange
        workstation = {
            'id': 'WS001',
            'last_maintenance': datetime.now() - timedelta(days=25),
            'maintenance_interval_days': 30,
            'usage_hours': 180,
            'max_usage_hours': 200
        }
        
        # Act
        maintenance = workstation_service.check_maintenance_needed(workstation)
        
        # Assert
        assert maintenance['needs_maintenance'] is True
        assert maintenance['reason'] == 'APPROACHING_INTERVAL'
        assert maintenance['priority'] == 'MEDIUM'
        assert maintenance['recommended_date'] is not None


class TestMaterialTracking:
    """測試物料追蹤功能"""
    
    @pytest.fixture
    def material_service(self):
        """建立物料服務"""
        from src.modules.mes.services.material_service import MaterialTrackingService
        return MaterialTrackingService()
    
    def test_material_consumption(self, material_service):
        """測試物料消耗記錄"""
        # Arrange
        consumption_data = {
            'work_order_id': 'WO001',
            'material_id': 'MAT001',
            'quantity_used': 100,
            'unit': 'kg',
            'batch_number': 'BATCH001',
            'operator_id': 'OP001'
        }
        
        # Act
        result = material_service.record_consumption(**consumption_data)
        
        # Assert
        assert result['transaction_id'] is not None
        assert result['remaining_quantity'] is not None
        assert result['timestamp'] is not None
        assert result['traceability_code'] is not None
    
    def test_material_yield_calculation(self, material_service):
        """測試物料良率計算"""
        # Arrange
        production_data = {
            'input_quantity': 1000,
            'output_quantity': 950,
            'waste_quantity': 30,
            'rework_quantity': 20
        }
        
        # Act
        yield_metrics = material_service.calculate_yield(**production_data)
        
        # Assert
        assert yield_metrics['gross_yield'] == 0.95  # 950/1000
        assert yield_metrics['net_yield'] == 0.97  # (950+20)/1000
        assert yield_metrics['waste_rate'] == 0.03  # 30/1000
        assert yield_metrics['rework_rate'] == 0.02  # 20/1000
    
    def test_batch_genealogy(self, material_service):
        """測試批次族譜追蹤"""
        # Arrange
        batch_id = 'BATCH001'
        material_service.db.get_batch_components = Mock(return_value=[
            {'component_batch': 'COMP001', 'material': 'MAT001', 'quantity': 50},
            {'component_batch': 'COMP002', 'material': 'MAT002', 'quantity': 30}
        ])
        
        # Act
        genealogy = material_service.get_batch_genealogy(batch_id)
        
        # Assert
        assert genealogy['parent_batch'] == batch_id
        assert len(genealogy['components']) == 2
        assert genealogy['components'][0]['component_batch'] == 'COMP001'
        assert genealogy['traceability_complete'] is True
    
    def test_material_shortage_alert(self, material_service):
        """測試物料短缺警報"""
        # Arrange
        work_order_requirements = [
            {'material_id': 'MAT001', 'required': 100},
            {'material_id': 'MAT002', 'required': 200},
            {'material_id': 'MAT003', 'required': 150}
        ]
        current_inventory = {
            'MAT001': 120,
            'MAT002': 180,  # 短缺
            'MAT003': 150
        }
        
        # Act
        shortages = material_service.check_material_availability(
            work_order_requirements, current_inventory
        )
        
        # Assert
        assert len(shortages) == 1
        assert shortages[0]['material_id'] == 'MAT002'
        assert shortages[0]['shortage'] == 20


class TestQualityControl:
    """測試品質控制功能"""
    
    @pytest.fixture
    def quality_service(self):
        """建立品質服務"""
        from src.modules.mes.services.quality_service import QualityControlService
        return QualityControlService()
    
    def test_quality_inspection(self, quality_service):
        """測試品質檢驗"""
        # Arrange
        inspection_data = {
            'work_order_id': 'WO001',
            'sample_size': 50,
            'defects_found': 2,
            'inspection_criteria': {
                'max_defect_rate': 0.03,
                'critical_defects_allowed': 0
            }
        }
        
        # Act
        result = quality_service.perform_inspection(**inspection_data)
        
        # Assert
        assert result['defect_rate'] == 0.04  # 2/50
        assert result['passed'] is False  # 4% > 3% 限制
        assert result['action'] == 'HOLD_PRODUCTION'
    
    def test_spc_control_limits(self, quality_service):
        """測試 SPC 控制界限"""
        # Arrange
        measurements = [10.1, 10.2, 9.9, 10.0, 10.1, 9.8, 10.2, 10.0, 9.9, 10.1]
        target = 10.0
        
        # Act
        control_limits = quality_service.calculate_control_limits(measurements, target)
        
        # Assert
        assert abs(control_limits['mean'] - 10.02) < 0.01
        assert control_limits['ucl'] > control_limits['mean']  # 上控制界限
        assert control_limits['lcl'] < control_limits['mean']  # 下控制界限
        assert control_limits['in_control'] is True
    
    def test_defect_categorization(self, quality_service):
        """測試缺陷分類"""
        # Arrange
        defects = [
            {'type': 'DIMENSION', 'severity': 'CRITICAL'},
            {'type': 'SURFACE', 'severity': 'MINOR'},
            {'type': 'DIMENSION', 'severity': 'MAJOR'},
            {'type': 'COLOR', 'severity': 'MINOR'},
            {'type': 'SURFACE', 'severity': 'MINOR'}
        ]
        
        # Act
        categorized = quality_service.categorize_defects(defects)
        
        # Assert
        assert categorized['by_type']['DIMENSION'] == 2
        assert categorized['by_type']['SURFACE'] == 2
        assert categorized['by_severity']['CRITICAL'] == 1
        assert categorized['by_severity']['MINOR'] == 3
        assert categorized['pareto_type'][0] == 'DIMENSION'  # 最常見缺陷
    
    def test_quality_cost_calculation(self, quality_service):
        """測試品質成本計算"""
        # Arrange
        quality_costs = {
            'prevention_cost': 5000,     # 預防成本
            'appraisal_cost': 3000,      # 評估成本
            'internal_failure': 8000,    # 內部失敗成本
            'external_failure': 2000,    # 外部失敗成本
            'total_production_value': 200000
        }
        
        # Act
        cost_analysis = quality_service.calculate_quality_costs(**quality_costs)
        
        # Assert
        assert cost_analysis['total_quality_cost'] == 18000
        assert cost_analysis['cost_of_good_quality'] == 8000  # 預防+評估
        assert cost_analysis['cost_of_poor_quality'] == 10000  # 內部+外部失敗
        assert cost_analysis['quality_cost_ratio'] == 0.09  # 18000/200000


class TestProductionReporting:
    """測試生產報表功能"""
    
    @pytest.fixture
    def reporting_service(self):
        """建立報表服務"""
        from src.modules.mes.services.reporting_service import ProductionReportingService
        return ProductionReportingService()
    
    def test_daily_production_report(self, reporting_service):
        """測試日生產報表"""
        # Arrange
        date = datetime(2025, 8, 25)
        reporting_service.db.get_daily_production = Mock(return_value={
            'total_output': 5000,
            'planned_output': 4800,
            'work_orders_completed': 12,
            'work_orders_started': 15,
            'downtime_minutes': 45,
            'defects': 50
        })
        
        # Act
        report = reporting_service.generate_daily_report(date)
        
        # Assert
        assert report['achievement_rate'] == 1.042  # 5000/4800
        assert report['completion_rate'] == 0.8  # 12/15
        assert report['quality_rate'] == 0.99  # (5000-50)/5000
        assert report['status'] == 'ABOVE_TARGET'
    
    def test_shift_performance_comparison(self, reporting_service):
        """測試班次績效比較"""
        # Arrange
        shift_data = [
            {'shift': 'MORNING', 'output': 1800, 'efficiency': 0.90, 'defects': 10},
            {'shift': 'AFTERNOON', 'output': 1700, 'efficiency': 0.85, 'defects': 15},
            {'shift': 'NIGHT', 'output': 1500, 'efficiency': 0.75, 'defects': 25}
        ]
        
        # Act
        comparison = reporting_service.compare_shift_performance(shift_data)
        
        # Assert
        assert comparison['best_shift'] == 'MORNING'
        assert comparison['best_metric'] == 'efficiency'
        assert comparison['recommendations'][0]['shift'] == 'NIGHT'  # 需要改進
    
    def test_production_trend_analysis(self, reporting_service):
        """測試生產趨勢分析"""
        # Arrange
        weekly_data = [
            {'week': 1, 'output': 20000, 'efficiency': 0.85},
            {'week': 2, 'output': 21000, 'efficiency': 0.87},
            {'week': 3, 'output': 22000, 'efficiency': 0.88},
            {'week': 4, 'output': 23000, 'efficiency': 0.90}
        ]
        
        # Act
        trends = reporting_service.analyze_trends(weekly_data)
        
        # Assert
        assert trends['output_trend'] == 'INCREASING'
        assert trends['efficiency_trend'] == 'IMPROVING'
        assert trends['growth_rate'] == 0.15  # 15% 成長
        assert trends['forecast_next_week'] > 23000
    
    def test_worker_productivity_report(self, reporting_service):
        """測試工人生產力報表"""
        # Arrange
        worker_data = [
            {'worker_id': 'W001', 'output': 500, 'hours': 8, 'quality_score': 0.98},
            {'worker_id': 'W002', 'output': 450, 'hours': 8, 'quality_score': 0.95},
            {'worker_id': 'W003', 'output': 480, 'hours': 7.5, 'quality_score': 0.99}
        ]
        
        # Act
        productivity = reporting_service.calculate_worker_productivity(worker_data)
        
        # Assert
        assert productivity['W001']['units_per_hour'] == 62.5
        assert productivity['W003']['units_per_hour'] == 64  # 最高生產力
        assert productivity['top_performer'] == 'W003'
        assert productivity['average_quality'] == 0.973


if __name__ == '__main__':
    pytest.main([__file__, '-v'])