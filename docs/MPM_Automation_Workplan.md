# 🚦 MPM 與自動化系統設計的落地運作工作計畫

## 📋 專案概述

本工作計畫旨在建立一個完整的 MPM (Module Progress Matrix) 自動化系統，實現「文件作為唯一真相來源」的理念，並透過 CI/CD Pipeline 自動維護專案進度。

## 🎯 核心目標

1. **文件作為唯一真相來源** - TOC Modules.md 定義模組結構，PRD 模板定義需求規格
2. **自動化進度追蹤** - CI/CD Pipeline 自動更新 MPM 文件
3. **一致性驗證** - 確保 FR-ID、測試、程式碼的一致性
4. **即時決策支援** - 提供管理層即時專案狀態

## 📊 階段規劃

### 階段一：基礎架構建立 (已完成)

#### ✅ 已完成項目
- [x] 建立 MPM 主文件 (`docs/TOC_Module_Progress_Matrix.md`)
- [x] 建立 GitHub Actions 工作流程 (`.github/workflows/mpm-automation.yml`)
- [x] 建立 PRD 解析腳本 (`.github/scripts/parse_prd_status.py`)
- [x] 建立 MPM 更新腳本 (`.github/scripts/update_mpm.py`)
- [x] 建立程式碼狀態檢查腳本 (`.github/scripts/check_code_status.py`)

#### 🔄 進行中項目
- [ ] 建立測試覆蓋率檢查腳本
- [ ] 建立錯誤追蹤檢查腳本
- [ ] 建立一致性驗證腳本
- [ ] 建立可視化儀表板生成腳本

### 階段二：腳本開發與測試 (進行中)

#### 1. 測試覆蓋率檢查腳本
**檔案**: `.github/scripts/run_tests.py`
**功能**:
- 執行單元測試和整合測試
- 收集測試覆蓋率數據
- 生成測試報告
- 檢查 FR-ID 對應的測試檔案

**實現要點**:
```python
# 檢查測試檔案是否存在
def check_test_files(fr_id: str) -> bool:
    test_file = f"tests/{fr_id}.spec.js"
    return Path(test_file).exists()

# 執行測試並收集覆蓋率
def run_tests_and_collect_coverage() -> Dict:
    # 執行 npm test 或 pytest
    # 解析覆蓋率報告
    # 返回結構化數據
```

#### 2. 錯誤追蹤檢查腳本
**檔案**: `.github/scripts/check_issues.py`
**功能**:
- 連接 GitHub Issues API
- 檢查與 FR-ID 相關的錯誤
- 統計開啟和關閉的 Issues
- 生成錯誤追蹤報告

**實現要點**:
```python
# 檢查 GitHub Issues
def check_github_issues(fr_id: str) -> List[Dict]:
    # 使用 GitHub API 查詢相關 Issues
    # 過濾包含 FR-ID 標籤的 Issues
    # 返回 Issue 列表
```

#### 3. 一致性驗證腳本
**檔案**: `.github/scripts/validate_consistency.py`
**功能**:
- 驗證 FR-ID 與測試檔案的一致性
- 檢查 PRD 與程式碼的對應關係
- 生成一致性報告
- 在 PR 中自動留言

**實現要點**:
```python
# 驗證一致性
def validate_consistency(fr_ids: List[str], test_coverage: Dict) -> Dict:
    missing_tests = []
    for fr_id in fr_ids:
        if not has_test_file(fr_id):
            missing_tests.append(fr_id)
    
    return {
        "missing_tests": missing_tests,
        "consistency_score": calculate_score(missing_tests)
    }
```

#### 4. 可視化儀表板生成腳本
**檔案**: `.github/scripts/generate_dashboard.py`
**功能**:
- 生成進度圖表 (Mermaid/Chart.js)
- 建立互動式儀表板
- 生成統計報告
- 建立進度趨勢圖

### 階段三：整合與優化

#### 1. 工作流程整合
- [ ] 測試所有腳本的整合
- [ ] 優化執行時間
- [ ] 處理錯誤情況
- [ ] 建立回滾機制

#### 2. 通知系統
- [ ] 設定 Slack/Teams 通知
- [ ] 建立郵件通知
- [ ] 設定緊急情況警報

#### 3. 權限管理
- [ ] 設定 GitHub Actions 權限
- [ ] 建立 API Token 管理
- [ ] 設定安全掃描

### 階段四：部署與監控

#### 1. 生產環境部署
- [ ] 部署到生產環境
- [ ] 設定監控儀表板
- [ ] 建立備份機制

#### 2. 效能監控
- [ ] 監控執行時間
- [ ] 監控資源使用
- [ ] 建立效能報告

## 🔧 技術架構

### 核心組件

```
MPM 自動化系統
├── GitHub Actions (CI/CD Pipeline)
├── Python 腳本 (數據處理)
├── MPM 文件 (進度矩陣)
├── 可視化儀表板
└── 通知系統
```

### 數據流程

```
1. 文件更新 → GitHub Actions 觸發
2. 解析 PRD → 提取 FR-ID 和狀態
3. 檢查程式碼 → 驗證實現狀態
4. 執行測試 → 收集覆蓋率
5. 檢查 Issues → 統計錯誤
6. 更新 MPM → 生成新版本
7. 驗證一致性 → 確保完整性
8. 生成儀表板 → 可視化展示
```

## 📈 成功指標

### 自動化指標
- [ ] MPM 更新自動化率 ≥ 95%
- [ ] 一致性驗證準確率 ≥ 90%
- [ ] 測試覆蓋率 ≥ 90%
- [ ] 錯誤檢測率 ≥ 85%

### 效率指標
- [ ] 手動更新時間減少 ≥ 80%
- [ ] 錯誤發現時間縮短 ≥ 70%
- [ ] 決策支援響應時間 ≤ 5分鐘

### 品質指標
- [ ] 文件與程式碼一致性 ≥ 95%
- [ ] FR-ID 追蹤完整性 ≥ 98%
- [ ] 進度報告準確性 ≥ 90%

## 🚀 實施時間表

| 階段 | 時間 | 主要交付物 |
|------|------|------------|
| 階段一 | 已完成 | 基礎架構、核心腳本 |
| 階段二 | 1-2週 | 完整腳本套件 |
| 階段三 | 1週 | 整合測試、優化 |
| 階段四 | 1週 | 部署、監控 |

## 🔍 風險管理

### 技術風險
- **風險**: GitHub API 限制
- **緩解**: 實作請求限流和快取機制

- **風險**: 腳本執行失敗
- **緩解**: 建立錯誤處理和重試機制

### 業務風險
- **風險**: 團隊接受度
- **緩解**: 提供培訓和文檔

- **風險**: 數據準確性
- **緩解**: 建立人工驗證機制

## 📚 文檔與培訓

### 技術文檔
- [ ] 腳本使用說明
- [ ] API 文檔
- [ ] 故障排除指南

### 使用者培訓
- [ ] PM 使用指南
- [ ] 開發者工作流程
- [ ] 管理層儀表板使用

## 🎯 下一步行動

### 立即行動 (本週)
1. 完成剩餘腳本開發
2. 進行本地測試
3. 建立測試環境

### 短期目標 (2週內)
1. 完成所有腳本整合
2. 進行端到端測試
3. 準備部署

### 中期目標 (1個月內)
1. 生產環境部署
2. 團隊培訓
3. 效能優化

---

## 📞 聯絡資訊

如有任何問題或建議，請聯繫：
- **技術負責人**: [待指定]
- **專案經理**: [待指定]
- **GitHub Issues**: [專案 Issues 頁面]

---

*最後更新: {{ last_updated }}* 