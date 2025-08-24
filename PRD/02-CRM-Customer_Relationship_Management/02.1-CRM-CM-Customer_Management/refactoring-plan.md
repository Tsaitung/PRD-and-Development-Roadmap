# CRM-CM 客戶管理 Company/Store/Unit 架構重構計畫

## 重構概述
本文件規劃將現有客戶管理模組從單層結構重構為 Company/Store/Unit 三層架構，以符合業務需求並提升系統彈性。

## 重構背景與目標

### 現況問題
1. **概念混淆**: 目前系統未明確區分簽約主體（Company）與配送據點（Store）
2. **欄位錯用**: Store 資料中使用 `parent_company` 字串記錄所屬公司，缺乏外鍵關聯
3. **訂單關聯不清**: 訂單僅綁定 Store，無法直接識別下單的客戶主體
4. **定價管理複雜**: 價格資訊分散在不同層級，維護困難

### 重構目標
1. **建立清晰的三層架構**: Company（簽約主體）→ Store（配送據點）→ Unit（營運單位）
2. **統一定價管理**: 將定價方案集中在 Company 層級
3. **改善資料關聯**: 使用外鍵確保資料完整性
4. **提升查詢效能**: 透過正確的索引和關聯減少 JOIN 操作

## 架構定義

### Company（客戶公司）
- **定義**: 簽約與定價的主體，代表客戶的公司實體
- **主要欄位**: company_id, company_name, unicode（統編）, pricing_set, payment_terms
- **業務語意**: 所有合約、定價、帳務皆以 Company 為單位

### Store（客戶據點/門市）
- **定義**: 物流配送的目的地，隸屬於 Company
- **主要欄位**: store_id, store_name, company_id（外鍵）, store_address, delivery_window
- **業務語意**: 實際收貨地點，每個 Store 有獨立的配送需求

### Unit（營運單位）
- **定義**: 實際下單的主體，目前與 Company 一對一對應
- **主要欄位**: unit_id, unit_name, company_id
- **業務語意**: 訂單的下單來源，未來可擴展支援一公司多單位

## 資料庫遷移計畫

### 第一階段：結構調整（P0 - 最高優先）

#### 1.1 建立新資料表
```sql
-- 建立 companies 表（從 customers 表轉換）
CREATE TABLE companies AS 
SELECT 
  id as company_id,
  customer_code as company_code,
  customer_name as company_name,
  tax_id as unicode,
  status,
  address as company_address,
  contact_phone as company_phone,
  contact_email,
  business_category,
  credit_limit,
  payment_terms,
  metadata,
  created_by,
  updated_by,
  created_at,
  updated_at,
  deleted_at
FROM customers 
WHERE customer_type IN ('enterprise', 'company');

-- 新增定價相關欄位
ALTER TABLE companies 
ADD COLUMN pricing_set VARCHAR(50),
ADD COLUMN settlement_day INTEGER;
```

#### 1.2 重構 stores 表
```sql
-- 修改 stores 表結構
ALTER TABLE stores 
RENAME COLUMN parent_company TO company_id_temp;

-- 新增外鍵欄位
ALTER TABLE stores 
ADD COLUMN company_id UUID;

-- 資料遷移：將字串 parent_company 轉換為 UUID company_id
UPDATE stores s
SET company_id = c.company_id
FROM companies c
WHERE s.company_id_temp = c.company_name;

-- 新增外鍵約束
ALTER TABLE stores 
ADD CONSTRAINT fk_store_company 
FOREIGN KEY (company_id) REFERENCES companies(company_id);

-- 清理舊欄位
ALTER TABLE stores DROP COLUMN company_id_temp;

-- 新增索引
CREATE INDEX idx_store_company ON stores(company_id);
```

#### 1.3 建立 units 表
```sql
-- 建立 units 表
CREATE TABLE units (
  unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code VARCHAR(20) UNIQUE NOT NULL,
  unit_name VARCHAR(100) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(company_id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  unit_type VARCHAR(20) NOT NULL DEFAULT 'default',
  authorization_scope JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 為每個 Company 建立預設 Unit
INSERT INTO units (unit_code, unit_name, company_id)
SELECT 
  CONCAT('UNIT-', company_code) as unit_code,
  company_name as unit_name,
  company_id
FROM companies;

-- 建立索引
CREATE INDEX idx_unit_company ON units(company_id);
```

### 第二階段：訂單模組調整（P0 - 最高優先）

#### 2.1 更新訂單表
```sql
-- 新增 unit_id 欄位
ALTER TABLE orders 
ADD COLUMN unit_id UUID;

-- 從 store 回填 unit_id
UPDATE orders o
SET unit_id = u.unit_id
FROM stores s
JOIN companies c ON s.company_id = c.company_id
JOIN units u ON c.company_id = u.company_id
WHERE o.store_id = s.store_id;

-- 設定 NOT NULL 約束
ALTER TABLE orders 
ALTER COLUMN unit_id SET NOT NULL;

-- 新增外鍵
ALTER TABLE orders 
ADD CONSTRAINT fk_order_unit 
FOREIGN KEY (unit_id) REFERENCES units(unit_id);

-- 建立索引
CREATE INDEX idx_order_unit ON orders(unit_id);
```

### 第三階段：其他模組調整（P1 - 高優先）

#### 3.1 物流模組
```sql
-- 配送單新增 unit_id
ALTER TABLE deliveries 
ADD COLUMN unit_id UUID;

UPDATE deliveries d
SET unit_id = o.unit_id
FROM orders o
WHERE d.order_id = o.order_id;
```

#### 3.2 財務模組
```sql
-- 發票新增 store_id
ALTER TABLE invoices 
ADD COLUMN store_id UUID REFERENCES stores(store_id);

-- 建立索引
CREATE INDEX idx_invoice_store ON invoices(store_id);
```

## API 調整規格

### 需要修改的 API 端點

#### Company 相關
- `GET /api/v1/companies` - 取代原 `/api/v1/customers`
- `POST /api/v1/companies` - 建立公司
- `GET /api/v1/companies/{id}/stores` - 獲取公司下所有門市
- `GET /api/v1/companies/{id}/hierarchy` - 獲取完整階層結構

#### Store 相關
- `POST /api/v1/companies/{company_id}/stores` - 新增門市
- `PUT /api/v1/stores/{id}` - 更新門市資料
- `GET /api/v1/stores/{id}` - 獲取門市詳情

#### Unit 相關
- `GET /api/v1/units` - 獲取營運單位列表
- `GET /api/v1/units/{id}/orders` - 獲取單位的所有訂單

#### 訂單相關調整
```javascript
// 原本的請求
POST /api/v1/orders
{
  "store_id": "xxx",
  // ...
}

// 調整後的請求
POST /api/v1/orders
{
  "unit_id": "xxx",    // 新增：營運單位（必填）
  "store_id": "xxx",   // 配送門市（必填）
  // ...
}
```

## 程式碼重構步驟

### 後端重構

#### Step 1: 更新 TypeScript 類型定義
```typescript
// src/modules/customer/types.ts

// 新增 Company 介面
export interface Company {
  id: string;
  companyCode: string;
  companyName: string;
  unicode?: string;
  status: CompanyStatus;
  companyAddress?: Address;
  companyPhone?: string;
  contactEmail?: string;
  businessCategory?: string;
  pricingSet?: string;
  paymentTerms?: string;
  creditLimit?: number;
  settlementDay?: number;
  stores?: Store[];
  units?: Unit[];
  // ...
}

// 新增 Store 介面
export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  companyId: string;  // 外鍵關聯
  status: StoreStatus;
  storeAddress: Address;
  deliveryWindow?: DeliveryWindow;
  instructionForDriver?: string;
  // ...
}

// 新增 Unit 介面
export interface Unit {
  id: string;
  unitCode: string;
  unitName: string;
  companyId: string;
  status: UnitStatus;
  unitType: 'default' | 'department' | 'subsidiary';
  // ...
}
```

#### Step 2: 更新服務層
```typescript
// src/modules/customer/service.ts

export class CustomerService {
  // Company 管理
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // 建立 Company
      const company = await this.insertCompany(client, data);
      
      // 自動建立預設 Unit
      const unit = await this.createDefaultUnit(client, company.id);
      
      await client.query('COMMIT');
      return { ...company, units: [unit] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Store 管理
  async createStore(companyId: string, data: CreateStoreRequest): Promise<Store> {
    // 驗證 Company 存在
    const company = await this.getCompanyById(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }
    
    // 建立 Store
    return this.insertStore({ ...data, companyId });
  }

  // 階層查詢
  async getCompanyHierarchy(companyId: string): Promise<CompanyHierarchy> {
    const company = await this.getCompanyById(companyId);
    const stores = await this.getStoresByCompanyId(companyId);
    const units = await this.getUnitsByCompanyId(companyId);
    
    return {
      company,
      stores,
      units
    };
  }
}
```

#### Step 3: 更新訂單服務
```typescript
// src/modules/order/service.ts

export class OrderService {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    // 驗證 Unit 和 Store 的關係
    await this.validateUnitStoreRelation(data.unitId, data.storeId);
    
    // 建立訂單，同時記錄 unit_id 和 store_id
    const order = await this.insertOrder({
      ...data,
      unitId: data.unitId,    // 營運單位
      storeId: data.storeId   // 配送門市
    });
    
    return order;
  }
  
  private async validateUnitStoreRelation(unitId: string, storeId: string): Promise<void> {
    const result = await query(
      `SELECT 1 FROM units u
       JOIN stores s ON u.company_id = s.company_id
       WHERE u.unit_id = $1 AND s.store_id = $2`,
      [unitId, storeId]
    );
    
    if (!result.rows.length) {
      throw new AppError('Store does not belong to the same company as Unit', 400);
    }
  }
}
```

### 前端重構

#### Step 1: 更新訂單表單
```tsx
// OrderForm.tsx

const OrderForm = () => {
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [availableStores, setAvailableStores] = useState<Store[]>([]);

  // 當選擇 Unit 時，載入對應的 Stores
  useEffect(() => {
    if (selectedUnit) {
      fetchStoresByUnit(selectedUnit).then(setAvailableStores);
    }
  }, [selectedUnit]);

  return (
    <Form>
      {/* Step 1: 選擇客戶（Unit） */}
      <FormField label="客戶">
        <Select
          value={selectedUnit}
          onChange={setSelectedUnit}
          options={units.map(u => ({
            value: u.id,
            label: u.unitName
          }))}
        />
      </FormField>

      {/* Step 2: 選擇配送門市（Store） */}
      <FormField label="配送門市">
        <Select
          value={selectedStore}
          onChange={setSelectedStore}
          options={availableStores.map(s => ({
            value: s.id,
            label: s.storeName
          }))}
          disabled={!selectedUnit}
        />
      </FormField>
      
      {/* 其他欄位... */}
    </Form>
  );
};
```

## 資料驗證與回滾計畫

### 驗證步驟
1. **資料完整性檢查**
   - 確認所有 stores 都有有效的 company_id
   - 確認所有 orders 都有有效的 unit_id
   - 檢查是否有孤立的資料

2. **功能測試**
   - 測試新建 Company 自動建立 Unit
   - 測試訂單建立流程
   - 測試階層查詢功能

3. **效能測試**
   - 比較重構前後的查詢效能
   - 確認索引使用正確

### 回滾計畫
若重構過程出現問題，可執行以下回滾步驟：

```sql
-- 回滾訂單表
ALTER TABLE orders DROP COLUMN unit_id;

-- 回滾 stores 表
ALTER TABLE stores 
ADD COLUMN parent_company VARCHAR(100);

UPDATE stores s
SET parent_company = c.company_name
FROM companies c
WHERE s.company_id = c.company_id;

ALTER TABLE stores DROP COLUMN company_id;

-- 移除新表
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS companies;

-- 還原原始 customers 表
-- (需要從備份還原)
```

## 實施時程表

| 階段 | 工作項目 | 預計時程 | 負責團隊 |
|------|---------|---------|----------|
| 準備期 | 資料備份、測試環境準備 | Day 1 | DevOps |
| 第一階段 | 資料庫結構調整 | Day 2-3 | 後端團隊 |
| 第二階段 | 訂單模組調整 | Day 4-5 | 後端團隊 |
| 第三階段 | 其他模組調整 | Day 6-7 | 後端團隊 |
| 第四階段 | API 調整與測試 | Day 8-9 | 後端團隊 |
| 第五階段 | 前端調整 | Day 10-12 | 前端團隊 |
| 第六階段 | 整合測試 | Day 13-14 | QA團隊 |
| 第七階段 | 生產環境部署 | Day 15 | DevOps |

## 風險評估

### 高風險項目
1. **資料遷移錯誤**: 可能導致客戶關聯錯亂
   - 緩解措施：完整備份、分批遷移、驗證腳本

2. **訂單流程中斷**: 影響日常業務運作
   - 緩解措施：維護視窗執行、回滾計畫準備

3. **第三方系統整合**: 外部系統可能依賴舊結構
   - 緩解措施：提供相容層、漸進式切換

### 中風險項目
1. **效能下降**: 新的 JOIN 可能影響查詢速度
   - 緩解措施：優化索引、查詢快取

2. **前端相容性**: 舊版前端可能無法正常運作
   - 緩解措施：版本控制、灰度發布

## 成功指標

1. **資料正確性**
   - 100% 的 stores 正確關聯到 companies
   - 100% 的 orders 正確關聯到 units

2. **系統穩定性**
   - 錯誤率 < 0.1%
   - API 響應時間 < 200ms

3. **業務連續性**
   - 訂單建立成功率 > 99.9%
   - 客戶查詢功能正常

## 相關文件
- [CRM-CM PRD 文件](./prd.md)
- [API 規格文件](../../docs/api/crm-cm-api.md)
- [資料庫設計文件](../../docs/database/customer-schema.md)

---

**文件狀態**: 審查中  
**最後更新**: 2025-08-24  
**版本**: v1.0.0