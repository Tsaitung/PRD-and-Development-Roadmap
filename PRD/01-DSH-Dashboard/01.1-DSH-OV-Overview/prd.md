# DSH-OV 儀表板總覽 (Dashboard Overview) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: 所有模組 (全系統整合)

## 1. 功能概述

### 1.1 目的
建立統一的企業營運儀表板，提供即時、視覺化的關鍵績效指標監控，協助管理層快速掌握企業營運狀況並支援決策制定。

### 1.2 範圍
- 即時數據監控
- KPI指標管理
- 預警通知系統
- 自訂儀表板
- 資料視覺化

### 1.3 關鍵價值
- 決策時間縮短 60%
- 異常發現速度提升 80%
- 報表產生效率提升 70%
- 資訊透明度達 100%

## 2. 功能性需求

### FR-DSH-OV-001: 即時數據監控
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 系統啟動或數據更新
- **行為**: 即時顯示各模組關鍵數據
- **資料輸入**: 
  - 銷售數據
  - 生產狀態
  - 庫存水位
  - 財務指標
  - 品質數據
- **資料輸出**: 
  - 即時圖表
  - 數據卡片
  - 趨勢分析
  - 異常警示
  - 匯總報表
- **UI反應**: 
  - 自動更新
  - 動態動畫
  - 響應式布局
  - 全螢幕模式
  - 深色主題
- **例外處理**: 
  - 數據延遲
  - 連線中斷
  - 資料異常
  - 權限不足

#### 驗收標準
```yaml
- 條件: 數據更新
  預期結果: 5秒內反映在儀表板上

- 條件: 異常數值出現
  預期結果: 立即標示並發送通知

- 條件: 切換時間範圍
  預期結果: 1秒內重新計算並顯示
```

#### Traceability
- **測試案例**: tests/unit/FR-DSH-OV-001.test.ts
- **實作程式**: src/modules/dashboard/services/realtimeMonitoring.service.ts
- **相關文件**: TOC Modules.md - Section 1.1

### FR-DSH-OV-002: KPI指標管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: KPI設定或查詢
- **行為**: 管理和追蹤關鍵績效指標
- **資料輸入**: 
  - 指標定義
  - 目標值
  - 計算公式
  - 數據來源
  - 更新頻率
- **資料輸出**: 
  - KPI儀表
  - 達成率
  - 趨勢圖
  - 對比分析
  - 預測值
- **UI反應**: 
  - 拖拽配置
  - 目標線
  - 顏色編碼
  - 鑽取功能
  - 匯出功能
- **例外處理**: 
  - 公式錯誤
  - 數據缺失
  - 目標未設
  - 計算失敗

#### 儀表板模型
```typescript
interface DashboardOverview {
  id: string;
  dashboardId: string;
  
  // 儀表板配置
  configuration: {
    name: string;
    description?: string;
    type: 'executive' | 'operational' | 'analytical' | 'custom';
    
    owner: {
      userId: string;
      department?: string;
      role?: string;
    };
    
    visibility: {
      scope: 'private' | 'department' | 'company' | 'public';
      sharedWith?: string[];
      permissions?: {
        view: string[];
        edit: string[];
        admin: string[];
      };
    };
    
    layout: {
      type: 'grid' | 'flex' | 'fixed';
      columns?: number;
      rows?: number;
      responsive: boolean;
    };
    
    theme?: {
      style: 'light' | 'dark' | 'auto';
      primaryColor?: string;
      accentColor?: string;
    };
    
    refresh?: {
      auto: boolean;
      interval?: number;  // seconds
      lastRefresh?: Date;
    };
  };
  
  // 小工具配置
  widgets: {
    widgetId: string;
    type: 'chart' | 'metric' | 'table' | 'map' | 'custom';
    
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex?: number;
    };
    
    // 數據配置
    data: {
      source: {
        type: 'query' | 'api' | 'calculated' | 'static';
        
        query?: {
          module: string;
          entity: string;
          filters?: any;
          aggregation?: string;
        };
        
        api?: {
          endpoint: string;
          method: string;
          params?: any;
        };
        
        calculated?: {
          formula: string;
          dependencies: string[];
        };
      };
      
      refresh?: {
        interval?: number;
        trigger?: string[];
      };
      
      cache?: {
        enabled: boolean;
        ttl?: number;
      };
    };
    
    // 視覺化配置
    visualization: {
      // 圖表類型
      chart?: {
        type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'radar' | 'heatmap';
        
        axes?: {
          x?: { label: string; type: string; };
          y?: { label: string; type: string; };
        };
        
        series?: {
          name: string;
          dataKey: string;
          color?: string;
          type?: string;
        }[];
        
        legend?: {
          show: boolean;
          position: string;
        };
        
        animation?: boolean;
      };
      
      // 指標卡片
      metric?: {
        value: any;
        label: string;
        
        comparison?: {
          type: 'previous' | 'target' | 'average';
          value: number;
          change?: number;
          changePercent?: number;
        };
        
        trend?: {
          show: boolean;
          sparkline?: number[];
        };
        
        thresholds?: {
          warning?: number;
          critical?: number;
        };
        
        format?: {
          type: 'number' | 'currency' | 'percentage' | 'date';
          precision?: number;
          prefix?: string;
          suffix?: string;
        };
      };
      
      // 表格
      table?: {
        columns: {
          field: string;
          header: string;
          width?: number;
          sortable?: boolean;
          format?: string;
        }[];
        
        pagination?: {
          enabled: boolean;
          pageSize?: number;
        };
        
        features?: {
          search?: boolean;
          export?: boolean;
          filter?: boolean;
        };
      };
    };
    
    // 互動設定
    interactions?: {
      drilldown?: {
        enabled: boolean;
        target?: string;
        params?: any;
      };
      
      actions?: {
        type: 'navigate' | 'filter' | 'export' | 'custom';
        label: string;
        action: string;
      }[];
      
      tooltip?: {
        enabled: boolean;
        template?: string;
      };
    };
    
    title?: string;
    subtitle?: string;
    description?: string;
  }[];
  
  // KPI設定
  kpis: {
    kpiId: string;
    name: string;
    
    definition: {
      category: string;
      description: string;
      unit?: string;
      
      formula: {
        expression: string;
        variables: {
          name: string;
          source: string;
        }[];
      };
      
      target?: {
        value: number;
        period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
        type: 'fixed' | 'cumulative' | 'average';
      };
      
      benchmark?: {
        type: 'industry' | 'historical' | 'custom';
        value: number;
        source?: string;
      };
    };
    
    monitoring: {
      frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
      
      alerts?: {
        condition: string;
        threshold: number;
        severity: 'info' | 'warning' | 'critical';
        
        notification: {
          channels: ('email' | 'sms' | 'push' | 'webhook')[];
          recipients: string[];
          template?: string;
        };
      }[];
      
      trending?: {
        method: 'moving_average' | 'exponential' | 'linear';
        periods: number;
      };
    };
    
    performance: {
      current: number;
      target?: number;
      achievement?: number;
      
      trend: 'up' | 'down' | 'stable';
      changeRate?: number;
      
      forecast?: {
        value: number;
        confidence: number;
        method: string;
      };
    };
  }[];
  
  // 數據快照
  snapshot?: {
    timestamp: Date;
    
    summary: {
      sales?: {
        today: number;
        mtd: number;
        ytd: number;
        growth: number;
      };
      
      production?: {
        output: number;
        efficiency: number;
        quality: number;
        oee: number;
      };
      
      inventory?: {
        value: number;
        turnover: number;
        stockouts: number;
        excess: number;
      };
      
      finance?: {
        revenue: number;
        profit: number;
        cashflow: number;
        receivables: number;
      };
      
      customers?: {
        active: number;
        new: number;
        satisfaction: number;
        churn: number;
      };
    };
    
    alerts?: {
      active: number;
      critical: number;
      resolved: number;
      
      recent: {
        alertId: string;
        message: string;
        severity: string;
        timestamp: Date;
      }[];
    };
  };
  
  // 使用分析
  analytics?: {
    usage: {
      views: number;
      users: number;
      avgDuration: number;
      
      byWidget: {
        widgetId: string;
        interactions: number;
      }[];
    };
    
    performance: {
      loadTime: number;
      queryTime: number;
      renderTime: number;
      errorRate: number;
    };
  };
}
```

### FR-DSH-OV-003: 預警通知系統
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 指標異常或規則觸發
- **行為**: 發送即時預警通知
- **資料輸入**: 
  - 預警規則
  - 閾值設定
  - 通知對象
  - 升級機制
  - 處理流程
- **資料輸出**: 
  - 預警訊息
  - 通知記錄
  - 處理狀態
  - 統計報表
  - 改善建議
- **UI反應**: 
  - 彈出通知
  - 聲音提示
  - 顏色變化
  - 圖標閃爍
  - 全螢幕警告
- **例外處理**: 
  - 通知失敗
  - 規則衝突
  - 誤報處理
  - 系統過載

#### 預警系統模型
```typescript
interface AlertSystem {
  // 預警規則
  rules: {
    ruleId: string;
    name: string;
    
    trigger: {
      type: 'threshold' | 'trend' | 'pattern' | 'schedule';
      
      threshold?: {
        metric: string;
        operator: 'gt' | 'lt' | 'eq' | 'ne' | 'between';
        value: number | number[];
        duration?: number;  // 持續時間
      };
      
      trend?: {
        metric: string;
        direction: 'increasing' | 'decreasing';
        rate: number;
        periods: number;
      };
      
      pattern?: {
        query: string;
        matches: number;
        window: number;
      };
      
      schedule?: {
        cron: string;
        condition?: string;
      };
    };
    
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    
    actions: {
      notify: {
        channels: string[];
        recipients: string[];
        template: string;
        
        escalation?: {
          levels: {
            delay: number;
            recipients: string[];
          }[];
        };
      };
      
      autoResolve?: {
        enabled: boolean;
        action: string;
        params?: any;
      };
    };
    
    active: boolean;
    
    metadata?: {
      category: string;
      tags: string[];
      owner: string;
      documentation?: string;
    };
  }[];
  
  // 預警實例
  alerts: {
    alertId: string;
    ruleId: string;
    
    occurrence: {
      timestamp: Date;
      value: any;
      context: any;
    };
    
    status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
    
    handling: {
      acknowledgedBy?: string;
      acknowledgedAt?: Date;
      
      assignedTo?: string;
      
      resolution?: {
        resolvedBy: string;
        resolvedAt: Date;
        action: string;
        notes?: string;
      };
      
      escalation?: {
        level: number;
        escalatedAt: Date;
        escalatedTo: string[];
      };
    };
    
    impact?: {
      affected: string[];
      severity: string;
      urgency: string;
      priority: string;
    };
    
    timeline: {
      event: string;
      timestamp: Date;
      user?: string;
      details?: string;
    }[];
  }[];
}
```

### FR-DSH-OV-004: 自訂儀表板
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 使用者個人化需求
- **行為**: 允許使用者自訂儀表板配置
- **資料輸入**: 
  - 版面配置
  - 小工具選擇
  - 數據來源
  - 顯示樣式
  - 分享設定
- **資料輸出**: 
  - 個人儀表板
  - 範本庫
  - 分享連結
  - 匯出配置
  - 版本歷史
- **UI反應**: 
  - 拖放編輯
  - 即時預覽
  - 範本套用
  - 快速切換
  - 全螢幕展示
- **例外處理**: 
  - 配置衝突
  - 權限不足
  - 資源限制
  - 版本不相容

### FR-DSH-OV-005: 資料視覺化
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 數據展示或分析需求
- **行為**: 提供豐富的資料視覺化選項
- **資料輸入**: 
  - 數據集
  - 圖表類型
  - 維度設定
  - 篩選條件
  - 樣式設定
- **資料輸出**: 
  - 互動圖表
  - 資訊圖表
  - 地理圖
  - 熱力圖
  - 動態動畫
- **UI反應**: 
  - 圖表切換
  - 縮放平移
  - 工具提示
  - 圖例互動
  - 匯出圖片
- **例外處理**: 
  - 數據量過大
  - 瀏覽器不支援
  - 渲染失敗
  - 記憶體不足

## 3. 系統設計

### 3.1 資料模型

```typescript
// 儀表板範本
interface DashboardTemplate {
  templateId: string;
  name: string;
  
  metadata: {
    category: 'sales' | 'production' | 'finance' | 'logistics' | 'executive' | 'custom';
    industry?: string;
    description: string;
    
    preview?: {
      image: string;
      demo?: string;
    };
    
    tags: string[];
    
    rating?: {
      score: number;
      count: number;
    };
    
    usage: {
      downloads: number;
      instances: number;
    };
  };
  
  // 範本內容
  content: {
    layout: any;
    widgets: any[];
    kpis: any[];
    
    dataSources?: {
      required: string[];
      optional?: string[];
    };
    
    parameters?: {
      name: string;
      type: string;
      default?: any;
      required: boolean;
    }[];
  };
  
  // 自訂選項
  customization: {
    allowLayoutChange: boolean;
    allowWidgetAdd: boolean;
    allowWidgetRemove: boolean;
    allowDataSourceChange: boolean;
    
    presets?: {
      name: string;
      config: any;
    }[];
  };
  
  creator: {
    userId?: string;
    vendor?: string;
    version: string;
    createdAt: Date;
    updatedAt?: Date;
  };
  
  public: boolean;
  price?: number;
}

// 資料視覺化
interface DataVisualization {
  vizId: string;
  
  // 資料處理
  data: {
    raw: any[];
    
    processed?: {
      transformed: any[];
      aggregated?: any;
      filtered?: any[];
      sorted?: any[];
    };
    
    dimensions: {
      name: string;
      field: string;
      type: 'category' | 'time' | 'number';
      role: 'x' | 'y' | 'size' | 'color' | 'shape';
    }[];
    
    measures: {
      name: string;
      field: string;
      aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
      format?: string;
    }[];
  };
  
  // 視覺編碼
  encoding: {
    mark: 'point' | 'line' | 'bar' | 'area' | 'rect' | 'arc' | 'text';
    
    channels: {
      x?: { field: string; type: string; };
      y?: { field: string; type: string; };
      color?: { field: string; type: string; scale?: any; };
      size?: { field: string; type: string; };
      shape?: { field: string; type: string; };
      tooltip?: { fields: string[]; };
    };
    
    transforms?: {
      type: 'filter' | 'aggregate' | 'bin' | 'calculate' | 'pivot';
      params: any;
    }[];
  };
  
  // 互動行為
  interaction: {
    selection?: {
      type: 'single' | 'multi' | 'interval';
      on: string;
      clear?: string;
    };
    
    zoom?: {
      enabled: boolean;
      type: 'wheel' | 'drag';
    };
    
    pan?: {
      enabled: boolean;
    };
    
    hover?: {
      highlight: boolean;
      tooltip: boolean;
    };
    
    brush?: {
      enabled: boolean;
      type: 'x' | 'y' | 'xy';
    };
  };
  
  // 樣式設定
  style: {
    width?: number;
    height?: number;
    
    padding?: number | { top: number; right: number; bottom: number; left: number; };
    
    background?: string;
    
    font?: {
      family: string;
      size: number;
      color: string;
    };
    
    colors?: string[];
    
    animation?: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
  };
}

// 效能監控
interface PerformanceMonitoring {
  dashboardId: string;
  period: { start: Date; end: Date; };
  
  // 載入效能
  loading: {
    pageLoad: {
      time: number;
      breakdown: {
        server: number;
        network: number;
        dom: number;
        render: number;
      };
    };
    
    widgetLoad: {
      widgetId: string;
      loadTime: number;
      dataFetch: number;
      rendering: number;
    }[];
    
    resourceTiming: {
      type: string;
      url: string;
      duration: number;
      size: number;
    }[];
  };
  
  // 資料效能
  dataPerformance: {
    queries: {
      queryId: string;
      module: string;
      executionTime: number;
      rowsReturned: number;
      cacheHit: boolean;
    }[];
    
    apiCalls: {
      endpoint: string;
      method: string;
      responseTime: number;
      statusCode: number;
      size: number;
    }[];
    
    aggregations: {
      type: string;
      dataPoints: number;
      processingTime: number;
    }[];
  };
  
  // 使用者體驗
  userExperience: {
    interactions: {
      type: string;
      count: number;
      avgResponseTime: number;
    }[];
    
    errors: {
      type: string;
      message: string;
      count: number;
      lastOccurred: Date;
    }[];
    
    feedback?: {
      rating: number;
      comments: string[];
    };
  };
  
  // 優化建議
  optimization?: {
    suggestions: {
      area: 'query' | 'cache' | 'widget' | 'data' | 'layout';
      issue: string;
      impact: 'high' | 'medium' | 'low';
      recommendation: string;
      estimatedImprovement: string;
    }[];
  };
}
```

### 3.2 API 設計

```typescript
// 儀表板 API
interface DashboardAPI {
  // 儀表板管理
  POST   /api/dashboard                       // 建立儀表板
  GET    /api/dashboard                       // 儀表板列表
  GET    /api/dashboard/:id                   // 儀表板詳情
  PUT    /api/dashboard/:id                   // 更新儀表板
  DELETE /api/dashboard/:id                   // 刪除儀表板
  POST   /api/dashboard/:id/share             // 分享儀表板
  
  // 小工具管理
  POST   /api/dashboard/:id/widgets           // 新增小工具
  PUT    /api/dashboard/:id/widgets/:wid      // 更新小工具
  DELETE /api/dashboard/:id/widgets/:wid      // 刪除小工具
  POST   /api/dashboard/:id/widgets/reorder   // 重排小工具
  
  // KPI管理
  POST   /api/dashboard/kpis                  // 建立KPI
  GET    /api/dashboard/kpis                  // KPI列表
  PUT    /api/dashboard/kpis/:id              // 更新KPI
  GET    /api/dashboard/kpis/:id/history      // KPI歷史
  
  // 資料查詢
  POST   /api/dashboard/data/query            // 執行查詢
  GET    /api/dashboard/data/realtime         // 即時數據
  POST   /api/dashboard/data/aggregate        // 聚合計算
  GET    /api/dashboard/data/export           // 匯出數據
  
  // 預警管理
  POST   /api/dashboard/alerts/rules          // 建立規則
  GET    /api/dashboard/alerts                // 預警列表
  PUT    /api/dashboard/alerts/:id/ack        // 確認預警
  PUT    /api/dashboard/alerts/:id/resolve    // 解決預警
  
  // 範本管理
  GET    /api/dashboard/templates             // 範本列表
  POST   /api/dashboard/templates             // 建立範本
  POST   /api/dashboard/templates/:id/apply   // 套用範本
}

// WebSocket 事件
interface DashboardWebSocketEvents {
  'data:updated': (widget: any) => void;
  'kpi:changed': (kpi: any) => void;
  'alert:triggered': (alert: any) => void;
  'user:joined': (user: any) => void;
  'dashboard:shared': (share: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **所有模組**: 數據來源
- **BI**: 分析引擎
- **SA**: 權限控制
- **UP**: 個人化設定

### 4.2 外部系統整合
- **資料庫**: 多源整合
- **雲端服務**: 數據存儲
- **視覺化引擎**: 圖表渲染
- **通知服務**: 預警推送

## 5. 成功指標

### 5.1 業務指標
- 資訊取得時間 < 3秒
- 決策效率提升 > 50%
- 預警準確率 > 95%
- 使用者滿意度 > 90%

### 5.2 系統指標
- 頁面載入時間 < 2秒
- 數據更新延遲 < 5秒
- 並發使用者 > 500人
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: dashboard@tsaitung.com