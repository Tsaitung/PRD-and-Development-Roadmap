# 供應商關係管理 PRD 文件

## 模組資訊
- **模組代碼**: 09.1-PM-SRM
- **模組名稱**: Supplier Relationship Management (供應商關係管理)
- **負責人**: 菜蟲農食 ERP 團隊
- **最後更新**: 2025-08-22
- **版本**: v1.0.0

## 模組概述
供應商關係管理模組是採購管理系統的核心，負責管理供應商主檔、評估供應商績效、處理損耗與退貨、管理供應商帳務等。支援農產品供應鏈的特殊需求，包括產地管理、品質追溯、季節性供貨等。

## 業務價值
- 優化供應商選擇，降低採購成本15%
- 提升供應品質，減少退貨率40%
- 強化供應鏈透明度，確保食品安全
- 數據化供應商管理，支援策略決策

## 功能需求

### FR-PM-SRM-001: 供應商主檔管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
建立和維護供應商基本資料，包括公司資訊、聯絡人、供應品項、認證資料等，支援多層級供應商分類。

**功能需求細節**:
- **條件/觸發**: 當新增供應商或更新供應商資料時
- **行為**: 系統驗證資料完整性、檢查重複、更新供應商資料庫
- **資料輸入**: 公司名稱、統編、地址、聯絡人、銀行帳戶、供應品項、認證文件
- **資料輸出**: 供應商清單、供應商詳情、認證狀態、合作歷史
- **UI反應**: 表單驗證、重複檢查提示、文件上傳進度、儲存確認
- **例外處理**: 統編重複警告、必填欄位提醒、文件格式錯誤、認證過期提醒

**用戶故事**:
作為採購人員，
我希望完整記錄供應商資訊，
以便快速查詢和評估供應商。

**驗收標準**:
```yaml
- 條件: 輸入新供應商統編
  預期結果: 自動帶入公司基本資料並檢查重複
  
- 條件: 上傳認證文件
  預期結果: 記錄認證類型和有效期限並設定到期提醒
  
- 條件: 設定供應品項
  預期結果: 建立供應商與品項的關聯並顯示在品項主檔
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/suppliers`
  - `POST /api/v1/suppliers`
  - `PUT /api/v1/suppliers/{id}`
  - `DELETE /api/v1/suppliers/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Supplier, SupplierContact, SupplierCertification
- **權限要求**: supplier.view, supplier.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-PM-SRM-001.test.ts`
  - 整合測試: `tests/integration/FR-PM-SRM-001.integration.test.ts`
  - E2E測試: `tests/e2e/FR-PM-SRM-001.e2e.test.ts`
- **Code**: `src/modules/pm/supplier/master/`
- **TOC**: `TOC Modules.md` 第213行

**依賴關係**:
- **依賴模組**: IM (品項管理), BDM (基礎資料)
- **依賴功能**: FR-IM-IM-001, FR-BDM-UNIT-001
- **外部服務**: 統編驗證API

---

### FR-PM-SRM-002: 供應商績效評估
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
定期評估供應商績效，包括準時交貨率、品質合格率、價格競爭力、服務滿意度等指標，支援自動評分和排名。

**功能需求細節**:
- **條件/觸發**: 當月底執行評估或收貨完成時更新分數
- **行為**: 計算各項KPI、產生績效報告、更新供應商等級
- **資料輸入**: 評估期間、權重設定、評分標準、手動調整分數
- **資料輸出**: 績效分數、排名報表、趨勢圖表、改善建議
- **UI反應**: 儀表板顯示、紅黃綠燈號、排名變化動畫
- **例外處理**: 資料不足提示、異常分數警告、評估失敗重試

**用戶故事**:
作為採購主管，
我希望客觀評估供應商表現，
以便優化供應商組合。

**驗收標準**:
```yaml
- 條件: 月底自動評估
  預期結果: 計算所有供應商分數並生成排名報告
  
- 條件: 交貨延遲記錄
  預期結果: 即時更新準時交貨率並影響總分
  
- 條件: 績效低於60分
  預期結果: 標記為高風險供應商並通知相關人員
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/suppliers/{id}/evaluate`
  - `GET /api/v1/suppliers/{id}/performance`
  - `GET /api/v1/suppliers/rankings`
- **請求/回應**: 詳見API規格章節
- **數據模型**: PerformanceScore, EvaluationCriteria, SupplierRanking
- **權限要求**: supplier.evaluate
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-PM-SRM-002.test.ts`
  - 整合測試: `tests/integration/FR-PM-SRM-002.integration.test.ts`
  - E2E測試: `tests/e2e/FR-PM-SRM-002.e2e.test.ts`
- **Code**: `src/modules/pm/supplier/performance/`
- **TOC**: `TOC Modules.md` 第217行

**依賴關係**:
- **依賴模組**: PM-RIS (驗收狀態), LM (配送記錄)
- **依賴功能**: FR-PM-RIS-001
- **外部服務**: 排程服務

---

### FR-PM-SRM-003: 損耗與退貨管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
處理供應商相關的損耗申報和退貨流程，包括品質問題追蹤、責任歸屬、賠償計算等。

**功能需求細節**:
- **條件/觸發**: 當驗收發現品質問題或申請退貨時
- **行為**: 創建退貨單、計算損耗金額、更新庫存、通知供應商
- **資料輸入**: 退貨原因、數量、照片、檢驗報告、責任判定
- **資料輸出**: 退貨單據、損耗統計、賠償金額、處理進度
- **UI反應**: 拍照上傳、流程圖顯示、金額自動計算
- **例外處理**: 超過退貨期限警告、證據不足提示、爭議處理流程

**用戶故事**:
作為品管人員，
我希望快速處理品質問題，
以減少損失並改善供應品質。

**驗收標準**:
```yaml
- 條件: 驗收不合格
  預期結果: 自動創建退貨單並拍照存證
  
- 條件: 確認供應商責任
  預期結果: 計算賠償金額並從應付款扣除
  
- 條件: 退貨完成
  預期結果: 更新庫存和供應商績效分數
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/suppliers/{id}/returns`
  - `GET /api/v1/suppliers/{id}/losses`
  - `PUT /api/v1/returns/{id}/process`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ReturnOrder, LossRecord, CompensationCalculation
- **權限要求**: return.create, return.process
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-PM-SRM-003.test.ts`
  - 整合測試: `tests/integration/FR-PM-SRM-003.integration.test.ts`
  - E2E測試: `tests/e2e/FR-PM-SRM-003.e2e.test.ts`
- **Code**: `src/modules/pm/supplier/returns/`
- **TOC**: `TOC Modules.md` 第215行

**依賴關係**:
- **依賴模組**: WMS (庫存調整), FA-AP (應付帳款)
- **依賴功能**: FR-WMS-IAT-001, FR-FA-AP-001
- **外部服務**: 圖片存儲服務

---

### FR-PM-SRM-004: 供應商帳務管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
管理與供應商的財務往來，包括應付帳款、付款記錄、對帳單、帳齡分析等。

**功能需求細節**:
- **條件/觸發**: 當收貨完成或到達付款週期時
- **行為**: 生成應付帳款、產生對帳單、記錄付款、更新餘額
- **資料輸入**: 採購單、驗收單、付款條件、銀行帳號
- **資料輸出**: 應付明細、對帳單、付款通知、帳齡報表
- **UI反應**: 金額核對提示、付款狀態更新、對帳差異標記
- **例外處理**: 金額不符警告、超期未付提醒、重複付款檢查

**用戶故事**:
作為財務人員，
我希望清楚掌握供應商帳務，
以確保付款準確及時。

**驗收標準**:
```yaml
- 條件: 月底對帳
  預期結果: 自動生成對帳單並發送給供應商
  
- 條件: 付款到期
  預期結果: 提前3天提醒並顯示在待辦事項
  
- 條件: 完成付款
  預期結果: 更新付款狀態並通知供應商
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/suppliers/{id}/accounts`
  - `POST /api/v1/suppliers/{id}/payments`
  - `GET /api/v1/suppliers/{id}/statements`
- **請求/回應**: 詳見API規格章節
- **數據模型**: SupplierAccount, PaymentRecord, AccountStatement
- **權限要求**: supplier.account.view, supplier.payment.create
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-PM-SRM-004.test.ts`
  - 整合測試: `tests/integration/FR-PM-SRM-004.integration.test.ts`
  - E2E測試: `tests/e2e/FR-PM-SRM-004.e2e.test.ts`
- **Code**: `src/modules/pm/supplier/accounting/`
- **TOC**: `TOC Modules.md` 第216行

**依賴關係**:
- **依賴模組**: FA-AP (應付帳款), FA-PMAR (付款管理)
- **依賴功能**: FR-FA-AP-001, FR-FA-PMAR-001
- **外部服務**: 銀行API

---

### FR-PM-SRM-005: 供應商合約管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
管理與供應商的合約文件，包括採購合約、價格協議、品質標準、到期提醒等。

**功能需求細節**:
- **條件/觸發**: 當簽訂新合約或合約即將到期時
- **行為**: 儲存合約文件、設定提醒、追蹤執行狀況
- **資料輸入**: 合約類型、有效期限、價格條款、品質要求、附件
- **資料輸出**: 合約清單、到期提醒、執行報告、續約建議
- **UI反應**: 時間軸顯示、到期倒數、文件預覽、簽核流程
- **例外處理**: 合約衝突檢查、過期自動停用、續約提醒

**用戶故事**:
作為採購經理，
我希望有效管理供應商合約，
以確保採購活動合規。

**驗收標準**:
```yaml
- 條件: 上傳新合約
  預期結果: 解析關鍵條款並設定自動提醒
  
- 條件: 合約到期前30天
  預期結果: 發送續約提醒並提供歷史採購分析
  
- 條件: 價格異動
  預期結果: 自動更新相關品項的採購價格
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/suppliers/{id}/contracts`
  - `GET /api/v1/suppliers/{id}/contracts`
  - `PUT /api/v1/contracts/{id}/renew`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Contract, ContractTerm, ContractReminder
- **權限要求**: contract.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-PM-SRM-005.test.ts`
  - 整合測試: `tests/integration/FR-PM-SRM-005.integration.test.ts`
  - E2E測試: `tests/e2e/FR-PM-SRM-005.e2e.test.ts`
- **Code**: `src/modules/pm/supplier/contracts/`
- **TOC**: `TOC Modules.md` 第218行

**依賴關係**:
- **依賴模組**: SA-NWS (通知設定), CRM-PM (價格管理)
- **依賴功能**: FR-SA-NWS-001, FR-CRM-PM-001
- **外部服務**: 文件存儲服務

## 非功能需求

### 性能需求
- 供應商查詢響應：< 1秒
- 績效評估計算：< 5秒
- 批量匯入處理：< 30秒/千筆
- 並發用戶支援：200+

### 安全需求
- 供應商資料加密
- 合約文件權限控制
- 財務資料審計日誌
- 敏感資訊脫敏顯示

### 可用性需求
- 系統可用性：99.9%
- 支援多語言（中英文）
- 響應式網頁設計
- 支援批量操作

## 數據模型

### 主要實體
```typescript
interface Supplier {
  id: string;
  code: string;
  name: string;
  taxId: string;
  type: 'manufacturer' | 'distributor' | 'farmer' | 'importer';
  status: 'active' | 'inactive' | 'blacklisted';
  rating: number;
  contacts: SupplierContact[];
  certifications: SupplierCertification[];
  bankAccounts: BankAccount[];
  suppliedItems: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface PerformanceScore {
  id: string;
  supplierId: string;
  period: string;
  onTimeDeliveryRate: number;
  qualityPassRate: number;
  priceCompetitiveness: number;
  serviceScore: number;
  overallScore: number;
  rank: number;
  evaluatedAt: Date;
}

interface ReturnOrder {
  id: string;
  returnNo: string;
  supplierId: string;
  purchaseOrderId: string;
  reason: 'quality' | 'damage' | 'shortage' | 'wrong_item';
  items: ReturnItem[];
  totalAmount: number;
  compensationAmount: number;
  status: 'pending' | 'approved' | 'completed' | 'disputed';
  evidence: string[];
  createdAt: Date;
}

interface Contract {
  id: string;
  contractNo: string;
  supplierId: string;
  type: 'purchase' | 'price' | 'quality' | 'service';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  terms: ContractTerm[];
  attachments: string[];
  status: 'draft' | 'active' | 'expired' | 'terminated';
}
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/suppliers` | 獲取供應商列表 | 🔴 未開始 |
| POST | `/api/v1/suppliers` | 創建供應商 | 🔴 未開始 |
| GET | `/api/v1/suppliers/{id}/performance` | 獲取績效數據 | 🔴 未開始 |
| POST | `/api/v1/suppliers/{id}/returns` | 創建退貨單 | 🔴 未開始 |
| GET | `/api/v1/suppliers/{id}/accounts` | 獲取帳務資訊 | 🔴 未開始 |
| POST | `/api/v1/suppliers/{id}/contracts` | 創建合約 | 🔴 未開始 |
| GET | `/api/v1/suppliers/rankings` | 獲取供應商排名 | 🔴 未開始 |

### 請求/回應範例

#### 創建供應商
```json
// 請求
POST /api/v1/suppliers
{
  "name": "優質農產有限公司",
  "taxId": "12345678",
  "type": "manufacturer",
  "contacts": [
    {
      "name": "王大明",
      "title": "業務經理",
      "phone": "0912-345678",
      "email": "wang@example.com",
      "isPrimary": true
    }
  ],
  "suppliedItems": ["ITEM001", "ITEM002"]
}

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "id": "SUP20250822001",
    "code": "SUP001",
    "name": "優質農產有限公司",
    "status": "active",
    "rating": 0,
    "createdAt": "2025-08-22T10:30:00Z"
  }
}
```

### 資料庫結構
```sql
-- 供應商主檔
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  tax_id VARCHAR(20) UNIQUE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  rating DECIMAL(3,2) DEFAULT 0,
  address TEXT,
  website VARCHAR(200),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_code (code),
  INDEX idx_tax_id (tax_id),
  INDEX idx_status (status),
  INDEX idx_rating (rating DESC)
);

-- 供應商聯絡人
CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_supplier (supplier_id)
);

-- 績效評分
CREATE TABLE performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  period VARCHAR(20) NOT NULL,
  on_time_delivery_rate DECIMAL(5,2),
  quality_pass_rate DECIMAL(5,2),
  price_competitiveness DECIMAL(5,2),
  service_score DECIMAL(5,2),
  overall_score DECIMAL(5,2) NOT NULL,
  rank INTEGER,
  evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(supplier_id, period),
  INDEX idx_period (period),
  INDEX idx_score (overall_score DESC)
);

-- 退貨單
CREATE TABLE return_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_no VARCHAR(30) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  reason VARCHAR(20) NOT NULL,
  total_amount DECIMAL(15,2),
  compensation_amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'pending',
  evidence JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_return_no (return_no),
  INDEX idx_supplier (supplier_id),
  INDEX idx_status (status)
);

-- 合約管理
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_no VARCHAR(30) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  type VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  terms JSONB,
  attachments JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_contract_no (contract_no),
  INDEX idx_supplier (supplier_id),
  INDEX idx_end_date (end_date),
  INDEX idx_status (status)
);
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎架構 | Week 1 | 資料模型、API框架 |
| 階段2：主檔管理 | Week 2 | 供應商CRUD、認證管理 |
| 階段3：績效評估 | Week 3 | 評分系統、排名機制 |
| 階段4：退貨處理 | Week 4 | 退貨流程、賠償計算 |
| 階段5：帳務整合 | Week 5 | 對帳功能、付款追蹤 |
| 階段6：測試上線 | Week 6 | 整合測試、用戶培訓 |

### 里程碑
- [ ] M1：供應商主檔功能完成 - 2025-09-05
- [ ] M2：績效評估系統上線 - 2025-09-12
- [ ] M3：退貨管理流程完成 - 2025-09-19
- [ ] M4：財務整合完成 - 2025-09-26
- [ ] M5：全模組測試通過 - 2025-10-03

## 風險評估
| 風險項目 | 可能性 | 影響 | 緩解措施 |
|----------|--------|------|----------|
| 資料遷移複雜 | 高 | 高 | 分批遷移、資料驗證 |
| 績效指標爭議 | 中 | 高 | 充分溝通、試行期 |
| 系統整合困難 | 中 | 中 | 標準API、測試環境 |
| 用戶接受度低 | 低 | 中 | 培訓計畫、漸進導入 |

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-22 | 初始版本創建 | ERP Team |

---

**文件狀態**: 草稿
**下次審查日期**: 2025-08-29