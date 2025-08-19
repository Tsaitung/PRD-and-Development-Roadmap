# 菜蟲農食 ERP 系統 - 子模組詳細追蹤表

## 概述
本文件詳細追蹤所有 14 個主模組下的 62 個子模組開發狀態。

## 狀態圖例
- ✅ 完成
- 🟡 開發中
- 🔴 未開始
- ⚪ 規劃中
- ⏸️ 待轉移
- 🔄 轉移中
- ❓ 未知（待釐清）

---

## 模組詳細狀態

### 1. [DSH] Dashboard - 2個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| DSH-OV | Dashboard Overview | 🟡 | ✅ | N/A | prd.md 已完成 |
| DSH-NC | Notification Center | 🔴 | ⚪ | N/A | 未開始 |

### 2. [CRM] Customer Relationship Management - 7個子模組（含13個子項）
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| CRM-CM | Customer Master | 🔴 | ⚪ | ⏸️ | 待轉移 |
| CRM-CS | Customer Segmentation | 🔴 | ⚪ | ⏸️ | 待轉移 |
| CRM-PM | Pricing Management | 🔴 | ⚪ | ⏸️ | 有13個子項 |
| CRM-CSCM | Customer Service & Complaint | 🔴 | ⚪ | ⏸️ | 待轉移 |
| CRM-CRA | Customer Relationship Analytics | 🔴 | ⚪ | ⏸️ | 待轉移 |
| CRM-CMR | Customer Management & Review | 🔴 | ⚪ | ⏸️ | 待轉移 |
| CRM-TM | Ticket Management | 🔴 | ⚪ | ⏸️ | /admin/ticket-management.tsx |

#### CRM-PM 子項詳細（13個）
| 子項編號 | 名稱 | 狀態 |
|---------|------|------|
| CRM-PM-DBPE | Dynamic Base Pricing Engine | 🔴 |
| CRM-PM-DBPE-CBC | Cost Benchmark Classification | 🔴 |
| CRM-PM-DBPE-MPS | Market Price Setting | 🔴 |
| CRM-PM-DBPE-CIPM | Cost Import & Parsing Module | 🔴 |
| CRM-PM-DBPE-CBECC | Cost Benchmark & Effective Cost | 🔴 |
| CRM-PM-DBPE-MQLM | Market & Quotation Logic | 🔴 |
| CRM-PM-DBPE-BPOM | Base Pricing Output Module | 🔴 |
| CRM-PM-CTAM | Customer Tier Adjustment | 🔴 |
| CRM-PM-SRP | Seasonality & Risk Premium | 🔴 |
| CRM-PM-CFRP | Credit & Financial Risk Premium | 🔴 |
| CRM-PM-SVR | Single Volume Rate | 🔴 |
| CRM-PM-ER | Exception Review | 🔴 |
| CRM-PM-RA | Reports & Analytics | 🔴 |

### 3. [BDM] Basic Data Maintenance - 4個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| BDM-UNIT | Unit Dictionary | 🟡 | ✅ | N/A | README.md, unit.tsx 已整合 |
| BDM-ICAT | Item Category Dictionary | 🔴 | ⚪ | N/A | 未開始 |
| BDM-UCONV | Unit Conversion Rules | 🔴 | ⚪ | N/A | 未開始 |
| BDM-TEMPL | Label/Packaging Template | 🔴 | ⚪ | N/A | 未開始 |

### 4. [IM] Item Management - 4個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| IM-IM | Item Master | 🔴 | ⚪ | ⏸️ | 待轉移 |
| IM-BCRS | BOM / Conversion Setting | 🔴 | ⚪ | ⏸️ | 待轉移 |
| IM-UPS | Unit & Packaging Specs | 🔴 | ⚪ | ⏸️ | 待轉移 |
| IM-IAC | Item Analytics / Usage Cycle | 🔴 | ⚪ | ⏸️ | 待轉移 |

### 5. [OP] Operations Planning - 4個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| OP-MC | Market Close Management | 🟡 | ✅ | N/A | README.md, market-close.tsx |
| OP-CAL | Operations Calendar | 🔴 | ⚪ | N/A | 未開始 |
| OP-ODP | Order/Delivery Planning | 🔴 | ⚪ | N/A | 未開始 |
| OP-CAP | Capacity/Delivery View | 🔴 | ⚪ | N/A | 未開始 |

### 6. [OM] Order Management - 5個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| OM-OL | Order List | 🔴 | ⚪ | ⏸️ | 待轉移 |
| OM-COSR | Create Order / Sales Return | 🔴 | ⚪ | ⏸️ | 待轉移 |
| OM-OAPM | Order Allocation / Production | 🔴 | ⚪ | ⏸️ | 待轉移 |
| OM-RRP | Return / RMA Processing | 🔴 | ⚪ | ⏸️ | 待轉移 |
| OM-OA | Order Analytics | 🔴 | ⚪ | ⏸️ | 待轉移 |

### 7. [MES] Manufacturing Execution System - 5個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| MES-WTM | Workstation / Task Management | 🔴 | ⚪ | ⏸️ | 待轉移 |
| MES-PSWO | Production Scheduling & Work Orders | 🔴 | ⚪ | ⏸️ | 待轉移 |
| MES-MBU | Material & Batch Usage | 🔴 | ⚪ | ⏸️ | 待轉移 |
| MES-PEMLD | Personnel Efficiency Dashboard | 🔴 | ⚪ | ⏸️ | 待轉移 |
| MES-PMR | Progress Monitoring & Reports | 🔴 | ⚪ | ⏸️ | 待轉移 |

### 8. [WMS] Warehouse Management System - 5個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| WMS-IOD | Inventory Overview / Details | 🔴 | ⚪ | ⏸️ | 待轉移 |
| WMS-RIS | Receiving & Inspection / Shipping | 🔴 | ⚪ | ⏸️ | 待轉移 |
| WMS-BTM | Batch & Traceability Management | 🔴 | ⚪ | ⏸️ | 待轉移 |
| WMS-IAT | Inventory Adjustment / Transfer | 🔴 | ⚪ | ⏸️ | 待轉移 |
| WMS-RQIA | Remaining Quantity Analysis | 🔴 | ⚪ | ⏸️ | 待轉移 |

### 9. [PM] Purchasing Management - 5個子模組（SRM含5個子項）
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| PM-SRM | Supplier Relationship Management | 🔴 | ⚪ | ⏸️ | 有5個子項 |
| PM-CPM | Contract & Pricing Management | 🔴 | ⚪ | ⏸️ | 待轉移 |
| PM-PODM | PO & Delivery Management | 🔴 | ⚪ | ⏸️ | 待轉移 |
| PM-RIS | Receiving & Inspection Status | 🔴 | ⚪ | ⏸️ | 待轉移 |
| PM-PAR | Purchasing Analytics & Reports | 🔴 | ⚪ | ⏸️ | 待轉移 |

#### PM-SRM 子項詳細（5個）
| 子項編號 | 名稱 | 狀態 |
|---------|------|------|
| PM-SRM-SMO | Supplier Management Overview | 🔴 |
| PM-SRM-SL | Supplier List | 🔴 |
| PM-SRM-LMR | Loss Management & Returns | 🔴 |
| PM-SRM-SA | Supplier Accounting | 🔴 |
| PM-SRM-RS | Review & Scoring | 🔴 |

### 10. [LM] Logistics Management - 6個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| LM-DSRO | Delivery Scheduling & Route | 🔴 | ⚪ | ⏸️ | 待轉移 |
| LM-DVM | Driver & Vehicle Management | 🔴 | ⚪ | ⏸️ | 待轉移 |
| LM-ESDR | Electronic Signing & Reporting | 🔴 | ⚪ | ⏸️ | 待轉移 |
| LM-DTRV | Delivery Tracking & Real-time | 🔴 | ⚪ | ⏸️ | 待轉移 |
| LM-CM | Contract Management | 🔴 | ⚪ | ⏸️ | 待轉移 |
| LM-LCPA | Logistics Cost & Performance | 🔴 | ⚪ | ⏸️ | 待轉移 |

### 11. [FA] Finance & Accounting - 6個子模組（FS含2個子項）
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| FA-AR | Accounts Receivable | 🔴 | ⚪ | ⏸️ | 待轉移 |
| FA-AP | Accounts Payable | 🔴 | ⚪ | ⏸️ | 待轉移 |
| FA-PMAR | Payment & Account Reconciliation | 🔴 | ⚪ | ⏸️ | 待轉移 |
| FA-IT | Invoice & Tax | 🔴 | ⚪ | ⏸️ | 待轉移 |
| FA-FR | Financial Reports | 🔴 | ⚪ | ⏸️ | 待轉移 |
| FA-FS | Financial Settlement | 🔴 | ⚪ | ⏸️ | 有2個子項 |

#### FA-FS 子項詳細（2個）
| 子項編號 | 名稱 | 狀態 | 備註 |
|---------|------|------|------|
| FA-FS-RU | Revenue Update | 🔴 | /admin/revenue.tsx |
| FA-FS-MS | Monthly Statement | 🔴 | /admin/monthly-statement.tsx |

### 12. [BI] Business Intelligence - 5個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| BI-DF | Demand Forecasting | 🔴 | ⚪ | N/A | 未開始 |
| BI-PIK | Production & Inventory KPI | 🔴 | ⚪ | N/A | 未開始 |
| BI-SCA | Sales & Customer Analytics | 🔴 | ⚪ | N/A | 未開始 |
| BI-FKPA | Financial KPI & Profitability | 🔴 | ⚪ | N/A | 未開始 |
| BI-AIMM | AI Model Management | 🔴 | ⚪ | N/A | 未開始 |

### 13. [SA] System Administration - 5個子模組
| 子模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|--------|------|------|-----|--------|------|
| SA-UPM | User & Permission Management | 🔴 | ⚪ | 🔄 | 部分轉移中 |
| SA-SC | System Configuration | 🔴 | ⚪ | ⏸️ | 待轉移 |
| SA-NWS | Notification / Workflow Settings | 🔴 | ⚪ | ⏸️ | 待轉移 |
| SA-SLM | System Logs & Monitoring | 🔴 | ⚪ | ⏸️ | 待轉移 |
| SA-OBM | Organization & Branch Management | 🟡 | ✅ | 🔄 | prd.md v1.1.0 |

### 14. [UP] User Profile - 單一模組
| 模組 | 名稱 | 狀態 | PRD | 舊系統 | 備註 |
|------|------|------|-----|--------|------|
| UP | User Profile | 🔴 | ⚪ | ⏸️ | 單一模組，無子模組 |

---

## 統計摘要

### 整體進度
- **總子模組數**: 62個（不含子項）
- **開發中**: 3個 (4.8%)
  - DSH-OV, BDM-UNIT, OP-MC, SA-OBM
- **未開始**: 59個 (95.2%)
- **完成**: 0個 (0%)

### 舊系統轉移狀態
- **無舊系統** (N/A): 11個子模組
- **待轉移** (⏸️): 48個子模組  
- **轉移中** (🔄): 2個子模組
- **已轉移**: 0個子模組

### PRD 狀態
- **已完成** (✅): 4個
  - DSH-OV, BDM-UNIT, OP-MC, SA-OBM
- **規劃中** (⚪): 58個
- **開發中** (🟡): 0個

### 需優先處理項目
1. **CRM-PM**: 有13個子項，影響範圍大
2. **舊系統轉移**: 48個子模組待轉移
3. **PRD撰寫**: 58個子模組需要PRD

---

**文件狀態**: 生效中
**最後更新**: 2025-08-19
**下次審查**: 2025-09-01