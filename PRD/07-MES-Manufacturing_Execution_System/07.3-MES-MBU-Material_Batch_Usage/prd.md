# MES-MBU 材料與批號使用管理 (Material & Batch Usage) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: WMS (倉儲管理), IM (品項管理), QM (品質管理), MES-PSWO (生產排程)

## 1. 功能概述

### 1.1 目的
提供完整的生產材料管理與批號追蹤系統，確保材料使用的準確性、可追溯性，並優化材料損耗控制。

### 1.2 範圍
- 材料領用與發放管理
- 批號追蹤與追溯
- 材料消耗記錄
- 損耗分析與控制
- 餘料與廢料管理

### 1.3 關鍵價值
- 材料損耗率降低 30%
- 批號追溯效率提升 80%
- 庫存準確率達 99.5%
- 材料週轉率提升 25%

## 2. 功能性需求

### FR-MES-MBU-001: 材料領用管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 工單開工需要領料時
- **行為**: 掃碼領料、批次分配、數量確認
- **資料輸入**: 
  - 工單號碼
  - 材料條碼/RFID
  - 領用數量
  - 批號資訊
  - 領用人員
- **資料輸出**: 
  - 領料單號
  - 實際領用明細
  - 批號分配記錄
  - 庫存扣減確認
  - 材料位置資訊
- **UI反應**: 
  - 掃碼即時顯示
  - 批號自動建議
  - 庫存即時更新
  - 異常即時提醒
- **例外處理**: 
  - 庫存不足警告
  - 批號過期提醒
  - 替代料建議
  - 緊急調撥

#### 驗收標準
```yaml
- 條件: 掃描材料條碼進行領料
  預期結果: 0.5秒內顯示材料資訊並完成領用

- 條件: 批號即將過期材料
  預期結果: 系統優先分配並顯示過期警告

- 條件: 庫存不足時領料
  預期結果: 提示不足數量並建議替代方案
```

#### Traceability
- **測試案例**: tests/unit/FR-MES-MBU-001.test.ts
- **實作程式**: src/modules/mes/services/materialRequisition.service.ts
- **相關文件**: TOC Modules.md - Section 7.3

### FR-MES-MBU-002: 批號追蹤管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 材料使用或產品生產時
- **行為**: 記錄批號使用，建立追溯鏈
- **資料輸入**: 
  - 原料批號
  - 使用數量
  - 產品批號
  - 工序資訊
  - 時間戳記
- **資料輸出**: 
  - 批號族譜
  - 正向追溯（原料→產品）
  - 反向追溯（產品→原料）
  - 批號狀態
  - 使用歷程
- **UI反應**: 
  - 批號樹狀圖
  - 追溯路徑顯示
  - 時間軸展示
  - 快速查詢
- **例外處理**: 
  - 批號重複檢查
  - 斷鏈修復
  - 異常批號隔離

#### 批號結構定義
```typescript
interface BatchTrace {
  batchNo: string;
  type: 'raw_material' | 'wip' | 'finished_good';
  
  // 批號資訊
  info: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    manufactureDate: Date;
    expiryDate?: Date;
    supplier?: string;
  };
  
  // 追溯關係
  upstream: {
    batchNo: string;
    quantity: number;
    ratio: number;
  }[];
  
  downstream: {
    batchNo: string;
    quantity: number;
    workOrder: string;
  }[];
  
  // 使用記錄
  usage: {
    date: Date;
    operation: string;
    quantity: number;
    operator: string;
  }[];
}
```

### FR-MES-MBU-003: 材料消耗記錄
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 生產過程中材料使用
- **行為**: 自動或手動記錄材料消耗
- **資料輸入**: 
  - 工單/工序
  - 材料清單
  - 實際用量
  - 損耗數量
  - 異常原因
- **資料輸出**: 
  - 標準用量對比
  - 損耗率分析
  - 異常統計
  - 成本計算
  - 效率指標
- **UI反應**: 
  - 即時消耗顯示
  - 超標警示
  - 趨勢圖表
  - 對比分析
- **例外處理**: 
  - 超標自動預警
  - 異常原因追蹤
  - 主管審批流程

### FR-MES-MBU-004: 損耗分析與控制
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 定期分析或即時監控
- **行為**: 分析材料損耗並提供改善建議
- **資料輸入**: 
  - 歷史損耗數據
  - 標準損耗率
  - 生產參數
  - 環境因素
  - 人員技能
- **資料輸出**: 
  - 損耗趨勢分析
  - 異常點識別
  - 改善建議
  - ROI計算
  - 預測模型
- **UI反應**: 
  - 儀表板展示
  - 熱力圖分析
  - 預警通知
  - 改善追蹤

### FR-MES-MBU-005: 餘料與廢料管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 生產完成或材料剩餘時
- **行為**: 管理餘料回收和廢料處理
- **資料輸入**: 
  - 餘料類型/數量
  - 可用狀態
  - 存放位置
  - 廢料分類
  - 處理方式
- **資料輸出**: 
  - 餘料庫存
  - 回收統計
  - 廢料報表
  - 處理記錄
  - 環保報告
- **UI反應**: 
  - 餘料清單
  - 回收建議
  - 處理流程
  - 統計報表

## 3. 非功能性需求

### 3.1 效能需求
- 掃碼響應時間 < 0.5秒
- 批號查詢 < 2秒（10層追溯）
- 同時支援 100個工位操作
- 資料同步延遲 < 1秒

### 3.2 準確性需求
- 材料記錄準確率 100%
- 批號追溯完整性 100%
- 損耗計算誤差 < 0.1%
- 庫存同步準確率 99.9%

### 3.3 合規需求
- 符合 ISO 9001 品質管理
- GMP 生產規範
- 食品安全追溯要求
- 環保法規遵循

## 4. 系統設計

### 4.1 資料模型

```typescript
// 領料單
interface MaterialRequisition {
  id: string;
  requisitionNo: string;
  workOrderId: string;
  
  // 領料資訊
  info: {
    type: 'planned' | 'additional' | 'replacement';
    requestDate: Date;
    requiredDate: Date;
    workshop: string;
    workstation: string;
  };
  
  // 領料明細
  items: {
    materialId: string;
    materialCode: string;
    materialName: string;
    specification: string;
    unit: string;
    
    quantity: {
      requested: number;
      approved: number;
      issued: number;
      returned: number;
    };
    
    batches: {
      batchNo: string;
      quantity: number;
      location: string;
      expiryDate?: Date;
    }[];
  }[];
  
  // 狀態追蹤
  status: 'draft' | 'submitted' | 'approved' | 'partial' | 'completed' | 'cancelled';
  
  workflow: {
    requestedBy: string;
    requestedAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
    issuedBy?: string;
    issuedAt?: Date;
  };
}

// 材料使用記錄
interface MaterialUsage {
  id: string;
  workOrderId: string;
  operationId: string;
  
  // 使用資訊
  material: {
    id: string;
    code: string;
    name: string;
    batchNo: string;
  };
  
  // 用量記錄
  quantity: {
    standard: number;      // 標準用量
    actual: number;        // 實際用量
    waste: number;         // 損耗量
    return: number;        // 退料量
    unit: string;
  };
  
  // 損耗分析
  waste: {
    type: 'normal' | 'abnormal' | 'defect' | 'spillage';
    reason?: string;
    isRecoverable: boolean;
    recoveredQty?: number;
  };
  
  // 記錄資訊
  recordedAt: Date;
  recordedBy: string;
  verifiedBy?: string;
  
  // 成本資訊
  cost: {
    unitPrice: number;
    totalCost: number;
    wasteCost: number;
  };
}

// 批號管理
interface BatchManagement {
  id: string;
  batchNo: string;
  
  // 批號資訊
  product: {
    id: string;
    code: string;
    name: string;
    type: 'raw' | 'semi' | 'finished';
  };
  
  // 數量追蹤
  quantity: {
    initial: number;
    current: number;
    allocated: number;
    consumed: number;
    unit: string;
  };
  
  // 日期管理
  dates: {
    manufactured: Date;
    received?: Date;
    expiry?: Date;
    bestBefore?: Date;
  };
  
  // 品質資訊
  quality: {
    status: 'pending' | 'passed' | 'failed' | 'conditional';
    certificates: string[];
    testResults: any[];
    restrictions?: string[];
  };
  
  // 追溯鏈
  traceability: {
    upstream: {         // 來源
      type: 'purchase' | 'production' | 'return';
      referenceNo: string;
      batches: {
        batchNo: string;
        quantity: number;
      }[];
    };
    
    downstream: {       // 去向
      type: 'production' | 'sales' | 'scrap';
      referenceNo: string;
      quantity: number;
      date: Date;
    }[];
  };
  
  // 存儲資訊
  storage: {
    location: string;
    conditions: {
      temperature?: string;
      humidity?: string;
      special?: string[];
    };
  };
  
  status: 'active' | 'quarantine' | 'released' | 'expired' | 'scrapped';
}

// 損耗分析
interface WasteAnalysis {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // 分析維度
  dimension: {
    type: 'material' | 'product' | 'workstation' | 'operator' | 'shift';
    value: string;
  };
  
  // 損耗統計
  statistics: {
    totalProduction: number;
    totalWaste: number;
    wasteRate: number;
    
    breakdown: {
      normal: number;
      abnormal: number;
      defect: number;
      spillage: number;
      expired: number;
    };
    
    trend: {
      date: Date;
      wasteRate: number;
      quantity: number;
    }[];
  };
  
  // 原因分析
  causes: {
    reason: string;
    frequency: number;
    quantity: number;
    percentage: number;
    preventable: boolean;
  }[];
  
  // 改善建議
  improvements: {
    suggestion: string;
    expectedSaving: number;
    implementationCost: number;
    roi: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  
  // 基準對比
  benchmark: {
    industry: number;
    historical: number;
    target: number;
    gap: number;
  };
}

// 餘料管理
interface SurplusMaterial {
  id: string;
  
  // 餘料資訊
  material: {
    id: string;
    code: string;
    name: string;
    batchNo?: string;
  };
  
  // 數量與狀態
  quantity: number;
  unit: string;
  condition: 'good' | 'usable' | 'degraded';
  
  // 來源資訊
  source: {
    type: 'production' | 'return' | 'cancelled';
    referenceNo: string;
    date: Date;
  };
  
  // 處置方式
  disposition: {
    status: 'pending' | 'reuse' | 'recycle' | 'dispose';
    method?: 'return_to_stock' | 'use_in_production' | 'sell' | 'scrap';
    approvedBy?: string;
    processedAt?: Date;
  };
  
  // 存放資訊
  storage: {
    location: string;
    duration: number;
    expiryDate?: Date;
  };
  
  // 價值評估
  valuation: {
    originalCost: number;
    currentValue: number;
    salvageValue: number;
  };
}
```

### 4.2 API 設計

```typescript
// 材料領用 API
interface MaterialRequisitionAPI {
  // 領料管理
  POST   /api/mes/requisitions                    // 建立領料單
  GET    /api/mes/requisitions                    // 查詢領料單
  GET    /api/mes/requisitions/:id                // 領料單詳情
  PUT    /api/mes/requisitions/:id                // 更新領料單
  POST   /api/mes/requisitions/:id/approve        // 審批領料
  POST   /api/mes/requisitions/:id/issue          // 發料確認
  POST   /api/mes/requisitions/:id/return         // 退料
  
  // 掃碼操作
  POST   /api/mes/materials/scan                  // 掃碼領料
  POST   /api/mes/materials/batch-scan            // 批量掃碼
  GET    /api/mes/materials/suggestions           // 領料建議
}

// 批號管理 API
interface BatchManagementAPI {
  // 批號操作
  POST   /api/mes/batches                         // 建立批號
  GET    /api/mes/batches                         // 查詢批號
  GET    /api/mes/batches/:batchNo                // 批號詳情
  POST   /api/mes/batches/:batchNo/split          // 批號分割
  POST   /api/mes/batches/merge                   // 批號合併
  
  // 追溯查詢
  GET    /api/mes/batches/:batchNo/trace-forward  // 正向追溯
  GET    /api/mes/batches/:batchNo/trace-backward // 反向追溯
  GET    /api/mes/batches/:batchNo/genealogy      // 批號族譜
  
  // 批號狀態
  PUT    /api/mes/batches/:batchNo/status         // 更新狀態
  POST   /api/mes/batches/:batchNo/quarantine     // 隔離批號
  POST   /api/mes/batches/:batchNo/release        // 釋放批號
}

// 材料消耗 API
interface MaterialConsumptionAPI {
  // 消耗記錄
  POST   /api/mes/consumption                     // 記錄消耗
  GET    /api/mes/consumption                     // 查詢消耗
  GET    /api/mes/consumption/summary             // 消耗匯總
  
  // 損耗分析
  GET    /api/mes/waste/analysis                  // 損耗分析
  GET    /api/mes/waste/trends                    // 損耗趨勢
  GET    /api/mes/waste/causes                    // 原因分析
  POST   /api/mes/waste/improvements              // 改善建議
  
  // 餘料管理
  POST   /api/mes/surplus                         // 登記餘料
  GET    /api/mes/surplus                         // 查詢餘料
  POST   /api/mes/surplus/:id/dispose             // 處置餘料
}

// 報表 API
interface MaterialReportAPI {
  GET    /api/mes/reports/material-usage          // 材料使用報表
  GET    /api/mes/reports/batch-trace             // 批號追溯報表
  GET    /api/mes/reports/waste-analysis          // 損耗分析報表
  GET    /api/mes/reports/inventory-accuracy      // 庫存準確率報表
}

// WebSocket 事件
interface MaterialWebSocketEvents {
  // 領料事件
  'requisition:created': (requisition: any) => void;
  'requisition:approved': (requisitionId: string) => void;
  'material:issued': (material: any) => void;
  
  // 批號事件
  'batch:created': (batch: any) => void;
  'batch:consumed': (consumption: any) => void;
  'batch:expired': (batchNo: string) => void;
  
  // 異常事件
  'waste:exceeded': (alert: any) => void;
  'stock:shortage': (material: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **WMS**: 庫存同步、位置管理
- **MES-PSWO**: 工單領料需求
- **IM**: 材料主檔、BOM資訊
- **QM**: 品質檢驗、批號放行
- **FA**: 成本核算

### 5.2 硬體整合
- **條碼掃描器**: 材料識別
- **RFID讀取器**: 批量識別
- **電子秤**: 重量確認
- **標籤列印機**: 批號標籤

## 6. 測試需求

### 6.1 功能測試
- 領料流程完整性
- 批號追溯準確性
- 損耗計算正確性
- 庫存同步一致性

### 6.2 效能測試
- 1000筆/秒掃碼處理
- 10層批號追溯查詢
- 100個工位併發操作
- 實時庫存更新

### 6.3 整合測試
- WMS庫存扣減
- 工單領料整合
- 批號品質關聯
- 成本自動計算

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 基礎架構與領料功能
2. **Phase 2** (Week 3-4): 批號管理與追溯
3. **Phase 3** (Week 5-6): 損耗分析功能
4. **Phase 4** (Week 7): 餘料管理
5. **Phase 5** (Week 8): 系統整合測試

### 7.2 關鍵里程碑
- M1: 領料功能上線
- M2: 批號追溯完成
- M3: 損耗分析實作
- M4: 系統整合完成
- M5: 全面上線

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 掃碼設備相容性 | 高 | 中 | 支援多種掃碼協議 |
| 批號資料量大 | 高 | 高 | 採用分區存儲策略 |
| 即時同步延遲 | 中 | 中 | 使用訊息佇列緩衝 |
| 使用者操作錯誤 | 中 | 高 | 加強防呆設計 |

## 9. 成功指標

### 9.1 業務指標
- 材料損耗率 ≤ 2%
- 批號追溯時間 ≤ 30秒
- 庫存準確率 ≥ 99.5%
- 領料效率提升 ≥ 50%

### 9.2 系統指標
- 掃碼成功率 ≥ 99%
- 系統可用性 ≥ 99.5%
- 資料完整性 100%
- 回應時間 < 1秒

## 10. 相關文件

- [MES 總體架構](../README.md)
- [WMS 庫存管理](../../08-WMS-Warehouse_Management_System/README.md)
- [品質管理 PRD](../../10-QM-Quality_Management/README.md)
- [批號追溯標準](../../docs/standards/batch-traceability.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: mes@tsaitung.com