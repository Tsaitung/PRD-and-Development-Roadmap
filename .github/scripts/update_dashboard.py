#!/usr/bin/env python3
"""
自動更新儀表板腳本
根據新的模組架構更新儀表板顯示
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class DashboardUpdater:
    def __init__(self):
        self.prd_dir = Path("PRD")
        self.dashboard_dir = Path("docs/dashboard")
        self.toc_file = Path("TOC Modules.md")
        
    def update_dashboard(self) -> Dict[str, Any]:
        """更新儀表板數據"""
        print("🔄 開始更新儀表板...")
        
        # 分析模組結構
        module_data = self.analyze_module_structure()
        
        # 更新儀表板文件
        self.update_dashboard_js(module_data)
        self.update_dashboard_html(module_data)
        
        # 生成更新報告
        report = self.generate_update_report(module_data)
        
        print("✅ 儀表板更新完成！")
        return report
    
    def analyze_module_structure(self) -> Dict[str, Any]:
        """分析模組結構"""
        print("📊 分析模組結構...")
        
        data = {
            "total_modules": 0,
            "total_submodules": 0,
            "modules": [],
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 讀取 TOC Modules.md
        if self.toc_file.exists():
            toc_content = self.toc_file.read_text(encoding='utf-8')
            data.update(self.parse_toc_content(toc_content))
        
        # 分析 PRD 目錄結構
        if self.prd_dir.exists():
            prd_data = self.analyze_prd_structure()
            data.update(prd_data)
        
        return data
    
    def parse_toc_content(self, content: str) -> Dict[str, Any]:
        """解析 TOC 內容"""
        data = {
            "total_modules": 0,
            "total_submodules": 0,
            "modules": []
        }
        
        # 提取模組資訊
        module_pattern = r'(\d+)\.\s*\[([A-Z]+)\]\s*(.+?)(?=\n\d+\.|$)'
        modules = re.findall(module_pattern, content, re.DOTALL)
        
        for module_num, module_code, module_content in modules:
            module_info = {
                "number": int(module_num),
                "code": module_code,
                "name": module_content.strip(),
                "submodules": [],
                "submodule_count": 0,
                "completed_count": 0,
                "status": "not-started"
            }
            
            # 提取子模組
            submodule_pattern = r'(\d+\.\d+)\.\s*\[([A-Z-]+)\]\s*(.+?)(?=\n\d+\.\d+\.|$)'
            submodules = re.findall(submodule_pattern, module_content, re.DOTALL)
            
            for sub_num, sub_code, sub_name in submodules:
                submodule_info = {
                    "number": sub_num,
                    "code": sub_code,
                    "name": sub_name.strip(),
                    "status": "not-started"
                }
                module_info["submodules"].append(submodule_info)
                module_info["submodule_count"] += 1
            
            data["modules"].append(module_info)
            data["total_modules"] += 1
            data["total_submodules"] += module_info["submodule_count"]
        
        return data
    
    def analyze_prd_structure(self) -> Dict[str, Any]:
        """分析 PRD 目錄結構"""
        data = {
            "prd_folders": 0,
            "prd_files": 0,
            "completed_modules": 0
        }
        
        # 統計資料夾和文件
        for root, dirs, files in os.walk(self.prd_dir):
            data["prd_folders"] += len(dirs)
            data["prd_files"] += len([f for f in files if f.endswith('.md')])
        
        # 檢查完成的模組（有 README.md 的模組）
        for module_dir in self.prd_dir.iterdir():
            if module_dir.is_dir() and module_dir.name.startswith(('0', '1')):
                readme_files = list(module_dir.rglob("README.md"))
                if readme_files:
                    data["completed_modules"] += 1
        
        return data
    
    def update_dashboard_js(self, data: Dict[str, Any]) -> None:
        """更新 dashboard.js"""
        print("📝 更新 dashboard.js...")
        
        js_file = self.dashboard_dir / "dashboard.js"
        if not js_file.exists():
            print("⚠️  dashboard.js 不存在，跳過更新")
            return
        
        # 讀取原始文件
        content = js_file.read_text(encoding='utf-8')
        
        # 更新模組數量
        content = re.sub(
            r'totalModules:\s*\d+',
            f'totalModules: {data["total_modules"]}',
            content
        )
        
        content = re.sub(
            r'totalSubmodules:\s*\d+',
            f'totalSubmodules: {data["total_submodules"]}',
            content
        )
        
        # 更新模組數據
        modules_json = json.dumps(data["modules"], ensure_ascii=False, indent=2)
        content = re.sub(
            r'const moduleData\s*=\s*\[.*?\];',
            f'const moduleData = {modules_json};',
            content,
            flags=re.DOTALL
        )
        
        # 寫回文件
        js_file.write_text(content, encoding='utf-8')
        print(f"✅ 已更新 {js_file}")
    
    def update_dashboard_html(self, data: Dict[str, Any]) -> None:
        """更新 dashboard.html"""
        print("📝 更新 dashboard.html...")
        
        html_file = self.dashboard_dir / "index.html"
        if not html_file.exists():
            print("⚠️  index.html 不存在，跳過更新")
            return
        
        # 讀取原始文件
        content = html_file.read_text(encoding='utf-8')
        
        # 更新標題和描述
        content = re.sub(
            r'<title>.*?</title>',
            f'<title>菜蟲農食 ERP - 模組進度儀表板 ({data["total_modules"]} 模組)</title>',
            content
        )
        
        # 更新統計資訊
        content = re.sub(
            r'總模組數.*?\d+',
            f'總模組數: {data["total_modules"]}',
            content
        )
        
        content = re.sub(
            r'總子模組數.*?\d+',
            f'總子模組數: {data["total_submodules"]}',
            content
        )
        
        # 寫回文件
        html_file.write_text(content, encoding='utf-8')
        print(f"✅ 已更新 {html_file}")
    
    def generate_update_report(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """生成更新報告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_modules": data["total_modules"],
                "total_submodules": data["total_submodules"],
                "prd_folders": data.get("prd_folders", 0),
                "prd_files": data.get("prd_files", 0),
                "completed_modules": data.get("completed_modules", 0)
            },
            "modules": data["modules"],
            "changes": []
        }
        
        # 保存報告
        report_file = self.dashboard_dir / "update_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"📊 更新報告已保存到 {report_file}")
        return report
    
    def create_module_summary(self) -> None:
        """創建模組摘要"""
        print("📋 創建模組摘要...")
        
        summary_file = self.dashboard_dir / "module_summary.md"
        
        summary_content = f"""# 模組架構摘要

## 📊 統計資訊

- **總模組數**: {self.get_total_modules()}
- **總子模組數**: {self.get_total_submodules()}
- **最後更新**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 📁 模組列表

"""
        
        # 讀取 TOC 內容
        if self.toc_file.exists():
            toc_content = self.toc_file.read_text(encoding='utf-8')
            
            # 提取模組資訊
            module_pattern = r'(\d+)\.\s*\[([A-Z]+)\]\s*(.+?)(?=\n\d+\.|$)'
            modules = re.findall(module_pattern, toc_content, re.DOTALL)
            
            for module_num, module_code, module_content in modules:
                summary_content += f"### {module_num}. [{module_code}] {module_content.strip()}\n\n"
        
        # 寫入摘要文件
        summary_file.write_text(summary_content, encoding='utf-8')
        print(f"✅ 模組摘要已保存到 {summary_file}")
    
    def get_total_modules(self) -> int:
        """獲取總模組數"""
        if self.toc_file.exists():
            content = self.toc_file.read_text(encoding='utf-8')
            modules = re.findall(r'^\d+\.\s*\[[A-Z]+\]', content, re.MULTILINE)
            return len(modules)
        return 0
    
    def get_total_submodules(self) -> int:
        """獲取總子模組數"""
        if self.toc_file.exists():
            content = self.toc_file.read_text(encoding='utf-8')
            submodules = re.findall(r'^\d+\.\d+\.\s*\[[A-Z-]+\]', content, re.MULTILINE)
            return len(submodules)
        return 0

def main():
    parser = argparse.ArgumentParser(description='更新儀表板以反映新的模組架構')
    parser.add_argument('--output', type=str, default='docs/dashboard/update_report.json', 
                       help='更新報告輸出路徑')
    parser.add_argument('--create-summary', action='store_true', 
                       help='創建模組摘要文件')
    
    args = parser.parse_args()
    
    try:
        updater = DashboardUpdater()
        
        # 更新儀表板
        report = updater.update_dashboard()
        
        # 創建模組摘要
        if args.create_summary:
            updater.create_module_summary()
        
        # 輸出摘要
        print("\n📊 更新摘要:")
        print(f"  總模組數: {report['summary']['total_modules']}")
        print(f"  總子模組數: {report['summary']['total_submodules']}")
        print(f"  PRD 資料夾數: {report['summary']['prd_folders']}")
        print(f"  PRD 文件數: {report['summary']['prd_files']}")
        print(f"  已完成模組: {report['summary']['completed_modules']}")
        
        print(f"\n✅ 儀表板更新完成！報告已保存到: {args.output}")
        
    except Exception as e:
        print(f"❌ 更新過程中發生錯誤: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
