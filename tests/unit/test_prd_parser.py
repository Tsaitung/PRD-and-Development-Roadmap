"""
PRD 解析器單元測試
測試 PRD 文件解析功能
"""

import pytest
import tempfile
import os
from pathlib import Path
import sys

# 添加父目錄到路徑，以便導入腳本
sys.path.insert(0, str(Path(__file__).parent.parent.parent / ".github" / "scripts"))

from parse_prd_status import PRDParser

class TestPRDParser:
    """PRD 解析器測試類"""
    
    def test_parse_fr_id(self):
        """測試 FR-ID 解析"""
        content = "## FR-ID: FR-001\n## 狀態: ✅ 完成"
        parser = PRDParser()
        
        # 測試 FR-ID 提取
        fr_match = parser.fr_pattern.search(content)
        assert fr_match is not None
        assert fr_match.group() == "FR-001"
    
    def test_parse_status(self):
        """測試狀態解析"""
        content = "## FR-ID: FR-001\n## 狀態: ✅ 完成"
        parser = PRDParser()
        
        # 測試狀態提取
        status_match = parser.status_pattern.search(content)
        assert status_match is not None
        assert status_match.group() == "✅ 完成"
    
    def test_parse_prd_file(self, temp_dir, sample_prd_content):
        """測試 PRD 文件解析"""
        # 創建測試 PRD 文件
        prd_file = temp_dir / "test_prd.md"
        prd_file.write_text(sample_prd_content, encoding='utf-8')
        
        parser = PRDParser()
        result = parser.parse_prd_file(prd_file)
        
        assert result is not None
        assert result.get("fr_id") == "FR-001"
        assert result.get("status") == "✅ 完成"
    
    def test_parse_nonexistent_directory(self):
        """測試解析不存在的目錄"""
        parser = PRDParser()
        parser.prd_dir = Path("/nonexistent/directory")
        
        result = parser.parse_prd_files()
        
        assert result["modules"] == {}
        assert result["total_fr_ids"] == 0
    
    def test_parse_empty_directory(self, temp_dir):
        """測試解析空目錄"""
        # 創建空的 PRD 目錄
        prd_dir = temp_dir / "PRD"
        prd_dir.mkdir()
        
        parser = PRDParser()
        parser.prd_dir = prd_dir
        
        result = parser.parse_prd_files()
        
        assert result["modules"] == {}
        assert result["total_fr_ids"] == 0
    
    def test_parse_multiple_fr_ids(self):
        """測試解析多個 FR-ID"""
        content = """
        ## FR-ID: FR-001
        ## 狀態: ✅ 完成
        
        參考 FR-002 和 FR-003 的實現
        """
        parser = PRDParser()
        
        # 應該只提取第一個 FR-ID
        fr_match = parser.fr_pattern.search(content)
        assert fr_match is not None
        assert fr_match.group() == "FR-001"
    
    def test_parse_invalid_status(self):
        """測試解析無效狀態"""
        content = "## FR-ID: FR-001\n## 狀態: 無效狀態"
        parser = PRDParser()
        
        # 應該返回預設狀態
        result = parser.parse_prd_file(Path("dummy"))
        # 由於文件不存在，應該返回 None
        assert result is None
    
    def test_parse_module_structure(self, temp_dir):
        """測試模組結構解析"""
        # 創建模組目錄結構
        prd_dir = temp_dir / "PRD"
        module_dir = prd_dir / "01-DSH-Dashboard"
        module_dir.mkdir(parents=True)
        
        # 創建子模組文件
        submodule_file = module_dir / "01.1-DSH-OV-Dashboard_Overview.md"
        submodule_content = """
        # Dashboard Overview
        
        ## FR-ID: FR-001
        ## 狀態: ✅ 完成
        """
        submodule_file.write_text(submodule_content, encoding='utf-8')
        
        parser = PRDParser()
        parser.prd_dir = prd_dir
        
        result = parser.parse_prd_files()
        
        assert "01-DSH-Dashboard" in result["modules"]
        assert result["total_fr_ids"] == 1
        assert result["completed_fr_ids"] == 1
