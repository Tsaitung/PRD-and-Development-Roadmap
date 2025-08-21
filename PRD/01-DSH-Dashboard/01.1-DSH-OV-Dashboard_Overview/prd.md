# 儀表板總覽 PRD 文件

## 模組資訊
- **模組代碼**: 01.1-DSH-OV
- **模組名稱**: Dashboard Overview (儀表板總覽)
- **負責人**: 菜蟲農食 ERP 團隊
- **最後更新**: 2025-08-18
- **版本**: v1.0.0

## 模組概述
儀表板總覽模組是整個 ERP 系統的入口點，提供關鍵業務指標的即時視覺化展示、系統狀態監控、以及快速導航功能。讓管理者能夠一目了然地掌握企業營運狀況。

## 業務價值
- 提供即時業務洞察，支援快速決策
- 集中展示關鍵績效指標(KPI)，提升管理效率
- 預警機制降低營運風險
- 個人化儀表板提升用戶體驗

## 功能需求

### FR-DSH-OV-001: 關鍵指標展示
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
在儀表板主頁展示企業關鍵業務指標，包括銷售額、訂單數、庫存狀態、生產進度等，支援即時更新和歷史趨勢對比。

**功能需求細節**:
- **條件/觸發**: 當用戶登入系統或訪問儀表板頁面時
- **行為**: 系統自動載入並顯示各項關鍵業務指標，並持續每5分鐘更新一次
- **資料輸入**: 日期範圍選擇(今日/本週/本月)、指標類型篩選
- **資料輸出**: 銷售額數值、訂單統計、庫存狀態、生產進度百分比、環比增長率
- **UI反應**: 載入動畫、數值變化動效、自動刷新指示器
- **例外處理**: 數據載入失敗顯示錯誤提示、提供手動刷新按鈕、顯示最後更新時間

**用戶故事**:
作為管理者，
我希望在登入系統後立即看到今日的關鍵業務數據，
以便快速了解企業營運狀況並做出決策。

**驗收標準**:
```yaml
- 條件: 用戶登入系統訪問儀表板
  預期結果: 3秒內載入並顯示所有關鍵指標
  
- 條件: 數據超過5分鐘未更新
  預期結果: 系統自動刷新並更新所有指標數值
  
- 條件: API服務暫時不可用
  預期結果: 顯示錯誤提示並提供重試按鈕
```

**技術需求**:
- **API 端點**: `GET /api/v1/dashboard/metrics`
- **請求/回應**: 詳見API規格章節
- **數據模型**: DashboardMetrics, MetricHistory
- **權限要求**: dashboard.view
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-DSH-OV-001.test.ts`
- **Code**: `src/modules/dashboard/overview/`
- **TOC**: `TOC Modules.md` 第54行

**依賴關係**:
- **依賴模組**: 06-OM (訂單數據), 08-WMS (庫存數據)
- **依賴功能**: FR-OM-001, FR-WMS-002
- **外部服務**: Redis 快取服務

---

### FR-DSH-OV-002: 即時通知中心
**狀態**: 🟡 開發中
**優先級**: P0

**功能描述**:
提供系統級和業務級通知的集中管理，包括系統警告、訂單狀態變更、庫存預警等，支援通知優先級設定和已讀管理。

**功能需求細節**:
- **條件/觸發**: 當系統事件發生或業務狀態變更時
- **行為**: 系統透過WebSocket即時推送通知至用戶端，並在通知中心顯示
- **資料輸入**: 通知類型篩選、已讀狀態篩選、日期範圍
- **資料輸出**: 通知列表、未讀數量、通知詳情、發送時間
- **UI反應**: 紅點提示、彈出通知、聲音提醒（可設定）
- **例外處理**: WebSocket斷線重連、離線通知快取、重複通知去重

**用戶故事**:
作為系統用戶，
我希望能夠即時收到重要的業務通知和系統提醒，
以便及時處理異常情況和重要事務。

**驗收標準**:
```yaml
- 條件: 新通知產生
  預期結果: 1秒內推送至用戶端並顯示紅點提示
  
- 條件: 用戶點擊批量已讀
  預期結果: 所有未讀通知標記為已讀並清除紅點
  
- 條件: WebSocket連線中斷
  預期結果: 自動重連並載入離線期間的通知
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/notifications`
  - `PUT /api/v1/notifications/{id}/read`
  - `POST /api/v1/notifications/mark-all-read`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Notification, NotificationPreference
- **權限要求**: notification.view, notification.manage
- **認證方式**: JWT Token + WebSocket Auth

**追蹤資訊**:
- **Tests**: `tests/unit/FR-DSH-OV-002.test.ts`
- **Code**: `src/modules/dashboard/notifications/`
- **TOC**: `TOC Modules.md` 第55行

**依賴關係**:
- **依賴模組**: SA-NWS (通知設定)
- **依賴功能**: 無
- **外部服務**: WebSocket Server, Redis Pub/Sub

---

### FR-DSH-OV-003: 快速操作面板
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
提供常用功能的快捷入口，用戶可以自定義快捷操作項目，實現一鍵導航到常用功能模組。

**功能需求細節**:
- **條件/觸發**: 當用戶點擊快速操作區域或使用快捷鍵時
- **行為**: 系統顯示快捷操作面板，執行選定的快捷操作或導航至目標頁面
- **資料輸入**: 快捷方式選擇、自定義名稱、目標URL、圖標選擇
- **資料輸出**: 快捷方式列表、使用頻率統計、推薦項目
- **UI反應**: 拖放視覺回饋、新增/刪除動畫、hover效果
- **例外處理**: 無效連結提示、權限不足警告、最大數量限制提醒

**用戶故事**:
作為日常操作人員，
我希望能快速訪問我常用的功能，
以便提高工作效率。

**驗收標準**:
```yaml
- 條件: 首次使用系統
  預期結果: 顯示8個預設的常用功能快捷方式
  
- 條件: 用戶拖放調整快捷方式順序
  預期結果: 即時更新並保存新順序
  
- 條件: 快捷方式數量達到12個上限
  預期結果: 新增按鈕變為不可用並顯示提示
```

**技術需求**:
- **API 端點**: `GET/POST/PUT/DELETE /api/v1/dashboard/shortcuts`
- **請求/回應**: 詳見API規格章節
- **數據模型**: UserShortcut, ShortcutUsage
- **權限要求**: dashboard.customize
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-DSH-OV-003.test.ts`
- **Code**: `src/modules/dashboard/shortcuts/`
- **TOC**: `TOC Modules.md` 第54行

**依賴關係**:
- **依賴模組**: UP (用戶設定)
- **依賴功能**: 無
- **外部服務**: 無

---

### FR-DSH-OV-004: 數據視覺化圖表
**狀態**: ✅ 完成
**優先級**: P0

**功能描述**:
提供多種圖表類型展示業務數據，包括折線圖、柱狀圖、圓餅圖等，支援數據篩選和導出。

**功能需求細節**:
- **條件/觸發**: 當用戶選擇圖表類型或設定篩選條件時
- **行為**: 系統根據選擇的類型和條件生成相應的圖表視覺化
- **資料輸入**: 圖表類型選擇、時間範圍、數據維度、篩選條件
- **資料輸出**: 圖表影像、數據表格、匯出檔案(Excel/PDF)
- **UI反應**: 圖表載入動畫、縮放互動、tooltip顯示
- **例外處理**: 無數據時顯示空狀態、數據量過大時分批載入

**用戶故事**:
作為數據分析人員，
我希望通過直觀的圖表了解數據趨勢，
以便進行深入分析和報告。

**驗收標準**:
```yaml
- 條件: 選擇折線圖顯示30天銷售趨勢
  預期結果: 2秒內生成並顯示互動式折線圖
  
- 條件: 點擊匯出按鈕
  預期結果: 生成Excel檔案包含圖表和原始數據
  
- 條件: 數據點超過1000個
  預期結果: 自動聚合顯示並提供縮放功能
```

**技術需求**:
- **API 端點**: `GET /api/v1/dashboard/charts/{type}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ChartConfig, ChartData
- **權限要求**: dashboard.view_charts
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-DSH-OV-004.test.ts`
- **Code**: `src/modules/dashboard/charts/`
- **TOC**: `TOC Modules.md` 第54行

**依賴關係**:
- **依賴模組**: BI (數據分析引擎)
- **依賴功能**: 無
- **外部服務**: Chart.js圖表庫

---

### FR-DSH-OV-005: 個人化設定
**狀態**: ⚪ 規劃中
**優先級**: P2

**功能描述**:
允許用戶自定義儀表板布局、選擇展示的指標卡片、設定刷新頻率等個人化配置。

**功能需求細節**:
- **條件/觸發**: 當用戶進入設定模式或修改儀表板配置時
- **行為**: 系統允許用戶自定義布局並保存個人化設定
- **資料輸入**: 布局配置、顯示元件選擇、主題選擇、刷新頻率
- **資料輸出**: 個人化的儀表板視圖、設定檔案
- **UI反應**: 編輯模式切換、拖放視覺回饋、即時預覽
- **例外處理**: 配置衝突檢測、恢復預設選項、配置備份

**用戶故事**:
作為系統用戶，
我希望能根據我的職責和偏好定制儀表板，
以便看到最相關的信息。

**驗收標準**:
```yaml
- 條件: 用戶拖放調整元件位置
  預期結果: 即時更新布局並自動保存
  
- 條件: 切換深色主題
  預期結果: 所有元件立即切換為深色模式
  
- 條件: 設定刷新頻率為1分鐘
  預期結果: 數據每分鐘自動更新一次
```

**技術需求**:
- **API 端點**: `GET/PUT /api/v1/dashboard/preferences`
- **請求/回應**: 詳見API規格章節
- **數據模型**: UserPreference, LayoutConfig
- **權限要求**: dashboard.customize
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: `tests/unit/FR-DSH-OV-005.test.ts`
- **Code**: `src/modules/dashboard/preferences/`
- **TOC**: `TOC Modules.md` 第54行

**依賴關係**:
- **依賴模組**: UP (用戶個人設定)
- **依賴功能**: 無
- **外部服務**: 無

## 非功能需求

### 性能需求
- 頁面載入時間：< 2秒
- 數據更新延遲：< 5秒
- 並發用戶支援：1000+
- 圖表渲染時間：< 1秒

### 安全需求
- 實施基於角色的訪問控制(RBAC)
- 敏感數據脫敏顯示
- 操作日誌記錄
- Session 超時自動登出（30分鐘）

### 可用性需求
- 系統可用性：99.9%
- 支援響應式設計（桌面/平板/手機）
- 瀏覽器兼容性：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 數據模型

### 主要實體
```typescript
interface DashboardMetric {
  id: string;
  type: 'sales' | 'orders' | 'inventory' | 'production';
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changeRate: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'business' | 'personal';
  priority: 'urgent' | 'important' | 'normal';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

interface DashboardLayout {
  userId: string;
  widgets: Widget[];
  theme: 'light' | 'dark';
  refreshInterval: number;
  updatedAt: Date;
}
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/dashboard/metrics` | 獲取儀表板指標 | 🟡 開發中 |
| GET | `/api/v1/dashboard/charts/{type}` | 獲取圖表數據 | ✅ 完成 |
| GET | `/api/v1/notifications` | 獲取通知列表 | 🟡 開發中 |
| PUT | `/api/v1/notifications/{id}/read` | 標記通知已讀 | 🔴 未開始 |
| GET | `/api/v1/dashboard/layout` | 獲取用戶布局配置 | ⚪ 規劃中 |
| PUT | `/api/v1/dashboard/layout` | 更新用戶布局配置 | ⚪ 規劃中 |

### 請求/回應範例

#### 獲取儀表板指標
```json
// 請求
GET /api/v1/dashboard/metrics?period=today

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "sales": {
      "value": 1250000,
      "unit": "TWD",
      "trend": "up",
      "changeRate": 12.5,
      "previousValue": 1111111
    },
    "orders": {
      "value": 156,
      "unit": "件",
      "trend": "stable",
      "changeRate": 0.5
    },
    "inventory": {
      "alerts": 5,
      "lowStock": 12,
      "totalItems": 450
    }
  },
  "timestamp": "2025-08-21T10:30:00Z"
}
```

### 資料庫結構
```sql
-- 儀表板指標快取表
CREATE TABLE dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(15,2),
  metric_unit VARCHAR(20),
  trend VARCHAR(10),
  change_rate DECIMAL(5,2),
  period VARCHAR(20),
  calculated_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB,
  
  INDEX idx_metric_type (metric_type),
  INDEX idx_period (period),
  INDEX idx_expires (expires_at)
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- 用戶儀表板配置表
CREATE TABLE dashboard_layouts (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  layout_config JSONB NOT NULL,
  theme VARCHAR(20) DEFAULT 'light',
  refresh_interval INTEGER DEFAULT 300,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：核心功能 | Week 1-2 | 指標展示、基礎圖表 |
| 階段2：通知系統 | Week 3-4 | 通知中心、實時推送 |
| 階段3：個人化 | Week 5-6 | 布局自定義、用戶設定 |
| 階段4：優化 | Week 7-8 | 性能優化、測試完善 |

### 里程碑
- [x] M1：基礎儀表板框架完成 - 2025-08-10
- [ ] M2：核心指標展示完成 - 2025-08-24
- [ ] M3：通知系統上線 - 2025-09-07
- [ ] M4：個人化功能完成 - 2025-09-21

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-18 | 初始版本創建 | ERP Team |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-08-25