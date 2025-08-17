// MPM 儀表板 JavaScript
class MPMDashboard {
    constructor() {
        this.data = null;
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        this.updateLastUpdated();
    }

    async loadData() {
        try {
            this.showLoading(true);
            
            // 載入 MPM 數據
            const response = await fetch('../TOC_Module_Progress_Matrix.md');
            const mpmContent = await response.text();
            
            // 解析 MPM 內容
            this.data = this.parseMPMContent(mpmContent);
            
            // 模擬其他數據（實際應用中會從 API 獲取）
            this.data.charts = this.generateChartData();
            
        } catch (error) {
            console.error('載入數據失敗:', error);
            this.showError('載入數據失敗，請檢查網路連接');
        } finally {
            this.showLoading(false);
        }
    }

    parseMPMContent(content) {
        const data = {
            overallProgress: 0,
            totalModules: 12,
            totalSubmodules: 54,
            completedCount: 0,
            modules: [],
            lastUpdated: new Date().toLocaleString('zh-TW')
        };

        // 解析進度統計
        const progressMatch = content.match(/整體進度.*?(\d+)%/);
        if (progressMatch) {
            data.overallProgress = parseInt(progressMatch[1]);
        }

        // 解析模組數據
        const moduleSections = content.split(/### \d+\. \[/);
        moduleSections.slice(1).forEach(section => {
            const moduleData = this.parseModuleSection(section);
            if (moduleData) {
                data.modules.push(moduleData);
                if (moduleData.status === 'completed') {
                    data.completedCount++;
                }
            }
        });

        return data;
    }

    parseModuleSection(section) {
        const lines = section.split('\n');
        const firstLine = lines[0];
        
        // 提取模組資訊
        const moduleMatch = firstLine.match(/^([A-Z]+)\].*?([^[]+)$/);
        if (!moduleMatch) return null;

        const moduleCode = moduleMatch[1];
        const moduleName = moduleMatch[2].trim();
        
        // 計算子模組數量
        const submoduleCount = (section.match(/\|.*?FR-\d{3}.*?\|/g) || []).length;
        
        // 計算完成數量
        const completedCount = (section.match(/✅ 完成/g) || []).length;
        
        // 計算進度
        const progress = submoduleCount > 0 ? Math.round((completedCount / submoduleCount) * 100) : 0;
        
        // 判斷狀態
        let status = 'not-started';
        if (progress === 100) status = 'completed';
        else if (progress > 50) status = 'in-progress';
        else if (progress > 0) status = 'draft';

        return {
            code: moduleCode,
            name: moduleName,
            submoduleCount,
            completedCount,
            progress,
            status
        };
    }

    generateChartData() {
        const statusCounts = {
            completed: 0,
            'in-progress': 0,
            draft: 0,
            'not-started': 0
        };

        this.data.modules.forEach(module => {
            statusCounts[module.status]++;
        });

        return {
            progressDistribution: {
                labels: ['已完成', '開發中', '草稿', '未開始'],
                data: [
                    statusCounts.completed,
                    statusCounts['in-progress'],
                    statusCounts.draft,
                    statusCounts['not-started']
                ],
                colors: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444']
            },
            moduleProgress: {
                labels: this.data.modules.map(m => m.code),
                data: this.data.modules.map(m => m.progress),
                colors: this.data.modules.map(m => this.getStatusColor(m.status))
            }
        };
    }

    getStatusColor(status) {
        const colors = {
            'completed': '#10B981',
            'in-progress': '#F59E0B',
            'draft': '#3B82F6',
            'not-started': '#EF4444'
        };
        return colors[status] || '#6B7280';
    }

    getStatusText(status) {
        const texts = {
            'completed': '已完成',
            'in-progress': '開發中',
            'draft': '草稿',
            'not-started': '未開始'
        };
        return texts[status] || '未知';
    }

    renderDashboard() {
        this.updateOverviewCards();
        this.renderCharts();
        this.renderModuleTable();
        this.renderMPMContent();
    }

    updateOverviewCards() {
        // 更新整體進度
        document.getElementById('overall-progress').textContent = `${this.data.overallProgress}%`;
        document.getElementById('progress-text').textContent = `${this.data.overallProgress}%`;
        
        // 更新進度圓環
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (this.data.overallProgress / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // 更新其他卡片
        document.getElementById('total-submodules').textContent = this.data.totalSubmodules;
        document.getElementById('completed-count').textContent = this.data.completedCount;
    }

    renderCharts() {
        this.renderProgressChart();
        this.renderModuleChart();
    }

    renderProgressChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        if (this.charts.progressChart) {
            this.charts.progressChart.destroy();
        }

        this.charts.progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.data.charts.progressDistribution.labels,
                datasets: [{
                    data: this.data.charts.progressDistribution.data,
                    backgroundColor: this.data.charts.progressDistribution.colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    renderModuleChart() {
        const ctx = document.getElementById('moduleChart').getContext('2d');
        
        if (this.charts.moduleChart) {
            this.charts.moduleChart.destroy();
        }

        this.charts.moduleChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.charts.moduleProgress.labels,
                datasets: [{
                    label: '進度 (%)',
                    data: this.data.charts.moduleProgress.data,
                    backgroundColor: this.data.charts.moduleProgress.colors,
                    borderColor: this.data.charts.moduleProgress.colors,
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
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderModuleTable() {
        const tbody = document.getElementById('module-table-body');
        tbody.innerHTML = '';

        this.data.modules.forEach(module => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span class="text-sm font-medium text-gray-900">${module.code}</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${module.name}</div>
                            <div class="text-sm text-gray-500">${module.code}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${module.submoduleCount}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${module.completedCount}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${module.progress}%"></div>
                        </div>
                        <span class="text-sm text-gray-900">${module.progress}%</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full status-${module.status}">
                        ${this.getStatusText(module.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderMPMContent() {
        const container = document.getElementById('mpm-content');
        
        // 建立簡化的 MPM 內容顯示
        let html = '<div class="space-y-6">';
        
        this.data.modules.forEach(module => {
            html += `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-lg font-medium text-gray-900">
                            ${module.code} - ${module.name}
                        </h4>
                        <span class="px-3 py-1 text-sm font-semibold rounded-full status-${module.status}">
                            ${this.getStatusText(module.status)}
                        </span>
                    </div>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">子模組數:</span>
                            <span class="font-medium">${module.submoduleCount}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">完成數:</span>
                            <span class="font-medium">${module.completedCount}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">進度:</span>
                            <span class="font-medium">${module.progress}%</span>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${module.progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    updateLastUpdated() {
        const element = document.getElementById('last-updated');
        element.textContent = this.data.lastUpdated;
    }

    setupEventListeners() {
        // 重新整理按鈕
        const refreshBtn = document.querySelector('button');
        refreshBtn.addEventListener('click', () => {
            this.loadData().then(() => {
                this.renderDashboard();
            });
        });
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.classList.toggle('hidden', !show);
    }

    showError(message) {
        // 建立錯誤提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // 3秒後自動移除
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// 初始化儀表板
document.addEventListener('DOMContentLoaded', () => {
    new MPMDashboard();
}); 