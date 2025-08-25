# MES-PMR 進度監控與報表 (Progress Monitoring & Reports) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: MES-PSWO (生產排程), MES-MBU (材料管理), MES-PEMLD (效率儀表板), OM (訂單管理)

## 1. 功能概述

### 1.1 目的
提供全面的生產進度監控與報表系統，實現生產過程透明化，支援多層級管理決策，確保訂單準時交付。

### 1.2 範圍
- 即時生產進度追蹤
- 多維度報表生成
- 異常事件管理
- 績效分析報告
- 預測性分析

### 1.3 關鍵價值
- 訂單準時交付率提升至 98%
- 生產透明度提升 100%
- 報表生成時間縮短 85%
- 決策準確度提升 45%

## 2. 功能性需求

### FR-MES-PMR-001: 即時進度監控
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 生產過程中持續監控
- **行為**: 即時追蹤工單、工序、產品進度
- **資料輸入**: 
  - 工單狀態更新
  - 工序完成回報
  - 設備運行數據
  - 品質檢驗結果
  - 異常事件記錄
- **資料輸出**: 
  - 進度看板
  - 完成率統計
  - 延遲預警
  - 瓶頸識別
  - 預計完工時間
- **UI反應**: 
  - 即時更新看板
  - 進度條顯示
  - 顏色標記狀態
  - 動態甘特圖
  - 里程碑追蹤
- **例外處理**: 
  - 延遲自動預警
  - 瓶頸即時提醒
  - 異常升級機制
  - 替代方案建議

#### 驗收標準
```yaml
- 條件: 工序完成回報
  預期結果: 1秒內更新進度看板

- 條件: 進度落後10%
  預期結果: 立即觸發預警並通知相關人員

- 條件: 查詢訂單進度
  預期結果: 顯示完整生產鏈進度與預計完工時間
```

#### Traceability
- **測試案例**: tests/unit/FR-MES-PMR-001.test.ts
- **實作程式**: src/modules/mes/services/progressMonitoring.service.ts
- **相關文件**: TOC Modules.md - Section 7.5

### FR-MES-PMR-002: 生產報表系統
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 定期生成或即時查詢
- **行為**: 生成多維度生產報表
- **資料輸入**: 
  - 生產數據
  - 品質數據
  - 效率指標
  - 成本資訊
  - 異常記錄
- **資料輸出**: 
  - 日/週/月報表
  - 交期達成報告
  - 效率分析報告
  - 品質統計報告
  - 成本分析報告
- **UI反應**: 
  - 報表範本選擇
  - 自訂報表設計
  - 匯出多種格式
  - 定期發送設定
  - 互動式圖表
- **例外處理**: 
  - 數據缺失提醒
  - 異常數據標記
  - 報表生成失敗重試

#### 報表類型定義
```typescript
interface ProductionReport {
  id: string;
  type: ReportType;
  
  // 報表資訊
  info: {
    name: string;
    period: {
      start: Date;
      end: Date;
    };
    frequency: 'daily' | 'weekly' | 'monthly' | 'adhoc';
    format: 'pdf' | 'excel' | 'html' | 'dashboard';
  };
  
  // 生產總覽
  production: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    delayedOrders: number;
    
    totalQuantity: number;
    completedQuantity: number;
    defectQuantity: number;
    
    onTimeDeliveryRate: number;
    completionRate: number;
    yieldRate: number;
  };
  
  // 效率分析
  efficiency: {
    oee: number;
    utilizationRate: number;
    productivityRate: number;
    setupTimeRatio: number;
    downtimeAnalysis: {
      planned: number;
      unplanned: number;
      breakdown: number;
    };
  };
  
  // 品質分析
  quality: {
    firstPassYield: number;
    defectRate: number;
    reworkRate: number;
    scrapRate: number;
    topDefects: {
      type: string;
      count: number;
      percentage: number;
    }[];
  };
  
  // 成本分析
  cost: {
    totalCost: number;
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    wasteCost: number;
    costPerUnit: number;
    costVariance: number;
  };
  
  // 異常事件
  exceptions: {
    total: number;
    critical: number;
    resolved: number;
    avgResolutionTime: number;
    topIssues: {
      type: string;
      frequency: number;
      impact: number;
    }[];
  };
}

enum ReportType {
  DAILY_PRODUCTION = 'daily_production',
  WEEKLY_SUMMARY = 'weekly_summary',
  MONTHLY_ANALYSIS = 'monthly_analysis',
  ORDER_STATUS = 'order_status',
  EFFICIENCY_REPORT = 'efficiency_report',
  QUALITY_REPORT = 'quality_report',
  COST_ANALYSIS = 'cost_analysis',
  EXCEPTION_REPORT = 'exception_report',
  CUSTOM = 'custom'
}
```

### FR-MES-PMR-003: 訂單追蹤系統
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 客戶或內部查詢訂單狀態
- **行為**: 提供訂單全程追蹤視圖
- **資料輸入**: 
  - 訂單資訊
  - 工單進度
  - 物料狀態
  - 品質結果
  - 出貨資訊
- **資料輸出**: 
  - 訂單時間軸
  - 當前狀態
  - 完成百分比
  - 預計交期
  - 歷程記錄
- **UI反應**: 
  - 視覺化追蹤
  - 階段性顯示
  - 關鍵節點標記
  - 客戶端查詢
  - 通知推送

### FR-MES-PMR-004: 績效分析報告
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 管理層績效評估需求
- **行為**: 分析生產績效並提供改善建議
- **資料輸入**: 
  - KPI指標
  - 歷史數據
  - 目標設定
  - 基準對比
  - 最佳實踐
- **資料輸出**: 
  - 績效得分卡
  - 趨勢分析
  - 差異分析
  - 改善機會
  - 行動計劃
- **UI反應**: 
  - 儀表板展示
  - 雷達圖分析
  - 熱力圖顯示
  - 鑽取式探索

### FR-MES-PMR-005: 預測性分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期執行或需求觸發
- **行為**: 基於歷史數據預測未來生產狀況
- **資料輸入**: 
  - 歷史生產數據
  - 季節性因素
  - 市場需求
  - 資源限制
  - 外部因素
- **資料輸出**: 
  - 產能預測
  - 交期預測
  - 瓶頸預測
  - 需求預測
  - 風險預警
- **UI反應**: 
  - 預測圖表
  - 信心區間
  - 情境分析
  - 假設模擬

## 3. 非功能性需求

### 3.1 效能需求
- 進度更新延遲 < 1秒
- 報表生成時間 < 10秒
- 支援 1000個工單同時監控
- 歷史數據查詢 < 3秒

### 3.2 可靠性需求
- 系統可用性 99.9%
- 數據完整性 100%
- 報表準確率 99.9%
- 自動備份機制

### 3.3 安全性需求
- 角色權限控制
- 報表加密傳輸
- 審計日誌記錄
- 資料脫敏處理

## 4. 系統設計

### 4.1 資料模型

```typescript
// 進度監控
interface ProgressMonitoring {
  id: string;
  workOrderId: string;
  orderId: string;
  
  // 進度資訊
  progress: {
    overall: number;          // 整體進度
    byOperation: {           // 工序進度
      operationId: string;
      name: string;
      sequence: number;
      progress: number;
      status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    }[];
    
    milestones: {            // 里程碑
      name: string;
      plannedDate: Date;
      actualDate?: Date;
      status: 'pending' | 'achieved' | 'missed';
    }[];
  };
  
  // 時間追蹤
  timeline: {
    plannedStart: Date;
    actualStart?: Date;
    plannedEnd: Date;
    estimatedEnd: Date;
    actualEnd?: Date;
    
    delays: {
      reason: string;
      duration: number;
      impact: 'low' | 'medium' | 'high';
      resolution?: string;
    }[];
  };
  
  // 數量追蹤
  quantity: {
    ordered: number;
    planned: number;
    inProgress: number;
    completed: number;
    shipped: number;
    
    quality: {
      good: number;
      defect: number;
      rework: number;
      scrap: number;
    };
  };
  
  // 資源使用
  resources: {
    manHours: {
      planned: number;
      actual: number;
      efficiency: number;
    };
    
    machineHours: {
      planned: number;
      actual: number;
      utilization: number;
    };
    
    materials: {
      planned: number;
      consumed: number;
      variance: number;
    };
  };
  
  // 即時狀態
  currentStatus: {
    location: string;
    operation: string;
    operator?: string;
    machine?: string;
    startTime: Date;
    estimatedCompletion: Date;
  };
  
  // 異常追蹤
  issues: {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    occurredAt: Date;
    resolvedAt?: Date;
    impact: string;
    resolution?: string;
  }[];
  
  lastUpdated: Date;
  nextUpdate: Date;
}

// 報表配置
interface ReportConfiguration {
  id: string;
  name: string;
  type: ReportType;
  
  // 排程設定
  schedule: {
    enabled: boolean;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  
  // 資料範圍
  dataScope: {
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    customRange?: {
      start: Date;
      end: Date;
    };
    
    filters: {
      departments?: string[];
      workstations?: string[];
      products?: string[];
      customers?: string[];
      orderTypes?: string[];
    };
  };
  
  // 內容設定
  content: {
    sections: {
      name: string;
      type: string;
      enabled: boolean;
      order: number;
      config: any;
    }[];
    
    metrics: string[];
    charts: {
      type: string;
      dataSource: string;
      options: any;
    }[];
    
    tables: {
      name: string;
      columns: string[];
      sorting: string;
      grouping?: string;
    }[];
  };
  
  // 輸出設定
  output: {
    format: ('pdf' | 'excel' | 'html' | 'csv')[];
    template?: string;
    styling?: any;
    
    distribution: {
      email: {
        enabled: boolean;
        recipients: string[];
        subject: string;
        body: string;
      };
      
      storage: {
        enabled: boolean;
        path: string;
        retention: number;
      };
      
      dashboard: {
        enabled: boolean;
        widgetId: string;
      };
    };
  };
  
  // 權限設定
  permissions: {
    owner: string;
    viewers: string[];
    editors: string[];
    isPublic: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
  lastGenerated?: Date;
}

// 訂單追蹤
interface OrderTracking {
  id: string;
  orderId: string;
  orderNo: string;
  
  // 客戶資訊
  customer: {
    id: string;
    name: string;
    contact: string;
    priority: 'normal' | 'high' | 'urgent';
  };
  
  // 訂單資訊
  orderInfo: {
    type: string;
    totalAmount: number;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unit: string;
    }[];
    
    dates: {
      ordered: Date;
      confirmed: Date;
      promised: Date;
      requested?: Date;
    };
  };
  
  // 生產追蹤
  production: {
    status: 'pending' | 'in_production' | 'completed' | 'shipped';
    progress: number;
    
    workOrders: {
      workOrderNo: string;
      product: string;
      quantity: number;
      status: string;
      progress: number;
    }[];
    
    currentStage: {
      stage: string;
      location: string;
      startTime: Date;
      estimatedCompletion: Date;
    };
  };
  
  // 品質追蹤
  quality: {
    inspections: {
      type: string;
      result: 'pass' | 'fail' | 'conditional';
      date: Date;
      inspector: string;
    }[];
    
    issues: {
      description: string;
      severity: string;
      status: string;
      resolution?: string;
    }[];
  };
  
  // 物流追蹤
  logistics: {
    packingStatus: 'pending' | 'in_progress' | 'completed';
    shippingStatus: 'pending' | 'ready' | 'shipped' | 'delivered';
    
    shipments: {
      shipmentNo: string;
      carrier: string;
      trackingNo: string;
      shippedDate?: Date;
      estimatedDelivery?: Date;
      actualDelivery?: Date;
    }[];
  };
  
  // 時間軸
  timeline: {
    event: string;
    description: string;
    timestamp: Date;
    user?: string;
    type: 'info' | 'warning' | 'success' | 'error';
  }[];
  
  // 通知設定
  notifications: {
    customerNotify: boolean;
    internalNotify: string[];
    events: string[];
    lastNotified?: Date;
  };
}

// 績效分析
interface PerformanceAnalysis {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // 績效指標
  metrics: {
    category: string;
    kpi: string;
    actual: number;
    target: number;
    achievement: number;
    trend: 'improving' | 'stable' | 'declining';
    
    breakdown: {
      dimension: string;
      values: {
        label: string;
        value: number;
        percentage: number;
      }[];
    };
  }[];
  
  // 比較分析
  comparison: {
    vsLastPeriod: {
      value: number;
      change: number;
      changeRate: number;
    };
    
    vsLastYear: {
      value: number;
      change: number;
      changeRate: number;
    };
    
    vsBenchmark: {
      internal: number;
      industry: number;
      bestInClass: number;
    };
  };
  
  // SWOT分析
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  // 改善建議
  improvements: {
    area: string;
    current: number;
    potential: number;
    actions: {
      action: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      priority: number;
    }[];
  }[];
  
  // 預測分析
  forecast: {
    metric: string;
    prediction: number;
    confidence: number;
    factors: {
      factor: string;
      impact: number;
    }[];
  }[];
  
  generatedAt: Date;
  generatedBy: string;
}
```

### 4.2 API 設計

```typescript
// 進度監控 API
interface ProgressMonitoringAPI {
  // 即時監控
  GET    /api/pmr/progress/realtime               // 即時進度
  GET    /api/pmr/progress/orders                 // 訂單進度
  GET    /api/pmr/progress/workorders             // 工單進度
  GET    /api/pmr/progress/operations             // 工序進度
  
  // 進度分析
  GET    /api/pmr/progress/delays                 // 延遲分析
  GET    /api/pmr/progress/bottlenecks            // 瓶頸分析
  GET    /api/pmr/progress/forecast               // 完工預測
  
  // 異常管理
  GET    /api/pmr/issues/active                   // 活動異常
  POST   /api/pmr/issues/report                   // 報告異常
  PUT    /api/pmr/issues/:id/resolve              // 解決異常
}

// 報表系統 API
interface ReportSystemAPI {
  // 報表管理
  POST   /api/pmr/reports/generate                // 生成報表
  GET    /api/pmr/reports/templates               // 報表範本
  POST   /api/pmr/reports/schedule                // 排程報表
  GET    /api/pmr/reports/history                 // 歷史報表
  
  // 報表配置
  POST   /api/pmr/reports/config                  // 建立配置
  PUT    /api/pmr/reports/config/:id              // 更新配置
  DELETE /api/pmr/reports/config/:id              // 刪除配置
  
  // 報表分發
  POST   /api/pmr/reports/:id/send                // 發送報表
  POST   /api/pmr/reports/:id/export              // 匯出報表
  GET    /api/pmr/reports/:id/preview             // 預覽報表
}

// 訂單追蹤 API
interface OrderTrackingAPI {
  // 訂單查詢
  GET    /api/pmr/tracking/orders/:orderId        // 訂單詳情
  GET    /api/pmr/tracking/timeline/:orderId      // 訂單時間軸
  GET    /api/pmr/tracking/status/:orderId        // 訂單狀態
  
  // 客戶查詢
  GET    /api/pmr/tracking/customer/:customerId   // 客戶訂單
  POST   /api/pmr/tracking/notify                 // 通知客戶
}

// 績效分析 API
interface PerformanceAnalysisAPI {
  // 績效報告
  GET    /api/pmr/performance/scorecard           // 績效記分卡
  GET    /api/pmr/performance/analysis            // 績效分析
  GET    /api/pmr/performance/comparison          // 績效比較
  
  // 改善建議
  GET    /api/pmr/performance/improvements        // 改善建議
  POST   /api/pmr/performance/actions             // 行動計劃
  GET    /api/pmr/performance/tracking            // 改善追蹤
}

// 預測分析 API
interface PredictiveAnalyticsAPI {
  // 預測模型
  POST   /api/pmr/predictive/forecast             // 執行預測
  GET    /api/pmr/predictive/models               // 可用模型
  POST   /api/pmr/predictive/simulate             // 情境模擬
  
  // 風險預警
  GET    /api/pmr/predictive/risks                // 風險評估
  GET    /api/pmr/predictive/alerts               // 預警提醒
}

// WebSocket 事件
interface MonitoringWebSocketEvents {
  // 進度事件
  'progress:updated': (progress: any) => void;
  'progress:delayed': (delay: any) => void;
  'progress:completed': (workOrder: any) => void;
  
  // 異常事件
  'issue:created': (issue: any) => void;
  'issue:escalated': (issue: any) => void;
  'issue:resolved': (issue: any) => void;
  
  // 報表事件
  'report:generated': (report: any) => void;
  'report:scheduled': (schedule: any) => void;
  
  // 預警事件
  'alert:triggered': (alert: any) => void;
  'forecast:updated': (forecast: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **MES-PSWO**: 排程與工單數據
- **MES-MBU**: 材料使用數據
- **MES-PEMLD**: 效率指標數據
- **OM**: 訂單資訊
- **WMS**: 庫存與出貨數據
- **QM**: 品質檢驗數據

### 5.2 外部系統整合
- **ERP**: 企業資源數據
- **CRM**: 客戶關係數據
- **SCM**: 供應鏈數據
- **BI工具**: 進階分析平台

## 6. 測試需求

### 6.1 功能測試
- 進度計算準確性
- 報表生成正確性
- 預警觸發及時性
- 數據同步一致性

### 6.2 效能測試
- 1000工單並發監控
- 大型報表生成效能
- 即時數據更新延遲
- 歷史數據查詢速度

### 6.3 整合測試
- 跨系統數據同步
- 報表數據一致性
- 事件通知機制
- 權限控制驗證

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 基礎架構與數據模型
2. **Phase 2** (Week 3-4): 進度監控功能
3. **Phase 3** (Week 5-6): 報表系統開發
4. **Phase 4** (Week 7): 績效分析功能
5. **Phase 5** (Week 8): 預測分析與整合測試

### 7.2 關鍵里程碑
- M1: 監控平台建立
- M2: 報表引擎完成
- M3: 分析功能上線
- M4: 預測模型部署
- M5: 系統全面運行

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 數據整合複雜 | 高 | 高 | 採用標準化介面 |
| 報表效能問題 | 高 | 中 | 實施快取機制 |
| 預測準確度低 | 中 | 中 | 持續優化模型 |
| 使用者培訓 | 中 | 低 | 提供完整文檔 |

## 9. 成功指標

### 9.1 業務指標
- 準時交付率 ≥ 98%
- 報表生成時間 ≤ 10秒
- 預測準確度 ≥ 85%
- 使用者滿意度 ≥ 90%

### 9.2 系統指標
- 系統可用性 ≥ 99.9%
- 數據延遲 ≤ 1秒
- 並發支援 ≥ 1000
- 報表準確率 100%

## 10. 相關文件

- [MES 總體架構](../README.md)
- [報表設計規範](../../docs/standards/report-design.md)
- [監控指標定義](../../docs/standards/monitoring-metrics.md)
- [API 文檔](../../docs/api/mes-pmr-api.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: mes@tsaitung.com