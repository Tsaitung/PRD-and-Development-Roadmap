# UP-PS 個人設定 (Personal Settings) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: SA-UM (使用者管理), DSH-OV (儀表板), 所有模組 (個人化功能)

## 1. 功能概述

### 1.1 目的
提供個人化的使用者入口，讓使用者能夠自主管理個人資料、偏好設定、通知訂閱、工作環境配置，提升使用者體驗和工作效率。

### 1.2 範圍
- 個人資料維護
- 偏好設定管理
- 通知訂閱設定
- 介面個人化
- 快捷功能設定

### 1.3 關鍵價值
- 使用者滿意度提升 50%
- 工作效率提升 30%
- 系統採用率增加 40%
- 支援請求減少 25%

## 2. 功能性需求

### FR-UP-PS-001: 個人資料維護
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 使用者登入或資料變更
- **行為**: 管理個人基本資料和聯絡資訊
- **資料輸入**: 
  - 基本資料
  - 聯絡方式
  - 緊急聯絡人
  - 個人照片
  - 簽名檔
- **資料輸出**: 
  - 個人檔案
  - 名片資訊
  - 組織圖
  - 變更歷史
  - 隱私設定
- **UI反應**: 
  - 資料編輯表單
  - 照片上傳
  - 預覽功能
  - 驗證提示
  - 儲存確認
- **例外處理**: 
  - 必填欄位
  - 格式錯誤
  - 檔案過大
  - 權限限制

#### 驗收標準
```yaml
- 條件: 更新個人資料
  預期結果: 即時生效並同步至相關系統

- 條件: 上傳個人照片
  預期結果: 自動調整尺寸並更新顯示

- 條件: 設定隱私等級
  預期結果: 控制資訊對其他使用者的可見性
```

#### Traceability
- **測試案例**: tests/unit/FR-UP-PS-001.test.ts
- **實作程式**: src/modules/up/services/personalSettings.service.ts
- **相關文件**: TOC Modules.md - Section 14.1

### FR-UP-PS-002: 偏好設定管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 使用者自訂或系統建議
- **行為**: 設定個人使用偏好
- **資料輸入**: 
  - 語言設定
  - 時區設定
  - 日期格式
  - 數字格式
  - 主題樣式
- **資料輸出**: 
  - 設定檔
  - 套用效果
  - 同步狀態
  - 備份設定
  - 還原選項
- **UI反應**: 
  - 設定面板
  - 即時預覽
  - 重設預設
  - 匯入匯出
  - 套用確認
- **例外處理**: 
  - 不支援的設定
  - 衝突設定
  - 同步失敗
  - 版本不相容

#### 個人設定模型
```typescript
interface PersonalSettings {
  id: string;
  userId: string;
  
  // 個人檔案
  profile: {
    // 基本資訊
    basicInfo: {
      firstName: string;
      lastName: string;
      preferredName?: string;
      
      title?: string;
      department?: string;
      employeeId?: string;
      
      bio?: string;
      skills?: string[];
      interests?: string[];
    };
    
    // 聯絡資訊
    contact: {
      workEmail: string;
      personalEmail?: string;
      
      workPhone?: string;
      mobilePhone?: string;
      
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
        email?: string;
      };
    };
    
    // 社交媒體
    social?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
    
    // 個人化元素
    personalization: {
      avatar?: {
        url: string;
        thumbnail?: string;
        uploadedAt: Date;
      };
      
      signature?: {
        text?: string;
        html?: string;
        image?: string;
      };
      
      businessCard?: {
        template: string;
        customFields?: any;
      };
    };
    
    // 隱私設定
    privacy: {
      profileVisibility: 'public' | 'internal' | 'team' | 'private';
      
      fieldVisibility?: {
        [field: string]: 'public' | 'internal' | 'team' | 'private';
      };
      
      searchable: boolean;
      showInDirectory: boolean;
      
      dataSharing?: {
        analytics: boolean;
        improvement: boolean;
        marketing?: boolean;
      };
    };
  };
  
  // 偏好設定
  preferences: {
    // 區域設定
    locale: {
      language: string;
      country?: string;
      timezone: string;
      
      formats: {
        date: string;
        time: string;
        number: string;
        currency: string;
        
        firstDayOfWeek: number;
        workingDays?: number[];
      };
      
      units?: {
        temperature: 'celsius' | 'fahrenheit';
        distance: 'metric' | 'imperial';
        weight: 'metric' | 'imperial';
      };
    };
    
    // 介面設定
    interface: {
      theme: 'light' | 'dark' | 'auto' | 'custom';
      
      customTheme?: {
        primaryColor?: string;
        accentColor?: string;
        backgroundColor?: string;
        textColor?: string;
      };
      
      layout: {
        density: 'comfortable' | 'compact' | 'spacious';
        sidebarPosition: 'left' | 'right';
        sidebarCollapsed?: boolean;
        
        fontSize?: 'small' | 'medium' | 'large';
        fontFamily?: string;
      };
      
      accessibility?: {
        highContrast: boolean;
        reducedMotion: boolean;
        screenReader: boolean;
        keyboardNavigation: boolean;
      };
    };
    
    // 功能設定
    features: {
      dashboard?: {
        defaultView: string;
        widgets?: string[];
        refreshInterval?: number;
      };
      
      navigation?: {
        favorites: string[];
        recentItems: number;
        quickAccess?: string[];
      };
      
      search?: {
        defaultScope: string;
        saveHistory: boolean;
        suggestions: boolean;
      };
      
      shortcuts?: {
        keyboard: {
          [action: string]: string;
        };
        
        quickActions?: {
          action: string;
          label: string;
          icon?: string;
        }[];
      };
    };
    
    // 工作設定
    workflow?: {
      defaultFilters?: any;
      savedViews?: {
        name: string;
        module: string;
        filters: any;
        columns?: string[];
      }[];
      
      templates?: {
        type: string;
        name: string;
        content: any;
      }[];
      
      automation?: {
        rules: {
          trigger: string;
          action: string;
          enabled: boolean;
        }[];
      };
    };
  };
  
  // 通知設定
  notifications: {
    // 通知管道
    channels: {
      email: {
        enabled: boolean;
        address?: string;
        
        digest?: {
          enabled: boolean;
          frequency: 'daily' | 'weekly' | 'monthly';
          time?: string;
        };
      };
      
      push?: {
        enabled: boolean;
        
        devices?: {
          deviceId: string;
          deviceName: string;
          platform: string;
          token?: string;
          active: boolean;
        }[];
      };
      
      sms?: {
        enabled: boolean;
        phoneNumber?: string;
        
        urgentOnly?: boolean;
      };
      
      inApp: {
        enabled: boolean;
        showPopup: boolean;
        playSound: boolean;
      };
    };
    
    // 訂閱設定
    subscriptions: {
      category: string;
      
      types: {
        type: string;
        label: string;
        
        channels: {
          email: boolean;
          push: boolean;
          sms: boolean;
          inApp: boolean;
        };
        
        frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
        
        conditions?: {
          field: string;
          operator: string;
          value: any;
        }[];
      }[];
      
      muted?: boolean;
      mutedUntil?: Date;
    }[];
    
    // 勿擾模式
    doNotDisturb?: {
      enabled: boolean;
      
      schedule?: {
        days: number[];
        startTime: string;
        endTime: string;
        timezone?: string;
      };
      
      exceptions?: string[];
    };
    
    // 通知歷史
    history?: {
      retention: number;  // days
      markAsRead: boolean;
      archive: boolean;
    };
  };
  
  // 安全設定
  security: {
    // 密碼管理
    password?: {
      lastChanged: Date;
      nextChange?: Date;
      
      changeReminder?: {
        enabled: boolean;
        daysBefore: number;
      };
    };
    
    // 雙因素認證
    twoFactor?: {
      enabled: boolean;
      methods: string[];
      
      backupCodes?: {
        generated: Date;
        used: number;
        remaining: number;
      };
      
      trustedDevices?: string[];
    };
    
    // 工作階段
    sessions?: {
      timeout: number;  // minutes
      lockScreen: boolean;
      
      rememberMe?: {
        enabled: boolean;
        duration: number;  // days
      };
      
      concurrent?: {
        allowed: boolean;
        maxSessions?: number;
      };
    };
    
    // 活動監控
    activityLog?: {
      viewEnabled: boolean;
      alertSuspicious: boolean;
      
      recentActivity?: {
        timestamp: Date;
        action: string;
        ip?: string;
        device?: string;
      }[];
    };
  };
  
  // 同步設定
  sync?: {
    enabled: boolean;
    
    devices?: {
      deviceId: string;
      deviceName: string;
      
      lastSync?: Date;
      
      settings: {
        syncProfile: boolean;
        syncPreferences: boolean;
        syncNotifications: boolean;
      };
    }[];
    
    cloud?: {
      provider: string;
      account?: string;
      
      autoSync: boolean;
      syncInterval?: number;
      
      lastSync?: Date;
      lastError?: string;
    };
    
    conflicts?: {
      resolution: 'latest' | 'prompt' | 'merge';
    };
  };
}
```

### FR-UP-PS-003: 通知訂閱設定
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 事件發生或使用者設定
- **行為**: 管理通知訂閱和推送設定
- **資料輸入**: 
  - 通知類型
  - 接收管道
  - 頻率設定
  - 過濾條件
  - 靜音設定
- **資料輸出**: 
  - 訂閱清單
  - 通知歷史
  - 未讀統計
  - 偏好分析
  - 建議優化
- **UI反應**: 
  - 訂閱管理
  - 批次設定
  - 測試發送
  - 歷史查看
  - 一鍵靜音
- **例外處理**: 
  - 管道失效
  - 發送失敗
  - 重複通知
  - 垃圾過濾

### FR-UP-PS-004: 介面個人化
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 使用者自訂或系統建議
- **行為**: 個人化系統介面和體驗
- **資料輸入**: 
  - 主題選擇
  - 版面配置
  - 小工具設定
  - 功能表自訂
  - 顏色方案
- **資料輸出**: 
  - 個人化介面
  - 配置檔案
  - 分享連結
  - 範本庫
  - 使用統計
- **UI反應**: 
  - 拖放編輯
  - 即時預覽
  - 主題切換
  - 重設預設
  - 範本套用
- **例外處理**: 
  - 瀏覽器不支援
  - 配置衝突
  - 效能影響
  - 版本相容

### FR-UP-PS-005: 快捷功能設定
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 使用頻率分析或手動設定
- **行為**: 設定快速存取和捷徑
- **資料輸入**: 
  - 常用功能
  - 快捷鍵
  - 書籤管理
  - 最近項目
  - 自訂連結
- **資料輸出**: 
  - 快捷選單
  - 工具列
  - 浮動按鈕
  - 指令列
  - 使用分析
- **UI反應**: 
  - 快捷設定
  - 拖放排序
  - 圖示選擇
  - 熱鍵綁定
  - 智能建議
- **例外處理**: 
  - 快捷鍵衝突
  - 功能失效
  - 權限變更
  - 連結失效

## 3. 系統設計

### 3.1 資料模型

```typescript
// 工作環境
interface Workspace {
  userId: string;
  
  // 儀表板配置
  dashboard: {
    layouts: {
      layoutId: string;
      name: string;
      
      default: boolean;
      
      grid: {
        columns: number;
        rows: number;
        gap: number;
      };
      
      widgets: {
        widgetId: string;
        type: string;
        
        position: {
          x: number;
          y: number;
          w: number;
          h: number;
        };
        
        config?: any;
        
        refreshInterval?: number;
      }[];
      
      responsive?: {
        breakpoint: string;
        layout: any;
      }[];
    }[];
    
    activeLayout?: string;
  };
  
  // 功能表自訂
  menu: {
    favorites: {
      itemId: string;
      type: 'module' | 'report' | 'link' | 'action';
      
      label: string;
      icon?: string;
      url?: string;
      
      sequence: number;
      
      badge?: {
        type: 'count' | 'dot' | 'text';
        value?: any;
        color?: string;
      };
    }[];
    
    recent: {
      itemId: string;
      type: string;
      
      label: string;
      url: string;
      
      accessedAt: Date;
      accessCount: number;
    }[];
    
    customLinks?: {
      label: string;
      url: string;
      icon?: string;
      
      openInNewTab?: boolean;
      
      category?: string;
    }[];
    
    hiddenItems?: string[];
    
    arrangement?: {
      grouping: 'category' | 'frequency' | 'alphabetical' | 'custom';
      collapsed?: string[];
    };
  };
  
  // 快速操作
  quickActions: {
    actions: {
      actionId: string;
      
      type: 'command' | 'script' | 'workflow';
      
      label: string;
      description?: string;
      icon?: string;
      
      shortcut?: {
        key: string;
        modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
      };
      
      action: {
        command?: string;
        params?: any;
        
        script?: string;
        
        workflow?: {
          steps: any[];
        };
      };
      
      context?: string[];
      
      enabled: boolean;
    }[];
    
    toolbar?: {
      visible: boolean;
      position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
      
      items: string[];
    };
    
    commandPalette?: {
      enabled: boolean;
      shortcut?: string;
      
      recentCommands?: string[];
    };
  };
}

// 通知管理
interface NotificationManagement {
  userId: string;
  
  // 通知佇列
  queue: {
    notificationId: string;
    
    type: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    
    title: string;
    message: string;
    
    data?: any;
    
    channels: string[];
    
    createdAt: Date;
    scheduledFor?: Date;
    
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    
    attempts?: {
      channel: string;
      attemptedAt: Date;
      result: string;
      error?: string;
    }[];
    
    readAt?: Date;
    dismissedAt?: Date;
    
    actions?: {
      action: string;
      label: string;
      url?: string;
    }[];
  }[];
  
  // 通知規則
  rules: {
    ruleId: string;
    name: string;
    
    trigger: {
      event: string;
      module?: string;
      
      conditions?: {
        field: string;
        operator: string;
        value: any;
      }[];
    };
    
    notification: {
      template: string;
      
      channels: string[];
      
      priority?: string;
      
      delay?: number;
      
      grouping?: {
        enabled: boolean;
        key?: string;
        window?: number;
      };
    };
    
    enabled: boolean;
    
    statistics?: {
      triggered: number;
      sent: number;
      read: number;
      
      lastTriggered?: Date;
    };
  }[];
  
  // 通知分組
  groups?: {
    groupId: string;
    groupKey: string;
    
    notifications: string[];
    
    summary?: {
      count: number;
      unread: number;
      
      latest?: Date;
      oldest?: Date;
    };
    
    collapsed?: boolean;
  }[];
}

// 個人化分析
interface PersonalizationAnalytics {
  userId: string;
  
  // 使用模式
  usagePatterns: {
    // 功能使用
    features: {
      feature: string;
      module: string;
      
      usageCount: number;
      lastUsed?: Date;
      
      averageDuration?: number;
      
      timeDistribution?: {
        hour: number;
        count: number;
      }[];
    }[];
    
    // 工作習慣
    habits: {
      loginTimes: {
        hour: number;
        frequency: number;
      }[];
      
      peakHours?: number[];
      
      sessionDuration: {
        average: number;
        min: number;
        max: number;
      };
      
      deviceUsage?: {
        device: string;
        percentage: number;
      }[];
    };
    
    // 互動模式
    interactions: {
      clickPaths?: {
        path: string[];
        count: number;
      }[];
      
      searchQueries?: {
        query: string;
        count: number;
        found: boolean;
      }[];
      
      errors?: {
        error: string;
        count: number;
        lastOccurred?: Date;
      }[];
    };
  };
  
  // 個人化建議
  recommendations: {
    // 功能建議
    features?: {
      feature: string;
      reason: string;
      confidence: number;
      
      similar Users?: number;
      
      dismissed?: boolean;
    }[];
    
    // 設定優化
    settings?: {
      setting: string;
      currentValue: any;
      suggestedValue: any;
      
      benefit: string;
      
      applied?: boolean;
    }[];
    
    // 學習資源
    learning?: {
      resource: string;
      type: 'tutorial' | 'video' | 'article' | 'tip';
      
      relevance: number;
      
      viewed?: boolean;
      helpful?: boolean;
    }[];
  };
  
  // A/B測試
  experiments?: {
    experimentId: string;
    
    variant: string;
    
    enrolled: Date;
    
    metrics?: {
      metric: string;
      value: number;
    }[];
    
    feedback?: {
      rating?: number;
      comment?: string;
    };
  }[];
}
```

### 3.2 API 設計

```typescript
// 個人設定 API
interface PersonalSettingsAPI {
  // 個人檔案
  GET    /api/up/profile                      // 取得個人檔案
  PUT    /api/up/profile                      // 更新個人檔案
  POST   /api/up/profile/avatar               // 上傳頭像
  DELETE /api/up/profile/avatar               // 刪除頭像
  
  // 偏好設定
  GET    /api/up/preferences                  // 取得偏好設定
  PUT    /api/up/preferences                  // 更新偏好設定
  POST   /api/up/preferences/reset            // 重設為預設
  POST   /api/up/preferences/export           // 匯出設定
  POST   /api/up/preferences/import           // 匯入設定
  
  // 通知管理
  GET    /api/up/notifications                // 通知列表
  PUT    /api/up/notifications/:id/read       // 標記已讀
  DELETE /api/up/notifications/:id            // 刪除通知
  GET    /api/up/notifications/subscriptions  // 訂閱設定
  PUT    /api/up/notifications/subscriptions  // 更新訂閱
  
  // 工作環境
  GET    /api/up/workspace                    // 取得工作環境
  PUT    /api/up/workspace                    // 更新工作環境
  POST   /api/up/workspace/widgets            // 新增小工具
  DELETE /api/up/workspace/widgets/:id        // 移除小工具
  
  // 快捷功能
  GET    /api/up/shortcuts                    // 快捷列表
  POST   /api/up/shortcuts                    // 新增快捷
  PUT    /api/up/shortcuts/:id                // 更新快捷
  DELETE /api/up/shortcuts/:id                // 刪除快捷
  
  // 使用分析
  GET    /api/up/analytics/usage              // 使用統計
  GET    /api/up/analytics/recommendations    // 個人化建議
  POST   /api/up/analytics/feedback           // 提供回饋
}

// WebSocket 事件
interface PSWebSocketEvents {
  'profile:updated': (profile: any) => void;
  'preferences:changed': (preferences: any) => void;
  'notification:received': (notification: any) => void;
  'workspace:synced': (workspace: any) => void;
  'recommendation:new': (recommendation: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **SA-UM**: 使用者認證
- **DSH-OV**: 儀表板配置
- **所有模組**: 個人化功能
- **BI**: 使用分析

### 4.2 外部系統整合
- **雲端儲存**: 設定同步
- **通知服務**: 推送通知
- **社交平台**: 個人資料
- **分析平台**: 行為追蹤

## 5. 成功指標

### 5.1 業務指標
- 個人化採用率 > 80%
- 設定完成率 > 90%
- 通知開啟率 > 60%
- 使用者滿意度 > 4.5/5

### 5.2 系統指標
- 設定載入時間 < 1秒
- 同步延遲 < 3秒
- 通知延遲 < 5秒
- 系統可用性 ≥ 99.9%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: userportal@tsaitung.com