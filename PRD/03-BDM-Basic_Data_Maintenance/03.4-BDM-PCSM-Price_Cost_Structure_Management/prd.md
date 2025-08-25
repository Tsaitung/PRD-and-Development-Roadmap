# BDM-PCSM 價格與成本結構管理 (Price & Cost Structure Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: OM (訂單管理), PM (採購管理), FA (財務會計), MES (製造執行)

## 1. 功能概述

### 1.1 目的
建立統一的價格與成本管理系統，維護多層次價格策略、成本結構、利潤分析，確保定價準確性、成本透明度和利潤最大化。

### 1.2 範圍
- 價格清單管理
- 成本結構維護
- 定價策略設定
- 促銷折扣管理
- 利潤分析報告

### 1.3 關鍵價值
- 定價準確率 100%
- 成本透明度 95%
- 利潤率提升 15%
- 報價效率提升 70%

## 2. 功能性需求

### FR-BDM-PCSM-001: 價格清單管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 價格制定或調整需求
- **行為**: 管理多層次產品價格清單
- **資料輸入**: 
  - 產品項目
  - 價格層級
  - 有效期間
  - 幣別設定
  - 適用條件
- **資料輸出**: 
  - 價格清單
  - 價格矩陣
  - 歷史記錄
  - 比較報表
  - 審批流程
- **UI反應**: 
  - 批次設定
  - 公式計算
  - 版本控制
  - 即時預覽
  - 發布管理
- **例外處理**: 
  - 價格衝突
  - 負毛利警示
  - 版本重疊
  - 權限控制

#### 驗收標準
```yaml
- 條件: 建立新價格清單
  預期結果: 自動檢查衝突並產生版本記錄

- 條件: 批次調整價格
  預期結果: 依公式計算並保留調整歷史

- 條件: 查詢特定日期價格
  預期結果: 返回該日期有效的價格版本
```

#### Traceability
- **測試案例**: tests/unit/FR-BDM-PCSM-001.test.ts
- **實作程式**: src/modules/bdm/services/priceManagement.service.ts
- **相關文件**: TOC Modules.md - Section 3.4

### FR-BDM-PCSM-002: 成本結構維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 成本變動或核算需求
- **行為**: 維護產品完整成本結構
- **資料輸入**: 
  - 材料成本
  - 人工成本
  - 製造費用
  - 管銷費用
  - 成本動因
- **資料輸出**: 
  - 成本明細
  - 成本樹
  - 差異分析
  - 成本趨勢
  - 模擬結果
- **UI反應**: 
  - 成本分解
  - 動因分析
  - 敏感度測試
  - 圖表展示
  - 匯出報表
- **例外處理**: 
  - 成本異常
  - 資料缺失
  - 計算錯誤
  - 循環參照

#### 價格管理模型
```typescript
interface PriceManagement {
  id: string;
  priceListId: string;
  
  // 價格清單
  priceList: {
    name: string;
    description: string;
    type: 'standard' | 'customer' | 'campaign' | 'contract';
    
    validity: {
      effectiveFrom: Date;
      effectiveTo?: Date;
      status: 'draft' | 'active' | 'expired' | 'suspended';
    };
    
    scope: {
      customers?: string[];
      customerGroups?: string[];
      territories?: string[];
      channels?: string[];
    };
    
    currency: {
      primary: string;
      alternatives?: {
        currency: string;
        exchangeRate: number;
        rounding: number;
      }[];
    };
    
    priority: number;
    
    approval?: {
      required: boolean;
      approvedBy?: string;
      approvedAt?: Date;
    };
  };
  
  // 價格項目
  priceItems: {
    itemId: string;
    itemCode: string;
    
    pricing: {
      basePrice: number;
      
      // 階梯定價
      tiers?: {
        minQty: number;
        maxQty?: number;
        price: number;
        discount?: number;
      }[];
      
      // 單位價格
      unitPrices?: {
        unit: string;
        price: number;
        default: boolean;
      }[];
      
      // 計算方式
      calculation?: {
        method: 'fixed' | 'cost_plus' | 'market' | 'formula';
        
        costPlus?: {
          costBase: string;
          markup: number;
          minimum?: number;
          maximum?: number;
        };
        
        formula?: {
          expression: string;
          variables: any;
        };
      };
    };
    
    // 折扣規則
    discounts?: {
      type: 'percentage' | 'amount' | 'price';
      value: number;
      
      conditions?: {
        minQuantity?: number;
        minAmount?: number;
        paymentTerms?: string;
        combinable: boolean;
      };
      
      validity?: {
        from: Date;
        to: Date;
      };
    }[];
    
    // 稅務設定
    tax?: {
      taxable: boolean;
      taxRate?: number;
      taxIncluded: boolean;
    };
    
    // 利潤分析
    profitability?: {
      cost: number;
      margin: number;
      marginPercent: number;
      contribution: number;
    };
  }[];
  
  // 價格規則
  rules?: {
    ruleId: string;
    ruleName: string;
    
    condition: {
      field: string;
      operator: string;
      value: any;
    }[];
    
    action: {
      type: 'adjust' | 'override' | 'block';
      adjustment?: {
        type: 'percentage' | 'amount';
        value: number;
      };
    };
    
    priority: number;
    active: boolean;
  }[];
  
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    version: number;
  };
}
```

### FR-BDM-PCSM-003: 定價策略設定
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 市場策略或競爭分析
- **行為**: 制定和執行定價策略
- **資料輸入**: 
  - 市場定位
  - 競爭分析
  - 成本基準
  - 利潤目標
  - 價格彈性
- **資料輸出**: 
  - 策略方案
  - 模擬結果
  - 影響分析
  - 建議價格
  - 執行計劃
- **UI反應**: 
  - 策略嚮導
  - 情境模擬
  - 敏感度分析
  - 比較矩陣
  - 決策支援
- **例外處理**: 
  - 策略衝突
  - 目標不可行
  - 市場異常
  - 法規限制

#### 成本結構模型
```typescript
interface CostStructure {
  id: string;
  itemId: string;
  
  // 成本類型
  costingMethod: 'standard' | 'actual' | 'average' | 'abc';
  
  // 直接成本
  directCosts: {
    // 材料成本
    materials: {
      componentId: string;
      componentName: string;
      
      quantity: number;
      unit: string;
      
      unitCost: number;
      totalCost: number;
      
      source: 'purchase' | 'production' | 'transfer';
      
      variance?: {
        standard: number;
        actual: number;
        difference: number;
      };
    }[];
    
    // 人工成本
    labor: {
      workCenter: string;
      operation: string;
      
      standardTime: number;
      actualTime?: number;
      
      rate: {
        hourly: number;
        overtime?: number;
      };
      
      totalCost: number;
    }[];
    
    // 外包成本
    outsourcing?: {
      service: string;
      vendor: string;
      cost: number;
    }[];
    
    totalDirect: number;
  };
  
  // 間接成本
  indirectCosts: {
    // 製造費用
    overhead: {
      category: string;
      
      allocation: {
        method: 'direct' | 'machine_hours' | 'labor_hours' | 'units';
        driver: string;
        rate: number;
      };
      
      allocated: number;
    }[];
    
    // 管理費用
    administrative?: {
      type: string;
      percentage: number;
      amount: number;
    }[];
    
    // 銷售費用
    selling?: {
      commission?: number;
      marketing?: number;
      distribution?: number;
    };
    
    totalIndirect: number;
  };
  
  // 成本匯總
  summary: {
    totalMaterial: number;
    totalLabor: number;
    totalOverhead: number;
    
    totalCost: number;
    unitCost: number;
    
    breakdown: {
      materialPercent: number;
      laborPercent: number;
      overheadPercent: number;
    };
  };
  
  // 成本分析
  analysis?: {
    // 成本動因
    drivers: {
      driver: string;
      impact: number;
      controllable: boolean;
      optimization?: string;
    }[];
    
    // 變動分析
    variance?: {
      budgeted: number;
      actual: number;
      variance: number;
      explanation?: string;
    };
    
    // 趨勢分析
    trend?: {
      period: string;
      cost: number;
      change: number;
    }[];
    
    // 改善機會
    opportunities?: {
      area: string;
      potential: number;
      effort: 'low' | 'medium' | 'high';
      recommendation: string;
    }[];
  };
  
  // 版本控制
  version: {
    versionNo: string;
    effectiveDate: Date;
    status: 'draft' | 'approved' | 'active' | 'obsolete';
    
    approvedBy?: string;
    approvedAt?: Date;
    
    changes?: string[];
  };
}
```

### FR-BDM-PCSM-004: 促銷折扣管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 促銷活動或特殊折扣
- **行為**: 管理各類促銷和折扣方案
- **資料輸入**: 
  - 促銷類型
  - 折扣條件
  - 適用範圍
  - 活動期間
  - 組合規則
- **資料輸出**: 
  - 促銷方案
  - 折扣計算
  - 效果追蹤
  - 衝突檢查
  - ROI分析
- **UI反應**: 
  - 方案設計器
  - 規則建構
  - 模擬測試
  - 衝突提示
  - 效果儀表板
- **例外處理**: 
  - 規則衝突
  - 超額折扣
  - 時間重疊
  - 組合限制

### FR-BDM-PCSM-005: 利潤分析報告
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 管理決策或定期分析
- **行為**: 產生多維度利潤分析報告
- **資料輸入**: 
  - 分析維度
  - 期間範圍
  - 產品群組
  - 客戶分類
  - 成本分攤
- **資料輸出**: 
  - 利潤報表
  - 貢獻分析
  - 盈虧平衡
  - 敏感度分析
  - 改善建議
- **UI反應**: 
  - 多維分析
  - 圖表切換
  - 下鑽功能
  - 匯出選項
  - 訂閱推送
- **例外處理**: 
  - 數據不足
  - 分攤錯誤
  - 計算異常
  - 格式問題

## 3. 系統設計

### 3.1 資料模型

```typescript
// 定價策略
interface PricingStrategy {
  id: string;
  strategyName: string;
  
  // 策略定義
  strategy: {
    type: 'penetration' | 'skimming' | 'competitive' | 'value' | 'dynamic';
    
    objectives: {
      primary: 'profit' | 'volume' | 'market_share' | 'brand';
      targets: {
        metric: string;
        value: number;
        timeframe: string;
      }[];
    };
    
    positioning: {
      market: 'premium' | 'mid_range' | 'economy';
      versus_competition: 'above' | 'match' | 'below';
      differential?: number;
    };
    
    constraints?: {
      minMargin?: number;
      maxDiscount?: number;
      priceFloor?: number;
      priceCeiling?: number;
    };
  };
  
  // 執行規則
  implementation: {
    products: string[];
    markets: string[];
    
    pricing: {
      baseMethod: 'cost_plus' | 'market_based' | 'value_based';
      
      adjustments: {
        factor: string;
        impact: number;
        condition?: string;
      }[];
      
      optimization?: {
        algorithm: string;
        parameters: any;
        frequency: string;
      };
    };
    
    monitoring: {
      kpis: {
        metric: string;
        target: number;
        actual?: number;
        threshold: number;
      }[];
      
      triggers: {
        event: string;
        action: string;
      }[];
    };
  };
  
  // 模擬分析
  simulation?: {
    scenarios: {
      name: string;
      assumptions: any;
      
      results: {
        revenue: number;
        volume: number;
        profit: number;
        marketShare?: number;
      };
      
      risk: 'low' | 'medium' | 'high';
    }[];
    
    sensitivity: {
      variable: string;
      range: number[];
      impact: number[];
    }[];
    
    recommendation: string;
  };
  
  status: 'draft' | 'approved' | 'active' | 'suspended';
  
  effectiveFrom: Date;
  effectiveTo?: Date;
}

// 促銷管理
interface PromotionManagement {
  id: string;
  promotionCode: string;
  
  // 促銷資訊
  promotion: {
    name: string;
    type: 'discount' | 'bogo' | 'bundle' | 'voucher' | 'loyalty';
    description: string;
    
    period: {
      startDate: Date;
      endDate: Date;
      
      timeRestrictions?: {
        daysOfWeek?: number[];
        hoursOfDay?: number[];
        blackoutDates?: Date[];
      };
    };
    
    budget?: {
      total: number;
      used: number;
      remaining: number;
    };
  };
  
  // 優惠機制
  mechanics: {
    // 折扣
    discount?: {
      type: 'percentage' | 'fixed' | 'tiered';
      value: number | number[];
      
      application: 'item' | 'order' | 'shipping';
      maxDiscount?: number;
    };
    
    // 買一送一
    bogo?: {
      buyQuantity: number;
      getQuantity: number;
      getProduct?: string;
      maxSets?: number;
    };
    
    // 組合優惠
    bundle?: {
      products: string[];
      bundlePrice: number;
      savings: number;
    };
    
    // 優惠券
    voucher?: {
      code: string;
      value: number;
      usageLimit: number;
      usedCount: number;
    };
  };
  
  // 適用條件
  conditions: {
    customers?: {
      segments?: string[];
      tiers?: string[];
      specific?: string[];
    };
    
    products?: {
      included?: string[];
      excluded?: string[];
      categories?: string[];
    };
    
    order?: {
      minAmount?: number;
      minQuantity?: number;
      paymentMethods?: string[];
    };
    
    combination?: {
      allowOtherPromotions: boolean;
      excludedPromotions?: string[];
      priority: number;
    };
  };
  
  // 效果追蹤
  performance?: {
    usage: {
      transactions: number;
      customers: number;
      quantity: number;
      revenue: number;
      discount: number;
    };
    
    effectiveness: {
      conversionRate: number;
      incrementalRevenue: number;
      roi: number;
      
      comparison?: {
        baseline: number;
        uplift: number;
      };
    };
    
    feedback?: {
      satisfaction: number;
      complaints: number;
      suggestions: string[];
    };
  };
}

// 利潤分析
interface ProfitabilityAnalysis {
  id: string;
  analysisDate: Date;
  
  // 分析範圍
  scope: {
    period: { start: Date; end: Date; };
    
    dimensions: {
      products?: string[];
      customers?: string[];
      channels?: string[];
      regions?: string[];
    };
  };
  
  // 利潤結構
  profitStructure: {
    revenue: {
      gross: number;
      returns: number;
      discounts: number;
      net: number;
    };
    
    costs: {
      direct: {
        materials: number;
        labor: number;
        total: number;
      };
      
      indirect: {
        overhead: number;
        admin: number;
        selling: number;
        total: number;
      };
      
      total: number;
    };
    
    profit: {
      gross: number;
      grossMargin: number;
      
      operating: number;
      operatingMargin: number;
      
      net: number;
      netMargin: number;
    };
  };
  
  // 貢獻分析
  contribution: {
    byProduct?: {
      productId: string;
      revenue: number;
      variableCost: number;
      contribution: number;
      contributionMargin: number;
      rank: number;
    }[];
    
    byCustomer?: {
      customerId: string;
      revenue: number;
      cost: number;
      profit: number;
      profitMargin: number;
      ltv?: number;
    }[];
    
    byChannel?: {
      channel: string;
      revenue: number;
      cost: number;
      profit: number;
      efficiency: number;
    }[];
  };
  
  // 敏感度分析
  sensitivity?: {
    priceElasticity: {
      priceChange: number[];
      volumeImpact: number[];
      profitImpact: number[];
      optimalPrice?: number;
    };
    
    costSensitivity: {
      costFactor: string;
      changeRange: number[];
      profitImpact: number[];
    }[];
    
    breakeven: {
      currentVolume: number;
      breakevenVolume: number;
      marginOfSafety: number;
    };
  };
  
  // 建議改善
  recommendations?: {
    pricing: string[];
    cost: string[];
    mix: string[];
    volume: string[];
  };
}
```

### 3.2 API 設計

```typescript
// 價格成本管理 API
interface PriceCostManagementAPI {
  // 價格管理
  POST   /api/bdm/prices                      // 建立價格清單
  GET    /api/bdm/prices                      // 查詢價格
  PUT    /api/bdm/prices/:id                  // 更新價格
  POST   /api/bdm/prices/calculate            // 計算價格
  GET    /api/bdm/prices/history              // 價格歷史
  
  // 成本管理
  POST   /api/bdm/costs                       // 建立成本結構
  GET    /api/bdm/costs/:itemId               // 查詢成本
  PUT    /api/bdm/costs/:itemId               // 更新成本
  POST   /api/bdm/costs/rollup                // 成本彙總
  
  // 定價策略
  POST   /api/bdm/strategies                  // 建立策略
  GET    /api/bdm/strategies                  // 策略列表
  POST   /api/bdm/strategies/simulate         // 模擬分析
  POST   /api/bdm/strategies/:id/apply        // 應用策略
  
  // 促銷管理
  POST   /api/bdm/promotions                  // 建立促銷
  GET    /api/bdm/promotions                  // 促銷列表
  POST   /api/bdm/promotions/validate         // 驗證促銷
  GET    /api/bdm/promotions/:id/performance  // 效果分析
  
  // 利潤分析
  POST   /api/bdm/profitability/analyze       // 執行分析
  GET    /api/bdm/profitability/report        // 分析報告
  POST   /api/bdm/profitability/forecast      // 利潤預測
}

// WebSocket 事件
interface PCSMWebSocketEvents {
  'price:updated': (price: any) => void;
  'cost:changed': (cost: any) => void;
  'promotion:activated': (promotion: any) => void;
  'margin:alert': (alert: any) => void;
  'strategy:applied': (strategy: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OM**: 訂單定價
- **PM**: 採購成本
- **MES**: 生產成本
- **FA**: 財務分析
- **BI**: 決策支援

### 4.2 外部系統整合
- **市場資料**: 競爭價格
- **成本系統**: 成本核算
- **電商平台**: 價格同步
- **ERP系統**: 主數據

## 5. 成功指標

### 5.1 業務指標
- 報價準確率 100%
- 毛利率提升 > 5%
- 定價時間 < 1分鐘
- 促銷ROI > 150%

### 5.2 系統指標
- 價格計算 < 0.5秒
- 並發處理 > 500筆
- 系統可用性 ≥ 99.9%
- 數據一致性 100%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bdm@tsaitung.com