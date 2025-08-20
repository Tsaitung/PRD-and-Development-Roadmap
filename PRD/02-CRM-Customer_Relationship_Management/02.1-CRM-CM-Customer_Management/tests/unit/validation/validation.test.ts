import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  EnterpriseSchema,
  CompanySchema,
  StoreSchema,
  CustomerQuerySchema,
  BillingInfoSchema
} from '../../../schemas/customer.schema';
import { testDataBuilders } from '../../setup';

describe('Customer Validation Schemas', () => {
  describe('EnterpriseSchema', () => {
    it('should validate valid enterprise data', () => {
      const enterprise = testDataBuilders.createTestEnterprise();
      const result = EnterpriseSchema.safeParse(enterprise);
      
      expect(result.success).toBe(true);
    });

    it('should reject enterprise without required fields', () => {
      const invalidEnterprise = {
        enterprise_name: '測試企業',
        // Missing enterprise_id
      };
      
      const result = EnterpriseSchema.safeParse(invalidEnterprise);
      expect(result.success).toBe(false);
    });

    it('should validate optional fields', () => {
      const enterprise = {
        enterprise_id: 'ENT_001',
        enterprise_name: '測試企業',
        info_completed: false,
      };
      
      const result = EnterpriseSchema.safeParse(enterprise);
      expect(result.success).toBe(true);
    });
  });

  describe('CompanySchema', () => {
    it('should validate valid company data', () => {
      const company = testDataBuilders.createTestCompany();
      const result = CompanySchema.safeParse(company);
      
      expect(result.success).toBe(true);
    });

    it('should validate billing info structure', () => {
      const company = testDataBuilders.createTestCompany();
      const billingResult = BillingInfoSchema.safeParse(company.billing_info);
      
      expect(billingResult.success).toBe(true);
    });

    it('should reject invalid tax ID format', () => {
      const company = {
        company_id: 'COM_001',
        company_name: '測試公司',
        unicode: '123', // Invalid - should be 8 digits
      };
      
      const result = CompanySchema.safeParse(company);
      expect(result.success).toBe(false);
    });

    it('should validate payment terms range', () => {
      const company = testDataBuilders.createTestCompany();
      company.accounting_info!.payment_term = 200; // Out of typical range
      
      const result = CompanySchema.safeParse(company);
      // Should still pass if schema allows it
      expect(result.success).toBe(true);
    });
  });

  describe('StoreSchema', () => {
    it('should validate valid store data', () => {
      const store = testDataBuilders.createTestStore();
      const result = StoreSchema.safeParse(store);
      
      expect(result.success).toBe(true);
    });

    it('should validate logistics time format', () => {
      const store = testDataBuilders.createTestStore();
      store.logistics_info!.start_time = '25:00'; // Invalid time
      
      const result = StoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });

    it('should validate active state enum', () => {
      const store = testDataBuilders.createTestStore();
      store.active_state = 'unknown' as any; // Invalid enum value
      
      const result = StoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });

    it('should validate contact phone format', () => {
      const store = testDataBuilders.createTestStore();
      store.contacts_info![0].contact_phone = '123'; // Too short
      
      const result = StoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });
  });

  describe('CustomerQuerySchema', () => {
    it('should validate search query parameters', () => {
      const query = {
        keyword: 'test',
        customer_type: 'enterprise',
        query_info_not_completed: true,
      };
      
      const result = CustomerQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should allow empty keyword', () => {
      const query = {
        keyword: '',
        customer_type: 'company',
      };
      
      const result = CustomerQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should reject invalid customer type', () => {
      const query = {
        keyword: 'test',
        customer_type: 'invalid',
      };
      
      const result = CustomerQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });
});