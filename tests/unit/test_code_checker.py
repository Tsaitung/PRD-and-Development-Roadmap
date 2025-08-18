"""
程式碼檢查器測試
測試 check_code_status.py 的功能
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# 添加項目根目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.check_code_status import (
    check_file_exists,
    check_module_completeness,
    analyze_code_coverage,
    generate_code_report
)


class TestCodeChecker:
    """程式碼檢查器測試類"""
    
    def test_check_file_exists(self, tmp_path):
        """測試文件存在性檢查"""
        # 創建測試文件
        test_file = tmp_path / "test.py"
        test_file.write_text("print('test')")
        
        # 測試存在的文件
        assert check_file_exists(str(test_file)) == True
        
        # 測試不存在的文件
        assert check_file_exists(str(tmp_path / "nonexistent.py")) == False
    
    def test_check_module_completeness(self, tmp_path):
        """測試模組完整性檢查"""
        # 創建模組結構
        module_dir = tmp_path / "module"
        module_dir.mkdir()
        
        # 創建必要文件
        (module_dir / "__init__.py").write_text("")
        (module_dir / "main.py").write_text("def main(): pass")
        (module_dir / "tests").mkdir()
        (module_dir / "tests" / "test_main.py").write_text("def test_main(): pass")
        
        result = check_module_completeness(str(module_dir))
        
        assert result["has_init"] == True
        assert result["has_tests"] == True
        assert result["file_count"] >= 2
    
    def test_analyze_code_coverage(self, tmp_path):
        """測試程式碼覆蓋率分析"""
        # 創建測試程式碼文件
        code_file = tmp_path / "code.py"
        code_content = """
def function1():
    return 1

def function2():
    return 2

class TestClass:
    def method1(self):
        return "test"
"""
        code_file.write_text(code_content)
        
        # 創建測試文件
        test_file = tmp_path / "test_code.py"
        test_content = """
def test_function1():
    assert function1() == 1

def test_function2():
    assert function2() == 2
"""
        test_file.write_text(test_content)
        
        coverage = analyze_code_coverage(str(tmp_path))
        
        assert "total_functions" in coverage
        assert "tested_functions" in coverage
        assert coverage["total_functions"] >= 0
    
    @patch('scripts.check_code_status.subprocess.run')
    def test_run_linter(self, mock_run):
        """測試代碼檢查器運行"""
        # 模擬 linter 輸出
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="No issues found",
            stderr=""
        )
        
        from scripts.check_code_status import run_linter
        
        result = run_linter("test.py")
        assert result["success"] == True
        assert "No issues found" in result["output"]
    
    def test_generate_code_report(self, tmp_path):
        """測試程式碼報告生成"""
        # 創建測試項目結構
        src_dir = tmp_path / "src"
        src_dir.mkdir()
        
        module1 = src_dir / "module1"
        module1.mkdir()
        (module1 / "__init__.py").write_text("")
        (module1 / "main.py").write_text("def main(): pass")
        
        module2 = src_dir / "module2"
        module2.mkdir()
        (module2 / "__init__.py").write_text("")
        (module2 / "utils.py").write_text("def util(): pass")
        
        report = generate_code_report(str(src_dir))
        
        assert "modules" in report
        assert len(report["modules"]) == 2
        assert "module1" in str(report["modules"])
        assert "module2" in str(report["modules"])
    
    def test_check_dependencies(self, tmp_path):
        """測試依賴性檢查"""
        # 創建 requirements.txt
        req_file = tmp_path / "requirements.txt"
        req_content = """
pytest>=7.0.0
requests==2.28.0
pandas
numpy<2.0
"""
        req_file.write_text(req_content)
        
        from scripts.check_code_status import check_dependencies
        
        deps = check_dependencies(str(req_file))
        
        assert len(deps) == 4
        assert "pytest" in [d["name"] for d in deps]
        assert "requests" in [d["name"] for d in deps]
    
    def test_check_imports(self, tmp_path):
        """測試導入檢查"""
        # 創建測試文件
        test_file = tmp_path / "test.py"
        test_content = """
import os
import sys
from pathlib import Path
from typing import List, Dict
import requests
import pandas as pd
"""
        test_file.write_text(test_content)
        
        from scripts.check_code_status import check_imports
        
        imports = check_imports(str(test_file))
        
        assert "stdlib" in imports
        assert "third_party" in imports
        assert "os" in imports["stdlib"]
        assert "sys" in imports["stdlib"]