# 【舊系統轉移】LM-DSRO 排車與路線優化模組 PRD

## 轉移資訊
- **來源系統**: tsaitung-dashboard-central (北區)
- **原始頁面**: 
  - `/tms/` - TMS管理主頁
  - `/tms/preset/` - 預設配送設定
  - `/trucking/[date]/` - 排車作業
  - `/trucking/[date]/edit/` - 排車編輯
  - `/trucking/final/[date]/` - 最終確認排車
  - `/trucking/query/` - 排車查詢
- **原始代碼位置**: 
  - `/libs/tsaitung-dashboard/TMS/`
  - `/libs/tsaitung-dashboard/Trucking/`
- **轉移類型**: 功能保留型轉移
- **轉移優先級**: P1-高（核心營運）
- **最後更新**: 2025-08-20

## 模組資訊
- **模組代碼**: LM-DSRO
- **模組名稱**: 排車與路線優化 (Delivery Schedule & Route Optimization)
- **負責人**: [待指派]
- **版本**: v1.0.0-migration

## 模組概述
排車與路線優化模組是物流管理系統的核心，負責自動化排車作業、路線規劃、配送時間安排、載重優化等功能。整合TMS系統功能，支援預設路線管理、動態調整、即時追蹤等進階功能。

## 舊系統功能分析

### 現有功能清單

#### TMS管理功能
1. **預設配送管理**
   - 客戶固定配送日
   - 預設路線設定
   - 司機指派規則
   - 配送時段管理

2. **路線規劃**
   - 最短路徑計算
   - 時間視窗考量
   - 交通狀況整合
   - 多點配送優化

#### 排車作業功能
1. **自動排車**
   - 依訂單自動分配
   - 載重平衡計算
   - 時間視窗匹配
   - 司機工時考量

2. **手動調整**
   - 拖拉式調整介面
   - 訂單重新分配
   - 路線合併/分割
   - 緊急插單處理

3. **排車確認**
   - 排車結果檢視
   - 異常提醒
   - 最終確認鎖定
   - 通知司機

#### 查詢追蹤功能
1. **排車查詢**
   - 依日期查詢
   - 依司機查詢
   - 依客戶查詢
   - 歷史記錄查詢

2. **即時追蹤**
   - GPS位置追蹤
   - 配送狀態更新
   - 預計到達時間
   - 異常事件通知

### 保留與改進

#### 需保留功能
- 完整的自動排車演算法
- 預設路線管理機制
- 拖拉式手動調整介面
- 多維度查詢功能
- 載重和時間優化邏輯
- 歷史資料分析

#### 計劃改進項目
- AI路線優化引擎
- 即時交通整合
- 預測性排車建議
- 移動端司機APP整合
- 客戶自助查詢
- 碳足跡計算
- 多溫層管理
- 電動車充電規劃

## 功能需求

### FR-LM-DSRO-001: 自動排車作業
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
根據訂單、車輛、司機等資源，自動生成最優化的配送計劃。

**功能需求細節**:
- **條件/觸發**: 執行每日排車或手動觸發
- **行為**: 自動分配訂單到車輛和路線
- **資料輸入**: 
  - 配送日期
  - 待配送訂單
  - 可用車輛清單
  - 司機排班表
  - 配送限制條件
- **資料輸出**: 
  - 排車計劃
  - 路線清單
  - 預估時間表
  - 載重分配
- **UI反應**: 進度顯示、結果預覽
- **例外處理**: 容量超載警告、時間衝突提示

**驗收標準**:
```yaml
- 條件: 執行自動排車
  預期結果: 所有訂單被分配到合適車輛
  
- 條件: 車輛容量限制
  預期結果: 不超載且平衡分配
  
- 條件: 時間視窗衝突
  預期結果: 自動調整或提示異常
```

**技術需求**:
- **API 端點**: `POST /api/v1/delivery/auto-schedule`
- **請求參數**:
  ```json
  {
    "delivery_date": "YYYY-MM-DD",
    "optimization_mode": "distance|time|cost",
    "constraints": {
      "max_delivery_time": 480,
      "max_distance": 200,
      "vehicle_capacity": true
    }
  }
  ```

### FR-LM-DSRO-002: 路線規劃優化
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
計算最優配送路線，考慮距離、時間、交通等多重因素。

**功能需求細節**:
- **條件/觸發**: 排車後自動執行或手動優化
- **行為**: 生成優化的配送路線
- **資料輸入**: 
  - 配送點列表
  - 時間視窗
  - 車輛類型
  - 道路限制
  - 即時交通資訊
- **資料輸出**: 
  - 優化路線
  - 預估里程
  - 預計時間
  - 節省成本
- **UI反應**: 地圖顯示、路線比較
- **例外處理**: 無法到達處理、替代路線

### FR-LM-DSRO-003: 手動排車調整
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
提供直覺的拖拉介面，允許人工調整自動排車結果。

**功能需求細節**:
- **條件/觸發**: 進入手動調整模式
- **行為**: 調整訂單分配和路線
- **資料輸入**: 
  - 拖拉操作
  - 訂單重新分配
  - 路線調整
  - 優先級設定
- **資料輸出**: 
  - 更新的排車計劃
  - 影響分析
  - 調整記錄
- **UI反應**: 即時更新、衝突提示
- **例外處理**: 違反限制條件警告

### FR-LM-DSRO-004: 預設路線管理
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
管理客戶的固定配送日和預設路線設定。

**功能需求細節**:
- **條件/觸發**: 設定或修改預設路線
- **行為**: 儲存和套用預設配送規則
- **資料輸入**: 
  - 客戶配送日
  - 固定路線
  - 優先司機
  - 特殊要求
- **資料輸出**: 
  - 預設規則清單
  - 套用結果
- **UI反應**: 規則編輯器、預覽效果
- **例外處理**: 規則衝突檢查

### FR-LM-DSRO-005: 即時追蹤監控
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
即時追蹤配送車輛位置和狀態，提供監控和預警。

**功能需求細節**:
- **條件/觸發**: 配送開始後持續追蹤
- **行為**: 更新位置和狀態
- **資料輸入**: 
  - GPS座標
  - 狀態更新
  - 異常事件
- **資料輸出**: 
  - 即時位置
  - 預計到達時間
  - 完成進度
  - 異常警報
- **UI反應**: 地圖即時更新、通知推送
- **例外處理**: 訊號中斷處理、延遲預警

### FR-LM-DSRO-006: 排車績效分析
**狀態**: ⚪ 規劃中
**優先級**: P3

**功能描述**:
分析排車效率和配送績效，提供優化建議。

**功能需求細節**:
- **條件/觸發**: 定期生成或手動查詢
- **行為**: 計算和分析績效指標
- **資料輸入**: 
  - 歷史排車資料
  - 實際配送結果
  - 成本資料
- **資料輸出**: 
  - KPI報表
  - 趨勢分析
  - 優化建議
  - 異常分析
- **UI反應**: 圖表視覺化、匯出報表
- **例外處理**: 資料不足提示

## 數據模型

### 主要實體
```typescript
// 排車計劃
interface DeliverySchedule {
  schedule_id: string;
  schedule_date: Date;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed';
  
  // 統計資訊
  total_orders: number;
  total_routes: number;
  total_distance: number;
  total_duration: number;
  
  // 資源配置
  vehicles_used: number;
  drivers_assigned: number;
  
  routes: DeliveryRoute[];
  
  created_by: string;
  created_at: Date;
  confirmed_at?: Date;
  completed_at?: Date;
}

// 配送路線
interface DeliveryRoute {
  route_id: string;
  schedule_id: string;
  route_no: string;
  
  // 資源指派
  vehicle_id: string;
  vehicle_type: string;
  driver_id: string;
  driver_name: string;
  
  // 路線資訊
  start_time: Date;
  end_time: Date;
  total_distance: number;
  total_duration: number;
  
  // 載重資訊
  total_weight: number;
  total_volume: number;
  capacity_usage: number;
  
  // 配送點
  stops: DeliveryStop[];
  
  // 狀態追蹤
  status: 'pending' | 'started' | 'in_progress' | 'completed';
  actual_start?: Date;
  actual_end?: Date;
  
  gps_tracking?: GPSTrack[];
}

// 配送點
interface DeliveryStop {
  stop_id: string;
  route_id: string;
  sequence: number;
  
  // 訂單資訊
  order_id: string;
  customer_id: string;
  customer_name: string;
  
  // 地址資訊
  address: string;
  latitude: number;
  longitude: number;
  
  // 時間視窗
  time_window_start: Date;
  time_window_end: Date;
  estimated_arrival: Date;
  estimated_duration: number;
  
  // 實際執行
  actual_arrival?: Date;
  actual_departure?: Date;
  delivery_status?: 'pending' | 'arrived' | 'delivered' | 'failed';
  
  // 特殊要求
  special_instructions?: string;
  priority?: number;
}

// 預設路線
interface PresetRoute {
  preset_id: string;
  customer_id: string;
  
  // 配送規則
  delivery_days: number[]; // 1-7 週一到週日
  preferred_time_slot: string;
  preferred_driver?: string;
  preferred_vehicle_type?: string;
  
  // 路線設定
  fixed_sequence?: number;
  zone?: string;
  
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// GPS追蹤
interface GPSTrack {
  track_id: string;
  route_id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}
```

## 數據遷移策略

### 遷移方式
- **策略**: 平行運行後切換
- **階段**: 
  1. 第一階段：遷移預設路線和規則（1週）
  2. 第二階段：遷移歷史排車資料（2週）
  3. 第三階段：雙系統平行運行（2週）
  4. 第四階段：完全切換（3天）

### 數據映射
| 舊系統欄位 | 新系統欄位 | 轉換規則 |
|-----------|-----------|----------|
| truck_schedule_id | schedule_id | ID格式轉換 |
| delivery_date | schedule_date | 日期格式統一 |
| truck_id | vehicle_id | 車輛ID映射 |
| driver_code | driver_id | 司機ID映射 |
| client_id | customer_id | 客戶ID映射 |

### 相容性處理
- GPS追蹤資料即時同步
- 排車結果雙向同步
- 提供新舊系統對照報表

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| POST | `/api/v1/delivery/auto-schedule` | 自動排車 | 🟡 開發中 |
| GET | `/api/v1/delivery/schedules` | 查詢排車計劃 | 🔴 未開始 |
| GET | `/api/v1/delivery/schedules/{id}` | 排車詳情 | 🔴 未開始 |
| PUT | `/api/v1/delivery/schedules/{id}` | 更新排車 | 🔴 未開始 |
| POST | `/api/v1/delivery/routes/optimize` | 路線優化 | 🔴 未開始 |
| PUT | `/api/v1/delivery/routes/{id}/adjust` | 調整路線 | 🔴 未開始 |
| GET | `/api/v1/delivery/tracking/{route_id}` | 即時追蹤 | 🔴 未開始 |
| POST | `/api/v1/delivery/preset-routes` | 設定預設路線 | 🔴 未開始 |
| GET | `/api/v1/delivery/analytics` | 績效分析 | 🔴 未開始 |

### 請求/響應範例
```json
// POST /api/v1/delivery/auto-schedule
{
  "delivery_date": "2025-08-21",
  "orders": ["ORD-001", "ORD-002", "ORD-003"],
  "available_vehicles": ["VEH-001", "VEH-002"],
  "available_drivers": ["DRV-001", "DRV-002"],
  "optimization_mode": "balanced",
  "constraints": {
    "max_route_duration": 480,
    "max_stops_per_route": 30,
    "respect_time_windows": true
  }
}

// Response
{
  "success": true,
  "data": {
    "schedule_id": "SCH-20250821-001",
    "total_routes": 2,
    "total_distance": 156.8,
    "total_duration": 420,
    "optimization_savings": {
      "distance_saved": 23.5,
      "time_saved": 65
    },
    "routes": [
      {
        "route_id": "RT-001",
        "vehicle_id": "VEH-001",
        "driver_id": "DRV-001",
        "stops": 15,
        "distance": 78.5,
        "duration": 210
      }
    ]
  }
}
```

## 測試需求

### 單元測試
- [ ] 排車演算法測試
- [ ] 路線優化邏輯測試
- [ ] 載重計算測試
- [ ] 時間視窗驗證測試

### 整合測試
- [ ] 完整排車流程測試
- [ ] 手動調整測試
- [ ] GPS追蹤整合測試
- [ ] 預設路線套用測試

### 驗收測試
- [ ] 場景1：100筆訂單自動排車
- [ ] 場景2：手動調整並重新優化
- [ ] 場景3：即時追蹤和異常處理
- [ ] 場景4：預設路線自動套用

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：核心排車 | Week 1-2 | 自動排車演算法 |
| 階段2：路線優化 | Week 3-4 | 路線規劃、優化 |
| 階段3：手動調整 | Week 5 | 拖拉介面、調整功能 |
| 階段4：預設管理 | Week 6 | 預設路線、規則引擎 |
| 階段5：即時追蹤 | Week 7 | GPS整合、監控 |
| 階段6：分析優化 | Week 8 | 績效分析、報表 |

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 演算法效能問題 | 高 | 中 | 分批處理、快取優化 |
| GPS訊號不穩 | 中 | 高 | 離線模式、預測補償 |
| 地圖API限制 | 中 | 低 | 多供應商備援 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 排車錯誤影響配送 | 極高 | 低 | 人工審核、測試環境 |
| 司機抗拒新系統 | 高 | 中 | 培訓計劃、漸進導入 |

## 非功能需求

### 性能需求
- 100筆訂單排車 < 10秒
- 路線優化計算 < 5秒
- GPS更新頻率 30秒
- 支援1000條路線並發追蹤

### 安全需求
- 位置資料加密傳輸
- 司機隱私保護
- 操作審計日誌

### 可用性需求
- 系統可用性 99.9%
- 24/7運行支援
- 離線模式支援

## 相關文件
- [舊系統TMS代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/TMS)
- [舊系統Trucking代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Trucking)
- [LM模組架構文件](../README.md)
- [物流管理流程](../../docs/logistics-process.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0-migration | 2025-08-20 | 初始轉移版本 | System |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-09-01