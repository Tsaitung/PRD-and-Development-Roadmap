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
            submoduleStats: null,
            migrationStatus: null,
            status: {},
            progress: 0
        };
        
        // 解析子模組詳細資訊
        const submoduleRegex = new RegExp(`\\d+\\.\\d+\\.\\s*\\[${moduleDef.code}-([A-Z-]+)\\]\\s*([^\\(\\n]+)(?:\\(([^\\)]+)\\))?`, 'g');
        let submoduleMatch;
        while ((submoduleMatch = submoduleRegex.exec(content)) !== null) {
            const submoduleData = {
                code: `${moduleDef.code}-${submoduleMatch[1]}`,
                shortCode: submoduleMatch[1],
                name: submoduleMatch[2].trim(),
                path: submoduleMatch[3] || null,
                status: '🔴' // 預設為未開始
            };
            
            // 根據路徑判斷子模組狀態
            if (submoduleData.path) {
                if (submoduleData.path.includes('.tsx') || submoduleData.path.includes('.ts')) {
                    submoduleData.status = '🟡'; // 有程式碼檔案，開發中
                }
            }
            
            moduleData.submodules.push(submoduleData);
        }
        
        moduleData.submoduleCount = moduleData.submodules.length;
        
        // 尋找模組狀態表格
        const regex = new RegExp(`#### 📊 ${moduleDef.code} 模組狀態追蹤[\\s\\S]*?(?=####|###|$)`, 'g');
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
                        
                        // 解析子模組統計
                        if (dimension === '子模組統計') {
                            moduleData.submoduleStats = {
                                text: status,
                                description: description
                            };
                        }
                        
                        // 解析舊系統轉移狀態
                        if (dimension === '舊系統轉移') {
                            moduleData.migrationStatus = {
                                status: status,
                                description: description
                            };
                        }
                        
                        // 解析PRD功能進度
                        if (dimension === 'PRD功能進度') {
                            moduleData.prdDetails = this.parsePRDDetails(status, description);
                        }
                    }
                }
            });
        } else {
            // 使用預設狀態
            moduleData.status = this.getDefaultModuleStatus(moduleDef.code);
            moduleData.progress = DEFAULT_MODULE_STATUS[moduleDef.code]?.progress || 0;
        }
        
        // 計算子模組統計
        if (moduleData.submodules.length > 0) {
            const completedCount = moduleData.submodules.filter(s => s.status === '✅').length;
            const inProgressCount = moduleData.submodules.filter(s => s.status === '🟡').length;
            
            if (!moduleData.submoduleStats) {
                moduleData.submoduleStats = {
                    text: `${completedCount + inProgressCount}/${moduleData.submoduleCount}`,
                    description: `${completedCount}完成, ${inProgressCount}開發中, ${moduleData.submoduleCount - completedCount - inProgressCount}未開始`
                };
            }
        }
        
        return moduleData;
    }
    
    /**
     * 解析PRD詳細資訊
     */
    parsePRDDetails(status, description) {
        const details = {
            percentage: status,
            frCount: 0,
            developing: 0,
            notStarted: 0,
            planning: 0,
            version: null
        };
        
        // 解析FR統計 (例如: "11個FR: 2開發中/4未開始/5規劃中")
        const frMatch = description.match(/(\d+)個FR[:：]\s*(\d+)開發中\/(\d+)未開始\/(\d+)規劃中/);
        if (frMatch) {
            details.frCount = parseInt(frMatch[1]);
            details.developing = parseInt(frMatch[2]);
            details.notStarted = parseInt(frMatch[3]);
            details.planning = parseInt(frMatch[4]);
        }
        
        // 解析版本號
        const versionMatch = description.match(/v([\d.]+)/);
        if (versionMatch) {
            details.version = versionMatch[1];
        }
        
        return details;
    }
    
    /**
     * 獲取維度鍵
     */
    getDimensionKey(dimensionName) {
        const mapping = {
            '舊系統狀態': 'oldSystem',
            '轉移進度': 'migrationProgress',
            '新系統更新': 'newSystem',
            'PRD完成度': 'prd',
            'PRD功能進度': 'prdProgress',
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