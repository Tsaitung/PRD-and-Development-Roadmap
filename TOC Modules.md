# 菜蟲農食 ERP — 完整模組 / 子模組階層（重新編號）

## 模組縮寫說明

### 主要模組縮寫（2-3個字母）：
- **[DSH]** - Dashboard 首頁 / 儀表板
- **[CRM]** - Customer Relationship Management 客戶管理
- **[IM]** - Item Management 品項管理
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

1. [DSH] Dashboard 首頁 / 儀表板
    1.1. [DSH-OV] Dashboard Overview 總覽儀表板
    1.2. [DSH-NC] Notification Center 即時訊息 / 通知中心

2. [CRM] Customer Relationship Management (CRM) 客戶管理
    2.1. [CRM-CM] Customer Master 客戶主檔
    2.2. [CRM-CS] Customer Segmentation 客戶級距 / 分群
    2.3. [CRM-PM] Pricing Management 定價(標單)管理
        2.3.1. [CRM-PM-DBPE] Dynamic Base Pricing Engine 動態基礎訂價引擎
            2.3.1a. [CRM-PM-DBPE-CBC] Cost Benchmark Classification 成本對標分類設定
            2.3.1b. [CRM-PM-DBPE-MPS] Market Price Setting 時價設定
            2.3.1c. [CRM-PM-DBPE-CIPM] Cost Import & Parsing Module 成本導入與解析模組
            2.3.1d. [CRM-PM-DBPE-CBECC] Cost Benchmark & Effective Cost Calculation 成本對標 & 有效成本計算模組
            2.3.1e. [CRM-PM-DBPE-MQLM] Market & Quotation Logic Module 行情與報價邏輯模組
            2.3.1f. [CRM-PM-DBPE-BPOM] Base Pricing Output Module / API Base Pricing 報價輸出模組 / API
        2.3.2. [CRM-PM-CTAM] Customer Tier Adjustment Management 客戶分級調整管理
        2.3.3. [CRM-PM-SRP] Seasonality & Risk Premium 季節性風險溢價
        2.3.4. [CRM-PM-CFRP] Credit & Financial Risk Premium 信用與資金風險溢價
        2.3.5. [CRM-PM-SVR] Single Volume Rate 單一量體費率
        2.3.6. [CRM-PM-ER] Exception Review 例外審核
        2.3.7. [CRM-PM-RA] Reports & Analytics 報表與分析
    2.4. [CRM-CSCM] Customer Service & Complaint Management 客戶服務 & 客訴管理
    2.5. [CRM-CRA] Customer Relationship Analytics 客戶關係分析
    2.6. [CRM-CMR] Customer Management & Review 客戶管理及審核

3. [IM] Item Management 品項管理
    3.1. [IM-IM] Item Master 品項主檔
    3.2. [IM-BCRS] BOM / Conversion Relationship Setting BOM / 轉換關聯設定
    3.3. [IM-UPS] Unit & Packaging Specifications 單位與包裝規格
    3.4. [IM-IAC] Item Analytics / Usage Cycle 品項分析 / 週期用量

4. [OM] Order Management 訂單管理
    4.1. [OM-OL] Order List 訂單列表
    4.2. [OM-COSR] Create Order / Sales Return 建立訂單 / 銷退單
    4.3. [OM-OAPM] Order Allocation / Production Mapping 訂單分貨 / 對應生產
    4.4. [OM-RRP] Return / RMA Processing 退貨 / RMA 處理
    4.5. [OM-OA] Order Analytics 訂單分析

5. [MES] Manufacturing Execution System (MES) 生產管理
    5.1. [MES-WTM] Workstation / Task Management 工作站 / 派工管理
    5.2. [MES-PSWO] Production Scheduling & Work Orders 生產排程 & 工單
    5.3. [MES-MBU] Material & Batch Usage 材料 & 批號使用
    5.4. [MES-PEMLD] Personnel Efficiency & Material Loss Dashboard 人員效率 & 物料損耗儀表板
    5.5. [MES-PMR] Progress Monitoring & Reports 進度監控 & 報表

6. [WMS] Warehouse Management System (WMS) 庫存管理
    6.1. [WMS-IOD] Inventory Overview / Inventory Details 庫存概況 / 庫存明細
    6.2. [WMS-RIS] Receiving & Inspection / Shipping 入庫 & 驗收 / 出庫
    6.3. [WMS-BTM] Batch & Traceability Management 批號 & 溯源管理
    6.4. [WMS-IAT] Inventory Adjustment / Transfer 庫存調整 / 移位
    6.5. [WMS-RQIA] Remaining Quantity / In-Transit Analysis 餘量 / 在途分析

7. [PM] Purchasing Management 採購管理
    7.1. [PM-SRM] Supplier Relationship Management (SRM) 供應商管理
        7.1.1. [PM-SRM-SMO] Supplier Management Overview 供應商管理總覽
        7.1.2. [PM-SRM-SL] Supplier List 供應商清單
        7.1.3. [PM-SRM-LMR] Loss Management & Returns 損耗管理及退貨
        7.1.4. [PM-SRM-SA] Supplier Accounting 供應商帳務
        7.1.5. [PM-SRM-RS] Review & Scoring 審核與評分
    7.2. [PM-CPM] Contract & Pricing Management 合約 & 定價管理
    7.3. [PM-PODM] Purchase Order (PO) & Delivery Management 採購單 (PO) & 交期管理
    7.4. [PM-RIS] Receiving & Inspection Status 進貨 & 驗收狀態
    7.5. [PM-PAR] Purchasing Analytics & Reports 採購分析 & 報表

8. [LM] Logistics Management 物流管理
    8.1. [LM-DSRO] Delivery Scheduling & Route Optimization 配送排程 & 路線優化
    8.2. [LM-DVM] Driver & Vehicle Management 司機 & 車輛管理
    8.3. [LM-ESDR] Electronic Signing & Delivery Reporting 電子簽單 & 配送回報
    8.4. [LM-DTRV] Delivery Tracking & Real-time View 配送追蹤 & 即時視圖
    8.5. [LM-CM] Contract Management 合約管理
    8.6. [LM-LCPA] Logistics Cost & Performance Analytics 物流費用 & 績效分析

9. [FA] Finance & Accounting 財務會計
    9.1. [FA-AR] Accounts Receivable (AR) 應收帳款 (AR)
    9.2. [FA-AP] Accounts Payable (AP) 應付帳款 (AP)
    9.3. [FA-PMAR] Payment Management & Account Reconciliation 付款管理 & 帳務對帳
    9.4. [FA-IT] Invoice & Tax 發票 & 稅務
    9.5. [FA-FR] Financial Reports 財務報表

10. [BI] Analytics & Business Intelligence (BI) 分析 & BI
    10.1. [BI-DF] Demand Forecasting 需求預測
    10.2. [BI-PIK] Production & Inventory KPI 生產 & 庫存 KPI
    10.3. [BI-SCA] Sales & Customer Analytics 銷售 & 客戶分析
    10.4. [BI-FKPA] Financial KPI & Profitability Analysis 財務 KPI & 獲利分析
    10.5. [BI-AIMM] AI Model Management AI 模型管理

11. [SA] System Administration 系統管理
    11.1. [SA-UPM] User & Permission Management 使用者 & 權限
    11.2. [SA-SC] System Configuration 系統設定
    11.3. [SA-NWS] Notification / Workflow Settings 通知 / 工作流程設定
    11.4. [SA-SLM] System Logs & Monitoring 系統日誌 & 監控
    11.5. [SA-OBM] Organization & Branch Management 組織 / 區域 / 部門管理

12. [UP] User Profile 登出 / 個人資訊

---

## 資料夾結構對應

此模組結構已對應到 `PRD/` 資料夾下的完整階層結構，每個模組都有對應的資料夾路徑，便於存放相關的 PRD 文件、規格書、測試文件等。

### 資料夾命名規則：
- **主要模組**：`01-DSH-Dashboard`、`02-CRM-Customer_Relationship_Management` 等
- **子模組**：`01.1-DSH-OV-Dashboard_Overview`、`02.1-CRM-CM-Customer_Master` 等
- **子子模組**：`02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine` 等
- **詳細功能**：`02.3.1a-CRM-PM-DBPE-CBC-Cost_Benchmark_Classification` 等

### 編碼結構說明：
- **第1層**：`01-` 到 `12-` 對應主要模組編號
- **第2層**：`01.1-`、`02.1-` 等對應子模組編號
- **第3層**：`02.3.1-` 等對應子子模組編號
- **第4層**：`02.3.1a-` 等對應詳細功能編號

### 統計摘要：
- **總資料夾數**：67個
- **主要模組**：12個
- **子模組**：55個
- **最深層級**：4層
- **編碼一致性**：100%