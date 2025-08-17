#!/usr/bin/env python3
"""
驗證 FR-ID 與測試檔案一致性的腳本
檢查 PRD 中的 FR-ID 是否有對應的測試檔案
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any

class ConsistencyValidator:
    def __init__(self):
        self.prd_dir = Path("PRD")
        self.tests_dir = Path("tests")
        self.fr_pattern = re.compile(r'FR-\d{3}')
        
    def validate_consistency(self, fr_ids: List[str], test_coverage: Dict[str, Any]) -> Dict[str, Any]:
        """驗證 FR-ID 與測試檔案的一致性"""
        results = {
            "total_fr_ids": len(fr_ids),
            "tested_fr_ids": 0,
            "untested_fr_ids": [],
            "missing_tests": [],
            "coverage_percentage": 0.0,
            "validation_report": []
        }
        
        # 檢查每個 FR-ID 是否有對應的測試
        for fr_id in fr_ids:
            if self.has_test_for_fr_id(fr_id):
                results["tested_fr_ids"] += 1
            else:
                results["untested_fr_ids"].append(fr_id)
                results["missing_tests"].append({
                    "fr_id": fr_id,
                    "status": "missing_test",
                    "recommendation": f"為 {fr_id} 創建測試檔案"
                })
        
        # 計算覆蓋率
        if results["total_fr_ids"] > 0:
            results["coverage_percentage"] = (results["tested_fr_ids"] / results["total_fr_ids"]) * 100
        
        # 生成驗證報告
        results["validation_report"] = self.generate_report(results)
        
        return results
    
    def has_test_for_fr_id(self, fr_id: str) -> bool:
        """檢查是否有對應的測試檔案"""
        if not self.tests_dir.exists():
            return False
            
        # 搜尋測試檔案中的 FR-ID
        for test_file in self.tests_dir.rglob("*.py"):
            try:
                content = test_file.read_text(encoding='utf-8')
                if fr_id in content:
                    return True
            except Exception as e:
                print(f"讀取測試檔案時出錯: {test_file}, 錯誤: {e}")
        
        return False
    
    def generate_report(self, results: Dict[str, Any]) -> List[str]:
        """生成驗證報告"""
        report = []
        
        report.append("## 🔍 FR-ID 與測試一致性驗證報告")
        report.append("")
        
        # 總體統計
        report.append(f"### 📊 總體統計")
        report.append(f"- **總 FR-ID 數量**: {results['total_fr_ids']}")
        report.append(f"- **已測試 FR-ID**: {results['tested_fr_ids']}")
        report.append(f"- **未測試 FR-ID**: {len(results['untested_fr_ids'])}")
        report.append(f"- **測試覆蓋率**: {results['coverage_percentage']:.1f}%")
        report.append("")
        
        # 覆蓋率評估
        coverage = results['coverage_percentage']
        if coverage >= 80:
            status = "✅ 優秀"
        elif coverage >= 60:
            status = "🟡 良好"
        elif coverage >= 40:
            status = "🟠 需要改進"
        else:
            status = "🔴 需要大幅改進"
        
        report.append(f"### 📈 覆蓋率評估: {status}")
        report.append("")
        
        # 未測試的 FR-ID 列表
        if results['untested_fr_ids']:
            report.append("### ❌ 未測試的 FR-ID")
            for fr_id in results['untested_fr_ids']:
                report.append(f"- {fr_id}")
            report.append("")
        
        # 建議
        report.append("### 💡 建議")
        if results['missing_tests']:
            report.append("1. **創建缺失的測試檔案**")
            for missing in results['missing_tests'][:5]:  # 只顯示前5個
                report.append(f"   - 為 {missing['fr_id']} 創建測試")
            if len(results['missing_tests']) > 5:
                report.append(f"   - ... 還有 {len(results['missing_tests']) - 5} 個需要處理")
        else:
            report.append("✅ 所有 FR-ID 都有對應的測試檔案")
        
        report.append("")
        report.append("2. **提高測試覆蓋率**")
        if coverage < 80:
            report.append(f"   - 目標覆蓋率: 80% (當前: {coverage:.1f}%)")
            report.append(f"   - 需要增加 {80 - coverage:.1f}% 的覆蓋率")
        else:
            report.append("   - 測試覆蓋率已達到目標")
        
        return report
    
    def save_results(self, results: Dict[str, Any], output_file: str = "temp/validation_report.md"):
        """保存驗證結果"""
        os.makedirs("temp", exist_ok=True)
        
        # 保存 JSON 格式的結果
        json_file = output_file.replace(".md", ".json")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        # 保存 Markdown 格式的報告
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(results['validation_report']))
        
        print(f"驗證結果已保存到: {json_file}")
        print(f"驗證報告已保存到: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='驗證 FR-ID 與測試檔案的一致性')
    parser.add_argument('--fr-ids', type=str, default='[]', help='FR-ID 列表 (JSON 格式)')
    parser.add_argument('--test-coverage', type=str, default='{}', help='測試覆蓋率數據 (JSON 格式)')
    parser.add_argument('--output', type=str, default='temp/validation_report.md', help='輸出檔案路徑')
    
    args = parser.parse_args()
    
    try:
        # 解析輸入參數
        fr_ids = json.loads(args.fr_ids) if args.fr_ids else []
        test_coverage = json.loads(args.test_coverage) if args.test_coverage else {}
        
        # 創建驗證器
        validator = ConsistencyValidator()
        
        # 執行驗證
        print("開始驗證 FR-ID 與測試檔案的一致性...")
        results = validator.validate_consistency(fr_ids, test_coverage)
        
        # 保存結果
        validator.save_results(results, args.output)
        
        # 輸出摘要
        print(f"\n驗證完成!")
        print(f"總 FR-ID: {results['total_fr_ids']}")
        print(f"已測試: {results['tested_fr_ids']}")
        print(f"覆蓋率: {results['coverage_percentage']:.1f}%")
        
        # 如果有未測試的 FR-ID，顯示警告
        if results['untested_fr_ids']:
            print(f"\n⚠️  發現 {len(results['untested_fr_ids'])} 個未測試的 FR-ID")
            for fr_id in results['untested_fr_ids'][:3]:  # 只顯示前3個
                print(f"   - {fr_id}")
            if len(results['untested_fr_ids']) > 3:
                print(f"   - ... 還有 {len(results['untested_fr_ids']) - 3} 個")
        
    except Exception as e:
        print(f"驗證過程中發生錯誤: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
