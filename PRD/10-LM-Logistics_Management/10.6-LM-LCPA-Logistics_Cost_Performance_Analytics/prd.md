# LM-LCPA 物流成本與績效分析 (Logistics Cost & Performance Analytics) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: LM全模組, FA (財務會計), BI (商業智慧), OM (訂單管理)

## 1. 功能概述

### 1.1 目的
建立全面的物流成本分析與績效管理系統，透過數據分析優化物流營運，降低成本，提升服務品質與營運效率。

### 1.2 範圍
- 成本結構分析
- 績效指標管理
- 營運效率分析
- 服務品質評估
- 優化決策支援

### 1.3 關鍵價值
- 物流成本降低 20%
- 營運效率提升 35%
- 決策時間縮短 50%
- 服務滿意度提升至 95%

## 2. 功能性需求

### FR-LM-LCPA-001: 成本結構分析
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 定期成本分析或即時查詢需求
- **行為**: 分析物流各環節成本構成與趨勢
- **資料輸入**: 
  - 運輸費用明細
  - 人力成本數據
  - 燃料消耗記錄
  - 維護保養費用
  - 固定資產折舊
- **資料輸出**: 
  - 成本結構圖
  - 單位成本分析
  - 成本趨勢報表
  - 異常成本預警
  - 節省機會識別
- **UI反應**: 
  - 成本儀表板
  - 下鑽式分析
  - 對比圖表
  - 成本計算器
  - 預算對比
- **例外處理**: 
  - 成本超標預警
  - 數據異常檢測
  - 缺失數據處理
  - 分攤規則衝突

#### 驗收標準
```yaml
- 條件: 查詢月度物流成本
  預期結果: 3秒內顯示完整成本結構分析

- 條件: 成本超出預算20%
  預期結果: 自動發出預警並分析原因

- 條件: 執行成本優化分析
  預期結果: 提供至少3個可行的成本降低方案
```

#### Traceability
- **測試案例**: tests/unit/FR-LM-LCPA-001.test.ts
- **實作程式**: src/modules/lm/services/costAnalytics.service.ts
- **相關文件**: TOC Modules.md - Section 10.6

### FR-LM-LCPA-002: 績效指標管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: KPI監控與績效評估需求
- **行為**: 定義、追蹤和管理物流關鍵績效指標
- **資料輸入**: 
  - KPI定義設定
  - 目標值設定
  - 實際績效數據
  - 權重配置
  - 評分標準
- **資料輸出**: 
  - KPI儀表板
  - 績效評分卡
  - 達成率報告
  - 趨勢分析圖
  - 改善建議
- **UI反應**: 
  - 即時KPI顯示
  - 紅綠燈警示
  - 歷史趨勢
  - 目標對比
  - 排行榜
- **例外處理**: 
  - KPI異常波動
  - 目標未達成
  - 數據品質問題
  - 計算錯誤

#### 物流KPI體系
```typescript
interface LogisticsKPI {
  id: string;
  period: { start: Date; end: Date; };
  
  // 成本指標
  costMetrics: {
    // 總成本指標
    totalCost: {
      value: number;
      budget: number;
      variance: number;
      trend: 'up' | 'down' | 'stable';
    };
    
    // 單位成本
    unitCosts: {
      costPerOrder: number;
      costPerKm: number;
      costPerKg: number;
      costPerDelivery: number;
    };
    
    // 成本結構
    costBreakdown: {
      transportation: number;  // 運輸成本
      labor: number;           // 人力成本
      fuel: number;            // 燃料成本
      maintenance: number;     // 維護成本
      warehouse: number;       // 倉儲成本
      overhead: number;        // 管理費用
    };
    
    // 成本效率
    efficiency: {
      costReduction: number;   // 成本降低率
      budgetUtilization: number; // 預算使用率
      costPerRevenue: number;  // 成本收入比
    };
  };
  
  // 服務指標
  serviceMetrics: {
    // 時效性
    timeliness: {
      onTimeDelivery: number;  // 準時交貨率
      avgDeliveryTime: number; // 平均配送時間
      deliveryDelay: number;   // 平均延遲時間
      promiseAchievement: number; // 承諾達成率
    };
    
    // 準確性
    accuracy: {
      orderAccuracy: number;   // 訂單準確率
      deliveryAccuracy: number; // 配送準確率
      documentAccuracy: number; // 單據準確率
    };
    
    // 完整性
    completeness: {
      orderFulfillment: number; // 訂單滿足率
      perfectOrder: number;     // 完美訂單率
      damageRate: number;       // 貨損率
      lossRate: number;         // 遺失率
    };
    
    // 客戶滿意
    satisfaction: {
      customerScore: number;    // 客戶評分
      complaintRate: number;    // 投訴率
      repeatRate: number;       // 回購率
      nps: number;             // 淨推薦值
    };
  };
  
  // 營運指標
  operationalMetrics: {
    // 產能利用
    utilization: {
      vehicleUtilization: number; // 車輛使用率
      capacityUtilization: number; // 載重使用率
      volumeUtilization: number;   // 容積使用率
      driverUtilization: number;   // 司機稼動率
    };
    
    // 效率指標
    efficiency: {
      ordersPerDay: number;     // 日均訂單數
      deliveriesPerRoute: number; // 路線配送數
      kmPerLiter: number;       // 油耗效率
      loadingTime: number;      // 裝載時間
    };
    
    // 生產力
    productivity: {
      ordersPerDriver: number;  // 司機訂單數
      revenuePerVehicle: number; // 車均營收
      throughput: number;        // 吞吐量
      turnaroundTime: number;   // 周轉時間
    };
  };
  
  // 品質指標
  qualityMetrics: {
    // 服務品質
    service: {
      firstCallResolution: number; // 首次解決率
      responseTime: number;        // 響應時間
      professionalScore: number;   // 專業度評分
    };
    
    // 安全指標
    safety: {
      accidentRate: number;     // 事故率
      incidentRate: number;     // 事件率
      safetyScore: number;      // 安全評分
      compliance: number;       // 合規率
    };
    
    // 環保指標
    environmental: {
      carbonEmission: number;   // 碳排放
      fuelEfficiency: number;   // 燃油效率
      greenDelivery: number;    // 綠色配送率
    };
  };
  
  // 綜合評分
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    ranking: number;
    improvement: number;
  };
}
```

### FR-LM-LCPA-003: 營運效率分析
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 營運檢討或優化需求
- **行為**: 分析物流營運效率並識別改善機會
- **資料輸入**: 
  - 營運數據
  - 資源配置
  - 作業時間
  - 路線資料
  - 異常記錄
- **資料輸出**: 
  - 效率報告
  - 瓶頸分析
  - 資源利用圖
  - 優化方案
  - ROI預測
- **UI反應**: 
  - 效率熱圖
  - 流程分析
  - 對標比較
  - 模擬測試
  - 改善追蹤
- **例外處理**: 
  - 效率異常低
  - 資源衝突
  - 數據不完整
  - 系統限制

### FR-LM-LCPA-004: 服務品質評估
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 定期品質評估或客戶反饋
- **行為**: 評估物流服務品質並提供改善方向
- **資料輸入**: 
  - 客戶評價
  - 投訴記錄
  - 服務標準
  - 實際表現
  - 競爭對手數據
- **資料輸出**: 
  - 品質報告卡
  - 客戶滿意度
  - 服務差距分析
  - 改善計劃
  - 績效排名
- **UI反應**: 
  - 品質儀表板
  - 評分趨勢
  - 客戶聲音
  - 改善進度
  - 認證狀態
- **例外處理**: 
  - 品質下降
  - 客戶投訴
  - 標準變更
  - 認證失效

### FR-LM-LCPA-005: 優化決策支援
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 管理決策或策略規劃需求
- **行為**: 提供數據驅動的決策建議與情境分析
- **資料輸入**: 
  - 歷史數據
  - 市場資訊
  - 成本參數
  - 限制條件
  - 目標設定
- **資料輸出**: 
  - 決策建議書
  - 情境分析
  - 風險評估
  - 投資回報
  - 實施路線圖
- **UI反應**: 
  - 決策看板
  - 情境模擬
  - 敏感度分析
  - 決策樹
  - 方案比較
- **例外處理**: 
  - 數據不足
  - 模型失效
  - 極端情境
  - 決策衝突

## 3. 系統設計

### 3.1 資料模型

```typescript
// 成本分析模型
interface CostAnalysis {
  id: string;
  period: { start: Date; end: Date; };
  
  // 直接成本
  directCosts: {
    // 運輸成本
    transportation: {
      fuel: number;
      tolls: number;
      parking: number;
      insurance: number;
      registration: number;
      subtotal: number;
    };
    
    // 人力成本
    labor: {
      salary: number;
      overtime: number;
      benefits: number;
      training: number;
      subtotal: number;
    };
    
    // 設備成本
    equipment: {
      depreciation: number;
      maintenance: number;
      repair: number;
      rental: number;
      subtotal: number;
    };
  };
  
  // 間接成本
  indirectCosts: {
    warehouse: number;
    utilities: number;
    administration: number;
    technology: number;
    other: number;
    subtotal: number;
  };
  
  // 成本分攤
  allocation: {
    byCustomer: {
      customerId: string;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }[];
    
    byRoute: {
      routeId: string;
      orders: number;
      cost: number;
      avgCost: number;
    }[];
    
    byProduct: {
      category: string;
      volume: number;
      cost: number;
      unitCost: number;
    }[];
  };
  
  // 成本驅動因素
  drivers: {
    distance: number;
    weight: number;
    volume: number;
    stops: number;
    time: number;
    
    analysis: {
      driver: string;
      impact: number;
      correlation: number;
    }[];
  };
  
  // 優化機會
  opportunities: {
    category: string;
    description: string;
    potential: number;
    difficulty: 'easy' | 'medium' | 'hard';
    priority: number;
  }[];
}

// 績效評估模型
interface PerformanceAssessment {
  id: string;
  assessmentDate: Date;
  
  // 評估維度
  dimensions: {
    // 財務維度
    financial: {
      weight: 0.3;
      metrics: {
        profitability: number;
        costEfficiency: number;
        revenueGrowth: number;
        roi: number;
      };
      score: number;
    };
    
    // 客戶維度
    customer: {
      weight: 0.25;
      metrics: {
        satisfaction: number;
        retention: number;
        acquisition: number;
        lifetime: number;
      };
      score: number;
    };
    
    // 內部流程
    process: {
      weight: 0.25;
      metrics: {
        efficiency: number;
        quality: number;
        innovation: number;
        standardization: number;
      };
      score: number;
    };
    
    // 學習成長
    learning: {
      weight: 0.2;
      metrics: {
        training: number;
        capability: number;
        technology: number;
        culture: number;
      };
      score: number;
    };
  };
  
  // 對標分析
  benchmarking: {
    industry: {
      average: number;
      best: number;
      percentile: number;
    };
    
    historical: {
      previous: number;
      change: number;
      trend: string;
    };
    
    competitors: {
      name: string;
      score: number;
      gap: number;
    }[];
  };
  
  // 改善計劃
  improvement: {
    goals: {
      metric: string;
      current: number;
      target: number;
      deadline: Date;
    }[];
    
    initiatives: {
      name: string;
      description: string;
      impact: string;
      owner: string;
      status: string;
    }[];
    
    milestones: {
      date: Date;
      target: string;
      achieved: boolean;
    }[];
  };
}

// 優化方案模型
interface OptimizationScenario {
  id: string;
  name: string;
  
  // 情境設定
  scenario: {
    description: string;
    assumptions: string[];
    constraints: string[];
    objectives: {
      primary: string;
      secondary: string[];
    };
  };
  
  // 變數調整
  adjustments: {
    parameter: string;
    current: any;
    proposed: any;
    change: number;
    rationale: string;
  }[];
  
  // 影響分析
  impact: {
    // 成本影響
    cost: {
      current: number;
      projected: number;
      saving: number;
      percentage: number;
    };
    
    // 服務影響
    service: {
      metric: string;
      current: number;
      projected: number;
      change: number;
    }[];
    
    // 風險評估
    risks: {
      type: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }[];
  };
  
  // 實施計劃
  implementation: {
    phases: {
      phase: number;
      name: string;
      duration: number;
      tasks: string[];
      deliverables: string[];
    }[];
    
    resources: {
      type: string;
      quantity: number;
      cost: number;
    }[];
    
    timeline: {
      start: Date;
      end: Date;
      milestones: Date[];
    };
  };
  
  // 投資回報
  roi: {
    investment: number;
    payback: number;  // 月
    irr: number;      // 內部報酬率
    npv: number;      // 淨現值
  };
  
  status: 'proposed' | 'evaluated' | 'approved' | 'implementing' | 'completed';
}
```

### 3.2 API 設計

```typescript
// 成本分析 API
interface CostAnalyticsAPI {
  // 成本查詢
  GET    /api/lm/analytics/cost                // 成本總覽
  GET    /api/lm/analytics/cost/breakdown      // 成本明細
  GET    /api/lm/analytics/cost/trends         // 成本趨勢
  GET    /api/lm/analytics/cost/comparison     // 成本對比
  
  // 成本計算
  POST   /api/lm/analytics/cost/calculate      // 計算成本
  POST   /api/lm/analytics/cost/allocate       // 成本分攤
  POST   /api/lm/analytics/cost/forecast       // 成本預測
}

// 績效管理 API
interface PerformanceAPI {
  // KPI管理
  POST   /api/lm/performance/kpi               // 設定KPI
  GET    /api/lm/performance/kpi               // 查詢KPI
  GET    /api/lm/performance/dashboard         // 績效儀表板
  
  // 績效評估
  POST   /api/lm/performance/assess            // 執行評估
  GET    /api/lm/performance/report            // 績效報告
  GET    /api/lm/performance/ranking           // 績效排名
  
  // 改善管理
  POST   /api/lm/performance/improvement       // 建立改善計劃
  GET    /api/lm/performance/progress          // 改善進度
}

// 優化決策 API
interface OptimizationAPI {
  // 情境分析
  POST   /api/lm/optimization/scenario         // 建立情境
  POST   /api/lm/optimization/simulate         // 模擬分析
  GET    /api/lm/optimization/results          // 分析結果
  
  // 決策支援
  POST   /api/lm/optimization/recommend        // 取得建議
  GET    /api/lm/optimization/comparison       // 方案比較
  POST   /api/lm/optimization/approve          // 核准方案
}

// 報表服務 API
interface ReportingAPI {
  // 標準報表
  GET    /api/lm/reports/monthly               // 月度報表
  GET    /api/lm/reports/quarterly             // 季度報表
  GET    /api/lm/reports/annual                // 年度報表
  
  // 自訂報表
  POST   /api/lm/reports/custom                // 建立自訂報表
  GET    /api/lm/reports/schedule              // 排程報表
  POST   /api/lm/reports/export                // 匯出報表
}

// WebSocket 事件
interface AnalyticsWebSocketEvents {
  'cost:alert': (alert: any) => void;
  'kpi:updated': (kpi: any) => void;
  'performance:milestone': (milestone: any) => void;
  'optimization:complete': (result: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **所有LM模組**: 營運數據來源
- **FA**: 財務數據整合
- **BI**: 進階分析平台
- **OM**: 訂單數據
- **CRM**: 客戶資料

### 4.2 外部系統整合
- **燃油卡系統**: 油耗數據
- **市場資訊**: 行業基準
- **天氣系統**: 影響因素
- **經濟指標**: 預測模型

## 5. 成功指標

### 5.1 業務指標
- 成本降低率 ≥ 20%
- 決策準確率 ≥ 85%
- KPI達成率 ≥ 90%
- 投資回報率 ≥ 30%

### 5.2 系統指標
- 分析響應時間 < 5秒
- 報表生成時間 < 10秒
- 數據準確性 ≥ 99.5%
- 系統可用性 ≥ 99.5%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: lm@tsaitung.com