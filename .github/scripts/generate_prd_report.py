#!/usr/bin/env python3
"""
PRD品質報告生成器
自動生成每日品質報告並更新追蹤矩陣
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
import subprocess
import sys

class PRDReportGenerator:
    """PRD品質報告生成器"""
    
    def __init__(self, prd_dir: str = "PRD"):
        self.prd_dir = Path(prd_dir)
        self.tracking_file = self.prd_dir / "PRD_TRACKING_MATRIX.md"
        self.report_dir = self.prd_dir / "reports"
        self.report_dir.mkdir(exist_ok=True)
        
    def run_validation(self) -> dict:
        """執行PRD驗證並獲取結果"""
        try:
            # 執行驗證腳本
            result = subprocess.run(
                [sys.executable, '.github/scripts/validate_prd.py', '--output', 'json'],
                capture_output=True,
                text=True
            )
            
            if result.stdout:
                return json.loads(result.stdout)
            else:
                return {"error": "無法執行驗證"}
                
        except Exception as e:
            return {"error": str(e)}
            
    def update_tracking_matrix(self, validation_results: dict):
        """更新追蹤矩陣"""
        if not self.tracking_file.exists():
            print(f"追蹤矩陣檔案不存在: {self.tracking_file}")
            return
            
        # 讀取現有矩陣
        with open(self.tracking_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 解析驗證結果並更新矩陣
        for file_result in validation_results.get('files', []):
            file_path = Path(file_result['file'])
            module_name = file_path.parent.name
            
            # 計算各項指標
            score = file_result.get('score', 0)
            checks = file_result.get('checks', {})
            
            # 格式檢核
            format_score = "✅100%" if score == 100 else f"🟡{score:.0f}%"
            
            # API定義
            api_score = "✅100%" if checks.get('api_spec', {}).get('passed') else "🔴0%"
            
            # 資料模型
            model_score = "✅100%" if checks.get('data_model', {}).get('passed') else "🔴0%"
            
            # 測試對應
            test_score = "✅100%" if checks.get('test_mapping', {}).get('passed') else "🔴0%"
            
            # 審核狀態
            status = "已批准" if score == 100 else "審查中" if score > 0 else "未開始"
            
            # 更新矩陣中的對應行
            # 這裡需要更複雜的邏輯來精確更新表格
            # 簡化版本：標記已完成的模組
            if "CRM-CM" in module_name and score == 100:
                content = content.replace(
                    "| CRM-CM | 客戶主檔 | - | 🔴0% | 🔴0% | 🔴0% | ✅100% | 未開始 | - |",
                    f"| CRM-CM | 客戶主檔 | 5 | ✅100% | ✅100% | ✅100% | ✅100% | 已批准 | 產品團隊 |"
                )
                
        # 更新總體統計
        total_modules = 187
        completed_modules = len([f for f in validation_results.get('files', []) 
                                if f.get('score', 0) == 100])
        progress_percent = (completed_modules / total_modules * 100) if total_modules > 0 else 0
        
        # 更新進度
        content = re.sub(
            r'\*\*總體進度\*\*: \d+/187 \(\d+%\)',
            f'**總體進度**: {completed_modules}/187 ({progress_percent:.1f}%)',
            content
        )
        
        # 更新時間戳
        content = re.sub(
            r'\*\*最後更新\*\*: \d{4}-\d{2}-\d{2}',
            f'**最後更新**: {datetime.now().strftime("%Y-%m-%d")}',
            content
        )
        
        # 寫回檔案
        with open(self.tracking_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
    def generate_daily_report(self, validation_results: dict) -> str:
        """生成每日品質報告"""
        report = []
        report.append(f"# PRD品質日報 - {datetime.now().strftime('%Y-%m-%d')}")
        report.append("")
        
        # 總體統計
        summary = validation_results.get('summary', {})
        report.append("## 📊 總體統計")
        report.append(f"- **已檢查PRD數**: {summary.get('total_files', 0)}")
        report.append(f"- **格式合格數**: {summary.get('passed_files', 0)}")
        report.append(f"- **需修正數**: {summary.get('failed_files', 0)}")
        report.append(f"- **平均品質分數**: {summary.get('average_score', 0):.1f}/100")
        report.append("")
        
        # 今日進度
        report.append("## 📈 今日進度")
        report.append(f"- **目標**: 完成9個子模組PRD")
        report.append(f"- **實際**: 完成{summary.get('passed_files', 0)}個")
        
        if summary.get('passed_files', 0) > 0:
            report.append("")
            report.append("### ✅ 今日完成")
            for file_result in validation_results.get('files', []):
                if file_result.get('score', 0) == 100:
                    report.append(f"- {Path(file_result['file']).parent.name}")
                    
        if summary.get('failed_files', 0) > 0:
            report.append("")
            report.append("### 🔴 需要修正")
            for file_result in validation_results.get('files', []):
                if file_result.get('score', 0) < 100:
                    report.append(f"- {Path(file_result['file']).parent.name}: {file_result.get('score', 0):.0f}分")
                    
                    # 列出主要問題
                    for check_name, check_result in file_result.get('checks', {}).items():
                        if not check_result.get('passed'):
                            report.append(f"  - ❌ {check_name}")
                            
        # 錯誤類型分析
        if validation_results.get('errors_by_type'):
            report.append("")
            report.append("## ❌ 常見問題")
            for error_type, files in validation_results['errors_by_type'].items():
                report.append(f"- **{error_type}**: {len(files)}個檔案")
                
        # 改進建議
        if validation_results.get('recommendations'):
            report.append("")
            report.append("## 💡 改進建議")
            for rec in validation_results['recommendations']:
                report.append(f"- {rec}")
                
        # 明日計畫
        report.append("")
        report.append("## 📅 明日計畫")
        report.append("- 修正所有不合格PRD")
        report.append("- 新增9個子模組PRD")
        report.append("- 確保格式100%合格")
        
        # 里程碑追蹤
        report.append("")
        report.append("## 🎯 里程碑追蹤")
        report.append("- **Week 1目標**: 45個子模組")
        report.append(f"- **當前進度**: {summary.get('passed_files', 0)}/45")
        
        progress = (summary.get('passed_files', 0) / 45 * 100) if summary.get('passed_files', 0) else 0
        if progress < 20:
            report.append("- **狀態**: ⚠️ 進度落後，需要加速")
        elif progress < 80:
            report.append("- **狀態**: 🟡 正常進行中")
        else:
            report.append("- **狀態**: ✅ 進度良好")
            
        return '\n'.join(report)
        
    def save_report(self, report_content: str):
        """儲存報告"""
        # 儲存到每日報告檔案
        date_str = datetime.now().strftime('%Y%m%d')
        report_file = self.report_dir / f"daily_report_{date_str}.md"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
            
        print(f"報告已儲存到: {report_file}")
        
        # 同時更新最新報告
        latest_file = self.report_dir / "latest_report.md"
        with open(latest_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
            
    def generate_weekly_summary(self):
        """生成週報總結"""
        report = []
        report.append(f"# PRD品質週報 - Week {datetime.now().isocalendar()[1]}")
        report.append(f"**期間**: {datetime.now().strftime('%Y-%m-%d')} (Week {datetime.now().isocalendar()[1]})")
        report.append("")
        
        # 收集本週所有日報
        week_files = sorted(self.report_dir.glob("daily_report_*.md"))[-7:]
        
        report.append("## 📊 週總結")
        report.append("- **本週目標**: 45個子模組")
        report.append("- **實際完成**: 計算中...")
        report.append("")
        
        report.append("## 📈 每日進度")
        for report_file in week_files:
            date = report_file.stem.replace("daily_report_", "")
            report.append(f"- **{date}**: 查看[日報]({report_file.name})")
            
        return '\n'.join(report)
        
    def run(self):
        """執行報告生成流程"""
        print("🔍 正在執行PRD驗證...")
        validation_results = self.run_validation()
        
        if "error" in validation_results:
            print(f"❌ 驗證失敗: {validation_results['error']}")
            return
            
        print("📊 正在更新追蹤矩陣...")
        self.update_tracking_matrix(validation_results)
        
        print("📝 正在生成日報...")
        daily_report = self.generate_daily_report(validation_results)
        
        print("💾 正在儲存報告...")
        self.save_report(daily_report)
        
        # 如果是週末，生成週報
        if datetime.now().weekday() == 6:  # Sunday
            print("📅 正在生成週報...")
            weekly_report = self.generate_weekly_summary()
            week_file = self.report_dir / f"weekly_report_week{datetime.now().isocalendar()[1]}.md"
            with open(week_file, 'w', encoding='utf-8') as f:
                f.write(weekly_report)
            print(f"週報已儲存到: {week_file}")
            
        print("✅ 報告生成完成！")
        
        # 輸出簡要統計
        summary = validation_results.get('summary', {})
        print(f"\n📊 今日統計:")
        print(f"  - 總檢查數: {summary.get('total_files', 0)}")
        print(f"  - 合格數: {summary.get('passed_files', 0)}")
        print(f"  - 需修正: {summary.get('failed_files', 0)}")
        print(f"  - 平均分數: {summary.get('average_score', 0):.1f}")

def main():
    """主函數"""
    import argparse
    
    parser = argparse.ArgumentParser(description='PRD品質報告生成器')
    parser.add_argument('--dir', default='PRD', help='PRD目錄路徑')
    parser.add_argument('--weekly', action='store_true', help='生成週報')
    
    args = parser.parse_args()
    
    generator = PRDReportGenerator(args.dir)
    
    if args.weekly:
        weekly_report = generator.generate_weekly_summary()
        print(weekly_report)
    else:
        generator.run()

if __name__ == '__main__':
    main()