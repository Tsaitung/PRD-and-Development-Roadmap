/**
 * 單元測試：FR-CRM-CM-001 客戶基本資料管理
 * 測試客戶資料的驗證邏輯、資料處理等單元功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateCustomer, generateCustomerCode, checkDuplicateTaxId } from '../../src/validators';
import { CustomerType, CustomerStatus } from '../../src/types';

describe('FR-CRM-CM-001: 客戶基本資料管理', () => {
  describe('客戶資料驗證', () => {
    it('應該接受有效的客戶資料', () => {
      const validCustomer = {
        customer_name: '測試公司',
        customer_type: CustomerType.COMPANY,
        contact_phone: '02-1234-5678',
        contact_email: 'test@example.com'
      };
      
      const result = validateCustomer(validCustomer);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該拒絕缺少必填欄位的資料', () => {
      const invalidCustomer = {
        customer_type: CustomerType.COMPANY,
        contact_phone: '02-1234-5678'
        // 缺少 customer_name
      };
      
      const result = validateCustomer(invalidCustomer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('customer_name is required');
    });

    it('應該驗證統一編號格式', () => {
      const customerWithInvalidTaxId = {
        customer_name: '測試公司',
        customer_type: CustomerType.COMPANY,
        tax_id: '123' // 應該是8位數字
      };
      
      const result = validateCustomer(customerWithInvalidTaxId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid tax ID format');
    });

    it('應該驗證Email格式', () => {
      const customerWithInvalidEmail = {
        customer_name: '測試公司',
        customer_type: CustomerType.COMPANY,
        contact_email: 'not-an-email'
      };
      
      const result = validateCustomer(customerWithInvalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('應該驗證電話號碼格式', () => {
      const validPhones = [
        '02-1234-5678',
        '0912-345-678',
        '04-12345678',
        '+886-2-1234-5678'
      ];
      
      validPhones.forEach(phone => {
        const customer = {
          customer_name: '測試公司',
          customer_type: CustomerType.COMPANY,
          contact_phone: phone
        };
        
        const result = validateCustomer(customer);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('客戶編號生成', () => {
    it('應該生成正確格式的客戶編號', () => {
      const code = generateCustomerCode();
      expect(code).toMatch(/^CUST-\d{4}-\d{4}$/);
    });

    it('應該生成唯一的客戶編號', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateCustomerCode());
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('重複統編檢查', () => {
    it('應該檢測到重複的統一編號', async () => {
      const existingTaxId = '12345678';
      const isDuplicate = await checkDuplicateTaxId(existingTaxId);
      expect(isDuplicate).toBe(true);
    });

    it('應該允許新的統一編號', async () => {
      const newTaxId = '87654321';
      const isDuplicate = await checkDuplicateTaxId(newTaxId);
      expect(isDuplicate).toBe(false);
    });

    it('應該處理空的統一編號', async () => {
      const isDuplicate = await checkDuplicateTaxId('');
      expect(isDuplicate).toBe(false);
    });
  });
});