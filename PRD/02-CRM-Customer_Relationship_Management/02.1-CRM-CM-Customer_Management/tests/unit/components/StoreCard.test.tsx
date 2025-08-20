import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import StoreCard from '../../../components/StoreCard';
import { testDataBuilders } from '../../setup';

describe('StoreCard', () => {
  const mockStore = testDataBuilders.createTestStore();
  
  const defaultProps = {
    store: mockStore,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
  };

  it('should display store basic information', () => {
    renderWithProviders(<StoreCard {...defaultProps} />);
    
    expect(screen.getByText(mockStore.store_name)).toBeInTheDocument();
    expect(screen.getByText(mockStore.store_phone!)).toBeInTheDocument();
  });

  it('should display delivery time window', () => {
    renderWithProviders(<StoreCard {...defaultProps} />);
    
    const logistics = mockStore.logistics_info!;
    expect(screen.getByText(`${logistics.start_time} - ${logistics.end_time}`)).toBeInTheDocument();
  });

  it('should show active status', () => {
    renderWithProviders(<StoreCard {...defaultProps} />);
    
    const status = screen.getByTestId('store-status');
    expect(status).toHaveTextContent('營運中');
    expect(status).toHaveClass('status-active');
  });

  it('should display contact information', () => {
    renderWithProviders(<StoreCard {...defaultProps} />);
    
    const contact = mockStore.contacts_info![0];
    expect(screen.getByText(contact.contact_name)).toBeInTheDocument();
    expect(screen.getByText(contact.contact_phone)).toBeInTheDocument();
  });
});