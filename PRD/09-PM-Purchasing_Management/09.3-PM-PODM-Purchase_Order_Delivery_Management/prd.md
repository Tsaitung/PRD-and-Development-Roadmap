# PM-PODM 採購單與交期管理 (Purchase Order & Delivery Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM-SRM (供應商管理), PM-CPM (合約管理), WMS (倉儲管理), FA (財務會計)

## 1. 功能概述

### 1.1 目的
建立智慧化採購單管理系統，自動化採購流程，優化交期管理，確保物料供應穩定，降低庫存成本，提升採購效率。

### 1.2 範圍
- 採購需求管理
- 採購單創建與審批
- 交期追蹤與管理
- 供應商協同
- 採購績效分析

### 1.3 關鍵價值
- 採購週期縮短 50%
- 準時交貨率提升至 95%
- 庫存成本降低 20%
- 採購效率提升 40%

## 2. 功能性需求

### FR-PM-PODM-001: 採購需求管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 庫存低於安全水位或生產需求產生
- **行為**: 自動產生或手動建立採購需求
- **資料輸入**: 
  - 需求來源（MRP、手動、安全庫存）
  - 物料清單
  - 需求數量
  - 需求日期
  - 優先級別
- **資料輸出**: 
  - 採購申請單
  - 建議供應商
  - 預估成本
  - 交期評估
  - 審批流程
- **UI反應**: 
  - 需求看板
  - 批量處理
  - 智慧建議
  - 快速審批
  - 狀態追蹤
- **例外處理**: 
  - 緊急需求處理
  - 替代料建議
  - 合併需求
  - 分批採購

#### 驗收標準
```yaml
- 條件: MRP產生採購需求
  預期結果: 自動匹配供應商並生成採購建議

- 條件: 多部門相同物料需求
  預期結果: 智慧合併需求並優化採購數量

- 條件: 緊急採購需求
  預期結果: 觸發快速審批流程並通知相關人員
```

#### Traceability
- **測試案例**: tests/unit/FR-PM-PODM-001.test.ts
- **實作程式**: src/modules/pm/services/purchaseRequirement.service.ts
- **相關文件**: TOC Modules.md - Section 9.3

### FR-PM-PODM-002: 採購單管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 採購需求審批通過
- **行為**: 創建、維護、追蹤採購單全生命週期
- **資料輸入**: 
  - 供應商資訊
  - 採購項目明細
  - 價格條款
  - 交貨條件
  - 付款條件
- **資料輸出**: 
  - 採購單號
  - 訂單確認
  - 交期確認
  - 發票對應
  - 結案報告
- **UI反應**: 
  - 訂單創建嚮導
  - 範本套用
  - 電子簽核
  - 狀態看板
  - 變更追蹤
- **例外處理**: 
  - 訂單變更控制
  - 取消處理
  - 部分交貨
  - 爭議處理

#### 採購單資料結構
```typescript
interface PurchaseOrder {
  id: string;
  poNumber: string;
  
  // 基本資訊
  basicInfo: {
    type: 'standard' | 'blanket' | 'contract' | 'planned';
    category: string;
    description: string;
    requisitionId?: string;
    contractId?: string;
    projectId?: string;
  };
  
  // 供應商資訊
  supplier: {
    supplierId: string;
    name: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    address: Address;
  };
  
  // 採購明細
  items: {
    lineNo: number;
    itemId: string;
    itemCode: string;
    itemName: string;
    specification: string;
    
    // 數量與單位
    quantity: {
      ordered: number;
      unit: string;
      received: number;
      cancelled: number;
      returned: number;
    };
    
    // 價格資訊
    pricing: {
      unitPrice: number;
      currency: string;
      discount: number;
      tax: number;
      totalAmount: number;
    };
    
    // 交期資訊
    delivery: {
      requestedDate: Date;
      promisedDate: Date;
      actualDate?: Date;
      location: string;
      terms: string;
    };
    
    // 品質要求
    quality: {
      specification: string;
      certRequired: boolean;
      inspectionLevel: string;
    };
    
    status: 'open' | 'partial' | 'received' | 'cancelled';
  }[];
  
  // 商業條款
  terms: {
    payment: {
      terms: string;
      method: string;
      currency: string;
      exchangeRate?: number;
    };
    
    delivery: {
      incoterms: string;
      carrier?: string;
      insurance?: boolean;
      packingRequirements?: string;
    };
    
    warranty: {
      period: number;
      terms: string;
    };
  };
  
  // 金額匯總
  amount: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
  };
  
  // 審批資訊
  approval: {
    required: boolean;
    level: number;
    approvers: {
      userId: string;
      name: string;
      role: string;
      status: 'pending' | 'approved' | 'rejected';
      date?: Date;
      comments?: string;
    }[];
  };
  
  // 狀態管理
  status: {
    current: 'draft' | 'pending_approval' | 'approved' | 'sent' | 
             'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
    delivery: 'not_started' | 'partial' | 'completed';
    payment: 'unpaid' | 'partial' | 'paid';
    quality: 'pending' | 'passed' | 'failed' | 'waived';
  };
  
  // 相關文件
  documents: {
    requisition?: Document;
    quotation?: Document;
    confirmation?: Document;
    packingList?: Document[];
    invoice?: Document[];
    others?: Document[];
  };
  
  // 追蹤資訊
  tracking: {
    createdBy: string;
    createdAt: Date;
    sentAt?: Date;
    acknowledgedAt?: Date;
    completedAt?: Date;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
  };
}
```

### FR-PM-PODM-003: 交期管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 採購單發出後的交期追蹤
- **行為**: 主動追蹤和管理供應商交期
- **資料輸入**: 
  - 承諾交期
  - 出貨通知
  - 運輸資訊
  - 到貨預告
  - 延遲原因
- **資料輸出**: 
  - 交期看板
  - 延遲預警
  - 到貨計劃
  - 績效報告
  - 改善建議
- **UI反應**: 
  - 時間軸顯示
  - 預警通知
  - 進度更新
  - 協同平台
  - 績效儀表板
- **例外處理**: 
  - 延遲處理
  - 加急協調
  - 部分交貨
  - 替代方案

#### 交期追蹤系統
```typescript
interface DeliveryTracking {
  id: string;
  poNumber: string;
  
  // 交期計劃
  deliveryPlan: {
    originalDate: Date;
    currentDate: Date;
    confirmedDate?: Date;
    
    milestones: {
      name: string;
      plannedDate: Date;
      actualDate?: Date;
      status: 'pending' | 'completed' | 'delayed';
      responsible: string;
    }[];
  };
  
  // 出貨資訊
  shipment: {
    shipmentNo?: string;
    shipDate?: Date;
    carrier?: string;
    trackingNo?: string;
    
    packages: {
      packageNo: string;
      items: string[];
      weight: number;
      dimensions: string;
    }[];
    
    documents: {
      packingList?: string;
      invoice?: string;
      waybill?: string;
      certificate?: string;
    };
  };
  
  // 運輸追蹤
  transportation: {
    mode: 'air' | 'sea' | 'land' | 'express';
    route: {
      origin: string;
      destination: string;
      transitPoints?: string[];
    };
    
    currentLocation?: string;
    estimatedArrival?: Date;
    
    events: {
      timestamp: Date;
      location: string;
      event: string;
      description: string;
    }[];
  };
  
  // 風險評估
  riskAssessment: {
    delayRisk: 'low' | 'medium' | 'high';
    reasons?: string[];
    impact?: string;
    mitigation?: string;
  };
  
  // 通知設定
  notifications: {
    recipients: string[];
    events: string[];
    frequency: string;
    lastNotified?: Date;
  };
}
```

### FR-PM-PODM-004: 供應商協同
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 採購單需要供應商確認或更新
- **行為**: 提供供應商協同平台進行訊息交換
- **資料輸入**: 
  - 訂單確認
  - 交期回覆
  - 出貨通知
  - 問題回報
  - 文件上傳
- **資料輸出**: 
  - 協同記錄
  - 狀態同步
  - 通知提醒
  - 績效評分
  - 改善追蹤
- **UI反應**: 
  - 供應商入口
  - 訊息中心
  - 文件交換
  - 即時通訊
  - 協同看板
- **例外處理**: 
  - 爭議協調
  - 變更管理
  - 授權控制
  - 資料安全

### FR-PM-PODM-005: 採購績效分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期或即時查看採購績效
- **行為**: 分析採購績效並提供改善建議
- **資料輸入**: 
  - 採購數據
  - 交期記錄
  - 成本資訊
  - 品質數據
  - 供應商評分
- **資料輸出**: 
  - KPI儀表板
  - 趨勢分析
  - 供應商排名
  - 成本節省
  - 改善機會
- **UI反應**: 
  - 互動圖表
  - 下鑽分析
  - 自訂報表
  - 匯出功能
  - 分享機制
- **例外處理**: 
  - 數據異常
  - 指標預警
  - 自動報告
  - 行動建議

## 3. 非功能性需求

### 3.1 效能需求
- 採購單創建 < 3秒
- 查詢響應 < 1秒
- 支援 1000+ 並發採購單
- 批量處理 500+ 項目

### 3.2 可靠性需求
- 系統可用性 99.9%
- 資料一致性 100%
- 自動備份機制
- 災難恢復 < 4小時

### 3.3 整合需求
- ERP即時同步
- 供應商系統介接
- 物流追蹤整合
- 財務系統連動

## 4. 系統設計

### 4.1 資料模型

```typescript
// 採購申請
interface PurchaseRequisition {
  id: string;
  requisitionNo: string;
  
  // 需求資訊
  requirement: {
    type: 'material' | 'service' | 'asset';
    source: 'mrp' | 'manual' | 'reorder' | 'project';
    urgency: 'normal' | 'urgent' | 'emergency';
    reason: string;
  };
  
  // 申請明細
  items: {
    itemId: string;
    description: string;
    specification: string;
    quantity: number;
    unit: string;
    requiredDate: Date;
    estimatedPrice?: number;
    suggestedSupplier?: string;
    remarks?: string;
  }[];
  
  // 申請人資訊
  requester: {
    userId: string;
    name: string;
    department: string;
    costCenter: string;
    contactInfo: string;
  };
  
  // 審批流程
  approval: {
    required: boolean;
    workflow: string;
    currentLevel: number;
    history: ApprovalHistory[];
  };
  
  // 處理狀態
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 
          'converted' | 'cancelled';
  
  // 轉換資訊
  conversion: {
    poNumbers?: string[];
    convertedBy?: string;
    convertedAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 收貨記錄
interface GoodsReceipt {
  id: string;
  receiptNo: string;
  poNumber: string;
  
  // 收貨資訊
  receipt: {
    date: Date;
    type: 'full' | 'partial' | 'return';
    warehouse: string;
    receivedBy: string;
  };
  
  // 收貨明細
  items: {
    poLineNo: number;
    itemId: string;
    
    quantity: {
      shipped: number;
      received: number;
      accepted: number;
      rejected: number;
      damaged: number;
    };
    
    quality: {
      inspected: boolean;
      result?: 'pass' | 'fail' | 'conditional';
      defects?: string[];
      certificate?: string;
    };
    
    storage: {
      location: string;
      batchNo?: string;
      serialNo?: string[];
      expiryDate?: Date;
    };
  }[];
  
  // 差異處理
  discrepancy?: {
    hasDiscrepancy: boolean;
    type?: string[];
    description?: string;
    resolution?: string;
    approvedBy?: string;
  };
  
  // 相關文件
  documents: {
    deliveryNote?: string;
    packingList?: string;
    qualityCert?: string;
    photos?: string[];
  };
  
  status: 'pending' | 'completed' | 'disputed';
  completedAt?: Date;
}

// 採購績效指標
interface PurchasePerformance {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // 效率指標
  efficiency: {
    avgLeadTime: number;          // 平均採購週期
    avgProcessTime: number;       // 平均處理時間
    automationRate: number;       // 自動化率
    firstTimeRight: number;       // 首次正確率
  };
  
  // 成本指標
  cost: {
    totalSpend: number;           // 總支出
    savingsAchieved: number;      // 實現節省
    savingsRate: number;          // 節省率
    priceVariance: number;        // 價格差異
    maverick: number;             // 違規採購率
  };
  
  // 品質指標
  quality: {
    supplierDefectRate: number;   // 供應商缺陷率
    returnRate: number;           // 退貨率
    qualityScore: number;         // 品質分數
  };
  
  // 交期指標
  delivery: {
    onTimeDelivery: number;       // 準時交貨率
    fullDelivery: number;         // 完整交貨率
    avgDelayDays: number;         // 平均延遲天數
  };
  
  // 供應商指標
  supplier: {
    activeSuppliers: number;      // 活躍供應商數
    newSuppliers: number;         // 新供應商數
    avgScore: number;             // 平均評分
    concentration: number;        // 集中度
  };
  
  // 合規指標
  compliance: {
    contractCompliance: number;   // 合約遵循率
    policyCompliance: number;     // 政策遵循率
    documentCompliance: number;   // 文件完整率
  };
  
  calculatedAt: Date;
}
```

### 4.2 API 設計

```typescript
// 採購單管理 API
interface PurchaseOrderAPI {
  // 採購單操作
  POST   /api/pm/purchase-orders                // 建立採購單
  GET    /api/pm/purchase-orders                // 查詢採購單
  GET    /api/pm/purchase-orders/:id            // 取得詳情
  PUT    /api/pm/purchase-orders/:id            // 更新採購單
  POST   /api/pm/purchase-orders/:id/approve    // 審批
  POST   /api/pm/purchase-orders/:id/send       // 發送供應商
  POST   /api/pm/purchase-orders/:id/cancel     // 取消
  
  // 採購申請
  POST   /api/pm/requisitions                   // 建立申請
  GET    /api/pm/requisitions                   // 查詢申請
  POST   /api/pm/requisitions/:id/convert       // 轉換為採購單
}

// 交期管理 API
interface DeliveryManagementAPI {
  // 交期追蹤
  GET    /api/pm/delivery/tracking/:poNumber    // 追蹤交期
  POST   /api/pm/delivery/update                // 更新交期
  GET    /api/pm/delivery/forecast              // 交期預測
  
  // 出貨通知
  POST   /api/pm/delivery/asn                   // 預先出貨通知
  GET    /api/pm/delivery/asn/:id               // 查詢ASN
  
  // 收貨處理
  POST   /api/pm/receipts                       // 登記收貨
  GET    /api/pm/receipts/:id                   // 收貨詳情
  POST   /api/pm/receipts/:id/inspect           // 品質檢驗
}

// 供應商協同 API
interface SupplierCollaborationAPI {
  // 訂單確認
  POST   /api/pm/collaboration/confirm          // 確認訂單
  POST   /api/pm/collaboration/update           // 更新狀態
  
  // 訊息交換
  POST   /api/pm/collaboration/message          // 發送訊息
  GET    /api/pm/collaboration/messages         // 查詢訊息
  
  // 文件管理
  POST   /api/pm/collaboration/documents        // 上傳文件
  GET    /api/pm/collaboration/documents        // 查詢文件
}

// 績效分析 API
interface PerformanceAnalyticsAPI {
  // KPI查詢
  GET    /api/pm/analytics/kpi                  // KPI總覽
  GET    /api/pm/analytics/trends               // 趨勢分析
  GET    /api/pm/analytics/supplier-ranking     // 供應商排名
  
  // 報表生成
  POST   /api/pm/analytics/reports              // 生成報表
  GET    /api/pm/analytics/reports/:id          // 查詢報表
}

// WebSocket 事件
interface PurchaseWebSocketEvents {
  // 採購單事件
  'po:created': (po: PurchaseOrder) => void;
  'po:approved': (po: PurchaseOrder) => void;
  'po:confirmed': (confirmation: any) => void;
  
  // 交期事件
  'delivery:delayed': (delay: any) => void;
  'delivery:shipped': (shipment: any) => void;
  'delivery:received': (receipt: any) => void;
  
  // 協同事件
  'supplier:message': (message: any) => void;
  'supplier:update': (update: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **MRP系統**: 需求來源
- **WMS**: 收貨入庫
- **QM**: 品質檢驗
- **FA**: 發票對帳
- **PM-SRM**: 供應商資訊

### 5.2 外部系統整合
- **供應商平台**: 訂單交換
- **物流系統**: 運輸追蹤
- **銀行系統**: 付款處理
- **海關系統**: 進口清關

## 6. 測試需求

### 6.1 功能測試
- 採購流程完整性
- 審批邏輯正確性
- 交期計算準確性
- 協同功能測試

### 6.2 效能測試
- 大量採購單處理
- 並發審批測試
- 報表生成效能
- 查詢響應速度

### 6.3 整合測試
- MRP轉採購單
- 收貨入庫流程
- 供應商協同
- 財務結算流程

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 採購需求與申請管理
2. **Phase 2** (Week 3-4): 採購單核心功能
3. **Phase 3** (Week 5): 交期管理系統
4. **Phase 4** (Week 6): 供應商協同平台
5. **Phase 5** (Week 7): 績效分析與報表

### 7.2 關鍵里程碑
- M1: 需求管理完成
- M2: 採購單功能上線
- M3: 交期系統啟用
- M4: 協同平台運行
- M5: 全面整合完成

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 供應商整合困難 | 高 | 中 | 提供標準API，分階段實施 |
| 數據移轉複雜 | 高 | 高 | 詳細規劃，保留舊系統 |
| 流程變更阻力 | 中 | 中 | 充分培訓，漸進式推行 |
| 系統效能問題 | 中 | 低 | 效能測試，優化設計 |

## 9. 成功指標

### 9.1 業務指標
- 採購週期 ≤ 3天
- 準時交貨率 ≥ 95%
- 庫存週轉率提升 ≥ 20%
- 採購成本降低 ≥ 10%

### 9.2 系統指標
- 系統可用性 ≥ 99.9%
- 平均響應時間 < 1秒
- 自動化率 ≥ 70%
- 使用者滿意度 ≥ 85%

## 10. 相關文件

- [PM 總體架構](../README.md)
- [供應商管理 PRD](../09.1-PM-SRM-Supplier_Relationship_Management/prd.md)
- [合約管理 PRD](../09.2-PM-CPM-Contract_Pricing_Management/prd.md)
- [採購最佳實踐](../../docs/best-practices/procurement.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: pm@tsaitung.com