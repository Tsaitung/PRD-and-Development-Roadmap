#!/usr/bin/env python3
"""
檢查程式碼狀態的腳本
分析各模組是否有對應的程式碼實現
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any

class CodeStatusChecker:
    def __init__(self):
        self.prd_dir = Path("PRD")
        self.src_dir = Path("src")
        self.code_extensions = {'.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.php', '.rb', '.go'}
        
    def check_code_status(self) -> Dict[str, Any]:
        """檢查程式碼狀態"""
        results = {
            "modules": {},
            "total_modules": 0,
            "modules_with_code": 0,
            "modules_without_code": 0
        }
        
        if not self.prd_dir.exists():
            print(f"PRD 目錄不存在: {self.prd_dir}")
            return results
            
        for module_dir in sorted(self.prd_dir.iterdir()):
            if module_dir.is_dir():
                module_name = module_dir.name
                module_results = self.check_module_code(module_dir)
                results["modules"][module_name] = module_results
                results["total_modules"] += 1
                
                if module_results["has_code"]:
                    results["modules_with_code"] += 1
                else:
                    results["modules_without_code"] += 1
        
        return results
    
    def check_module_code(self, module_dir: Path) -> Dict[str, Any]:
        """檢查單一模組的程式碼狀態"""
        module_name = module_dir.name
        module_info = {
            "name": module_name,
            "has_code": False,
            "submodules": [],
            "code_files": [],
            "last_commit": None
        }
        
        # 檢查是否有對應的程式碼目錄
        module_code_dir = self.src_dir / module_name
        if module_code_dir.exists():
            module_info["has_code"] = True
            module_info["code_files"] = self.find_code_files(module_code_dir)
            module_info["last_commit"] = self.get_last_commit(module_code_dir)
        
        # 檢查子模組
        prd_files = list(module_dir.glob("**/*.md"))
        for prd_file in prd_files:
            if "README" in prd_file.name or "template" in prd_file.name.lower():
                continue
                
            submodule_info = self.check_submodule_code(prd_file)
            if submodule_info:
                module_info["submodules"].append(submodule_info)
        
        return module_info
    
    def check_submodule_code(self, prd_file: Path) -> Dict[str, Any]:
        """檢查子模組的程式碼狀態"""
        try:
            content = prd_file.read_text(encoding='utf-8')
            
            # 提取 FR-ID
            fr_match = re.search(r'FR-\d{3}', content)
            fr_id = fr_match.group() if fr_match else None
            
            # 提取模組縮寫
            abbr_match = re.search(r'\[([A-Z]{2,3}-[A-Z]{2,3})\]', content)
            module_abbr = abbr_match.group(1) if abbr_match else ""
            
            # 檢查是否有對應的程式碼
            has_code = self.check_submodule_has_code(module_abbr, fr_id)
            
            return {
                "file_path": str(prd_file),
                "fr_id": fr_id,
                "module_abbr": module_abbr,
                "has_code": has_code,
                "code_files": self.find_code_files_for_submodule(module_abbr, fr_id)
            }
            
        except Exception as e:
            print(f"檢查子模組程式碼時發生錯誤 {prd_file}: {e}")
            return None
    
    def check_submodule_has_code(self, module_abbr: str, fr_id: str) -> bool:
        """檢查子模組是否有對應的程式碼"""
        if not module_abbr or not fr_id:
            return False
        
        # 檢查 src 目錄中是否有對應的程式碼
        for code_dir in self.src_dir.rglob("*"):
            if code_dir.is_dir():
                # 檢查目錄名稱是否包含模組縮寫
                if module_abbr.replace("-", "_").lower() in code_dir.name.lower():
                    return True
                
                # 檢查是否有包含 FR-ID 的檔案
                for code_file in code_dir.iterdir():
                    if code_file.is_file() and fr_id in code_file.name:
                        return True
        
        return False
    
    def find_code_files_for_submodule(self, module_abbr: str, fr_id: str) -> List[str]:
        """尋找子模組對應的程式碼檔案"""
        code_files = []
        
        if not module_abbr or not fr_id:
            return code_files
        
        for code_dir in self.src_dir.rglob("*"):
            if code_dir.is_dir():
                # 檢查目錄名稱是否包含模組縮寫
                if module_abbr.replace("-", "_").lower() in code_dir.name.lower():
                    for code_file in code_dir.iterdir():
                        if code_file.is_file() and code_file.suffix in self.code_extensions:
                            code_files.append(str(code_file))
                
                # 檢查是否有包含 FR-ID 的檔案
                for code_file in code_dir.iterdir():
                    if code_file.is_file() and fr_id in code_file.name:
                        code_files.append(str(code_file))
        
        return code_files
    
    def find_code_files(self, directory: Path) -> List[str]:
        """尋找目錄中的程式碼檔案"""
        code_files = []
        
        for file_path in directory.rglob("*"):
            if file_path.is_file() and file_path.suffix in self.code_extensions:
                code_files.append(str(file_path))
        
        return code_files
    
    def get_last_commit(self, directory: Path) -> str:
        """獲取目錄的最後提交時間"""
        try:
            import subprocess
            result = subprocess.run(
                ["git", "log", "-1", "--format=%cd", "--", str(directory)],
                capture_output=True,
                text=True,
                cwd=directory.parent
            )
            return result.stdout.strip() if result.stdout else None
        except Exception:
            return None

def main():
    parser = argparse.ArgumentParser(description="檢查程式碼狀態")
    parser.add_argument("--output", default="temp", help="輸出目錄")
    args = parser.parse_args()
    
    # 建立輸出目錄
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    # 檢查程式碼狀態
    checker = CodeStatusChecker()
    results = checker.check_code_status()
    
    # 寫入結果
    with open(output_dir / "code_status.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"程式碼狀態檢查完成！")
    print(f"總模組數: {results['total_modules']}")
    print(f"有程式碼的模組: {results['modules_with_code']}")
    print(f"無程式碼的模組: {results['modules_without_code']}")

if __name__ == "__main__":
    main() 