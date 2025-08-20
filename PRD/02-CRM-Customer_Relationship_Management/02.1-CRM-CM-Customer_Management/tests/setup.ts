import { vi } from 'vitest';
import { factories } from '@/PRD/test-infrastructure/test-utils/test-data-factory';

// 模組特定的測試設置
export const setupCustomerTests = () => {
  // 設置 localStorage
  localStorage.setItem('auth_token', 'test-token');
  localStorage.setItem('user_id', 'test-user');
};

// 清理函數
export const cleanupCustomerTests = () => {
  localStorage.clear();
  vi.clearAllMocks();
};

// 測試資料建構器
export const testDataBuilders = {
  // 建立測試企業
  createTestEnterprise: (overrides = {}) => {
    return factories.customer.buildEnterprise({
      enterprise_id: 'ENT_TEST_001',
      enterprise_name: '測試企業集團',
      responsible_name: '王大明',
      phone: '0912345678',
      info_completed: true,
      child_companies: [],
      ...overrides,
    });
  },

  // 建立測試公司
  createTestCompany: (overrides = {}) => {
    return factories.customer.buildCompany({
      company_id: 'COM_TEST_001',
      company_name: '測試有限公司',
      parent_enterprise: 'ENT_TEST_001',
      unicode: '12345678',
      company_phone: '02-12345678',
      company_address: '台北市信義區測試路100號',
      responsible_name: '李小華',
      info_completed: true,
      child_stores: [],
      billing_info: {
        billing_type: 'monthly',
        invoice_type: 'B2B',
        billing_cycle: 'monthly',
        closing_date: 25,
      },
      accounting_info: {
        payment_term: 30,
        billing_cycle: 'monthly',
      },
      payment_info: {
        payment_type: 'transfer',
        bank_code: '012',
        virtual_account: '1234567890',
      },
      ...overrides,
    });
  },

  // 建立測試門市
  createTestStore: (overrides = {}) => {
    return factories.customer.buildStore({
      store_id: 'STO_TEST_001',
      store_name: '測試門市',
      parent_company: 'COM_TEST_001',
      store_phone: '03-1234567',
      store_type: 'retail',
      active_state: 'active',
      info_completed: true,
      logistics_info: {
        default_site_id: 'SITE_001',
        store_address: '桃園市中壢區測試街50號',
        start_time: '09:00',
        end_time: '18:00',
        leave_package_location: '警衛室',
        instruction_for_driver: '請按門鈴',
      },
      contacts_info: {
        order_contact_name: '張經理',
        order_contact_phone: '0923456789',
      },
      ...overrides,
    });
  },

  // 建立完整的三層結構
  createHierarchyStructure: () => {
    const enterprise = testDataBuilders.createTestEnterprise();
    const companies = [
      testDataBuilders.createTestCompany({ 
        company_id: 'COM_TEST_001',
        parent_enterprise: enterprise.enterprise_id,
      }),
      testDataBuilders.createTestCompany({ 
        company_id: 'COM_TEST_002',
        company_name: '測試二號公司',
        parent_enterprise: enterprise.enterprise_id,
      }),
    ];
    const stores = [
      testDataBuilders.createTestStore({ 
        store_id: 'STO_TEST_001',
        parent_company: companies[0].company_id,
      }),
      testDataBuilders.createTestStore({ 
        store_id: 'STO_TEST_002',
        store_name: '測試二號門市',
        parent_company: companies[0].company_id,
      }),
      testDataBuilders.createTestStore({ 
        store_id: 'STO_TEST_003',
        store_name: '測試三號門市',
        parent_company: companies[1].company_id,
      }),
    ];

    // 設置關聯
    enterprise.child_companies = companies;
    companies[0].child_stores = stores.slice(0, 2);
    companies[1].child_stores = [stores[2]];

    return {
      enterprise,
      companies,
      stores,
    };
  },
};