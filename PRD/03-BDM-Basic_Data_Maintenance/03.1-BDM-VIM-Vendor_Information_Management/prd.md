# BDM-VIM 供應商資訊管理 (Vendor Information Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM (採購管理), FA-AP (應付帳款), LM (物流管理), CRM (客戶關係管理)

## 1. 功能概述

### 1.1 目的
建立完整的供應商主檔資料管理系統，統一管理供應商基本資訊、資格認證、評級評鑑等，確保供應商資料的準確性、完整性和一致性。

### 1.2 範圍
- 供應商基本資料維護
- 資格審核認證
- 評級分類管理
- 文件證照管理
- 供應商關係維護

### 1.3 關鍵價值
- 供應商資料準確率 99.9%
- 審核時間縮短 60%
- 重複資料降低 95%
- 合規風險降低 80%

## 2. 功能性需求

### FR-BDM-VIM-001: 供應商基本資料維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 新供應商申請或資料更新需求
- **行為**: 建立和維護供應商主檔資料
- **資料輸入**: 
  - 公司基本資訊
  - 聯絡人資料
  - 銀行帳戶資訊
  - 稅務登記資料
  - 營業項目說明
- **資料輸出**: 
  - 供應商編號
  - 完整檔案
  - 審核狀態
  - 變更記錄
  - 資料完整度
- **UI反應**: 
  - 表單驗證
  - 重複檢查
  - 自動編號
  - 必填提示
  - 儲存確認
- **例外處理**: 
  - 重複供應商
  - 資料不完整
  - 格式錯誤
  - 權限不足

#### 驗收標準
```yaml
- 條件: 新增供應商資料
  預期結果: 自動產生唯一編號並完成資料驗證

- 條件: 統一編號重複
  預期結果: 提示重複並顯示既有供應商資訊

- 條件: 更新銀行帳戶
  預期結果: 記錄變更歷史並通知相關單位
```

#### Traceability
- **測試案例**: tests/unit/FR-BDM-VIM-001.test.ts
- **實作程式**: src/modules/bdm/services/vendorManagement.service.ts
- **相關文件**: TOC Modules.md - Section 3.1

### FR-BDM-VIM-002: 資格審核認證
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 供應商申請或定期審查
- **行為**: 執行供應商資格審核流程
- **資料輸入**: 
  - 審核類型
  - 評估項目
  - 證明文件
  - 現場稽核報告
  - 審核意見
- **資料輸出**: 
  - 審核結果
  - 合格證明
  - 改善要求
  - 有效期限
  - 下次審核日
- **UI反應**: 
  - 審核流程
  - 檢查清單
  - 文件上傳
  - 評分表單
  - 核准按鈕
- **例外處理**: 
  - 文件不齊
  - 審核逾期
  - 不合格處理
  - 申訴機制

#### 供應商主檔模型
```typescript
interface VendorMaster {
  id: string;
  vendorCode: string;
  
  // 基本資訊
  basicInfo: {
    companyName: string;
    tradingName?: string;
    registrationNo: string;  // 統一編號
    
    type: 'manufacturer' | 'distributor' | 'service' | 'contractor';
    category: string[];
    
    establishment: {
      date: Date;
      capital: number;
      employees: number;
    };
    
    address: {
      registered: Address;
      shipping?: Address;
      billing?: Address;
    };
    
    contact: {
      primary: {
        name: string;
        title: string;
        phone: string;
        mobile?: string;
        email: string;
      };
      
      secondary?: Contact[];
      
      departments?: {
        department: string;
        contact: Contact;
        responsibility: string;
      }[];
    };
  };
  
  // 商業資訊
  businessInfo: {
    businessScope: string[];
    mainProducts: string[];
    
    certifications?: {
      type: string;
      number: string;
      issuedBy: string;
      issuedDate: Date;
      expiryDate?: Date;
      document?: string;
    }[];
    
    capacity?: {
      production?: {
        monthly: number;
        unit: string;
      };
      
      warehouse?: {
        area: number;
        locations: string[];
      };
      
      logistics?: {
        ownFleet: boolean;
        vehicles?: number;
      };
    };
    
    financial?: {
      creditLimit: number;
      paymentTerms: string;
      currency: string;
      
      bankAccount: {
        bank: string;
        branch: string;
        accountNo: string;
        accountName: string;
        swift?: string;
      }[];
      
      taxInfo: {
        taxId: string;
        vatNo?: string;
        taxRate?: number;
      };
    };
  };
  
  // 資格認證
  qualification: {
    status: 'pending' | 'qualified' | 'conditional' | 'suspended' | 'blacklisted';
    
    evaluation: {
      evaluationDate: Date;
      evaluator: string;
      
      criteria: {
        criterion: string;
        weight: number;
        score: number;
        comments?: string;
      }[];
      
      totalScore: number;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      
      recommendation: string;
      improvements?: string[];
    };
    
    approval: {
      approvedBy: string;
      approvedDate: Date;
      validUntil: Date;
      
      conditions?: string[];
      restrictions?: string[];
    };
    
    audit?: {
      lastAudit: Date;
      nextAudit: Date;
      
      findings?: {
        date: Date;
        type: 'major' | 'minor' | 'observation';
        description: string;
        corrective_action?: string;
        status: 'open' | 'closed';
      }[];
    };
  };
  
  // 績效評級
  performance?: {
    overall_rating: number;
    
    metrics: {
      quality: {
        score: number;
        defect_rate: number;
        return_rate: number;
      };
      
      delivery: {
        score: number;
        on_time_rate: number;
        lead_time_avg: number;
      };
      
      service: {
        score: number;
        response_time: number;
        issue_resolution: number;
      };
      
      price: {
        score: number;
        competitiveness: number;
        stability: number;
      };
    };
    
    history: {
      period: string;
      rating: number;
      issues?: string[];
    }[];
    
    classification: 'strategic' | 'preferred' | 'approved' | 'provisional' | 'inactive';
  };
  
  // 合規性
  compliance: {
    documents: {
      type: string;
      name: string;
      number?: string;
      issuedDate?: Date;
      expiryDate?: Date;
      file?: string;
      verified: boolean;
    }[];
    
    insurance?: {
      type: string;
      policy_no: string;
      coverage: number;
      expiry: Date;
    }[];
    
    agreements?: {
      type: 'nda' | 'contract' | 'sla' | 'other';
      reference: string;
      signedDate: Date;
      validUntil?: Date;
      document?: string;
    }[];
  };
  
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    version: number;
  };
}
```

### FR-BDM-VIM-003: 評級分類管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 定期評估或績效事件
- **行為**: 評定供應商等級並分類管理
- **資料輸入**: 
  - 評估指標
  - 績效數據
  - 事件記錄
  - 權重設定
  - 評級標準
- **資料輸出**: 
  - 評級結果
  - 等級變更
  - 改善建議
  - 獎懲措施
  - 排名報告
- **UI反應**: 
  - 評分卡
  - 等級顯示
  - 趨勢圖表
  - 比較分析
  - 通知發送
- **例外處理**: 
  - 數據缺失
  - 評級爭議
  - 系統錯誤
  - 特殊處理

#### 供應商評級模型
```typescript
interface VendorRating {
  vendorId: string;
  ratingPeriod: { start: Date; end: Date; };
  
  // 評級維度
  dimensions: {
    quality: {
      weight: number;
      
      metrics: {
        defectRate: {
          target: number;
          actual: number;
          score: number;
        };
        
        returnRate: {
          target: number;
          actual: number;
          score: number;
        };
        
        certificationCompliance: {
          required: string[];
          achieved: string[];
          score: number;
        };
        
        qualitySystem: {
          auditscore?: number;
          improvements: number;
          score: number;
        };
      };
      
      totalScore: number;
    };
    
    delivery: {
      weight: number;
      
      metrics: {
        onTimeDelivery: {
          target: number;
          actual: number;
          score: number;
        };
        
        leadTimePerformance: {
          promised: number;
          actual: number;
          score: number;
        };
        
        flexibility: {
          urgentRequests: number;
          fulfilled: number;
          score: number;
        };
      };
      
      totalScore: number;
    };
    
    cost: {
      weight: number;
      
      metrics: {
        priceCompetitiveness: {
          marketAverage: number;
          vendorPrice: number;
          score: number;
        };
        
        costReduction: {
          initiatives: number;
          savings: number;
          score: number;
        };
        
        paymentTerms: {
          standard: number;
          offered: number;
          score: number;
        };
      };
      
      totalScore: number;
    };
    
    service: {
      weight: number;
      
      metrics: {
        responseTime: {
          target: number;
          average: number;
          score: number;
        };
        
        problemResolution: {
          issues: number;
          resolved: number;
          avgTime: number;
          score: number;
        };
        
        communication: {
          rating: number;
          score: number;
        };
      };
      
      totalScore: number;
    };
    
    innovation?: {
      weight: number;
      
      metrics: {
        newProducts: number;
        improvements: number;
        collaboration: number;
      };
      
      totalScore: number;
    };
  };
  
  // 綜合評級
  overallRating: {
    score: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
    rank?: number;
    percentile?: number;
    
    trend: 'improving' | 'stable' | 'declining';
    previousScore?: number;
  };
  
  // 分類結果
  classification: {
    tier: 'strategic' | 'preferred' | 'approved' | 'conditional' | 'restricted';
    
    benefits?: {
      priorityAllocation: boolean;
      extendedTerms: boolean;
      volumeDiscounts: boolean;
      jointDevelopment: boolean;
    };
    
    requirements?: {
      minimumScore: number;
      mandatoryCertifications: string[];
      auditFrequency: string;
    };
    
    actions?: {
      type: 'reward' | 'improvement' | 'warning' | 'suspension';
      description: string;
      deadline?: Date;
    }[];
  };
  
  // 改善計劃
  improvementPlan?: {
    areas: {
      dimension: string;
      currentScore: number;
      targetScore: number;
      actions: string[];
      timeline: Date;
    }[];
    
    monitoring: {
      checkpoints: Date[];
      responsible: string;
    };
  };
}
```

### FR-BDM-VIM-004: 文件證照管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 文件上傳或到期提醒
- **行為**: 管理供應商相關文件和證照
- **資料輸入**: 
  - 文件類型
  - 有效期限
  - 檔案上傳
  - 審核狀態
  - 提醒設定
- **資料輸出**: 
  - 文件清單
  - 到期提醒
  - 審核記錄
  - 下載連結
  - 合規報告
- **UI反應**: 
  - 文件上傳
  - 預覽功能
  - 狀態標示
  - 到期警示
  - 批次下載
- **例外處理**: 
  - 檔案過大
  - 格式不符
  - 過期處理
  - 遺失補發

### FR-BDM-VIM-005: 供應商關係維護
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 互動記錄或關係管理需求
- **行為**: 維護供應商往來記錄和關係
- **資料輸入**: 
  - 拜訪記錄
  - 會議紀要
  - 問題處理
  - 合作專案
  - 滿意度調查
- **資料輸出**: 
  - 互動歷史
  - 關係評分
  - 問題追蹤
  - 專案狀態
  - 分析報告
- **UI反應**: 
  - 時間軸視圖
  - 活動記錄
  - 提醒設定
  - 狀態更新
  - 報告生成
- **例外處理**: 
  - 衝突處理
  - 升級機制
  - 資料同步
  - 權限控制

## 3. 系統設計

### 3.1 資料模型

```typescript
// 供應商申請
interface VendorApplication {
  id: string;
  applicationNo: string;
  
  // 申請資訊
  application: {
    type: 'new' | 'update' | 'renewal';
    submittedAt: Date;
    submittedBy: string;
    
    company: {
      name: string;
      registrationNo: string;
      contact: Contact;
      documents: Document[];
    };
    
    requestedCategories: string[];
    estimatedVolume?: number;
  };
  
  // 審核流程
  review: {
    stage: 'document' | 'evaluation' | 'site_audit' | 'approval' | 'completed';
    
    documentReview?: {
      reviewer: string;
      date: Date;
      checklist: ChecklistItem[];
      result: 'pass' | 'fail' | 'conditional';
      comments?: string;
    };
    
    evaluation?: {
      evaluator: string;
      date: Date;
      scorecard: Scorecard;
      recommendation: string;
    };
    
    siteAudit?: {
      auditor: string;
      date: Date;
      findings: Finding[];
      score: number;
      result: string;
    };
    
    approval?: {
      approver: string;
      date: Date;
      decision: 'approved' | 'rejected' | 'conditional';
      conditions?: string[];
      validUntil?: Date;
    };
  };
  
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
}

// 文件管理
interface VendorDocument {
  id: string;
  vendorId: string;
  
  document: {
    type: string;
    name: string;
    category: 'license' | 'certificate' | 'contract' | 'financial' | 'other';
    
    file: {
      url: string;
      size: number;
      format: string;
      uploadedAt: Date;
      uploadedBy: string;
    };
    
    validity?: {
      issuedDate?: Date;
      expiryDate?: Date;
      renewalRequired: boolean;
      reminderDays?: number;
    };
    
    verification?: {
      required: boolean;
      verified: boolean;
      verifiedBy?: string;
      verifiedAt?: Date;
      notes?: string;
    };
  };
  
  metadata: {
    tags?: string[];
    description?: string;
    relatedTo?: string[];
  };
  
  status: 'active' | 'expired' | 'pending' | 'archived';
}

// 供應商互動
interface VendorInteraction {
  id: string;
  vendorId: string;
  
  interaction: {
    type: 'meeting' | 'call' | 'email' | 'visit' | 'audit' | 'complaint' | 'feedback';
    date: Date;
    
    participants: {
      internal: string[];
      external: string[];
    };
    
    subject: string;
    description: string;
    
    location?: string;
    duration?: number;
    
    outcomes?: {
      decisions?: string[];
      actionItems?: {
        action: string;
        responsible: string;
        dueDate: Date;
        status: string;
      }[];
      nextSteps?: string;
    };
    
    attachments?: string[];
  };
  
  followUp?: {
    required: boolean;
    date?: Date;
    assignedTo?: string;
    completed?: boolean;
  };
  
  sentiment?: 'positive' | 'neutral' | 'negative';
  
  relatedTo?: {
    type: 'order' | 'issue' | 'project' | 'contract';
    reference: string;
  };
}
```

### 3.2 API 設計

```typescript
// 供應商管理 API
interface VendorManagementAPI {
  // 基本資料
  POST   /api/bdm/vendors                     // 建立供應商
  GET    /api/bdm/vendors                     // 查詢供應商
  GET    /api/bdm/vendors/:id                 // 供應商詳情
  PUT    /api/bdm/vendors/:id                 // 更新資料
  DELETE /api/bdm/vendors/:id                 // 刪除供應商
  
  // 資格審核
  POST   /api/bdm/vendors/apply               // 申請審核
  GET    /api/bdm/vendors/applications        // 申請列表
  POST   /api/bdm/vendors/:id/evaluate        // 執行評估
  POST   /api/bdm/vendors/:id/approve         // 核准供應商
  
  // 評級管理
  POST   /api/bdm/vendors/:id/rate            // 評定等級
  GET    /api/bdm/vendors/:id/rating          // 查詢評級
  GET    /api/bdm/vendors/rankings            // 排名列表
  POST   /api/bdm/vendors/:id/classify        // 分類管理
  
  // 文件管理
  POST   /api/bdm/vendors/:id/documents       // 上傳文件
  GET    /api/bdm/vendors/:id/documents       // 文件列表
  GET    /api/bdm/documents/:id               // 文件詳情
  DELETE /api/bdm/documents/:id               // 刪除文件
  
  // 關係維護
  POST   /api/bdm/vendors/:id/interactions    // 記錄互動
  GET    /api/bdm/vendors/:id/interactions    // 互動歷史
  GET    /api/bdm/vendors/:id/relationship    // 關係評估
}

// WebSocket 事件
interface VIMWebSocketEvents {
  'vendor:created': (vendor: any) => void;
  'vendor:updated': (vendor: any) => void;
  'document:expiring': (document: any) => void;
  'rating:changed': (rating: any) => void;
  'audit:scheduled': (audit: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **PM**: 採購作業
- **FA-AP**: 付款資訊
- **LM**: 物流配送
- **品質系統**: 品質記錄
- **合約系統**: 合約管理

### 4.2 外部系統整合
- **政府系統**: 公司登記查詢
- **信用機構**: 信用評等
- **認證機構**: 證書驗證
- **銀行系統**: 帳戶驗證

## 5. 成功指標

### 5.1 業務指標
- 供應商建檔時間 < 2天
- 資料完整度 > 95%
- 證照過期率 < 1%
- 評級準確度 > 90%

### 5.2 系統指標
- 查詢響應時間 < 1秒
- 並發處理 > 100筆
- 系統可用性 ≥ 99.9%
- 資料正確性 100%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: bdm@tsaitung.com