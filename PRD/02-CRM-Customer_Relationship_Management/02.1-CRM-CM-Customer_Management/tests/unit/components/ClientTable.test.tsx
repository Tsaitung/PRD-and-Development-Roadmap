import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import ClientTable from '../../../components/ClientTable';
import { testDataBuilders } from '../../setup';

describe('ClientTable Component', () => {
  const mockData = {
    enterprises: [testDataBuilders.createTestEnterprise()],
    companies: { companies: [testDataBuilders.createTestCompany()] },
    stores: { stores: [testDataBuilders.createTestStore()] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering States', () => {
    it('should render loading state correctly', () => {
      renderWithProviders(
        <ClientTable 
          data={null} 
          clientType="" 
          isLoading={true} 
        />
      );

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      renderWithProviders(
        <ClientTable 
          data={null} 
          clientType="" 
          isLoading={false} 
        />
      );

      expect(screen.getByText(/請選擇客戶類型並輸入關鍵字進行搜尋/)).toBeInTheDocument();
    });

    it('should render no results state when data is empty array', () => {
      renderWithProviders(
        <ClientTable 
          data={[]} 
          clientType="enterprise" 
          isLoading={false} 
        />
      );

      expect(screen.getByText('查無符合條件的資料')).toBeInTheDocument();
    });
  });

  describe('Enterprise Display', () => {
    it('should render enterprise data correctly', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.enterprises} 
          clientType="enterprise" 
          isLoading={false} 
        />
      );

      expect(screen.getByText('測試企業集團')).toBeInTheDocument();
      expect(screen.getByText('王大明')).toBeInTheDocument();
      expect(screen.getByText('0912345678')).toBeInTheDocument();
    });

    it('should handle enterprise expansion toggle', async () => {
      const hierarchy = testDataBuilders.createHierarchyStructure();
      
      renderWithProviders(
        <ClientTable 
          data={[hierarchy.enterprise]} 
          clientType="enterprise" 
          isLoading={false} 
        />
      );

      const expandButton = screen.getByRole('button', { name: /展開/ });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('測試有限公司')).toBeInTheDocument();
      });
    });

    it('should show info completion status badge', () => {
      const incompleteEnterprise = testDataBuilders.createTestEnterprise({
        info_completed: false,
      });

      renderWithProviders(
        <ClientTable 
          data={[incompleteEnterprise]} 
          clientType="enterprise" 
          isLoading={false} 
        />
      );

      expect(screen.getByText('資料未完整')).toBeInTheDocument();
    });
  });

  describe('Company Display', () => {
    it('should render company data correctly', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.companies} 
          clientType="company" 
          isLoading={false} 
        />
      );

      expect(screen.getByText('測試有限公司')).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
      expect(screen.getByText('李小華')).toBeInTheDocument();
    });

    it('should display billing information', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.companies} 
          clientType="company" 
          isLoading={false} 
        />
      );

      expect(screen.getByText(/B2B/)).toBeInTheDocument();
      expect(screen.getByText(/月結/)).toBeInTheDocument();
      expect(screen.getByText(/25日/)).toBeInTheDocument();
    });

    it('should handle company expansion to show stores', async () => {
      const hierarchy = testDataBuilders.createHierarchyStructure();
      
      renderWithProviders(
        <ClientTable 
          data={{ companies: hierarchy.companies }} 
          clientType="company" 
          isLoading={false} 
        />
      );

      const expandButton = screen.getAllByRole('button', { name: /展開/ })[0];
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('測試門市')).toBeInTheDocument();
        expect(screen.getByText('測試二號門市')).toBeInTheDocument();
      });
    });
  });

  describe('Store Display', () => {
    it('should render store data correctly', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.stores} 
          clientType="store" 
          isLoading={false} 
        />
      );

      expect(screen.getByText('測試門市')).toBeInTheDocument();
      expect(screen.getByText('03-1234567')).toBeInTheDocument();
      expect(screen.getByText(/active/)).toBeInTheDocument();
    });

    it('should display logistics information', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.stores} 
          clientType="store" 
          isLoading={false} 
        />
      );

      expect(screen.getByText(/桃園市中壢區測試街50號/)).toBeInTheDocument();
      expect(screen.getByText(/09:00 - 18:00/)).toBeInTheDocument();
    });

    it('should show inactive store status', () => {
      const inactiveStore = testDataBuilders.createTestStore({
        active_state: 'inactive',
      });

      renderWithProviders(
        <ClientTable 
          data={{ stores: [inactiveStore] }} 
          clientType="store" 
          isLoading={false} 
        />
      );

      expect(screen.getByText(/inactive/)).toBeInTheDocument();
    });

    it('should display contact information', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.stores} 
          clientType="store" 
          isLoading={false} 
        />
      );

      expect(screen.getByText('張經理')).toBeInTheDocument();
      expect(screen.getByText('0923456789')).toBeInTheDocument();
    });
  });

  describe('Interaction Features', () => {
    it('should handle row selection', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.enterprises} 
          clientType="enterprise" 
          isLoading={false} 
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('should handle edit action', () => {
      const onEdit = vi.fn();
      
      renderWithProviders(
        <ClientTable 
          data={mockData.enterprises} 
          clientType="enterprise" 
          isLoading={false} 
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /編輯/ });
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith('ENT_TEST_001');
    });

    it('should handle view details action', () => {
      const onViewDetails = vi.fn();
      
      renderWithProviders(
        <ClientTable 
          data={mockData.companies} 
          clientType="company" 
          isLoading={false} 
          onViewDetails={onViewDetails}
        />
      );

      const viewButton = screen.getByRole('button', { name: /檢視/ });
      fireEvent.click(viewButton);

      expect(onViewDetails).toHaveBeenCalledWith('COM_TEST_001');
    });
  });

  describe('Sorting and Filtering', () => {
    it('should sort data by name', async () => {
      const multipleEnterprises = [
        testDataBuilders.createTestEnterprise({ enterprise_name: 'B企業' }),
        testDataBuilders.createTestEnterprise({ enterprise_name: 'A企業' }),
        testDataBuilders.createTestEnterprise({ enterprise_name: 'C企業' }),
      ];

      renderWithProviders(
        <ClientTable 
          data={multipleEnterprises} 
          clientType="enterprise" 
          isLoading={false} 
        />
      );

      const sortButton = screen.getByRole('button', { name: /排序/ });
      fireEvent.click(sortButton);

      await waitFor(() => {
        const names = screen.getAllByTestId('enterprise-name');
        expect(names[0]).toHaveTextContent('A企業');
        expect(names[1]).toHaveTextContent('B企業');
        expect(names[2]).toHaveTextContent('C企業');
      });
    });

    it('should filter by completion status', () => {
      const mixedData = [
        testDataBuilders.createTestEnterprise({ info_completed: true }),
        testDataBuilders.createTestEnterprise({ info_completed: false }),
      ];

      renderWithProviders(
        <ClientTable 
          data={mixedData} 
          clientType="enterprise" 
          isLoading={false} 
          filterIncomplete={true}
        />
      );

      expect(screen.queryByText('資料完整')).not.toBeInTheDocument();
      expect(screen.getByText('資料未完整')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should display mobile-friendly layout on small screens', () => {
      // Mock window size
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(
        <ClientTable 
          data={mockData.stores} 
          clientType="store" 
          isLoading={false} 
        />
      );

      // Check for mobile-specific elements
      expect(screen.getByTestId('mobile-card-view')).toBeInTheDocument();
    });

    it('should handle horizontal scroll on wide tables', () => {
      renderWithProviders(
        <ClientTable 
          data={mockData.companies} 
          clientType="company" 
          isLoading={false} 
        />
      );

      const tableContainer = screen.getByTestId('table-container');
      expect(tableContainer).toHaveStyle({ overflowX: 'auto' });
    });
  });
});