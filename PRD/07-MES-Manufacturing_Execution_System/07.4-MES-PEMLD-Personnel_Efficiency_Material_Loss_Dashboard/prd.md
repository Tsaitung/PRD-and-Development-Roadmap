# MES-PEMLD 人員效率與物料損耗儀表板 (Personnel Efficiency & Material Loss Dashboard) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: MES-PSWO (生產排程), MES-MBU (材料管理), HR (人力資源), BI (商業智慧)

## 1. 功能概述

### 1.1 目的
提供即時、視覺化的人員效率和物料損耗監控儀表板，協助管理層快速識別問題、優化資源配置，提升整體生產效率。

### 1.2 範圍
- 人員效率即時監控
- 物料損耗趨勢分析
- KPI 指標追蹤
- 異常預警機制
- 改善建議系統

### 1.3 關鍵價值
- 人員生產力提升 40%
- 物料損耗降低 35%
- 決策響應時間縮短 70%
- ROI 提升 25%

## 2. 功能性需求

### FR-MES-PEMLD-001: 人員效率監控
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 即時監控或定期查看
- **行為**: 展示人員工作效率與生產力指標
- **資料輸入**: 
  - 人員打卡記錄
  - 工單完成數據
  - 作業時間記錄
  - 品質合格率
  - 技能等級
- **資料輸出**: 
  - 個人效率指標
  - 團隊效率對比
  - 效率趨勢圖
  - 最佳實踐案例
  - 培訓需求建議
- **UI反應**: 
  - 即時儀表板
  - 效率排行榜
  - 熱力圖顯示
  - 趨勢動畫
  - 鑽取式分析
- **例外處理**: 
  - 效率異常預警
  - 疲勞度監測
  - 技能不匹配提醒
  - 加班控制

#### 驗收標準
```yaml
- 條件: 查看人員即時效率
  預期結果: 1秒內載入完整儀表板

- 條件: 效率低於標準值
  預期結果: 立即觸發預警並提供改善建議

- 條件: 查看歷史趨勢
  預期結果: 支援6個月數據對比分析
```

#### Traceability
- **測試案例**: tests/unit/FR-MES-PEMLD-001.test.ts
- **實作程式**: src/modules/mes/services/personnelEfficiency.service.ts
- **相關文件**: TOC Modules.md - Section 7.4

### FR-MES-PEMLD-002: 物料損耗分析
**狀態**: 🔴 未開始  
**優先級**: P0

#### 需求描述
- **條件/觸發**: 生產過程中或定期分析
- **行為**: 分析物料損耗並識別改善機會
- **資料輸入**: 
  - 標準用量
  - 實際消耗
  - 損耗記錄
  - 不良品數據
  - 環境因素
- **資料輸出**: 
  - 損耗率儀表板
  - 成本影響分析
  - 損耗熱點圖
  - 原因分析圖表
  - 改善優先順序
- **UI反應**: 
  - 多維度儀表板
  - 瀑布圖分析
  - 帕累托圖
  - 預測模型
  - 互動式探索
- **例外處理**: 
  - 異常損耗警報
  - 成本超標提醒
  - 趨勢惡化預警
  - 自動升級機制

#### 損耗分析維度
```typescript
interface WasteDashboard {
  // 總覽指標
  overview: {
    totalWasteRate: number;
    costImpact: number;
    trend: 'improving' | 'stable' | 'worsening';
    targetGap: number;
  };
  
  // 多維度分析
  dimensions: {
    byMaterial: WasteMetric[];
    byProduct: WasteMetric[];
    byWorkstation: WasteMetric[];
    byShift: WasteMetric[];
    byOperator: WasteMetric[];
  };
  
  // 熱點分析
  hotspots: {
    location: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    wasteRate: number;
    improvement: number;
  }[];
  
  // 成本分析
  costAnalysis: {
    directCost: number;
    opportunityCost: number;
    totalImpact: number;
    savingPotential: number;
  };
}
```

### FR-MES-PEMLD-003: KPI 綜合儀表板
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 管理層查看或自動更新
- **行為**: 展示關鍵績效指標綜合視圖
- **資料輸入**: 
  - OEE 指標
  - 生產達成率
  - 品質指標
  - 成本指標
  - 安全指標
- **資料輸出**: 
  - KPI 總覽
  - 目標達成度
  - 趨勢分析
  - 預測模型
  - 行動建議
- **UI反應**: 
  - 執行儀表板
  - 紅綠燈顯示
  - 趨勢圖表
  - 下鑽分析
  - 自訂版面

#### KPI 定義
```typescript
interface KPIDashboard {
  // 效率指標
  efficiency: {
    oee: {
      value: number;
      target: number;
      components: {
        availability: number;
        performance: number;
        quality: number;
      };
    };
    laborProductivity: number;
    machineUtilization: number;
  };
  
  // 品質指標
  quality: {
    firstPassYield: number;
    defectRate: number;
    reworkRate: number;
    customerComplaints: number;
  };
  
  // 成本指標
  cost: {
    unitCost: number;
    wasteCost: number;
    overtimeCost: number;
    costPerUnit: number;
  };
  
  // 交期指標
  delivery: {
    onTimeDelivery: number;
    leadTime: number;
    cycleTime: number;
    throughput: number;
  };
}
```

### FR-MES-PEMLD-004: 即時預警系統
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 指標異常或趨勢惡化
- **行為**: 即時偵測異常並發送預警
- **資料輸入**: 
  - 即時生產數據
  - 預設閾值
  - 歷史基準
  - 預測模型
  - 規則引擎
- **資料輸出**: 
  - 預警通知
  - 異常分析
  - 影響評估
  - 建議行動
  - 升級路徑
- **UI反應**: 
  - 彈出式警告
  - 聲光提醒
  - 郵件通知
  - 手機推播
  - 儀表板高亮

### FR-MES-PEMLD-005: 改善建議系統
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期分析或異常觸發
- **行為**: 基於AI分析提供改善建議
- **資料輸入**: 
  - 歷史數據
  - 最佳實踐
  - 成功案例
  - 失敗教訓
  - 外部基準
- **資料輸出**: 
  - 改善方案
  - 預期效益
  - 實施步驟
  - 風險評估
  - ROI 計算
- **UI反應**: 
  - 建議清單
  - 優先順序
  - 實施追蹤
  - 效果評估

## 3. 非功能性需求

### 3.1 效能需求
- 儀表板載入時間 < 2秒
- 數據更新頻率 ≤ 5秒
- 支援 100個並發用戶
- 歷史數據查詢 < 3秒

### 3.2 可用性需求
- 系統可用性 99.9%
- 響應式設計支援
- 多語言介面
- 自訂儀表板

### 3.3 資料需求
- 數據準確性 99.9%
- 即時性延遲 < 5秒
- 歷史資料保留 2年
- 資料壓縮存儲

## 4. 系統設計

### 4.1 資料模型

```typescript
// 人員效率記錄
interface PersonnelEfficiency {
  id: string;
  employeeId: string;
  
  // 時間維度
  period: {
    date: Date;
    shift: string;
    workHours: number;
    overtime: number;
  };
  
  // 生產指標
  production: {
    plannedQty: number;
    actualQty: number;
    goodQty: number;
    defectQty: number;
    reworkQty: number;
  };
  
  // 效率指標
  efficiency: {
    productivity: number;        // 生產力
    utilizationRate: number;     // 利用率
    performanceRate: number;     // 績效率
    qualityRate: number;         // 品質率
    oee: number;                 // 綜合效率
  };
  
  // 時間分析
  timeAnalysis: {
    productiveTime: number;
    setupTime: number;
    downtime: number;
    breakTime: number;
    waitingTime: number;
  };
  
  // 技能評估
  skills: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    certifications: string[];
    trainingNeeds: string[];
  };
  
  // 比較基準
  benchmark: {
    teamAvg: number;
    deptAvg: number;
    bestPractice: number;
    ranking: number;
  };
}

// 損耗監控記錄
interface WasteMonitoring {
  id: string;
  timestamp: Date;
  
  // 損耗來源
  source: {
    workstation: string;
    process: string;
    product: string;
    material: string;
    operator?: string;
  };
  
  // 損耗數據
  waste: {
    type: 'material' | 'time' | 'energy' | 'quality';
    category: 'normal' | 'abnormal' | 'accident';
    quantity: number;
    unit: string;
    cost: number;
  };
  
  // 原因分析
  analysis: {
    rootCause: string;
    contributingFactors: string[];
    preventable: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // 趨勢分析
  trend: {
    direction: 'increasing' | 'stable' | 'decreasing';
    rate: number;
    forecast: number;
    confidence: number;
  };
  
  // 改善追蹤
  improvement: {
    suggested: string[];
    implemented: string[];
    effectiveness: number;
    savings: number;
  };
}

// KPI 記錄
interface KPIRecord {
  id: string;
  kpiId: string;
  
  // KPI 定義
  definition: {
    name: string;
    category: string;
    formula: string;
    unit: string;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  };
  
  // 數值記錄
  value: {
    actual: number;
    target: number;
    baseline: number;
    bestInClass: number;
  };
  
  // 狀態評估
  status: {
    achievement: number;
    trend: 'up' | 'stable' | 'down';
    health: 'good' | 'warning' | 'critical';
    forecast: number;
  };
  
  // 分解分析
  breakdown: {
    dimension: string;
    values: {
      label: string;
      value: number;
      percentage: number;
    }[];
  };
  
  // 行動計劃
  actions: {
    required: boolean;
    plans: {
      action: string;
      owner: string;
      dueDate: Date;
      status: string;
    }[];
  };
  
  recordedAt: Date;
  nextUpdate: Date;
}

// 預警規則
interface AlertRule {
  id: string;
  name: string;
  
  // 規則定義
  rule: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'between' | 'trend';
    threshold: number | [number, number];
    duration?: number;  // 持續時間(秒)
  };
  
  // 觸發條件
  trigger: {
    frequency: 'immediate' | 'throttled' | 'scheduled';
    cooldown?: number;   // 冷卻時間(秒)
    escalation: {
      level: number;
      delay: number;
      recipients: string[];
    }[];
  };
  
  // 通知設定
  notification: {
    channels: ('email' | 'sms' | 'app' | 'dashboard')[];
    template: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    attachments?: string[];
  };
  
  // 自動行動
  automation: {
    enabled: boolean;
    actions: {
      type: string;
      parameters: any;
    }[];
  };
  
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

// 儀表板配置
interface DashboardConfig {
  id: string;
  userId: string;
  name: string;
  
  // 版面配置
  layout: {
    type: 'grid' | 'flow' | 'tabs';
    columns: number;
    widgets: {
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: any;
    }[];
  };
  
  // 資料來源
  dataSources: {
    id: string;
    type: 'realtime' | 'historical' | 'calculated';
    query: string;
    refreshInterval: number;
  }[];
  
  // 過濾器
  filters: {
    global: any;
    widgets: { [widgetId: string]: any };
  };
  
  // 主題設定
  theme: {
    colorScheme: string;
    fontSize: string;
    animations: boolean;
  };
  
  // 分享設定
  sharing: {
    isPublic: boolean;
    sharedWith: string[];
    permissions: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 API 設計

```typescript
// 人員效率 API
interface PersonnelEfficiencyAPI {
  // 效率查詢
  GET    /api/pemld/efficiency/realtime           // 即時效率
  GET    /api/pemld/efficiency/historical         // 歷史效率
  GET    /api/pemld/efficiency/comparison         // 效率對比
  GET    /api/pemld/efficiency/ranking            // 效率排名
  
  // 分析報告
  GET    /api/pemld/efficiency/analysis           // 效率分析
  GET    /api/pemld/efficiency/trends             // 趨勢分析
  POST   /api/pemld/efficiency/forecast           // 效率預測
}

// 損耗監控 API
interface WasteMonitoringAPI {
  // 損耗查詢
  GET    /api/pemld/waste/realtime                // 即時損耗
  GET    /api/pemld/waste/summary                 // 損耗匯總
  GET    /api/pemld/waste/hotspots                // 損耗熱點
  
  // 損耗分析
  GET    /api/pemld/waste/analysis                // 原因分析
  GET    /api/pemld/waste/trends                  // 趨勢分析
  GET    /api/pemld/waste/forecast                // 預測分析
  
  // 改善建議
  GET    /api/pemld/waste/suggestions             // 改善建議
  POST   /api/pemld/waste/improvements            // 記錄改善
  GET    /api/pemld/waste/roi                     // ROI分析
}

// KPI 管理 API
interface KPIManagementAPI {
  // KPI 查詢
  GET    /api/pemld/kpi/dashboard                 // KPI儀表板
  GET    /api/pemld/kpi/details/:id               // KPI詳情
  GET    /api/pemld/kpi/breakdown/:id             // KPI分解
  
  // KPI 設定
  POST   /api/pemld/kpi/targets                   // 設定目標
  PUT    /api/pemld/kpi/thresholds                // 更新閾值
  
  // KPI 報告
  GET    /api/pemld/kpi/reports/daily             // 日報
  GET    /api/pemld/kpi/reports/weekly            // 週報
  GET    /api/pemld/kpi/reports/monthly           // 月報
}

// 預警系統 API
interface AlertSystemAPI {
  // 預警管理
  POST   /api/pemld/alerts/rules                  // 建立規則
  GET    /api/pemld/alerts/active                 // 活動預警
  PUT    /api/pemld/alerts/acknowledge/:id        // 確認預警
  
  // 預警歷史
  GET    /api/pemld/alerts/history                // 預警歷史
  GET    /api/pemld/alerts/statistics             // 預警統計
}

// 儀表板 API
interface DashboardAPI {
  // 儀表板管理
  POST   /api/pemld/dashboards                    // 建立儀表板
  GET    /api/pemld/dashboards                    // 儀表板列表
  PUT    /api/pemld/dashboards/:id                // 更新儀表板
  DELETE /api/pemld/dashboards/:id                // 刪除儀表板
  
  // 小工具管理
  GET    /api/pemld/widgets/available             // 可用小工具
  POST   /api/pemld/widgets/add                   // 新增小工具
  PUT    /api/pemld/widgets/:id/config            // 配置小工具
  
  // 資料訂閱
  WS     /api/pemld/subscribe                     // WebSocket訂閱
}

// WebSocket 事件
interface DashboardWebSocketEvents {
  // 效率事件
  'efficiency:update': (data: any) => void;
  'efficiency:alert': (alert: any) => void;
  
  // 損耗事件
  'waste:update': (data: any) => void;
  'waste:exceeded': (alert: any) => void;
  
  // KPI事件
  'kpi:update': (kpi: any) => void;
  'kpi:target-missed': (kpi: any) => void;
  
  // 系統事件
  'dashboard:refresh': () => void;
  'alert:triggered': (alert: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **MES-PSWO**: 生產數據來源
- **MES-MBU**: 物料損耗數據
- **HR**: 人員資訊、班次
- **BI**: 進階分析功能
- **QM**: 品質數據

### 5.2 外部系統整合
- **IoT平台**: 設備數據採集
- **AI/ML平台**: 預測分析
- **雲端服務**: 數據存儲與計算
- **行動APP**: 移動端查看

## 6. 測試需求

### 6.1 功能測試
- 儀表板配置功能
- 數據準確性驗證
- 預警觸發測試
- 報表生成測試

### 6.2 效能測試
- 100用戶並發訪問
- 大數據量載入測試
- 即時更新壓力測試
- 長時間運行穩定性

### 6.3 使用性測試
- UI/UX 測試
- 響應式設計測試
- 跨瀏覽器相容性
- 行動裝置適配

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 基礎架構與數據模型
2. **Phase 2** (Week 3-4): 人員效率儀表板
3. **Phase 3** (Week 5-6): 物料損耗儀表板
4. **Phase 4** (Week 7): KPI與預警系統
5. **Phase 5** (Week 8): 整合測試與優化

### 7.2 關鍵里程碑
- M1: 數據平台建立
- M2: 效率儀表板上線
- M3: 損耗分析完成
- M4: 預警系統啟用
- M5: 全面運行

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 數據品質問題 | 高 | 中 | 建立數據清洗機制 |
| 系統效能瓶頸 | 高 | 中 | 採用快取與CDN |
| 使用者接受度 | 中 | 中 | 提供培訓與指南 |
| 整合複雜度 | 中 | 高 | 分階段整合 |

## 9. 成功指標

### 9.1 業務指標
- 決策時間縮短 ≥ 70%
- 生產效率提升 ≥ 40%
- 物料損耗降低 ≥ 35%
- 使用者滿意度 ≥ 85%

### 9.2 系統指標
- 頁面載入時間 ≤ 2秒
- 資料更新延遲 ≤ 5秒
- 系統可用性 ≥ 99.9%
- 預警準確率 ≥ 95%

## 10. 相關文件

- [MES 總體架構](../README.md)
- [BI 分析平台](../../12-BI-Business_Intelligence/README.md)
- [儀表板設計規範](../../docs/standards/dashboard-design.md)
- [KPI 定義標準](../../docs/standards/kpi-definitions.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: mes@tsaitung.com