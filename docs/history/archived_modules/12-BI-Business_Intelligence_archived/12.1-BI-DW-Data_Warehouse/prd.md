# BI-DW 資料倉儲 (Data Warehouse) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: 所有業務模組, BI其他子模組, FA (財務會計)

## 1. 功能概述

### 1.1 目的
建立企業級資料倉儲系統，整合全業務流程數據，提供統一的數據存儲、管理和訪問平台，支援商業智能分析和決策支援。

### 1.2 範圍
- ETL數據整合
- 維度建模設計
- 數據品質管理
- 歷史數據存儲
- 元數據管理

### 1.3 關鍵價值
- 數據整合效率提升 85%
- 查詢效能改善 10倍
- 數據一致性達 99.9%
- 決策支援時效縮短 70%

## 2. 功能性需求

### FR-BI-DW-001: ETL數據整合
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 定時排程或即時觸發
- **行為**: 從各業務系統抽取、轉換、載入數據
- **資料輸入**: 
  - 來源系統配置
  - 轉換規則定義
  - 載入策略設定
  - 排程計劃
  - 錯誤處理規則
- **資料輸出**: 
  - ETL執行日誌
  - 數據載入統計
  - 錯誤報告
  - 數據品質報告
  - 處理效能指標
- **UI反應**: 
  - 流程監控儀表板
  - 拖拽式流程設計
  - 實時進度顯示
  - 錯誤警示
  - 重跑機制
- **例外處理**: 
  - 來源系統離線
  - 數據格式錯誤
  - 轉換規則衝突
  - 載入失敗重試

#### 驗收標準
```yaml
- 條件: 執行每日ETL作業
  預期結果: 在指定時間窗口內完成所有數據載入

- 條件: 來源數據格式變更
  預期結果: 自動偵測並通知管理員調整映射

- 條件: ETL處理失敗
  預期結果: 自動重試並記錄詳細錯誤資訊
```

#### Traceability
- **測試案例**: tests/unit/FR-BI-DW-001.test.ts
- **實作程式**: src/modules/bi/services/dataWarehouse.service.ts
- **相關文件**: TOC Modules.md - Section 12.1

### FR-BI-DW-002: 維度建模設計
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 數據模型設計或更新需求
- **行為**: 建立星型/雪花型維度模型
- **資料輸入**: 
  - 業務需求分析
  - 維度定義
  - 事實表設計
  - 層級關係
  - 聚合策略
- **資料輸出**: 
  - 維度模型圖
  - DDL腳本
  - 映射文檔
  - 性能基準
  - 使用指南
- **UI反應**: 
  - 視覺化建模工具
  - 模型驗證
  - 版本管理
  - 影響分析
  - 部署預覽
- **例外處理**: 
  - 循環依賴
  - 維度衝突
  - 性能瓶頸
  - 版本不兼容

#### 維度模型架構
```typescript
interface DimensionalModel {
  id: string;
  modelName: string;
  version: string;
  
  // 維度表
  dimensions: {
    dimensionId: string;
    dimensionName: string;
    type: 'conformed' | 'role_playing' | 'degenerate' | 'junk';
    
    attributes: {
      attributeName: string;
      dataType: string;
      businessName: string;
      description: string;
      
      hierarchy?: {
        level: number;
        parentAttribute?: string;
      };
    }[];
    
    slowlyChangingDimension?: {
      type: 'SCD1' | 'SCD2' | 'SCD3' | 'SCD4' | 'SCD6';
      trackingColumns?: string[];
      effectiveDateColumns?: {
        startDate: string;
        endDate: string;
      };
    };
    
    relationships: {
      relatedDimension: string;
      relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
      joinCondition: string;
    }[];
  }[];
  
  // 事實表
  facts: {
    factId: string;
    factName: string;
    type: 'transaction' | 'periodic_snapshot' | 'accumulating_snapshot';
    
    grain: {
      description: string;
      granularity: 'transaction' | 'daily' | 'monthly' | 'yearly';
    };
    
    measures: {
      measureName: string;
      dataType: string;
      aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
      businessLogic?: string;
      
      calculation?: {
        formula: string;
        dependencies: string[];
      };
    }[];
    
    dimensionKeys: {
      dimensionId: string;
      keyColumn: string;
      mandatory: boolean;
    }[];
    
    // 分區策略
    partitioning?: {
      strategy: 'range' | 'list' | 'hash';
      column: string;
      partitions: number;
    };
  }[];
  
  // 聚合表
  aggregates?: {
    aggregateId: string;
    sourceFact: string;
    
    aggregationLevel: {
      dimension: string;
      level: string;
    }[];
    
    includedMeasures: string[];
    
    refreshStrategy: {
      type: 'full' | 'incremental' | 'real-time';
      schedule?: string;
    };
  }[];
  
  // 數據集市
  dataMarts?: {
    martId: string;
    martName: string;
    businessArea: string;
    
    includedFacts: string[];
    includedDimensions: string[];
    
    security: {
      rowLevel?: string;
      columnLevel?: string[];
    };
  }[];
}
```

### FR-BI-DW-003: 數據品質管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 數據載入或定期檢查
- **行為**: 監控和確保數據品質
- **資料輸入**: 
  - 品質規則定義
  - 檢查項目設定
  - 閾值標準
  - 修復策略
  - 通知配置
- **資料輸出**: 
  - 品質評分卡
  - 異常報告
  - 趨勢分析
  - 修復建議
  - 合規報告
- **UI反應**: 
  - 品質儀表板
  - 規則配置
  - 異常追蹤
  - 自動修復
  - 審計軌跡
- **例外處理**: 
  - 數據缺失
  - 格式錯誤
  - 重複記錄
  - 參照完整性

#### 數據品質模型
```typescript
interface DataQuality {
  id: string;
  checkDate: Date;
  
  // 品質維度
  dimensions: {
    accuracy: {
      score: number;
      rules: {
        ruleName: string;
        description: string;
        passed: boolean;
        failureCount?: number;
        failureRate?: number;
      }[];
    };
    
    completeness: {
      score: number;
      missingFields: {
        field: string;
        missingCount: number;
        missingRate: number;
      }[];
    };
    
    consistency: {
      score: number;
      inconsistencies: {
        rule: string;
        conflictingRecords: number;
        examples?: any[];
      }[];
    };
    
    timeliness: {
      score: number;
      delays: {
        dataset: string;
        expectedTime: Date;
        actualTime: Date;
        delayMinutes: number;
      }[];
    };
    
    uniqueness: {
      score: number;
      duplicates: {
        entity: string;
        duplicateCount: number;
        duplicateKeys?: string[];
      }[];
    };
    
    validity: {
      score: number;
      invalidRecords: {
        rule: string;
        invalidCount: number;
        validationErrors?: string[];
      }[];
    };
  };
  
  // 品質規則
  rules: {
    ruleId: string;
    ruleName: string;
    category: string;
    
    definition: {
      type: 'sql' | 'regex' | 'range' | 'reference' | 'custom';
      expression: string;
      parameters?: any;
    };
    
    severity: 'critical' | 'major' | 'minor' | 'warning';
    
    action: {
      onFailure: 'reject' | 'quarantine' | 'flag' | 'auto-fix';
      notification?: string[];
      fixStrategy?: string;
    };
    
    execution: {
      lastRun?: Date;
      frequency: string;
      enabled: boolean;
    };
  }[];
  
  // 品質趨勢
  trends: {
    period: string;
    overallScore: number;
    
    scoreHistory: {
      date: Date;
      score: number;
      dimensions: {
        accuracy: number;
        completeness: number;
        consistency: number;
        timeliness: number;
        uniqueness: number;
        validity: number;
      };
    }[];
    
    improvements: string[];
    degradations: string[];
  };
  
  // 修復記錄
  remediation: {
    autoFixed: {
      count: number;
      rules: string[];
    };
    
    manualReview: {
      count: number;
      assignedTo?: string;
      status: 'pending' | 'in-progress' | 'completed';
    };
    
    rejected: {
      count: number;
      reasons: string[];
    };
  };
}
```

### FR-BI-DW-004: 歷史數據存儲
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 數據變更或歸檔需求
- **行為**: 管理和存儲歷史數據版本
- **資料輸入**: 
  - 歸檔策略
  - 保留期限
  - 壓縮設定
  - 分層存儲
  - 訪問權限
- **資料輸出**: 
  - 歸檔狀態
  - 存儲統計
  - 版本歷史
  - 還原點
  - 容量報告
- **UI反應**: 
  - 時間軸瀏覽
  - 版本比較
  - 快速還原
  - 容量監控
  - 生命週期管理
- **例外處理**: 
  - 存儲空間不足
  - 歸檔失敗
  - 版本衝突
  - 還原錯誤

### FR-BI-DW-005: 元數據管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 系統變更或文檔需求
- **行為**: 管理技術和業務元數據
- **資料輸入**: 
  - 數據字典
  - 業務術語
  - 數據血緣
  - 影響分析
  - 使用統計
- **資料輸出**: 
  - 元數據目錄
  - 血緣圖譜
  - 影響報告
  - 使用分析
  - 合規文檔
- **UI反應**: 
  - 目錄瀏覽
  - 搜尋功能
  - 視覺化血緣
  - 協作註解
  - 版本追蹤
- **例外處理**: 
  - 元數據不一致
  - 循環依賴
  - 權限衝突
  - 同步失敗

## 3. 系統設計

### 3.1 資料模型

```typescript
// ETL作業
interface ETLJob {
  id: string;
  jobName: string;
  
  // 作業配置
  configuration: {
    source: {
      type: 'database' | 'file' | 'api' | 'stream';
      connectionString?: string;
      
      extraction: {
        method: 'full' | 'incremental' | 'cdc';
        query?: string;
        watermark?: string;
        batchSize?: number;
      };
    };
    
    transformations: {
      step: number;
      name: string;
      type: 'filter' | 'map' | 'aggregate' | 'join' | 'lookup' | 'custom';
      
      configuration: any;
      
      errorHandling: {
        onError: 'skip' | 'fail' | 'redirect';
        errorOutput?: string;
      };
    }[];
    
    target: {
      type: 'warehouse' | 'datamart' | 'cache';
      tableName: string;
      
      loading: {
        method: 'insert' | 'update' | 'merge' | 'replace';
        partitionKey?: string;
        distributionKey?: string;
      };
    };
  };
  
  // 執行計劃
  schedule: {
    type: 'cron' | 'dependency' | 'event' | 'manual';
    expression?: string;
    
    dependencies?: {
      jobId: string;
      condition: 'success' | 'completion' | 'failure';
    }[];
    
    window?: {
      start: string;
      end: string;
    };
  };
  
  // 執行狀態
  execution?: {
    lastRun?: {
      startTime: Date;
      endTime?: Date;
      status: 'running' | 'success' | 'failed' | 'cancelled';
      
      statistics: {
        recordsExtracted: number;
        recordsTransformed: number;
        recordsLoaded: number;
        recordsRejected?: number;
      };
      
      performance: {
        extractionTime: number;
        transformationTime: number;
        loadingTime: number;
        totalTime: number;
      };
    };
    
    history: {
      runId: string;
      timestamp: Date;
      status: string;
      duration: number;
    }[];
  };
}

// 數據目錄
interface DataCatalog {
  id: string;
  
  // 技術元數據
  technical: {
    database: string;
    schema: string;
    table: string;
    
    columns: {
      name: string;
      dataType: string;
      nullable: boolean;
      primaryKey?: boolean;
      foreignKey?: {
        table: string;
        column: string;
      };
    }[];
    
    statistics: {
      rowCount: number;
      sizeInBytes: number;
      lastUpdated: Date;
      updateFrequency: string;
    };
  };
  
  // 業務元數據
  business: {
    businessName: string;
    description: string;
    owner: string;
    steward: string;
    
    classification: {
      domain: string;
      subdomain?: string;
      confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
    };
    
    terms: {
      term: string;
      definition: string;
      synonyms?: string[];
    }[];
    
    usage: {
      reports: string[];
      dashboards: string[];
      applications: string[];
      users: number;
    };
  };
  
  // 數據血緣
  lineage: {
    upstream: {
      system: string;
      object: string;
      type: 'table' | 'file' | 'api';
      transformation?: string;
    }[];
    
    downstream: {
      system: string;
      object: string;
      type: 'report' | 'dashboard' | 'export' | 'api';
      dependency: 'critical' | 'important' | 'optional';
    }[];
    
    dataFlow: {
      step: number;
      process: string;
      input: string[];
      output: string[];
      transformation?: string;
    }[];
  };
  
  // 品質指標
  quality: {
    score: number;
    lastAssessed: Date;
    
    issues: {
      type: string;
      severity: string;
      description: string;
      resolution?: string;
    }[];
  };
}

// 查詢優化
interface QueryOptimization {
  queryId: string;
  
  // 查詢分析
  analysis: {
    originalQuery: string;
    executionPlan: any;
    
    statistics: {
      executionTime: number;
      rowsScanned: number;
      rowsReturned: number;
      memoryUsage: number;
      ioOperations: number;
    };
    
    bottlenecks: {
      operation: string;
      cost: number;
      suggestion: string;
    }[];
  };
  
  // 優化建議
  optimizations: {
    indexes?: {
      table: string;
      columns: string[];
      type: 'btree' | 'hash' | 'bitmap';
      estimatedImprovement: number;
    }[];
    
    partitioning?: {
      table: string;
      strategy: string;
      column: string;
      estimatedImprovement: number;
    };
    
    materialization?: {
      viewName: string;
      query: string;
      refreshStrategy: string;
      estimatedImprovement: number;
    };
    
    rewrite?: {
      optimizedQuery: string;
      changes: string[];
      estimatedImprovement: number;
    };
  };
  
  // 實施追蹤
  implementation?: {
    applied: boolean;
    appliedAt?: Date;
    appliedBy?: string;
    
    results?: {
      beforeMetrics: any;
      afterMetrics: any;
      actualImprovement: number;
    };
  };
}
```

### 3.2 API 設計

```typescript
// 資料倉儲 API
interface DataWarehouseAPI {
  // ETL管理
  POST   /api/bi/etl/jobs                     // 建立ETL作業
  GET    /api/bi/etl/jobs                     // 查詢作業列表
  GET    /api/bi/etl/jobs/:id                 // 作業詳情
  POST   /api/bi/etl/jobs/:id/execute         // 執行作業
  GET    /api/bi/etl/jobs/:id/status          // 執行狀態
  
  // 維度模型
  POST   /api/bi/models                       // 建立模型
  GET    /api/bi/models                       // 模型列表
  PUT    /api/bi/models/:id                   // 更新模型
  POST   /api/bi/models/:id/deploy            // 部署模型
  
  // 數據品質
  POST   /api/bi/quality/rules                // 建立規則
  GET    /api/bi/quality/assessment           // 品質評估
  POST   /api/bi/quality/validate             // 執行驗證
  GET    /api/bi/quality/report               // 品質報告
  
  // 元數據管理
  GET    /api/bi/metadata/catalog             // 數據目錄
  GET    /api/bi/metadata/lineage             // 血緣分析
  POST   /api/bi/metadata/search              // 搜尋元數據
  GET    /api/bi/metadata/impact              // 影響分析
  
  // 查詢服務
  POST   /api/bi/query/execute                // 執行查詢
  GET    /api/bi/query/optimize               // 優化建議
  GET    /api/bi/query/cache                  // 快取管理
}

// WebSocket 事件
interface DWWebSocketEvents {
  'etl:started': (job: any) => void;
  'etl:progress': (progress: any) => void;
  'etl:completed': (result: any) => void;
  'quality:alert': (issue: any) => void;
  'model:deployed': (model: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **所有業務模組**: 數據來源
- **BI-DM**: 數據採礦
- **BI-BDV**: 視覺化展示
- **BI-PD**: 預測分析
- **FA**: 財務數據

### 4.2 外部系統整合
- **雲端存儲**: AWS S3, Azure Blob
- **大數據平台**: Hadoop, Spark
- **串流平台**: Kafka, Kinesis
- **BI工具**: Tableau, Power BI

## 5. 成功指標

### 5.1 業務指標
- 數據可用性 ≥ 99.9%
- 查詢響應時間 < 2秒
- 數據時效性 < 1小時
- 品質評分 ≥ 95%

### 5.2 系統指標
- ETL處理量 > 100GB/小時
- 並發查詢 > 100個
- 存儲壓縮率 > 10:1
- 系統可用性 ≥ 99.95%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bi@tsaitung.com