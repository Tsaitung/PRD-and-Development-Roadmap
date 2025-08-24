# 🗄️ 菜蟲農食 ERP 資料庫架構設計

**版本**: v1.0.0  
**更新日期**: 2025-08-22  
**資料庫**: PostgreSQL 15+

## 📊 架構總覽

### 資料庫設計原則
1. **正規化**: 遵循第三正規化(3NF)，減少資料冗餘
2. **擴展性**: 使用 UUID 作為主鍵，支援分散式架構
3. **審計追蹤**: 所有主要表格包含 created_at, updated_at, created_by
4. **軟刪除**: 使用 is_deleted 標記而非實際刪除
5. **多租戶**: 預留 tenant_id 支援未來多租戶需求

### 命名規範
- **表名**: 小寫複數形式，使用底線分隔 (例: purchase_orders)
- **欄位名**: 小寫，使用底線分隔 (例: item_code)
- **索引名**: idx_表名_欄位名 (例: idx_items_category_id)
- **外鍵名**: fk_表名_參考表名 (例: fk_items_categories)

## 🏗️ 核心模組架構

### 1. 系統管理 (System Administration)

```sql
-- 租戶表 (多租戶架構預留)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code VARCHAR(20) UNIQUE NOT NULL,
    tenant_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 用戶表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(id),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_role (role_id)
);

-- 角色表
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(30) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 權限表
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(200) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 角色權限關聯表
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 部門/組織表
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dept_code VARCHAR(20) UNIQUE NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES users(id),
    level INTEGER NOT NULL DEFAULT 1,
    path VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_departments_parent (parent_id),
    INDEX idx_departments_path (path)
);
```

### 2. 基礎資料 (Basic Data Maintenance)

```sql
-- 計量單位表
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_code VARCHAR(20) UNIQUE NOT NULL,
    unit_name VARCHAR(50) NOT NULL,
    unit_type VARCHAR(20) NOT NULL, -- weight, volume, piece, etc
    base_unit VARCHAR(20),
    conversion_rate DECIMAL(15,6),
    is_exact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 品項分類表
CREATE TABLE item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(30) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES item_categories(id),
    level INTEGER NOT NULL DEFAULT 1,
    path VARCHAR(500) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_item_categories_parent (parent_id),
    INDEX idx_item_categories_path (path)
);
```

### 3. 品項管理 (Item Management)

```sql
-- 品項主檔
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_name_en VARCHAR(200),
    specification VARCHAR(500),
    category_id UUID REFERENCES item_categories(id),
    base_unit_id UUID REFERENCES units(id),
    packaging_unit_id UUID REFERENCES units(id),
    conversion_rate DECIMAL(10,4),
    barcode VARCHAR(50),
    is_purchasable BOOLEAN DEFAULT TRUE,
    is_saleable BOOLEAN DEFAULT TRUE,
    shelf_life_days INTEGER,
    min_stock_qty DECIMAL(15,3),
    max_stock_qty DECIMAL(15,3),
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_items_code (item_code),
    INDEX idx_items_category (category_id),
    INDEX idx_items_barcode (barcode),
    INDEX idx_items_status (status)
);

-- 品項屬性
CREATE TABLE item_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    attribute_key VARCHAR(50) NOT NULL,
    attribute_value TEXT,
    data_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(item_id, attribute_key),
    INDEX idx_item_attributes_item (item_id)
);

-- 品項成本
CREATE TABLE item_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id),
    cost_type VARCHAR(20) NOT NULL, -- standard, average, fifo, lifo
    amount DECIMAL(15,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TWD',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(item_id, cost_type, effective_date),
    INDEX idx_item_costs_item (item_id),
    INDEX idx_item_costs_effective (effective_date)
);
```

### 4. 客戶管理 (Customer Relationship Management)

```sql
-- 客戶管理 (Customer Management)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(30) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_name_en VARCHAR(200),
    tax_id VARCHAR(20),
    customer_type VARCHAR(20), -- retail, wholesale, vip
    tier_level INTEGER DEFAULT 1,
    credit_limit DECIMAL(15,2),
    payment_terms VARCHAR(20) DEFAULT 'NET30',
    billing_address TEXT,
    shipping_address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_customers_code (customer_code),
    INDEX idx_customers_tax_id (tax_id),
    INDEX idx_customers_type (customer_type),
    INDEX idx_customers_status (status)
);

-- 客戶信用記錄
CREATE TABLE customer_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    credit_limit DECIMAL(15,2) NOT NULL,
    used_credit DECIMAL(15,2) DEFAULT 0,
    available_credit DECIMAL(15,2),
    temp_limit DECIMAL(15,2),
    temp_limit_expiry DATE,
    risk_score DECIMAL(5,2),
    last_review_date DATE,
    next_review_date DATE,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_customer_credits_customer (customer_id),
    INDEX idx_customer_credits_review (next_review_date)
);
```

### 5. 供應商管理 (Supplier Management)

```sql
-- 供應商主檔
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(30) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_name_en VARCHAR(200),
    tax_id VARCHAR(20),
    supplier_type VARCHAR(20), -- manufacturer, distributor, farmer
    rating DECIMAL(3,2) DEFAULT 0,
    payment_terms VARCHAR(20) DEFAULT 'NET30',
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(200),
    bank_account VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_suppliers_code (supplier_code),
    INDEX idx_suppliers_tax_id (tax_id),
    INDEX idx_suppliers_status (status),
    INDEX idx_suppliers_rating (rating DESC)
);

-- 供應商品項關聯
CREATE TABLE supplier_items (
    supplier_id UUID REFERENCES suppliers(id),
    item_id UUID REFERENCES items(id),
    supplier_item_code VARCHAR(50),
    lead_time_days INTEGER,
    min_order_qty DECIMAL(15,3),
    unit_price DECIMAL(15,4),
    currency VARCHAR(3) DEFAULT 'TWD',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (supplier_id, item_id),
    INDEX idx_supplier_items_item (item_id)
);
```

### 6. 訂單管理 (Order Management)

```sql
-- 銷售訂單主檔
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    sales_rep_id UUID REFERENCES users(id),
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    delivery_status VARCHAR(20) DEFAULT 'pending',
    delivery_address TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_sales_orders_no (order_no),
    INDEX idx_sales_orders_customer (customer_id),
    INDEX idx_sales_orders_date (order_date),
    INDEX idx_sales_orders_status (status)
);

-- 銷售訂單明細
CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id),
    unit_price DECIMAL(15,4) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 5,
    subtotal DECIMAL(15,2) NOT NULL,
    notes TEXT,
    
    INDEX idx_sales_order_items_order (order_id),
    INDEX idx_sales_order_items_item (item_id)
);
```

### 7. 庫存管理 (Warehouse Management)

```sql
-- 倉庫主檔
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_code VARCHAR(20) UNIQUE NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_type VARCHAR(20), -- main, transit, cold
    address TEXT,
    manager_id UUID REFERENCES users(id),
    capacity_m3 DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 庫存快照表
CREATE TABLE inventory_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    available_qty DECIMAL(15,3) NOT NULL,
    reserved_qty DECIMAL(15,3) DEFAULT 0,
    in_transit_qty DECIMAL(15,3) DEFAULT 0,
    unit_cost DECIMAL(15,4),
    total_value DECIMAL(15,2),
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(warehouse_id, item_id),
    INDEX idx_inventory_warehouse (warehouse_id),
    INDEX idx_inventory_item (item_id),
    INDEX idx_inventory_quantity (quantity)
);

-- 批號管理
CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_no VARCHAR(50) UNIQUE NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    quantity DECIMAL(15,3) NOT NULL,
    production_date DATE,
    expiry_date DATE,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_batch_no VARCHAR(50),
    quality_grade VARCHAR(10),
    location VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_batches_no (batch_no),
    INDEX idx_batches_item (item_id),
    INDEX idx_batches_expiry (expiry_date),
    INDEX idx_batches_status (status)
);

-- 庫存異動記錄
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_no VARCHAR(30) UNIQUE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL, -- in, out, transfer, adjust
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    item_id UUID NOT NULL REFERENCES items(id),
    batch_id UUID REFERENCES inventory_batches(id),
    quantity DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(15,4),
    reference_type VARCHAR(30), -- purchase_order, sales_order, transfer, etc
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_inv_trans_no (transaction_no),
    INDEX idx_inv_trans_type (transaction_type),
    INDEX idx_inv_trans_warehouse (warehouse_id),
    INDEX idx_inv_trans_item (item_id),
    INDEX idx_inv_trans_date (created_at)
);
```

### 8. 生產管理 (Manufacturing Execution)

```sql
-- 工作站主檔
CREATE TABLE workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code VARCHAR(20) UNIQUE NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    station_type VARCHAR(30), -- packaging, sorting, processing, washing
    location VARCHAR(100),
    hourly_capacity DECIMAL(10,2),
    max_operators INTEGER,
    min_operators INTEGER,
    required_skills JSONB,
    equipment_list JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_workstations_code (station_code),
    INDEX idx_workstations_type (station_type),
    INDEX idx_workstations_status (status)
);

-- 生產工單
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_no VARCHAR(30) UNIQUE NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    planned_quantity DECIMAL(15,3) NOT NULL,
    completed_quantity DECIMAL(15,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id),
    planned_start TIMESTAMP NOT NULL,
    planned_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_work_orders_no (work_order_no),
    INDEX idx_work_orders_item (item_id),
    INDEX idx_work_orders_status (status),
    INDEX idx_work_orders_priority (priority DESC)
);

-- 生產任務
CREATE TABLE production_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_no VARCHAR(30) UNIQUE NOT NULL,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    workstation_id UUID NOT NULL REFERENCES workstations(id),
    planned_quantity DECIMAL(15,3) NOT NULL,
    completed_quantity DECIMAL(15,3) DEFAULT 0,
    planned_start TIMESTAMP NOT NULL,
    planned_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    assigned_operators JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_tasks_no (task_no),
    INDEX idx_tasks_work_order (work_order_id),
    INDEX idx_tasks_workstation (workstation_id),
    INDEX idx_tasks_status (status)
);
```

### 9. 採購管理 (Purchasing Management)

```sql
-- 採購單主檔
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no VARCHAR(30) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_date DATE,
    buyer_id UUID REFERENCES users(id),
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    receiving_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_purchase_orders_no (po_no),
    INDEX idx_purchase_orders_supplier (supplier_id),
    INDEX idx_purchase_orders_date (order_date),
    INDEX idx_purchase_orders_status (status)
);

-- 採購單明細
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    received_quantity DECIMAL(15,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id),
    unit_price DECIMAL(15,4) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 5,
    subtotal DECIMAL(15,2) NOT NULL,
    notes TEXT,
    
    INDEX idx_po_items_po (po_id),
    INDEX idx_po_items_item (item_id)
);
```

### 10. 財務會計 (Finance & Accounting)

```sql
-- 應收帳款
CREATE TABLE accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_id UUID REFERENCES sales_orders(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    overdue_days INTEGER DEFAULT 0,
    collection_status VARCHAR(20),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_ar_invoice_no (invoice_no),
    INDEX idx_ar_customer (customer_id),
    INDEX idx_ar_due_date (due_date),
    INDEX idx_ar_status (status)
);

-- 應付帳款
CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(30) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    po_id UUID REFERENCES purchase_orders(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    payment_method VARCHAR(30),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_ap_invoice_no (invoice_no),
    INDEX idx_ap_supplier (supplier_id),
    INDEX idx_ap_due_date (due_date),
    INDEX idx_ap_status (status)
);

-- 收付款記錄
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_no VARCHAR(30) UNIQUE NOT NULL,
    payment_type VARCHAR(20) NOT NULL, -- receipt, payment
    reference_type VARCHAR(30), -- ar, ap
    reference_id UUID,
    party_type VARCHAR(20), -- customer, supplier
    party_id UUID,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(30),
    bank_account VARCHAR(50),
    check_no VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    cleared_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_payments_no (payment_no),
    INDEX idx_payments_type (payment_type),
    INDEX idx_payments_date (payment_date),
    INDEX idx_payments_status (status)
);
```

## 🔐 安全與審計

### 審計日誌表
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- insert, update, delete
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_record (record_id),
    INDEX idx_audit_user (changed_by),
    INDEX idx_audit_time (changed_at)
);

-- 系統日誌表
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL, -- debug, info, warn, error
    module VARCHAR(50),
    action VARCHAR(100),
    message TEXT,
    details JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_system_logs_level (log_level),
    INDEX idx_system_logs_module (module),
    INDEX idx_system_logs_time (created_at)
);
```

## 📈 效能優化

### 建議索引策略
1. **主鍵索引**: 所有表格使用 UUID 主鍵自動建立索引
2. **外鍵索引**: 所有外鍵欄位建立索引以加速 JOIN
3. **查詢索引**: 根據查詢頻率建立複合索引
4. **時間索引**: 日期欄位建立索引支援範圍查詢

### 分區策略
```sql
-- 庫存異動記錄按月分區
CREATE TABLE inventory_transactions_2025_01 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 審計日誌按月分區
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 資料歸檔策略
- 超過2年的交易記錄移至歸檔表
- 超過1年的系統日誌壓縮存儲
- 已結案訂單定期歸檔

## 🔄 資料遷移計畫

### 遷移順序
1. **基礎資料**: 用戶、角色、權限、部門
2. **主檔資料**: 品項、客戶、供應商
3. **交易資料**: 訂單、採購單、庫存
4. **財務資料**: 應收應付、付款記錄
5. **歷史資料**: 舊系統資料匯入

### 遷移腳本範例
```sql
-- 從舊系統遷移品項資料
INSERT INTO items (item_code, item_name, specification, status)
SELECT 
    old_item_code,
    old_item_name,
    old_spec,
    CASE WHEN old_status = 'Y' THEN 'active' ELSE 'inactive' END
FROM legacy_items
WHERE old_deleted = 'N';
```

## 🛠️ 維護與監控

### 定期維護任務
```sql
-- 每日真空分析
VACUUM ANALYZE;

-- 每週重建索引
REINDEX DATABASE tsaitung_erp;

-- 每月清理過期資料
DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

### 監控查詢
```sql
-- 檢查表格大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 檢查慢查詢
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 10;
```

## 📊 關鍵統計

### 資料表統計
- **總表格數**: 45
- **核心業務表**: 30
- **系統管理表**: 10
- **審計日誌表**: 5

### 預估資料量 (年度)
- **訂單記錄**: ~50,000 筆
- **庫存異動**: ~500,000 筆
- **客戶資料**: ~5,000 筆
- **品項資料**: ~10,000 筆

### 存儲需求評估
- **第一年**: ~50GB
- **第二年**: ~150GB
- **第三年**: ~300GB

---

**文件狀態**: 設計中  
**下次審查**: 2025-08-29  
**負責人**: 資料庫架構師

> 📌 **重要提醒**: 
> - 正式環境部署前需進行完整的資料庫壓力測試
> - 建議使用 PostgreSQL 15+ 以獲得最佳效能
> - 定期備份策略必須在上線前制定完成