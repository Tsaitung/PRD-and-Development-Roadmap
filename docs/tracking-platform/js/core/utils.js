/**
 * 工具函數集合
 */

export class TrackingUtils {
    constructor() {
        // 狀態符號映射
        this.statusSymbols = {
            completed: '✅',
            inProgress: '🟡',
            notStarted: '🔴',
            planning: '⚪',
            none: '-'
        };
        
        // 狀態文字映射
        this.statusTexts = {
            '✅': '完成',
            '🟡': '進行中',
            '🔴': '未開始',
            '⚪': '規劃中',
            '-': '不適用'
        };
        
        // 狀態顏色映射
        this.statusColors = {
            '✅': '#10B981', // green
            '🟡': '#F59E0B', // yellow
            '🔴': '#EF4444', // red
            '⚪': '#9CA3AF', // gray
            '-': '#E5E7EB'   // light gray
        };
    }
    
    /**
     * 解析狀態符號
     */
    parseStatus(status) {
        if (typeof status === 'object' && status.status) {
            status = status.status;
        }
        
        return {
            symbol: status,
            text: this.statusTexts[status] || '未知',
            color: this.statusColors[status] || '#6B7280',
            value: this.getStatusValue(status)
        };
    }
    
    /**
     * 獲取狀態數值（用於計算）
     */
    getStatusValue(status) {
        const values = {
            '✅': 100,
            '🟡': 50,
            '🔴': 0,
            '⚪': 0,
            '-': null
        };
        return values[status] !== undefined ? values[status] : 0;
    }
    
    /**
     * 計算進度百分比
     */
    calculateProgress(statuses) {
        const validStatuses = statuses.filter(s => s !== '-');
        if (validStatuses.length === 0) return 0;
        
        const total = validStatuses.reduce((sum, status) => {
            return sum + this.getStatusValue(status);
        }, 0);
        
        return Math.round(total / validStatuses.length);
    }
    
    /**
     * 評估風險等級
     */
    assessRisk(moduleData) {
        const progress = moduleData.progress || 0;
        const hasTests = moduleData.status.unitTest?.status === '✅' || 
                        moduleData.status.integrationTest?.status === '✅';
        const hasPRD = moduleData.status.prd?.status === '✅' || 
                      moduleData.status.prd?.status === '🟡';
        
        // 風險評分
        let riskScore = 0;
        
        // 進度風險
        if (progress < 20) riskScore += 3;
        else if (progress < 50) riskScore += 2;
        else if (progress < 80) riskScore += 1;
        
        // 測試風險
        if (!hasTests) riskScore += 2;
        
        // 文件風險
        if (!hasPRD) riskScore += 1;
        
        // 判定風險等級
        if (riskScore >= 5) return { level: 'high', text: '高風險', color: '#EF4444' };
        if (riskScore >= 3) return { level: 'medium', text: '中風險', color: '#F59E0B' };
        return { level: 'low', text: '低風險', color: '#10B981' };
    }
    
    /**
     * 格式化日期
     */
    formatDate(date, format = 'full') {
        if (!date) return '-';
        
        const d = new Date(date);
        const options = {
            full: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
            date: { year: 'numeric', month: '2-digit', day: '2-digit' },
            time: { hour: '2-digit', minute: '2-digit' },
            relative: null
        };
        
        if (format === 'relative') {
            return this.getRelativeTime(d);
        }
        
        return d.toLocaleString('zh-TW', options[format] || options.full);
    }
    
    /**
     * 獲取相對時間
     */
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} 天前`;
        if (hours > 0) return `${hours} 小時前`;
        if (minutes > 0) return `${minutes} 分鐘前`;
        return '剛剛';
    }
    
    /**
     * 生成 CSV 內容
     */
    generateCSV(data) {
        const headers = ['模組', '舊系統', '新系統', 'PRD', '整合', '單元測試', '整合測試', '進度'];
        const rows = [headers];
        
        data.modules.forEach(module => {
            const row = [
                module.code,
                module.status.oldSystem?.status || '-',
                module.status.newSystem?.status || '-',
                module.status.prd?.status || '-',
                module.status.integration?.status || '-',
                module.status.unitTest?.status || '-',
                module.status.integrationTest?.status || '-',
                `${module.progress}%`
            ];
            rows.push(row);
        });
        
        // 轉換為 CSV 字串
        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    /**
     * 下載檔案
     */
    downloadFile(content, filename, type = 'text/csv') {
        const blob = new Blob([content], { type: `${type};charset=utf-8;` });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    
    /**
     * 深拷貝物件
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * 防抖函數
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 節流函數
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * 獲取顏色的透明度版本
     */
    getColorWithAlpha(color, alpha) {
        // 如果是 hex 顏色
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }
    
    /**
     * 篩選模組
     */
    filterModules(modules, filters) {
        return modules.filter(module => {
            // 搜尋篩選
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchCode = module.code.toLowerCase().includes(searchLower);
                const matchName = module.name.toLowerCase().includes(searchLower);
                const matchZhName = module.zhName.includes(filters.search);
                if (!matchCode && !matchName && !matchZhName) return false;
            }
            
            // 狀態篩選
            if (filters.status) {
                const progress = module.progress;
                switch (filters.status) {
                    case 'completed':
                        if (progress < 100) return false;
                        break;
                    case 'in-progress':
                        if (progress === 0 || progress === 100) return false;
                        break;
                    case 'not-started':
                        if (progress > 0) return false;
                        break;
                    case 'planning':
                        if (module.status.newSystem?.status !== '⚪') return false;
                        break;
                }
            }
            
            // 模組篩選
            if (filters.module && module.code !== filters.module) {
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * 排序模組
     */
    sortModules(modules, sortBy = 'code', order = 'asc') {
        const sorted = [...modules].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'code':
                    valueA = a.code;
                    valueB = b.code;
                    break;
                case 'progress':
                    valueA = a.progress;
                    valueB = b.progress;
                    break;
                case 'risk':
                    valueA = this.assessRisk(a).level;
                    valueB = this.assessRisk(b).level;
                    break;
                default:
                    return 0;
            }
            
            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }
    
    /**
     * 計算統計資料
     */
    calculateStatistics(modules) {
        const stats = {
            total: modules.length,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            planning: 0,
            avgProgress: 0,
            riskHigh: 0,
            riskMedium: 0,
            riskLow: 0
        };
        
        let totalProgress = 0;
        
        modules.forEach(module => {
            // 進度統計
            const progress = module.progress;
            totalProgress += progress;
            
            if (progress === 100) stats.completed++;
            else if (progress > 0) stats.inProgress++;
            else if (module.status.newSystem?.status === '⚪') stats.planning++;
            else stats.notStarted++;
            
            // 風險統計
            const risk = this.assessRisk(module);
            if (risk.level === 'high') stats.riskHigh++;
            else if (risk.level === 'medium') stats.riskMedium++;
            else stats.riskLow++;
        });
        
        stats.avgProgress = modules.length > 0 ? Math.round(totalProgress / modules.length) : 0;
        
        return stats;
    }
    
    /**
     * 生成唯一 ID
     */
    generateId() {
        return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 複製到剪貼簿
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('複製失敗:', err);
            return false;
        }
    }
}