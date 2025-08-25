# [OM-OL] 訂單列表管理 PRD 文件

## 模組資訊
- **模組代碼**: OM-OL
- **模組名稱**: Order List / 訂單列表管理
- **負責人**: 產品團隊
- **最後更新**: 2025-08-22
- **版本**: v1.0.0

## 命名與狀態
- FR 命名: `FR-OM-OL-[序號]`
- 狀態語彙：`🔴 未開始`｜`🟡 開發中`｜`✅ 完成`｜`⚪ 規劃中`

## 模組概述
訂單列表管理模組是訂單管理系統的核心介面，提供訂單的綜合查詢、狀態追蹤、批量操作等功能。支援多維度篩選、即時狀態更新、訂單詳情查看，是業務人員日常作業的主要工具。

## 業務價值
- 提供統一的訂單管理平台，提升作業效率
- 即時掌握訂單狀態，減少處理延誤
- 支援批量操作，節省人力成本
- 完整的訂單追蹤，提升客戶滿意度

## 功能需求

### FR-OM-OL-001: 訂單列表展示與查詢
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
提供訂單的完整列表展示，支援多維度查詢、排序和分頁功能，讓用戶快速找到目標訂單。

**功能需求細節**:
- **條件/觸發**: 當用戶訪問訂單管理頁面或執行查詢操作時
- **行為**: 系統載入並顯示符合條件的訂單列表，支援即時搜尋和篩選
- **資料輸入**: 查詢條件(訂單號、客戶、日期範圍、狀態)、排序選項、頁碼
- **資料輸出**: 訂單列表(含關鍵欄位)、總筆數、統計資訊、分頁資訊
- **UI反應**: 載入動畫、搜尋即時回饋、排序視覺指示、無結果提示
- **例外處理**: 查詢逾時處理、無權限資料過濾、大量資料分批載入

**用戶故事**:
作為業務人員，
我希望能快速查詢和瀏覽所有訂單，
以便處理客戶需求和追蹤訂單狀態。

**驗收標準**:
```yaml
- 條件: 載入訂單列表頁面
  預期結果: 3秒內顯示最近100筆訂單
  
- 條件: 輸入訂單編號搜尋
  預期結果: 500ms內返回符合的訂單
  
- 條件: 使用多個篩選條件
  預期結果: 正確顯示符合所有條件的訂單
```

**技術需求**:
- **API 端點**: `GET /api/v1/orders`
- **請求/回應**: 
  ```json
  // 請求
  GET /api/v1/orders?status=pending&customer=C001&page=1&limit=50
  
  // 回應
  {
    "data": [
      {
        "orderId": "ORD-2025-0001",
        "customerName": "ABC公司",
        "orderDate": "2025-08-22",
        "totalAmount": 50000,
        "status": "pending"
      }
    ],
    "total": 1500,
    "page": 1,
    "limit": 50
  }
  ```
- **數據模型**: orders表、order_items表
- **權限要求**: order.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-OM-OL-001.test.ts`
- **Code**: `src/modules/om/order-list/`
- **TOC**: `TOC Modules.md` 第159行

**依賴關係**:
- **依賴模組**: CRM (客戶資料)、IM (品項資料)
- **依賴功能**: 無
- **外部服務**: 無

---

### FR-OM-OL-002: 訂單狀態管理
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
管理訂單的生命週期狀態，包括待確認、處理中、已出貨、已完成、已取消等，支援狀態變更和歷史記錄。

**功能需求細節**:
- **條件/觸發**: 當用戶更新訂單狀態或系統自動觸發狀態變更時
- **行為**: 系統驗證狀態轉換規則、更新訂單狀態、記錄變更歷史、發送通知
- **資料輸入**: 訂單ID、新狀態、變更原因、備註
- **資料輸出**: 更新結果、狀態變更時間、通知發送狀態
- **UI反應**: 狀態顏色標示、變更動畫、確認對話框、成功提示
- **例外處理**: 非法狀態轉換阻擋、併發更新衝突、回滾機制

**用戶故事**:
作為訂單處理人員，
我希望能更新訂單狀態並追蹤變更歷史，
以便確保訂單處理流程的透明度。

**驗收標準**:
```yaml
- 條件: 將待確認訂單改為處理中
  預期結果: 狀態成功更新並記錄變更歷史
  
- 條件: 嘗試將已完成訂單改回處理中
  預期結果: 系統阻擋並提示"不允許的狀態轉換"
  
- 條件: 批量更新10筆訂單狀態
  預期結果: 成功更新並顯示處理結果摘要
```

**技術需求**:
- **API 端點**: `PUT /api/v1/orders/{id}/status`
- **請求/回應**: 
  ```json
  // 請求
  {
    "status": "processing",
    "reason": "開始處理",
    "notes": "優先處理"
  }
  ```
- **數據模型**: orders表、order_status_logs表
- **權限要求**: order.update_status
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-OM-OL-002.test.ts`
- **Code**: `src/modules/om/order-status/`
- **TOC**: `TOC Modules.md` 第159行

**依賴關係**:
- **依賴模組**: DSH-NC (通知中心)
- **依賴功能**: 狀態機引擎
- **外部服務**: 郵件服務

---

### FR-OM-OL-003: 訂單詳情查看
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
提供訂單的完整詳情查看，包括基本資訊、商品明細、客戶資訊、配送資訊、付款資訊等。

**功能需求細節**:
- **條件/觸發**: 當用戶點擊訂單編號或查看詳情按鈕時
- **行為**: 系統載入並顯示訂單的所有相關資訊，支援分頁籤切換
- **資料輸入**: 訂單ID
- **資料輸出**: 訂單完整資訊、商品明細、狀態歷史、相關文件
- **UI反應**: 載入指示器、分頁籤切換、展開/收合區塊、列印預覽
- **例外處理**: 資料不完整提示、權限不足警告、關聯資料載入失敗

**用戶故事**:
作為客服人員，
我希望能查看訂單的完整資訊，
以便回答客戶詢問和處理問題。

**驗收標準**:
```yaml
- 條件: 點擊訂單編號
  預期結果: 2秒內載入並顯示訂單詳情
  
- 條件: 切換到商品明細頁籤
  預期結果: 顯示所有訂購商品及數量金額
  
- 條件: 查看已刪除的訂單
  預期結果: 顯示"訂單已刪除"狀態標記
```

**技術需求**:
- **API 端點**: `GET /api/v1/orders/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: orders表及相關聯表
- **權限要求**: order.view_detail
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-OM-OL-003.test.ts`
- **Code**: `src/modules/om/order-detail/`
- **TOC**: `TOC Modules.md` 第159行

**依賴關係**:
- **依賴模組**: CRM、IM、LM、FA
- **依賴功能**: 無
- **外部服務**: 無

---

### FR-OM-OL-004: 批量操作功能
**狀態**: ⚪ 規劃中
**優先級**: P1

**功能描述**:
支援訂單的批量操作，包括批量更新狀態、批量列印、批量匯出等功能。

**功能需求細節**:
- **條件/觸發**: 當用戶選擇多筆訂單並執行批量操作時
- **行為**: 系統驗證選擇的訂單、執行批量操作、顯示處理進度和結果
- **資料輸入**: 訂單ID陣列、操作類型、操作參數
- **資料輸出**: 處理結果摘要、成功/失敗清單、錯誤訊息
- **UI反應**: 選擇框、批量操作工具列、進度條、結果對話框
- **例外處理**: 部分失敗處理、操作回滾、衝突解決

**用戶故事**:
作為倉庫管理員，
我希望能批量更新訂單狀態，
以便提高處理效率。

**驗收標準**:
```yaml
- 條件: 選擇20筆訂單批量更新狀態
  預期結果: 顯示進度並在完成後顯示結果摘要
  
- 條件: 批量操作中有3筆失敗
  預期結果: 顯示17筆成功、3筆失敗及失敗原因
  
- 條件: 選擇超過100筆訂單
  預期結果: 提示"建議分批處理"警告
```

**技術需求**:
- **API 端點**: `POST /api/v1/orders/batch`
- **請求/回應**: 詳見API規格章節
- **數據模型**: orders表、batch_operations表
- **權限要求**: order.batch_operation
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-OM-OL-004.test.ts`
- **Code**: `src/modules/om/batch-operations/`
- **TOC**: `TOC Modules.md` 第159行

**依賴關係**:
- **依賴模組**: 無
- **依賴功能**: 批次處理引擎
- **外部服務**: 無

---

### FR-OM-OL-005: 訂單匯出功能
**狀態**: ⚪ 規劃中
**優先級**: P2

**功能描述**:
提供訂單資料的匯出功能，支援Excel、CSV、PDF等格式，可自定義匯出欄位。

**功能需求細節**:
- **條件/觸發**: 當用戶選擇匯出訂單資料時
- **行為**: 系統根據條件查詢資料、生成匯出檔案、提供下載連結
- **資料輸入**: 匯出條件、格式選擇、欄位選擇、日期範圍
- **資料輸出**: 匯出檔案、下載連結、匯出記錄
- **UI反應**: 匯出設定對話框、進度指示、下載提示
- **例外處理**: 資料量過大警告、匯出失敗重試、格式轉換錯誤

**用戶故事**:
作為財務人員，
我希望能匯出訂單資料進行分析，
以便製作報表和對帳。

**驗收標準**:
```yaml
- 條件: 匯出本月所有訂單為Excel
  預期結果: 30秒內生成檔案並提供下載
  
- 條件: 匯出超過10000筆資料
  預期結果: 提示分批匯出或發送郵件通知
  
- 條件: 自定義匯出欄位
  預期結果: 只匯出選擇的欄位資料
```

**技術需求**:
- **API 端點**: `POST /api/v1/orders/export`
- **請求/回應**: 詳見API規格章節
- **數據模型**: export_jobs表
- **權限要求**: order.export
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-OM-OL-005.test.ts`
- **Code**: `src/modules/om/export/`
- **TOC**: `TOC Modules.md` 第159行

**依賴關係**:
- **依賴模組**: 無
- **依賴功能**: 檔案生成服務
- **外部服務**: 檔案儲存服務

## 非功能需求

### 性能需求
- 頁面載入時間：< 3秒
- 查詢響應時間：< 2秒
- 批量操作：支援同時處理100筆
- 並發用戶：支援500個同時在線

### 安全需求
- 認證方式：JWT Token (有效期24小時)
- 授權模型：RBAC角色權限控制
- 敏感資料：客戶資訊加密儲存
- 操作日誌：所有變更需記錄

### 可用性需求
- 系統可用性：99.9%
- 瀏覽器支援：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- 響應式設計：支援平板和桌面
- 無障礙設計：符合WCAG 2.1 AA標準

## 數據模型

### 主要實體
```typescript
interface Order {
  id: string;                      // UUID
  orderNo: string;                 // 訂單編號
  customerId: string;              // 客戶ID
  customerName: string;            // 客戶名稱
  orderDate: Date;                 // 訂單日期
  deliveryDate?: Date;             // 交貨日期
  status: OrderStatus;             // 訂單狀態
  totalAmount: number;             // 總金額
  taxAmount: number;               // 稅額
  discountAmount: number;          // 折扣金額
  netAmount: number;               // 淨額
  paymentStatus: PaymentStatus;    // 付款狀態
  paymentTerms: string;            // 付款條件
  deliveryAddress: Address;        // 送貨地址
  billingAddress: Address;         // 帳單地址
  notes?: string;                  // 備註
  items: OrderItem[];              // 訂單明細
  attachments?: Attachment[];      // 附件
  createdBy: string;               // 建立者
  updatedBy: string;               // 更新者
  createdAt: Date;                 // 建立時間
  updatedAt: Date;                 // 更新時間
  deletedAt?: Date;                // 軟刪除時間
}

interface OrderItem {
  id: string;                      // UUID
  orderId: string;                 // 訂單ID
  itemId: string;                  // 品項ID
  itemName: string;                // 品項名稱
  itemCode: string;                // 品項代碼
  quantity: number;                // 數量
  unit: string;                    // 單位
  unitPrice: number;               // 單價
  amount: number;                  // 金額
  discountRate: number;            // 折扣率
  taxRate: number;                 // 稅率
  deliveryQuantity: number;        // 已交貨數量
  returnQuantity: number;          // 退貨數量
  notes?: string;                  // 備註
}

enum OrderStatus {
  DRAFT = 'draft',                 // 草稿
  PENDING = 'pending',             // 待確認
  CONFIRMED = 'confirmed',         // 已確認
  PROCESSING = 'processing',       // 處理中
  SHIPPED = 'shipped',             // 已出貨
  DELIVERED = 'delivered',         // 已送達
  COMPLETED = 'completed',         // 已完成
  CANCELLED = 'cancelled',         // 已取消
  RETURNED = 'returned'            // 已退貨
}

enum PaymentStatus {
  UNPAID = 'unpaid',               // 未付款
  PARTIAL = 'partial',             // 部分付款
  PAID = 'paid',                   // 已付款
  OVERDUE = 'overdue',             // 逾期
  REFUNDED = 'refunded'            // 已退款
}
```

### 資料庫結構
```sql
-- 訂單主檔表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(100) NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  payment_terms VARCHAR(50),
  delivery_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- 索引
  INDEX idx_order_no (order_no),
  INDEX idx_customer_id (customer_id),
  INDEX idx_order_date (order_date),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
);

-- 訂單明細表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  item_name VARCHAR(200) NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 5,
  delivery_quantity DECIMAL(15,3) DEFAULT 0,
  return_quantity DECIMAL(15,3) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_order_id (order_id),
  INDEX idx_item_id (item_id)
);

-- 訂單狀態歷史表
CREATE TABLE order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  reason VARCHAR(200),
  notes TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_order_id (order_id),
  INDEX idx_changed_at (changed_at)
);
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/orders` | 獲取訂單列表 | 🟡 開發中 |
| GET | `/api/v1/orders/{id}` | 獲取訂單詳情 | 🟡 開發中 |
| POST | `/api/v1/orders` | 創建訂單 | ⚪ 規劃中 |
| PUT | `/api/v1/orders/{id}` | 更新訂單 | ⚪ 規劃中 |
| DELETE | `/api/v1/orders/{id}` | 刪除訂單 | ⚪ 規劃中 |
| PUT | `/api/v1/orders/{id}/status` | 更新訂單狀態 | 🟡 開發中 |
| POST | `/api/v1/orders/batch` | 批量操作 | ⚪ 規劃中 |
| POST | `/api/v1/orders/export` | 匯出訂單 | ⚪ 規劃中 |
| GET | `/api/v1/orders/{id}/history` | 獲取狀態歷史 | ⚪ 規劃中 |

### 請求/響應範例

#### 獲取訂單列表
```json
// 請求
GET /api/v1/orders?status=pending&date_from=2025-08-01&date_to=2025-08-31

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "orderNo": "ORD-2025-0001",
        "customerName": "ABC公司",
        "orderDate": "2025-08-22",
        "deliveryDate": "2025-08-25",
        "status": "pending",
        "totalAmount": 50000,
        "paymentStatus": "unpaid",
        "itemCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1500,
      "totalPages": 30
    },
    "summary": {
      "totalOrders": 1500,
      "totalAmount": 75000000,
      "pendingOrders": 150,
      "processingOrders": 300
    }
  }
}
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎功能 | Week 1-2 | FR-001, FR-002, FR-003 |
| 階段2：進階功能 | Week 3 | FR-004, FR-005 |
| 階段3：整合測試 | Week 4 | 完整測試、效能優化 |
| 階段4：部署上線 | Week 5 | 生產環境部署 |

### 里程碑
- [ ] M1：基礎查詢功能完成 - 2025-09-05
- [ ] M2：狀態管理功能完成 - 2025-09-12
- [ ] M3：批量操作功能完成 - 2025-09-19
- [ ] M4：正式上線 - 2025-09-26

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 大量訂單查詢效能問題 | 高 | 中 | 實施索引優化、分頁載入、快取策略 |
| 併發更新衝突 | 中 | 中 | 實施樂觀鎖、版本控制 |
| 批量操作失敗 | 中 | 低 | 實施事務處理、錯誤恢復機制 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 舊系統資料遷移 | 高 | 中 | 分階段遷移、資料驗證程序 |
| 用戶培訓不足 | 中 | 中 | 提供操作手冊、教育訓練 |

## 相關文件
- [系統架構文件](../../docs/architecture.md)
- [API規格文件](../../docs/api/om-ol-api.md)
- [測試計畫文件](./tests/test-plan.md)
- [資料遷移指南](../../docs/migration/order-migration.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-22 | 初始版本，建立完整PRD | 系統 |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-08-29