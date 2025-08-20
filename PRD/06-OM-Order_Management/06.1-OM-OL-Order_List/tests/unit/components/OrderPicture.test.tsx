import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import OrderPicture from '../../../components/OrderPicture';
import { testDataBuilders } from '../../setup';

describe('OrderPicture Component', () => {
  const mockPictures = [
    testDataBuilders.createTestOrderPicture(),
    testDataBuilders.createTestOrderPicture({
      picture_id: 'PIC_002',
      type: 'completed',
      caption: '完成照片',
    }),
  ];

  const defaultProps = {
    orderId: 'ORD_TEST_001',
    pictures: mockPictures,
    onUpload: vi.fn(),
    onDelete: vi.fn(),
    canEdit: true,
  };

  it('should display order pictures', () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    expect(screen.getByAltText('處理中照片')).toBeInTheDocument();
    expect(screen.getByAltText('完成照片')).toBeInTheDocument();
  });

  it('should show picture types', () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    expect(screen.getByText('處理中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('should handle picture upload', async () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/上傳照片/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(defaultProps.onUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
          order_id: 'ORD_TEST_001',
        })
      );
    });
  });

  it('should validate file type', async () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    const file = new File(['text'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/上傳照片/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/只能上傳圖片檔案/)).toBeInTheDocument();
    });
    
    expect(defaultProps.onUpload).not.toHaveBeenCalled();
  });

  it('should validate file size', async () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    // Create a large file (> 5MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const input = screen.getByLabelText(/上傳照片/);
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/檔案大小不可超過 5MB/)).toBeInTheDocument();
    });
  });

  it('should delete picture with confirmation', () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /刪除/ });
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /確認刪除/ });
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('PIC_TEST_001');
  });

  it('should open picture in modal', () => {
    renderWithProviders(<OrderPicture {...defaultProps} />);
    
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('處理中照片')).toBeInTheDocument();
  });

  it('should disable edit when canEdit is false', () => {
    renderWithProviders(<OrderPicture {...defaultProps} canEdit={false} />);
    
    expect(screen.queryByLabelText(/上傳照片/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /刪除/ })).not.toBeInTheDocument();
  });

  it('should show upload progress', async () => {
    const onUpload = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithProviders(<OrderPicture {...defaultProps} onUpload={onUpload} />);
    
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/上傳照片/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/上傳中/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/上傳中/)).not.toBeInTheDocument();
    });
  });
});