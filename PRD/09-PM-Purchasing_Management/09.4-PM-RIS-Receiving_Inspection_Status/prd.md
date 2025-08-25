# PM-RIS 收貨與驗收狀態 (Receiving & Inspection Status) PRD

## 文件資訊
- **版本**: v1.0.0
- **最後更新**: 2025-08-25
- **狀態**: 🔴 未開始
- **負責人**: 待指派
- **相關模組**: PM-PODM (採購單管理), WMS (倉儲管理), QM (品質管理), FA (財務會計)

## 1. 功能概述

### 1.1 目的
建立完整的收貨與驗收管理系統，確保採購物料品質符合要求，加速收貨流程，降低品質風險，提升供應鏈效率。

### 1.2 範圍
- 收貨登記管理
- 品質檢驗流程
- 驗收狀態追蹤
- 異常處理機制
- 收貨績效分析

### 1.3 關鍵價值
- 收貨效率提升 60%
- 品質合格率達 99%
- 異常處理時間縮短 70%
- 庫存準確率達 99.9%

## 2. 功能性需求

### FR-PM-RIS-001: 收貨登記管理
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 貨物到達收貨區
- **行為**: 登記收貨資訊並啟動驗收流程
- **資料輸入**: 
  - 送貨單資訊
  - 採購單號
  - 實際到貨數量
  - 包裝狀況
  - 運輸文件
- **資料輸出**: 
  - 收貨單號
  - 差異報告
  - 檢驗通知
  - 入庫指令
  - 收貨確認
- **UI反應**: 
  - 掃碼收貨
  - 拍照記錄
  - 即時比對
  - 異常標記
  - 簽收確認
- **例外處理**: 
  - 數量差異
  - 損壞處理
  - 無單收貨
  - 錯誤配送

#### 驗收標準
```yaml
- 條件: 掃描送貨單條碼
  預期結果: 自動帶出採購單資訊並顯示差異

- 條件: 發現包裝損壞
  預期結果: 拍照記錄並通知相關人員處理

- 條件: 數量超出採購單
  預期結果: 觸發異常審批流程
```

### FR-PM-RIS-002: 品質檢驗流程
**狀態**: 🔴 未開始
**優先級**: P0

#### 需求描述
- **條件/觸發**: 收貨登記完成需要品質檢驗
- **行為**: 執行品質檢驗並記錄結果
- **資料輸入**: 
  - 檢驗標準
  - 抽樣計劃
  - 檢測項目
  - 測試數據
  - 檢驗結論
- **資料輸出**: 
  - 檢驗報告
  - 合格證明
  - 不良記錄
  - 處理建議
  - 放行指令
- **UI反應**: 
  - 檢驗清單
  - 數據錄入
  - 結果判定
  - 報告生成
  - 電子簽核
- **例外處理**: 
  - 不合格處理
  - 特採申請
  - 退貨流程
  - 索賠處理

### FR-PM-RIS-003: 驗收狀態追蹤
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 收貨到驗收完成全程追蹤
- **行為**: 即時追蹤驗收各階段狀態
- **資料輸入**: 
  - 狀態更新
  - 處理人員
  - 處理時間
  - 處理結果
  - 備註說明
- **資料輸出**: 
  - 狀態看板
  - 進度報告
  - 逾期提醒
  - 績效統計
  - 追蹤記錄
- **UI反應**: 
  - 即時狀態
  - 時間軸
  - 責任人顯示
  - 預警提示
  - 歷史查詢
- **例外處理**: 
  - 逾期處理
  - 狀態回退
  - 緊急處理
  - 權限控制

### FR-PM-RIS-004: 異常處理機制
**狀態**: 🔴 未開始
**優先級**: P1

#### 需求描述
- **條件/觸發**: 收貨或檢驗過程發現異常
- **行為**: 啟動異常處理流程並追蹤解決
- **資料輸入**: 
  - 異常類型
  - 異常描述
  - 影響評估
  - 處理方案
  - 責任歸屬
- **資料輸出**: 
  - 異常單號
  - 處理流程
  - 通知提醒
  - 結案報告
  - 改善追蹤
- **UI反應**: 
  - 異常登記
  - 流程追蹤
  - 協同處理
  - 結果確認
  - 知識庫
- **例外處理**: 
  - 升級機制
  - 多方協調
  - 賠償談判
  - 法律支援

### FR-PM-RIS-005: 收貨績效分析
**狀態**: 🔴 未開始
**優先級**: P2

#### 需求描述
- **條件/觸發**: 定期分析收貨驗收績效
- **行為**: 分析收貨效率和品質表現
- **資料輸入**: 
  - 收貨數據
  - 檢驗結果
  - 異常記錄
  - 處理時效
  - 成本資訊
- **資料輸出**: 
  - 績效報表
  - 供應商評分
  - 趨勢分析
  - 改善建議
  - 預測模型
- **UI反應**: 
  - 儀表板
  - 對比分析
  - 下鑽功能
  - 自訂報表
  - 訂閱推送
- **例外處理**: 
  - 資料異常
  - 指標預警
  - 自動報告
  - 改善追蹤

## 3. 系統設計

### 3.1 資料模型

```typescript
// 收貨記錄
interface ReceivingRecord {
  id: string;
  receivingNo: string;
  
  // 基本資訊
  basicInfo: {
    poNumber: string;
    supplierName: string;
    deliveryNote: string;
    receivedDate: Date;
    receivedBy: string;
    warehouse: string;
  };
  
  // 收貨明細
  items: {
    lineNo: number;
    itemCode: string;
    itemName: string;
    
    quantity: {
      ordered: number;
      delivered: number;
      received: number;
      accepted: number;
      rejected: number;
    };
    
    condition: {
      packaging: 'good' | 'damaged' | 'wet';
      appearance: 'normal' | 'abnormal';
      temperature?: number;
      photos?: string[];
    };
    
    inspection: {
      required: boolean;
      method?: 'full' | 'sampling';
      status?: 'pending' | 'in_progress' | 'completed';
    };
  }[];
  
  // 驗收狀態
  status: 'receiving' | 'inspecting' | 'completed' | 'rejected';
  
  // 文件附件
  documents: {
    packingList?: string;
    invoice?: string;
    certificate?: string;
    others?: string[];
  };
}

// 檢驗記錄
interface InspectionRecord {
  id: string;
  inspectionNo: string;
  receivingNo: string;
  
  // 檢驗計劃
  plan: {
    standard: string;
    level: 'normal' | 'tightened' | 'reduced';
    sampleSize: number;
    acceptanceQty: number;
    rejectionQty: number;
  };
  
  // 檢驗項目
  items: {
    itemCode: string;
    testItems: {
      name: string;
      specification: string;
      method: string;
      result: any;
      judgment: 'pass' | 'fail';
    }[];
    
    finalResult: 'accepted' | 'rejected' | 'conditional';
    defects?: {
      type: string;
      quantity: number;
      severity: 'critical' | 'major' | 'minor';
    }[];
  }[];
  
  // 處理決定
  decision: {
    action: 'accept' | 'reject' | 'rework' | 'concession';
    approvedBy?: string;
    remarks?: string;
  };
  
  inspectedBy: string;
  inspectedAt: Date;
}
```

### 3.2 API 設計

```typescript
// 收貨管理 API
interface ReceivingAPI {
  POST   /api/pm/receiving                // 登記收貨
  GET    /api/pm/receiving/:id            // 查詢收貨單
  PUT    /api/pm/receiving/:id/confirm    // 確認收貨
  
  // 檢驗管理
  POST   /api/pm/inspection               // 建立檢驗
  PUT    /api/pm/inspection/:id/result    // 更新結果
  GET    /api/pm/inspection/:id/report    // 檢驗報告
  
  // 異常處理
  POST   /api/pm/receiving/exceptions     // 登記異常
  PUT    /api/pm/exceptions/:id/resolve   // 處理異常
}
```

## 4. 相關文件

- [PM 總體架構](../README.md)
- [採購單管理 PRD](../09.3-PM-PODM-Purchase_Order_Delivery_Management/prd.md)
- [品質管理系統](../../10-QM-Quality_Management/README.md)

---

**文件狀態**: 未開始
**下次審查**: 2025-09-01
**聯絡人**: pm@tsaitung.com