import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pricingService from '../../../services/pricing';
import { testDataBuilders } from '../../setup';

vi.mock('#libs/services2/request', () => ({
  request: vi.fn(),
  postWithResponse: vi.fn(),
  putWithResponse: vi.fn(),
  deleteRequest: vi.fn(),
}));

describe('Pricing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchPrices', () => {
    it('should search prices with filters', async () => {
      const filters = {
        customer_id: 'CUS_001',
        product_id: 'PROD_001',
        effective_date: '2025-08-20',
        price_type: 'special',
      };

      const result = await pricingService.searchPrices(filters);

      expect(result).toBeDefined();
      expect(result.prices).toBeDefined();
      expect(Array.isArray(result.prices)).toBe(true);
    });

    it('should handle empty filters', async () => {
      const result = await pricingService.searchPrices({});
      
      expect(result).toBeDefined();
      expect(result.prices).toBeDefined();
    });

    it('should validate date format', async () => {
      const filters = {
        effective_date: 'invalid-date',
      };

      await expect(pricingService.searchPrices(filters)).rejects.toThrow('Invalid date format');
    });
  });

  describe('createPrice', () => {
    it('should create single price', async () => {
      const priceData = {
        customer_id: 'CUS_001',
        product_id: 'PROD_001',
        price: 150,
        effective_date: new Date('2025-09-01'),
      };

      const result = await pricingService.createPrice(priceData);

      expect(result).toBeDefined();
      expect(result.price_id).toBeDefined();
      expect(result.price).toBe(150);
    });

    it('should validate price value', async () => {
      const priceData = {
        customer_id: 'CUS_001',
        product_id: 'PROD_001',
        price: -10,
        effective_date: new Date('2025-09-01'),
      };

      await expect(pricingService.createPrice(priceData)).rejects.toThrow('Price must be positive');
    });

    it('should check for duplicate prices', async () => {
      const priceData = {
        customer_id: 'CUS_001',
        product_id: 'PROD_001',
        price: 150,
        effective_date: new Date('2025-09-01'),
      };

      // First creation succeeds
      await pricingService.createPrice(priceData);

      // Duplicate creation fails
      await expect(pricingService.createPrice(priceData)).rejects.toThrow('Duplicate price entry');
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update multiple prices', async () => {
      const updates = {
        price_ids: ['PRC_001', 'PRC_002', 'PRC_003'],
        adjustment_type: 'percentage',
        adjustment_value: 10,
      };

      const result = await pricingService.bulkUpdatePrices(updates);

      expect(result.updated).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      const updates = {
        price_ids: ['PRC_001', 'PRC_INVALID', 'PRC_003'],
        adjustment_type: 'fixed',
        adjustment_value: 50,
      };

      const result = await pricingService.bulkUpdatePrices(updates);

      expect(result.updated).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate adjustment value', async () => {
      const updates = {
        price_ids: ['PRC_001'],
        adjustment_type: 'percentage',
        adjustment_value: 150, // Invalid: > 100%
      };

      await expect(pricingService.bulkUpdatePrices(updates)).rejects.toThrow('Invalid percentage value');
    });
  });

  describe('reprice', () => {
    it('should process market price updates', async () => {
      const repriceData = {
        items: ['MKT_001', 'MKT_002'],
        apply_date: '2025-08-20',
        confirm: true,
      };

      const result = await pricingService.reprice(repriceData);

      expect(result.processed).toBe(2);
      expect(result.orders_affected).toBeGreaterThan(0);
    });

    it('should handle dry run', async () => {
      const repriceData = {
        items: ['MKT_001'],
        apply_date: '2025-08-20',
        dry_run: true,
      };

      const result = await pricingService.reprice(repriceData);

      expect(result.is_dry_run).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.preview).toBeDefined();
    });
  });

  describe('getPriceHistory', () => {
    it('should fetch price history', async () => {
      const history = await pricingService.getPriceHistory('PRC_001');

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history[0]).toHaveProperty('old_price');
      expect(history[0]).toHaveProperty('new_price');
      expect(history[0]).toHaveProperty('changed_at');
    });

    it('should filter by date range', async () => {
      const history = await pricingService.getPriceHistory('PRC_001', {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      });

      expect(history.every(h => {
        const date = new Date(h.changed_at);
        return date >= new Date('2025-01-01') && date <= new Date('2025-12-31');
      })).toBe(true);
    });
  });

  describe('calculateEffectivePrice', () => {
    it('should calculate price with hierarchy', async () => {
      const params = {
        customer_id: 'STO_001',
        product_id: 'PROD_001',
        quantity: 10,
        date: '2025-08-20',
      };

      const result = await pricingService.calculateEffectivePrice(params);

      expect(result.base_price).toBeDefined();
      expect(result.customer_price).toBeDefined();
      expect(result.effective_price).toBeDefined();
      expect(result.applied_level).toBe('store');
    });

    it('should apply quantity discounts', async () => {
      const params = {
        customer_id: 'CUS_001',
        product_id: 'PROD_001',
        quantity: 100,
        date: '2025-08-20',
      };

      const result = await pricingService.calculateEffectivePrice(params);

      expect(result.quantity_discount).toBeGreaterThan(0);
      expect(result.effective_price).toBeLessThan(result.base_price);
    });
  });

  describe('importPrices', () => {
    it('should import prices from file', async () => {
      const file = new File(['price data'], 'prices.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await pricingService.importPrices(file);

      expect(result.import_id).toBeDefined();
      expect(result.total_records).toBeGreaterThan(0);
      expect(result.valid).toBeGreaterThanOrEqual(0);
      expect(result.invalid).toBeGreaterThanOrEqual(0);
    });

    it('should validate file format', async () => {
      const file = new File(['invalid'], 'prices.txt', { type: 'text/plain' });

      await expect(pricingService.importPrices(file)).rejects.toThrow('Invalid file format');
    });

    it('should handle validation errors', async () => {
      const file = new File(['invalid data'], 'prices.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await pricingService.importPrices(file, { validate_only: true });

      expect(result.validation_errors).toBeDefined();
      expect(result.validation_errors.length).toBeGreaterThan(0);
    });
  });
});