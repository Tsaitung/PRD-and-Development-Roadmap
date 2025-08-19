-- =============================================
-- BDM-UNIT 單位管理模組 - 數據遷移腳本
-- 版本: v1.0.0
-- 日期: 2025-08-20
-- 描述: 從舊系統遷移單位資料到新系統
-- =============================================

-- 設定變數
SET @migration_batch_id = UUID();
SET @migration_timestamp = NOW();
SET @migration_user = 'SYSTEM_MIGRATION';

-- =============================================
-- 步驟 1: 備份現有資料
-- =============================================

-- 創建備份表
CREATE TABLE IF NOT EXISTS units_backup_20250820 AS 
SELECT * FROM units WHERE 1=1;

-- 記錄備份資訊
INSERT INTO migration_log (
    batch_id,
    table_name,
    operation,
    record_count,
    status,
    created_at,
    created_by
) 
SELECT 
    @migration_batch_id,
    'units',
    'BACKUP',
    COUNT(*),
    'SUCCESS',
    @migration_timestamp,
    @migration_user
FROM units;

-- =============================================
-- 步驟 2: 資料清理和標準化
-- =============================================

-- 創建臨時表存儲清理後的資料
CREATE TEMPORARY TABLE units_cleaned AS
SELECT 
    id,
    TRIM(unitName) as unitName,
    CASE 
        WHEN unitType IN ('重量', 'weight', 'Weight', 'WEIGHT') THEN '重量'
        WHEN unitType IN ('體積', 'volume', 'Volume', 'VOLUME') THEN '體積'
        WHEN unitType IN ('數量', 'quantity', 'Quantity', 'QUANTITY') THEN '數量'
        WHEN unitType IN ('長度', 'length', 'Length', 'LENGTH') THEN '長度'
        WHEN unitType IN ('面積', 'area', 'Area', 'AREA') THEN '面積'
        WHEN unitType IN ('包裝', 'package', 'Package', 'PACKAGE') THEN '包裝'
        ELSE '其他'
    END as unitType,
    CASE 
        WHEN variance < 0 THEN 0
        WHEN variance > 100 THEN 100
        ELSE COALESCE(variance, 0)
    END as variance,
    COALESCE(isExact, false) as isExact,
    CASE 
        WHEN conversionToKG <= 0 THEN 1
        ELSE COALESCE(conversionToKG, 1)
    END as conversionToKG,
    created_at,
    updated_at,
    NULL as deleted_at,
    COALESCE(created_by, @migration_user) as created_by,
    COALESCE(updated_by, @migration_user) as updated_by,
    true as isActive,
    0 as sortOrder
FROM units
WHERE unitName IS NOT NULL 
    AND unitName != '';

-- 記錄清理結果
INSERT INTO migration_log (
    batch_id,
    table_name,
    operation,
    record_count,
    status,
    notes,
    created_at,
    created_by
) 
SELECT 
    @migration_batch_id,
    'units',
    'CLEAN',
    COUNT(*),
    'SUCCESS',
    CONCAT('原始記錄: ', (SELECT COUNT(*) FROM units), ', 清理後: ', COUNT(*)),
    @migration_timestamp,
    @migration_user
FROM units_cleaned;

-- =============================================
-- 步驟 3: 檢查資料完整性
-- =============================================

-- 檢查重複的單位名稱
CREATE TEMPORARY TABLE duplicate_units AS
SELECT 
    unitName,
    COUNT(*) as count
FROM units_cleaned
GROUP BY unitName
HAVING COUNT(*) > 1;

-- 如果有重複，添加序號區分
UPDATE units_cleaned uc
INNER JOIN (
    SELECT 
        id,
        unitName,
        ROW_NUMBER() OVER (PARTITION BY unitName ORDER BY created_at) as rn
    FROM units_cleaned
    WHERE unitName IN (SELECT unitName FROM duplicate_units)
) dup ON uc.id = dup.id
SET uc.unitName = CONCAT(dup.unitName, '_', dup.rn)
WHERE dup.rn > 1;

-- 檢查必填欄位
DELETE FROM units_cleaned
WHERE unitName IS NULL 
    OR unitName = ''
    OR unitType IS NULL
    OR conversionToKG IS NULL
    OR conversionToKG <= 0;

-- 記錄資料驗證結果
INSERT INTO migration_log (
    batch_id,
    table_name,
    operation,
    record_count,
    status,
    notes,
    created_at,
    created_by
)
VALUES (
    @migration_batch_id,
    'units',
    'VALIDATE',
    (SELECT COUNT(*) FROM units_cleaned),
    'SUCCESS',
    CONCAT(
        '重複單位: ', (SELECT COUNT(*) FROM duplicate_units),
        ', 無效記錄已移除'
    ),
    @migration_timestamp,
    @migration_user
);

-- =============================================
-- 步驟 4: 建立新表結構（如果不存在）
-- =============================================

CREATE TABLE IF NOT EXISTS units_new (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 業務欄位
    unitName VARCHAR(50) NOT NULL UNIQUE,
    unitType VARCHAR(20) NOT NULL,
    variance DECIMAL(5,2) DEFAULT 0,
    isExact BOOLEAN DEFAULT false,
    conversionToKG DECIMAL(10,4) NOT NULL,
    
    -- 擴展欄位
    description TEXT,
    isActive BOOLEAN DEFAULT true,
    sortOrder INT DEFAULT 0,
    
    -- 索引
    INDEX idx_unit_name (unitName),
    INDEX idx_unit_type (unitType),
    INDEX idx_is_active (isActive),
    INDEX idx_sort_order (sortOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 步驟 5: 遷移資料到新表
-- =============================================

-- 開始事務
START TRANSACTION;

-- 插入資料
INSERT INTO units_new (
    id,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by,
    unitName,
    unitType,
    variance,
    isExact,
    conversionToKG,
    isActive,
    sortOrder
)
SELECT 
    id,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by,
    unitName,
    unitType,
    variance,
    isExact,
    conversionToKG,
    isActive,
    sortOrder
FROM units_cleaned;

-- 驗證遷移結果
SET @source_count = (SELECT COUNT(*) FROM units_cleaned);
SET @target_count = (SELECT COUNT(*) FROM units_new);

IF @source_count = @target_count THEN
    -- 遷移成功，提交事務
    COMMIT;
    
    -- 記錄成功
    INSERT INTO migration_log (
        batch_id,
        table_name,
        operation,
        record_count,
        status,
        notes,
        created_at,
        created_by
    )
    VALUES (
        @migration_batch_id,
        'units',
        'MIGRATE',
        @target_count,
        'SUCCESS',
        '資料遷移成功',
        @migration_timestamp,
        @migration_user
    );
    
    -- 重命名表
    RENAME TABLE units TO units_old_20250820;
    RENAME TABLE units_new TO units;
    
ELSE
    -- 遷移失敗，回滾
    ROLLBACK;
    
    -- 記錄失敗
    INSERT INTO migration_log (
        batch_id,
        table_name,
        operation,
        record_count,
        status,
        error_message,
        created_at,
        created_by
    )
    VALUES (
        @migration_batch_id,
        'units',
        'MIGRATE',
        0,
        'FAILED',
        CONCAT('記錄數不符: 來源=', @source_count, ', 目標=', @target_count),
        @migration_timestamp,
        @migration_user
    );
    
    -- 拋出錯誤
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = '資料遷移失敗：記錄數不符';
END IF;

-- =============================================
-- 步驟 6: 插入預設資料（如果需要）
-- =============================================

-- 插入常用單位（如果不存在）
INSERT IGNORE INTO units (
    unitName,
    unitType,
    variance,
    isExact,
    conversionToKG,
    created_by,
    updated_by
) VALUES 
    ('公斤', '重量', 0, true, 1, @migration_user, @migration_user),
    ('公克', '重量', 0, true, 0.001, @migration_user, @migration_user),
    ('台斤', '重量', 0, true, 0.6, @migration_user, @migration_user),
    ('磅', '重量', 0, true, 0.453592, @migration_user, @migration_user),
    ('公噸', '重量', 0, true, 1000, @migration_user, @migration_user),
    ('箱', '包裝', 10, false, 15, @migration_user, @migration_user),
    ('盒', '包裝', 5, false, 1, @migration_user, @migration_user),
    ('包', '包裝', 5, false, 0.5, @migration_user, @migration_user),
    ('個', '數量', 0, true, 0.1, @migration_user, @migration_user),
    ('打', '數量', 0, true, 1.2, @migration_user, @migration_user);

-- =============================================
-- 步驟 7: 更新統計資訊
-- =============================================

-- 更新表統計資訊
ANALYZE TABLE units;

-- 創建統計報告
SELECT 
    '遷移統計報告' as report_title,
    @migration_batch_id as batch_id,
    @migration_timestamp as migration_time,
    (SELECT COUNT(*) FROM units_old_20250820) as original_count,
    (SELECT COUNT(*) FROM units) as migrated_count,
    (SELECT COUNT(DISTINCT unitType) FROM units) as unit_types,
    (SELECT COUNT(*) FROM units WHERE isExact = true) as exact_units,
    (SELECT COUNT(*) FROM units WHERE isExact = false) as approximate_units,
    (SELECT MIN(created_at) FROM units) as earliest_record,
    (SELECT MAX(created_at) FROM units) as latest_record;

-- =============================================
-- 步驟 8: 清理臨時資料
-- =============================================

-- 刪除臨時表
DROP TEMPORARY TABLE IF EXISTS units_cleaned;
DROP TEMPORARY TABLE IF EXISTS duplicate_units;

-- =============================================
-- 步驟 9: 最終驗證
-- =============================================

-- 驗證關鍵資料
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as has_data,
    CASE 
        WHEN COUNT(DISTINCT unitName) = COUNT(*) THEN 'PASS'
        ELSE 'FAIL'
    END as unique_names,
    CASE 
        WHEN MIN(conversionToKG) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as valid_conversion,
    CASE 
        WHEN MAX(variance) <= 100 AND MIN(variance) >= 0 THEN 'PASS'
        ELSE 'FAIL'
    END as valid_variance
FROM units;

-- 記錄最終狀態
INSERT INTO migration_log (
    batch_id,
    table_name,
    operation,
    record_count,
    status,
    notes,
    created_at,
    created_by
)
VALUES (
    @migration_batch_id,
    'units',
    'COMPLETE',
    (SELECT COUNT(*) FROM units),
    'SUCCESS',
    CONCAT(
        '遷移完成. ',
        '總記錄: ', (SELECT COUNT(*) FROM units),
        ', 單位類型: ', (SELECT COUNT(DISTINCT unitType) FROM units),
        ', 精確單位: ', (SELECT COUNT(*) FROM units WHERE isExact = true)
    ),
    NOW(),
    @migration_user
);

-- =============================================
-- 完成遷移
-- =============================================

SELECT 
    '✅ 資料遷移完成' as status,
    @migration_batch_id as batch_id,
    (SELECT COUNT(*) FROM units) as total_units,
    NOW() as completed_at;

-- =============================================
-- 回滾腳本（如需要執行）
-- =============================================
/*
-- 如果需要回滾，執行以下腳本：

-- 1. 停止應用程式連線

-- 2. 恢復原始表
RENAME TABLE units TO units_failed;
RENAME TABLE units_old_20250820 TO units;

-- 3. 或從備份恢復
DROP TABLE IF EXISTS units;
CREATE TABLE units AS SELECT * FROM units_backup_20250820;

-- 4. 記錄回滾
INSERT INTO migration_log (
    batch_id,
    table_name,
    operation,
    status,
    notes,
    created_at,
    created_by
)
VALUES (
    @migration_batch_id,
    'units',
    'ROLLBACK',
    'SUCCESS',
    '已回滾到原始狀態',
    NOW(),
    @migration_user
);

*/