# BDM-UNIT 單位換算管理 (Unit Conversion Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: BDM-IIM (品項資訊), OM (訂單管理), WMS (倉儲管理), PM (採購管理)

## 1. 功能概述

### 1.1 目的
建立統一的單位換算管理系統，處理各種度量衡單位的定義、換算關係和應用規則，確保跨系統單位換算的一致性和準確性。

### 1.2 範圍
- 單位定義管理
- 換算關係設定
- 換算規則引擎
- 精度控制管理
- 單位群組維護

### 1.3 關鍵價值
- 換算準確率 100%
- 設定效率提升 80%
- 錯誤率降至 0%
- 跨系統一致性 100%

## 2. 功能性需求

### FR-BDM-UNIT-001: 單位定義管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 新單位需求或標準更新
- **行為**: 定義和管理各類度量單位
- **資料輸入**: 
  - 單位代碼
  - 單位名稱
  - 度量類型
  - 標準定義
  - 符號表示
- **資料輸出**: 
  - 單位清單
  - 分類目錄
  - 標準文檔
  - 符號對照
  - 使用統計
- **UI反應**: 
  - 分類瀏覽
  - 快速搜尋
  - 標準導入
  - 符號預覽
  - 關聯顯示
- **例外處理**: 
  - 重複定義
  - 標準衝突
  - 符號重複
  - 關聯錯誤

#### 驗收標準
```yaml
- 條件: 新增計量單位
  預期結果: 自動檢查唯一性並建立標準記錄

- 條件: 匯入國際標準
  預期結果: 批次建立單位並設定換算關係

- 條件: 單位符號重複
  預期結果: 提示衝突並建議替代方案
```

#### Traceability
- **測試案例**: tests/unit/FR-BDM-UNIT-001.test.ts
- **實作程式**: src/modules/bdm/services/unitManagement.service.ts
- **相關文件**: TOC Modules.md - Section 3.5

### FR-BDM-UNIT-002: 換算關係設定
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 單位換算需求或關係建立
- **行為**: 設定單位間的換算關係
- **資料輸入**: 
  - 來源單位
  - 目標單位
  - 換算係數
  - 換算公式
  - 適用範圍
- **資料輸出**: 
  - 換算矩陣
  - 路徑計算
  - 係數表
  - 驗證結果
  - 應用案例
- **UI反應**: 
  - 圖形化設定
  - 換算計算器
  - 路徑顯示
  - 批次設定
  - 驗證提示
- **例外處理**: 
  - 循環換算
  - 精度損失
  - 不可換算
  - 路徑衝突

#### 單位管理模型
```typescript
interface UnitManagement {
  id: string;
  unitCode: string;
  
  // 單位定義
  definition: {
    name: {
      standard: string;
      display: string;
      abbreviation: string;
      symbol?: string;
      
      localization?: {
        language: string;
        name: string;
        symbol?: string;
      }[];
    };
    
    category: {
      type: 'length' | 'weight' | 'volume' | 'area' | 'time' | 'temperature' | 'currency' | 'quantity' | 'custom';
      subCategory?: string;
      dimension?: string;
    };
    
    system: {
      measurementSystem: 'metric' | 'imperial' | 'us_customary' | 'custom';
      baseUnit: boolean;
      
      standard?: {
        organization: string;  // ISO, ANSI, etc.
        code: string;
        version?: string;
      };
    };
    
    properties: {
      divisible: boolean;
      decimals: number;
      minValue?: number;
      maxValue?: number;
      
      rounding?: {
        method: 'round' | 'ceil' | 'floor' | 'truncate';
        precision: number;
      };
    };
  };
  
  // 換算關係
  conversions: {
    conversionId: string;
    
    relation: {
      fromUnit: string;
      toUnit: string;
      
      method: 'multiply' | 'divide' | 'formula' | 'table';
      
      // 簡單換算
      factor?: {
        value: number;
        operation: 'multiply' | 'divide';
      };
      
      // 公式換算
      formula?: {
        expression: string;  // e.g., "(value - 32) * 5/9"
        variables: {
          name: string;
          description: string;
        }[];
      };
      
      // 查表換算
      table?: {
        from: number;
        to: number;
      }[];
      
      // 偏移換算
      offset?: {
        add?: number;
        subtract?: number;
      };
    };
    
    accuracy: {
      precision: number;
      tolerance?: number;
      significantDigits?: number;
    };
    
    validation: {
      rangeCheck: boolean;
      minValid?: number;
      maxValid?: number;
    };
    
    bidirectional: boolean;
    
    metadata: {
      source?: string;
      verified: boolean;
      lastVerified?: Date;
      notes?: string;
    };
  }[];
  
  // 應用規則
  applicationRules?: {
    contexts: {
      module: string;
      usage: 'display' | 'input' | 'storage' | 'calculation' | 'all';
      
      preferred?: string;
      allowed: string[];
      forbidden?: string[];
      
      autoConvert: boolean;
      defaultUnit?: string;
    }[];
    
    businessRules?: {
      rule: string;
      condition: string;
      action: string;
      priority: number;
    }[];
  };
  
  status: 'active' | 'deprecated' | 'draft';
  
  effectiveDate?: Date;
  expiryDate?: Date;
}
```

### FR-BDM-UNIT-003: 換算規則引擎
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 換算請求或自動轉換
- **行為**: 執行智能單位換算
- **資料輸入**: 
  - 來源值
  - 來源單位
  - 目標單位
  - 換算情境
  - 精度要求
- **資料輸出**: 
  - 換算結果
  - 換算路徑
  - 精度資訊
  - 警示訊息
  - 替代方案
- **UI反應**: 
  - 即時換算
  - 路徑提示
  - 精度顯示
  - 批次處理
  - 歷史記錄
- **例外處理**: 
  - 無法換算
  - 精度不足
  - 溢位處理
  - 規則衝突

#### 換算引擎模型
```typescript
interface ConversionEngine {
  // 換算請求
  request: {
    requestId: string;
    timestamp: Date;
    
    input: {
      value: number | number[];
      unit: string;
      context?: string;
    };
    
    output: {
      targetUnit: string;
      precision?: number;
      format?: string;
    };
    
    options?: {
      preferredPath?: string[];
      allowIndirect: boolean;
      maxSteps?: number;
      validateRange: boolean;
    };
  };
  
  // 換算處理
  processing: {
    // 路徑搜尋
    pathFinding: {
      algorithm: 'direct' | 'shortest' | 'most_accurate';
      
      paths: {
        steps: {
          from: string;
          to: string;
          factor: number;
          formula?: string;
        }[];
        
        totalSteps: number;
        accuracy: number;
        complexity: number;
      }[];
      
      selectedPath: number;
    };
    
    // 換算計算
    calculation: {
      steps: {
        step: number;
        operation: string;
        input: number;
        output: number;
        precision: number;
      }[];
      
      finalValue: number;
      
      accuracy: {
        absoluteError?: number;
        relativeError?: number;
        confidence: number;
      };
    };
    
    // 驗證檢查
    validation: {
      rangeCheck: {
        inRange: boolean;
        min?: number;
        max?: number;
      };
      
      precisionCheck: {
        requestedPrecision: number;
        achievedPrecision: number;
        acceptable: boolean;
      };
      
      warnings?: string[];
      errors?: string[];
    };
  };
  
  // 換算結果
  result: {
    success: boolean;
    
    value?: number;
    unit: string;
    
    formatted?: string;
    
    metadata?: {
      conversionPath: string[];
      totalFactor: number;
      precision: number;
      confidence: number;
    };
    
    alternatives?: {
      unit: string;
      value: number;
      formatted: string;
    }[];
    
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  };
}
```

### FR-BDM-UNIT-004: 精度控制管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 精度設定或特殊要求
- **行為**: 管理換算精度和捨入規則
- **資料輸入**: 
  - 精度設定
  - 捨入規則
  - 有效位數
  - 容差範圍
  - 應用場景
- **資料輸出**: 
  - 精度配置
  - 規則矩陣
  - 影響分析
  - 建議設定
  - 測試結果
- **UI反應**: 
  - 精度滑桿
  - 規則選擇
  - 預覽效果
  - 影響提示
  - 測試工具
- **例外處理**: 
  - 精度衝突
  - 累積誤差
  - 規則矛盾
  - 溢位風險

### FR-BDM-UNIT-005: 單位群組維護
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 業務需求或標準化要求
- **行為**: 管理相關單位群組
- **資料輸入**: 
  - 群組名稱
  - 成員單位
  - 預設單位
  - 使用規則
  - 轉換優先級
- **資料輸出**: 
  - 群組清單
  - 成員關係
  - 使用統計
  - 建議配置
  - 衝突檢查
- **UI反應**: 
  - 群組管理
  - 拖拽編輯
  - 關係圖
  - 使用分析
  - 批次操作
- **例外處理**: 
  - 群組重疊
  - 孤立單位
  - 循環依賴
  - 規則衝突

## 3. 系統設計

### 3.1 資料模型

```typescript
// 單位群組
interface UnitGroup {
  id: string;
  groupCode: string;
  
  // 群組資訊
  group: {
    name: string;
    description: string;
    category: string;
    
    purpose: 'business' | 'technical' | 'regulatory' | 'custom';
    
    scope: {
      modules: string[];
      regions?: string[];
      products?: string[];
    };
  };
  
  // 成員單位
  members: {
    unitCode: string;
    unitName: string;
    
    role: 'base' | 'derived' | 'alternate';
    preference: number;
    
    usage: {
      input: boolean;
      output: boolean;
      storage: boolean;
      display: boolean;
    };
    
    restrictions?: {
      minValue?: number;
      maxValue?: number;
      contexts?: string[];
    };
  }[];
  
  // 換算矩陣
  conversionMatrix: {
    fromUnit: string;
    toUnit: string;
    factor: number;
    verified: boolean;
  }[][];
  
  // 群組規則
  rules: {
    defaultUnit: string;
    
    autoConversion: {
      enabled: boolean;
      trigger: 'always' | 'on_save' | 'on_display' | 'never';
      preserveOriginal: boolean;
    };
    
    validation: {
      enforceRange: boolean;
      allowCustom: boolean;
      requireApproval: boolean;
    };
    
    display: {
      showSymbol: boolean;
      showFullName: boolean;
      decimalPlaces?: number;
      thousandsSeparator?: string;
    };
  };
  
  status: 'active' | 'inactive' | 'draft';
}

// 精度管理
interface PrecisionManagement {
  id: string;
  
  // 全域設定
  global: {
    defaultPrecision: number;
    maxDecimals: number;
    
    rounding: {
      method: 'round' | 'ceil' | 'floor' | 'truncate' | 'banker';
      mode: 'half_up' | 'half_down' | 'half_even' | 'half_odd';
    };
    
    significantDigits?: {
      min: number;
      max: number;
    };
  };
  
  // 類別設定
  categorySettings: {
    category: string;
    
    precision: {
      input: number;
      storage: number;
      display: number;
      calculation: number;
    };
    
    tolerance?: {
      absolute?: number;
      relative?: number;
    };
    
    specialRules?: {
      context: string;
      rule: string;
      value: any;
    }[];
  }[];
  
  // 單位特定設定
  unitSettings?: {
    unitCode: string;
    
    overrides: {
      precision?: number;
      rounding?: string;
      minValue?: number;
      maxValue?: number;
    };
    
    conversionPrecision?: {
      targetUnit: string;
      precision: number;
    }[];
  }[];
  
  // 錯誤處理
  errorHandling: {
    onPrecisionLoss: 'warn' | 'error' | 'ignore' | 'round';
    onOverflow: 'error' | 'cap' | 'scientific';
    onUnderflow: 'error' | 'zero' | 'minimum';
    
    logging: {
      enabled: boolean;
      threshold?: number;
      destination?: string;
    };
  };
}

// 換算歷史
interface ConversionHistory {
  id: string;
  sessionId?: string;
  
  // 換算記錄
  conversion: {
    timestamp: Date;
    user?: string;
    
    input: {
      value: number;
      unit: string;
    };
    
    output: {
      value: number;
      unit: string;
    };
    
    method: {
      path: string[];
      factor: number;
      formula?: string;
    };
    
    context?: {
      module: string;
      transaction?: string;
      reference?: string;
    };
  };
  
  // 效能指標
  performance: {
    executionTime: number;
    steps: number;
    cacheHit: boolean;
  };
  
  // 審計追蹤
  audit?: {
    reason?: string;
    approved?: boolean;
    approvedBy?: string;
    notes?: string;
  };
}
```

### 3.2 API 設計

```typescript
// 單位管理 API
interface UnitManagementAPI {
  // 單位定義
  POST   /api/bdm/units                       // 建立單位
  GET    /api/bdm/units                       // 查詢單位
  GET    /api/bdm/units/:code                 // 單位詳情
  PUT    /api/bdm/units/:code                 // 更新單位
  DELETE /api/bdm/units/:code                 // 刪除單位
  
  // 換算關係
  POST   /api/bdm/units/conversions           // 建立換算
  GET    /api/bdm/units/conversions           // 換算關係
  PUT    /api/bdm/units/conversions/:id       // 更新換算
  POST   /api/bdm/units/convert               // 執行換算
  
  // 單位群組
  POST   /api/bdm/units/groups                // 建立群組
  GET    /api/bdm/units/groups                // 群組列表
  PUT    /api/bdm/units/groups/:id            // 更新群組
  GET    /api/bdm/units/groups/:id/matrix     // 換算矩陣
  
  // 精度管理
  GET    /api/bdm/units/precision             // 精度設定
  PUT    /api/bdm/units/precision             // 更新精度
  POST   /api/bdm/units/precision/validate    // 驗證精度
  
  // 工具服務
  POST   /api/bdm/units/calculator            // 換算計算器
  GET    /api/bdm/units/path                  // 換算路徑
  POST   /api/bdm/units/batch                 // 批次換算
  GET    /api/bdm/units/history               // 換算歷史
}

// WebSocket 事件
interface UNITWebSocketEvents {
  'unit:created': (unit: any) => void;
  'unit:updated': (unit: any) => void;
  'conversion:added': (conversion: any) => void;
  'precision:changed': (precision: any) => void;
  'group:modified': (group: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **BDM-IIM**: 品項單位
- **OM**: 訂單單位
- **WMS**: 庫存單位
- **PM**: 採購單位
- **MES**: 生產單位

### 4.2 外部系統整合
- **國際標準**: ISO單位系統
- **度量衡系統**: 法定單位
- **產業標準**: 行業慣用單位
- **貿易系統**: 國際貿易單位

## 5. 成功指標

### 5.1 業務指標
- 換算錯誤率 = 0%
- 設定時間 < 1分鐘
- 查詢效率 > 1000筆/秒
- 使用滿意度 > 95%

### 5.2 系統指標
- 換算延遲 < 10ms
- 精度保證 ≥ 99.999%
- 系統可用性 ≥ 99.99%
- 快取命中率 > 90%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bdm@tsaitung.com