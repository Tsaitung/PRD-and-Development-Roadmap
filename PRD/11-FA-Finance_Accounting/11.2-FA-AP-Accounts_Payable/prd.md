# FA-AP 應付帳款管理 (Accounts Payable) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM (採購管理), FA-PMAR (收付管理), FA-IT (發票稅務), WMS (倉儲管理)

## 1. 功能概述

### 1.1 目的
建立完善的應付帳款管理系統，自動化處理採購付款流程，優化現金流出管理，確保準時付款，維護良好供應商關係。

### 1.2 範圍
- 應付帳款建立
- 付款計劃管理
- 付款處理核銷
- 供應商對帳
- 費用分攤管理

### 1.3 關鍵價值
- 付款準確率達 99.9%
- 早付折扣利用率 90%
- 現金流優化 25%
- 作業時間節省 50%

## 2. 功能性需求

### FR-FA-AP-001: 應付帳款建立
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 採購驗收完成或費用發生
- **行為**: 自動產生應付帳款並建立付款義務
- **資料輸入**: 
  - 採購單資訊
  - 驗收單據
  - 供應商發票
  - 費用申請單
  - 付款條件
- **資料輸出**: 
  - 應付帳款單
  - 付款排程
  - 到期提醒
  - 供應商餘額
  - 會計分錄
- **UI反應**: 
  - 三方比對
  - 自動計算
  - 審核提示
  - 批次建立
  - 狀態顯示
- **例外處理**: 
  - 金額差異
  - 重複請款
  - 資料不符
  - 超額請款

#### 驗收標準
```yaml
- 條件: 驗收單完成
  預期結果: 自動產生應付帳款並通知財務

- 條件: 發票金額與採購單不符
  預期結果: 顯示差異並要求確認

- 條件: 供應商首次請款
  預期結果: 驗證供應商資料完整性
```

#### Traceability
- **測試案例**: tests/unit/FR-FA-AP-001.test.ts
- **實作程式**: src/modules/fa/services/accountsPayable.service.ts
- **相關文件**: TOC Modules.md - Section 11.2

### FR-FA-AP-002: 付款計劃管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 應付帳款產生或現金流規劃
- **行為**: 制定和管理付款計劃以優化現金流
- **資料輸入**: 
  - 應付清單
  - 現金預測
  - 優先順序
  - 折扣條件
  - 信用期限
- **資料輸出**: 
  - 付款排程表
  - 現金需求
  - 折扣機會
  - 逾期警示
  - 審批清單
- **UI反應**: 
  - 日曆視圖
  - 拖拽調整
  - 模擬計算
  - 批次審批
  - 統計圖表
- **例外處理**: 
  - 資金不足
  - 緊急付款
  - 計劃衝突
  - 超額付款

#### 付款計劃模型
```typescript
interface PaymentPlan {
  id: string;
  planPeriod: { start: Date; end: Date; };
  
  // 計劃明細
  plannedPayments: {
    payableId: string;
    supplier: {
      supplierId: string;
      supplierName: string;
      priority: 'high' | 'medium' | 'low';
    };
    
    invoice: {
      invoiceNo: string;
      amount: number;
      dueDate: Date;
    };
    
    planning: {
      plannedDate: Date;
      plannedAmount: number;
      
      earlyPayment?: {
        discountRate: number;
        discountAmount: number;
        payByDate: Date;
      };
      
      installment?: {
        times: number;
        amounts: number[];
        dates: Date[];
      };
    };
    
    approval: {
      required: boolean;
      approvedBy?: string;
      approvedAt?: Date;
      comments?: string;
    };
    
    status: 'planned' | 'approved' | 'scheduled' | 'paid' | 'cancelled';
  }[];
  
  // 資金需求
  cashRequirement: {
    totalAmount: number;
    byDate: {
      date: Date;
      amount: number;
      cumulative: number;
    }[];
    
    available: number;
    shortage?: number;
    
    funding?: {
      source: string;
      amount: number;
      availableDate: Date;
    }[];
  };
  
  // 優化建議
  optimization: {
    potentialSavings: number;
    
    recommendations: {
      type: 'early_payment' | 'delay' | 'negotiate' | 'combine';
      description: string;
      impact: number;
      feasibility: 'high' | 'medium' | 'low';
    }[];
  };
}
```

### FR-FA-AP-003: 付款處理核銷
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 執行付款或收到付款確認
- **行為**: 處理付款並核銷應付帳款
- **資料輸入**: 
  - 付款金額
  - 付款方式
  - 銀行帳戶
  - 核銷項目
  - 付款憑證
- **資料輸出**: 
  - 付款單據
  - 核銷記錄
  - 餘額更新
  - 付款通知
  - 會計分錄
- **UI反應**: 
  - 批次付款
  - 自動匹配
  - 確認提示
  - 憑證上傳
  - 狀態追蹤
- **例外處理**: 
  - 付款失敗
  - 金額錯誤
  - 帳戶問題
  - 重複付款

### FR-FA-AP-004: 供應商對帳
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 月結對帳或供應商請求
- **行為**: 與供應商進行帳款對帳確認
- **資料輸入**: 
  - 對帳期間
  - 交易明細
  - 供應商對帳單
  - 差異項目
  - 調整憑證
- **資料輸出**: 
  - 對帳報告
  - 差異清單
  - 確認函
  - 調整分錄
  - 餘額證明
- **UI反應**: 
  - 自動比對
  - 差異標示
  - 調節表
  - 電子簽核
  - 歷史查詢
- **例外處理**: 
  - 無法調節
  - 爭議項目
  - 資料缺失
  - 系統差異

### FR-FA-AP-005: 費用分攤管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 共同費用發生或月結分攤
- **行為**: 按規則分攤費用至各部門或專案
- **資料輸入**: 
  - 費用類型
  - 分攤規則
  - 受益單位
  - 分攤基準
  - 期間設定
- **資料輸出**: 
  - 分攤計算表
  - 部門費用
  - 專案成本
  - 分錄憑證
  - 分析報表
- **UI反應**: 
  - 規則設定
  - 預覽計算
  - 批次處理
  - 審核流程
  - 結果查詢
- **例外處理**: 
  - 規則衝突
  - 基準缺失
  - 計算錯誤
  - 追溯調整

## 3. 系統設計

### 3.1 資料模型

```typescript
// 應付帳款
interface APInvoice {
  id: string;
  invoiceNo: string;
  
  // 基本資訊
  basicInfo: {
    type: 'purchase' | 'expense' | 'prepayment' | 'credit_memo';
    date: Date;
    dueDate: Date;
    
    supplier: {
      supplierId: string;
      supplierCode: string;
      supplierName: string;
      bankAccount?: BankAccount;
    };
    
    terms: {
      paymentTerm: string;
      earlyPaymentDiscount?: {
        percentage: number;
        days: number;
        deadline: Date;
      };
    };
  };
  
  // 來源文件
  source: {
    type: 'po' | 'expense' | 'contract' | 'manual';
    
    purchaseOrder?: {
      poNumber: string;
      grNumber: string;  // 驗收單號
    };
    
    expense?: {
      expenseId: string;
      requestor: string;
      department: string;
    };
    
    contract?: {
      contractNo: string;
      milestone?: string;
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
      deductible: boolean;
    };
    
    account: {
      code: string;
      name: string;
      costCenter?: string;
      project?: string;
    };
    
    allocation?: {
      department: string;
      percentage: number;
      amount: number;
    }[];
  }[];
  
  // 金額匯總
  summary: {
    subtotal: number;
    taxAmount: number;
    total: number;
    currency: string;
    exchangeRate?: number;
  };
  
  // 付款狀態
  paymentStatus: {
    status: 'unpaid' | 'partial' | 'paid' | 'void';
    
    paidAmount: number;
    balance: number;
    
    payments: {
      paymentId: string;
      date: Date;
      amount: number;
      method: string;
    }[];
  };
  
  // 審核流程
  approval: {
    required: boolean;
    workflow: string;
    
    steps: {
      level: number;
      approver: string;
      status: 'pending' | 'approved' | 'rejected';
      date?: Date;
      comments?: string;
    }[];
  };
  
  // 三方比對
  matching: {
    type: 'two_way' | 'three_way';
    
    comparison: {
      po?: { amount: number; quantity: number; };
      gr?: { amount: number; quantity: number; };
      invoice: { amount: number; quantity: number; };
    };
    
    variances: {
      priceVariance?: number;
      quantityVariance?: number;
      acceptable: boolean;
    };
    
    status: 'matched' | 'unmatched' | 'partial' | 'waived';
  };
}

// 付款處理
interface Payment {
  id: string;
  paymentNo: string;
  
  // 付款資訊
  payment: {
    date: Date;
    amount: number;
    currency: string;
    
    method: {
      type: 'check' | 'transfer' | 'cash' | 'draft' | 'credit_card';
      
      check?: {
        checkNo: string;
        bank: string;
        date: Date;
      };
      
      transfer?: {
        fromAccount: string;
        toAccount: string;
        reference: string;
        charges?: number;
      };
    };
    
    batch?: {
      batchId: string;
      batchNo: string;
      totalAmount: number;
      count: number;
    };
  };
  
  // 核銷明細
  applications: {
    invoiceId: string;
    invoiceNo: string;
    
    amounts: {
      invoiceAmount: number;
      appliedAmount: number;
      discount?: number;
      balance: number;
    };
    
    withholding?: {
      type: string;
      rate: number;
      amount: number;
    };
  }[];
  
  // 銀行資訊
  banking: {
    remittance?: {
      swift: string;
      intermediary?: string;
      charges: 'our' | 'ben' | 'sha';
    };
    
    confirmation?: {
      confirmed: boolean;
      reference?: string;
      date?: Date;
    };
  };
  
  // 狀態
  status: 'draft' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  audit: {
    createdBy: string;
    createdAt: Date;
    approvedBy?: string;
    processedBy?: string;
    processedAt?: Date;
  };
}

// 供應商對帳
interface SupplierReconciliation {
  id: string;
  supplier: {
    supplierId: string;
    supplierName: string;
  };
  
  period: {
    start: Date;
    end: Date;
  };
  
  // 我方記錄
  ourRecords: {
    openingBalance: number;
    
    transactions: {
      date: Date;
      type: string;
      reference: string;
      debit: number;
      credit: number;
    }[];
    
    closingBalance: number;
  };
  
  // 供應商記錄
  supplierRecords: {
    openingBalance: number;
    transactions: any[];
    closingBalance: number;
    statement?: string;  // 對帳單附件
  };
  
  // 調節項目
  reconciliation: {
    matched: {
      count: number;
      amount: number;
    };
    
    unmatched: {
      inOurs: any[];
      inSuppliers: any[];
    };
    
    adjustments: {
      description: string;
      amount: number;
      approved: boolean;
    }[];
    
    finalBalance: {
      ours: number;
      suppliers: number;
      difference: number;
    };
  };
  
  // 確認狀態
  confirmation: {
    status: 'pending' | 'confirmed' | 'disputed';
    confirmedBy?: string;
    confirmedAt?: Date;
    disputes?: string[];
  };
}
```

### 3.2 API 設計

```typescript
// 應付帳款 API
interface AccountsPayableAPI {
  // 應付管理
  POST   /api/fa/ap/invoices                  // 建立應付
  GET    /api/fa/ap/invoices                  // 查詢應付
  GET    /api/fa/ap/invoices/:id              // 應付詳情
  PUT    /api/fa/ap/invoices/:id              // 更新應付
  POST   /api/fa/ap/invoices/:id/approve      // 審批應付
  
  // 付款計劃
  POST   /api/fa/ap/payment-plan              // 建立計劃
  GET    /api/fa/ap/payment-plan              // 查詢計劃
  POST   /api/fa/ap/payment-plan/optimize     // 優化建議
  
  // 付款處理
  POST   /api/fa/ap/payments                  // 建立付款
  POST   /api/fa/ap/payments/batch            // 批次付款
  POST   /api/fa/ap/payments/apply            // 核銷應付
  GET    /api/fa/ap/payments/:id              // 付款詳情
  
  // 供應商對帳
  POST   /api/fa/ap/reconciliation            // 建立對帳
  GET    /api/fa/ap/reconciliation            // 查詢對帳
  POST   /api/fa/ap/reconciliation/confirm    // 確認對帳
  
  // 費用分攤
  POST   /api/fa/ap/allocation                // 執行分攤
  GET    /api/fa/ap/allocation/rules          // 分攤規則
  POST   /api/fa/ap/allocation/calculate      // 計算分攤
}

// WebSocket 事件
interface APWebSocketEvents {
  'invoice:pending': (invoice: any) => void;
  'payment:due': (payment: any) => void;
  'payment:completed': (payment: any) => void;
  'discount:expiring': (discount: any) => void;
  'reconciliation:required': (recon: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **PM**: 採購訂單與驗收
- **WMS**: 入庫驗收單
- **FA-PMAR**: 付款處理
- **FA-IT**: 進項稅額
- **FA-FR**: 財務報表

### 4.2 外部系統整合
- **銀行系統**: 付款執行
- **供應商平台**: 對帳單交換
- **電子發票**: 進項發票
- **匯率系統**: 外幣換算

## 5. 成功指標

### 5.1 業務指標
- 準時付款率 ≥ 98%
- 折扣利用率 ≥ 90%
- 對帳完成率 ≥ 95%
- 處理效率提升 ≥ 50%

### 5.2 系統指標
- 處理時間 < 2秒
- 核銷準確率 ≥ 99.9%
- 系統可用性 ≥ 99.9%
- 批次處理 ≥ 500筆/分

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: fa@tsaitung.com