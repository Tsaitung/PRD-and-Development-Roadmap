# FA-IT 發票與稅務管理 (Invoice & Tax Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: FA-AR (應收帳款), FA-AP (應付帳款), OM (訂單管理), PM (採購管理)

## 1. 功能概述

### 1.1 目的
建立完整的發票與稅務管理系統，符合政府電子發票規範，自動化稅務計算與申報，確保稅務合規性。

### 1.2 範圍
- 電子發票開立
- 進銷項發票管理
- 稅額計算申報
- 發票查詢對帳
- 稅務報表產出

### 1.3 關鍵價值
- 發票合規率 100%
- 申報錯誤率降至 0%
- 作業時間節省 80%
- 查核通過率 100%

## 2. 功能性需求

### FR-FA-IT-001: 電子發票開立
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 銷售交易完成或手動開立需求
- **行為**: 開立符合規範的電子發票
- **資料輸入**: 
  - 買受人資訊
  - 銷售明細
  - 稅率稅額
  - 發票類型
  - 載具資訊
- **資料輸出**: 
  - 電子發票
  - 發票號碼
  - QR Code
  - 上傳確認
  - 通知發送
- **UI反應**: 
  - 自動帶入
  - 即時驗證
  - 預覽列印
  - 批次開立
  - 狀態顯示
- **例外處理**: 
  - 資料錯誤
  - 號碼不足
  - 上傳失敗
  - 重複開立

#### 驗收標準
```yaml
- 條件: 完成銷售交易
  預期結果: 自動開立電子發票並上傳財政部

- 條件: 買受人要求載具
  預期結果: 正確儲存至指定載具

- 條件: 需要作廢發票
  預期結果: 依規定完成作廢程序
```

#### Traceability
- **測試案例**: tests/unit/FR-FA-IT-001.test.ts
- **實作程式**: src/modules/fa/services/invoiceTax.service.ts
- **相關文件**: TOC Modules.md - Section 11.4

### FR-FA-IT-002: 進銷項發票管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 進貨發票取得或銷貨發票開立
- **行為**: 管理所有進銷項發票並計算稅額
- **資料輸入**: 
  - 發票類型資訊
  - 進項發票登錄
  - 銷項發票記錄
  - 折讓單處理
  - 扣抵聯管理
- **資料輸出**: 
  - 發票清冊
  - 稅額統計
  - 可扣抵明細
  - 異常清單
  - 申報資料
- **UI反應**: 
  - 分類管理
  - 快速查詢
  - 批次匯入
  - 狀態標示
  - 統計圖表
- **例外處理**: 
  - 發票遺失
  - 金額不符
  - 無法扣抵
  - 逾期申報

#### 發票管理模型
```typescript
interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  
  // 發票資訊
  invoice: {
    type: 'b2b' | 'b2c' | 'duplicate' | 'triplicate';
    kind: 'sales' | 'purchase' | 'allowance';
    
    date: Date;
    period: string;  // YYYYMM
    
    seller: {
      taxId: string;
      name: string;
      address?: string;
    };
    
    buyer: {
      taxId?: string;
      name: string;
      address?: string;
      carrier?: {
        type: 'mobile' | 'citizen' | 'email';
        id: string;
      };
    };
  };
  
  // 金額明細
  amounts: {
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[];
    
    salesAmount: number;
    taxType: 'taxable' | 'zero' | 'exempt';
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  };
  
  // 電子發票
  electronic: {
    uploaded: boolean;
    uploadTime?: Date;
    
    qrcode: {
      left: string;
      right: string;
    };
    
    randomCode: string;
    
    platform?: {
      status: 'pending' | 'uploaded' | 'confirmed' | 'failed';
      response?: string;
      errorMessage?: string;
    };
  };
  
  // 稅務處理
  tax: {
    deductible: boolean;
    deductionPeriod?: string;
    
    declaration?: {
      declared: boolean;
      declarationNo?: string;
      declaredAt?: Date;
    };
    
    audit?: {
      selected: boolean;
      auditDate?: Date;
      result?: string;
    };
  };
  
  // 作廢折讓
  cancellation?: {
    cancelled: boolean;
    cancelDate?: Date;
    cancelReason?: string;
    cancelInvoiceNo?: string;
  };
  
  allowance?: {
    originalInvoiceNo: string;
    allowanceNo: string;
    allowanceAmount: number;
    reason: string;
  };
  
  status: 'valid' | 'cancelled' | 'allowance';
}
```

### FR-FA-IT-003: 稅額計算申報
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 申報期限或手動申報
- **行為**: 自動計算稅額並產生申報資料
- **資料輸入**: 
  - 申報期間
  - 進銷項資料
  - 扣抵設定
  - 調整項目
  - 零稅率證明
- **資料輸出**: 
  - 營業稅申報書
  - 進銷項明細
  - 應納稅額
  - 媒體申報檔
  - 繳款單
- **UI反應**: 
  - 自動計算
  - 檢核提示
  - 預覽確認
  - 申報上傳
  - 狀態追蹤
- **例外處理**: 
  - 資料不全
  - 計算錯誤
  - 申報失敗
  - 更正申報

#### 稅務申報模型
```typescript
interface TaxDeclaration {
  id: string;
  period: string;  // YYYYMM
  
  // 申報類型
  declaration: {
    type: 'regular' | 'amended' | 'supplementary';
    filingDate: Date;
    dueDate: Date;
    
    method: 'online' | 'media' | 'manual';
    declarationNo?: string;
  };
  
  // 銷項統計
  sales: {
    taxable: {
      amount: number;
      tax: number;
      count: number;
    };
    
    zeroRated: {
      amount: number;
      count: number;
      certificates?: string[];
    };
    
    exempt: {
      amount: number;
      count: number;
    };
    
    total: {
      amount: number;
      tax: number;
    };
  };
  
  // 進項統計
  purchases: {
    deductible: {
      amount: number;
      tax: number;
      count: number;
    };
    
    nonDeductible: {
      amount: number;
      tax: number;
      count: number;
      reasons: string[];
    };
    
    total: {
      amount: number;
      tax: number;
    };
  };
  
  // 稅額計算
  calculation: {
    outputTax: number;
    inputTax: number;
    
    adjustments: {
      description: string;
      amount: number;
      type: 'add' | 'deduct';
    }[];
    
    previousCredit?: number;
    
    payable: number;
    refundable: number;
    carryForward: number;
  };
  
  // 繳納資訊
  payment?: {
    method: 'transfer' | 'cash' | 'check';
    amount: number;
    
    bank?: {
      account: string;
      reference: string;
      paidDate: Date;
    };
    
    receipt?: string;
  };
  
  // 申報狀態
  status: {
    current: 'draft' | 'reviewing' | 'filed' | 'accepted' | 'rejected' | 'amended';
    
    validation: {
      passed: boolean;
      errors?: string[];
      warnings?: string[];
    };
    
    submission?: {
      submittedAt: Date;
      submittedBy: string;
      confirmationNo?: string;
    };
    
    response?: {
      receivedAt: Date;
      status: string;
      message?: string;
    };
  };
}
```

### FR-FA-IT-004: 發票查詢對帳
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 查詢需求或對帳作業
- **行為**: 提供多維度發票查詢與對帳功能
- **資料輸入**: 
  - 查詢條件
  - 對帳期間
  - 客戶供應商
  - 發票號碼
  - 金額範圍
- **資料輸出**: 
  - 查詢結果
  - 對帳報告
  - 差異清單
  - 統計分析
  - 匯出資料
- **UI反應**: 
  - 進階搜尋
  - 即時篩選
  - 結果分頁
  - 批次操作
  - 圖表分析
- **例外處理**: 
  - 查無資料
  - 對帳不符
  - 資料遺失
  - 系統異常

### FR-FA-IT-005: 稅務報表產出
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期報表或管理需求
- **行為**: 產生各類稅務管理報表
- **資料輸入**: 
  - 報表類型
  - 期間範圍
  - 篩選條件
  - 排序設定
  - 格式選擇
- **資料輸出**: 
  - 401報表
  - 403報表
  - 發票明細表
  - 稅額分析表
  - 管理報表
- **UI反應**: 
  - 報表選單
  - 參數設定
  - 預覽功能
  - 匯出下載
  - 排程設定
- **例外處理**: 
  - 資料不足
  - 格式錯誤
  - 產生失敗
  - 權限不足

## 3. 系統設計

### 3.1 資料模型

```typescript
// 發票設定
interface InvoiceSettings {
  // 公司資訊
  company: {
    taxId: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    
    registration: {
      type: 'company' | 'branch' | 'individual';
      registrationNo?: string;
    };
  };
  
  // 發票字軌
  trackNumbers: {
    year: number;
    period: string;  // 月份
    prefix: string;  // 字軌
    
    range: {
      start: string;
      end: string;
      current: string;
      remaining: number;
    };
    
    type: 'paper' | 'electronic';
    status: 'active' | 'inactive' | 'exhausted';
  }[];
  
  // 稅務設定
  tax: {
    defaultRate: number;
    
    rates: {
      name: string;
      rate: number;
      description: string;
    }[];
    
    filing: {
      frequency: 'monthly' | 'bimonthly';
      method: 'online' | 'media';
      reminderDays: number;
    };
  };
  
  // 電子發票平台
  platform: {
    provider: string;
    apiUrl: string;
    
    credentials: {
      accountId: string;
      encrypted: true;
    };
    
    settings: {
      autoUpload: boolean;
      uploadDelay: number;
      retryAttempts: number;
    };
  };
}

// 稅務月結
interface TaxPeriodSummary {
  period: string;
  
  // 發票統計
  invoices: {
    sales: {
      count: number;
      amount: number;
      tax: number;
    };
    
    purchases: {
      count: number;
      amount: number;
      tax: number;
    };
    
    cancelled: {
      count: number;
      amount: number;
    };
    
    allowances: {
      count: number;
      amount: number;
    };
  };
  
  // 稅額統計
  tax: {
    outputTax: number;
    inputTax: number;
    
    nonDeductible: number;
    
    netPayable: number;
    previousCredit: number;
    
    finalPayable: number;
    carryForward: number;
  };
  
  // 申報狀態
  filing: {
    status: 'pending' | 'draft' | 'filed' | 'completed';
    dueDate: Date;
    filedDate?: Date;
    
    declarationNo?: string;
    paymentStatus?: string;
  };
  
  // 關帳狀態
  closed: boolean;
  closedBy?: string;
  closedAt?: Date;
}

// 查核記錄
interface TaxAudit {
  id: string;
  
  audit: {
    type: 'regular' | 'special' | 'investigation';
    period: { start: string; end: string; };
    
    authority: string;
    auditor: string;
    
    startDate: Date;
    endDate?: Date;
  };
  
  // 查核項目
  items: {
    category: string;
    description: string;
    
    findings?: {
      issue: string;
      amount?: number;
      tax?: number;
    };
    
    response?: {
      explanation: string;
      documents: string[];
      accepted?: boolean;
    };
  }[];
  
  // 查核結果
  result?: {
    assessment: number;
    penalty?: number;
    interest?: number;
    
    total: number;
    
    agreement: 'accepted' | 'disputed' | 'appealing';
    
    payment?: {
      method: string;
      date: Date;
      reference: string;
    };
  };
  
  status: 'preparing' | 'ongoing' | 'responding' | 'completed' | 'closed';
}
```

### 3.2 API 設計

```typescript
// 發票管理 API
interface InvoiceManagementAPI {
  // 發票開立
  POST   /api/fa/invoices                     // 開立發票
  POST   /api/fa/invoices/batch               // 批次開立
  POST   /api/fa/invoices/:id/cancel          // 作廢發票
  POST   /api/fa/invoices/allowance           // 開立折讓
  
  // 發票查詢
  GET    /api/fa/invoices                     // 查詢發票
  GET    /api/fa/invoices/:id                 // 發票詳情
  GET    /api/fa/invoices/summary             // 統計摘要
  
  // 電子發票
  POST   /api/fa/invoices/upload              // 上傳平台
  GET    /api/fa/invoices/platform/status     // 平台狀態
  POST   /api/fa/invoices/download            // 下載發票
}

// 稅務申報 API
interface TaxFilingAPI {
  // 申報作業
  POST   /api/fa/tax/calculate                // 計算稅額
  POST   /api/fa/tax/declaration              // 產生申報
  POST   /api/fa/tax/file                     // 提交申報
  GET    /api/fa/tax/status                   // 申報狀態
  
  // 查詢統計
  GET    /api/fa/tax/summary/:period          // 期間統計
  GET    /api/fa/tax/history                  // 申報歷史
  
  // 報表產出
  GET    /api/fa/tax/reports/401              // 401報表
  GET    /api/fa/tax/reports/403              // 403報表
  POST   /api/fa/tax/reports/export           // 匯出報表
}

// WebSocket 事件
interface InvoiceTaxWebSocketEvents {
  'invoice:created': (invoice: any) => void;
  'invoice:cancelled': (invoice: any) => void;
  'tax:filing_due': (reminder: any) => void;
  'tax:filed': (declaration: any) => void;
  'audit:notification': (audit: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OM**: 銷售發票開立
- **PM**: 進項發票登錄
- **FA-AR**: 應收帳款發票
- **FA-AP**: 應付帳款發票
- **FA-FR**: 財務報表

### 4.2 外部系統整合
- **財政部電子發票平台**: 發票上傳下載
- **營業稅申報系統**: 稅務申報
- **銀行系統**: 稅款繳納
- **會計師系統**: 查核配合

## 5. 成功指標

### 5.1 業務指標
- 發票正確率 100%
- 申報準時率 100%
- 稅務罰款 0元
- 查核通過率 100%

### 5.2 系統指標
- 發票開立時間 < 2秒
- 上傳成功率 ≥ 99.9%
- 系統可用性 ≥ 99.9%
- 申報處理時間 < 10分鐘

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: fa@tsaitung.com