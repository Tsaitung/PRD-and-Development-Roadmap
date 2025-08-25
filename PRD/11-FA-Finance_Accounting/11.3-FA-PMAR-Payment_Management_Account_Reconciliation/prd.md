# FA-PMAR 收付款管理與帳戶調節 (Payment Management & Account Reconciliation) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: FA-AR (應收帳款), FA-AP (應付帳款), FA-FR (財務報表), 銀行系統

## 1. 功能概述

### 1.1 目的
建立整合性收付款管理與銀行帳戶調節系統，自動化現金流管理，確保資金安全與帳務準確，提升財務作業效率。

### 1.2 範圍
- 收付款作業處理
- 銀行帳戶管理
- 自動對帳調節
- 資金調度管理
- 現金流量預測

### 1.3 關鍵價值
- 對帳自動化率 95%
- 調節差異降低 90%
- 資金運用效率提升 30%
- 作業時間節省 70%

## 2. 功能性需求

### FR-FA-PMAR-001: 收付款作業處理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 收款或付款需求產生
- **行為**: 處理各類收付款交易並更新帳戶餘額
- **資料輸入**: 
  - 交易類型金額
  - 銀行帳戶資訊
  - 付款對象資料
  - 交易用途說明
  - 相關單據號碼
- **資料輸出**: 
  - 收付款憑證
  - 銀行交易記錄
  - 餘額更新
  - 交易確認
  - 會計分錄
- **UI反應**: 
  - 快速輸入
  - 餘額檢查
  - 批次處理
  - 狀態追蹤
  - 憑證列印
- **例外處理**: 
  - 餘額不足
  - 帳戶凍結
  - 交易限額
  - 重複交易

#### 驗收標準
```yaml
- 條件: 執行付款交易
  預期結果: 即時更新帳戶餘額並產生憑證

- 條件: 帳戶餘額不足
  預期結果: 拒絕交易並提示資金調度

- 條件: 批次收款處理
  預期結果: 自動分配並產生收據
```

#### Traceability
- **測試案例**: tests/unit/FR-FA-PMAR-001.test.ts
- **實作程式**: src/modules/fa/services/paymentManagement.service.ts
- **相關文件**: TOC Modules.md - Section 11.3

### FR-FA-PMAR-002: 銀行帳戶管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 開立、維護或查詢銀行帳戶
- **行為**: 管理企業所有銀行帳戶資訊與權限
- **資料輸入**: 
  - 銀行基本資料
  - 帳戶類型用途
  - 簽核權限設定
  - 網銀連線資訊
  - 帳戶限額設定
- **資料輸出**: 
  - 帳戶清冊
  - 權限矩陣
  - 餘額總覽
  - 異動記錄
  - 簽核設定
- **UI反應**: 
  - 帳戶總覽
  - 階層顯示
  - 權限管理
  - 快速切換
  - 安全驗證
- **例外處理**: 
  - 帳戶異常
  - 權限衝突
  - 連線失敗
  - 資料不符

#### 銀行帳戶模型
```typescript
interface BankAccount {
  id: string;
  accountNo: string;
  
  // 銀行資訊
  bank: {
    code: string;
    name: string;
    branch: string;
    swift?: string;
    address: string;
  };
  
  // 帳戶資訊
  account: {
    type: 'checking' | 'savings' | 'time_deposit' | 'loan' | 'credit';
    currency: string;
    name: string;
    purpose: string[];
    
    status: 'active' | 'dormant' | 'frozen' | 'closed';
    openDate: Date;
    closeDate?: Date;
  };
  
  // 餘額資訊
  balance: {
    current: number;
    available: number;
    hold?: number;
    
    lastUpdated: Date;
    lastTransaction?: {
      date: Date;
      type: string;
      amount: number;
      balance: number;
    };
  };
  
  // 權限設定
  authorization: {
    signatories: {
      userId: string;
      name: string;
      title: string;
      
      limits: {
        single: number;
        daily: number;
        monthly: number;
      };
      
      combination?: string;  // A+B, A or B, etc.
    }[];
    
    approvalLevels: {
      level: number;
      amount: { min: number; max: number; };
      approvers: string[];
      required: number;  // 需要幾人
    }[];
  };
  
  // 網銀設定
  onlineBanking?: {
    enabled: boolean;
    url: string;
    companyId: string;
    
    credentials?: {
      encrypted: true;
      lastSync?: Date;
    };
    
    autoSync: {
      enabled: boolean;
      frequency: string;
      lastSync?: Date;
      nextSync?: Date;
    };
  };
  
  // 對帳設定
  reconciliation: {
    method: 'manual' | 'file' | 'api' | 'auto';
    frequency: 'daily' | 'weekly' | 'monthly';
    
    rules: {
      matchingCriteria: string[];
      tolerance: number;
      autoMatch: boolean;
    };
    
    contacts: {
      name: string;
      email: string;
      phone: string;
    }[];
  };
}
```

### FR-FA-PMAR-003: 自動對帳調節
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 收到銀行對帳單或定期對帳
- **行為**: 自動比對並調節銀行與帳簿差異
- **資料輸入**: 
  - 銀行對帳單
  - 帳簿交易記錄
  - 對帳規則設定
  - 調節項目
  - 歷史差異
- **資料輸出**: 
  - 對帳結果
  - 差異清單
  - 調節表
  - 調整分錄
  - 對帳報告
- **UI反應**: 
  - 自動匹配
  - 差異高亮
  - 手動調節
  - 批次處理
  - 進度顯示
- **例外處理**: 
  - 無法匹配
  - 金額差異
  - 重複項目
  - 遺漏交易

#### 銀行調節模型
```typescript
interface BankReconciliation {
  id: string;
  accountId: string;
  period: { start: Date; end: Date; };
  
  // 銀行對帳單
  bankStatement: {
    openingBalance: number;
    closingBalance: number;
    
    transactions: {
      date: Date;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
      
      matched?: boolean;
      matchedTo?: string;
    }[];
    
    source: 'manual' | 'file' | 'api';
    importedAt?: Date;
  };
  
  // 帳簿記錄
  bookRecords: {
    openingBalance: number;
    closingBalance: number;
    
    transactions: {
      id: string;
      date: Date;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      
      matched?: boolean;
      matchedTo?: string;
    }[];
  };
  
  // 匹配結果
  matching: {
    automatic: {
      count: number;
      amount: number;
      confidence: number;
    };
    
    manual: {
      count: number;
      amount: number;
    };
    
    unmatched: {
      inBank: any[];
      inBooks: any[];
    };
  };
  
  // 調節項目
  adjustments: {
    // 在途項目
    outstanding: {
      checks: {
        checkNo: string;
        date: Date;
        amount: number;
        payee: string;
      }[];
      
      deposits: {
        date: Date;
        amount: number;
        reference: string;
      }[];
    };
    
    // 其他調節
    other: {
      type: 'bank_charge' | 'interest' | 'error' | 'other';
      description: string;
      amount: number;
      journalEntry?: string;
    }[];
  };
  
  // 調節結果
  result: {
    bankBalance: number;
    bookBalance: number;
    adjustedBankBalance: number;
    adjustedBookBalance: number;
    difference: number;
    
    reconciled: boolean;
    reconciledBy?: string;
    reconciledAt?: Date;
  };
}
```

### FR-FA-PMAR-004: 資金調度管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 資金需求或餘額不足
- **行為**: 管理資金在不同帳戶間的調度配置
- **資料輸入**: 
  - 資金需求計劃
  - 帳戶餘額狀況
  - 調度優先順序
  - 成本考量
  - 審批層級
- **資料輸出**: 
  - 調度建議
  - 轉帳指令
  - 成本分析
  - 審批流程
  - 執行記錄
- **UI反應**: 
  - 資金看板
  - 拖拽調度
  - 模擬測算
  - 批准按鈕
  - 歷史追蹤
- **例外處理**: 
  - 資金短缺
  - 調度失敗
  - 超出權限
  - 時間衝突

### FR-FA-PMAR-005: 現金流量預測
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期預測或管理決策需求
- **行為**: 預測未來現金流入流出狀況
- **資料輸入**: 
  - 歷史交易數據
  - 應收應付計劃
  - 營運計劃
  - 季節因素
  - 市場變數
- **資料輸出**: 
  - 現金流預測表
  - 資金缺口分析
  - 情境模擬
  - 風險評估
  - 融資建議
- **UI反應**: 
  - 預測圖表
  - 情境切換
  - 敏感度分析
  - 警示指標
  - 報表下載
- **例外處理**: 
  - 數據異常
  - 預測偏差
  - 極端情境
  - 模型失效

## 3. 系統設計

### 3.1 資料模型

```typescript
// 收付款交易
interface PaymentTransaction {
  id: string;
  transactionNo: string;
  
  // 交易資訊
  transaction: {
    type: 'receipt' | 'payment' | 'transfer';
    date: Date;
    amount: number;
    currency: string;
    
    method: 'cash' | 'check' | 'transfer' | 'card' | 'other';
    
    purpose: {
      category: string;
      description: string;
      reference?: string;
    };
  };
  
  // 帳戶資訊
  accounts: {
    from?: {
      accountId: string;
      accountNo: string;
      bankName: string;
    };
    
    to?: {
      accountId?: string;
      accountNo: string;
      bankName: string;
      beneficiary: string;
    };
  };
  
  // 交易方
  party: {
    type: 'customer' | 'supplier' | 'employee' | 'other';
    id?: string;
    name: string;
    contact?: string;
  };
  
  // 核銷關聯
  applications?: {
    documentType: 'invoice' | 'bill' | 'expense' | 'advance';
    documentId: string;
    documentNo: string;
    amount: number;
  }[];
  
  // 銀行回應
  banking?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    reference?: string;
    charges?: number;
    valueDate?: Date;
    
    confirmation?: {
      confirmed: boolean;
      date?: Date;
      reference?: string;
    };
  };
  
  // 審核
  approval?: {
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
    comments?: string;
  };
  
  // 會計分錄
  accounting: {
    journalId?: string;
    posted: boolean;
    postingDate?: Date;
  };
  
  status: 'draft' | 'approved' | 'processed' | 'completed' | 'cancelled' | 'failed';
  
  createdBy: string;
  createdAt: Date;
}

// 資金調度
interface FundTransfer {
  id: string;
  transferNo: string;
  
  // 調度計劃
  plan: {
    date: Date;
    reason: string;
    urgency: 'normal' | 'urgent' | 'emergency';
    
    from: {
      accountId: string;
      amount: number;
      availableBalance: number;
    };
    
    to: {
      accountId: string;
      requirement: number;
      currentBalance: number;
    };
    
    // 成本計算
    cost: {
      interestLoss?: number;
      transferFee?: number;
      opportunityCost?: number;
      total: number;
    };
  };
  
  // 執行
  execution?: {
    executedAt?: Date;
    executedBy?: string;
    
    actualAmount?: number;
    actualCost?: number;
    
    bankReference?: string;
    
    result: 'success' | 'partial' | 'failed';
    notes?: string;
  };
  
  // 審批
  approval: {
    required: boolean;
    level: number;
    
    approvals: {
      level: number;
      approver: string;
      status: 'pending' | 'approved' | 'rejected';
      date?: Date;
      comments?: string;
    }[];
  };
  
  status: 'planned' | 'approved' | 'executing' | 'completed' | 'cancelled';
}

// 現金流預測
interface CashFlowForecast {
  id: string;
  forecastDate: Date;
  
  // 預測期間
  period: {
    start: Date;
    end: Date;
    granularity: 'daily' | 'weekly' | 'monthly';
  };
  
  // 期初餘額
  openingBalance: number;
  
  // 預測項目
  projections: {
    date: Date;
    
    // 流入
    inflows: {
      category: string;
      amount: number;
      probability: number;
      source: 'actual' | 'forecast' | 'estimate';
    }[];
    
    // 流出
    outflows: {
      category: string;
      amount: number;
      probability: number;
      source: 'actual' | 'forecast' | 'estimate';
    }[];
    
    // 淨流量
    netFlow: number;
    
    // 累計餘額
    balance: number;
    
    // 資金需求
    requirement?: {
      amount: number;
      options: string[];
    };
  }[];
  
  // 情境分析
  scenarios?: {
    name: string;
    assumptions: string[];
    
    adjustments: {
      category: string;
      factor: number;
    }[];
    
    result: {
      minBalance: number;
      maxRequirement: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
  }[];
  
  // 準確度追蹤
  accuracy?: {
    previousForecasts: {
      date: Date;
      forecasted: number;
      actual: number;
      variance: number;
    }[];
    
    averageAccuracy: number;
  };
}
```

### 3.2 API 設計

```typescript
// 收付款管理 API
interface PaymentManagementAPI {
  // 交易處理
  POST   /api/fa/payments                     // 建立交易
  GET    /api/fa/payments                     // 查詢交易
  GET    /api/fa/payments/:id                 // 交易詳情
  POST   /api/fa/payments/batch               // 批次處理
  POST   /api/fa/payments/:id/confirm         // 確認交易
  
  // 銀行帳戶
  POST   /api/fa/bank-accounts                // 新增帳戶
  GET    /api/fa/bank-accounts                // 帳戶列表
  GET    /api/fa/bank-accounts/:id            // 帳戶詳情
  GET    /api/fa/bank-accounts/balances       // 餘額總覽
  POST   /api/fa/bank-accounts/sync           // 同步餘額
}

// 對帳調節 API
interface ReconciliationAPI {
  // 對帳作業
  POST   /api/fa/reconciliation/import        // 匯入對帳單
  POST   /api/fa/reconciliation/match         // 自動匹配
  POST   /api/fa/reconciliation/adjust        // 手動調節
  GET    /api/fa/reconciliation/status        // 對帳狀態
  POST   /api/fa/reconciliation/complete      // 完成對帳
  
  // 差異處理
  GET    /api/fa/reconciliation/differences   // 差異清單
  POST   /api/fa/reconciliation/resolve       // 解決差異
}

// 資金管理 API
interface FundManagementAPI {
  // 資金調度
  POST   /api/fa/funds/transfer               // 建立調度
  GET    /api/fa/funds/requirements           // 資金需求
  POST   /api/fa/funds/optimize               // 優化建議
  
  // 現金流預測
  POST   /api/fa/cashflow/forecast            // 產生預測
  GET    /api/fa/cashflow/analysis            // 分析報告
  POST   /api/fa/cashflow/scenarios           // 情境模擬
}

// WebSocket 事件
interface PMARWebSocketEvents {
  'payment:received': (payment: any) => void;
  'payment:completed': (payment: any) => void;
  'balance:low': (alert: any) => void;
  'reconciliation:unmatched': (items: any) => void;
  'forecast:alert': (alert: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **FA-AR**: 應收帳款收款
- **FA-AP**: 應付帳款付款
- **FA-FR**: 財務報表
- **FA-IT**: 稅務申報
- **BI**: 財務分析

### 4.2 外部系統整合
- **網路銀行**: 餘額查詢、轉帳
- **SWIFT網路**: 國際匯款
- **支付閘道**: 電子支付
- **金流服務**: 收款服務

## 5. 成功指標

### 5.1 業務指標
- 對帳自動化率 ≥ 95%
- 調節完成時間 ≤ 2小時
- 資金使用效率 ≥ 90%
- 預測準確度 ≥ 85%

### 5.2 系統指標
- 交易處理時間 < 2秒
- 對帳匹配率 > 90%
- 系統可用性 ≥ 99.9%
- 並發處理 ≥ 100筆/秒

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: fa@tsaitung.com