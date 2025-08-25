# OP-PP 生產計劃 (Production Planning) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: OP-MC (主計劃), MES (製造執行), WMS (倉儲管理), PM (採購管理)

## 1. 功能概述

### 1.1 目的
建立細部生產計劃管理系統，將主生產計劃轉換為可執行的工單計劃，優化生產排程、資源分配和進度控制。

### 1.2 範圍
- 工單計劃生成
- 細部排程優化
- 資源分配管理
- 進度追蹤控制
- 異常處理機制

### 1.3 關鍵價值
- 排程效率提升 45%
- 準時交貨率 > 98%
- 設備利用率提升 30%
- 在製品降低 25%

## 2. 功能性需求

### FR-OP-PP-001: 工單計劃生成
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: MPS確定或訂單釋放
- **行為**: 生成詳細工單計劃
- **資料輸入**: 
  - 生產需求
  - BOM資料
  - 途程資訊
  - 批量規則
  - 優先順序
- **資料輸出**: 
  - 工單清單
  - 開工日期
  - 完工日期
  - 物料需求
  - 資源需求
- **UI反應**: 
  - 工單生成嚮導
  - 批次處理
  - 規則配置
  - 預覽確認
  - 批準流程
- **例外處理**: 
  - BOM不完整
  - 途程缺失
  - 物料不足
  - 產能超載

#### 驗收標準
```yaml
- 條件: 從MPS生成工單
  預期結果: 自動展開BOM並計算開工時間

- 條件: 緊急插單
  預期結果: 重新排程並評估影響

- 條件: 批量合併
  預期結果: 優化批量並減少換線次數
```

#### Traceability
- **測試案例**: tests/unit/FR-OP-PP-001.test.ts
- **實作程式**: src/modules/op/services/productionPlanning.service.ts
- **相關文件**: TOC Modules.md - Section 5.2

### FR-OP-PP-002: 細部排程優化
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 工單確認或資源變更
- **行為**: 優化生產排程順序
- **資料輸入**: 
  - 工單清單
  - 設備能力
  - 人員配置
  - 換線時間
  - 交期要求
- **資料輸出**: 
  - 排程甘特圖
  - 設備負荷
  - 人員安排
  - 關鍵路徑
  - 緩衝時間
- **UI反應**: 
  - 互動甘特圖
  - 拖放調整
  - 自動優化
  - 衝突提示
  - 模擬比較
- **例外處理**: 
  - 資源衝突
  - 交期無法滿足
  - 技能不匹配
  - 設備故障

#### 生產計劃模型
```typescript
interface ProductionPlanning {
  id: string;
  planId: string;
  
  // 計劃資訊
  planInfo: {
    planDate: Date;
    planHorizon: { start: Date; end: Date; };
    planType: 'daily' | 'weekly' | 'monthly';
    
    status: 'draft' | 'released' | 'executing' | 'completed';
    version: number;
    
    planner: {
      userId: string;
      name: string;
      department: string;
    };
  };
  
  // 工單管理
  workOrders: {
    orderId: string;
    orderNo: string;
    
    // 基本資訊
    product: {
      itemCode: string;
      itemName: string;
      specification?: string;
      revision?: string;
    };
    
    quantity: {
      ordered: number;
      released: number;
      completed: number;
      scrapped?: number;
      unit: string;
    };
    
    // 時程安排
    schedule: {
      plannedStart: Date;
      plannedEnd: Date;
      actualStart?: Date;
      actualEnd?: Date;
      
      priority: number;
      rush?: boolean;
      
      constraints?: {
        earliestStart?: Date;
        latestEnd?: Date;
        fixedDate?: Date;
      };
    };
    
    // 工序計劃
    operations: {
      sequenceNo: number;
      operationCode: string;
      description: string;
      
      workCenter: {
        code: string;
        name: string;
        machine?: string;
      };
      
      timing: {
        setupTime: number;
        runTime: number;
        queueTime?: number;
        moveTime?: number;
        
        plannedStart?: Date;
        plannedEnd?: Date;
        actualStart?: Date;
        actualEnd?: Date;
      };
      
      resources: {
        labor?: {
          required: number;
          assigned?: string[];
          skill?: string;
        };
        
        tools?: {
          toolId: string;
          quantity: number;
        }[];
      };
      
      status: 'waiting' | 'setup' | 'running' | 'completed' | 'hold';
      
      quality?: {
        inspectionRequired: boolean;
        samplingPlan?: string;
        yield?: number;
      };
    }[];
    
    // 物料需求
    materials?: {
      itemCode: string;
      required: number;
      issued?: number;
      location?: string;
      
      availability: {
        onHand: number;
        allocated: number;
        shortages?: number;
      };
    }[];
    
    // 關聯資訊
    references?: {
      salesOrder?: string;
      customer?: string;
      project?: string;
      parentOrder?: string;
    };
    
    status: 'planned' | 'released' | 'started' | 'completed' | 'cancelled';
  }[];
  
  // 排程優化
  scheduling: {
    method: 'forward' | 'backward' | 'bottleneck' | 'jit';
    
    objectives: {
      primary: 'minimize_makespan' | 'maximize_utilization' | 'minimize_tardiness' | 'minimize_wip';
      weights?: {
        makespan?: number;
        utilization?: number;
        tardiness?: number;
        wip?: number;
        changeover?: number;
      };
    };
    
    // 排程結果
    schedule?: {
      // 設備排程
      machines: {
        machineId: string;
        
        assignments: {
          orderId: string;
          operation: number;
          startTime: Date;
          endTime: Date;
          setupTime?: number;
          
          predecessor?: string;
          successor?: string;
        }[];
        
        utilization: number;
        idle: number;
        
        bottleneck?: boolean;
      }[];
      
      // 人員排程
      labor?: {
        workerId: string;
        
        assignments: {
          orderId: string;
          operation: number;
          startTime: Date;
          endTime: Date;
          workCenter: string;
        }[];
        
        utilization: number;
        overtime?: number;
      }[];
      
      // 績效指標
      metrics: {
        makespan: number;
        flowTime: number;
        tardiness: number;
        utilization: number;
        throughput: number;
      };
    };
    
    // 排程規則
    rules?: {
      sequencing: 'fifo' | 'spt' | 'edd' | 'cr' | 'custom';  // SPT: Shortest Processing Time, EDD: Earliest Due Date, CR: Critical Ratio
      
      batching?: {
        enabled: boolean;
        minBatch?: number;
        maxBatch?: number;
      };
      
      splitting?: {
        allowed: boolean;
        maxSplits?: number;
      };
      
      preemption?: {
        allowed: boolean;
        priority?: number;
      };
    };
  };
  
  // 資源管理
  resources: {
    // 設備資源
    equipment: {
      resourceId: string;
      resourceName: string;
      
      calendar: {
        available: boolean;
        shifts?: {
          shift: number;
          start: string;
          end: string;
        }[];
        
        maintenance?: {
          date: Date;
          duration: number;
          type: string;
        }[];
      };
      
      capacity: {
        rated: number;
        effective: number;
        unit: string;
      };
      
      allocation: {
        allocated: number;
        available: number;
        overload?: number;
      };
    }[];
    
    // 人力資源
    workforce?: {
      workerId: string;
      name: string;
      
      skills: string[];
      certifications?: string[];
      
      availability: {
        date: Date;
        available: boolean;
        shift?: number;
        overtime?: boolean;
      }[];
      
      assignment?: {
        orderId: string;
        operation: number;
        hours: number;
      };
    }[];
    
    // 工具資源
    tooling?: {
      toolId: string;
      toolName: string;
      
      quantity: {
        total: number;
        available: number;
        allocated: number;
      };
      
      allocation: {
        orderId: string;
        quantity: number;
        from: Date;
        to: Date;
      }[];
    }[];
  };
  
  // 執行監控
  monitoring?: {
    // 進度追蹤
    progress: {
      plannedCompletion: number;
      actualCompletion: number;
      variance: number;
      
      onTime: number;
      delayed: number;
      ahead: number;
    };
    
    // 異常事件
    exceptions?: {
      exceptionId: string;
      type: 'delay' | 'quality' | 'material' | 'equipment' | 'labor';
      
      description: string;
      impact: string;
      
      occurrence: Date;
      resolution?: {
        action: string;
        resolvedBy?: string;
        resolvedAt?: Date;
      };
    }[];
    
    // KPI
    kpis: {
      otd: number;  // On-Time Delivery
      oee?: number;  // Overall Equipment Effectiveness
      productivity?: number;
      quality?: number;
      
      trend: {
        period: string;
        value: number;
      }[];
    };
  };
}
```

### FR-OP-PP-003: 資源分配管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 排程確定或資源調整
- **行為**: 分配和管理生產資源
- **資料輸入**: 
  - 資源需求
  - 可用資源
  - 技能矩陣
  - 優先規則
  - 限制條件
- **資料輸出**: 
  - 資源分配表
  - 技能匹配
  - 負荷平衡
  - 衝突清單
  - 調整建議
- **UI反應**: 
  - 資源看板
  - 拖放分配
  - 負荷圖表
  - 技能篩選
  - 衝突警示
- **例外處理**: 
  - 資源不足
  - 技能不符
  - 時間衝突
  - 認證過期

### FR-OP-PP-004: 進度追蹤控制
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 生產執行或狀態更新
- **行為**: 追蹤和控制生產進度
- **資料輸入**: 
  - 完工回報
  - 品質數據
  - 異常事件
  - 停機記錄
  - 物料消耗
- **資料輸出**: 
  - 進度報告
  - 完成率
  - 預計完工
  - 偏差分析
  - 趨勢圖表
- **UI反應**: 
  - 進度儀表板
  - 里程碑追蹤
  - 預警提示
  - 趨勢分析
  - 即時更新
- **例外處理**: 
  - 進度落後
  - 品質異常
  - 設備故障
  - 物料短缺

### FR-OP-PP-005: 異常處理機制
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 異常事件發生
- **行為**: 處理生產異常並調整計劃
- **資料輸入**: 
  - 異常類型
  - 影響範圍
  - 可用方案
  - 決策規則
  - 歷史案例
- **資料輸出**: 
  - 處理方案
  - 調整計劃
  - 影響評估
  - 通知清單
  - 改善建議
- **UI反應**: 
  - 異常警報
  - 決策支援
  - 方案比較
  - 快速調整
  - 經驗學習
- **例外處理**: 
  - 連鎖反應
  - 無可行方案
  - 授權不足
  - 系統限制

## 3. 系統設計

### 3.1 資料模型

```typescript
// 排程演算法
interface SchedulingAlgorithm {
  // 排程引擎
  engine: {
    type: 'rule_based' | 'optimization' | 'simulation' | 'ai';
    
    // 規則基礎
    ruleBased?: {
      rules: {
        priority: number;
        condition: string;
        action: string;
      }[];
      
      dispatcher: {
        rule: 'spt' | 'edd' | 'cr' | 'slack' | 'custom';
        tieBreaker?: string;
      };
    };
    
    // 最佳化
    optimization?: {
      solver: 'linear' | 'integer' | 'constraint' | 'genetic' | 'simulated_annealing';
      
      model: {
        variables: any[];
        objectives: any[];
        constraints: any[];
      };
      
      parameters?: {
        timeLimit?: number;
        gapTolerance?: number;
        iterations?: number;
      };
    };
    
    // 模擬
    simulation?: {
      type: 'discrete_event' | 'monte_carlo';
      replications: number;
      
      scenarios: {
        name: string;
        parameters: any;
        probability?: number;
      }[];
      
      results?: {
        mean: any;
        stdDev: any;
        confidence: number;
      };
    };
  };
  
  // 執行結果
  execution: {
    startTime: Date;
    endTime?: Date;
    
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    
    solution?: {
      schedule: any[];
      objectives: any;
      feasible: boolean;
      optimal?: boolean;
    };
    
    performance: {
      runtime: number;
      iterations?: number;
      improvement?: number;
    };
  };
}

// 資源分配
interface ResourceAllocation {
  // 分配策略
  strategy: {
    method: 'priority' | 'load_balance' | 'skill_match' | 'cost_minimize';
    
    priorities?: {
      orderPriority: boolean;
      dueDatePriority: boolean;
      customerPriority: boolean;
      
      weights?: {
        order: number;
        dueDate: number;
        customer: number;
      };
    };
    
    balancing?: {
      targetUtilization: number;
      maxOverload: number;
      smoothing: boolean;
    };
    
    skillMatching?: {
      required: boolean;
      preferredSkill: boolean;
      certification: boolean;
      
      scoring?: {
        skill: number;
        experience: number;
        performance: number;
      };
    };
  };
  
  // 分配結果
  allocation: {
    resources: {
      resourceId: string;
      resourceType: string;
      
      assignments: {
        taskId: string;
        quantity: number;
        startTime: Date;
        endTime: Date;
        
        locked: boolean;
        manual?: boolean;
      }[];
      
      utilization: {
        allocated: number;
        available: number;
        percentage: number;
      };
      
      conflicts?: {
        type: string;
        description: string;
        resolution?: string;
      }[];
    }[];
    
    unassigned?: {
      taskId: string;
      reason: string;
      alternatives?: string[];
    }[];
    
    metrics: {
      utilizationRate: number;
      balanceIndex: number;
      conflictCount: number;
      manualAdjustments: number;
    };
  };
}

// 進度管理
interface ProgressManagement {
  orderId: string;
  
  // 計劃進度
  planned: {
    startDate: Date;
    endDate: Date;
    duration: number;
    
    milestones?: {
      name: string;
      date: Date;
      completed?: boolean;
    }[];
    
    baseline?: {
      saved: Date;
      startDate: Date;
      endDate: Date;
      cost: number;
    };
  };
  
  // 實際進度
  actual: {
    startDate?: Date;
    endDate?: Date;
    
    completion: {
      percentage: number;
      quantity: number;
      
      byOperation?: {
        operation: number;
        completed: number;
        remaining: number;
      }[];
    };
    
    performance: {
      efficiency: number;
      quality: number;
      
      spi?: number;  // Schedule Performance Index
      cpi?: number;  // Cost Performance Index
    };
  };
  
  // 預測完成
  forecast?: {
    completionDate: Date;
    confidence: number;
    
    risks?: {
      risk: string;
      probability: number;
      impact: number;
      mitigation?: string;
    }[];
    
    recommendations?: string[];
  };
  
  // 進度報告
  reporting: {
    lastUpdated: Date;
    updatedBy: string;
    
    status: 'on_track' | 'at_risk' | 'delayed' | 'ahead';
    
    comments?: string;
    attachments?: string[];
    
    distribution?: string[];
  };
}
```

### 3.2 API 設計

```typescript
// 生產計劃 API
interface ProductionPlanningAPI {
  // 工單管理
  POST   /api/op/workorders                   // 建立工單
  GET    /api/op/workorders                   // 工單列表
  GET    /api/op/workorders/:id               // 工單詳情
  PUT    /api/op/workorders/:id               // 更新工單
  POST   /api/op/workorders/:id/release       // 釋放工單
  
  // 排程管理
  POST   /api/op/scheduling/generate          // 生成排程
  GET    /api/op/scheduling/current           // 當前排程
  PUT    /api/op/scheduling/adjust            // 調整排程
  POST   /api/op/scheduling/optimize          // 優化排程
  GET    /api/op/scheduling/gantt             // 甘特圖
  
  // 資源管理
  GET    /api/op/resources/availability       // 資源可用性
  POST   /api/op/resources/allocate           // 分配資源
  PUT    /api/op/resources/reallocate         // 重新分配
  GET    /api/op/resources/utilization        // 資源使用率
  
  // 進度管理
  GET    /api/op/progress/:orderId            // 工單進度
  PUT    /api/op/progress/:orderId            // 更新進度
  GET    /api/op/progress/dashboard           // 進度儀表板
  POST   /api/op/progress/forecast            // 預測完成
  
  // 異常處理
  POST   /api/op/exceptions                   // 報告異常
  GET    /api/op/exceptions                   // 異常列表
  PUT    /api/op/exceptions/:id/resolve       // 解決異常
  GET    /api/op/exceptions/analysis          // 異常分析
}

// WebSocket 事件
interface PPWebSocketEvents {
  'workorder:created': (order: any) => void;
  'schedule:updated': (schedule: any) => void;
  'resource:allocated': (allocation: any) => void;
  'progress:updated': (progress: any) => void;
  'exception:raised': (exception: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OP-MC**: 主生產計劃
- **MES**: 生產執行
- **WMS**: 物料供應
- **PM**: 採購協調
- **BI**: 績效分析

### 4.2 外部系統整合
- **APS系統**: 進階排程
- **MES系統**: 現場執行
- **SCADA**: 設備數據
- **品質系統**: 品質數據

## 5. 成功指標

### 5.1 業務指標
- 準時交貨率 > 98%
- 設備利用率 > 85%
- 在製品周轉天數 < 5天
- 排程調整次數降低 40%

### 5.2 系統指標
- 排程計算時間 < 5分鐘
- 即時更新延遲 < 1秒
- 並發工單處理 > 1000個
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: operations@tsaitung.com