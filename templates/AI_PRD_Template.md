# 模組 PRD 模板（AI 適配版）

## Metadata（文件級）
- 模組代碼: [XX-YYY]（例：CRM-CM）
- 模組名稱: [完整名稱]
- 版本: v[X.X.X]
- 建立/更新: YYYY-MM-DD / YYYY-MM-DD
- 文件狀態: 🔴 未開始｜🟡 開發中｜✅ 完成｜⚪ 規劃中

## 1. 背景與目標
- 產業/系統型態/利害關係人/痛點摘要
- 成功指標（KPI）與量化目標

## 2. 功能性需求（依 FR 編號）

### FR-[XXX]-001: [功能名稱]
- 狀態: 🔴｜🟡｜✅｜⚪
- 優先級: P0｜P1｜P2｜P3
- 用戶故事: 身為[角色]，我想要[動作]，以便[價值]。
- 驗收標準（BDD）: Given… When… Then…
- UI/UX: Page/PATH, Component 規格, 狀態與互動, 無障礙（ARIA、鍵盤導覽）
- 資料驗證: 欄位/型別/約束/錯誤訊息
- Data I/O: Inputs/Outputs 與 JSON Schema 範例
- API 規格: `METHOD /api/v1/[endpoint]` 請求/回應/錯誤碼、認證方式
- 例外處理: 使用者訊息、技術訊息、復原措施
- Traceability:
  - Tests: `tests/unit/FR-XXX.test.py`, `tests/integration/FR-XXX.test.py`
  - Code: `src/<NN-AAA-Module_Name>/**`
  - TOC: `TOC Modules.md` 對應節點

> 依此結構擴充 FR-[XXX]-002、FR-[XXX]-003 …

## 3. 非功能性需求
- 效能/擴展性/可靠性（SLO/SLA/RTO/RPO）
- 安全（認證/授權/加密/合規）

## 4. 系統設計要素
- 資料模型（主要實體/關聯/審計欄位 created_at/updated_at/by）
- 模組切分與依賴關係
- 角色與權限（RBAC/ABAC）

## 5. 測試規格
- 單元/整合/E2E 目標與工具（例如 PyTest；契約測試）
- 測試資料產生策略與隱私（匿名化/遮罩）

## 6. 風險與里程碑
- 風險矩陣（影響/機率/緩解）
- 里程碑與交付物

## 備註（AI 協作）
- 本專案以 `CLAUDE.md` 作為唯一 AI 作業指引來源；請將 AI 指令（如自動生成 API/DB/測試）集中於 `CLAUDE.md`，避免干擾 PRD 解析。
