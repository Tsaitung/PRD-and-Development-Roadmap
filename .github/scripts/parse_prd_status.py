#!/usr/bin/env python3
"""
解析 PRD 文件狀態的腳本
分析 PRD 文件中的 FR-ID 和狀態資訊
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any

class PRDParser:
    def __init__(self):
        self.prd_dir = Path("PRD")
        self.fr_pattern = re.compile(r'FR-\d{3}')
        self.status_pattern = re.compile(r'(📝 草稿|✅ 完成|🟡 開發中|🔴 未開始|⚠️ 有問題)')
        
    def parse_prd_files(self) -> Dict[str, Any]:
        """解析所有 PRD 文件"""
        results = {
            "modules": {},
            "total_fr_ids": 0,
            "completed_fr_ids": 0,
            "draft_fr_ids": 0,
            "in_progress_fr_ids": 0,
            "not_started_fr_ids": 0,
            "error_fr_ids": 0
        }
        
        if not self.prd_dir.exists():
            print(f"PRD 目錄不存在: {self.prd_dir}")
            return results
            
        for module_dir in sorted(self.prd_dir.iterdir()):
            if module_dir.is_dir():
                module_name = module_dir.name
                module_results = self.parse_module(module_dir)
                results["modules"][module_name] = module_results
                
                # 統計各狀態的 FR-ID 數量
                for submodule in module_results["submodules"]:
                    results["total_fr_ids"] += 1
                    status = submodule.get("status", "🔴 未開始")
                    
                    if "完成" in status:
                        results["completed_fr_ids"] += 1
                    elif "草稿" in status:
                        results["draft_fr_ids"] += 1
                    elif "開發中" in status:
                        results["in_progress_fr_ids"] += 1
                    elif "有問題" in status:
                        results["error_fr_ids"] += 1
                    else:
                        results["not_started_fr_ids"] += 1
        
        return results
    
    def parse_module(self, module_dir: Path) -> Dict[str, Any]:
        """解析單一模組目錄"""
        module_name = module_dir.name
        module_info = {
            "name": module_name,
            "submodules": [],
            "total_submodules": 0,
            "completed_submodules": 0
        }
        
        # 尋找 PRD 文件
        prd_files = list(module_dir.glob("**/*.md"))
        
        for prd_file in prd_files:
            if "README" in prd_file.name or "template" in prd_file.name.lower():
                continue
                
            submodule_info = self.parse_prd_file(prd_file)
            if submodule_info:
                module_info["submodules"].append(submodule_info)
                module_info["total_submodules"] += 1
                
                if submodule_info.get("status") == "✅ 完成":
                    module_info["completed_submodules"] += 1
        
        return module_info
    
    def parse_prd_file(self, prd_file: Path) -> Dict[str, Any]:
        """解析單一 PRD 文件"""
        try:
            content = prd_file.read_text(encoding='utf-8')
            
            # 提取 FR-ID
            fr_match = self.fr_pattern.search(content)
            fr_id = fr_match.group() if fr_match else None
            
            # 提取狀態
            status_match = self.status_pattern.search(content)
            status = status_match.group() if status_match else "🔴 未開始"
            
            # 提取模組縮寫
            module_abbr = self.extract_module_abbr(content)
            
            return {
                "file_path": str(prd_file),
                "fr_id": fr_id,
                "status": status,
                "module_abbr": module_abbr,
                "last_modified": prd_file.stat().st_mtime
            }
            
        except Exception as e:
            print(f"解析文件時發生錯誤 {prd_file}: {e}")
            return None
    
    def extract_module_abbr(self, content: str) -> str:
        """提取模組縮寫"""
        # 尋找 [XXX-YYY] 格式的縮寫
        abbr_pattern = re.compile(r'\[([A-Z]{2,3}-[A-Z]{2,3})\]')
        match = abbr_pattern.search(content)
        return match.group(1) if match else ""
    
    def generate_fr_ids_list(self, results: Dict[str, Any]) -> List[str]:
        """生成 FR-ID 列表"""
        fr_ids = []
        
        for module_name, module_info in results["modules"].items():
            for submodule in module_info["submodules"]:
                if submodule.get("fr_id"):
                    fr_ids.append(submodule["fr_id"])
        
        return sorted(fr_ids)

def main():
    parser = argparse.ArgumentParser(description="解析 PRD 文件狀態")
    parser.add_argument("--output", default="temp", help="輸出目錄")
    args = parser.parse_args()
    
    # 建立輸出目錄
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    # 解析 PRD 文件
    prd_parser = PRDParser()
    results = prd_parser.parse_prd_files()
    
    # 生成 FR-ID 列表
    fr_ids = prd_parser.generate_fr_ids_list(results)
    
    # 寫入結果
    with open(output_dir / "prd_status.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    with open(output_dir / "fr_ids.json", "w", encoding="utf-8") as f:
        json.dump(fr_ids, f, ensure_ascii=False, indent=2)
    
    print(f"解析完成！")
    print(f"總 FR-ID 數量: {results['total_fr_ids']}")
    print(f"完成: {results['completed_fr_ids']}")
    print(f"草稿: {results['draft_fr_ids']}")
    print(f"開發中: {results['in_progress_fr_ids']}")
    print(f"未開始: {results['not_started_fr_ids']}")
    print(f"有問題: {results['error_fr_ids']}")

if __name__ == "__main__":
    main() 