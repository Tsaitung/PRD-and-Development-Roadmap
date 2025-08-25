# SA-UM 使用者管理 (User Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: SA-OBM (組織管理), UP-PS (個人設定), 所有模組 (權限控制)

## 1. 功能概述

### 1.1 目的
建立完整的使用者身份與存取管理系統，提供使用者帳號管理、身份驗證、權限控制、角色管理和稽核追蹤功能，確保系統安全性和合規性。

### 1.2 範圍
- 使用者帳號管理
- 身份驗證機制
- 角色權限控制
- 單一登入整合
- 稽核日誌記錄

### 1.3 關鍵價值
- 資安風險降低 80%
- 權限管理效率提升 60%
- 合規性達成率 100%
- 使用者體驗改善 40%

## 2. 功能性需求

### FR-SA-UM-001: 使用者帳號管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 員工入職、離職或調動
- **行為**: 管理使用者帳號生命週期
- **資料輸入**: 
  - 員工資料
  - 部門資訊
  - 職務角色
  - 權限需求
  - 有效期限
- **資料輸出**: 
  - 帳號資訊
  - 存取權限
  - 使用記錄
  - 異常報告
  - 到期提醒
- **UI反應**: 
  - 帳號申請表單
  - 批次匯入
  - 狀態管理
  - 權限檢視
  - 快速搜尋
- **例外處理**: 
  - 重複帳號
  - 權限衝突
  - 過期處理
  - 異常登入

#### 驗收標準
```yaml
- 條件: 新增使用者帳號
  預期結果: 自動分配權限並發送啟用通知

- 條件: 員工離職
  預期結果: 立即停用帳號並保留稽核記錄

- 條件: 權限變更
  預期結果: 記錄變更歷史並通知相關人員
```

#### Traceability
- **測試案例**: tests/unit/FR-SA-UM-001.test.ts
- **實作程式**: src/modules/sa/services/userManagement.service.ts
- **相關文件**: TOC Modules.md - Section 13.1

### FR-SA-UM-002: 身份驗證機制
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 使用者登入或存取資源
- **行為**: 驗證使用者身份
- **資料輸入**: 
  - 登入憑證
  - 多因素驗證
  - 生物特徵
  - 裝置資訊
  - 位置資訊
- **資料輸出**: 
  - 驗證結果
  - 存取令牌
  - 工作階段
  - 登入記錄
  - 風險評分
- **UI反應**: 
  - 登入介面
  - MFA驗證
  - 記住裝置
  - 忘記密碼
  - 安全提示
- **例外處理**: 
  - 密碼錯誤
  - 帳號鎖定
  - 異常位置
  - 暴力破解

#### 使用者管理模型
```typescript
interface UserManagement {
  id: string;
  userId: string;
  
  // 基本資訊
  profile: {
    employeeId: string;
    username: string;
    email: string;
    
    personalInfo: {
      firstName: string;
      lastName: string;
      displayName: string;
      
      phone?: string;
      mobile?: string;
      
      photo?: string;
      timezone?: string;
      language: string;
    };
    
    employment: {
      department: string;
      position: string;
      manager?: string;
      
      hireDate: Date;
      employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
      
      location?: {
        office: string;
        building?: string;
        floor?: string;
        seat?: string;
      };
    };
    
    status: 'active' | 'inactive' | 'suspended' | 'terminated';
    
    lifecycle: {
      createdAt: Date;
      activatedAt?: Date;
      lastModified?: Date;
      deactivatedAt?: Date;
      
      expiryDate?: Date;
      reviewDate?: Date;
    };
  };
  
  // 認證資訊
  authentication: {
    credentials: {
      passwordHash?: string;
      passwordSalt?: string;
      
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        
        expiryDays: number;
        historyCount: number;
        
        lastChanged?: Date;
        nextChange?: Date;
      };
      
      temporaryPassword?: {
        value: string;
        expiresAt: Date;
        mustChange: boolean;
      };
    };
    
    mfa?: {
      enabled: boolean;
      type: 'totp' | 'sms' | 'email' | 'hardware' | 'biometric';
      
      totp?: {
        secret: string;
        qrCode?: string;
        backupCodes?: string[];
      };
      
      sms?: {
        phoneNumber: string;
        verified: boolean;
      };
      
      biometric?: {
        type: 'fingerprint' | 'face' | 'iris';
        enrolled: boolean;
        deviceIds?: string[];
      };
    };
    
    sso?: {
      enabled: boolean;
      provider: 'saml' | 'oauth2' | 'oidc' | 'ldap';
      
      externalId?: string;
      attributes?: { [key: string]: any; };
      
      lastSync?: Date;
    };
    
    sessions?: {
      sessionId: string;
      
      device: {
        type: string;
        os: string;
        browser?: string;
        ip: string;
        location?: string;
      };
      
      startTime: Date;
      lastActivity: Date;
      expiresAt: Date;
      
      active: boolean;
    }[];
  };
  
  // 角色權限
  authorization: {
    roles: {
      roleId: string;
      roleName: string;
      
      type: 'system' | 'business' | 'custom';
      
      scope?: {
        organization?: string;
        department?: string;
        project?: string;
      };
      
      assignedAt: Date;
      assignedBy: string;
      
      validFrom?: Date;
      validTo?: Date;
      
      delegation?: {
        fromUser: string;
        reason: string;
        period: { start: Date; end: Date; };
      };
    }[];
    
    permissions: {
      permissionId: string;
      resource: string;
      
      actions: ('create' | 'read' | 'update' | 'delete' | 'execute' | 'approve')[];
      
      conditions?: {
        field: string;
        operator: string;
        value: any;
      }[];
      
      source: 'role' | 'direct' | 'delegated';
      
      granted: boolean;
    }[];
    
    dataAccess?: {
      level: 'global' | 'organization' | 'department' | 'team' | 'self';
      
      restrictions?: {
        entities?: string[];
        fields?: string[];
        filters?: any;
      };
      
      specialAccess?: {
        type: string;
        scope: string;
        reason: string;
        approvedBy: string;
        expiresAt?: Date;
      }[];
    };
    
    apiAccess?: {
      enabled: boolean;
      
      apiKeys?: {
        keyId: string;
        keyHash: string;
        
        name: string;
        scopes: string[];
        
        rateLimit?: {
          requests: number;
          period: string;
        };
        
        created: Date;
        lastUsed?: Date;
        expiresAt?: Date;
        
        active: boolean;
      }[];
    };
  };
  
  // 安全設定
  security: {
    riskScore?: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      
      factors: {
        factor: string;
        weight: number;
        value: number;
      }[];
      
      lastCalculated: Date;
    };
    
    trustedDevices?: {
      deviceId: string;
      deviceName: string;
      
      fingerprint: string;
      
      firstSeen: Date;
      lastSeen: Date;
      
      trusted: boolean;
      verified?: boolean;
    }[];
    
    loginRestrictions?: {
      allowedIPs?: string[];
      blockedIPs?: string[];
      
      allowedCountries?: string[];
      blockedCountries?: string[];
      
      timeRestrictions?: {
        allowedDays?: number[];
        allowedHours?: { start: string; end: string; };
        timezone?: string;
      };
      
      deviceRestrictions?: {
        requireKnownDevice: boolean;
        maxDevices?: number;
      };
    };
    
    lockout?: {
      locked: boolean;
      reason?: string;
      
      attempts?: number;
      lockedAt?: Date;
      unlockAt?: Date;
      
      history?: {
        date: Date;
        reason: string;
        duration: number;
      }[];
    };
  };
  
  // 稽核追蹤
  auditLog?: {
    events: {
      eventId: string;
      timestamp: Date;
      
      type: 'login' | 'logout' | 'access' | 'change' | 'error';
      
      action: string;
      resource?: string;
      
      result: 'success' | 'failure' | 'blocked';
      
      details?: {
        ip?: string;
        device?: string;
        location?: string;
        reason?: string;
      };
      
      risk?: {
        score: number;
        flags?: string[];
      };
    }[];
    
    retention: {
      days: number;
      archiveLocation?: string;
    };
  };
}
```

### FR-SA-UM-003: 角色權限控制
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 存取資源或執行操作
- **行為**: 控制使用者存取權限
- **資料輸入**: 
  - 角色定義
  - 權限矩陣
  - 資源清單
  - 條件規則
  - 繼承關係
- **資料輸出**: 
  - 權限決策
  - 存取記錄
  - 違規警告
  - 權限報表
  - 合規報告
- **UI反應**: 
  - 角色管理
  - 權限矩陣
  - 模擬測試
  - 衝突檢測
  - 視覺化展示
- **例外處理**: 
  - 權限不足
  - 角色衝突
  - 循環繼承
  - 越權存取

#### 角色權限模型
```typescript
interface RolePermission {
  // 角色定義
  role: {
    roleId: string;
    roleName: string;
    description: string;
    
    type: 'system' | 'business' | 'technical' | 'custom';
    level: number;  // 層級
    
    // 權限集合
    permissions: {
      module: string;
      resource: string;
      
      operations: {
        operation: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve';
        allowed: boolean;
        
        conditions?: {
          type: 'field' | 'time' | 'amount' | 'status';
          expression: string;
        }[];
      }[];
      
      dataScope?: {
        type: 'all' | 'organization' | 'department' | 'team' | 'self' | 'custom';
        filter?: string;
      };
    }[];
    
    // 角色繼承
    inheritance?: {
      parentRoles?: string[];
      childRoles?: string[];
      
      override?: {
        permission: string;
        action: 'grant' | 'revoke';
      }[];
    };
    
    // 互斥關係
    exclusions?: {
      roleId: string;
      reason: string;
    }[];
    
    // 委派設定
    delegation?: {
      allowDelegation: boolean;
      maxDelegationLevels?: number;
      requireApproval?: boolean;
    };
    
    status: 'active' | 'inactive' | 'draft';
  };
  
  // 權限策略
  policy: {
    // 存取控制
    accessControl: {
      model: 'rbac' | 'abac' | 'pbac' | 'hybrid';  // Role/Attribute/Policy Based
      
      defaultDeny: boolean;
      
      evaluation: {
        order: 'deny_override' | 'allow_override' | 'first_match';
        combineLogic: 'and' | 'or';
      };
    };
    
    // 職責分離
    segregationOfDuties?: {
      rules: {
        name: string;
        conflictingRoles: string[];
        conflictingPermissions?: string[];
        
        enforcement: 'prevent' | 'warn' | 'monitor';
      }[];
    };
    
    // 最小權限
    leastPrivilege?: {
      enabled: boolean;
      
      review: {
        frequency: 'monthly' | 'quarterly' | 'annually';
        lastReview?: Date;
        nextReview?: Date;
      };
      
      unused: {
        threshold: number;  // days
        action: 'notify' | 'suspend' | 'revoke';
      };
    };
    
    // 時效控制
    temporal?: {
      accessWindows?: {
        days: number[];
        hours: { start: string; end: string; };
        timezone: string;
      };
      
      sessionTimeout: number;  // minutes
      absoluteTimeout?: number;  // minutes
      
      reauthentication?: {
        required: boolean;
        triggers: string[];
        frequency?: number;
      };
    };
  };
}
```

### FR-SA-UM-004: 單一登入整合
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 使用者登入或切換系統
- **行為**: 提供單一登入體驗
- **資料輸入**: 
  - 身份提供者
  - 認證協定
  - 屬性映射
  - 信任關係
  - 工作階段
- **資料輸出**: 
  - SSO令牌
  - 使用者屬性
  - 登入狀態
  - 同步記錄
  - 錯誤報告
- **UI反應**: 
  - SSO登入
  - 提供者選擇
  - 自動跳轉
  - 狀態同步
  - 登出處理
- **例外處理**: 
  - 提供者故障
  - 屬性缺失
  - 令牌過期
  - 同步失敗

### FR-SA-UM-005: 稽核日誌記錄
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 任何安全相關事件
- **行為**: 記錄和分析稽核日誌
- **資料輸入**: 
  - 事件類型
  - 使用者動作
  - 系統變更
  - 存取記錄
  - 異常行為
- **資料輸出**: 
  - 稽核報告
  - 合規證明
  - 異常分析
  - 趨勢圖表
  - 調查線索
- **UI反應**: 
  - 日誌檢視
  - 進階搜尋
  - 時間軸
  - 關聯分析
  - 匯出功能
- **例外處理**: 
  - 日誌遺失
  - 竄改偵測
  - 儲存空間
  - 效能影響

## 3. 系統設計

### 3.1 資料模型

```typescript
// 單一登入
interface SingleSignOn {
  // SSO配置
  configuration: {
    providerId: string;
    providerName: string;
    
    protocol: 'saml2' | 'oauth2' | 'oidc' | 'ws-fed';
    
    endpoints: {
      authorization?: string;
      token?: string;
      userInfo?: string;
      logout?: string;
      
      metadata?: string;
    };
    
    credentials: {
      clientId?: string;
      clientSecret?: string;
      
      certificate?: {
        public: string;
        private?: string;
        fingerprint: string;
      };
    };
    
    attributeMapping: {
      externalAttribute: string;
      internalField: string;
      transform?: string;
    }[];
    
    options?: {
      forceAuthn?: boolean;
      requestSignature?: boolean;
      responseSignature?: boolean;
      encryptAssertion?: boolean;
    };
    
    enabled: boolean;
  };
  
  // SSO會話
  session: {
    sessionId: string;
    
    provider: string;
    externalSessionId?: string;
    
    user: {
      externalId: string;
      internalId: string;
      attributes: any;
    };
    
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
      
      expiresAt?: Date;
    };
    
    created: Date;
    lastAccessed: Date;
    expiresAt: Date;
    
    active: boolean;
  };
  
  // 聯合管理
  federation?: {
    trustedProviders: string[];
    
    userProvisioning: {
      autoCreate: boolean;
      autoUpdate: boolean;
      autoDeactivate: boolean;
      
      mappingRules?: any;
    };
    
    groupSync?: {
      enabled: boolean;
      mappings: {
        externalGroup: string;
        internalRole: string;
      }[];
    };
  };
}

// 稽核日誌
interface AuditLog {
  logId: string;
  timestamp: Date;
  
  // 事件資訊
  event: {
    category: 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'error';
    type: string;
    action: string;
    
    severity: 'info' | 'warning' | 'error' | 'critical';
    
    result: 'success' | 'failure' | 'partial';
    reason?: string;
  };
  
  // 主體資訊
  subject: {
    userId?: string;
    username?: string;
    
    roles?: string[];
    
    session?: string;
    
    ip: string;
    userAgent?: string;
    
    location?: {
      country?: string;
      city?: string;
      coordinates?: { lat: number; lng: number; };
    };
  };
  
  // 客體資訊
  object?: {
    type: string;
    id?: string;
    name?: string;
    
    module?: string;
    resource?: string;
    
    before?: any;
    after?: any;
    
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  };
  
  // 環境資訊
  context?: {
    application: string;
    environment: string;
    version?: string;
    
    server?: string;
    
    requestId?: string;
    correlationId?: string;
    
    duration?: number;
    
    additionalInfo?: any;
  };
  
  // 合規性
  compliance?: {
    regulations?: string[];
    
    retention: {
      days: number;
      archived?: boolean;
      purgeDate?: Date;
    };
    
    signature?: {
      algorithm: string;
      value: string;
      verified?: boolean;
    };
  };
}

// 安全監控
interface SecurityMonitoring {
  // 威脅偵測
  threatDetection: {
    rules: {
      ruleId: string;
      name: string;
      
      pattern: {
        events: string[];
        timeWindow: number;
        threshold: number;
      };
      
      severity: 'low' | 'medium' | 'high' | 'critical';
      
      actions: {
        alert: boolean;
        block: boolean;
        lockAccount?: boolean;
        notifyAdmin?: boolean;
      };
      
      enabled: boolean;
    }[];
    
    incidents?: {
      incidentId: string;
      detectedAt: Date;
      
      threat: string;
      confidence: number;
      
      affectedUsers: string[];
      
      status: 'open' | 'investigating' | 'resolved' | 'false_positive';
      
      response?: {
        actions: string[];
        resolvedBy?: string;
        resolvedAt?: Date;
      };
    }[];
  };
  
  // 行為分析
  behaviorAnalysis?: {
    baseline: {
      userId: string;
      
      patterns: {
        loginTimes: any;
        locations: any;
        devices: any;
        resources: any;
      };
      
      established: Date;
      lastUpdated: Date;
    };
    
    anomalies?: {
      userId: string;
      timestamp: Date;
      
      type: string;
      deviation: number;
      
      riskScore: number;
      
      investigated?: boolean;
    }[];
  };
  
  // 合規監控
  complianceMonitoring: {
    policies: {
      policyId: string;
      name: string;
      
      requirements: string[];
      
      checks: {
        checkId: string;
        description: string;
        
        automated: boolean;
        frequency?: string;
        
        lastChecked?: Date;
        result?: 'compliant' | 'non_compliant' | 'partial';
      }[];
      
      violations?: {
        date: Date;
        violation: string;
        severity: string;
        remediation?: string;
      }[];
    }[];
    
    reporting: {
      schedule: string;
      recipients: string[];
      
      lastReport?: Date;
      nextReport?: Date;
    };
  };
}
```

### 3.2 API 設計

```typescript
// 使用者管理 API
interface UserManagementAPI {
  // 使用者管理
  POST   /api/sa/users                        // 建立使用者
  GET    /api/sa/users                        // 使用者列表
  GET    /api/sa/users/:id                    // 使用者詳情
  PUT    /api/sa/users/:id                    // 更新使用者
  DELETE /api/sa/users/:id                    // 刪除使用者
  POST   /api/sa/users/import                 // 批次匯入
  
  // 認證管理
  POST   /api/sa/auth/login                   // 使用者登入
  POST   /api/sa/auth/logout                  // 使用者登出
  POST   /api/sa/auth/refresh                 // 更新令牌
  POST   /api/sa/auth/mfa/setup               // 設定MFA
  POST   /api/sa/auth/mfa/verify              // 驗證MFA
  
  // 角色權限
  POST   /api/sa/roles                        // 建立角色
  GET    /api/sa/roles                        // 角色列表
  PUT    /api/sa/roles/:id                    // 更新角色
  POST   /api/sa/roles/:id/assign             // 指派角色
  GET    /api/sa/permissions                  // 權限列表
  
  // SSO整合
  GET    /api/sa/sso/providers                // SSO提供者
  POST   /api/sa/sso/login                    // SSO登入
  POST   /api/sa/sso/callback                 // SSO回調
  POST   /api/sa/sso/logout                   // SSO登出
  
  // 稽核日誌
  GET    /api/sa/audit/logs                   // 日誌查詢
  GET    /api/sa/audit/reports                // 稽核報告
  POST   /api/sa/audit/export                 // 匯出日誌
  GET    /api/sa/audit/compliance             // 合規報告
}

// WebSocket 事件
interface UMWebSocketEvents {
  'user:created': (user: any) => void;
  'user:updated': (user: any) => void;
  'user:locked': (user: any) => void;
  'session:created': (session: any) => void;
  'security:alert': (alert: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **SA-OBM**: 組織架構
- **UP-PS**: 個人設定
- **所有模組**: 權限控制
- **BI**: 稽核分析

### 4.2 外部系統整合
- **AD/LDAP**: 目錄服務
- **SSO Provider**: 身份提供者
- **SIEM系統**: 安全監控
- **合規系統**: 法規遵循

## 5. 成功指標

### 5.1 業務指標
- 未授權存取事件 = 0
- 密碼重設時間 < 5分鐘
- 權限配置準確率 100%
- 合規稽核通過率 100%

### 5.2 系統指標
- 認證回應時間 < 1秒
- 同時在線使用者 > 1000人
- 稽核日誌完整性 100%
- 系統可用性 ≥ 99.99%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: security@tsaitung.com