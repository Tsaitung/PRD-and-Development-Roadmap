/**
 * 工具視圖 - 提供各種實用工具和快速操作
 */

export class ToolsView {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('tools-tab');
    }
    
    render() {
        const data = this.app.getData();
        if (!data) return;
        
        // 渲染工具區域
        this.renderToolsSection();
        
        // 渲染快速連結
        this.renderQuickLinks();
        
        // 設置事件監聽器
        this.setupEventListeners();
    }
    
    renderToolsSection() {
        const container = document.getElementById('tools-section');
        if (!container) return;
        
        const tools = [
            {
                category: '資料管理',
                icon: 'fa-database',
                color: 'blue',
                tools: [
                    {
                        name: '重新載入資料',
                        icon: 'fa-sync',
                        description: '從 TOC Modules.md 重新載入最新資料',
                        action: 'refreshData'
                    },
                    {
                        name: '清除快取',
                        icon: 'fa-trash',
                        description: '清除本地快取資料',
                        action: 'clearCache'
                    },
                    {
                        name: '匯出 CSV',
                        icon: 'fa-file-csv',
                        description: '匯出完整追蹤資料為 CSV 檔案',
                        action: 'exportCSV'
                    },
                    {
                        name: '匯出詳細 CSV',
                        icon: 'fa-file-excel',
                        description: '匯出包含風險評估的詳細 CSV 報告',
                        action: 'exportDetailedCSV'
                    },
                    {
                        name: '匯出報告',
                        icon: 'fa-file-pdf',
                        description: '生成進度報告 (HTML)',
                        action: 'exportReport'
                    }
                ]
            },
            {
                category: '自動化同步',
                icon: 'fa-robot',
                color: 'purple',
                tools: [
                    {
                        name: '執行狀態檢查',
                        icon: 'fa-search',
                        description: '檢查所有模組的實際狀態',
                        action: 'runStatusCheck',
                        command: 'python .github/scripts/check_module_status.py'
                    },
                    {
                        name: '更新 MPM',
                        icon: 'fa-table',
                        description: '更新模組進度矩陣',
                        action: 'updateMPM',
                        command: 'python .github/scripts/update_mpm.py'
                    },
                    {
                        name: '同步 GitHub',
                        icon: 'fa-cloud-upload-alt',
                        description: '執行完整同步流程',
                        action: 'syncGitHub',
                        command: './enhanced_auto_sync.sh'
                    }
                ]
            },
            {
                category: '測試與驗證',
                icon: 'fa-check-circle',
                color: 'green',
                tools: [
                    {
                        name: '驗證一致性',
                        icon: 'fa-check-double',
                        description: '驗證 FR-ID 一致性',
                        action: 'validateConsistency',
                        command: 'python .github/scripts/validate_consistency.py'
                    },
                    {
                        name: '執行測試',
                        icon: 'fa-vial',
                        description: '執行測試套件',
                        action: 'runTests',
                        command: 'python .github/scripts/run_tests.py'
                    },
                    {
                        name: '檢查程式碼狀態',
                        icon: 'fa-code',
                        description: '檢查程式碼實作狀態',
                        action: 'checkCodeStatus',
                        command: 'python .github/scripts/check_code_status.py'
                    }
                ]
            },
            {
                category: '分析工具',
                icon: 'fa-chart-line',
                color: 'orange',
                tools: [
                    {
                        name: '風險分析',
                        icon: 'fa-exclamation-triangle',
                        description: '執行風險評估分析',
                        action: 'riskAnalysis'
                    },
                    {
                        name: '進度趨勢',
                        icon: 'fa-trending-up',
                        description: '查看歷史進度趨勢',
                        action: 'progressTrend'
                    },
                    {
                        name: '團隊協作',
                        icon: 'fa-users',
                        description: '查看模組分配與團隊協作',
                        action: 'moduleDependencies'
                    },
                    {
                        name: '反饋統計',
                        icon: 'fa-comments',
                        description: '查看使用者反饋統計',
                        action: 'feedbackStats'
                    }
                ]
            }
        ];
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        
        tools.forEach(category => {
            html += `
                <div class="border rounded-lg overflow-hidden">
                    <div class="bg-${category.color}-50 px-4 py-3 border-b">
                        <h3 class="font-medium text-${category.color}-700 flex items-center">
                            <i class="fas ${category.icon} mr-2"></i>
                            ${category.category}
                        </h3>
                    </div>
                    <div class="p-4 space-y-3">
            `;
            
            category.tools.forEach(tool => {
                html += `
                    <div class="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer transition-all"
                         onclick="window.trackingApp.views.tools.executeTool('${tool.action}')">
                        <div class="p-2 bg-${category.color}-100 rounded mr-3">
                            <i class="fas ${tool.icon} text-${category.color}-600"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900">${tool.name}</h4>
                            <p class="text-sm text-gray-600">${tool.description}</p>
                            ${tool.command ? `
                                <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">${tool.command}</code>
                            ` : ''}
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    renderQuickLinks() {
        const container = document.getElementById('quick-links-section');
        if (!container) return;
        
        const links = [
            {
                title: 'TOC Modules.md',
                icon: 'fa-file-alt',
                description: '主要追蹤文件',
                url: '../../TOC%20Modules.md',
                action: 'openFile'
            },
            {
                title: 'GitHub Actions',
                icon: 'fa-cogs',
                description: '查看自動化工作流程',
                url: 'https://github.com/user/repo/actions',
                action: 'openExternal'
            },
            {
                title: 'PRD 資料夾',
                icon: 'fa-folder',
                description: '查看所有 PRD 文件',
                url: '../../PRD/',
                action: 'openFolder'
            },
            {
                title: 'TRACKING_GUIDE.md',
                icon: 'fa-book',
                description: '追蹤指南文件',
                url: '../../TRACKING_GUIDE.md',
                action: 'openFile'
            },
            {
                title: 'IMPLEMENTATION_PLAN.md',
                icon: 'fa-tasks',
                description: '實施計劃文件',
                url: '../../IMPLEMENTATION_PLAN.md',
                action: 'openFile'
            }
        ];
        
        let html = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
        
        links.forEach(link => {
            html += `
                <a href="${link.url}" target="_blank"
                   class="block p-4 border rounded-lg hover:shadow-md transition-all group">
                    <div class="flex items-center mb-2">
                        <i class="fas ${link.icon} text-2xl text-gray-400 group-hover:text-blue-500 transition-colors"></i>
                    </div>
                    <h4 class="font-medium text-gray-900 group-hover:text-blue-600">${link.title}</h4>
                    <p class="text-xs text-gray-600 mt-1">${link.description}</p>
                </a>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    setupEventListeners() {
        // 複製命令按鈕
        document.querySelectorAll('.copy-command').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const command = btn.dataset.command;
                this.copyCommand(command);
            });
        });
    }
    
    async executeTool(action) {
        switch (action) {
            case 'refreshData':
                await this.refreshData();
                break;
            case 'clearCache':
                this.clearCache();
                break;
            case 'exportCSV':
                this.exportCSV();
                break;
            case 'exportReport':
                this.exportReport();
                break;
            case 'exportDetailedCSV':
                this.exportDetailedCSV();
                break;
            case 'runStatusCheck':
            case 'updateMPM':
            case 'syncGitHub':
            case 'validateConsistency':
            case 'runTests':
            case 'checkCodeStatus':
                this.showCommandDialog(action);
                break;
            case 'riskAnalysis':
                this.app.switchTab('risk');
                break;
            case 'progressTrend':
                this.showProgressTrend();
                break;
            case 'moduleDependencies':
                this.showModuleDependencies();
                break;
            case 'feedbackStats':
                window.trackingApp.feedback.showFeedbackStats();
                break;
            default:
                this.app.showNotification('功能開發中', 'info');
        }
    }
    
    async refreshData() {
        this.app.showLoading();
        
        try {
            await this.app.dataManager.loadData(true);
            await this.app.loadData();
            this.app.showNotification('資料已更新', 'success');
        } catch (error) {
            this.app.showNotification('更新失敗: ' + error.message, 'error');
        } finally {
            this.app.hideLoading();
        }
    }
    
    clearCache() {
        localStorage.clear();
        sessionStorage.clear();
        this.app.dataManager.cache.clear();
        this.app.showNotification('快取已清除', 'success');
    }
    
    exportCSV() {
        const data = this.app.getData();
        if (!data) {
            this.app.showNotification('無資料可匯出', 'error');
            return;
        }
        
        const csv = this.app.utils.generateCSV(data);
        const filename = `tracking-data-${new Date().toISOString().split('T')[0]}.csv`;
        this.app.utils.downloadFile(csv, filename);
        this.app.showNotification('CSV 檔案已下載', 'success');
    }
    
    exportDetailedCSV() {
        const data = this.app.getData();
        if (!data) {
            this.app.showNotification('無資料可匯出', 'error');
            return;
        }
        
        // 詳細的CSV格式（包含風險評估）
        let csv = 'Module Code,Module Name,Old System,New System,PRD,Integration,Unit Test,Integration Test,Issues,Progress,Risk Level\n';
        
        data.modules.forEach(module => {
            const risk = this.app.utils.assessRisk(module);
            csv += `"${module.code}",`;
            csv += `"${module.zhName}",`;
            csv += `"${module.status.oldSystem?.status || '-'}",`;
            csv += `"${module.status.newSystem?.status || '-'}",`;
            csv += `"${module.status.prd?.status || '-'}",`;
            csv += `"${module.status.integration?.status || '-'}",`;
            csv += `"${module.status.unitTest?.status || '-'}",`;
            csv += `"${module.status.integrationTest?.status || '-'}",`;
            csv += `"${module.status.issues?.status || '-'}",`;
            csv += `"${module.progress}%",`;
            csv += `"${risk.text}"\n`;
        });
        
        const filename = `detailed-progress-report-${new Date().toISOString().split('T')[0]}.csv`;
        this.app.utils.downloadFile(csv, filename, 'text/csv');
        this.app.showNotification('詳細 CSV 報告已下載', 'success');
    }
    
    exportReport() {
        const data = this.app.getData();
        if (!data) {
            this.app.showNotification('無資料可匯出', 'error');
            return;
        }
        
        const report = this.generateHTMLReport(data);
        const filename = `progress-report-${new Date().toISOString().split('T')[0]}.html`;
        this.app.utils.downloadFile(report, filename, 'text/html');
        this.app.showNotification('報告已生成', 'success');
    }
    
    generateHTMLReport(data) {
        const date = new Date().toLocaleString('zh-TW');
        
        return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>專案進度報告 - ${date}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
        .progress { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-bar { background: #3b82f6; height: 100%; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
        .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .status-complete { background: #d1fae5; color: #065f46; }
        .status-progress { background: #fed7aa; color: #92400e; }
        .status-notstarted { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>菜蟲農食 ERP 系統 - 專案進度報告</h1>
            <p>生成時間：${date}</p>
        </div>
        
        <div class="summary">
            <div class="card">
                <h3>整體進度</h3>
                <div class="progress">
                    <div class="progress-bar" style="width: ${data.overallProgress}%"></div>
                </div>
                <p style="text-align: center; margin-top: 10px;">${data.overallProgress}%</p>
            </div>
            <div class="card">
                <h3>總模組數</h3>
                <p style="font-size: 2em; text-align: center;">${data.totalModules}</p>
            </div>
            <div class="card">
                <h3>已完成</h3>
                <p style="font-size: 2em; text-align: center;">${this.app.getCompletedCount()}</p>
            </div>
            <div class="card">
                <h3>風險項目</h3>
                <p style="font-size: 2em; text-align: center;">${this.app.dataManager.getRiskModules().length}</p>
            </div>
        </div>
        
        <h2>模組詳細狀態</h2>
        <table>
            <thead>
                <tr>
                    <th>模組</th>
                    <th>名稱</th>
                    <th>舊系統</th>
                    <th>新系統</th>
                    <th>PRD</th>
                    <th>整合</th>
                    <th>單元測試</th>
                    <th>整合測試</th>
                    <th>進度</th>
                </tr>
            </thead>
            <tbody>
                ${data.modules.map(module => `
                    <tr>
                        <td><strong>${module.code}</strong></td>
                        <td>${module.zhName}</td>
                        <td>${module.status.oldSystem?.status || '-'}</td>
                        <td>${module.status.newSystem?.status || '-'}</td>
                        <td>${module.status.prd?.status || '-'}</td>
                        <td>${module.status.integration?.status || '-'}</td>
                        <td>${module.status.unitTest?.status || '-'}</td>
                        <td>${module.status.integrationTest?.status || '-'}</td>
                        <td>
                            <div class="progress" style="width: 100px; display: inline-block; vertical-align: middle;">
                                <div class="progress-bar" style="width: ${module.progress}%"></div>
                            </div>
                            ${module.progress}%
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
        `;
    }
    
    showCommandDialog(action) {
        const commands = {
            runStatusCheck: 'python .github/scripts/check_module_status.py',
            updateMPM: 'python .github/scripts/update_mpm.py',
            syncGitHub: './enhanced_auto_sync.sh',
            validateConsistency: 'python .github/scripts/validate_consistency.py',
            runTests: 'python .github/scripts/run_tests.py',
            checkCodeStatus: 'python .github/scripts/check_code_status.py'
        };
        
        const command = commands[action];
        
        const content = `
            <div class="space-y-4">
                <p class="text-sm text-gray-600">請在終端機執行以下命令：</p>
                <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <code>${command}</code>
                </div>
                <div class="flex space-x-3">
                    <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.utils.copyToClipboard('${command}').then(() => {
                                window.trackingApp.showNotification('命令已複製', 'success');
                                window.trackingApp.closeModal();
                            })">
                        <i class="fas fa-copy mr-2"></i>複製命令
                    </button>
                    <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded transition-all"
                            onclick="window.trackingApp.closeModal()">
                        關閉
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal('執行命令', content);
    }
    
    showProgressTrend() {
        this.app.views.trends.show();
    }
    
    showModuleDependencies() {
        // 顯示團隊協作面板的模組分配頁
        this.app.collaboration.showTeamPanel();
        setTimeout(() => {
            this.app.collaboration.showTab('assignments');
        }, 100);
    }
    
    copyCommand(command) {
        this.app.utils.copyToClipboard(command).then(() => {
            this.app.showNotification('命令已複製到剪貼簿', 'success');
        });
    }
    
    exportModuleReport(moduleCode) {
        const module = this.app.getModule(moduleCode);
        if (!module) return;
        
        const date = new Date().toLocaleString('zh-TW');
        const risk = this.app.utils.assessRisk(module);
        
        const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>${module.code} - 模組報告</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .status-item { padding: 10px; background: #f5f5f5; border-radius: 3px; }
        .progress-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4A90E2; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>${module.code} - ${module.zhName}</h1>
    <p>生成時間：${date}</p>
    
    <div class="section">
        <h2>模組概覽</h2>
        <p>子模組數：${module.submoduleCount}</p>
        <p>整體進度：${module.progress}%</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${module.progress}%"></div>
        </div>
        <p>風險等級：${risk.text}</p>
    </div>
    
    <div class="section">
        <h2>狀態詳情</h2>
        <div class="status-grid">
            ${this.app.dataManager.dimensions.map(dim => {
                const status = module.status[dim.key];
                if (!status) return '';
                return `
                    <div class="status-item">
                        <strong>${dim.name}：</strong>
                        ${status.status} ${status.description || ''}
                    </div>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>
        `;
        
        const filename = `${module.code}_report_${new Date().toISOString().split('T')[0]}.html`;
        this.app.utils.downloadFile(html, filename, 'text/html');
        this.app.showNotification('模組報告已下載', 'success');
    }
}