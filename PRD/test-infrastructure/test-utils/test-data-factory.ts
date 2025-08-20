import { faker } from '@faker-js/faker';

// 設定繁體中文
faker.locale = 'zh_TW';

// 基礎 Factory 類別
export abstract class BaseFactory<T> {
  protected abstract getDefaults(): T;
  
  build(overrides: Partial<T> = {}): T {
    return {
      ...this.getDefaults(),
      ...overrides,
    };
  }

  buildMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

// 客戶工廠
export class CustomerFactory extends BaseFactory<any> {
  protected getDefaults() {
    return {
      customer_id: faker.datatype.uuid(),
      customer_type: faker.helpers.arrayElement(['enterprise', 'company', 'store']),
      customer_name: faker.company.name(),
      tax_id: this.generateTaxId(),
      phone: faker.phone.number('09########'),
      address: faker.address.streetAddress(),
      responsible_name: faker.name.fullName(),
      credit_limit: faker.datatype.number({ min: 100000, max: 5000000 }),
      payment_term: faker.helpers.arrayElement([0, 7, 14, 30, 60]),
      status: 'active',
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };
  }

  private generateTaxId(): string {
    return faker.datatype.number({ min: 10000000, max: 99999999 }).toString();
  }

  // 創建企業
  buildEnterprise(overrides = {}) {
    return this.build({
      customer_type: 'enterprise',
      enterprise_id: faker.datatype.uuid(),
      enterprise_name: faker.company.name() + ' 集團',
      child_companies: [],
      ...overrides,
    });
  }

  // 創建公司
  buildCompany(overrides = {}) {
    return this.build({
      customer_type: 'company',
      company_id: faker.datatype.uuid(),
      company_name: faker.company.name() + ' 有限公司',
      parent_enterprise: faker.datatype.uuid(),
      child_stores: [],
      billing_info: {
        invoice_type: faker.helpers.arrayElement(['B2B', 'B2C']),
        billing_cycle: faker.helpers.arrayElement(['monthly', 'biweekly']),
        closing_date: faker.datatype.number({ min: 1, max: 28 }),
      },
      ...overrides,
    });
  }

  // 創建門市
  buildStore(overrides = {}) {
    return this.build({
      customer_type: 'store',
      store_id: faker.datatype.uuid(),
      store_name: faker.company.name() + ' ' + faker.address.city() + '店',
      parent_company: faker.datatype.uuid(),
      logistics_info: {
        default_site_id: faker.datatype.uuid(),
        delivery_address: faker.address.streetAddress(),
        receiving_time: '09:00-18:00',
        leave_package: faker.datatype.boolean(),
      },
      ...overrides,
    });
  }
}

// 產品工廠
export class ProductFactory extends BaseFactory<any> {
  protected getDefaults() {
    return {
      product_id: faker.datatype.uuid(),
      product_code: faker.datatype.alphaNumeric(8).toUpperCase(),
      product_name: faker.commerce.productName(),
      category: faker.commerce.department(),
      unit: faker.helpers.arrayElement(['KG', '包', '盒', '箱', '台斤']),
      price: faker.datatype.number({ min: 10, max: 10000 }),
      cost: faker.datatype.number({ min: 5, max: 5000 }),
      status: 'active',
      is_time_price: faker.datatype.boolean(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };
  }

  // 創建時價商品
  buildTimePrice(overrides = {}) {
    return this.build({
      is_time_price: true,
      price: 0,
      daily_price: faker.datatype.number({ min: 50, max: 500 }),
      ...overrides,
    });
  }
}

// 訂單工廠
export class OrderFactory extends BaseFactory<any> {
  protected getDefaults() {
    return {
      order_id: faker.datatype.uuid(),
      order_no: this.generateOrderNo(),
      order_date: faker.date.recent(),
      customer_id: faker.datatype.uuid(),
      customer_name: faker.company.name(),
      delivery_date: faker.date.future(),
      delivery_address: faker.address.streetAddress(),
      status: faker.helpers.arrayElement(['draft', 'confirmed', 'processing', 'shipped', 'completed']),
      payment_status: faker.helpers.arrayElement(['unpaid', 'partial', 'paid']),
      subtotal: faker.datatype.number({ min: 1000, max: 100000 }),
      tax_amount: 0,
      shipping_fee: faker.datatype.number({ min: 0, max: 500 }),
      total_amount: 0,
      items: [],
      created_by: faker.name.fullName(),
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
    };
  }

  private generateOrderNo(): string {
    const date = faker.date.recent();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const seq = faker.datatype.number({ min: 1, max: 999 }).toString().padStart(3, '0');
    return `ORD-${dateStr}-${seq}`;
  }

  // 創建訂單項目
  buildOrderItem(overrides = {}) {
    const quantity = faker.datatype.number({ min: 1, max: 100 });
    const unitPrice = faker.datatype.number({ min: 10, max: 1000 });
    
    return {
      item_id: faker.datatype.uuid(),
      product_id: faker.datatype.uuid(),
      product_name: faker.commerce.productName(),
      quantity,
      unit: faker.helpers.arrayElement(['KG', '包', '盒', '箱']),
      unit_price: unitPrice,
      discount_rate: faker.datatype.number({ min: 0, max: 0.3 }),
      subtotal: quantity * unitPrice,
      is_gift: faker.datatype.boolean(),
      ...overrides,
    };
  }

  // 創建完整訂單
  buildWithItems(itemCount = 5, overrides = {}) {
    const items = Array.from({ length: itemCount }, () => this.buildOrderItem());
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = Math.round(subtotal * 0.05);
    const shippingFee = faker.datatype.number({ min: 0, max: 500 });
    
    return this.build({
      items,
      subtotal,
      tax_amount: taxAmount,
      shipping_fee: shippingFee,
      total_amount: subtotal + taxAmount + shippingFee,
      ...overrides,
    });
  }
}

// 庫存工廠
export class InventoryFactory extends BaseFactory<any> {
  protected getDefaults() {
    return {
      inventory_id: faker.datatype.uuid(),
      site_id: faker.datatype.uuid(),
      site_name: faker.company.name() + ' 倉庫',
      product_id: faker.datatype.uuid(),
      product_name: faker.commerce.productName(),
      quantity_on_hand: faker.datatype.number({ min: 0, max: 1000 }),
      quantity_available: faker.datatype.number({ min: 0, max: 1000 }),
      quantity_reserved: faker.datatype.number({ min: 0, max: 100 }),
      unit: faker.helpers.arrayElement(['KG', '包', '盒', '箱']),
      batch_no: this.generateBatchNo(),
      expiry_date: faker.date.future(),
      unit_cost: faker.datatype.number({ min: 10, max: 1000 }),
      total_value: 0,
      safety_stock: faker.datatype.number({ min: 10, max: 100 }),
      reorder_point: faker.datatype.number({ min: 20, max: 200 }),
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };
  }

  private generateBatchNo(): string {
    const date = faker.date.recent();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `BATCH-${dateStr}-${faker.datatype.alphaNumeric(4).toUpperCase()}`;
  }

  // 創建庫存異動
  buildTransaction(overrides = {}) {
    const quantity = faker.datatype.number({ min: 1, max: 100 });
    
    return {
      transaction_id: faker.datatype.uuid(),
      transaction_type: faker.helpers.arrayElement(['IN', 'OUT', 'ADJUST']),
      site_id: faker.datatype.uuid(),
      product_id: faker.datatype.uuid(),
      quantity,
      unit: faker.helpers.arrayElement(['KG', '包', '盒', '箱']),
      unit_cost: faker.datatype.number({ min: 10, max: 1000 }),
      reference_type: faker.helpers.arrayElement(['PO', 'SO', 'TRANSFER', 'ADJUST']),
      reference_no: faker.datatype.alphaNumeric(10).toUpperCase(),
      notes: faker.lorem.sentence(),
      created_by: faker.name.fullName(),
      created_at: faker.date.recent(),
      ...overrides,
    };
  }
}

// 車輛工廠
export class VehicleFactory extends BaseFactory<any> {
  protected getDefaults() {
    return {
      vehicle_id: faker.datatype.uuid(),
      plate_number: this.generatePlateNumber(),
      vehicle_type: faker.helpers.arrayElement(['小貨車', '中型貨車', '大貨車', '冷藏車']),
      brand: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.datatype.number({ min: 2015, max: 2024 }),
      max_weight: faker.datatype.number({ min: 1000, max: 10000 }),
      max_volume: faker.datatype.number({ min: 10, max: 100 }),
      temperature_type: faker.helpers.arrayElement(['ambient', 'chilled', 'frozen']),
      site_id: faker.datatype.uuid(),
      status: 'active',
      fuel_type: faker.helpers.arrayElement(['汽油', '柴油', '電動']),
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };
  }

  private generatePlateNumber(): string {
    const letters = faker.random.alpha({ count: 3, casing: 'upper' });
    const numbers = faker.datatype.number({ min: 1000, max: 9999 });
    return `${letters}-${numbers}`;
  }
}

// 司機工廠
export class DriverFactory extends BaseFactory<any> {
  protected getDefaults() {
    return {
      driver_id: faker.datatype.uuid(),
      driver_code: `DRV-${faker.datatype.number({ min: 1000, max: 9999 })}`,
      name: faker.name.fullName(),
      id_number: this.generateIdNumber(),
      phone: faker.phone.number('09########'),
      license_type: faker.helpers.arrayElement(['職業小型車', '職業大貨車', '職業聯結車']),
      license_number: `DL-${faker.datatype.alphaNumeric(10).toUpperCase()}`,
      license_expiry: faker.date.future(),
      site_id: faker.datatype.uuid(),
      employment_status: 'active',
      emergency_contact: {
        name: faker.name.fullName(),
        phone: faker.phone.number('09########'),
        relationship: faker.helpers.arrayElement(['配偶', '父母', '子女', '朋友']),
      },
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };
  }

  private generateIdNumber(): string {
    const letter = faker.random.alpha({ count: 1, casing: 'upper' });
    const numbers = faker.datatype.number({ min: 100000000, max: 299999999 });
    return `${letter}${numbers}`;
  }
}

// 帳單工廠
export class BillingFactory extends BaseFactory<any> {
  protected getDefaults() {
    const subtotal = faker.datatype.number({ min: 10000, max: 500000 });
    const taxAmount = Math.round(subtotal * 0.05);
    const shippingFee = faker.datatype.number({ min: 0, max: 1000 });
    const totalAmount = subtotal + taxAmount + shippingFee;
    
    return {
      bill_id: faker.datatype.uuid(),
      bill_no: this.generateBillNo(),
      customer_id: faker.datatype.uuid(),
      customer_name: faker.company.name(),
      billing_month: faker.date.recent().toISOString().slice(0, 7),
      billing_date: faker.date.recent(),
      due_date: faker.date.future(),
      subtotal,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: faker.datatype.number({ min: 0, max: totalAmount }),
      balance: 0,
      status: faker.helpers.arrayElement(['draft', 'confirmed', 'invoiced', 'paid', 'overdue']),
      created_by: faker.name.fullName(),
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
    };
  }

  private generateBillNo(): string {
    const date = faker.date.recent();
    const dateStr = date.toISOString().slice(0, 7).replace('-', '');
    const seq = faker.datatype.number({ min: 1, max: 999 }).toString().padStart(3, '0');
    return `BILL-${dateStr}-${seq}`;
  }

  // 創建發票
  buildInvoice(overrides = {}) {
    const salesAmount = faker.datatype.number({ min: 10000, max: 500000 });
    const taxAmount = Math.round(salesAmount * 0.05);
    
    return {
      invoice_id: faker.datatype.uuid(),
      invoice_no: this.generateInvoiceNo(),
      invoice_date: faker.date.recent(),
      customer_id: faker.datatype.uuid(),
      invoice_type: faker.helpers.arrayElement(['B2B', 'B2C']),
      sales_amount: salesAmount,
      tax_amount: taxAmount,
      total_amount: salesAmount + taxAmount,
      status: 'valid',
      created_at: faker.date.recent(),
      ...overrides,
    };
  }

  private generateInvoiceNo(): string {
    const letters = faker.random.alpha({ count: 2, casing: 'upper' });
    const numbers = faker.datatype.number({ min: 10000000, max: 99999999 });
    return `${letters}${numbers}`;
  }
}

// 匯出所有工廠
export const factories = {
  customer: new CustomerFactory(),
  product: new ProductFactory(),
  order: new OrderFactory(),
  inventory: new InventoryFactory(),
  vehicle: new VehicleFactory(),
  driver: new DriverFactory(),
  billing: new BillingFactory(),
};