# LM-CM 容器管理 (Container Management) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: WMS (倉儲管理), LM-DSRO (排程優化), FA (財務會計), CRM (客戶管理)

## 1. 功能概述

### 1.1 目的
建立完整的物流容器管理系統，管理各類可重複使用的運輸容器（棧板、籠車、保溫箱等），追蹤容器流向，降低遺失率，提升使用效率。

### 1.2 範圍
- 容器檔案管理
- 流向追蹤系統
- 調度配置管理
- 清潔維護管理
- 成本效益分析

### 1.3 關鍵價值
- 容器遺失率降低 80%
- 周轉率提升 40%
- 管理成本降低 30%
- 使用率提升至 85%

## 2. 功能性需求

### FR-LM-CM-001: 容器檔案管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 容器採購、報廢或資訊變更
- **行為**: 建立和維護容器基本資料庫
- **資料輸入**: 
  - 容器類型規格
  - 唯一識別碼
  - 採購資訊
  - 使用限制
  - 所有權歸屬
- **資料輸出**: 
  - 容器清冊
  - 規格說明書
  - 可用數量
  - 分布地圖
  - 價值報表
- **UI反應**: 
  - 容器目錄
  - 條碼/RFID管理
  - 批量建檔
  - 快速查詢
  - 圖片管理
- **例外處理**: 
  - 重複編號檢查
  - 規格不符警告
  - 超期使用提醒
  - 遺失登記

#### 驗收標準
```yaml
- 條件: 新增容器資料
  預期結果: 自動生成唯一編碼並綁定RFID/條碼

- 條件: 容器達到使用年限
  預期結果: 自動提醒汰換並評估殘值

- 條件: 批量採購入庫
  預期結果: 支援Excel匯入並自動建檔
```

#### Traceability
- **測試案例**: tests/unit/FR-LM-CM-001.test.ts
- **實作程式**: src/modules/lm/services/containerRegistry.service.ts
- **相關文件**: TOC Modules.md - Section 10.5

### FR-LM-CM-002: 流向追蹤系統
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 容器移動或狀態變更
- **行為**: 追蹤容器在供應鏈中的完整流向
- **資料輸入**: 
  - 掃描記錄
  - 位置更新
  - 使用單位
  - 借用歸還
  - 狀態變更
- **資料輸出**: 
  - 即時位置
  - 移動軌跡
  - 停留分析
  - 遺失預警
  - 流向報表
- **UI反應**: 
  - 地圖顯示
  - 軌跡查詢
  - 異常標記
  - 統計圖表
  - 預警提示
- **例外處理**: 
  - 長期未動
  - 異常流向
  - 未授權使用
  - 跨區調度

#### 容器追蹤模型
```typescript
interface ContainerTracking {
  containerId: string;
  containerType: string;
  
  // 當前狀態
  currentStatus: {
    location: {
      type: 'warehouse' | 'vehicle' | 'customer' | 'maintenance' | 'unknown';
      locationId: string;
      locationName: string;
      coordinates?: Coordinates;
      area: string;
    };
    
    status: 'available' | 'in_use' | 'in_transit' | 'maintenance' | 'lost' | 'retired';
    
    condition: 'good' | 'fair' | 'poor' | 'damaged';
    
    custody: {
      unit: string;         // 保管單位
      person?: string;      // 負責人
      since: Date;
      expectedReturn?: Date;
    };
    
    lastSeen: Date;
    lastScanned?: {
      timestamp: Date;
      location: string;
      scanner: string;
      action: string;
    };
  };
  
  // 移動記錄
  movements: {
    timestamp: Date;
    from: Location;
    to: Location;
    
    transport: {
      method: 'truck' | 'manual' | 'forklift';
      vehicleId?: string;
      driverId?: string;
    };
    
    purpose: 'delivery' | 'return' | 'transfer' | 'maintenance';
    orderId?: string;
    
    quantity?: number;  // 如果是批量移動
    
    verifiedBy: string;
  }[];
  
  // 使用統計
  usage: {
    totalMovements: number;
    totalDistance: number;
    utilizationRate: number;
    idleTime: number;
    
    frequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    
    popularRoutes: {
      from: string;
      to: string;
      count: number;
    }[];
  };
  
  // 生命週期
  lifecycle: {
    purchaseDate: Date;
    expectedLife: number;  // 月
    currentAge: number;     // 月
    remainingLife: number;  // 月
    
    maintenanceHistory: {
      date: Date;
      type: string;
      cost: number;
      result: string;
    }[];
    
    estimatedValue: number;
    depreciationRate: number;
  };
}
```

### FR-LM-CM-003: 調度配置管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 配送需求或容器調度需求
- **行為**: 優化容器配置與調度計劃
- **資料輸入**: 
  - 需求預測
  - 庫存分布
  - 運輸計劃
  - 成本參數
  - 客戶要求
- **資料輸出**: 
  - 調度計劃
  - 配置建議
  - 成本分析
  - 缺口預警
  - 調撥單
- **UI反應**: 
  - 調度看板
  - 拖拽分配
  - 模擬計算
  - 自動建議
  - 審批流程
- **例外處理**: 
  - 容器不足
  - 跨區調撥
  - 緊急需求
  - 特殊要求

#### 容器調度系統
```typescript
interface ContainerAllocation {
  allocationId: string;
  
  // 需求分析
  demand: {
    date: Date;
    requester: {
      type: 'customer' | 'warehouse' | 'route';
      id: string;
      name: string;
    };
    
    requirements: {
      containerType: string;
      quantity: number;
      duration: number;  // 天
      purpose: string;
      special?: string[];  // 特殊要求
    };
    
    priority: 'normal' | 'urgent' | 'emergency';
  };
  
  // 供給分析
  supply: {
    available: {
      location: string;
      quantity: number;
      condition: string;
      distance: number;
    }[];
    
    allocated: {
      from: string;
      quantity: number;
      transportCost: number;
      arrivalTime: Date;
    }[];
    
    shortage?: {
      quantity: number;
      alternatives?: {
        type: string;
        quantity: number;
        additionalCost: number;
      }[];
    };
  };
  
  // 優化結果
  optimization: {
    algorithm: 'greedy' | 'linear' | 'genetic';
    
    objectives: {
      minimizeCost: number;
      minimizeDistance: number;
      maximizeUtilization: number;
    };
    
    solution: {
      totalCost: number;
      totalDistance: number;
      feasibility: boolean;
      efficiency: number;
    };
    
    recommendations?: string[];
  };
  
  // 執行計劃
  execution: {
    status: 'planned' | 'approved' | 'executing' | 'completed';
    
    tasks: {
      taskId: string;
      type: 'pickup' | 'delivery' | 'transfer';
      
      schedule: {
        plannedDate: Date;
        actualDate?: Date;
      };
      
      assignment: {
        vehicleId?: string;
        driverId?: string;
      };
      
      completed: boolean;
    }[];
  };
}
```

### FR-LM-CM-004: 清潔維護管理
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 容器歸還或定期保養
- **行為**: 管理容器清潔消毒與維護保養
- **資料輸入**: 
  - 清潔標準
  - 維護週期
  - 損壞報告
  - 維修記錄
  - 檢查結果
- **資料輸出**: 
  - 清潔計劃
  - 維護工單
  - 合格證明
  - 成本報表
  - 汰換建議
- **UI反應**: 
  - 維護日曆
  - 工單管理
  - 檢查清單
  - 照片上傳
  - 統計分析
- **例外處理**: 
  - 污染處理
  - 緊急維修
  - 強制報廢
  - 消毒證明

### FR-LM-CM-005: 成本效益分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期分析或管理決策需求
- **行為**: 分析容器使用成本與效益
- **資料輸入**: 
  - 採購成本
  - 維護費用
  - 遺失損耗
  - 使用頻率
  - 租賃收入
- **資料輸出**: 
  - ROI分析
  - 成本結構
  - 效益評估
  - 優化建議
  - 投資決策
- **UI反應**: 
  - 分析儀表板
  - 趨勢圖表
  - 比較分析
  - 模擬測算
  - 報表匯出
- **例外處理**: 
  - 數據不足
  - 異常值處理
  - 預測偏差
  - 決策支援

## 3. 系統設計

### 3.1 資料模型

```typescript
// 容器主檔
interface Container {
  id: string;
  code: string;            // 容器編號
  rfidTag?: string;         // RFID標籤
  qrCode?: string;          // QR碼
  
  // 基本資訊
  basicInfo: {
    type: 'pallet' | 'cage' | 'box' | 'tank' | 'rack' | 'other';
    subType: string;
    name: string;
    brand?: string;
    model?: string;
    material: string;
    color?: string;
  };
  
  // 規格參數
  specifications: {
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: 'mm' | 'cm' | 'm';
    };
    
    capacity: {
      weight: number;      // kg
      volume?: number;     // L
      stackable: boolean;
      maxStack?: number;
    };
    
    special?: {
      temperature?: { min: number; max: number; };
      humidity?: { min: number; max: number; };
      hazmat?: boolean;
      foodGrade?: boolean;
    };
  };
  
  // 財務資訊
  financial: {
    purchaseDate: Date;
    purchasePrice: number;
    currentValue: number;
    depreciationMethod: 'linear' | 'accelerated';
    usefulLife: number;    // 月
    residualValue: number;
    
    costs: {
      maintenance: number;  // 累計
      cleaning: number;     // 累計
      repair: number;       // 累計
    };
  };
  
  // 所有權
  ownership: {
    owner: 'owned' | 'leased' | 'customer' | 'supplier';
    ownerId?: string;
    ownerName?: string;
    
    lease?: {
      lessor: string;
      startDate: Date;
      endDate: Date;
      monthlyRate: number;
      deposit: number;
    };
  };
  
  // 當前狀態
  currentStatus: {
    status: 'active' | 'maintenance' | 'damaged' | 'lost' | 'retired';
    condition: 'new' | 'good' | 'fair' | 'poor';
    location: string;
    lastUpdated: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 清潔維護記錄
interface MaintenanceRecord {
  id: string;
  containerId: string;
  
  // 維護類型
  maintenance: {
    type: 'cleaning' | 'disinfection' | 'repair' | 'inspection';
    category: 'routine' | 'corrective' | 'preventive';
    
    schedule: {
      plannedDate: Date;
      actualDate: Date;
      duration: number;  // 分鐘
    };
    
    // 清潔作業
    cleaning?: {
      method: 'manual' | 'machine' | 'chemical';
      chemicals?: string[];
      temperature?: number;
      pressure?: number;
      
      standards: {
        visual: 'pass' | 'fail';
        bacterial?: 'pass' | 'fail';
        residue?: 'pass' | 'fail';
      };
    };
    
    // 維修作業
    repair?: {
      issue: string;
      parts?: {
        name: string;
        quantity: number;
        cost: number;
      }[];
      labor: {
        hours: number;
        rate: number;
      };
    };
    
    // 檢查結果
    inspection?: {
      checklist: {
        item: string;
        result: 'pass' | 'fail' | 'na';
        notes?: string;
      }[];
      
      findings: string[];
      recommendations: string[];
      nextInspection: Date;
    };
  };
  
  // 執行資訊
  execution: {
    performedBy: string;
    supervisedBy?: string;
    location: string;
    
    evidence: {
      photos?: string[];
      documents?: string[];
      signature?: string;
    };
    
    certification?: {
      certified: boolean;
      certificateNo?: string;
      validUntil?: Date;
    };
  };
  
  // 成本
  cost: {
    material: number;
    labor: number;
    overhead: number;
    total: number;
  };
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  
  createdAt: Date;
  completedAt?: Date;
}

// 容器借用記錄
interface ContainerLoan {
  id: string;
  loanNo: string;
  
  // 借用資訊
  loan: {
    borrower: {
      type: 'customer' | 'vendor' | 'internal';
      id: string;
      name: string;
      contact: string;
    };
    
    containers: {
      containerId: string;
      containerCode: string;
      quantity: number;
      condition: string;
    }[];
    
    period: {
      startDate: Date;
      expectedReturn: Date;
      actualReturn?: Date;
    };
    
    purpose: string;
    deposit?: number;
    dailyRate?: number;
  };
  
  // 歸還資訊
  return?: {
    returnedQuantity: number;
    condition: string;
    
    damages?: {
      containerId: string;
      description: string;
      severity: string;
      charge?: number;
    }[];
    
    missing?: {
      containerId: string;
      lastSeen?: Date;
      charge?: number;
    }[];
  };
  
  // 費用結算
  settlement?: {
    rentalFee: number;
    damageFee: number;
    missingFee: number;
    lateFee: number;
    totalCharge: number;
    
    depositRefund: number;
    netPayment: number;
    
    settled: boolean;
    settledAt?: Date;
  };
  
  status: 'active' | 'overdue' | 'returned' | 'settled';
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 API 設計

```typescript
// 容器管理 API
interface ContainerManagementAPI {
  // 容器檔案
  POST   /api/lm/containers                    // 建立容器
  GET    /api/lm/containers                    // 查詢容器列表
  GET    /api/lm/containers/:id                // 取得容器詳情
  PUT    /api/lm/containers/:id                // 更新容器資訊
  DELETE /api/lm/containers/:id                // 報廢容器
  
  // 追蹤管理
  POST   /api/lm/containers/:id/scan           // 掃描更新位置
  GET    /api/lm/containers/:id/track          // 查詢軌跡
  GET    /api/lm/containers/location/:location // 查詢特定位置容器
  POST   /api/lm/containers/transfer           // 容器調撥
  
  // 借用管理
  POST   /api/lm/containers/loan               // 借出容器
  PUT    /api/lm/containers/loan/:id/return    // 歸還容器
  GET    /api/lm/containers/loans              // 查詢借用記錄
}

// 維護管理 API
interface MaintenanceAPI {
  // 維護作業
  POST   /api/lm/maintenance/schedule          // 排程維護
  GET    /api/lm/maintenance/pending           // 待維護清單
  POST   /api/lm/maintenance/:id/complete      // 完成維護
  
  // 清潔管理
  POST   /api/lm/maintenance/clean             // 清潔作業
  GET    /api/lm/maintenance/hygiene/cert      // 衛生證明
}

// 分析報表 API
interface AnalyticsAPI {
  // 使用分析
  GET    /api/lm/analytics/utilization         // 使用率分析
  GET    /api/lm/analytics/movement            // 流向分析
  GET    /api/lm/analytics/cost                // 成本分析
  
  // 預測建議
  GET    /api/lm/analytics/forecast            // 需求預測
  GET    /api/lm/analytics/optimization        // 優化建議
}

// WebSocket 事件
interface ContainerWebSocketEvents {
  'container:scanned': (scan: any) => void;
  'container:moved': (movement: any) => void;
  'container:missing': (missing: any) => void;
  'maintenance:due': (maintenance: any) => void;
  'loan:overdue': (loan: any) => void;
}
```

## 4. 整合需求

### 4.1 內部系統整合
- **WMS**: 倉儲進出
- **LM-DSRO**: 配送調度
- **FA**: 成本核算
- **CRM**: 客戶借用
- **BI**: 數據分析

### 4.2 外部系統整合
- **RFID系統**: 自動識別
- **IoT感測器**: 狀態監測
- **清潔服務商**: 維護排程
- **租賃公司**: 租賃管理

## 5. 成功指標

### 5.1 業務指標
- 容器遺失率 < 1%
- 周轉天數 ≤ 3天
- 使用率 ≥ 85%
- ROI ≥ 25%

### 5.2 系統指標
- 掃描識別率 ≥ 99.5%
- 追蹤準確率 ≥ 99%
- 系統可用性 ≥ 99.5%
- 查詢響應 < 1秒

## 6. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2025-08-25 | 初始版本 | ERP Team |

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: lm@tsaitung.com