# 統一追蹤平台 (Unified Tracking Platform)

## 概述

統一追蹤平台整合了原有的三個系統（TRACKING_GUIDE、Dashboard、Progress Report）為一個統一的單頁應用程式，提供更好的使用體驗和資料一致性。

## 功能特點

### 1. 統一資料管理
- 集中式資料載入和快取
- 實時資料同步
- 避免重複載入，提升效能

### 2. 五大功能模組

#### 總覽 (Overview)
- 專案整體狀態儀表板
- 關鍵指標展示
- 快速操作入口
- 九維度狀態概覽

#### 即時監控 (Dashboard)
- 模組進度即時追蹤
- 搜尋和篩選功能
- 詳細狀態展示
- 模組詳情查看

#### 進度分析 (Analytics)
- 模組狀態熱力圖
- 進度比較圖表
- 維度完成率雷達圖
- 互動式資料視覺化

#### 風險管理 (Risk)
- 風險矩陣分析
- 風險等級評估
- 行動項目建議
- 風險報告匯出

#### 工具箱 (Tools)
- 資料管理工具
- 自動化同步腳本
- 測試與驗證工具
- 快速連結和使用指南

## 使用方式

### 線上訪問
```
https://[your-username].github.io/[repo-name]/tracking-platform/
```

### 本地運行
```bash
cd docs/tracking-platform
python -m http.server 8000
# 開啟瀏覽器訪問 http://localhost:8000
```

## 技術架構

### 前端技術
- 原生 JavaScript ES6 模組
- Tailwind CSS 樣式框架
- Chart.js 資料視覺化
- 單頁應用程式架構

### 資料來源
- 主要資料：`TOC Modules.md`
- 自動同步：GitHub Actions
- 狀態檢測：Python 腳本

## 快捷鍵

- `Alt + 1-5`：切換不同功能頁籤
- `Ctrl/Cmd + S`：同步資料
- `Ctrl/Cmd + E`：匯出報表

## 目錄結構

```
tracking-platform/
├── index.html          # 主頁面
├── css/
│   └── main.css       # 自定義樣式
├── js/
│   ├── core/          # 核心模組
│   │   ├── app.js     # 主應用程式
│   │   ├── data-manager.js  # 資料管理
│   │   └── utils.js   # 工具函數
│   └── views/         # 視圖組件
│       ├── overview.js
│       ├── dashboard.js
│       ├── analytics.js
│       ├── risk.js
│       └── tools.js
└── README.md          # 本文件
```

## 更新和維護

1. **資料更新**：編輯 `TOC Modules.md` 檔案
2. **自動同步**：推送到 GitHub 後自動觸發
3. **手動重整**：點擊同步按鈕或使用快捷鍵

## 相關文件

- [TRACKING_GUIDE.md](../../TRACKING_GUIDE.md) - 完整追蹤系統使用指南
- [TOC Modules.md](../../TOC%20Modules.md) - 模組進度主文件
- [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) - 實施計劃

## 支援

如有問題或建議，請開立 GitHub Issue。