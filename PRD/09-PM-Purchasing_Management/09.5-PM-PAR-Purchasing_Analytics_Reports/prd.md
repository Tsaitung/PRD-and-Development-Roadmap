# PM-PAR 採購分析與報表 (Purchasing Analytics & Reports) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM全模組, BI (商業智慧), FA (財務會計)

## 1. 功能概述

### 1.1 目的
提供全面的採購數據分析與報表系統，支援採購決策優化，實現成本節省目標，提升採購透明度與效率。

### 1.2 範圍
- 採購KPI監控
- 支出分析
- 供應商績效分析
- 預測分析
- 自訂報表

### 1.3 關鍵價值
- 採購決策時間縮短 60%
- 成本節省識別提升 30%
- 報表生成效率提升 80%
- 數據準確性達 99.9%

## 2. 功能性需求

### FR-PM-PAR-001: 採購KPI儀表板
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 登入系統或定期更新
- **行為**: 展示關鍵採購績效指標
- **資料輸入**: 
  - 採購數據
  - 目標設定
  - 時間範圍
  - 維度選擇
  - 比較基準
- **資料輸出**: 
  - KPI總覽
  - 趨勢圖表
  - 達成率分析
  - 預警提示
  - 改善建議
- **UI反應**: 
  - 即時更新
  - 互動圖表
  - 下鑽分析
  - 自訂版面
  - 匯出功能
- **例外處理**: 
  - 指標異常
  - 目標偏離
  - 自動預警
  - 升級通知

#### 驗收標準
```yaml
- 條件: 查看月度KPI
  預期結果: 3秒內載入完整儀表板

- 條件: KPI低於目標20%
  預期結果: 自動標紅並發送預警通知

- 條件: 點擊指標詳情
  預期結果: 展開詳細分析與改善建議
```

### FR-PM-PAR-002: 支出分析
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 分析採購支出結構與趨勢
- **行為**: 多維度分析採購支出
- **資料輸入**: 
  - 採購訂單
  - 發票資料
  - 分類維度
  - 時間區間
  - 匯率資訊
- **資料輸出**: 
  - 支出分類
  - ABC分析
  - 趨勢分析
  - 節省機會
  - 預算對比
- **UI反應**: 
  - 樹狀圖
  - 帕累托圖
  - 熱力圖
  - 瀑布圖
  - 比較分析
- **例外處理**: 
  - 異常支出
  - 預算超支
  - 違規採購
  - 重複付款

### FR-PM-PAR-003: 供應商績效分析
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 評估供應商表現
- **行為**: 全方位分析供應商績效
- **資料輸入**: 
  - 交貨記錄
  - 品質數據
  - 價格資訊
  - 服務評價
  - 合規記錄
- **資料輸出**: 
  - 績效評分
  - 排名列表
  - 優劣分析
  - 風險評估
  - 發展建議
- **UI反應**: 
  - 雷達圖
  - 記分卡
  - 趨勢線
  - 對比表
  - 地圖分布
- **例外處理**: 
  - 績效下降
  - 風險預警
  - 黑名單
  - 改善追蹤

### FR-PM-PAR-004: 預測分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 預測未來採購需求與價格
- **行為**: 基於歷史數據和市場趨勢預測
- **資料輸入**: 
  - 歷史數據
  - 季節因素
  - 市場指標
  - 需求計劃
  - 經濟指標
- **資料輸出**: 
  - 需求預測
  - 價格預測
  - 風險預測
  - 情境分析
  - 建議行動
- **UI反應**: 
  - 預測圖表
  - 信心區間
  - 情境模擬
  - 敏感度分析
  - 決策樹
- **例外處理**: 
  - 模型失準
  - 異常值處理
  - 參數調整
  - 人工干預

### FR-PM-PAR-005: 自訂報表
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 使用者需要特定報表
- **行為**: 提供靈活的報表設計工具
- **資料輸入**: 
  - 資料來源
  - 欄位選擇
  - 篩選條件
  - 排序規則
  - 格式設定
- **資料輸出**: 
  - 自訂報表
  - 排程發送
  - 多格式匯出
  - 範本儲存
  - 分享連結
- **UI反應**: 
  - 拖拽設計
  - 即時預覽
  - 公式編輯
  - 樣式設定
  - 版本控制
- **例外處理**: 
  - 查詢逾時
  - 資料權限
  - 格式錯誤
  - 儲存失敗

## 3. 系統設計

### 3.1 資料模型

```typescript
// 分析維度
interface AnalyticsDimension {
  // 時間維度
  time: {
    year: number;
    quarter: number;
    month: number;
    week: number;
    day: number;
  };
  
  // 組織維度
  organization: {
    company: string;
    division: string;
    department: string;
    costCenter: string;
    project?: string;
  };
  
  // 供應商維度
  supplier: {
    id: string;
    name: string;
    category: string;
    tier: string;
    region: string;
  };
  
  // 物料維度
  material: {
    category: string;
    group: string;
    item: string;
    specification: string;
  };
  
  // 採購維度
  procurement: {
    type: string;
    method: string;
    urgency: string;
    source: string;
  };
}

// KPI定義
interface PurchasingKPI {
  id: string;
  name: string;
  
  // 指標定義
  definition: {
    formula: string;
    unit: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    target: number;
    threshold: {
      excellent: number;
      good: number;
      warning: number;
      critical: number;
    };
  };
  
  // 計算結果
  result: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    achievement: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    lastUpdated: Date;
  };
  
  // 歷史數據
  history: {
    date: Date;
    value: number;
  }[];
}

// 支出分析
interface SpendAnalysis {
  period: DateRange;
  
  // 總體支出
  total: {
    amount: number;
    count: number;
    suppliers: number;
    categories: number;
  };
  
  // 分類支出
  byCategory: {
    category: string;
    amount: number;
    percentage: number;
    trend: number;
    items: SpendItem[];
  }[];
  
  // ABC分析
  abcAnalysis: {
    a: { // 80% value
      items: number;
      amount: number;
      percentage: number;
    };
    b: { // 15% value
      items: number;
      amount: number;
      percentage: number;
    };
    c: { // 5% value
      items: number;
      amount: number;
      percentage: number;
    };
  };
  
  // 節省機會
  savingOpportunities: {
    type: string;
    potential: number;
    difficulty: 'easy' | 'medium' | 'hard';
    recommendation: string;
  }[];
}

// 報表定義
interface ReportDefinition {
  id: string;
  name: string;
  
  // 報表配置
  config: {
    type: 'table' | 'chart' | 'dashboard' | 'pivot';
    dataSource: string[];
    
    columns?: {
      field: string;
      label: string;
      type: string;
      format?: string;
      aggregate?: string;
    }[];
    
    filters?: {
      field: string;
      operator: string;
      value: any;
    }[];
    
    sorting?: {
      field: string;
      direction: 'asc' | 'desc';
    }[];
    
    grouping?: string[];
    
    chart?: {
      type: string;
      xAxis: string;
      yAxis: string[];
      series?: any[];
    };
  };
  
  // 排程設定
  schedule?: {
    enabled: boolean;
    frequency: string;
    time: string;
    recipients: string[];
    format: string[];
  };
  
  // 權限設定
  permissions: {
    owner: string;
    shared: string[];
    public: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 API 設計

```typescript
// 分析報表 API
interface AnalyticsAPI {
  // KPI查詢
  GET    /api/pm/analytics/kpi                    // KPI總覽
  GET    /api/pm/analytics/kpi/:id                // 特定KPI
  POST   /api/pm/analytics/kpi/calculate          // 計算KPI
  
  // 支出分析
  GET    /api/pm/analytics/spend                  // 支出分析
  GET    /api/pm/analytics/spend/abc              // ABC分析
  GET    /api/pm/analytics/spend/savings          // 節省機會
  
  // 供應商分析
  GET    /api/pm/analytics/supplier               // 供應商績效
  GET    /api/pm/analytics/supplier/ranking       // 供應商排名
  GET    /api/pm/analytics/supplier/risk          // 風險分析
  
  // 預測分析
  POST   /api/pm/analytics/forecast/demand        // 需求預測
  POST   /api/pm/analytics/forecast/price         // 價格預測
  GET    /api/pm/analytics/forecast/accuracy      // 預測準確度
  
  // 報表管理
  POST   /api/pm/reports                          // 建立報表
  GET    /api/pm/reports                          // 查詢報表
  GET    /api/pm/reports/:id                      // 執行報表
  PUT    /api/pm/reports/:id                      // 更新報表
  DELETE /api/pm/reports/:id                      // 刪除報表
  POST   /api/pm/reports/:id/schedule             // 排程設定
  POST   /api/pm/reports/:id/export               // 匯出報表
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **所有PM模組**: 資料來源
- **BI平台**: 進階分析
- **FA**: 財務數據
- **數據倉儲**: 歷史資料

### 4.2 外部系統整合
- **市場資訊**: 價格指數
- **產業報告**: 基準比較
- **AI/ML平台**: 預測模型

## 5. 成功指標

### 5.1 業務指標
- 報表產出時間 ≤ 5秒
- 預測準確度 ≥ 85%
- 成本節省識別 ≥ 10%
- 決策支援滿意度 ≥ 90%

### 5.2 系統指標
- 查詢響應時間 < 3秒
- 並發查詢支援 ≥ 100
- 資料更新延遲 ≤ 15分鐘
- 系統可用性 ≥ 99.5%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: pm@tsaitung.com