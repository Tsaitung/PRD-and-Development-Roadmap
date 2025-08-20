# 【舊系統轉移】WMS-IOD 庫存總覽與詳情模組 PRD

## 轉移資訊
- **來源系統**: tsaitung-dashboard-central (北區)
- **原始頁面**: 
  - `/inventory/` - 庫存總覽
  - `/inventory/[siteId]/` - 據點庫存詳情
  - `/inventory/[siteId]/inbound/new/` - 新增入庫
  - `/inventory/[siteId]/inbound/edit/[entryId]/` - 編輯入庫
  - `/inventory/dispose/` - 庫存報廢
  - `/daily-checklist/` - 每日盤點表
- **原始代碼位置**: 
  - `/libs/tsaitung-dashboard/Inventory/`
  - `/libs/tsaitung-dashboard/DailyChecklist/`
- **轉移類型**: 功能保留型轉移
- **轉移優先級**: P1-高（核心營運）
- **最後更新**: 2025-08-20

## 模組資訊
- **模組代碼**: WMS-IOD
- **模組名稱**: 庫存總覽與詳情 (Inventory Overview & Details)
- **負責人**: [待指派]
- **版本**: v1.0.0-migration

## 模組概述
庫存管理模組是倉儲管理系統的核心，負責即時追蹤商品庫存狀態、管理入出庫作業、執行盤點調整，並提供庫存分析報表。支援多據點庫存管理、批次追蹤、有效期管理等進階功能。

## 舊系統功能分析

### 現有功能清單

#### 庫存總覽功能
1. **庫存查詢**
   - 跨據點庫存查詢
   - 商品庫存即時狀態
   - 庫存分類統計
   - 低庫存預警

2. **庫存報表**
   - 庫存週轉率
   - 庫存價值分析
   - 過期商品追蹤
   - ABC分析

#### 據點庫存管理
1. **入庫管理**
   - 採購入庫
   - 調撥入庫
   - 退貨入庫
   - 生產入庫

2. **出庫管理**
   - 銷售出庫
   - 調撥出庫
   - 報廢出庫
   - 樣品出庫

3. **庫存調整**
   - 盤點調整
   - 損耗記錄
   - 單位轉換

#### 批次管理
1. **批號追蹤**
   - 批號建立
   - 批號查詢
   - 先進先出(FIFO)
   - 有效期管理

#### 每日盤點
1. **盤點作業**
   - 盤點單建立
   - 實際盤點輸入
   - 差異分析
   - 盤點確認

### 保留與改進

#### 需保留功能
- 多據點庫存管理架構
- 完整的入出庫類型
- 批次和有效期管理
- 盤點調整機制
- 庫存預警功能
- 歷史記錄追蹤

#### 計劃改進項目
- 條碼/QR碼掃描支援
- 智能補貨建議
- 庫位管理
- RFID整合
- 即時庫存同步
- 預測性庫存分析
- 移動端盤點APP
- 供應鏈協同

## 功能需求

### FR-WMS-IOD-001: 庫存即時查詢
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
提供跨據點的庫存即時查詢，支援多維度篩選和庫存狀態顯示。

**功能需求細節**:
- **條件/觸發**: 進入庫存頁面或執行搜尋
- **行為**: 查詢並顯示庫存資訊
- **資料輸入**: 
  - 商品名稱/代碼
  - 據點選擇
  - 商品分類
  - 庫存狀態（正常/預警/缺貨）
  - 批號/有效期
- **資料輸出**: 
  - 商品庫存列表
  - 可用庫存/凍結庫存
  - 在途庫存
  - 庫存金額
- **UI反應**: 即時更新、顏色標示狀態
- **例外處理**: 資料同步延遲提示

**驗收標準**:
```yaml
- 條件: 查詢特定商品
  預期結果: 顯示所有據點該商品庫存
  
- 條件: 庫存低於安全庫存
  預期結果: 紅色標示並顯示預警
  
- 條件: 選擇特定據點
  預期結果: 只顯示該據點庫存
```

**技術需求**:
- **API 端點**: `GET /api/v1/inventory`
- **請求參數**:
  ```json
  {
    "site_id": "string",
    "product_id": "string",
    "category": "string",
    "stock_status": "normal|warning|out_of_stock",
    "batch_no": "string"
  }
  ```

### FR-WMS-IOD-002: 入庫作業管理
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
管理各類型的入庫作業，包含數量驗收、品質檢查、上架確認。

**功能需求細節**:
- **條件/觸發**: 執行入庫作業
- **行為**: 建立入庫單並更新庫存
- **資料輸入**: 
  - 入庫類型（採購/調撥/退貨/生產）
  - 來源單據號
  - 商品明細（品項、數量、批號）
  - 驗收資訊
  - 存放位置
- **資料輸出**: 
  - 入庫單號
  - 更新後庫存
  - 入庫憑證
- **UI反應**: 步驟導引、即時驗證
- **例外處理**: 超收提醒、品質異常處理

### FR-WMS-IOD-003: 出庫作業管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
處理各類型出庫需求，確保庫存準確扣減和追蹤。

**功能需求細節**:
- **條件/觸發**: 執行出庫作業
- **行為**: 建立出庫單並扣減庫存
- **資料輸入**: 
  - 出庫類型（銷售/調撥/報廢/樣品）
  - 目標單據號
  - 商品明細
  - 批號選擇（FIFO）
- **資料輸出**: 
  - 出庫單號
  - 揀貨單
  - 庫存扣減記錄
- **UI反應**: 庫存檢查、批號建議
- **例外處理**: 庫存不足處理、凍結庫存檢查

### FR-WMS-IOD-004: 盤點調整作業
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
執行定期或臨時盤點，處理盤點差異調整。

**功能需求細節**:
- **條件/觸發**: 建立盤點任務
- **行為**: 記錄實際數量並調整差異
- **資料輸入**: 
  - 盤點範圍（全盤/抽盤/循環盤點）
  - 盤點商品清單
  - 實際數量輸入
  - 差異原因
- **資料輸出**: 
  - 盤點報告
  - 差異清單
  - 調整憑證
- **UI反應**: 差異高亮、複盤提示
- **例外處理**: 異常差異審批、鎖定庫存

### FR-WMS-IOD-005: 批次與效期管理
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
管理商品批次資訊和有效期，提供過期預警和批次追溯。

**功能需求細節**:
- **條件/觸發**: 批次商品入庫或查詢
- **行為**: 記錄批次資訊並追蹤
- **資料輸入**: 
  - 批號
  - 生產日期
  - 有效期限
  - 批次數量
- **資料輸出**: 
  - 批次庫存明細
  - 過期預警清單
  - 批次追溯報告
- **UI反應**: 效期顏色標示、到期提醒
- **例外處理**: 過期商品凍結、強制出庫

### FR-WMS-IOD-006: 庫存報廢處理
**狀態**: 🔴 未開始
**優先級**: P3

**功能描述**:
處理過期、損壞或其他原因的庫存報廢。

**功能需求細節**:
- **條件/觸發**: 發起報廢申請
- **行為**: 執行報廢流程並扣減庫存
- **資料輸入**: 
  - 報廢商品清單
  - 報廢原因
  - 報廢數量
  - 審批資訊
- **資料輸出**: 
  - 報廢單據
  - 庫存扣減
  - 財務沖銷憑證
- **UI反應**: 審批流程顯示
- **例外處理**: 審批駁回、部分報廢

### FR-WMS-IOD-007: 庫存分析報表
**狀態**: ⚪ 規劃中
**優先級**: P3

**功能描述**:
提供多維度的庫存分析報表，支援管理決策。

**功能需求細節**:
- **條件/觸發**: 生成報表需求
- **行為**: 計算並生成分析報表
- **資料輸入**: 
  - 報表類型
  - 分析期間
  - 篩選條件
- **資料輸出**: 
  - 庫存週轉率
  - ABC分析
  - 呆滯料分析
  - 庫存趨勢圖
- **UI反應**: 圖表視覺化、匯出功能
- **例外處理**: 資料不足提示

## 數據模型

### 主要實體
```typescript
// 庫存主檔
interface Inventory {
  inventory_id: string;
  site_id: string;
  site_name: string;
  product_id: string;
  product_name: string;
  
  // 庫存數量
  quantity_on_hand: number;      // 現有庫存
  quantity_available: number;    // 可用庫存
  quantity_reserved: number;     // 保留庫存
  quantity_in_transit: number;   // 在途庫存
  
  // 庫存屬性
  unit: string;
  batch_no?: string;
  expiry_date?: Date;
  location?: string;
  
  // 庫存價值
  unit_cost: number;
  total_value: number;
  
  // 管理資訊
  safety_stock: number;
  reorder_point: number;
  max_stock: number;
  
  last_inbound_date?: Date;
  last_outbound_date?: Date;
  last_count_date?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// 庫存異動記錄
interface InventoryTransaction {
  transaction_id: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUST';
  transaction_subtype: string;
  
  site_id: string;
  product_id: string;
  batch_no?: string;
  
  quantity: number;
  unit: string;
  unit_cost: number;
  
  // 關聯單據
  reference_type: string;
  reference_no: string;
  
  // 前後庫存
  quantity_before: number;
  quantity_after: number;
  
  notes?: string;
  created_by: string;
  created_at: Date;
}

// 盤點單
interface StockCount {
  count_id: string;
  count_no: string;
  count_date: Date;
  site_id: string;
  
  count_type: 'FULL' | 'PARTIAL' | 'CYCLE';
  status: 'DRAFT' | 'COUNTING' | 'COMPLETED' | 'CANCELLED';
  
  items: StockCountItem[];
  
  created_by: string;
  created_at: Date;
  completed_at?: Date;
}

// 盤點明細
interface StockCountItem {
  item_id: string;
  count_id: string;
  product_id: string;
  
  system_quantity: number;
  counted_quantity?: number;
  difference?: number;
  
  adjustment_reason?: string;
  adjusted_by?: string;
  adjusted_at?: Date;
}

// 批次資訊
interface BatchInfo {
  batch_id: string;
  batch_no: string;
  product_id: string;
  
  production_date?: Date;
  expiry_date?: Date;
  
  initial_quantity: number;
  current_quantity: number;
  
  supplier_batch?: string;
  quality_status: 'PASS' | 'HOLD' | 'REJECT';
  
  created_at: Date;
}
```

## 數據遷移策略

### 遷移方式
- **策略**: 快照遷移 + 增量同步
- **階段**: 
  1. 第一階段：遷移靜態主數據（1週）
  2. 第二階段：遷移當前庫存快照（2天）
  3. 第三階段：遷移歷史交易記錄（1週）
  4. 第四階段：增量同步和驗證（3天）

### 數據映射
| 舊系統欄位 | 新系統欄位 | 轉換規則 |
|-----------|-----------|----------|
| stock_qty | quantity_on_hand | 直接映射 |
| warehouse_id | site_id | ID映射表 |
| item_code | product_id | 商品代碼統一 |
| lot_no | batch_no | 批號格式標準化 |
| entry_date | created_at | 時間格式轉換 |

### 相容性處理
- 庫存數據雙寫期（1個月）
- 定時對帳機制（每小時）
- 差異報告和警報

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/inventory` | 查詢庫存 | 🟡 開發中 |
| GET | `/api/v1/inventory/{product_id}` | 商品庫存詳情 | 🔴 未開始 |
| POST | `/api/v1/inventory/inbound` | 入庫作業 | 🔴 未開始 |
| POST | `/api/v1/inventory/outbound` | 出庫作業 | 🔴 未開始 |
| POST | `/api/v1/inventory/adjust` | 庫存調整 | 🔴 未開始 |
| GET | `/api/v1/inventory/transactions` | 異動記錄 | 🔴 未開始 |
| POST | `/api/v1/inventory/count` | 建立盤點 | 🔴 未開始 |
| PUT | `/api/v1/inventory/count/{id}` | 更新盤點 | 🔴 未開始 |
| GET | `/api/v1/inventory/batch/{batch_no}` | 批次查詢 | 🔴 未開始 |
| GET | `/api/v1/inventory/reports` | 庫存報表 | 🔴 未開始 |

### 請求/響應範例
```json
// POST /api/v1/inventory/inbound
{
  "transaction_type": "PURCHASE",
  "reference_no": "PO-2025-001",
  "site_id": "SITE_001",
  "items": [
    {
      "product_id": "PROD_001",
      "quantity": 100,
      "unit": "KG",
      "batch_no": "BATCH_20250820",
      "expiry_date": "2026-08-20"
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "transaction_id": "TRX_001",
    "transaction_no": "IN-2025-0001",
    "items_processed": 1,
    "total_quantity": 100
  }
}
```

## 測試需求

### 單元測試
- [ ] 庫存計算邏輯測試
- [ ] FIFO/FEFO邏輯測試
- [ ] 批次管理測試
- [ ] 盤點差異計算測試

### 整合測試
- [ ] 完整入庫流程測試
- [ ] 出庫扣減測試
- [ ] 盤點調整流程測試
- [ ] 跨據點調撥測試

### 驗收測試
- [ ] 場景1：採購入庫到銷售出庫
- [ ] 場景2：執行週期盤點
- [ ] 場景3：批次商品效期管理
- [ ] 場景4：多據點庫存查詢

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎架構 | Week 1-2 | 庫存查詢、資料模型 |
| 階段2：入出庫 | Week 3-4 | 入庫、出庫作業 |
| 階段3：盤點功能 | Week 5 | 盤點、調整功能 |
| 階段4：批次管理 | Week 6 | 批次、效期管理 |
| 階段5：報表分析 | Week 7 | 統計報表、分析 |
| 階段6：整合優化 | Week 8 | 系統整合、優化 |

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 庫存數據不一致 | 極高 | 中 | 實時同步、定時對帳 |
| 效能瓶頸 | 高 | 中 | 分區查詢、快取優化 |
| 批次追溯失敗 | 中 | 低 | 完整日誌、備份機制 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 庫存短缺未預警 | 高 | 低 | 多級預警、即時通知 |
| 盤點差異過大 | 中 | 中 | 循環盤點、差異分析 |

## 非功能需求

### 性能需求
- 庫存查詢 < 1秒
- 入出庫處理 < 2秒
- 批量處理1000筆 < 30秒
- 支援100萬SKU管理

### 安全需求
- 庫存異動需要審計
- 關鍵操作雙重驗證
- 數據加密存儲

### 可用性需求
- 系統可用性 99.9%
- 7x24小時運行
- 支援200個並發用戶

## 相關文件
- [舊系統Inventory代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Inventory)
- [庫存管理業務流程](../../docs/inventory-process.md)
- [WMS模組架構文件](../README.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0-migration | 2025-08-20 | 初始轉移版本 | System |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-09-01