import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import ClientToolbar from '../../../components/ClientToolbar';

describe('ClientToolbar', () => {
  const defaultProps = {
    customerType: 'enterprise' as const,
    onTypeChange: vi.fn(),
    onSearch: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    selectedCount: 0,
  };

  it('should render customer type selector', () => {
    renderWithProviders(<ClientToolbar {...defaultProps} />);
    
    const selector = screen.getByLabelText(/客戶類型/);
    expect(selector).toBeInTheDocument();
    expect(selector).toHaveValue('enterprise');
  });

  it('should call onTypeChange when type is changed', () => {
    renderWithProviders(<ClientToolbar {...defaultProps} />);
    
    const selector = screen.getByLabelText(/客戶類型/);
    fireEvent.change(selector, { target: { value: 'company' } });
    
    expect(defaultProps.onTypeChange).toHaveBeenCalledWith('company');
  });

  it('should show export button when items are selected', () => {
    renderWithProviders(
      <ClientToolbar {...defaultProps} selectedCount={3} />
    );
    
    const exportBtn = screen.getByRole('button', { name: /匯出選中/ });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).toBeEnabled();
  });

  it('should disable export when no items selected', () => {
    renderWithProviders(<ClientToolbar {...defaultProps} />);
    
    const exportBtn = screen.getByRole('button', { name: /匯出/ });
    expect(exportBtn).toBeDisabled();
  });

  it('should show import button and handle click', () => {
    renderWithProviders(<ClientToolbar {...defaultProps} />);
    
    const importBtn = screen.getByRole('button', { name: /匯入/ });
    fireEvent.click(importBtn);
    
    expect(defaultProps.onImport).toHaveBeenCalled();
  });
});