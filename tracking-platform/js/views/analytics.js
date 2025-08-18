/**
 * 進度分析視圖 - 顯示各種分析圖表和熱力圖
 */

export class AnalyticsView {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('analytics-tab');
        this.charts = {};
    }
    
    render() {
        const data = this.app.getData();
        if (!data) return;
        
        // 渲染熱力圖
        this.renderHeatmap(data);
        
        // 渲染圖表
        this.renderCharts(data);
    }
    
    renderHeatmap(data) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;
        
        const dimensions = this.app.dataManager.dimensions.filter(d => 
            d.key !== 'issues' && d.key !== 'progress'
        );
        
        let html = '<table class="w-full">';
        html += '<thead><tr><th class="p-2 text-xs font-medium text-gray-600 text-left">模組</th>';
        
        dimensions.forEach(dim => {
            html += `<th class="p-2 text-xs font-medium text-gray-600 text-center">${dim.name}</th>`;
        });
        html += '<th class="p-2 text-xs font-medium text-gray-600 text-center">進度</th>';
        html += '</tr></thead><tbody>';
        
        data.modules.forEach(module => {
            html += `<tr class="hover:bg-gray-50">`;
            html += `<td class="p-2 text-xs font-medium text-gray-900">${module.code} - ${module.zhName}</td>`;
            
            dimensions.forEach(dim => {
                const status = module.status[dim.key]?.status || '-';
                const statusInfo = this.app.utils.parseStatus(status);
                
                html += `
                    <td class="p-1">
                        <div class="heatmap-cell w-full h-8 rounded flex items-center justify-center text-xs cursor-pointer"
                             style="background-color: ${statusInfo.color}; color: white;"
                             onclick="window.trackingApp.views.analytics.showCellDetails('${module.code}', '${dim.key}')"
                             title="${module.code} - ${dim.name}: ${statusInfo.text}">
                            ${status}
                        </div>
                    </td>
                `;
            });
            
            // 進度列
            const progressColor = module.progress >= 80 ? '#10B981' : 
                               module.progress >= 50 ? '#F59E0B' : 
                               module.progress >= 20 ? '#F97316' : '#EF4444';
            
            html += `
                <td class="p-1">
                    <div class="w-full h-8 bg-gray-200 rounded relative overflow-hidden">
                        <div class="absolute inset-0 flex items-center justify-center z-10 text-xs font-medium">
                            ${module.progress}%
                        </div>
                        <div class="h-full transition-all duration-500"
                             style="width: ${module.progress}%; background-color: ${progressColor}; opacity: 0.8;">
                        </div>
                    </div>
                </td>
            `;
            
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    renderCharts(data) {
        // 銷毀舊圖表
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        
        // 模組進度比較圖
        this.renderModuleProgressChart(data);
        
        // 維度完成率雷達圖
        this.renderDimensionRadarChart(data);
    }
    
    renderModuleProgressChart(data) {
        const ctx = document.getElementById('module-progress-chart');
        if (!ctx) return;
        
        const modules = [...data.modules].sort((a, b) => b.progress - a.progress);
        
        this.charts.moduleProgress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: modules.map(m => m.code),
                datasets: [{
                    label: '上線進度 %',
                    data: modules.map(m => m.progress),
                    backgroundColor: modules.map(m => {
                        if (m.progress >= 80) return 'rgba(16, 185, 129, 0.8)';
                        if (m.progress >= 50) return 'rgba(245, 158, 11, 0.8)';
                        if (m.progress >= 20) return 'rgba(249, 115, 22, 0.8)';
                        return 'rgba(239, 68, 68, 0.8)';
                    }),
                    borderColor: modules.map(m => {
                        if (m.progress >= 80) return 'rgb(16, 185, 129)';
                        if (m.progress >= 50) return 'rgb(245, 158, 11)';
                        if (m.progress >= 20) return 'rgb(249, 115, 22)';
                        return 'rgb(239, 68, 68)';
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const module = modules[context.dataIndex];
                                return [
                                    `${module.zhName}`,
                                    `進度: ${context.parsed.y}%`
                                ];
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const module = modules[index];
                        this.app.views.dashboard.showModuleDetails(module.code);
                    }
                }
            }
        });
    }
    
    renderDimensionRadarChart(data) {
        const ctx = document.getElementById('dimension-radar-chart');
        if (!ctx) return;
        
        const dimensions = this.app.dataManager.dimensions.filter(d => 
            d.key !== 'issues' && d.key !== 'progress'
        );
        
        const dimensionData = dimensions.map(dim => {
            const stats = data.statusDimensions[dim.key];
            if (!stats || stats.total === 0) return 0;
            
            const completed = stats.complete || 0;
            const inProgress = stats.inProgress || 0;
            const total = stats.total;
            
            return Math.round(((completed + inProgress * 0.5) / total) * 100);
        });
        
        this.charts.dimensionRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: dimensions.map(d => d.name),
                datasets: [{
                    label: '完成率',
                    data: dimensionData,
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.r}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    showCellDetails(moduleCode, dimensionKey) {
        const module = this.app.getModule(moduleCode);
        const dimension = this.app.dataManager.dimensions.find(d => d.key === dimensionKey);
        
        if (!module || !dimension) return;
        
        const status = module.status[dimensionKey];
        const statusInfo = this.app.utils.parseStatus(status?.status || '-');
        
        const content = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-medium text-gray-900">${module.code} - ${module.zhName}</h4>
                        <p class="text-sm text-gray-600">${dimension.name}</p>
                    </div>
                    <div class="text-3xl">${status?.status || '-'}</div>
                </div>
                
                <div class="border-t pt-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">狀態</p>
                            <p class="font-medium">${statusInfo.text}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">說明</p>
                            <p class="font-medium">${status?.description || '-'}</p>
                        </div>
                    </div>
                </div>
                
                ${dimensionKey === 'unitTest' || dimensionKey === 'integrationTest' ? `
                    <div class="border-t pt-4">
                        <p class="text-sm text-gray-600 mb-2">測試建議</p>
                        <ul class="list-disc list-inside text-sm space-y-1">
                            <li>建立測試框架和環境</li>
                            <li>撰寫關鍵功能的單元測試</li>
                            <li>設定自動化測試流程</li>
                            <li>追蹤測試覆蓋率</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.app.showModal('狀態詳情', content);
    }
    
    handleResize() {
        // 重新渲染圖表以適應新尺寸
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
    
    destroy() {
        // 銷毀所有圖表
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}