# [CRM-CM] 客戶主檔管理 PRD 文件

## 模組資訊
- **模組代碼**: CRM-CM
- **模組名稱**: Customer Master / 客戶主檔管理
- **負責人**: 產品團隊
- **最後更新**: 2025-08-21
- **版本**: v1.0.0

## 命名與狀態
- FR 命名: `FR-CRM-CM-[序號]`
- 狀態語彙：`🔴 未開始`｜`🟡 開發中`｜`✅ 完成`｜`⚪ 規劃中`

## 模組概述
客戶主檔管理模組是CRM系統的核心基礎模組，負責管理所有客戶的基本資料、階層關係、聯絡資訊等。支援企業級客戶的複雜組織結構（總公司-分公司-門市），提供完整的客戶資料維護、查詢、匯入匯出功能。

## 業務價值
- 建立統一的客戶資料管理平台，確保資料一致性
- 支援複雜的企業客戶階層結構，滿足B2B業務需求
- 提供快速查詢和批量操作，提升營運效率
- 完整的資料稽核軌跡，確保合規性

## 功能需求

### FR-CRM-CM-001: 客戶基本資料管理
**狀態**: 🟡 開發中

**功能描述**:
管理客戶的基本資料，包括客戶編號、名稱、類型、稅號、聯絡資訊等核心欄位。支援新增、修改、查詢、停用等基本操作。

**功能需求細節**:
- **條件/觸發**: 當使用者在客戶管理介面點擊「新增客戶」或「編輯客戶」時
- **行為**: 系統顯示客戶資料表單，驗證輸入資料，並儲存至資料庫
- **資料輸入**: 客戶名稱(必填)、統一編號(選填)、客戶類型、聯絡電話、地址、Email、營業類別
- **資料輸出**: 客戶編號(系統自動產生)、建立時間、更新時間、資料完整性狀態
- **UI反應**: 表單驗證即時回饋、儲存成功提示、錯誤訊息顯示
- **例外處理**: 重複統編檢查、必填欄位驗證、格式驗證錯誤提示
- **優先級**: P0

**用戶故事**:
作為業務人員，
我希望能快速新增和維護客戶基本資料，
以便建立完整的客戶檔案進行後續業務活動。

**驗收標準**:
```yaml
- 條件: 輸入完整有效的客戶資料
  預期結果: 系統成功儲存並產生唯一客戶編號
  
- 條件: 輸入重複的統一編號
  預期結果: 系統顯示「統一編號已存在」錯誤訊息
  
- 條件: 必填欄位留空
  預期結果: 系統標示必填欄位並阻止儲存
```

**UI/UX 規格**:
- **頁面/路徑**: /crm/customers/new, /crm/customers/{id}/edit
- **元件規格**: 表單元件、輸入驗證元件、地址選擇器
- **狀態與互動**: 即時驗證、自動儲存草稿、離開頁面提醒
- **無障礙**: ARIA標籤、鍵盤導覽支援、螢幕閱讀器相容

**資料驗證**:
- **客戶名稱**: 字串/1-100字元/「請輸入客戶名稱」
- **統一編號**: 字串/8位數字/「統一編號格式錯誤」
- **電話號碼**: 字串/台灣電話格式/「電話號碼格式錯誤」
- **Email**: 字串/Email格式/「Email格式錯誤」

**技術需求**:
- **API 端點**: `POST /api/v1/customers`, `PUT /api/v1/customers/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: customers表
- **權限要求**: customer:create, customer:update
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-CRM-CM-001.test.ts`
- **Code**: `src/modules/crm/customer/`
- **TOC**: `TOC Modules.md` 第69行

**依賴關係**:
- **依賴模組**: SA-UPM (使用者權限管理)
- **依賴功能**: 無
- **外部服務**: 地址API服務

---

### FR-CRM-CM-002: 客戶階層關係管理
**狀態**: 🟡 開發中

**功能描述**:
管理企業客戶的組織階層關係，支援總公司-分公司-門市三層結構。提供階層關係的建立、修改、查詢功能。

**功能需求細節**:
- **條件/觸發**: 當使用者選擇「設定上層組織」或「新增下層組織」時
- **行為**: 系統建立或更新客戶間的階層關係，並維護關係樹狀結構
- **資料輸入**: 上層組織ID、關係類型(總公司/分公司/門市)、生效日期
- **資料輸出**: 完整組織樹、階層路徑、關係數量統計
- **UI反應**: 樹狀結構視覺化顯示、拖放操作回饋、關係線連接
- **例外處理**: 循環關係檢測、超過三層限制警告、孤立節點提示
- **優先級**: P0

**用戶故事**:
作為客戶管理人員，
我希望能設定和查看客戶的組織階層關係，
以便了解客戶的完整組織結構和進行統一管理。

**驗收標準**:
```yaml
- 條件: 設定有效的上下層關係
  預期結果: 系統成功建立關係並更新組織樹
  
- 條件: 嘗試建立循環關係(A->B->C->A)
  預期結果: 系統拒絕並顯示「不允許循環關係」錯誤
  
- 條件: 嘗試建立超過三層的關係
  預期結果: 系統提示「已達最大層級限制」警告
```

**技術需求**:
- **API 端點**: `POST /api/v1/customers/{id}/relationships`
- **請求/回應**: 詳見API規格章節
- **數據模型**: customer_relationships表
- **權限要求**: customer:manage_hierarchy
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-CRM-CM-002.test.ts`
- **Code**: `src/modules/crm/customer/hierarchy/`
- **TOC**: `TOC Modules.md` 第69行

---

### FR-CRM-CM-003: 客戶資料查詢與篩選
**狀態**: 🟡 開發中

**功能描述**:
提供強大的客戶資料查詢功能，支援多條件組合查詢、模糊搜尋、進階篩選器。

**功能需求細節**:
- **條件/觸發**: 當使用者在客戶列表頁面輸入查詢條件或使用篩選器時
- **行為**: 系統根據條件查詢資料庫並返回符合的客戶列表
- **資料輸入**: 關鍵字、客戶類型、狀態、建立日期範圍、地區、營業額範圍
- **資料輸出**: 客戶列表(分頁)、總筆數、查詢執行時間
- **UI反應**: 即時搜尋建議、載入動畫、無結果提示
- **例外處理**: 查詢逾時處理、無權限資料過濾、SQL注入防護
- **優先級**: P0

**用戶故事**:
作為業務人員，
我希望能快速查詢和篩選客戶資料，
以便找到目標客戶進行業務拜訪或聯繫。

**驗收標準**:
```yaml
- 條件: 輸入客戶名稱關鍵字
  預期結果: 系統返回名稱包含關鍵字的所有客戶
  
- 條件: 使用多個篩選條件組合查詢
  預期結果: 系統返回同時符合所有條件的客戶
  
- 條件: 查詢結果超過1000筆
  預期結果: 系統自動分頁並顯示總筆數
```

**技術需求**:
- **API 端點**: `GET /api/v1/customers/search`
- **請求/回應**: 詳見API規格章節
- **數據模型**: customers表、索引優化
- **權限要求**: customer:read
- **認證方式**: JWT Token

---

### FR-CRM-CM-004: 客戶資料匯入匯出
**狀態**: ⚪ 規劃中

**功能描述**:
支援批量匯入客戶資料(Excel/CSV)和匯出功能，包含資料驗證、錯誤處理、匯入記錄。

**功能需求細節**:
- **條件/觸發**: 當使用者選擇匯入檔案或點擊匯出按鈕時
- **行為**: 系統解析檔案、驗證資料、執行匯入或產生匯出檔案
- **資料輸入**: Excel/CSV檔案、欄位對應設定、匯出條件
- **資料輸出**: 匯入結果報告、錯誤清單、匯出檔案下載連結
- **UI反應**: 上傳進度條、驗證結果預覽、錯誤標示
- **例外處理**: 檔案格式錯誤、資料重複、必填欄位缺失
- **優先級**: P1

**驗收標準**:
```yaml
- 條件: 上傳格式正確的Excel檔案
  預期結果: 系統成功匯入所有有效資料並產生報告
  
- 條件: 檔案包含重複或錯誤資料
  預期結果: 系統標示錯誤資料並提供修正建議
  
- 條件: 匯出10000筆資料
  預期結果: 系統在30秒內產生下載檔案
```

---

### FR-CRM-CM-005: 客戶資料稽核軌跡
**狀態**: ⚪ 規劃中

**功能描述**:
記錄所有客戶資料的變更歷史，提供完整的稽核軌跡查詢功能。

**功能需求細節**:
- **條件/觸發**: 當任何客戶資料被新增、修改、刪除時
- **行為**: 系統自動記錄變更內容、時間、操作者等稽核資訊
- **資料輸入**: 無(系統自動記錄)
- **資料輸出**: 變更歷史清單、變更對照表、操作者資訊
- **UI反應**: 時間軸顯示、差異對比視圖
- **例外處理**: 稽核資料防竄改、長期保存策略
- **優先級**: P2

**驗收標準**:
```yaml
- 條件: 修改客戶基本資料
  預期結果: 系統記錄修改前後的值和操作資訊
  
- 條件: 查詢特定期間的變更記錄
  預期結果: 系統顯示該期間所有變更的詳細資訊
  
- 條件: 嘗試修改稽核記錄
  預期結果: 系統拒絕操作並記錄違規嘗試
```

## 非功能需求

### 性能需求
- 響應時間：一般查詢 < 2秒，複雜查詢 < 5秒
- 並發用戶：支援 500 個並發用戶
- 數據處理量：支援100萬筆客戶資料

### 安全需求
- 認證方式：JWT Token (有效期24小時)
- 授權模型：RBAC角色權限控制
- 數據加密：敏感資料AES-256加密
- 稽核日誌：所有操作需記錄

### 可用性需求
- 系統可用性：99.9% (每月停機時間 < 45分鐘)
- 災難恢復：RPO < 1小時，RTO < 4小時
- 資料備份：每日增量備份，每週完整備份

## 數據模型

### 主要實體
```typescript
interface Customer {
  id: string;                    // UUID
  customer_code: string;         // 客戶編號
  customer_name: string;         // 客戶名稱
  customer_type: CustomerType;   // 客戶類型
  tax_id?: string;              // 統一編號
  status: CustomerStatus;        // 狀態
  contact_person?: string;       // 聯絡人
  contact_phone?: string;        // 聯絡電話
  contact_email?: string;        // Email
  address?: Address;            // 地址
  business_category?: string;    // 營業類別
  credit_limit?: number;        // 信用額度
  payment_terms?: string;       // 付款條件
  parent_id?: string;           // 上層組織ID
  hierarchy_level: number;      // 階層等級(1-3)
  metadata?: JsonObject;        // 擴充欄位
  created_by: string;           // 建立者
  updated_by: string;           // 更新者
  created_at: Date;             // 建立時間
  updated_at: Date;             // 更新時間
  deleted_at?: Date;            // 軟刪除時間
}

enum CustomerType {
  ENTERPRISE = 'enterprise',     // 企業客戶
  COMPANY = 'company',          // 一般公司
  STORE = 'store',              // 門市
  INDIVIDUAL = 'individual'     // 個人客戶
}

enum CustomerStatus {
  ACTIVE = 'active',            // 啟用
  INACTIVE = 'inactive',        // 停用
  SUSPENDED = 'suspended',      // 暫停
  BLACKLISTED = 'blacklisted'   // 黑名單
}

interface Address {
  country: string;              // 國家
  city: string;                 // 城市
  district?: string;            // 區域
  postal_code?: string;         // 郵遞區號
  street: string;               // 街道地址
  coordinates?: {               // GPS座標
    latitude: number;
    longitude: number;
  };
}
```

### 資料庫結構
```sql
-- 客戶主檔表
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_type VARCHAR(20) NOT NULL,
  tax_id VARCHAR(20) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  contact_person VARCHAR(50),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  address JSONB,
  business_category VARCHAR(50),
  credit_limit DECIMAL(15,2),
  payment_terms VARCHAR(50),
  parent_id UUID REFERENCES customers(id),
  hierarchy_level INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- 索引
  INDEX idx_customer_code (customer_code),
  INDEX idx_customer_name (customer_name),
  INDEX idx_tax_id (tax_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 客戶關係表
CREATE TABLE customer_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_customer_id UUID NOT NULL REFERENCES customers(id),
  child_customer_id UUID NOT NULL REFERENCES customers(id),
  relationship_type VARCHAR(20) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(parent_customer_id, child_customer_id),
  INDEX idx_parent (parent_customer_id),
  INDEX idx_child (child_customer_id)
);

-- 客戶稽核軌跡表
CREATE TABLE customer_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_changed_at (changed_at),
  INDEX idx_changed_by (changed_by)
);
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/customers` | 獲取客戶列表 | 🟡 開發中 |
| GET | `/api/v1/customers/{id}` | 獲取客戶詳情 | 🟡 開發中 |
| POST | `/api/v1/customers` | 創建客戶 | 🟡 開發中 |
| PUT | `/api/v1/customers/{id}` | 更新客戶 | 🟡 開發中 |
| DELETE | `/api/v1/customers/{id}` | 刪除客戶 | ⚪ 規劃中 |
| GET | `/api/v1/customers/search` | 搜尋客戶 | 🟡 開發中 |
| POST | `/api/v1/customers/import` | 匯入客戶 | ⚪ 規劃中 |
| GET | `/api/v1/customers/export` | 匯出客戶 | ⚪ 規劃中 |
| GET | `/api/v1/customers/{id}/hierarchy` | 獲取組織階層 | ⚪ 規劃中 |
| POST | `/api/v1/customers/{id}/relationships` | 建立關係 | ⚪ 規劃中 |
| GET | `/api/v1/customers/{id}/audit-logs` | 查詢稽核記錄 | ⚪ 規劃中 |

### 請求/響應範例

#### 創建客戶
```json
// 請求
POST /api/v1/customers
{
  "customer_name": "測試企業股份有限公司",
  "customer_type": "enterprise",
  "tax_id": "12345678",
  "contact_person": "王經理",
  "contact_phone": "02-1234-5678",
  "contact_email": "manager@test.com",
  "address": {
    "country": "台灣",
    "city": "台北市",
    "district": "信義區",
    "postal_code": "110",
    "street": "信義路五段7號"
  },
  "business_category": "製造業",
  "credit_limit": 1000000,
  "payment_terms": "月結30天"
}

// 成功響應 (201 Created)
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_code": "CUST-2025-0001",
    "customer_name": "測試企業股份有限公司",
    "customer_type": "enterprise",
    "tax_id": "12345678",
    "status": "active",
    "hierarchy_level": 1,
    "created_at": "2025-08-21T10:00:00Z",
    "updated_at": "2025-08-21T10:00:00Z"
  }
}

// 錯誤響應 (400 Bad Request)
{
  "success": false,
  "error": {
    "code": "DUPLICATE_TAX_ID",
    "message": "統一編號已存在",
    "field": "tax_id"
  }
}
```

#### 查詢客戶列表
```json
// 請求
GET /api/v1/customers?page=1&limit=20&status=active&keyword=測試

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "customer_code": "CUST-2025-0001",
        "customer_name": "測試企業股份有限公司",
        "customer_type": "enterprise",
        "status": "active",
        "contact_person": "王經理",
        "contact_phone": "02-1234-5678"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

## UI/UX 設計

### 頁面流程
1. 客戶列表頁 → 客戶詳情頁 → 編輯客戶頁
2. 客戶列表頁 → 新增客戶頁 → 客戶詳情頁
3. 客戶詳情頁 → 組織階層視圖 → 關係設定頁

### 主要畫面
- **客戶列表頁**: 表格顯示、搜尋列、篩選器、批量操作按鈕
  - 主要元素：資料表格、分頁元件、搜尋框、進階篩選面板
  - 互動行為：即時搜尋、排序、多選、右鍵選單
  
- **客戶詳情頁**: 資訊卡片、標籤頁切換、操作按鈕組
  - 主要元素：基本資訊卡、聯絡資訊、組織關係圖、歷史記錄
  - 互動行為：編輯切換、快速操作、資料匯出

- **客戶編輯頁**: 多步驟表單、即時驗證、自動儲存
  - 主要元素：步驟指示器、表單區塊、驗證提示
  - 互動行為：步驟導航、欄位驗證、草稿儲存

## 測試計畫

### 單元測試
- [x] 測試客戶資料驗證邏輯
- [x] 測試統編格式檢查
- [x] 測試階層關係驗證
- [x] 測試權限控制邏輯
- [x] 測試搜尋查詢建構

### 整合測試
- [x] 測試客戶CRUD完整流程
- [x] 測試階層關係建立流程
- [x] 測試匯入匯出流程
- [x] 測試稽核記錄產生

### 驗收測試
- [ ] 場景1：新客戶完整建檔流程
- [ ] 場景2：企業客戶階層設定
- [ ] 場景3：批量匯入1000筆客戶資料
- [ ] 場景4：複雜條件查詢效能測試

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：設計 | Day 1-2 | 系統設計文件、API規格、資料庫設計 |
| 階段2：基礎功能 | Day 3-5 | FR-001, FR-002, FR-003實現 |
| 階段3：進階功能 | Day 6-7 | FR-004, FR-005實現 |
| 階段4：測試 | Day 8-9 | 完整測試、問題修復 |
| 階段5：部署 | Day 10 | 生產環境部署、文件更新 |

### 里程碑
- [x] M1：設計審查完成 - 2025-08-21
- [ ] M2：基礎功能完成 - 2025-08-23
- [ ] M3：測試完成 - 2025-08-25
- [ ] M4：上線部署 - 2025-08-26

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 大量資料查詢效能問題 | 高 | 中 | 實施索引優化、查詢快取、分頁載入 |
| 階層關係複雜度 | 中 | 中 | 限制最大層級、提供視覺化工具 |
| 資料匯入格式多樣性 | 中 | 高 | 提供範本下載、智慧欄位對應 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 舊資料遷移品質 | 高 | 中 | 資料清洗程式、人工審核機制 |
| 使用者接受度 | 中 | 低 | 教育訓練、漸進式上線 |

## 相關文件
- [系統架構文件](../../docs/architecture.md)
- [API規格文件](../../docs/api/crm-cm-api.md)
- [測試計畫文件](./tests/test-plan.md)
- [資料遷移指南](../../docs/migration/customer-migration.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-21 | 初始版本，建立完整PRD | 系統 |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-08-28