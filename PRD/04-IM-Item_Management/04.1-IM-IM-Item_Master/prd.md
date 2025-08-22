# 品項主檔管理 PRD 文件

## 模組資訊
- **模組代碼**: 04.1-IM-IM
- **模組名稱**: Item Master (品項主檔)
- **負責人**: 菜蟲農食 ERP 團隊
- **最後更新**: 2025-08-22
- **版本**: v1.0.0

## 模組概述
品項主檔管理模組是整個ERP系統的基礎資料核心，負責管理所有產品、原料、半成品的主檔資料。支援農產品特殊屬性如季節性、保存期限、產地來源等，並提供可採購/可販售屬性控制。

## 業務價值
- 統一品項資料管理，確保資料一致性
- 支援多層級品項分類，便於管理和分析
- 完整的屬性管理支援複雜業務需求
- 提供準確的成本和價格基礎資料

## 功能需求

### FR-IM-IM-001: 品項主檔建立與維護
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
建立和維護品項基本資料，包括品項編號、名稱、規格、分類、單位、屬性等，支援多層級分類和自定義屬性。

**功能需求細節**:
- **條件/觸發**: 當新增品項或更新品項資料時
- **行為**: 系統驗證資料完整性、檢查編號唯一性、更新品項資料庫
- **資料輸入**: 品項編號、名稱、規格、分類、基本單位、包裝單位、屬性設定
- **資料輸出**: 品項清單、品項詳情、分類統計、屬性報表
- **UI反應**: 表單驗證、重複檢查、圖片上傳、自動編號建議
- **例外處理**: 編號重複警告、必填欄位提醒、分類不存在提示

**用戶故事**:
作為品項管理員，
我希望完整記錄所有品項資訊，
以便其他模組能正確引用品項資料。

**驗收標準**:
```yaml
- 條件: 新增品項時輸入編號
  預期結果: 自動檢查編號唯一性並提示是否可用
  
- 條件: 選擇品項分類
  預期結果: 顯示多層級分類樹供選擇
  
- 條件: 設定品項屬性
  預期結果: 根據分類自動帶入預設屬性並允許修改
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/items`
  - `GET /api/v1/items`
  - `PUT /api/v1/items/{id}`
  - `DELETE /api/v1/items/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Item, ItemCategory, ItemAttribute
- **權限要求**: item.create, item.view, item.edit
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-IM-IM-001.test.ts`
  - 整合測試: `tests/integration/FR-IM-IM-001.integration.test.ts`
  - E2E測試: `tests/e2e/FR-IM-IM-001.e2e.test.ts`
- **Code**: `src/modules/im/item/master/`
- **TOC**: `TOC Modules.md` 第122行

**依賴關係**:
- **依賴模組**: BDM-UNIT (單位字典), BDM-ICAT (類別字典)
- **依賴功能**: FR-BDM-UNIT-001, FR-BDM-ICAT-001
- **外部服務**: 無

---

### FR-IM-IM-002: 可採購/可販售屬性管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
設定品項的採購和銷售屬性，控制品項在採購和銷售流程中的可用性，支援依時間、季節、客戶等條件設定。

**功能需求細節**:
- **條件/觸發**: 當設定品項交易屬性或業務流程檢查時
- **行為**: 更新品項屬性、驗證業務規則、控制流程可用性
- **資料輸入**: 可採購標記、可銷售標記、有效期間、適用客戶群、季節限制
- **資料輸出**: 屬性狀態、可用品項清單、限制條件、歷史記錄
- **UI反應**: 開關切換、日期選擇器、條件設定面板、狀態指示燈
- **例外處理**: 衝突設定警告、無效日期提示、權限不足提醒

**用戶故事**:
作為採購/銷售人員，
我希望系統自動過濾可用品項，
以避免選擇錯誤的產品。

**驗收標準**:
```yaml
- 條件: 品項設為不可採購
  預期結果: 採購單無法選擇該品項
  
- 條件: 設定季節性銷售
  預期結果: 只在指定季節顯示為可銷售
  
- 條件: 特定客戶限制
  預期結果: 只有指定客戶能看到該品項
```

**技術需求**:
- **API 端點**: 
  - `PUT /api/v1/items/{id}/attributes`
  - `GET /api/v1/items/purchasable`
  - `GET /api/v1/items/saleable`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ItemAttribute, PurchaseControl, SalesControl
- **權限要求**: item.attribute.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-IM-IM-002.test.ts`
  - 整合測試: `tests/integration/FR-IM-IM-002.integration.test.ts`
  - E2E測試: `tests/e2e/FR-IM-IM-002.e2e.test.ts`
- **Code**: `src/modules/im/item/attributes/`
- **TOC**: `TOC Modules.md` 第122行

**依賴關係**:
- **依賴模組**: CRM (客戶分群), OP (季節設定)
- **依賴功能**: FR-CRM-CS-001, FR-OP-CAL-001
- **外部服務**: 無

---

### FR-IM-IM-003: 品項分類管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
建立和維護多層級品項分類結構，支援靈活的分類體系，便於品項組織、查詢和報表分析。

**功能需求細節**:
- **條件/觸發**: 當建立分類或調整分類結構時
- **行為**: 創建分類節點、維護父子關係、更新分類樹
- **資料輸入**: 分類代碼、名稱、父分類、排序、屬性繼承設定
- **資料輸出**: 分類樹結構、分類路徑、品項數量統計、分類報表
- **UI反應**: 樹狀結構顯示、拖放調整、展開/收合、搜尋定位
- **例外處理**: 循環引用檢查、孤立節點警告、刪除含品項分類確認

**用戶故事**:
作為資料管理員，
我希望靈活管理品項分類，
以便適應業務變化和報表需求。

**驗收標準**:
```yaml
- 條件: 創建多層分類
  預期結果: 支援至少5層分類結構
  
- 條件: 調整分類位置
  預期結果: 拖放後自動更新所有相關品項
  
- 條件: 刪除分類
  預期結果: 檢查是否有品項並提示處理方式
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/items/categories`
  - `POST /api/v1/items/categories`
  - `PUT /api/v1/items/categories/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ItemCategory, CategoryTree, CategoryAttribute
- **權限要求**: category.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-IM-IM-003.test.ts`
  - 整合測試: `tests/integration/FR-IM-IM-003.integration.test.ts`
  - E2E測試: `tests/e2e/FR-IM-IM-003.e2e.test.ts`
- **Code**: `src/modules/im/item/category/`
- **TOC**: `TOC Modules.md` 第122行

**依賴關係**:
- **依賴模組**: BDM-ICAT (類別字典)
- **依賴功能**: FR-BDM-ICAT-001
- **外部服務**: 無

---

### FR-IM-IM-004: 品項圖片與文件管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
管理品項相關的圖片、規格書、認證文件等附件，支援多檔案上傳、版本控制和分類管理。

**功能需求細節**:
- **條件/觸發**: 當上傳品項附件或查看品項資料時
- **行為**: 上傳檔案、建立關聯、版本管理、生成縮圖
- **資料輸入**: 檔案選擇、檔案類型、描述、版本說明、有效期限
- **資料輸出**: 圖片清單、文件列表、版本歷史、下載連結
- **UI反應**: 上傳進度、縮圖預覽、檔案圖示、版本選擇
- **例外處理**: 檔案大小限制、格式檢查、上傳失敗重試

**用戶故事**:
作為產品管理員，
我希望集中管理品項相關文件，
以便快速查找和分享產品資訊。

**驗收標準**:
```yaml
- 條件: 上傳產品圖片
  預期結果: 自動生成多種尺寸縮圖供不同場景使用
  
- 條件: 上傳新版本文件
  預期結果: 保留歷史版本並標記最新版
  
- 條件: 檔案過大
  預期結果: 顯示錯誤訊息並建議壓縮或分割
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/items/{id}/attachments`
  - `GET /api/v1/items/{id}/attachments`
  - `DELETE /api/v1/items/{id}/attachments/{attachmentId}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ItemAttachment, FileVersion, FileMetadata
- **權限要求**: item.attachment.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-IM-IM-004.test.ts`
  - 整合測試: `tests/integration/FR-IM-IM-004.integration.test.ts`
  - E2E測試: `tests/e2e/FR-IM-IM-004.e2e.test.ts`
- **Code**: `src/modules/im/item/attachments/`
- **TOC**: `TOC Modules.md` 第122行

**依賴關係**:
- **依賴模組**: 無
- **依賴功能**: 無
- **外部服務**: S3/檔案存儲服務

---

### FR-IM-IM-005: 品項成本與價格管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
管理品項的成本資訊和建議售價，支援多種成本計算方式（標準成本、移動平均、FIFO等）和價格策略。

**功能需求細節**:
- **條件/觸發**: 當設定成本或價格，或成本變動時
- **行為**: 更新成本資料、計算價格、記錄變動歷史
- **資料輸入**: 成本類型、成本金額、價格策略、毛利率、有效期間
- **資料輸出**: 當前成本、建議售價、成本歷史、毛利分析
- **UI反應**: 成本計算器、價格建議、趨勢圖表、變動提醒
- **例外處理**: 負成本警告、毛利率異常、成本未設定提示

**用戶故事**:
作為財務人員，
我希望準確維護品項成本，
以確保定價決策的正確性。

**驗收標準**:
```yaml
- 條件: 更新標準成本
  預期結果: 記錄變動歷史並可選是否立即生效
  
- 條件: 設定毛利率目標
  預期結果: 自動計算建議售價
  
- 條件: 成本異常變動
  預期結果: 發出警告並要求確認
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/items/{id}/costs`
  - `PUT /api/v1/items/{id}/costs`
  - `GET /api/v1/items/{id}/pricing`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ItemCost, CostHistory, PricingStrategy
- **權限要求**: item.cost.view, item.cost.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-IM-IM-005.test.ts`
  - 整合測試: `tests/integration/FR-IM-IM-005.integration.test.ts`
  - E2E測試: `tests/e2e/FR-IM-IM-005.e2e.test.ts`
- **Code**: `src/modules/im/item/costing/`
- **TOC**: `TOC Modules.md` 第122行

**依賴關係**:
- **依賴模組**: FA (財務模組), CRM-PM (價格管理)
- **依賴功能**: FR-FA-FR-001, FR-CRM-PM-001
- **外部服務**: 無

## 非功能需求

### 性能需求
- 品項查詢響應時間：< 1秒
- 批量匯入處理：1000筆/分鐘
- 圖片上傳：< 5秒/張
- 並發查詢支援：500+

### 安全需求
- 成本資料加密存儲
- 價格修改審計日誌
- 檔案上傳病毒掃描
- 敏感資料權限控制

### 可用性需求
- 系統可用性：99.9%
- 支援離線查詢快取
- 多語言支援（中英文）
- 響應式設計

## 數據模型

### 主要實體
```typescript
interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  itemNameEn?: string;
  specification: string;
  categoryId: string;
  baseUnit: string;
  packagingUnit?: string;
  conversionRate?: number;
  isPurchasable: boolean;
  isSaleable: boolean;
  status: 'active' | 'inactive' | 'discontinued';
  attributes: ItemAttribute[];
  costs: ItemCost[];
  attachments: ItemAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

interface ItemCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  parentId?: string;
  level: number;
  path: string;
  sortOrder: number;
  isActive: boolean;
  defaultAttributes?: AttributeTemplate[];
}

interface ItemCost {
  id: string;
  itemId: string;
  costType: 'standard' | 'average' | 'fifo' | 'lifo';
  amount: number;
  currency: string;
  effectiveDate: Date;
  expiryDate?: Date;
  isActive: boolean;
}

interface ItemAttribute {
  id: string;
  itemId: string;
  attributeKey: string;
  attributeValue: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  isRequired: boolean;
}

interface PricingStrategy {
  id: string;
  itemId: string;
  strategyType: 'fixed' | 'markup' | 'market' | 'tiered';
  basePrice?: number;
  markupPercent?: number;
  minPrice?: number;
  maxPrice?: number;
  tiers?: PriceTier[];
}
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/items` | 查詢品項列表 | 🔴 未開始 |
| POST | `/api/v1/items` | 創建品項 | 🔴 未開始 |
| PUT | `/api/v1/items/{id}` | 更新品項 | 🔴 未開始 |
| DELETE | `/api/v1/items/{id}` | 刪除品項 | 🔴 未開始 |
| GET | `/api/v1/items/categories` | 獲取分類樹 | 🔴 未開始 |
| PUT | `/api/v1/items/{id}/costs` | 更新成本 | 🔴 未開始 |
| POST | `/api/v1/items/{id}/attachments` | 上傳附件 | 🔴 未開始 |
| GET | `/api/v1/items/export` | 匯出品項 | 🔴 未開始 |

### 請求/回應範例

#### 創建品項
```json
// 請求
POST /api/v1/items
{
  "itemCode": "VEG001",
  "itemName": "有機番茄",
  "specification": "1kg/盒",
  "categoryId": "CAT_VEG_001",
  "baseUnit": "KG",
  "packagingUnit": "BOX",
  "conversionRate": 1,
  "isPurchasable": true,
  "isSaleable": true,
  "attributes": [
    {
      "attributeKey": "origin",
      "attributeValue": "台灣",
      "dataType": "string"
    },
    {
      "attributeKey": "shelfLife",
      "attributeValue": "7",
      "dataType": "number"
    }
  ]
}

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "id": "ITEM20250822001",
    "itemCode": "VEG001",
    "itemName": "有機番茄",
    "status": "active",
    "createdAt": "2025-08-22T10:30:00Z"
  }
}
```

### 資料庫結構
```sql
-- 品項主檔
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  item_name_en VARCHAR(200),
  specification VARCHAR(500),
  category_id UUID REFERENCES item_categories(id),
  base_unit VARCHAR(20) NOT NULL,
  packaging_unit VARCHAR(20),
  conversion_rate DECIMAL(10,4),
  is_purchasable BOOLEAN DEFAULT TRUE,
  is_saleable BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_item_code (item_code),
  INDEX idx_category (category_id),
  INDEX idx_status (status)
);

-- 品項分類
CREATE TABLE item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(30) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES item_categories(id),
  level INTEGER NOT NULL DEFAULT 1,
  path VARCHAR(500) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_parent (parent_id),
  INDEX idx_path (path)
);

-- 品項成本
CREATE TABLE item_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  cost_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TWD',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_item (item_id),
  INDEX idx_effective_date (effective_date),
  UNIQUE(item_id, cost_type, effective_date)
);

-- 品項屬性
CREATE TABLE item_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  attribute_key VARCHAR(50) NOT NULL,
  attribute_value TEXT,
  data_type VARCHAR(20) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_item (item_id),
  INDEX idx_key (attribute_key),
  UNIQUE(item_id, attribute_key)
);

-- 品項附件
CREATE TABLE item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_item (item_id),
  INDEX idx_version (version)
);
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎架構 | Day 1-2 | 資料模型、API框架 |
| 階段2：主檔管理 | Day 3-4 | 品項CRUD、分類管理 |
| 階段3：屬性控制 | Day 5 | 採購/銷售屬性 |
| 階段4：成本價格 | Day 6 | 成本管理、價格策略 |
| 階段5：附件管理 | Day 7 | 檔案上傳、版本控制 |
| 階段6：測試整合 | Day 8 | 單元測試、整合測試 |

### 里程碑
- [ ] M1：品項基礎功能完成 - 2025-08-24
- [ ] M2：屬性管理完成 - 2025-08-26
- [ ] M3：成本價格功能完成 - 2025-08-27
- [ ] M4：全模組測試通過 - 2025-08-29

## 風險評估
| 風險項目 | 可能性 | 影響 | 緩解措施 |
|----------|--------|------|----------|
| 資料遷移複雜 | 高 | 高 | 分批遷移、對照表 |
| 分類結構變更 | 中 | 中 | 靈活設計、版本控制 |
| 成本計算錯誤 | 低 | 高 | 充分測試、審計日誌 |
| 檔案存儲成本 | 中 | 低 | 壓縮、CDN、定期清理 |

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-22 | 初始版本創建 | ERP Team |

---

**文件狀態**: 草稿
**下次審查日期**: 2025-08-29