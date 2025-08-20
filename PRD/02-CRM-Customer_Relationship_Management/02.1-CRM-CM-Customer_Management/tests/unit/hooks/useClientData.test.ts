import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useClientData } from '../../../hooks/useClientData';
import * as api from '../../../service/request';

// Mock API 模組
vi.mock('../../../service/request', () => ({
  getEnterprises: vi.fn(),
  getCompanies: vi.fn(),
  getStores: vi.fn(),
}));

// Mock Toast
const mockToast = vi.fn();
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

describe('useClientData Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Initial State', () => {
    it('should initialize with null data and not loading', () => {
      const { result } = renderHook(() => useClientData(), { wrapper });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useClientData(), { wrapper });

      expect(result.current.searchEnterprises).toBeDefined();
      expect(result.current.searchCompanies).toBeDefined();
      expect(result.current.searchStores).toBeDefined();
      expect(result.current.clearData).toBeDefined();
    });
  });

  describe('searchEnterprises', () => {
    it('should successfully search enterprises', async () => {
      const mockData = [
        { enterprise_id: 'ENT001', enterprise_name: 'Test Enterprise' },
      ];
      vi.mocked(api.getEnterprises).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchEnterprises({
          keyword: 'Test',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(api.getEnterprises).toHaveBeenCalledWith({
        keyword: 'Test',
        query_info_not_completed: false,
      });
    });

    it('should handle enterprise search error', async () => {
      const errorMessage = 'Network error';
      vi.mocked(api.getEnterprises).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchEnterprises({
          keyword: 'Test',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('搜尋集團資料失敗');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '搜尋集團資料失敗',
        description: '請稍後再試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });

    it('should set loading state during enterprise search', async () => {
      vi.mocked(api.getEnterprises).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() => useClientData(), { wrapper });

      const searchPromise = result.current.searchEnterprises({
        keyword: 'Test',
        query_info_not_completed: false,
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await searchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('searchCompanies', () => {
    it('should successfully search companies', async () => {
      const mockData = {
        companies: [
          { company_id: 'COM001', company_name: 'Test Company' },
        ],
      };
      vi.mocked(api.getCompanies).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchCompanies({
          keyword: 'Test',
          invoice_type: 'B2B',
          closing_date: '25',
          payment_term: '30',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.getCompanies).toHaveBeenCalledWith({
        keyword: 'Test',
        invoice_type: 'B2B',
        closing_date: '25',
        payment_term: '30',
        query_info_not_completed: false,
      });
    });

    it('should handle company search error', async () => {
      vi.mocked(api.getCompanies).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchCompanies({
          keyword: 'Test',
          invoice_type: '',
          closing_date: '',
          payment_term: '',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBe('搜尋公司資料失敗');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '搜尋公司資料失敗',
        description: '請稍後再試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });

    it('should handle empty company search results', async () => {
      vi.mocked(api.getCompanies).mockResolvedValueOnce({ companies: [] });

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchCompanies({
          keyword: 'NonExistent',
          invoice_type: '',
          closing_date: '',
          payment_term: '',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ companies: [] });
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('searchStores', () => {
    it('should successfully search stores', async () => {
      const mockData = {
        stores: [
          { store_id: 'STO001', store_name: 'Test Store' },
        ],
      };
      vi.mocked(api.getStores).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchStores({
          keyword: 'Test',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          active_state: 'active',
          ctm: '',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(api.getStores).toHaveBeenCalledWith({
        keyword: 'Test',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        active_state: 'active',
        ctm: '',
        query_info_not_completed: false,
      });
    });

    it('should handle store search error', async () => {
      vi.mocked(api.getStores).mockRejectedValueOnce(new Error('Store API Error'));

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchStores({
          keyword: 'Test',
          start_date: '',
          end_date: '',
          active_state: '',
          ctm: '',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBe('搜尋店家資料失敗');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '搜尋店家資料失敗',
        description: '請稍後再試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });

    it('should filter stores by active state', async () => {
      const mockData = {
        stores: [
          { store_id: 'STO001', store_name: 'Active Store', active_state: 'active' },
        ],
      };
      vi.mocked(api.getStores).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchStores({
          keyword: '',
          start_date: '',
          end_date: '',
          active_state: 'active',
          ctm: '',
          query_info_not_completed: false,
        });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });
  });

  describe('clearData', () => {
    it('should clear all data and error', async () => {
      const mockData = [
        { enterprise_id: 'ENT001', enterprise_name: 'Test Enterprise' },
      ];
      vi.mocked(api.getEnterprises).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useClientData(), { wrapper });

      // First, set some data
      await act(async () => {
        await result.current.searchEnterprises({
          keyword: 'Test',
          query_info_not_completed: false,
        });
      });

      expect(result.current.data).toEqual(mockData);

      // Then clear it
      act(() => {
        result.current.clearData();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear error state', async () => {
      vi.mocked(api.getEnterprises).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useClientData(), { wrapper });

      await act(async () => {
        await result.current.searchEnterprises({
          keyword: 'Test',
          query_info_not_completed: false,
        });
      });

      expect(result.current.error).toBe('搜尋集團資料失敗');

      act(() => {
        result.current.clearData();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Concurrent Searches', () => {
    it('should handle switching between different search types', async () => {
      const enterpriseData = [{ enterprise_id: 'ENT001' }];
      const companyData = { companies: [{ company_id: 'COM001' }] };
      
      vi.mocked(api.getEnterprises).mockResolvedValueOnce(enterpriseData);
      vi.mocked(api.getCompanies).mockResolvedValueOnce(companyData);

      const { result } = renderHook(() => useClientData(), { wrapper });

      // Search enterprises first
      await act(async () => {
        await result.current.searchEnterprises({
          keyword: 'Enterprise',
          query_info_not_completed: false,
        });
      });

      expect(result.current.data).toEqual(enterpriseData);

      // Then search companies
      await act(async () => {
        await result.current.searchCompanies({
          keyword: 'Company',
          invoice_type: '',
          closing_date: '',
          payment_term: '',
          query_info_not_completed: false,
        });
      });

      expect(result.current.data).toEqual(companyData);
    });
  });
});