# BI-BDV 大數據視覺化 (Big Data Visualization) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: BI-DW (資料倉儲), BI-DM (資料採礦), 所有業務模組

## 1. 功能概述

### 1.1 目的
建立企業級大數據視覺化平台，將複雜數據轉化為直觀的視覺呈現，提供互動式儀表板和報表，協助各層級使用者快速理解數據洞察。

### 1.2 範圍
- 互動式儀表板
- 自助式報表設計
- 即時數據監控
- 地理空間視覺化
- 行動裝置支援

### 1.3 關鍵價值
- 決策時間縮短 60%
- 數據理解度提升 80%
- 報表產出效率提升 75%
- 使用者滿意度達 90%

## 2. 功能性需求

### FR-BI-BDV-001: 互動式儀表板
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 使用者訪問或數據更新
- **行為**: 提供可互動的數據儀表板
- **資料輸入**: 
  - 數據來源配置
  - 視覺元件選擇
  - 版面配置設計
  - 互動規則定義
  - 更新頻率設定
- **資料輸出**: 
  - 動態儀表板
  - 即時數據更新
  - 互動式圖表
  - 下鑽分析
  - 匯出功能
- **UI反應**: 
  - 拖拽式設計
  - 響應式布局
  - 即時預覽
  - 手勢操作
  - 全螢幕展示
- **例外處理**: 
  - 數據載入失敗
  - 圖表渲染錯誤
  - 瀏覽器相容性
  - 效能瓶頸

#### 驗收標準
```yaml
- 條件: 建立銷售儀表板
  預期結果: 即時顯示各維度銷售數據與趨勢

- 條件: 點擊圖表元素
  預期結果: 提供下鑽功能查看詳細數據

- 條件: 數據更新
  預期結果: 儀表板自動刷新顯示最新資訊
```

#### Traceability
- **測試案例**: tests/unit/FR-BI-BDV-001.test.ts
- **實作程式**: src/modules/bi/services/dataVisualization.service.ts
- **相關文件**: TOC Modules.md - Section 12.3

### FR-BI-BDV-002: 自助式報表設計
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 業務使用者報表需求
- **行為**: 讓使用者自行設計和產生報表
- **資料輸入**: 
  - 資料集選擇
  - 欄位配置
  - 篩選條件
  - 排序規則
  - 格式設定
- **資料輸出**: 
  - 客製化報表
  - 多格式匯出
  - 排程產出
  - 分享連結
  - 版本管理
- **UI反應**: 
  - 視覺化設計器
  - 即見即所得
  - 範本庫
  - 預覽功能
  - 協作編輯
- **例外處理**: 
  - 權限不足
  - 資料衝突
  - 格式錯誤
  - 儲存失敗

#### 儀表板配置模型
```typescript
interface Dashboard {
  id: string;
  name: string;
  description: string;
  
  // 版面配置
  layout: {
    type: 'grid' | 'flex' | 'absolute';
    responsive: boolean;
    
    grid?: {
      columns: number;
      rows: number;
      gap: number;
    };
    
    breakpoints?: {
      device: 'mobile' | 'tablet' | 'desktop' | 'widescreen';
      minWidth: number;
      layout: any;
    }[];
  };
  
  // 視覺元件
  widgets: {
    widgetId: string;
    widgetType: 'chart' | 'table' | 'kpi' | 'filter' | 'text' | 'image' | 'custom';
    
    // 位置與大小
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
        type: 'query' | 'api' | 'static' | 'calculated';
        query?: string;
        endpoint?: string;
        parameters?: any;
      };
      
      refresh: {
        auto: boolean;
        interval?: number;
        onDemand?: boolean;
      };
      
      transformation?: {
        aggregation?: string;
        filtering?: any;
        sorting?: any;
        limit?: number;
      };
    };
    
    // 視覺化配置
    visualization: {
      chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'treemap' | 'gauge' | 'map';
      
      config: {
        title?: string;
        subtitle?: string;
        
        axes?: {
          x: { field: string; label?: string; format?: string; };
          y: { field: string; label?: string; format?: string; };
          y2?: { field: string; label?: string; format?: string; };
        };
        
        series?: {
          name: string;
          field: string;
          type?: string;
          color?: string;
          style?: any;
        }[];
        
        legend?: {
          show: boolean;
          position: 'top' | 'bottom' | 'left' | 'right';
        };
        
        tooltip?: {
          enabled: boolean;
          format?: string;
          custom?: string;
        };
        
        animation?: {
          enabled: boolean;
          duration?: number;
          easing?: string;
        };
      };
      
      // KPI 配置
      kpi?: {
        value: number | string;
        prefix?: string;
        suffix?: string;
        
        comparison?: {
          value: number;
          type: 'percentage' | 'absolute';
          trend: 'up' | 'down' | 'neutral';
        };
        
        thresholds?: {
          value: number;
          color: string;
          label?: string;
        }[];
        
        sparkline?: {
          show: boolean;
          data: number[];
        };
      };
    };
    
    // 互動配置
    interactions?: {
      clickable: boolean;
      hoverable: boolean;
      
      drillDown?: {
        enabled: boolean;
        target: 'same' | 'new' | 'modal';
        destination?: string;
        parameters?: string[];
      };
      
      crossFilter?: {
        enabled: boolean;
        scope: 'page' | 'global';
        targets?: string[];
      };
      
      actions?: {
        type: 'navigate' | 'filter' | 'export' | 'custom';
        handler: string;
      }[];
    };
  }[];
  
  // 全域設定
  settings: {
    theme: 'light' | 'dark' | 'custom';
    
    colors?: {
      palette: string[];
      mapping?: any;
    };
    
    fonts?: {
      family: string;
      size: {
        small: number;
        medium: number;
        large: number;
      };
    };
    
    filters?: {
      global: boolean;
      persistent: boolean;
      
      defaults?: {
        field: string;
        operator: string;
        value: any;
      }[];
    };
    
    permissions?: {
      public: boolean;
      viewers?: string[];
      editors?: string[];
    };
  };
  
  // 版本控制
  version: {
    current: string;
    createdAt: Date;
    createdBy: string;
    modifiedAt?: Date;
    modifiedBy?: string;
    
    history?: {
      version: string;
      timestamp: Date;
      user: string;
      changes: string;
    }[];
  };
}
```

### FR-BI-BDV-003: 即時數據監控
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 數據流更新或事件觸發
- **行為**: 即時展示關鍵業務指標變化
- **資料輸入**: 
  - 串流數據源
  - 監控指標
  - 警報規則
  - 更新策略
  - 歷史範圍
- **資料輸出**: 
  - 即時圖表
  - 數據流展示
  - 警報通知
  - 趨勢預測
  - 異常標示
- **UI反應**: 
  - 自動更新
  - 平滑動畫
  - 警報彈窗
  - 音效提醒
  - 顏色變化
- **例外處理**: 
  - 連線中斷
  - 數據延遲
  - 記憶體溢出
  - 渲染卡頓

#### 即時監控模型
```typescript
interface RealTimeMonitor {
  id: string;
  monitorName: string;
  
  // 數據串流
  dataStream: {
    source: {
      type: 'websocket' | 'sse' | 'polling' | 'kafka' | 'mqtt';
      endpoint: string;
      
      authentication?: {
        method: 'token' | 'oauth' | 'apikey';
        credentials: any;
      };
      
      subscription?: {
        topics?: string[];
        filters?: any;
      };
    };
    
    processing: {
      window: {
        type: 'tumbling' | 'sliding' | 'session';
        size: number;
        unit: 'seconds' | 'minutes' | 'events';
      };
      
      aggregation?: {
        function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'stddev';
        groupBy?: string[];
      };
      
      transformation?: {
        type: 'map' | 'filter' | 'reduce';
        expression: string;
      };
    };
    
    buffer: {
      size: number;
      strategy: 'fifo' | 'lifo' | 'priority';
      overflow: 'drop' | 'block' | 'sample';
    };
  };
  
  // 監控指標
  metrics: {
    metricId: string;
    metricName: string;
    
    calculation: {
      formula: string;
      variables: {
        name: string;
        source: string;
      }[];
    };
    
    display: {
      type: 'gauge' | 'trend' | 'counter' | 'status';
      
      range?: {
        min: number;
        max: number;
      };
      
      thresholds?: {
        critical: number;
        warning: number;
        normal: number;
      };
      
      format?: {
        decimals?: number;
        prefix?: string;
        suffix?: string;
      };
    };
    
    history: {
      retention: number;
      granularity: string;
      compression?: boolean;
    };
  }[];
  
  // 警報規則
  alerts: {
    alertId: string;
    alertName: string;
    
    condition: {
      metric: string;
      operator: '>' | '<' | '=' | '!=' | 'between' | 'outside';
      threshold: number | number[];
      
      duration?: {
        value: number;
        unit: string;
      };
      
      frequency?: {
        occurrences: number;
        window: number;
      };
    };
    
    severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
    
    notification: {
      channels: ('email' | 'sms' | 'webhook' | 'push' | 'slack')[];
      
      recipients: {
        channel: string;
        addresses: string[];
      }[];
      
      message: {
        template: string;
        variables?: string[];
      };
      
      cooldown?: number;
    };
    
    actions?: {
      type: 'script' | 'api' | 'command';
      execution: string;
      parameters?: any;
    }[];
  }[];
  
  // 視覺化配置
  visualization: {
    layout: 'grid' | 'flow' | 'custom';
    
    components: {
      componentId: string;
      type: string;
      metrics: string[];
      
      position?: any;
      size?: any;
      
      style?: {
        theme: string;
        colors?: string[];
        fonts?: any;
      };
      
      interactions?: {
        zoom: boolean;
        pan: boolean;
        tooltip: boolean;
      };
    }[];
    
    refreshRate: number;
    smoothing: boolean;
  };
}
```

### FR-BI-BDV-004: 地理空間視覺化
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 地理相關數據分析需求
- **行為**: 在地圖上展示業務數據分布
- **資料輸入**: 
  - 地理座標
  - 區域數據
  - 圖層配置
  - 熱力參數
  - 路徑資訊
- **資料輸出**: 
  - 互動地圖
  - 熱力圖
  - 區域分析
  - 路徑展示
  - 聚類顯示
- **UI反應**: 
  - 地圖縮放
  - 圖層切換
  - 彈出資訊
  - 區域選擇
  - 路徑動畫
- **例外處理**: 
  - 座標錯誤
  - 地圖載入失敗
  - 圖層衝突
  - 效能問題

### FR-BI-BDV-005: 行動裝置支援
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 行動裝置訪問
- **行為**: 提供優化的行動視覺化體驗
- **資料輸入**: 
  - 裝置類型
  - 螢幕尺寸
  - 觸控手勢
  - 網路狀態
  - 定位資訊
- **資料輸出**: 
  - 響應式圖表
  - 簡化介面
  - 離線快取
  - 推播通知
  - 快速分享
- **UI反應**: 
  - 自適應布局
  - 手勢操作
  - 橫豎屏切換
  - 載入優化
  - 觸控回饋
- **例外處理**: 
  - 網路中斷
  - 記憶體限制
  - 電池優化
  - 相容性問題

## 3. 系統設計

### 3.1 資料模型

```typescript
// 報表定義
interface Report {
  id: string;
  reportName: string;
  reportType: 'operational' | 'analytical' | 'strategic';
  
  // 資料來源
  dataSources: {
    sourceId: string;
    type: 'sql' | 'nosql' | 'api' | 'file' | 'stream';
    
    connection: {
      connectionString?: string;
      endpoint?: string;
      authentication?: any;
    };
    
    dataset: {
      query?: string;
      collection?: string;
      parameters?: {
        name: string;
        type: string;
        defaultValue?: any;
        required: boolean;
      }[];
    };
    
    joins?: {
      targetSource: string;
      joinType: 'inner' | 'left' | 'right' | 'full';
      conditions: string[];
    }[];
  }[];
  
  // 報表結構
  structure: {
    sections: {
      sectionId: string;
      sectionType: 'header' | 'body' | 'footer' | 'summary';
      
      components: {
        componentType: 'text' | 'table' | 'chart' | 'image' | 'subreport';
        
        data?: {
          source: string;
          fields: string[];
          filters?: any;
          sorting?: any;
        };
        
        formatting?: {
          style: any;
          conditional?: {
            condition: string;
            style: any;
          }[];
        };
        
        layout?: {
          position: any;
          size: any;
          alignment?: string;
        };
      }[];
      
      pageBreak?: boolean;
      repeatOnPage?: boolean;
    }[];
    
    // 頁面設定
    page: {
      size: 'A4' | 'Letter' | 'Legal' | 'custom';
      orientation: 'portrait' | 'landscape';
      margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
    };
  };
  
  // 排程設定
  schedule?: {
    enabled: boolean;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
    
    timing: {
      startDate: Date;
      endDate?: Date;
      time?: string;
      timezone?: string;
      
      recurrence?: {
        pattern: string;
        interval: number;
      };
    };
    
    distribution: {
      format: 'pdf' | 'excel' | 'csv' | 'html';
      
      delivery: {
        method: 'email' | 'ftp' | 's3' | 'api';
        recipients?: string[];
        destination?: string;
      };
      
      notification?: {
        onSuccess: boolean;
        onFailure: boolean;
      };
    };
  };
  
  // 權限管理
  security: {
    owner: string;
    
    access: {
      public: boolean;
      groups?: string[];
      users?: string[];
    };
    
    rowLevelSecurity?: {
      enabled: boolean;
      rules: {
        field: string;
        operator: string;
        value: string;
        userAttribute?: string;
      }[];
    };
  };
}

// 圖表配置
interface ChartConfiguration {
  chartId: string;
  chartType: string;
  
  // 資料系列
  series: {
    seriesId: string;
    name: string;
    
    data: {
      x: string | number | Date;
      y: number;
      z?: number;
      size?: number;
      color?: string;
      label?: string;
    }[];
    
    style: {
      color?: string;
      lineWidth?: number;
      lineStyle?: 'solid' | 'dashed' | 'dotted';
      
      marker?: {
        enabled: boolean;
        symbol: 'circle' | 'square' | 'triangle' | 'diamond';
        size?: number;
      };
      
      area?: {
        enabled: boolean;
        opacity?: number;
        gradient?: boolean;
      };
    };
    
    dataLabels?: {
      enabled: boolean;
      format?: string;
      position?: string;
      rotation?: number;
    };
  }[];
  
  // 座標軸
  axes: {
    xAxis?: {
      title?: string;
      type: 'category' | 'datetime' | 'numeric' | 'logarithmic';
      
      labels?: {
        format?: string;
        rotation?: number;
        step?: number;
      };
      
      range?: {
        min?: number | Date;
        max?: number | Date;
      };
      
      gridLines?: boolean;
    };
    
    yAxis?: {
      title?: string;
      type: string;
      position?: 'left' | 'right';
      
      labels?: any;
      range?: any;
      gridLines?: boolean;
    };
    
    yAxis2?: any;
  };
  
  // 圖例
  legend?: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
    
    layout?: 'horizontal' | 'vertical';
    align?: 'left' | 'center' | 'right';
    
    itemStyle?: {
      fontSize?: number;
      fontWeight?: string;
      color?: string;
    };
  };
  
  // 工具提示
  tooltip?: {
    enabled: boolean;
    shared?: boolean;
    
    format?: {
      header?: string;
      point?: string;
      footer?: string;
    };
    
    style?: {
      backgroundColor?: string;
      borderColor?: string;
      borderRadius?: number;
    };
  };
  
  // 互動功能
  interactions?: {
    zoom?: {
      enabled: boolean;
      type: 'x' | 'y' | 'xy';
      resetButton?: boolean;
    };
    
    pan?: {
      enabled: boolean;
      modifierKey?: string;
    };
    
    selection?: {
      enabled: boolean;
      type: 'single' | 'multiple';
      callback?: string;
    };
    
    export?: {
      enabled: boolean;
      formats: string[];
    };
  };
}

// 地理視覺化
interface GeoVisualization {
  id: string;
  mapType: 'choropleth' | 'bubble' | 'heatmap' | 'flow' | 'cluster';
  
  // 地圖配置
  map: {
    provider: 'google' | 'mapbox' | 'openstreetmap' | 'custom';
    
    center: {
      latitude: number;
      longitude: number;
    };
    
    zoom: number;
    
    style?: {
      mapStyle?: string;
      theme?: 'light' | 'dark' | 'satellite' | 'terrain';
    };
    
    controls?: {
      zoom: boolean;
      fullscreen: boolean;
      layers: boolean;
      search: boolean;
    };
  };
  
  // 資料圖層
  layers: {
    layerId: string;
    layerName: string;
    layerType: string;
    
    data: {
      source: string;
      
      mapping: {
        latitude?: string;
        longitude?: string;
        region?: string;
        value?: string;
        category?: string;
      };
      
      aggregation?: {
        method: string;
        radius?: number;
      };
    };
    
    visualization: {
      // 區域填充
      choropleth?: {
        colorScale: string[];
        breaks: number[];
        opacity?: number;
      };
      
      // 標記點
      markers?: {
        icon?: string;
        size?: number | string;
        color?: string | string[];
        cluster?: boolean;
      };
      
      // 熱力圖
      heatmap?: {
        intensity?: number;
        radius?: number;
        blur?: number;
        gradient?: string[];
      };
      
      // 流向圖
      flow?: {
        curved: boolean;
        animated: boolean;
        width?: string;
        color?: string;
      };
    };
    
    interactions?: {
      clickable: boolean;
      hoverable: boolean;
      
      popup?: {
        template: string;
        fields: string[];
      };
      
      filter?: {
        enabled: boolean;
        field: string;
        values: any[];
      };
    };
    
    visible: boolean;
    opacity: number;
  }[];
  
  // 圖例與標註
  overlays?: {
    legend?: {
      position: string;
      title?: string;
    };
    
    annotations?: {
      type: 'marker' | 'line' | 'polygon' | 'text';
      coordinates: any;
      style?: any;
      content?: string;
    }[];
    
    scale?: {
      show: boolean;
      units: 'metric' | 'imperial';
    };
  };
}
```

### 3.2 API 設計

```typescript
// 視覺化 API
interface VisualizationAPI {
  // 儀表板管理
  POST   /api/bi/dashboards                   // 建立儀表板
  GET    /api/bi/dashboards                   // 儀表板列表
  GET    /api/bi/dashboards/:id               // 儀表板詳情
  PUT    /api/bi/dashboards/:id               // 更新儀表板
  POST   /api/bi/dashboards/:id/share         // 分享儀表板
  
  // 報表設計
  POST   /api/bi/reports                      // 建立報表
  GET    /api/bi/reports                      // 報表列表
  POST   /api/bi/reports/:id/generate         // 產生報表
  GET    /api/bi/reports/:id/preview          // 預覽報表
  POST   /api/bi/reports/:id/schedule         // 排程報表
  
  // 圖表服務
  POST   /api/bi/charts                       // 建立圖表
  GET    /api/bi/charts/types                 // 圖表類型
  POST   /api/bi/charts/render                // 渲染圖表
  POST   /api/bi/charts/export                // 匯出圖表
  
  // 即時監控
  GET    /api/bi/monitors                     // 監控列表
  POST   /api/bi/monitors/subscribe           // 訂閱監控
  GET    /api/bi/monitors/:id/stream          // 數據串流
  POST   /api/bi/monitors/:id/alert           // 設定警報
  
  // 地理視覺化
  POST   /api/bi/geo/maps                     // 建立地圖
  GET    /api/bi/geo/regions                  // 區域資料
  POST   /api/bi/geo/geocode                  // 地理編碼
  GET    /api/bi/geo/layers                   // 圖層資料
}

// WebSocket 事件
interface BDVWebSocketEvents {
  'data:update': (data: any) => void;
  'chart:refresh': (chart: any) => void;
  'alert:triggered': (alert: any) => void;
  'monitor:status': (status: any) => void;
  'collaboration:change': (change: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **BI-DW**: 數據來源
- **BI-DM**: 分析結果
- **BI-PD**: 預測數據
- **所有業務模組**: 營運數據

### 4.2 外部系統整合
- **圖表庫**: D3.js, ECharts, Highcharts
- **地圖服務**: Google Maps, Mapbox
- **BI工具**: Tableau, Power BI, Qlik
- **協作平台**: Slack, Teams

## 5. 成功指標

### 5.1 業務指標
- 儀表板使用率 > 80%
- 報表自助率 > 70%
- 決策響應時間 < 30分鐘
- 使用者滿意度 > 90%

### 5.2 系統指標
- 圖表載入時間 < 2秒
- 並發使用者 > 500人
- 數據刷新延遲 < 5秒
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bi@tsaitung.com