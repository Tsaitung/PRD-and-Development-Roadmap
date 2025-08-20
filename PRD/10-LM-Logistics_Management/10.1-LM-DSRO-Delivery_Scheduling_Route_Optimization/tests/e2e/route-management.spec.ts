import { test, expect } from '@playwright/test';
import { testDataBuilders } from '../setup';

test.describe('LM-DSRO Route Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to route management
    await page.goto('/login');
    await page.fill('input[name="username"]', 'logistics_manager');
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    await page.click('text=路線管理');
    await page.waitForURL('/logistics/routes');
  });

  test.describe('Route Planning', () => {
    test('should create optimized routes for daily deliveries', async ({ page }) => {
      // Check pending orders
      await expect(page.locator('h2')).toContainText('待排程訂單');
      await expect(page.locator('[data-testid="pending-orders-count"]')).toContainText('40');

      // Open optimization dialog
      await page.click('button:has-text("優化路線")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Configure optimization parameters
      await page.fill('input[name="max_distance"]', '100');
      await page.fill('input[name="max_duration"]', '480');
      await page.fill('input[name="max_stops"]', '12');

      // Select optimization goals
      await page.check('input[name="minimize_distance"]');
      await page.check('input[name="maximize_on_time"]');

      // Select available resources
      const driversSection = page.locator('[data-testid="drivers-selection"]');
      await expect(driversSection.locator('input[type="checkbox"]')).toHaveCount(5);
      
      // Start optimization
      await page.click('button:has-text("開始優化")');
      
      // Wait for optimization to complete
      await expect(page.locator('text=優化中')).toBeVisible();
      await expect(page.locator('text=優化完成')).toBeVisible({ timeout: 10000 });
      
      // Check results
      await expect(page.locator('text=產生 5 條路線')).toBeVisible();
      await expect(page.locator('text=節省 18%')).toBeVisible();
      
      // Apply optimization
      await page.click('button:has-text("套用優化結果")');
      await expect(page.locator('text=路線已建立')).toBeVisible();
    });

    test('should manually create and adjust route', async ({ page }) => {
      // Open manual routing
      await page.click('button:has-text("手動排程")');
      
      // Select driver and vehicle
      await page.selectOption('select[name="driver"]', 'DRV_001');
      await page.selectOption('select[name="vehicle"]', 'VEH_001');
      
      // Add orders to route by dragging
      const orderList = page.locator('[data-testid="available-orders"]');
      const routeBuilder = page.locator('[data-testid="route-builder"]');
      
      const order1 = orderList.locator('[data-order-id="ORD_001"]');
      const order2 = orderList.locator('[data-order-id="ORD_002"]');
      
      await order1.dragTo(routeBuilder);
      await order2.dragTo(routeBuilder);
      
      // Reorder stops
      const stop2 = routeBuilder.locator('[data-stop-sequence="2"]');
      const stop1 = routeBuilder.locator('[data-stop-sequence="1"]');
      await stop2.dragTo(stop1);
      
      // Verify route details
      await expect(page.locator('[data-testid="total-distance"]')).toContainText('km');
      await expect(page.locator('[data-testid="estimated-time"]')).toContainText('分鐘');
      
      // Save route
      await page.click('button:has-text("建立路線")');
      await expect(page.locator('text=路線已建立')).toBeVisible();
    });

    test('should validate route constraints', async ({ page }) => {
      // Try to create invalid route
      await page.click('button:has-text("手動排程")');
      
      await page.selectOption('select[name="driver"]', 'DRV_001');
      await page.selectOption('select[name="vehicle"]', 'VEH_SMALL');
      
      // Add too many heavy items
      for (let i = 1; i <= 10; i++) {
        await page.click(`[data-order-id="HEAVY_ORD_${i}"]`);
      }
      
      // Should show capacity warning
      await expect(page.locator('text=超過車輛載重限制')).toBeVisible();
      
      // Should prevent save
      const saveBtn = page.locator('button:has-text("建立路線")');
      await expect(saveBtn).toBeDisabled();
    });
  });

  test.describe('Route Monitoring', () => {
    test('should track active routes in real-time', async ({ page }) => {
      // Navigate to monitoring
      await page.click('a:has-text("路線監控")');
      
      // Check active routes
      await expect(page.locator('[data-testid="active-routes"]')).toBeVisible();
      const routeCards = page.locator('[data-testid^="route-card-"]');
      await expect(routeCards).toHaveCount(3);
      
      // Open route details
      await routeCards.first().click();
      
      // Check real-time tracking
      await expect(page.locator('[data-testid="route-map"]')).toBeVisible();
      await expect(page.locator('[data-testid="driver-location"]')).toBeVisible();
      
      // Check progress
      await expect(page.locator('[data-testid="route-progress"]')).toContainText('3/8');
      
      // Check ETA
      await expect(page.locator('[data-testid="next-stop-eta"]')).toContainText(':');
    });

    test('should handle delivery completion', async ({ page }) => {
      // Open active route
      await page.click('a:has-text("路線監控")');
      await page.click('[data-testid="route-card-ROUTE_002"]');
      
      // Navigate to current stop
      await page.click('button:has-text("當前站點")');
      
      // Complete delivery
      await page.click('button:has-text("完成配送")');
      
      // Add signature
      const canvas = page.locator('[data-testid="signature-pad"]');
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 150, box.y + 100);
        await page.mouse.move(box.x + 100, box.y + 150);
        await page.mouse.up();
      }
      
      // Take photo (mock)
      await page.click('button:has-text("拍照")');
      await page.waitForTimeout(500);
      
      // Confirm completion
      await page.click('button:has-text("確認完成")');
      
      // Verify update
      await expect(page.locator('text=配送已完成')).toBeVisible();
      await expect(page.locator('[data-testid="route-progress"]')).toContainText('4/8');
    });

    test('should report and handle delivery issues', async ({ page }) => {
      // Open route tracking
      await page.click('a:has-text("路線監控")');
      await page.click('[data-testid="route-card-ROUTE_002"]');
      
      // Report issue
      await page.click('button:has-text("回報問題")');
      
      // Fill issue form
      await page.selectOption('select[name="issue_type"]', 'customer_unavailable');
      await page.fill('textarea[name="description"]', '客戶不在家，已嘗試聯絡');
      await page.selectOption('select[name="action"]', 'skip_return_later');
      
      // Submit issue
      await page.click('button:has-text("提交")');
      
      // Verify issue logged
      await expect(page.locator('text=問題已回報')).toBeVisible();
      await expect(page.locator('[data-testid="issue-badge"]')).toBeVisible();
      
      // Manager should see alert
      await page.goto('/logistics/routes/monitoring');
      await expect(page.locator('[data-testid="issue-alert"]')).toBeVisible();
    });
  });

  test.describe('Route Optimization', () => {
    test('should compare different optimization scenarios', async ({ page }) => {
      // Go to optimization comparison
      await page.click('button:has-text("優化分析")');
      
      // Run different scenarios
      await page.click('button:has-text("執行比較")');
      
      // Wait for results
      await page.waitForSelector('[data-testid="comparison-results"]');
      
      // Check scenarios
      const scenarios = page.locator('[data-testid^="scenario-"]');
      await expect(scenarios).toHaveCount(3);
      
      // Verify metrics
      await expect(page.locator('text=最短距離方案')).toBeVisible();
      await expect(page.locator('text=1020 km')).toBeVisible();
      
      await expect(page.locator('text=準時率優先')).toBeVisible();
      await expect(page.locator('text=95%')).toBeVisible();
      
      await expect(page.locator('text=成本最優')).toBeVisible();
      await expect(page.locator('text=$15,800')).toBeVisible();
      
      // Select best scenario
      await page.click('[data-scenario="cost_optimal"] button:has-text("選擇此方案")');
      await expect(page.locator('text=方案已選擇')).toBeVisible();
    });

    test('should adjust routes based on real-time conditions', async ({ page }) => {
      // Open active routes
      await page.click('a:has-text("路線監控")');
      
      // Simulate traffic delay alert
      await page.waitForSelector('[data-testid="delay-alert"]');
      await page.click('[data-testid="delay-alert"]');
      
      // Open re-optimization
      await page.click('button:has-text("重新優化")');
      
      // Adjust for traffic
      await page.check('input[name="avoid_traffic"]');
      await page.click('button:has-text("優化剩餘路線")');
      
      // Wait for new route
      await page.waitForSelector('text=路線已調整');
      
      // Verify new ETA
      await expect(page.locator('[data-testid="updated-eta"]')).toBeVisible();
    });
  });

  test.describe('Driver Management', () => {
    test('should manage driver assignments', async ({ page }) => {
      // Go to driver management
      await page.click('a:has-text("司機管理")');
      
      // Check driver list
      const driverTable = page.locator('[data-testid="drivers-table"]');
      await expect(driverTable).toBeVisible();
      
      // Filter available drivers
      await page.selectOption('select[name="status_filter"]', 'available');
      
      // Assign route to driver
      const driverRow = driverTable.locator('tr').filter({ hasText: '張司機' });
      await driverRow.locator('button:has-text("分配路線")').click();
      
      // Select route
      await page.selectOption('select[name="route"]', 'ROUTE_NEW_001');
      await page.click('button:has-text("確認分配")');
      
      // Verify assignment
      await expect(page.locator('text=路線已分配')).toBeVisible();
      await expect(driverRow).toContainText('配送中');
    });

    test('should track driver performance', async ({ page }) => {
      // Go to driver analytics
      await page.click('a:has-text("司機管理")');
      await page.click('a:has-text("績效分析")');
      
      // Select driver
      await page.selectOption('select[name="driver"]', 'DRV_001');
      
      // Check metrics
      await expect(page.locator('[data-testid="delivery-rate"]')).toContainText('95%');
      await expect(page.locator('[data-testid="avg-delivery-time"]')).toContainText('分鐘');
      await expect(page.locator('[data-testid="customer-rating"]')).toContainText('4.8');
      
      // View detailed report
      await page.click('button:has-text("詳細報表")');
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('should generate daily route report', async ({ page }) => {
      // Go to reports
      await page.click('a:has-text("報表分析")');
      
      // Select report type
      await page.selectOption('select[name="report_type"]', 'daily_summary');
      await page.fill('input[name="report_date"]', '2025-08-20');
      
      // Generate report
      await page.click('button:has-text("產生報表")');
      
      // Wait for report
      await page.waitForSelector('[data-testid="report-content"]');
      
      // Verify sections
      await expect(page.locator('h3:has-text("路線統計")')).toBeVisible();
      await expect(page.locator('text=總路線數: 25')).toBeVisible();
      await expect(page.locator('text=準時率: 92.5%')).toBeVisible();
      
      // Export report
      await page.click('button:has-text("匯出PDF")');
      
      // Wait for download
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('route_report');
    });

    test('should analyze route efficiency trends', async ({ page }) => {
      // Go to analytics
      await page.click('a:has-text("報表分析")');
      await page.click('a:has-text("趨勢分析")');
      
      // Select period
      await page.selectOption('select[name="period"]', 'last_30_days');
      
      // View charts
      await expect(page.locator('[data-testid="efficiency-trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="cost-trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="delivery-rate-chart"]')).toBeVisible();
      
      // Check insights
      await expect(page.locator('[data-testid="insights-panel"]')).toBeVisible();
      await expect(page.locator('text=建議優化')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile driver app', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login as driver
      await page.goto('/driver/login');
      await page.fill('input[name="driver_id"]', 'DRV_001');
      await page.fill('input[name="password"]', 'driver_pass');
      await page.click('button:has-text("登入")');
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="route-summary"]')).toBeVisible();
      
      // Start route
      await page.click('button:has-text("開始配送")');
      
      // Navigate to stop
      await page.click('[data-testid="next-stop-card"]');
      await page.click('button:has-text("導航")');
      
      // Complete delivery with touch gestures
      await page.click('button:has-text("到達")');
      await page.click('button:has-text("完成配送")');
      
      // Sign with touch
      const canvas = page.locator('[data-testid="signature-pad"]');
      const box = await canvas.boundingBox();
      if (box) {
        await page.touchscreen.tap(box.x + 50, box.y + 50);
        for (let i = 0; i < 5; i++) {
          await page.touchscreen.tap(box.x + 50 + i * 20, box.y + 50 + i * 10);
        }
      }
      
      await page.click('button:has-text("確認")');
      await expect(page.locator('text=配送完成')).toBeVisible();
    });
  });
});