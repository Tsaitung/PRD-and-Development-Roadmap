# 菜蟲農食 ERP 系統 - 產品需求文件 (PRD) 與開發路線圖

## 📋 專案概述

本專案包含菜蟲農食 ERP 系統的完整產品需求文件 (Product Requirements Document, PRD)，涵蓋所有模組的詳細規格、功能需求、技術架構和使用者介面設計。同時整合了 **MPM (Module Progress Matrix) 自動化系統**，實現「文件作為唯一真相來源」的理念，並透過 CI/CD Pipeline 自動維護專案進度。

## 🎯 核心特色

### 📊 MPM 自動化進度追蹤
- **文件作為唯一真相來源**: TOC Modules.md 定義模組結構，PRD 模板定義需求規格
- **自動化進度更新**: CI/CD Pipeline 自動更新 MPM 文件
- **即時儀表板**: 現代化可視化進度監控
- **一致性驗證**: 確保 FR-ID、測試、程式碼的一致性

### 🚀 自動化工作流程
- **觸發機制**: 文件變更、PR、定時執行、手動觸發
- **並行處理**: 多任務並行執行，提升效率
- **錯誤處理**: 完整的錯誤處理和重試機制
- **通知系統**: 成功/失敗自動通知

## 🏗️ 系統架構

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

## 📁 專案結構

```
PRD-and-Development-Roadmap/
├── 📄 核心文件
│   ├── README.md                           # 專案說明文件
│   ├── TOC Modules.md                      # 完整模組階層結構
│   ├── module_prd_template.md              # PRD 文件模板
│   └── github-workflow-stepbystep.md       # GitHub 工作流程說明
│
├── 📊 MPM 自動化系統
│   ├── docs/
│   │   ├── TOC_Module_Progress_Matrix.md   # MPM 主文件 (自動更新)
│   │   ├── MPM_Automation_Guide.md         # 自動化更新指南
│   │   ├── MPM_Automation_Workplan.md      # 完整工作計畫
│   │   └── dashboard/                      # 可視化儀表板
│   │       ├── index.html                  # 儀表板主頁面
│   │       ├── dashboard.js                # 互動式功能
│   │       └── README.md                   # 儀表板使用說明
│   │
│   └── .github/
│       ├── workflows/
│       │   └── mpm-automation.yml          # GitHub Actions 工作流程
│       └── scripts/                        # 自動化腳本套件
│           ├── parse_prd_status.py         # PRD 解析腳本
│           ├── check_code_status.py        # 程式碼狀態檢查
│           ├── run_tests.py                # 測試執行和覆蓋率檢查
│           ├── check_issues.py             # GitHub Issues 檢查
│           ├── update_mpm.py               # MPM 更新腳本
│           └── generate_dashboard.py       # 可視化儀表板生成
│
├── 📋 PRD 文件結構
│   └── PRD/
│       ├── 01-DSH-Dashboard/               # 儀表板模組
│       ├── 02-CRM-Customer_Relationship_Management/  # 客戶管理模組
│       ├── 03-IM-Item_Management/          # 品項管理模組
│       ├── 04-OM-Order_Management/         # 訂單管理模組
│       ├── 05-MES-Manufacturing_Execution_System/    # 生產管理模組
│       ├── 06-WMS-Warehouse_Management_System/  # 庫存管理模組
│       ├── 07-PM-Purchasing_Management/    # 採購管理模組
│       ├── 08-LM-Logistics_Management/     # 物流管理模組
│       ├── 09-FA-Finance_Accounting/       # 財務會計模組
│       ├── 10-BI-Analytics_Business_Intelligence/    # 分析 & BI 模組
│       ├── 11-SA-System_Administration/    # 系統管理模組
│       └── 12-UP-User_Profile/             # 使用者個人資訊模組
│
└── 🔧 配置檔案
    ├── .gitignore                          # Git 忽略檔案
    └── requirements.txt                    # Python 依賴項 (可選)
```

## 🎨 可視化儀表板

### 📊 即時進度監控
- **現代化 UI**: 使用 Tailwind CSS 設計，響應式佈局
- **互動式圖表**: 進度圓環、圓餅圖、長條圖、熱力圖
- **即時更新**: 自動同步 MPM 文件數據
- **多設備支援**: 桌面版、平板版、手機版

### 🎯 儀表板功能
- **概覽卡片**: 整體進度、模組統計、完成數量
- **圖表分析**: 進度分布、模組狀態比較
- **詳細表格**: 模組進度詳情和操作按鈕
- **進度矩陣**: 完整的 MPM 內容展示

### 🚀 快速開始
```bash
# 開啟儀表板
open docs/dashboard/index.html

# 或使用 Python 伺服器
cd docs/dashboard
python -m http.server 8000
# 訪問 http://localhost:8000
```

## 🔄 MPM 自動化流程

### ⚡ 觸發機制
MPM 自動化更新會在以下情況觸發：

1. **文件變更觸發**
   - PRD 文件更新
   - 文檔更新
   - 測試文件更新
   - 程式碼更新

2. **Pull Request 觸發**
   - 合併請求時自動檢查
   - 一致性驗證
   - 自動留言報告

3. **定時觸發**
   - 每天凌晨 2 點自動執行
   - 確保數據即時性

4. **手動觸發**
   - GitHub 介面手動執行
   - 緊急更新需求

### 🔄 執行流程
```
文件更新 → GitHub Actions 觸發 → 並行執行分析任務 → 更新 MPM → 提交變更 → 生成儀表板
```

#### 詳細步驟：
1. **分析 PRD 文件** - 解析所有 PRD 文件，提取 FR-ID 和狀態
2. **檢查程式碼狀態** - 掃描程式碼目錄，檢查實現狀態
3. **執行測試** - 運行單元測試，檢查測試覆蓋率
4. **檢查錯誤追蹤** - 連接 GitHub Issues API，統計錯誤
5. **更新 MPM 文件** - 整合所有分析結果，更新進度矩陣
6. **驗證一致性** - 檢查 FR-ID 與測試的一致性
7. **生成儀表板** - 創建可視化圖表，更新儀表板

### 📈 監控指標
- **自動化率**: MPM 更新自動化率 ≥ 95%
- **執行時間**: 每次更新 ≤ 10 分鐘
- **數據準確性**: 進度報告準確性 ≥ 90%
- **一致性**: 文件與程式碼一致性 ≥ 95%

## 🛠️ 開發指南

### 📝 模組縮寫規則

- **主要模組**: 2-3個字母縮寫 (如: DSH, CRM, IM)
- **子模組**: 主模組-功能縮寫 (如: CRM-CM, PM-SRM-SMO)
- **詳細功能**: 多層級縮寫 (如: CRM-PM-DBPE-CBC)

### 📋 文件命名規範

- 使用英文命名，避免特殊字元
- 遵循模組編號順序
- 包含模組縮寫和功能描述

### 🔧 PRD 文件格式
```markdown
# [FR-001] 功能需求標題

## 狀態
📝 草稿 | ✅ 完成 | 🟡 開發中 | 🔴 未開始 | ⚠️ 有問題

## 功能描述
...

## 驗收標準
...
```

### 🧪 測試檔案命名
```bash
# 測試檔案應與 FR-ID 對應
tests/FR-001.spec.js
tests/FR-002.spec.js
```

## 📊 顏色編碼系統

| 狀態 | 顏色 | 說明 |
|------|------|------|
| 🟢 已完成 | 綠色 (#10B981) | 功能已完全實現並測試通過 |
| 🟡 開發中 | 黃色 (#F59E0B) | 正在積極開發中 |
| 🔵 草稿 | 藍色 (#3B82F6) | PRD 草稿階段 |
| 🔴 未開始 | 紅色 (#EF4444) | 尚未開始開發 |
| 🟠 有問題 | 橙色 (#F97316) | 存在錯誤或問題 |

## 🔧 設定與配置

### GitHub Actions 權限設定
在 repository 設定中啟用必要的權限：
```yaml
permissions:
  contents: write      # 允許寫入文件
  issues: read         # 允許讀取 Issues
  pull-requests: write # 允許在 PR 中留言
```

### 環境變數設定
在 repository 的 Settings > Secrets and variables > Actions 中設定：
```bash
GITHUB_TOKEN          # GitHub API Token (自動提供)
JIRA_API_TOKEN        # Jira API Token (可選)
SLACK_WEBHOOK_URL     # Slack 通知 URL (可選)
```

## 🚀 快速開始

### 1. 查看專案進度
- 訪問 [MPM 儀表板](docs/dashboard/index.html)
- 查看 [MPM 進度矩陣](docs/TOC_Module_Progress_Matrix.md)
- 檢查 [GitHub Actions](https://github.com/Tsaitung/PRD-and-Development-Roadmap/actions)

### 2. 參與開發
- 遵循 [PRD 模板](module_prd_template.md) 建立新功能需求
- 使用正確的 [模組縮寫規則](#模組縮寫規則)
- 確保測試檔案與 FR-ID 對應

### 3. 監控自動化
- 查看 [自動化指南](docs/MPM_Automation_Guide.md)
- 檢查 [工作計畫](docs/MPM_Automation_Workplan.md)
- 參考 [儀表板說明](docs/dashboard/README.md)

## 📈 預期效益

### 效率提升
- **手動更新時間減少**: ≥ 80%
- **錯誤發現時間縮短**: ≥ 70%
- **決策支援響應時間**: ≤ 5分鐘

### 品質提升
- **文件與程式碼一致性**: ≥ 95%
- **FR-ID 追蹤完整性**: ≥ 98%
- **進度報告準確性**: ≥ 90%

### 團隊協作
- **統一的進度視圖**: 促進團隊溝通
- **即時狀態更新**: 減少資訊不對稱
- **自動化驗證**: 確保開發品質

## 🛠️ 故障排除

### 常見問題
1. **MPM 文件未更新**: 檢查 GitHub Actions 執行日誌
2. **數據不準確**: 驗證 PRD 文件格式和解析腳本
3. **圖表生成失敗**: 安裝必要的 Python 套件

### 手動修復
```bash
# 重新執行工作流程
gh workflow run mpm-automation.yml

# 本地測試腳本
python3 .github/scripts/parse_prd_status.py
python3 .github/scripts/update_mpm.py --prd-status '{}' --code-status '{}'
```

## 📞 支援與維護

### 問題回報
如遇到問題，請：
1. 檢查 GitHub Actions 執行日誌
2. 驗證文件格式和結構
3. 確認權限和設定
4. 在 [GitHub Issues](https://github.com/Tsaitung/PRD-and-Development-Roadmap/issues) 中回報問題

### 定期維護
- 每月檢查工作流程執行狀態
- 每季度更新依賴項版本
- 每年檢討和優化自動化流程

## 📄 版本資訊

- **版本**: 2.0.0
- **建立日期**: 2024年
- **狀態**: 開發中
- **最後更新**: 2024年1月

## 🔗 相關連結

- [GitHub Repository](https://github.com/Tsaitung/PRD-and-Development-Roadmap)
- [MPM 儀表板](docs/dashboard/index.html)
- [自動化指南](docs/MPM_Automation_Guide.md)
- [工作計畫](docs/MPM_Automation_Workplan.md)

---

© 2024 菜蟲農食. All rights reserved. 