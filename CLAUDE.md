# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the 菜蟲農食 ERP System - a comprehensive Enterprise Resource Planning system for agricultural business management with 14 main modules organized using a Module Progress Matrix (MPM) system.

## Key Commands

### Sync with GitHub
```bash
./quick_sync.sh                    # Quick sync for small changes
./sync_with_github.sh             # Full sync with conflict resolution
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

### Dashboard System

The dashboard at `/docs/dashboard/` provides real-time visualization of project progress:
- Reads data from `TOC Modules.md`
- Updates automatically via GitHub Actions
- Uses Chart.js for visualizations
- Accessible via GitHub Pages

### Development Patterns

1. **FR-ID System**: Each feature has a unique identifier (FR-XXX format)
2. **Status Tracking**: Uses emoji-based status indicators:
   - ✅ 完成 (Complete)
   - 🟡 開發中 (In Development)
   - 🔴 未開始 (Not Started)
   - ⚪ 規劃中 (Planning)
3. **PRD Structure**: Each module has its own PRD folder under `/PRD/`
4. **Module Naming**: Follow strict abbreviation conventions (e.g., CRM-CM for Customer Management)

### GitHub Actions Integration

The project heavily relies on GitHub Actions for automation:
- Triggers on push to main/develop branches
- Daily runs at 2 AM for progress updates
- Updates MPM, validates consistency, and generates dashboard
- All scripts are in `.github/scripts/`

When modifying automation scripts, ensure compatibility with the workflow defined in `.github/workflows/mpm-automation.yml`.