/**
 * 趨勢分析視圖
 */

export class TrendsView {
    constructor(app) {
        this.app = app;
        this.trendAnalysis = null;
        this.charts = {};
    }
    
    /**
     * 初始化趨勢分析
     */
    init(trendAnalysis) {
        this.trendAnalysis = trendAnalysis;
    }
    
    /**
     * 顯示趨勢分析
     */
    show() {
        // 記錄當前快照
        this.trendAnalysis.recordSnapshot();
        
        const trends = this.trendAnalysis.analyzeTrends(30);
        const history = this.trendAnalysis.getHistoryRange(30);
        
        if (!trends || history.length < 2) {
            this.showNoDataMessage();
            return;
        }
        
        const content = `
            <div class="space-y-6">
                <!-- 趨勢摘要 -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${this.renderSummaryCards(trends)}
                </div>
                
                <!-- 進度趨勢圖 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">30天進度趨勢</h3>
                    <div class="relative h-64">
                        <canvas id="trend-chart"></canvas>
                    </div>
                </div>
                
                <!-- 模組進度熱力圖 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">模組進度熱力圖</h3>
                    <div id="module-heatmap" class="overflow-x-auto">
                        <!-- 熱力圖將在這裡渲染 -->
                    </div>
                </div>
                
                <!-- 詳細分析 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">模組進度變化</h3>
                    ${this.renderModuleTrends(trends.moduleTrends)}
                </div>
                
                <!-- 操作按鈕 -->
                <div class="flex justify-end space-x-3">
                    <button onclick="window.trackingApp.trendAnalysis.exportTrendReport()"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all">
                        <i class="fas fa-download mr-2"></i>導出趨勢報告
                    </button>
                    <button onclick="window.trackingApp.closeModal()"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all">
                        關閉
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal('歷史趨勢分析', content, 'max-w-4xl');
        
        // 延遲渲染圖表，確保DOM已準備好
        setTimeout(() => {
            this.renderTrendChart();
            this.renderHeatmap();
        }, 100);
    }
    
    /**
     * 顯示無數據提示
     */
    showNoDataMessage() {
        const content = `
            <div class="text-center py-12">
                <i class="fas fa-chart-line text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">歷史數據不足</h3>
                <p class="text-gray-500">系統需要至少2天的數據才能進行趨勢分析</p>
                <p class="text-sm text-gray-400 mt-4">系統會自動記錄每日進度，請稍後再查看</p>
                <button onclick="window.trackingApp.closeModal()"
                        class="mt-6 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all">
                    關閉
                </button>
            </div>
        `;
        
        this.app.showModal('歷史趨勢分析', content);
    }
    
    /**
     * 渲染摘要卡片
     */
    renderSummaryCards(trends) {
        const cards = [
            {
                title: '30天進度變化',
                value: `${trends.overallTrend.change >= 0 ? '+' : ''}${trends.overallTrend.change.toFixed(1)}%`,
                icon: trends.overallTrend.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down',
                color: trends.overallTrend.change >= 0 ? 'green' : 'red',
                subtitle: `從 ${trends.overallTrend.startProgress.toFixed(1)}% 到 ${trends.overallTrend.currentProgress.toFixed(1)}%`
            },
            {
                title: '日均進度',
                value: `${trends.completionRate ? trends.completionRate.toFixed(2) : '0.00'}%`,
                icon: 'fa-tachometer-alt',
                color: 'blue',
                subtitle: '過去7天平均'
            },
            {
                title: '預計完成',
                value: trends.projectedCompletion ? 
                    `${trends.projectedCompletion.daysRemaining}天` : 
                    '無法預測',
                icon: 'fa-calendar-check',
                color: 'purple',
                subtitle: trends.projectedCompletion ? 
                    `${trends.projectedCompletion.projectedDate} (${trends.projectedCompletion.confidence}信心度)` : 
                    '進度數據不足'
            }
        ];
        
        return cards.map(card => `
            <div class="bg-${card.color}-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-700">${card.title}</h4>
                    <i class="fas ${card.icon} text-${card.color}-500"></i>
                </div>
                <p class="text-2xl font-bold text-${card.color}-700">${card.value}</p>
                <p class="text-xs text-gray-600 mt-1">${card.subtitle}</p>
            </div>
        `).join('');
    }
    
    /**
     * 渲染模組趨勢
     */
    renderModuleTrends(moduleTrends) {
        const sortedTrends = moduleTrends.sort((a, b) => b.change - a.change);
        const topMovers = sortedTrends.slice(0, 5);
        const bottomMovers = sortedTrends.slice(-5).reverse();
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">進度最快的模組</h4>
                    <div class="space-y-2">
                        ${topMovers.map(module => this.renderModuleTrendItem(module, 'positive')).join('')}
                    </div>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">需要關注的模組</h4>
                    <div class="space-y-2">
                        ${bottomMovers.map(module => this.renderModuleTrendItem(module, 'negative')).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染單個模組趨勢項
     */
    renderModuleTrendItem(module, type) {
        const color = type === 'positive' ? 'green' : 'orange';
        const icon = module.trend === 'up' ? 'fa-arrow-up' : 
                     module.trend === 'down' ? 'fa-arrow-down' : 'fa-minus';
        
        return `
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="font-medium">${module.code}</span>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">
                        ${module.startProgress}% → ${module.currentProgress}%
                    </span>
                    <span class="text-${color}-600 font-medium">
                        <i class="fas ${icon} text-xs"></i>
                        ${Math.abs(module.change).toFixed(1)}%
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染趨勢圖表
     */
    renderTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;
        
        const chartData = this.trendAnalysis.generateChartData(30);
        
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }
        
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '日期'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '進度 (%)'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }
    
    /**
     * 渲染熱力圖
     */
    renderHeatmap() {
        const container = document.getElementById('module-heatmap');
        if (!container) return;
        
        const heatmapData = this.trendAnalysis.generateHeatmapData(30);
        const dates = this.trendAnalysis.getHistoryRange(30).map(h => h.date);
        
        let html = '<table class="w-full text-xs">';
        
        // 標題行
        html += '<thead><tr class="text-left"><th class="py-2 px-1 sticky left-0 bg-white">模組</th>';
        dates.forEach(date => {
            html += `<th class="py-2 px-1 text-center">${date.substring(5)}</th>`;
        });
        html += '</tr></thead>';
        
        // 數據行
        html += '<tbody>';
        heatmapData.forEach(module => {
            html += `<tr><td class="py-1 px-1 font-medium sticky left-0 bg-white">${module.code}</td>`;
            module.data.forEach(data => {
                const color = this.getHeatmapColor(data.progress);
                html += `<td class="py-1 px-1 text-center" style="background-color: ${color}">${data.progress}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        container.innerHTML = html;
    }
    
    /**
     * 獲取熱力圖顏色
     */
    getHeatmapColor(progress) {
        if (progress >= 100) return '#10B981';
        if (progress >= 80) return '#34D399';
        if (progress >= 60) return '#6EE7B7';
        if (progress >= 40) return '#FDE047';
        if (progress >= 20) return '#FCA5A5';
        return '#F87171';
    }
}