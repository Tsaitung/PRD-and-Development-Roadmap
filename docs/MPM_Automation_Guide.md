# 🔄 MPM 自動化更新完整指南

## 📋 概述

本指南詳細說明如何確保 MPM (Module Progress Matrix) 文件會自動化更新，包括觸發條件、執行流程、故障排除和最佳實踐。

## 🚀 自動化更新機制

### 1. 觸發條件

MPM 自動化更新會在以下情況觸發：

#### 📝 **文件變更觸發**
```yaml
on:
  push:
    branches: [ main, develop ]
    paths:
      - 'PRD/**'      # PRD 文件更新
      - 'docs/**'     # 文檔更新
      - 'tests/**'    # 測試文件更新
      - 'src/**'      # 程式碼更新
```

#### 🔄 **Pull Request 觸發**
```yaml
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'PRD/**'
      - 'docs/**'
      - 'tests/**'
      - 'src/**'
```

#### ⏰ **定時觸發**
```yaml
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 點執行
```

#### 🎯 **手動觸發**
```yaml
  workflow_dispatch:  # 可在 GitHub 介面手動觸發
```

### 2. 執行流程

```
文件更新 → GitHub Actions 觸發 → 並行執行分析任務 → 更新 MPM → 提交變更 → 生成儀表板
```

#### 詳細步驟：

1. **分析 PRD 文件** (`analyze-prd`)
   - 解析所有 PRD 文件
   - 提取 FR-ID 和狀態資訊
   - 生成結構化數據

2. **檢查程式碼狀態** (`check-code-status`)
   - 掃描程式碼目錄
   - 檢查實現狀態
   - 驗證程式碼完整性

3. **執行測試** (`run-tests`)
   - 運行單元測試
   - 檢查測試覆蓋率
   - 驗證測試完整性

4. **檢查錯誤追蹤** (`check-issues`)
   - 連接 GitHub Issues API
   - 統計錯誤數量
   - 分析錯誤趨勢

5. **更新 MPM 文件** (`update-mpm`)
   - 整合所有分析結果
   - 更新進度矩陣
   - 自動提交變更

6. **驗證一致性** (`validate-consistency`)
   - 檢查 FR-ID 與測試的一致性
   - 驗證文件完整性
   - 生成驗證報告

7. **生成儀表板** (`generate-dashboard`)
   - 創建可視化圖表
   - 生成統計報告
   - 更新儀表板

## 🔧 設定與配置

### 1. GitHub Actions 權限設定

在 repository 設定中啟用必要的權限：

```yaml
# .github/workflows/mpm-automation.yml
permissions:
  contents: write      # 允許寫入文件
  issues: read         # 允許讀取 Issues
  pull-requests: write # 允許在 PR 中留言
```

### 2. 環境變數設定

在 repository 的 Settings > Secrets and variables > Actions 中設定：

```bash
# 必要的環境變數
GITHUB_TOKEN          # GitHub API Token (自動提供)
JIRA_API_TOKEN        # Jira API Token (可選)
SLACK_WEBHOOK_URL     # Slack 通知 URL (可選)
```

### 3. 分支保護設定

確保 `main` 分支受到保護：

```yaml
# 分支保護規則
- Require pull request reviews before merging
- Require status checks to pass before merging
- Include administrators
- Restrict pushes that create files
```

## 📊 監控與驗證

### 1. 執行狀態監控

#### GitHub Actions 頁面
- 訪問 `https://github.com/Tsaitung/PRD-and-Development-Roadmap/actions`
- 查看工作流程執行狀態
- 檢查各步驟的執行結果

#### 執行日誌檢查
```bash
# 查看最近的執行日誌
gh run list --limit 10

# 查看特定執行的詳細日誌
gh run view <run-id> --log
```

### 2. 自動化驗證

#### 一致性檢查
- FR-ID 與測試檔案的一致性
- PRD 狀態與程式碼狀態的一致性
- 文件格式和結構的完整性

#### 數據驗證
- 進度計算的準確性
- 統計數據的完整性
- 圖表生成的正確性

## 🛠️ 故障排除

### 1. 常見問題

#### 問題：MPM 文件未更新
**原因**：腳本執行失敗或權限不足
**解決方案**：
```bash
# 檢查 GitHub Actions 執行日誌
# 確認權限設定正確
# 手動觸發工作流程測試
```

#### 問題：數據不準確
**原因**：解析腳本錯誤或數據格式不正確
**解決方案**：
```bash
# 檢查 PRD 文件格式
# 驗證 JSON 輸出格式
# 更新解析腳本
```

#### 問題：圖表生成失敗
**原因**：依賴項缺失或記憶體不足
**解決方案**：
```bash
# 安裝必要的 Python 套件
pip install matplotlib seaborn plotly

# 增加 GitHub Actions 記憶體限制
runs-on: ubuntu-latest
```

### 2. 手動修復步驟

#### 重新執行工作流程
```bash
# 在 GitHub 介面手動觸發
# 或使用 GitHub CLI
gh workflow run mpm-automation.yml
```

#### 本地測試腳本
```bash
# 測試 PRD 解析
python3 .github/scripts/parse_prd_status.py

# 測試 MPM 更新
python3 .github/scripts/update_mpm.py --prd-status '{}' --code-status '{}'

# 測試儀表板生成
python3 .github/scripts/generate_dashboard.py
```

## 📈 最佳實踐

### 1. 文件結構規範

#### PRD 文件格式
```markdown
# [FR-001] 功能需求標題

## 狀態
📝 草稿 | ✅ 完成 | 🟡 開發中 | 🔴 未開始 | ⚠️ 有問題

## 功能描述
...

## 驗收標準
...
```

#### 測試檔案命名
```bash
# 測試檔案應與 FR-ID 對應
tests/FR-001.spec.js
tests/FR-002.spec.js
```

### 2. 提交規範

#### 自動提交訊息
```bash
# 自動生成的提交訊息格式
🤖 Auto-update MPM: 2024-01-01 12:00:00
```

#### 手動提交規範
```bash
# 功能開發
feat: 新增 FR-001 客戶管理功能

# 文件更新
docs: 更新 PRD 文件狀態

# 修復問題
fix: 修正 MPM 進度計算錯誤
```

### 3. 監控指標

#### 自動化指標
- **執行成功率**: ≥ 95%
- **執行時間**: ≤ 10 分鐘
- **數據準確性**: ≥ 90%

#### 品質指標
- **文件一致性**: ≥ 95%
- **測試覆蓋率**: ≥ 90%
- **錯誤檢測率**: ≥ 85%

## 🔔 通知與警報

### 1. 成功通知
```yaml
# 成功執行時的通知
- name: Success notification
  if: success()
  run: |
    echo "✅ MPM 自動化更新成功完成"
    # 可添加 Slack 或郵件通知
```

### 2. 失敗警報
```yaml
# 執行失敗時的警報
- name: Failure notification
  if: failure()
  run: |
    echo "❌ MPM 自動化更新失敗"
    # 發送緊急通知
```

### 3. 自訂通知
```python
# 在腳本中添加自訂通知
import requests

def send_notification(message, webhook_url):
    payload = {"text": message}
    requests.post(webhook_url, json=payload)
```

## 📋 檢查清單

### 自動化設定檢查
- [ ] GitHub Actions 工作流程已啟用
- [ ] 權限設定正確
- [ ] 環境變數已配置
- [ ] 分支保護規則已設定

### 腳本功能檢查
- [ ] PRD 解析腳本正常運行
- [ ] MPM 更新腳本正常運行
- [ ] 儀表板生成腳本正常運行
- [ ] 一致性驗證腳本正常運行

### 監控設定檢查
- [ ] 執行狀態監控已設定
- [ ] 通知機制已配置
- [ ] 錯誤處理已實作
- [ ] 日誌記錄已啟用

## 🚀 進階功能

### 1. 自訂觸發條件
```yaml
# 自訂觸發條件
on:
  push:
    branches: [ main, develop, feature/* ]
    paths-ignore:
      - 'README.md'
      - 'docs/images/**'
```

### 2. 條件執行
```yaml
# 只在特定條件下執行
- name: Update MPM
  if: contains(github.event.head_commit.message, 'MPM')
  run: |
    python3 .github/scripts/update_mpm.py
```

### 3. 快取優化
```yaml
# 快取依賴項以提升執行速度
- name: Cache Python dependencies
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
```

---

## 📞 支援與維護

### 問題回報
如遇到自動化問題，請：
1. 檢查 GitHub Actions 執行日誌
2. 驗證文件格式和結構
3. 確認權限和設定
4. 在 GitHub Issues 中回報問題

### 定期維護
- 每月檢查工作流程執行狀態
- 每季度更新依賴項版本
- 每年檢討和優化自動化流程

---

*此指南確保 MPM 文件的自動化更新穩定可靠，為專案管理提供即時準確的進度資訊。* 