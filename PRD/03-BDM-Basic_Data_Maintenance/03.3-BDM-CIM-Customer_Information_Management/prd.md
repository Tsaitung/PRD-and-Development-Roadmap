# BDM-CIM 客戶資訊管理 (Customer Information Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: CRM (客戶關係管理), OM (訂單管理), FA-AR (應收帳款), LM (物流管理)

## 1. 功能概述

### 1.1 目的
建立統一的客戶主檔資料管理系統，集中管理所有客戶基本資訊、信用資料、交易條件等，確保客戶資料的完整性、準確性和安全性。

### 1.2 範圍
- 客戶主檔維護
- 信用額度管理
- 客戶分級制度
- 聯絡人管理
- 客戶合併處理

### 1.3 關鍵價值
- 客戶資料準確率 99.9%
- 信用風險降低 70%
- 客戶滿意度提升 30%
- 資料維護效率提升 60%

## 2. 功能性需求

### FR-BDM-CIM-001: 客戶主檔維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 新客戶註冊或資料更新
- **行為**: 建立和維護客戶基本資料
- **資料輸入**: 
  - 公司基本資訊
  - 聯絡人資料
  - 送貨地址
  - 帳單地址
  - 營業資訊
- **資料輸出**: 
  - 客戶編號
  - 完整檔案
  - 信用評級
  - 交易歷史
  - 關係圖譜
- **UI反應**: 
  - 智能填寫
  - 地址驗證
  - 重複檢查
  - 關聯提示
  - 完整度顯示
- **例外處理**: 
  - 重複客戶
  - 地址錯誤
  - 資料不全
  - 黑名單檢查

#### 驗收標準
```yaml
- 條件: 新增客戶資料
  預期結果: 自動產生唯一客戶編號並驗證資料完整性

- 條件: 統一編號重複
  預期結果: 提示可能重複並提供合併選項

- 條件: 更新重要資訊
  預期結果: 記錄變更歷史並評估信用影響
```

#### Traceability
- **測試案例**: tests/unit/FR-BDM-CIM-001.test.ts
- **實作程式**: src/modules/bdm/services/customerManagement.service.ts
- **相關文件**: TOC Modules.md - Section 3.3

### FR-BDM-CIM-002: 信用額度管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 信用申請或定期評估
- **行為**: 評估和管理客戶信用額度
- **資料輸入**: 
  - 財務資料
  - 交易記錄
  - 付款歷史
  - 市場資訊
  - 擔保資料
- **資料輸出**: 
  - 信用額度
  - 風險評級
  - 付款條件
  - 監控警示
  - 調整建議
- **UI反應**: 
  - 評分卡顯示
  - 風險指標
  - 趨勢圖表
  - 警示通知
  - 審批流程
- **例外處理**: 
  - 超額訂單
  - 逾期未付
  - 資料異常
  - 緊急調整

#### 客戶主檔模型
```typescript
interface CustomerMaster {
  id: string;
  customerCode: string;
  
  // 基本資訊
  basicInfo: {
    companyName: string;
    tradingName?: string;
    registrationNo: string;  // 統一編號
    
    type: 'company' | 'individual' | 'government' | 'nonprofit';
    industry: string;
    scale: 'large' | 'medium' | 'small' | 'micro';
    
    establishment?: {
      date: Date;
      capital?: number;
      employees?: number;
    };
    
    status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
    
    addresses: {
      type: 'registered' | 'billing' | 'shipping' | 'contact';
      
      address: {
        line1: string;
        line2?: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
      };
      
      default: boolean;
      validFrom?: Date;
      validTo?: Date;
    }[];
    
    contacts: {
      contactId: string;
      
      name: {
        firstName: string;
        lastName: string;
        title?: string;
      };
      
      position?: string;
      department?: string;
      
      communication: {
        phone?: string;
        mobile?: string;
        email?: string;
        fax?: string;
        lineId?: string;
      };
      
      role: 'primary' | 'billing' | 'shipping' | 'technical' | 'other';
      active: boolean;
      
      preferences?: {
        language: string;
        contactMethod: string;
        bestTimeToContact?: string;
      };
    }[];
  };
  
  // 商業資訊
  businessInfo: {
    salesChannel?: 'direct' | 'distributor' | 'online' | 'retail';
    territory?: string;
    salesRep?: string;
    
    customerGroup?: string;
    priceList?: string;
    
    taxInfo: {
      taxId: string;
      vatNo?: string;
      taxExempt: boolean;
      taxRate?: number;
      
      certificates?: {
        type: string;
        number: string;
        validUntil?: Date;
      }[];
    };
    
    payment: {
      terms: string;  // NET30, COD, etc.
      method: 'cash' | 'check' | 'transfer' | 'credit_card' | 'mixed';
      currency: string;
      
      bankAccount?: {
        bank: string;
        accountNo: string;
        accountName: string;
      };
      
      billing: {
        cycle: 'immediate' | 'weekly' | 'monthly';
        consolidate: boolean;
        statementDay?: number;
      };
    };
  };
  
  // 信用管理
  creditManagement: {
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
    
    rating: {
      internal: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D';
      external?: string;
      score: number;
      
      lastEvaluated: Date;
      nextReview: Date;
    };
    
    riskProfile: {
      level: 'low' | 'medium' | 'high' | 'very_high';
      
      factors: {
        paymentHistory: number;
        financialHealth: number;
        industryRisk: number;
        relationshipLength: number;
      };
      
      monitoring: {
        watchlist: boolean;
        alerts: string[];
        restrictions?: string[];
      };
    };
    
    security?: {
      type: 'guarantee' | 'deposit' | 'insurance' | 'none';
      amount?: number;
      details?: string;
      expiryDate?: Date;
    };
    
    history: {
      overdueEvents: {
        date: Date;
        amount: number;
        days: number;
        resolved: boolean;
      }[];
      
      creditAdjustments: {
        date: Date;
        oldLimit: number;
        newLimit: number;
        reason: string;
        approvedBy: string;
      }[];
    };
  };
  
  // 客戶分級
  classification: {
    tier: 'vip' | 'key' | 'regular' | 'new' | 'inactive';
    
    value: {
      lifetime: number;
      annual: number;
      potential: number;
    };
    
    loyalty: {
      memberSince: Date;
      points?: number;
      level?: string;
    };
    
    behavior: {
      orderFrequency: string;
      averageOrderValue: number;
      productPreferences: string[];
      seasonality?: string[];
    };
    
    marketing: {
      segment: string[];
      campaigns: string[];
      optIn: boolean;
      preferences?: any;
    };
  };
  
  // 關係管理
  relationships?: {
    parentCompany?: string;
    subsidiaries?: string[];
    relatedCompanies?: string[];
    
    contracts?: {
      contractNo: string;
      type: string;
      startDate: Date;
      endDate?: Date;
      status: string;
    }[];
    
    projects?: {
      projectId: string;
      name: string;
      status: string;
      value: number;
    }[];
  };
  
  // 合規性
  compliance?: {
    kyc: {
      verified: boolean;
      verifiedDate?: Date;
      documents: string[];
      nextReview?: Date;
    };
    
    sanctions: {
      checked: boolean;
      checkedDate?: Date;
      clear: boolean;
      notes?: string;
    };
    
    licenses?: {
      type: string;
      number: string;
      issuedBy: string;
      validUntil?: Date;
    }[];
  };
  
  metadata: {
    source?: 'manual' | 'import' | 'api' | 'migration';
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    version: number;
  };
}
```

### FR-BDM-CIM-003: 客戶分級制度
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 定期評估或交易觸發
- **行為**: 評定客戶等級並差異化服務
- **資料輸入**: 
  - 交易金額
  - 購買頻率
  - 付款表現
  - 互動程度
  - 潛力評估
- **資料輸出**: 
  - 客戶等級
  - 權益說明
  - 升降級通知
  - 服務標準
  - 行銷策略
- **UI反應**: 
  - 等級標示
  - 權益顯示
  - 進度條
  - 比較表
  - 通知設定
- **例外處理**: 
  - 手動調整
  - 特殊客戶
  - 降級保護
  - 申訴處理

#### 信用管理模型
```typescript
interface CreditManagement {
  customerId: string;
  
  // 信用評估
  evaluation: {
    evaluationId: string;
    evaluationDate: Date;
    
    // 財務分析
    financial: {
      revenue?: number;
      assets?: number;
      liabilities?: number;
      cashFlow?: number;
      
      ratios?: {
        currentRatio?: number;
        quickRatio?: number;
        debtRatio?: number;
        dso?: number;  // Days Sales Outstanding
      };
      
      trend: 'improving' | 'stable' | 'declining';
      source: 'audited' | 'unaudited' | 'estimated';
    };
    
    // 交易表現
    transaction: {
      totalPurchases: number;
      averageOrderValue: number;
      orderFrequency: number;
      
      paymentPerformance: {
        onTimeRate: number;
        averageDays: number;
        overdueAmount: number;
        maxOverdueDays: number;
      };
      
      disputes: {
        count: number;
        resolvedRate: number;
        averageResolutionDays: number;
      };
    };
    
    // 市場資訊
    market?: {
      industryRating: string;
      competitorAnalysis?: string;
      marketShare?: number;
      reputation?: number;
    };
    
    // 評分計算
    scoring: {
      model: string;
      
      components: {
        component: string;
        weight: number;
        score: number;
        contribution: number;
      }[];
      
      totalScore: number;
      percentile?: number;
    };
  };
  
  // 信用決策
  decision: {
    creditLimit: number;
    approvedBy: string;
    approvedDate: Date;
    
    terms: {
      paymentDays: number;
      earlyPaymentDiscount?: {
        percentage: number;
        days: number;
      };
      
      lateFee?: {
        percentage: number;
        graceDays: number;
      };
    };
    
    conditions?: string[];
    validUntil: Date;
    
    monitoring: {
      frequency: 'monthly' | 'quarterly' | 'annually';
      triggers: {
        event: string;
        action: string;
      }[];
    };
  };
  
  // 信用使用
  utilization: {
    currentBalance: number;
    availableCredit: number;
    utilizationRate: number;
    
    aging: {
      current: number;
      days30: number;
      days60: number;
      days90: number;
      over90: number;
    };
    
    transactions: {
      pending: number;
      authorized: number;
      settled: number;
    };
  };
  
  // 風險監控
  monitoring: {
    alerts: {
      alertId: string;
      type: 'overlimit' | 'overdue' | 'pattern' | 'external';
      severity: 'info' | 'warning' | 'critical';
      
      description: string;
      triggeredAt: Date;
      
      action?: {
        taken: boolean;
        type?: string;
        by?: string;
        at?: Date;
      };
    }[];
    
    reviews: {
      reviewDate: Date;
      reviewer: string;
      
      findings: string;
      recommendations: string[];
      
      adjustments?: {
        field: string;
        oldValue: any;
        newValue: any;
      }[];
    }[];
  };
}
```

### FR-BDM-CIM-004: 聯絡人管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 聯絡人新增或變更
- **行為**: 管理客戶聯絡人資訊
- **資料輸入**: 
  - 聯絡人資料
  - 職務角色
  - 權限設定
  - 聯絡偏好
  - 關係網絡
- **資料輸出**: 
  - 聯絡人清單
  - 組織架構
  - 權限矩陣
  - 互動歷史
  - 通訊錄
- **UI反應**: 
  - 名片掃描
  - 組織圖
  - 快速撥號
  - 群發功能
  - 生日提醒
- **例外處理**: 
  - 重複聯絡人
  - 離職處理
  - 權限衝突
  - 隱私保護

### FR-BDM-CIM-005: 客戶合併處理
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 發現重複或企業併購
- **行為**: 合併重複客戶資料
- **資料輸入**: 
  - 來源客戶
  - 目標客戶
  - 合併規則
  - 衝突處理
  - 保留設定
- **資料輸出**: 
  - 合併結果
  - 資料映射
  - 異動記錄
  - 影響分析
  - 通知清單
- **UI反應**: 
  - 比較視圖
  - 選擇保留
  - 預覽結果
  - 確認步驟
  - 回滾選項
- **例外處理**: 
  - 交易衝突
  - 餘額不符
  - 合約問題
  - 還原需求

## 3. 系統設計

### 3.1 資料模型

```typescript
// 客戶分級
interface CustomerTier {
  customerId: string;
  
  // 分級資訊
  tier: {
    current: {
      level: 'vip' | 'gold' | 'silver' | 'bronze' | 'regular';
      effectiveFrom: Date;
      validUntil?: Date;
    };
    
    next?: {
      level: string;
      requirements: {
        metric: string;
        current: number;
        required: number;
        progress: number;
      }[];
    };
    
    history: {
      level: string;
      from: Date;
      to: Date;
      reason: string;
    }[];
  };
  
  // 評估指標
  metrics: {
    period: { start: Date; end: Date; };
    
    financial: {
      revenue: number;
      orderCount: number;
      averageOrder: number;
      growth: number;
    };
    
    engagement: {
      loginFrequency: number;
      interactions: number;
      satisfaction: number;
      referrals: number;
    };
    
    loyalty: {
      tenure: number;  // months
      retention: number;
      churnRisk: number;
      clv: number;  // Customer Lifetime Value
    };
  };
  
  // 權益配置
  benefits: {
    pricing: {
      discountRate?: number;
      specialPrices?: string[];
      freeShipping?: boolean;
    };
    
    service: {
      priority: 'high' | 'medium' | 'normal';
      dedicatedSupport?: boolean;
      responseTime: number;  // hours
    };
    
    rewards: {
      pointsMultiplier: number;
      exclusiveOffers: boolean;
      earlyAccess: boolean;
      gifts?: string[];
    };
    
    credit: {
      limitMultiplier: number;
      extendedTerms?: number;
      flexiblePayment: boolean;
    };
  };
  
  // 行銷策略
  marketing: {
    campaigns: string[];
    communications: {
      channel: string;
      frequency: string;
      content: string[];
    }[];
    
    retention: {
      strategy: string;
      actions: string[];
      budget: number;
    };
  };
}

// 聯絡人網絡
interface ContactNetwork {
  contactId: string;
  customerId: string;
  
  // 個人資訊
  personal: {
    name: {
      full: string;
      first: string;
      last: string;
      nickname?: string;
    };
    
    title: string;
    department: string;
    
    profile?: {
      photo?: string;
      bio?: string;
      interests?: string[];
      birthday?: Date;
    };
  };
  
  // 聯絡資訊
  contact: {
    business: {
      phone?: string;
      mobile?: string;
      email: string;
      extension?: string;
    };
    
    personal?: {
      mobile?: string;
      email?: string;
      social?: {
        linkedin?: string;
        facebook?: string;
        twitter?: string;
      };
    };
    
    preferences: {
      bestTime: string;
      method: string;
      language: string;
      timezone?: string;
    };
  };
  
  // 角色權限
  role: {
    type: 'decision_maker' | 'influencer' | 'user' | 'technical' | 'administrative';
    
    responsibilities: string[];
    
    authority: {
      orderApproval?: number;
      contractSigning: boolean;
      paymentAuthorization: boolean;
    };
    
    access?: {
      portal: boolean;
      reports: string[];
      functions: string[];
    };
  };
  
  // 關係網絡
  network?: {
    internal: {
      reportsTo?: string;
      peers?: string[];
      subordinates?: string[];
    };
    
    external?: {
      vendors?: string[];
      partners?: string[];
      associations?: string[];
    };
    
    influence: {
      score: number;
      reach: number;
    };
  };
  
  // 互動記錄
  interactions?: {
    lastContact?: Date;
    totalInteractions: number;
    
    recent: {
      date: Date;
      type: string;
      subject: string;
      outcome?: string;
    }[];
    
    preferences?: {
      topics: string[];
      products: string[];
      concerns: string[];
    };
  };
}

// 客戶合併
interface CustomerMerge {
  mergeId: string;
  
  // 合併來源
  source: {
    customers: {
      customerId: string;
      customerCode: string;
      companyName: string;
      selected: boolean;
    }[];
    
    targetCustomer: string;
  };
  
  // 合併規則
  rules: {
    basicInfo: {
      strategy: 'keep_target' | 'keep_newest' | 'manual';
      conflicts?: any[];
    };
    
    contacts: {
      strategy: 'merge_all' | 'merge_unique' | 'keep_target';
      duplicateCheck: boolean;
    };
    
    transactions: {
      strategy: 'combine' | 'keep_separate';
      recodeTo: string;
    };
    
    credit: {
      limitStrategy: 'sum' | 'max' | 'target' | 'manual';
      balanceHandling: 'combine' | 'clear_source';
    };
  };
  
  // 影響分析
  impact: {
    orders: number;
    invoices: number;
    shipments: number;
    payments: number;
    
    contracts?: number;
    projects?: number;
  };
  
  // 執行狀態
  execution: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';
    
    startedAt?: Date;
    completedAt?: Date;
    
    steps: {
      step: string;
      status: string;
      message?: string;
    }[];
    
    rollback?: {
      available: boolean;
      reason?: string;
      performedAt?: Date;
    };
  };
}
```

### 3.2 API 設計

```typescript
// 客戶管理 API
interface CustomerManagementAPI {
  // 客戶主檔
  POST   /api/bdm/customers                   // 建立客戶
  GET    /api/bdm/customers                   // 查詢客戶
  GET    /api/bdm/customers/:id               // 客戶詳情
  PUT    /api/bdm/customers/:id               // 更新客戶
  DELETE /api/bdm/customers/:id               // 刪除客戶
  
  // 信用管理
  POST   /api/bdm/customers/:id/credit        // 申請信用
  GET    /api/bdm/customers/:id/credit        // 信用資訊
  PUT    /api/bdm/customers/:id/credit        // 調整額度
  POST   /api/bdm/customers/:id/credit/review // 信用審查
  
  // 客戶分級
  GET    /api/bdm/customers/:id/tier          // 查詢等級
  POST   /api/bdm/customers/:id/evaluate      // 評估等級
  PUT    /api/bdm/customers/:id/tier          // 調整等級
  GET    /api/bdm/customers/tiers/benefits    // 權益說明
  
  // 聯絡人管理
  POST   /api/bdm/customers/:id/contacts      // 新增聯絡人
  GET    /api/bdm/customers/:id/contacts      // 聯絡人列表
  PUT    /api/bdm/contacts/:id                // 更新聯絡人
  DELETE /api/bdm/contacts/:id                // 刪除聯絡人
  
  // 客戶合併
  POST   /api/bdm/customers/merge/analyze     // 分析重複
  POST   /api/bdm/customers/merge             // 執行合併
  GET    /api/bdm/customers/merge/:id         // 合併狀態
  POST   /api/bdm/customers/merge/:id/rollback // 回滾合併
}

// WebSocket 事件
interface CIMWebSocketEvents {
  'customer:created': (customer: any) => void;
  'customer:updated': (customer: any) => void;
  'credit:changed': (credit: any) => void;
  'tier:upgraded': (tier: any) => void;
  'merge:completed': (merge: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **CRM**: 客戶關係管理
- **OM**: 訂單處理
- **FA-AR**: 應收帳款
- **LM**: 送貨地址
- **BI**: 客戶分析

### 4.2 外部系統整合
- **信用機構**: 信用查詢
- **政府系統**: 公司登記
- **地圖服務**: 地址驗證
- **社群平台**: 聯絡人資訊

## 5. 成功指標

### 5.1 業務指標
- 客戶建檔時間 < 5分鐘
- 資料完整度 > 95%
- 信用評估準確率 > 90%
- 客戶滿意度 > 85%

### 5.2 系統指標
- 查詢響應時間 < 0.5秒
- 並發處理 > 200筆
- 系統可用性 ≥ 99.9%
- 資料安全性 100%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bdm@tsaitung.com