import { test, expect, Page } from '@playwright/test';

test.describe('Order Management E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/orders');
    await page.waitForSelector('[data-testid="order-management"]');
  });

  test.describe('Complete Order Lifecycle', () => {
    test('should complete full order workflow', async () => {
      // Step 1: Create new order
      await page.click('[data-testid="add-order-btn"]');
      
      // Fill order details
      await page.selectOption('[data-testid="customer-select"]', 'CUS_001');
      await page.fill('[data-testid="delivery-date"]', '2025-08-21');
      await page.selectOption('[data-testid="delivery-time"]', '09:00-12:00');
      await page.fill('[data-testid="delivery-address"]', '台北市信義區測試路100號');
      
      // Add items
      await page.click('[data-testid="add-item-btn"]');
      await page.selectOption('[data-testid="product-select-0"]', 'PROD_001');
      await page.fill('[data-testid="quantity-input-0"]', '10');
      
      await page.click('[data-testid="add-item-btn"]');
      await page.selectOption('[data-testid="product-select-1"]', 'PROD_002');
      await page.fill('[data-testid="quantity-input-1"]', '5');
      
      // Check totals
      await expect(page.locator('[data-testid="order-subtotal"]')).toContainText('2000');
      await expect(page.locator('[data-testid="order-tax"]')).toContainText('100');
      await expect(page.locator('[data-testid="order-total"]')).toContainText('2100');
      
      // Save order
      await page.click('[data-testid="save-order-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('訂單建立成功');
      
      // Step 2: Find and confirm order
      const orderNumber = await page.locator('[data-testid="new-order-number"]').textContent();
      
      await page.fill('[data-testid="search-input"]', orderNumber || '');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector(`[data-testid="order-${orderNumber}"]`);
      
      // Change status to confirmed
      await page.click(`[data-testid="status-btn-${orderNumber}"]`);
      await page.click('[data-testid="status-confirmed"]');
      
      await expect(page.locator(`[data-testid="status-${orderNumber}"]`)).toContainText('已確認');
      
      // Step 3: Process order
      await page.click(`[data-testid="status-btn-${orderNumber}"]`);
      await page.click('[data-testid="status-processing"]');
      
      // Upload processing picture
      await page.click(`[data-testid="order-${orderNumber}"]`);
      await page.click('[data-testid="pictures-tab"]');
      
      const fileInput = await page.locator('[data-testid="picture-upload"]');
      await fileInput.setInputFiles('./test-data/processing.jpg');
      
      await expect(page.locator('[data-testid="picture-count"]')).toContainText('1');
      
      // Step 4: Ship order
      await page.click('[data-testid="back-to-list"]');
      await page.click(`[data-testid="status-btn-${orderNumber}"]`);
      await page.click('[data-testid="status-shipped"]');
      
      // Add shipping info
      await page.fill('[data-testid="tracking-number"]', 'TRACK123456');
      await page.selectOption('[data-testid="driver-select"]', 'DRV_001');
      await page.click('[data-testid="confirm-ship-btn"]');
      
      await expect(page.locator(`[data-testid="status-${orderNumber}"]`)).toContainText('已出貨');
      
      // Step 5: Complete order
      await page.click(`[data-testid="status-btn-${orderNumber}"]`);
      await page.click('[data-testid="status-completed"]');
      
      await expect(page.locator(`[data-testid="status-${orderNumber}"]`)).toContainText('已完成');
    });

    test('should handle order cancellation', async () => {
      // Create order first
      await page.click('[data-testid="add-order-btn"]');
      await page.selectOption('[data-testid="customer-select"]', 'CUS_002');
      await page.fill('[data-testid="delivery-date"]', '2025-08-22');
      
      await page.click('[data-testid="add-item-btn"]');
      await page.selectOption('[data-testid="product-select-0"]', 'PROD_001');
      await page.fill('[data-testid="quantity-input-0"]', '5');
      
      await page.click('[data-testid="save-order-btn"]');
      
      const orderNumber = await page.locator('[data-testid="new-order-number"]').textContent();
      
      // Cancel order
      await page.click(`[data-testid="order-${orderNumber}"]`);
      await page.click('[data-testid="cancel-order-btn"]');
      
      // Provide cancellation reason
      await page.fill('[data-testid="cancel-reason"]', '客戶要求取消');
      await page.click('[data-testid="confirm-cancel-btn"]');
      
      await expect(page.locator('[data-testid="order-status"]')).toContainText('已取消');
      await expect(page.locator('[data-testid="cancel-reason-display"]')).toContainText('客戶要求取消');
    });
  });

  test.describe('Order Search and Filter', () => {
    test('should search orders by multiple criteria', async () => {
      // Search by order number
      await page.fill('[data-testid="search-input"]', 'SO-20250820');
      await page.click('[data-testid="search-btn"]');
      
      const results = await page.locator('[data-testid^="order-row-"]').count();
      expect(results).toBeGreaterThan(0);
      
      // Clear and search by customer
      await page.click('[data-testid="clear-search"]');
      await page.selectOption('[data-testid="customer-filter"]', 'CUS_001');
      await page.click('[data-testid="apply-filter-btn"]');
      
      await page.waitForSelector('[data-testid^="order-row-"]');
      
      // Verify all results belong to selected customer
      const customerNames = await page.locator('[data-testid^="customer-name-"]').allTextContents();
      customerNames.forEach(name => {
        expect(name).toContain('客戶A');
      });
    });

    test('should filter by date range', async () => {
      await page.fill('[data-testid="date-from"]', '2025-08-01');
      await page.fill('[data-testid="date-to"]', '2025-08-31');
      await page.click('[data-testid="apply-filter-btn"]');
      
      await page.waitForSelector('[data-testid^="order-row-"]');
      
      // Check date badge
      await expect(page.locator('[data-testid="date-range-badge"]')).toContainText('2025年8月');
    });

    test('should use quick filters', async () => {
      // Today's orders
      await page.click('[data-testid="quick-filter-today"]');
      
      await page.waitForSelector('[data-testid^="order-row-"]');
      await expect(page.locator('[data-testid="filter-badge"]')).toContainText('今日訂單');
      
      // Pending orders
      await page.click('[data-testid="quick-filter-pending"]');
      
      const statusBadges = await page.locator('[data-testid^="status-"]').allTextContents();
      statusBadges.forEach(status => {
        expect(status).toBe('待確認');
      });
      
      // Urgent orders
      await page.click('[data-testid="quick-filter-urgent"]');
      
      const priorityBadges = await page.locator('[data-testid^="priority-"]').allTextContents();
      priorityBadges.forEach(priority => {
        expect(priority).toBe('緊急');
      });
    });
  });

  test.describe('Batch Operations', () => {
    test('should batch update order status', async () => {
      // Select multiple orders
      await page.check('[data-testid="select-order-0"]');
      await page.check('[data-testid="select-order-1"]');
      await page.check('[data-testid="select-order-2"]');
      
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('3');
      
      // Batch confirm
      await page.click('[data-testid="batch-actions-btn"]');
      await page.click('[data-testid="batch-confirm"]');
      
      // Confirm action
      await page.click('[data-testid="confirm-batch-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('3 筆訂單已確認');
    });

    test('should batch export orders', async () => {
      // Select orders
      await page.click('[data-testid="select-all-checkbox"]');
      
      // Export
      await page.click('[data-testid="batch-export-btn"]');
      
      // Select format
      await page.click('[data-testid="export-excel"]');
      await page.check('[data-testid="include-items-checkbox"]');
      await page.check('[data-testid="include-customer-checkbox"]');
      
      // Download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export-btn"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('orders_export');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });

    test('should batch print orders', async () => {
      // Select orders to print
      await page.check('[data-testid="select-order-0"]');
      await page.check('[data-testid="select-order-1"]');
      
      // Print preview
      await page.click('[data-testid="batch-print-btn"]');
      
      await page.waitForSelector('[data-testid="print-preview"]');
      
      // Select print template
      await page.click('[data-testid="template-invoice"]');
      
      // Print
      await page.click('[data-testid="confirm-print-btn"]');
      
      // Verify print dialog opened (mocked in test environment)
      await expect(page.locator('[data-testid="print-success"]')).toBeVisible();
    });
  });

  test.describe('Order Details and History', () => {
    test('should view and track order history', async () => {
      // Open first order
      await page.click('[data-testid="order-row-0"]');
      
      await page.waitForSelector('[data-testid="order-detail"]');
      
      // Check tabs
      await expect(page.locator('[data-testid="tab-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-pictures"]')).toBeVisible();
      
      // View history
      await page.click('[data-testid="tab-history"]');
      
      const historyEntries = await page.locator('[data-testid^="history-entry-"]').count();
      expect(historyEntries).toBeGreaterThan(0);
      
      // Check history details
      await expect(page.locator('[data-testid="history-entry-0"]')).toContainText('訂單建立');
      await expect(page.locator('[data-testid="history-user-0"]')).toBeVisible();
      await expect(page.locator('[data-testid="history-time-0"]')).toBeVisible();
    });

    test('should edit order items', async () => {
      // Open order in edit mode
      await page.click('[data-testid="order-row-0"]');
      await page.click('[data-testid="edit-order-btn"]');
      
      // Modify quantity
      await page.fill('[data-testid="item-quantity-0"]', '15');
      
      // Add new item
      await page.click('[data-testid="add-item-btn"]');
      await page.selectOption('[data-testid="product-select-new"]', 'PROD_003');
      await page.fill('[data-testid="quantity-input-new"]', '8');
      
      // Remove item
      await page.click('[data-testid="remove-item-1"]');
      
      // Save changes
      await page.click('[data-testid="save-changes-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('訂單更新成功');
      
      // Verify history shows update
      await page.click('[data-testid="tab-history"]');
      await expect(page.locator('[data-testid="history-entry-0"]')).toContainText('訂單項目更新');
    });
  });

  test.describe('Order Return Process', () => {
    test('should process order return', async () => {
      // Find completed order
      await page.selectOption('[data-testid="status-filter"]', 'completed');
      await page.click('[data-testid="apply-filter-btn"]');
      
      await page.waitForSelector('[data-testid^="order-row-"]');
      
      // Open order
      await page.click('[data-testid="order-row-0"]');
      
      // Initiate return
      await page.click('[data-testid="return-order-btn"]');
      
      // Select items to return
      await page.check('[data-testid="return-item-0"]');
      await page.fill('[data-testid="return-quantity-0"]', '2');
      await page.selectOption('[data-testid="return-reason-0"]', 'defective');
      await page.fill('[data-testid="return-notes-0"]', '商品有瑕疵');
      
      // Select return type
      await page.click('[data-testid="return-type-refund"]');
      
      // Submit return
      await page.click('[data-testid="submit-return-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('退貨申請已建立');
      
      // Check return status
      await expect(page.locator('[data-testid="return-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="return-status"]')).toContainText('退貨處理中');
    });
  });

  test.describe('Order Summary Dashboard', () => {
    test('should view daily summary', async () => {
      await page.goto('/orders/summary');
      
      await page.waitForSelector('[data-testid="summary-dashboard"]');
      
      // Check summary cards
      await expect(page.locator('[data-testid="total-orders-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-revenue-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-order-value-card"]')).toBeVisible();
      
      // Check charts
      await expect(page.locator('[data-testid="status-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      
      // Switch to weekly view
      await page.selectOption('[data-testid="period-select"]', 'weekly');
      
      await page.waitForTimeout(500);
      
      await expect(page.locator('[data-testid="period-label"]')).toContainText('本週');
      
      // Export summary
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-summary-btn"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('order_summary');
    });
  });
});