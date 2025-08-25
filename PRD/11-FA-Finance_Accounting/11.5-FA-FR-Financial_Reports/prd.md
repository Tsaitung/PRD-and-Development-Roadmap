# FA-FR 財務報表 (Financial Reports) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: FA全模組, BI (商業智慧), 管理層決策系統

## 1. 功能概述

### 1.1 目的
建立完整的財務報表系統，自動產生符合會計準則的財務報表，提供即時財務分析，支援管理決策。

### 1.2 範圍
- 基本財務報表
- 管理報表產出
- 財務分析指標
- 預算對比分析
- 報表自訂功能

### 1.3 關鍵價值
- 報表產出時間縮短 90%
- 數據準確率 100%
- 決策支援度提升 80%
- 合規性保證 100%

## 2. 功能性需求

### FR-FA-FR-001: 基本財務報表
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 月結年結或即時查詢
- **行為**: 產生標準財務三表及附註
- **資料輸入**: 
  - 會計期間
  - 公司別選擇
  - 幣別設定
  - 合併範圍
  - 調整分錄
- **資料輸出**: 
  - 資產負債表
  - 損益表
  - 現金流量表
  - 權益變動表
  - 附註說明
- **UI反應**: 
  - 即時產生
  - 格式選擇
  - 比較期間
  - 下載列印
  - 簽核流程
- **例外處理**: 
  - 科目不平
  - 資料缺失
  - 期間錯誤
  - 權限不足

#### 驗收標準
```yaml
- 條件: 月結完成
  預期結果: 自動產生當月財務報表

- 條件: 選擇比較期間
  預期結果: 顯示期間對比與變動分析

- 條件: 需要合併報表
  預期結果: 正確合併子公司數據
```

#### Traceability
- **測試案例**: tests/unit/FR-FA-FR-001.test.ts
- **實作程式**: src/modules/fa/services/financialReports.service.ts
- **相關文件**: TOC Modules.md - Section 11.5

### FR-FA-FR-002: 管理報表產出
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 管理層需求或定期產出
- **行為**: 產生各類管理決策報表
- **資料輸入**: 
  - 報表類型
  - 維度選擇
  - 期間範圍
  - 部門專案
  - 篩選條件
- **資料輸出**: 
  - 部門損益表
  - 產品別損益
  - 專案收支表
  - 成本分析表
  - 績效報表
- **UI反應**: 
  - 動態產生
  - 下鑽功能
  - 圖表切換
  - 匯出功能
  - 訂閱推送
- **例外處理**: 
  - 維度缺失
  - 分攤錯誤
  - 計算異常
  - 格式不符

#### 財務報表結構
```typescript
interface FinancialStatement {
  id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'equity_changes';
  
  // 報表資訊
  statement: {
    company: {
      id: string;
      name: string;
      taxId: string;
    };
    
    period: {
      year: number;
      month?: number;
      quarter?: number;
      startDate: Date;
      endDate: Date;
    };
    
    currency: string;
    unit: 'ones' | 'thousands' | 'millions';
    
    type: 'individual' | 'consolidated';
    standard: 'IFRS' | 'GAAP' | 'Local';
  };
  
  // 資產負債表
  balanceSheet?: {
    assets: {
      current: {
        cash: number;
        accountsReceivable: number;
        inventory: number;
        otherCurrent: number;
        totalCurrent: number;
      };
      
      nonCurrent: {
        property: number;
        intangible: number;
        investments: number;
        otherNonCurrent: number;
        totalNonCurrent: number;
      };
      
      totalAssets: number;
    };
    
    liabilities: {
      current: {
        accountsPayable: number;
        shortTermDebt: number;
        accruedExpenses: number;
        otherCurrent: number;
        totalCurrent: number;
      };
      
      nonCurrent: {
        longTermDebt: number;
        deferredTax: number;
        otherNonCurrent: number;
        totalNonCurrent: number;
      };
      
      totalLiabilities: number;
    };
    
    equity: {
      capitalStock: number;
      capitalSurplus: number;
      retainedEarnings: number;
      otherEquity: number;
      totalEquity: number;
    };
    
    totalLiabilitiesAndEquity: number;
  };
  
  // 損益表
  incomeStatement?: {
    revenue: {
      operatingRevenue: number;
      otherRevenue: number;
      totalRevenue: number;
    };
    
    costs: {
      costOfGoods: number;
      grossProfit: number;
      grossMargin: number;
    };
    
    expenses: {
      selling: number;
      administrative: number;
      research: number;
      totalOperating: number;
    };
    
    operatingIncome: number;
    
    nonOperating: {
      interest: number;
      other: number;
      total: number;
    };
    
    incomeBeforeTax: number;
    incomeTax: number;
    netIncome: number;
    
    eps?: number;
  };
  
  // 現金流量表
  cashFlow?: {
    operating: {
      netIncome: number;
      adjustments: {
        depreciation: number;
        workingCapitalChanges: number;
        other: number;
      };
      netOperating: number;
    };
    
    investing: {
      capitalExpenditure: number;
      acquisitions: number;
      investments: number;
      netInvesting: number;
    };
    
    financing: {
      debtProceeds: number;
      debtRepayment: number;
      dividends: number;
      shareIssuance: number;
      netFinancing: number;
    };
    
    netChange: number;
    beginningCash: number;
    endingCash: number;
  };
  
  // 比較資訊
  comparison?: {
    previousPeriod?: any;
    variance: {
      amount: number;
      percentage: number;
    };
    
    yearToDate?: any;
    budget?: any;
  };
  
  // 附註
  notes?: {
    accountingPolicies?: string[];
    significantEstimates?: string[];
    subsequentEvents?: string[];
    other?: string[];
  };
  
  // 審核
  audit: {
    preparedBy: string;
    preparedAt: Date;
    reviewedBy?: string;
    approvedBy?: string;
    publishedAt?: Date;
  };
}
```

### FR-FA-FR-003: 財務分析指標
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 財務分析需求或定期計算
- **行為**: 計算各類財務分析指標
- **資料輸入**: 
  - 財務數據
  - 指標選擇
  - 計算期間
  - 行業基準
  - 目標設定
- **資料輸出**: 
  - 財務比率
  - 趨勢分析
  - 杜邦分析
  - 同業比較
  - 預警指標
- **UI反應**: 
  - 儀表板顯示
  - 紅綠燈警示
  - 歷史趨勢
  - 鑽取明細
  - 報告產生
- **例外處理**: 
  - 分母為零
  - 數據異常
  - 基準缺失
  - 計算錯誤

#### 財務指標模型
```typescript
interface FinancialRatios {
  period: Date;
  
  // 流動性指標
  liquidity: {
    currentRatio: number;           // 流動比率
    quickRatio: number;              // 速動比率
    cashRatio: number;               // 現金比率
    workingCapital: number;          // 營運資金
  };
  
  // 營運效率
  efficiency: {
    inventoryTurnover: number;       // 存貨週轉率
    receivableTurnover: number;      // 應收週轉率
    payableTurnover: number;         // 應付週轉率
    assetTurnover: number;           // 總資產週轉率
    
    daysInventory: number;           // 存貨天數
    daysReceivable: number;          // 應收天數
    daysPayable: number;             // 應付天數
    cashCycle: number;               // 現金週期
  };
  
  // 獲利能力
  profitability: {
    grossMargin: number;             // 毛利率
    operatingMargin: number;         // 營業利益率
    netMargin: number;               // 淨利率
    
    roa: number;                     // 資產報酬率
    roe: number;                     // 權益報酬率
    roic: number;                    // 投入資本報酬率
    
    ebitda: number;                  // EBITDA
    ebitdaMargin: number;           // EBITDA率
  };
  
  // 財務槓桿
  leverage: {
    debtRatio: number;               // 負債比率
    debtToEquity: number;            // 負債權益比
    interestCoverage: number;        // 利息保障倍數
    debtServiceCoverage: number;     // 債務保障倍數
  };
  
  // 市場價值
  marketValue?: {
    eps: number;                     // 每股盈餘
    pe: number;                      // 本益比
    pb: number;                      // 股價淨值比
    dividendYield: number;           // 股息率
    payoutRatio: number;             // 股利支付率
  };
  
  // 評級評分
  rating: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    score: number;
    
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}
```

### FR-FA-FR-004: 預算對比分析
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 預算檢討或績效評估
- **行為**: 分析實際與預算差異
- **資料輸入**: 
  - 預算數據
  - 實際數據
  - 分析維度
  - 差異標準
  - 調整項目
- **資料輸出**: 
  - 差異分析表
  - 達成率報告
  - 原因分析
  - 趨勢預測
  - 改善建議
- **UI反應**: 
  - 對比顯示
  - 差異標註
  - 圖表分析
  - 下鑽查詢
  - 評論註記
- **例外處理**: 
  - 預算缺失
  - 維度不符
  - 期間錯誤
  - 數據衝突

### FR-FA-FR-005: 報表自訂功能
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 特殊報表需求
- **行為**: 讓使用者自訂報表格式與內容
- **資料輸入**: 
  - 資料來源
  - 欄位選擇
  - 計算公式
  - 格式設定
  - 篩選條件
- **資料輸出**: 
  - 自訂報表
  - 範本儲存
  - 排程執行
  - 分享設定
  - 版本管理
- **UI反應**: 
  - 拖拽設計
  - 即時預覽
  - 公式編輯
  - 格式設定
  - 測試執行
- **例外處理**: 
  - 公式錯誤
  - 循環參照
  - 資料不足
  - 權限限制

## 3. 系統設計

### 3.1 資料模型

```typescript
// 報表定義
interface ReportDefinition {
  id: string;
  name: string;
  type: 'standard' | 'management' | 'custom';
  
  // 報表設定
  configuration: {
    dataSource: {
      tables: string[];
      joins?: any[];
      filters?: any[];
    };
    
    layout: {
      sections: {
        name: string;
        type: 'header' | 'detail' | 'footer';
        
        rows: {
          label: string;
          formula?: string;
          accounts?: string[];
          format?: string;
          level?: number;
          bold?: boolean;
        }[];
      }[];
      
      columns: {
        label: string;
        period?: string;
        type?: 'actual' | 'budget' | 'variance';
        format?: string;
      }[];
    };
    
    calculations?: {
      name: string;
      formula: string;
      dependencies: string[];
    }[];
    
    formatting: {
      numberFormat: string;
      negativeDisplay: string;
      zeroDisplay: string;
      fontSize?: number;
    };
  };
  
  // 執行設定
  execution: {
    parameters: {
      name: string;
      type: string;
      required: boolean;
      defaultValue?: any;
    }[];
    
    schedule?: {
      enabled: boolean;
      frequency: string;
      time: string;
      recipients: string[];
    };
    
    output: {
      formats: ('pdf' | 'excel' | 'csv' | 'html')[];
      defaultFormat: string;
    };
  };
  
  // 權限
  permissions: {
    owner: string;
    viewers: string[];
    editors: string[];
    public: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 預算對比
interface BudgetComparison {
  period: { start: Date; end: Date; };
  
  // 對比項目
  items: {
    account: {
      code: string;
      name: string;
      type: string;
    };
    
    amounts: {
      budget: number;
      actual: number;
      variance: number;
      variancePercent: number;
    };
    
    ytd?: {
      budget: number;
      actual: number;
      variance: number;
    };
    
    analysis: {
      favorable: boolean;
      significant: boolean;
      explanation?: string;
      action?: string;
    };
  }[];
  
  // 匯總
  summary: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    achievementRate: number;
    
    byCategory: {
      category: string;
      budget: number;
      actual: number;
      variance: number;
    }[];
  };
  
  // 趨勢
  trends: {
    month: string;
    budget: number;
    actual: number;
    cumBudget: number;
    cumActual: number;
  }[];
}

// 報表執行記錄
interface ReportExecution {
  id: string;
  reportId: string;
  
  // 執行資訊
  execution: {
    triggeredBy: string;
    triggeredAt: Date;
    
    parameters: any;
    
    duration: number;
    status: 'running' | 'completed' | 'failed';
    
    error?: {
      message: string;
      stack?: string;
    };
  };
  
  // 輸出結果
  output?: {
    format: string;
    size: number;
    
    location: string;
    url?: string;
    
    expiry?: Date;
  };
  
  // 分發記錄
  distribution?: {
    method: 'email' | 'download' | 'api';
    recipients: string[];
    sentAt?: Date;
    
    downloads?: {
      user: string;
      timestamp: Date;
    }[];
  };
}
```

### 3.2 API 設計

```typescript
// 財務報表 API
interface FinancialReportsAPI {
  // 標準報表
  GET    /api/fa/reports/balance-sheet        // 資產負債表
  GET    /api/fa/reports/income-statement     // 損益表
  GET    /api/fa/reports/cash-flow            // 現金流量表
  GET    /api/fa/reports/equity-changes       // 權益變動表
  
  // 管理報表
  GET    /api/fa/reports/department           // 部門損益
  GET    /api/fa/reports/product              // 產品損益
  GET    /api/fa/reports/project              // 專案損益
  GET    /api/fa/reports/cost-analysis        // 成本分析
  
  // 財務分析
  GET    /api/fa/analysis/ratios              // 財務比率
  GET    /api/fa/analysis/trends              // 趨勢分析
  GET    /api/fa/analysis/dupont              // 杜邦分析
  
  // 預算對比
  GET    /api/fa/budget/comparison            // 預算對比
  GET    /api/fa/budget/variance              // 差異分析
  GET    /api/fa/budget/forecast              // 預測分析
  
  // 自訂報表
  POST   /api/fa/reports/custom               // 建立報表
  GET    /api/fa/reports/custom/:id           // 執行報表
  PUT    /api/fa/reports/custom/:id           // 更新報表
  POST   /api/fa/reports/execute              // 執行報表
}

// WebSocket 事件
interface ReportsWebSocketEvents {
  'report:generated': (report: any) => void;
  'report:scheduled': (schedule: any) => void;
  'analysis:alert': (alert: any) => void;
  'budget:variance': (variance: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **所有FA模組**: 財務數據來源
- **BI**: 進階分析功能
- **預算系統**: 預算數據
- **成本系統**: 成本資料
- **管理儀表板**: 報表展示

### 4.2 外部系統整合
- **會計師系統**: 查核報告
- **銀行系統**: 財務確認
- **主管機關**: 申報系統
- **投資人關係**: 資訊揭露

## 5. 成功指標

### 5.1 業務指標
- 報表準確率 100%
- 產出時效 < 10分鐘
- 使用滿意度 > 90%
- 決策支援度 > 85%

### 5.2 系統指標
- 報表產生時間 < 30秒
- 並發處理 > 50個
- 系統可用性 ≥ 99.9%
- 資料一致性 100%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: fa@tsaitung.com