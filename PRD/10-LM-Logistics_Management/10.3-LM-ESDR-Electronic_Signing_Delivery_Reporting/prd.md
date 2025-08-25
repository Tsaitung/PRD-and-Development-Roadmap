# LM-ESDR 電子簽收與配送回報 (Electronic Signing & Delivery Reporting) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: LM-DTRV (配送追蹤), OM (訂單管理), CRM (客戶管理), FA (財務會計)

## 1. 功能概述

### 1.1 目的
建立數位化簽收與配送回報系統，實現無紙化作業，即時回傳配送狀態，提供完整的配送證明與異常處理機制。

### 1.2 範圍
- 電子簽收作業
- 配送狀態回報
- 異常情況處理
- 簽收證明管理
- 配送績效分析

### 1.3 關鍵價值
- 簽收效率提升 70%
- 紙張成本節省 100%
- 爭議處理時間縮短 80%
- 資料準確性達 99.9%

## 2. 功能性需求

### FR-LM-ESDR-001: 電子簽收作業
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 司機到達配送點準備交貨
- **行為**: 提供多種電子簽收方式完成交貨確認
- **資料輸入**: 
  - 訂單條碼掃描
  - 收貨人身份驗證
  - 貨物清點確認
  - 電子簽名/蓋章
  - 現場照片拍攝
- **資料輸出**: 
  - 電子簽收單
  - 簽收時間戳記
  - GPS定位記錄
  - 簽收證明文件
  - 即時狀態更新
- **UI反應**: 
  - 手機簽收介面
  - 簽名板功能
  - 拍照上傳
  - 離線模式支援
  - 同步狀態顯示
- **例外處理**: 
  - 拒收處理
  - 部分簽收
  - 代收登記
  - 無人簽收

#### 驗收標準
```yaml
- 條件: 正常簽收作業
  預期結果: 30秒內完成簽收並同步至系統

- 條件: 網路斷線狀態
  預期結果: 支援離線簽收，恢復連線後自動同步

- 條件: 客戶拒收
  預期結果: 記錄拒收原因並觸發退貨流程
```

#### Traceability
- **測試案例**: tests/unit/FR-LM-ESDR-001.test.ts
- **實作程式**: src/modules/lm/services/electronicSigning.service.ts
- **相關文件**: TOC Modules.md - Section 10.3

### FR-LM-ESDR-002: 配送狀態回報
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 配送過程中各個檢查點
- **行為**: 即時回報配送進度與狀態
- **資料輸入**: 
  - 出車確認
  - 途中檢查點
  - 到達通知
  - 簽收完成
  - 返程確認
- **資料輸出**: 
  - 狀態更新記錄
  - 時間軌跡
  - 里程統計
  - 效率分析
  - 客戶通知
- **UI反應**: 
  - 快速狀態按鈕
  - 語音輸入
  - 自動定位
  - 批次更新
  - 進度顯示
- **例外處理**: 
  - 延遲回報
  - 路線偏離
  - 緊急事件
  - 通訊中斷

#### 配送狀態流程
```typescript
interface DeliveryStatus {
  orderId: string;
  trackingNo: string;
  
  // 狀態鏈
  statusChain: {
    status: DeliveryStatusType;
    timestamp: Date;
    location: Coordinates;
    operator: string;
    
    details: {
      description: string;
      photos?: string[];
      remarks?: string;
    };
    
    // 狀態類型
    type: 
      | 'dispatched'        // 已派車
      | 'in_transit'        // 運送中
      | 'arrived'           // 已到達
      | 'delivering'        // 配送中
      | 'delivered'         // 已送達
      | 'failed'            // 配送失敗
      | 'returned'          // 已退回
      | 'completed';        // 已完成
  }[];
  
  // 簽收資訊
  signature?: {
    type: 'electronic' | 'stamp' | 'photo' | 'otp';
    signedBy: string;
    relationship?: 'self' | 'family' | 'colleague' | 'guard' | 'other';
    signedAt: Date;
    
    evidence: {
      signature?: string;    // Base64 簽名圖片
      stamp?: string;        // 電子印章
      photos?: string[];     // 現場照片
      otp?: string;          // 一次性密碼
    };
    
    verification: {
      gpsLocation: Coordinates;
      deviceId: string;
      ipAddress: string;
      accuracy: number;
    };
  };
  
  // 異常記錄
  exceptions?: {
    type: string;
    timestamp: Date;
    description: string;
    resolution?: string;
    photos?: string[];
  }[];
}
```

### FR-LM-ESDR-003: 異常情況處理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 配送過程中遇到異常狀況
- **行為**: 記錄並處理各類配送異常
- **資料輸入**: 
  - 異常類型選擇
  - 詳細描述
  - 現場證據
  - 處理方案
  - 後續安排
- **資料輸出**: 
  - 異常報告
  - 處理流程
  - 通知清單
  - 追蹤記錄
  - 統計分析
- **UI反應**: 
  - 異常類型選單
  - 快速拍照
  - 語音記錄
  - 處理建議
  - 升級按鈕
- **例外處理**: 
  - 多重異常
  - 緊急處理
  - 客戶投訴
  - 貨損理賠

#### 異常處理機制
```typescript
interface DeliveryException {
  id: string;
  orderId: string;
  
  // 異常資訊
  exception: {
    category: 'address' | 'recipient' | 'goods' | 'vehicle' | 'weather' | 'other';
    
    type: 
      | 'wrong_address'      // 地址錯誤
      | 'recipient_absent'   // 收貨人不在
      | 'refused'            // 拒收
      | 'damaged'            // 貨損
      | 'lost'               // 遺失
      | 'vehicle_breakdown'  // 車輛故障
      | 'traffic_jam'        // 交通堵塞
      | 'bad_weather'        // 惡劣天氣
      | 'access_restricted'; // 無法進入
    
    severity: 'low' | 'medium' | 'high' | 'critical';
    
    occurredAt: Date;
    reportedBy: string;
    location: Coordinates;
  };
  
  // 詳細描述
  details: {
    description: string;
    evidence: {
      photos?: string[];
      videos?: string[];
      documents?: string[];
    };
    
    impact: {
      delayTime?: number;
      affectedOrders?: string[];
      estimatedLoss?: number;
    };
  };
  
  // 處理方案
  resolution: {
    action: 'retry' | 'return' | 'hold' | 'transfer' | 'compensate';
    
    plan: {
      description: string;
      scheduledDate?: Date;
      assignedTo?: string;
      cost?: number;
    };
    
    approval?: {
      requiredLevel: number;
      approvedBy?: string;
      approvedAt?: Date;
      comments?: string;
    };
  };
  
  // 處理狀態
  status: 'reported' | 'processing' | 'resolved' | 'closed';
  
  // 客戶溝通
  customerCommunication: {
    notified: boolean;
    method?: 'sms' | 'email' | 'phone' | 'app';
    response?: string;
    satisfaction?: number;
  };
  
  createdAt: Date;
  resolvedAt?: Date;
}
```

### FR-LM-ESDR-004: 簽收證明管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 需要查詢或提供簽收證明
- **行為**: 管理和提供合法有效的簽收證明文件
- **資料輸入**: 
  - 查詢條件
  - 時間範圍
  - 客戶資訊
  - 訂單編號
  - 驗證要求
- **資料輸出**: 
  - 簽收證明書
  - 配送軌跡
  - 時間證明
  - 法律文件
  - 批量匯出
- **UI反應**: 
  - 快速查詢
  - 證明預覽
  - 下載列印
  - 批量處理
  - 驗證碼核驗
- **例外處理**: 
  - 資料遺失
  - 偽造防範
  - 爭議舉證
  - 法律支援

### FR-LM-ESDR-005: 配送績效分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期績效評估或即時監控需求
- **行為**: 分析配送效率與服務品質
- **資料輸入**: 
  - 簽收數據
  - 時效統計
  - 異常記錄
  - 客戶評價
  - 成本資料
- **資料輸出**: 
  - 績效報表
  - KPI儀表板
  - 趨勢分析
  - 改善建議
  - 對標分析
- **UI反應**: 
  - 即時儀表板
  - 互動圖表
  - 下鑽分析
  - 自訂指標
  - 報表訂閱
- **例外處理**: 
  - 資料異常
  - 指標預警
  - 自動報告
  - 改善追蹤

## 3. 系統設計

### 3.1 資料模型

```typescript
// 電子簽收單
interface ElectronicPOD {  // Proof of Delivery
  id: string;
  podNumber: string;
  
  // 配送資訊
  delivery: {
    orderId: string;
    trackingNo: string;
    driverId: string;
    vehicleId: string;
    routeId: string;
  };
  
  // 收貨資訊
  recipient: {
    name: string;
    company?: string;
    phone: string;
    
    address: {
      full: string;
      coordinates: Coordinates;
      accuracy: number;
    };
  };
  
  // 貨物資訊
  goods: {
    items: {
      itemCode: string;
      itemName: string;
      orderedQty: number;
      deliveredQty: number;
      unit: string;
      condition: 'good' | 'damaged' | 'partial';
    }[];
    
    totalPieces: number;
    totalWeight?: number;
    totalVolume?: number;
  };
  
  // 簽收詳情
  signing: {
    method: 'signature' | 'stamp' | 'photo' | 'otp' | 'contactless';
    timestamp: Date;
    
    evidence: {
      signatureImage?: string;
      stampImage?: string;
      photoUrls?: string[];
      otpCode?: string;
      audioNote?: string;
    };
    
    signer: {
      name: string;
      idNumber?: string;
      relationship: string;
      contactNumber?: string;
    };
    
    location: {
      gps: Coordinates;
      address: string;
      landmark?: string;
      geofence?: boolean;
    };
  };
  
  // 設備資訊
  device: {
    deviceId: string;
    deviceType: string;
    appVersion: string;
    osVersion: string;
    networkType: string;
  };
  
  // 驗證資訊
  verification: {
    hash: string;
    blockchain?: string;
    qrCode: string;
    verifyUrl: string;
  };
  
  // 法律效力
  legal: {
    valid: boolean;
    compliance: string[];
    retention: number;  // 保存年限
    admissible: boolean; // 可採納性
  };
  
  createdAt: Date;
  syncedAt?: Date;
}

// 配送回報記錄
interface DeliveryReport {
  id: string;
  reportType: 'status' | 'exception' | 'completion';
  
  // 回報內容
  content: {
    orderId: string;
    driverId: string;
    
    status: {
      current: string;
      previous: string;
      changedAt: Date;
    };
    
    location: {
      coordinates: Coordinates;
      address: string;
      distance: number;  // 距離目的地
    };
    
    metrics: {
      speed?: number;
      temperature?: number;
      humidity?: number;
      fuelLevel?: number;
    };
    
    notes?: string;
    attachments?: string[];
  };
  
  // 通知設定
  notifications: {
    customer: boolean;
    operations: boolean;
    management: boolean;
    
    channels: ('sms' | 'email' | 'app' | 'webhook')[];
    
    sent: {
      channel: string;
      recipient: string;
      sentAt: Date;
      status: 'success' | 'failed';
    }[];
  };
  
  reportedAt: Date;
  processedAt?: Date;
}

// 績效指標
interface DeliveryPerformance {
  period: { start: Date; end: Date; };
  
  // 簽收指標
  signing: {
    totalDeliveries: number;
    successfulSignings: number;
    failedDeliveries: number;
    
    avgSigningTime: number;
    firstAttemptSuccess: number;
    
    methods: {
      signature: number;
      stamp: number;
      photo: number;
      otp: number;
      contactless: number;
    };
  };
  
  // 時效指標
  timeliness: {
    onTimeRate: number;
    avgDeliveryTime: number;
    avgDelayTime: number;
    
    timeDistribution: {
      early: number;
      onTime: number;
      late: number;
      veryLate: number;
    };
  };
  
  // 品質指標
  quality: {
    damageRate: number;
    lossRate: number;
    accuracyRate: number;
    
    customerSatisfaction: number;
    complaintRate: number;
    disputeRate: number;
  };
  
  // 異常指標
  exceptions: {
    total: number;
    byCategory: Record<string, number>;
    avgResolutionTime: number;
    repeatRate: number;
  };
  
  // 效率指標
  efficiency: {
    deliveriesPerDay: number;
    deliveriesPerRoute: number;
    utilizationRate: number;
    digitalSigningRate: number;
  };
}
```

### 3.2 API 設計

```typescript
// 電子簽收 API
interface ElectronicSigningAPI {
  // 簽收操作
  POST   /api/lm/signing/create               // 建立簽收
  GET    /api/lm/signing/:id                  // 查詢簽收詳情
  POST   /api/lm/signing/:id/evidence         // 上傳簽收證據
  GET    /api/lm/signing/verify/:code         // 驗證簽收
  
  // 批量操作
  POST   /api/lm/signing/batch                // 批量簽收
  GET    /api/lm/signing/pending              // 待簽收清單
  
  // 證明文件
  GET    /api/lm/pod/:id                      // 取得簽收證明
  POST   /api/lm/pod/generate                 // 生成證明文件
  GET    /api/lm/pod/download/:id             // 下載證明
}

// 配送回報 API
interface DeliveryReportingAPI {
  // 狀態回報
  POST   /api/lm/report/status                // 回報狀態
  POST   /api/lm/report/location              // 回報位置
  POST   /api/lm/report/exception             // 回報異常
  
  // 查詢功能
  GET    /api/lm/report/track/:trackingNo     // 追蹤查詢
  GET    /api/lm/report/history/:orderId      // 歷史記錄
  
  // 績效分析
  GET    /api/lm/report/performance           // 績效統計
  GET    /api/lm/report/analytics             // 分析報表
}

// WebSocket 事件
interface ESDRWebSocketEvents {
  'delivery:signed': (pod: any) => void;
  'delivery:failed': (failure: any) => void;
  'status:updated': (status: any) => void;
  'exception:reported': (exception: any) => void;
  'location:updated': (location: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **OM**: 訂單狀態同步
- **LM-DTRV**: 即時位置追蹤
- **CRM**: 客戶通知
- **FA**: 應收帳款確認
- **BI**: 數據分析

### 4.2 外部系統整合
- **SMS閘道**: 簡訊通知
- **Email服務**: 郵件通知
- **地圖服務**: 地址驗證
- **區塊鏈**: 存證服務

## 5. 成功指標

### 5.1 業務指標
- 簽收完成率 ≥ 99%
- 平均簽收時間 ≤ 30秒
- 爭議率 < 0.1%
- 客戶滿意度 ≥ 95%

### 5.2 系統指標
- 系統可用性 ≥ 99.9%
- 同步延遲 < 3秒
- 離線支援 100%
- 資料完整性 100%

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: lm@tsaitung.com