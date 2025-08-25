# IM-IC 品項配置管理 (Item Configuration Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: OM (訂單管理), CRM (客戶關係), BDM-IIM (品項資訊), IM-VCM (變體管理)

## 1. 功能概述

### 1.1 目的
建立靈活的產品配置管理系統，支援客製化產品選項、規則驗證和配置管理，實現個性化產品銷售和生產的無縫整合。

### 1.2 範圍
- 配置模型定義
- 選項規則管理
- 相容性驗證
- 配置器引擎
- 報價自動計算

### 1.3 關鍵價值
- 配置準確率 100%
- 報價時間縮短 70%
- 客戶滿意度提升 40%
- 錯誤配置降至 0%

## 2. 功能性需求

### FR-IM-IC-001: 配置模型定義
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 產品配置需求或選項設計
- **行為**: 定義產品的可配置選項和結構
- **資料輸入**: 
  - 基礎產品
  - 選項類別
  - 特徵屬性
  - 預設配置
  - 限制條件
- **資料輸出**: 
  - 配置模型
  - 選項樹
  - 屬性矩陣
  - 規則集
  - 配置模板
- **UI反應**: 
  - 視覺化建模
  - 拖拽設計
  - 規則編輯器
  - 預覽測試
  - 版本管理
- **例外處理**: 
  - 選項衝突
  - 規則矛盾
  - 屬性缺失
  - 循環依賴

#### 驗收標準
```yaml
- 條件: 建立配置模型
  預期結果: 自動驗證規則完整性並產生配置介面

- 條件: 選擇衝突選項
  預期結果: 即時提示不相容並建議替代方案

- 條件: 完成配置
  預期結果: 產生完整BOM和成本計算
```

#### Traceability
- **測試案例**: tests/unit/FR-IM-IC-001.test.ts
- **實作程式**: src/modules/im/services/itemConfiguration.service.ts
- **相關文件**: TOC Modules.md - Section 4.3

### FR-IM-IC-002: 選項規則管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 規則定義或業務邏輯變更
- **行為**: 管理配置選項間的規則和約束
- **資料輸入**: 
  - 規則類型
  - 條件設定
  - 動作定義
  - 優先順序
  - 錯誤訊息
- **資料輸出**: 
  - 規則庫
  - 決策樹
  - 驗證結果
  - 衝突報告
  - 建議清單
- **UI反應**: 
  - 規則建構器
  - 邏輯編輯
  - 測試沙盒
  - 衝突檢測
  - 除錯工具
- **例外處理**: 
  - 規則循環
  - 邏輯錯誤
  - 優先級衝突
  - 執行失敗

#### 配置模型
```typescript
interface ConfigurationModel {
  id: string;
  modelId: string;
  
  // 模型定義
  model: {
    productFamily: string;
    productLine: string;
    
    baseProduct: {
      itemCode: string;
      itemName: string;
      description: string;
      basePrice: number;
    };
    
    type: 'configurable' | 'modular' | 'parametric' | 'hybrid';
    status: 'draft' | 'active' | 'inactive' | 'obsolete';
    
    validity: {
      effectiveFrom: Date;
      effectiveTo?: Date;
    };
    
    markets?: string[];
    channels?: string[];
  };
  
  // 配置維度
  dimensions: {
    dimensionId: string;
    dimensionName: string;
    
    type: 'feature' | 'option' | 'parameter' | 'accessory';
    required: boolean;
    
    sequence: number;
    
    // 選項定義
    options: {
      optionId: string;
      optionCode: string;
      optionName: string;
      
      description?: string;
      
      properties?: {
        [key: string]: any;
      };
      
      // 價格影響
      pricing?: {
        type: 'fixed' | 'percentage' | 'formula';
        value: number | string;
        currency?: string;
      };
      
      // 交期影響
      leadTime?: {
        additional: number;
        unit: 'days' | 'weeks';
      };
      
      availability?: {
        stock: boolean;
        minOrderQty?: number;
        regions?: string[];
      };
      
      default?: boolean;
      popular?: boolean;
      
      images?: string[];
      documents?: string[];
    }[];
    
    // 選擇規則
    selection: {
      type: 'single' | 'multiple' | 'range' | 'value';
      
      minimum?: number;
      maximum?: number;
      
      defaultOption?: string;
      defaultValue?: any;
    };
    
    // 顯示控制
    display: {
      visible: boolean;
      
      condition?: {
        dimension: string;
        operator: string;
        value: any;
      };
      
      grouping?: string;
      helpText?: string;
    };
  }[];
  
  // 配置規則
  rules: {
    ruleId: string;
    ruleName: string;
    
    type: 'inclusion' | 'exclusion' | 'requirement' | 'recommendation' | 'calculation';
    
    priority: number;
    active: boolean;
    
    // 條件定義
    condition: {
      if: {
        dimension: string;
        option?: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less';
        value: any;
      }[];
      
      logic?: 'and' | 'or';
    };
    
    // 動作定義
    action: {
      type: 'select' | 'deselect' | 'enable' | 'disable' | 'set_value' | 'add_message';
      
      target: {
        dimension: string;
        option?: string;
      };
      
      value?: any;
      message?: string;
      severity?: 'info' | 'warning' | 'error';
    };
    
    // 規則說明
    description?: string;
    userMessage?: string;
  }[];
  
  // 配置範本
  templates?: {
    templateId: string;
    templateName: string;
    
    description: string;
    
    scenario?: string;
    targetSegment?: string;
    
    configuration: {
      dimension: string;
      selectedOptions: string[];
      values?: any;
    }[];
    
    price?: number;
    leadTime?: number;
    
    popularity?: number;
    recommended?: boolean;
  }[];
  
  // 驗證設定
  validation: {
    checkCompleteness: boolean;
    checkCompatibility: boolean;
    checkAvailability: boolean;
    checkPricing: boolean;
    
    customValidators?: {
      name: string;
      script: string;
      errorMessage: string;
    }[];
  };
}
```

### FR-IM-IC-003: 相容性驗證
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 配置選擇或變更
- **行為**: 驗證選項組合的相容性
- **資料輸入**: 
  - 選擇組合
  - 驗證規則
  - 技術規格
  - 業務限制
  - 歷史數據
- **資料輸出**: 
  - 驗證結果
  - 衝突清單
  - 建議方案
  - 相容矩陣
  - 風險評估
- **UI反應**: 
  - 即時驗證
  - 衝突標示
  - 智能建議
  - 解決嚮導
  - 批次檢查
- **例外處理**: 
  - 技術不相容
  - 業務限制
  - 資源不足
  - 規則衝突

#### 規則引擎模型
```typescript
interface ConfigurationRuleEngine {
  // 規則執行上下文
  context: {
    sessionId: string;
    productModel: string;
    
    customer?: {
      id: string;
      segment: string;
      region: string;
    };
    
    channel?: string;
    currency?: string;
    quantity?: number;
    
    timestamp: Date;
  };
  
  // 當前配置
  configuration: {
    selections: {
      dimension: string;
      options: string[];
      values?: any;
    }[];
    
    status: 'incomplete' | 'valid' | 'invalid' | 'warning';
    
    completeness: {
      required: number;
      completed: number;
      percentage: number;
    };
  };
  
  // 規則執行
  execution: {
    // 規則評估
    evaluation: {
      rules: {
        ruleId: string;
        evaluated: boolean;
        triggered: boolean;
        
        result?: {
          success: boolean;
          actions: any[];
          messages?: string[];
        };
        
        executionTime?: number;
      }[];
      
      sequence: string[];
      iterations: number;
    };
    
    // 相容性檢查
    compatibility: {
      checks: {
        type: 'technical' | 'business' | 'availability';
        
        items: {
          dimension1: string;
          option1: string;
          dimension2: string;
          option2: string;
        };
        
        compatible: boolean;
        reason?: string;
        severity?: 'error' | 'warning' | 'info';
      }[];
      
      matrix?: {
        [key: string]: {
          [key: string]: boolean;
        };
      };
    };
    
    // 推薦建議
    recommendations?: {
      type: 'alternative' | 'addition' | 'upgrade' | 'bundle';
      
      suggestion: {
        dimension: string;
        option: string;
        reason: string;
        benefit?: string;
        
        impact?: {
          price?: number;
          leadTime?: number;
        };
      };
      
      confidence: number;
      priority: number;
    }[];
    
    // 驗證結果
    validation: {
      errors: {
        code: string;
        message: string;
        dimension?: string;
        option?: string;
        resolution?: string;
      }[];
      
      warnings: {
        code: string;
        message: string;
        impact?: string;
      }[];
      
      info?: string[];
    };
  };
  
  // 配置輸出
  output?: {
    // 最終配置
    finalConfiguration: {
      configurationId: string;
      
      summary: {
        productCode: string;
        productName: string;
        description: string;
      };
      
      details: {
        dimension: string;
        selection: string[];
        specification?: any;
      }[];
      
      valid: boolean;
    };
    
    // BOM生成
    bom?: {
      items: {
        itemCode: string;
        quantity: number;
        unit: string;
        type: 'standard' | 'optional' | 'configured';
      }[];
      
      routing?: {
        operations: string[];
        totalTime: number;
      };
    };
    
    // 定價計算
    pricing?: {
      basePrice: number;
      
      options: {
        dimension: string;
        option: string;
        price: number;
      }[];
      
      discounts?: {
        type: string;
        amount: number;
      }[];
      
      totalPrice: number;
      currency: string;
    };
    
    // 交期計算
    delivery?: {
      standardLeadTime: number;
      additionalTime: number;
      totalLeadTime: number;
      
      estimatedDate?: Date;
      
      expediteOptions?: {
        leadTime: number;
        additionalCost: number;
      }[];
    };
  };
}
```

### FR-IM-IC-004: 配置器引擎
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 客戶配置請求或銷售報價
- **行為**: 提供互動式產品配置體驗
- **資料輸入**: 
  - 客戶需求
  - 使用場景
  - 預算範圍
  - 技術要求
  - 偏好設定
- **資料輸出**: 
  - 配置方案
  - 3D視覺化
  - 規格書
  - 報價單
  - 訂單草稿
- **UI反應**: 
  - 步驟嚮導
  - 視覺預覽
  - 即時更新
  - 比較功能
  - 分享儲存
- **例外處理**: 
  - 配置未完成
  - 選項缺貨
  - 價格超預算
  - 技術不可行

### FR-IM-IC-005: 報價自動計算
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 配置完成或價格查詢
- **行為**: 自動計算配置產品的價格
- **資料輸入**: 
  - 配置選項
  - 數量需求
  - 客戶等級
  - 促銷活動
  - 匯率資訊
- **資料輸出**: 
  - 詳細報價
  - 成本分析
  - 利潤率
  - 折扣明細
  - 比較報表
- **UI反應**: 
  - 價格即時更新
  - 成本分解
  - 折扣顯示
  - 匯率轉換
  - 匯出功能
- **例外處理**: 
  - 價格缺失
  - 折扣衝突
  - 匯率錯誤
  - 成本異常

## 3. 系統設計

### 3.1 資料模型

```typescript
// 配置實例
interface ConfigurationInstance {
  id: string;
  instanceId: string;
  
  // 基本資訊
  info: {
    modelId: string;
    modelName: string;
    
    createdBy: string;
    createdAt: Date;
    
    status: 'draft' | 'validated' | 'quoted' | 'ordered' | 'expired';
    
    customer?: {
      customerId: string;
      customerName: string;
      segment?: string;
    };
    
    purpose?: 'quote' | 'order' | 'sample' | 'planning';
    
    expiryDate?: Date;
  };
  
  // 配置內容
  configuration: {
    // 選擇項目
    selections: {
      dimensionId: string;
      dimensionName: string;
      
      selected: {
        optionId: string;
        optionCode: string;
        optionName: string;
        
        quantity?: number;
        customValue?: any;
      }[];
      
      locked?: boolean;
      reason?: string;
    }[];
    
    // 自訂參數
    parameters?: {
      name: string;
      value: any;
      unit?: string;
      validated: boolean;
    }[];
    
    // 附加說明
    notes?: {
      type: 'customer' | 'technical' | 'commercial';
      note: string;
      author: string;
      date: Date;
    }[];
  };
  
  // 驗證結果
  validation: {
    validated: boolean;
    validatedAt?: Date;
    validatedBy?: string;
    
    completeness: {
      complete: boolean;
      missingRequired?: string[];
    };
    
    compatibility: {
      compatible: boolean;
      issues?: {
        type: string;
        description: string;
        severity: string;
      }[];
    };
    
    availability?: {
      available: boolean;
      constraints?: {
        item: string;
        issue: string;
      }[];
    };
    
    technical?: {
      feasible: boolean;
      concerns?: string[];
    };
  };
  
  // 輸出文件
  outputs?: {
    // 產品規格
    specification?: {
      documentId: string;
      version: string;
      
      specs: {
        category: string;
        specifications: {
          name: string;
          value: any;
          unit?: string;
        }[];
      }[];
      
      drawings?: string[];
      certifications?: string[];
    };
    
    // BOM清單
    bom?: {
      bomId: string;
      
      components: {
        level: number;
        itemCode: string;
        description: string;
        quantity: number;
        unit: string;
        configured: boolean;
      }[];
      
      totalComponents: number;
      customComponents: number;
    };
    
    // 報價資訊
    quotation?: {
      quoteId: string;
      quoteDate: Date;
      
      pricing: {
        listPrice: number;
        configuredPrice: number;
        
        optionsPricing: {
          dimension: string;
          option: string;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }[];
        
        discounts?: {
          type: string;
          rate: number;
          amount: number;
        }[];
        
        taxes?: {
          type: string;
          rate: number;
          amount: number;
        }[];
        
        totalAmount: number;
        currency: string;
      };
      
      validity: {
        validUntil: Date;
        terms?: string;
      };
    };
    
    // 視覺化
    visualization?: {
      images?: {
        view: string;
        url: string;
      }[];
      
      model3D?: {
        format: string;
        url: string;
        viewer?: string;
      };
      
      diagrams?: {
        type: string;
        url: string;
      }[];
    };
  };
  
  // 歷史記錄
  history?: {
    changes: {
      timestamp: Date;
      user: string;
      
      type: 'selection' | 'validation' | 'pricing' | 'note';
      
      change: {
        dimension?: string;
        before?: any;
        after?: any;
        reason?: string;
      };
    }[];
    
    versions?: {
      version: number;
      savedAt: Date;
      savedBy: string;
      snapshot: any;
    }[];
  };
}

// 配置器設定
interface ConfiguratorSettings {
  configuratorId: string;
  modelId: string;
  
  // UI設定
  ui: {
    theme?: string;
    layout: 'wizard' | 'single_page' | 'tabs' | 'accordion';
    
    steps?: {
      stepId: string;
      title: string;
      description?: string;
      
      dimensions: string[];
      
      navigation: {
        showPrevious: boolean;
        showNext: boolean;
        showSkip?: boolean;
      };
      
      validation?: {
        required: boolean;
        customValidation?: string;
      };
    }[];
    
    visualization: {
      show3D?: boolean;
      showImages: boolean;
      showSpecs: boolean;
      showPrice: boolean;
      
      updateMode: 'realtime' | 'on_change' | 'manual';
    };
    
    features: {
      allowSave: boolean;
      allowShare: boolean;
      allowCompare: boolean;
      allowExport: boolean;
      showHelp: boolean;
      showChat?: boolean;
    };
  };
  
  // 業務規則
  business: {
    pricing: {
      showListPrice: boolean;
      showDiscount: boolean;
      showTax: boolean;
      
      roundTo?: number;
      
      approvalRequired?: {
        threshold: number;
        approvers: string[];
      };
    };
    
    ordering: {
      minQuantity?: number;
      maxQuantity?: number;
      multipleOf?: number;
      
      leadTimeBuffer?: number;
      
      requiresApproval?: boolean;
    };
    
    customer: {
      segmentRules?: {
        segment: string;
        allowedOptions?: string[];
        forbiddenOptions?: string[];
        specialPricing?: any;
      }[];
      
      authentication?: {
        required: boolean;
        level: 'guest' | 'registered' | 'verified';
      };
    };
  };
  
  // 整合設定
  integrations?: {
    crm?: {
      syncCustomer: boolean;
      syncOpportunity: boolean;
      syncQuote: boolean;
    };
    
    cad?: {
      generateDrawing: boolean;
      format: string[];
      autoUpdate: boolean;
    };
    
    erp?: {
      createSalesOrder: boolean;
      updateInventory: boolean;
      calculateATP: boolean;
    };
  };
}

// 報價計算
interface QuotationCalculation {
  configurationId: string;
  
  // 計算參數
  parameters: {
    quantity: number;
    currency: string;
    
    customer?: {
      id: string;
      segment: string;
      priceList?: string;
    };
    
    date: Date;
    validityDays?: number;
    
    includeOptions?: {
      tax: boolean;
      shipping: boolean;
      installation: boolean;
    };
  };
  
  // 價格計算
  calculation: {
    // 基礎價格
    base: {
      productCode: string;
      listPrice: number;
      quantity: number;
      subtotal: number;
    };
    
    // 選項價格
    options: {
      dimension: string;
      option: string;
      
      pricing: {
        method: 'fixed' | 'percentage' | 'tiered';
        unitPrice: number;
        quantity: number;
        amount: number;
      };
      
      discount?: {
        rate: number;
        amount: number;
      };
      
      total: number;
    }[];
    
    // 數量折扣
    volumeDiscount?: {
      tier: string;
      rate: number;
      amount: number;
    };
    
    // 客戶折扣
    customerDiscount?: {
      type: string;
      rate: number;
      amount: number;
    };
    
    // 促銷折扣
    promotions?: {
      promotionId: string;
      description: string;
      discount: number;
    }[];
    
    // 附加費用
    additionalCharges?: {
      shipping?: {
        method: string;
        cost: number;
      };
      
      installation?: {
        required: boolean;
        cost: number;
      };
      
      training?: {
        hours: number;
        rate: number;
        cost: number;
      };
      
      warranty?: {
        period: string;
        cost: number;
      };
    };
    
    // 稅金計算
    taxes?: {
      subtotal: number;
      
      taxes: {
        type: string;
        rate: number;
        amount: number;
      }[];
      
      totalTax: number;
    };
    
    // 總計
    summary: {
      subtotal: number;
      totalDiscount: number;
      totalCharges: number;
      totalTax: number;
      grandTotal: number;
      
      margin?: {
        cost: number;
        margin: number;
        marginPercent: number;
      };
    };
  };
  
  // 審批資訊
  approval?: {
    required: boolean;
    reason?: string;
    
    levels: {
      level: number;
      approver: string;
      threshold: number;
      status?: 'pending' | 'approved' | 'rejected';
      date?: Date;
      comments?: string;
    }[];
  };
}
```

### 3.2 API 設計

```typescript
// 品項配置管理 API
interface ItemConfigurationAPI {
  // 配置模型
  POST   /api/im/configuration/models         // 建立模型
  GET    /api/im/configuration/models         // 查詢模型
  GET    /api/im/configuration/models/:id     // 模型詳情
  PUT    /api/im/configuration/models/:id     // 更新模型
  POST   /api/im/configuration/models/:id/copy // 複製模型
  
  // 配置規則
  POST   /api/im/configuration/rules          // 建立規則
  GET    /api/im/configuration/rules          // 規則列表
  POST   /api/im/configuration/rules/validate // 驗證規則
  POST   /api/im/configuration/rules/test     // 測試規則
  
  // 配置執行
  POST   /api/im/configurator/start           // 開始配置
  GET    /api/im/configurator/:id             // 取得配置
  PUT    /api/im/configurator/:id             // 更新配置
  POST   /api/im/configurator/:id/validate    // 驗證配置
  POST   /api/im/configurator/:id/complete    // 完成配置
  
  // 相容性檢查
  POST   /api/im/configuration/compatibility   // 檢查相容性
  GET    /api/im/configuration/conflicts      // 取得衝突
  POST   /api/im/configuration/resolve        // 解決衝突
  GET    /api/im/configuration/suggestions    // 取得建議
  
  // 報價計算
  POST   /api/im/configuration/quote          // 計算報價
  GET    /api/im/configuration/quote/:id      // 報價詳情
  POST   /api/im/configuration/quote/compare  // 比較報價
  POST   /api/im/configuration/quote/export   // 匯出報價
}

// WebSocket 事件
interface ICWebSocketEvents {
  'configuration:started': (config: any) => void;
  'configuration:updated': (config: any) => void;
  'configuration:validated': (result: any) => void;
  'rule:triggered': (rule: any) => void;
  'price:calculated': (price: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OM**: 訂單處理
- **CRM**: 客戶報價
- **BDM-IIM**: 品項資料
- **IM-VCM**: 變體管理
- **IM-BR**: BOM生成

### 4.2 外部系統整合
- **CAD系統**: 圖面生成
- **CPQ系統**: 報價整合
- **電商平台**: 線上配置
- **視覺化引擎**: 3D展示

## 5. 成功指標

### 5.1 業務指標
- 配置完成率 > 90%
- 報價準確率 100%
- 客戶滿意度 > 85%
- 銷售轉換率提升 30%

### 5.2 系統指標
- 配置回應時間 < 0.5秒
- 規則執行時間 < 1秒
- 並發配置 > 100個
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: im@tsaitung.com