/**
 * 統一資料管理器 - 管理所有資料的載入、快取和狀態
 */

import { TOCParser } from '../../../shared/toc-parser.js';
import { MODULE_DEFINITIONS, DIMENSION_DEFINITIONS } from '../../../shared/constants.js';
import { config } from '../../config.js';

export class TrackingDataManager {
    constructor() {
        this.data = null;
        this.cache = new Map();
        this.listeners = new Set();
        this.lastFetch = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5分鐘快取
        
        // 使用共用的定義
        this.moduleDefinitions = MODULE_DEFINITIONS;
        this.dimensions = DIMENSION_DEFINITIONS;
        
        // 初始化解析器
        this.parser = new TOCParser();
    }
    
    /**
     * 載入資料
     */
    async loadData(forceRefresh = false) {
        // 檢查快取
        if (!forceRefresh && this.isCacheValid()) {
            return this.data;
        }
        
        try {
            let content;
            
            // 如果是 GitHub Pages 環境，使用 GitHub raw URL
            if (config.environment === 'production') {
                content = await this.fetchFromGitHub();
            } else {
                // 本地開發環境，使用相對路徑
                const response = await fetch(config.tocModulesPath);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                content = await response.text();
            }
            
            this.data = this.parser.parseTOCContent(content);
            this.lastFetch = Date.now();
            
            // 通知所有監聽器
            this.notifyListeners('dataLoaded', this.data);
            
            return this.data;
            
        } catch (error) {
            console.error('載入資料失敗:', error);
            
            // 使用備份資料
            this.data = this.parser.getDefaultData();
            this.notifyListeners('dataError', error);
            
            return this.data;
        }
    }
    
    /**
     * 從 GitHub 獲取 TOC Modules.md
     */
    async fetchFromGitHub() {
        const maxRetries = 3;
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                // 使用 GitHub raw content URL
                const rawUrl = config.githubRawUrl || 'https://raw.githubusercontent.com/tsaitung/PRD-and-Development-Roadmap/main/TOC%20Modules.md';
                
                console.log(`嘗試從 GitHub 載入 (${i + 1}/${maxRetries}):`, rawUrl);
                
                const response = await fetch(rawUrl);
                
                if (!response.ok) {
                    throw new Error(`GitHub fetch failed: ${response.status}`);
                }
                
                const content = await response.text();
                console.log('成功從 GitHub 載入 TOC Modules.md');
                
                return content;
                
            } catch (error) {
                lastError = error;
                console.warn(`GitHub 載入失敗 (嘗試 ${i + 1}):`, error);
                
                // 如果不是最後一次嘗試，等待後重試
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
        
        // 所有嘗試都失敗，拋出錯誤
        throw lastError;
    }
    
    /**
     * 檢查快取是否有效
     */
    isCacheValid() {
        return this.data && this.lastFetch && (Date.now() - this.lastFetch < this.cacheTimeout);
    }
    
    /**
     * 訂閱資料變更
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    /**
     * 通知監聽器
     */
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener(event, data);
            }
        });
    }
    
    // 公共 API 方法
    
    getData() {
        return this.data;
    }
    
    getModules() {
        return this.data ? this.data.modules : [];
    }
    
    getModule(code) {
        return this.getModules().find(m => m.code === code);
    }
    
    getModuleStatus(code) {
        const module = this.getModule(code);
        return module ? module.status : null;
    }
    
    getDimensionStats() {
        return this.data ? this.data.statusDimensions : {};
    }
    
    getOverallProgress() {
        return this.data ? this.data.overallProgress : 0;
    }
    
    getTotalModules() {
        return this.data ? this.data.totalModules : 0;
    }
    
    getTotalSubmodules() {
        return this.data ? this.data.totalSubmodules : 0;
    }
    
    getCompletedCount() {
        if (!this.data) return 0;
        
        return this.getModules().filter(m => m.progress >= 100).length;
    }
    
    getRiskModules() {
        return this.getModules().filter(m => {
            // 進度低於 20% 且不是規劃中
            return m.progress < 20 && m.status.newSystem?.status !== '⚪';
        });
    }
    
    getInProgressModules() {
        return this.getModules().filter(m => {
            return m.progress > 0 && m.progress < 100;
        });
    }
}