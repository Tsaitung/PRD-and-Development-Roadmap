# [CRM-PM] 定價管理 PRD 文件

## 模組資訊
- **模組代碼**: CRM-PM
- **模組名稱**: Pricing Management / 定價(標單)管理
- **負責人**: 產品團隊
- **最後更新**: 2025-08-21
- **版本**: v1.0.0

## 命名與狀態
- FR 命名: `FR-CRM-PM-[序號]`
- 狀態語彙：`🔴 未開始`｜`🟡 開發中`｜`✅ 完成`｜`⚪ 規劃中`

## 模組概述
定價管理模組是CRM系統的核心定價引擎，負責管理複雜的B2B定價策略。支援動態基礎定價、客戶分級定價、季節性調整、信用風險溢價等多維度定價機制。提供靈活的價格計算、審核、歷史追蹤功能，確保定價策略的準確性和一致性。

## 業務價值
- 實現精準的差異化定價策略，提升毛利率
- 自動化定價流程，減少人工定價錯誤
- 支援複雜的定價規則組合，滿足多樣化業務需求
- 提供完整的定價歷史追蹤，支援定價決策分析
- 快速響應市場變化，動態調整定價策略

## 功能需求

### FR-CRM-PM-001: 動態基礎定價引擎
**狀態**: 🟡 開發中

**功能描述**:
核心定價引擎，整合成本、市場價格、競爭對手價格等多維度資料，自動計算產品基礎定價。支援即時價格更新和批量價格計算。

**功能需求細節**:
- **條件/觸發**: 當成本更新、市場價格變動或手動觸發重新定價時
- **行為**: 系統根據定價規則引擎計算新的基礎價格並更新價格表
- **資料輸入**: 產品成本、市場價格、競爭對手價格、毛利目標、定價規則參數
- **資料輸出**: 建議基礎價格、價格計算明細、毛利率預估、價格有效期
- **UI反應**: 計算進度顯示、價格變動提醒、計算結果預覽
- **例外處理**: 成本資料缺失警告、異常價格標示、計算失敗重試機制
- **優先級**: P0

**用戶故事**:
作為定價管理員，
我希望系統能自動根據成本和市場狀況計算合理的基礎價格，
以便快速制定有競爭力的產品定價。

**驗收標準**:
```yaml
- 條件: 輸入完整的成本和市場資料
  預期結果: 系統在5秒內計算出基礎價格

- 條件: 成本上漲10%
  預期結果: 系統自動調整價格並維持目標毛利率

- 條件: 缺少必要的定價參數
  預期結果: 系統提示缺失參數並使用預設值計算
```

**UI/UX 規格**:
- **頁面/路徑**: /crm/pricing/engine
- **元件規格**: 價格計算器、參數設定面板、結果展示表格
- **狀態與互動**: 即時計算回饋、拖曳調整參數、價格對比視圖
- **無障礙**: 鍵盤快捷鍵支援、高對比模式

**資料驗證**:
- **成本金額**: 數字/大於0/「成本必須大於0」
- **毛利率**: 百分比/0-100%/「毛利率必須在0-100%之間」
- **有效期**: 日期/未來日期/「有效期必須為未來日期」

**技術需求**:
- **API 端點**: `POST /api/v1/pricing/calculate`
- **請求/回應**: 詳見API規格章節
- **數據模型**: pricing_rules, price_calculations表
- **權限要求**: pricing:calculate, pricing:update
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-CRM-PM-001.test.ts`
- **Code**: `src/modules/crm/pricing/engine/`
- **TOC**: `TOC Modules.md` 第72行

**依賴關係**:
- **依賴模組**: BDM-UNIT (單位換算), IM-IM (產品主檔)
- **依賴功能**: 成本資料API
- **外部服務**: 市場價格資料服務

---

### FR-CRM-PM-002: 客戶分級定價管理
**狀態**: 🟡 開發中

**功能描述**:
根據客戶等級、採購量、合作歷史等因素，為不同客戶群體設定差異化定價。支援自動分級和手動調整。

**功能需求細節**:
- **條件/觸發**: 當客戶等級變更、採購量達標或定期評估時
- **行為**: 系統根據客戶分級規則計算專屬折扣率並更新客戶價格
- **資料輸入**: 客戶等級、近30天採購量、歷史採購金額、信用狀況、特殊折扣
- **資料輸出**: 客戶專屬價格、折扣率、價格有效期、分級理由
- **UI反應**: 分級變動通知、價格對比顯示、審核提醒
- **例外處理**: 分級衝突處理、折扣上限控制、特殊客戶標記
- **優先級**: P0

**用戶故事**:
作為銷售經理，
我希望系統能根據客戶的採購量和合作關係自動給予適當折扣，
以便維護重要客戶關係並提升銷售額。

**驗收標準**:
```yaml
- 條件: 客戶月採購量超過100萬
  預期結果: 系統自動升級為VIP並給予5%額外折扣

- 條件: 新客戶首次下單
  預期結果: 系統套用新客戶優惠價格

- 條件: 客戶信用評級下降
  預期結果: 系統調整付款條件並限制折扣
```

**技術需求**:
- **API 端點**: `POST /api/v1/pricing/customer-tier`
- **請求/回應**: 詳見API規格章節
- **數據模型**: customer_tiers, tier_rules表
- **權限要求**: pricing:tier_manage
- **認證方式**: JWT Token

---

### FR-CRM-PM-003: 季節性與市場風險定價
**狀態**: ⚪ 規劃中

**功能描述**:
根據季節性需求變化、市場供需狀況、天氣等外部因素，動態調整產品價格。包含風險評估和溢價計算。

**功能需求細節**:
- **條件/觸發**: 當進入特定季節、市場價格波動超過閾值或收到天氣預警時
- **行為**: 系統自動計算季節性調整係數和風險溢價，更新產品價格
- **資料輸入**: 歷史銷售數據、季節係數、市場波動率、天氣資料、庫存水平
- **資料輸出**: 調整後價格、溢價金額、風險評分、建議售價範圍
- **UI反應**: 價格趨勢圖表、風險警示、調價建議彈窗
- **例外處理**: 極端天氣應對、價格上限保護、緊急調價審批
- **優先級**: P1

**用戶故事**:
作為定價分析師，
我希望系統能根據季節和市場變化自動調整價格，
以便最大化收益並降低庫存風險。

**驗收標準**:
```yaml
- 條件: 進入農曆新年前一個月
  預期結果: 系統自動提高熱銷品項價格10-15%

- 條件: 颱風警報發布
  預期結果: 系統建議蔬菜類產品提價20%並需主管審核

- 條件: 庫存超過安全水位50%
  預期結果: 系統建議降價促銷並計算最佳折扣
```

---

### FR-CRM-PM-004: 信用與資金風險定價
**狀態**: ⚪ 規劃中

**功能描述**:
評估客戶信用風險和資金成本，計算相應的風險溢價。支援不同付款條件的差異化定價。

**功能需求細節**:
- **條件/觸發**: 當客戶信用評級變更、付款條件改變或利率調整時
- **行為**: 系統計算信用風險成本和資金成本，調整客戶專屬價格
- **資料輸入**: 客戶信用評級、付款天期、違約率、資金成本率、擔保狀況
- **資料輸出**: 風險調整價格、信用額度建議、付款條件選項、風險報告
- **UI反應**: 風險等級標示、價格計算說明、審核流程提示
- **例外處理**: 高風險客戶預警、信用額度超限、現金交易優惠
- **優先級**: P1

**驗收標準**:
```yaml
- 條件: 客戶要求月結60天付款
  預期結果: 系統增加2%資金成本到產品價格

- 條件: 客戶信用評級為高風險
  預期結果: 系統要求預付款或限制信用額度

- 條件: 客戶提供銀行擔保
  預期結果: 系統降低風險溢價並提供優惠價格
```

---

### FR-CRM-PM-005: 價格審核與例外管理
**狀態**: 🟡 開發中

**功能描述**:
管理特殊定價申請、價格例外審核、折扣授權等。提供多層級審核機制和審核軌跡記錄。

**功能需求細節**:
- **條件/觸發**: 當銷售申請特殊價格、折扣超過權限或客戶要求議價時
- **行為**: 系統創建審核流程、通知審核者、記錄審核結果並執行核准的價格
- **資料輸入**: 申請原因、建議價格、客戶資訊、預期訂單量、競爭對手報價
- **資料輸出**: 審核狀態、核准價格、有效期限、審核意見、審核記錄
- **UI反應**: 審核進度顯示、通知提醒、快速審批介面
- **例外處理**: 審核逾時自動escalate、緊急審核通道、批量審核
- **優先級**: P0

**驗收標準**:
```yaml
- 條件: 銷售申請20%特殊折扣
  預期結果: 系統自動送交主管審核並記錄申請理由

- 條件: 審核超過24小時未處理
  預期結果: 系統自動提醒並升級到上一級主管

- 條件: 批量訂單申請優惠
  預期結果: 系統根據訂單量自動建議折扣並快速審批
```

---

### FR-CRM-PM-006: 價格歷史與分析報表
**狀態**: ⚪ 規劃中

**功能描述**:
記錄所有價格變動歷史，提供價格趨勢分析、毛利分析、競爭力分析等報表功能。

**功能需求細節**:
- **條件/觸發**: 當使用者查詢價格歷史、生成定期報表或進行價格分析時
- **行為**: 系統查詢歷史資料、計算統計指標、生成視覺化報表
- **資料輸入**: 查詢期間、產品範圍、客戶群體、分析維度、對比基準
- **資料輸出**: 價格趨勢圖、毛利率變化、市占率分析、定價建議
- **UI反應**: 互動式圖表、下鑽分析、匯出功能
- **例外處理**: 資料量過大分頁處理、長時間查詢優化、快取機制
- **優先級**: P2

**驗收標準**:
```yaml
- 條件: 查詢過去一年價格趨勢
  預期結果: 系統顯示月度價格變化圖表和關鍵事件標記

- 條件: 分析產品毛利率
  預期結果: 系統計算並顯示各產品毛利率排名和改善建議

- 條件: 匯出價格分析報告
  預期結果: 系統生成PDF報告包含所有圖表和數據
```

## 非功能需求

### 性能需求
- 響應時間：價格計算 < 3秒，批量計算 < 30秒
- 並發用戶：支援 200 個並發定價計算
- 數據處理量：支援10萬SKU的價格管理

### 安全需求
- 認證方式：JWT Token + API Key
- 授權模型：基於角色的價格檢視和修改權限
- 數據加密：價格敏感資料AES-256加密
- 審計日誌：所有價格變更需記錄

### 可用性需求
- 系統可用性：99.9%
- 價格快取：Redis快取熱門價格查詢
- 故障恢復：價格資料每小時備份

## 數據模型

### 主要實體
```typescript
interface PricingRule {
  id: string;                      // UUID
  rule_code: string;               // 規則編號
  rule_name: string;               // 規則名稱
  rule_type: PricingRuleType;     // 規則類型
  priority: number;                // 優先順序
  conditions: RuleCondition[];     // 觸發條件
  calculations: Calculation[];     // 計算公式
  effective_date: Date;           // 生效日期
  expiry_date?: Date;             // 失效日期
  status: RuleStatus;             // 狀態
  created_by: string;             // 建立者
  updated_by: string;             // 更新者
  created_at: Date;               // 建立時間
  updated_at: Date;               // 更新時間
}

interface ProductPrice {
  id: string;                      // UUID
  product_id: string;             // 產品ID
  customer_id?: string;           // 客戶ID(客製價格)
  price_type: PriceType;          // 價格類型
  base_price: number;             // 基礎價格
  tier_discount?: number;         // 分級折扣
  seasonal_adjustment?: number;   // 季節調整
  risk_premium?: number;          // 風險溢價
  final_price: number;            // 最終價格
  currency: string;               // 幣別
  unit: string;                   // 單位
  min_quantity?: number;          // 最小訂購量
  valid_from: Date;               // 有效起始
  valid_to?: Date;                // 有效結束
  approval_status: ApprovalStatus; // 審核狀態
  approved_by?: string;           // 審核者
  calculation_details: JsonObject; // 計算明細
  created_at: Date;               // 建立時間
  updated_at: Date;               // 更新時間
}

enum PricingRuleType {
  BASE = 'base',                   // 基礎定價
  TIER = 'tier',                   // 分級定價
  SEASONAL = 'seasonal',           // 季節定價
  RISK = 'risk',                   // 風險定價
  PROMOTION = 'promotion',         // 促銷定價
  CUSTOM = 'custom'                // 客製定價
}

enum PriceType {
  STANDARD = 'standard',           // 標準價
  CONTRACT = 'contract',           // 合約價
  SPECIAL = 'special',             // 特殊價
  PROMOTION = 'promotion'          // 促銷價
}

interface PriceApproval {
  id: string;                      // UUID
  request_id: string;             // 申請單號
  price_id: string;               // 價格ID
  requester_id: string;           // 申請人
  original_price: number;         // 原價
  requested_price: number;        // 申請價格
  discount_rate: number;          // 折扣率
  reason: string;                 // 申請原因
  customer_info: JsonObject;      // 客戶資訊
  approval_level: number;         // 審核層級
  current_approver?: string;      // 當前審核者
  approval_status: ApprovalStatus; // 審核狀態
  approval_history: ApprovalLog[]; // 審核歷史
  created_at: Date;               // 申請時間
  updated_at: Date;               // 更新時間
}
```

### 資料庫結構
```sql
-- 定價規則表
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(20) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL,
  calculations JSONB NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_rule_type (rule_type),
  INDEX idx_status (status),
  INDEX idx_effective_date (effective_date)
);

-- 產品價格表
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_id UUID REFERENCES customers(id),
  price_type VARCHAR(20) NOT NULL,
  base_price DECIMAL(15,2) NOT NULL,
  tier_discount DECIMAL(5,2),
  seasonal_adjustment DECIMAL(5,2),
  risk_premium DECIMAL(5,2),
  final_price DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
  unit VARCHAR(20) NOT NULL,
  min_quantity DECIMAL(10,2),
  valid_from DATE NOT NULL,
  valid_to DATE,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by UUID,
  calculation_details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_product_customer (product_id, customer_id),
  INDEX idx_valid_dates (valid_from, valid_to),
  INDEX idx_price_type (price_type),
  INDEX idx_approval_status (approval_status)
);

-- 價格審核表
CREATE TABLE price_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) UNIQUE NOT NULL,
  price_id UUID REFERENCES product_prices(id),
  requester_id UUID NOT NULL,
  original_price DECIMAL(15,2) NOT NULL,
  requested_price DECIMAL(15,2) NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  customer_info JSONB,
  approval_level INTEGER NOT NULL DEFAULT 1,
  current_approver UUID,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approval_history JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_request_id (request_id),
  INDEX idx_requester (requester_id),
  INDEX idx_status (approval_status),
  INDEX idx_created_at (created_at)
);

-- 價格歷史表
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  customer_id UUID,
  old_price DECIMAL(15,2),
  new_price DECIMAL(15,2) NOT NULL,
  change_reason VARCHAR(100),
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_product_id (product_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_changed_at (changed_at)
);
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/pricing/calculate` | 計算產品價格 | 🟡 開發中 |
| GET | `/api/v1/pricing/products/{id}` | 獲取產品價格 | 🟡 開發中 |
| POST | `/api/v1/pricing/batch-calculate` | 批量計算價格 | ⚪ 規劃中 |
| PUT | `/api/v1/pricing/products/{id}` | 更新產品價格 | 🟡 開發中 |
| POST | `/api/v1/pricing/customer-tier` | 設定客戶分級 | 🟡 開發中 |
| GET | `/api/v1/pricing/customer/{id}/prices` | 獲取客戶價格 | 🟡 開發中 |
| POST | `/api/v1/pricing/approval` | 提交價格審核 | 🟡 開發中 |
| PUT | `/api/v1/pricing/approval/{id}` | 審核價格申請 | 🟡 開發中 |
| GET | `/api/v1/pricing/history` | 查詢價格歷史 | ⚪ 規劃中 |
| GET | `/api/v1/pricing/reports` | 獲取分析報表 | ⚪ 規劃中 |

### 請求/響應範例

#### 計算產品價格
```json
// 請求
POST /api/v1/pricing/calculate
{
  "product_id": "PROD-001",
  "customer_id": "CUST-001",
  "quantity": 1000,
  "delivery_date": "2025-09-01",
  "payment_terms": "net_30",
  "include_risk_premium": true,
  "include_seasonal": true
}

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "product_id": "PROD-001",
    "customer_id": "CUST-001",
    "base_price": 100.00,
    "calculations": {
      "cost": 60.00,
      "markup": 40.00,
      "tier_discount": -5.00,
      "seasonal_adjustment": 10.00,
      "risk_premium": 2.00,
      "final_price": 107.00
    },
    "price_breakdown": {
      "base": 100.00,
      "discount": -5.00,
      "adjustments": 12.00,
      "total": 107.00
    },
    "margin": {
      "amount": 47.00,
      "percentage": 43.93
    },
    "valid_until": "2025-09-30",
    "requires_approval": false
  }
}

// 錯誤響應 (400 Bad Request)
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "缺少成本資料無法計算價格",
    "field": "cost_data"
  }
}
```

#### 提交價格審核
```json
// 請求
POST /api/v1/pricing/approval
{
  "price_id": "PRICE-001",
  "requested_price": 95.00,
  "reason": "大量採購客戶要求優惠",
  "customer_info": {
    "name": "測試客戶",
    "potential_volume": 10000,
    "competitor_price": 93.00
  }
}

// 成功響應 (201 Created)
{
  "success": true,
  "data": {
    "approval_id": "APPR-2025-001",
    "status": "pending",
    "assigned_to": "MANAGER-001",
    "expected_response": "2025-08-22T10:00:00Z"
  }
}
```

## UI/UX 設計

### 頁面流程
1. 價格總覽頁 → 產品定價頁 → 價格計算器
2. 客戶價格頁 → 分級設定 → 價格審核
3. 報表頁面 → 價格分析 → 匯出報告

### 主要畫面
- **價格計算器**: 參數輸入面板、即時計算結果、價格對比圖表
  - 主要元素：滑桿控制項、計算公式展示、敏感度分析
  - 互動行為：拖曳調整、即時更新、情境模擬

- **客戶定價頁**: 客戶列表、價格矩陣、批量設定工具
  - 主要元素：階層篩選器、價格編輯表格、審核狀態標籤
  - 互動行為：批量選擇、快速編輯、拖放排序

- **審核管理頁**: 待審核列表、審核詳情、歷史記錄
  - 主要元素：審核佇列、比較視圖、意見輸入
  - 互動行為：快速審批、批量處理、委派功能

## 測試計畫

### 單元測試
- [x] 測試價格計算邏輯
- [x] 測試分級規則判斷
- [x] 測試折扣限制驗證
- [x] 測試審核流程邏輯
- [x] 測試歷史記錄功能

### 整合測試
- [x] 測試完整定價流程
- [x] 測試多規則組合計算
- [x] 測試審核工作流程
- [x] 測試價格同步機制

### 驗收測試
- [ ] 場景1：新產品定價設定流程
- [ ] 場景2：大客戶議價審核流程
- [ ] 場景3：季節性價格自動調整
- [ ] 場景4：批量價格更新效能測試

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎引擎 | Day 1-3 | 定價引擎、計算邏輯 |
| 階段2：客戶分級 | Day 4-5 | 分級系統、折扣管理 |
| 階段3：審核流程 | Day 6-7 | 審核工作流、權限控制 |
| 階段4：分析報表 | Day 8-9 | 報表功能、資料分析 |
| 階段5：測試上線 | Day 10 | 整合測試、部署上線 |

### 里程碑
- [x] M1：定價引擎設計完成 - 2025-08-21
- [ ] M2：核心功能開發完成 - 2025-08-25
- [ ] M3：整合測試完成 - 2025-08-28
- [ ] M4：正式上線 - 2025-08-30

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 複雜定價規則效能問題 | 高 | 中 | 實施規則快取、非同步計算 |
| 價格資料不一致 | 高 | 低 | 實施事務控制、資料驗證 |
| 審核流程延遲 | 中 | 中 | 設定逾時機制、自動提醒 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 定價策略洩露 | 高 | 低 | 加強權限控制、資料加密 |
| 價格計算錯誤 | 高 | 低 | 多重驗證、人工複核機制 |

## 相關文件
- [系統架構文件](../../docs/architecture.md)
- [定價策略指南](../../docs/pricing-strategy.md)
- [API規格文件](../../docs/api/crm-pm-api.md)
- [測試計畫](./tests/test-plan.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-21 | 初始版本，建立完整PRD | 系統 |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-08-28