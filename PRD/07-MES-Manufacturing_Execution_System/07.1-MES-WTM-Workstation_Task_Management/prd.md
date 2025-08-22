# 工作站與派工管理 PRD 文件

## 模組資訊
- **模組代碼**: 07.1-MES-WTM
- **模組名稱**: Workstation & Task Management (工作站與派工管理)
- **負責人**: 菜蟲農食 ERP 團隊
- **最後更新**: 2025-08-22
- **版本**: v1.0.0

## 模組概述
工作站與派工管理模組是製造執行系統的核心，負責管理生產現場的工作站配置、人員派工、任務分配與執行追蹤。支援農產品加工的特殊需求，包括包裝站、分揀站、加工站等多種工作站類型。

## 業務價值
- 提升生產效率40%，優化人員配置
- 即時追蹤生產進度，減少延誤
- 標準化作業流程，確保品質一致性
- 數據化管理，支援績效考核

## 功能需求

### FR-MES-WTM-001: 工作站配置管理
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
設定和管理各類型工作站，包括包裝站、分揀站、清洗站、切割站等，定義工作站產能、所需技能和設備配置。

**功能需求細節**:
- **條件/觸發**: 當管理員設定工作站或生產線配置變更時
- **行為**: 系統創建/更新工作站資訊，驗證配置合理性，同步更新排程系統
- **資料輸入**: 工作站名稱、類型、位置、產能、所需人數、技能要求、設備清單
- **資料輸出**: 工作站清單、產能報表、稼動率、配置歷史
- **UI反應**: 工作站拓撲圖、拖放式配置、即時狀態顯示
- **例外處理**: 產能衝突警告、技能不符提示、設備故障標記

**用戶故事**:
作為生產主管，
我希望靈活配置各工作站的產能和人員需求，
以便應對不同的生產需求。

**驗收標準**:
```yaml
- 條件: 新增包裝工作站
  預期結果: 設定產能參數並指定所需包裝設備
  
- 條件: 修改工作站人員需求
  預期結果: 同步更新排班系統的人力需求
  
- 條件: 工作站設備故障
  預期結果: 自動降低產能並通知維修人員
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/workstations`
  - `POST /api/v1/workstations`
  - `PUT /api/v1/workstations/{id}`
- **請求/回應**: 詳見API規格章節
- **數據模型**: Workstation, WorkstationCapacity, EquipmentConfig
- **權限要求**: mes.workstation.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-MES-WTM-001.test.ts`
  - 整合測試: `tests/integration/FR-MES-WTM-001.integration.test.ts`
  - E2E測試: `tests/e2e/FR-MES-WTM-001.e2e.test.ts`
- **Code**: `src/modules/mes/workstation/config/`
- **TOC**: `TOC Modules.md` 第176行

**依賴關係**:
- **依賴模組**: SA (系統設定), LM-DVM (人員管理)
- **依賴功能**: FR-SA-SC-001, FR-LM-DVM-001
- **外部服務**: 無

---

### FR-MES-WTM-002: 生產任務派工
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
根據生產計劃自動或手動分配任務到各工作站，支援優先級設定、負載平衡和技能匹配。

**功能需求細節**:
- **條件/觸發**: 當生產工單創建或工作站空閒時
- **行為**: 系統根據規則自動派工或提供派工建議，更新任務隊列
- **資料輸入**: 工單編號、優先級、交期、品項、數量、技能需求
- **資料輸出**: 派工清單、任務隊列、預計完成時間、人員分配表
- **UI反應**: 甘特圖顯示、拖放調整、負載熱力圖、衝突警告
- **例外處理**: 產能超載警告、技能不足提示、交期風險預警

**用戶故事**:
作為排程人員，
我希望系統智能分配生產任務，
以確保準時交貨並平衡各站負載。

**驗收標準**:
```yaml
- 條件: 收到緊急訂單
  預期結果: 自動調整任務優先級並重新派工
  
- 條件: 工作站產能不足
  預期結果: 提示分配到其他站或加班建議
  
- 條件: 員工請假
  預期結果: 自動重新分配該員工的任務
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/tasks/dispatch`
  - `GET /api/v1/tasks/queue`
  - `PUT /api/v1/tasks/{id}/reassign`
- **請求/回應**: 詳見API規格章節
- **數據模型**: ProductionTask, TaskAssignment, TaskQueue
- **權限要求**: mes.task.dispatch
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-MES-WTM-002.test.ts`
  - 整合測試: `tests/integration/FR-MES-WTM-002.integration.test.ts`
  - E2E測試: `tests/e2e/FR-MES-WTM-002.e2e.test.ts`
- **Code**: `src/modules/mes/task/dispatch/`
- **TOC**: `TOC Modules.md` 第176行

**依賴關係**:
- **依賴模組**: MES-PSWO (工單管理), OM (訂單資訊)
- **依賴功能**: FR-MES-PSWO-001, FR-OM-OL-001
- **外部服務**: 排程引擎

---

### FR-MES-WTM-003: 任務執行追蹤
**狀態**: 🔴 未開始
**優先級**: P0

**功能描述**:
即時追蹤各工作站的任務執行狀態，記錄開始、暫停、完成時間，支援條碼掃描報工。

**功能需求細節**:
- **條件/觸發**: 當員工開始/完成任務或掃描條碼時
- **行為**: 更新任務狀態、計算實際工時、記錄生產數量
- **資料輸入**: 任務條碼、員工工號、數量、品質狀態、異常原因
- **資料輸出**: 進度百分比、實際vs計劃、效率指標、異常記錄
- **UI反應**: 進度條更新、狀態顏色變化、完成通知、異常警示
- **例外處理**: 重複報工檢查、超量預警、品質異常處理

**用戶故事**:
作為現場作業員，
我希望簡單快速地回報工作進度，
以便主管即時掌握生產狀況。

**驗收標準**:
```yaml
- 條件: 掃描任務條碼開始作業
  預期結果: 記錄開始時間並顯示任務詳情
  
- 條件: 完成數量超過計劃
  預期結果: 提示確認並記錄超產原因
  
- 條件: 發生品質異常
  預期結果: 暫停任務並通知品管人員
```

**技術需求**:
- **API 端點**: 
  - `POST /api/v1/tasks/{id}/start`
  - `POST /api/v1/tasks/{id}/complete`
  - `POST /api/v1/tasks/{id}/report`
- **請求/回應**: 詳見API規格章節
- **數據模型**: TaskExecution, ProductionReport, QualityIssue
- **權限要求**: mes.task.execute
- **認證方式**: JWT Token + 工號驗證

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-MES-WTM-003.test.ts`
  - 整合測試: `tests/integration/FR-MES-WTM-003.integration.test.ts`
  - E2E測試: `tests/e2e/FR-MES-WTM-003.e2e.test.ts`
- **Code**: `src/modules/mes/task/execution/`
- **TOC**: `TOC Modules.md` 第176行

**依賴關係**:
- **依賴模組**: WMS (物料扣帳), QC (品質檢驗)
- **依賴功能**: FR-WMS-IOD-001
- **外部服務**: 條碼掃描設備

---

### FR-MES-WTM-004: 人員技能與績效管理
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
管理作業人員的技能認證、培訓記錄和績效數據，支援技能矩陣和績效評估。

**功能需求細節**:
- **條件/觸發**: 當人員入職、培訓完成或定期績效評估時
- **行為**: 更新技能等級、計算績效分數、生成培訓建議
- **資料輸入**: 員工資料、技能項目、認證等級、培訓記錄、績效指標
- **資料輸出**: 技能矩陣、績效報表、培訓計劃、優秀員工排名
- **UI反應**: 雷達圖顯示、技能熱力圖、績效趨勢圖
- **例外處理**: 技能過期提醒、績效異常預警、培訓需求提示

**用戶故事**:
作為人資主管，
我希望掌握所有作業員的技能狀況，
以便安排適當的培訓和工作分配。

**驗收標準**:
```yaml
- 條件: 員工完成包裝技能培訓
  預期結果: 更新技能等級並開放相關工作站權限
  
- 條件: 月度績效評估
  預期結果: 自動計算KPI並生成績效報告
  
- 條件: 技能證書即將過期
  預期結果: 提前30天通知安排複訓
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/operators/skills`
  - `POST /api/v1/operators/{id}/skills`
  - `GET /api/v1/operators/{id}/performance`
- **請求/回應**: 詳見API規格章節
- **數據模型**: OperatorSkill, PerformanceMetric, TrainingRecord
- **權限要求**: mes.operator.manage
- **認證方式**: JWT Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-MES-WTM-004.test.ts`
  - 整合測試: `tests/integration/FR-MES-WTM-004.integration.test.ts`
  - E2E測試: `tests/e2e/FR-MES-WTM-004.e2e.test.ts`
- **Code**: `src/modules/mes/operator/`
- **TOC**: `TOC Modules.md` 第176行

**依賴關係**:
- **依賴模組**: HR (人事系統), SA-UPM (權限管理)
- **依賴功能**: FR-SA-UPM-001
- **外部服務**: HR系統API

---

### FR-MES-WTM-005: 工作站看板顯示
**狀態**: 🔴 未開始
**優先級**: P1

**功能描述**:
為每個工作站提供電子看板，顯示當前任務、進度、品質狀態和公告訊息。

**功能需求細節**:
- **條件/觸發**: 當任務更新或系統推送訊息時
- **行為**: 即時更新看板內容，顯示關鍵資訊和視覺化圖表
- **資料輸入**: 工作站選擇、顯示模式、更新頻率、自訂內容
- **資料輸出**: 任務清單、進度圖表、品質統計、公告訊息
- **UI反應**: 自動輪播、全螢幕顯示、警示閃爍、聲音提醒
- **例外處理**: 網路斷線快取、資料異常標記、緊急訊息置頂

**用戶故事**:
作為現場作業員，
我希望在工作站看板上看到所有必要資訊，
以便專注於生產作業。

**驗收標準**:
```yaml
- 條件: 新任務派發
  預期結果: 看板立即顯示並發出提示音
  
- 條件: 品質異常發生
  預期結果: 紅色警示並顯示處理指引
  
- 條件: 網路中斷
  預期結果: 顯示離線模式並使用快取資料
```

**技術需求**:
- **API 端點**: 
  - `GET /api/v1/workstations/{id}/dashboard`
  - `POST /api/v1/workstations/{id}/announcements`
- **請求/回應**: 詳見API規格章節
- **數據模型**: DashboardConfig, AnnouncementMessage
- **權限要求**: mes.dashboard.view
- **認證方式**: 工作站Token

**追蹤資訊**:
- **Tests**: 
  - 單元測試: `tests/unit/FR-MES-WTM-005.test.ts`
  - 整合測試: `tests/integration/FR-MES-WTM-005.integration.test.ts`
  - E2E測試: `tests/e2e/FR-MES-WTM-005.e2e.test.ts`
- **Code**: `src/modules/mes/dashboard/`
- **TOC**: `TOC Modules.md` 第176行

**依賴關係**:
- **依賴模組**: DSH (儀表板框架)
- **依賴功能**: FR-DSH-OV-001
- **外部服務**: WebSocket Server

## 非功能需求

### 性能需求
- 派工計算時間：< 3秒
- 看板更新延遲：< 1秒
- 條碼掃描響應：< 500ms
- 同時支援工作站數：100+

### 安全需求
- 工作站身份驗證
- 操作權限分級控制
- 生產資料加密傳輸
- 關鍵操作日誌記錄

### 可用性需求
- 系統可用性：99.9%
- 支援離線作業模式
- 觸控螢幕優化介面
- 多語言支援

## 數據模型

### 主要實體
```typescript
interface Workstation {
  id: string;
  code: string;
  name: string;
  type: 'packaging' | 'sorting' | 'processing' | 'washing' | 'cutting';
  location: string;
  capacity: {
    hourlyOutput: number;
    maxOperators: number;
    minOperators: number;
  };
  requiredSkills: string[];
  equipment: Equipment[];
  status: 'active' | 'maintenance' | 'idle' | 'offline';
  currentTask?: ProductionTask;
  operatorCount: number;
}

interface ProductionTask {
  id: string;
  taskNo: string;
  workOrderId: string;
  workstationId: string;
  itemId: string;
  plannedQuantity: number;
  completedQuantity: number;
  priority: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  assignedOperators: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
}

interface OperatorSkill {
  operatorId: string;
  skillCode: string;
  skillName: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certifiedDate: Date;
  expiryDate?: Date;
  trainingHours: number;
}

interface TaskExecution {
  id: string;
  taskId: string;
  operatorId: string;
  action: 'start' | 'pause' | 'resume' | 'complete' | 'report';
  quantity?: number;
  qualityStatus?: 'pass' | 'fail' | 'rework';
  remarks?: string;
  timestamp: Date;
  location: string;
}
```

## API 設計

### API 端點列表
| 方法 | 端點 | 描述 | 狀態 |
|------|------|------|------|
| GET | `/api/v1/workstations` | 獲取工作站列表 | 🔴 未開始 |
| POST | `/api/v1/workstations` | 創建工作站 | 🔴 未開始 |
| POST | `/api/v1/tasks/dispatch` | 派發任務 | 🔴 未開始 |
| GET | `/api/v1/tasks/queue` | 獲取任務隊列 | 🔴 未開始 |
| POST | `/api/v1/tasks/{id}/start` | 開始任務 | 🔴 未開始 |
| POST | `/api/v1/tasks/{id}/complete` | 完成任務 | 🔴 未開始 |
| GET | `/api/v1/operators/skills` | 獲取技能矩陣 | 🔴 未開始 |
| GET | `/api/v1/workstations/{id}/dashboard` | 獲取看板資料 | 🔴 未開始 |

### 請求/回應範例

#### 派發生產任務
```json
// 請求
POST /api/v1/tasks/dispatch
{
  "workOrderId": "WO20250822001",
  "items": [
    {
      "itemId": "ITEM001",
      "quantity": 1000,
      "priority": 1,
      "dueDate": "2025-08-23T16:00:00Z"
    }
  ],
  "autoAssign": true
}

// 成功響應 (200 OK)
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskNo": "TSK20250822001",
        "workstationId": "WS001",
        "assignedOperators": ["OP001", "OP002"],
        "plannedStart": "2025-08-22T08:00:00Z",
        "plannedEnd": "2025-08-22T12:00:00Z",
        "estimatedOutput": 1000
      }
    ],
    "warnings": []
  }
}
```

### 資料庫結構
```sql
-- 工作站主檔
CREATE TABLE workstations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  location VARCHAR(100),
  hourly_capacity DECIMAL(10,2),
  max_operators INTEGER,
  min_operators INTEGER,
  required_skills JSONB,
  equipment_list JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_code (code),
  INDEX idx_type (type),
  INDEX idx_status (status)
);

-- 生產任務表
CREATE TABLE production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_no VARCHAR(30) UNIQUE NOT NULL,
  work_order_id UUID NOT NULL REFERENCES work_orders(id),
  workstation_id UUID NOT NULL REFERENCES workstations(id),
  item_id UUID NOT NULL REFERENCES items(id),
  planned_quantity DECIMAL(10,2) NOT NULL,
  completed_quantity DECIMAL(10,2) DEFAULT 0,
  priority INTEGER DEFAULT 0,
  planned_start TIMESTAMP NOT NULL,
  planned_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_task_no (task_no),
  INDEX idx_workstation (workstation_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority DESC)
);

-- 任務執行記錄
CREATE TABLE task_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES production_tasks(id),
  operator_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL,
  quantity DECIMAL(10,2),
  quality_status VARCHAR(20),
  remarks TEXT,
  scanned_barcode VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_task (task_id),
  INDEX idx_operator (operator_id),
  INDEX idx_created (created_at)
);

-- 操作員技能表
CREATE TABLE operator_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES users(id),
  skill_code VARCHAR(20) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL,
  certified_date DATE NOT NULL,
  expiry_date DATE,
  training_hours DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(operator_id, skill_code),
  INDEX idx_operator (operator_id),
  INDEX idx_skill (skill_code)
);
```

## 實施計畫

### 開發階段
| 階段 | 時程 | 交付物 |
|------|------|--------|
| 階段1：基礎架構 | Week 1 | 資料模型、API框架 |
| 階段2：工作站管理 | Week 2 | 工作站配置、產能設定 |
| 階段3：派工系統 | Week 3 | 自動派工、手動調整 |
| 階段4：執行追蹤 | Week 4 | 條碼報工、進度追蹤 |
| 階段5：看板系統 | Week 5 | 電子看板、即時更新 |
| 階段6：測試優化 | Week 6 | 整合測試、效能調優 |

### 里程碑
- [ ] M1：工作站基礎管理 - 2025-09-05
- [ ] M2：智能派工系統完成 - 2025-09-12
- [ ] M3：現場報工系統上線 - 2025-09-19
- [ ] M4：電子看板部署完成 - 2025-09-26
- [ ] M5：全模組整合測試通過 - 2025-10-03

## 風險評估
| 風險項目 | 可能性 | 影響 | 緩解措施 |
|----------|--------|------|----------|
| 現場網路不穩定 | 高 | 高 | 離線作業模式、本地快取 |
| 員工抗拒新系統 | 中 | 高 | 充分培訓、漸進導入 |
| 條碼設備相容性 | 中 | 中 | 多種輸入方式、設備測試 |
| 排程演算法複雜 | 低 | 高 | 採用成熟演算法、專家諮詢 |

## 變更記錄
| 版本 | 日期 | 變更內容 | 變更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-08-22 | 初始版本創建 | ERP Team |

---

**文件狀態**: 草稿
**下次審查日期**: 2025-08-29