# LM-DTRV 配送追蹤與即時檢視 (Delivery Tracking & Real-Time View) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: LM-DSRO (排程優化), LM-DVM (司機車輛), LM-ESDR (電子簽收), CRM (客戶管理)

## 1. 功能概述

### 1.1 目的
建立全方位即時配送追蹤系統，提供端到端的貨物追蹤能力，讓管理者、司機和客戶都能即時掌握配送狀態。

### 1.2 範圍
- GPS即時定位
- 配送進度追蹤
- 客戶追蹤介面
- 異常預警系統
- 數據分析看板

### 1.3 關鍵價值
- 配送透明度提升 100%
- 客戶查詢減少 60%
- 異常響應時間縮短 70%
- 配送效率提升 35%

## 2. 功能性需求

### FR-LM-DTRV-001: GPS即時定位
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 車輛啟動或配送任務開始
- **行為**: 持續追蹤車輛位置並即時更新
- **資料輸入**: 
  - GPS座標數據
  - 車輛狀態資訊
  - 司機身份識別
  - 時間戳記
  - 移動速度
- **資料輸出**: 
  - 即時位置地圖
  - 行駛軌跡
  - 停留點分析
  - 速度監控
  - 里程統計
- **UI反應**: 
  - 地圖即時更新
  - 車輛圖標顯示
  - 軌跡繪製
  - 熱力圖分析
  - 多車監控
- **例外處理**: 
  - 信號遺失處理
  - 位置偏移校正
  - 異常停留警告
  - 越界提醒

#### 驗收標準
```yaml
- 條件: 正常行駛狀態
  預期結果: 每10秒更新一次位置，延遲小於3秒

- 條件: 進入信號盲區
  預期結果: 顯示最後已知位置，恢復後自動補齊軌跡

- 條件: 車輛超速行駛
  預期結果: 即時發出超速警告並記錄
```

#### Traceability
- **測試案例**: tests/unit/FR-LM-DTRV-001.test.ts
- **實作程式**: src/modules/lm/services/gpsTracking.service.ts
- **相關文件**: TOC Modules.md - Section 10.4

### FR-LM-DTRV-002: 配送進度追蹤
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 配送任務執行過程
- **行為**: 追蹤每個配送點的完成進度
- **資料輸入**: 
  - 配送任務清單
  - 完成狀態更新
  - 預計到達時間
  - 實際到達時間
  - 服務時長
- **資料輸出**: 
  - 進度百分比
  - 剩餘任務數
  - 時間預估
  - 延遲分析
  - 完成率統計
- **UI反應**: 
  - 進度條顯示
  - 任務清單
  - 時間軸視圖
  - 統計圖表
  - 預測分析
- **例外處理**: 
  - 進度延遲
  - 任務跳過
  - 順序調整
  - 緊急插單

#### 配送追蹤模型
```typescript
interface DeliveryTracking {
  trackingId: string;
  routeId: string;
  
  // 即時位置
  currentLocation: {
    coordinates: Coordinates;
    address: string;
    timestamp: Date;
    speed: number;
    heading: number;
    accuracy: number;
  };
  
  // 配送進度
  progress: {
    totalStops: number;
    completedStops: number;
    currentStop: number;
    nextStop: number;
    
    percentage: number;
    estimatedCompletion: Date;
    
    stops: {
      sequence: number;
      orderId: string;
      customerId: string;
      
      status: 'pending' | 'approaching' | 'arrived' | 'servicing' | 'completed' | 'skipped';
      
      planned: {
        arrivalTime: Date;
        serviceTime: number;
      };
      
      actual?: {
        arrivalTime?: Date;
        departureTime?: Date;
        serviceTime?: number;
        delay?: number;
      };
      
      distance: {
        fromPrevious: number;
        toNext: number;
        remaining: number;
      };
    }[];
  };
  
  // 路線資訊
  route: {
    plannedPath: Coordinates[];
    actualPath: Coordinates[];
    totalDistance: number;
    coveredDistance: number;
    remainingDistance: number;
    
    deviations: {
      timestamp: Date;
      location: Coordinates;
      distance: number;
      reason?: string;
    }[];
  };
  
  // 預測分析
  predictions: {
    eta: Date;                    // 預計完成時間
    delay: number;                // 預計延遲
    successProbability: number;   // 成功機率
    riskFactors: string[];        // 風險因素
  };
  
  // 異常事件
  events: {
    type: 'start' | 'stop' | 'delay' | 'deviation' | 'emergency';
    timestamp: Date;
    description: string;
    impact?: string;
  }[];
}
```

### FR-LM-DTRV-003: 客戶追蹤介面
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 客戶查詢配送狀態
- **行為**: 提供友善的客戶自助查詢介面
- **資料輸入**: 
  - 訂單編號
  - 手機號碼
  - 追蹤碼
  - 驗證資訊
  - 查詢時間
- **資料輸出**: 
  - 配送狀態
  - 預計到達時間
  - 司機位置
  - 聯絡方式
  - 歷史記錄
- **UI反應**: 
  - 響應式網頁
  - 手機APP
  - 簡潔地圖
  - 即時更新
  - 多語言支援
- **例外處理**: 
  - 查無資料
  - 授權失敗
  - 隱私保護
  - 服務中斷

#### 客戶追蹤體驗
```typescript
interface CustomerTracking {
  // 查詢介面
  query: {
    method: 'order' | 'phone' | 'tracking' | 'qrcode';
    value: string;
    verified: boolean;
  };
  
  // 顯示資訊
  display: {
    // 基本資訊
    orderInfo: {
      orderNo: string;
      trackingNo: string;
      recipientName: string;  // 部分遮罩
      deliveryAddress: string; // 部分遮罩
    };
    
    // 狀態資訊
    status: {
      current: string;
      description: string;
      icon: string;
      color: string;
      
      timeline: {
        status: string;
        timestamp: Date;
        completed: boolean;
      }[];
    };
    
    // 配送資訊
    delivery: {
      estimatedTime: string;  // 時間範圍
      currentLocation?: {     // 僅顯示區域
        area: string;
        distance: number;
      };
      
      driver?: {
        name: string;         // 僅顯示姓氏
        phone: string;        // 可撥打
        rating: number;
      };
    };
    
    // 互動功能
    actions: {
      canReschedule: boolean;
      canContact: boolean;
      canRate: boolean;
      canShare: boolean;
    };
  };
  
  // 通知訂閱
  subscription?: {
    method: 'sms' | 'email' | 'app';
    frequency: 'milestone' | 'realtime';
    enabled: boolean;
  };
}
```

### FR-LM-DTRV-004: 異常預警系統
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 配送過程中的異常情況
- **行為**: 自動偵測異常並發出預警
- **資料輸入**: 
  - 位置偏離度
  - 時間延遲
  - 停留時長
  - 速度異常
  - 通訊中斷
- **資料輸出**: 
  - 預警通知
  - 風險評級
  - 處理建議
  - 影響範圍
  - 歷史記錄
- **UI反應**: 
  - 彈出警告
  - 聲音提醒
  - 顏色標記
  - 詳情展開
  - 快速處理
- **例外處理**: 
  - 誤報處理
  - 升級機制
  - 批量異常
  - 系統故障

### FR-LM-DTRV-005: 數據分析看板
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 管理層監控需求
- **行為**: 提供全面的配送數據分析看板
- **資料輸入**: 
  - 即時追蹤數據
  - 歷史配送記錄
  - 異常事件日誌
  - 客戶反饋
  - 成本數據
- **資料輸出**: 
  - 即時監控大屏
  - KPI指標
  - 趨勢圖表
  - 熱點分析
  - 預測報告
- **UI反應**: 
  - 大屏展示
  - 自動刷新
  - 互動操作
  - 多維分析
  - 自訂配置
- **例外處理**: 
  - 數據延遲
  - 計算錯誤
  - 顯示異常
  - 權限控制

## 3. 系統設計

### 3.1 資料模型

```typescript
// GPS追蹤數據
interface GPSTrackingData {
  deviceId: string;
  vehicleId: string;
  driverId: string;
  
  // 位置數據流
  locationStream: {
    timestamp: Date;
    coordinates: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    
    motion: {
      speed: number;        // km/h
      heading: number;      // 方向角
      acceleration?: number;
    };
    
    quality: {
      accuracy: number;     // 精度(米)
      satellites: number;   // 衛星數
      hdop?: number;        // 水平精度因子
      source: 'gps' | 'network' | 'mixed';
    };
    
    context: {
      engineOn: boolean;
      doors: 'open' | 'closed';
      temperature?: number;
      fuel?: number;
    };
  }[];
  
  // 聚合統計
  statistics: {
    totalDistance: number;
    avgSpeed: number;
    maxSpeed: number;
    idleTime: number;
    drivingTime: number;
    stops: number;
  };
  
  // 地理圍欄
  geofences: {
    id: string;
    name: string;
    type: 'circle' | 'polygon';
    status: 'inside' | 'outside';
    enteredAt?: Date;
    exitedAt?: Date;
  }[];
}

// 監控預警
interface MonitoringAlert {
  id: string;
  alertType: string;
  
  // 預警定義
  definition: {
    category: 'location' | 'time' | 'behavior' | 'device' | 'business';
    
    trigger: {
      condition: string;
      threshold: any;
      duration?: number;
      frequency?: number;
    };
    
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    
    escalation: {
      levels: {
        level: number;
        delay: number;
        recipients: string[];
      }[];
    };
  };
  
  // 觸發資訊
  incident: {
    triggeredAt: Date;
    triggerValue: any;
    
    context: {
      vehicleId: string;
      driverId: string;
      orderId?: string;
      location: Coordinates;
    };
    
    evidence: {
      data: any;
      snapshots?: string[];
      logs?: string[];
    };
  };
  
  // 處理狀態
  handling: {
    status: 'new' | 'acknowledged' | 'processing' | 'resolved' | 'false_positive';
    
    assignedTo?: string;
    acknowledgedAt?: Date;
    
    actions: {
      timestamp: Date;
      action: string;
      operator: string;
      notes?: string;
    }[];
    
    resolution?: {
      resolvedAt: Date;
      resolvedBy: string;
      solution: string;
      preventive?: string;
    };
  };
}

// 分析看板配置
interface DashboardConfig {
  id: string;
  name: string;
  
  // 版面配置
  layout: {
    type: 'grid' | 'flow' | 'tabs';
    columns: number;
    rows: number;
    
    widgets: {
      id: string;
      type: 'map' | 'chart' | 'table' | 'kpi' | 'list';
      position: { x: number; y: number; w: number; h: number; };
      
      config: {
        title: string;
        dataSource: string;
        refreshInterval: number;
        filters?: any[];
        visualization?: any;
      };
    }[];
  };
  
  // 數據源
  dataSources: {
    id: string;
    type: 'realtime' | 'historical' | 'aggregated';
    endpoint: string;
    parameters?: any;
    cache?: number;
  }[];
  
  // 互動設置
  interactions: {
    drilling: boolean;
    filtering: boolean;
    exporting: boolean;
    sharing: boolean;
  };
  
  // 權限控制
  permissions: {
    owner: string;
    viewers: string[];
    editors: string[];
    public: boolean;
  };
}
```

### 3.2 API 設計

```typescript
// 追蹤服務 API
interface TrackingServiceAPI {
  // GPS追蹤
  POST   /api/lm/tracking/location             // 上報位置
  GET    /api/lm/tracking/realtime/:vehicleId  // 即時位置
  GET    /api/lm/tracking/history/:vehicleId   // 歷史軌跡
  GET    /api/lm/tracking/fleet                // 車隊總覽
  
  // 配送追蹤
  GET    /api/lm/tracking/delivery/:orderId    // 配送狀態
  GET    /api/lm/tracking/route/:routeId       // 路線進度
  POST   /api/lm/tracking/eta/calculate        // 計算預計到達
  
  // 客戶查詢
  GET    /api/lm/tracking/customer/:trackingNo // 客戶追蹤
  POST   /api/lm/tracking/subscribe            // 訂閱通知
  GET    /api/lm/tracking/verify/:code         // 驗證查詢
}

// 監控預警 API
interface MonitoringAPI {
  // 預警管理
  POST   /api/lm/monitoring/alerts             // 建立預警
  GET    /api/lm/monitoring/alerts/active      // 活躍預警
  PUT    /api/lm/monitoring/alerts/:id/ack     // 確認預警
  PUT    /api/lm/monitoring/alerts/:id/resolve // 解決預警
  
  // 即時監控
  GET    /api/lm/monitoring/dashboard          // 監控看板
  GET    /api/lm/monitoring/statistics         // 統計數據
  WS     /api/lm/monitoring/stream             // 即時數據流
}

// WebSocket 事件
interface TrackingWebSocketEvents {
  'location:updated': (location: any) => void;
  'delivery:progress': (progress: any) => void;
  'alert:triggered': (alert: any) => void;
  'eta:changed': (eta: any) => void;
  'route:deviation': (deviation: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **LM-DSRO**: 路線規劃
- **LM-DVM**: 車輛資訊
- **LM-ESDR**: 簽收狀態
- **OM**: 訂單資訊
- **CRM**: 客戶資料

### 4.2 外部系統整合
- **GPS設備**: 定位數據
- **地圖服務**: 地圖顯示
- **通訊網路**: 4G/5G網路
- **IoT平台**: 感測器數據

## 5. 成功指標

### 5.1 業務指標
- 追蹤準確率 ≥ 99%
- 客戶查詢成功率 ≥ 95%
- 預警準確率 ≥ 90%
- 客戶滿意度 ≥ 4.5/5

### 5.2 系統指標
- 位置更新延遲 < 3秒
- 系統可用性 ≥ 99.9%
- 查詢響應時間 < 1秒
- 並發支援 ≥ 10000

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: lm@tsaitung.com