# 菜蟲農食 ERP 專案追蹤系統使用指南

## 📋 系統概述

本追蹤系統提供了完整的專案生命週期管理功能，包含 9 個追蹤維度：
1. 舊系統運行狀態
2. 新系統更新進度
3. PRD 文件完成度
4. 系統整合狀態
5. 單元測試覆蓋
6. 整合測試完成
7. 錯誤追蹤管理
8. 上線部署進度

## 🚀 快速開始

### 1. 自動狀態檢測與同步

使用增強版同步腳本來執行完整的狀態更新：

```bash
./enhanced_auto_sync.sh
```

這個腳本會：
- 自動掃描所有模組狀態
- 更新 `TOC Modules.md` 中的追蹤表格
- 生成狀態報告
- 提交並推送到 GitHub
- 觸發 GitHub Actions 更新 Dashboard

### 2. 手動執行狀態檢測

如果只想檢測狀態而不同步：

```bash
python .github/scripts/check_module_status.py
```

這會生成 `module_status_report.md` 檔案，包含詳細的狀態分析。

## 📊 Dashboard 視覺化

### 線上 Dashboard

Dashboard 會自動部署到 GitHub Pages：
- URL: `https://[your-username].github.io/[repo-name]/dashboard/`
- 自動更新：每次推送到 main 分支後自動更新

### 本地預覽

```bash
cd docs/dashboard
python -m http.server 8000
# 開啟瀏覽器訪問 http://localhost:8000
```

### Dashboard 功能
- **整體進度概覽**：顯示專案整體完成度
- **狀態維度卡片**：展示 9 個維度的統計資訊
- **模組進度表格**：詳細列出每個模組的狀態
- **互動式圖表**：可視化進度分布

## 📈 進度報表

### 查看綜合報表

訪問 `docs/progress-report.html` 可查看：
- 模組狀態熱力圖
- 進度趨勢圖表
- 風險評估報告
- 詳細進度明細
- 專案時間軸

### 匯出報表

報表支援：
- **列印**：點擊「列印報表」按鈕
- **CSV 匯出**：點擊「匯出 CSV」按鈕
- **PDF**：使用瀏覽器的列印功能選擇「儲存為 PDF」

## 📝 手動更新狀態

### 更新模組狀態

在 `TOC Modules.md` 中找到對應模組的狀態表格，更新狀態符號：

```markdown
#### 📊 DSH 模組狀態追蹤
| 維度 | 狀態 | 說明 |
|------|------|------|
| 舊系統狀態 | 🔴 | 無舊系統 |
| 新系統更新 | 🟡 | 開發中 |
| PRD完成度 | ✅ | 已完成 |  <!-- 更新狀態符號 -->
| 系統整合 | 🟡 | 部分整合 |
| 單元測試 | 🔴 | 未開始 |
| 整合測試 | 🔴 | 未開始 |
| 錯誤追蹤 | [#123](link) | 相關 issue |  <!-- 加入連結 -->
| 上線進度 | 35% | 更新進度描述 |  <!-- 更新百分比 -->
```

### 狀態符號說明
- ✅ 完成
- 🟡 開發中/進行中
- 🔴 未開始
- ⚪ 規劃中

## 🔄 GitHub Actions 自動化

### 觸發條件
- 推送到 main 或 develop 分支
- 每日凌晨 2 點自動執行
- 手動觸發（在 GitHub Actions 頁面）

### 工作流程
1. **check-module-status**：執行狀態檢測
2. **generate-dashboard**：更新並部署 Dashboard

## 🐛 錯誤追蹤整合

### 建立模組相關 Issue

在 GitHub Issues 中使用標籤系統：
- `module:DSH` - Dashboard 相關
- `module:CRM` - 客戶管理相關
- `type:bug` - 錯誤回報
- `type:feature` - 功能需求

### 連結到狀態追蹤

在模組狀態表格的「錯誤追蹤」欄位加入 Issue 連結：

```markdown
| 錯誤追蹤 | [#123, #124](https://github.com/user/repo/issues?q=label:module:DSH) | 2 個相關 issues |
```

## 🧪 測試覆蓋率追蹤

### 設定測試目錄結構

```
tests/
├── unit/           # 單元測試
│   ├── test_dsh_*.py
│   ├── test_crm_*.py
│   └── ...
└── integration/    # 整合測試
    ├── test_dsh_integration.py
    └── ...
```

### 自動檢測規則
- 檔案命名包含模組代碼（如 `test_crm_*.py`）
- 測試檔案存在即判定為「已開始測試」
- 未來可整合 coverage 報告

## 💡 最佳實踐

### 1. 定期執行同步
建議每日或每週執行一次完整同步：
```bash
./enhanced_auto_sync.sh
```

### 2. 即時更新重要變更
重大進展應立即更新：
- PRD 完成
- 模組上線
- 重要 Bug 修復

### 3. 團隊協作
- 使用 GitHub Issues 追蹤問題
- PR 描述中標註影響的模組
- 定期檢視 Dashboard 進度

### 4. 進度評估
- 每月生成進度報表
- 識別風險項目
- 調整開發優先順序

## 🛠️ 故障排除

### 狀態檢測腳本錯誤
```bash
# 檢查 Python 版本
python --version  # 需要 3.6+

# 檢查檔案權限
ls -la .github/scripts/check_module_status.py

# 手動執行並查看錯誤
python .github/scripts/check_module_status.py
```

### Dashboard 無法載入
1. 檢查 `TOC Modules.md` 格式是否正確
2. 使用瀏覽器開發者工具查看錯誤
3. 確認檔案路徑正確

### GitHub Actions 失敗
1. 查看 Actions 頁面的錯誤日誌
2. 檢查權限設定
3. 確認 secrets 配置

## 📞 支援

如有問題或建議，請：
1. 開立 GitHub Issue
2. 查看專案 Wiki
3. 聯繫開發團隊

---

最後更新：2024-01-17