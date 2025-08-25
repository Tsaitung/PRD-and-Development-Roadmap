# BI-DM 資料採礦 (Data Mining) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: BI-DW (資料倉儲), BI-PD (預測分析), CRM (客戶關係管理), OM (訂單管理)

## 1. 功能概述

### 1.1 目的
建立先進的資料採礦系統，從海量數據中發現隱藏的模式、關聯和趨勢，提供深度洞察支援商業決策，實現數據驅動的營運優化。

### 1.2 範圍
- 關聯規則挖掘
- 客戶分群分析
- 異常偵測系統
- 模式識別引擎
- 文本採礦分析

### 1.3 關鍵價值
- 洞察發現效率提升 75%
- 預測準確度達 85%
- 客戶分群精準度 90%
- 異常偵測率 95%

## 2. 功能性需求

### FR-BI-DM-001: 關聯規則挖掘
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 交易數據累積或分析需求
- **行為**: 發現項目間的關聯關係和購買模式
- **資料輸入**: 
  - 交易記錄
  - 產品目錄
  - 時間範圍
  - 支持度閾值
  - 信心度閾值
- **資料輸出**: 
  - 關聯規則集
  - 頻繁項目集
  - 提升度分析
  - 商品組合建議
  - 交叉銷售機會
- **UI反應**: 
  - 規則視覺化
  - 互動式探索
  - 篩選排序
  - 規則驗證
  - 建議應用
- **例外處理**: 
  - 數據稀疏
  - 計算超時
  - 記憶體不足
  - 規則衝突

#### 驗收標準
```yaml
- 條件: 分析購物籃數據
  預期結果: 發現有意義的商品關聯規則

- 條件: 設定最小支持度和信心度
  預期結果: 只返回符合閾值的強關聯規則

- 條件: 新交易數據加入
  預期結果: 增量更新關聯規則
```

#### Traceability
- **測試案例**: tests/unit/FR-BI-DM-001.test.ts
- **實作程式**: src/modules/bi/services/dataMining.service.ts
- **相關文件**: TOC Modules.md - Section 12.2

### FR-BI-DM-002: 客戶分群分析
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 客戶數據更新或行銷需求
- **行為**: 基於行為特徵自動分群客戶
- **資料輸入**: 
  - 客戶屬性
  - 交易歷史
  - 行為數據
  - 分群數量
  - 演算法選擇
- **資料輸出**: 
  - 客戶群組
  - 群組特徵
  - 分群質量指標
  - 遷移分析
  - 行銷建議
- **UI反應**: 
  - 分群視覺化
  - 特徵比較
  - 群組管理
  - 成員查詢
  - 策略制定
- **例外處理**: 
  - 數據不足
  - 分群不收斂
  - 特徵缺失
  - 異常值處理

#### 客戶分群模型
```typescript
interface CustomerSegmentation {
  id: string;
  segmentationName: string;
  executionDate: Date;
  
  // 分群配置
  configuration: {
    algorithm: {
      type: 'kmeans' | 'dbscan' | 'hierarchical' | 'gaussian_mixture';
      parameters: {
        clusters?: number;
        epsilon?: number;
        minSamples?: number;
        linkage?: string;
      };
    };
    
    features: {
      demographic: string[];
      behavioral: string[];
      transactional: string[];
      engagement: string[];
      
      preprocessing: {
        normalization: 'standard' | 'minmax' | 'robust';
        encoding: 'onehot' | 'label' | 'target';
        imputation: 'mean' | 'median' | 'mode' | 'drop';
      };
    };
    
    validation: {
      method: 'silhouette' | 'elbow' | 'gap_statistic';
      crossValidation?: boolean;
      testSize?: number;
    };
  };
  
  // 分群結果
  segments: {
    segmentId: string;
    segmentName: string;
    
    // 群組統計
    statistics: {
      size: number;
      percentage: number;
      
      centroid: {
        feature: string;
        value: number;
      }[];
      
      variance: number;
      density: number;
    };
    
    // 群組特徵
    characteristics: {
      demographics: {
        avgAge: number;
        genderDistribution: any;
        locationDistribution: any;
      };
      
      behavior: {
        avgPurchaseFrequency: number;
        avgOrderValue: number;
        preferredCategories: string[];
        channelPreference: string;
      };
      
      value: {
        ltv: number;
        avgRevenue: number;
        profitability: number;
        churnRisk: number;
      };
    };
    
    // 群組標籤
    profile: {
      label: string;
      description: string;
      marketingPersona: string;
      
      strengths: string[];
      opportunities: string[];
      strategies: string[];
    };
  }[];
  
  // 分群品質
  quality: {
    silhouetteScore: number;
    daviesBouldinIndex: number;
    calinskiHarabaszScore: number;
    
    stability: {
      bootstrap: number;
      temporal: number;
    };
    
    interpretability: {
      featureImportance: {
        feature: string;
        importance: number;
      }[];
      
      separability: number;
      homogeneity: number;
    };
  };
  
  // 遷移分析
  migration?: {
    previousSegmentation: string;
    
    transitions: {
      from: string;
      to: string;
      count: number;
      percentage: number;
    }[];
    
    retentionRate: number;
    churnRate: number;
  };
}
```

### FR-BI-DM-003: 異常偵測系統
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 實時數據流或定期掃描
- **行為**: 自動識別異常模式和離群值
- **資料輸入**: 
  - 監控指標
  - 正常基準線
  - 偵測規則
  - 敏感度設定
  - 時間窗口
- **資料輸出**: 
  - 異常事件
  - 異常評分
  - 根因分析
  - 影響評估
  - 處理建議
- **UI反應**: 
  - 即時警報
  - 異常儀表板
  - 趨勢圖表
  - 詳細調查
  - 回饋學習
- **例外處理**: 
  - 誤報處理
  - 漏報補償
  - 基準漂移
  - 季節調整

#### 異常偵測模型
```typescript
interface AnomalyDetection {
  id: string;
  detectorName: string;
  
  // 偵測配置
  detector: {
    type: 'statistical' | 'ml_based' | 'deep_learning' | 'ensemble';
    
    algorithm: {
      name: 'isolation_forest' | 'one_class_svm' | 'autoencoder' | 'lstm' | 'prophet';
      
      parameters: {
        contamination?: number;
        threshold?: number;
        windowSize?: number;
        seasonality?: boolean;
      };
      
      training: {
        dataset: string;
        period: { start: Date; end: Date; };
        features: string[];
        validationSplit: number;
      };
    };
    
    monitoring: {
      metrics: {
        metricName: string;
        dataSource: string;
        aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
        interval: string;
      }[];
      
      baseline: {
        method: 'moving_average' | 'seasonal' | 'adaptive';
        updateFrequency: string;
      };
    };
  };
  
  // 異常事件
  anomalies: {
    anomalyId: string;
    detectedAt: Date;
    
    // 異常詳情
    details: {
      metric: string;
      expectedValue: number;
      actualValue: number;
      deviation: number;
      anomalyScore: number;
      
      context: {
        timeWindow: { start: Date; end: Date; };
        relatedMetrics: {
          metric: string;
          correlation: number;
        }[];
      };
    };
    
    // 分類與嚴重度
    classification: {
      type: 'spike' | 'dip' | 'trend_change' | 'pattern_break' | 'outlier';
      severity: 'critical' | 'high' | 'medium' | 'low';
      confidence: number;
      
      category?: 'performance' | 'security' | 'business' | 'operational';
    };
    
    // 根因分析
    rootCause?: {
      probableCauses: {
        cause: string;
        probability: number;
        evidence: string[];
      }[];
      
      impactedComponents: string[];
      propagationPath?: string[];
    };
    
    // 處理狀態
    handling: {
      status: 'new' | 'investigating' | 'resolved' | 'false_positive';
      assignedTo?: string;
      
      actions?: {
        action: string;
        takenAt: Date;
        takenBy: string;
        result: string;
      }[];
      
      resolution?: {
        resolvedAt: Date;
        resolvedBy: string;
        rootCause: string;
        preventiveMeasures: string[];
      };
    };
  }[];
  
  // 效能指標
  performance: {
    detectionRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    meanTimeToDetect: number;
    
    accuracy: {
      precision: number;
      recall: number;
      f1Score: number;
    };
  };
}
```

### FR-BI-DM-004: 模式識別引擎
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 數據模式分析需求
- **行為**: 識別重複出現的模式和趨勢
- **資料輸入**: 
  - 時序數據
  - 模式模板
  - 相似度閾值
  - 搜尋範圍
  - 匹配規則
- **資料輸出**: 
  - 識別模式
  - 出現頻率
  - 模式演化
  - 預測趨勢
  - 應用建議
- **UI反應**: 
  - 模式庫管理
  - 視覺化展示
  - 比對結果
  - 趨勢預測
  - 模板編輯
- **例外處理**: 
  - 模式重疊
  - 噪音干擾
  - 模板不匹配
  - 計算複雜度

### FR-BI-DM-005: 文本採礦分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 文本數據累積或分析需求
- **行為**: 從非結構化文本中提取知識和洞察
- **資料輸入**: 
  - 文本來源
  - 語言設定
  - 分析目標
  - 詞典配置
  - 過濾規則
- **資料輸出**: 
  - 主題模型
  - 情感分析
  - 實體識別
  - 關鍵詞提取
  - 文檔分類
- **UI反應**: 
  - 文本處理
  - 結果視覺化
  - 主題瀏覽
  - 情感趨勢
  - 詞雲展示
- **例外處理**: 
  - 語言混雜
  - 編碼問題
  - 專有名詞
  - 語境歧義

## 3. 系統設計

### 3.1 資料模型

```typescript
// 採礦任務
interface MiningTask {
  id: string;
  taskName: string;
  taskType: 'association' | 'clustering' | 'classification' | 'regression' | 'anomaly';
  
  // 任務配置
  configuration: {
    dataSource: {
      type: 'warehouse' | 'stream' | 'file';
      location: string;
      query?: string;
      
      sampling?: {
        method: 'random' | 'stratified' | 'systematic';
        size: number;
        seed?: number;
      };
    };
    
    preprocessing: {
      cleaning: {
        handleMissing: 'drop' | 'impute' | 'flag';
        removeOutliers: boolean;
        outlierMethod?: 'iqr' | 'zscore' | 'isolation';
      };
      
      transformation: {
        scaling?: 'standard' | 'minmax' | 'robust';
        encoding?: 'onehot' | 'label' | 'target';
        dimensionReduction?: {
          method: 'pca' | 'lda' | 'tsne';
          components: number;
        };
      };
      
      featureEngineering?: {
        interactions: boolean;
        polynomialFeatures?: number;
        binning?: any;
      };
    };
    
    modeling: {
      algorithm: string;
      hyperparameters: any;
      
      training: {
        splitRatio: number;
        crossValidation?: {
          folds: number;
          stratified: boolean;
        };
        
        optimization?: {
          method: 'grid' | 'random' | 'bayesian';
          metric: string;
          trials?: number;
        };
      };
      
      ensemble?: {
        method: 'voting' | 'bagging' | 'boosting' | 'stacking';
        models: string[];
      };
    };
  };
  
  // 執行結果
  execution?: {
    startTime: Date;
    endTime?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    
    results?: {
      model: {
        accuracy?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        auc?: number;
      };
      
      insights: {
        type: string;
        description: string;
        confidence: number;
        actionable: boolean;
      }[];
      
      visualizations?: {
        type: string;
        data: any;
        config: any;
      }[];
    };
    
    artifacts?: {
      modelFile?: string;
      reportFile?: string;
      dataFile?: string;
    };
  };
  
  // 部署資訊
  deployment?: {
    deployed: boolean;
    deployedAt?: Date;
    endpoint?: string;
    version?: string;
    
    monitoring?: {
      driftDetection: boolean;
      performanceTracking: boolean;
      retrainingSchedule?: string;
    };
  };
}

// 關聯規則
interface AssociationRules {
  id: string;
  analysisDate: Date;
  
  // 頻繁項目集
  frequentItemsets: {
    items: string[];
    support: number;
    count: number;
  }[];
  
  // 關聯規則
  rules: {
    antecedent: string[];
    consequent: string[];
    
    metrics: {
      support: number;
      confidence: number;
      lift: number;
      conviction?: number;
      leverage?: number;
    };
    
    statistics: {
      chiSquare?: number;
      pValue?: number;
      correlation?: number;
    };
    
    applications: {
      type: 'cross_sell' | 'bundle' | 'placement' | 'recommendation';
      description: string;
      expectedImpact: number;
    }[];
  }[];
  
  // 規則評估
  evaluation: {
    totalRules: number;
    strongRules: number;
    
    coverage: {
      transactions: number;
      percentage: number;
    };
    
    stability: {
      temporal: number;
      bootstrap: number;
    };
    
    businessValue: {
      estimatedRevenue: number;
      implementationCost: number;
      roi: number;
    };
  };
}

// 文本分析結果
interface TextMiningResults {
  id: string;
  corpus: string;
  
  // 主題模型
  topics: {
    topicId: number;
    label?: string;
    
    keywords: {
      word: string;
      weight: number;
    }[];
    
    documents: {
      docId: string;
      probability: number;
    }[];
    
    coherenceScore: number;
  }[];
  
  // 情感分析
  sentiment: {
    overall: {
      positive: number;
      negative: number;
      neutral: number;
    };
    
    timeline: {
      date: Date;
      positive: number;
      negative: number;
      neutral: number;
    }[];
    
    aspects?: {
      aspect: string;
      sentiment: number;
      mentions: number;
    }[];
  };
  
  // 實體識別
  entities: {
    type: 'person' | 'organization' | 'location' | 'product' | 'date' | 'money';
    value: string;
    frequency: number;
    
    relations?: {
      entity: string;
      relation: string;
      strength: number;
    }[];
  }[];
  
  // 關鍵詞提取
  keywords: {
    unigrams: { word: string; score: number; }[];
    bigrams: { phrase: string; score: number; }[];
    trigrams: { phrase: string; score: number; }[];
  };
}
```

### 3.2 API 設計

```typescript
// 資料採礦 API
interface DataMiningAPI {
  // 採礦任務
  POST   /api/bi/mining/tasks                 // 建立任務
  GET    /api/bi/mining/tasks                 // 任務列表
  GET    /api/bi/mining/tasks/:id             // 任務詳情
  POST   /api/bi/mining/tasks/:id/execute     // 執行任務
  GET    /api/bi/mining/tasks/:id/results     // 查詢結果
  
  // 關聯分析
  POST   /api/bi/mining/association           // 關聯規則挖掘
  GET    /api/bi/mining/association/rules     // 查詢規則
  POST   /api/bi/mining/association/apply     // 應用規則
  
  // 客戶分群
  POST   /api/bi/mining/segmentation          // 執行分群
  GET    /api/bi/mining/segments              // 查詢群組
  POST   /api/bi/mining/segments/profile      // 群組畫像
  GET    /api/bi/mining/segments/migration    // 遷移分析
  
  // 異常偵測
  POST   /api/bi/mining/anomaly/detect        // 偵測異常
  GET    /api/bi/mining/anomaly/events        // 異常事件
  POST   /api/bi/mining/anomaly/investigate   // 調查異常
  
  // 文本採礦
  POST   /api/bi/mining/text/analyze          // 文本分析
  GET    /api/bi/mining/text/topics           // 主題提取
  GET    /api/bi/mining/text/sentiment        // 情感分析
  POST   /api/bi/mining/text/classify         // 文檔分類
}

// WebSocket 事件
interface DMWebSocketEvents {
  'mining:started': (task: any) => void;
  'mining:progress': (progress: any) => void;
  'mining:completed': (results: any) => void;
  'anomaly:detected': (anomaly: any) => void;
  'segment:updated': (segment: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **BI-DW**: 資料來源
- **BI-BDV**: 結果視覺化
- **BI-PD**: 預測模型
- **CRM**: 客戶數據
- **OM**: 交易數據

### 4.2 外部系統整合
- **機器學習平台**: TensorFlow, PyTorch
- **統計軟體**: R, SAS
- **NLP服務**: Google NLP, Azure Text Analytics
- **圖資料庫**: Neo4j, Amazon Neptune

## 5. 成功指標

### 5.1 業務指標
- 模型準確度 ≥ 85%
- 洞察可行動率 ≥ 70%
- 業務價值提升 ≥ 20%
- ROI ≥ 300%

### 5.2 系統指標
- 模型訓練時間 < 4小時
- 預測延遲 < 100ms
- 並發處理 > 50個任務
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bi@tsaitung.com