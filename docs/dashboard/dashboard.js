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
            
            // 載入 TOC Modules 數據
            const filePath = '../../TOC%20Modules.md';
            console.log('嘗試載入文件:', filePath);
            
            // 添加時間戳防止快取
            const timestamp = new Date().getTime();
            const response = await fetch(`${filePath}?t=${timestamp}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const tocContent = await response.text();
            console.log('文件載入成功，內容長度:', tocContent.length);
            console.log('文件前100字符:', tocContent.substring(0, 100));
            
            // 解析 TOC 內容
            this.data = this.parseTOCContent(tocContent);
            
            // 生成圖表數據
            this.data.charts = this.generateChartData();
            
        } catch (error) {
            console.error('載入路徑:', filePath);
            console.error('載入 TOC Modules.md 失敗:', error);
            this.showError(`載入模組架構失敗: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    parseTOCContent(content) {
        const data = {
            overallProgress: 0,
            totalModules: 0,
            totalSubmodules: 0,
            completedCount: 0,
            modules: [],
            lastUpdated: new Date().toLocaleString('zh-TW')
        };

        // 找到模組部分
        const moduleSection = content.split('## 完整模組階層結構')[1];
        if (!moduleSection) {
            console.error('找不到模組階層結構部分');
            return data;
        }

        // 逐行解析
        const lines = moduleSection.split('\n');
        let currentModule = null;
        let moduleCount = 0;
        let submoduleCount = 0;
        
        console.log('開始逐行解析模組數據...');
        
        lines.forEach((line, index) => {
            // 檢查主要模組
            const moduleMatch = line.match(/^(\d+)\.\s*\[([A-Z]+)\]\s*(.+)/);
            if (moduleMatch) {
                moduleCount++;
                const moduleNum = parseInt(moduleMatch[1]);
                const moduleCode = moduleMatch[2];
                const moduleName = moduleMatch[3].trim();
                
                console.log(`解析模組 ${moduleNum}: ${moduleCode} - ${moduleName}`);
                
                currentModule = {
                    number: moduleNum,
                    code: moduleCode,
                    name: moduleName,
                    submodules: [],
                    submoduleCount: 0,
                    completedCount: 0,
                    progress: 0,
                    status: 'not-started'
                };
                
                data.modules.push(currentModule);
                data.totalModules++;
            }
            
            // 檢查子模組
            const submoduleMatch = line.match(/^\s*(\d+\.\d+)\.\s*\[([A-Z-]+)\]\s*(.+)/);
            if (submoduleMatch && currentModule) {
                submoduleCount++;
                const subNum = submoduleMatch[1];
                const subCode = submoduleMatch[2];
                const subName = submoduleMatch[3].trim();
                
                currentModule.submodules.push({
                    number: subNum,
                    code: subCode,
                    name: subName,
                    status: 'not-started'
                });
                currentModule.submoduleCount++;
            }
            
            // 檢查深層子模組
            const deepSubmoduleMatch = line.match(/^\s*(\d+\.\d+\.\d+[a-z]?)\.\s*\[([A-Z-]+)\]\s*(.+)/);
            if (deepSubmoduleMatch && currentModule) {
                submoduleCount++;
                const subNum = deepSubmoduleMatch[1];
                const subCode = deepSubmoduleMatch[2];
                const subName = deepSubmoduleMatch[3].trim();
                
                currentModule.submodules.push({
                    number: subNum,
                    code: subCode,
                    name: subName,
                    status: 'not-started'
                });
                currentModule.submoduleCount++;
            }
        });
        
        data.totalSubmodules = submoduleCount;
        console.log(`解析完成: ${data.totalModules} 個模組, ${data.totalSubmodules} 個子模組`);
        console.log('模組數據:', data.modules.map(m => `${m.code}: ${m.submoduleCount} 子模組`));

        // 計算整體進度
        if (data.totalSubmodules > 0) {
            data.overallProgress = Math.round((data.completedCount / data.totalSubmodules) * 100);
        }

        return data;
    }



    generateChartData() {
        console.log('生成圖表數據，模組數量:', this.data.modules.length);
        
        const statusCounts = {
            completed: 0,
            'in-progress': 0,
            draft: 0,
            'not-started': 0
        };

        this.data.modules.forEach(module => {
            statusCounts[module.status]++;
        });

        console.log('狀態統計:', statusCounts);

        const chartData = {
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

        console.log('生成的圖表數據:', chartData);
        return chartData;
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
        document.getElementById('total-modules').textContent = this.data.totalModules;
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

        // 檢查數據是否有效
        console.log('進度分布數據:', this.data.charts.progressDistribution);
        
        // 確保數據有效
        const labels = this.data.charts.progressDistribution.labels || [];
        const data = this.data.charts.progressDistribution.data || [];
        const colors = this.data.charts.progressDistribution.colors || [];
        
        // 如果沒有數據，顯示空狀態
        if (labels.length === 0 || data.length === 0) {
            console.log('沒有進度分布數據，顯示空圖表');
            this.charts.progressChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['無數據'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
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
            return;
        }

        this.charts.progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
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

        // 檢查數據是否有效
        console.log('圖表數據:', this.data.charts.moduleProgress);
        
        // 確保數據有效
        const labels = this.data.charts.moduleProgress.labels || [];
        const data = this.data.charts.moduleProgress.data || [];
        const colors = this.data.charts.moduleProgress.colors || [];
        
        // 如果沒有數據，顯示空狀態
        if (labels.length === 0 || data.length === 0) {
            console.log('沒有模組數據，顯示空圖表');
            this.charts.moduleChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['無數據'],
                    datasets: [{
                        label: '進度 (%)',
                        data: [0],
                        backgroundColor: ['#E5E7EB'],
                        borderColor: ['#E5E7EB'],
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
                            min: 0,
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
                        }
                    }
                }
            });
            return;
        }

        this.charts.moduleChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '進度 (%)',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
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
                        min: 0,
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