# FA-FS 財務結算 (Financial Settlement) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: FA全模組, CRM (客戶管理), PM (採購管理), BI (商業智慧)

## 1. 功能概述

### 1.1 目的
建立完整的財務結算系統，自動化期末結算流程，確保帳務準確性，支援多維度結算分析，提升財務結算效率。

### 1.2 範圍
- 期末結算作業
- 成本結算分配
- 損益結算轉出
- 關帳控制管理
- 結算差異分析

### 1.3 關鍵價值
- 結算時間縮短 75%
- 結算準確率 100%
- 自動化程度 90%
- 稽核合規率 100%

## 2. 功能性需求

### FR-FA-FS-001: 期末結算作業
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 月末、季末或年末結算
- **行為**: 執行完整的期末結算程序
- **資料輸入**: 
  - 結算期間
  - 結算類型
  - 調整項目
  - 分攤規則
  - 確認清單
- **資料輸出**: 
  - 結算憑證
  - 試算表
  - 調整分錄
  - 結算報告
  - 稽核軌跡
- **UI反應**: 
  - 步驟導引
  - 進度顯示
  - 檢核提示
  - 批次處理
  - 回滾功能
- **例外處理**: 
  - 科目不平
  - 缺少資料
  - 規則衝突
  - 結算失敗

#### 驗收標準
```yaml
- 條件: 執行月結作業
  預期結果: 依序完成所有結算步驟並產生報告

- 條件: 發現科目不平衡
  預期結果: 自動偵測並提示調整項目

- 條件: 需要回滾結算
  預期結果: 完整還原至結算前狀態
```

#### Traceability
- **測試案例**: tests/unit/FR-FA-FS-001.test.ts
- **實作程式**: src/modules/fa/services/financialSettlement.service.ts
- **相關文件**: TOC Modules.md - Section 11.6

### FR-FA-FS-002: 成本結算分配
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 成本結算週期或手動觸發
- **行為**: 計算並分配各類成本至對應對象
- **資料輸入**: 
  - 成本中心
  - 分攤基準
  - 受益對象
  - 分配比例
  - 成本動因
- **資料輸出**: 
  - 分配計算表
  - 成本報表
  - 分錄憑證
  - 差異分析
  - 成本趨勢
- **UI反應**: 
  - 分配預覽
  - 規則設定
  - 批次計算
  - 結果驗證
  - 調整功能
- **例外處理**: 
  - 基準缺失
  - 循環分配
  - 超額分配
  - 規則錯誤

#### 成本分配模型
```typescript
interface CostAllocation {
  id: string;
  period: string;
  
  // 成本池
  costPools: {
    poolId: string;
    poolName: string;
    department: string;
    
    costs: {
      direct: number;
      indirect: number;
      overhead: number;
      total: number;
    };
    
    // 分配來源
    sources: {
      account: string;
      amount: number;
      type: 'actual' | 'standard' | 'budget';
    }[];
  }[];
  
  // 分配規則
  allocationRules: {
    ruleId: string;
    ruleName: string;
    
    from: {
      costPool: string;
      costType: string;
      amount: number;
    };
    
    to: {
      targets: {
        type: 'department' | 'product' | 'project' | 'customer';
        id: string;
        name: string;
      }[];
      
      basis: {
        method: 'direct' | 'step' | 'reciprocal' | 'abc';
        driver: string;  // 成本動因
        
        rates: {
          targetId: string;
          driverQty: number;
          percentage: number;
          amount: number;
        }[];
      };
    };
    
    validation: {
      totalAllocated: number;
      unallocated: number;
      valid: boolean;
    };
  }[];
  
  // 分配結果
  results: {
    targetType: string;
    targetId: string;
    targetName: string;
    
    allocations: {
      fromPool: string;
      costType: string;
      amount: number;
      basis: string;
    }[];
    
    summary: {
      directCost: number;
      allocatedCost: number;
      totalCost: number;
      unitCost?: number;
    };
  }[];
  
  // 分配步驟
  steps: {
    sequence: number;
    description: string;
    
    action: {
      type: 'calculate' | 'allocate' | 'adjust' | 'post';
      source: string;
      target: string;
      amount: number;
    };
    
    status: 'pending' | 'processing' | 'completed' | 'failed';
    timestamp?: Date;
  }[];
  
  status: 'draft' | 'calculating' | 'completed' | 'posted';
}
```

### FR-FA-FS-003: 損益結算轉出
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 期末損益結算
- **行為**: 結算損益科目並轉出至本期損益
- **資料輸入**: 
  - 收入科目
  - 費用科目
  - 結轉規則
  - 本期損益科目
  - 特殊調整
- **資料輸出**: 
  - 結轉分錄
  - 損益彙總
  - 本期淨利
  - 科目餘額表
  - 結轉確認
- **UI反應**: 
  - 自動計算
  - 分錄預覽
  - 確認提示
  - 批次結轉
  - 查詢追蹤
- **例外處理**: 
  - 科目遺漏
  - 金額不符
  - 重複結轉
  - 結轉失敗

### FR-FA-FS-004: 關帳控制管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 結算完成或管理需求
- **行為**: 控制會計期間的開關狀態
- **資料輸入**: 
  - 關帳期間
  - 模組範圍
  - 例外權限
  - 開帳申請
  - 審核流程
- **資料輸出**: 
  - 關帳狀態
  - 權限清單
  - 異動記錄
  - 開帳核准
  - 控制報告
- **UI反應**: 
  - 狀態顯示
  - 開關控制
  - 權限管理
  - 申請表單
  - 歷史查詢
- **例外處理**: 
  - 強制開帳
  - 跨期調整
  - 權限衝突
  - 稽核要求

#### 關帳控制模型
```typescript
interface PeriodControl {
  period: string;
  
  // 期間狀態
  status: {
    overall: 'open' | 'soft_close' | 'hard_close';
    
    modules: {
      module: string;
      status: 'open' | 'closed';
      closedBy?: string;
      closedAt?: Date;
    }[];
    
    subLedgers: {
      ledger: string;
      status: 'open' | 'closed';
      lastTransaction?: Date;
    }[];
  };
  
  // 關帳檢核
  validation: {
    checks: {
      name: string;
      description: string;
      status: 'passed' | 'failed' | 'warning';
      message?: string;
    }[];
    
    readyToClose: boolean;
    blockers?: string[];
  };
  
  // 例外管理
  exceptions: {
    openRequests: {
      requestId: string;
      requestor: string;
      reason: string;
      period: string;
      modules: string[];
      
      approval: {
        required: boolean;
        approver?: string;
        status: 'pending' | 'approved' | 'rejected';
        approvedAt?: Date;
      };
      
      expiry?: Date;
    }[];
    
    adjustments: {
      type: 'prior_period' | 'reclassification' | 'correction';
      description: string;
      amount: number;
      journalId: string;
      authorizedBy: string;
    }[];
  };
  
  // 結算進度
  settlement: {
    tasks: {
      taskId: string;
      taskName: string;
      sequence: number;
      
      status: 'pending' | 'in_progress' | 'completed' | 'skipped';
      completedBy?: string;
      completedAt?: Date;
      
      dependencies?: string[];
      blockedBy?: string[];
    }[];
    
    progress: number;
    estimatedCompletion?: Date;
  };
}
```

### FR-FA-FS-005: 結算差異分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 結算完成或異常偵測
- **行為**: 分析結算差異並提供調節建議
- **資料輸入**: 
  - 結算數據
  - 比較基準
  - 容差設定
  - 分析維度
  - 歷史資料
- **資料輸出**: 
  - 差異報告
  - 原因分析
  - 調節建議
  - 趨勢圖表
  - 行動方案
- **UI反應**: 
  - 差異標示
  - 下鑽分析
  - 圖表顯示
  - 建議列表
  - 追蹤功能
- **例外處理**: 
  - 重大差異
  - 無法解釋
  - 系統錯誤
  - 資料缺失

## 3. 系統設計

### 3.1 資料模型

```typescript
// 結算批次
interface SettlementBatch {
  id: string;
  batchNo: string;
  
  // 批次資訊
  batch: {
    type: 'monthly' | 'quarterly' | 'annual' | 'special';
    period: {
      year: number;
      month?: number;
      quarter?: number;
    };
    
    description: string;
    executedBy: string;
    executedAt: Date;
  };
  
  // 結算項目
  items: {
    sequence: number;
    itemType: string;
    itemName: string;
    
    process: {
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
      startTime?: Date;
      endTime?: Date;
      duration?: number;
    };
    
    results?: {
      recordsProcessed: number;
      amountProcessed: number;
      journalEntries: string[];
      errors?: string[];
    };
    
    rollback?: {
      available: boolean;
      executed?: boolean;
      executedAt?: Date;
    };
  }[];
  
  // 調整分錄
  adjustments: {
    type: 'accrual' | 'deferral' | 'depreciation' | 'provision' | 'reclass';
    description: string;
    
    journal: {
      journalId: string;
      date: Date;
      
      lines: {
        account: string;
        debit: number;
        credit: number;
        description: string;
      }[];
    };
    
    reversal?: {
      required: boolean;
      date?: Date;
      journalId?: string;
    };
  }[];
  
  // 驗證結果
  validation: {
    trialBalance: {
      debits: number;
      credits: number;
      balanced: boolean;
    };
    
    checks: {
      checkName: string;
      result: 'passed' | 'failed' | 'warning';
      details?: string;
    }[];
    
    approved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
  };
  
  status: 'draft' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

// 試算表
interface TrialBalance {
  period: Date;
  
  // 科目餘額
  accounts: {
    accountCode: string;
    accountName: string;
    accountType: string;
    
    beginning: {
      debit: number;
      credit: number;
    };
    
    period: {
      debit: number;
      credit: number;
    };
    
    adjustments: {
      debit: number;
      credit: number;
    };
    
    ending: {
      debit: number;
      credit: number;
      balance: number;
    };
  }[];
  
  // 彙總
  totals: {
    beginningDebit: number;
    beginningCredit: number;
    
    periodDebit: number;
    periodCredit: number;
    
    adjustmentDebit: number;
    adjustmentCredit: number;
    
    endingDebit: number;
    endingCredit: number;
  };
  
  // 平衡檢查
  balanced: {
    beginning: boolean;
    period: boolean;
    adjustments: boolean;
    ending: boolean;
    overall: boolean;
  };
}

// 結算差異
interface SettlementVariance {
  id: string;
  period: string;
  
  // 差異項目
  variances: {
    account: string;
    accountName: string;
    
    expected: number;
    actual: number;
    variance: number;
    percentage: number;
    
    classification: 'timing' | 'error' | 'estimate' | 'other';
    materiality: 'immaterial' | 'material' | 'significant';
    
    analysis?: {
      cause: string;
      explanation: string;
      supporting?: string[];
    };
    
    resolution?: {
      action: 'adjust' | 'reclassify' | 'accept' | 'investigate';
      journalId?: string;
      resolvedBy?: string;
      resolvedAt?: Date;
    };
  }[];
  
  // 影響評估
  impact: {
    financialStatements: {
      statement: string;
      lineItem: string;
      amount: number;
    }[];
    
    ratios: {
      ratio: string;
      before: number;
      after: number;
      change: number;
    }[];
    
    compliance: {
      covenant: string;
      status: 'compliant' | 'at_risk' | 'breach';
    }[];
  };
  
  // 審核追蹤
  review: {
    reviewer: string;
    reviewDate: Date;
    conclusion: string;
    recommendations?: string[];
    
    followUp?: {
      required: boolean;
      dueDate?: Date;
      assignedTo?: string;
    };
  };
}
```

### 3.2 API 設計

```typescript
// 財務結算 API
interface FinancialSettlementAPI {
  // 結算作業
  POST   /api/fa/settlement/execute           // 執行結算
  GET    /api/fa/settlement/status            // 結算狀態
  POST   /api/fa/settlement/rollback          // 回滾結算
  GET    /api/fa/settlement/history           // 結算歷史
  
  // 成本分配
  POST   /api/fa/cost/allocate                // 執行分配
  GET    /api/fa/cost/rules                   // 分配規則
  POST   /api/fa/cost/calculate               // 計算成本
  GET    /api/fa/cost/results                 // 分配結果
  
  // 期間控制
  POST   /api/fa/period/close                 // 關閉期間
  POST   /api/fa/period/open                  // 開啟期間
  GET    /api/fa/period/status                // 期間狀態
  POST   /api/fa/period/request-open          // 申請開帳
  
  // 試算驗證
  GET    /api/fa/trial-balance                // 試算表
  POST   /api/fa/settlement/validate          // 驗證結算
  GET    /api/fa/settlement/adjustments       // 調整分錄
  
  // 差異分析
  GET    /api/fa/variance/analysis            // 差異分析
  POST   /api/fa/variance/investigate         // 調查差異
  POST   /api/fa/variance/resolve             // 解決差異
}

// WebSocket 事件
interface SettlementWebSocketEvents {
  'settlement:started': (batch: any) => void;
  'settlement:progress': (progress: any) => void;
  'settlement:completed': (result: any) => void;
  'period:closed': (period: any) => void;
  'variance:detected': (variance: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **所有FA模組**: 財務數據
- **成本系統**: 成本資料
- **總帳系統**: 會計分錄
- **預算系統**: 預算對比
- **稽核系統**: 稽核追蹤

### 4.2 外部系統整合
- **會計師系統**: 查核確認
- **稅務系統**: 稅務調整
- **銀行系統**: 餘額確認
- **審計系統**: 稽核要求

## 5. 成功指標

### 5.1 業務指標
- 結算時間 ≤ 3天
- 調整錯誤率 < 0.1%
- 首次通過率 > 95%
- 稽核發現數 < 5個

### 5.2 系統指標
- 處理效能 > 10000筆/分
- 結算成功率 > 99.9%
- 系統可用性 ≥ 99.9%
- 資料完整性 100%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: fa@tsaitung.com