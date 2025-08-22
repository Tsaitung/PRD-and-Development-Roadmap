# PRD: BDM-UNIT 單位字典管理模組

## 模組資訊
- **模組代碼**: BDM-UNIT
- **模組名稱**: 單位字典管理 (Unit Dictionary Management)
- **版本**: v1.0.0
- **最後更新**: 2025-08-20
- **負責人**: [待指派]
- **狀態**: 🟡 開發中

## 一、模組概述

### 1.1 模組定位
單位字典管理模組是ERP系統的基礎數據維護模組之一，負責管理系統中所有計量單位的定義、換算關係和精確度設定。

### 1.2 業務價值
- **標準化管理**: 統一管理所有計量單位，確保數據一致性
- **靈活配置**: 支援自定義單位和換算關係
- **精確控制**: 設定誤差範圍，適應不同業務場景
- **提升效率**: 自動換算減少人工計算錯誤

### 1.3 目標用戶
- 系統管理員
- 基礎數據維護人員
- 採購人員（查詢參考）
- 銷售人員（查詢參考）

## 二、功能需求

### FR-BDM-UNIT-001: 單位列表管理
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
提供單位資料的完整列表展示，支援搜尋、篩選和排序功能，作為單位管理的主要介面。

**功能需求細節**:
- **條件/觸發**: 當用戶訪問單位管理頁面或執行搜尋/篩選操作時
- **行為**: 系統載入並顯示符合條件的單位列表，支援分頁和排序
- **資料輸入**: 搜尋關鍵字、篩選條件(單位類型)、排序選項、頁碼
- **資料輸出**: 單位列表(含所有欄位)、總筆數、當前頁碼
- **UI反應**: 載入動畫、搜尋即時響應、排序視覺指示、分頁控制
- **例外處理**: 無資料顯示空狀態、搜尋逾時提示、分頁錯誤處理

**用戶故事**:
作為系統管理員，
我希望能查看和搜尋所有計量單位，
以便管理和維護單位資料。

**驗收標準**:
```yaml
- 條件: 載入單位列表頁面
  預期結果: 2秒內顯示單位列表並預設按創建時間倒序
  
- 條件: 輸入搜尋關鍵字"公斤"
  預期結果: 500ms內顯示包含"公斤"的所有單位
  
- 條件: 單位數量超過20筆
  預期結果: 自動分頁顯示，每頁20筆
```

**技術需求**:
- **API 端點**: `GET /api/v1/units`
- **請求/回應**: 
  ```json
  // 請求
  GET /api/v1/units?search=公斤&type=weight&page=1&limit=20
  
  // 回應
  {
    "data": [{...}],
    "total": 50,
    "page": 1,
    "limit": 20
  }
  ```
- **數據模型**: units表
- **權限要求**: unit.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-BDM-UNIT-001.test.ts`
- **Code**: `src/modules/bdm/unit/list/`
- **TOC**: `TOC Modules.md` 第103行

**依賴關係**:
- **依賴模組**: SA-UPM (用戶權限)
- **依賴功能**: 無
- **外部服務**: 無

### FR-BDM-UNIT-002: 新增單位
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
提供新增計量單位的功能，包含完整的資料驗證和重複檢查。

**功能需求細節**:
- **條件/觸發**: 當用戶點擊"新增單位"按鈕並填寫表單時
- **行為**: 系統驗證輸入資料，檢查重複性，儲存新單位資料
- **資料輸入**: 單位名稱(1-20字)、類型、誤差範圍(0-100)、精確性、換算率(>0)
- **資料輸出**: 新單位ID、創建時間戳、成功訊息
- **UI反應**: 即時驗證提示、儲存進度、成功通知、表單重置
- **例外處理**: 重複名稱警告、驗證失敗提示、網路錯誤重試

**用戶故事**:
作為基礎數據維護人員，
我希望能新增新的計量單位，
以便擴充系統的單位選項。

**驗收標準**:
```yaml
- 條件: 輸入完整有效的單位資料
  預期結果: 成功儲存並顯示成功訊息
  
- 條件: 輸入已存在的單位名稱
  預期結果: 顯示"單位名稱已存在"錯誤
  
- 條件: 誤差範圍輸入150
  預期結果: 顯示"誤差範圍必須在0-100之間"錯誤
```

**技術需求**:
- **API 端點**: `POST /api/v1/units`
- **請求/回應**: 
  ```json
  // 請求
  {
    "unitName": "公斤",
    "unitType": "weight",
    "variance": 5,
    "isExact": false,
    "conversionToKG": 1.0
  }
  ```
- **數據模型**: units表
- **權限要求**: unit.create
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-BDM-UNIT-002.test.ts`
- **Code**: `src/modules/bdm/unit/create/`
- **TOC**: `TOC Modules.md` 第103行

**依賴關係**:
- **依賴模組**: SA-UPM (用戶權限)
- **依賴功能**: FR-BDM-UNIT-001 (列表更新)
- **外部服務**: 無

### FR-BDM-UNIT-003: 編輯單位
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
修改現有單位的資訊，保留完整的修改歷史記錄供審計追蹤。

**功能需求細節**:
- **條件/觸發**: 當用戶點擊編輯按鈕並修改單位資料時
- **行為**: 系統載入當前資料、驗證修改內容、更新資料庫並記錄變更歷史
- **資料輸入**: 可修改的欄位(名稱、類型、誤差範圍、精確性、換算率)
- **資料輸出**: 更新成功訊息、更新時間戳、變更記錄ID
- **UI反應**: 載入中狀態、即時驗證、儲存進度、成功提示
- **例外處理**: 併發修改衝突、驗證失敗、權限不足警告

**用戶故事**:
作為系統管理員，
我希望能修改單位資訊，
以便修正錯誤或更新單位設定。

**驗收標準**:
```yaml
- 條件: 載入編輯表單
  預期結果: 顯示當前所有欄位值
  
- 條件: 修改單位名稱並儲存
  預期結果: 立即更新列表並記錄變更歷史
  
- 條件: 兩個用戶同時編輯同一單位
  預期結果: 提示版本衝突並顯示最新資料
```

**技術需求**:
- **API 端點**: `PUT /api/v1/units/{id}`
- **請求/回應**: 
  ```json
  // 請求
  {
    "unitName": "公斤(更新)",
    "variance": 3,
    "version": "v1" // 樂觀鎖版本號
  }
  ```
- **數據模型**: units表、unit_audit_logs表
- **權限要求**: unit.update
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-BDM-UNIT-003.test.ts`
- **Code**: `src/modules/bdm/unit/edit/`
- **TOC**: `TOC Modules.md` 第103行

**依賴關係**:
- **依賴模組**: SA-UPM (用戶權限)
- **依賴功能**: FR-BDM-UNIT-001 (列表更新)
- **外部服務**: 無

### FR-BDM-UNIT-004: 刪除單位
**狀態**: ⚪ 規劃中
**優先級**: P2

**功能描述**:
提供單位刪除功能，包含關聯檢查和軟刪除機制，確保資料完整性。

**功能需求細節**:
- **條件/觸發**: 當用戶選擇刪除單位並確認操作時
- **行為**: 系統檢查關聯性、執行軟刪除、更新deleted_at時間戳
- **資料輸入**: 單位ID、刪除原因(選填)
- **資料輸出**: 刪除結果、影響範圍報告、刪除時間
- **UI反應**: 確認對話框、關聯提示、刪除動畫、列表更新
- **例外處理**: 關聯資料阻擋、權限不足、恢復機制提示

**用戶故事**:
作為系統管理員，
我希望能安全地刪除不再使用的單位，
以便保持資料的整潔性。

**驗收標準**:
```yaml
- 條件: 刪除無關聯的單位
  預期結果: 成功軟刪除並從列表移除
  
- 條件: 刪除有品項關聯的單位
  預期結果: 顯示"此單位有N個品項使用中"阻擋訊息
  
- 條件: 管理員查看已刪除單位
  預期結果: 可在回收站查看並提供恢復選項
```

**技術需求**:
- **API 端點**: `DELETE /api/v1/units/{id}`
- **請求/回應**: 
  ```json
  // 回應
  {
    "success": false,
    "error": "UNIT_IN_USE",
    "message": "單位使用中",
    "relatedItems": 5
  }
  ```
- **數據模型**: units表(deleted_at欄位)
- **權限要求**: unit.delete
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-BDM-UNIT-004.test.ts`
- **Code**: `src/modules/bdm/unit/delete/`
- **TOC**: `TOC Modules.md` 第103行

**依賴關係**:
- **依賴模組**: IM (品項管理)、OM (訂單管理)
- **依賴功能**: 關聯性檢查API
- **外部服務**: 無

### FR-BDM-UNIT-005: 單位換算查詢
**狀態**: ⚪ 規劃中
**優先級**: P3

**功能描述**:
提供快速的單位換算查詢工具，支援即時計算和公式顯示。

**功能需求細節**:
- **條件/觸發**: 當用戶輸入數值並選擇來源和目標單位時
- **行為**: 系統即時計算換算結果並顯示計算公式
- **資料輸入**: 數值、來源單位ID、目標單位ID
- **資料輸出**: 換算結果、計算公式、誤差範圍、精確度提示
- **UI反應**: 即時計算、公式展示、誤差提示、歷史記錄
- **例外處理**: 不同類型單位無法換算、數值溢出警告

**用戶故事**:
作為業務人員，
我希望能快速進行單位換算，
以便在報價或採購時準確計算。

**驗收標準**:
```yaml
- 條件: 輸入10公斤換算為台斤
  預期結果: 100ms內顯示16.67台斤及計算公式
  
- 條件: 嘗試將重量單位換算為體積單位
  預期結果: 顯示"不同類型單位無法直接換算"提示
  
- 條件: 連續換算5次
  預期結果: 顯示最近5筆換算歷史
```

**技術需求**:
- **API 端點**: `POST /api/v1/units/convert`
- **請求/回應**: 
  ```json
  // 請求
  {
    "value": 10,
    "fromUnitId": "unit-001",
    "toUnitId": "unit-002"
  }
  // 回應
  {
    "result": 16.67,
    "formula": "10 × 1.0 ÷ 0.6",
    "variance": "±5%"
  }
  ```
- **數據模型**: units表(查詢換算率)
- **權限要求**: unit.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-BDM-UNIT-005.test.ts`
- **Code**: `src/modules/bdm/unit/convert/`
- **TOC**: `TOC Modules.md` 第103行

**依賴關係**:
- **依賴模組**: 無
- **依賴功能**: FR-BDM-UNIT-001 (單位資料)
- **外部服務**: 無

## 三、非功能需求

### 3.1 性能需求
- 頁面載入時間：< 2秒
- API響應時間：< 500ms
- 並發用戶數：支援100個同時操作

### 3.2 安全需求
- 需要登入驗證
- 角色權限控制（查看/新增/編輯/刪除）
- 操作日誌記錄

### 3.3 可用性需求
- 瀏覽器支援：Chrome, Firefox, Safari, Edge
- 響應式設計：支援平板和桌面
- 無障礙設計：符合WCAG 2.1 AA標準

### 3.4 可維護性需求
- 模組化設計
- 完整的錯誤處理
- 詳細的日誌記錄

## 四、數據模型

### 4.1 單位資料表 (units)
```typescript
interface Unit {
  // 系統欄位
  id: string;              // UUID，主鍵
  created_at: string;      // ISO 8601格式
  updated_at: string;      // ISO 8601格式
  deleted_at?: string;     // 軟刪除時間
  created_by?: string;     // 創建者ID
  updated_by?: string;     // 最後修改者ID
  
  // 業務欄位
  unitName: string;        // 單位名稱（唯一）
  unitType: string;        // 單位類型
  variance: number;        // 誤差範圍（0-100）
  isExact: boolean;        // 是否為精確單位
  conversionToKG: number;  // 公斤換算率
  
  // 擴展欄位
  description?: string;    // 單位說明
  isActive: boolean;       // 是否啟用
  sortOrder?: number;      // 排序順序
}
```

### 4.2 單位類型列舉
```typescript
enum UnitType {
  WEIGHT = '重量',
  VOLUME = '體積', 
  QUANTITY = '數量',
  LENGTH = '長度',
  AREA = '面積',
  PACKAGE = '包裝'
}
```

### 4.3 資料庫結構
```sql
-- 單位主檔表
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name VARCHAR(50) UNIQUE NOT NULL,
  unit_type VARCHAR(20) NOT NULL,
  variance DECIMAL(5,2) NOT NULL CHECK (variance >= 0 AND variance <= 100),
  is_exact BOOLEAN NOT NULL DEFAULT FALSE,
  conversion_to_kg DECIMAL(15,6) NOT NULL CHECK (conversion_to_kg > 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- 索引
  INDEX idx_unit_name (unit_name),
  INDEX idx_unit_type (unit_type),
  INDEX idx_is_active (is_active),
  INDEX idx_deleted_at (deleted_at)
);

-- 單位操作日誌表
CREATE TABLE unit_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_unit_id (unit_id),
  INDEX idx_changed_at (changed_at)
);
```

## 五、API設計

### 5.1 API端點列表

| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| GET | /v1/units | 獲取單位列表 | 查看 |
| GET | /v1/units/{id} | 獲取單一單位 | 查看 |
| POST | /v1/units | 新增單位 | 新增 |
| PUT | /v1/units/{id} | 更新單位 | 編輯 |
| DELETE | /v1/units/{id} | 刪除單位 | 刪除 |
| GET | /v1/units/types | 獲取單位類型 | 查看 |
| POST | /v1/units/convert | 單位換算 | 查看 |

### 5.2 請求/響應範例

#### 獲取單位列表
```http
GET /v1/units?page=1&limit=20&search=公斤
```

響應：
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "unitName": "公斤",
      "unitType": "重量",
      "variance": 0,
      "isExact": true,
      "conversionToKG": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

## 六、UI/UX設計

### 6.1 頁面佈局
- 頂部：麵包屑導航 + 頁面標題
- 工具列：搜尋框 + 新增按鈕
- 主體：資料表格
- 操作：行內編輯/刪除按鈕

### 6.2 互動設計
- 表格支援排序
- 滑鼠懸停顯示提示
- 載入狀態顯示
- 錯誤訊息顯示

### 6.3 響應式設計
- 桌面版：完整表格顯示
- 平板版：隱藏次要欄位
- 提供欄位選擇器

## 七、測試需求

### 7.1 單元測試
- 覆蓋率目標：> 80%
- 測試所有驗證邏輯
- 測試資料轉換函數

### 7.2 整合測試
- API端點測試
- 資料庫操作測試
- 權限控制測試

### 7.3 E2E測試
- 完整CRUD流程
- 搜尋功能測試
- 錯誤處理測試

### 7.4 性能測試
- 載入時間測試
- 並發測試
- 大量資料測試

## 八、實施計畫

### 8.1 開發階段
- **第1週**: 資料庫設計和API開發
- **第2週**: 前端頁面開發
- **第3週**: 整合測試和Bug修復
- **第4週**: UAT測試和上線準備

### 8.2 依賴關係
- 需要先完成用戶認證模組
- 需要基礎UI組件庫
- 需要API Gateway配置

### 8.3 風險評估
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 資料遷移錯誤 | 高 | 中 | 完整備份和回滾計畫 |
| 性能問題 | 中 | 低 | 快取和索引優化 |
| 相容性問題 | 低 | 低 | 完整瀏覽器測試 |

## 九、驗收標準

### 9.1 功能驗收
- [ ] 所有功能需求已實現
- [ ] 通過所有測試案例
- [ ] 無P1/P2級別Bug

### 9.2 性能驗收
- [ ] 滿足所有性能指標
- [ ] 通過壓力測試
- [ ] 資源使用合理

### 9.3 文檔驗收
- [ ] API文檔完整
- [ ] 使用手冊完成
- [ ] 部署文檔完整

## 十、維護計畫

### 10.1 監控指標
- API響應時間
- 錯誤率
- 使用頻率統計

### 10.2 備份策略
- 每日自動備份
- 保留30天備份
- 異地備份

### 10.3 更新計畫
- 每季度功能評估
- 根據使用反饋優化
- 定期安全更新

## 附錄

### A. 術語表
- **單位字典**: 系統中所有計量單位的集合
- **換算率**: 不同單位之間的轉換比例
- **誤差範圍**: 允許的計量偏差百分比
- **精確單位**: 不允許誤差的計量單位

### B. 參考資料
- ISO 80000國際單位標準
- 台灣度量衡標準
- 業界最佳實踐

### C. 變更記錄
| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-20 | 初始版本，基於舊系統代碼分析生成 | System |

---

**文檔狀態**: 待審核
**下次審查日期**: 2025-09-01