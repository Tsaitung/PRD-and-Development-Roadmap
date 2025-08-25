#!/usr/bin/env python3
"""
菜蟲農食 ERP - 模組狀態自動檢測腳本
自動掃描專案結構並更新 TOC Modules.md 中的狀態追蹤
"""

import os
import re
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

class ModuleStatusChecker:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.toc_file = self.project_root / "TOC Modules.md"
        self.prd_dir = self.project_root / "PRD"
        self.src_dir = self.project_root / "src"
        self.tests_dir = self.project_root / "tests"
        
        # 模組代碼對應
        self.module_codes = {
            'DSH': 'Dashboard',
            'CRM': 'Customer Relationship Management',
            'BDM': 'Basic Data Maintenance',
            'IM': 'Item Management',
            'OP': 'Operations Planning',
            'OM': 'Order Management',
            'MES': 'Manufacturing Execution System',
            'WMS': 'Warehouse Management System',
            'PM': 'Purchasing Management',
            'LM': 'Logistics Management',
            'FA': 'Finance & Accounting',
            'BI': 'Business Intelligence',
            'SA': 'System Administration',
            'UP': 'User Profile'
        }
        
        self.module_status = {}
        
    def check_prd_status(self, module_code: str) -> str:
        """檢查 PRD 文件完成狀態"""
        module_prd_path = None
        
        # 尋找對應的 PRD 資料夾
        for item in self.prd_dir.iterdir():
            if item.is_dir() and module_code in item.name:
                module_prd_path = item
                break
        
        if not module_prd_path or not module_prd_path.exists():
            return "⚪"  # 規劃中
        
        # 檢查是否有 prd.md 文件（新標準）
        prd_files = list(module_prd_path.rglob("prd.md"))
        if prd_files:
            # 檢查 prd.md 內容
            for prd_file in prd_files:
                content = prd_file.read_text(encoding='utf-8')
                if len(content) > 500:  # 簡單判斷內容是否充實
                    return "✅"  # 完成
                else:
                    return "🟡"  # 開發中
        
        # 檢查是否有 README.md（舊標準）
        readme_files = list(module_prd_path.rglob("README.md"))
        if readme_files:
            # 檢查 README.md 內容完整性
            for readme in readme_files:
                content = readme.read_text(encoding='utf-8')
                if len(content) > 500:  # 簡單判斷內容是否充實
                    return "🟡"  # 開發中
        
        return "⚪"  # 規劃中
    
    def check_implementation_status(self, module_code: str) -> Tuple[str, str]:
        """檢查程式碼實作狀態"""
        # 先檢查是否有 PRD 文件
        prd_status = self.check_prd_status(module_code)
        
        # 如果沒有 PRD 文件（規劃中），則實作狀態必須為未開始
        if prd_status == "⚪":  # 規劃中
            return "🔴", "🔴"  # 未開始
        
        # 搜尋相關的 tsx/ts 檔案
        module_files = []
        
        # 檢查 src 目錄
        if self.src_dir.exists():
            # 分別搜尋 .tsx 和 .ts 檔案
            for ext in ['.tsx', '.ts']:
                # 使用正確的 glob 模式
                pattern = f"**/*{module_code.lower()}*{ext}"
                module_files.extend(self.src_dir.glob(pattern))
        
        # 檢查是否有實作檔案
        if not module_files:
            # 檢查是否在 TOC Modules.md 中有提到檔案路徑
            toc_content = self.toc_file.read_text(encoding='utf-8')
            if f"/{module_code.lower()}" in toc_content.lower() or ".tsx" in toc_content:
                # 只有在有 PRD 的情況下才能標記為開發中
                if prd_status in ["✅", "🟡"]:
                    return "🟡", "🟡"  # 開發中
            return "🔴", "🔴"  # 未開始
        
        # 有檔案且有 PRD 表示至少部分整合
        if prd_status in ["✅", "🟡"]:
            return "🟡", "🟡"
        
        return "🔴", "🔴"  # 未開始
    
    def check_test_status(self, module_code: str) -> Tuple[str, str]:
        """檢查測試狀態"""
        unit_tests = []
        integration_tests = []
        
        if self.tests_dir.exists():
            # 檢查單元測試
            unit_test_dir = self.tests_dir / "unit"
            if unit_test_dir.exists():
                unit_tests = list(unit_test_dir.rglob(f"*{module_code.lower()}*.py"))
            
            # 檢查整合測試
            integration_test_dir = self.tests_dir / "integration"
            if integration_test_dir.exists():
                integration_tests = list(integration_test_dir.rglob(f"*{module_code.lower()}*.py"))
        
        unit_status = "✅" if unit_tests else "🔴"
        integration_status = "✅" if integration_tests else "🔴"
        
        return unit_status, integration_status
    
    def check_github_issues(self, module_code: str) -> str:
        """檢查 GitHub Issues（目前返回預設值）"""
        # TODO: 實作 GitHub API 整合
        return "-"
    
    def calculate_online_progress(self, module_code: str, statuses: Dict) -> int:
        """計算上線進度"""
        progress = 0
        
        # 根據各項狀態計算進度
        if statuses['new_system'] == "✅":
            progress += 30
        elif statuses['new_system'] == "🟡":
            progress += 15
        
        if statuses['prd'] == "✅":
            progress += 20
        elif statuses['prd'] == "🟡":
            progress += 10
        
        if statuses['integration'] == "✅":
            progress += 20
        elif statuses['integration'] == "🟡":
            progress += 10
        
        if statuses['unit_test'] == "✅":
            progress += 15
        
        if statuses['integration_test'] == "✅":
            progress += 15
        
        return min(progress, 100)
    
    def scan_module_status(self):
        """掃描所有模組的狀態"""
        for code, name in self.module_codes.items():
            print(f"正在檢查模組 {code} - {name}...")
            
            # 檢查 PRD 狀態
            prd_status = self.check_prd_status(code)
            
            # 檢查實作狀態
            new_system_status, integration_status = self.check_implementation_status(code)
            
            # 檢查測試狀態
            unit_test_status, integration_test_status = self.check_test_status(code)
            
            # 檢查 GitHub Issues
            issues_link = self.check_github_issues(code)
            
            # 整合所有狀態
            statuses = {
                'old_system': "✅" if code in ['CRM', 'IM', 'OM', 'MES', 'WMS', 'PM', 'LM', 'FA', 'SA', 'UP'] else "🔴",
                'new_system': new_system_status,
                'prd': prd_status,
                'integration': integration_status,
                'unit_test': unit_test_status,
                'integration_test': integration_test_status,
                'issues': issues_link
            }
            
            # 計算上線進度
            progress = self.calculate_online_progress(code, statuses)
            statuses['progress'] = progress
            
            self.module_status[code] = statuses
    
    def update_toc_file(self):
        """更新 TOC Modules.md 檔案中的狀態"""
        if not self.toc_file.exists():
            print(f"錯誤：找不到 {self.toc_file}")
            return
        
        content = self.toc_file.read_text(encoding='utf-8')
        
        # 更新每個模組的狀態表格
        for code, status in self.module_status.items():
            # 尋找對應的狀態表格
            pattern = rf"(#### 📊 {code} 模組狀態追蹤\n\| 維度 \| 狀態 \| 說明 \|\n\|------\|------\|------\|)([\s\S]*?)(?=\n### |\n---|\Z)"
            
            def replace_table(match):
                header = match.group(1)
                old_table = match.group(2)
                
                # 解析現有的說明
                descriptions = {}
                for line in old_table.strip().split('\n'):
                    if '|' in line and '維度' not in line:
                        parts = [p.strip() for p in line.split('|')]
                        if len(parts) >= 4:
                            dim = parts[1]
                            desc = parts[3]
                            descriptions[dim] = desc
                
                # 建立新的表格內容
                new_table = f"\n| 舊系統狀態 | {status['old_system']} | {descriptions.get('舊系統狀態', '舊系統運行中' if status['old_system'] == '✅' else '無舊系統')} |"
                new_table += f"\n| 新系統更新 | {status['new_system']} | {descriptions.get('新系統更新', '開發中' if status['new_system'] == '🟡' else '未開始')} |"
                new_table += f"\n| PRD完成度 | {status['prd']} | {descriptions.get('PRD完成度', 'PRD 文件狀態')} |"
                new_table += f"\n| 系統整合 | {status['integration']} | {descriptions.get('系統整合', '整合狀態')} |"
                new_table += f"\n| 單元測試 | {status['unit_test']} | {descriptions.get('單元測試', '未開始' if status['unit_test'] == '🔴' else '測試完成')} |"
                new_table += f"\n| 整合測試 | {status['integration_test']} | {descriptions.get('整合測試', '未開始' if status['integration_test'] == '🔴' else '測試完成')} |"
                new_table += f"\n| 錯誤追蹤 | {status['issues']} | {descriptions.get('錯誤追蹤', '無相關 issues')} |"
                new_table += f"\n| 上線進度 | {status['progress']}% | {descriptions.get('上線進度', '自動計算的進度')} |"
                
                return header + new_table
            
            content = re.sub(pattern, replace_table, content)
        
        # 更新整體統計
        self.update_overall_statistics(content)
        
        # 寫回檔案
        self.toc_file.write_text(content, encoding='utf-8')
        print(f"已更新 {self.toc_file}")
    
    def update_overall_statistics(self, content: str) -> str:
        """更新整體統計資訊"""
        # 計算統計數據
        old_system_count = sum(1 for s in self.module_status.values() if s['old_system'] == '✅')
        new_system_count = sum(1 for s in self.module_status.values() if s['new_system'] in ['✅', '🟡'])
        prd_count = sum(1 for s in self.module_status.values() if s['prd'] in ['✅', '🟡'])
        integration_count = sum(1 for s in self.module_status.values() if s['integration'] in ['✅', '🟡'])
        unit_test_count = sum(1 for s in self.module_status.values() if s['unit_test'] == '✅')
        integration_test_count = sum(1 for s in self.module_status.values() if s['integration_test'] == '✅')
        avg_progress = sum(s['progress'] for s in self.module_status.values()) / len(self.module_status)
        
        # 更新統計區塊
        stats_pattern = r"(### 總體進度統計\n)([\s\S]*?)(?=\n### |\Z)"
        
        def replace_stats(match):
            header = match.group(1)
            new_stats = f"""- **有舊系統運行**: {old_system_count}/14 ({old_system_count/14*100:.0f}%)
- **新系統開發中**: {new_system_count}/14 ({new_system_count/14*100:.0f}%)
- **PRD 已完成或進行中**: {prd_count}/14 ({prd_count/14*100:.0f}%)
- **已開始整合**: {integration_count}/14 ({integration_count/14*100:.0f}%)
- **單元測試完成**: {unit_test_count}/14 ({unit_test_count/14*100:.0f}%)
- **整合測試完成**: {integration_test_count}/14 ({integration_test_count/14*100:.0f}%)
- **平均上線進度**: {avg_progress:.0f}%"""
            return header + new_stats
        
        return re.sub(stats_pattern, replace_stats, content)
    
    def generate_report(self):
        """生成狀態報告"""
        report = f"""
# 模組狀態檢測報告
生成時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 檢測結果摘要
"""
        for code, status in self.module_status.items():
            report += f"\n### {code} - {self.module_codes[code]}"
            report += f"\n- 舊系統: {status['old_system']}"
            report += f"\n- 新系統: {status['new_system']}"
            report += f"\n- PRD: {status['prd']}"
            report += f"\n- 整合: {status['integration']}"
            report += f"\n- 單元測試: {status['unit_test']}"
            report += f"\n- 整合測試: {status['integration_test']}"
            report += f"\n- 上線進度: {status['progress']}%"
            report += "\n"
        
        # 儲存報告
        report_file = self.project_root / "module_status_report.md"
        report_file.write_text(report, encoding='utf-8')
        print(f"已生成報告：{report_file}")
    
    def run(self):
        """執行檢測"""
        print("開始掃描模組狀態...")
        self.scan_module_status()
        
        print("\n更新 TOC Modules.md...")
        self.update_toc_file()
        
        print("\n生成狀態報告...")
        self.generate_report()
        
        print("\n✅ 模組狀態檢測完成！")

if __name__ == "__main__":
    checker = ModuleStatusChecker()
    checker.run()