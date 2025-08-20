import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import EnterpriseCard from '../../../components/EnterpriseCard';
import { testDataBuilders } from '../../setup';

describe('EnterpriseCard', () => {
  const mockEnterprise = testDataBuilders.createTestEnterprise();
  
  const defaultProps = {
    enterprise: mockEnterprise,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onExpand: vi.fn(),
  };

  it('should display enterprise information', () => {
    renderWithProviders(<EnterpriseCard {...defaultProps} />);
    
    expect(screen.getByText(mockEnterprise.enterprise_name)).toBeInTheDocument();
    expect(screen.getByText(mockEnterprise.responsible_name)).toBeInTheDocument();
    expect(screen.getByText(mockEnterprise.phone)).toBeInTheDocument();
  });

  it('should show completion status indicator', () => {
    renderWithProviders(<EnterpriseCard {...defaultProps} />);
    
    const status = screen.getByTestId('completion-status');
    expect(status).toHaveTextContent('資料完整');
  });

  it('should handle edit action', () => {
    renderWithProviders(<EnterpriseCard {...defaultProps} />);
    
    const editBtn = screen.getByRole('button', { name: /編輯/ });
    fireEvent.click(editBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEnterprise.enterprise_id);
  });

  it('should handle expand to show companies', () => {
    renderWithProviders(<EnterpriseCard {...defaultProps} />);
    
    const expandBtn = screen.getByRole('button', { name: /展開/ });
    fireEvent.click(expandBtn);
    
    expect(defaultProps.onExpand).toHaveBeenCalledWith(mockEnterprise.enterprise_id);
  });
});