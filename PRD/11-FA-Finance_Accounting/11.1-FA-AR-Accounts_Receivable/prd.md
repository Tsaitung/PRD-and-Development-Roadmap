# 應收帳款管理 PRD 文件

## 模組資訊
- **模組代碼**: 11.1-FA-AR
- **模組名稱**: Accounts Receivable (應收帳款)
- **負責人**: 菜蟲農食 ERP 團隊
- **最後更新**: 2025-08-22
- **版本**: v1.0.0

## 模組概述
應收帳款管理模組負責處理所有客戶相關的財務應收項目，包括銷售發票、收款記錄、帳齡分析、信用管理等。支援農產品行業特殊的結帳週期和付款條件。

## 業務價值
- 改善現金流管理，縮短收款天數20%
- 降低壞帳風險，提升收款率至98%
- 自動化催收流程，減少人工作業60%
- 即時掌握應收狀況，支援信用決策

## 功能需求

### FR-FA-AR-001: 應收帳款建立與管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
根據銷售訂單和出貨單自動產生應收帳款，支援多種付款條件和結帳方式，管理應收帳款的完整生命週期。

**功能需求細節**:
- **條件/觸發**: 當訂單出貨確認或手動開立發票時
- **行為**: 自動產生應收帳款記錄、計算到期日、更新客戶餘額
- **資料輸入**: 訂單編號、客戶代碼、金額、付款條件、發票資訊
- **資料輸出**: 應收明細、發票清單、到期提醒、餘額報表
- **UI反應**: 金額自動計算、到期日顯示、信用額度檢查
- **例外處理**: 超過信用額度警告、重複開票檢查、金額異常提示

**用戶故事**:
作為財務人員，
我希望自動產生準確的應收帳款，
以便有效管理公司的現金流。

**驗收標準**:
```yaml
- 條件: 出貨單確認
  預期結果: 自動產生應收帳款並根據付款條件計算到期日
  
- 條件: 客戶信用額度不足
  預期結果: 顯示警告並要求主管核准
  
- 條件: 部分出貨
  預期結果: 按實際出貨金額產生應收帳款
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/ar/invoices`
  - `GET /api/v1/ar/invoices`
  - `PUT /api/v1/ar/invoices/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ARInvoice, PaymentTerm, CustomerCredit
- **權限要求**: ar.create, ar.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-FA-AR-001.test.ts`
  - 整合測試: `tests/integration/FR-FA-AR-001.integration.test.ts`
  - E2E測試: `tests/e2e/FR-FA-AR-001.e2e.test.ts`
- **Code**: `src/modules/fa/ar/invoice/`
- **TOC**: `TOC Modules.md` 第254行

**依賴關係**:
- **依賴模組**: OM (訂單管理), CRM (客戶資料)
- **依賴功能**: FR-OM-OL-001, FR-CRM-CM-001
- **外部服務**: 無

---

### FR-FA-AR-002: 收款處理與核銷
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
處理客戶付款，支援多種收款方式，自動或手動核銷應收帳款，處理溢收、短收等特殊情況。

**功能需求細節**:
- **條件/觸發**: 當收到客戶付款或銀行入帳通知時
- **行為**: 記錄收款、核銷應收帳款、更新餘額、產生收據
- **資料輸入**: 收款金額、付款方式、銀行帳號、核銷項目、匯款憑證
- **資料輸出**: 收款單、核銷記錄、未核銷餘額、收據
- **UI反應**: 自動匹配建議、餘額即時更新、核銷確認
- **例外處理**: 金額不符提示、重複收款警告、無法匹配處理

**用戶故事**:
作為出納人員，
我希望快速準確地處理收款，
以確保帳款記錄的正確性。

**驗收標準**:
```yaml
- 條件: 收到銀行匯款
  預期結果: 自動匹配對應的應收帳款並建議核銷
  
- 條件: 收款金額大於應收
  預期結果: 記錄溢收並顯示在客戶預收款
  
- 條件: 部分付款
  預期結果: 核銷部分金額並更新剩餘應收
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/ar/payments`
  - `POST /api/v1/ar/payments/{id}/apply`
  - `GET /api/v1/ar/unapplied`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Payment, PaymentApplication, Receipt
- **權限要求**: ar.payment.create, ar.payment.apply
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-FA-AR-002.test.ts`
  - 整合測試: `tests/integration/FR-FA-AR-002.integration.test.ts`
  - E2E測試: `tests/e2e/FR-FA-AR-002.e2e.test.ts`
- **Code**: `src/modules/fa/ar/payment/`
- **TOC**: `TOC Modules.md` 第254行

**依賴關係**:
- **依賴模組**: FA-PMAR (付款對帳), 銀行系統
- **依賴功能**: FR-FA-PMAR-001
- **外部服務**: 銀行API

---

### FR-FA-AR-003: 帳齡分析與催收管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
分析應收帳款的帳齡分布，自動產生催收通知，追蹤催收進度，管理壞帳準備。

**功能需求細節**:
- **條件/觸發**: 當帳款逾期或執行定期分析時
- **行為**: 計算帳齡、產生催收單、發送通知、記錄催收歷史
- **資料輸入**: 帳齡區間設定、催收策略、通知模板、壞帳比率
- **資料輸出**: 帳齡報表、催收清單、催收記錄、壞帳預估
- **UI反應**: 顏色標示逾期等級、催收進度顯示、自動提醒
- **例外處理**: 爭議帳款標記、暫停催收設定、特殊客戶處理

**用戶故事**:
作為信用管理人員，
我希望及時掌握逾期帳款並有效催收，
以降低壞帳損失。

**驗收標準**:
```yaml
- 條件: 帳款逾期7天
  預期結果: 自動發送第一次催收通知
  
- 條件: 逾期超過30天
  預期結果: 升級催收等級並通知主管
  
- 條件: 確認壞帳
  預期結果: 轉入壞帳並計提準備
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/ar/aging`
  - `POST /api/v1/ar/collections`
  - `PUT /api/v1/ar/{id}/write-off`
- **請求/回應**: 詳見API規格章節
- **數據模型**: AgingBucket, CollectionCase, BadDebtProvision
- **權限要求**: ar.aging.view, ar.collection.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-FA-AR-003.test.ts`
  - 整合測試: `tests/integration/FR-FA-AR-003.integration.test.ts`
  - E2E測試: `tests/e2e/FR-FA-AR-003.e2e.test.ts`
- **Code**: `src/modules/fa/ar/collection/`
- **TOC**: `TOC Modules.md` 第254行

**依賴關係**:
- **依賴模組**: DSH-NC (通知中心), CRM (客戶關係)
- **依賴功能**: FR-DSH-NC-001, FR-CRM-CM-001
- **外部服務**: Email/SMS服務

---

### FR-FA-AR-004: 信用額度管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
設定和管理客戶信用額度，監控信用使用狀況，支援信用評估和額度調整流程。

**功能需求細節**:
- **條件/觸發**: 當新增客戶或定期評估信用時
- **行為**: 設定信用額度、檢查可用額度、更新信用記錄
- **資料輸入**: 客戶資料、財務報表、付款歷史、額度申請
- **資料輸出**: 信用報告、額度使用率、風險評分、核准記錄
- **UI反應**: 額度使用圖表、風險等級顏色、超額警示
- **例外處理**: 超額訂單處理、臨時額度申請、黑名單管理

**用戶故事**:
作為信用控制人員，
我希望有效管理客戶信用風險，
以平衡銷售成長與壞帳控制。

**驗收標準**:
```yaml
- 條件: 新客戶申請信用
  預期結果: 根據評估標準給予初始額度
  
- 條件: 訂單超過信用額度
  預期結果: 暫停訂單並要求付款或申請提高額度
  
- 條件: 連續準時付款6個月
  預期結果: 系統建議提高信用額度
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/ar/credit/{customerId}`
  - `PUT /api/v1/ar/credit/{customerId}`
  - `POST /api/v1/ar/credit/evaluate`
- **請求/回應**: 詳見API規格章節
- **數據模型**: CreditLimit, CreditHistory, RiskScore
- **權限要求**: ar.credit.view, ar.credit.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-FA-AR-004.test.ts`
  - 整合測試: `tests/integration/FR-FA-AR-004.integration.test.ts`
  - E2E測試: `tests/e2e/FR-FA-AR-004.e2e.test.ts`
- **Code**: `src/modules/fa/ar/credit/`
- **TOC**: `TOC Modules.md` 第254行

**依賴關係**:
- **依賴模組**: CRM-CS (客戶分級), OM (訂單控制)
- **依賴功能**: FR-CRM-CS-001, FR-OM-OL-001
- **外部服務**: 信用查詢服務

---

### FR-FA-AR-005: 對帳單與報表
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
產生客戶對帳單、應收帳款報表、收款統計等各類財務報表，支援自動發送和匯出功能。

**功能需求細節**:
- **條件/觸發**: 當月底結帳或客戶要求時
- **行為**: 產生對帳單、彙總交易明細、計算餘額、發送報表
- **資料輸入**: 客戶選擇、日期範圍、報表類型、發送設定
- **資料輸出**: 對帳單、明細表、統計報表、匯出檔案
- **UI反應**: 報表預覽、批次產生進度、發送狀態顯示
- **例外處理**: 資料不完整警告、發送失敗重試、格式錯誤提示

**用戶故事**:
作為會計人員，
我希望自動產生準確的對帳單，
以提高對帳效率和客戶滿意度。

**驗收標準**:
```yaml
- 條件: 月底自動產生對帳單
  預期結果: 彙總當月所有交易並計算正確餘額
  
- 條件: 客戶要求重發對帳單
  預期結果: 即時產生並提供多種格式下載
  
- 條件: 批次發送對帳單
  預期結果: 自動發送給所有客戶並記錄發送狀態
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/ar/statements`
  - `GET /api/v1/ar/reports`
  - `POST /api/v1/ar/statements/send`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Statement, StatementLine, ReportTemplate
- **權限要求**: ar.statement.generate, ar.report.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-FA-AR-005.test.ts`
  - 整合測試: `tests/integration/FR-FA-AR-005.integration.test.ts`
  - E2E測試: `tests/e2e/FR-FA-AR-005.e2e.test.ts`
- **Code**: `src/modules/fa/ar/reports/`
- **TOC**: `TOC Modules.md` 第254行

**依賴關係**:
- **依賴模組**: BI (報表引擎), SA-NWS (通知設定)
- **依賴功能**: FR-SA-NWS-001
- **外部服務**: PDF生成服務, Email服務

## 非功能需求

### 性能需求
- 帳款查詢響應：< 1秒
- 對帳單產生：< 5秒
- 批次處理：1000筆/分鐘
- 報表產生：< 10秒

### 安全需求
- 財務資料加密存儲
- 金額修改審計日誌
- 職責分離控制
- 敏感資料遮罩

### 可用性需求
- 系統可用性：99.95%
- 月底結帳不停機
- 資料備份：每日
- 災難復原：RTO < 4小時

## 數據模型

### 主要實體
```typescript
interface ARInvoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  orderNo: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  status: 'open' | 'partial' | 'paid' | 'overdue' | 'disputed';
  paymentTerms: string;
  notes?: string;
}

interface Payment {
  id: string;
  paymentNo: string;
  customerId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'transfer' | 'credit_card';
  bankAccount?: string;
  reference?: string;
  appliedAmount: number;
  unappliedAmount: number;
  status: 'pending' | 'cleared' | 'bounced';
}

interface AgingBucket {
  customerId: string;
  customerName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90days: number;
  total: number;
  lastPaymentDate?: Date;
  creditLimit: number;
  availableCredit: number;
}

interface CollectionCase {
  id: string;
  customerId: string;
  invoiceIds: string[];
  totalAmount: number;
  overduedays: number;
  collectionLevel: 1 | 2 | 3 | 4;
  assignedTo?: string;
  lastContactDate?: Date;
  nextActionDate: Date;
  status: 'active' | 'promise' | 'dispute' | 'legal' | 'closed';
  notes: CollectionNote[];
}

interface CreditLimit {
  customerId: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  tempLimit?: number;
  tempLimitExpiry?: Date;
  riskScore: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
  approvedBy: string;
}
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/ar/invoices` | 創建應收發票 | 🔴 未開始 |
| GET | `/api/v1/ar/invoices` | 查詢應收帳款 | 🔴 未開始 |
| POST | `/api/v1/ar/payments` | 記錄收款 | 🔴 未開始 |
| POST | `/api/v1/ar/payments/{id}/apply` | 核銷應收 | 🔴 未開始 |
| GET | `/api/v1/ar/aging` | 帳齡分析 | 🔴 未開始 |
| POST | `/api/v1/ar/collections` | 創建催收案件 | 🔴 未開始 |
| GET | `/api/v1/ar/credit/{customerId}` | 查詢信用額度 | 🔴 未開始 |
| POST | `/api/v1/ar/statements` | 產生對帳單 | 🔴 未開始 |

### 請求/回應範例

#### 創建應收發票
```json
// 請求
POST /api/v1/ar/invoices
{
  "customerId": "CUST001",
  "orderNo": "SO20250822001",
  "invoiceDate": "2025-08-22",
  "amount": 100000,
  "tax": 5000,
  "paymentTerms": "NET30",
  "items": [
    {
      "description": "農產品銷售",
      "quantity": 100,
      "unitPrice": 1000,
      "amount": 100000
    }
  ]
}

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "invoiceNo": "INV20250822001",
    "totalAmount": 105000,
    "dueDate": "2025-09-21",
    "status": "open",
    "creditCheck": {
      "passed": true,
      "availableCredit": 500000
    }
  }
}
```

### 資料庫結構
```sql
-- 應收發票主檔
CREATE TABLE ar_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_no VARCHAR(30) REFERENCES orders(order_no),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  payment_terms VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_invoice_no (invoice_no),
  INDEX idx_customer (customer_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
);

-- 收款記錄
CREATE TABLE ar_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  bank_account VARCHAR(50),
  reference VARCHAR(100),
  applied_amount DECIMAL(15,2) DEFAULT 0,
  unapplied_amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_payment_no (payment_no),
  INDEX idx_customer (customer_id),
  INDEX idx_payment_date (payment_date)
);

-- 收款核銷明細
CREATE TABLE ar_payment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES ar_payments(id),
  invoice_id UUID NOT NULL REFERENCES ar_invoices(id),
  applied_amount DECIMAL(15,2) NOT NULL,
  applied_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_payment (payment_id),
  INDEX idx_invoice (invoice_id)
);

-- 催收案件
CREATE TABLE ar_collection_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  total_amount DECIMAL(15,2) NOT NULL,
  overdue_days INTEGER NOT NULL,
  collection_level INTEGER NOT NULL CHECK (collection_level BETWEEN 1 AND 4),
  assigned_to UUID REFERENCES users(id),
  last_contact_date DATE,
  next_action_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  INDEX idx_next_action (next_action_date)
);

-- 信用額度管理
CREATE TABLE ar_credit_limits (
  customer_id UUID PRIMARY KEY REFERENCES customers(id),
  credit_limit DECIMAL(15,2) NOT NULL,
  used_credit DECIMAL(15,2) DEFAULT 0,
  temp_limit DECIMAL(15,2),
  temp_limit_expiry DATE,
  risk_score DECIMAL(5,2),
  last_review_date DATE,
  next_review_date DATE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_next_review (next_review_date)
);
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎架構 | Week 1 | 資料模型、API框架 |
| 階段2：發票管理 | Week 2 | 應收建立、發票開立 |
| 階段3：收款處理 | Week 3 | 收款記錄、核銷功能 |
| 階段4：信用控制 | Week 4 | 信用管理、風險評估 |
| 階段5：催收系統 | Week 5 | 帳齡分析、催收流程 |
| 階段6：報表整合 | Week 6 | 對帳單、管理報表 |

### 里程碑
- [ ] M1：應收帳款基礎功能 - 2025-09-05
- [ ] M2：收款核銷系統完成 - 2025-09-12
- [ ] M3：信用管理上線 - 2025-09-19
- [ ] M4：催收系統啟用 - 2025-09-26
- [ ] M5：全模組整合測試 - 2025-10-03

## 風險評估
| 風險項目 | 可能性 | 影響 | 緩解措施 |
|----------|--------|------|----------|
| 資料準確性要求高 | 高 | 高 | 多重驗證、審計機制 |
| 法規遵循複雜 | 中 | 高 | 諮詢會計師、合規檢查 |
| 系統整合困難 | 中 | 中 | 標準化介面、充分測試 |
| 月底尖峰負載 | 高 | 中 | 效能優化、資源擴充 |

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-22 | 初始版本創建 | ERP Team |

---

**文件狀態**: 草稿
**下次審查日期**: 2025-08-29