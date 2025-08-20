import { test, expect } from '@playwright/test';
import { testDataBuilders } from '../setup';

test.describe('WMS-IOD Inventory Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to inventory management
    await page.goto('/login');
    await page.fill('input[name="username"]', 'warehouse_manager');
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    await page.click('text=庫存管理');
    await page.waitForURL('/wms/inventory');
  });

  test.describe('Inventory Overview', () => {
    test('should display inventory dashboard', async ({ page }) => {
      // Check dashboard elements
      await expect(page.locator('h1')).toContainText('庫存總覽');
      await expect(page.locator('[data-testid="total-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
      await expect(page.locator('[data-testid="warehouse-summary"]')).toBeVisible();
    });

    test('should navigate between warehouse views', async ({ page }) => {
      // Select different warehouse
      await page.selectOption('select[name="warehouse"]', 'WH_002');
      await page.waitForResponse('**/api/v1/inventory?warehouse=WH_002');
      
      await expect(page.locator('text=中區倉庫')).toBeVisible();
    });

    test('should search inventory items', async ({ page }) => {
      // Search for specific item
      await page.fill('input[placeholder*="搜尋"]', '商品A');
      await page.waitForTimeout(500); // Debounce
      
      await expect(page.locator('table tbody tr')).toHaveCount(1);
      await expect(page.locator('text=商品A')).toBeVisible();
    });

    test('should filter by stock status', async ({ page }) => {
      // Filter low stock items
      await page.click('button:has-text("篩選")');
      await page.click('label:has-text("低庫存")');
      await page.click('button:has-text("套用")');
      
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(2);
      
      // Verify all items are low stock
      const badges = page.locator('[data-testid="stock-status-badge"]');
      for (const badge of await badges.all()) {
        await expect(badge).toHaveClass(/yellow|orange/);
      }
    });
  });

  test.describe('Stock Adjustment', () => {
    test('should adjust stock quantity', async ({ page }) => {
      // Find and click adjust button for first item
      await page.click('table tbody tr:first-child button:has-text("調整")');
      
      // Fill adjustment form
      await page.selectOption('select[name="adjustment_type"]', 'damage');
      await page.fill('input[name="quantity"]', '10');
      await page.click('label:has-text("減少")');
      await page.fill('textarea[name="reason"]', '運輸過程破損10件');
      
      // Submit adjustment
      await page.click('button:has-text("確認調整")');
      
      // Verify success message
      await expect(page.locator('text=調整成功')).toBeVisible();
      
      // Verify updated stock level
      await expect(page.locator('table tbody tr:first-child td:nth-child(4)')).toContainText('490');
    });

    test('should validate adjustment constraints', async ({ page }) => {
      // Open adjustment dialog
      await page.click('table tbody tr:first-child button:has-text("調整")');
      
      // Try to adjust more than available
      await page.fill('input[name="quantity"]', '1000');
      await page.click('label:has-text("減少")');
      
      // Should show error
      await expect(page.locator('text=庫存不可為負值')).toBeVisible();
      
      // Fix the quantity
      await page.fill('input[name="quantity"]', '50');
      await page.fill('textarea[name="reason"]', '合理調整');
      await page.click('button:has-text("確認調整")');
      
      await expect(page.locator('text=調整成功')).toBeVisible();
    });

    test('should require approval for large adjustments', async ({ page }) => {
      // Open adjustment dialog
      await page.click('table tbody tr:first-child button:has-text("調整")');
      
      // Enter large adjustment
      await page.fill('input[name="quantity"]', '200');
      await page.click('label:has-text("減少")');
      await page.fill('textarea[name="reason"]', '大量報廢');
      
      // Should show approval requirement
      await expect(page.locator('text=需要主管核准')).toBeVisible();
      await expect(page.locator('input[name="approver"]')).toBeVisible();
      
      // Fill approver
      await page.fill('input[name="approver"]', 'MANAGER_001');
      await page.click('button:has-text("提交核准")');
      
      await expect(page.locator('text=已提交核准')).toBeVisible();
    });
  });

  test.describe('Stock Transfer', () => {
    test('should create transfer order', async ({ page }) => {
      // Select items for transfer
      await page.click('table tbody tr:nth-child(1) input[type="checkbox"]');
      await page.click('table tbody tr:nth-child(2) input[type="checkbox"]');
      
      // Open transfer dialog
      await page.click('button:has-text("調撥")');
      
      // Fill transfer details
      await page.selectOption('select[name="from_warehouse"]', 'WH_001');
      await page.selectOption('select[name="to_warehouse"]', 'WH_002');
      await page.fill('input[name="expected_date"]', '2025-08-22');
      
      // Set quantities for each item
      await page.fill('input[name="items[0].quantity"]', '50');
      await page.fill('input[name="items[1].quantity"]', '30');
      
      // Submit transfer
      await page.click('button:has-text("確認調撥")');
      
      // Verify success
      await expect(page.locator('text=調撥單已建立')).toBeVisible();
      await expect(page.locator('text=TR-20250820-')).toBeVisible();
    });

    test('should validate transfer quantities', async ({ page }) => {
      // Select item
      await page.click('table tbody tr:first-child input[type="checkbox"]');
      await page.click('button:has-text("調撥")');
      
      // Try to transfer more than available
      await page.selectOption('select[name="from_warehouse"]', 'WH_001');
      await page.selectOption('select[name="to_warehouse"]', 'WH_002');
      await page.fill('input[name="items[0].quantity"]', '1000');
      
      await page.click('button:has-text("確認調撥")');
      
      // Should show error
      await expect(page.locator('text=超過可用庫存')).toBeVisible();
    });
  });

  test.describe('Cycle Count', () => {
    test('should perform cycle count', async ({ page }) => {
      // Start cycle count
      await page.click('button:has-text("週期盤點")');
      
      // Select location
      await page.selectOption('select[name="warehouse"]', 'WH_001');
      await page.fill('input[name="location"]', 'A-01');
      await page.click('button:has-text("開始盤點")');
      
      // Wait for items to load
      await page.waitForSelector('[data-testid="count-list"]');
      
      // Enter counted quantities
      const countInputs = page.locator('input[name^="count["]');
      const count = await countInputs.count();
      
      for (let i = 0; i < count; i++) {
        const expectedQty = await page.locator(`[data-testid="expected-${i}"]`).textContent();
        const actualQty = parseInt(expectedQty || '0') - 5; // Small discrepancy
        await countInputs.nth(i).fill(actualQty.toString());
      }
      
      // Submit count
      await page.click('button:has-text("提交盤點")');
      
      // Review discrepancies
      await expect(page.locator('text=盤點差異')).toBeVisible();
      await expect(page.locator('[data-testid="accuracy-rate"]')).toContainText('%');
      
      // Auto-adjust
      await page.click('input[name="auto_adjust"]');
      await page.click('button:has-text("確認調整")');
      
      await expect(page.locator('text=盤點完成')).toBeVisible();
    });
  });

  test.describe('Stock Alerts', () => {
    test('should handle low stock alert', async ({ page }) => {
      // Navigate to alerts
      await page.click('a:has-text("庫存警報")');
      
      // Find low stock alert
      await page.waitForSelector('[data-testid="alert-list"]');
      const lowStockAlert = page.locator('[data-testid="alert-type-low_stock"]').first();
      
      // Handle alert
      await lowStockAlert.locator('button:has-text("處理")').click();
      
      // Create purchase order
      await page.selectOption('select[name="action"]', 'create_po');
      await page.fill('input[name="quantity"]', '200');
      await page.selectOption('select[name="supplier"]', 'SUP_001');
      await page.click('button:has-text("建立採購單")');
      
      await expect(page.locator('text=採購單已建立')).toBeVisible();
      await expect(lowStockAlert).toHaveClass(/resolved/);
    });

    test('should dismiss low priority alerts', async ({ page }) => {
      // Navigate to alerts
      await page.click('a:has-text("庫存警報")');
      
      // Find overstock alert (low priority)
      const overstockAlert = page.locator('[data-testid="alert-type-overstock"]').first();
      
      // Dismiss alert
      await overstockAlert.locator('button:has-text("忽略")').click();
      
      // Confirm dismissal
      await page.click('button:has-text("確認忽略")');
      
      await expect(overstockAlert).not.toBeVisible();
      await expect(page.locator('text=警報已忽略')).toBeVisible();
    });
  });

  test.describe('Reports and Analytics', () => {
    test('should generate daily inventory report', async ({ page }) => {
      // Navigate to reports
      await page.click('a:has-text("報表")');
      
      // Select report type
      await page.selectOption('select[name="report_type"]', 'daily_stock');
      await page.fill('input[name="report_date"]', '2025-08-20');
      await page.selectOption('select[name="warehouse"]', 'WH_001');
      
      // Generate report
      await page.click('button:has-text("產生報表")');
      
      // Wait for report
      await page.waitForSelector('[data-testid="report-content"]');
      
      // Verify report sections
      await expect(page.locator('text=庫存總覽')).toBeVisible();
      await expect(page.locator('text=低庫存項目')).toBeVisible();
      await expect(page.locator('text=即將過期')).toBeVisible();
      await expect(page.locator('[data-testid="stock-value-chart"]')).toBeVisible();
      
      // Export report
      await page.click('button:has-text("匯出Excel")');
      
      // Wait for download
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('inventory_report');
    });

    test('should generate ABC analysis', async ({ page }) => {
      // Navigate to reports
      await page.click('a:has-text("報表")');
      
      // Select ABC analysis
      await page.selectOption('select[name="report_type"]', 'abc_analysis');
      await page.click('button:has-text("產生分析")');
      
      // Wait for analysis
      await page.waitForSelector('[data-testid="abc-chart"]');
      
      // Verify categories
      await expect(page.locator('text=A類商品')).toBeVisible();
      await expect(page.locator('text=B類商品')).toBeVisible();
      await expect(page.locator('text=C類商品')).toBeVisible();
      
      // Check recommendations
      await expect(page.locator('[data-testid="abc-recommendations"]')).toBeVisible();
    });
  });

  test.describe('Batch Operations', () => {
    test('should perform bulk stock update', async ({ page }) => {
      // Select multiple items
      await page.click('input[data-testid="select-all"]');
      
      // Open bulk actions
      await page.click('button:has-text("批量操作")');
      await page.click('text=批量更新');
      
      // Update safety stock for all
      await page.fill('input[name="safety_stock"]', '150');
      await page.fill('input[name="reorder_point"]', '200');
      
      // Apply to selected
      await page.click('button:has-text("套用到選中項目")');
      
      // Confirm
      await page.click('button:has-text("確認更新")');
      
      await expect(page.locator('text=已更新 3 個項目')).toBeVisible();
    });

    test('should export selected items', async ({ page }) => {
      // Select items
      await page.click('table tbody tr:nth-child(1) input[type="checkbox"]');
      await page.click('table tbody tr:nth-child(2) input[type="checkbox"]');
      
      // Export selected
      await page.click('button:has-text("批量操作")');
      await page.click('text=匯出選中');
      
      // Configure export
      await page.selectOption('select[name="export_format"]', 'excel');
      await page.click('input[name="include_movements"]');
      await page.click('button:has-text("匯出")');
      
      // Wait for download
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('inventory_export');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Navigate to inventory
      await page.click('text=庫存管理');
      
      // Check table is scrollable
      const table = page.locator('[data-testid="inventory-table-wrapper"]');
      await expect(table).toHaveCSS('overflow-x', 'auto');
      
      // Open item details
      await page.click('table tbody tr:first-child');
      
      // Check details modal is full screen on mobile
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveCSS('width', '375px');
    });
  });
});