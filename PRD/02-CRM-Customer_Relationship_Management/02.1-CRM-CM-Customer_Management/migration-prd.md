# 【舊系統轉移】CRM-CM 客戶管理模組 PRD

## 轉移資訊
- **來源系統**: tsaitung-dashboard-central (北區)
- **原始頁面**: `/client/`
- **原始代碼位置**: `/apps/tsaitung-dashboard-central/pages/client/index.tsx`
- **相關組件**: `/libs/tsaitung-dashboard/Client/`
- **轉移類型**: 功能保留型轉移
- **轉移優先級**: P1-高
- **最後更新**: 2025-08-20

## 模組資訊
- **模組代碼**: CRM-CM
- **模組名稱**: 客戶主檔管理 (Customer Master Management)
- **負責人**: [待指派]
- **版本**: v1.0.0-migration

## 模組概述
客戶管理模組是ERP系統的核心模組之一，負責管理企業、公司和門市三層級的客戶資料。支援搜尋、查看、編輯客戶基本資訊、聯絡資訊、物流配送資訊、會計資訊等完整客戶檔案。

## 舊系統功能分析

### 現有功能清單
1. **三層級客戶結構**
   - Enterprise (企業集團)
   - Company (公司)
   - Store (門市)

2. **搜尋功能**
   - 關鍵字搜尋
   - 客戶類型篩選
   - 資料完整度篩選

3. **資料管理**
   - 基本資訊維護
   - 聯絡人管理
   - 物流配送設定
   - 會計資訊設定
   - 付款條件設定

### 保留與改進

#### 需保留功能
- 三層級客戶架構（企業-公司-門市）
- 完整的客戶資料欄位
- 搜尋和篩選功能
- 資料完整度檢查

#### 計劃改進項目
- 優化搜尋效能（加入索引）
- 新增批量匯入功能
- 加強資料驗證規則
- 改善UI/UX體驗
- 新增客戶標籤功能

## 功能需求

### FR-CRM-CM-001: 客戶搜尋查詢
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
提供多條件搜尋功能，支援企業、公司、門市三種客戶類型的搜尋，包含關鍵字搜尋和進階篩選。

**功能需求細節**:
- **條件/觸發**: 用戶選擇客戶類型並輸入搜尋條件
- **行為**: 系統查詢符合條件的客戶資料並顯示
- **資料輸入**: 
  - 關鍵字（客戶名稱、電話、統編）
  - 客戶類型（企業/公司/門市）
  - 資料完整度篩選
- **資料輸出**: 符合條件的客戶列表
- **UI反應**: 顯示搜尋結果表格，支援分頁
- **例外處理**: 無結果時顯示提示訊息

**驗收標準**:
```yaml
- 條件: 輸入客戶名稱關鍵字
  預期結果: 顯示包含該關鍵字的所有客戶
  
- 條件: 選擇特定客戶類型
  預期結果: 只顯示該類型的客戶
  
- 條件: 搜尋無結果
  預期結果: 顯示"查無資料"提示
```

**技術需求**:
- **API 端點**: `GET /api/v1/customers/search`
- **請求參數**:
  ```json
  {
    "keyword": "string",
    "customer_type": "enterprise|company|store",
    "info_completed": "boolean"
  }
  ```

### FR-CRM-CM-002: 客戶基本資料管理
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
管理客戶的基本資料，包含名稱、電話、地址、統一編號等核心資訊。

**功能需求細節**:
- **條件/觸發**: 用戶點擊新增或編輯客戶
- **行為**: 開啟客戶資料表單進行編輯
- **資料輸入**: 
  - 客戶名稱（必填）
  - 統一編號
  - 聯絡電話
  - 公司地址
  - 負責人姓名
- **資料輸出**: 儲存的客戶資料
- **UI反應**: 表單驗證即時回饋
- **例外處理**: 必填欄位驗證、統編格式驗證

### FR-CRM-CM-003: 客戶階層關係管理
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
管理企業-公司-門市的三層級關係，支援關聯設定和階層查看。

**功能需求細節**:
- **條件/觸發**: 設定客戶的上層關係
- **行為**: 建立客戶間的階層關聯
- **資料輸入**: 
  - 上層企業ID（公司層級）
  - 上層公司ID（門市層級）
- **資料輸出**: 更新的階層關係
- **UI反應**: 樹狀結構顯示
- **例外處理**: 防止循環關聯

### FR-CRM-CM-004: 物流配送資訊設定
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
設定客戶的物流配送資訊，包含收貨地址、時間、特殊指示等。

**功能需求細節**:
- **條件/觸發**: 編輯客戶物流資訊
- **行為**: 更新配送設定
- **資料輸入**: 
  - 預設配送站點
  - 收貨地址
  - 收貨時間（平日/假日）
  - 司機配送指示
  - 是否留貨
- **資料輸出**: 儲存的物流設定
- **UI反應**: 地址自動完成、時間選擇器
- **例外處理**: 地址驗證、時間衝突檢查

### FR-CRM-CM-005: 會計資訊管理
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
管理客戶的會計相關資訊，包含發票設定、付款條件、對帳資訊等。

**功能需求細節**:
- **條件/觸發**: 編輯客戶會計資訊
- **行為**: 更新會計設定
- **資料輸入**: 
  - 發票類型（二聯/三聯）
  - 結帳日期
  - 付款條件
  - 會計聯絡人
  - 電子發票載具
- **資料輸出**: 儲存的會計設定
- **UI反應**: 動態表單根據發票類型顯示
- **例外處理**: 統編驗證、載具格式檢查

## 數據模型

### 主要實體
```typescript
// 企業實體
interface Enterprise {
  enterprise_id: string;
  enterprise_name: string;
  responsible_name?: string;
  phone?: string;
  info_completed: boolean;
  child_companies?: Company[];
}

// 公司實體
interface Company {
  company_id: string;
  company_basic_info: {
    company_name: string;
    unicode?: string;
    company_phone?: string;
    company_address?: string;
    responsible_name?: string;
  };
  billing_info: BillingInfo;
  accounting_info: AccountingInfo;
  payment_info: PaymentInfo;
  parent_enterprise?: string;
  child_stores?: Store[];
  info_completed: boolean;
}

// 門市實體
interface Store {
  store_id: string;
  basic_info: {
    store_name: string;
    store_phone?: string;
    store_type?: string;
  };
  logistics_info: LogisticsInfo;
  contacts_info: ContactsInfo;
  parent_company?: string;
  active_state?: string;
  first_order_date?: string;
  last_order_date?: string;
  info_completed: boolean;
}
```

## 數據遷移策略

### 遷移方式
- **策略**: 漸進式遷移
- **階段**: 
  1. 第一階段：遷移基本資料（2週）
  2. 第二階段：遷移關聯資料（1週）
  3. 第三階段：資料驗證和修正（1週）

### 數據映射
| 舊系統欄位 | 新系統欄位 | 轉換規則 |
|-----------|-----------|----------|
| enterprise_id | customer_id | 加前綴 "ENT_" |
| company_id | customer_id | 加前綴 "COM_" |
| store_id | customer_id | 加前綴 "STO_" |
| unicode | tax_id | 直接映射 |
| billing_cycle | invoice_cycle | 值映射轉換 |

### 相容性處理
- 保留舊系統ID作為external_id
- 支援新舊API並行（過渡期3個月）
- 提供資料同步機制

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/customers/search` | 搜尋客戶 | 🟡 開發中 |
| GET | `/api/v1/customers/{id}` | 獲取客戶詳情 | 🔴 未開始 |
| POST | `/api/v1/customers` | 新增客戶 | 🔴 未開始 |
| PUT | `/api/v1/customers/{id}` | 更新客戶 | 🔴 未開始 |
| DELETE | `/api/v1/customers/{id}` | 刪除客戶 | 🔴 未開始 |
| GET | `/api/v1/customers/{id}/hierarchy` | 獲取階層關係 | 🔴 未開始 |

## 測試需求

### 單元測試
- [ ] 搜尋功能測試
- [ ] 資料驗證測試
- [ ] 階層關係邏輯測試
- [ ] API 端點測試

### 整合測試
- [ ] 完整客戶建立流程
- [ ] 搜尋到編輯流程
- [ ] 階層關係設定流程
- [ ] 資料遷移驗證

### 驗收測試
- [ ] 場景1：新增企業客戶並設定下層公司
- [ ] 場景2：搜尋並編輯客戶資料
- [ ] 場景3：批量匯入客戶資料

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎功能 | Week 1-2 | 搜尋、基本CRUD |
| 階段2：進階功能 | Week 3-4 | 階層關係、物流設定 |
| 階段3：會計功能 | Week 5 | 會計資訊管理 |
| 階段4：測試整合 | Week 6 | 完整測試、bug修復 |

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 資料遷移失敗 | 高 | 中 | 完整備份、分階段遷移 |
| 效能問題 | 中 | 中 | 建立索引、快取機制 |
| 新舊系統不一致 | 高 | 低 | 雙寫機制、資料同步 |

## 相關文件
- [舊系統代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Client)
- [CRM模組架構文件](../README.md)
- [API規範文件](../../api-docs/crm-api.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0-migration | 2025-08-20 | 初始轉移版本 | System |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-09-01