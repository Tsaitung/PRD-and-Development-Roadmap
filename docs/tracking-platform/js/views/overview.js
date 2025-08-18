/**
 * 總覽視圖 - 顯示整體專案狀態和關鍵指標
 */

export class OverviewView {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('overview-tab');
    }
    
    render() {
        const data = this.app.getData();
        if (!data) return;
        
        // 渲染概覽卡片
        this.renderOverviewCards(data);
        
        // 渲染維度概覽
        this.renderDimensionsOverview(data);
        
        // 設置快速操作事件
        this.setupQuickActions();
    }
    
    renderOverviewCards(data) {
        const cardsContainer = document.getElementById('overview-cards');
        if (!cardsContainer) return;
        
        const cards = [
            {
                title: '整體進度',
                value: `${data.overallProgress}%`,
                icon: 'fa-chart-line',
                color: 'blue',
                showProgress: true,
                progress: data.overallProgress
            },
            {
                title: '總模組數',
                value: data.totalModules,
                icon: 'fa-cubes',
                color: 'purple',
                subtitle: `${data.totalSubmodules} 個子模組`
            },
            {
                title: '已完成',
                value: this.app.getCompletedCount(),
                icon: 'fa-check-circle',
                color: 'green',
                percentage: Math.round((this.app.getCompletedCount() / data.totalModules) * 100)
            },
            {
                title: '風險項目',
                value: this.app.dataManager.getRiskModules().length,
                icon: 'fa-exclamation-triangle',
                color: 'red',
                subtitle: '需要關注'
            }
        ];
        
        cardsContainer.innerHTML = cards.map(card => this.createOverviewCard(card)).join('');
    }
    
    createOverviewCard(card) {
        const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600'
        };
        
        return `
            <div class="bg-white rounded-xl shadow-md card-hover p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600">${card.title}</p>
                        <p class="text-3xl font-bold text-gray-900 mt-1">${card.value}</p>
                        ${card.subtitle ? `<p class="text-xs text-gray-500 mt-1">${card.subtitle}</p>` : ''}
                        ${card.percentage !== undefined ? `
                            <p class="text-sm text-gray-600 mt-2">
                                <span class="font-medium">${card.percentage}%</span> 完成率
                            </p>
                        ` : ''}
                    </div>
                    <div class="ml-4">
                        ${card.showProgress ? `
                            <div class="relative w-20 h-20">
                                <svg class="progress-ring w-20 h-20" viewBox="0 0 120 120">
                                    <circle stroke="#E5E7EB" stroke-width="8" fill="transparent" r="52" cx="60" cy="60"/>
                                    <circle stroke="#3B82F6" stroke-width="8" fill="transparent" r="52" cx="60" cy="60" 
                                            stroke-dasharray="326.73" 
                                            stroke-dashoffset="${326.73 - (card.progress / 100) * 326.73}"/>
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <i class="fas ${card.icon} text-2xl text-blue-600"></i>
                                </div>
                            </div>
                        ` : `
                            <div class="p-4 rounded-full ${colorClasses[card.color]}">
                                <i class="fas ${card.icon} text-2xl"></i>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDimensionsOverview(data) {
        const container = document.getElementById('dimensions-grid');
        if (!container) return;
        
        const dimensions = this.app.dataManager.dimensions.filter(d => 
            d.key !== 'progress' && d.key !== 'issues'
        );
        
        container.innerHTML = dimensions.map(dim => {
            const stats = data.statusDimensions[dim.key];
            if (!stats) return '';
            
            const total = stats.total;
            const completed = stats.complete || 0;
            const inProgress = stats.inProgress || 0;
            const percentage = total > 0 ? Math.round(((completed + inProgress * 0.5) / total) * 100) : 0;
            
            return `
                <div class="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-sm font-medium text-gray-700">${dim.name}</h4>
                        <i class="fas ${dim.icon} text-gray-400"></i>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-xs text-gray-600">
                            <span>完成/進行中/總數</span>
                            <span class="font-medium">${completed}/${inProgress}/${total}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="relative h-2 rounded-full overflow-hidden">
                                <div class="absolute inset-0 bg-green-500" style="width: ${(completed/total)*100}%"></div>
                                <div class="absolute inset-0 bg-yellow-500" style="left: ${(completed/total)*100}%; width: ${(inProgress/total)*100}%"></div>
                            </div>
                        </div>
                        <div class="text-center">
                            <span class="text-sm font-medium text-gray-700">${percentage}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    setupQuickActions() {
        // 快速操作按鈕已在主應用中設置事件監聽
        // 這裡可以添加特定於總覽頁面的事件
        
        // 點擊卡片查看詳情
        document.querySelectorAll('#overview-cards .card-hover').forEach((card, index) => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                switch (index) {
                    case 0: // 整體進度
                        this.app.switchTab('analytics');
                        break;
                    case 1: // 總模組數
                        this.app.switchTab('dashboard');
                        break;
                    case 2: // 已完成
                        this.app.switchTab('dashboard');
                        this.app.state.filters.status = 'completed';
                        this.app.applyFilters();
                        break;
                    case 3: // 風險項目
                        this.app.switchTab('risk');
                        break;
                }
            });
        });
        
        // 點擊維度卡片查看詳情
        document.querySelectorAll('#dimensions-grid > div').forEach((card, index) => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                this.showDimensionDetails(this.app.dataManager.dimensions[index]);
            });
        });
    }
    
    showDimensionDetails(dimension) {
        const data = this.app.getData();
        const stats = data.statusDimensions[dimension.key];
        
        // 收集該維度的所有模組狀態
        const moduleStatuses = data.modules.map(module => ({
            code: module.code,
            name: module.zhName,
            status: module.status[dimension.key]?.status || '-',
            description: module.status[dimension.key]?.description || ''
        }));
        
        // 建立詳情內容
        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="bg-green-50 p-3 rounded">
                        <div class="text-green-600 font-medium">完成</div>
                        <div class="text-2xl font-bold text-green-700">${stats.complete || 0}</div>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded">
                        <div class="text-yellow-600 font-medium">進行中</div>
                        <div class="text-2xl font-bold text-yellow-700">${stats.inProgress || 0}</div>
                    </div>
                    <div class="bg-red-50 p-3 rounded">
                        <div class="text-red-600 font-medium">未開始</div>
                        <div class="text-2xl font-bold text-red-700">${stats.notStarted || 0}</div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <div class="text-gray-600 font-medium">規劃中</div>
                        <div class="text-2xl font-bold text-gray-700">${stats.planning || 0}</div>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">各模組狀態</h4>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${moduleStatuses.map(m => `
                            <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                                <div class="flex items-center">
                                    <span class="font-medium text-gray-700 mr-2">${m.code}</span>
                                    <span class="text-sm text-gray-600">${m.name}</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-lg mr-2">${m.status}</span>
                                    <span class="text-xs text-gray-500">${m.description}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.app.showModal(`${dimension.name} - 詳細狀態`, content);
    }
    
    // 響應窗口大小變化
    handleResize() {
        // 如果需要，可以在這裡調整佈局
    }
}