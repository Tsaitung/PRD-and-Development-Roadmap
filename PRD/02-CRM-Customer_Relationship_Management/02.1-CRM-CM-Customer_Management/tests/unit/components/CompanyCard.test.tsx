import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import CompanyCard from '../../../components/CompanyCard';
import { testDataBuilders } from '../../setup';

describe('CompanyCard', () => {
  const mockCompany = testDataBuilders.createTestCompany();
  
  const defaultProps = {
    company: mockCompany,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onExpand: vi.fn(),
  };

  it('should display company basic information', () => {
    renderWithProviders(<CompanyCard {...defaultProps} />);
    
    expect(screen.getByText(mockCompany.company_name)).toBeInTheDocument();
    expect(screen.getByText(mockCompany.unicode!)).toBeInTheDocument();
  });

  it('should display billing information', () => {
    renderWithProviders(<CompanyCard {...defaultProps} />);
    
    expect(screen.getByText(/B2B/)).toBeInTheDocument();
    expect(screen.getByText(/結帳日: 25/)).toBeInTheDocument();
  });

  it('should display payment terms', () => {
    renderWithProviders(<CompanyCard {...defaultProps} />);
    
    expect(screen.getByText(/付款條件: 30天/)).toBeInTheDocument();
  });

  it('should handle expand to show stores', () => {
    renderWithProviders(<CompanyCard {...defaultProps} />);
    
    const expandBtn = screen.getByRole('button', { name: /展開門市/ });
    fireEvent.click(expandBtn);
    
    expect(defaultProps.onExpand).toHaveBeenCalledWith(mockCompany.company_id);
  });
});