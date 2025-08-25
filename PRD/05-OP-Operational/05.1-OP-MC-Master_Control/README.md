# OP-MC 主計劃管理 (Master Control) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: CRM (客戶需求), OM (訂單管理), MES (製造執行), WMS (倉儲管理), PM (採購管理)

## 1. 功能概述

### 1.1 目的
建立整合性的主生產計劃管理系統，協調銷售預測、生產能力、物料供應和交期承諾，實現供需平衡和資源最佳化配置。

### 1.2 範圍
- 需求預測整合
- 主生產排程
- 產能規劃分析
- 物料需求計算
- S&OP協調管理

### 1.3 關鍵價值
- 計劃準確率提升 40%
- 庫存周轉率提升 35%
- 交期達成率 > 95%
- 產能利用率提升 25%

## 2. 功能性需求

### FR-OP-MC-001: 需求預測整合
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 銷售預測或訂單變更
- **行為**: 整合多源需求並產生綜合預測
- **資料輸入**: 
  - 銷售預測
  - 客戶訂單
  - 歷史數據
  - 市場趨勢
  - 季節因素
- **資料輸出**: 
  - 綜合需求
  - 預測準確度
  - 需求分布
  - 異常提示
  - 調整建議
- **UI反應**: 
  - 多維度檢視
  - 時間軸展示
  - 比較分析
  - 假設模擬
  - 敏感度分析
- **例外處理**: 
  - 預測偏差大
  - 數據不完整
  - 突發需求
  - 系統衝突

#### 驗收標準
```yaml
- 條件: 整合多源需求數據
  預期結果: 自動計算加權平均並識別異常值

- 條件: 需求突然變化
  預期結果: 即時調整計劃並評估影響

- 條件: 執行假設分析
  預期結果: 顯示不同情境下的資源需求
```

#### Traceability
- **測試案例**: tests/unit/FR-OP-MC-001.test.ts
- **實作程式**: src/modules/op/services/masterControl.service.ts
- **相關文件**: TOC Modules.md - Section 5.1

### FR-OP-MC-002: 主生產排程
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 計劃週期或需求變更
- **行為**: 制定和維護主生產計劃
- **資料輸入**: 
  - 需求預測
  - 產能限制
  - 庫存水準
  - 優先順序
  - 限制條件
- **資料輸出**: 
  - MPS計劃
  - 生產批次
  - 時程安排
  - 負荷分析
  - 可承諾量
- **UI反應**: 
  - 甘特圖
  - 負荷圖
  - 拖拽調整
  - 衝突提示
  - 版本比較
- **例外處理**: 
  - 產能不足
  - 物料短缺
  - 交期衝突
  - 優先級矛盾

#### 主計劃模型
```typescript
interface MasterControl {
  id: string;
  planId: string;
  
  // 計劃標頭
  header: {
    planName: string;
    planType: 'rolling' | 'fixed' | 'mixed';
    
    horizon: {
      start: Date;
      end: Date;
      buckets: {
        type: 'daily' | 'weekly' | 'monthly';
        count: number;
      };
      frozen: number;  // 凍結期間
      firm: number;    // 確定期間
      forecast: number; // 預測期間
    };
    
    version: {
      number: string;
      status: 'draft' | 'active' | 'approved' | 'archived';
      effectiveDate: Date;
      approvedBy?: string;
    };
    
    scope: {
      plants: string[];
      productLines?: string[];
      customers?: string[];
    };
  };
  
  // 需求整合
  demand: {
    // 需求來源
    sources: {
      sourceId: string;
      type: 'forecast' | 'order' | 'contract' | 'safety' | 'promotion';
      
      confidence: number;
      priority: number;
      
      items: {
        itemCode: string;
        quantity: number;
        date: Date;
        customer?: string;
      }[];
    }[];
    
    // 整合需求
    consolidated: {
      itemCode: string;
      
      timeBuckets: {
        period: Date;
        
        demand: {
          forecast: number;
          customer: number;
          intercompany: number;
          safety: number;
          total: number;
        };
        
        supply: {
          onHand: number;
          scheduled: number;
          planned: number;
          total: number;
        };
        
        balance: {
          projected: number;
          available: number;
          atp: number;  // Available to Promise
          pab: number;  // Projected Available Balance
        };
      }[];
      
      analytics: {
        variability: number;
        trend: 'increasing' | 'stable' | 'decreasing';
        seasonality?: number[];
        mape?: number;  // Mean Absolute Percentage Error
      };
    }[];
  };
  
  // 主生產計劃
  mps: {
    items: {
      itemCode: string;
      itemName: string;
      
      planning: {
        policy: 'mts' | 'mto' | 'ato' | 'eto';  // Make/Assemble/Engineer to Stock/Order
        lotSize?: number;
        multiple?: number;
        minimum?: number;
        maximum?: number;
      };
      
      schedule: {
        period: Date;
        
        quantities: {
          grossRequirement: number;
          scheduledReceipts: number;
          projectedOnHand: number;
          netRequirement: number;
          plannedReceipts: number;
          plannedReleases: number;
        };
        
        orders?: {
          orderId: string;
          type: 'production' | 'purchase' | 'transfer';
          quantity: number;
          dueDate: Date;
          status: string;
        }[];
        
        constraints?: {
          type: 'capacity' | 'material' | 'tool' | 'labor';
          resource: string;
          available: number;
          required: number;
          shortage?: number;
        }[];
      }[];
      
      metrics: {
        serviceLevel: number;
        inventoryTurns: number;
        planAdherence: number;
      };
    }[];
    
    // 執行狀態
    execution?: {
      released: number;
      inProgress: number;
      completed: number;
      delayed: number;
      
      issues?: {
        type: string;
        description: string;
        impact: string;
        action?: string;
      }[];
    };
  };
  
  // 產能規劃
  capacity: {
    resources: {
      resourceId: string;
      resourceName: string;
      type: 'machine' | 'labor' | 'tool' | 'space';
      
      availability: {
        period: Date;
        
        capacity: {
          gross: number;
          scheduled: number;
          available: number;
          unit: string;
        };
        
        load: {
          planned: number;
          released: number;
          total: number;
          utilization: number;
        };
        
        balance: {
          remaining: number;
          overload?: number;
          efficiency?: number;
        };
      }[];
      
      constraints?: {
        shifts?: number;
        overtime?: boolean;
        maintenance?: Date[];
      };
    }[];
    
    // 瓶頸分析
    bottlenecks?: {
      resource: string;
      period: Date;
      utilization: number;
      impact: string[];
      
      resolution?: {
        option: string;
        cost?: number;
        feasibility: string;
      }[];
    }[];
    
    // 平準化
    leveling?: {
      strategy: 'pull' | 'push' | 'mixed';
      
      adjustments: {
        from: Date;
        to: Date;
        quantity: number;
        reason: string;
      }[];
    };
  };
  
  // S&OP整合
  sop?: {
    // 銷售計劃
    sales: {
      revenue: number;
      units: number;
      mix: { [product: string]: number; };
    };
    
    // 營運計劃
    operations: {
      production: number;
      inventory: number;
      backlog: number;
    };
    
    // 財務計劃
    finance: {
      revenue: number;
      cost: number;
      margin: number;
      workingCapital: number;
    };
    
    // 績效指標
    kpis: {
      forecastAccuracy: number;
      planAttainment: number;
      inventoryDays: number;
      customerService: number;
    };
    
    // 決議事項
    decisions?: {
      date: Date;
      decision: string;
      owner: string;
      dueDate: Date;
    }[];
  };
}
```

### FR-OP-MC-003: 產能規劃分析
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 生產計劃制定或資源變更
- **行為**: 分析產能需求與可用性
- **資料輸入**: 
  - 生產需求
  - 資源能力
  - 工作日曆
  - 效率係數
  - 維護計劃
- **資料輸出**: 
  - 負荷報告
  - 瓶頸分析
  - 產能缺口
  - 加班需求
  - 外包建議
- **UI反應**: 
  - 熱力圖
  - 負荷曲線
  - 資源甘特圖
  - 預警標示
  - 調整模擬
- **例外處理**: 
  - 超負荷
  - 資源故障
  - 技能不符
  - 認證過期

#### 產能分析模型
```typescript
interface CapacityAnalysis {
  // 產能計算
  calculation: {
    method: 'infinite' | 'finite' | 'advanced';
    
    // 無限產能
    infinite?: {
      resources: {
        resource: string;
        requiredHours: number;
        priority: number;
      }[];
    };
    
    // 有限產能
    finite?: {
      resources: {
        resource: string;
        
        available: {
          regular: number;
          overtime?: number;
          subcontract?: number;
        };
        
        required: {
          planned: number;
          firm: number;
          released: number;
        };
        
        allocation: {
          method: 'forward' | 'backward' | 'midpoint';
          priority: string[];
          
          result?: {
            allocated: number;
            unallocated?: number;
            delayed?: Date;
          };
        };
      }[];
    };
    
    // 進階排程
    advanced?: {
      algorithm: 'genetic' | 'simulated_annealing' | 'constraint_programming';
      
      objectives: {
        type: 'minimize_makespan' | 'maximize_utilization' | 'minimize_cost';
        weight: number;
      }[];
      
      constraints: {
        type: string;
        expression: string;
      }[];
      
      solution?: {
        schedule: any[];
        objectives: number[];
        feasible: boolean;
      };
    };
  };
  
  // 負荷平衡
  balancing: {
    strategy: 'level' | 'chase' | 'mixed';
    
    levelLoading?: {
      targetUtilization: number;
      smoothingPeriods: number;
      
      adjustments: {
        period: Date;
        from: number;
        to: number;
        method: 'shift' | 'split' | 'outsource';
      }[];
    };
    
    chaseStrategy?: {
      flexibleCapacity: {
        overtime: { max: number; cost: number; };
        temporary: { available: number; cost: number; };
        subcontract: { vendors: string[]; capacity: number; };
      };
    };
  };
  
  // 瓶頸管理
  bottleneckManagement: {
    identification: {
      method: 'utilization' | 'throughput' | 'toc';  // Theory of Constraints
      threshold: number;
      
      bottlenecks: {
        resource: string;
        utilization: number;
        throughput: number;
        bufferSize?: number;
      }[];
    };
    
    optimization: {
      dbr?: {  // Drum-Buffer-Rope
        drum: string;  // 瓶頸資源
        buffer: number;  // 緩衝時間
        rope: Date;     // 投料時間
      };
      
      improvements?: {
        option: string;
        investment: number;
        capacityGain: number;
        roi: number;
      }[];
    };
  };
}
```

### FR-OP-MC-004: 物料需求計算
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: MPS確定或BOM變更
- **行為**: 計算物料需求計劃(MRP)
- **資料輸入**: 
  - 主生產計劃
  - BOM結構
  - 庫存狀態
  - 採購前置期
  - 批量規則
- **資料輸出**: 
  - 物料需求表
  - 採購建議
  - 缺料清單
  - 庫存預測
  - 成本估算
- **UI反應**: 
  - MRP表格
  - 時間相位
  - 缺料警示
  - 建議訂單
  - 執行追蹤
- **例外處理**: 
  - 物料短缺
  - 前置期過長
  - 供應商問題
  - 品質異常

### FR-OP-MC-005: S&OP協調管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 月度S&OP會議或計劃調整
- **行為**: 協調銷售與營運計劃
- **資料輸入**: 
  - 銷售計劃
  - 生產計劃
  - 財務預算
  - 市場情報
  - 策略目標
- **資料輸出**: 
  - 整合計劃
  - 差異分析
  - 情境模擬
  - 決策建議
  - 行動方案
- **UI反應**: 
  - 儀表板
  - 平衡計分卡
  - 假設分析
  - 會議模式
  - 協作工具
- **例外處理**: 
  - 計劃衝突
  - 目標不一致
  - 資源限制
  - 市場變化

## 3. 系統設計

### 3.1 資料模型

```typescript
// MRP計算
interface MRPCalculation {
  mpsId: string;
  runDate: Date;
  
  // 計算參數
  parameters: {
    horizon: { start: Date; end: Date; };
    
    options: {
      netChange: boolean;
      regenerative: boolean;
      considerSafetyStock: boolean;
      considerScrap: boolean;
      respectLotSize: boolean;
    };
    
    priorities: {
      allocationRule: 'fifo' | 'priority' | 'fair_share';
      shortageHandling: 'backorder' | 'expedite' | 'substitute';
    };
  };
  
  // MRP結果
  results: {
    items: {
      itemCode: string;
      level: number;  // BOM層級
      
      requirements: {
        period: Date;
        
        gross: number;
        scheduled: number;
        onHand: number;
        net: number;
        
        planned: {
          orders: number;
          releases: number;
        };
        
        suggested: {
          type: 'purchase' | 'production' | 'transfer';
          quantity: number;
          releaseDate: Date;
          dueDate: Date;
          vendor?: string;
        }[];
      }[];
      
      exceptions?: {
        type: 'expedite' | 'defer' | 'cancel' | 'quantity';
        message: string;
        order?: string;
        suggestion?: string;
      }[];
    }[];
    
    // 彙總資訊
    summary: {
      totalItems: number;
      plannedOrders: number;
      exceptions: number;
      
      value: {
        purchases: number;
        production: number;
        inventory: number;
      };
      
      criticalItems?: {
        itemCode: string;
        issue: string;
        impact: string;
      }[];
    };
  };
  
  // 執行記錄
  execution: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    
    errors?: {
      itemCode?: string;
      error: string;
      timestamp: Date;
    }[];
    
    statistics?: {
      itemsProcessed: number;
      ordersGenerated: number;
      processingTime: number;
    };
  };
}

// S&OP流程
interface SOPProcess {
  cycleId: string;
  period: { year: number; month: number; };
  
  // 流程階段
  stages: {
    // 數據收集
    dataGathering: {
      status: 'pending' | 'in_progress' | 'completed';
      
      inputs: {
        actualSales?: number;
        actualProduction?: number;
        actualInventory?: number;
        actualFinancials?: any;
      };
      
      deadline: Date;
      completedAt?: Date;
    };
    
    // 需求規劃
    demandPlanning: {
      status: 'pending' | 'in_progress' | 'completed';
      
      forecast: {
        statistical: number;
        judgemental?: number;
        consensus?: number;
      };
      
      review?: {
        date: Date;
        participants: string[];
        adjustments?: any[];
      };
    };
    
    // 供應規劃
    supplyPlanning: {
      status: 'pending' | 'in_progress' | 'completed';
      
      plan: {
        production: number;
        procurement: number;
        inventory: number;
      };
      
      constraints?: {
        capacity?: string[];
        material?: string[];
        financial?: string[];
      };
    };
    
    // 預備會議
    preSOP: {
      status: 'pending' | 'in_progress' | 'completed';
      
      meeting: {
        date?: Date;
        attendees?: string[];
        
        scenarios?: {
          name: string;
          assumptions: any;
          results: any;
        }[];
        
        recommendations?: string[];
      };
    };
    
    // 執行會議
    executiveSOP: {
      status: 'pending' | 'in_progress' | 'completed';
      
      meeting: {
        date?: Date;
        executives?: string[];
        
        decisions?: {
          topic: string;
          decision: string;
          owner: string;
          dueDate?: Date;
        }[];
        
        approvedPlan?: {
          sales: number;
          production: number;
          inventory: number;
          financial: any;
        };
      };
    };
  };
  
  // 績效追蹤
  performance: {
    metrics: {
      forecastAccuracy?: number;
      planAttainment?: number;
      inventoryTurns?: number;
      serviceLevel?: number;
      
      biasAnalysis?: {
        salesBias: number;
        productionBias: number;
      };
    };
    
    improvements?: {
      area: string;
      issue: string;
      action: string;
      owner: string;
      status: string;
    }[];
  };
}

// 計劃協調
interface PlanCoordination {
  // 計劃整合
  integration: {
    plans: {
      type: 'sales' | 'production' | 'procurement' | 'distribution' | 'finance';
      version: string;
      status: string;
      
      key metrics: {
        metric: string;
        value: number;
        unit: string;
      }[];
    }[];
    
    alignment: {
      aligned: boolean;
      
      gaps?: {
        area: string;
        plan1: number;
        plan2: number;
        variance: number;
        resolution?: string;
      }[];
    };
  };
  
  // 情境分析
  scenarios: {
    base: {
      name: string;
      assumptions: any;
      results: any;
    };
    
    alternatives: {
      name: string;
      changes: any;
      impact: any;
      recommendation?: string;
    }[];
    
    sensitivity: {
      variable: string;
      range: number[];
      impact: number[];
    }[];
  };
  
  // 風險評估
  riskAssessment: {
    risks: {
      category: string;
      description: string;
      probability: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      
      mitigation?: {
        strategy: string;
        actions: string[];
        contingency?: string;
      };
    }[];
    
    monitoring: {
      indicators: string[];
      frequency: string;
      owner: string;
    };
  };
}
```

### 3.2 API 設計

```typescript
// 主計劃管理 API
interface MasterControlAPI {
  // 主計劃管理
  POST   /api/op/master-plan                  // 建立主計劃
  GET    /api/op/master-plan/:id              // 查詢主計劃
  PUT    /api/op/master-plan/:id              // 更新主計劃
  POST   /api/op/master-plan/:id/approve      // 審批主計劃
  POST   /api/op/master-plan/:id/simulate     // 模擬分析
  
  // MPS管理
  POST   /api/op/mps/generate                 // 生成MPS
  GET    /api/op/mps/:itemCode                // 查詢MPS
  PUT    /api/op/mps/:itemCode                // 調整MPS
  GET    /api/op/mps/exceptions               // 異常清單
  
  // 產能分析
  POST   /api/op/capacity/calculate           // 計算產能
  GET    /api/op/capacity/load                // 負荷分析
  GET    /api/op/capacity/bottlenecks         // 瓶頸分析
  POST   /api/op/capacity/level               // 產能平準
  
  // MRP計算
  POST   /api/op/mrp/run                      // 執行MRP
  GET    /api/op/mrp/results/:runId           // MRP結果
  GET    /api/op/mrp/suggestions              // 採購建議
  POST   /api/op/mrp/release                  // 釋放訂單
  
  // S&OP協調
  POST   /api/op/sop/cycle                    // 啟動S&OP
  GET    /api/op/sop/:cycleId                 // S&OP狀態
  PUT    /api/op/sop/:cycleId/stage           // 更新階段
  POST   /api/op/sop/:cycleId/scenario        // 情境分析
}

// WebSocket 事件
interface MCWebSocketEvents {
  'plan:updated': (plan: any) => void;
  'mps:changed': (mps: any) => void;
  'capacity:alert': (alert: any) => void;
  'mrp:completed': (result: any) => void;
  'sop:decision': (decision: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **CRM**: 需求預測
- **OM**: 訂單需求
- **MES**: 生產執行
- **WMS**: 庫存狀態
- **PM**: 採購計劃

### 4.2 外部系統整合
- **APS系統**: 進階排程
- **預測系統**: 需求預測
- **供應鏈**: 協同計劃
- **ERP系統**: 資料同步

## 5. 成功指標

### 5.1 業務指標
- 預測準確率 > 85%
- 計劃達成率 > 95%
- 庫存周轉率 > 12次/年
- 產能利用率 > 85%

### 5.2 系統指標
- MRP計算時間 < 30分鐘
- 計劃回應時間 < 2秒
- 並發使用者 > 100人
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: operations@tsaitung.com