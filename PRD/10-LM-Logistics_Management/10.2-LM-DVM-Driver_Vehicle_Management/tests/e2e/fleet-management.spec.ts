import { test, expect } from '@playwright/test';
import { testDataBuilders } from '../setup';

test.describe('LM-DVM Fleet Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to fleet management
    await page.goto('/login');
    await page.fill('input[name="username"]', 'fleet_manager');
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    await page.click('text=車隊管理');
    await page.waitForURL('/fleet/management');
  });

  test.describe('Driver Management', () => {
    test('should complete full driver onboarding process', async ({ page }) => {
      // Click add driver
      await page.click('button:has-text("新增司機")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Fill personal information
      await page.fill('input[name="name"]', '張大明');
      await page.fill('input[name="phone"]', '0912-345-678');
      await page.fill('input[name="email"]', 'zhang@example.com');
      await page.fill('input[name="id_number"]', 'A123456789');
      
      // Fill license information
      await page.fill('input[name="license_number"]', 'DL-987654321');
      await page.selectOption('select[name="license_type"]', 'professional');
      await page.fill('input[name="license_expiry"]', '2027-12-31');
      
      // Upload documents
      const licenseFile = await page.locator('input[name="license_file"]');
      await licenseFile.setInputFiles('tests/fixtures/license.pdf');
      
      const healthFile = await page.locator('input[name="health_certificate"]');
      await healthFile.setInputFiles('tests/fixtures/health.pdf');
      
      // Fill emergency contact
      await page.fill('input[name="emergency_name"]', '張太太');
      await page.fill('input[name="emergency_phone"]', '0923-456-789');
      await page.selectOption('select[name="emergency_relationship"]', 'spouse');
      
      // Submit form
      await page.click('button:has-text("儲存")');
      
      // Verify success
      await expect(page.locator('text=司機已成功新增')).toBeVisible();
      await expect(page.locator('text=張大明')).toBeVisible();
    });

    test('should manage driver schedule and assignments', async ({ page }) => {
      // Navigate to driver details
      await page.click('[data-testid="driver-row-DRV_001"]');
      await expect(page.locator('h2:has-text("司機詳情")')).toBeVisible();
      
      // Create schedule
      await page.click('button:has-text("排班")');
      await page.selectOption('select[name="week"]', '2025-W35');
      
      // Set shifts for the week
      for (let day = 1; day <= 5; day++) {
        await page.selectOption(`select[name="shift_day_${day}"]`, 'morning');
        await page.selectOption(`select[name="vehicle_day_${day}"]`, 'VEH_001');
      }
      
      await page.click('button:has-text("儲存排班")');
      await expect(page.locator('text=排班已儲存')).toBeVisible();
      
      // Verify schedule appears
      await expect(page.locator('[data-testid="schedule-calendar"]')).toContainText('早班');
    });

    test('should track driver performance metrics', async ({ page }) => {
      // Go to performance tab
      await page.click('a:has-text("績效分析")');
      
      // Select driver
      await page.selectOption('select[name="driver"]', 'DRV_001');
      
      // Select period
      await page.selectOption('select[name="period"]', 'monthly');
      
      // Verify metrics display
      await expect(page.locator('[data-testid="on-time-rate"]')).toContainText('95.5%');
      await expect(page.locator('[data-testid="customer-rating"]')).toContainText('4.8');
      await expect(page.locator('[data-testid="safety-score"]')).toContainText('98');
      
      // View detailed breakdown
      await page.click('button:has-text("詳細報表")');
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
      
      // Export report
      await page.click('button:has-text("匯出")');
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('driver_performance');
    });

    test('should handle leave requests and substitutions', async ({ page }) => {
      // Submit leave request
      await page.click('button:has-text("請假申請")');
      
      await page.selectOption('select[name="driver"]', 'DRV_001');
      await page.selectOption('select[name="leave_type"]', 'annual');
      await page.fill('input[name="start_date"]', '2025-09-01');
      await page.fill('input[name="end_date"]', '2025-09-03');
      await page.fill('textarea[name="reason"]', '家庭旅遊');
      
      await page.click('button:has-text("提交")');
      await expect(page.locator('text=請假申請已提交')).toBeVisible();
      
      // Manager approves with substitute
      await page.click('a:has-text("待審核")');
      await page.click('[data-testid="leave-request-LEAVE_001"]');
      
      await page.selectOption('select[name="substitute"]', 'DRV_002');
      await page.click('button:has-text("核准")');
      
      await expect(page.locator('text=請假已核准')).toBeVisible();
      
      // Verify schedule updated
      await page.goto('/fleet/schedule');
      await expect(page.locator('[data-testid="driver-DRV_002"]')).toContainText('代班');
    });
  });

  test.describe('Vehicle Management', () => {
    test('should register new vehicle with complete details', async ({ page }) => {
      // Navigate to vehicles tab
      await page.click('a:has-text("車輛管理")');
      
      // Add new vehicle
      await page.click('button:has-text("新增車輛")');
      
      // Fill vehicle information
      await page.fill('input[name="plate_number"]', 'TPE-8888');
      await page.fill('input[name="vin"]', 'VIN987654321');
      await page.selectOption('select[name="type"]', 'small_truck');
      await page.fill('input[name="brand"]', 'Mitsubishi');
      await page.fill('input[name="model"]', 'Canter');
      await page.fill('input[name="year"]', '2023');
      
      // Fill specifications
      await page.fill('input[name="capacity_weight"]', '2000');
      await page.fill('input[name="capacity_volume"]', '15');
      await page.selectOption('select[name="fuel_type"]', 'diesel');
      
      // Add features
      await page.check('input[value="gps"]');
      await page.check('input[value="temperature_control"]');
      await page.check('input[value="lift_gate"]');
      
      // Insurance information
      await page.fill('input[name="insurance_policy"]', 'INS-2025-999');
      await page.fill('input[name="insurance_expiry"]', '2026-12-31');
      
      // Registration
      await page.fill('input[name="registration_number"]', 'REG-2023-888');
      await page.fill('input[name="registration_expiry"]', '2025-12-31');
      
      await page.click('button:has-text("儲存")');
      await expect(page.locator('text=車輛已成功新增')).toBeVisible();
    });

    test('should assign vehicle to driver and track usage', async ({ page }) => {
      // Navigate to vehicles
      await page.click('a:has-text("車輛管理")');
      
      // Select available vehicle
      await page.click('[data-testid="vehicle-VEH_001"]');
      
      // Assign to driver
      await page.click('button:has-text("分配車輛")');
      
      await page.selectOption('select[name="driver"]', 'DRV_001');
      await page.fill('input[name="mileage_start"]', '45000');
      await page.fill('input[name="fuel_start"]', '45');
      await page.selectOption('select[name="purpose"]', 'delivery');
      
      await page.click('button:has-text("確認分配")');
      await expect(page.locator('text=車輛已分配')).toBeVisible();
      
      // Simulate usage and return
      await page.waitForTimeout(2000);
      
      // Return vehicle
      await page.click('button:has-text("歸還車輛")');
      
      await page.fill('input[name="mileage_end"]', '45180');
      await page.fill('input[name="fuel_end"]', '28');
      await page.selectOption('select[name="condition"]', 'good');
      await page.fill('textarea[name="notes"]', '正常使用，無異常');
      
      await page.click('button:has-text("確認歸還")');
      
      // Verify usage recorded
      await expect(page.locator('text=車輛已歸還')).toBeVisible();
      await expect(page.locator('[data-testid="usage-history"]')).toContainText('180 km');
      await expect(page.locator('[data-testid="fuel-consumed"]')).toContainText('17 L');
    });

    test('should schedule and track maintenance', async ({ page }) => {
      // Navigate to vehicle details
      await page.click('a:has-text("車輛管理")');
      await page.click('[data-testid="vehicle-VEH_001"]');
      
      // Go to maintenance tab
      await page.click('a:has-text("保養記錄")');
      
      // Schedule maintenance
      await page.click('button:has-text("安排保養")');
      
      await page.fill('input[name="scheduled_date"]', '2025-09-15');
      await page.selectOption('select[name="maintenance_type"]', 'regular');
      await page.fill('input[name="current_mileage"]', '45000');
      await page.fill('textarea[name="description"]', '定期保養');
      
      await page.click('button:has-text("確認安排")');
      await expect(page.locator('text=保養已安排')).toBeVisible();
      
      // Complete maintenance
      await page.click('[data-testid="maintenance-MAINT_001"]');
      await page.click('button:has-text("完成保養")');
      
      await page.fill('input[name="actual_cost"]', '3500');
      await page.fill('textarea[name="work_performed"]', '更換機油、濾芯、檢查煞車');
      await page.fill('input[name="next_service_mileage"]', '50000');
      
      await page.click('button:has-text("確認完成")');
      await expect(page.locator('text=保養已完成')).toBeVisible();
    });

    test('should handle vehicle incident reporting', async ({ page }) => {
      // Report incident
      await page.click('button:has-text("事故回報")');
      
      await page.selectOption('select[name="vehicle"]', 'VEH_001');
      await page.selectOption('select[name="driver"]', 'DRV_001');
      await page.selectOption('select[name="incident_type"]', 'minor_accident');
      
      await page.fill('input[name="incident_date"]', '2025-08-20');
      await page.fill('input[name="incident_time"]', '14:30');
      await page.fill('input[name="location"]', '台北市信義區測試路口');
      
      await page.fill('textarea[name="description"]', '轉彎時與其他車輛輕微擦撞');
      await page.selectOption('select[name="damage_level"]', 'minor');
      
      // Upload photos
      const photo1 = await page.locator('input[name="photo_1"]');
      await photo1.setInputFiles('tests/fixtures/incident1.jpg');
      
      // Add witness
      await page.click('button:has-text("新增目擊者")');
      await page.fill('input[name="witness_name"]', '王先生');
      await page.fill('input[name="witness_phone"]', '0911-222-333');
      
      await page.click('button:has-text("提交報告")');
      await expect(page.locator('text=事故報告已提交')).toBeVisible();
      
      // Insurance claim process
      await page.click('[data-testid="incident-INC_001"]');
      await page.click('button:has-text("申請理賠")');
      
      await page.fill('input[name="claim_number"]', 'CLAIM-2025-001');
      await page.fill('input[name="estimated_cost"]', '15000');
      
      await page.click('button:has-text("提交理賠")');
      await expect(page.locator('text=理賠申請已提交')).toBeVisible();
    });
  });

  test.describe('Fleet Dashboard', () => {
    test('should display real-time fleet overview', async ({ page }) => {
      // Navigate to dashboard
      await page.click('a:has-text("總覽")');
      
      // Verify key metrics
      await expect(page.locator('[data-testid="total-vehicles"]')).toContainText('25');
      await expect(page.locator('[data-testid="active-vehicles"]')).toContainText('20');
      await expect(page.locator('[data-testid="total-drivers"]')).toContainText('30');
      await expect(page.locator('[data-testid="available-drivers"]')).toContainText('22');
      
      // Check utilization rate
      await expect(page.locator('[data-testid="fleet-utilization"]')).toContainText('85%');
      
      // Verify real-time map
      await expect(page.locator('[data-testid="fleet-map"]')).toBeVisible();
      
      // Check for alerts
      const maintenanceAlert = page.locator('[data-testid="maintenance-alert"]');
      if (await maintenanceAlert.isVisible()) {
        await expect(maintenanceAlert).toContainText('輛車需要保養');
      }
    });

    test('should generate and export fleet reports', async ({ page }) => {
      // Go to reports section
      await page.click('a:has-text("報表")');
      
      // Configure report
      await page.selectOption('select[name="report_type"]', 'monthly_summary');
      await page.fill('input[name="report_month"]', '2025-08');
      
      // Select sections to include
      await page.check('input[name="include_drivers"]');
      await page.check('input[name="include_vehicles"]');
      await page.check('input[name="include_performance"]');
      await page.check('input[name="include_costs"]');
      
      // Generate report
      await page.click('button:has-text("產生報表")');
      
      // Wait for report generation
      await page.waitForSelector('[data-testid="report-preview"]');
      
      // Verify report sections
      await expect(page.locator('h3:has-text("司機統計")')).toBeVisible();
      await expect(page.locator('h3:has-text("車輛使用")')).toBeVisible();
      await expect(page.locator('h3:has-text("績效指標")')).toBeVisible();
      await expect(page.locator('h3:has-text("成本分析")')).toBeVisible();
      
      // Export report
      await page.click('button:has-text("匯出PDF")');
      
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('fleet_report_2025_08');
    });

    test('should analyze fleet efficiency trends', async ({ page }) => {
      // Navigate to analytics
      await page.click('a:has-text("分析")');
      
      // Select analysis period
      await page.selectOption('select[name="period"]', 'last_30_days');
      
      // View different metrics
      await page.click('button:has-text("油耗分析")');
      await expect(page.locator('[data-testid="fuel-efficiency-chart"]')).toBeVisible();
      
      await page.click('button:has-text("路線效率")');
      await expect(page.locator('[data-testid="route-efficiency-chart"]')).toBeVisible();
      
      await page.click('button:has-text("成本趨勢")');
      await expect(page.locator('[data-testid="cost-trend-chart"]')).toBeVisible();
      
      // Get optimization suggestions
      await page.click('button:has-text("優化建議")');
      await expect(page.locator('[data-testid="suggestions-panel"]')).toBeVisible();
      await expect(page.locator('text=建議優化路線以節省燃料')).toBeVisible();
    });
  });

  test.describe('Mobile Driver App', () => {
    test('should work on mobile driver interface', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login as driver
      await page.goto('/driver/login');
      await page.fill('input[name="driver_id"]', 'DRV_001');
      await page.fill('input[name="password"]', 'driver_pass');
      await page.click('button:has-text("登入")');
      
      // Check mobile dashboard
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="today-schedule"]')).toBeVisible();
      
      // Start shift
      await page.click('button:has-text("開始工作")');
      
      // Vehicle check
      await page.click('button:has-text("車輛檢查")');
      
      // Complete checklist
      const checkItems = ['輪胎', '燈光', '煞車', '機油', '冷卻液'];
      for (const item of checkItems) {
        await page.check(`input[name="${item}"]`);
      }
      
      await page.fill('input[name="mileage"]', '45000');
      await page.fill('input[name="fuel"]', '45');
      
      await page.click('button:has-text("完成檢查")');
      await expect(page.locator('text=檢查完成')).toBeVisible();
      
      // View assigned routes
      await page.click('button:has-text("今日路線")');
      await expect(page.locator('[data-testid="route-list"]')).toBeVisible();
      
      // Report issue
      await page.click('button:has-text("回報問題")');
      await page.selectOption('select[name="issue_type"]', 'vehicle_problem');
      await page.fill('textarea[name="description"]', '空調異常');
      await page.click('button:has-text("提交")');
      
      await expect(page.locator('text=問題已回報')).toBeVisible();
      
      // End shift
      await page.click('button:has-text("結束工作")');
      await page.fill('input[name="end_mileage"]', '45180');
      await page.fill('input[name="end_fuel"]', '30');
      await page.click('button:has-text("確認")');
      
      await expect(page.locator('text=工作已結束')).toBeVisible();
    });
  });

  test.describe('Integration with Other Systems', () => {
    test('should integrate with route optimization system', async ({ page }) => {
      // Check driver availability for routing
      await page.goto('/logistics/routes');
      await page.click('button:has-text("優化路線")');
      
      // Verify drivers from fleet system appear
      await expect(page.locator('[data-testid="available-drivers"]')).toContainText('測試司機');
      await expect(page.locator('[data-testid="available-vehicles"]')).toContainText('TPE-1234');
      
      // Assign optimized routes
      await page.click('button:has-text("套用優化")');
      
      // Verify assignment reflected in fleet system
      await page.goto('/fleet/management');
      await expect(page.locator('[data-testid="driver-status-DRV_001"]')).toContainText('配送中');
    });

    test('should sync with financial system for cost tracking', async ({ page }) => {
      // View cost analysis
      await page.click('a:has-text("成本分析")');
      
      // Verify expense categories
      await expect(page.locator('[data-testid="fuel-costs"]')).toBeVisible();
      await expect(page.locator('[data-testid="maintenance-costs"]')).toBeVisible();
      await expect(page.locator('[data-testid="labor-costs"]')).toBeVisible();
      
      // Export to financial system
      await page.click('button:has-text("同步至財務系統")');
      await expect(page.locator('text=成本資料已同步')).toBeVisible();
    });
  });
});