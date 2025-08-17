#!/usr/bin/env python3
"""
生成可視化儀表板的腳本
建立互動式 MPM 儀表板和圖表
"""

import os
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import seaborn as sns
from matplotlib.patches import Circle, Rectangle
import numpy as np

class DashboardGenerator:
    def __init__(self):
        self.output_dir = Path("docs/dashboard")
        self.output_dir.mkdir(exist_ok=True)
        
        # 設定中文字體
        plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False
        
        # 設定顏色主題
        self.colors = {
            'completed': '#10B981',
            'in_progress': '#F59E0B', 
            'draft': '#3B82F6',
            'not_started': '#EF4444',
            'error': '#F97316'
        }
    
    def generate_dashboard(self, mpm_data: Dict[str, Any]):
        """生成完整的儀表板"""
        print("開始生成儀表板...")
        
        # 生成各種圖表
        self.generate_progress_overview(mpm_data)
        self.generate_module_status_chart(mpm_data)
        self.generate_timeline_chart(mpm_data)
        self.generate_heatmap(mpm_data)
        
        # 生成 Mermaid 圖表
        self.generate_mermaid_charts(mpm_data)
        
        # 生成統計報告
        self.generate_statistics_report(mpm_data)
        
        print("儀表板生成完成！")
    
    def generate_progress_overview(self, data: Dict[str, Any]):
        """生成進度概覽圖"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # 圓餅圖 - 進度分布
        labels = ['已完成', '開發中', '草稿', '未開始']
        sizes = [
            data.get('completed_fr_ids', 0),
            data.get('in_progress_fr_ids', 0),
            data.get('draft_fr_ids', 0),
            data.get('not_started_fr_ids', 0)
        ]
        colors = [self.colors['completed'], self.colors['in_progress'], 
                 self.colors['draft'], self.colors['not_started']]
        
        wedges, texts, autotexts = ax1.pie(sizes, labels=labels, colors=colors, 
                                          autopct='%1.1f%%', startangle=90)
        ax1.set_title('進度分布', fontsize=14, fontweight='bold')
        
        # 進度條 - 整體進度
        overall_progress = data.get('overall_progress', 0)
        ax2.barh(['整體進度'], [overall_progress], color=self.colors['completed'], height=0.3)
        ax2.set_xlim(0, 100)
        ax2.set_xlabel('進度 (%)')
        ax2.set_title(f'整體進度: {overall_progress}%', fontsize=14, fontweight='bold')
        
        # 添加進度文字
        ax2.text(overall_progress + 2, 0, f'{overall_progress}%', 
                va='center', fontsize=12, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'progress_overview.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_module_status_chart(self, data: Dict[str, Any]):
        """生成模組狀態圖表"""
        modules = data.get('modules', {})
        
        if not modules:
            return
        
        # 準備數據
        module_names = []
        progress_values = []
        status_colors = []
        
        for module_name, module_data in modules.items():
            module_names.append(module_name.split('-')[1] if '-' in module_name else module_name)
            
            # 計算模組進度
            submodules = module_data.get('submodules', [])
            total = len(submodules)
            completed = sum(1 for sub in submodules if sub.get('status') == '✅ 完成')
            progress = (completed / total * 100) if total > 0 else 0
            progress_values.append(progress)
            
            # 根據進度決定顏色
            if progress == 100:
                status_colors.append(self.colors['completed'])
            elif progress > 50:
                status_colors.append(self.colors['in_progress'])
            elif progress > 0:
                status_colors.append(self.colors['draft'])
            else:
                status_colors.append(self.colors['not_started'])
        
        # 建立圖表
        fig, ax = plt.subplots(figsize=(12, 8))
        
        bars = ax.barh(module_names, progress_values, color=status_colors, height=0.6)
        ax.set_xlim(0, 100)
        ax.set_xlabel('進度 (%)')
        ax.set_title('各模組進度狀態', fontsize=16, fontweight='bold')
        
        # 添加進度標籤
        for i, (bar, progress) in enumerate(zip(bars, progress_values)):
            ax.text(progress + 1, bar.get_y() + bar.get_height()/2, 
                   f'{progress:.1f}%', va='center', fontsize=10)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'module_status.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_timeline_chart(self, data: Dict[str, Any]):
        """生成時間軸圖表"""
        fig, ax = plt.subplots(figsize=(14, 8))
        
        # 模擬時間軸數據
        modules = list(data.get('modules', {}).keys())[:12]
        start_dates = [datetime(2024, 1, 1 + i*30) for i in range(len(modules))]
        end_dates = [datetime(2024, 12, 31) for _ in modules]
        
        # 繪製時間軸
        for i, (module, start, end) in enumerate(zip(modules, start_dates, end_dates)):
            module_name = module.split('-')[1] if '-' in module else module
            y_pos = len(modules) - i - 1
            
            # 時間軸線
            ax.plot([start, end], [y_pos, y_pos], 'k-', linewidth=2)
            
            # 開始點
            ax.plot(start, y_pos, 'o', markersize=8, color=self.colors['draft'])
            
            # 結束點
            ax.plot(end, y_pos, 's', markersize=8, color=self.colors['completed'])
            
            # 模組標籤
            ax.text(start, y_pos + 0.2, module_name, fontsize=10, va='bottom')
        
        ax.set_ylim(-0.5, len(modules) - 0.5)
        ax.set_xlabel('時間')
        ax.set_title('專案時間軸', fontsize=16, fontweight='bold')
        ax.grid(True, alpha=0.3)
        
        # 格式化日期軸
        ax.xaxis.set_major_locator(plt.MonthLocator(interval=2))
        ax.xaxis.set_major_formatter(plt.DateFormatter('%Y-%m'))
        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'timeline.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_heatmap(self, data: Dict[str, Any]):
        """生成熱力圖"""
        modules = data.get('modules', {})
        
        if not modules:
            return
        
        # 準備熱力圖數據
        module_names = []
        metrics = ['PRD狀態', '程式碼狀態', '測試覆蓋率', '錯誤數量']
        heatmap_data = []
        
        for module_name, module_data in modules.items():
            module_names.append(module_name.split('-')[1] if '-' in module_name else module_name)
            
            # 計算各項指標
            submodules = module_data.get('submodules', [])
            total = len(submodules)
            
            # PRD 完成率
            prd_completed = sum(1 for sub in submodules if '完成' in sub.get('status', ''))
            prd_rate = prd_completed / total if total > 0 else 0
            
            # 程式碼完成率 (模擬)
            code_rate = prd_rate * 0.8  # 假設程式碼進度略低於 PRD
            
            # 測試覆蓋率 (模擬)
            test_rate = code_rate * 0.9  # 假設測試覆蓋率為程式碼進度的 90%
            
            # 錯誤數量 (模擬，數值越小越好)
            error_rate = max(0, 1 - code_rate)  # 進度越高，錯誤越少
            
            heatmap_data.append([prd_rate, code_rate, test_rate, error_rate])
        
        # 建立熱力圖
        fig, ax = plt.subplots(figsize=(10, 8))
        
        im = ax.imshow(heatmap_data, cmap='RdYlGn', aspect='auto')
        
        # 設定標籤
        ax.set_xticks(range(len(metrics)))
        ax.set_yticks(range(len(module_names)))
        ax.set_xticklabels(metrics)
        ax.set_yticklabels(module_names)
        
        # 添加數值標籤
        for i in range(len(module_names)):
            for j in range(len(metrics)):
                text = ax.text(j, i, f'{heatmap_data[i][j]:.1f}',
                             ha="center", va="center", color="black", fontsize=8)
        
        ax.set_title('模組品質熱力圖', fontsize=16, fontweight='bold')
        plt.colorbar(im, ax=ax, label='完成率')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'heatmap.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_mermaid_charts(self, data: Dict[str, Any]):
        """生成 Mermaid 圖表"""
        mermaid_content = []
        
        # 進度流程圖
        progress_flow = """
```mermaid
graph TD
    A[PRD 文件] --> B[程式碼開發]
    B --> C[單元測試]
    C --> D[整合測試]
    D --> E[錯誤修復]
    E --> F[上線部署]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
```
"""
        mermaid_content.append(("進度流程圖", progress_flow))
        
        # 模組關係圖
        modules = list(data.get('modules', {}).keys())[:6]  # 限制顯示數量
        module_relations = "```mermaid\ngraph LR\n"
        
        for i, module in enumerate(modules):
            module_name = module.split('-')[1] if '-' in module else module
            module_relations += f"    A{i}[{module_name}]\n"
        
        # 添加連接關係
        for i in range(len(modules) - 1):
            module_relations += f"    A{i} --> A{i+1}\n"
        
        module_relations += "```"
        mermaid_content.append(("模組關係圖", module_relations))
        
        # 保存 Mermaid 圖表
        mermaid_file = self.output_dir / 'mermaid_charts.md'
        with open(mermaid_file, 'w', encoding='utf-8') as f:
            f.write("# MPM 儀表板 - Mermaid 圖表\n\n")
            for title, content in mermaid_content:
                f.write(f"## {title}\n\n{content}\n\n")
    
    def generate_statistics_report(self, data: Dict[str, Any]):
        """生成統計報告"""
        report = {
            "生成時間": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "整體統計": {
                "總模組數": data.get('total_modules', 12),
                "總子模組數": data.get('total_fr_ids', 54),
                "整體進度": f"{data.get('overall_progress', 0)}%",
                "已完成數量": data.get('completed_fr_ids', 0),
                "開發中數量": data.get('in_progress_fr_ids', 0),
                "草稿數量": data.get('draft_fr_ids', 0),
                "未開始數量": data.get('not_started_fr_ids', 0)
            },
            "模組詳細統計": {}
        }
        
        # 添加各模組統計
        for module_name, module_data in data.get('modules', {}).items():
            submodules = module_data.get('submodules', [])
            total = len(submodules)
            completed = sum(1 for sub in submodules if '完成' in sub.get('status', ''))
            
            report["模組詳細統計"][module_name] = {
                "子模組數": total,
                "完成數": completed,
                "進度": f"{(completed/total*100):.1f}%" if total > 0 else "0%"
            }
        
        # 保存統計報告
        stats_file = self.output_dir / 'statistics.json'
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成 Markdown 報告
        md_report = self.output_dir / 'statistics_report.md'
        with open(md_report, 'w', encoding='utf-8') as f:
            f.write("# MPM 統計報告\n\n")
            f.write(f"**生成時間**: {report['生成時間']}\n\n")
            
            f.write("## 整體統計\n\n")
            for key, value in report['整體統計'].items():
                f.write(f"- **{key}**: {value}\n")
            
            f.write("\n## 模組詳細統計\n\n")
            for module_name, stats in report['模組詳細統計'].items():
                f.write(f"### {module_name}\n\n")
                for key, value in stats.items():
                    f.write(f"- **{key}**: {value}\n")
                f.write("\n")

def main():
    parser = argparse.ArgumentParser(description="生成可視化儀表板")
    parser.add_argument("--mpm-data", default="temp/mpm_data.json", help="MPM 數據檔案")
    parser.add_argument("--output", default="docs/dashboard", help="輸出目錄")
    
    args = parser.parse_args()
    
    # 建立生成器
    generator = DashboardGenerator()
    generator.output_dir = Path(args.output)
    generator.output_dir.mkdir(exist_ok=True)
    
    # 載入數據
    try:
        with open(args.mpm_data, 'r', encoding='utf-8') as f:
            mpm_data = json.load(f)
    except FileNotFoundError:
        print(f"找不到數據檔案: {args.mpm_data}")
        print("使用模擬數據生成儀表板...")
        mpm_data = {
            "total_modules": 12,
            "total_fr_ids": 54,
            "overall_progress": 15.5,
            "completed_fr_ids": 0,
            "in_progress_fr_ids": 8,
            "draft_fr_ids": 46,
            "not_started_fr_ids": 0,
            "modules": {}
        }
    
    # 生成儀表板
    generator.generate_dashboard(mpm_data)
    
    print(f"儀表板已生成到: {generator.output_dir}")

if __name__ == "__main__":
    main() 