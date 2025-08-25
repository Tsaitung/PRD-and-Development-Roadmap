# BDM-IIM 品項資訊管理 (Item Information Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: IM (品項管理), WMS (倉儲管理), OM (訂單管理), MES (製造執行)

## 1. 功能概述

### 1.1 目的
建立統一的品項主檔資料管理系統，維護產品、原料、半成品等所有品項的基本資訊，確保品項資料的標準化、一致性和可追溯性。

### 1.2 範圍
- 品項主檔維護
- 分類編碼管理
- 規格屬性定義
- 單位換算設定
- 條碼管理系統

### 1.3 關鍵價值
- 品項資料準確率 99.9%
- 編碼標準化率 100%
- 查詢效率提升 70%
- 資料重複率降至 0%

## 2. 功能性需求

### FR-BDM-IIM-001: 品項主檔維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 新品項建立或資料更新
- **行為**: 建立和維護品項基本資料
- **資料輸入**: 
  - 品項基本資訊
  - 分類歸屬
  - 規格描述
  - 圖片資料
  - 供應商資訊
- **資料輸出**: 
  - 品項編號
  - 完整檔案
  - QR Code
  - 變更歷史
  - 關聯資料
- **UI反應**: 
  - 智能編碼
  - 圖片上傳
  - 規格模板
  - 驗證提示
  - 預覽功能
- **例外處理**: 
  - 編碼重複
  - 規格衝突
  - 圖片過大
  - 必填缺漏

#### 驗收標準
```yaml
- 條件: 建立新品項
  預期結果: 自動產生唯一編碼並建立完整檔案

- 條件: 上傳產品圖片
  預期結果: 自動壓縮並產生多種尺寸縮圖

- 條件: 修改關鍵屬性
  預期結果: 記錄變更歷史並通知相關單位
```

#### Traceability
- **測試案例**: tests/unit/FR-BDM-IIM-001.test.ts
- **實作程式**: src/modules/bdm/services/itemManagement.service.ts
- **相關文件**: TOC Modules.md - Section 3.2

### FR-BDM-IIM-002: 分類編碼管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 分類架構調整或編碼申請
- **行為**: 管理品項分類架構和編碼規則
- **資料輸入**: 
  - 分類層級
  - 編碼規則
  - 屬性定義
  - 繼承關係
  - 命名規範
- **資料輸出**: 
  - 分類樹
  - 編碼表
  - 屬性清單
  - 規則文檔
  - 衝突報告
- **UI反應**: 
  - 樹狀結構
  - 拖拽調整
  - 規則設定
  - 批次編碼
  - 一致性檢查
- **例外處理**: 
  - 循環參照
  - 編碼衝突
  - 孤立節點
  - 規則違反

#### 品項主檔模型
```typescript
interface ItemMaster {
  id: string;
  itemCode: string;
  
  // 基本資訊
  basicInfo: {
    itemName: string;
    shortName?: string;
    description: string;
    
    type: 'product' | 'raw_material' | 'semi_finished' | 'consumable' | 'service';
    status: 'active' | 'inactive' | 'discontinued' | 'pending';
    
    category: {
      level1: string;
      level2: string;
      level3?: string;
      level4?: string;
      categoryCode: string;
    };
    
    brand?: string;
    model?: string;
    series?: string;
    
    lifecycle: {
      introducedDate?: Date;
      discontinuedDate?: Date;
      replacedBy?: string;
    };
  };
  
  // 規格屬性
  specifications: {
    physical?: {
      dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: string;
      };
      
      weight?: {
        gross: number;
        net: number;
        unit: string;
      };
      
      volume?: {
        value: number;
        unit: string;
      };
      
      color?: string;
      material?: string;
      finish?: string;
    };
    
    technical?: {
      [key: string]: {
        value: any;
        unit?: string;
        tolerance?: string;
      };
    };
    
    packaging?: {
      primaryUnit: {
        type: string;
        quantity: number;
        barcode?: string;
      };
      
      secondaryUnit?: {
        type: string;
        contains: number;
        barcode?: string;
      };
      
      palletConfig?: {
        layersPerPallet: number;
        casesPerLayer: number;
        totalCases: number;
      };
    };
    
    quality?: {
      grade?: string;
      standards?: string[];
      certifications?: string[];
      
      shelfLife?: {
        days: number;
        storageConditions: string;
      };
      
      inspection?: {
        required: boolean;
        method: string;
        frequency: string;
      };
    };
  };
  
  // 單位管理
  units: {
    baseUnit: string;
    
    conversions: {
      unit: string;
      conversionFactor: number;
      rounding: number;
      
      usage: {
        sales: boolean;
        purchase: boolean;
        stock: boolean;
        production: boolean;
      };
    }[];
    
    defaultUnits: {
      sales?: string;
      purchase?: string;
      stock?: string;
      production?: string;
    };
  };
  
  // 供應資訊
  procurement?: {
    makeOrBuy: 'make' | 'buy' | 'both';
    
    suppliers?: {
      vendorId: string;
      vendorItemCode?: string;
      preferred: boolean;
      
      leadTime: {
        normal: number;
        expedited?: number;
      };
      
      moq?: number;
      packSize?: number;
      
      pricing?: {
        currency: string;
        unitPrice: number;
        validFrom: Date;
        validTo?: Date;
      };
    }[];
    
    planning: {
      procurementType: 'stock' | 'jit' | 'mto';
      reorderPoint?: number;
      reorderQuantity?: number;
      safetyStock?: number;
      maxStock?: number;
    };
  };
  
  // 生產資訊
  production?: {
    manufacturable: boolean;
    
    bom?: {
      bomId: string;
      version: string;
      status: string;
    };
    
    routing?: {
      routingId: string;
      version: string;
      standardTime: number;
    };
    
    planning: {
      lotSize?: number;
      multipleOf?: number;
      leadTime?: number;
      safetyTime?: number;
    };
    
    costing?: {
      method: 'standard' | 'average' | 'fifo' | 'lifo';
      standardCost?: number;
      lastCost?: number;
      averageCost?: number;
    };
  };
  
  // 銷售資訊
  sales?: {
    sellable: boolean;
    
    pricing: {
      listPrice?: number;
      currency: string;
      taxable: boolean;
      taxRate?: number;
    };
    
    channels?: string[];
    territories?: string[];
    
    promotion?: {
      allowDiscount: boolean;
      maxDiscountRate?: number;
      bundleItems?: string[];
    };
    
    warranty?: {
      period: number;
      unit: 'days' | 'months' | 'years';
      terms: string;
    };
  };
  
  // 庫存管理
  inventory: {
    trackingMethod: 'none' | 'batch' | 'serial' | 'both';
    
    locations?: {
      warehouse: string;
      defaultLocation?: string;
      allowedLocations?: string[];
    };
    
    counting: {
      cycleCountFrequency?: string;
      lastCountDate?: Date;
      nextCountDate?: Date;
    };
    
    valuation: {
      method: 'standard' | 'average' | 'fifo' | 'lifo';
      currentValue?: number;
    };
  };
  
  // 條碼資訊
  barcodes?: {
    primary?: {
      type: 'ean13' | 'upc' | 'code128' | 'qr';
      value: string;
    };
    
    alternates?: {
      type: string;
      value: string;
      description?: string;
    }[];
  };
  
  // 附件資料
  attachments?: {
    images?: {
      type: 'main' | 'alternate' | 'detail' | 'package';
      url: string;
      caption?: string;
      sequence?: number;
    }[];
    
    documents?: {
      type: 'datasheet' | 'manual' | 'certificate' | 'other';
      name: string;
      url: string;
      version?: string;
    }[];
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

### FR-BDM-IIM-003: 規格屬性定義
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 產品規格設定或變更
- **行為**: 定義和管理品項規格屬性
- **資料輸入**: 
  - 屬性名稱
  - 資料類型
  - 單位設定
  - 驗證規則
  - 預設值
- **資料輸出**: 
  - 屬性模板
  - 規格表
  - 驗證結果
  - 繼承關係
  - 比較報表
- **UI反應**: 
  - 動態表單
  - 規則建構
  - 模板套用
  - 批次設定
  - 差異比較
- **例外處理**: 
  - 類型錯誤
  - 規則衝突
  - 單位不符
  - 範圍超限

#### 分類編碼模型
```typescript
interface ItemClassification {
  id: string;
  
  // 分類架構
  hierarchy: {
    level: number;
    code: string;
    name: string;
    
    parent?: string;
    children?: string[];
    
    path: string;  // 完整路徑
    
    description?: string;
    active: boolean;
  };
  
  // 編碼規則
  codingRules: {
    pattern: string;  // 正則表達式
    
    segments: {
      position: number;
      length: number;
      type: 'category' | 'sequence' | 'attribute' | 'check';
      
      meaning: string;
      
      rules?: {
        prefix?: string;
        format?: string;
        increment?: number;
        checkDigit?: boolean;
      };
    }[];
    
    example: string;
    
    validation: {
      unique: boolean;
      caseSensitive: boolean;
      allowedCharacters?: string;
    };
  };
  
  // 屬性定義
  attributes: {
    attributeId: string;
    attributeName: string;
    
    dataType: 'text' | 'number' | 'date' | 'boolean' | 'list' | 'object';
    
    constraints?: {
      required?: boolean;
      unique?: boolean;
      
      validation?: {
        min?: any;
        max?: any;
        pattern?: string;
        enum?: any[];
      };
      
      defaultValue?: any;
    };
    
    inheritance: {
      inheritable: boolean;
      overridable: boolean;
      source?: string;
    };
    
    display: {
      label: string;
      sequence: number;
      grouping?: string;
      visible: boolean;
      editable: boolean;
    };
  }[];
  
  // 應用規則
  applicationRules?: {
    autoAssign?: {
      enabled: boolean;
      conditions?: any;
    };
    
    naming?: {
      template: string;
      variables: string[];
    };
    
    approval?: {
      required: boolean;
      approvers?: string[];
    };
  };
}
```

### FR-BDM-IIM-004: 單位換算設定
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 單位定義或換算需求
- **行為**: 設定品項的單位和換算關係
- **資料輸入**: 
  - 基本單位
  - 換算單位
  - 換算係數
  - 使用場景
  - 進位規則
- **資料輸出**: 
  - 單位清單
  - 換算表
  - 應用矩陣
  - 驗證結果
  - 異常報告
- **UI反應**: 
  - 換算計算器
  - 矩陣設定
  - 場景選擇
  - 即時驗證
  - 批次轉換
- **例外處理**: 
  - 循環換算
  - 精度損失
  - 單位衝突
  - 應用錯誤

### FR-BDM-IIM-005: 條碼管理系統
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 條碼產生或掃描需求
- **行為**: 管理品項條碼的產生和應用
- **資料輸入**: 
  - 條碼類型
  - 編碼規則
  - 列印格式
  - 掃描紀錄
  - 關聯設定
- **資料輸出**: 
  - 條碼圖像
  - 標籤設計
  - 掃描歷史
  - 對應資料
  - 使用統計
- **UI反應**: 
  - 條碼產生器
  - 標籤設計器
  - 掃描介面
  - 批次列印
  - 查詢追蹤
- **例外處理**: 
  - 條碼重複
  - 格式錯誤
  - 掃描失敗
  - 列印問題

## 3. 系統設計

### 3.1 資料模型

```typescript
// 單位換算
interface UnitConversion {
  itemId: string;
  
  // 基本單位
  baseUnit: {
    code: string;
    name: string;
    symbol?: string;
    decimals: number;
  };
  
  // 換算關係
  conversions: {
    fromUnit: string;
    toUnit: string;
    
    factor: {
      multiply: number;
      divide?: number;
      offset?: number;
    };
    
    rounding: {
      method: 'round' | 'ceil' | 'floor' | 'truncate';
      precision: number;
    };
    
    bidirectional: boolean;
    
    applications: {
      context: 'sales' | 'purchase' | 'stock' | 'production' | 'all';
      preferred: boolean;
    }[];
    
    examples?: {
      from: number;
      to: number;
      calculation: string;
    }[];
  }[];
  
  // 使用規則
  usageRules?: {
    context: string;
    allowedUnits: string[];
    defaultUnit: string;
    restrictions?: string[];
  }[];
}

// 條碼管理
interface BarcodeManagement {
  id: string;
  itemId: string;
  
  // 條碼配置
  barcode: {
    type: 'ean8' | 'ean13' | 'upc_a' | 'upc_e' | 'code39' | 'code128' | 'qr' | 'datamatrix';
    value: string;
    
    encoding?: {
      charset: string;
      errorCorrection?: string;
    };
    
    format?: {
      prefix?: string;
      suffix?: string;
      checkDigit: boolean;
    };
    
    purpose: 'identification' | 'tracking' | 'pricing' | 'inventory' | 'multi';
  };
  
  // 標籤設計
  label?: {
    template: string;
    
    layout: {
      size: { width: number; height: number; unit: string; };
      orientation: 'portrait' | 'landscape';
      
      elements: {
        type: 'barcode' | 'text' | 'image' | 'line';
        position: { x: number; y: number; };
        size?: { width: number; height: number; };
        
        content?: string;
        style?: any;
      }[];
    };
    
    data: {
      field: string;
      source: string;
      format?: string;
    }[];
  };
  
  // 使用記錄
  usage?: {
    printed?: {
      count: number;
      lastPrintedAt?: Date;
      printer?: string;
    };
    
    scanned?: {
      count: number;
      lastScannedAt?: Date;
      locations?: string[];
    };
  };
  
  status: 'active' | 'inactive' | 'replaced';
  
  replacedBy?: string;
  validFrom?: Date;
  validTo?: Date;
}

// 品項變更記錄
interface ItemChangeLog {
  id: string;
  itemId: string;
  
  change: {
    timestamp: Date;
    user: string;
    
    type: 'create' | 'update' | 'delete' | 'merge' | 'split';
    
    fields: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    
    reason?: string;
    approvedBy?: string;
    
    impact?: {
      affected: string[];
      notifications: string[];
    };
  };
  
  snapshot?: {
    before?: any;
    after: any;
  };
  
  rollback?: {
    available: boolean;
    performedAt?: Date;
    performedBy?: string;
  };
}
```

### 3.2 API 設計

```typescript
// 品項管理 API
interface ItemManagementAPI {
  // 品項主檔
  POST   /api/bdm/items                       // 建立品項
  GET    /api/bdm/items                       // 查詢品項
  GET    /api/bdm/items/:id                   // 品項詳情
  PUT    /api/bdm/items/:id                   // 更新品項
  DELETE /api/bdm/items/:id                   // 刪除品項
  POST   /api/bdm/items/import                // 批次匯入
  
  // 分類編碼
  GET    /api/bdm/items/categories            // 分類架構
  POST   /api/bdm/items/categories            // 建立分類
  PUT    /api/bdm/items/categories/:id        // 更新分類
  POST   /api/bdm/items/generate-code         // 產生編碼
  
  // 規格屬性
  GET    /api/bdm/items/:id/specifications    // 規格資料
  PUT    /api/bdm/items/:id/specifications    // 更新規格
  GET    /api/bdm/items/attributes            // 屬性定義
  POST   /api/bdm/items/compare               // 規格比較
  
  // 單位換算
  GET    /api/bdm/items/:id/units             // 單位設定
  PUT    /api/bdm/items/:id/units             // 更新單位
  POST   /api/bdm/items/convert               // 單位換算
  
  // 條碼管理
  POST   /api/bdm/items/:id/barcodes          // 產生條碼
  GET    /api/bdm/items/:id/barcodes          // 條碼列表
  POST   /api/bdm/barcodes/scan               // 掃描條碼
  POST   /api/bdm/barcodes/print              // 列印標籤
}

// WebSocket 事件
interface IIMWebSocketEvents {
  'item:created': (item: any) => void;
  'item:updated': (item: any) => void;
  'category:changed': (category: any) => void;
  'barcode:scanned': (scan: any) => void;
  'specification:updated': (spec: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **IM**: 品項應用管理
- **WMS**: 庫存管理
- **OM**: 訂單處理
- **MES**: 生產管理
- **PM**: 採購作業

### 4.2 外部系統整合
- **條碼系統**: GS1標準
- **產品資料庫**: 商品資訊
- **圖片服務**: CDN存儲
- **分類標準**: 國際分類碼

## 5. 成功指標

### 5.1 業務指標
- 品項建檔時間 < 10分鐘
- 資料完整度 > 98%
- 編碼正確率 100%
- 查詢滿意度 > 95%

### 5.2 系統指標
- 查詢響應時間 < 0.5秒
- 圖片載入時間 < 2秒
- 並發處理 > 200筆
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bdm@tsaitung.com