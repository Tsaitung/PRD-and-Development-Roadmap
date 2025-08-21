#!/usr/bin/env python3
"""
PRD品質驗證腳本
用於驗證所有PRD文件是否符合標準格式要求
"""

import os
import re
import yaml
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import sys

class PRDValidator:
    """PRD文件驗證器"""
    
    def __init__(self, prd_dir: str = "PRD"):
        self.prd_dir = Path(prd_dir)
        self.validation_results = []
        self.total_checks = 0
        self.passed_checks = 0
        
        # 定義必填欄位
        self.required_fields = {
            'module_info': [
                '模組代碼', '模組名稱', '負責人', 
                '最後更新', '版本'
            ],
            'fr_fields': [
                '條件/觸發', '行為', '資料輸入', 
                '資料輸出', 'UI反應', '例外處理', '優先級'
            ],
            'api_fields': [
                'API 端點', '請求/回應', '數據模型', 
                '權限要求', '認證方式'
            ]
        }
        
        # FR-ID格式正則表達式
        self.fr_id_pattern = re.compile(
            r'^FR-[A-Z]{2,4}(-[A-Z]{2,5})*-\d{3}$'
        )
        
        # 狀態標記
        self.valid_statuses = ['🔴 未開始', '🟡 開發中', '✅ 完成', '⚪ 規劃中']
        
    def validate_prd_file(self, file_path: Path) -> Dict:
        """驗證單個PRD文件"""
        result = {
            'file': str(file_path),
            'module': file_path.parent.name,
            'checks': {},
            'errors': [],
            'warnings': [],
            'score': 0
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 1. 檢查模組資訊
            result['checks']['module_info'] = self._check_module_info(content)
            
            # 2. 檢查FR-ID格式
            result['checks']['fr_ids'] = self._check_fr_ids(content)
            
            # 3. 檢查功能需求完整性
            result['checks']['fr_completeness'] = self._check_fr_completeness(content)
            
            # 4. 檢查驗收標準格式
            result['checks']['acceptance_criteria'] = self._check_acceptance_criteria(content)
            
            # 5. 檢查API規格
            result['checks']['api_spec'] = self._check_api_spec(content)
            
            # 6. 檢查資料模型
            result['checks']['data_model'] = self._check_data_model(content)
            
            # 7. 檢查測試檔案對應
            result['checks']['test_mapping'] = self._check_test_mapping(file_path, content)
            
            # 8. 檢查狀態標記一致性
            result['checks']['status_consistency'] = self._check_status_consistency(content)
            
            # 計算總分
            total_checks = sum(1 for check in result['checks'].values())
            passed_checks = sum(1 for check in result['checks'].values() if check['passed'])
            result['score'] = (passed_checks / total_checks * 100) if total_checks > 0 else 0
            
        except Exception as e:
            result['errors'].append(f"檔案讀取錯誤: {str(e)}")
            result['score'] = 0
            
        return result
    
    def _check_module_info(self, content: str) -> Dict:
        """檢查模組資訊完整性"""
        check_result = {'passed': True, 'missing': [], 'details': {}}
        
        for field in self.required_fields['module_info']:
            pattern = re.compile(f'[-*]\\s*\\*\\*{field}\\*\\*\\s*[:：]\\s*(.+)', re.MULTILINE)
            match = pattern.search(content)
            
            if match:
                check_result['details'][field] = match.group(1).strip()
            else:
                check_result['passed'] = False
                check_result['missing'].append(field)
                
        # 檢查版本號格式
        if '版本' in check_result['details']:
            version = check_result['details']['版本']
            if not re.match(r'^v\d+\.\d+\.\d+$', version):
                check_result['passed'] = False
                check_result['missing'].append('版本號格式錯誤(應為vX.X.X)')
                
        return check_result
    
    def _check_fr_ids(self, content: str) -> Dict:
        """檢查FR-ID格式正確性"""
        check_result = {'passed': True, 'invalid': [], 'duplicates': []}
        
        # 找出所有FR-ID
        fr_pattern = re.compile(r'###?\s*(FR-[A-Z0-9-]+)', re.MULTILINE)
        fr_ids = fr_pattern.findall(content)
        
        # 檢查格式
        for fr_id in fr_ids:
            if not self.fr_id_pattern.match(fr_id):
                check_result['passed'] = False
                check_result['invalid'].append(fr_id)
        
        # 檢查重複
        seen = set()
        for fr_id in fr_ids:
            if fr_id in seen:
                check_result['passed'] = False
                if fr_id not in check_result['duplicates']:
                    check_result['duplicates'].append(fr_id)
            seen.add(fr_id)
            
        check_result['total'] = len(fr_ids)
        check_result['unique'] = len(seen)
        
        return check_result
    
    def _check_fr_completeness(self, content: str) -> Dict:
        """檢查功能需求七大必填欄位"""
        check_result = {'passed': True, 'incomplete_frs': {}}
        
        # 找出所有FR區塊
        fr_blocks = re.split(r'###?\s*FR-[A-Z0-9-]+', content)[1:]
        fr_ids = re.findall(r'###?\s*(FR-[A-Z0-9-]+)', content)
        
        for i, (fr_id, block) in enumerate(zip(fr_ids, fr_blocks)):
            missing_fields = []
            
            for field in self.required_fields['fr_fields']:
                pattern = re.compile(f'[-*]\\s*\\*\\*{field}\\*\\*\\s*[:：]', re.MULTILINE)
                if not pattern.search(block):
                    missing_fields.append(field)
                    
            if missing_fields:
                check_result['passed'] = False
                check_result['incomplete_frs'][fr_id] = missing_fields
                
        return check_result
    
    def _check_acceptance_criteria(self, content: str) -> Dict:
        """檢查驗收標準YAML格式"""
        check_result = {'passed': True, 'invalid_yaml': [], 'missing_ac': []}
        
        # 找出所有驗收標準區塊
        ac_pattern = re.compile(
            r'\*\*驗收標準\*\*.*?```yaml(.*?)```', 
            re.DOTALL | re.MULTILINE
        )
        ac_blocks = ac_pattern.findall(content)
        
        # 找出所有FR-ID
        fr_ids = re.findall(r'###?\s*(FR-[A-Z0-9-]+)', content)
        
        # 檢查每個FR是否有驗收標準
        if len(ac_blocks) < len(fr_ids):
            check_result['passed'] = False
            check_result['missing_ac'] = fr_ids[len(ac_blocks):]
        
        # 驗證YAML格式
        for i, yaml_content in enumerate(ac_blocks):
            try:
                criteria = yaml.safe_load(yaml_content)
                if not isinstance(criteria, list) or len(criteria) < 3:
                    check_result['passed'] = False
                    check_result['invalid_yaml'].append(f"FR {i+1}: 需要至少3個驗收標準")
            except yaml.YAMLError as e:
                check_result['passed'] = False
                check_result['invalid_yaml'].append(f"FR {i+1}: YAML格式錯誤")
                
        return check_result
    
    def _check_api_spec(self, content: str) -> Dict:
        """檢查API規格完整性"""
        check_result = {'passed': True, 'missing': []}
        
        # 檢查是否有API設計章節
        if 'API 設計' not in content and 'API設計' not in content:
            check_result['passed'] = False
            check_result['missing'].append('缺少API設計章節')
            return check_result
        
        # 檢查必要的API欄位
        for field in self.required_fields['api_fields']:
            if field not in content:
                check_result['passed'] = False
                check_result['missing'].append(field)
                
        # 檢查是否有端點定義
        endpoint_pattern = re.compile(r'(GET|POST|PUT|DELETE|PATCH)\s+/api/v\d+/', re.MULTILINE)
        if not endpoint_pattern.search(content):
            check_result['passed'] = False
            check_result['missing'].append('缺少API端點定義')
            
        return check_result
    
    def _check_data_model(self, content: str) -> Dict:
        """檢查資料模型定義"""
        check_result = {'passed': True, 'missing': []}
        
        # 檢查TypeScript介面定義
        ts_pattern = re.compile(r'interface\s+\w+\s*{', re.MULTILINE)
        if not ts_pattern.search(content):
            check_result['passed'] = False
            check_result['missing'].append('缺少TypeScript介面定義')
            
        # 檢查SQL建表語句
        sql_pattern = re.compile(r'CREATE\s+TABLE\s+\w+', re.IGNORECASE | re.MULTILINE)
        if not sql_pattern.search(content):
            check_result['passed'] = False
            check_result['missing'].append('缺少SQL建表語句')
            
        return check_result
    
    def _check_test_mapping(self, file_path: Path, content: str) -> Dict:
        """檢查測試檔案對應"""
        check_result = {'passed': True, 'missing_tests': []}
        
        # 獲取測試目錄
        test_dir = file_path.parent / 'tests'
        
        # 檢查測試目錄是否存在
        if not test_dir.exists():
            check_result['passed'] = False
            check_result['missing_tests'].append('測試目錄不存在')
            return check_result
        
        # 檢查必要的測試子目錄
        required_test_dirs = ['unit', 'integration', 'e2e']
        for test_type in required_test_dirs:
            test_subdir = test_dir / test_type
            if not test_subdir.exists():
                check_result['passed'] = False
                check_result['missing_tests'].append(f'{test_type}測試目錄不存在')
            elif not list(test_subdir.glob('*.test.*')) and not list(test_subdir.glob('*.spec.*')):
                check_result['passed'] = False
                check_result['missing_tests'].append(f'{test_type}測試檔案不存在')
                
        return check_result
    
    def _check_status_consistency(self, content: str) -> Dict:
        """檢查狀態標記一致性"""
        check_result = {'passed': True, 'invalid_statuses': []}
        
        # 找出所有狀態標記
        status_pattern = re.compile(r'\*\*狀態\*\*\s*[:：]\s*([^\n]+)', re.MULTILINE)
        statuses = status_pattern.findall(content)
        
        for status in statuses:
            status = status.strip()
            # 檢查是否為有效狀態
            if not any(valid in status for valid in self.valid_statuses):
                check_result['passed'] = False
                check_result['invalid_statuses'].append(status)
                
        return check_result
    
    def validate_all_prds(self) -> Dict:
        """驗證所有PRD文件"""
        all_results = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_files': 0,
                'passed_files': 0,
                'failed_files': 0,
                'average_score': 0
            },
            'files': [],
            'errors_by_type': {},
            'recommendations': []
        }
        
        # 找出所有PRD文件
        prd_files = list(self.prd_dir.glob('**/prd.md')) + list(self.prd_dir.glob('**/README.md'))
        
        total_score = 0
        for prd_file in prd_files:
            result = self.validate_prd_file(prd_file)
            all_results['files'].append(result)
            
            total_score += result['score']
            all_results['summary']['total_files'] += 1
            
            if result['score'] == 100:
                all_results['summary']['passed_files'] += 1
            else:
                all_results['summary']['failed_files'] += 1
                
            # 收集錯誤類型
            for check_name, check_result in result['checks'].items():
                if not check_result.get('passed', True):
                    if check_name not in all_results['errors_by_type']:
                        all_results['errors_by_type'][check_name] = []
                    all_results['errors_by_type'][check_name].append(result['file'])
                    
        # 計算平均分
        if all_results['summary']['total_files'] > 0:
            all_results['summary']['average_score'] = total_score / all_results['summary']['total_files']
        
        # 生成建議
        all_results['recommendations'] = self._generate_recommendations(all_results)
        
        return all_results
    
    def _generate_recommendations(self, results: Dict) -> List[str]:
        """生成改進建議"""
        recommendations = []
        
        if 'module_info' in results['errors_by_type']:
            recommendations.append("優先完善模組資訊欄位，確保版本號格式正確(vX.X.X)")
            
        if 'fr_ids' in results['errors_by_type']:
            recommendations.append("檢查並修正FR-ID格式，確保符合FR-[模組]-[子模組]-[序號]格式")
            
        if 'fr_completeness' in results['errors_by_type']:
            recommendations.append("補充功能需求的七大必填欄位，特別注意條件/觸發和例外處理")
            
        if 'acceptance_criteria' in results['errors_by_type']:
            recommendations.append("使用YAML格式撰寫驗收標準，每個FR至少包含3個驗收條件")
            
        if 'api_spec' in results['errors_by_type']:
            recommendations.append("完善API規格定義，包含端點、請求/回應格式和認證方式")
            
        if 'data_model' in results['errors_by_type']:
            recommendations.append("添加TypeScript介面定義和SQL建表語句")
            
        if 'test_mapping' in results['errors_by_type']:
            recommendations.append("創建對應的測試目錄結構(unit/integration/e2e)")
            
        return recommendations
    
    def generate_report(self, results: Dict, output_format: str = 'markdown') -> str:
        """生成驗證報告"""
        if output_format == 'markdown':
            return self._generate_markdown_report(results)
        elif output_format == 'json':
            return json.dumps(results, indent=2, ensure_ascii=False)
        else:
            raise ValueError(f"不支援的輸出格式: {output_format}")
            
    def _generate_markdown_report(self, results: Dict) -> str:
        """生成Markdown格式報告"""
        report = []
        report.append(f"# PRD品質驗證報告")
        report.append(f"\n**驗證時間**: {results['timestamp']}")
        report.append(f"\n## 📊 總體統計\n")
        
        summary = results['summary']
        report.append(f"- **檢查檔案數**: {summary['total_files']}")
        report.append(f"- **通過檔案數**: {summary['passed_files']} ({summary['passed_files']/max(1,summary['total_files'])*100:.1f}%)")
        report.append(f"- **失敗檔案數**: {summary['failed_files']}")
        report.append(f"- **平均分數**: {summary['average_score']:.1f}/100")
        
        # 錯誤類型統計
        if results['errors_by_type']:
            report.append(f"\n## ❌ 錯誤類型分析\n")
            for error_type, files in results['errors_by_type'].items():
                report.append(f"\n### {error_type}")
                report.append(f"受影響檔案數: {len(files)}")
                for file in files[:5]:  # 只顯示前5個
                    report.append(f"- {file}")
                if len(files) > 5:
                    report.append(f"- ...還有{len(files)-5}個檔案")
                    
        # 檔案詳情
        report.append(f"\n## 📝 檔案詳情\n")
        
        # 先顯示失敗的檔案
        failed_files = [f for f in results['files'] if f['score'] < 100]
        if failed_files:
            report.append(f"\n### 需要修正的檔案\n")
            for file_result in failed_files[:10]:  # 只顯示前10個
                report.append(f"\n#### {file_result['file']}")
                report.append(f"- **分數**: {file_result['score']:.1f}/100")
                report.append(f"- **問題**:")
                
                for check_name, check_result in file_result['checks'].items():
                    if not check_result.get('passed', True):
                        report.append(f"  - ❌ {check_name}")
                        if 'missing' in check_result:
                            report.append(f"    - 缺少: {', '.join(check_result['missing'])}")
                        if 'invalid' in check_result:
                            report.append(f"    - 無效: {', '.join(check_result['invalid'])}")
                            
        # 建議
        if results['recommendations']:
            report.append(f"\n## 💡 改進建議\n")
            for i, rec in enumerate(results['recommendations'], 1):
                report.append(f"{i}. {rec}")
                
        # 成功的檔案
        passed_files = [f for f in results['files'] if f['score'] == 100]
        if passed_files:
            report.append(f"\n## ✅ 合格檔案 ({len(passed_files)}個)\n")
            for file_result in passed_files[:20]:  # 只顯示前20個
                report.append(f"- {file_result['file']}")
                
        return '\n'.join(report)
    
def main():
    """主函數"""
    import argparse
    
    parser = argparse.ArgumentParser(description='PRD品質驗證工具')
    parser.add_argument('--dir', default='PRD', help='PRD目錄路徑')
    parser.add_argument('--output', default='markdown', choices=['markdown', 'json'], help='輸出格式')
    parser.add_argument('--file', help='驗證單個檔案')
    parser.add_argument('--save', help='儲存報告到檔案')
    
    args = parser.parse_args()
    
    validator = PRDValidator(args.dir)
    
    if args.file:
        # 驗證單個檔案
        result = validator.validate_prd_file(Path(args.file))
        results = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_files': 1,
                'passed_files': 1 if result['score'] == 100 else 0,
                'failed_files': 0 if result['score'] == 100 else 1,
                'average_score': result['score']
            },
            'files': [result],
            'errors_by_type': {},
            'recommendations': []
        }
    else:
        # 驗證所有檔案
        results = validator.validate_all_prds()
        
    # 生成報告
    report = validator.generate_report(results, args.output)
    
    # 輸出或儲存報告
    if args.save:
        with open(args.save, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"報告已儲存到: {args.save}")
    else:
        print(report)
        
    # 返回退出碼
    if results['summary']['failed_files'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()