/**
 * 統一追蹤平台配置
 */

// 檢測環境
const isGitHubPages = window.location.hostname.includes('github.io');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 獲取基礎路徑
const getBasePath = () => {
    if (isGitHubPages) {
        // GitHub Pages 環境
        const pathParts = window.location.pathname.split('/').filter(p => p);
        if (pathParts.length > 0 && pathParts[0] !== 'tracking-platform') {
            // 有 repository 名稱
            return `/${pathParts[0]}`;
        }
        return '';
    }
    return '';
};

// 配置對象
export const config = {
    environment: isGitHubPages ? 'production' : 'development',
    basePath: getBasePath(),
    
    // 資料檔案路徑
    tocModulesPath: isGitHubPages 
        ? `${getBasePath()}/TOC%20Modules.md` 
        : '../../TOC%20Modules.md',
    
    // API 端點（未來使用）
    apiEndpoint: null,
    
    // 快取設定
    cacheTimeout: 5 * 60 * 1000, // 5 分鐘
    
    // 功能開關
    features: {
        analytics: true,
        riskManagement: true,
        collaboration: false, // 未來功能
        historyTracking: false // 未來功能
    }
};

// 輔助函數
export const getAssetPath = (path) => {
    if (isGitHubPages) {
        return `${config.basePath}${path}`;
    }
    return path;
};

console.log('Platform Config:', {
    environment: config.environment,
    basePath: config.basePath,
    tocModulesPath: config.tocModulesPath
});