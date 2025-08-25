# LM-DSRO 配送排程與路線優化 (Delivery Schedule & Route Optimization) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: OM (訂單管理), WMS (倉儲管理), LM-DVM (司機車輛管理), CRM (客戶管理)

## 1. 功能概述

### 1.1 目的
建立智慧化配送排程與路線優化系統，運用AI演算法自動規劃最佳配送路線，提升配送效率，降低運輸成本，確保準時交貨率。

### 1.2 範圍
- 智慧排程規劃
- 路線優化演算
- 時間窗管理
- 載重容積優化
- 即時調度調整

### 1.3 關鍵價值
- 配送成本降低 25%
- 準時交貨率提升至 98%
- 車輛利用率提升 30%
- 碳排放減少 20%

## 2. 功能性需求

### FR-LM-DSRO-001: 智慧排程規劃
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 每日固定時間或手動觸發排程
- **行為**: 根據訂單、車輛、司機資源自動生成最優配送計劃
- **資料輸入**: 
  - 待配送訂單清單
  - 可用車輛資源
  - 司機排班資訊
  - 客戶時間窗限制
  - 道路交通狀況
- **資料輸出**: 
  - 配送排程表
  - 車輛調度計劃
  - 司機任務分配
  - 預計時程表
  - 成本預估
- **UI反應**: 
  - 拖拽式排程調整
  - 甘特圖顯示
  - 地圖視覺化
  - 即時狀態更新
  - 異常警示
- **例外處理**: 
  - 資源不足預警
  - 超時配送處理
  - 緊急插單調整
  - 車輛故障應變

#### 驗收標準
```yaml
- 條件: 100筆訂單自動排程
  預期結果: 3秒內生成最優配送計劃

- 條件: 車輛容量限制
  預期結果: 不超過車輛載重和容積限制

- 條件: 時間窗衝突
  預期結果: 自動調整並提供替代方案
```

#### Traceability
- **測試案例**: tests/unit/FR-LM-DSRO-001.test.ts
- **實作程式**: src/modules/lm/services/deliveryScheduling.service.ts
- **相關文件**: TOC Modules.md - Section 10.1

### FR-LM-DSRO-002: 路線優化演算
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 排程生成或路線調整需求
- **行為**: 運用AI演算法計算最優配送路線
- **資料輸入**: 
  - 配送點座標
  - 道路網絡資料
  - 即時交通資訊
  - 車輛特性參數
  - 成本權重設定
- **資料輸出**: 
  - 最優路線規劃
  - 行駛距離統計
  - 預計行程時間
  - 油耗成本預估
  - 替代路線建議
- **UI反應**: 
  - 地圖路線顯示
  - 多方案比較
  - 模擬預覽
  - 成本分析圖表
  - 即時重算
- **例外處理**: 
  - 道路封閉處理
  - 交通壅塞繞行
  - 天氣影響調整
  - 臨時改址處理

#### 路線優化演算法
```typescript
interface RouteOptimization {
  algorithm: {
    type: 'VRP' | 'TSP' | 'Genetic' | 'AntColony';
    
    parameters: {
      maxIterations: number;
      populationSize?: number;
      mutationRate?: number;
      convergenceThreshold: number;
    };
    
    constraints: {
      vehicleCapacity: number;
      maxDistance: number;
      maxDuration: number;
      timeWindows: TimeWindow[];
      vehicleTypes: string[];
    };
    
    objectives: {
      minimizeDistance: number;  // 權重
      minimizeTime: number;
      minimizeCost: number;
      maximizeUtilization: number;
      balanceWorkload: number;
    };
  };
  
  calculate(): RouteResult {
    // VRP (Vehicle Routing Problem) 實作
    const routes = this.initializeRoutes();
    
    for (let i = 0; i < this.parameters.maxIterations; i++) {
      routes = this.improveRoutes(routes);
      
      if (this.hasConverged(routes)) {
        break;
      }
    }
    
    return this.buildResult(routes);
  }
}
```

### FR-LM-DSRO-003: 時間窗管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 客戶指定收貨時間或配送時段限制
- **行為**: 管理和優化配送時間窗約束
- **資料輸入**: 
  - 客戶時間偏好
  - 營業時間限制
  - 尖峰時段設定
  - 卸貨時間估算
  - 等待成本參數
- **資料輸出**: 
  - 時間窗分配表
  - 衝突檢測報告
  - 等待時間統計
  - 遲到風險評估
  - 調整建議
- **UI反應**: 
  - 時間軸視圖
  - 衝突高亮顯示
  - 拖拽調整
  - 可行性檢查
  - 客戶通知
- **例外處理**: 
  - 時間窗衝突解決
  - 緊急時段處理
  - 客戶變更請求
  - 延遲補償計算

### FR-LM-DSRO-004: 載重容積優化
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 配送裝載規劃
- **行為**: 優化車輛載重和容積使用率
- **資料輸入**: 
  - 貨物尺寸重量
  - 車輛規格參數
  - 裝載順序要求
  - 貨物相容性
  - 堆疊限制
- **資料輸出**: 
  - 裝載計劃圖
  - 利用率報告
  - 裝載順序表
  - 重心分析
  - 安全檢查結果
- **UI反應**: 
  - 3D裝載模擬
  - 容積率顯示
  - 重量分布圖
  - 警告提示
  - 優化建議
- **例外處理**: 
  - 超載預警
  - 不相容貨物
  - 易碎品處理
  - 危險品管理

### FR-LM-DSRO-005: 即時調度調整
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 配送過程中的異常或變更需求
- **行為**: 動態調整配送計劃應對突發狀況
- **資料輸入**: 
  - 即時位置資訊
  - 異常事件通報
  - 新增緊急訂單
  - 取消變更請求
  - 路況更新
- **資料輸出**: 
  - 調整方案
  - 影響分析
  - 通知清單
  - 成本變化
  - 新時程表
- **UI反應**: 
  - 即時地圖更新
  - 變更提醒
  - 確認流程
  - 歷史記錄
  - 績效影響
- **例外處理**: 
  - 多重異常處理
  - 資源調度失敗
  - 客戶拒收
  - 系統故障應變

## 3. 系統設計

### 3.1 資料模型

```typescript
// 配送排程
interface DeliverySchedule {
  id: string;
  scheduleDate: Date;
  
  // 排程資訊
  scheduling: {
    type: 'daily' | 'weekly' | 'custom';
    status: 'draft' | 'confirmed' | 'in_progress' | 'completed';
    version: number;
    
    parameters: {
      optimizationGoal: string;
      constraints: Constraint[];
      priorities: Priority[];
    };
  };
  
  // 路線規劃
  routes: {
    routeId: string;
    vehicleId: string;
    driverId: string;
    
    // 路線詳情
    details: {
      startTime: Date;
      endTime: Date;
      totalDistance: number;
      totalDuration: number;
      
      stops: {
        sequence: number;
        orderId: string;
        customerId: string;
        
        location: {
          address: string;
          coordinates: Coordinates;
          landmark?: string;
        };
        
        timeWindow: {
          earliest: Date;
          latest: Date;
          preferred?: Date;
        };
        
        service: {
          arrivalTime: Date;
          serviceTime: number;
          departureTime: Date;
        };
        
        cargo: {
          weight: number;
          volume: number;
          pieces: number;
          special?: string[];
        };
      }[];
      
      // 路線軌跡
      path: {
        segments: PathSegment[];
        totalDistance: number;
        estimatedTime: number;
      };
    };
    
    // 成本估算
    cost: {
      fuel: number;
      labor: number;
      toll: number;
      other: number;
      total: number;
    };
    
    // 績效指標
    metrics: {
      utilization: number;
      efficiency: number;
      onTimeRate: number;
    };
  }[];
  
  // 統計摘要
  summary: {
    totalOrders: number;
    totalRoutes: number;
    totalDistance: number;
    totalCost: number;
    avgUtilization: number;
  };
  
  createdAt: Date;
  createdBy: string;
  confirmedAt?: Date;
}

// 路線優化結果
interface OptimizationResult {
  id: string;
  requestId: string;
  
  // 優化參數
  input: {
    orders: Order[];
    vehicles: Vehicle[];
    constraints: Constraint[];
    algorithm: string;
  };
  
  // 優化結果
  solution: {
    routes: OptimizedRoute[];
    unassigned: string[];
    
    metrics: {
      totalDistance: number;
      totalTime: number;
      totalCost: number;
      vehicleUtilization: number;
      feasibility: boolean;
    };
    
    comparison: {
      baseline: Metrics;
      optimized: Metrics;
      improvement: number;
    };
  };
  
  // 執行資訊
  execution: {
    algorithm: string;
    iterations: number;
    runtime: number;
    convergence: number;
  };
  
  generatedAt: Date;
}

// 即時調度
interface RealTimeDispatch {
  id: string;
  scheduleId: string;
  
  // 調度事件
  event: {
    type: 'delay' | 'breakdown' | 'urgent' | 'cancel' | 'traffic';
    timestamp: Date;
    description: string;
    
    affected: {
      routeId: string;
      vehicleId?: string;
      orderIds: string[];
    };
  };
  
  // 調整方案
  adjustment: {
    strategy: 'reroute' | 'reassign' | 'reschedule' | 'cancel';
    
    changes: {
      type: string;
      from: any;
      to: any;
      reason: string;
    }[];
    
    newRoutes?: Route[];
    notifications: Notification[];
  };
  
  // 影響評估
  impact: {
    affectedOrders: number;
    delayedDeliveries: number;
    additionalCost: number;
    customerImpact: string;
  };
  
  // 處理狀態
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  
  processedBy?: string;
  processedAt?: Date;
}
```

### 3.2 API 設計

```typescript
// 排程管理 API
interface SchedulingAPI {
  // 排程操作
  POST   /api/lm/schedules                    // 建立排程
  GET    /api/lm/schedules                    // 查詢排程列表
  GET    /api/lm/schedules/:id                // 取得排程詳情
  PUT    /api/lm/schedules/:id                // 更新排程
  POST   /api/lm/schedules/:id/confirm        // 確認排程
  POST   /api/lm/schedules/:id/execute        // 執行排程
  
  // 路線優化
  POST   /api/lm/optimization/calculate       // 計算最優路線
  GET    /api/lm/optimization/:id/result      // 取得優化結果
  POST   /api/lm/optimization/simulate        // 模擬優化
  
  // 即時調度
  POST   /api/lm/dispatch/adjust              // 調整配送
  GET    /api/lm/dispatch/events              // 查詢調度事件
  POST   /api/lm/dispatch/emergency           // 緊急調度
}

// WebSocket 事件
interface SchedulingWebSocketEvents {
  'schedule:created': (schedule: any) => void;
  'schedule:updated': (schedule: any) => void;
  'route:optimized': (result: any) => void;
  'dispatch:alert': (alert: any) => void;
  'traffic:update': (traffic: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OM**: 訂單資訊來源
- **WMS**: 出貨準備狀態
- **LM-DVM**: 車輛司機資源
- **CRM**: 客戶配送偏好
- **地圖服務**: 路線導航

### 4.2 外部系統整合
- **Google Maps API**: 路線規劃
- **交通資訊API**: 即時路況
- **天氣API**: 天氣影響評估
- **GPS追蹤**: 車輛定位

## 5. 成功指標

### 5.1 業務指標
- 準時交貨率 ≥ 98%
- 配送成本降低 ≥ 25%
- 車輛利用率 ≥ 85%
- 客戶滿意度 ≥ 4.5/5

### 5.2 系統指標
- 排程計算時間 < 5秒
- 路線優化改善率 > 20%
- 系統可用性 ≥ 99.5%
- API響應時間 < 1秒

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: lm@tsaitung.com