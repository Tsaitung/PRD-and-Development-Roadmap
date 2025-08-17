# 菜蟲農食 ERP 系統 - 產品需求文件 (PRD)

## 專案概述

本專案包含菜蟲農食 ERP 系統的完整產品需求文件 (Product Requirements Document, PRD)，涵蓋所有模組的詳細規格、功能需求、技術架構和使用者介面設計。

## 系統架構

菜蟲農食 ERP 系統包含以下 12 個主要模組：

1. **[DSH]** Dashboard 首頁 / 儀表板
2. **[CRM]** Customer Relationship Management 客戶管理
3. **[IM]** Item Management 品項管理
4. **[OM]** Order Management 訂單管理
5. **[MES]** Manufacturing Execution System 生產管理
6. **[WMS]** Warehouse Management System 庫存管理
7. **[PM]** Purchasing Management 採購管理
8. **[LM]** Logistics Management 物流管理
9. **[FA]** Finance & Accounting 財務會計
10. **[BI]** Business Intelligence 分析 & BI
11. **[SA]** System Administration 系統管理
12. **[UP]** User Profile 登出 / 個人資訊

## 資料夾結構

```
PRD/
├── 01-DSH-Dashboard/                    # 儀表板模組
├── 02-CRM-Customer_Relationship_Management/  # 客戶管理模組
├── 03-IM-Item_Management/               # 品項管理模組
├── 04-OM-Order_Management/              # 訂單管理模組
├── 05-MES-Manufacturing_Execution_System/    # 生產管理模組
├── 06-WMS-Warehouse_Management_System/  # 庫存管理模組
├── 07-PM-Purchasing_Management/         # 採購管理模組
├── 08-LM-Logistics_Management/          # 物流管理模組
├── 09-FA-Finance_Accounting/            # 財務會計模組
├── 10-BI-Analytics_Business_Intelligence/    # 分析 & BI 模組
├── 11-SA-System_Administration/         # 系統管理模組
└── 12-UP-User_Profile/                  # 使用者個人資訊模組
```

## 文件說明

- **TOC Modules.md**: 完整的模組階層結構和縮寫說明
- **module_prd_template.md**: PRD 文件模板
- **github-workflow-stepbystep.md**: GitHub 工作流程說明

## 開發指南

### 模組縮寫規則

- **主要模組**: 2-3個字母縮寫 (如: DSH, CRM, IM)
- **子模組**: 主模組-功能縮寫 (如: CRM-CM, PM-SRM-SMO)
- **詳細功能**: 多層級縮寫 (如: CRM-PM-DBPE-CBC)

### 文件命名規範

- 使用英文命名，避免特殊字元
- 遵循模組編號順序
- 包含模組縮寫和功能描述

## 版本資訊

- **版本**: 1.0.0
- **建立日期**: 2024年
- **狀態**: 開發中

## 聯絡資訊

如有任何問題或建議，請聯繫開發團隊。

---

© 2024 菜蟲農食. All rights reserved. 