/**
 * BDM-UNIT 單位管理模組 - 整合測試
 * 測試真實的API互動和完整的使用者流程
 */

import { test, expect, Page } from '@playwright/test';
import { setupTestEnvironment, cleanupTestData } from './test-helpers';

describe('BDM-UNIT 整合測試', () => {
  let page: Page;
  let testUnitId: string;
  
  // 測試環境設置
  beforeAll(async () => {
    await setupTestEnvironment();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(process.env.TEST_URL || 'http://localhost:3000');
    
    // 登入測試用戶
    await page.fill('input[name="username"]', 'test_admin');
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  describe('API 整合測試', () => {
    test('GET /v1/units/ 應返回正確的單位列表', async () => {
      const response = await page.request.get('/v1/units/');
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBe(true);
      
      if (data.items.length > 0) {
        const unit = data.items[0];
        expect(unit).toHaveProperty('id');
        expect(unit).toHaveProperty('unitName');
        expect(unit).toHaveProperty('unitType');
        expect(unit).toHaveProperty('variance');
        expect(unit).toHaveProperty('isExact');
        expect(unit).toHaveProperty('conversionToKG');
      }
    });
    
    test('POST /v1/units/ 應成功創建新單位', async () => {
      const newUnit = {
        unitName: `測試單位_${Date.now()}`,
        unitType: '重量',
        variance: 5,
        isExact: false,
        conversionToKG: 2.5
      };
      
      const response = await page.request.post('/v1/units/', {
        data: newUnit
      });
      
      expect(response.status()).toBe(201);
      const created = await response.json();
      
      expect(created).toHaveProperty('id');
      expect(created.unitName).toBe(newUnit.unitName);
      expect(created.unitType).toBe(newUnit.unitType);
      
      testUnitId = created.id;
    });
    
    test('GET /v1/units/{id} 應返回特定單位', async () => {
      const response = await page.request.get(`/v1/units/${testUnitId}`);
      
      expect(response.status()).toBe(200);
      const unit = await response.json();
      
      expect(unit.id).toBe(testUnitId);
      expect(unit.unitName).toContain('測試單位');
    });
    
    test('PUT /v1/units/{id} 應成功更新單位', async () => {
      const updates = {
        unitName: `更新的測試單位_${Date.now()}`,
        variance: 10
      };
      
      const response = await page.request.put(`/v1/units/${testUnitId}`, {
        data: updates
      });
      
      expect(response.status()).toBe(200);
      const updated = await response.json();
      
      expect(updated.unitName).toBe(updates.unitName);
      expect(updated.variance).toBe(updates.variance);
    });
    
    test('DELETE /v1/units/{id} 應成功刪除單位', async () => {
      const response = await page.request.delete(`/v1/units/${testUnitId}`);
      
      expect(response.status()).toBe(204);
      
      // 驗證刪除後無法取得
      const getResponse = await page.request.get(`/v1/units/${testUnitId}`);
      expect(getResponse.status()).toBe(404);
    });
    
    test('應正確處理API錯誤', async () => {
      // 測試重複單位名稱
      const duplicateUnit = {
        unitName: '公斤', // 假設已存在
        unitType: '重量',
        variance: 0,
        isExact: true,
        conversionToKG: 1
      };
      
      const response = await page.request.post('/v1/units/', {
        data: duplicateUnit
      });
      
      expect(response.status()).toBe(409); // Conflict
      const error = await response.json();
      expect(error).toHaveProperty('message');
      expect(error.message).toContain('已存在');
    });
    
    test('應支援分頁查詢', async () => {
      const response = await page.request.get('/v1/units/?page=1&limit=10');
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data.items.length).toBeLessThanOrEqual(10);
    });
    
    test('應支援搜尋過濾', async () => {
      const response = await page.request.get('/v1/units/?search=公斤');
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      data.items.forEach(unit => {
        expect(unit.unitName.toLowerCase()).toContain('公斤');
      });
    });
  });
  
  describe('UI 整合測試', () => {
    test('完整的CRUD流程', async () => {
      // 1. 導航到單位管理頁面
      await page.goto('/admin/unit');
      await page.waitForSelector('table');
      
      // 2. 新增單位
      await page.click('button:has-text("新增單位")');
      await page.waitForSelector('.modal-content');
      
      const unitName = `UI測試單位_${Date.now()}`;
      await page.fill('input[name="unitName"]', unitName);
      await page.selectOption('select[name="unitType"]', '包裝');
      await page.fill('input[name="variance"]', '15');
      await page.uncheck('input[name="isExact"]');
      await page.fill('input[name="conversionToKG"]', '20');
      
      await page.click('button:has-text("確認")');
      await page.waitForSelector(`text=${unitName}`);
      
      // 3. 驗證新增成功
      const newRow = page.locator(`tr:has-text("${unitName}")`);
      await expect(newRow).toBeVisible();
      await expect(newRow.locator('td:nth-child(2)')).toHaveText('包裝');
      await expect(newRow.locator('td:nth-child(3)')).toHaveText('15');
      await expect(newRow.locator('td:nth-child(4)')).toHaveText('否');
      await expect(newRow.locator('td:nth-child(5)')).toHaveText('20');
      
      // 4. 編輯單位
      await newRow.locator('button[aria-label="編輯"]').click();
      await page.waitForSelector('.modal-content');
      
      await page.fill('input[name="variance"]', '20');
      await page.click('button:has-text("確認")');
      
      await page.waitForTimeout(500); // 等待更新
      await expect(newRow.locator('td:nth-child(3)')).toHaveText('20');
      
      // 5. 搜尋功能
      await page.fill('input[placeholder="搜尋單位名稱"]', unitName);
      await page.waitForTimeout(300); // debounce
      
      const visibleRows = await page.locator('tbody tr').count();
      expect(visibleRows).toBe(1);
      
      // 6. 刪除單位
      await newRow.locator('button[aria-label="刪除"]').click();
      
      // 處理確認對話框
      page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(500);
      
      // 驗證刪除成功
      await expect(page.locator(`text=${unitName}`)).not.toBeVisible();
    });
    
    test('批量操作功能', async () => {
      await page.goto('/admin/unit');
      await page.waitForSelector('table');
      
      // 選擇多個項目
      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();
      await checkboxes.nth(3).check();
      
      // 批量刪除
      await page.click('button:has-text("批量刪除")');
      
      // 確認對話框
      const dialog = page.locator('.confirm-dialog');
      await expect(dialog).toContainText('確定要刪除 3 個單位嗎？');
      await page.click('button:has-text("取消")');
      
      // 驗證取消後項目仍存在
      expect(await checkboxes.nth(1).isChecked()).toBe(true);
    });
    
    test('匯入匯出功能', async () => {
      await page.goto('/admin/unit');
      
      // 匯出測試
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("匯出Excel")')
      ]);
      
      expect(download.suggestedFilename()).toContain('units');
      expect(download.suggestedFilename()).toContain('.xlsx');
      
      // 匯入測試
      await page.click('button:has-text("匯入Excel")');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-data/units-import.xlsx');
      
      await page.click('button:has-text("開始匯入")');
      await page.waitForSelector('.import-success');
      
      const successMessage = page.locator('.import-success');
      await expect(successMessage).toContainText('成功匯入');
    });
  });
  
  describe('性能測試', () => {
    test('頁面載入時間應小於2秒', async () => {
      const startTime = Date.now();
      
      await page.goto('/admin/unit');
      await page.waitForSelector('table');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });
    
    test('搜尋響應時間應小於500ms', async () => {
      await page.goto('/admin/unit');
      await page.waitForSelector('table');
      
      const startTime = Date.now();
      await page.fill('input[placeholder="搜尋單位名稱"]', '公斤');
      await page.waitForTimeout(100); // debounce
      
      const searchTime = Date.now() - startTime;
      expect(searchTime).toBeLessThan(500);
    });
    
    test('大量資料渲染測試', async () => {
      // 創建100筆測試資料
      const testUnits = Array.from({ length: 100 }, (_, i) => ({
        unitName: `性能測試單位${i}`,
        unitType: '測試',
        variance: i % 100,
        isExact: i % 2 === 0,
        conversionToKG: i + 1
      }));
      
      // 批量創建
      await page.request.post('/v1/units/batch', {
        data: { units: testUnits }
      });
      
      const startTime = Date.now();
      await page.goto('/admin/unit?limit=100');
      await page.waitForSelector('table');
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(3000);
      
      // 清理測試資料
      await page.request.delete('/v1/units/batch?prefix=性能測試單位');
    });
  });
  
  describe('錯誤處理測試', () => {
    test('網路錯誤處理', async () => {
      // 模擬網路中斷
      await page.route('**/v1/units/**', route => route.abort());
      
      await page.goto('/admin/unit');
      
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('網路連線錯誤');
      
      // 重試按鈕
      await page.click('button:has-text("重試")');
      await page.unroute('**/v1/units/**');
      await page.waitForSelector('table');
    });
    
    test('權限錯誤處理', async () => {
      // 模擬權限不足
      await page.route('**/v1/units/**', route => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({ message: '權限不足' })
        });
      });
      
      await page.goto('/admin/unit');
      
      const errorMessage = page.locator('.permission-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('您沒有權限執行此操作');
    });
    
    test('資料驗證錯誤', async () => {
      await page.goto('/admin/unit');
      await page.click('button:has-text("新增單位")');
      
      // 輸入無效資料
      await page.fill('input[name="unitName"]', '');
      await page.fill('input[name="variance"]', '150'); // 超出範圍
      await page.fill('input[name="conversionToKG"]', '-1'); // 負數
      
      await page.click('button:has-text("確認")');
      
      // 驗證錯誤訊息
      await expect(page.locator('text=單位名稱為必填')).toBeVisible();
      await expect(page.locator('text=誤差範圍必須在0-100之間')).toBeVisible();
      await expect(page.locator('text=換算率必須為正數')).toBeVisible();
    });
  });
  
  describe('並發測試', () => {
    test('多用戶同時操作', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // 兩個用戶同時登入
      await Promise.all([
        loginUser(page1, 'user1', 'pass1'),
        loginUser(page2, 'user2', 'pass2')
      ]);
      
      // 同時導航到單位管理頁面
      await Promise.all([
        page1.goto('/admin/unit'),
        page2.goto('/admin/unit')
      ]);
      
      // 用戶1新增單位
      await page1.click('button:has-text("新增單位")');
      await page1.fill('input[name="unitName"]', '並發測試單位1');
      await page1.click('button:has-text("確認")');
      
      // 用戶2應該能看到新增的單位
      await page2.reload();
      await expect(page2.locator('text=並發測試單位1')).toBeVisible();
      
      // 清理
      await context1.close();
      await context2.close();
    });
    
    test('樂觀鎖測試', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await loginUser(page1, 'user1', 'pass1');
      await loginUser(page2, 'user2', 'pass2');
      
      await page1.goto('/admin/unit');
      await page2.goto('/admin/unit');
      
      // 兩個用戶同時編輯同一筆資料
      const editButtons1 = page1.locator('button[aria-label="編輯"]');
      const editButtons2 = page2.locator('button[aria-label="編輯"]');
      
      await editButtons1.first().click();
      await editButtons2.first().click();
      
      // 用戶1先提交
      await page1.fill('input[name="variance"]', '25');
      await page1.click('button:has-text("確認")');
      
      // 用戶2後提交應該收到版本衝突錯誤
      await page2.fill('input[name="variance"]', '30');
      await page2.click('button:has-text("確認")');
      
      await expect(page2.locator('.version-conflict')).toBeVisible();
      await expect(page2.locator('.version-conflict')).toContainText('資料已被其他用戶修改');
      
      await context1.close();
      await context2.close();
    });
  });
  
  describe('無障礙測試', () => {
    test('鍵盤導航測試', async () => {
      await page.goto('/admin/unit');
      await page.waitForSelector('table');
      
      // Tab 鍵導航
      await page.keyboard.press('Tab');
      const searchInput = page.locator('input[placeholder="搜尋單位名稱"]');
      await expect(searchInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      const addButton = page.locator('button:has-text("新增單位")');
      await expect(addButton).toBeFocused();
      
      // Enter 鍵觸發
      await page.keyboard.press('Enter');
      await expect(page.locator('.modal-content')).toBeVisible();
      
      // Escape 鍵關閉
      await page.keyboard.press('Escape');
      await expect(page.locator('.modal-content')).not.toBeVisible();
    });
    
    test('螢幕閱讀器支援', async () => {
      await page.goto('/admin/unit');
      
      // 檢查 ARIA 屬性
      const table = page.locator('table');
      await expect(table).toHaveAttribute('role', 'table');
      
      const headers = page.locator('th');
      const headerCount = await headers.count();
      for (let i = 0; i < headerCount; i++) {
        await expect(headers.nth(i)).toHaveAttribute('scope', 'col');
      }
      
      // 檢查表單標籤
      await page.click('button:has-text("新增單位")');
      
      const formInputs = page.locator('form input, form select');
      const inputCount = await formInputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        const id = await input.getAttribute('id');
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    });
  });
});

// 輔助函數
async function loginUser(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}