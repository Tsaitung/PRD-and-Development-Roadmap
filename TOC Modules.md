# 菜蟲農食 ERP — 完整模組 / 子模組階層（更新版）

## 📊 專案追蹤狀態說明

### 狀態圖例：
- ✅ 完成
- 🟡 開發中
- 🔴 未開始
- ⚪ 規劃中

### 追蹤維度：
1. **舊系統狀態** - 現有系統是否運行中
2. **新系統更新** - 是否已更新至新系統
3. **PRD完成度** - 產品需求文件完成狀態
4. **系統整合** - 是否已整合進 repo
5. **單元測試** - 單元測試撰寫狀態（TDD標準）
6. **整合測試** - 整合測試完成狀態
7. **錯誤追蹤** - GitHub Issues 連結
8. **上線進度** - 部署上線百分比

## 模組縮寫說明

### 主要模組縮寫（2-3個字母）：
- **[DSH]** - Dashboard 首頁 / 儀表板
- **[CRM]** - Customer Relationship Management 客戶管理
- **[BDM]** - Basic Data Maintenance 基本資料維護（新）
- **[IM]** - Item Management 品項管理
- **[OP]** - Operations Planning 營運計劃 / 休市管理（新）
- **[OM]** - Order Management 訂單管理
- **[MES]** - Manufacturing Execution System 生產管理
- **[WMS]** - Warehouse Management System 庫存管理
- **[PM]** - Purchasing Management 採購管理
- **[LM]** - Logistics Management 物流管理
- **[FA]** - Finance & Accounting 財務會計
- **[BI]** - Business Intelligence 分析 & BI
- **[SA]** - System Administration 系統管理
- **[UP]** - User Profile 登出 / 個人資訊

### 子模組縮寫（主模組-功能縮寫）：
- 例如：**[CRM-CM]** = CRM Customer Master
- 例如：**[PM-SRM-SMO]** = PM Supplier Relationship Management - Supplier Management Overview

### 縮寫設計優點：
1. **易於識別**：每個縮寫都清楚對應到模組功能
2. **層級清楚**：可以從縮寫看出模組的層級關係
3. **便於追蹤**：在討論、文檔、會議中可以快速引用
4. **標準化**：統一的命名規則，便於系統化管理

---

## 完整模組階層結構

### 1. [DSH] Dashboard 首頁 / 儀表板
    1.1. [DSH-OV] Dashboard Overview 總覽儀表板
    1.2. [DSH-NC] Notification Center 即時訊息 / 通知中心

#### 📊 DSH 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | 🔴 | 無舊系統（全新模組） |
| 新系統更新 | 🟡 | 開發中 |
| PRD完成度 | ✅ | DSH-OV PRD 已完成 |
| 系統整合 | 🟡 | 部分整合 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | Dashboard 基礎框架已完成 |
### 2. [CRM] Customer Relationship Management (CRM) 客戶關係管理
    2.1. [CRM-CM] Customer Management 客戶管理
    2.2. [CRM-CS] Customer Segmentation 客戶級距 / 分群 ⚪
    2.3. [CRM-PM] Pricing Management 定價(標單)管理
        2.3.1. [CRM-PM-DBPE] Dynamic Base Pricing Engine 動態基礎訂價引擎
            2.3.1a. [CRM-PM-DBPE-CBC] Cost Benchmark Classification 成本對標分類設定
            2.3.1b. [CRM-PM-DBPE-MPS] Market Price Setting 時價設定
            2.3.1c. [CRM-PM-DBPE-CIPM] Cost Import & Parsing Module 成本導入與解析模組
            2.3.1d. [CRM-PM-DBPE-CBECC] Cost Benchmark & Effective Cost Calculation 成本對標 & 有效成本計算
            2.3.1e. [CRM-PM-DBPE-MQLM] Market & Quotation Logic Module 行情與報價邏輯
            2.3.1f. [CRM-PM-DBPE-BPOM] Base Pricing Output Module / API Base Pricing 輸出/API
        2.3.2. [CRM-PM-CTAM] Customer Tier Adjustment Management 客戶分級調整管理
            • 讀取近30天重量 • 套用Tier規則 • 手動覆寫&留痕
        2.3.3. [CRM-PM-SRP] Seasonality & Risk Premium 季節性風險溢價
        2.3.4. [CRM-PM-CFRP] Credit & Financial Risk Premium 信用與資金風險溢價（資金成本、天期加價）
        2.3.5. [CRM-PM-SVR] Single Volume Rate 單一量體費率
        2.3.6. [CRM-PM-ER] Exception Review 例外審核
        2.3.7. [CRM-PM-RA] Reports & Analytics 報表與分析
    2.4. [CRM-CSCM] Customer Service & Complaint Management 客戶服務 & 客訴管理
    2.5. [CRM-CRA] Customer Relationship Analytics 客戶關係分析
    2.6. [CRM-CMR] Customer Management & Review 客戶管理及審核
    2.7. [CRM-TM] Ticket Management 客服工單（/admin/ticket-management.tsx）

#### 📊 CRM 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 3. [BDM] Basic Data Maintenance 基本資料維護（新）
    3.1. [BDM-UNIT] Unit Dictionary 計量單位字典（/tsaitung_data/unit.tsx）
    3.2. [BDM-ICAT] Item Category Dictionary 品項類別字典（大宗/半成品/成品…）
    3.3. [BDM-UCONV] Unit Conversion Rules 單位換算規則（公斤↔件↔箱等）
    3.4. [BDM-TEMPL] Label/Packaging Template Dictionary 標籤/包裝模板字典（可被 IM/LM 調用）

    備註：此模組提供「全域字典」。品項個別的包裝/單位綁定仍在 IM 管理。

#### 📊 BDM 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | 🔴 | 無舊系統（全新模組） |
| 新系統更新 | 🟡 | 開發中 |
| PRD完成度 | ✅ | BDM-UNIT PRD 已完成 |
| 系統整合 | 🟡 | unit.tsx 已整合 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 基礎字典架構設計中 |
### 4. [IM] Item Management 品項管理
    4.1. [IM-IM] Item Master 品項主檔（含：可採購/可販售屬性）
    4.2. [IM-BCRS] BOM / Conversion Relationship Setting BOM / 轉換關聯設定（例：蒜末1KG ← 多來源原料0.9KG…）
    4.3. [IM-UPS] Unit & Packaging Specifications 品項層級的包裝/單位綁定（引用 BDM-UNIT、BDM-UCONV）
    4.4. [IM-IAC] Item Analytics / Usage Cycle 品項分析 / 週期用量

#### 📊 IM 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 5. [OP] Operations Planning 營運計劃 / 休市管理（新）
    5.1. [OP-MC] Market Close Management 市場休市管理（/admin/market-close.tsx）
    5.2. [OP-CAL] Operations Calendar 營運日曆（節慶、颱風假、黑名單日）
    5.3. [OP-ODP] Order/Delivery Planning 下單/出貨日策略（休市日禁止下單、出貨時段門檻）
    5.4. [OP-CAP] Capacity/Delivery Availability View 產能/配送可用量視圖（與 MES/LM 銜接）

    與 OM/PM/MES/LM 整合：休市即時影響接單、採購、排程與配送。

#### 📊 OP 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | 🔴 | 無舊系統（全新模組） |
| 新系統更新 | 🟡 | 開發中 |
| PRD完成度 | 🟡 | OP-MC PRD 已完成 |
| 系統整合 | 🟡 | market-close.tsx 已整合 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 35% | 休市管理基礎功能已完成 |
### 6. [OM] Order Management 訂單管理
    6.1. [OM-OL] Order List 訂單列表
    6.2. [OM-COSR] Create Order / Sales Return 建立訂單 / 銷退單（人工、API、影像辨識）
    6.3. [OM-OAPM] Order Allocation / Production Mapping 訂單分貨 / 對應生產
    6.4. [OM-RRP] Return / RMA Processing 退貨 / RMA
    6.5. [OM-OA] Order Analytics 訂單分析

#### 📊 OM 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 7. [MES] Manufacturing Execution System (MES) 生產管理
    7.1. [MES-WTM] Workstation / Task Management 工作站 / 派工管理（包裝、出車、分採買站台）
    7.2. [MES-PSWO] Production Scheduling & Work Orders 生產排程 & 工單
    7.3. [MES-MBU] Material & Batch Usage 材料 & 批號使用（掃碼扣料、損耗計算）
    7.4. [MES-PEMLD] Personnel Efficiency & Material Loss Dashboard 人員效率 & 物料損耗儀表板
    7.5. [MES-PMR] Progress Monitoring & Reports 進度監控 & 報表

#### 📊 MES 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 8. [WMS] Warehouse Management System (WMS) 庫存管理
    8.1. [WMS-IOD] Inventory Overview / Inventory Details 庫存概況 / 明細
    8.2. [WMS-RIS] Receiving & Inspection / Shipping 入庫 & 驗收 / 出庫
    8.3. [WMS-BTM] Batch & Traceability Management 批號 & 溯源
    8.4. [WMS-IAT] Inventory Adjustment / Transfer 庫存調整 / 移位
    8.5. [WMS-RQIA] Remaining Quantity / In-Transit Analysis 餘量 / 在途分析

#### 📊 WMS 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 9. [PM] Purchasing Management 採購管理
    9.1. [PM-SRM] Supplier Relationship Management (SRM) 供應商管理
        9.1.1. [PM-SRM-SMO] Supplier Management Overview 總覽
        9.1.2. [PM-SRM-SL] Supplier List 清單
        9.1.3. [PM-SRM-LMR] Loss Management & Returns 損耗 & 退貨
        9.1.4. [PM-SRM-SA] Supplier Accounting 帳務
        9.1.5. [PM-SRM-RS] Review & Scoring 審核與評分
    9.2. [PM-CPM] Contract & Pricing Management 合約 & 定價管理
    9.3. [PM-PODM] Purchase Order (PO) & Delivery Management 採購單(PO) & 交期管理
    9.4. [PM-RIS] Receiving & Inspection Status 進貨 & 驗收狀態
    9.5. [PM-PAR] Purchasing Analytics & Reports 採購分析 & 報表

#### 📊 PM 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 10. [LM] Logistics Management 物流管理
    10.1. [LM-DSRO] Delivery Scheduling & Route Optimization 配送排程 & 路線優化
    10.2. [LM-DVM] Driver & Vehicle Management 司機 & 車輛管理（含班表）
    10.3. [LM-ESDR] Electronic Signing & Delivery Reporting 電子簽單 & 配送回報
    10.4. [LM-DTRV] Delivery Tracking & Real-time View 配送追蹤 & 即時視圖
    10.5. [LM-CM] Contract Management 合約管理（承攬、維保）
    10.6. [LM-LCPA] Logistics Cost & Performance Analytics 物流費用 & 績效分析

#### 📊 LM 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 11. [FA] Finance & Accounting 財務會計
    11.1. [FA-AR] Accounts Receivable (AR) 應收帳款 (AR)
    11.2. [FA-AP] Accounts Payable (AP) 應付帳款 (AP)
    11.3. [FA-PMAR] Payment Management & Account Reconciliation 付款管理 & 帳務對帳
    11.4. [FA-IT] Invoice & Tax 發票 & 稅務
    11.5. [FA-FR] Financial Reports 財務報表
    11.6. [FA-FS] Financial Settlement 財務結算（新增子模組）
        11.6.1. [FA-FS-RU] Revenue Update 營收更新（/admin/revenue.tsx）
        11.6.2. [FA-FS-MS] Monthly Statement 月結單（/admin/monthly-statement.tsx）

#### 📊 FA 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 12. [BI] Analytics & Business Intelligence (BI) 分析 & BI
    12.1. [BI-DF] Demand Forecasting 需求預測
    12.2. [BI-PIK] Production & Inventory KPI 生產 & 庫存 KPI
    12.3. [BI-SCA] Sales & Customer Analytics 銷售 & 客戶分析
    12.4. [BI-FKPA] Financial KPI & Profitability Analysis 財務 KPI & 獲利分析
    12.5. [BI-AIMM] AI Model Management AI 模型管理

#### 📊 BI 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | 🔴 | 無舊系統（全新模組） |
| 新系統更新 | 🟡 | 未開始 |
| PRD完成度 | ✅ | 規劃中 |
| 系統整合 | 🟡 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 未開始 |
### 13. [SA] System Administration 系統管理
    13.1. [SA-UPM] User & Permission Management 使用者 & 權限
    13.2. [SA-SC] System Configuration 系統設定
    13.3. [SA-NWS] Notification / Workflow Settings 通知 / 工作流程設定
    13.4. [SA-SLM] System Logs & Monitoring 系統日誌 & 監控
    13.5. [SA-OBM] Organization & Branch Management 組織 / 區域 / 部門管理（支援北/中/南等 Region）

#### 📊 SA 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🟡 | 部分功能開發中 |
| PRD完成度 | ✅ | SA-OBM PRD v1.1.0 已完成 |
| 系統整合 | 🟡 | 基礎權限系統已整合 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 45% | 基礎系統架構已完成 |
### 14. [UP] User Profile 登出 / 個人資訊

#### 📊 UP 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | ✅ | 有舊系統 |
| 新系統更新 | 🔴 | 未開始 |
| PRD完成度 | ⚪ | 規劃中 |
| 系統整合 | 🔴 | 未開始 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | - | 無相關 issues |
| 上線進度 | 0% | 未開始 |
---

## 資料夾結構對應

此模組結構已對應到 `PRD/` 資料夾下的完整階層結構，每個模組都有對應的資料夾路徑，便於存放相關的 PRD 文件、規格書、測試文件等。

### 資料夾命名規則：
- **主要模組**：`01-DSH-Dashboard`、`02-CRM-Customer_Relationship_Management` 等
- **子模組**：`01.1-DSH-OV-Dashboard_Overview`、`02.1-CRM-CM-Customer_Management` 等
- **子子模組**：`02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine` 等
- **詳細功能**：`02.3.1a-CRM-PM-DBPE-CBC-Cost_Benchmark_Classification` 等

### 編碼結構說明：
- **第1層**：`01-` 到 `14-` 對應主要模組編號
- **第2層**：`01.1-`、`02.1-` 等對應子模組編號
- **第3層**：`02.3.1-` 等對應子子模組編號
- **第4層**：`02.3.1a-` 等對應詳細功能編號

### 統計摘要：
- **總資料夾數**：75個
- **主要模組**：14個
- **子模組**：61個
- **最深層級**：4層
- **編碼一致性**：100%

### 新增模組說明：
- **[BDM]** 基本資料維護：提供全域字典服務
- **[OP]** 營運計劃：管理休市和營運日曆
- **[CRM-TM]** 客服工單：新增客服功能
- **[FA-FS]** 財務結算：新增財務結算子模組

---

## 📈 整體專案狀態統計

### 模組狀態概覽
| 模組 | 舊系統 | 新系統 | PRD | 整合 | 單元測試 | 整合測試 | 上線進度 |
|------|--------|--------|-----|------|----------|----------|----------|
| DSH  | 🔴     | 🟡     | ✅  | 🟡   | 🔴       | 🔴       | 30%      |
| CRM  | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| BDM  | 🔴     | 🟡     | ✅  | 🟡   | 🔴       | 🔴       | 15%      |
| IM   | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| OP   | 🔴     | 🟡     | ✅  | 🟡   | 🔴       | 🔴       | 20%      |
| OM   | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| MES  | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| WMS  | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| PM   | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| LM   | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| FA   | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| BI   | 🔴     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |
| SA   | ✅     | 🟡     | 🟡  | 🟡   | 🔴       | 🔴       | 15%      |
| UP   | ✅     | 🔴     | ⚪  | 🔴   | 🔴       | 🔴       | 0%       |

### 總體進度統計
- **有舊系統運行**: 10/14 (71%)
- **新系統開發中**: 4/14 (29%)
- **PRD 已完成或進行中**: 4/14 (29%)
- **已開始整合**: 4/14 (29%)
- **單元測試完成**: 0/14 (0%)
- **整合測試完成**: 0/14 (0%)
- **平均上線進度**: 5%

### 優先處理項目
1. **急需 TDD 測試覆蓋**: 所有模組皆未開始單元測試
2. **PRD 待完成**: IM、OM、MES、WMS、PM、LM 等 6 個模組
3. **整合待啟動**: 8 個模組尚未開始系統整合
4. **錯誤追蹤系統**: 需建立 GitHub Issues 整合機制