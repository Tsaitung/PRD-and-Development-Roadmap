# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the 菜蟲農食 ERP System - a comprehensive Enterprise Resource Planning system for agricultural business management with 14 main modules organized using a Module Progress Matrix (MPM) system.

## Key Commands

### Sync with GitHub
```bash
./enhanced_auto_sync.sh           # Enhanced auto sync with MPM updates
./enhanced_auto_sync.sh --watch   # Watch mode for continuous sync
```

### Update Progress Tracking
```bash
python .github/scripts/update_mpm.py      # Update Module Progress Matrix
python .github/scripts/generate_dashboard.py  # Generate dashboard visualization
```

### Validation & Testing
```bash
python .github/scripts/validate_consistency.py  # Validate FR-ID consistency across PRDs
python .github/scripts/run_tests.py            # Run test suite
python .github/scripts/check_code_status.py    # Check code implementation status
```

## Architecture & Module Structure

The system uses a modular architecture with 14 main modules identified by abbreviations:

- **[DSH]** Dashboard - System notifications and overview
- **[CRM]** Customer Relationship Management - Split into CM (Customer Management) and PC (Price Configuration)
- **[BDM]** Basic Data Maintenance - Master data for vendors, items, customers
- **[IM]** Item Management - Product catalog and configurations
- **[OP]** Operations Planning - Business planning and scheduling
- **[OM]** Order Management - Order processing and returns
- **[MES]** Manufacturing Execution System - Production management
- **[WMS]** Warehouse Management System - Inventory control
- **[PM]** Purchasing Management - Procurement processes
- **[LM]** Logistics Management - Delivery and transportation
- **[FA]** Finance & Accounting - Financial management
- **[BI]** Business Intelligence - Analytics and reporting
- **[SA]** System Administration - System configuration
- **[UP]** User Profile - User management

### Key Files to Understand

1. **TOC Modules.md** - Central tracking document containing the Module Progress Matrix with all modules, submodules, and their implementation status
2. **IMPLEMENTATION_PLAN.md** - Development roadmap and architectural decisions
3. **.github/workflows/mpm-automation.yml** - Main automation pipeline that orchestrates all progress tracking
4. **README.md** - Main project overview with current status
5. **CLAUDE.md** - This file, the single source of truth for AI instructions

### Repository Structure (After 2025-08-25 Cleanup)

All historical documents have been archived to `/docs/history/`:
- `archived_modules/` - Contains incorrect module versions (05-OP-Operational, 12-BI-Business_Intelligence)
- `archived_prd_versions/` - Contains old PRD versions (migration-prd.md, prd_v1.md files)
- `progress_reports/` - Contains all weekly summaries and progress reports
- `backup_20250817/` - Old backup directory

**Current clean structure:**
- One module per number (no duplicates)
- Single PRD file per module (consolidated from v2 versions)
- Main tracking in TOC Modules.md
- Context in README.md and CLAUDE.md only

### Dashboard System

The dashboard at `/docs/dashboard/` provides real-time visualization of project progress:
- Reads data from `TOC Modules.md`
- Updates automatically via GitHub Actions
- Uses Chart.js for visualizations
- Accessible via GitHub Pages

### Development Patterns

1. **FR-ID System**: Each feature has a unique identifier following the format:
   - Format: `FR-[主模組]-[子模組]-[序號]`
   - Example: `FR-DSH-OV-001` (Dashboard Overview Feature 001)
   - Multi-level: `FR-CRM-PM-DBPE-001` (for deep sub-modules)
2. **Status Tracking**: Uses emoji-based status indicators:
   - ✅ 完成 (Complete)
   - 🟡 開發中 (In Development)
   - 🔴 未開始 (Not Started)
   - ⚪ 規劃中 (Planning)
3. **PRD Structure**: 
   - Each module has its own PRD folder under `/PRD/`
   - Main modules use `README.md`, sub-modules use `prd.md`
   - Follow naming: `[數字]-[模組縮寫]-[名稱]/`
   - Use `/PRD/module_prd_template.md` as the unified template for all PRDs
4. **Module Naming**: Follow strict abbreviation conventions (e.g., CRM-CM for Customer Management)
5. **PRD Writing Standards**: 
   - Complete standards available in README.md "PRD 撰寫標準與驗證規則" section
   - All PRDs must include 7 required sub-fields for each FR
   - Use structured YAML format for acceptance criteria
   - Priority levels: P0 (highest), P1, P2, P3

### Module Status Rules

**IMPORTANT**: Module development status follows strict rules defined in `/docs/tracking-rules.md`:

1. **未開始 (Not Started) - 🔴**: Modules WITHOUT a PRD file (prd.md or README.md) OR only have old system running
2. **開發中 (In Development) - 🟡**: Modules WITH valid PRD files AND active development  
3. **規劃中 (Planning) - ⚪**: Modules with PRD folder but no content or insufficient content
4. **Only modules with actual PRD files can be marked as "In Development"**
5. **Current modules with valid PRD**: 
   - DSH-OV (prd.md)
   - BDM-UNIT (README.md)
   - OP-MC (README.md)
   - SA-OBM (prd.md)

### GitHub Actions Integration

The project heavily relies on GitHub Actions for automation:
- Triggers on push to main/develop branches
- Daily runs at 2 AM for progress updates
- Updates MPM, validates consistency, and generates dashboard
- All scripts are in `.github/scripts/`

When modifying automation scripts, ensure compatibility with the workflow defined in `.github/workflows/mpm-automation.yml`.

## AI 指令集中依循原則

- 唯一來源: 本專案僅以本檔 `CLAUDE.md` 作為 AI 作業與指令的單一事實來源。請勿在 PRD、README、Issue、或其他文件內嵌入操作性 AI 指令。
- PRD 編修: PRD 僅承載需求與規格。每則功能請使用 `FR-[主模組]-[子模組]-[序號]` 標題與狀態表記（🔴｜🟡｜✅｜⚪），並於 FR 區塊加入 Traceability（tests/code/TOC）。
- 命名與狀態規範: 目錄 `PRD/[數字]-[模組縮寫]-[模組名稱]/`；FR 標題 `FR-[主模組]-[子模組]-[序號]: 功能名稱`；狀態採用 emoji 集（🔴 未開始｜🟡 開發中｜✅ 完成｜⚪ 規劃中）。
- 本地驗證: 變更提交前請先執行 `pytest -q` 驗證測試；若有 UI/追蹤平台異動，可於本地 `cd docs/tracking-platform && python -m http.server 8000` 檢視。
- 同步與部署: 使用 `./enhanced_auto_sync.sh` 自動更新 MPM 與推送；如需持續監控可用 `./enhanced_auto_sync.sh --watch`。CI 會在 `main/develop` 推送或排程時更新並部署 Pages。
- 提交與 PR: Commit 採描述式訊息並附 FR-ID（例：`feat(CRM): 新增客戶搜尋 FR-CRM-012`）。PR 請描述目的/範圍、連結 Issue/FR-ID；如影響 `docs/`，請附截圖。

### 建議的 AI 指令格式（示例）

```text
任務: 更新 PRD/02-CRM-Customer_Relationship_Management/README.md，新增 FR-CRM-PM-015（狀態 🟡）。
背景: 依據業務提出之價格查詢需求，需補 API 與驗收標準。
限制: 遵循 FR 模板與命名（FR-[主模組]-[子模組]-[序號]）；補 Traceability；不得修改其他模組。
步驟:
1) 於 FR 區塊加入 API 規格/驗收標準/Data I/O/例外處理
2) 以 `pytest -q` 驗證
3) 執行 `./enhanced_auto_sync.sh` 並推送
輸出: 變更檔案清單與差異摘要
```
