# 【舊系統轉移】OM-OL 訂單列表模組 PRD

## 轉移資訊
- **來源系統**: tsaitung-dashboard-central (北區)  
- **原始頁面**: 
  - `/order/` - 訂單管理主頁
  - `/order-list/` - 訂單列表
  - `/order/[date]/` - 日期訂單查詢
  - `/order/[date]/[order_id]/` - 訂單詳情
  - `/order-summary/` - 訂單統計
  - `/order-picture/` - 訂單處理照片
- **原始代碼位置**: 
  - `/libs/tsaitung-dashboard/Order/`
  - `/libs/tsaitung-dashboard/OrderList/`
  - `/libs/tsaitung-dashboard/OrderSummary/`
  - `/libs/tsaitung-dashboard/OrderPicture/`
- **轉移類型**: 功能保留型轉移
- **轉移優先級**: P1-高（核心業務）
- **最後更新**: 2025-08-20

## 模組資訊
- **模組代碼**: OM-OL
- **模組名稱**: 訂單列表管理 (Order List Management)
- **負責人**: [待指派]
- **版本**: v1.0.0-migration

## 模組概述
訂單管理模組是ERP系統的核心業務模組，負責處理從訂單建立、編輯、確認到出貨的完整生命週期管理。包含訂單查詢、狀態追蹤、訂單修改、批量操作等功能，並提供訂單統計分析和處理照片管理。

## 舊系統功能分析

### 現有功能清單

#### 訂單管理核心功能
1. **訂單查詢**
   - 多條件搜尋（客戶、日期、狀態、商品）
   - 快速篩選（今日訂單、待處理、已完成）
   - 訂單排序（時間、金額、客戶）

2. **訂單操作**
   - 新增訂單
   - 編輯訂單（商品、數量、價格）
   - 複製訂單
   - 取消訂單
   - 訂單確認

3. **訂單狀態管理**
   - 待確認 → 已確認 → 處理中 → 已出貨 → 已完成
   - 異常訂單標記
   - 緊急訂單處理

4. **批量操作**
   - 批量確認
   - 批量列印
   - 批量匯出
   - 批量狀態更新

#### 訂單詳情功能
1. **基本資訊**
   - 客戶資訊
   - 配送資訊
   - 付款資訊
   - 訂單備註

2. **商品明細**
   - 商品清單
   - 數量/單位
   - 單價/小計
   - 贈品/折扣

3. **歷史記錄**
   - 修改記錄
   - 狀態變更記錄
   - 操作人員記錄

#### 訂單統計功能
1. **營業統計**
   - 日/週/月營業額
   - 訂單數量統計
   - 客戶訂單分析

2. **商品統計**
   - 熱銷商品排行
   - 商品銷售趨勢
   - 缺貨預警

#### 訂單處理照片
1. **照片上傳**
   - 處理前/後照片
   - 品質檢查照片
   - 包裝照片

2. **照片管理**
   - 照片分類
   - 照片審核
   - 客戶查看權限

### 保留與改進

#### 需保留功能
- 完整的訂單生命週期管理
- 多維度搜尋和篩選
- 批量操作功能
- 訂單歷史追蹤
- 營業統計報表
- 照片管理系統

#### 計劃改進項目
- 訂單自動分配邏輯
- 智能訂單推薦
- 預測性庫存提醒
- 訂單異常自動偵測
- 移動端訂單管理
- API整合（第三方平台訂單）
- 實時訂單追蹤
- 客戶自助查詢

## 功能需求

### FR-OM-OL-001: 訂單查詢列表
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
提供強大的訂單查詢功能，支援多條件組合搜尋，快速定位目標訂單。

**功能需求細節**:
- **條件/觸發**: 進入訂單列表頁面或設定搜尋條件
- **行為**: 查詢並顯示符合條件的訂單
- **資料輸入**: 
  - 訂單編號
  - 客戶名稱/代碼
  - 訂單日期範圍
  - 訂單狀態
  - 商品名稱
  - 金額範圍
- **資料輸出**: 訂單列表（編號、客戶、金額、狀態、日期）
- **UI反應**: 分頁顯示、即時搜尋、載入狀態
- **例外處理**: 無結果提示、搜尋錯誤處理

**驗收標準**:
```yaml
- 條件: 輸入訂單編號
  預期結果: 直接顯示該訂單
  
- 條件: 選擇日期範圍
  預期結果: 顯示該期間所有訂單
  
- 條件: 組合多個條件
  預期結果: 顯示同時符合所有條件的訂單
```

**技術需求**:
- **API 端點**: `GET /api/v1/orders`
- **請求參數**:
  ```json
  {
    "order_no": "string",
    "customer_id": "string",
    "date_from": "YYYY-MM-DD",
    "date_to": "YYYY-MM-DD",
    "status": "pending|confirmed|processing|shipped|completed",
    "page": 1,
    "limit": 20
  }
  ```

### FR-OM-OL-002: 訂單建立編輯
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
提供訂單的新增和編輯功能，包含客戶選擇、商品選擇、價格計算、配送設定等。

**功能需求細節**:
- **條件/觸發**: 點擊新增訂單或編輯現有訂單
- **行為**: 開啟訂單編輯介面
- **資料輸入**: 
  - 客戶資訊（必填）
  - 商品明細（品項、數量、單價）
  - 配送資訊（地址、時間、方式）
  - 付款條件
  - 訂單備註
  - 特殊要求
- **資料輸出**: 儲存的訂單資料
- **UI反應**: 即時金額計算、庫存檢查、價格自動帶入
- **例外處理**: 必填驗證、庫存不足警告、信用額度檢查

**驗收標準**:
```yaml
- 條件: 選擇客戶
  預期結果: 自動帶入客戶預設配送地址和付款條件
  
- 條件: 選擇商品
  預期結果: 自動帶入客戶專屬價格，計算小計
  
- 條件: 庫存不足
  預期結果: 顯示警告但允許繼續
```

### FR-OM-OL-003: 訂單狀態管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
管理訂單的狀態流轉，記錄狀態變更歷史，支援批量狀態更新。

**功能需求細節**:
- **條件/觸發**: 執行訂單操作或狀態更新
- **行為**: 更新訂單狀態並記錄
- **資料輸入**: 
  - 目標狀態
  - 變更原因
  - 操作備註
- **資料輸出**: 更新後的訂單狀態
- **UI反應**: 狀態顏色標示、進度條顯示
- **例外處理**: 狀態流轉規則檢查、權限驗證

### FR-OM-OL-004: 訂單批量操作
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
提供訂單的批量處理功能，提高作業效率。

**功能需求細節**:
- **條件/觸發**: 選擇多筆訂單執行批量操作
- **行為**: 批量執行指定操作
- **資料輸入**: 
  - 選中的訂單清單
  - 操作類型（確認、列印、匯出、狀態更新）
- **資料輸出**: 操作結果報告
- **UI反應**: 進度顯示、結果統計
- **例外處理**: 部分失敗處理、錯誤重試

### FR-OM-OL-005: 訂單統計分析
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
提供訂單的統計分析功能，支援營業分析和決策。

**功能需求細節**:
- **條件/觸發**: 進入統計頁面或生成報表
- **行為**: 計算並顯示統計資料
- **資料輸入**: 
  - 統計期間
  - 統計維度（客戶、商品、區域）
  - 統計指標（金額、數量、頻率）
- **資料輸出**: 統計圖表和明細
- **UI反應**: 圖表視覺化、匯出功能
- **例外處理**: 資料不足提示

### FR-OM-OL-006: 訂單處理照片
**狀態**: 🔴 未開始  
**優先級**: P3

**功能描述**:
管理訂單處理過程的照片，提供品質追溯和客戶查詢。

**功能需求細節**:
- **條件/觸發**: 上傳或查看訂單照片
- **行為**: 儲存和顯示訂單相關照片
- **資料輸入**: 
  - 照片檔案
  - 照片類型（處理前/後、包裝、品檢）
  - 照片說明
- **資料輸出**: 照片URL和縮圖
- **UI反應**: 照片預覽、放大檢視
- **例外處理**: 檔案大小限制、格式驗證

## 數據模型

### 主要實體
```typescript
// 訂單主檔
interface Order {
  order_id: string;
  order_no: string;
  order_date: Date;
  customer_id: string;
  customer_name: string;
  
  // 金額資訊
  subtotal: number;
  tax_amount: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  
  // 狀態資訊
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  
  // 配送資訊
  delivery_date: Date;
  delivery_time_slot: string;
  delivery_address: string;
  delivery_method: string;
  
  // 其他資訊
  notes: string;
  internal_notes: string;
  source: string; // 訂單來源
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// 訂單明細
interface OrderItem {
  item_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_rate: number;
  subtotal: number;
  notes: string;
  is_gift: boolean;
}

// 訂單狀態
enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 訂單歷史
interface OrderHistory {
  history_id: string;
  order_id: string;
  action: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: Date;
  notes: string;
}

// 訂單照片
interface OrderPhoto {
  photo_id: string;
  order_id: string;
  photo_type: 'before' | 'after' | 'packaging' | 'quality';
  photo_url: string;
  thumbnail_url: string;
  description: string;
  uploaded_by: string;
  uploaded_at: Date;
}
```

## 數據遷移策略

### 遷移方式
- **策略**: 增量遷移 + 雙寫機制
- **階段**: 
  1. 第一階段：遷移歷史訂單（3個月內）- 1週
  2. 第二階段：遷移所有歷史訂單 - 2週
  3. 第三階段：雙寫新訂單 - 2週
  4. 第四階段：切換到新系統 - 3天

### 數據映射
| 舊系統欄位 | 新系統欄位 | 轉換規則 |
|-----------|-----------|----------|
| order_id | order_no | 保留原值作為訂單編號 |
| client_id | customer_id | 客戶ID映射 |
| delivery_date | delivery_date | 日期格式統一 |
| total_price | total_amount | 金額欄位重命名 |
| order_status | status | 狀態值映射 |

### 相容性處理
- 新舊訂單編號並存
- API支援新舊格式
- 提供資料同步檢查工具

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/orders` | 訂單列表 | 🟡 開發中 |
| GET | `/api/v1/orders/{id}` | 訂單詳情 | 🟡 開發中 |
| POST | `/api/v1/orders` | 建立訂單 | 🔴 未開始 |
| PUT | `/api/v1/orders/{id}` | 更新訂單 | 🔴 未開始 |
| DELETE | `/api/v1/orders/{id}` | 取消訂單 | 🔴 未開始 |
| POST | `/api/v1/orders/{id}/confirm` | 確認訂單 | 🔴 未開始 |
| GET | `/api/v1/orders/{id}/history` | 訂單歷史 | 🔴 未開始 |
| POST | `/api/v1/orders/{id}/photos` | 上傳照片 | 🔴 未開始 |
| GET | `/api/v1/orders/statistics` | 訂單統計 | 🔴 未開始 |

### 請求/響應範例
```json
// GET /api/v1/orders
{
  "data": [
    {
      "order_id": "ORD-20250820-001",
      "order_no": "ORD-20250820-001",
      "order_date": "2025-08-20",
      "customer_name": "測試客戶",
      "total_amount": 10000,
      "status": "confirmed",
      "items": [
        {
          "product_name": "商品A",
          "quantity": 10,
          "unit_price": 1000,
          "subtotal": 10000
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

## 測試需求

### 單元測試
- [ ] 訂單計算邏輯測試
- [ ] 狀態流轉測試
- [ ] 資料驗證測試
- [ ] 權限控制測試

### 整合測試
- [ ] 完整下單流程測試
- [ ] 訂單修改流程測試
- [ ] 批量操作測試
- [ ] 新舊系統同步測試

### 驗收測試
- [ ] 場景1：客戶下單到出貨完整流程
- [ ] 場景2：訂單修改和取消
- [ ] 場景3：批量處理多筆訂單
- [ ] 場景4：訂單統計報表生成

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎功能 | Week 1-2 | 訂單CRUD、查詢 |
| 階段2：核心流程 | Week 3-4 | 狀態管理、訂單確認 |
| 階段3：批量功能 | Week 5 | 批量操作、匯出 |
| 階段4：統計功能 | Week 6 | 統計分析、報表 |
| 階段5：附加功能 | Week 7 | 照片管理、通知 |
| 階段6：整合測試 | Week 8 | 系統整合、優化 |

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 資料遷移失敗 | 高 | 中 | 分批遷移、完整備份 |
| 效能問題 | 高 | 中 | 資料庫優化、快取機制 |
| 資料不一致 | 高 | 低 | 雙寫驗證、對帳機制 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 訂單遺失 | 極高 | 低 | 雙系統備份、即時監控 |
| 操作錯誤 | 中 | 中 | 操作培訓、權限控制 |

## 非功能需求

### 性能需求
- 訂單查詢響應 < 2秒
- 訂單建立 < 3秒
- 批量處理100筆 < 30秒
- 支援10000筆/日訂單量

### 安全需求
- 訂單資料加密傳輸
- 操作日誌完整記錄
- 敏感資料遮蔽

### 可用性需求
- 系統可用性 99.95%
- 24/7運行（除維護時間）
- 支援100個並發用戶

## 相關文件
- [舊系統Order代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Order)
- [訂單管理業務流程](../../docs/order-process.md)
- [OM模組架構文件](../README.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0-migration | 2025-08-20 | 初始轉移版本 | System |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-09-01