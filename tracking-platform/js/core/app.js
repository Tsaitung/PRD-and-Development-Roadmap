/**
 * 菜蟲農食 ERP 統一追蹤平台 - 主應用程式
 */

import { TrackingDataManager } from './data-manager.js';
import { TrackingUtils } from './utils.js';
import { OverviewView } from '../views/overview.js';
import { DashboardView } from '../views/dashboard.js';
import { AnalyticsView } from '../views/analytics.js';
import { RiskView } from '../views/risk.js';
import { ToolsView } from '../views/tools.js';
import { TrendAnalysis } from '../modules/trend-analysis.js';
import { TrendsView } from '../views/trends.js';
import { CollaborationSystem } from '../modules/collaboration.js';

class TrackingPlatformApp {
    constructor() {
        // 核心模組
        this.dataManager = new TrackingDataManager();
        this.utils = new TrackingUtils();
        this.trendAnalysis = new TrendAnalysis(this);
        this.collaboration = new CollaborationSystem(this);
        
        // 視圖模組
        this.views = {
            overview: new OverviewView(this),
            dashboard: new DashboardView(this),
            analytics: new AnalyticsView(this),
            risk: new RiskView(this),
            tools: new ToolsView(this),
            trends: new TrendsView(this)
        };
        
        // 初始化趨勢視圖
        this.views.trends.init(this.trendAnalysis);
        
        // 應用狀態
        this.state = {
            currentTab: 'overview',
            loading: false,
            lastUpdated: null,
            filters: {
                search: '',
                status: '',
                module: ''
            }
        };
        
        // 初始化
        this.init();
    }
    
    async init() {
        try {
            // 顯示載入動畫
            this.showLoader(true);
            
            // 載入資料
            await this.loadData();
            
            // 初始化協作系統
            this.collaboration.init();
            
            // 設置事件監聽器
            this.setupEventListeners();
            
            // 渲染初始視圖
            this.renderCurrentView();
            
            // 隱藏載入動畫，顯示應用
            this.showLoader(false);
            document.getElementById('app').classList.remove('hidden');
            
            // 更新最後更新時間
            this.updateLastUpdatedTime();
            
            // 檢查 URL 參數
            this.handleUrlParams();
            
        } catch (error) {
            console.error('應用初始化失敗:', error);
            this.showError('系統初始化失敗，請重新整理頁面');
        }
    }
    
    async loadData() {
        try {
            await this.dataManager.loadData();
            this.state.lastUpdated = new Date();
            
            // 記錄每日快照（用於趨勢分析）
            this.trendAnalysis.recordSnapshot();
        } catch (error) {
            console.error('資料載入失敗:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Tab 切換
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // 協作按鈕
        document.getElementById('collab-btn').addEventListener('click', () => {
            this.collaboration.showTeamPanel();
        });
        
        // 同步按鈕
        document.getElementById('sync-btn').addEventListener('click', () => {
            this.handleSync();
        });
        
        // 設定按鈕
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // 幫助按鈕
        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });
        
        // 快速操作按鈕
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn')) {
                this.handleQuickAction(e.target.closest('.quick-action-btn'));
            }
        });
        
        // 搜尋和篩選
        const searchInput = document.getElementById('module-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.filters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.state.filters.status = e.target.value;
                this.applyFilters();
            });
        }
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // 窗口大小變化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    switchTab(tab) {
        // 更新狀態
        this.state.currentTab = tab;
        
        // 更新 UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active', 'border-white');
                btn.classList.remove('text-opacity-75');
            } else {
                btn.classList.remove('active', 'border-white');
                btn.classList.add('text-opacity-75');
            }
        });
        
        // 隱藏所有內容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // 顯示當前內容
        const currentContent = document.getElementById(`${tab}-tab`);
        if (currentContent) {
            currentContent.classList.remove('hidden');
        }
        
        // 渲染視圖
        this.renderCurrentView();
        
        // 更新 URL
        this.updateUrl();
    }
    
    renderCurrentView() {
        const view = this.views[this.state.currentTab];
        if (view && view.render) {
            view.render();
        }
    }
    
    async handleSync() {
        try {
            this.showNotification('開始同步資料...', 'info');
            
            // 顯示同步動畫
            const syncBtn = document.getElementById('sync-btn');
            const icon = syncBtn.querySelector('i');
            icon.classList.add('fa-spin');
            
            // 重新載入資料
            await this.loadData();
            
            // 更新所有視圖
            this.renderCurrentView();
            this.updateLastUpdatedTime();
            
            // 停止動畫
            icon.classList.remove('fa-spin');
            
            this.showNotification('資料同步完成', 'success');
            
        } catch (error) {
            console.error('同步失敗:', error);
            this.showNotification('同步失敗，請稍後再試', 'error');
        }
    }
    
    showSettings() {
        // TODO: 實現設定模態框
        this.showNotification('設定功能開發中', 'info');
    }
    
    showHelp() {
        // TODO: 實現幫助模態框
        this.showNotification('使用說明功能開發中', 'info');
    }
    
    handleQuickAction(button) {
        const action = button.textContent.trim();
        
        switch (action) {
            case '匯出報表':
                this.views.tools.exportReport();
                break;
            case '執行同步':
                this.handleSync();
                break;
            case '查看趨勢':
                this.switchTab('analytics');
                break;
            case '通知設定':
                this.showNotificationSettings();
                break;
            default:
                console.log('未知的快速操作:', action);
        }
    }
    
    applyFilters() {
        // 通知當前視圖應用篩選
        const view = this.views[this.state.currentTab];
        if (view && view.applyFilters) {
            view.applyFilters(this.state.filters);
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: 同步
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.handleSync();
        }
        
        // Ctrl/Cmd + E: 匯出
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.views.tools.exportReport();
        }
        
        // Alt + 1-5: 切換標籤
        if (e.altKey) {
            const tabs = ['overview', 'dashboard', 'analytics', 'risk', 'tools'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabIndex >= 0 && tabIndex < tabs.length) {
                e.preventDefault();
                this.switchTab(tabs[tabIndex]);
            }
        }
    }
    
    handleResize() {
        // 通知視圖處理大小變化
        Object.values(this.views).forEach(view => {
            if (view.handleResize) {
                view.handleResize();
            }
        });
    }
    
    handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && this.views[tab]) {
            this.switchTab(tab);
        }
    }
    
    updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('tab', this.state.currentTab);
        window.history.pushState({}, '', url);
    }
    
    updateLastUpdatedTime() {
        const element = document.getElementById('last-updated');
        if (element && this.state.lastUpdated) {
            element.textContent = this.state.lastUpdated.toLocaleString('zh-TW');
        }
    }
    
    showLoader(show) {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} px-6 py-3 rounded-lg shadow-lg mb-4 flex items-center`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]} mr-3"></i>
            <span>${message}</span>
            <button class="ml-4 text-white opacity-75 hover:opacity-100" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // 自動移除
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
    
    showError(message) {
        this.showNotification(message, 'error', 5000);
    }
    
    showModal(title, content, maxWidth = 'max-w-lg') {
        const container = document.getElementById('modal-container');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="modal-backdrop fixed inset-0" onclick="this.parentElement.remove()"></div>
            <div class="modal-content bg-white rounded-xl shadow-2xl p-6 ${maxWidth} w-full mx-4 z-10">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold text-gray-900">${title}</h3>
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        container.appendChild(modal);
    }
    
    // 公共 API
    getData() {
        return this.dataManager.getData();
    }
    
    getModules() {
        return this.dataManager.getModules();
    }
    
    getModule(code) {
        return this.dataManager.getModule(code);
    }
    
    getModuleStatus(moduleCode) {
        return this.dataManager.getModuleStatus(moduleCode);
    }
    
    getDimensionStats() {
        return this.dataManager.getDimensionStats();
    }
    
    getCompletedCount() {
        return this.dataManager.getCompletedCount();
    }
    
    showNotificationSettings() {
        this.showNotification('通知設定功能開發中', 'info');
    }
    
    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    window.trackingApp = new TrackingPlatformApp();
});