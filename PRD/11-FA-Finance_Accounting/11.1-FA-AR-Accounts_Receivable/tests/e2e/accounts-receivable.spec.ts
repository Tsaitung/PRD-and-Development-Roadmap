import { test, expect } from '@playwright/test';
import { testDataBuilders } from '../setup';

test.describe('FA-AR Accounts Receivable E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to accounts receivable
    await page.goto('/login');
    await page.fill('input[name="username"]', 'finance_manager');
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    await page.click('text=應收帳款');
    await page.waitForURL('/finance/accounts-receivable');
  });

  test.describe('Invoice Lifecycle', () => {
    test('should complete full invoice lifecycle from creation to payment', async ({ page }) => {
      // Create new invoice
      await page.click('button:has-text("新增發票")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Select customer
      await page.selectOption('select[name="customer_id"]', 'CUST_001');
      await page.waitForTimeout(500);

      // Add invoice items
      await page.click('button:has-text("新增項目")');
      
      await page.selectOption('select[name="product_0"]', 'PROD_001');
      await page.fill('input[name="quantity_0"]', '100');
      await page.fill('input[name="unit_price_0"]', '500');
      
      await page.click('button:has-text("新增項目")');
      await page.selectOption('select[name="product_1"]', 'PROD_002');
      await page.fill('input[name="quantity_1"]', '50');
      await page.fill('input[name="unit_price_1"]', '1000');

      // Set payment terms
      await page.selectOption('select[name="payment_terms"]', 'net_30');
      
      // Set discount
      await page.fill('input[name="discount_amount"]', '2000');
      
      // Add notes
      await page.fill('textarea[name="notes"]', '月結30天，2%折扣');
      
      // Save invoice
      await page.click('button:has-text("儲存發票")');
      
      // Verify invoice created
      await expect(page.locator('text=發票已成功建立')).toBeVisible();
      const invoiceNumber = await page.locator('[data-testid="invoice-number"]').textContent();
      
      // Send invoice to customer
      await page.click(`[data-testid="send-${invoiceNumber}"]`);
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveValue('billing@test.com');
      
      await page.fill('textarea[name="message"]', '請查收本月發票，謝謝。');
      await page.click('button:has-text("確認發送")');
      
      await expect(page.locator('text=發票已發送')).toBeVisible();
      
      // Record partial payment
      await page.click(`[data-testid="payment-${invoiceNumber}"]`);
      await expect(page.locator('h2:has-text("記錄付款")')).toBeVisible();
      
      await page.click('input[value="partial"]');
      await page.fill('input[name="amount"]', '50000');
      await page.fill('input[name="payment_date"]', '2025-08-15');
      await page.selectOption('select[name="payment_method"]', 'bank_transfer');
      await page.fill('input[name="reference_number"]', 'BANK-REF-001');
      await page.fill('input[name="bank_name"]', '測試銀行');
      await page.fill('input[name="bank_account"]', '123-456-789');
      
      await page.click('button:has-text("確認付款")');
      await expect(page.locator('text=付款已記錄')).toBeVisible();
      
      // Verify balance updated
      const balanceCell = page.locator(`[data-testid="balance-${invoiceNumber}"]`);
      await expect(balanceCell).toContainText('NT$ 48,000');
      
      // Record final payment
      await page.click(`[data-testid="payment-${invoiceNumber}"]`);
      await page.click('input[value="full"]');
      await page.fill('input[name="payment_date"]', '2025-08-25');
      await page.selectOption('select[name="payment_method"]', 'bank_transfer');
      await page.fill('input[name="reference_number"]', 'BANK-REF-002');
      
      await page.click('button:has-text("確認付款")');
      await expect(page.locator('text=發票已完全付清')).toBeVisible();
      
      // Verify status changed to paid
      const statusBadge = page.locator(`[data-testid="status-${invoiceNumber}"]`);
      await expect(statusBadge).toHaveText('已付款');
    });

    test('should handle credit memo and refund process', async ({ page }) => {
      // Find paid invoice
      await page.click('[data-testid="filter-status"]');
      await page.selectOption('select[name="status"]', 'paid');
      
      const invoiceRow = page.locator('[data-testid^="invoice-row-"]').first();
      const invoiceNumber = await invoiceRow.locator('[data-testid="invoice-number"]').textContent();
      
      // Create credit memo
      await invoiceRow.locator('button:has-text("更多")').click();
      await page.click('text=建立信用憑證');
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('建立信用憑證');
      
      // Select items to credit
      await page.check('input[name="item_0"]');
      await page.fill('input[name="credit_quantity_0"]', '10');
      
      await page.selectOption('select[name="reason"]', 'product_return');
      await page.fill('textarea[name="reason_details"]', '產品品質問題，客戶退貨');
      
      await page.click('button:has-text("建立信用憑證")');
      await expect(page.locator('text=信用憑證已建立')).toBeVisible();
      
      // Apply credit to new invoice
      await page.click('button:has-text("新增發票")');
      await page.selectOption('select[name="customer_id"]', 'CUST_001');
      
      // Check for available credits
      await expect(page.locator('[data-testid="available-credits"]')).toBeVisible();
      await page.check('input[name="apply_credit"]');
      
      // Continue with invoice creation
      await page.click('button:has-text("新增項目")');
      await page.selectOption('select[name="product_0"]', 'PROD_003');
      await page.fill('input[name="quantity_0"]', '20');
      await page.fill('input[name="unit_price_0"]', '800');
      
      await page.click('button:has-text("儲存發票")');
      
      // Verify credit applied
      await expect(page.locator('text=信用額已套用')).toBeVisible();
    });
  });

  test.describe('Customer Account Management', () => {
    test('should manage customer credit and statements', async ({ page }) => {
      // Navigate to customer accounts
      await page.click('a:has-text("客戶帳戶")');
      
      // Search for customer
      await page.fill('input[placeholder="搜尋客戶"]', '測試客戶A');
      await page.waitForTimeout(500);
      
      // Click on customer
      await page.click('[data-testid="customer-CUST_001"]');
      
      // Check account details
      await expect(page.locator('h2')).toContainText('測試客戶A');
      await expect(page.locator('[data-testid="credit-limit"]')).toContainText('NT$ 500,000');
      await expect(page.locator('[data-testid="credit-used"]')).toContainText('NT$ 150,000');
      
      // Adjust credit limit
      await page.click('button:has-text("調整信用額度")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.fill('input[name="new_limit"]', '600000');
      await page.fill('textarea[name="reason"]', '客戶業務量成長，調高信用額度');
      await page.selectOption('select[name="approval_level"]', 'manager');
      
      await page.click('button:has-text("確認調整")');
      await expect(page.locator('text=信用額度已更新')).toBeVisible();
      await expect(page.locator('[data-testid="credit-limit"]')).toContainText('NT$ 600,000');
      
      // Generate statement
      await page.click('button:has-text("產生對帳單")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.fill('input[name="period_start"]', '2025-08-01');
      await page.fill('input[name="period_end"]', '2025-08-31');
      await page.check('input[name="include_paid"]');
      
      await page.click('button:has-text("產生")');
      
      // Wait for statement generation
      await expect(page.locator('[data-testid="statement-preview"]')).toBeVisible();
      
      // Verify statement content
      await expect(page.locator('h3')).toContainText('客戶對帳單');
      await expect(page.locator('[data-testid="statement-period"]')).toContainText('2025-08-01 至 2025-08-31');
      
      // Send statement
      await page.click('button:has-text("發送對帳單")');
      await page.fill('input[name="cc_email"]', 'manager@test.com');
      await page.click('button:has-text("確認發送")');
      
      await expect(page.locator('text=對帳單已發送')).toBeVisible();
    });

    test('should track payment history and patterns', async ({ page }) => {
      // Navigate to customer
      await page.click('a:has-text("客戶帳戶")');
      await page.click('[data-testid="customer-CUST_001"]');
      
      // Go to payment history tab
      await page.click('button:has-text("付款歷史")');
      
      // Check payment metrics
      await expect(page.locator('[data-testid="on-time-rate"]')).toContainText('85%');
      await expect(page.locator('[data-testid="avg-days-to-pay"]')).toContainText('28 天');
      await expect(page.locator('[data-testid="total-paid"]')).toContainText('NT$ 1,500,000');
      
      // View payment trend chart
      await expect(page.locator('[data-testid="payment-trend-chart"]')).toBeVisible();
      
      // Filter by date range
      await page.fill('input[name="date_from"]', '2025-01-01');
      await page.fill('input[name="date_to"]', '2025-08-31');
      await page.click('button:has-text("篩選")');
      
      // Check filtered results
      await expect(page.locator('[data-testid="payment-list"] tr')).toHaveCount(45);
    });
  });

  test.describe('Aging Analysis and Collections', () => {
    test('should analyze aging and initiate collections', async ({ page }) => {
      // Navigate to aging report
      await page.click('a:has-text("帳齡分析")');
      
      // Check aging summary
      await expect(page.locator('[data-testid="aging-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-amount"]')).toContainText('NT$ 500,000');
      await expect(page.locator('[data-testid="overdue-1-30"]')).toContainText('NT$ 150,000');
      await expect(page.locator('[data-testid="overdue-31-60"]')).toContainText('NT$ 80,000');
      
      // View aging chart
      await expect(page.locator('[data-testid="aging-chart"]')).toBeVisible();
      
      // Filter high risk customers
      await page.selectOption('select[name="risk_level"]', 'high');
      
      // Initiate collection for overdue account
      const overdueCustomer = page.locator('[data-testid="customer-row"]').filter({ hasText: '逾期 45 天' });
      await overdueCustomer.locator('button:has-text("開始催收")').click();
      
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('建立催收案件');
      
      // Set collection priority
      await page.selectOption('select[name="priority"]', 'high');
      await page.selectOption('select[name="assigned_to"]', 'COLLECTOR_001');
      await page.fill('textarea[name="notes"]', '客戶多次逾期，需要積極跟進');
      
      await page.click('button:has-text("建立案件")');
      await expect(page.locator('text=催收案件已建立')).toBeVisible();
    });

    test('should manage collection workflow', async ({ page }) => {
      // Navigate to collections
      await page.click('a:has-text("催收管理")');
      
      // Open collection case
      await page.click('[data-testid="case-COLL_TEST_001"]');
      
      // Check case details
      await expect(page.locator('h2')).toContainText('COLL-2025-08-001');
      await expect(page.locator('[data-testid="outstanding-amount"]')).toContainText('NT$ 50,000');
      await expect(page.locator('[data-testid="days-overdue"]')).toContainText('45 天');
      
      // Add phone call action
      await page.click('button:has-text("記錄行動")');
      await page.selectOption('select[name="action_type"]', 'phone_call');
      await page.fill('textarea[name="description"]', '致電客戶，承諾下週付款');
      await page.fill('input[name="next_action_date"]', '2025-08-27');
      await page.click('button:has-text("儲存")');
      
      // Send dunning letter
      await page.click('button:has-text("發送催收信")');
      await page.selectOption('select[name="template"]', 'reminder_2');
      
      // Preview letter
      await page.click('button:has-text("預覽")');
      await expect(page.locator('[data-testid="letter-preview"]')).toBeVisible();
      
      // Send letter
      await page.click('button:has-text("發送")');
      await expect(page.locator('text=催收信已發送')).toBeVisible();
      
      // Create payment plan
      await page.click('button:has-text("建立付款計畫")');
      await page.fill('input[name="total_amount"]', '50000');
      await page.fill('input[name="installments"]', '3');
      await page.fill('input[name="start_date"]', '2025-09-01');
      
      // Review installment schedule
      await page.click('button:has-text("計算分期")');
      await expect(page.locator('[data-testid="installment-schedule"]')).toBeVisible();
      
      // Confirm plan
      await page.click('button:has-text("確認計畫")');
      await expect(page.locator('text=付款計畫已建立')).toBeVisible();
    });
  });

  test.describe('Bank Reconciliation', () => {
    test('should perform bank reconciliation', async ({ page }) => {
      // Navigate to reconciliation
      await page.click('a:has-text("銀行對帳")');
      
      // Import bank statement
      await page.click('button:has-text("匯入對帳單")');
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/bank_statement.csv');
      
      await page.click('button:has-text("開始匯入")');
      await expect(page.locator('text=對帳單已匯入')).toBeVisible();
      
      // Check reconciliation status
      await expect(page.locator('[data-testid="total-transactions"]')).toContainText('48');
      await expect(page.locator('[data-testid="matched-count"]')).toContainText('45');
      await expect(page.locator('[data-testid="unmatched-count"]')).toContainText('3');
      
      // Manual matching
      await page.click('button:has-text("未配對交易")');
      
      const unmatchedTrans = page.locator('[data-testid="unmatched-trans-001"]');
      await unmatchedTrans.click();
      
      // Search for matching payment
      await page.fill('input[placeholder="搜尋付款"]', '49970');
      const paymentOption = page.locator('[data-testid="payment-option"]').first();
      await paymentOption.click();
      
      await page.click('button:has-text("配對")');
      await expect(page.locator('text=交易已配對')).toBeVisible();
      
      // Handle discrepancy
      const discrepancyTrans = page.locator('[data-testid="discrepancy-trans"]').first();
      await discrepancyTrans.click();
      
      await page.click('button:has-text("建立調整")');
      await page.selectOption('select[name="adjustment_type"]', 'bank_fee');
      await page.fill('input[name="amount"]', '30');
      await page.fill('textarea[name="description"]', '銀行手續費');
      
      await page.click('button:has-text("儲存調整")');
      
      // Complete reconciliation
      await page.click('button:has-text("完成對帳")');
      await page.fill('textarea[name="notes"]', '8月份對帳完成，差異已調整');
      await page.click('button:has-text("確認完成")');
      
      await expect(page.locator('text=對帳已完成')).toBeVisible();
      await expect(page.locator('[data-testid="status-badge"]')).toHaveText('已完成');
    });
  });

  test.describe('Tax Reporting', () => {
    test('should generate and file tax report', async ({ page }) => {
      // Navigate to tax reporting
      await page.click('a:has-text("稅務報表")');
      
      // Generate monthly tax report
      await page.click('button:has-text("產生報表")');
      await page.selectOption('select[name="report_type"]', 'output_tax');
      await page.selectOption('select[name="period"]', '2025-08');
      
      await page.click('button:has-text("產生")');
      
      // Wait for report generation
      await page.waitForSelector('[data-testid="tax-report-preview"]');
      
      // Verify report content
      await expect(page.locator('[data-testid="total-sales"]')).toContainText('NT$ 2,000,000');
      await expect(page.locator('[data-testid="taxable-sales"]')).toContainText('NT$ 1,900,000');
      await expect(page.locator('[data-testid="tax-collected"]')).toContainText('NT$ 95,000');
      await expect(page.locator('[data-testid="net-tax-payable"]')).toContainText('NT$ 90,000');
      
      // Review transactions
      await page.click('button:has-text("交易明細")');
      await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
      
      // Export report
      await page.click('button:has-text("匯出")');
      await page.selectOption('select[name="format"]', 'pdf');
      
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('tax_report_2025_08');
      
      // File tax report
      await page.click('button:has-text("申報")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.check('input[name="confirm_accuracy"]');
      await page.fill('input[name="authorized_by"]', 'CFO_001');
      
      await page.click('button:has-text("確認申報")');
      
      // Wait for filing confirmation
      await expect(page.locator('text=申報成功')).toBeVisible();
      await expect(page.locator('[data-testid="reference-number"]')).toContainText('TAX-REF-');
      await expect(page.locator('[data-testid="filing-status"]')).toHaveText('已申報');
    });
  });

  test.describe('Dashboard and Analytics', () => {
    test('should display AR dashboard with key metrics', async ({ page }) => {
      // Check dashboard metrics
      await expect(page.locator('[data-testid="total-outstanding"]')).toContainText('NT$ 780,000');
      await expect(page.locator('[data-testid="overdue-amount"]')).toContainText('NT$ 280,000');
      await expect(page.locator('[data-testid="collection-rate"]')).toContainText('84%');
      await expect(page.locator('[data-testid="avg-days-to-pay"]')).toContainText('32 天');
      
      // Check charts
      await expect(page.locator('[data-testid="aging-pie-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="collection-trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-trend-chart"]')).toBeVisible();
      
      // Check alerts
      const alertsPanel = page.locator('[data-testid="alerts-panel"]');
      await expect(alertsPanel).toContainText('5 個客戶超過信用額度');
      await expect(alertsPanel).toContainText('8 張發票即將逾期');
      
      // Navigate to detailed analytics
      await page.click('button:has-text("詳細分析")');
      
      // Check DSO trend
      await expect(page.locator('[data-testid="dso-trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-dso"]')).toContainText('35 天');
      
      // Check customer analysis
      await page.click('button:has-text("客戶分析")');
      await expect(page.locator('[data-testid="customer-ranking"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-behavior-matrix"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Navigate to invoices
      await page.click('text=發票管理');
      
      // Check mobile layout
      await expect(page.locator('[data-testid="invoice-cards"]')).toBeVisible();
      
      // Create invoice on mobile
      await page.click('[data-testid="mobile-add-button"]');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Fill form with touch-friendly controls
      await page.selectOption('select[name="customer_id"]', 'CUST_001');
      await page.click('button:has-text("新增項目")');
      
      // Use number pad for amount
      await page.fill('input[name="amount"]', '50000');
      
      // Save
      await page.click('button:has-text("儲存")');
      await expect(page.locator('text=發票已建立')).toBeVisible();
      
      // Check swipe actions
      const invoiceCard = page.locator('[data-testid="invoice-card"]').first();
      await invoiceCard.swipe('left');
      await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    });
  });
});