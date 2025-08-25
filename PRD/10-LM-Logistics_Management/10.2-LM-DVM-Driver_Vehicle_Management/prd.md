# LM-DVM 司機與車輛管理 (Driver & Vehicle Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: LM-DSRO (排程優化), LM-DTRV (配送追蹤), HR (人力資源), FA (財務會計)

## 1. 功能概述

### 1.1 目的
建立完整的司機與車輛管理系統，涵蓋司機資訊、車輛維護、績效管理、成本控制等功能，確保運輸資源的有效管理與調度。

### 1.2 範圍
- 司機資訊管理
- 車輛檔案維護
- 排班調度管理
- 績效考核追蹤
- 維修保養管理

### 1.3 關鍵價值
- 司機生產力提升 30%
- 車輛故障率降低 40%
- 運輸成本降低 20%
- 安全事故減少 50%

## 2. 功能性需求

### FR-LM-DVM-001: 司機資訊管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 司機入職、資料變更或證照更新
- **行為**: 維護司機完整檔案與證照管理
- **資料輸入**: 
  - 個人基本資料
  - 駕照證照資訊
  - 健康檢查記錄
  - 教育訓練紀錄
  - 緊急聯絡人
- **資料輸出**: 
  - 司機檔案卡
  - 證照到期提醒
  - 資格審查報告
  - 人員清冊
  - 統計報表
- **UI反應**: 
  - 資料表單
  - 證照掃描上傳
  - 到期預警
  - 快速搜尋
  - 批量匯入
- **例外處理**: 
  - 證照過期鎖定
  - 資格不符警告
  - 重複資料檢查
  - 必填欄位驗證

#### 驗收標準
```yaml
- 條件: 新增司機資料
  預期結果: 自動檢查證照有效性並生成員工編號

- 條件: 駕照即將到期(30天內)
  預期結果: 系統自動發送提醒通知

- 條件: 健康檢查異常
  預期結果: 標記風險並限制排班
```

#### Traceability
- **測試案例**: tests/unit/FR-LM-DVM-001.test.ts
- **實作程式**: src/modules/lm/services/driverManagement.service.ts
- **相關文件**: TOC Modules.md - Section 10.2

### FR-LM-DVM-002: 車輛檔案維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 車輛購置、報廢或資訊更新
- **行為**: 管理車輛基本資料與相關文件
- **資料輸入**: 
  - 車輛基本規格
  - 牌照保險資訊
  - 購置成本資料
  - 車載設備清單
  - 使用限制條件
- **資料輸出**: 
  - 車輛資料卡
  - 保險到期清單
  - 車齡分析報告
  - 資產價值表
  - 車輛可用清單
- **UI反應**: 
  - 車輛檔案管理
  - 文件掃描上傳
  - 狀態即時顯示
  - 分類篩選
  - QR碼產生
- **例外處理**: 
  - 保險過期警告
  - 驗車逾期提醒
  - 里程異常檢測
  - 重複車牌檢查

#### 車輛資料結構
```typescript
interface Vehicle {
  id: string;
  vehicleCode: string;
  
  // 基本資訊
  basicInfo: {
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    vin: string;           // 車身號碼
    engineNumber: string;
    color: string;
    fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  };
  
  // 規格參數
  specifications: {
    vehicleType: 'truck' | 'van' | 'motorcycle' | 'car';
    capacity: {
      weight: number;      // 載重(kg)
      volume: number;      // 容積(m³)
      passengers?: number;
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    mileage: {
      current: number;
      lastUpdated: Date;
    };
  };
  
  // 證照保險
  documents: {
    registration: {
      number: string;
      issueDate: Date;
      expiryDate: Date;
      document?: string;
    };
    insurance: {
      policyNumber: string;
      company: string;
      coverage: string[];
      startDate: Date;
      expiryDate: Date;
      premium: number;
    };
    inspection: {
      lastDate: Date;
      nextDate: Date;
      result: 'pass' | 'fail' | 'conditional';
      issues?: string[];
    };
  };
  
  // 財務資訊
  financial: {
    purchaseDate: Date;
    purchasePrice: number;
    currentValue: number;
    depreciationRate: number;
    operatingCost: {
      fuel: number;        // 每公里油耗成本
      maintenance: number; // 每月維護成本
      insurance: number;   // 每月保險成本
    };
  };
  
  // 設備配置
  equipment: {
    gps: boolean;
    dashcam: boolean;
    temperatureControl?: boolean;
    loadingSensor?: boolean;
    emergencyKit: boolean;
    other?: string[];
  };
  
  // 使用狀態
  status: {
    operational: 'active' | 'maintenance' | 'repair' | 'idle' | 'retired';
    currentLocation?: string;
    currentDriver?: string;
    currentRoute?: string;
    availability: boolean;
  };
  
  // 維護記錄
  maintenanceSchedule: {
    oil: { interval: number; lastDate: Date; nextDate: Date; };
    tire: { interval: number; lastDate: Date; nextDate: Date; };
    brake: { interval: number; lastDate: Date; nextDate: Date; };
    general: { interval: number; lastDate: Date; nextDate: Date; };
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### FR-LM-DVM-003: 排班調度管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 每日/每週排班規劃或臨時調度
- **行為**: 管理司機排班與車輛調度
- **資料輸入**: 
  - 配送需求計劃
  - 司機可用時間
  - 車輛可用狀態
  - 法規工時限制
  - 特殊技能要求
- **資料輸出**: 
  - 排班表
  - 調度單
  - 工時統計
  - 加班報表
  - 出勤記錄
- **UI反應**: 
  - 日曆視圖
  - 拖拽排班
  - 衝突檢測
  - 自動建議
  - 批次排班
- **例外處理**: 
  - 超時預警
  - 人力不足
  - 技能不符
  - 請假處理

#### 排班系統
```typescript
interface DriverSchedule {
  id: string;
  scheduleDate: Date;
  
  // 排班資訊
  shifts: {
    driverId: string;
    vehicleId: string;
    
    timing: {
      shiftType: 'morning' | 'afternoon' | 'night' | 'full';
      startTime: Date;
      endTime: Date;
      breakTime: number;
      overtime?: number;
    };
    
    assignment: {
      routeId?: string;
      taskType: 'delivery' | 'pickup' | 'transfer' | 'standby';
      area: string;
      estimatedStops: number;
    };
    
    // 工時合規檢查
    compliance: {
      dailyHours: number;
      weeklyHours: number;
      restHours: number;
      consecutive: number;  // 連續工作天數
      legal: boolean;
      warnings?: string[];
    };
  }[];
  
  // 資源統計
  summary: {
    totalDrivers: number;
    totalVehicles: number;
    utilization: number;
    coverage: number;
  };
}
```

### FR-LM-DVM-004: 績效考核追蹤
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 月度/季度績效評估或即時事件
- **行為**: 追蹤和評估司機駕駛績效
- **資料輸入**: 
  - 配送完成率
  - 準時率統計
  - 客戶評價
  - 安全記錄
  - 油耗表現
- **資料輸出**: 
  - 績效報告卡
  - 排名榜單
  - 改善建議
  - 獎懲記錄
  - 趨勢分析
- **UI反應**: 
  - 績效儀表板
  - 評分卡片
  - 歷史趨勢
  - 對比分析
  - 獎章系統
- **例外處理**: 
  - 異常行為警示
  - 事故處理
  - 投訴追蹤
  - 申訴機制

#### 績效指標
```typescript
interface DriverPerformance {
  driverId: string;
  period: { start: Date; end: Date; };
  
  // 核心指標
  metrics: {
    // 效率指標
    efficiency: {
      deliveryCount: number;
      completionRate: number;
      onTimeRate: number;
      avgDeliveryTime: number;
    };
    
    // 安全指標
    safety: {
      accidentCount: number;
      violationCount: number;
      safetyScore: number;
      trainingHours: number;
    };
    
    // 服務品質
    service: {
      customerRating: number;
      complaintCount: number;
      complimentCount: number;
      professionalScore: number;
    };
    
    // 成本控制
    cost: {
      fuelEfficiency: number;
      maintenanceCost: number;
      overtimeHours: number;
      damageIncidents: number;
    };
  };
  
  // 綜合評分
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    ranking: number;
    improvement: number;
  };
  
  // 獎懲記錄
  records: {
    type: 'reward' | 'penalty';
    date: Date;
    reason: string;
    amount?: number;
  }[];
}
```

### FR-LM-DVM-005: 維修保養管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 定期保養週期或故障報修
- **行為**: 管理車輛維修保養全流程
- **資料輸入**: 
  - 保養計劃
  - 故障報告
  - 維修項目
  - 零件更換
  - 費用明細
- **資料輸出**: 
  - 維修工單
  - 保養提醒
  - 成本分析
  - 故障統計
  - 供應商評估
- **UI反應**: 
  - 保養日曆
  - 維修追蹤
  - 費用審批
  - 歷史查詢
  - 統計圖表
- **例外處理**: 
  - 緊急維修
  - 預算超支
  - 零件缺貨
  - 保固索賠

#### 維修保養記錄
```typescript
interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  
  // 維修資訊
  maintenance: {
    type: 'scheduled' | 'repair' | 'emergency' | 'inspection';
    category: 'engine' | 'transmission' | 'brake' | 'tire' | 'body' | 'other';
    
    schedule: {
      plannedDate?: Date;
      actualDate: Date;
      duration: number;
      mileage: number;
    };
    
    // 維修項目
    items: {
      description: string;
      partNumber?: string;
      quantity: number;
      unitPrice: number;
      laborHours: number;
      laborRate: number;
    }[];
    
    // 維修廠商
    vendor: {
      name: string;
      contact: string;
      location: string;
      warranty?: string;
    };
  };
  
  // 成本明細
  cost: {
    parts: number;
    labor: number;
    other: number;
    tax: number;
    total: number;
    approvedBy?: string;
  };
  
  // 車輛狀態
  vehicleCondition: {
    beforeRepair: string;
    afterRepair: string;
    testResult?: string;
    recommendations?: string[];
  };
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  
  createdAt: Date;
  completedAt?: Date;
}
```

## 3. 非功能性需求

### 3.1 效能需求
- 司機查詢響應 < 1秒
- 排班計算 < 3秒
- 支援 1000+ 司機管理
- 並發操作 50+

### 3.2 安全需求
- 個資保護加密
- 操作權限控制
- 審計日誌記錄
- 資料備份機制

### 3.3 合規需求
- 勞基法工時限制
- 職業駕駛規範
- 道路交通法規
- 保險法規要求

## 4. 系統設計

### 4.1 API 設計

```typescript
// 司機管理 API
interface DriverManagementAPI {
  // 司機資訊
  POST   /api/lm/drivers                      // 新增司機
  GET    /api/lm/drivers                      // 查詢司機列表
  GET    /api/lm/drivers/:id                  // 取得司機詳情
  PUT    /api/lm/drivers/:id                  // 更新司機資訊
  DELETE /api/lm/drivers/:id                  // 停用司機
  
  // 證照管理
  POST   /api/lm/drivers/:id/licenses         // 上傳證照
  GET    /api/lm/drivers/expiring-licenses    // 即將到期證照
  
  // 排班管理
  POST   /api/lm/schedules                    // 建立排班
  GET    /api/lm/schedules                    // 查詢排班
  PUT    /api/lm/schedules/:id                // 調整排班
  GET    /api/lm/schedules/conflicts          // 衝突檢查
}

// 車輛管理 API
interface VehicleManagementAPI {
  // 車輛資訊
  POST   /api/lm/vehicles                     // 新增車輛
  GET    /api/lm/vehicles                     // 查詢車輛列表
  GET    /api/lm/vehicles/:id                 // 取得車輛詳情
  PUT    /api/lm/vehicles/:id                 // 更新車輛資訊
  PUT    /api/lm/vehicles/:id/status          // 更新車輛狀態
  
  // 維修保養
  POST   /api/lm/vehicles/:id/maintenance     // 建立維修記錄
  GET    /api/lm/vehicles/:id/maintenance     // 查詢維修歷史
  GET    /api/lm/maintenance/scheduled        // 排程保養清單
  
  // 績效分析
  GET    /api/lm/performance/drivers          // 司機績效
  GET    /api/lm/performance/vehicles         // 車輛績效
  POST   /api/lm/performance/evaluate         // 執行評估
}

// WebSocket 事件
interface DVMWebSocketEvents {
  'driver:online': (driver: any) => void;
  'driver:offline': (driver: any) => void;
  'vehicle:breakdown': (vehicle: any) => void;
  'schedule:conflict': (conflict: any) => void;
  'maintenance:due': (maintenance: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **LM-DSRO**: 排程調度
- **LM-DTRV**: 即時追蹤
- **HR**: 人事資料
- **FA**: 薪資成本
- **BI**: 績效分析

### 5.2 外部系統整合
- **GPS系統**: 車輛定位
- **油卡系統**: 油耗管理
- **保險公司**: 保險理賠
- **維修廠**: 維修服務

## 6. 成功指標

### 6.1 業務指標
- 司機稼動率 ≥ 85%
- 車輛妥善率 ≥ 95%
- 維修成本降低 ≥ 20%
- 安全事故率 < 0.5%

### 6.2 系統指標
- 系統可用性 ≥ 99.5%
- 資料準確性 ≥ 99.9%
- 排班效率提升 ≥ 40%
- 用戶滿意度 ≥ 85%

## 7. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: lm@tsaitung.com