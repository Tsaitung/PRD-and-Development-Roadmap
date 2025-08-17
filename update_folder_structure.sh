#!/bin/bash

# 菜蟲農食 ERP - 更新資料夾結構腳本
# 根據新的模組架構更新 PRD 資料夾結構

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 開始更新資料夾結構...${NC}"

# 進入 PRD 目錄
cd PRD

# 備份現有結構
echo -e "${YELLOW}📦 備份現有結構...${NC}"
if [ -d "backup_$(date +%Y%m%d)" ]; then
    rm -rf "backup_$(date +%Y%m%d)"
fi
cp -r . "backup_$(date +%Y%m%d)"

# 移除舊的資料夾結構（保留備份）
echo -e "${YELLOW}🗑️  清理舊結構...${NC}"
find . -maxdepth 1 -type d -name "[0-9][0-9]-*" -exec rm -rf {} \;

# 創建新的資料夾結構
echo -e "${GREEN}📁 創建新結構...${NC}"

# 1. DSH - Dashboard
mkdir -p "01-DSH-Dashboard/01.1-DSH-OV-Dashboard_Overview"
mkdir -p "01-DSH-Dashboard/01.2-DSH-NC-Notification_Center"

# 2. CRM - Customer Relationship Management
mkdir -p "02-CRM-Customer_Relationship_Management/02.1-CRM-CM-Customer_Master"
mkdir -p "02-CRM-Customer_Relationship_Management/02.2-CRM-CS-Customer_Segmentation"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine/02.3.1a-CRM-PM-DBPE-CBC-Cost_Benchmark_Classification"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine/02.3.1b-CRM-PM-DBPE-MPS-Market_Price_Setting"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine/02.3.1c-CRM-PM-DBPE-CIPM-Cost_Import_Parsing_Module"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine/02.3.1d-CRM-PM-DBPE-CBECC-Cost_Benchmark_Effective_Cost_Calculation"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine/02.3.1e-CRM-PM-DBPE-MQLM-Market_Quotation_Logic_Module"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.1-CRM-PM-DBPE-Dynamic_Base_Pricing_Engine/02.3.1f-CRM-PM-DBPE-BPOM-Base_Pricing_Output_Module_API"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.2-CRM-PM-CTAM-Customer_Tier_Adjustment_Management"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.3-CRM-PM-SRP-Seasonality_Risk_Premium"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.4-CRM-PM-CFRP-Credit_Financial_Risk_Premium"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.5-CRM-PM-SVR-Single_Volume_Rate"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.6-CRM-PM-ER-Exception_Review"
mkdir -p "02-CRM-Customer_Relationship_Management/02.3-CRM-PM-Pricing_Management/02.3.7-CRM-PM-RA-Reports_Analytics"
mkdir -p "02-CRM-Customer_Relationship_Management/02.4-CRM-CSCM-Customer_Service_Complaint_Management"
mkdir -p "02-CRM-Customer_Relationship_Management/02.5-CRM-CRA-Customer_Relationship_Analytics"
mkdir -p "02-CRM-Customer_Relationship_Management/02.6-CRM-CMR-Customer_Management_Review"
mkdir -p "02-CRM-Customer_Relationship_Management/02.7-CRM-TM-Ticket_Management"

# 3. BDM - Basic Data Maintenance (新)
mkdir -p "03-BDM-Basic_Data_Maintenance/03.1-BDM-UNIT-Unit_Dictionary"
mkdir -p "03-BDM-Basic_Data_Maintenance/03.2-BDM-ICAT-Item_Category_Dictionary"
mkdir -p "03-BDM-Basic_Data_Maintenance/03.3-BDM-UCONV-Unit_Conversion_Rules"
mkdir -p "03-BDM-Basic_Data_Maintenance/03.4-BDM-TEMPL-Label_Packaging_Template_Dictionary"

# 4. IM - Item Management
mkdir -p "04-IM-Item_Management/04.1-IM-IM-Item_Master"
mkdir -p "04-IM-Item_Management/04.2-IM-BCRS-BOM_Conversion_Relationship_Setting"
mkdir -p "04-IM-Item_Management/04.3-IM-UPS-Unit_Packaging_Specifications"
mkdir -p "04-IM-Item_Management/04.4-IM-IAC-Item_Analytics_Usage_Cycle"

# 5. OP - Operations Planning (新)
mkdir -p "05-OP-Operations_Planning/05.1-OP-MC-Market_Close_Management"
mkdir -p "05-OP-Operations_Planning/05.2-OP-CAL-Operations_Calendar"
mkdir -p "05-OP-Operations_Planning/05.3-OP-ODP-Order_Delivery_Planning"
mkdir -p "05-OP-Operations_Planning/05.4-OP-CAP-Capacity_Delivery_Availability_View"

# 6. OM - Order Management
mkdir -p "06-OM-Order_Management/06.1-OM-OL-Order_List"
mkdir -p "06-OM-Order_Management/06.2-OM-COSR-Create_Order_Sales_Return"
mkdir -p "06-OM-Order_Management/06.3-OM-OAPM-Order_Allocation_Production_Mapping"
mkdir -p "06-OM-Order_Management/06.4-OM-RRP-Return_RMA_Processing"
mkdir -p "06-OM-Order_Management/06.5-OM-OA-Order_Analytics"

# 7. MES - Manufacturing Execution System
mkdir -p "07-MES-Manufacturing_Execution_System/07.1-MES-WTM-Workstation_Task_Management"
mkdir -p "07-MES-Manufacturing_Execution_System/07.2-MES-PSWO-Production_Scheduling_Work_Orders"
mkdir -p "07-MES-Manufacturing_Execution_System/07.3-MES-MBU-Material_Batch_Usage"
mkdir -p "07-MES-Manufacturing_Execution_System/07.4-MES-PEMLD-Personnel_Efficiency_Material_Loss_Dashboard"
mkdir -p "07-MES-Manufacturing_Execution_System/07.5-MES-PMR-Progress_Monitoring_Reports"

# 8. WMS - Warehouse Management System
mkdir -p "08-WMS-Warehouse_Management_System/08.1-WMS-IOD-Inventory_Overview_Details"
mkdir -p "08-WMS-Warehouse_Management_System/08.2-WMS-RIS-Receiving_Inspection_Shipping"
mkdir -p "08-WMS-Warehouse_Management_System/08.3-WMS-BTM-Batch_Traceability_Management"
mkdir -p "08-WMS-Warehouse_Management_System/08.4-WMS-IAT-Inventory_Adjustment_Transfer"
mkdir -p "08-WMS-Warehouse_Management_System/08.5-WMS-RQIA-Remaining_Quantity_InTransit_Analysis"

# 9. PM - Purchasing Management
mkdir -p "09-PM-Purchasing_Management/09.1-PM-SRM-Supplier_Relationship_Management/09.1.1-PM-SRM-SMO-Supplier_Management_Overview"
mkdir -p "09-PM-Purchasing_Management/09.1-PM-SRM-Supplier_Relationship_Management/09.1.2-PM-SRM-SL-Supplier_List"
mkdir -p "09-PM-Purchasing_Management/09.1-PM-SRM-Supplier_Relationship_Management/09.1.3-PM-SRM-LMR-Loss_Management_Returns"
mkdir -p "09-PM-Purchasing_Management/09.1-PM-SRM-Supplier_Relationship_Management/09.1.4-PM-SRM-SA-Supplier_Accounting"
mkdir -p "09-PM-Purchasing_Management/09.1-PM-SRM-Supplier_Relationship_Management/09.1.5-PM-SRM-RS-Review_Scoring"
mkdir -p "09-PM-Purchasing_Management/09.2-PM-CPM-Contract_Pricing_Management"
mkdir -p "09-PM-Purchasing_Management/09.3-PM-PODM-Purchase_Order_Delivery_Management"
mkdir -p "09-PM-Purchasing_Management/09.4-PM-RIS-Receiving_Inspection_Status"
mkdir -p "09-PM-Purchasing_Management/09.5-PM-PAR-Purchasing_Analytics_Reports"

# 10. LM - Logistics Management
mkdir -p "10-LM-Logistics_Management/10.1-LM-DSRO-Delivery_Scheduling_Route_Optimization"
mkdir -p "10-LM-Logistics_Management/10.2-LM-DVM-Driver_Vehicle_Management"
mkdir -p "10-LM-Logistics_Management/10.3-LM-ESDR-Electronic_Signing_Delivery_Reporting"
mkdir -p "10-LM-Logistics_Management/10.4-LM-DTRV-Delivery_Tracking_RealTime_View"
mkdir -p "10-LM-Logistics_Management/10.5-LM-CM-Contract_Management"
mkdir -p "10-LM-Logistics_Management/10.6-LM-LCPA-Logistics_Cost_Performance_Analytics"

# 11. FA - Finance Accounting
mkdir -p "11-FA-Finance_Accounting/11.1-FA-AR-Accounts_Receivable"
mkdir -p "11-FA-Finance_Accounting/11.2-FA-AP-Accounts_Payable"
mkdir -p "11-FA-Finance_Accounting/11.3-FA-PMAR-Payment_Management_Account_Reconciliation"
mkdir -p "11-FA-Finance_Accounting/11.4-FA-IT-Invoice_Tax"
mkdir -p "11-FA-Finance_Accounting/11.5-FA-FR-Financial_Reports"
mkdir -p "11-FA-Finance_Accounting/11.6-FA-FS-Financial_Settlement/11.6.1-FA-FS-RU-Revenue_Update"
mkdir -p "11-FA-Finance_Accounting/11.6-FA-FS-Financial_Settlement/11.6.2-FA-FS-MS-Monthly_Statement"

# 12. BI - Analytics Business Intelligence
mkdir -p "12-BI-Analytics_Business_Intelligence/12.1-BI-DF-Demand_Forecasting"
mkdir -p "12-BI-Analytics_Business_Intelligence/12.2-BI-PIK-Production_Inventory_KPI"
mkdir -p "12-BI-Analytics_Business_Intelligence/12.3-BI-SCA-Sales_Customer_Analytics"
mkdir -p "12-BI-Analytics_Business_Intelligence/12.4-BI-FKPA-Financial_KPI_Profitability_Analysis"
mkdir -p "12-BI-Analytics_Business_Intelligence/12.5-BI-AIMM-AI_Model_Management"

# 13. SA - System Administration
mkdir -p "13-SA-System_Administration/13.1-SA-UPM-User_Permission_Management"
mkdir -p "13-SA-System_Administration/13.2-SA-SC-System_Configuration"
mkdir -p "13-SA-System_Administration/13.3-SA-NWS-Notification_Workflow_Settings"
mkdir -p "13-SA-System_Administration/13.4-SA-SLM-System_Logs_Monitoring"
mkdir -p "13-SA-System_Administration/13.5-SA-OBM-Organization_Branch_Management"

# 14. UP - User Profile
mkdir -p "14-UP-User_Profile"

# 恢復之前的 README 文件
echo -e "${GREEN}📄 恢復之前的 README 文件...${NC}"
if [ -f "backup_$(date +%Y%m%d)/01-DSH-Dashboard/01.1-DSH-OV-Dashboard_Overview/README.md" ]; then
    cp "backup_$(date +%Y%m%d)/01-DSH-Dashboard/01.1-DSH-OV-Dashboard_Overview/README.md" "01-DSH-Dashboard/01.1-DSH-OV-Dashboard_Overview/"
fi

# 創建 .gitkeep 文件
echo -e "${GREEN}📝 創建 .gitkeep 文件...${NC}"
find . -type d -empty -exec touch {}/.gitkeep \;

# 統計結果
echo -e "${GREEN}📊 更新完成！${NC}"
echo -e "${GREEN}總資料夾數: $(find . -type d | wc -l)${NC}"
echo -e "${GREEN}主要模組: 14個${NC}"
echo -e "${GREEN}子模組: 61個${NC}"

cd ..

echo -e "${GREEN}🎉 資料夾結構更新完成！${NC}"
