# IM-VCM 變體與組合管理 (Variant & Combination Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: BDM-IIM (品項資訊), IM-IC (品項配置), OM (訂單管理), WMS (倉儲管理)

## 1. 功能概述

### 1.1 目的
建立智能化的產品變體與組合管理系統，支援多維度產品變化、套裝組合和促銷包裝，實現產品多樣性與管理效率的平衡。

### 1.2 範圍
- 變體規則定義
- 矩陣式管理
- 組合套裝設定
- SKU自動生成
- 庫存映射管理

### 1.3 關鍵價值
- SKU管理效率提升 80%
- 產品上架時間縮短 60%
- 庫存準確率 99.9%
- 組合銷售增長 35%

## 2. 功能性需求

### FR-IM-VCM-001: 變體規則定義
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 產品系列規劃或變體需求
- **行為**: 定義產品變體的維度和規則
- **資料輸入**: 
  - 主產品資訊
  - 變體維度
  - 屬性值
  - 組合規則
  - 命名模式
- **資料輸出**: 
  - 變體矩陣
  - SKU清單
  - 屬性表
  - 規則集
  - 預覽結果
- **UI反應**: 
  - 維度設定
  - 值管理
  - 矩陣生成
  - 批次建立
  - 規則驗證
- **例外處理**: 
  - 維度衝突
  - 值重複
  - 組合無效
  - SKU重複

#### 驗收標準
```yaml
- 條件: 定義產品變體維度
  預期結果: 自動生成所有可能組合的SKU

- 條件: 設定組合限制
  預期結果: 過濾無效組合並提示原因

- 條件: 批次建立變體
  預期結果: 繼承主產品屬性並套用變體特徵
```

#### Traceability
- **測試案例**: tests/unit/FR-IM-VCM-001.test.ts
- **實作程式**: src/modules/im/services/variantManagement.service.ts
- **相關文件**: TOC Modules.md - Section 4.4

### FR-IM-VCM-002: 矩陣式管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 多維度變體管理需求
- **行為**: 提供矩陣化的變體管理介面
- **資料輸入**: 
  - 維度選擇
  - 交叉設定
  - 批次資料
  - 繼承規則
  - 差異設定
- **資料輸出**: 
  - 管理矩陣
  - 批次更新
  - 差異報告
  - 繼承關係
  - 影響分析
- **UI反應**: 
  - 表格編輯
  - 批次操作
  - 快速填充
  - 條件格式
  - 匯入匯出
- **例外處理**: 
  - 資料衝突
  - 格式錯誤
  - 關係斷裂
  - 更新失敗

#### 變體管理模型
```typescript
interface VariantManagement {
  id: string;
  variantGroupId: string;
  
  // 變體群組
  group: {
    masterProduct: {
      itemCode: string;
      itemName: string;
      description: string;
      category: string;
    };
    
    type: 'style' | 'configuration' | 'package' | 'seasonal';
    status: 'active' | 'inactive' | 'planning' | 'phaseout';
    
    // 變體維度
    dimensions: {
      dimensionId: string;
      dimensionName: string;
      
      type: 'color' | 'size' | 'material' | 'style' | 'capacity' | 'custom';
      sequence: number;
      
      mandatory: boolean;
      
      // 維度值
      values: {
        valueId: string;
        value: string;
        displayName: string;
        
        code?: string;
        sequence?: number;
        
        attributes?: {
          [key: string]: any;
        };
        
        media?: {
          images?: string[];
          swatches?: string;
        };
        
        active: boolean;
        default?: boolean;
      }[];
      
      // 值規則
      rules?: {
        allowCustom: boolean;
        validation?: string;
        format?: string;
      };
    }[];
    
    // 組合規則
    combinationRules?: {
      ruleId: string;
      type: 'include' | 'exclude' | 'require';
      
      condition: {
        dimension: string;
        value: string;
      };
      
      target: {
        dimension: string;
        values: string[];
      };
      
      reason?: string;
    }[];
  };
  
  // 變體項目
  variants: {
    variantId: string;
    sku: string;
    
    // 變體組合
    combination: {
      dimension: string;
      value: string;
      valueId: string;
    }[];
    
    // 產品資訊
    product: {
      name: string;
      shortName?: string;
      description?: string;
      
      // 繼承控制
      inheritance: {
        inherit: boolean;
        overrides?: {
          field: string;
          value: any;
        }[];
      };
      
      status: 'active' | 'inactive' | 'draft' | 'discontinued';
      
      lifecycle?: {
        introducedDate?: Date;
        discontinuedDate?: Date;
      };
    };
    
    // 識別資訊
    identification: {
      barcode?: string;
      upc?: string;
      ean?: string;
      isbn?: string;
      
      manufacturerCode?: string;
      vendorCode?: string;
    };
    
    // 規格差異
    specifications?: {
      inherited: {
        [key: string]: any;
      };
      
      specific?: {
        [key: string]: any;
      };
      
      calculated?: {
        [key: string]: any;
      };
    };
    
    // 價格設定
    pricing?: {
      inheritPrice: boolean;
      
      priceAdjustment?: {
        type: 'fixed' | 'percentage' | 'override';
        value: number;
      };
      
      cost?: {
        material?: number;
        labor?: number;
        overhead?: number;
      };
      
      margin?: number;
    };
    
    // 庫存管理
    inventory?: {
      trackSeparately: boolean;
      
      settings?: {
        reorderPoint?: number;
        reorderQty?: number;
        safetyStock?: number;
        leadTime?: number;
      };
      
      currentStock?: {
        onHand: number;
        available: number;
        allocated: number;
        onOrder: number;
      };
    };
    
    // 媒體資源
    media?: {
      images?: {
        type: 'main' | 'alternate' | 'detail';
        url: string;
        alt?: string;
        sequence?: number;
      }[];
      
      videos?: {
        url: string;
        title?: string;
        thumbnail?: string;
      }[];
      
      documents?: {
        type: string;
        url: string;
        name: string;
      }[];
    };
    
    // 銷售資訊
    sales?: {
      sellable: boolean;
      
      channels?: string[];
      regions?: string[];
      
      performance?: {
        salesCount?: number;
        revenue?: number;
        returnRate?: number;
        rating?: number;
      };
    };
    
    generated: boolean;
    generatedAt?: Date;
    modifiedManually?: boolean;
  }[];
  
  // 矩陣視圖
  matrix?: {
    dimensions: string[];
    
    cells: {
      coordinates: {
        [dimension: string]: string;
      };
      
      variant?: {
        sku: string;
        status: string;
        stock?: number;
        price?: number;
      };
      
      available: boolean;
      reason?: string;
    }[][];
    
    summary: {
      totalCombinations: number;
      activeCombinations: number;
      invalidCombinations: number;
    };
  };
  
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    version: number;
  };
}
```

### FR-IM-VCM-003: 組合套裝設定
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 套裝產品規劃或促銷組合
- **行為**: 設定產品組合包裝
- **資料輸入**: 
  - 組件清單
  - 數量關係
  - 定價策略
  - 拆分規則
  - 有效期間
- **資料輸出**: 
  - 套裝SKU
  - 成分明細
  - 價格計算
  - 庫存映射
  - 銷售分析
- **UI反應**: 
  - 組件選擇
  - 數量設定
  - 價格預覽
  - 規則配置
  - 模擬測試
- **例外處理**: 
  - 組件缺貨
  - 價格倒掛
  - 規則衝突
  - 庫存不足

#### 組合管理模型
```typescript
interface CombinationManagement {
  id: string;
  bundleId: string;
  
  // 組合定義
  bundle: {
    bundleSku: string;
    bundleName: string;
    description: string;
    
    type: 'fixed' | 'dynamic' | 'custom' | 'promotional';
    status: 'active' | 'inactive' | 'draft' | 'expired';
    
    category?: string;
    tags?: string[];
    
    validity?: {
      effectiveFrom?: Date;
      effectiveTo?: Date;
    };
  };
  
  // 組件設定
  components: {
    componentId: string;
    
    item: {
      sku: string;
      name: string;
      type: 'product' | 'variant' | 'bundle' | 'service';
    };
    
    quantity: {
      fixed?: number;
      min?: number;
      max?: number;
      default?: number;
      unit: string;
    };
    
    // 選擇規則
    selection?: {
      required: boolean;
      
      alternatives?: {
        sku: string;
        name: string;
        priceAdjustment?: number;
      }[];
      
      conditions?: {
        type: string;
        value: any;
      }[];
    };
    
    // 價格貢獻
    pricing: {
      method: 'proportional' | 'fixed' | 'marginal' | 'zero';
      
      contribution?: {
        amount?: number;
        percentage?: number;
      };
      
      visible: boolean;
    };
    
    // 庫存處理
    inventory: {
      deductStock: boolean;
      checkAvailability: boolean;
      
      allocation?: {
        method: 'immediate' | 'onship' | 'manual';
        priority?: number;
      };
    };
    
    sequence?: number;
    notes?: string;
  }[];
  
  // 定價策略
  pricing: {
    strategy: 'sum' | 'fixed' | 'discount' | 'dynamic';
    
    // 固定價格
    fixed?: {
      price: number;
      currency: string;
    };
    
    // 折扣定價
    discount?: {
      basePrice: number;
      discountType: 'percentage' | 'amount';
      discountValue: number;
    };
    
    // 動態定價
    dynamic?: {
      formula: string;
      variables: {
        [key: string]: any;
      };
      
      constraints?: {
        minPrice?: number;
        maxPrice?: number;
        minMargin?: number;
      };
    };
    
    // 成本分析
    cost?: {
      totalCost: number;
      margin: number;
      marginPercent: number;
      
      breakdown?: {
        component: string;
        cost: number;
        percentage: number;
      }[];
    };
    
    // 稅務處理
    tax?: {
      taxable: boolean;
      taxRate?: number;
      taxIncluded: boolean;
    };
  };
  
  // 銷售規則
  salesRules?: {
    // 銷售通路
    channels?: {
      allowed: string[];
      excluded?: string[];
    };
    
    // 數量限制
    quantity?: {
      minOrder?: number;
      maxOrder?: number;
      multipleOf?: number;
    };
    
    // 客戶限制
    customer?: {
      segments?: string[];
      tiers?: string[];
      excluded?: string[];
    };
    
    // 促銷互斥
    promotions?: {
      allowOtherPromotions: boolean;
      excludedPromotions?: string[];
    };
    
    // 拆分規則
    unbundling?: {
      allowed: boolean;
      conditions?: string[];
      pricing?: {
        method: string;
        markup?: number;
      };
    };
  };
  
  // 庫存映射
  inventoryMapping?: {
    // 虛擬庫存
    virtual: {
      trackAsOne: boolean;
      virtualSku?: string;
    };
    
    // 實體對應
    physical?: {
      deductComponents: boolean;
      
      availability: {
        method: 'all_available' | 'any_available' | 'calculated';
        
        calculation?: {
          formula: string;
        };
      };
      
      allocation: {
        method: 'proportional' | 'priority' | 'manual';
        
        rules?: {
          component: string;
          priority: number;
          percentage?: number;
        }[];
      };
    };
    
    // 預留策略
    reservation?: {
      method: 'hard' | 'soft' | 'none';
      duration?: number;
      autoRelease: boolean;
    };
  };
  
  // 效能分析
  analytics?: {
    sales: {
      unitsSold?: number;
      revenue?: number;
      averagePrice?: number;
    };
    
    performance: {
      attachRate?: number;
      crossSellRate?: number;
      profitability?: number;
    };
    
    customer: {
      satisfaction?: number;
      repeatPurchase?: number;
      recommendation?: number;
    };
  };
}
```

### FR-IM-VCM-004: SKU自動生成
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 變體建立或編碼需求
- **行為**: 自動產生SKU編碼
- **資料輸入**: 
  - 編碼規則
  - 屬性映射
  - 序號規則
  - 檢查碼
  - 保留碼
- **資料輸出**: 
  - SKU編碼
  - 編碼清單
  - 重複檢查
  - 可用序號
  - 編碼歷史
- **UI反應**: 
  - 規則設定
  - 預覽生成
  - 批次產生
  - 衝突提示
  - 手動調整
- **例外處理**: 
  - 編碼重複
  - 規則錯誤
  - 序號用盡
  - 格式無效

### FR-IM-VCM-005: 庫存映射管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 組合產品庫存查詢或扣減
- **行為**: 管理虛實庫存的對應關係
- **資料輸入**: 
  - 映射規則
  - 扣減順序
  - 分配比例
  - 補貨策略
  - 預留設定
- **資料輸出**: 
  - 可用庫存
  - 組件狀態
  - 分配結果
  - 缺貨警示
  - 補貨建議
- **UI反應**: 
  - 映射圖示
  - 庫存狀態
  - 模擬扣減
  - 警示提醒
  - 調整建議
- **例外處理**: 
  - 組件缺貨
  - 分配失敗
  - 超賣風險
  - 預留衝突

## 3. 系統設計

### 3.1 資料模型

```typescript
// SKU生成器
interface SKUGenerator {
  id: string;
  generatorId: string;
  
  // 生成規則
  rules: {
    pattern: string;  // 如: {CATEGORY}-{COLOR}-{SIZE}-{SEQ}
    
    segments: {
      name: string;
      type: 'static' | 'attribute' | 'sequence' | 'date' | 'random';
      
      // 靜態值
      static?: {
        value: string;
      };
      
      // 屬性映射
      attribute?: {
        source: string;
        field: string;
        
        mapping?: {
          value: string;
          code: string;
        }[];
        
        transform?: 'uppercase' | 'lowercase' | 'abbreviate';
        maxLength?: number;
      };
      
      // 序號
      sequence?: {
        start: number;
        increment: number;
        padding: number;
        reset?: 'never' | 'daily' | 'monthly' | 'yearly';
        
        current?: number;
        lastReset?: Date;
      };
      
      // 日期
      date?: {
        format: string;
      };
      
      // 隨機
      random?: {
        length: number;
        charset: string;
      };
      
      position: number;
      separator?: string;
    }[];
    
    validation?: {
      unique: boolean;
      checkDigit?: 'mod10' | 'mod11' | 'custom';
      
      reserved?: string[];
      blacklist?: string[];
      
      customValidation?: string;
    };
  };
  
  // 生成記錄
  history: {
    generatedSKUs: {
      sku: string;
      generatedAt: Date;
      generatedFor: {
        type: string;
        id: string;
      };
      
      segments: {
        segment: string;
        value: string;
      }[];
      
      status: 'active' | 'reserved' | 'cancelled';
    }[];
    
    statistics: {
      totalGenerated: number;
      activeCount: number;
      lastGenerated?: Date;
      
      sequenceStatus?: {
        current: number;
        remaining: number;
        willResetAt?: Date;
      };
    };
  };
  
  // 批次生成
  batch?: {
    batchId: string;
    
    request: {
      quantity: number;
      
      variations: {
        dimension: string;
        values: string[];
      }[];
      
      options?: {
        prefix?: string;
        suffix?: string;
        reserve: boolean;
      };
    };
    
    result?: {
      generated: string[];
      failed?: {
        reason: string;
        combinations: any[];
      }[];
      
      summary: {
        requested: number;
        generated: number;
        failed: number;
      };
    };
    
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

// 庫存映射
interface InventoryMapping {
  id: string;
  mappingId: string;
  
  // 映射類型
  type: 'bundle' | 'variant' | 'substitute' | 'virtual';
  
  // 主產品
  primary: {
    sku: string;
    name: string;
    
    virtualStock?: {
      enabled: boolean;
      quantity?: number;
      unlimited?: boolean;
    };
  };
  
  // 映射關係
  mappings: {
    // 組件映射
    components?: {
      sku: string;
      name: string;
      
      quantity: number;
      unit: string;
      
      required: boolean;
      
      deduction: {
        timing: 'immediate' | 'onship' | 'manual';
        priority: number;
      };
      
      substitutes?: {
        sku: string;
        ratio: number;
        priority: number;
      }[];
    }[];
    
    // 變體映射
    variants?: {
      sku: string;
      
      shareStock: boolean;
      stockPool?: string;
      
      allocation?: {
        percentage?: number;
        reserved?: number;
        max?: number;
      };
    }[];
    
    // 替代映射
    substitutes?: {
      original: string;
      substitute: string;
      
      conditions?: {
        stockLevel?: number;
        customerTier?: string;
        region?: string;
      };
      
      ratio: number;
      autoSwitch: boolean;
    }[];
  };
  
  // 可用性計算
  availability: {
    method: 'minimum' | 'sum' | 'calculated' | 'manual';
    
    calculation?: {
      formula?: string;
      
      realtime: boolean;
      cacheSeconds?: number;
    };
    
    current?: {
      available: number;
      allocated: number;
      onOrder: number;
      
      components?: {
        sku: string;
        available: number;
        limiting: boolean;
      }[];
      
      lastCalculated?: Date;
    };
    
    forecast?: {
      date: Date;
      available: number;
      confidence: number;
    }[];
  };
  
  // 分配規則
  allocation: {
    strategy: 'fifo' | 'lifo' | 'priority' | 'proportional' | 'manual';
    
    rules?: {
      priority?: {
        channel?: { [key: string]: number; };
        customer?: { [key: string]: number; };
        order?: { [key: string]: number; };
      };
      
      limits?: {
        maxPerOrder?: number;
        maxPerCustomer?: number;
        maxPerDay?: number;
      };
      
      reservation?: {
        allowReservation: boolean;
        reservationDays?: number;
        autoRelease: boolean;
      };
    };
    
    overrides?: {
      sku: string;
      rule: string;
      value: any;
    }[];
  };
  
  // 補貨策略
  replenishment?: {
    trigger: {
      type: 'reorderPoint' | 'periodic' | 'forecast' | 'manual';
      
      reorderPoint?: {
        level: number;
        checkFrequency: string;
      };
      
      periodic?: {
        interval: string;
        nextDate?: Date;
      };
    };
    
    quantity: {
      method: 'fixed' | 'variable' | 'eoq';
      
      fixed?: number;
      
      variable?: {
        min: number;
        max: number;
        targetDays: number;
      };
      
      eoq?: {
        demandRate: number;
        orderCost: number;
        holdingCost: number;
      };
    };
    
    bundleStrategy?: {
      replenishComponents: boolean;
      maintainRatio: boolean;
      roundUp: boolean;
    };
  };
}

// 變體效能分析
interface VariantAnalytics {
  variantGroupId: string;
  period: { start: Date; end: Date; };
  
  // 銷售分析
  sales: {
    byVariant: {
      sku: string;
      combination: string;
      
      metrics: {
        quantity: number;
        revenue: number;
        transactions: number;
        averagePrice: number;
      };
      
      trend: 'up' | 'stable' | 'down';
      growthRate: number;
      
      rank: number;
      contribution: number;
    }[];
    
    byDimension: {
      dimension: string;
      
      values: {
        value: string;
        quantity: number;
        revenue: number;
        percentage: number;
      }[];
      
      insights?: string[];
    }[];
    
    combinations: {
      popular: {
        combination: string[];
        frequency: number;
        revenue: number;
      }[];
      
      rare: {
        combination: string[];
        frequency: number;
        lastSold?: Date;
      }[];
    };
  };
  
  // 庫存分析
  inventory: {
    byVariant: {
      sku: string;
      
      levels: {
        onHand: number;
        available: number;
        weeks: number;
      };
      
      turnover: {
        rate: number;
        days: number;
      };
      
      status: 'overstock' | 'optimal' | 'low' | 'out';
    }[];
    
    distribution: {
      dimension: string;
      
      balance: {
        value: string;
        percentage: number;
        status: string;
      }[];
      
      recommendations?: string[];
    }[];
  };
  
  // 組合分析
  bundlePerformance?: {
    bundles: {
      bundleId: string;
      bundleName: string;
      
      sales: {
        quantity: number;
        revenue: number;
        attachRate: number;
      };
      
      profitability: {
        margin: number;
        contribution: number;
      };
      
      components: {
        sku: string;
        pullThrough: number;
      }[];
    }[];
    
    crossSell: {
      from: string;
      to: string;
      frequency: number;
      lift: number;
    }[];
  };
  
  // 建議優化
  recommendations: {
    newVariants?: {
      combination: string[];
      expectedDemand: number;
      confidence: number;
    }[];
    
    discontinue?: {
      sku: string;
      reason: string;
      impact: number;
    }[];
    
    pricing?: {
      sku: string;
      currentPrice: number;
      suggestedPrice: number;
      expectedImpact: number;
    }[];
    
    bundling?: {
      components: string[];
      expectedLift: number;
      targetSegment: string;
    }[];
  };
}
```

### 3.2 API 設計

```typescript
// 變體與組合管理 API
interface VariantCombinationAPI {
  // 變體管理
  POST   /api/im/variants                     // 建立變體群組
  GET    /api/im/variants/:groupId            // 查詢變體群組
  PUT    /api/im/variants/:groupId            // 更新變體群組
  POST   /api/im/variants/:groupId/generate   // 生成變體
  GET    /api/im/variants/:groupId/matrix     // 取得矩陣視圖
  
  // 組合管理
  POST   /api/im/bundles                      // 建立組合
  GET    /api/im/bundles/:id                  // 查詢組合
  PUT    /api/im/bundles/:id                  // 更新組合
  POST   /api/im/bundles/:id/validate         // 驗證組合
  GET    /api/im/bundles/:id/availability     // 檢查可用性
  
  // SKU生成
  POST   /api/im/sku/generate                 // 生成SKU
  POST   /api/im/sku/batch                    // 批次生成
  GET    /api/im/sku/validate/:sku            // 驗證SKU
  GET    /api/im/sku/suggest                  // 建議SKU
  
  // 庫存映射
  POST   /api/im/inventory/mapping            // 建立映射
  GET    /api/im/inventory/mapping/:sku       // 查詢映射
  POST   /api/im/inventory/calculate          // 計算可用性
  POST   /api/im/inventory/allocate           // 分配庫存
  
  // 分析報表
  GET    /api/im/variants/analytics/:groupId  // 變體分析
  GET    /api/im/bundles/analytics/:id        // 組合分析
  GET    /api/im/variants/recommendations     // 優化建議
}

// WebSocket 事件
interface VCMWebSocketEvents {
  'variant:created': (variant: any) => void;
  'variant:updated': (variant: any) => void;
  'bundle:created': (bundle: any) => void;
  'sku:generated': (sku: any) => void;
  'inventory:mapped': (mapping: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **BDM-IIM**: 品項基礎資料
- **IM-IC**: 配置管理
- **OM**: 訂單處理
- **WMS**: 庫存管理
- **BI**: 銷售分析

### 4.2 外部系統整合
- **電商平台**: 變體同步
- **PIM系統**: 產品資訊
- **價格引擎**: 動態定價
- **庫存系統**: 即時庫存

## 5. 成功指標

### 5.1 業務指標
- 變體建立時間 < 10分鐘
- 組合準確率 100%
- SKU重複率 0%
- 庫存準確率 > 99.5%

### 5.2 系統指標
- 變體生成速度 < 3秒
- 矩陣載入時間 < 2秒
- 並發處理 > 100個變體群組
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: im@tsaitung.com