import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import StoreOnlyCard from '../../../components/StoreOnlyCard';
import { testDataBuilders } from '../../setup';

describe('StoreOnlyCard', () => {
  const mockStore = testDataBuilders.createTestStoreOnly();
  
  const defaultProps = {
    store: mockStore,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should display independent store', () => {
    renderWithProviders(<StoreOnlyCard {...defaultProps} />);
    
    expect(screen.getByText(mockStore.store_name)).toBeInTheDocument();
    expect(screen.getByText(/獨立門市/)).toBeInTheDocument();
  });

  it('should show no parent company indicator', () => {
    renderWithProviders(<StoreOnlyCard {...defaultProps} />);
    
    const badge = screen.getByTestId('independent-badge');
    expect(badge).toHaveTextContent('無隸屬公司');
  });

  it('should handle direct edit without hierarchy', () => {
    renderWithProviders(<StoreOnlyCard {...defaultProps} />);
    
    const editBtn = screen.getByRole('button', { name: /編輯/ });
    fireEvent.click(editBtn);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockStore.store_id);
  });
});