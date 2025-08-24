import * as customerService from '../../src/modules/customer/service';
import { query, getClient } from '../../src/database/connection';
import { cache } from '../../src/database/redis';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/database/connection');
jest.mock('../../src/database/redis');
jest.mock('../../src/utils/logger');

describe('Customer Service Unit Tests', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    (getClient as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('createCustomer', () => {
    it('should create customer with automatic tier assignment', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ seq: 1 }] }) // Customer code generation
        .mockResolvedValueOnce({ rows: [] }) // Check duplicate tax ID
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'cust-1', 
            customer_code: 'CUST20250822001',
            tier_level: 1,
            status: 'active'
          }] 
        }) // Insert customer
        .mockResolvedValueOnce(undefined) // Insert contact
        .mockResolvedValueOnce(undefined) // Insert billing address
        .mockResolvedValueOnce(undefined) // Insert shipping address
        .mockResolvedValueOnce(undefined) // Activity log
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      // Mock getCustomerById
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'cust-1',
          customer_code: 'CUST20250822001',
          customer_name: 'Test Customer',
          customer_type: 'retailer',
          tier_level: 1,
          credit_limit: 50000,
          status: 'active'
        }]
      });

      const result = await customerService.createCustomer({
        customerName: 'Test Customer',
        customerType: 'retailer',
        taxId: '12345678',
        primaryContact: {
          name: 'John Doe',
          phone: '0912345678',
          email: 'john@example.com'
        },
        billingAddress: {
          addressLine1: '123 Main St',
          city: 'Taipei',
          country: 'Taiwan'
        },
        creditLimit: 50000,
        paymentTerms: 'NET30',
        createdBy: 'user-1'
      });

      expect(result).toBeDefined();
      expect(result.customerCode).toBe('CUST20250822001');
      expect(result.tierLevel).toBe(1);
      expect(result.status).toBe('active');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(cache.del).toHaveBeenCalledWith('customers:all');
    });

    it('should reject duplicate tax ID', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ seq: 1 }] }) // Customer code
        .mockResolvedValueOnce({ 
          rows: [{ id: 'existing-cust', tax_id: '12345678' }] 
        }); // Duplicate found

      await expect(
        customerService.createCustomer({
          customerName: 'Test Customer',
          customerType: 'retailer',
          taxId: '12345678',
          primaryContact: {
            name: 'John Doe',
            phone: '0912345678'
          },
          billingAddress: {
            addressLine1: '123 Main St',
            city: 'Taipei',
            country: 'Taiwan'
          },
          createdBy: 'user-1'
        })
      ).rejects.toThrow('Tax ID already registered');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should assign higher tier for distributor type', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ seq: 1 }] })
        .mockResolvedValueOnce({ rows: [] }) // No duplicate
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'cust-2',
            tier_level: 3 // Higher tier for distributor
          }] 
        })
        .mockResolvedValueOnce(undefined) // Contact
        .mockResolvedValueOnce(undefined) // Address
        .mockResolvedValueOnce(undefined) // Shipping
        .mockResolvedValueOnce(undefined) // Log
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      // Mock getCustomerById
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'cust-2',
          customer_type: 'distributor',
          tier_level: 3
        }]
      });

      const result = await customerService.createCustomer({
        customerName: 'Big Distributor',
        customerType: 'distributor',
        primaryContact: {
          name: 'Jane Doe',
          phone: '0923456789'
        },
        billingAddress: {
          addressLine1: '456 Commerce St',
          city: 'Kaohsiung',
          country: 'Taiwan'
        },
        creditLimit: 500000,
        createdBy: 'user-1'
      });

      expect(result.tierLevel).toBe(3);
      
      // Verify tier assignment logic in query
      const insertCall = mockClient.query.mock.calls.find(
        (call: any[]) => call[0]?.includes('INSERT INTO customers')
      );
      expect(insertCall).toBeDefined();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer and invalidate cache', async () => {
      const mockCustomer = {
        id: 'cust-1',
        customer_name: 'Old Name',
        tier_level: 1,
        status: 'active'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCustomer] }) // Get customer
        .mockResolvedValueOnce(undefined) // Update customer
        .mockResolvedValueOnce(undefined) // Update contact
        .mockResolvedValueOnce(undefined) // Activity log
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      // Mock getCustomerById
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          ...mockCustomer,
          customer_name: 'New Name',
          tier_level: 2
        }]
      });

      const result = await customerService.updateCustomer('cust-1', {
        customerName: 'New Name',
        tierLevel: 2,
        updatedBy: 'user-1'
      });

      expect(result.customerName).toBe('New Name');
      expect(result.tierLevel).toBe(2);
      expect(cache.del).toHaveBeenCalledTimes(3); // Multiple cache keys cleared
    });

    it('should prevent invalid status transitions', async () => {
      const mockCustomer = {
        id: 'cust-1',
        status: 'blacklisted'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCustomer] }); // Get customer

      await expect(
        customerService.updateCustomer('cust-1', {
          status: 'prospect',
          updatedBy: 'user-1'
        })
      ).rejects.toThrow('Cannot change status from blacklisted to prospect');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('adjustCustomerCredit', () => {
    it('should increase credit limit', async () => {
      const mockCustomer = {
        id: 'cust-1',
        credit_limit: 50000,
        available_credit: 30000
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCustomer] }) // Get customer
        .mockResolvedValueOnce(undefined) // Update credit
        .mockResolvedValueOnce(undefined) // Log adjustment
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await customerService.adjustCustomerCredit({
        customerId: 'cust-1',
        adjustmentType: 'increase',
        amount: 20000,
        reason: 'Good payment history',
        adjustedBy: 'user-1'
      });

      expect(result.newCreditLimit).toBe(70000);
      expect(result.previousCreditLimit).toBe(50000);
      
      // Verify update query
      const updateCall = mockClient.query.mock.calls.find(
        (call: any[]) => call[0]?.includes('UPDATE customers SET credit_limit')
      );
      expect(updateCall[1]).toContain(70000);
    });

    it('should set temporary credit limit with expiry', async () => {
      const mockCustomer = {
        id: 'cust-1',
        credit_limit: 50000
      };

      const expiryDate = new Date('2025-12-31');

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCustomer] })
        .mockResolvedValueOnce(undefined) // Update with temp credit
        .mockResolvedValueOnce(undefined) // Log
        .mockResolvedValueOnce(undefined); // COMMIT

      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await customerService.adjustCustomerCredit({
        customerId: 'cust-1',
        adjustmentType: 'set',
        amount: 100000,
        isTemporary: true,
        expiryDate,
        reason: 'Seasonal promotion',
        adjustedBy: 'user-1'
      });

      expect(result.newCreditLimit).toBe(100000);
      expect(result.isTemporary).toBe(true);
      expect(result.expiryDate).toEqual(expiryDate);
    });

    it('should reject credit decrease below current usage', async () => {
      const mockCustomer = {
        id: 'cust-1',
        credit_limit: 100000,
        available_credit: 20000 // 80000 used
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCustomer] });

      await expect(
        customerService.adjustCustomerCredit({
          customerId: 'cust-1',
          adjustmentType: 'decrease',
          amount: 50000, // Would set limit to 50000, but 80000 is used
          reason: 'Risk assessment',
          adjustedBy: 'user-1'
        })
      ).rejects.toThrow('Cannot decrease credit limit below current usage');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should calculate CLV and churn probability', async () => {
      const mockOrders = [
        { order_date: '2025-08-01', total_amount: 10000 },
        { order_date: '2025-07-15', total_amount: 15000 },
        { order_date: '2025-06-20', total_amount: 8000 },
        { order_date: '2025-05-10', total_amount: 12000 }
      ];

      const mockPayments = [
        { days_to_pay: 25 },
        { days_to_pay: 30 },
        { days_to_pay: 20 }
      ];

      const mockProducts = [
        { item_name: 'Product A', quantity: 100, revenue: 5000 },
        { item_name: 'Product B', quantity: 50, revenue: 3000 }
      ];

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockOrders })
        .mockResolvedValueOnce({ rows: mockPayments })
        .mockResolvedValueOnce({ rows: mockProducts })
        .mockResolvedValueOnce({ rows: [] }); // Seasonal trends

      const result = await customerService.getCustomerAnalytics('cust-1');

      expect(result).toBeDefined();
      
      // CLV calculation
      expect(result.lifetimeValue).toBeGreaterThan(0);
      expect(result.averageOrderValue).toBe(11250); // 45000 / 4
      expect(result.orderFrequency).toBe(4);
      
      // Churn probability based on last order date
      expect(result.churnProbability).toBeDefined();
      expect(result.churnProbability).toBeGreaterThanOrEqual(0);
      expect(result.churnProbability).toBeLessThanOrEqual(1);
      
      // Payment behavior
      expect(result.avgPaymentDays).toBe(25); // (25+30+20) / 3
      
      // Top products
      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0].itemName).toBe('Product A');

      // Verify caching
      expect(cache.set).toHaveBeenCalledWith(
        `customer:analytics:cust-1`,
        result,
        1800
      );
    });

    it('should identify high churn risk for inactive customers', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 180); // 6 months ago

      const mockOrders = [
        { order_date: oldDate.toISOString(), total_amount: 5000 }
      ];

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockOrders })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await customerService.getCustomerAnalytics('cust-1');

      expect(result.churnProbability).toBeGreaterThan(0.8); // High risk
      expect(result.recommendedActions).toContain('reactivation');
    });
  });

  describe('searchCustomers', () => {
    it('should search with multiple filters', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          customer_code: 'CUST001',
          customer_name: 'ABC Company',
          customer_type: 'wholesaler',
          tier_level: 3,
          lifetime_value: 500000
        },
        {
          id: 'cust-2',
          customer_code: 'CUST002',
          customer_name: 'XYZ Store',
          customer_type: 'retailer',
          tier_level: 2,
          lifetime_value: 100000
        }
      ];

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // Count
        .mockResolvedValueOnce({ rows: mockCustomers }); // Results

      const result = await customerService.searchCustomers({
        search: 'Company',
        customerType: ['wholesaler', 'retailer'],
        tierLevel: [2, 3],
        minSpend: 50000,
        page: 1,
        limit: 10
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      
      // Verify query construction
      const queryCall = (query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('customer_type = ANY($');
      expect(queryCall[0]).toContain('tier_level = ANY($');
      expect(queryCall[0]).toContain('lifetime_value >= $');
    });

    it('should identify customers with overdue payments', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ 
          rows: [{
            id: 'cust-1',
            customer_name: 'Overdue Customer',
            has_overdue: true,
            overdue_amount: 50000
          }]
        });

      const result = await customerService.searchCustomers({
        hasOverdue: true,
        page: 1,
        limit: 20
      });

      expect(result.data[0].hasOverdue).toBe(true);
      
      // Verify overdue filter in query
      const queryCall = (query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('outstanding_balance > 0');
    });
  });

  describe('getCustomerTiers', () => {
    it('should return tier configuration with benefits', async () => {
      const mockTiers = [
        {
          tier_level: 1,
          tier_name: 'Bronze',
          min_spend: 0,
          max_spend: 100000,
          discount_rate: 0,
          credit_limit: 50000,
          payment_terms: 'NET15',
          benefits: ['Basic Support']
        },
        {
          tier_level: 2,
          tier_name: 'Silver',
          min_spend: 100001,
          max_spend: 500000,
          discount_rate: 0.05,
          credit_limit: 200000,
          payment_terms: 'NET30',
          benefits: ['Priority Support', '5% Discount']
        },
        {
          tier_level: 3,
          tier_name: 'Gold',
          min_spend: 500001,
          max_spend: null,
          discount_rate: 0.10,
          credit_limit: 500000,
          payment_terms: 'NET45',
          benefits: ['Dedicated Account Manager', '10% Discount', 'Free Shipping']
        }
      ];

      (query as jest.Mock).mockResolvedValueOnce({ rows: mockTiers });

      const result = await customerService.getCustomerTiers();

      expect(result).toHaveLength(3);
      expect(result[0].tierName).toBe('Bronze');
      expect(result[2].discountRate).toBe(0.10);
      expect(result[2].benefits).toContain('Free Shipping');
    });
  });

  // Status transition tests commented out - helper functions not yet implemented  
  // describe('Customer Status Transitions', () => {
  //   it('should validate customer status transitions', () => {});
  // });
});