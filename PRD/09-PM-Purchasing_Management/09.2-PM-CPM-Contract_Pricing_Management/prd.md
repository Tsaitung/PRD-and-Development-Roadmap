# PM-CPM 合約與定價管理 (Contract & Pricing Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM-SRM (供應商管理), PM-PODM (採購單管理), FA (財務會計), Legal (法務)

## 1. 功能概述

### 1.1 目的
建立智慧化的合約與定價管理系統，自動化合約生命週期管理，優化採購定價策略，確保合約合規性，實現採購成本最優化。

### 1.2 範圍
- 合約範本管理
- 合約生命週期管理
- 動態定價機制
- 折扣與回饋管理
- 合約履行監控

### 1.3 關鍵價值
- 合約處理時間縮短 70%
- 採購成本節省 12%
- 合約合規性達 100%
- 價格競爭力提升 20%

## 2. 功能性需求

### FR-PM-CPM-001: 合約範本管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 建立或維護合約範本
- **行為**: 管理標準化合約範本庫
- **資料輸入**: 
  - 範本類型（採購、框架、寄售、VMI）
  - 條款內容
  - 變數定義
  - 審批流程
  - 適用範圍
- **資料輸出**: 
  - 範本編號
  - 版本控制
  - 使用統計
  - 條款庫
  - 風險評估
- **UI反應**: 
  - 範本編輯器
  - 條款拖拽
  - 預覽功能
  - 版本對比
  - 批准狀態
- **例外處理**: 
  - 條款衝突檢查
  - 法規合規驗證
  - 權限控制
  - 版本鎖定

#### 驗收標準
```yaml
- 條件: 建立新合約範本
  預期結果: 自動檢查條款完整性並生成版本號

- 條件: 修改標準條款
  預期結果: 追蹤變更歷史並通知相關人員

- 條件: 套用範本生成合約
  預期結果: 自動填充變數並標記待確認項目
```

#### Traceability
- **測試案例**: tests/unit/FR-PM-CPM-001.test.ts
- **實作程式**: src/modules/pm/services/contractTemplate.service.ts
- **相關文件**: TOC Modules.md - Section 9.2

### FR-PM-CPM-002: 合約生命週期管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 合約創建、執行、變更或到期
- **行為**: 管理合約從創建到終止的完整週期
- **資料輸入**: 
  - 合約基本資訊
  - 簽署方資訊
  - 商業條款
  - 服務等級協議
  - 附件文件
- **資料輸出**: 
  - 合約狀態
  - 執行進度
  - 到期提醒
  - 續約建議
  - 履約報告
- **UI反應**: 
  - 合約時間軸
  - 狀態流程圖
  - 提醒通知
  - 電子簽章
  - 文件管理
- **例外處理**: 
  - 簽署逾期處理
  - 條款變更控制
  - 爭議處理
  - 終止程序

#### 合約資料結構
```typescript
interface Contract {
  id: string;
  contractNo: string;
  
  // 基本資訊
  basicInfo: {
    title: string;
    type: 'purchase' | 'framework' | 'service' | 'consignment' | 'vmi';
    category: string;
    description: string;
    templateId?: string;
    parentContractId?: string;  // 框架協議ID
  };
  
  // 合約方
  parties: {
    buyer: {
      companyName: string;
      representativeName: string;
      title: string;
      contactInfo: ContactInfo;
    };
    supplier: {
      supplierId: string;
      companyName: string;
      representativeName: string;
      title: string;
      contactInfo: ContactInfo;
    };
  };
  
  // 合約期限
  duration: {
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    renewalTerms?: string;
    noticePeriod: number;  // 通知期限(天)
    earlyTermination?: {
      allowed: boolean;
      conditions: string;
      penalty?: number;
    };
  };
  
  // 商業條款
  commercialTerms: {
    // 金額條款
    value: {
      totalValue?: number;
      estimatedValue?: number;
      currency: string;
      paymentTerms: string;
      paymentMethod: string;
    };
    
    // 數量條款
    quantity: {
      minimumOrder?: number;
      maximumOrder?: number;
      annualVolume?: number;
      volumeCommitment?: number;
    };
    
    // 價格條款
    pricing: {
      priceList: PriceItem[];
      priceValidity: number;  // 價格有效期(天)
      priceAdjustment: {
        allowed: boolean;
        frequency?: string;
        formula?: string;
        trigger?: string;
      };
    };
    
    // 折扣條款
    discounts: {
      volumeDiscount?: VolumeDiscount[];
      earlyPaymentDiscount?: number;
      loyaltyDiscount?: number;
      promotionalDiscount?: PromotionalDiscount[];
    };
  };
  
  // 服務等級協議
  sla: {
    deliveryTime: {
      standard: number;
      express?: number;
      penalty: string;
    };
    qualityStandard: {
      acceptanceRate: number;
      defectRate: number;
      warranty: string;
    };
    availability: {
      stockAvailability?: number;
      responseTime: number;
      resolutionTime: number;
    };
  };
  
  // 合規與風險
  compliance: {
    regulatoryRequirements: string[];
    certifications: string[];
    insurance: {
      required: boolean;
      type?: string;
      amount?: number;
    };
    confidentiality: boolean;
    dataProtection: boolean;
  };
  
  // 合約狀態
  status: {
    current: 'draft' | 'negotiation' | 'pending_approval' | 'approved' | 
             'signed' | 'active' | 'expired' | 'terminated' | 'renewed';
    approvalStatus?: ApprovalStatus;
    signatureStatus?: SignatureStatus;
    executionStatus?: ExecutionStatus;
  };
  
  // 文件管理
  documents: {
    mainContract: Document;
    amendments: Document[];
    attachments: Document[];
    correspondence: Document[];
  };
  
  // 審計追蹤
  audit: {
    createdBy: string;
    createdAt: Date;
    modifiedBy?: string;
    modifiedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    signedDate?: Date;
  };
}
```

### FR-PM-CPM-003: 動態定價機制
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 採購需求產生或市場價格變動
- **行為**: 根據多維度因素計算最優採購價格
- **資料輸入**: 
  - 產品類別
  - 採購數量
  - 交期要求
  - 歷史價格
  - 市場行情
- **資料輸出**: 
  - 建議價格
  - 價格區間
  - 成本分析
  - 競爭力評估
  - 談判策略
- **UI反應**: 
  - 價格計算器
  - 趨勢圖表
  - 比價分析
  - 模擬場景
  - 決策建議
- **例外處理**: 
  - 異常價格預警
  - 審批升級
  - 價格鎖定
  - 匯率波動

#### 定價引擎
```typescript
interface PricingEngine {
  // 價格計算
  calculatePrice(params: PricingParams): PricingResult {
    const basePrice = this.getBasePrice(params.itemId);
    const volumeAdjustment = this.calculateVolumeDiscount(params.quantity);
    const seasonalAdjustment = this.getSeasonalFactor(params.date);
    const urgencyPremium = this.calculateUrgencyPremium(params.leadTime);
    const relationshipDiscount = this.getRelationshipDiscount(params.supplierId);
    
    return {
      basePrice,
      adjustments: {
        volume: volumeAdjustment,
        seasonal: seasonalAdjustment,
        urgency: urgencyPremium,
        relationship: relationshipDiscount
      },
      finalPrice: basePrice * (1 + adjustments),
      confidence: this.calculateConfidence(params),
      validUntil: this.calculateValidity(params)
    };
  }
  
  // 批量折扣計算
  calculateVolumeDiscount(quantity: number): number {
    const tiers = [
      { min: 0, max: 100, discount: 0 },
      { min: 101, max: 500, discount: 0.05 },
      { min: 501, max: 1000, discount: 0.10 },
      { min: 1001, max: Infinity, discount: 0.15 }
    ];
    
    const tier = tiers.find(t => quantity >= t.min && quantity <= t.max);
    return tier ? -tier.discount : 0;
  }
  
  // 市場價格基準
  getMarketBenchmark(itemId: string): MarketPrice {
    return {
      average: this.marketData.getAverage(itemId),
      minimum: this.marketData.getMin(itemId),
      maximum: this.marketData.getMax(itemId),
      trend: this.marketData.getTrend(itemId),
      volatility: this.marketData.getVolatility(itemId)
    };
  }
}
```

### FR-PM-CPM-004: 折扣與回饋管理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 達到折扣條件或回饋門檻
- **行為**: 自動計算和追蹤各類折扣與回饋
- **資料輸入**: 
  - 折扣規則設定
  - 採購實績
  - 付款記錄
  - 績效指標
  - 特殊協議
- **資料輸出**: 
  - 折扣計算明細
  - 回饋金額
  - 達成率分析
  - 預測報告
  - 對帳單
- **UI反應**: 
  - 折扣儀表板
  - 規則設定器
  - 實績追蹤
  - 申請流程
  - 結算報表
- **例外處理**: 
  - 規則衝突
  - 超額折扣
  - 追溯調整
  - 爭議處理

### FR-PM-CPM-005: 合約履行監控
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 合約執行過程中的各個檢查點
- **行為**: 監控合約履行情況並預警風險
- **資料輸入**: 
  - 履約指標
  - 實際績效
  - 交貨記錄
  - 品質數據
  - 付款狀態
- **資料輸出**: 
  - 履約儀表板
  - 偏差分析
  - 風險預警
  - 改善建議
  - 績效報告
- **UI反應**: 
  - 即時監控
  - 預警通知
  - 趨勢分析
  - 詳細報告
  - 行動計劃
- **例外處理**: 
  - SLA違約
  - 自動扣款
  - 升級機制
  - 合約終止

## 3. 非功能性需求

### 3.1 效能需求
- 合約查詢響應 < 2秒
- 價格計算 < 1秒
- 支援 10,000+ 活躍合約
- 並發處理 50+ 價格請求

### 3.2 安全需求
- 合約文件加密存儲
- 數位簽章支援
- 審計日誌完整性
- 角色權限管理

### 3.3 合規需求
- 法規遵循檢查
- 電子合約法律效力
- 資料保護規範
- 採購政策合規

## 4. 系統設計

### 4.1 資料模型

```typescript
// 價格項目
interface PriceItem {
  id: string;
  contractId: string;
  
  // 產品資訊
  item: {
    itemId: string;
    itemCode: string;
    itemName: string;
    specification: string;
    unit: string;
  };
  
  // 價格結構
  pricing: {
    unitPrice: number;
    currency: string;
    priceType: 'fixed' | 'floating' | 'indexed';
    
    // 階梯價格
    tieredPricing?: {
      minQty: number;
      maxQty: number;
      price: number;
    }[];
    
    // 價格公式
    formula?: {
      base: string;
      adjustments: {
        factor: string;
        operation: '+' | '-' | '*' | '/';
        value: number;
      }[];
    };
    
    // 價格有效期
    validity: {
      startDate: Date;
      endDate: Date;
      renewable: boolean;
    };
  };
  
  // 折扣結構
  discounts: {
    quantity?: QuantityDiscount[];
    seasonal?: SeasonalDiscount[];
    promotional?: PromotionalDiscount[];
    payment?: PaymentDiscount;
  };
  
  // 附加費用
  additionalCharges?: {
    type: string;
    amount: number;
    calculation: 'fixed' | 'percentage';
  }[];
}

// 合約執行記錄
interface ContractExecution {
  id: string;
  contractId: string;
  
  // 執行期間
  period: {
    year: number;
    month?: number;
    quarter?: number;
  };
  
  // 採購實績
  purchasePerformance: {
    orders: number;
    totalAmount: number;
    totalQuantity: number;
    items: {
      itemId: string;
      quantity: number;
      amount: number;
    }[];
  };
  
  // SLA履行
  slaPerformance: {
    deliveryOnTime: number;
    qualityPass: number;
    responseTime: number;
    overall: number;
    violations: {
      date: Date;
      type: string;
      severity: string;
      penalty?: number;
    }[];
  };
  
  // 財務結算
  financial: {
    invoiced: number;
    paid: number;
    outstanding: number;
    discounts: number;
    penalties: number;
    rebates: number;
  };
  
  // 合規檢查
  compliance: {
    checkDate: Date;
    status: 'compliant' | 'non_compliant' | 'conditional';
    issues: {
      type: string;
      description: string;
      severity: string;
      resolution?: string;
    }[];
  };
  
  recordedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

// 價格歷史
interface PriceHistory {
  id: string;
  itemId: string;
  supplierId: string;
  
  // 價格記錄
  pricePoint: {
    date: Date;
    price: number;
    currency: string;
    quantity: number;
    contractId?: string;
    orderNo?: string;
  };
  
  // 市場資訊
  marketContext: {
    marketPrice?: number;
    competitorPrice?: number;
    demandLevel: 'low' | 'normal' | 'high';
    supplyLevel: 'shortage' | 'normal' | 'surplus';
  };
  
  // 變動分析
  change: {
    previousPrice: number;
    changeAmount: number;
    changePercent: number;
    reason?: string;
  };
  
  source: 'contract' | 'purchase_order' | 'quotation' | 'market';
  createdAt: Date;
}

// 折扣與回饋
interface DiscountRebate {
  id: string;
  contractId: string;
  supplierId: string;
  
  // 類型
  type: 'volume_discount' | 'payment_discount' | 'loyalty_rebate' | 
        'performance_bonus' | 'promotional';
  
  // 規則定義
  rule: {
    name: string;
    description: string;
    conditions: {
      metric: string;
      operator: string;
      value: number;
      period?: string;
    }[];
    benefit: {
      type: 'percentage' | 'fixed' | 'tiered';
      value: number | TieredBenefit[];
    };
  };
  
  // 計算週期
  period: {
    frequency: 'monthly' | 'quarterly' | 'annually';
    startDate: Date;
    endDate: Date;
  };
  
  // 實績追蹤
  achievement: {
    target: number;
    actual: number;
    percentage: number;
    qualified: boolean;
  };
  
  // 結算
  settlement: {
    amount: number;
    status: 'pending' | 'calculated' | 'approved' | 'paid';
    approvedBy?: string;
    approvedAt?: Date;
    paidAt?: Date;
    reference?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 API 設計

```typescript
// 合約管理 API
interface ContractManagementAPI {
  // 合約操作
  POST   /api/pm/contracts                      // 建立合約
  GET    /api/pm/contracts                      // 查詢合約列表
  GET    /api/pm/contracts/:id                  // 取得合約詳情
  PUT    /api/pm/contracts/:id                  // 更新合約
  POST   /api/pm/contracts/:id/approve          // 審批合約
  POST   /api/pm/contracts/:id/sign             // 簽署合約
  POST   /api/pm/contracts/:id/renew            // 續約
  POST   /api/pm/contracts/:id/terminate        // 終止合約
  
  // 範本管理
  GET    /api/pm/contracts/templates            // 查詢範本
  POST   /api/pm/contracts/templates            // 建立範本
  PUT    /api/pm/contracts/templates/:id        // 更新範本
  
  // 合約執行
  GET    /api/pm/contracts/:id/execution        // 執行狀況
  POST   /api/pm/contracts/:id/amend            // 修訂合約
  GET    /api/pm/contracts/:id/compliance       // 合規檢查
}

// 定價管理 API
interface PricingManagementAPI {
  // 價格計算
  POST   /api/pm/pricing/calculate              // 計算價格
  POST   /api/pm/pricing/compare                // 比價分析
  GET    /api/pm/pricing/history                // 價格歷史
  
  // 價格維護
  POST   /api/pm/pricing/update                 // 更新價格
  POST   /api/pm/pricing/approve                // 審批價格
  GET    /api/pm/pricing/forecast               // 價格預測
  
  // 市場價格
  GET    /api/pm/pricing/market                 // 市場行情
  POST   /api/pm/pricing/benchmark              // 基準比較
}

// 折扣回饋 API
interface DiscountRebateAPI {
  // 規則管理
  POST   /api/pm/discounts/rules                // 建立規則
  GET    /api/pm/discounts/rules                // 查詢規則
  PUT    /api/pm/discounts/rules/:id            // 更新規則
  
  // 計算結算
  POST   /api/pm/discounts/calculate            // 計算折扣
  GET    /api/pm/discounts/achievement          // 達成進度
  POST   /api/pm/discounts/settle               // 結算
  
  // 報表分析
  GET    /api/pm/discounts/summary              // 匯總報表
  GET    /api/pm/discounts/forecast             // 預測分析
}

// WebSocket 事件
interface ContractWebSocketEvents {
  // 合約事件
  'contract:created': (contract: Contract) => void;
  'contract:signed': (contract: Contract) => void;
  'contract:expiring': (contract: Contract) => void;
  'contract:renewed': (contract: Contract) => void;
  
  // 價格事件
  'price:updated': (price: any) => void;
  'price:alert': (alert: any) => void;
  
  // 履約事件
  'sla:violation': (violation: any) => void;
  'compliance:issue': (issue: any) => void;
}
```

## 5. 整合需求

### 5.1 內部系統整合
- **PM-SRM**: 供應商資訊
- **PM-PODM**: 採購單價格
- **FA**: 財務結算
- **Legal**: 法務審核
- **BI**: 價格分析

### 5.2 外部系統整合
- **電子簽章平台**: 合約簽署
- **市場資訊系統**: 價格行情
- **法規資料庫**: 合規檢查
- **銀行系統**: 付款結算

## 6. 測試需求

### 6.1 功能測試
- 合約創建流程
- 價格計算準確性
- 折扣規則驗證
- 履約監控邏輯

### 6.2 效能測試
- 大量合約查詢
- 並發價格計算
- 批量折扣處理
- 報表生成速度

### 6.3 整合測試
- 採購流程整合
- 財務結算整合
- 簽章流程測試
- 合規檢查整合

## 7. 實施計劃

### 7.1 開發階段
1. **Phase 1** (Week 1-2): 合約範本與基礎管理
2. **Phase 2** (Week 3-4): 動態定價引擎
3. **Phase 3** (Week 5): 折扣回饋機制
4. **Phase 4** (Week 6): 履約監控系統
5. **Phase 5** (Week 7): 整合測試與優化

### 7.2 關鍵里程碑
- M1: 合約管理基礎完成
- M2: 定價引擎上線
- M3: 折扣系統啟用
- M4: 監控系統運行
- M5: 全面整合完成

## 8. 風險評估

| 風險項目 | 影響 | 機率 | 緩解措施 |
|---------|------|------|----------|
| 法律合規風險 | 高 | 中 | 法務部門審核，定期更新 |
| 價格計算錯誤 | 高 | 低 | 多重驗證，審計追蹤 |
| 系統整合複雜 | 中 | 高 | 標準化API，分階段實施 |
| 使用者培訓 | 中 | 中 | 完整文檔，持續培訓 |

## 9. 成功指標

### 9.1 業務指標
- 合約處理時間 ≤ 2天
- 採購成本節省 ≥ 12%
- 價格準確率 ≥ 99%
- 合約合規率 100%

### 9.2 系統指標
- 系統可用性 ≥ 99.5%
- 回應時間 < 2秒
- 資料準確性 100%
- 使用者滿意度 ≥ 85%

## 10. 相關文件

- [PM 總體架構](../README.md)
- [供應商管理 PRD](../09.1-PM-SRM-Supplier_Relationship_Management/prd.md)
- [採購單管理 PRD](../09.3-PM-PODM-Purchase_Order_Delivery_Management/prd.md)
- [合約管理最佳實踐](../../docs/best-practices/contract-management.md)

## 11. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: pm@tsaitung.com