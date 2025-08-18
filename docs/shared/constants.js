/**
 * 共用常數定義
 */

// 模組定義
export const MODULE_DEFINITIONS = [
    { code: 'DSH', name: 'Dashboard', zhName: '首頁/儀表板' },
    { code: 'CRM', name: 'Customer Relationship Management', zhName: '客戶管理' },
    { code: 'BDM', name: 'Basic Data Maintenance', zhName: '基本資料維護' },
    { code: 'IM', name: 'Item Management', zhName: '品項管理' },
    { code: 'OP', name: 'Operations Planning', zhName: '營運計劃' },
    { code: 'OM', name: 'Order Management', zhName: '訂單管理' },
    { code: 'MES', name: 'Manufacturing Execution System', zhName: '生產管理' },
    { code: 'WMS', name: 'Warehouse Management System', zhName: '庫存管理' },
    { code: 'PM', name: 'Purchasing Management', zhName: '採購管理' },
    { code: 'LM', name: 'Logistics Management', zhName: '物流管理' },
    { code: 'FA', name: 'Finance & Accounting', zhName: '財務會計' },
    { code: 'BI', name: 'Business Intelligence', zhName: '分析&BI' },
    { code: 'SA', name: 'System Administration', zhName: '系統管理' },
    { code: 'UP', name: 'User Profile', zhName: '登出/個人資訊' }
];

// 維度定義
export const DIMENSION_DEFINITIONS = [
    { key: 'oldSystem', name: '舊系統狀態', icon: 'fa-server' },
    { key: 'newSystem', name: '新系統更新', icon: 'fa-code' },
    { key: 'prd', name: 'PRD完成度', icon: 'fa-file-alt' },
    { key: 'integration', name: '系統整合', icon: 'fa-plug' },
    { key: 'unitTest', name: '單元測試', icon: 'fa-vial' },
    { key: 'integrationTest', name: '整合測試', icon: 'fa-flask' },
    { key: 'issues', name: '錯誤追蹤', icon: 'fa-bug' },
    { key: 'progress', name: '上線進度', icon: 'fa-rocket' }
];

// 狀態符號映射
export const STATUS_SYMBOLS = {
    completed: '✅',
    inProgress: '🟡',
    notStarted: '🔴',
    planning: '⚪',
    none: '-'
};

// 狀態文字映射
export const STATUS_TEXTS = {
    '✅': '完成',
    '🟡': '進行中',
    '🔴': '未開始',
    '⚪': '規劃中',
    '-': '不適用'
};

// 狀態顏色映射
export const STATUS_COLORS = {
    '✅': '#10B981', // green
    '🟡': '#F59E0B', // yellow
    '🔴': '#EF4444', // red
    '⚪': '#9CA3AF', // gray
    '-': '#E5E7EB'   // light gray
};

// 預設模組狀態資料
export const DEFAULT_MODULE_STATUS = {
    'DSH': { progress: 30, oldSystem: '🔴', newSystem: '🟡', prd: '🟡', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' },
    'CRM': { progress: 25, oldSystem: '✅', newSystem: '🟡', prd: '🟡', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' },
    'BDM': { progress: 15, oldSystem: '🔴', newSystem: '🟡', prd: '🟡', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' },
    'IM': { progress: 0, oldSystem: '✅', newSystem: '🔴', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'OP': { progress: 20, oldSystem: '🔴', newSystem: '🟡', prd: '🟡', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' },
    'OM': { progress: 0, oldSystem: '✅', newSystem: '🔴', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'MES': { progress: 0, oldSystem: '✅', newSystem: '🔴', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'WMS': { progress: 0, oldSystem: '✅', newSystem: '🔴', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'PM': { progress: 0, oldSystem: '✅', newSystem: '🔴', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'LM': { progress: 0, oldSystem: '✅', newSystem: '🔴', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'FA': { progress: 15, oldSystem: '✅', newSystem: '🟡', prd: '🟡', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' },
    'BI': { progress: 0, oldSystem: '🔴', newSystem: '⚪', prd: '⚪', integration: '🔴', unitTest: '🔴', integrationTest: '🔴' },
    'SA': { progress: 10, oldSystem: '✅', newSystem: '🟡', prd: '⚪', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' },
    'UP': { progress: 20, oldSystem: '✅', newSystem: '🟡', prd: '⚪', integration: '🟡', unitTest: '🔴', integrationTest: '🔴' }
};