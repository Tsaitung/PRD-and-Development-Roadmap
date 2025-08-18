/**
 * 歷史趨勢分析模組
 * 追蹤和分析專案進度的歷史變化
 */

export class TrendAnalysis {
    constructor(app) {
        this.app = app;
        this.storageKey = 'progressHistory';
        this.maxDataPoints = 90; // 保留最近90天的數據
    }
    
    /**
     * 記錄當前進度快照
     */
    recordSnapshot() {
        const data = this.app.getData();
        if (!data) return;
        
        const snapshot = {
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            overallProgress: data.overallProgress,
            modules: data.modules.map(m => ({
                code: m.code,
                progress: m.progress,
                status: {
                    oldSystem: m.status.oldSystem?.status,
                    newSystem: m.status.newSystem?.status,
                    prd: m.status.prd?.status,
                    integration: m.status.integration?.status,
                    unitTest: m.status.unitTest?.status,
                    integrationTest: m.status.integrationTest?.status
                }
            })),
            dimensionStats: data.statusDimensions,
            completedCount: this.app.getCompletedCount(),
            totalModules: data.totalModules
        };
        
        // 儲存快照
        this.saveSnapshot(snapshot);
    }
    
    /**
     * 儲存快照到本地存儲
     */
    saveSnapshot(snapshot) {
        const history = this.getHistory();
        
        // 檢查是否已有今天的記錄
        const todayIndex = history.findIndex(h => h.date === snapshot.date);
        if (todayIndex >= 0) {
            // 更新今天的記錄
            history[todayIndex] = snapshot;
        } else {
            // 新增記錄
            history.push(snapshot);
        }
        
        // 保留最近的記錄
        if (history.length > this.maxDataPoints) {
            history.splice(0, history.length - this.maxDataPoints);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }
    
    /**
     * 獲取歷史記錄
     */
    getHistory() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }
    
    /**
     * 獲取特定時間範圍的歷史
     */
    getHistoryRange(days = 30) {
        const history = this.getHistory();
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        return history.filter(h => h.timestamp >= cutoffDate);
    }
    
    /**
     * 分析進度趨勢
     */
    analyzeTrends(days = 30) {
        const history = this.getHistoryRange(days);
        if (history.length < 2) {
            return null;
        }
        
        const first = history[0];
        const last = history[history.length - 1];
        const daysDiff = Math.ceil((last.timestamp - first.timestamp) / (24 * 60 * 60 * 1000));
        
        return {
            overallTrend: {
                startProgress: first.overallProgress,
                currentProgress: last.overallProgress,
                change: last.overallProgress - first.overallProgress,
                averagePerDay: daysDiff > 0 ? (last.overallProgress - first.overallProgress) / daysDiff : 0
            },
            moduleTrends: this.analyzeModuleTrends(history),
            completionRate: this.calculateCompletionRate(history),
            projectedCompletion: this.projectCompletion(history)
        };
    }
    
    /**
     * 分析各模組趨勢
     */
    analyzeModuleTrends(history) {
        if (history.length < 2) return [];
        
        const first = history[0];
        const last = history[history.length - 1];
        
        return last.modules.map(currentModule => {
            const firstModule = first.modules.find(m => m.code === currentModule.code);
            if (!firstModule) return null;
            
            return {
                code: currentModule.code,
                startProgress: firstModule.progress,
                currentProgress: currentModule.progress,
                change: currentModule.progress - firstModule.progress,
                trend: currentModule.progress > firstModule.progress ? 'up' : 
                       currentModule.progress < firstModule.progress ? 'down' : 'stable'
            };
        }).filter(Boolean);
    }
    
    /**
     * 計算完成率
     */
    calculateCompletionRate(history) {
        if (history.length < 7) return null;
        
        // 計算過去7天的平均完成率
        const recentHistory = history.slice(-7);
        let totalProgress = 0;
        
        for (let i = 1; i < recentHistory.length; i++) {
            const dailyProgress = recentHistory[i].overallProgress - recentHistory[i-1].overallProgress;
            totalProgress += Math.max(0, dailyProgress); // 只計算正向進度
        }
        
        return totalProgress / (recentHistory.length - 1);
    }
    
    /**
     * 預測完成時間
     */
    projectCompletion(history) {
        const completionRate = this.calculateCompletionRate(history);
        if (!completionRate || completionRate <= 0) return null;
        
        const last = history[history.length - 1];
        const remainingProgress = 100 - last.overallProgress;
        const daysToComplete = Math.ceil(remainingProgress / completionRate);
        
        const projectedDate = new Date();
        projectedDate.setDate(projectedDate.getDate() + daysToComplete);
        
        return {
            daysRemaining: daysToComplete,
            projectedDate: projectedDate.toISOString().split('T')[0],
            confidence: this.calculateConfidence(history)
        };
    }
    
    /**
     * 計算預測信心度
     */
    calculateConfidence(history) {
        if (history.length < 14) return 'low';
        
        // 計算進度變化的標準差
        const changes = [];
        for (let i = 1; i < history.length; i++) {
            changes.push(history[i].overallProgress - history[i-1].overallProgress);
        }
        
        const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
        const variance = changes.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / changes.length;
        const stdDev = Math.sqrt(variance);
        
        // 根據標準差判斷信心度
        if (stdDev < 0.5) return 'high';
        if (stdDev < 1.0) return 'medium';
        return 'low';
    }
    
    /**
     * 生成趨勢圖表數據
     */
    generateChartData(days = 30) {
        const history = this.getHistoryRange(days);
        
        return {
            labels: history.map(h => h.date),
            datasets: [
                {
                    label: '整體進度',
                    data: history.map(h => h.overallProgress),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1
                },
                {
                    label: '已完成模組',
                    data: history.map(h => (h.completedCount / h.totalModules) * 100),
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.1
                }
            ]
        };
    }
    
    /**
     * 生成模組進度熱力圖數據
     */
    generateHeatmapData(days = 30) {
        const history = this.getHistoryRange(days);
        const modules = this.app.dataManager.moduleDefinitions;
        
        const heatmapData = modules.map(module => {
            return {
                code: module.code,
                data: history.map(snapshot => {
                    const moduleData = snapshot.modules.find(m => m.code === module.code);
                    return {
                        date: snapshot.date,
                        progress: moduleData ? moduleData.progress : 0
                    };
                })
            };
        });
        
        return heatmapData;
    }
    
    /**
     * 導出趨勢報告
     */
    exportTrendReport() {
        const trends = this.analyzeTrends(30);
        const history = this.getHistoryRange(30);
        
        if (!trends) {
            this.app.showNotification('歷史數據不足，無法生成報告', 'error');
            return;
        }
        
        const report = {
            generatedAt: new Date().toISOString(),
            period: {
                start: history[0].date,
                end: history[history.length - 1].date,
                days: history.length
            },
            summary: {
                overallProgress: trends.overallTrend,
                averageDailyProgress: trends.completionRate,
                projection: trends.projectedCompletion
            },
            moduleDetails: trends.moduleTrends,
            rawData: history
        };
        
        const jsonStr = JSON.stringify(report, null, 2);
        const filename = `trend-report-${new Date().toISOString().split('T')[0]}.json`;
        this.app.utils.downloadFile(jsonStr, filename, 'application/json');
        
        this.app.showNotification('趨勢報告已下載', 'success');
    }
}