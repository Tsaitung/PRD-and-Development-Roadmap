/**
 * 即時監控視圖 - 顯示模組進度表格和即時狀態
 */

export class DashboardView {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('dashboard-tab');
        this.filteredModules = [];
    }
    
    render() {
        const data = this.app.getData();
        if (!data) return;
        
        // 初始化篩選後的模組列表
        this.filteredModules = [...data.modules];
        
        // 渲染模組表格
        this.renderModuleTable();
    }
    
    renderModuleTable() {
        const tbody = document.getElementById('module-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.filteredModules.map(module => {
            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span class="text-sm font-medium text-white">${module.code}</span>
                                </div>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${module.zhName}</div>
                                <div class="text-xs text-gray-500">${module.name}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex flex-wrap gap-1 justify-center">
                            ${this.renderStatusBadges(module)}
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center justify-center">
                            <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                                     style="width: ${module.progress}%"></div>
                            </div>
                            <span class="text-sm font-medium text-gray-700">${module.progress}%</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button class="text-blue-600 hover:text-blue-800 mr-3" 
                                onclick="window.trackingApp.views.dashboard.showModuleDetails('${module.code}')"
                                title="查看詳情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-800 mr-3" 
                                onclick="window.trackingApp.views.dashboard.showModuleReport('${module.code}')"
                                title="生成報告">
                            <i class="fas fa-file-alt"></i>
                        </button>
                        <button class="text-purple-600 hover:text-purple-800" 
                                onclick="window.trackingApp.views.dashboard.showModuleTrend('${module.code}')"
                                title="查看趨勢">
                            <i class="fas fa-chart-line"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderStatusBadges(module) {
        const dimensions = [
            { key: 'oldSystem', label: '舊', color: 'blue' },
            { key: 'newSystem', label: '新', color: 'green' },
            { key: 'prd', label: 'PRD', color: 'purple' },
            { key: 'integration', label: '整', color: 'yellow' },
            { key: 'unitTest', label: '單', color: 'pink' },
            { key: 'integrationTest', label: '整測', color: 'indigo' }
        ];
        
        return dimensions.map(dim => {
            const status = module.status[dim.key]?.status || '-';
            const statusInfo = this.app.utils.parseStatus(status);
            
            return `
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tooltip"
                      style="background-color: ${this.app.utils.getColorWithAlpha(statusInfo.color, 0.1)}; 
                             color: ${statusInfo.color}">
                    ${status} ${dim.label}
                    <span class="tooltip-text">${dim.label}: ${statusInfo.text}</span>
                </span>
            `;
        }).join('');
    }
    
    applyFilters(filters) {
        const data = this.app.getData();
        if (!data) return;
        
        // 使用工具函數篩選模組
        this.filteredModules = this.app.utils.filterModules(data.modules, filters);
        
        // 重新渲染表格
        this.renderModuleTable();
        
        // 更新篩選結果提示
        this.updateFilterHint();
    }
    
    updateFilterHint() {
        const total = this.app.getData().modules.length;
        const filtered = this.filteredModules.length;
        
        if (filtered < total) {
            this.app.showNotification(
                `顯示 ${filtered} / ${total} 個模組`,
                'info',
                2000
            );
        }
    }
    
    showModuleDetails(moduleCode) {
        const module = this.app.getModule(moduleCode);
        if (!module) return;
        
        const risk = this.app.utils.assessRisk(module);
        
        const content = `
            <div class="space-y-6">
                <!-- 基本資訊 -->
                <div class="border-b pb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-lg font-medium text-gray-900">${module.zhName}</h4>
                            <p class="text-sm text-gray-500">${module.name}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-gray-900">${module.progress}%</div>
                            <div class="text-sm ${risk.level === 'high' ? 'text-red-600' : risk.level === 'medium' ? 'text-yellow-600' : 'text-green-600'}">
                                ${risk.text}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 狀態詳情 -->
                <div>
                    <h5 class="font-medium text-gray-700 mb-3">狀態詳情</h5>
                    <div class="grid grid-cols-2 gap-3">
                        ${this.app.dataManager.dimensions.map(dim => {
                            const status = module.status[dim.key];
                            if (!status) return '';
                            
                            const statusInfo = this.app.utils.parseStatus(status.status);
                            
                            return `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div class="flex items-center">
                                        <i class="fas ${dim.icon} text-gray-400 mr-2"></i>
                                        <span class="text-sm font-medium text-gray-700">${dim.name}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="text-lg mr-2">${status.status}</span>
                                        <span class="text-xs text-gray-500">${status.description || statusInfo.text}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- 子模組資訊 -->
                <div>
                    <h5 class="font-medium text-gray-700 mb-2">子模組資訊</h5>
                    <div class="bg-gray-50 p-3 rounded">
                        <p class="text-sm text-gray-600">
                            共 <span class="font-medium">${module.submoduleCount}</span> 個子模組
                        </p>
                    </div>
                </div>
                
                <!-- 操作按鈕 -->
                <div class="flex space-x-3">
                    <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.views.dashboard.showModuleReport('${module.code}')">
                        <i class="fas fa-file-alt mr-2"></i>生成報告
                    </button>
                    <button class="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.views.dashboard.showModuleTrend('${module.code}')">
                        <i class="fas fa-chart-line mr-2"></i>查看趨勢
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal(`${module.code} - 模組詳情`, content);
    }
    
    showModuleReport(moduleCode) {
        const module = this.app.getModule(moduleCode);
        if (!module) return;
        
        // 生成模組報告（整合自 dashboard 的功能）
        const content = `
            <div class="space-y-6">
                <!-- 簡化視圖 -->
                <div class="border rounded-lg p-4 bg-gray-50">
                    <h4 class="font-medium text-gray-700 mb-3">模組概覽</h4>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">子模組數:</span>
                            <span class="font-medium ml-2">${module.submoduleCount}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">整體進度:</span>
                            <span class="font-medium ml-2">${module.progress}%</span>
                        </div>
                        <div>
                            <span class="text-gray-500">風險等級:</span>
                            <span class="font-medium ml-2">${this.app.utils.assessRisk(module).text}</span>
                        </div>
                    </div>
                </div>
                
                <!-- 維度狀態總結 -->
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">狀態總結</h4>
                    <div class="space-y-2">
                        ${this.app.dataManager.dimensions.map(dim => {
                            const status = module.status[dim.key];
                            if (!status) return '';
                            const statusInfo = this.app.utils.parseStatus(status.status);
                            return `
                                <div class="flex items-center justify-between p-2 bg-white border rounded">
                                    <div class="flex items-center">
                                        <i class="fas ${dim.icon} text-gray-400 mr-3"></i>
                                        <span class="text-sm font-medium">${dim.name}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="text-lg mr-2">${status.status}</span>
                                        <span class="text-xs text-gray-500">${statusInfo.text}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- 匯出選項 -->
                <div class="flex space-x-3 pt-4 border-t">
                    <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.views.tools.exportModuleReport('${module.code}')">
                        <i class="fas fa-download mr-2"></i>下載報告
                    </button>
                    <button class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-all"
                            onclick="window.print()">
                        <i class="fas fa-print mr-2"></i>列印報告
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal(`${module.code} - 模組報告`, content);
    }
    
    showModuleTrend(moduleCode) {
        // TODO: 實現趨勢查看功能
        this.app.showNotification('趨勢查看功能開發中', 'info');
    }
    
    getModule(moduleCode) {
        return this.filteredModules.find(m => m.code === moduleCode);
    }
}