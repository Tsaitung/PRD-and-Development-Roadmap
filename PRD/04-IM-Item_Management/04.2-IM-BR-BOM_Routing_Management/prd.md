# IM-BR BOM與途程管理 (BOM & Routing Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: MES (製造執行), BDM-IIM (品項資訊), PM (採購管理), WMS (倉儲管理)

## 1. 功能概述

### 1.1 目的
建立完整的物料清單(BOM)與製造途程管理系統，定義產品結構、材料需求和生產工序，確保製造過程的標準化和可追溯性。

### 1.2 範圍
- BOM結構管理
- 途程定義維護
- 工序標準設定
- 成本累積計算
- 版本控制管理

### 1.3 關鍵價值
- BOM準確率 100%
- 途程效率提升 35%
- 成本計算精度 99.9%
- 變更管理時間縮短 50%

## 2. 功能性需求

### FR-IM-BR-001: BOM結構管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 產品設計或工程變更
- **行為**: 建立和管理多層次物料清單
- **資料輸入**: 
  - 父件資訊
  - 子件清單
  - 用量關係
  - 替代料件
  - 有效期間
- **資料輸出**: 
  - BOM樹狀圖
  - 用料清單
  - 成本彙總
  - where-used報表
  - 變更影響分析
- **UI反應**: 
  - 樹狀編輯器
  - 拖拽調整
  - 版本比較
  - 圖形化展示
  - 批次維護
- **例外處理**: 
  - 循環參照
  - 版本衝突
  - 數量異常
  - 料件停用

#### 驗收標準
```yaml
- 條件: 建立多層BOM結構
  預期結果: 自動檢查循環參照並計算累計用量

- 條件: 工程變更
  預期結果: 產生新版本並保留變更歷史

- 條件: 查詢where-used
  預期結果: 顯示所有使用該零件的父階產品
```

#### Traceability
- **測試案例**: tests/unit/FR-IM-BR-001.test.ts
- **實作程式**: src/modules/im/services/bomManagement.service.ts
- **相關文件**: TOC Modules.md - Section 4.2

### FR-IM-BR-002: 途程定義維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 生產工藝設計或優化
- **行為**: 定義產品製造工序和路線
- **資料輸入**: 
  - 工序順序
  - 作業中心
  - 標準工時
  - 設置時間
  - 品質檢驗點
- **資料輸出**: 
  - 途程圖表
  - 工時分析
  - 產能評估
  - 成本累積
  - 瓶頸分析
- **UI反應**: 
  - 流程圖編輯
  - 工序拖拽
  - 時間軸顯示
  - 模擬運行
  - 最佳化建議
- **例外處理**: 
  - 工序斷鏈
  - 產能不足
  - 時間衝突
  - 資源競爭

#### BOM結構模型
```typescript
interface BOMStructure {
  id: string;
  bomId: string;
  
  // BOM標頭
  header: {
    itemCode: string;
    itemName: string;
    revision: string;
    
    type: 'production' | 'engineering' | 'planning' | 'costing' | 'phantom';
    status: 'draft' | 'released' | 'obsolete' | 'hold';
    
    quantity: {
      base: number;
      unit: string;
    };
    
    validity: {
      effectiveFrom: Date;
      effectiveTo?: Date;
    };
    
    description?: string;
    
    approval?: {
      approvedBy: string;
      approvedDate: Date;
      ecnNumber?: string;  // Engineering Change Notice
    };
  };
  
  // BOM明細
  components: {
    lineNo: number;
    level: number;
    
    item: {
      itemCode: string;
      itemName: string;
      specification?: string;
    };
    
    quantity: {
      per: number;        // 單位用量
      unit: string;
      
      scrap?: {
        rate: number;     // 損耗率
        quantity: number; // 損耗數量
      };
      
      total: number;      // 總需求量
    };
    
    // 供應類型
    supplyType: 'make' | 'buy' | 'phantom' | 'reference';
    
    // 工序資訊
    operation?: {
      sequenceNo: number;
      operationCode: string;
      workCenter?: string;
    };
    
    // 替代料
    alternates?: {
      itemCode: string;
      priority: number;
      ratio?: number;
      
      conditions?: {
        type: string;
        value: any;
      }[];
    }[];
    
    // 位置資訊
    position?: {
      reference: string;
      coordinates?: string;
      drawing?: string;
    };
    
    // 有效期間
    validity?: {
      effectiveFrom?: Date;
      effectiveTo?: Date;
    };
    
    // 成本資訊
    cost?: {
      material: number;
      labor: number;
      overhead: number;
      total: number;
    };
    
    notes?: string;
  }[];
  
  // 子BOM展開
  explosion?: {
    level: number;
    parentItem: string;
    
    components: {
      level: number;
      itemCode: string;
      quantity: number;
      path: string;       // 完整路徑
      leadTime: number;
      cost: number;
    }[];
    
    summary: {
      totalItems: number;
      totalCost: number;
      maxLevel: number;
      criticalPath?: string[];
    };
  };
  
  // Where-Used
  whereUsed?: {
    parentItem: string;
    parentName: string;
    
    usage: {
      quantity: number;
      unit: string;
      operation?: string;
    };
    
    bomType: string;
    status: string;
    effectiveDate?: Date;
  }[];
  
  // 版本控制
  version: {
    major: number;
    minor: number;
    patch?: number;
    
    changeHistory: {
      version: string;
      date: Date;
      changedBy: string;
      changeType: 'create' | 'modify' | 'delete' | 'release';
      description: string;
      
      details?: {
        component: string;
        field: string;
        oldValue: any;
        newValue: any;
      }[];
    }[];
    
    comparison?: {
      baseVersion: string;
      compareVersion: string;
      
      differences: {
        type: 'added' | 'removed' | 'modified';
        component: string;
        changes: any;
      }[];
    };
  };
}
```

### FR-IM-BR-003: 工序標準設定
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 工序標準制定或更新
- **行為**: 設定各工序的標準參數
- **資料輸入**: 
  - 作業內容
  - 標準工時
  - 人機配置
  - 品質標準
  - 作業指導
- **資料輸出**: 
  - 工序卡
  - 作業指導書
  - 檢驗標準
  - 效率報表
  - 改善建議
- **UI反應**: 
  - 參數表單
  - 多媒體支援
  - 版本管理
  - 快速複製
  - 批准流程
- **例外處理**: 
  - 標準衝突
  - 資源不足
  - 技能不符
  - 設備限制

#### 製造途程模型
```typescript
interface ManufacturingRouting {
  id: string;
  routingId: string;
  
  // 途程標頭
  header: {
    itemCode: string;
    itemName: string;
    
    routingCode: string;
    description: string;
    
    type: 'standard' | 'alternate' | 'rework' | 'repair';
    status: 'draft' | 'active' | 'inactive' | 'obsolete';
    
    quantity: {
      base: number;
      unit: string;
    };
    
    validity: {
      effectiveFrom: Date;
      effectiveTo?: Date;
    };
    
    priority?: number;
    yieldRate?: number;
  };
  
  // 工序定義
  operations: {
    sequenceNo: number;
    operationCode: string;
    description: string;
    
    // 作業中心
    workCenter: {
      code: string;
      name: string;
      type: 'machine' | 'labor' | 'both';
      
      capacity?: {
        available: number;
        unit: string;
      };
    };
    
    // 時間設定
    timing: {
      setupTime: {
        standard: number;
        unit: 'minutes' | 'hours';
      };
      
      runTime: {
        per: number;
        unit: 'minutes' | 'hours';
        basisQty: number;
      };
      
      queueTime?: number;
      moveTime?: number;
      waitTime?: number;
      
      overlap?: {
        type: 'quantity' | 'percentage' | 'time';
        value: number;
      };
    };
    
    // 資源需求
    resources: {
      labor?: {
        skill: string;
        quantity: number;
        hours: number;
        rate?: number;
      }[];
      
      tools?: {
        toolCode: string;
        toolName: string;
        quantity: number;
      }[];
      
      fixtures?: {
        fixtureCode: string;
        quantity: number;
      }[];
    };
    
    // 品質控制
    qualityControl?: {
      inspectionRequired: boolean;
      
      inspectionPoints?: {
        type: 'first_piece' | 'in_process' | 'final' | 'sampling';
        frequency?: string;
        
        criteria: {
          parameter: string;
          specification: string;
          tolerance?: string;
          method: string;
        }[];
      }[];
      
      documents?: {
        type: 'sop' | 'wi' | 'drawing' | 'checklist';
        documentNo: string;
        version: string;
      }[];
    };
    
    // 產出設定
    output?: {
      product?: {
        itemCode: string;
        quantity: number;
        unit: string;
      };
      
      byProducts?: {
        itemCode: string;
        quantity: number;
        unit: string;
      }[];
      
      scrap?: {
        rate: number;
        recoverable: boolean;
      };
    };
    
    // 成本要素
    costing?: {
      laborCost: number;
      machineCost: number;
      overheadCost: number;
      setupCost: number;
    };
    
    // 替代工序
    alternates?: {
      operationCode: string;
      workCenter: string;
      efficiency: number;
      priority: number;
    }[];
    
    notes?: string;
    attachments?: string[];
  }[];
  
  // 途程網絡
  network?: {
    // 工序關係
    relationships: {
      fromOperation: number;
      toOperation: number;
      type: 'finish_start' | 'start_start' | 'finish_finish' | 'start_finish';
      lag?: number;
    }[];
    
    // 關鍵路徑
    criticalPath?: {
      operations: number[];
      totalTime: number;
      bottleneck?: number;
    };
    
    // 平行處理
    parallel?: {
      groups: {
        operations: number[];
        canSplit: boolean;
      }[];
    };
  };
  
  // 效能指標
  performance?: {
    standardTime: number;
    actualTime?: number;
    efficiency?: number;
    
    oee?: {  // Overall Equipment Effectiveness
      availability: number;
      performance: number;
      quality: number;
      overall: number;
    };
    
    improvements?: {
      area: string;
      suggestion: string;
      potential: number;
    }[];
  };
}
```

### FR-IM-BR-004: 成本累積計算
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 成本核算或報價需求
- **行為**: 計算產品的累積成本
- **資料輸入**: 
  - 材料成本
  - 人工成本
  - 製造費用
  - 層級設定
  - 分攤規則
- **資料輸出**: 
  - 成本明細
  - 層級成本
  - 成本結構
  - 差異分析
  - 模擬結果
- **UI反應**: 
  - 成本樹
  - 比例圖
  - 敏感度分析
  - What-if模擬
  - 匯出報表
- **例外處理**: 
  - 成本缺失
  - 計算錯誤
  - 循環成本
  - 異常值

### FR-IM-BR-005: 版本控制管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 設計變更或版本發布
- **行為**: 管理BOM和途程的版本
- **資料輸入**: 
  - 版本號
  - 變更原因
  - 生效日期
  - 審批資訊
  - 影響範圍
- **資料輸出**: 
  - 版本歷史
  - 變更對比
  - 影響清單
  - 切換計劃
  - 審批記錄
- **UI反應**: 
  - 版本時間軸
  - 差異標示
  - 並排比較
  - 版本切換
  - 批准流程
- **例外處理**: 
  - 版本衝突
  - 未經審批
  - 日期重疊
  - 依賴問題

## 3. 系統設計

### 3.1 資料模型

```typescript
// 工序標準
interface OperationStandard {
  id: string;
  operationCode: string;
  
  // 作業定義
  definition: {
    name: string;
    category: string;
    description: string;
    
    type: 'setup' | 'process' | 'inspection' | 'move' | 'wait';
    
    complexity: 'simple' | 'moderate' | 'complex';
    skillRequired: string[];
  };
  
  // 標準設定
  standards: {
    // 時間標準
    time: {
      setupTime?: {
        standard: number;
        allowance: number;
        unit: string;
      };
      
      cycleTime: {
        standard: number;
        elements: {
          element: string;
          time: number;
          frequency: number;
        }[];
        
        allowances: {
          personal: number;
          fatigue: number;
          delay: number;
        };
      };
      
      efficiency: {
        target: number;
        minimum: number;
      };
    };
    
    // 品質標準
    quality: {
      specifications: {
        parameter: string;
        nominal: any;
        upperLimit?: any;
        lowerLimit?: any;
        unit?: string;
      }[];
      
      acceptanceRate: number;
      reworkRate?: number;
      scrapRate?: number;
      
      controlPlan?: {
        characteristic: string;
        method: string;
        frequency: string;
        reaction: string;
      }[];
    };
    
    // 作業條件
    conditions: {
      temperature?: { min: number; max: number; unit: string; };
      humidity?: { min: number; max: number; };
      cleanliness?: string;
      lighting?: number;
      ventilation?: string;
    };
  };
  
  // 作業指導
  instructions: {
    steps: {
      stepNo: number;
      description: string;
      
      details?: string;
      duration?: number;
      
      checkPoints?: string[];
      
      media?: {
        type: 'image' | 'video' | 'document';
        url: string;
        caption?: string;
      }[];
      
      tools?: string[];
      materials?: string[];
      
      safety?: string[];
    }[];
    
    troubleshooting?: {
      issue: string;
      cause: string;
      solution: string;
    }[];
  };
  
  // 資源配置
  resources: {
    equipment?: {
      type: string;
      model?: string;
      settings?: any;
      maintenance?: string;
    };
    
    tooling?: {
      toolId: string;
      toolName: string;
      lifespan?: number;
      calibration?: string;
    }[];
    
    consumables?: {
      itemCode: string;
      consumption: number;
      unit: string;
    }[];
  };
  
  version: string;
  status: 'draft' | 'approved' | 'active' | 'obsolete';
}

// 成本累積
interface CostRollup {
  id: string;
  itemCode: string;
  bomId: string;
  
  // 成本計算
  calculation: {
    method: 'standard' | 'current' | 'simulated';
    date: Date;
    
    parameters: {
      includeLaborCost: boolean;
      includeOverhead: boolean;
      includeScrap: boolean;
      
      laborRate?: number;
      overheadRate?: number;
      currency: string;
    };
  };
  
  // 成本明細
  costDetails: {
    // 直接材料
    material: {
      directMaterial: number;
      
      components: {
        level: number;
        itemCode: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
        percentage: number;
      }[];
      
      scrapCost?: number;
    };
    
    // 直接人工
    labor: {
      directLabor: number;
      
      operations: {
        operationCode: string;
        workCenter: string;
        setupHours: number;
        runHours: number;
        rate: number;
        cost: number;
      }[];
    };
    
    // 製造費用
    overhead: {
      manufacturingOverhead: number;
      
      allocation: {
        base: 'labor_hours' | 'machine_hours' | 'material_cost';
        rate: number;
        amount: number;
      };
      
      breakdown?: {
        category: string;
        amount: number;
      }[];
    };
    
    // 外包成本
    subcontracting?: {
      total: number;
      
      services: {
        operation: string;
        vendor: string;
        cost: number;
      }[];
    };
    
    // 總成本
    total: {
      unitCost: number;
      batchCost?: number;
      
      breakdown: {
        materialPercent: number;
        laborPercent: number;
        overheadPercent: number;
        subcontractPercent?: number;
      };
    };
  };
  
  // 成本比較
  comparison?: {
    previousCost?: number;
    variance?: number;
    variancePercent?: number;
    
    reasons?: string[];
  };
  
  // 敏感度分析
  sensitivity?: {
    factors: {
      factor: string;
      baseValue: number;
      impact: {
        change: number;
        newCost: number;
        difference: number;
      }[];
    }[];
    
    breakeven?: {
      quantity: number;
      price: number;
    };
  };
}

// 版本管理
interface VersionControl {
  id: string;
  documentType: 'bom' | 'routing';
  documentId: string;
  
  // 版本資訊
  version: {
    number: string;
    status: 'draft' | 'pending' | 'approved' | 'released' | 'obsolete';
    
    lifecycle: {
      created: Date;
      submitted?: Date;
      approved?: Date;
      released?: Date;
      obsoleted?: Date;
    };
    
    author: string;
    approver?: string;
    
    description: string;
    changeReason?: string;
    ecnNumber?: string;
  };
  
  // 變更內容
  changes: {
    summary: string;
    
    details: {
      type: 'add' | 'modify' | 'delete';
      element: string;
      
      before?: any;
      after?: any;
      
      impact: 'major' | 'minor' | 'patch';
    }[];
    
    affectedItems?: string[];
    affectedOrders?: string[];
  };
  
  // 審批流程
  approval?: {
    workflow: string;
    
    steps: {
      step: number;
      role: string;
      approver?: string;
      
      action?: 'approved' | 'rejected' | 'returned';
      date?: Date;
      comments?: string;
    }[];
    
    currentStep?: number;
    dueDate?: Date;
  };
  
  // 實施計劃
  implementation?: {
    strategy: 'immediate' | 'phased' | 'cutover';
    
    effectiveDate: Date;
    
    plan?: {
      phase: string;
      items: string[];
      startDate: Date;
      endDate?: Date;
      status: string;
    }[];
    
    notifications?: {
      department: string;
      notified: boolean;
      acknowledgedBy?: string;
    }[];
  };
  
  // 相關文件
  attachments?: {
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
}
```

### 3.2 API 設計

```typescript
// BOM與途程管理 API
interface BOMRoutingAPI {
  // BOM管理
  POST   /api/im/bom                          // 建立BOM
  GET    /api/im/bom/:id                      // 查詢BOM
  PUT    /api/im/bom/:id                      // 更新BOM
  DELETE /api/im/bom/:id                      // 刪除BOM
  POST   /api/im/bom/:id/explode              // 展開BOM
  GET    /api/im/bom/where-used/:itemCode     // Where-used查詢
  
  // 途程管理
  POST   /api/im/routing                      // 建立途程
  GET    /api/im/routing/:id                  // 查詢途程
  PUT    /api/im/routing/:id                  // 更新途程
  POST   /api/im/routing/:id/simulate         // 模擬途程
  GET    /api/im/routing/:id/critical-path    // 關鍵路徑
  
  // 工序管理
  POST   /api/im/operations                   // 建立工序
  GET    /api/im/operations/:code             // 查詢工序
  PUT    /api/im/operations/:code/standards   // 更新標準
  GET    /api/im/operations/library           // 工序庫
  
  // 成本計算
  POST   /api/im/cost/rollup                  // 成本累積
  GET    /api/im/cost/:itemCode               // 查詢成本
  POST   /api/im/cost/simulate                // 成本模擬
  GET    /api/im/cost/comparison              // 成本比較
  
  // 版本控制
  POST   /api/im/versions                     // 建立版本
  GET    /api/im/versions/:id                 // 版本詳情
  POST   /api/im/versions/:id/approve         // 審批版本
  POST   /api/im/versions/:id/release         // 發布版本
  GET    /api/im/versions/compare             // 版本比較
}

// WebSocket 事件
interface BRWebSocketEvents {
  'bom:created': (bom: any) => void;
  'bom:updated': (bom: any) => void;
  'routing:changed': (routing: any) => void;
  'cost:calculated': (cost: any) => void;
  'version:released': (version: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **MES**: 生產執行
- **BDM-IIM**: 品項資訊
- **PM**: 採購需求
- **WMS**: 物料供應
- **FA**: 成本核算

### 4.2 外部系統整合
- **CAD系統**: 設計圖檔
- **PLM系統**: 產品資料
- **ERP系統**: 主資料同步
- **成本系統**: 成本要素

## 5. 成功指標

### 5.1 業務指標
- BOM建立時間 < 30分鐘
- 途程設計效率提升 40%
- 成本計算準確率 > 99%
- 版本切換時間 < 1小時

### 5.2 系統指標
- BOM展開速度 < 2秒
- 成本計算時間 < 5秒
- 並發處理 > 50個BOM
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: im@tsaitung.com