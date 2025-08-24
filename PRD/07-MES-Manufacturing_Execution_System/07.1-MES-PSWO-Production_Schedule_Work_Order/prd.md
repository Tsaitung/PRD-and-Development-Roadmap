# MES-PSWO 生產排程與工單管理 (Production Schedule & Work Order) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: OM (訂單管理), WMS (倉儲管理), BDM (基礎資料), PM (採購管理)

## 1. 功能概述

### 1.1 目的
提供完整的生產排程規劃與工單管理系統，優化生產資源配置，確保準時交貨並最大化生產效率。

### 1.2 範圍
- 生產計劃制定與排程
- 工單建立與追蹤
- 產能規劃與負荷分析
- 生產進度監控
- 資源調度優化

### 1.3 關鍵價值
- 生產效率提升 35%
- 準時交貨率達 95%
- 設備利用率提升 25%
- 生產週期縮短 20%

## 2. 功能性需求

### FR-MES-PSWO-001: 生產計劃管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 收到銷售訂單或預測需求時
- **行為**: 系統自動生成生產計劃並優化排程
- **資料輸入**: 
  - 需求來源（訂單、預測、安全庫存）
  - 產品資訊（BOM、工藝路線）
  - 交期要求
  - 優先級設定
  - 產能限制
- **資料輸出**: 
  - 主生產計劃（MPS）
  - 物料需求計劃（MRP）
  - 產能需求計劃（CRP）
  - 排程甘特圖
  - 關鍵路徑分析
- **UI反應**: 
  - 拖拽式排程調整
  - 即時產能負荷顯示
  - 衝突警示提醒
  - 多視圖切換（日/週/月）
- **例外處理**: 
  - 產能超載警告
  - 物料短缺提示
  - 交期風險預警
  - 自動重排建議

#### 驗收標準
```yaml
- 條件: 接收10個訂單進行排程
  預期結果: 3秒內生成優化的生產計劃

- 條件: 設備故障需要重新排程
  預期結果: 自動調整受影響工單並通知相關人員

- 條件: 插入緊急訂單
  預期結果: 重新優化排程並評估對其他訂單的影響
```

### FR-MES-PSWO-002: 工單管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 生產計劃確認後自動產生工單
- **行為**: 建立、發放、追蹤、關閉工單全生命週期
- **資料輸入**: 
  - 生產計劃資訊
  - 產品規格
  - 生產數量
  - 工藝參數
  - 品質標準
- **資料輸出**: 
  - 工單編號
  - 工單狀態
  - 領料清單
  - 作業指導書
  - 完工報告
- **UI反應**: 
  - 工單看板顯示
  - 狀態即時更新
  - 進度條顯示
  - 異常標記
- **例外處理**: 
  - 物料不足暫停
  - 品質異常處理
  - 工單拆分/合併
  - 緊急插單處理

#### 工單狀態定義
```typescript
enum WorkOrderStatus {
  DRAFT = 'draft',              // 草稿
  PLANNED = 'planned',          // 已計劃
  RELEASED = 'released',        // 已下達
  IN_PROGRESS = 'in_progress',  // 生產中
  PAUSED = 'paused',           // 暫停
  COMPLETED = 'completed',      // 已完工
  CLOSED = 'closed',           // 已關閉
  CANCELLED = 'cancelled'       // 已取消
}
```

### FR-MES-PSWO-003: 產能管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 排程規劃或產能查詢時
- **行為**: 分析產能負荷並提供優化建議
- **資料輸入**: 
  - 設備產能資料
  - 人員班次安排
  - 工作日曆
  - 效率係數
  - 維護計劃
- **資料輸出**: 
  - 產能負荷圖
  - 瓶頸分析
  - 產能利用率
  - 優化建議
  - 加班需求
- **UI反應**: 
  - 熱力圖顯示
  - 產能趨勢圖
  - 瓶頸高亮
  - 模擬分析
- **例外處理**: 
  - 產能不足預警
  - 設備故障影響
  - 人員缺勤調整

### FR-MES-PSWO-004: 生產進度追蹤
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 工單執行過程中即時更新
- **行為**: 追蹤生產進度並提供預警
- **資料輸入**: 
  - 開工/完工回報
  - 生產數量
  - 品質檢驗結果
  - 異常記錄
  - 停機時間
- **資料輸出**: 
  - 即時進度
  - 完成率
  - 預計完工時間
  - 延遲分析
  - KPI指標
- **UI反應**: 
  - 進度儀表板
  - 里程碑追蹤
  - 延遲警示
  - 趨勢預測
- **例外處理**: 
  - 進度落後預警
  - 自動催料
  - 加急處理

### FR-MES-PSWO-005: 資源調度
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 工單排程或資源衝突時
- **行為**: 優化配置生產資源
- **資料輸入**: 
  - 資源可用性
  - 技能矩陣
  - 設備狀態
  - 工具配置
  - 物料供應
- **資料輸出**: 
  - 資源分配表
  - 人員排班表
  - 設備使用計劃
  - 換線計劃
  - 效率分析
- **UI反應**: 
  - 資源日曆
  - 衝突顯示
  - 最優分配
  - 調度建議
- **例外處理**: 
  - 資源衝突解決
  - 技能不匹配
  - 設備維護衝突

## 3. 非功能性需求

### 3.1 效能需求
- 排程計算時間 < 5秒（100個工單）
- 進度更新延遲 < 1秒
- 同時支援 50個工單並行
- 甘特圖渲染 < 2秒

### 3.2 可靠性需求
- 系統可用性 99.5%
- 數據準確性 100%
- 故障恢復時間 < 30分鐘
- 自動備份機制

### 3.3 整合需求
- 與 ERP 系統即時同步
- 支援 MES 標準協議
- 設備數據自動採集
- 第三方系統介接

## 4. 系統設計

### 4.1 資料模型

```typescript
// 生產計劃
interface ProductionPlan {
  id: string;
  planNo: string;
  planType: 'MPS' | 'MRP' | 'CRP';
  
  // 計劃資訊
  planPeriod: {
    start: Date;
    end: Date;
  };
  status: PlanStatus;
  version: number;
  
  // 需求來源
  demandSource: {
    type: 'order' | 'forecast' | 'safety';
    referenceNo: string;
    quantity: number;
    dueDate: Date;
  }[];
  
  // 計劃明細
  items: PlanItem[];
  
  // 產能分析
  capacityAnalysis: {
    utilizationRate: number;
    bottlenecks: string[];
    overtime: number;
  };
  
  // 排程結果
  schedule: {
    criticalPath: string[];
    leadTime: number;
    completionDate: Date;
  };
  
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

// 工單
interface WorkOrder {
  id: string;
  workOrderNo: string;
  planId: string;
  
  // 產品資訊
  product: {
    id: string;
    code: string;
    name: string;
    specification: string;
    unit: string;
  };
  
  // 生產資訊
  quantity: {
    planned: number;
    produced: number;
    good: number;
    defect: number;
    scrap: number;
  };
  
  // 時間資訊
  schedule: {
    plannedStart: Date;
    plannedEnd: Date;
    actualStart?: Date;
    actualEnd?: Date;
    pausedTime?: number;
  };
  
  // 工藝路線
  routing: {
    id: string;
    version: string;
    operations: Operation[];
  };
  
  // 物料清單
  bom: {
    id: string;
    version: string;
    materials: Material[];
  };
  
  // 資源分配
  resources: {
    workstation: string;
    operators: string[];
    equipment: string[];
    tools: string[];
  };
  
  // 狀態追蹤
  status: WorkOrderStatus;
  priority: number;
  
  // 品質要求
  qualitySpec: {
    standards: string[];
    inspectionPoints: string[];
    acceptanceCriteria: any;
  };
  
  // 成本資訊
  cost: {
    material: number;
    labor: number;
    overhead: number;
    total: number;
  };
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedBy?: string;
  completedAt?: Date;
}

// 工序
interface Operation {
  id: string;
  sequence: number;
  name: string;
  workstation: string;
  
  // 時間標準
  time: {
    setup: number;      // 準備時間
    process: number;    // 加工時間
    wait: number;       // 等待時間
    move: number;       // 搬運時間
  };
  
  // 資源需求
  resources: {
    operators: number;
    skills: string[];
    equipment: string[];
    tools: string[];
  };
  
  // 工藝參數
  parameters: {
    [key: string]: any;
  };
  
  // 品質檢驗
  inspection: {
    required: boolean;
    type: 'first' | 'patrol' | 'final' | 'sampling';
    frequency: string;
    criteria: any;
  };
  
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
  actualTime?: {
    start: Date;
    end: Date;
    duration: number;
  };
}

// 產能模型
interface Capacity {
  id: string;
  resourceId: string;
  resourceType: 'workstation' | 'equipment' | 'operator';
  
  // 產能定義
  capacity: {
    theoretical: number;    // 理論產能
    standard: number;       // 標準產能
    actual: number;         // 實際產能
    unit: string;
  };
  
  // 工作日曆
  calendar: {
    workDays: number[];
    shifts: Shift[];
    holidays: Date[];
    maintenance: MaintenanceWindow[];
  };
  
  // 效率因子
  efficiency: {
    oee: number;           // 設備綜合效率
    availability: number;   // 可用率
    performance: number;    // 表現率
    quality: number;       // 品質率
  };
  
  // 負荷狀態
  load: {
    date: Date;
    planned: number;
    actual: number;
    available: number;
    utilizationRate: number;
  }[];
}

// 生產實績
interface ProductionRecord {
  id: string;
  workOrderId: string;
  operationId: string;
  
  // 生產資訊
  production: {
    startTime: Date;
    endTime: Date;
    quantity: number;
    goodQuantity: number;
    defectQuantity: number;
    scrapQuantity: number;
  };
  
  // 資源使用
  resources: {
    workstation: string;
    operators: string[];
    equipment: string[];
    actualTime: number;
  };
  
  // 物料消耗
  materialUsage: {
    materialId: string;
    plannedQty: number;
    actualQty: number;
    scrapQty: number;
  }[];
  
  // 品質記錄
  quality: {
    inspectionResults: any[];
    defects: Defect[];
    rework: boolean;
  };
  
  // 異常記錄
  issues: {
    type: string;
    description: string;
    duration: number;
    resolution: string;
  }[];
  
  recordedBy: string;
  recordedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

// 排程結果
interface Schedule {
  id: string;
  planId: string;
  version: number;
  
  // 排程資訊
  info: {
    algorithm: 'FIFO' | 'SPT' | 'EDD' | 'CR';
    optimizationGoal: string;
    constraints: string[];
  };
  
  // 排程明細
  tasks: {
    workOrderId: string;
    operationId: string;
    resource: string;
    plannedStart: Date;
    plannedEnd: Date;
    duration: number;
    predecessors: string[];
    successors: string[];
    slack: number;
    isCritical: boolean;
  }[];
  
  // 排程指標
  metrics: {
    makespan: number;         // 總完工時間
    totalFlowTime: number;    // 總流程時間
    avgFlowTime: number;      // 平均流程時間
    maxLateness: number;      // 最大延遲
    totalTardiness: number;   // 總延遲
    utilizationRate: number;  // 利用率
  };
  
  createdAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}
```

### 4.2 API 設計

```typescript
// 生產計劃 API
interface ProductionPlanAPI {
  // 計劃管理
  POST   /api/production/plans             // 建立生產計劃
  GET    /api/production/plans             // 查詢計劃列表
  GET    /api/production/plans/:id         // 取得計劃詳情
  PUT    /api/production/plans/:id         // 更新計劃
  POST   /api/production/plans/:id/approve // 審批計劃
  
  // MPS/MRP/CRP
  POST   /api/production/mps/generate      // 生成主生產計劃
  POST   /api/production/mrp/run          // 執行物料需求計劃
  POST   /api/production/crp/calculate    // 計算產能需求
  
  // 排程優化
  POST   /api/production/schedule/optimize // 優化排程
  GET    /api/production/schedule/gantt    // 取得甘特圖
  POST   /api/production/schedule/simulate // 模擬排程
}

// 工單管理 API
interface WorkOrderAPI {
  // 工單操作
  POST   /api/workorders                   // 建立工單
  GET    /api/workorders                   // 查詢工單列表
  GET    /api/workorders/:id               // 取得工單詳情
  PUT    /api/workorders/:id               // 更新工單
  POST   /api/workorders/:id/release       // 下達工單
  POST   /api/workorders/:id/start         // 開工
  POST   /api/workorders/:id/pause         // 暫停
  POST   /api/workorders/:id/resume        // 恢復
  POST   /api/workorders/:id/complete      // 完工
  POST   /api/workorders/:id/close         // 關閉
  
  // 工單調整
  POST   /api/workorders/:id/split         // 拆分工單
  POST   /api/workorders/merge             // 合併工單
  POST   /api/workorders/:id/reschedule    // 重新排程
  
  // 生產回報
  POST   /api/workorders/:id/report        // 生產回報
  GET    /api/workorders/:id/progress      // 查詢進度
}

// 產能管理 API
interface CapacityAPI {
  // 產能查詢
  GET    /api/capacity/available           // 查詢可用產能
  GET    /api/capacity/load                // 查詢負荷狀況
  GET    /api/capacity/bottlenecks         // 瓶頸分析
  
  // 產能調整
  POST   /api/capacity/adjust              // 調整產能
  POST   /api/capacity/overtime            // 安排加班
  
  // 資源管理
  GET    /api/resources                    // 查詢資源
  POST   /api/resources/allocate           // 分配資源
  POST   /api/resources/release            // 釋放資源
}

// WebSocket 事件
interface ProductionWebSocketEvents {
  // 工單事件
  'workorder:created': (workOrder: WorkOrder) => void;
  'workorder:started': (workOrderId: string) => void;
  'workorder:completed': (workOrderId: string) => void;
  
  // 進度事件
  'progress:updated': (progress: any) => void;
  'schedule:changed': (schedule: any) => void;
  
  // 異常事件
  'alert:capacity': (alert: any) => void;
  'alert:delay': (alert: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **OM**: 訂單需求匯入
- **WMS**: 物料供應狀況
- **BDM**: 產品BOM、工藝路線
- **PM**: 採購計劃連動
- **QM**: 品質檢驗整合

### 5.2 外部系統整合
- **SCADA**: 設備數據採集
- **PLC**: 控制系統連接
- **條碼系統**: 生產追蹤
- **RFID**: 在製品追蹤

## 6. 測試需求

### 6.1 功能測試
- 排程算法準確性
- 工單狀態轉換
- 產能計算正確性
- 資源衝突檢測

### 6.2 效能測試
- 1000個工單排程測試
- 並發回報壓力測試
- 甘特圖渲染效能
- 即時數據更新延遲

### 6.3 整合測試
- 訂單轉工單流程
- 物料供應檢查
- 設備數據採集
- 品質數據同步

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 基礎架構與資料模型
2. **Phase 2** (Week 3-4): 生產計劃功能
3. **Phase 3** (Week 5-6): 工單管理功能
4. **Phase 4** (Week 7-8): 排程優化算法
5. **Phase 5** (Week 9-10): 系統整合測試

### 7.2 關鍵里程碑
- M1: 資料模型完成
- M2: 核心功能開發完成
- M3: 排程算法實作
- M4: 系統整合測試完成
- M5: 上線準備就緒

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 排程算法複雜度高 | 高 | 高 | 採用成熟算法庫，分階段優化 |
| 設備數據整合困難 | 高 | 中 | 建立標準介面，逐步整合 |
| 即時性要求高 | 中 | 高 | 採用事件驅動架構，優化資料庫 |
| 使用者接受度 | 中 | 中 | 提供完整培訓，階段性導入 |

## 9. 成功指標

### 9.1 業務指標
- 生產效率提升 ≥ 35%
- 準時交貨率 ≥ 95%
- 設備利用率 ≥ 80%
- 在製品減少 ≥ 30%

### 9.2 系統指標
- 排程準確率 ≥ 90%
- 系統可用性 ≥ 99.5%
- 回應時間 < 2秒
- 數據準確性 100%

## 10. 相關文件

- [MES 總體架構](../README.md)
- [BOM 管理 PRD](../07.2-MES-MBU-Material_BOM_Unit/prd.md)
- [品質管理 PRD](../../10-QM-Quality_Management/README.md)
- [API 規範文件](../../docs/api/mes-api.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: mes@tsaitung.com