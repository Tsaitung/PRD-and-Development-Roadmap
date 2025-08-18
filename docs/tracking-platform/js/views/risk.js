/**
 * 風險管理視圖 - 顯示風險評估、問題追蹤和預警
 */

export class RiskView {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('risk-tab');
        this.charts = {};
        this.riskThresholds = {
            progress: { high: 20, medium: 50 },
            testCoverage: { high: 30, medium: 60 },
            prdComplete: { high: 30, medium: 70 }
        };
    }
    
    render() {
        const data = this.app.getData();
        if (!data) return;
        
        // 分析風險
        this.analyzeRisks(data);
        
        // 渲染風險概覽
        this.renderRiskOverview();
        
        // 渲染風險矩陣
        this.renderRiskMatrix();
        
        // 渲染風險列表
        this.renderRiskList();
        
        // 渲染建議行動
        this.renderActionItems();
    }
    
    analyzeRisks(data) {
        this.risks = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };
        
        data.modules.forEach(module => {
            const risks = this.assessModuleRisks(module);
            risks.forEach(risk => {
                this.risks[risk.level].push({
                    ...risk,
                    module: module
                });
            });
        });
    }
    
    assessModuleRisks(module) {
        const risks = [];
        
        // 進度風險
        if (module.progress < this.riskThresholds.progress.high) {
            risks.push({
                type: 'progress',
                level: 'critical',
                title: '進度嚴重落後',
                description: `模組 ${module.code} 進度僅 ${module.progress}%，遠低於預期`,
                impact: '可能影響專案整體上線時程',
                mitigation: '需要立即分配更多資源或調整範圍'
            });
        } else if (module.progress < this.riskThresholds.progress.medium) {
            risks.push({
                type: 'progress',
                level: 'high',
                title: '進度落後',
                description: `模組 ${module.code} 進度為 ${module.progress}%`,
                impact: '可能延遲該模組上線',
                mitigation: '建議增加人力或優化開發流程'
            });
        }
        
        // 測試風險
        const hasUnitTest = module.status.unitTest?.status === '✅' || module.status.unitTest?.status === '🟡';
        const hasIntegrationTest = module.status.integrationTest?.status === '✅' || module.status.integrationTest?.status === '🟡';
        
        if (!hasUnitTest && !hasIntegrationTest && module.progress > 30) {
            risks.push({
                type: 'testing',
                level: 'high',
                title: '缺乏測試覆蓋',
                description: `模組 ${module.code} 尚未開始任何測試`,
                impact: '品質風險高，可能產生大量錯誤',
                mitigation: '立即開始撰寫單元測試和整合測試'
            });
        }
        
        // PRD風險
        const prdStatus = module.status.prd?.status;
        if ((prdStatus === '🔴' || prdStatus === '⚪') && module.progress > 0) {
            risks.push({
                type: 'documentation',
                level: 'medium',
                title: 'PRD未完成',
                description: `模組 ${module.code} 已開始開發但PRD未完成`,
                impact: '可能導致需求理解偏差',
                mitigation: '儘快完成PRD文檔'
            });
        }
        
        // 整合風險
        if (module.status.integration?.status === '🔴' && module.progress > 50) {
            risks.push({
                type: 'integration',
                level: 'high',
                title: '整合未開始',
                description: `模組 ${module.code} 進度已過半但尚未開始整合`,
                impact: '後期整合可能發現大量問題',
                mitigation: '開始進行模組間整合測試'
            });
        }
        
        return risks;
    }
    
    renderRiskOverview() {
        const container = document.getElementById('risk-overview');
        if (!container) return;
        
        const totalRisks = Object.values(this.risks).reduce((sum, risks) => sum + risks.length, 0);
        
        const html = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-red-600">嚴重風險</p>
                            <p class="text-2xl font-bold text-red-700">${this.risks.critical.length}</p>
                        </div>
                        <i class="fas fa-exclamation-circle text-3xl text-red-500"></i>
                    </div>
                </div>
                
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-orange-600">高風險</p>
                            <p class="text-2xl font-bold text-orange-700">${this.risks.high.length}</p>
                        </div>
                        <i class="fas fa-exclamation-triangle text-3xl text-orange-500"></i>
                    </div>
                </div>
                
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-yellow-600">中風險</p>
                            <p class="text-2xl font-bold text-yellow-700">${this.risks.medium.length}</p>
                        </div>
                        <i class="fas fa-info-circle text-3xl text-yellow-500"></i>
                    </div>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-blue-600">總風險數</p>
                            <p class="text-2xl font-bold text-blue-700">${totalRisks}</p>
                        </div>
                        <i class="fas fa-shield-alt text-3xl text-blue-500"></i>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderRiskMatrix() {
        const container = document.getElementById('risk-matrix-container');
        if (!container) return;
        
        // 準備矩陣數據
        const matrixData = this.prepareMatrixData();
        
        // 渲染風險矩陣圖表
        const ctx = container.querySelector('canvas');
        if (!ctx) return;
        
        // 銷毀舊圖表
        if (this.charts.riskMatrix) {
            this.charts.riskMatrix.destroy();
        }
        
        this.charts.riskMatrix = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: '嚴重風險',
                        data: matrixData.critical,
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        pointRadius: 8
                    },
                    {
                        label: '高風險',
                        data: matrixData.high,
                        backgroundColor: 'rgba(251, 146, 60, 0.6)',
                        borderColor: 'rgba(251, 146, 60, 1)',
                        pointRadius: 7
                    },
                    {
                        label: '中風險',
                        data: matrixData.medium,
                        backgroundColor: 'rgba(250, 204, 21, 0.6)',
                        borderColor: 'rgba(250, 204, 21, 1)',
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '發生可能性'
                        },
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '影響程度'
                        },
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const risk = context.raw.risk;
                                return [
                                    `${risk.module.code} - ${risk.module.zhName}`,
                                    `類型: ${risk.title}`,
                                    `可能性: ${context.parsed.x}%`,
                                    `影響: ${context.parsed.y}%`
                                ];
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const datasetIndex = elements[0].datasetIndex;
                        const index = elements[0].index;
                        const risk = this.charts.riskMatrix.data.datasets[datasetIndex].data[index].risk;
                        this.showRiskDetails(risk);
                    }
                }
            }
        });
    }
    
    prepareMatrixData() {
        const data = {
            critical: [],
            high: [],
            medium: []
        };
        
        // 計算每個風險的可能性和影響
        Object.entries(this.risks).forEach(([level, risks]) => {
            if (level === 'low') return;
            
            risks.forEach(risk => {
                const point = {
                    x: this.calculateProbability(risk),
                    y: this.calculateImpact(risk),
                    risk: risk
                };
                
                if (data[level]) {
                    data[level].push(point);
                }
            });
        });
        
        return data;
    }
    
    calculateProbability(risk) {
        // 根據風險類型和當前狀態計算發生可能性
        const baseProb = {
            progress: 80,
            testing: 70,
            documentation: 60,
            integration: 75
        };
        
        let prob = baseProb[risk.type] || 50;
        
        // 根據模組進度調整
        if (risk.module.progress < 20) prob += 15;
        else if (risk.module.progress < 50) prob += 10;
        
        return Math.min(95, prob);
    }
    
    calculateImpact(risk) {
        // 根據風險等級計算影響程度
        const baseImpact = {
            critical: 85,
            high: 65,
            medium: 45,
            low: 25
        };
        
        return baseImpact[risk.level] || 50;
    }
    
    renderRiskList() {
        const container = document.getElementById('risk-list');
        if (!container) return;
        
        let html = '<div class="space-y-4">';
        
        // 按風險等級分組顯示
        ['critical', 'high', 'medium'].forEach(level => {
            if (this.risks[level].length === 0) return;
            
            const levelConfig = {
                critical: { color: 'red', icon: 'fa-exclamation-circle', text: '嚴重風險' },
                high: { color: 'orange', icon: 'fa-exclamation-triangle', text: '高風險' },
                medium: { color: 'yellow', icon: 'fa-info-circle', text: '中風險' }
            };
            
            const config = levelConfig[level];
            
            html += `
                <div class="border rounded-lg overflow-hidden">
                    <div class="bg-${config.color}-50 px-4 py-2 border-b border-${config.color}-200">
                        <h3 class="font-medium text-${config.color}-700 flex items-center">
                            <i class="fas ${config.icon} mr-2"></i>
                            ${config.text} (${this.risks[level].length})
                        </h3>
                    </div>
                    <div class="p-4 space-y-3">
            `;
            
            this.risks[level].forEach((risk, index) => {
                html += `
                    <div class="border rounded p-3 hover:shadow-md transition-all cursor-pointer"
                         onclick="window.trackingApp.views.risk.showRiskDetails(${JSON.stringify(risk).replace(/"/g, '&quot;')})">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">
                                    ${risk.module.code} - ${risk.title}
                                </h4>
                                <p class="text-sm text-gray-600 mt-1">${risk.description}</p>
                                <div class="flex items-center mt-2 text-xs text-gray-500">
                                    <span class="mr-4">
                                        <i class="fas fa-chart-line mr-1"></i>
                                        進度: ${risk.module.progress}%
                                    </span>
                                    <span>
                                        <i class="fas fa-tag mr-1"></i>
                                        類型: ${this.getRiskTypeLabel(risk.type)}
                                    </span>
                                </div>
                            </div>
                            <button class="ml-3 text-${config.color}-600 hover:text-${config.color}-800">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    getRiskTypeLabel(type) {
        const labels = {
            progress: '進度風險',
            testing: '測試風險',
            documentation: '文檔風險',
            integration: '整合風險'
        };
        return labels[type] || '其他風險';
    }
    
    renderActionItems() {
        const container = document.getElementById('action-items');
        if (!container) return;
        
        // 生成行動建議
        const actions = this.generateActionItems();
        
        let html = '<div class="space-y-3">';
        
        actions.forEach((action, index) => {
            html += `
                <div class="flex items-start p-3 border rounded hover:bg-gray-50">
                    <input type="checkbox" id="action-${index}" class="mt-1 mr-3"
                           onchange="window.trackingApp.views.risk.toggleAction(${index})">
                    <label for="action-${index}" class="flex-1 cursor-pointer">
                        <div class="font-medium text-gray-900">${action.title}</div>
                        <div class="text-sm text-gray-600 mt-1">${action.description}</div>
                        <div class="flex items-center mt-2 text-xs text-gray-500">
                            <span class="mr-3">
                                <i class="fas fa-flag mr-1"></i>
                                優先級: ${action.priority}
                            </span>
                            <span>
                                <i class="fas fa-users mr-1"></i>
                                負責: ${action.assignee}
                            </span>
                        </div>
                    </label>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    generateActionItems() {
        const actions = [];
        
        // 根據風險生成行動項目
        this.risks.critical.forEach(risk => {
            actions.push({
                title: `立即處理 ${risk.module.code} 模組的${risk.title}`,
                description: risk.mitigation,
                priority: '緊急',
                assignee: '專案經理',
                riskId: risk.id
            });
        });
        
        this.risks.high.forEach(risk => {
            actions.push({
                title: `處理 ${risk.module.code} 模組的${risk.title}`,
                description: risk.mitigation,
                priority: '高',
                assignee: '模組負責人',
                riskId: risk.id
            });
        });
        
        // 限制顯示數量
        return actions.slice(0, 10);
    }
    
    showRiskDetails(risk) {
        const content = `
            <div class="space-y-4">
                <div class="border-b pb-4">
                    <div class="flex items-center justify-between">
                        <h4 class="text-lg font-medium text-gray-900">${risk.title}</h4>
                        <span class="px-3 py-1 rounded-full text-sm font-medium"
                              style="background-color: ${this.getRiskLevelColor(risk.level)}; color: white;">
                            ${this.getRiskLevelText(risk.level)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">${risk.description}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h5 class="text-sm font-medium text-gray-700 mb-1">影響模組</h5>
                        <p class="text-sm">${risk.module.code} - ${risk.module.zhName}</p>
                    </div>
                    <div>
                        <h5 class="text-sm font-medium text-gray-700 mb-1">風險類型</h5>
                        <p class="text-sm">${this.getRiskTypeLabel(risk.type)}</p>
                    </div>
                    <div>
                        <h5 class="text-sm font-medium text-gray-700 mb-1">模組進度</h5>
                        <p class="text-sm">${risk.module.progress}%</p>
                    </div>
                    <div>
                        <h5 class="text-sm font-medium text-gray-700 mb-1">發生可能性</h5>
                        <p class="text-sm">${this.calculateProbability(risk)}%</p>
                    </div>
                </div>
                
                <div>
                    <h5 class="text-sm font-medium text-gray-700 mb-2">潛在影響</h5>
                    <p class="text-sm text-gray-600">${risk.impact}</p>
                </div>
                
                <div>
                    <h5 class="text-sm font-medium text-gray-700 mb-2">建議緩解措施</h5>
                    <p class="text-sm text-gray-600">${risk.mitigation}</p>
                </div>
                
                <div class="flex space-x-3 pt-4 border-t">
                    <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.views.risk.createIssue('${risk.module.code}', '${risk.title}')">
                        <i class="fas fa-plus-circle mr-2"></i>建立 Issue
                    </button>
                    <button class="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.switchTab('dashboard'); window.trackingApp.views.dashboard.showModuleDetails('${risk.module.code}')">
                        <i class="fas fa-eye mr-2"></i>查看模組
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal('風險詳情', content);
    }
    
    getRiskLevelColor(level) {
        const colors = {
            critical: '#EF4444',
            high: '#FB923C',
            medium: '#FACC15',
            low: '#3B82F6'
        };
        return colors[level] || '#6B7280';
    }
    
    getRiskLevelText(level) {
        const texts = {
            critical: '嚴重',
            high: '高',
            medium: '中',
            low: '低'
        };
        return texts[level] || '未知';
    }
    
    createIssue(moduleCode, title) {
        // TODO: 整合 GitHub Issues API
        this.app.showNotification('Issue 建立功能開發中', 'info');
    }
    
    toggleAction(index) {
        // TODO: 實現行動項目狀態追蹤
        const checkbox = document.getElementById(`action-${index}`);
        if (checkbox.checked) {
            this.app.showNotification('已標記為完成', 'success');
        }
    }
    
    exportRiskReport() {
        const report = this.generateRiskReport();
        this.app.utils.downloadFile(report, `risk-report-${new Date().toISOString().split('T')[0]}.csv`);
        this.app.showNotification('風險報告已匯出', 'success');
    }
    
    generateRiskReport() {
        const headers = ['風險等級', '模組', '風險類型', '標題', '描述', '影響', '緩解措施'];
        const rows = [headers];
        
        ['critical', 'high', 'medium'].forEach(level => {
            this.risks[level].forEach(risk => {
                rows.push([
                    this.getRiskLevelText(level),
                    risk.module.code,
                    this.getRiskTypeLabel(risk.type),
                    risk.title,
                    risk.description,
                    risk.impact,
                    risk.mitigation
                ]);
            });
        });
        
        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    destroy() {
        // 銷毀圖表
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}