#!/usr/bin/env python3
"""
更新 MPM (Module Progress Matrix) 文件的腳本
根據各項分析結果自動更新進度矩陣
"""

import os
import re
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from jinja2 import Template

class MPMUpdater:
    def __init__(self):
        self.mpm_template_path = Path("docs/TOC_Module_Progress_Matrix.md")
        self.output_path = Path("docs/TOC_Module_Progress_Matrix.md")
        
    def load_data(self, prd_status: str, code_status: str, 
                  test_coverage: str, issue_status: str) -> Dict[str, Any]:
        """載入所有分析數據"""
        try:
            prd_data = json.loads(prd_status) if prd_status else {}
            code_data = json.loads(code_status) if code_status else {}
            test_data = json.loads(test_coverage) if test_coverage else {}
            issue_data = json.loads(issue_status) if issue_status else {}
            
            return {
                "prd": prd_data,
                "code": code_data,
                "test": test_data,
                "issue": issue_data
            }
        except json.JSONDecodeError as e:
            print(f"JSON 解析錯誤: {e}")
            return {"prd": {}, "code": {}, "test": {}, "issue": {}}
    
    def calculate_progress(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """計算整體進度"""
        prd_data = data.get("prd", {})
        
        total_fr_ids = prd_data.get("total_fr_ids", 0)
        completed_fr_ids = prd_data.get("completed_fr_ids", 0)
        draft_fr_ids = prd_data.get("draft_fr_ids", 0)
        in_progress_fr_ids = prd_data.get("in_progress_fr_ids", 0)
        
        if total_fr_ids == 0:
            overall_progress = 0
        else:
            # 進度計算：完成 100%，草稿 30%，開發中 60%
            progress = (completed_fr_ids * 100 + 
                       draft_fr_ids * 30 + 
                       in_progress_fr_ids * 60) / total_fr_ids
            overall_progress = round(progress, 1)
        
        return {
            "overall_progress": overall_progress,
            "total_fr_ids": total_fr_ids,
            "completed_fr_ids": completed_fr_ids,
            "draft_fr_ids": draft_fr_ids,
            "in_progress_fr_ids": in_progress_fr_ids
        }
    
    def generate_module_table(self, module_name: str, module_data: Dict[str, Any], 
                            data: Dict[str, Any]) -> str:
        """生成模組表格"""
        submodules = module_data.get("submodules", [])
        
        if not submodules:
            return f"### {module_name}\n\n| 子模組 | FR-ID | PRD 狀態 | 程式碼狀態 | 單元測試 | 整合測試 | 錯誤追蹤 | 進度 |\n|--------|-------|----------|------------|----------|----------|----------|------|\n| 無子模組 | - | - | - | - | - | - | - |\n\n"
        
        table_rows = []
        for submodule in submodules:
            fr_id = submodule.get("fr_id", "-")
            prd_status = submodule.get("status", "🔴 未開始")
            
            # 檢查程式碼狀態
            code_status = self.get_code_status(fr_id, data.get("code", {}))
            
            # 檢查測試覆蓋率
            test_coverage = self.get_test_coverage(fr_id, data.get("test", {}))
            
            # 檢查錯誤追蹤
            issue_count = self.get_issue_count(fr_id, data.get("issue", {}))
            
            # 計算進度
            progress = self.calculate_submodule_progress(prd_status, code_status, test_coverage)
            
            row = f"| {submodule.get('module_abbr', '-')} | {fr_id} | {prd_status} | {code_status} | {test_coverage} | {'✅ 通過' if test_coverage != '❌ 0%' else '❌ 未開始'} | {issue_count} | {progress}% |"
            table_rows.append(row)
        
        table_content = "\n".join(table_rows)
        return f"### {module_name}\n\n| 子模組 | FR-ID | PRD 狀態 | 程式碼狀態 | 單元測試 | 整合測試 | 錯誤追蹤 | 進度 |\n|--------|-------|----------|------------|----------|----------|----------|------|\n{table_content}\n\n"
    
    def get_code_status(self, fr_id: str, code_data: Dict[str, Any]) -> str:
        """獲取程式碼狀態"""
        if not code_data or not fr_id:
            return "❌ 未開始"
        
        # 檢查是否有對應的程式碼
        modules = code_data.get("modules", {})
        for module_name, module_info in modules.items():
            for submodule in module_info.get("submodules", []):
                if submodule.get("fr_id") == fr_id:
                    return "✅ 完成" if submodule.get("has_code", False) else "🟡 開發中"
        
        return "❌ 未開始"
    
    def get_test_coverage(self, fr_id: str, test_data: Dict[str, Any]) -> str:
        """獲取測試覆蓋率"""
        if not test_data or not fr_id:
            return "❌ 0%"
        
        # 檢查測試覆蓋率
        coverage_data = test_data.get("coverage", {})
        for test_info in coverage_data.get("modules", []):
            if test_info.get("fr_id") == fr_id:
                coverage = test_info.get("coverage", 0)
                if coverage >= 90:
                    return f"✅ {coverage}%"
                elif coverage >= 50:
                    return f"🟡 {coverage}%"
                else:
                    return f"❌ {coverage}%"
        
        return "❌ 0%"
    
    def get_issue_count(self, fr_id: str, issue_data: Dict[str, Any]) -> str:
        """獲取錯誤追蹤數量"""
        if not issue_data or not fr_id:
            return "✅ 0"
        
        # 檢查相關的 Issues
        issues = issue_data.get("issues", [])
        count = 0
        for issue in issues:
            if fr_id in issue.get("labels", []):
                if issue.get("state") == "open":
                    count += 1
        
        if count == 0:
            return "✅ 0"
        elif count <= 3:
            return f"🟡 {count}"
        else:
            return f"🔴 {count}"
    
    def calculate_submodule_progress(self, prd_status: str, code_status: str, 
                                   test_coverage: str) -> int:
        """計算子模組進度"""
        progress = 0
        
        # PRD 狀態權重 40%
        if "完成" in prd_status:
            progress += 40
        elif "開發中" in prd_status:
            progress += 30
        elif "草稿" in prd_status:
            progress += 20
        
        # 程式碼狀態權重 40%
        if "完成" in code_status:
            progress += 40
        elif "開發中" in code_status:
            progress += 25
        
        # 測試覆蓋率權重 20%
        if "✅" in test_coverage and "90" in test_coverage:
            progress += 20
        elif "✅" in test_coverage or "🟡" in test_coverage:
            progress += 10
        
        return min(progress, 100)
    
    def update_mpm(self, data: Dict[str, Any]) -> str:
        """更新 MPM 文件內容"""
        progress_data = self.calculate_progress(data)
        
        # 讀取模板
        if self.mpm_template_path.exists():
            template_content = self.mpm_template_path.read_text(encoding='utf-8')
        else:
            template_content = self.get_default_template()
        
        # 替換變數
        updated_content = template_content.replace("{{ last_updated }}", 
                                                 datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        updated_content = updated_content.replace("{{ overall_progress }}", 
                                                 str(progress_data["overall_progress"]))
        
        # 更新統計資訊
        stats_section = f"""## 📈 進度統計

- **總模組數**: 12
- **總子模組數**: {progress_data['total_fr_ids']}
- **PRD 完成數**: {progress_data['completed_fr_ids']}
- **程式碼完成數**: {progress_data['completed_fr_ids']}
- **測試完成數**: {progress_data['completed_fr_ids']}
- **整體進度**: {progress_data['overall_progress']}%"""
        
        # 替換統計區段
        stats_pattern = r'## 📈 進度統計\n\n.*?\n- \*\*整體進度\*\*: \d+%'
        updated_content = re.sub(stats_pattern, stats_section, updated_content, flags=re.DOTALL)
        
        return updated_content
    
    def get_default_template(self) -> str:
        """獲取預設模板"""
        return """# 菜蟲農食 ERP 系統 - 模組進度矩陣 (MPM)

## 📊 專案概覽

- **專案名稱**: 菜蟲農食 ERP 系統
- **最後更新**: {{ last_updated }}
- **總模組數**: 12
- **總子模組數**: 54
- **整體進度**: {{ overall_progress }}%

## 🔄 進度狀態說明

| 狀態 | 說明 | 顏色 |
|------|------|------|
| 🟢 完成 | 已上線並穩定運行 | 綠色 |
| 🟡 開發中 | 正在開發或測試 | 黃色 |
| 🔴 未開始 | 尚未開始開發 | 紅色 |
| ⚠️ 有問題 | 存在錯誤或問題 | 橙色 |
| 📝 草稿 | PRD 草稿階段 | 藍色 |

## 📋 模組進度矩陣

<!-- 模組表格將在這裡動態生成 -->

## 📈 進度統計

- **總模組數**: 12
- **總子模組數**: 54
- **PRD 完成數**: 0
- **程式碼完成數**: 0
- **測試完成數**: 0
- **整體進度**: {{ overall_progress }}%

## 🔗 相關連結

- [TOC Modules.md](../TOC%20Modules.md) - 完整模組結構
- [PRD 模板](../module_prd_template.md) - PRD 文件模板
- [GitHub Repository](https://github.com/Tsaitung/PRD-and-Development-Roadmap)

---

*此文件由 CI/CD Pipeline 自動生成，最後更新時間：{{ last_updated }}*"""
    
    def save_mpm(self, content: str):
        """儲存 MPM 文件"""
        self.output_path.parent.mkdir(exist_ok=True)
        self.output_path.write_text(content, encoding='utf-8')
        print(f"MPM 文件已更新: {self.output_path}")

def main():
    parser = argparse.ArgumentParser(description="更新 MPM 文件")
    parser.add_argument("--prd-status", default="{}", help="PRD 狀態 JSON")
    parser.add_argument("--code-status", default="{}", help="程式碼狀態 JSON")
    parser.add_argument("--test-coverage", default="{}", help="測試覆蓋率 JSON")
    parser.add_argument("--issue-status", default="{}", help="錯誤追蹤狀態 JSON")
    parser.add_argument("--output", default="docs/TOC_Module_Progress_Matrix.md", help="輸出檔案")
    
    args = parser.parse_args()
    
    # 建立更新器
    updater = MPMUpdater()
    updater.output_path = Path(args.output)
    
    # 載入數據
    data = updater.load_data(args.prd_status, args.code_status, 
                            args.test_coverage, args.issue_status)
    
    # 更新 MPM
    updated_content = updater.update_mpm(data)
    
    # 儲存文件
    updater.save_mpm(updated_content)
    
    print("MPM 更新完成！")

if __name__ == "__main__":
    main() 