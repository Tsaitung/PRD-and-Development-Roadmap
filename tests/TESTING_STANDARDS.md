# 菜蟲農食 ERP 系統 - 測試標準與框架

## 📋 概述

本文件定義 ERP 系統的測試標準、框架選擇、測試策略和最佳實踐。

## 🎯 測試目標

### 覆蓋率目標
- **單元測試**: ≥ 80%
- **整合測試**: ≥ 60%
- **E2E測試**: 關鍵業務流程 100%
- **總體覆蓋率**: ≥ 75%

### 品質指標
- **測試通過率**: ≥ 98%
- **回歸測試**: 100% 自動化
- **測試執行時間**: < 10分鐘（單元測試）
- **Bug逃逸率**: < 5%

## 🛠️ 技術棧

### 測試框架
```json
{
  "unit": "Jest + TypeScript",
  "integration": "Jest + Supertest",
  "e2e": "Playwright",
  "performance": "K6",
  "security": "OWASP ZAP"
}
```

### 工具鏈
- **測試執行器**: Jest (v29+)
- **斷言庫**: Jest內建 + jest-extended
- **Mock框架**: Jest Mock + MSW
- **覆蓋率**: Jest Coverage + nyc
- **報告**: jest-html-reporter

## 📁 測試結構

```
tests/
├── unit/                  # 單元測試
│   ├── modules/          # 模組測試
│   ├── services/         # 服務測試
│   └── utils/            # 工具測試
├── integration/          # 整合測試
│   ├── api/              # API測試
│   ├── database/         # 資料庫測試
│   └── workflows/        # 工作流測試
├── e2e/                  # 端到端測試
│   ├── scenarios/        # 業務場景
│   └── regression/       # 回歸測試
├── performance/          # 效能測試
├── security/             # 安全測試
├── fixtures/             # 測試資料
├── mocks/                # Mock物件
└── helpers/              # 測試輔助工具
```

## 📝 測試命名規範

### 檔案命名
```typescript
// 單元測試
{module}.service.test.ts
{component}.component.test.tsx

// 整合測試
{feature}.integration.test.ts

// E2E測試
{scenario}.e2e.test.ts

// FR-ID對應測試
FR-{module}-{submodule}-{number}.test.ts
```

### 測試案例命名
```typescript
describe('模組/功能名稱', () => {
  describe('方法/場景', () => {
    it('應該 + 預期行為描述', () => {
      // 測試實作
    });
    
    it('當 + 條件 時，應該 + 預期結果', () => {
      // 測試實作
    });
  });
});
```

## 🧪 單元測試標準

### 測試範例
```typescript
// FR-OM-OL-001.test.ts
import { OrderService } from '@/modules/order/order.service';
import { OrderRepository } from '@/modules/order/order.repository';
import { mockOrder, mockOrderList } from '@/tests/fixtures/order.fixtures';

jest.mock('@/modules/order/order.repository');

describe('FR-OM-OL-001: 訂單列表顯示', () => {
  let orderService: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    orderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    orderService = new OrderService(orderRepository);
    jest.clearAllMocks();
  });

  describe('getOrderList', () => {
    it('應該返回分頁的訂單列表', async () => {
      // Arrange
      const filter = { page: 1, pageSize: 10 };
      const expectedResult = {
        data: mockOrderList,
        total: 100,
        page: 1,
        pageSize: 10
      };
      orderRepository.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await orderService.getOrderList(filter);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(orderRepository.findAll).toHaveBeenCalledWith(filter);
      expect(orderRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('當沒有訂單時，應該返回空列表', async () => {
      // Arrange
      orderRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10
      });

      // Act
      const result = await orderService.getOrderList({});

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('當查詢失敗時，應該拋出錯誤', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      orderRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(orderService.getOrderList({}))
        .rejects
        .toThrow('Database connection failed');
    });
  });
});
```

### 單元測試原則
1. **AAA模式**: Arrange, Act, Assert
2. **單一職責**: 每個測試只驗證一個行為
3. **獨立性**: 測試間不相互依賴
4. **可重複**: 任何環境下結果一致
5. **快速**: 單個測試 < 100ms

## 🔗 整合測試標準

### API整合測試範例
```typescript
// order.integration.test.ts
import request from 'supertest';
import { app } from '@/app';
import { setupTestDatabase, teardownTestDatabase } from '@/tests/helpers/database';
import { createTestUser, createTestOrder } from '@/tests/helpers/factories';

describe('Order API Integration', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    await setupTestDatabase();
    testUser = await createTestUser();
    authToken = await getAuthToken(testUser);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/orders', () => {
    it('應該返回用戶的訂單列表', async () => {
      // Arrange
      await createTestOrder({ userId: testUser.id, status: 'confirmed' });
      await createTestOrder({ userId: testUser.id, status: 'pending' });

      // Act
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: testUser.id,
            status: expect.any(String)
          })
        ]),
        pagination: {
          total: 2,
          page: 1,
          pageSize: 10
        }
      });
    });

    it('應該支援狀態篩選', async () => {
      // Act
      const response = await request(app)
        .get('/api/orders?status=confirmed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('confirmed');
    });

    it('未授權時應該返回401', async () => {
      // Act & Assert
      await request(app)
        .get('/api/orders')
        .expect(401);
    });
  });

  describe('POST /api/orders', () => {
    it('應該成功建立訂單', async () => {
      // Arrange
      const orderData = {
        customerId: 'CUST-001',
        items: [
          { productId: 'PROD-001', quantity: 10, unitPrice: 100 }
        ],
        deliveryDate: '2025-09-01'
      };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          orderNo: expect.stringMatching(/^ORD-\d{4}-\d{6}$/),
          status: 'pending',
          totalAmount: 1000
        })
      });
    });
  });
});
```

## 🌐 E2E測試標準

### Playwright測試範例
```typescript
// order-workflow.e2e.test.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '@/tests/e2e/pages/login.page';
import { OrderPage } from '@/tests/e2e/pages/order.page';

test.describe('訂單處理工作流程', () => {
  let loginPage: LoginPage;
  let orderPage: OrderPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    orderPage = new OrderPage(page);
    
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
  });

  test('完整訂單建立流程', async ({ page }) => {
    // 導航到訂單頁面
    await orderPage.goto();
    
    // 點擊新增訂單
    await orderPage.clickNewOrder();
    
    // 填寫訂單資訊
    await orderPage.selectCustomer('測試客戶');
    await orderPage.addProduct('產品A', 10);
    await orderPage.setDeliveryDate('2025-09-01');
    
    // 提交訂單
    await orderPage.submitOrder();
    
    // 驗證訂單建立成功
    await expect(page.locator('.success-message')).toContainText('訂單建立成功');
    
    // 驗證訂單出現在列表中
    const orderNo = await page.locator('.order-number').textContent();
    await orderPage.goto();
    await expect(page.locator(`text=${orderNo}`)).toBeVisible();
  });

  test('訂單狀態更新流程', async ({ page }) => {
    // 選擇訂單
    await orderPage.selectFirstOrder();
    
    // 更新狀態
    await orderPage.updateStatus('confirmed');
    
    // 驗證狀態更新
    await expect(page.locator('.order-status')).toContainText('已確認');
    
    // 驗證歷史記錄
    await orderPage.openHistory();
    await expect(page.locator('.history-item').last()).toContainText('狀態變更: 待確認 → 已確認');
  });
});
```

## 📊 測試資料管理

### Fixtures結構
```typescript
// fixtures/order.fixtures.ts
export const mockOrder = {
  id: 'order-001',
  orderNo: 'ORD-2025-000001',
  customerId: 'cust-001',
  status: 'pending',
  items: [
    {
      productId: 'prod-001',
      quantity: 10,
      unitPrice: 100,
      subtotal: 1000
    }
  ],
  totalAmount: 1000,
  createdAt: new Date('2025-08-24'),
  updatedAt: new Date('2025-08-24')
};

export const mockOrderList = [
  mockOrder,
  { ...mockOrder, id: 'order-002', orderNo: 'ORD-2025-000002' },
  { ...mockOrder, id: 'order-003', orderNo: 'ORD-2025-000003' }
];
```

### Factory模式
```typescript
// helpers/factories.ts
import { faker } from '@faker-js/faker';

export class OrderFactory {
  static create(overrides?: Partial<Order>): Order {
    return {
      id: faker.string.uuid(),
      orderNo: `ORD-${faker.date.recent().getFullYear()}-${faker.string.numeric(6)}`,
      customerId: faker.string.uuid(),
      status: faker.helpers.arrayElement(['pending', 'confirmed', 'completed']),
      items: this.createItems(),
      totalAmount: faker.number.int({ min: 1000, max: 100000 }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createItems(count = 3): OrderItem[] {
    return Array.from({ length: count }, () => ({
      productId: faker.string.uuid(),
      productName: faker.commerce.product(),
      quantity: faker.number.int({ min: 1, max: 100 }),
      unitPrice: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
      subtotal: 0
    })).map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice
    }));
  }

  static createBatch(count: number): Order[] {
    return Array.from({ length: count }, () => this.create());
  }
}
```

## 🔄 持續整合設定

### Jest配置
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};
```

### GitHub Actions工作流程
```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

## 📈 測試指標追蹤

### 關鍵指標
```typescript
interface TestMetrics {
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  execution: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number; // milliseconds
  };
  quality: {
    flakyTests: number;
    averageExecutionTime: number;
    testMaintenanceIndex: number;
  };
}
```

### 測試報告模板
```markdown
## 測試執行報告

**日期**: 2025-08-24
**分支**: main
**提交**: abc123

### 執行摘要
- ✅ **通過**: 245/250
- ❌ **失敗**: 3/250
- ⏭️ **跳過**: 2/250
- ⏱️ **執行時間**: 4m 32s

### 覆蓋率
- **總體**: 78.5%
- **程式碼行**: 82.3%
- **分支**: 71.2%
- **函數**: 79.8%

### 失敗測試
1. `FR-OM-OL-003`: 訂單狀態更新 - 並發衝突處理
2. `FR-WMS-IOD-002`: 庫存查詢 - 超時錯誤
3. `FR-FA-AR-001`: 應收帳款計算 - 精度問題

### 效能指標
- **最慢測試**: FR-MES-PSWO-001 (523ms)
- **平均執行時間**: 18ms
- **記憶體使用**: 256MB
```

## 🛡️ 測試最佳實踐

### DO's ✅
1. **寫測試優先於寫程式碼** (TDD)
2. **保持測試簡單且專注**
3. **使用描述性的測試名稱**
4. **測試邊界條件和異常情況**
5. **定期重構測試程式碼**
6. **使用 beforeEach/afterEach 清理狀態**
7. **Mock 外部依賴**
8. **測試公開 API，而非實作細節**

### DON'Ts ❌
1. **不要測試第三方程式庫**
2. **不要在測試中使用真實的外部服務**
3. **不要忽略失敗的測試**
4. **不要寫過於複雜的測試**
5. **不要在測試間共享狀態**
6. **不要硬編碼測試資料**
7. **不要忽略測試效能**

## 📚 參考資源

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [TDD Best Practices](https://www.agilealliance.org/glossary/tdd/)

---

**文件版本**: v1.0.0  
**最後更新**: 2025-08-24  
**維護團隊**: QA Team