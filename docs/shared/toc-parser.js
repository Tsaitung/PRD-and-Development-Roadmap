/**
 * TOC Modules.md 檔案解析器
 * 統一的解析邏輯，避免重複代碼
 */

import { MODULE_DEFINITIONS, DIMENSION_DEFINITIONS, DEFAULT_MODULE_STATUS } from './constants.js';

export class TOCParser {
    constructor() {
        this.modules = MODULE_DEFINITIONS;
        this.dimensions = DIMENSION_DEFINITIONS;
    }
    
    /**
     * 解析 TOC 內容
     * @param {string} content - TOC Modules.md 的內容
     * @returns {Object} 解析後的資料
     */
    parseTOCContent(content) {
        const data = {
            modules: [],
            overallProgress: 0,
            totalModules: 0,
            totalSubmodules: 0,
            statusDimensions: this.initializeDimensionStats(),
            lastUpdated: new Date().toISOString()
        };
        
        // 找到模組階層結構部分
        const moduleSection = content.split('## 完整模組階層結構')[1];
        if (!moduleSection) {
            console.error('找不到模組階層結構');
            return this.getDefaultData();
        }
        
        // 解析每個模組
        this.modules.forEach(moduleDef => {
            const moduleData = this.parseModuleSection(moduleSection, moduleDef);
            if (moduleData) {
                data.modules.push(moduleData);
                data.totalModules++;
                
                // 更新維度統計
                this.updateDimensionStats(data.statusDimensions, moduleData);
            }
        });
        
        // 計算整體進度
        data.overallProgress = this.calculateOverallProgress(data.modules);
        
        // 解析總體統計（如果有）
        const statsMatch = content.match(/平均上線進度[：:]\\s*(\\d+)%/);
        if (statsMatch) {
            data.overallProgress = parseInt(statsMatch[1]);
        }
        
        // 計算子模組總數
        data.totalSubmodules = data.modules.reduce((sum, m) => sum + m.submoduleCount, 0);
        
        return data;
    }
    
    /**
     * 解析單個模組部分
     */
    parseModuleSection(content, moduleDef) {
        const moduleData = {
            code: moduleDef.code,
            name: moduleDef.name,
            zhName: moduleDef.zhName,
            submodules: [],
            submoduleCount: 0,
            status: {},
            progress: 0
        };
        
        // 尋找模組狀態表格
        const regex = new RegExp(`#### 📊 ${moduleDef.code} 模組狀態追蹤[\\s\\S]*?(?=####|$)`, 'g');
        const match = content.match(regex);
        
        if (match && match[0]) {
            const statusSection = match[0];
            
            // 解析狀態表格
            const lines = statusSection.split('\\n');
            lines.forEach(line => {
                if (line.includes('|') && !line.includes('維度') && !line.includes('---')) {
                    const parts = line.split('|').map(p => p.trim()).filter(p => p);
                    if (parts.length >= 3) {
                        const dimension = parts[0];
                        const status = parts[1];
                        const description = parts[2];
                        
                        // 映射維度名稱到鍵
                        const dimKey = this.getDimensionKey(dimension);
                        if (dimKey) {
                            moduleData.status[dimKey] = {
                                status: status,
                                description: description
                            };
                            
                            // 特殊處理進度
                            if (dimKey === 'progress') {
                                const progressMatch = status.match(/(\\d+)%/);
                                if (progressMatch) {
                                    moduleData.progress = parseInt(progressMatch[1]);
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // 使用預設狀態
            moduleData.status = this.getDefaultModuleStatus(moduleDef.code);
            moduleData.progress = DEFAULT_MODULE_STATUS[moduleDef.code]?.progress || 0;
        }
        
        // 計算子模組數量
        const submoduleRegex = new RegExp(`\\\\d+\\\\.\\\\d+\\\\.\\\\s*\\\\[${moduleDef.code}-[A-Z-]+\\\\]`, 'g');
        const submoduleMatches = content.match(submoduleRegex);
        moduleData.submoduleCount = submoduleMatches ? submoduleMatches.length : 0;
        
        return moduleData;
    }
    
    /**
     * 獲取維度鍵
     */
    getDimensionKey(dimensionName) {
        const mapping = {
            '舊系統狀態': 'oldSystem',
            '新系統更新': 'newSystem',
            'PRD完成度': 'prd',
            '系統整合': 'integration',
            '單元測試': 'unitTest',
            '整合測試': 'integrationTest',
            '錯誤追蹤': 'issues',
            '上線進度': 'progress'
        };
        return mapping[dimensionName];
    }
    
    /**
     * 初始化維度統計
     */
    initializeDimensionStats() {
        const stats = {};
        this.dimensions.forEach(dim => {
            if (dim.key !== 'progress' && dim.key !== 'issues') {
                stats[dim.key] = {
                    complete: 0,
                    inProgress: 0,
                    notStarted: 0,
                    planning: 0,
                    total: 0
                };
            }
        });
        return stats;
    }
    
    /**
     * 更新維度統計
     */
    updateDimensionStats(stats, moduleData) {
        Object.entries(moduleData.status).forEach(([key, value]) => {
            if (stats[key] && value.status) {
                stats[key].total++;
                
                switch (value.status) {
                    case '✅':
                        stats[key].complete++;
                        break;
                    case '🟡':
                        stats[key].inProgress++;
                        break;
                    case '🔴':
                        stats[key].notStarted++;
                        break;
                    case '⚪':
                        stats[key].planning++;
                        break;
                }
            }
        });
    }
    
    /**
     * 計算整體進度
     */
    calculateOverallProgress(modules) {
        if (modules.length === 0) return 0;
        
        const totalProgress = modules.reduce((sum, module) => {
            return sum + (module.progress || 0);
        }, 0);
        
        return Math.round(totalProgress / modules.length);
    }
    
    /**
     * 獲取預設資料
     */
    getDefaultData() {
        const data = {
            modules: [],
            overallProgress: 9,
            totalModules: 14,
            totalSubmodules: 61,
            statusDimensions: this.initializeDimensionStats(),
            lastUpdated: new Date().toISOString()
        };
        
        // 建立模組資料
        this.modules.forEach(moduleDef => {
            const status = DEFAULT_MODULE_STATUS[moduleDef.code] || {};
            const moduleData = {
                code: moduleDef.code,
                name: moduleDef.name,
                zhName: moduleDef.zhName,
                submodules: [],
                submoduleCount: 0,
                status: this.getDefaultModuleStatus(moduleDef.code),
                progress: status.progress || 0
            };
            
            data.modules.push(moduleData);
            this.updateDimensionStats(data.statusDimensions, moduleData);
        });
        
        return data;
    }
    
    /**
     * 獲取預設模組狀態
     */
    getDefaultModuleStatus(moduleCode) {
        const defaults = DEFAULT_MODULE_STATUS[moduleCode] || {};
        return {
            oldSystem: { status: defaults.oldSystem || '🔴', description: '' },
            newSystem: { status: defaults.newSystem || '🔴', description: '' },
            prd: { status: defaults.prd || '🔴', description: '' },
            integration: { status: defaults.integration || '🔴', description: '' },
            unitTest: { status: defaults.unitTest || '🔴', description: '' },
            integrationTest: { status: defaults.integrationTest || '🔴', description: '' },
            issues: { status: '-', description: '無相關 issues' },
            progress: { status: `${defaults.progress || 0}%`, description: '' }
        };
    }
}