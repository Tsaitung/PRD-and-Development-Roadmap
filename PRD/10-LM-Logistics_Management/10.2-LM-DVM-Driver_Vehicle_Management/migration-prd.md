# 【舊系統轉移】LM-DVM 司機與車隊管理模組 PRD

## 轉移資訊
- **來源系統**: tsaitung-dashboard-central (北區)
- **原始頁面**: 
  - `/site/` - 站點管理
  - `/driver/` - 司機管理
  - `/vehicle/` - 車輛管理
  - `/driver-vehicle/` - 司機車輛配對
- **原始代碼位置**: 
  - `/libs/tsaitung-dashboard/Site/`
  - `/libs/tsaitung-dashboard/Driver/`
  - `/libs/tsaitung-dashboard/Vehicle/`
- **轉移類型**: 功能保留型轉移
- **轉移優先級**: P1-高（核心營運）
- **最後更新**: 2025-08-20

## 模組資訊
- **模組代碼**: LM-DVM
- **模組名稱**: 司機與車隊管理 (Driver & Vehicle Management)
- **負責人**: [待指派]
- **版本**: v1.0.0-migration

## 模組概述
司機與車隊管理模組負責管理物流配送的核心資源，包含司機資料維護、車輛管理、站點設定、司機排班、車輛保養追蹤等功能。確保配送資源的有效管理和調度。

## 舊系統功能分析

### 現有功能清單

#### 站點管理功能
1. **站點資料維護**
   - 站點基本資訊
   - 營運時間設定
   - 服務範圍定義
   - 站點容量管理

2. **站點配置**
   - 司機指派
   - 車輛分配
   - 路線規劃
   - 庫存管理

#### 司機管理功能
1. **司機資料管理**
   - 基本資料維護
   - 證照管理
   - 聯絡資訊
   - 緊急聯絡人

2. **司機排班**
   - 班表設定
   - 休假管理
   - 加班記錄
   - 出勤統計

3. **司機績效**
   - 配送效率
   - 客戶評價
   - 違規記錄
   - 獎懲記錄

#### 車輛管理功能
1. **車輛資料管理**
   - 車輛基本資訊
   - 車牌號碼
   - 載重容量
   - 溫層設定

2. **車輛維護**
   - 保養排程
   - 維修記錄
   - 油耗追蹤
   - 里程統計

3. **車輛調度**
   - 可用性管理
   - 臨時調度
   - 替代車輛

#### 司機車輛配對
1. **固定配對**
   - 主要司機指派
   - 備用司機設定
   - 車輛授權管理

2. **臨時調度**
   - 代班安排
   - 車輛借調
   - 緊急調度

### 保留與改進

#### 需保留功能
- 完整的司機資料管理
- 車輛資訊維護
- 站點配置功能
- 司機排班機制
- 保養追蹤系統
- 績效管理功能

#### 計劃改進項目
- 智能排班建議
- 預測性維護提醒
- 司機APP整合
- 即時車況監控
- 油耗優化分析
- 電子簽到打卡
- 證照到期提醒
- 事故管理系統

## 功能需求

### FR-LM-DVM-001: 司機資料管理
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
管理司機的完整資料，包含個人資訊、證照、排班、績效等。

**功能需求細節**:
- **條件/觸發**: 新增或編輯司機資料
- **行為**: 維護司機檔案
- **資料輸入**: 
  - 個人資料（姓名、身分證、聯絡方式）
  - 證照資訊（駕照類別、有效期限）
  - 緊急聯絡人
  - 銀行帳戶
  - 所屬站點
- **資料輸出**: 
  - 司機檔案
  - 證照狀態
  - 可用性狀態
- **UI反應**: 表單驗證、證照到期提醒
- **例外處理**: 證照過期警告、資料重複檢查

**驗收標準**:
```yaml
- 條件: 新增司機資料
  預期結果: 完整建立司機檔案並分配ID
  
- 條件: 證照即將到期
  預期結果: 系統自動提醒（30天前）
  
- 條件: 更新聯絡資訊
  預期結果: 即時更新並記錄變更
```

**技術需求**:
- **API 端點**: `POST /api/v1/drivers`
- **請求參數**:
  ```json
  {
    "name": "string",
    "id_number": "string",
    "phone": "string",
    "license_type": "string",
    "license_expiry": "YYYY-MM-DD",
    "site_id": "string",
    "emergency_contact": {
      "name": "string",
      "phone": "string",
      "relationship": "string"
    }
  }
  ```

### FR-LM-DVM-002: 車輛資料管理
**狀態**: 🟡 開發中
**優先級**: P1

**功能描述**:
維護車輛的基本資料、規格、保養記錄等資訊。

**功能需求細節**:
- **條件/觸發**: 新增或編輯車輛資料
- **行為**: 建立或更新車輛檔案
- **資料輸入**: 
  - 車牌號碼
  - 車型規格
  - 載重容量
  - 溫層類型（常溫/冷藏/冷凍）
  - 購買日期
  - 保險資訊
- **資料輸出**: 
  - 車輛檔案
  - 可用狀態
  - 保養提醒
- **UI反應**: 容量計算、保養倒數
- **例外處理**: 車牌重複檢查、保險到期警告

### FR-LM-DVM-003: 司機排班管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
管理司機的工作排班、休假、調班等。

**功能需求細節**:
- **條件/觸發**: 設定或調整排班
- **行為**: 更新司機班表
- **資料輸入**: 
  - 排班週期
  - 工作時段
  - 休假申請
  - 調班需求
  - 加班安排
- **資料輸出**: 
  - 班表
  - 出勤統計
  - 可用司機清單
- **UI反應**: 日曆顯示、衝突提示
- **例外處理**: 人力不足警告、法規工時檢查

### FR-LM-DVM-004: 車輛保養管理
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
追蹤和管理車輛的定期保養、維修記錄。

**功能需求細節**:
- **條件/觸發**: 保養週期到達或故障報修
- **行為**: 建立保養/維修工單
- **資料輸入**: 
  - 保養類型（定期/臨時）
  - 保養項目
  - 維修廠商
  - 費用記錄
  - 預計完成時間
- **資料輸出**: 
  - 保養記錄
  - 費用統計
  - 車輛停用通知
- **UI反應**: 保養提醒、進度追蹤
- **例外處理**: 逾期保養警告、替代車輛建議

### FR-LM-DVM-005: 站點配置管理
**狀態**: 🔴 未開始
**優先級**: P2

**功能描述**:
管理物流站點的配置，包含人員、車輛、服務範圍等。

**功能需求細節**:
- **條件/觸發**: 設定站點配置
- **行為**: 更新站點資源配置
- **資料輸入**: 
  - 站點資訊
  - 指派司機
  - 分配車輛
  - 服務區域
  - 營運時間
- **資料輸出**: 
  - 站點配置表
  - 資源使用率
  - 服務覆蓋圖
- **UI反應**: 地圖顯示、資源分配圖
- **例外處理**: 資源不足提醒、區域重疊警告

### FR-LM-DVM-006: 司機績效評估
**狀態**: ⚪ 規劃中
**優先級**: P3

**功能描述**:
評估和追蹤司機的工作績效，提供改善建議。

**功能需求細節**:
- **條件/觸發**: 定期評估或事件觸發
- **行為**: 計算績效指標
- **資料輸入**: 
  - 配送完成率
  - 準時率
  - 客戶評價
  - 油耗表現
  - 違規記錄
- **資料輸出**: 
  - 績效報告
  - 排名
  - 改善建議
  - 獎懲建議
- **UI反應**: 儀表板顯示、趨勢圖表
- **例外處理**: 異常表現警示

## 數據模型

### 主要實體
```typescript
// 司機實體
interface Driver {
  driver_id: string;
  driver_code: string;
  
  // 基本資料
  name: string;
  id_number: string;
  birth_date: Date;
  phone: string;
  email?: string;
  address: string;
  
  // 證照資訊
  license_type: string;
  license_number: string;
  license_issue_date: Date;
  license_expiry_date: Date;
  
  // 工作資訊
  site_id: string;
  employment_date: Date;
  employment_status: 'active' | 'leave' | 'terminated';
  
  // 緊急聯絡
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // 績效資料
  performance_score?: number;
  total_deliveries?: number;
  accident_count?: number;
  
  created_at: Date;
  updated_at: Date;
}

// 車輛實體
interface Vehicle {
  vehicle_id: string;
  plate_number: string;
  
  // 車輛規格
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  
  // 載重資訊
  max_weight: number; // kg
  max_volume: number; // m³
  temperature_type: 'ambient' | 'chilled' | 'frozen';
  
  // 營運資訊
  site_id: string;
  status: 'active' | 'maintenance' | 'retired';
  
  // 保養資訊
  last_maintenance_date?: Date;
  next_maintenance_date?: Date;
  total_mileage: number;
  
  // 保險資訊
  insurance_company?: string;
  insurance_expiry?: Date;
  
  // 油耗資訊
  fuel_type: string;
  avg_fuel_consumption?: number;
  
  created_at: Date;
  updated_at: Date;
}

// 站點實體
interface Site {
  site_id: string;
  site_code: string;
  site_name: string;
  
  // 地址資訊
  address: string;
  latitude: number;
  longitude: number;
  
  // 營運資訊
  operation_hours: {
    weekday_start: string;
    weekday_end: string;
    weekend_start?: string;
    weekend_end?: string;
  };
  
  // 服務範圍
  service_areas: string[];
  service_radius: number; // km
  
  // 資源配置
  max_vehicles: number;
  max_drivers: number;
  current_vehicles: number;
  current_drivers: number;
  
  // 管理資訊
  manager_id?: string;
  contact_phone: string;
  
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 司機排班
interface DriverSchedule {
  schedule_id: string;
  driver_id: string;
  date: Date;
  
  shift_type: 'morning' | 'afternoon' | 'night' | 'off';
  start_time?: string;
  end_time?: string;
  
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent';
  
  overtime_hours?: number;
  notes?: string;
  
  created_by: string;
  created_at: Date;
}

// 車輛保養記錄
interface MaintenanceRecord {
  record_id: string;
  vehicle_id: string;
  
  maintenance_type: 'routine' | 'repair' | 'inspection';
  maintenance_date: Date;
  
  // 保養內容
  items: {
    item: string;
    cost: number;
  }[];
  
  total_cost: number;
  vendor: string;
  
  // 里程資訊
  mileage_at_service: number;
  next_service_mileage?: number;
  
  notes?: string;
  created_by: string;
  created_at: Date;
}

// 司機車輛配對
interface DriverVehicleAssignment {
  assignment_id: string;
  driver_id: string;
  vehicle_id: string;
  
  assignment_type: 'primary' | 'temporary';
  start_date: Date;
  end_date?: Date;
  
  active: boolean;
  notes?: string;
  
  created_by: string;
  created_at: Date;
}
```

## 數據遷移策略

### 遷移方式
- **策略**: 主數據優先遷移
- **階段**: 
  1. 第一階段：遷移站點和車輛資料（1週）
  2. 第二階段：遷移司機資料和排班（1週）
  3. 第三階段：遷移歷史記錄（1週）
  4. 第四階段：驗證和調整（3天）

### 數據映射
| 舊系統欄位 | 新系統欄位 | 轉換規則 |
|-----------|-----------|----------|
| driver_code | driver_id | 保留原代碼作為ID |
| truck_no | plate_number | 直接映射 |
| warehouse_id | site_id | 站點ID映射 |
| capacity | max_weight | 單位轉換（噸→公斤） |
| driver_phone | phone | 格式標準化 |

### 相容性處理
- 保留舊系統代碼作為參考
- 支援新舊ID查詢
- 歷史資料完整保留

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/drivers` | 司機列表 | 🟡 開發中 |
| GET | `/api/v1/drivers/{id}` | 司機詳情 | 🔴 未開始 |
| POST | `/api/v1/drivers` | 新增司機 | 🔴 未開始 |
| PUT | `/api/v1/drivers/{id}` | 更新司機 | 🔴 未開始 |
| GET | `/api/v1/vehicles` | 車輛列表 | 🔴 未開始 |
| POST | `/api/v1/vehicles` | 新增車輛 | 🔴 未開始 |
| GET | `/api/v1/sites` | 站點列表 | 🔴 未開始 |
| POST | `/api/v1/schedules` | 排班管理 | 🔴 未開始 |
| POST | `/api/v1/maintenance` | 保養記錄 | 🔴 未開始 |
| GET | `/api/v1/performance/{driver_id}` | 績效查詢 | 🔴 未開始 |

### 請求/響應範例
```json
// POST /api/v1/drivers
{
  "name": "張三",
  "id_number": "A123456789",
  "phone": "0912345678",
  "license_type": "職業大貨車",
  "license_number": "DL-2025-001",
  "license_expiry": "2027-12-31",
  "site_id": "SITE_001",
  "emergency_contact": {
    "name": "張太太",
    "phone": "0923456789",
    "relationship": "配偶"
  }
}

// Response
{
  "success": true,
  "data": {
    "driver_id": "DRV_001",
    "driver_code": "D2025001",
    "name": "張三",
    "site_name": "北區物流中心",
    "status": "active"
  }
}
```

## 測試需求

### 單元測試
- [ ] 司機資料驗證測試
- [ ] 車輛容量計算測試
- [ ] 排班衝突檢查測試
- [ ] 保養週期計算測試

### 整合測試
- [ ] 司機車輛配對測試
- [ ] 排班系統整合測試
- [ ] 績效計算測試
- [ ] 站點資源分配測試

### 驗收測試
- [ ] 場景1：新司機入職完整流程
- [ ] 場景2：車輛保養排程和追蹤
- [ ] 場景3：月度排班和調班作業
- [ ] 場景4：站點資源調度

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎管理 | Week 1-2 | 司機、車輛CRUD |
| 階段2：站點功能 | Week 3 | 站點管理、資源配置 |
| 階段3：排班系統 | Week 4 | 排班、休假管理 |
| 階段4：保養追蹤 | Week 5 | 保養提醒、記錄 |
| 階段5：績效管理 | Week 6 | 績效計算、報表 |
| 階段6：系統整合 | Week 7 | 整合測試、優化 |

## 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 資料遷移遺失 | 高 | 低 | 完整備份、逐步驗證 |
| 排班演算法複雜 | 中 | 中 | 分階段實施、人工審核 |
| 第三方整合失敗 | 中 | 低 | 備用方案、手動輸入 |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 司機資料外洩 | 高 | 低 | 權限控制、資料加密 |
| 排班錯誤影響配送 | 高 | 中 | 雙重確認、提前通知 |

## 非功能需求

### 性能需求
- 司機查詢 < 1秒
- 排班生成 < 5秒
- 支援500位司機管理
- 支援200台車輛追蹤

### 安全需求
- 個資保護（GDPR合規）
- 操作審計日誌
- 角色權限控制

### 可用性需求
- 系統可用性 99.9%
- 支援移動端查詢
- 離線模式支援

## 相關文件
- [舊系統Driver代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Driver)
- [舊系統Vehicle代碼](https://github.com/Tsaitung/tsaitung-mono/tree/main/libs/tsaitung-dashboard/Vehicle)
- [LM模組架構文件](../README.md)
- [車隊管理流程](../../docs/fleet-management.md)

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0-migration | 2025-08-20 | 初始轉移版本 | System |

---

**文件狀態**: 審查中
**下次審查日期**: 2025-09-01