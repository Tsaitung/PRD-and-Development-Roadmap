import { test, expect, Page } from '@playwright/test';
import { testDataBuilders } from '../setup';

// E2E測試配置
test.describe('Customer CRUD Operations E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // 導航到客戶管理頁面
    await page.goto('/customers');
    
    // 等待頁面載入
    await page.waitForSelector('[data-testid="customer-management"]');
  });

  test.describe('Create Customer', () => {
    test('should create new enterprise customer', async () => {
      // 點擊新增按鈕
      await page.click('[data-testid="add-customer-btn"]');
      
      // 選擇客戶類型
      await page.selectOption('[data-testid="customer-type-select"]', 'enterprise');
      
      // 填寫表單
      await page.fill('[data-testid="enterprise-name"]', '新測試企業集團');
      await page.fill('[data-testid="responsible-name"]', '張總經理');
      await page.fill('[data-testid="phone"]', '0912345678');
      await page.fill('[data-testid="email"]', 'test@enterprise.com');
      
      // 提交表單
      await page.click('[data-testid="submit-btn"]');
      
      // 驗證成功訊息
      await expect(page.locator('[data-testid="success-message"]')).toContainText('企業建立成功');
      
      // 驗證新企業出現在列表中
      await page.fill('[data-testid="search-input"]', '新測試企業集團');
      await page.click('[data-testid="search-btn"]');
      
      await expect(page.locator('[data-testid="enterprise-list"]')).toContainText('新測試企業集團');
    });

    test('should create company with enterprise relationship', async () => {
      // 先確保有企業存在
      await page.click('[data-testid="add-customer-btn"]');
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      
      // 選擇父企業
      await page.selectOption('[data-testid="parent-enterprise-select"]', 'ENT_TEST_001');
      
      // 填寫公司資料
      await page.fill('[data-testid="company-name"]', '新測試有限公司');
      await page.fill('[data-testid="tax-id"]', '87654321');
      await page.fill('[data-testid="company-phone"]', '02-87654321');
      await page.fill('[data-testid="company-address"]', '台北市大安區新測試路200號');
      
      // 設定帳務資訊
      await page.selectOption('[data-testid="invoice-type"]', 'B2B');
      await page.selectOption('[data-testid="billing-cycle"]', 'monthly');
      await page.fill('[data-testid="closing-date"]', '25');
      await page.fill('[data-testid="payment-term"]', '30');
      
      // 提交
      await page.click('[data-testid="submit-btn"]');
      
      // 驗證
      await expect(page.locator('[data-testid="success-message"]')).toContainText('公司建立成功');
    });

    test('should create store with company relationship', async () => {
      await page.click('[data-testid="add-customer-btn"]');
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      
      // 選擇父公司
      await page.selectOption('[data-testid="parent-company-select"]', 'COM_TEST_001');
      
      // 填寫門市資料
      await page.fill('[data-testid="store-name"]', '新測試門市');
      await page.fill('[data-testid="store-phone"]', '04-12345678');
      await page.selectOption('[data-testid="store-type"]', 'retail');
      
      // 物流資訊
      await page.fill('[data-testid="delivery-address"]', '台中市西屯區測試路300號');
      await page.fill('[data-testid="start-time"]', '09:00');
      await page.fill('[data-testid="end-time"]', '18:00');
      await page.fill('[data-testid="driver-instruction"]', '請打電話通知');
      
      // 聯絡人資訊
      await page.fill('[data-testid="contact-name"]', '陳店長');
      await page.fill('[data-testid="contact-phone"]', '0934567890');
      
      // 提交
      await page.click('[data-testid="submit-btn"]');
      
      // 驗證
      await expect(page.locator('[data-testid="success-message"]')).toContainText('門市建立成功');
    });

    test('should validate required fields', async () => {
      await page.click('[data-testid="add-customer-btn"]');
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      
      // 直接提交空表單
      await page.click('[data-testid="submit-btn"]');
      
      // 驗證錯誤訊息
      await expect(page.locator('[data-testid="company-name-error"]')).toContainText('公司名稱為必填');
      await expect(page.locator('[data-testid="tax-id-error"]')).toContainText('統一編號為必填');
    });

    test('should check tax ID uniqueness', async () => {
      await page.click('[data-testid="add-customer-btn"]');
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      
      // 輸入已存在的統編
      await page.fill('[data-testid="tax-id"]', '12345678');
      await page.blur('[data-testid="tax-id"]');
      
      // 等待驗證
      await page.waitForTimeout(500);
      
      // 驗證錯誤訊息
      await expect(page.locator('[data-testid="tax-id-error"]')).toContainText('統一編號已存在');
    });
  });

  test.describe('Read Customer', () => {
    test('should search and view enterprise details', async () => {
      // 搜尋企業
      await page.selectOption('[data-testid="customer-type-select"]', 'enterprise');
      await page.fill('[data-testid="search-input"]', '測試企業');
      await page.click('[data-testid="search-btn"]');
      
      // 等待結果
      await page.waitForSelector('[data-testid="enterprise-list"]');
      
      // 點擊查看詳情
      await page.click('[data-testid="view-detail-ENT_TEST_001"]');
      
      // 驗證詳情頁面
      await expect(page.locator('[data-testid="detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-enterprise-name"]')).toContainText('測試企業集團');
      await expect(page.locator('[data-testid="detail-responsible"]')).toContainText('王大明');
      await expect(page.locator('[data-testid="detail-phone"]')).toContainText('0912345678');
    });

    test('should view company hierarchy', async () => {
      // 搜尋企業
      await page.selectOption('[data-testid="customer-type-select"]', 'enterprise');
      await page.fill('[data-testid="search-input"]', '測試企業');
      await page.click('[data-testid="search-btn"]');
      
      // 展開查看下層公司
      await page.click('[data-testid="expand-ENT_TEST_001"]');
      
      // 驗證公司列表
      await expect(page.locator('[data-testid="company-list-ENT_TEST_001"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-COM_TEST_001"]')).toContainText('測試有限公司');
      
      // 展開查看門市
      await page.click('[data-testid="expand-COM_TEST_001"]');
      
      // 驗證門市列表
      await expect(page.locator('[data-testid="store-list-COM_TEST_001"]')).toBeVisible();
      await expect(page.locator('[data-testid="store-STO_TEST_001"]')).toContainText('測試門市');
    });

    test('should filter by completion status', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'enterprise');
      await page.check('[data-testid="incomplete-only-checkbox"]');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      // 驗證只顯示未完成的資料
      const results = await page.locator('[data-testid="enterprise-list"] [data-testid^="enterprise-"]').count();
      
      for (let i = 0; i < results; i++) {
        const status = await page.locator(`[data-testid="completion-status-${i}"]`).textContent();
        expect(status).toBe('資料未完整');
      }
    });
  });

  test.describe('Update Customer', () => {
    test('should edit enterprise information', async () => {
      // 搜尋並找到企業
      await page.selectOption('[data-testid="customer-type-select"]', 'enterprise');
      await page.fill('[data-testid="search-input"]', '測試企業');
      await page.click('[data-testid="search-btn"]');
      
      // 點擊編輯
      await page.click('[data-testid="edit-ENT_TEST_001"]');
      
      // 修改資料
      await page.fill('[data-testid="enterprise-name"]', '更新後的測試企業集團');
      await page.fill('[data-testid="responsible-name"]', '李總經理');
      await page.fill('[data-testid="phone"]', '0987654321');
      
      // 保存
      await page.click('[data-testid="save-btn"]');
      
      // 驗證成功訊息
      await expect(page.locator('[data-testid="success-message"]')).toContainText('更新成功');
      
      // 驗證更新後的資料
      await page.click('[data-testid="view-detail-ENT_TEST_001"]');
      await expect(page.locator('[data-testid="detail-enterprise-name"]')).toContainText('更新後的測試企業集團');
      await expect(page.locator('[data-testid="detail-responsible"]')).toContainText('李總經理');
    });

    test('should update company billing information', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      await page.fill('[data-testid="search-input"]', '測試有限公司');
      await page.click('[data-testid="search-btn"]');
      
      await page.click('[data-testid="edit-COM_TEST_001"]');
      
      // 修改帳務資訊
      await page.selectOption('[data-testid="invoice-type"]', 'B2C');
      await page.fill('[data-testid="closing-date"]', '28');
      await page.fill('[data-testid="payment-term"]', '60');
      
      await page.click('[data-testid="save-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('更新成功');
    });

    test('should update store logistics information', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      await page.fill('[data-testid="search-input"]', '測試門市');
      await page.click('[data-testid="search-btn"]');
      
      await page.click('[data-testid="edit-STO_TEST_001"]');
      
      // 修改物流資訊
      await page.fill('[data-testid="start-time"]', '08:00');
      await page.fill('[data-testid="end-time"]', '20:00');
      await page.fill('[data-testid="driver-instruction"]', '更新的配送指示：請走後門');
      
      await page.click('[data-testid="save-btn"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('更新成功');
    });
  });

  test.describe('Delete Customer', () => {
    test('should delete store with confirmation', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      await page.fill('[data-testid="search-input"]', '要刪除的門市');
      await page.click('[data-testid="search-btn"]');
      
      // 點擊刪除
      await page.click('[data-testid="delete-STO_DELETE_001"]');
      
      // 確認刪除對話框
      await expect(page.locator('[data-testid="confirm-dialog"]')).toContainText('確定要刪除此門市嗎？');
      
      // 確認刪除
      await page.click('[data-testid="confirm-delete-btn"]');
      
      // 驗證成功訊息
      await expect(page.locator('[data-testid="success-message"]')).toContainText('刪除成功');
      
      // 驗證門市已不存在
      await page.fill('[data-testid="search-input"]', '要刪除的門市');
      await page.click('[data-testid="search-btn"]');
      
      await expect(page.locator('[data-testid="no-results"]')).toContainText('查無符合條件的資料');
    });

    test('should prevent deletion of company with stores', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      await page.fill('[data-testid="search-input"]', '測試有限公司');
      await page.click('[data-testid="search-btn"]');
      
      // 嘗試刪除有門市的公司
      await page.click('[data-testid="delete-COM_TEST_001"]');
      
      // 驗證錯誤訊息
      await expect(page.locator('[data-testid="error-dialog"]')).toContainText('無法刪除：此公司下還有門市');
      
      // 關閉對話框
      await page.click('[data-testid="close-dialog-btn"]');
    });

    test('should cancel deletion', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      await page.fill('[data-testid="search-input"]', '測試門市');
      await page.click('[data-testid="search-btn"]');
      
      // 點擊刪除
      await page.click('[data-testid="delete-STO_TEST_001"]');
      
      // 取消刪除
      await page.click('[data-testid="cancel-delete-btn"]');
      
      // 驗證門市仍存在
      await expect(page.locator('[data-testid="store-STO_TEST_001"]')).toBeVisible();
    });
  });

  test.describe('Batch Operations', () => {
    test('should select and export multiple customers', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'company');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      // 選擇多個項目
      await page.check('[data-testid="select-COM_TEST_001"]');
      await page.check('[data-testid="select-COM_TEST_002"]');
      
      // 點擊匯出
      await page.click('[data-testid="export-selected-btn"]');
      
      // 選擇匯出格式
      await page.selectOption('[data-testid="export-format"]', 'excel');
      
      // 確認匯出
      await page.click('[data-testid="confirm-export-btn"]');
      
      // 驗證下載開始
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('customers_export');
    });

    test('should batch update customer status', async () => {
      await page.selectOption('[data-testid="customer-type-select"]', 'store');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-btn"]');
      
      // 選擇多個門市
      await page.check('[data-testid="select-STO_TEST_001"]');
      await page.check('[data-testid="select-STO_TEST_002"]');
      
      // 批量操作
      await page.click('[data-testid="batch-action-btn"]');
      await page.selectOption('[data-testid="batch-action-type"]', 'update-status');
      await page.selectOption('[data-testid="new-status"]', 'inactive');
      
      // 確認
      await page.click('[data-testid="confirm-batch-btn"]');
      
      // 驗證成功訊息
      await expect(page.locator('[data-testid="success-message"]')).toContainText('批量更新成功：2 筆資料已更新');
    });
  });
});