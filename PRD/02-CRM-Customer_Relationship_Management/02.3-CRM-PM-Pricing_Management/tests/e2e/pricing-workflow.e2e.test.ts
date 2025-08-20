import { test, expect, Page } from '@playwright/test';

test.describe('Pricing Management E2E Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/pricing');
    await page.waitForSelector('[data-testid="pricing-management"]');
  });

  test.describe('Complete Pricing Workflow', () => {
    test('should complete end-to-end pricing setup', async () => {
      // Step 1: Create base price
      await page.click('[data-testid="add-price-btn"]');
      
      await page.selectOption('[data-testid="customer-select"]', 'ENT_001');
      await page.selectOption('[data-testid="product-select"]', 'PROD_001');
      await page.fill('[data-testid="price-input"]', '100');
      await page.selectOption('[data-testid="price-type-select"]', 'base');
      await page.fill('[data-testid="effective-date"]', '2025-09-01');
      
      await page.click('[data-testid="save-price-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('價格新增成功');
      
      // Step 2: Create customer special price
      await page.click('[data-testid="add-price-btn"]');
      
      await page.selectOption('[data-testid="customer-select"]', 'COM_001');
      await page.selectOption('[data-testid="product-select"]', 'PROD_001');
      await page.fill('[data-testid="price-input"]', '95');
      await page.selectOption('[data-testid="price-type-select"]', 'special');
      await page.fill('[data-testid="effective-date"]', '2025-09-01');
      
      await page.click('[data-testid="save-price-btn"]');
      
      // Step 3: Verify price hierarchy
      await page.selectOption('[data-testid="customer-filter"]', 'STO_001');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="price-hierarchy"]');
      
      const hierarchyItems = await page.locator('[data-testid^="hierarchy-level-"]').count();
      expect(hierarchyItems).toBe(3); // Enterprise, Company, Store levels
      
      // Step 4: Calculate effective price
      await page.click('[data-testid="price-calculator-btn"]');
      
      await page.selectOption('[data-testid="calc-customer"]', 'STO_001');
      await page.selectOption('[data-testid="calc-product"]', 'PROD_001');
      await page.fill('[data-testid="calc-quantity"]', '100');
      
      await page.click('[data-testid="calculate-btn"]');
      
      await expect(page.locator('[data-testid="effective-price"]')).toContainText('95');
      await expect(page.locator('[data-testid="applied-level"]')).toContainText('公司層級');
    });

    test('should handle price conflicts', async () => {
      // Create first price
      await page.click('[data-testid="add-price-btn"]');
      
      await page.selectOption('[data-testid="customer-select"]', 'CUS_001');
      await page.selectOption('[data-testid="product-select"]', 'PROD_001');
      await page.fill('[data-testid="price-input"]', '100');
      await page.fill('[data-testid="effective-date"]', '2025-09-01');
      await page.fill('[data-testid="expiry-date"]', '2025-12-31');
      
      await page.click('[data-testid="save-price-btn"]');
      
      // Try to create overlapping price
      await page.click('[data-testid="add-price-btn"]');
      
      await page.selectOption('[data-testid="customer-select"]', 'CUS_001');
      await page.selectOption('[data-testid="product-select"]', 'PROD_001');
      await page.fill('[data-testid="price-input"]', '110');
      await page.fill('[data-testid="effective-date"]', '2025-10-01');
      await page.fill('[data-testid="expiry-date"]', '2025-11-30');
      
      await page.click('[data-testid="save-price-btn"]');
      
      // Should show conflict warning
      await expect(page.locator('[data-testid="conflict-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="conflict-message"]')).toContainText('價格期間重疊');
      
      // Resolve conflict
      await page.click('[data-testid="replace-existing-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('價格已更新');
    });
  });

  test.describe('Bulk Price Operations', () => {
    test('should perform bulk price adjustment', async () => {
      // Search for prices
      await page.selectOption('[data-testid="customer-filter"]', 'all');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="price-table"]');
      
      // Select multiple prices
      await page.check('[data-testid="select-all-checkbox"]');
      
      const selectedCount = await page.locator('[data-testid="selected-count"]').textContent();
      expect(parseInt(selectedCount || '0')).toBeGreaterThan(0);
      
      // Open bulk adjustment
      await page.click('[data-testid="bulk-adjust-btn"]');
      
      // Set adjustment parameters
      await page.selectOption('[data-testid="adjustment-type"]', 'percentage');
      await page.fill('[data-testid="adjustment-value"]', '5');
      await page.click('[data-testid="increase-radio"]');
      
      // Preview changes
      await page.click('[data-testid="preview-btn"]');
      
      await page.waitForSelector('[data-testid="preview-table"]');
      
      // Apply changes
      await page.click('[data-testid="apply-adjustment-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('批量調整成功');
    });

    test('should import prices from Excel', async () => {
      // Open import dialog
      await page.click('[data-testid="import-btn"]');
      
      // Download template first
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-template-btn"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('price_template');
      
      // Upload file
      const filePath = './test-data/price_import.xlsx';
      await page.setInputFiles('[data-testid="file-input"]', filePath);
      
      // Validate
      await page.click('[data-testid="validate-btn"]');
      
      await page.waitForSelector('[data-testid="validation-results"]');
      
      const validCount = await page.locator('[data-testid="valid-count"]').textContent();
      const invalidCount = await page.locator('[data-testid="invalid-count"]').textContent();
      
      expect(parseInt(validCount || '0')).toBeGreaterThan(0);
      
      // Import if valid
      if (parseInt(invalidCount || '0') === 0) {
        await page.click('[data-testid="confirm-import-btn"]');
        
        await expect(page.locator('[data-testid="success-message"]')).toContainText('匯入成功');
      }
    });

    test('should export prices with filters', async () => {
      // Apply filters
      await page.selectOption('[data-testid="customer-filter"]', 'COM_001');
      await page.selectOption('[data-testid="price-type-filter"]', 'special');
      await page.fill('[data-testid="date-from"]', '2025-01-01');
      await page.fill('[data-testid="date-to"]', '2025-12-31');
      
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="price-table"]');
      
      // Export
      await page.click('[data-testid="export-btn"]');
      
      // Select format
      await page.click('[data-testid="export-excel-radio"]');
      await page.check('[data-testid="include-history-checkbox"]');
      
      // Download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export-btn"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('prices_export');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });
  });

  test.describe('Market Price and Reprice', () => {
    test('should manage market prices and execute reprice', async () => {
      // Navigate to market price page
      await page.click('[data-testid="market-price-tab"]');
      
      await page.waitForSelector('[data-testid="market-price-panel"]');
      
      // Filter pending items
      await page.selectOption('[data-testid="status-filter"]', 'pending');
      
      // Confirm prices
      const pendingRows = await page.locator('[data-testid^="market-price-row-"]').count();
      
      for (let i = 0; i < Math.min(pendingRows, 3); i++) {
        await page.click(`[data-testid="confirm-price-${i}"]`);
        await page.waitForTimeout(500);
      }
      
      // Select confirmed items for reprice
      await page.selectOption('[data-testid="status-filter"]', 'confirmed');
      
      await page.check('[data-testid="select-all-checkbox"]');
      
      // Execute reprice
      await page.click('[data-testid="reprice-btn"]');
      
      // Set reprice date
      await page.fill('[data-testid="reprice-date"]', '2025-08-20');
      
      // Preview impact
      await page.click('[data-testid="preview-impact-btn"]');
      
      await page.waitForSelector('[data-testid="impact-summary"]');
      
      const affectedOrders = await page.locator('[data-testid="affected-orders"]').textContent();
      expect(parseInt(affectedOrders || '0')).toBeGreaterThan(0);
      
      // Confirm reprice
      await page.click('[data-testid="confirm-reprice-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('回填成功');
      
      // Check reprice history
      await page.click('[data-testid="reprice-history-tab"]');
      
      await page.waitForSelector('[data-testid="reprice-history-table"]');
      
      const latestReprice = await page.locator('[data-testid="reprice-row-0"]').textContent();
      expect(latestReprice).toContain('2025-08-20');
    });

    test('should upload daily market prices', async () => {
      await page.click('[data-testid="market-price-tab"]');
      
      // Open upload dialog
      await page.click('[data-testid="upload-market-price-btn"]');
      
      // Set date
      await page.fill('[data-testid="market-date"]', '2025-08-21');
      
      // Upload CSV file
      const filePath = './test-data/market_prices_20250821.csv';
      await page.setInputFiles('[data-testid="market-file-input"]', filePath);
      
      // Preview
      await page.click('[data-testid="preview-upload-btn"]');
      
      await page.waitForSelector('[data-testid="upload-preview"]');
      
      // Confirm upload
      await page.click('[data-testid="confirm-upload-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('市價上傳成功');
    });
  });

  test.describe('Price Approval Workflow', () => {
    test('should submit and approve price changes', async () => {
      // Create price change requiring approval
      await page.click('[data-testid="add-price-btn"]');
      
      await page.selectOption('[data-testid="customer-select"]', 'ENT_001');
      await page.selectOption('[data-testid="product-select"]', 'PROD_HIGH_VALUE');
      await page.fill('[data-testid="price-input"]', '10000'); // High value triggers approval
      
      await page.click('[data-testid="save-price-btn"]');
      
      // Should show approval required
      await expect(page.locator('[data-testid="approval-required"]')).toBeVisible();
      
      // Add justification
      await page.fill('[data-testid="justification-text"]', '市場競爭需要調整價格');
      
      // Submit for approval
      await page.click('[data-testid="submit-approval-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('已提交審批');
      
      // Switch to approval view (as approver)
      await page.click('[data-testid="approval-queue-tab"]');
      
      await page.waitForSelector('[data-testid="approval-list"]');
      
      // Review request
      const firstRequest = page.locator('[data-testid="approval-request-0"]');
      await firstRequest.click();
      
      await page.waitForSelector('[data-testid="approval-details"]');
      
      // Add comments
      await page.fill('[data-testid="approval-comments"]', '同意此價格調整');
      
      // Approve
      await page.click('[data-testid="approve-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('審批通過');
    });
  });

  test.describe('Price Comparison', () => {
    test('should compare prices across customers', async () => {
      // Open comparison tool
      await page.click('[data-testid="price-compare-btn"]');
      
      // Select product
      await page.selectOption('[data-testid="compare-product"]', 'PROD_001');
      
      // Select customers to compare
      await page.click('[data-testid="customer-multi-select"]');
      await page.click('[data-testid="customer-option-COM_001"]');
      await page.click('[data-testid="customer-option-COM_002"]');
      await page.click('[data-testid="customer-option-COM_003"]');
      
      // Generate comparison
      await page.click('[data-testid="generate-comparison-btn"]');
      
      await page.waitForSelector('[data-testid="comparison-chart"]');
      
      // Verify comparison data
      const comparisonRows = await page.locator('[data-testid^="comparison-row-"]').count();
      expect(comparisonRows).toBe(3);
      
      // Check price variance
      const minPrice = await page.locator('[data-testid="min-price"]').textContent();
      const maxPrice = await page.locator('[data-testid="max-price"]').textContent();
      const avgPrice = await page.locator('[data-testid="avg-price"]').textContent();
      
      expect(parseFloat(minPrice || '0')).toBeLessThanOrEqual(parseFloat(avgPrice || '0'));
      expect(parseFloat(avgPrice || '0')).toBeLessThanOrEqual(parseFloat(maxPrice || '0'));
    });
  });
});