#!/bin/bash

# 創建 PRD 目錄下的完整模組結構
cd PRD

# 1. Dashboard
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

# 3. IM - Item Management
mkdir -p "03-IM-Item_Management/03.1-IM-IM-Item_Master"
mkdir -p "03-IM-Item_Management/03.2-IM-BCRS-BOM_Conversion_Relationship_Setting"
mkdir -p "03-IM-Item_Management/03.3-IM-UPS-Unit_Packaging_Specifications"
mkdir -p "03-IM-Item_Management/03.4-IM-IAC-Item_Analytics_Usage_Cycle"

# 4. OM - Order Management
mkdir -p "04-OM-Order_Management/04.1-OM-OL-Order_List"
mkdir -p "04-OM-Order_Management/04.2-OM-COSR-Create_Order_Sales_Return"
mkdir -p "04-OM-Order_Management/04.3-OM-OAPM-Order_Allocation_Production_Mapping"
mkdir -p "04-OM-Order_Management/04.4-OM-RRP-Return_RMA_Processing"
mkdir -p "04-OM-Order_Management/04.5-OM-OA-Order_Analytics"

# 5. MES - Manufacturing Execution System
mkdir -p "05-MES-Manufacturing_Execution_System/05.1-MES-WTM-Workstation_Task_Management"
mkdir -p "05-MES-Manufacturing_Execution_System/05.2-MES-PSWO-Production_Scheduling_Work_Orders"
mkdir -p "05-MES-Manufacturing_Execution_System/05.3-MES-MBU-Material_Batch_Usage"
mkdir -p "05-MES-Manufacturing_Execution_System/05.4-MES-PEMLD-Personnel_Efficiency_Material_Loss_Dashboard"
mkdir -p "05-MES-Manufacturing_Execution_System/05.5-MES-PMR-Progress_Monitoring_Reports"

# 6. WMS - Warehouse Management System
mkdir -p "06-WMS-Warehouse_Management_System/06.1-WMS-IOD-Inventory_Overview_Details"
mkdir -p "06-WMS-Warehouse_Management_System/06.2-WMS-RIS-Receiving_Inspection_Shipping"
mkdir -p "06-WMS-Warehouse_Management_System/06.3-WMS-BTM-Batch_Traceability_Management"
mkdir -p "06-WMS-Warehouse_Management_System/06.4-WMS-IAT-Inventory_Adjustment_Transfer"
mkdir -p "06-WMS-Warehouse_Management_System/06.5-WMS-RQIA-Remaining_Quantity_InTransit_Analysis"

# 7. PM - Purchasing Management
mkdir -p "07-PM-Purchasing_Management/07.1-PM-SRM-Supplier_Relationship_Management/07.1.1-PM-SRM-SMO-Supplier_Management_Overview"
mkdir -p "07-PM-Purchasing_Management/07.1-PM-SRM-Supplier_Relationship_Management/07.1.2-PM-SRM-SL-Supplier_List"
mkdir -p "07-PM-Purchasing_Management/07.1-PM-SRM-Supplier_Relationship_Management/07.1.3-PM-SRM-LMR-Loss_Management_Returns"
mkdir -p "07-PM-Purchasing_Management/07.1-PM-SRM-Supplier_Relationship_Management/07.1.4-PM-SRM-SA-Supplier_Accounting"
mkdir -p "07-PM-Purchasing_Management/07.1-PM-SRM-Supplier_Relationship_Management/07.1.5-PM-SRM-RS-Review_Scoring"
mkdir -p "07-PM-Purchasing_Management/07.2-PM-CPM-Contract_Pricing_Management"
mkdir -p "07-PM-Purchasing_Management/07.3-PM-PODM-Purchase_Order_Delivery_Management"
mkdir -p "07-PM-Purchasing_Management/07.4-PM-RIS-Receiving_Inspection_Status"
mkdir -p "07-PM-Purchasing_Management/07.5-PM-PAR-Purchasing_Analytics_Reports"

# 8. LM - Logistics Management
mkdir -p "08-LM-Logistics_Management/08.1-LM-DSRO-Delivery_Scheduling_Route_Optimization"
mkdir -p "08-LM-Logistics_Management/08.2-LM-DVM-Driver_Vehicle_Management"
mkdir -p "08-LM-Logistics_Management/08.3-LM-ESDR-Electronic_Signing_Delivery_Reporting"
mkdir -p "08-LM-Logistics_Management/08.4-LM-DTRV-Delivery_Tracking_RealTime_View"
mkdir -p "08-LM-Logistics_Management/08.5-LM-CM-Contract_Management"
mkdir -p "08-LM-Logistics_Management/08.6-LM-LCPA-Logistics_Cost_Performance_Analytics"

# 9. FA - Finance Accounting
mkdir -p "09-FA-Finance_Accounting/09.1-FA-AR-Accounts_Receivable"
mkdir -p "09-FA-Finance_Accounting/09.2-FA-AP-Accounts_Payable"
mkdir -p "09-FA-Finance_Accounting/09.3-FA-PMAR-Payment_Management_Account_Reconciliation"
mkdir -p "09-FA-Finance_Accounting/09.4-FA-IT-Invoice_Tax"
mkdir -p "09-FA-Finance_Accounting/09.5-FA-FR-Financial_Reports"

# 10. BI - Analytics Business Intelligence
mkdir -p "10-BI-Analytics_Business_Intelligence/10.1-BI-DF-Demand_Forecasting"
mkdir -p "10-BI-Analytics_Business_Intelligence/10.2-BI-PIK-Production_Inventory_KPI"
mkdir -p "10-BI-Analytics_Business_Intelligence/10.3-BI-SCA-Sales_Customer_Analytics"
mkdir -p "10-BI-Analytics_Business_Intelligence/10.4-BI-FKPA-Financial_KPI_Profitability_Analysis"
mkdir -p "10-BI-Analytics_Business_Intelligence/10.5-BI-AIMM-AI_Model_Management"

# 11. SA - System Administration
mkdir -p "11-SA-System_Administration/11.1-SA-UPM-User_Permission_Management"
mkdir -p "11-SA-System_Administration/11.2-SA-SC-System_Configuration"
mkdir -p "11-SA-System_Administration/11.3-SA-NWS-Notification_Workflow_Settings"
mkdir -p "11-SA-System_Administration/11.4-SA-SLM-System_Logs_Monitoring"
mkdir -p "11-SA-System_Administration/11.5-SA-OBM-Organization_Branch_Management"

# 12. UP - User Profile
mkdir -p "12-UP-User_Profile"

echo "所有模組資料夾結構已創建完成！"
