# FA-AR 應收帳款管理 (Accounts Receivable) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: OM (訂單管理), CRM (客戶管理), FA-PMAR (收付管理), BI (商業智慧)

## 1. 功能概述

### 1.1 目的
建立完整的應收帳款管理系統，自動化處理銷售收款流程，優化現金流管理，降低壞帳風險，提升收款效率。

### 1.2 範圍
- 應收帳款建立
- 收款處理核銷
- 帳齡分析管理
- 信用額度控管
- 催收作業管理

### 1.3 關鍵價值
- 收款天數縮短 30%
- 壞帳率降低至 0.5%
- 現金流預測準確度 95%
- 作業效率提升 60%

## 2. 功能性需求

### FR-FA-AR-001: 應收帳款建立
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 銷售出貨確認或服務完成
- **行為**: 自動產生應收帳款並計算相關條件
- **資料輸入**: 
  - 銷售訂單資訊
  - 出貨確認單
  - 客戶付款條件
  - 發票開立資訊
  - 稅務設定
- **資料輸出**: 
  - 應收帳款單
  - 發票憑證
  - 到期日計算
  - 客戶餘額更新
  - 會計分錄
- **UI反應**: 
  - 自動帶入資料
  - 金額計算顯示
  - 信用檢查提示
  - 批次處理
  - 審核流程
- **例外處理**: 
  - 信用額度超限
  - 重複開立檢查
  - 金額異常警示
  - 資料不完整

#### 驗收標準
```yaml
- 條件: 出貨單確認完成
  預期結果: 自動產生應收帳款並計算到期日

- 條件: 客戶超過信用額度
  預期結果: 顯示警告並要求主管審批

- 條件: 部分出貨情況
  預期結果: 按實際出貨金額產生應收帳款
```

#### Traceability
- **測試案例**: tests/unit/FR-FA-AR-001.test.ts
- **實作程式**: src/modules/fa/services/accountsReceivable.service.ts
- **相關文件**: TOC Modules.md - Section 11.1

### FR-FA-AR-002: 收款處理核銷
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 收到客戶付款或銀行入帳
- **行為**: 處理收款並核銷對應應收帳款
- **資料輸入**: 
  - 收款金額
  - 付款方式
  - 銀行入帳資訊
  - 核銷項目選擇
  - 匯款憑證
- **資料輸出**: 
  - 收款單據
  - 核銷記錄
  - 餘額更新
  - 收據產生
  - 會計分錄
- **UI反應**: 
  - 自動匹配建議
  - 即時餘額顯示
  - 差額處理
  - 批次核銷
  - 確認提示
- **例外處理**: 
  - 金額不符處理
  - 重複收款檢查
  - 溢收短收處理
  - 無法匹配處理

#### 收款核銷模型
```typescript
interface PaymentReceipt {
  id: string;
  receiptNo: string;
  
  // 收款資訊
  payment: {
    date: Date;
    amount: number;
    currency: string;
    exchangeRate?: number;
    
    method: {
      type: 'cash' | 'check' | 'transfer' | 'credit_card' | 'other';
      bankAccount?: string;
      checkNo?: string;
      transactionNo?: string;
    };
    
    customer: {
      customerId: string;
      customerName: string;
      customerCode: string;
    };
    
    reference: {
      description?: string;
      attachments?: string[];
      approvedBy?: string;
    };
  };
  
  // 核銷明細
  applications: {
    invoiceId: string;
    invoiceNo: string;
    
    amounts: {
      invoiceAmount: number;
      previousPaid: number;
      currentApplied: number;
      remainingBalance: number;
    };
    
    discount?: {
      amount: number;
      reason: string;
    };
    
    writeOff?: {
      amount: number;
      reason: string;
      approvedBy: string;
    };
  }[];
  
  // 處理結果
  result: {
    totalApplied: number;
    unapplied: number;
    
    status: 'fully_applied' | 'partially_applied' | 'unapplied';
    
    overpayment?: {
      amount: number;
      handling: 'credit_memo' | 'refund' | 'deposit';
    };
    
    underpayment?: {
      amount: number;
      handling: 'partial' | 'write_off' | 'follow_up';
    };
  };
  
  // 會計分錄
  accounting: {
    debit: {
      account: string;
      amount: number;
    }[];
    credit: {
      account: string;
      amount: number;
    }[];
    
    posted: boolean;
    postingDate?: Date;
  };
  
  createdAt: Date;
  createdBy: string;
}
```

### FR-FA-AR-003: 帳齡分析管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 定期分析或即時查詢
- **行為**: 分析應收帳款帳齡結構與風險
- **資料輸入**: 
  - 分析日期
  - 客戶範圍
  - 帳齡區間設定
  - 幣別選擇
  - 部門篩選
- **資料輸出**: 
  - 帳齡分析表
  - 逾期明細
  - 風險評估
  - 預期損失
  - 趨勢圖表
- **UI反應**: 
  - 區間顏色標示
  - 下鑽明細
  - 圖表切換
  - 匯出功能
  - 排序篩選
- **例外處理**: 
  - 異常帳齡
  - 高風險標記
  - 數據不一致
  - 計算錯誤

#### 帳齡分析結構
```typescript
interface AgingAnalysis {
  analysisDate: Date;
  
  // 帳齡區間
  agingBuckets: {
    current: {           // 未到期
      amount: number;
      percentage: number;
      count: number;
    };
    overdue1_30: {       // 逾期1-30天
      amount: number;
      percentage: number;
      count: number;
    };
    overdue31_60: {      // 逾期31-60天
      amount: number;
      percentage: number;
      count: number;
    };
    overdue61_90: {      // 逾期61-90天
      amount: number;
      percentage: number;
      count: number;
    };
    overdue91_120: {     // 逾期91-120天
      amount: number;
      percentage: number;
      count: number;
    };
    overdueOver120: {    // 逾期超過120天
      amount: number;
      percentage: number;
      count: number;
    };
  };
  
  // 客戶明細
  customerDetails: {
    customerId: string;
    customerName: string;
    
    balances: {
      total: number;
      current: number;
      overdue: number;
    };
    
    aging: {
      bucket: string;
      amount: number;
      oldestInvoice: Date;
      avgDaysOverdue: number;
    };
    
    risk: {
      level: 'low' | 'medium' | 'high' | 'critical';
      creditLimit: number;
      utilization: number;
      paymentHistory: string;
    };
  }[];
  
  // 風險評估
  riskAssessment: {
    totalAtRisk: number;
    expectedLoss: number;
    provisionRequired: number;
    
    highRiskCustomers: {
      customerId: string;
      amount: number;
      daysOverdue: number;
      action: string;
    }[];
  };
  
  // 趨勢分析
  trends: {
    period: Date;
    totalAR: number;
    overdueAmount: number;
    overdueRate: number;
    dso: number;  // Days Sales Outstanding
  }[];
}
```

### FR-FA-AR-004: 信用額度控管
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 訂單建立或信用評估
- **行為**: 管理和控制客戶信用額度
- **資料輸入**: 
  - 信用額度設定
  - 評估標準
  - 擔保資訊
  - 付款記錄
  - 風險參數
- **資料輸出**: 
  - 信用評級
  - 可用額度
  - 預警通知
  - 審批流程
  - 調整建議
- **UI反應**: 
  - 額度即時顯示
  - 使用率圖示
  - 警告提示
  - 審批按鈕
  - 歷史查詢
- **例外處理**: 
  - 超額處理
  - 緊急調整
  - 特殊審批
  - 凍結處理

### FR-FA-AR-005: 催收作業管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 帳款逾期或催收排程
- **行為**: 自動化催收流程與追蹤管理
- **資料輸入**: 
  - 催收策略設定
  - 逾期帳款清單
  - 客戶聯絡資訊
  - 催收記錄
  - 承諾付款
- **資料輸出**: 
  - 催收通知
  - 催收工作清單
  - 追蹤報告
  - 績效統計
  - 法務移交
- **UI反應**: 
  - 催收看板
  - 自動提醒
  - 記錄表單
  - 狀態更新
  - 績效圖表
- **例外處理**: 
  - 爭議帳款
  - 呆帳處理
  - 法律程序
  - 債權轉讓

## 3. 系統設計

### 3.1 資料模型

```typescript
// 應收帳款發票
interface ARInvoice {
  id: string;
  invoiceNo: string;
  
  // 基本資訊
  basicInfo: {
    type: 'sales' | 'service' | 'debit_note' | 'credit_note';
    date: Date;
    dueDate: Date;
    
    customer: {
      customerId: string;
      customerCode: string;
      customerName: string;
      billingAddress: Address;
    };
    
    terms: {
      paymentTerm: string;  // NET30, NET60, etc.
      earlyPaymentDiscount?: {
        percentage: number;
        days: number;
      };
      lateFee?: {
        rate: number;
        graceperiod: number;
      };
    };
  };
  
  // 明細項目
  lineItems: {
    lineNo: number;
    description: string;
    
    quantity: number;
    unitPrice: number;
    amount: number;
    
    tax: {
      rate: number;
      amount: number;
    };
    
    discount?: {
      rate: number;
      amount: number;
    };
    
    account: {
      code: string;
      name: string;
    };
  }[];
  
  // 金額匯總
  summary: {
    subtotal: number;
    discount: number;
    taxAmount: number;
    total: number;
    currency: string;
    exchangeRate?: number;
  };
  
  // 付款狀態
  paymentStatus: {
    status: 'unpaid' | 'partial' | 'paid' | 'overdue';
    
    paidAmount: number;
    balance: number;
    
    lastPaymentDate?: Date;
    fullPaymentDate?: Date;
    
    daysOverdue?: number;
  };
  
  // 關聯文件
  references: {
    salesOrderNo?: string;
    deliveryNo?: string;
    contractNo?: string;
    projectNo?: string;
  };
  
  // 系統資訊
  audit: {
    createdBy: string;
    createdAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
    voidedBy?: string;
    voidedAt?: Date;
    voidReason?: string;
  };
}

// 客戶信用管理
interface CustomerCredit {
  customerId: string;
  
  // 信用設定
  creditProfile: {
    creditLimit: number;
    tempCreditLimit?: {
      amount: number;
      validUntil: Date;
      approvedBy: string;
    };
    
    creditTerms: string;
    riskCategory: 'low' | 'medium' | 'high';
    
    collateral?: {
      type: string;
      value: number;
      description: string;
    };
    
    guarantor?: {
      name: string;
      relationship: string;
      creditworthiness: string;
    };
  };
  
  // 信用使用
  creditUsage: {
    currentBalance: number;
    pendingOrders: number;
    
    utilization: number;  // percentage
    available: number;
    
    blocked: boolean;
    blockReason?: string;
  };
  
  // 付款歷史
  paymentHistory: {
    avgPaymentDays: number;
    onTimeRate: number;
    
    bounceChecks: number;
    disputes: number;
    
    lastReview: Date;
    nextReview: Date;
  };
  
  // 評級記錄
  ratings: {
    date: Date;
    rating: string;
    score: number;
    reviewer: string;
    notes?: string;
  }[];
}

// 催收記錄
interface CollectionRecord {
  id: string;
  customerId: string;
  
  // 催收資訊
  collection: {
    stage: 'reminder' | 'notice' | 'demand' | 'final' | 'legal';
    
    overdueAmount: number;
    daysOverdue: number;
    
    assignedTo: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  
  // 催收活動
  activities: {
    date: Date;
    type: 'call' | 'email' | 'letter' | 'visit' | 'legal';
    
    description: string;
    response?: string;
    
    promise?: {
      amount: number;
      date: Date;
      kept: boolean;
    };
    
    nextAction?: {
      type: string;
      date: Date;
    };
    
    performedBy: string;
  }[];
  
  // 結果
  outcome?: {
    status: 'collected' | 'partial' | 'written_off' | 'legal';
    
    collectedAmount?: number;
    writeOffAmount?: number;
    
    closedDate: Date;
    closedBy: string;
  };
}
```

### 3.2 API 設計

```typescript
// 應收帳款 API
interface AccountsReceivableAPI {
  // 發票管理
  POST   /api/fa/ar/invoices                  // 建立發票
  GET    /api/fa/ar/invoices                  // 查詢發票列表
  GET    /api/fa/ar/invoices/:id              // 取得發票詳情
  PUT    /api/fa/ar/invoices/:id              // 更新發票
  POST   /api/fa/ar/invoices/:id/void         // 作廢發票
  
  // 收款處理
  POST   /api/fa/ar/payments                  // 登記收款
  POST   /api/fa/ar/payments/apply            // 核銷應收
  GET    /api/fa/ar/payments/:id              // 查詢收款
  POST   /api/fa/ar/payments/batch            // 批次處理
  
  // 帳齡分析
  GET    /api/fa/ar/aging                     // 帳齡分析
  GET    /api/fa/ar/aging/details             // 明細查詢
  GET    /api/fa/ar/overdue                   // 逾期清單
  
  // 信用管理
  GET    /api/fa/ar/credit/:customerId        // 查詢信用
  PUT    /api/fa/ar/credit/:customerId        // 更新額度
  POST   /api/fa/ar/credit/check              // 信用檢查
  
  // 催收管理
  GET    /api/fa/ar/collections               // 催收清單
  POST   /api/fa/ar/collections/action        // 催收行動
  GET    /api/fa/ar/collections/performance   // 催收績效
}

// WebSocket 事件
interface ARWebSocketEvents {
  'invoice:created': (invoice: any) => void;
  'payment:received': (payment: any) => void;
  'credit:exceeded': (alert: any) => void;
  'overdue:alert': (overdue: any) => void;
  'collection:escalated': (collection: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OM**: 訂單出貨資訊
- **CRM**: 客戶基本資料
- **FA-PMAR**: 收付款處理
- **FA-IT**: 發票開立
- **BI**: 財務分析

### 4.2 外部系統整合
- **銀行系統**: 入帳通知
- **信用查詢**: 信用評級
- **電子發票**: 發票開立
- **簡訊服務**: 催收通知

## 5. 成功指標

### 5.1 業務指標
- DSO (收款天數) ≤ 30天
- 壞帳率 < 0.5%
- 逾期率 < 5%
- 收款效率 > 95%

### 5.2 系統指標
- 發票處理時間 < 3秒
- 核銷準確率 > 99.5%
- 系統可用性 ≥ 99.9%
- 查詢響應時間 < 1秒

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: fa@tsaitung.com