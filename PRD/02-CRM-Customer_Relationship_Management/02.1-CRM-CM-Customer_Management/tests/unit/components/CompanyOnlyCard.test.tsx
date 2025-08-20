import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import CompanyOnlyCard from '../../../components/CompanyOnlyCard';
import { testDataBuilders } from '../../setup';

describe('CompanyOnlyCard', () => {
  const mockCompany = testDataBuilders.createTestCompanyOnly();
  
  const defaultProps = {
    company: mockCompany,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should display company without enterprise', () => {
    renderWithProviders(<CompanyOnlyCard {...defaultProps} />);
    
    expect(screen.getByText(mockCompany.company_name)).toBeInTheDocument();
    expect(screen.getByText(/獨立公司/)).toBeInTheDocument();
  });

  it('should show no parent enterprise indicator', () => {
    renderWithProviders(<CompanyOnlyCard {...defaultProps} />);
    
    const badge = screen.getByTestId('independent-badge');
    expect(badge).toHaveTextContent('無隸屬企業');
  });

  it('should handle direct store management', () => {
    renderWithProviders(<CompanyOnlyCard {...defaultProps} />);
    
    const manageBtn = screen.getByRole('button', { name: /管理門市/ });
    fireEvent.click(manageBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockCompany.company_id, 'stores');
  });
});