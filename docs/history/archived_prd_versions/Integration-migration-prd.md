# 【舊系統轉移】FA-AR 應收帳款管理模組 PRD

## 轉移資訊
- **來源系統**: tsaitung-dashboard-central (北區)
- **原始頁面**: 
  - `/billing/` - 帳務管理
  - `/billing/[month]/` - 月結帳單
  - `/billing/invoice/` - 發票管理
  - `/billing/payment/` - 收款記錄
  - `/billing/statement/` - 對帳單
  - `/billing/aging/` - 帳齡分析
- **原始代碼位置**: 
  - `/libs/tsaitung-dashboard/Billing/`
  - `/libs/tsaitung-dashboard/Invoice/`
  - `/libs/tsaitung-dashboard/Payment/`
- **轉移類型**: 功能保留型轉移
- **轉移優先級**: P1-高（財務核心）
- **最後更新**: 2025-08-20

## 模組資訊
- **模組代碼**: FA-AR
- **模組名稱**: 應收帳款管理 (Accounts Receivable)
- **負責人**: [待指派]
- **版本**: v1.0.0-migration

## 模組概述
應收帳款管理模組是財務系統的核心組件，負責管理客戶帳款、開立發票、收款處理、對帳作業、帳齡分析等功能。確保現金流管理和財務健康。

## 舊系統功能分析

### 現有功能清單

#### 帳單管理功能
1. **月結作業**
   - 自動產生月結帳單
   - 訂單彙總計算
   - 運費計算
   - 折扣處理

2. **帳單查詢**
   - 依客戶查詢
   - 依期間查詢
   - 未結清單
   - 逾期清單

3. **帳單調整**
   - 金額調整
   - 折讓處理
   - 退貨扣款
   - 補開帳單

#### 發票管理功能
1. **發票開立**
   - 二聯式發票
   - 三聯式發票
   - 電子發票
   - 批次開立

2. **發票作業**
   - 作廢處理
   - 折讓單開立
   - 發票補印
   - 發票查詢

3. **電子發票**
   - 上傳財政部
   - 載具管理
   - 中獎對獎

#### 收款管理功能
1. **收款登錄**
   - 現金收款
   - 匯款收款
   - 支票收款
   - 信用卡收款

2. **收款核銷**
   - 自動核銷
   - 手動分配
   - 部分付款
   - 預收處理

3. **收款追蹤**
   - 待收款項
   - 收款進度
   - 催收提醒

#### 對帳作業功能
1. **客戶對帳**
   - 對帳單產生
   - 差異分析
   - 對帳確認

2. **銀行對帳**
   - 入帳確認
   - 餘額核對
   - 異常處理

#### 帳齡分析功能
1. **帳齡報表**
   - 30/60/90天分析
   - 客戶信用分析
   - 逾期統計

2. **風險管理**
   - 信用額度控制
   - 逾期警示
   - 壞帳評估

### 保留與改進

#### 需保留功能
- 完整的月結流程
- 多種發票格式支援
- 靈活的收款核銷
- 自動對帳機制
- 帳齡分析報表
- 信用控制功能

#### 計劃改進項目
- AI預測收款
- 自動催收流程
- 線上對帳平台
- 即時信用評估
- 區塊鏈發票
- 多幣別支援
- 金流串接優化
- 智能核銷建議

## 功能需求

### FR-FA-AR-001: 月結帳單產生
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
每月自動或手動產生客戶帳單，彙總當月交易並計算應收金額。

**功能需求細節**:
- **條件/觸發**: 月底結帳或手動執行
- **行為**: 產生月結帳單
- **資料輸入**: 
  - 結帳月份
  - 客戶範圍
  - 訂單區間
  - 計價規則
  - 運費設定
- **資料輸出**: 
  - 月結帳單
  - 明細清單
  - 發票資料
  - 應收總額
- **UI反應**: 進度顯示、預覽確認
- **例外處理**: 異常訂單提示、金額檢核

**驗收標準**:
```yaml
- 條件: 執行月結作業
  預期結果: 產生所有客戶的月結帳單
  
- 條件: 有退貨或折讓
  預期結果: 正確扣減應收金額
  
- 條件: 特殊計價客戶
  預期結果: 套用客製化價格
```

**技術需求**:
- **API 端點**: `POST /api/v1/billing/monthly-close`
- **請求參數**:
  ```json
  {
    "billing_month": "2025-08",
    "customer_ids": ["CUS_001", "CUS_002"],
    "include_shipping": true,
    "auto_invoice": true
  }
  ```

### FR-FA-AR-002: 發票開立管理
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
開立各類型發票，支援電子發票上傳和管理。

**功能需求細節**:
- **條件/觸發**: 帳單確認後開立發票
- **行為**: 產生並儲存發票
- **資料輸入**: 
  - 發票類型
  - 買受人資訊
  - 品項明細
  - 稅額計算
  - 載具資訊
- **資料輸出**: 
  - 發票號碼
  - 發票檔案
  - QR Code
  - 上傳狀態
- **UI反應**: 即時預覽、批次處理
- **例外處理**: 號碼重複檢查、格式驗證

### FR-FA-AR-003: 收款處理作業
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
登錄客戶付款並執行帳款核銷作業。

**功能需求細節**:
- **條件/觸發**: 收到客戶付款
- **行為**: 登錄收款並核銷帳款
- **資料輸入**: 
  - 付款方式
  - 付款金額
  - 付款日期
  - 銀行帳號
  - 核銷帳單
- **資料輸出**: 
  - 收款單據
  - 核銷記錄
  - 餘額更新
- **UI反應**: 自動匹配建議、餘額顯示
- **例外處理**: 溢收處理、短收提醒

### FR-FA-AR-004: 客戶對帳作業
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
產生客戶對帳單，確認帳款餘額正確。

**功能需求細節**:
- **條件/觸發**: 定期或客戶要求
- **行為**: 產生對帳單
- **資料輸入**: 
  - 對帳期間
  - 客戶選擇
  - 包含項目
- **資料輸出**: 
  - 對帳單
  - 交易明細
  - 餘額確認
- **UI反應**: PDF生成、郵件發送
- **例外處理**: 差異標示、調節說明

### FR-FA-AR-005: 帳齡分析報表
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
分析應收帳款的帳齡分布，評估收款風險。

**功能需求細節**:
- **條件/觸發**: 定期報表或查詢
- **行為**: 計算帳齡並分類
- **資料輸入**: 
  - 分析日期
  - 帳齡區間設定
  - 客戶篩選
- **資料輸出**: 
  - 帳齡分布表
  - 逾期清單
  - 風險評估
  - 催收建議
- **UI反應**: 圖表顯示、匯出Excel
- **例外處理**: 壞帳預警

### FR-FA-AR-006: 信用額度管理
**狀態**: ⚪ 規劃中
**優先級**: P3

**功能描述**:
管理客戶信用額度，控制賒銷風險。

**功能需求細節**:
- **條件/觸發**: 訂單建立或額度檢查
- **行為**: 評估並控制信用
- **資料輸入**: 
  - 信用額度設定
  - 付款記錄
  - 逾期天數
- **資料輸出**: 
  - 可用額度
  - 風險評級
  - 控制建議
- **UI反應**: 即時額度顯示、超額警告
- **例外處理**: 額度凍結、特批流程

## 數據模型

### 主要實體
```typescript
// 帳單實體
interface Bill {
  bill_id: string;
  bill_no: string;
  customer_id: string;
  customer_name: string;
  
  // 帳單資訊
  billing_month: string;
  billing_date: Date;
  due_date: Date;
  
  // 金額資訊
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  
  // 狀態
  status: 'draft' | 'confirmed' | 'invoiced' | 'paid' | 'overdue';
  
  // 明細
  items: BillItem[];
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// 帳單明細
interface BillItem {
  item_id: string;
  bill_id: string;
  order_id: string;
  order_date: Date;
  product_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

// 發票實體
interface Invoice {
  invoice_id: string;
  invoice_no: string;
  invoice_date: Date;
  
  // 關聯資訊
  bill_id?: string;
  customer_id: string;
  
  // 發票資訊
  invoice_type: 'B2B' | 'B2C';
  tax_id?: string;
  
  // 金額
  sales_amount: number;
  tax_amount: number;
  total_amount: number;
  
  // 電子發票
  einvoice_code?: string;
  carrier_type?: string;
  carrier_id?: string;
  
  status: 'valid' | 'void' | 'allowance';
  
  created_at: Date;
  void_date?: Date;
  void_reason?: string;
}

// 收款記錄
interface Payment {
  payment_id: string;
  payment_no: string;
  
  // 客戶資訊
  customer_id: string;
  customer_name: string;
  
  // 付款資訊
  payment_date: Date;
  payment_method: 'cash' | 'transfer' | 'check' | 'credit_card';
  payment_amount: number;
  
  // 銀行資訊
  bank_code?: string;
  bank_account?: string;
  check_no?: string;
  
  // 核銷資訊
  allocated_amount: number;
  unallocated_amount: number;
  allocations: PaymentAllocation[];
  
  status: 'pending' | 'confirmed' | 'allocated';
  
  notes?: string;
  created_by: string;
  created_at: Date;
}

// 付款分配
interface PaymentAllocation {
  allocation_id: string;
  payment_id: string;
  bill_id: string;
  allocated_amount: number;
  allocation_date: Date;
}

// 對帳單
interface Statement {
  statement_id: string;
  customer_id: string;
  statement_date: Date;
  
  // 期間
  period_start: Date;
  period_end: Date;
  
  // 餘額資訊
  beginning_balance: number;
  total_charges: number;
  total_payments: number;
  ending_balance: number;
  
  // 明細
  transactions: StatementTransaction[];
  
  // 確認
  confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: Date;
  
  created_at: Date;
}

// 帳齡分析
interface AgingAnalysis {
  analysis_id: string;
  analysis_date: Date;
  customer_id: string;
  
  // 帳齡分布
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  over_90: number;
  
  total_outstanding: number;
  
  // 風險評估
  risk_level: 'low' | 'medium' | 'high';
  credit_limit: number;
  available_credit: number;
}
```

## 數據遷移策略

### 遷移方式
- **策略**: 歷史資料批次遷移 + 新資料雙寫
- **階段**: 
  1. 第一階段：遷移客戶主檔和信用資料（3天）
  2. 第二階段：遷移近6個月帳單和發票（1週）
  3. 第三階段：遷移所有歷史資料（2週）
  4. 第四階段：平行運行和驗證（1週）

### 數據映射
| 舊系統欄位 | 新系統欄位 | 轉換規則 |
|-----------|-----------|----------|
| invoice_id | invoice_no | 保留原始編號 |
| client_id | customer_id | 客戶ID映射 |
| total_price | total_amount | 金額欄位統一 |
| payment_status | status | 狀態值對應 |
| billing_date | invoice_date | 日期格式統一 |

### 相容性處理
- 保留原始單據編號
- 支援新舊報表格式
- 提供歷史查詢介面

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/billing/monthly-close` | 月結作業 | 🟡 開發中 |
| GET | `/api/v1/billing/bills` | 帳單查詢 | 🔴 未開始 |
| POST | `/api/v1/billing/invoices` | 開立發票 | 🔴 未開始 |
| POST | `/api/v1/billing/payments` | 登錄收款 | 🔴 未開始 |
| POST | `/api/v1/billing/allocate` | 付款核銷 | 🔴 未開始 |
| GET | `/api/v1/billing/statements` | 對帳單 | 🔴 未開始 |
| GET | `/api/v1/billing/aging` | 帳齡分析 | 🔴 未開始 |
| POST | `/api/v1/billing/void-invoice` | 作廢發票 | 🔴 未開始 |
| GET | `/api/v1/billing/credit-status` | 信用查詢 | 🔴 未開始 |

### 請求/響應範例
```json
// POST /api/v1/billing/monthly-close
{
  "billing_month": "2025-08",
  "customer_type": "all",
  "auto_calculate_shipping": true,
  "generate_invoice": true
}

// Response
{
  "success": true,
  "data": {
    "total_bills": 150,
    "total_amount": 5680000,
    "invoices_generated": 150,
    "errors": [],
    "summary": {
      "customers_processed": 150,
      "orders_included": 3250,
      "average_bill_amount": 37866
    }
  }
}
```

## 測試需求

### 單元測試
- [ ] 金額計算測試
- [ ] 稅額計算測試
- [ ] 核銷邏輯測試
- [ ] 帳齡計算測試

### 整合測試
- [ ] 完整月結流程測試
- [ ] 發票開立流程測試
- [ ] 收款核銷測試
- [ ] 對帳作業測試

### 驗收測試
- [ ] 場景1：月結到發票完整流程
- [ ] 場景2：部分付款和核銷
- [ ] 場景3：退貨折讓處理
- [ ] 場景4：逾期催收流程

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：月結功能 | Week 1-2 | 月結作業、帳單管理 |
| 階段2：發票功能 | Week 3-4 | 發票開立、電子發票 |
| 階段3：收款功能 | Week 5 | 收款登錄、核銷 |
| 階段4：對帳功能 | Week 6 | 對帳單、差異分析 |
| 階段5：分析報表 | Week 7 | 帳齡分析、信用管理 |
| 階段6：系統整合 | Week 8 | 整合測試、上線 |

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 金額計算錯誤 | 極高 | 低 | 多重驗證、對帳機制 |
| 發票上傳失敗 | 高 | 中 | 重試機制、離線備援 |
| 資料遷移錯誤 | 高 | 低 | 分批遷移、驗證程序 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 帳款錯誤影響關係 | 高 | 低 | 審核機制、即時通知 |
| 現金流預測失準 | 中 | 中 | AI預測、人工審視 |

## 非功能需求

### 性能需求
- 月結處理1000客戶 < 30分鐘
- 發票查詢 < 1秒
- 帳齡報表生成 < 10秒
- 支援10萬筆/月交易量

### 安全需求
- 財務資料加密
- 操作審計追蹤
- 金額修改雙重確認
- 發票防偽機制

### 可用性需求
- 系統可用性 99.95%
- 月結期間不停機
- 資料備份每日執行

## 相關文件
- [舊系統Billing代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Billing)
- [FA模組架構文件](../README.md)
- [財務作業流程](../../docs/finance-process.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0-migration | 2025-08-20 | 初始轉移版本 | System |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-09-01