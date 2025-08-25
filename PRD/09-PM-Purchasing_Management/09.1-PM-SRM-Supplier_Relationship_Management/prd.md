# PM-SRM 供應商關係管理 (Supplier Relationship Management) PRD

## 文件資訊
- **版本**: v1.0.0  
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM-CPM (合約管理), PM-PODM (採購單管理), FA (財務會計), QM (品質管理)

## 1. 功能概述

### 1.1 目的
建立完整的供應商生命週期管理系統，從供應商引入、評估、合作到績效管理，優化供應鏈效率，降低採購成本，確保供應穩定性。

### 1.2 範圍
- 供應商主檔管理
- 供應商評估與認證
- 績效監控與評分
- 供應商分級管理
- 風險評估與管理

### 1.3 關鍵價值
- 採購成本降低 15%
- 供應商交期準確率提升至 95%
- 供應鏈風險降低 40%
- 供應商管理效率提升 60%

## 2. 功能性需求

### FR-PM-SRM-SMO-001: 供應商總覽管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 進入供應商管理主頁
- **行為**: 展示供應商全景視圖與關鍵指標
- **資料輸入**: 
  - 供應商類別篩選
  - 時間範圍選擇
  - 績效指標選擇
  - 風險等級過濾
  - 認證狀態篩選
- **資料輸出**: 
  - 供應商統計總覽
  - 績效排行榜
  - 風險分布圖
  - 採購金額分析
  - 問題供應商清單
- **UI反應**: 
  - 儀表板即時更新
  - 互動式圖表
  - 下鑽式分析
  - 快速操作入口
  - 異常高亮顯示
- **例外處理**: 
  - 資料載入失敗重試
  - 異常數據標記
  - 權限不足提示
  - 快取機制

#### 驗收標準
```yaml
- 條件: 載入供應商總覽頁面
  預期結果: 2秒內顯示完整儀表板

- 條件: 篩選高風險供應商
  預期結果: 即時顯示風險供應商清單與詳情

- 條件: 查看績效趨勢
  預期結果: 顯示6個月績效變化趨勢圖
```

#### Traceability
- **測試案例**: tests/unit/FR-PM-SRM-SMO-001.test.ts
- **實作程式**: src/modules/pm/services/supplierOverview.service.ts
- **相關文件**: TOC Modules.md - Section 9.1.1

### FR-PM-SRM-SL-002: 供應商清單管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 管理供應商主檔資料
- **行為**: 建立、維護、查詢供應商資訊
- **資料輸入**: 
  - 基本資訊（名稱、統編、地址）
  - 聯絡資訊（聯絡人、電話、Email）
  - 商業資訊（資本額、員工數、產能）
  - 認證資訊（ISO、證書、有效期）
  - 銀行資訊（帳戶、付款條件）
- **資料輸出**: 
  - 供應商編號
  - 完整供應商檔案
  - 歷史交易記錄
  - 評估報告
  - 風險評級
- **UI反應**: 
  - 分頁列表顯示
  - 進階搜尋功能
  - 批量操作支援
  - 匯入匯出功能
  - 詳情快速預覽
- **例外處理**: 
  - 重複供應商檢查
  - 必填欄位驗證
  - 統編驗證
  - 資料完整性檢查

#### 供應商資料結構
```typescript
interface Supplier {
  id: string;
  code: string;
  
  // 基本資訊
  basicInfo: {
    name: string;
    englishName?: string;
    taxId: string;
    registrationNo?: string;
    establishedDate?: Date;
    capital?: number;
    employeeCount?: number;
    website?: string;
  };
  
  // 地址資訊
  addresses: {
    type: 'registered' | 'business' | 'shipping';
    country: string;
    city: string;
    district: string;
    street: string;
    postalCode: string;
    isDefault: boolean;
  }[];
  
  // 聯絡人資訊
  contacts: {
    name: string;
    title: string;
    department: string;
    phone: string;
    mobile: string;
    email: string;
    isPrimary: boolean;
  }[];
  
  // 商業條件
  businessTerms: {
    currency: string;
    paymentTerms: string;
    creditLimit: number;
    leadTime: number;
    moq?: number;
    incoterms?: string;
  };
  
  // 分類與標籤
  classification: {
    type: 'manufacturer' | 'trader' | 'service' | 'logistics';
    categories: string[];
    tags: string[];
    tier: 'strategic' | 'preferred' | 'approved' | 'conditional';
  };
  
  // 認證資訊
  certifications: {
    type: string;
    number: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate: Date;
    document?: string;
  }[];
  
  // 評估資訊
  evaluation: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D';
    lastEvaluated: Date;
    nextEvaluation: Date;
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  status: 'active' | 'inactive' | 'blacklisted' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}
```

### FR-PM-SRM-LMR-003: 損耗管理與退貨
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 發生採購損耗或需要退貨時
- **行為**: 記錄損耗、處理退貨、分析原因
- **資料輸入**: 
  - 損耗類型與數量
  - 退貨原因與批號
  - 責任歸屬
  - 處理方式
  - 賠償要求
- **資料輸出**: 
  - 損耗統計報表
  - 退貨處理單
  - 供應商扣款單
  - 改善追蹤表
  - 損耗趨勢分析
- **UI反應**: 
  - 快速登記介面
  - 照片上傳功能
  - 審批流程顯示
  - 統計圖表
  - 預警提醒
- **例外處理**: 
  - 超標自動預警
  - 責任爭議處理
  - 證據保全
  - 升級機制

### FR-PM-SRM-SA-004: 供應商帳務管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 處理供應商相關財務事項
- **行為**: 管理應付帳款、對帳、付款
- **資料輸入**: 
  - 採購發票
  - 付款申請
  - 對帳單
  - 扣款項目
  - 預付款
- **資料輸出**: 
  - 應付帳款明細
  - 付款排程
  - 對帳差異報告
  - 帳齡分析
  - 現金流預測
- **UI反應**: 
  - 帳務儀表板
  - 付款日曆
  - 對帳工作台
  - 異常提醒
  - 批次處理
- **例外處理**: 
  - 發票異常處理
  - 超額付款控制
  - 重複付款檢查
  - 匯率差異處理

### FR-PM-SRM-RS-005: 審核與評分
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期評估或特殊事件觸發
- **行為**: 執行供應商績效評估與評分
- **資料輸入**: 
  - 評估維度設定
  - 評分標準
  - 實際績效數據
  - 問題記錄
  - 改善計劃
- **資料輸出**: 
  - 評估報告
  - 績效分數
  - 等級評定
  - 改善建議
  - 獎懲決定
- **UI反應**: 
  - 評估表單
  - 評分卡
  - 雷達圖分析
  - 歷史對比
  - 審批流程
- **例外處理**: 
  - 評分爭議處理
  - 複評機制
  - 申訴流程
  - 第三方審核

#### 評估指標體系
```typescript
interface SupplierEvaluation {
  id: string;
  supplierId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // 評估維度
  dimensions: {
    // 品質維度 (30%)
    quality: {
      weight: 0.3;
      metrics: {
        defectRate: number;      // 不良率
        returnRate: number;      // 退貨率
        certCompliance: number;  // 認證符合度
        improvement: number;     // 品質改善
      };
      score: number;
    };
    
    // 交期維度 (25%)
    delivery: {
      weight: 0.25;
      metrics: {
        onTimeRate: number;      // 準時交貨率
        flexibilityRate: number; // 彈性響應率
        leadTimeStability: number; // 交期穩定性
        urgentResponse: number;  // 緊急響應
      };
      score: number;
    };
    
    // 成本維度 (20%)
    cost: {
      weight: 0.2;
      metrics: {
        priceCompetitiveness: number; // 價格競爭力
        costReduction: number;   // 成本降低
        paymentTerms: number;    // 付款條件
        valueAdded: number;      // 附加價值
      };
      score: number;
    };
    
    // 服務維度 (15%)
    service: {
      weight: 0.15;
      metrics: {
        responseTime: number;    // 響應時間
        technicalSupport: number; // 技術支援
        communication: number;   // 溝通效率
        problemSolving: number;  // 問題解決
      };
      score: number;
    };
    
    // 創新維度 (10%)
    innovation: {
      weight: 0.1;
      metrics: {
        newProducts: number;     // 新產品開發
        processImprovement: number; // 流程改善
        sustainability: number;  // 永續發展
        digitalization: number;  // 數位化程度
      };
      score: number;
    };
  };
  
  // 總體評分
  overall: {
    score: number;           // 加權總分
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    ranking: number;         // 排名
    trend: 'up' | 'stable' | 'down';
  };
  
  // 問題與改善
  issues: {
    description: string;
    severity: 'critical' | 'major' | 'minor';
    deadline: Date;
    status: 'open' | 'in_progress' | 'closed';
  }[];
  
  // 決策建議
  recommendations: {
    action: 'maintain' | 'develop' | 'improve' | 'replace';
    reasons: string[];
    plans: string[];
  };
  
  evaluatedBy: string;
  evaluatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}
```

## 3. 非功能性需求

### 3.1 效能需求
- 供應商搜尋 < 1秒
- 評估報告生成 < 5秒
- 支援 10,000+ 供應商
- 並發使用者 100+

### 3.2 安全需求
- 供應商資料加密
- 存取權限控制
- 審計日誌記錄
- 敏感資訊遮罩

### 3.3 整合需求
- ERP 系統整合
- 銀行系統介接
- 信用查詢服務
- 電子發票平台

## 4. 系統設計

### 4.1 資料模型

```typescript
// 供應商交易記錄
interface SupplierTransaction {
  id: string;
  supplierId: string;
  
  // 交易資訊
  transaction: {
    type: 'purchase' | 'return' | 'payment';
    referenceNo: string;
    date: Date;
    amount: number;
    currency: string;
  };
  
  // 採購資訊
  purchase?: {
    poNumber: string;
    items: {
      itemCode: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[];
    deliveryDate: Date;
    actualDelivery?: Date;
  };
  
  // 品質記錄
  quality?: {
    inspectionDate: Date;
    passRate: number;
    defects: {
      type: string;
      quantity: number;
    }[];
  };
  
  // 付款記錄
  payment?: {
    invoiceNo: string;
    dueDate: Date;
    paidDate?: Date;
    method: string;
    discount?: number;
  };
  
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

// 供應商風險評估
interface SupplierRisk {
  id: string;
  supplierId: string;
  
  // 風險類別
  risks: {
    // 財務風險
    financial: {
      creditRating: string;
      debtRatio: number;
      cashFlow: 'positive' | 'negative';
      bankruptcyRisk: number;
    };
    
    // 營運風險
    operational: {
      dependencyLevel: number;
      alternativeSuppliers: number;
      capacityUtilization: number;
      disruptionHistory: number;
    };
    
    // 合規風險
    compliance: {
      certificationStatus: 'valid' | 'expiring' | 'expired';
      regulatoryIssues: number;
      auditFindings: number;
      ethicalConcerns: boolean;
    };
    
    // 地緣風險
    geographical: {
      politicalStability: number;
      naturalDisasterRisk: number;
      logisticsReliability: number;
      tradeRestrictions: boolean;
    };
  };
  
  // 整體風險評級
  overall: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    trend: 'improving' | 'stable' | 'worsening';
  };
  
  // 緩解措施
  mitigation: {
    strategy: string;
    actions: string[];
    contingencyPlan: string;
    responsiblePerson: string;
  };
  
  assessedAt: Date;
  nextAssessment: Date;
}

// 供應商合作協議
interface SupplierAgreement {
  id: string;
  supplierId: string;
  
  // 協議資訊
  agreement: {
    type: 'purchase' | 'framework' | 'consignment' | 'vmi';
    number: string;
    title: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  };
  
  // 商業條款
  terms: {
    minimumOrder: number;
    maximumOrder?: number;
    annualVolume?: number;
    priceValidity: number;
    priceAdjustment: string;
  };
  
  // 服務等級協議
  sla: {
    deliveryTime: number;
    qualityStandard: string;
    defectRate: number;
    responseTime: number;
    penalties: {
      condition: string;
      penalty: string;
    }[];
  };
  
  // 特殊條款
  special: {
    exclusivity?: boolean;
    confidentiality: boolean;
    intellectualProperty?: string;
    forceMajeure: string;
  };
  
  status: 'draft' | 'active' | 'expired' | 'terminated';
  signedBy: {
    supplier: string;
    company: string;
  };
  signedAt: Date;
}
```

### 4.2 API 設計

```typescript
// 供應商管理 API
interface SupplierManagementAPI {
  // 供應商主檔
  POST   /api/pm/suppliers                       // 建立供應商
  GET    /api/pm/suppliers                       // 查詢供應商列表
  GET    /api/pm/suppliers/:id                   // 取得供應商詳情
  PUT    /api/pm/suppliers/:id                   // 更新供應商資訊
  DELETE /api/pm/suppliers/:id                   // 停用供應商
  
  // 供應商評估
  POST   /api/pm/suppliers/:id/evaluate          // 執行評估
  GET    /api/pm/suppliers/:id/evaluations       // 查詢評估歷史
  POST   /api/pm/suppliers/:id/score             // 更新評分
  
  // 風險管理
  GET    /api/pm/suppliers/:id/risk              // 查詢風險評估
  POST   /api/pm/suppliers/:id/risk/assess       // 執行風險評估
  PUT    /api/pm/suppliers/:id/risk/mitigate     // 更新緩解措施
}

// 損耗與退貨 API
interface LossAndReturnAPI {
  // 損耗管理
  POST   /api/pm/losses                          // 登記損耗
  GET    /api/pm/losses                          // 查詢損耗記錄
  POST   /api/pm/losses/:id/claim                // 提出索賠
  
  // 退貨處理
  POST   /api/pm/returns                         // 建立退貨單
  GET    /api/pm/returns/:id                     // 查詢退貨詳情
  PUT    /api/pm/returns/:id/process             // 處理退貨
}

// 供應商帳務 API
interface SupplierAccountingAPI {
  // 應付帳款
  GET    /api/pm/payables                        // 查詢應付帳款
  POST   /api/pm/payables/reconcile              // 對帳作業
  POST   /api/pm/payables/pay                    // 執行付款
  
  // 帳務分析
  GET    /api/pm/accounting/aging                // 帳齡分析
  GET    /api/pm/accounting/forecast             // 現金流預測
  GET    /api/pm/accounting/statement/:supplierId // 供應商對帳單
}

// WebSocket 事件
interface SupplierWebSocketEvents {
  // 供應商事件
  'supplier:created': (supplier: Supplier) => void;
  'supplier:updated': (supplier: Supplier) => void;
  'supplier:risk-changed': (risk: any) => void;
  
  // 評估事件
  'evaluation:completed': (evaluation: any) => void;
  'evaluation:approved': (evaluation: any) => void;
  
  // 異常事件
  'quality:issue': (issue: any) => void;
  'delivery:delayed': (delay: any) => void;
  'payment:overdue': (payment: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **PM-PODM**: 採購單連動
- **PM-CPM**: 合約管理
- **WMS**: 收貨品質
- **FA**: 財務付款
- **QM**: 品質檢驗

### 5.2 外部系統整合
- **銀行系統**: 付款介接
- **信用機構**: 信用查詢
- **政府平台**: 資格查驗
- **產業資料庫**: 市場資訊

## 6. 測試需求

### 6.1 功能測試
- 供應商建檔流程
- 評估計算正確性
- 風險評級準確性
- 帳務對帳一致性

### 6.2 效能測試
- 10,000 供應商查詢
- 批量評估作業
- 大量交易處理
- 報表生成速度

### 6.3 整合測試
- 採購流程整合
- 付款流程整合
- 品質資料同步
- 風險預警機制

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 供應商主檔管理
2. **Phase 2** (Week 3-4): 評估與評分系統
3. **Phase 3** (Week 5-6): 風險管理功能
4. **Phase 4** (Week 7): 帳務管理整合
5. **Phase 5** (Week 8): 系統測試與優化

### 7.2 關鍵里程碑
- M1: 供應商主檔完成
- M2: 評估系統上線
- M3: 風險管理啟用
- M4: 帳務整合完成
- M5: 全面運行

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 資料移轉複雜 | 高 | 高 | 分階段移轉，保留舊系統 |
| 評估標準爭議 | 中 | 中 | 建立評估委員會 |
| 系統整合困難 | 高 | 中 | 採用標準API介面 |
| 使用者抗拒 | 中 | 低 | 加強培訓與溝通 |

## 9. 成功指標

### 9.1 業務指標
- 採購成本降低 ≥ 15%
- 交期準確率 ≥ 95%
- 供應商滿意度 ≥ 85%
- 風險事件減少 ≥ 40%

### 9.2 系統指標
- 系統可用性 ≥ 99.5%
- 查詢響應時間 < 1秒
- 資料準確性 ≥ 99.9%
- 使用者採用率 ≥ 90%

## 10. 相關文件

- [PM 總體架構](../README.md)
- [合約管理 PRD](../09.2-PM-CPM-Contract_Pricing_Management/prd.md)
- [採購單管理 PRD](../09.3-PM-PODM-Purchase_Order_Delivery_Management/prd.md)
- [供應商管理最佳實踐](../../docs/best-practices/supplier-management.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: pm@tsaitung.com