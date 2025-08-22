# 庫存總覽與明細 PRD 文件

## 模組資訊
- **模組代碼**: 08.1-WMS-IOD
- **模組名稱**: Inventory Overview & Details (庫存總覽與明細)
- **負責人**: 菜蟲農食 ERP 團隊
- **最後更新**: 2025-08-22
- **版本**: v1.0.0

## 模組概述
庫存總覽與明細模組是倉儲管理系統的核心，提供即時庫存狀態監控、多維度庫存查詢、批號追蹤、以及庫存預警功能。支援農產品特殊的有效期管理和批次管理需求。

## 業務價值
- 提供即時準確的庫存資訊，降低庫存成本30%
- 減少過期損耗，提升庫存周轉率
- 支援多倉庫、多批次的精細化管理
- 預警機制降低缺貨風險95%

## 功能需求

### FR-WMS-IOD-001: 即時庫存總覽
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
展示全公司或特定倉庫的即時庫存總覽，包括總庫存價值、庫存分類統計、周轉率、庫齡分析等關鍵指標。

**功能需求細節**:
- **條件/觸發**: 當用戶訪問庫存總覽頁面或設定篩選條件時
- **行為**: 系統即時計算並展示庫存統計數據，支援倉庫、類別、狀態等多維度篩選
- **資料輸入**: 倉庫選擇、日期範圍、品項類別、庫存狀態篩選
- **資料輸出**: 總庫存量、總庫存價值、分類統計、周轉率、庫齡分布圖表
- **UI反應**: 載入動畫、數據卡片展示、圖表互動、篩選器即時更新
- **例外處理**: 無權限倉庫隱藏、計算超時提示、數據異常警告

**用戶故事**:
作為倉庫管理員，
我希望即時查看各倉庫的庫存狀況，
以便做出調撥和採購決策。

**驗收標準**:
```yaml
- 條件: 用戶選擇特定倉庫
  預期結果: 2秒內顯示該倉庫的即時庫存統計
  
- 條件: 切換日期範圍篩選
  預期結果: 即時更新庫齡分析和周轉率數據
  
- 條件: 庫存數據異常（如負庫存）
  預期結果: 顯示紅色警告標記並列出異常項目
```

**技術需求**:
- **API 端點**: `GET /api/v1/inventory/overview`
- **請求/回應**: 詳見API規格章節
- **數據模型**: InventorySnapshot, InventoryMetrics
- **權限要求**: inventory.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-WMS-IOD-001.test.ts`
  - 整合測試: `tests/integration/FR-WMS-IOD-001.integration.test.ts`
  - E2E測試: `tests/e2e/FR-WMS-IOD-001.e2e.test.ts`
- **Code**: `src/modules/wms/inventory/overview/`
- **TOC**: `TOC Modules.md` 第194行

**依賴關係**:
- **依賴模組**: BDM (單位轉換), IM (品項主檔)
- **依賴功能**: FR-BDM-UCONV-001, FR-IM-IM-001
- **外部服務**: Redis 快取服務

---

### FR-WMS-IOD-002: 庫存明細查詢
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
提供詳細的庫存明細查詢功能，支援按品項、批號、儲位、有效期等多維度查詢，並支援匯出功能。

**功能需求細節**:
- **條件/觸發**: 當用戶執行庫存查詢或掃描條碼時
- **行為**: 系統根據查詢條件返回詳細庫存記錄，支援分頁和排序
- **資料輸入**: 品項編號/名稱、批號、儲位、有效期範圍、庫存狀態
- **資料輸出**: 庫存明細列表、可用量、在途量、預留量、儲位資訊
- **UI反應**: 搜尋自動完成、結果高亮、懶加載、匯出進度條
- **例外處理**: 查無資料提示、查詢超時處理、匯出檔案過大警告

**用戶故事**:
作為採購人員，
我希望查詢特定品項的詳細庫存狀況，
以便決定是否需要補貨。

**驗收標準**:
```yaml
- 條件: 輸入品項名稱關鍵字
  預期結果: 顯示模糊匹配的品項列表供選擇
  
- 條件: 查詢結果超過1000筆
  預期結果: 自動分頁顯示，每頁50筆
  
- 條件: 點擊匯出Excel
  預期結果: 生成包含所有欄位的Excel檔案
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/inventory/details`
  - `POST /api/v1/inventory/export`
- **請求/回應**: 詳見API規格章節
- **數據模型**: InventoryDetail, BatchInfo, LocationInfo
- **權限要求**: inventory.view, inventory.export
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-WMS-IOD-002.test.ts`
  - 整合測試: `tests/integration/FR-WMS-IOD-002.integration.test.ts`
  - E2E測試: `tests/e2e/FR-WMS-IOD-002.e2e.test.ts`
- **Code**: `src/modules/wms/inventory/details/`
- **TOC**: `TOC Modules.md` 第194行

**依賴關係**:
- **依賴模組**: IM (品項資訊), WMS-BTM (批號管理)
- **依賴功能**: FR-IM-IM-001, FR-WMS-BTM-001
- **外部服務**: ElasticSearch 搜尋引擎

---

### FR-WMS-IOD-003: 庫存預警管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
設定和管理庫存預警規則，包括安全庫存、最高庫存、有效期預警等，並支援自動通知相關人員。

**功能需求細節**:
- **條件/觸發**: 當庫存水位觸及預設閾值或系統定時檢查時
- **行為**: 系統自動檢測並發送預警通知，記錄預警歷史
- **資料輸入**: 品項選擇、預警類型、閾值設定、通知對象、檢查頻率
- **資料輸出**: 預警列表、預警趨勢、處理狀態、通知記錄
- **UI反應**: 預警標記顏色（紅黃綠）、彈出通知、聲音提醒
- **例外處理**: 重複預警合併、預警升級機制、通知失敗重試

**用戶故事**:
作為倉庫主管，
我希望系統自動監控庫存水位並及時預警，
以便預防缺貨或過期損失。

**驗收標準**:
```yaml
- 條件: 庫存低於安全庫存
  預期結果: 立即發送預警通知給指定人員
  
- 條件: 產品有效期剩餘7天
  預期結果: 標記為黃色預警並每日提醒
  
- 條件: 連續3天未處理預警
  預期結果: 自動升級通知主管
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/inventory/alerts`
  - `POST /api/v1/inventory/alert-rules`
  - `PUT /api/v1/inventory/alerts/{id}/acknowledge`
- **請求/回應**: 詳見API規格章節
- **數據模型**: AlertRule, InventoryAlert, AlertHistory
- **權限要求**: inventory.alert.view, inventory.alert.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-WMS-IOD-003.test.ts`
  - 整合測試: `tests/integration/FR-WMS-IOD-003.integration.test.ts`
  - E2E測試: `tests/e2e/FR-WMS-IOD-003.e2e.test.ts`
- **Code**: `src/modules/wms/inventory/alerts/`
- **TOC**: `TOC Modules.md` 第194行

**依賴關係**:
- **依賴模組**: DSH-NC (通知中心), SA-NWS (通知設定)
- **依賴功能**: FR-DSH-NC-001, FR-SA-NWS-001
- **外部服務**: 排程服務(Cron), Email/SMS服務

---

### FR-WMS-IOD-004: 批號與效期管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
管理農產品的批號資訊和有效期，支援FIFO/FEFO出貨策略，追蹤批號的完整生命週期。

**功能需求細節**:
- **條件/觸發**: 當入庫登記批號或執行出貨分配時
- **行為**: 系統自動分配批號、計算有效期、執行出貨策略
- **資料輸入**: 批號、生產日期、有效期、供應商批號、品質等級
- **資料輸出**: 批號清單、效期分布、即將到期清單、批號追蹤記錄
- **UI反應**: 效期顏色標示、到期倒數顯示、批號自動建議
- **例外處理**: 批號重複檢查、效期異常警告、強制使用確認

**用戶故事**:
作為品管人員，
我希望追蹤每個批號的完整履歷，
以便在品質問題時快速追溯。

**驗收標準**:
```yaml
- 條件: 新品入庫登記
  預期結果: 自動生成唯一批號並計算有效期
  
- 條件: 執行FEFO出貨
  預期結果: 優先分配最早到期的批次
  
- 條件: 查詢批號履歷
  預期結果: 顯示完整的入出庫記錄和品質檢驗記錄
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/inventory/batches`
  - `GET /api/v1/inventory/batches/{batchNo}`
  - `GET /api/v1/inventory/expiry-report`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Batch, ExpiryInfo, BatchHistory
- **權限要求**: inventory.batch.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-WMS-IOD-004.test.ts`
  - 整合測試: `tests/integration/FR-WMS-IOD-004.integration.test.ts`
  - E2E測試: `tests/e2e/FR-WMS-IOD-004.e2e.test.ts`
- **Code**: `src/modules/wms/inventory/batch/`
- **TOC**: `TOC Modules.md` 第196行

**依賴關係**:
- **依賴模組**: WMS-BTM (批號主檔), MES (生產批號)
- **依賴功能**: FR-WMS-BTM-001, FR-MES-MBU-001
- **外部服務**: 無

---

### FR-WMS-IOD-005: 多倉庫庫存調撥
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
支援多倉庫間的庫存調撥申請、審核和執行，包括調撥建議和成本計算。

**功能需求細節**:
- **條件/觸發**: 當發起調撥申請或系統檢測到庫存不平衡時
- **行為**: 創建調撥單、執行審核流程、更新庫存、計算調撥成本
- **資料輸入**: 來源倉庫、目標倉庫、品項清單、數量、調撥原因
- **資料輸出**: 調撥單、審核狀態、預計到貨時間、調撥成本
- **UI反應**: 拖放式調撥、庫存餘量即時顯示、審核流程圖
- **例外處理**: 庫存不足提示、審核逾時提醒、調撥失敗回滾

**用戶故事**:
作為供應鏈經理，
我希望優化各倉庫間的庫存分配，
以降低整體庫存成本。

**驗收標準**:
```yaml
- 條件: 創建調撥申請
  預期結果: 即時檢查來源庫存並預留數量
  
- 條件: 調撥審核通過
  預期結果: 自動創建出入庫單據並更新庫存
  
- 條件: 調撥在途查詢
  預期結果: 顯示即時位置和預計到達時間
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/inventory/transfers`
  - `PUT /api/v1/inventory/transfers/{id}/approve`
  - `GET /api/v1/inventory/transfers/in-transit`
- **請求/回應**: 詳見API規格章節
- **數據模型**: TransferOrder, TransferItem, TransferApproval
- **權限要求**: inventory.transfer.create, inventory.transfer.approve
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-WMS-IOD-005.test.ts`
  - 整合測試: `tests/integration/FR-WMS-IOD-005.integration.test.ts`
  - E2E測試: `tests/e2e/FR-WMS-IOD-005.e2e.test.ts`
- **Code**: `src/modules/wms/inventory/transfer/`
- **TOC**: `TOC Modules.md` 第197行

**依賴關係**:
- **依賴模組**: LM (物流管理), FA (成本計算)
- **依賴功能**: FR-LM-DSRO-001, FR-FA-PMAR-001
- **外部服務**: 工作流引擎

## 非功能需求

### 性能需求
- 庫存查詢響應時間：< 1秒
- 批量匯出處理：< 10秒/萬筆
- 即時庫存更新延遲：< 2秒
- 並發查詢支援：500+

### 安全需求
- 庫存數據加密存儲
- 調撥審核多級授權
- 敏感操作日誌記錄
- 資料存取權限分倉控管

### 可用性需求
- 系統可用性：99.95%
- 支援離線庫存盤點
- 自動故障切換
- 數據備份頻率：每小時

## 數據模型

### 主要實體
```typescript
interface InventorySnapshot {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  availableQty: number;
  reservedQty: number;
  inTransitQty: number;
  unitCost: number;
  totalValue: number;
  lastUpdated: Date;
  batchDetails: BatchInfo[];
}

interface BatchInfo {
  batchNo: string;
  quantity: number;
  productionDate: Date;
  expiryDate: Date;
  qualityGrade: string;
  supplierBatchNo?: string;
  location: string;
  status: 'available' | 'reserved' | 'quarantine' | 'expired';
}

interface InventoryAlert {
  id: string;
  alertType: 'low_stock' | 'overstock' | 'expiry' | 'quality';
  severity: 'critical' | 'warning' | 'info';
  itemId: string;
  warehouseId: string;
  currentValue: number;
  threshold: number;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

interface TransferOrder {
  id: string;
  transferNo: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  items: TransferItem[];
  requestedBy: string;
  approvedBy?: string;
  estimatedArrival?: Date;
  actualArrival?: Date;
  transferCost: number;
  notes?: string;
  createdAt: Date;
}
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/inventory/overview` | 獲取庫存總覽 | 🔴 未開始 |
| GET | `/api/v1/inventory/details` | 查詢庫存明細 | 🔴 未開始 |
| POST | `/api/v1/inventory/export` | 匯出庫存報表 | 🔴 未開始 |
| GET | `/api/v1/inventory/alerts` | 獲取庫存預警 | 🔴 未開始 |
| POST | `/api/v1/inventory/alert-rules` | 設定預警規則 | 🔴 未開始 |
| POST | `/api/v1/inventory/batches` | 創建批號 | 🔴 未開始 |
| GET | `/api/v1/inventory/expiry-report` | 效期報表 | 🔴 未開始 |
| POST | `/api/v1/inventory/transfers` | 創建調撥單 | 🔴 未開始 |

### 請求/回應範例

#### 獲取庫存總覽
```json
// 請求
GET /api/v1/inventory/overview?warehouseId=wh001&period=current

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "summary": {
      "totalValue": 15680000,
      "totalItems": 1250,
      "totalSKUs": 450,
      "averageTurnover": 12.5
    },
    "categories": [
      {
        "category": "蔬菜類",
        "value": 5680000,
        "quantity": 15000,
        "percentage": 36.2
      }
    ],
    "aging": {
      "0-7days": 45,
      "8-30days": 30,
      "31-90days": 20,
      "over90days": 5
    },
    "alerts": {
      "critical": 3,
      "warning": 12,
      "info": 25
    }
  },
  "timestamp": "2025-08-22T10:30:00Z"
}
```

### 資料庫結構
```sql
-- 庫存快照表
CREATE TABLE inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  item_id UUID NOT NULL REFERENCES items(id),
  quantity DECIMAL(15,3) NOT NULL CHECK (quantity >= 0),
  available_qty DECIMAL(15,3) NOT NULL,
  reserved_qty DECIMAL(15,3) NOT NULL DEFAULT 0,
  in_transit_qty DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15,4),
  total_value DECIMAL(15,2),
  last_counted_at TIMESTAMP,
  last_movement_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(warehouse_id, item_id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_item (item_id),
  INDEX idx_quantity (quantity),
  INDEX idx_updated (updated_at)
);

-- 批號資訊表
CREATE TABLE batch_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_no VARCHAR(50) UNIQUE NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity DECIMAL(15,3) NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE,
  quality_grade VARCHAR(10),
  supplier_batch_no VARCHAR(50),
  location VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_batch_no (batch_no),
  INDEX idx_expiry (expiry_date),
  INDEX idx_status (status)
);

-- 庫存預警規則表
CREATE TABLE inventory_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  warehouse_id UUID REFERENCES warehouses(id),
  alert_type VARCHAR(20) NOT NULL,
  threshold_value DECIMAL(15,3) NOT NULL,
  comparison_operator VARCHAR(10) NOT NULL,
  notification_emails TEXT[],
  check_frequency INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_item_warehouse (item_id, warehouse_id),
  INDEX idx_active (is_active)
);

-- 調撥單表
CREATE TABLE transfer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_no VARCHAR(30) UNIQUE NOT NULL,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  requested_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  transfer_cost DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_transfer_no (transfer_no),
  INDEX idx_status (status),
  INDEX idx_warehouses (from_warehouse_id, to_warehouse_id)
);
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎架構 | Week 1 | 資料模型、API框架 |
| 階段2：核心功能 | Week 2-3 | 庫存查詢、批號管理 |
| 階段3：預警系統 | Week 4 | 預警規則、通知機制 |
| 階段4：調撥功能 | Week 5 | 調撥流程、審核機制 |
| 階段5：測試優化 | Week 6 | 整合測試、性能優化 |

### 里程碑
- [ ] M1：基礎庫存查詢功能 - 2025-09-05
- [ ] M2：批號與效期管理完成 - 2025-09-12
- [ ] M3：預警系統上線 - 2025-09-19
- [ ] M4：調撥功能完成 - 2025-09-26
- [ ] M5：全模組整合測試通過 - 2025-10-03

## 風險評估
| 風險項目 | 可能性 | 影響 | 緩解措施 |
|----------|--------|------|----------|
| 資料遷移複雜 | 高 | 高 | 分階段遷移、保留雙軌運行 |
| 即時性能要求高 | 中 | 高 | 使用快取、讀寫分離架構 |
| 批號追溯需求變更 | 中 | 中 | 預留擴展欄位、模組化設計 |
| 多倉庫同步延遲 | 低 | 高 | 使用消息隊列、最終一致性 |

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-22 | 初始版本創建 | ERP Team |

---

**文件狀態**: 草稿
**下次審查日期**: 2025-08-29