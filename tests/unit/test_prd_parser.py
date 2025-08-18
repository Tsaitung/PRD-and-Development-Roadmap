"""
PRD 解析器測試
測試 parse_prd_status.py 的功能
"""

import pytest
import sys
from pathlib import Path

# 添加項目根目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.parse_prd_status import (
    extract_fr_ids,
    parse_prd_file,
    get_module_status,
    generate_status_report
)


class TestPRDParser:
    """PRD 解析器測試類"""
    
    def test_extract_fr_ids(self):
        """測試 FR-ID 提取"""
        content = """
        ## FR-ID: FR-001
        功能描述
        ## FR-ID: FR-002
        另一個功能
        """
        fr_ids = extract_fr_ids(content)
        assert len(fr_ids) == 2
        assert "FR-001" in fr_ids
        assert "FR-002" in fr_ids
    
    def test_extract_fr_ids_empty(self):
        """測試空內容的 FR-ID 提取"""
        content = "沒有 FR-ID 的內容"
        fr_ids = extract_fr_ids(content)
        assert len(fr_ids) == 0
    
    def test_parse_prd_file_with_status(self, tmp_path):
        """測試帶狀態的 PRD 文件解析"""
        prd_file = tmp_path / "test.md"
        prd_content = """
        # 測試 PRD
        
        ## FR-ID: FR-001
        ## 狀態: ✅ 完成
        
        ## FR-ID: FR-002
        ## 狀態: 🟡 開發中
        
        ## FR-ID: FR-003
        ## 狀態: 🔴 未開始
        """
        prd_file.write_text(prd_content)
        
        result = parse_prd_file(str(prd_file))
        
        assert result["fr_count"] == 3
        assert result["status"]["completed"] == 1
        assert result["status"]["in_progress"] == 1
        assert result["status"]["not_started"] == 1
    
    def test_get_module_status(self):
        """測試模組狀態獲取"""
        status_counts = {
            "completed": 5,
            "in_progress": 3,
            "not_started": 2
        }
        
        # 測試完成狀態
        status = get_module_status({"completed": 10, "in_progress": 0, "not_started": 0})
        assert status == "✅ 完成"
        
        # 測試開發中狀態
        status = get_module_status({"completed": 3, "in_progress": 5, "not_started": 2})
        assert status == "🟡 開發中"
        
        # 測試未開始狀態
        status = get_module_status({"completed": 0, "in_progress": 0, "not_started": 10})
        assert status == "🔴 未開始"
    
    def test_generate_status_report(self, tmp_path):
        """測試狀態報告生成"""
        # 創建測試 PRD 結構
        prd_dir = tmp_path / "PRD"
        prd_dir.mkdir()
        
        module_dir = prd_dir / "01-DSH-Dashboard"
        module_dir.mkdir()
        
        prd_file = module_dir / "prd.md"
        prd_file.write_text("""
        ## FR-ID: FR-001
        ## 狀態: ✅ 完成
        """)
        
        report = generate_status_report(str(prd_dir))
        
        assert "01-DSH-Dashboard" in report
        assert report["01-DSH-Dashboard"]["fr_count"] == 1
        assert report["01-DSH-Dashboard"]["status"]["completed"] == 1
    
    def test_parse_prd_with_multiple_formats(self, tmp_path):
        """測試解析多種格式的 PRD"""
        prd_file = tmp_path / "test.md"
        prd_content = """
        # 測試 PRD
        
        ## FR-ID: FR-001
        狀態: ✅ 完成
        
        ### FR-ID: FR-002
        **狀態:** 🟡 開發中
        
        FR-ID: FR-003
        - 狀態: 🔴 未開始
        
        [FR-ID]: FR-004
        [狀態]: ⚪ 規劃中
        """
        prd_file.write_text(prd_content)
        
        result = parse_prd_file(str(prd_file))
        
        assert result["fr_count"] >= 2  # 至少能識別標準格式
        assert result["status"]["completed"] >= 1
        assert result["status"]["in_progress"] >= 1