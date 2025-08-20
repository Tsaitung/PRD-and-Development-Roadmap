import { test, expect, Page } from '@playwright/test';

test.describe('Customer Search and Filter E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/customers');
    await page.waitForSelector('[data-testid="customer-management"]');
  });

  test.describe('Advanced Search', () => {
    test('should search with multiple filters', async () => {
      // Select company type
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      
      // Apply filters
      await page.selectOption('[data-testid="invoice-type-filter"]', 'B2B');
      await page.fill('[data-testid="closing-date-filter"]', '25');
      await page.selectOption('[data-testid="payment-term-filter"]', '30');
      
      // Search
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      // Verify filtered results
      await page.waitForSelector('[data-testid="search-results"]');
      
      const results = await page.locator('[data-testid^="company-"]').count();
      expect(results).toBeGreaterThan(0);
      
      // Verify all results match filters
      for (let i = 0; i < results; i++) {
        const invoiceType = await page.locator(`[data-testid="invoice-type-${i}"]`).textContent();
        expect(invoiceType).toContain('B2B');
      }
    });

    test('should search with date range', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      
      // Set date range
      await page.fill('[data-testid="start-date"]', '2025-01-01');
      await page.fill('[data-testid="end-date"]', '2025-06-30');
      
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      const results = await page.locator('[data-testid^="store-"]').count();
      expect(results).toBeGreaterThan(0);
    });

    test('should filter by completion status', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'enterprise');
      
      // Check incomplete only
      await page.check('[data-testid="incomplete-only-checkbox"]');
      
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      const results = await page.locator('[data-testid^="enterprise-"]').count();
      
      for (let i = 0; i < results; i++) {
        const status = await page.locator(`[data-testid="completion-${i}"]`).textContent();
        expect(status).toContain('未完整');
      }
    });

    test('should clear filters', async () => {
      // Apply multiple filters
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      await page.selectOption('[data-testid="invoice-type-filter"]', 'B2B');
      await page.fill('[data-testid="closing-date-filter"]', '25');
      await page.check('[data-testid="incomplete-only-checkbox"]');
      
      // Clear all filters
      await page.click('[data-testid="clear-filters-btn"]');
      
      // Verify filters are cleared
      expect(await page.inputValue('[data-testid="invoice-type-filter"]')).toBe('');
      expect(await page.inputValue('[data-testid="closing-date-filter"]')).toBe('');
      expect(await page.isChecked('[data-testid="incomplete-only-checkbox"]')).toBe(false);
    });
  });

  test.describe('Search History', () => {
    test('should save and suggest recent searches', async () => {
      // First search
      await page.fill('[data-testid="search-input"]', 'first search');
      await page.click('[data-testid="search-btn"]');
      await page.waitForTimeout(500);
      
      // Second search
      await page.fill('[data-testid="search-input"]', 'second search');
      await page.click('[data-testid="search-btn"]');
      await page.waitForTimeout(500);
      
      // Clear input and check history
      await page.fill('[data-testid="search-input"]', '');
      await page.focus('[data-testid="search-input"]');
      
      // History dropdown should appear
      await page.waitForSelector('[data-testid="search-history-dropdown"]');
      
      const historyItems = await page.locator('[data-testid^="history-item-"]').count();
      expect(historyItems).toBe(2);
      
      // Click on history item
      await page.click('[data-testid="history-item-0"]');
      
      // Should fill the search input
      const inputValue = await page.inputValue('[data-testid="search-input"]');
      expect(inputValue).toBe('second search');
    });

    test('should clear search history', async () => {
      // Create some history
      await page.fill('[data-testid="search-input"]', 'test search');
      await page.click('[data-testid="search-btn"]');
      
      // Open history
      await page.fill('[data-testid="search-input"]', '');
      await page.focus('[data-testid="search-input"]');
      
      await page.waitForSelector('[data-testid="search-history-dropdown"]');
      
      // Clear history
      await page.click('[data-testid="clear-history-btn"]');
      
      // History should be empty
      const emptyMessage = await page.locator('[data-testid="no-history"]').textContent();
      expect(emptyMessage).toContain('無搜尋記錄');
    });
  });

  test.describe('Export Results', () => {
    test('should export search results to Excel', async () => {
      // Search for data
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Start download promise before clicking
      const downloadPromise = page.waitForEvent('download');
      
      // Export results
      await page.click('[data-testid="export-results-btn"]');
      await page.selectOption('[data-testid="export-format"]', 'excel');
      await page.click('[data-testid="confirm-export-btn"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.xlsx');
    });

    test('should export filtered results only', async () => {
      // Apply filters
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      await page.selectOption('[data-testid="active-status-filter"]', 'active');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      const visibleResults = await page.locator('[data-testid^="store-"]').count();
      
      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-results-btn"]');
      await page.selectOption('[data-testid="export-format"]', 'csv');
      await page.click('[data-testid="confirm-export-btn"]');
      
      const download = await downloadPromise;
      
      // The filename should indicate filtered export
      expect(download.suggestedFilename()).toContain('filtered');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Pagination', () => {
    test('should paginate through results', async () => {
      // Search to get many results
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="pagination"]');
      
      // Check first page
      const firstPageContent = await page.locator('[data-testid="store-0"]').textContent();
      
      // Go to next page
      await page.click('[data-testid="next-page-btn"]');
      
      await page.waitForTimeout(500);
      
      // Content should be different
      const secondPageContent = await page.locator('[data-testid="store-0"]').textContent();
      expect(secondPageContent).not.toBe(firstPageContent);
      
      // Go back to first page
      await page.click('[data-testid="prev-page-btn"]');
      
      await page.waitForTimeout(500);
      
      // Should see original content
      const backToFirstContent = await page.locator('[data-testid="store-0"]').textContent();
      expect(backToFirstContent).toBe(firstPageContent);
    });

    test('should change page size', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      await page.click('[data-testid="search-btn"]');
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Default page size (e.g., 10)
      let visibleResults = await page.locator('[data-testid^="company-"]').count();
      expect(visibleResults).toBeLessThanOrEqual(10);
      
      // Change page size to 25
      await page.selectOption('[data-testid="page-size-select"]', '25');
      
      await page.waitForTimeout(500);
      
      // Should show more results
      visibleResults = await page.locator('[data-testid^="company-"]').count();
      expect(visibleResults).toBeLessThanOrEqual(25);
    });
  });
});