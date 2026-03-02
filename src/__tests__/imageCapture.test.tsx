import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageCapture } from '../components/ImageCapture';

// Mock compressImage
vi.mock('../utils/imageCompression', () => ({
  compressImage: vi.fn().mockImplementation((data: string) => Promise.resolve(data + '-compressed')),
}));

describe('ImageCapture', () => {
  const defaultProps = {
    image: null as string | null,
    onImageReady: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders upload and camera buttons when no image', () => {
    render(<ImageCapture {...defaultProps} />);
    expect(screen.getByText('Chụp ảnh')).toBeInTheDocument();
    expect(screen.getByText('Tải ảnh lên')).toBeInTheDocument();
  });

  it('shows image preview and "Chọn ảnh khác" when image is provided', () => {
    render(<ImageCapture {...defaultProps} image="data:image/png;base64,abc123" />);
    const img = screen.getByAltText('Uploaded dish');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('data:image/png;base64,abc123');
    expect(screen.getByText('Chọn ảnh khác')).toBeInTheDocument();
  });

  it('calls onClear when "Chọn ảnh khác" is clicked', () => {
    render(<ImageCapture {...defaultProps} image="data:image/png;base64,abc" />);
    fireEvent.click(screen.getByText('Chọn ảnh khác'));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('handles file upload via hidden input', async () => {
    render(<ImageCapture {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(['fake-image'], 'test.png', { type: 'image/png' });

    // Simulate file selection
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    fireEvent.change(input);

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalled();
    });
  });

  it('shows camera error when getUserMedia is not available', async () => {
    // Remove getUserMedia
    const original = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    fireEvent.click(screen.getByText('Chụp ảnh'));

    expect(screen.getByText(/Thiết bị không hỗ trợ camera/)).toBeInTheDocument();
    expect(screen.getByText('Đóng camera')).toBeInTheDocument();

    // Close camera error
    fireEvent.click(screen.getByText('Đóng camera'));
    expect(screen.getByText('Chụp ảnh')).toBeInTheDocument();

    // Restore
    Object.defineProperty(navigator, 'mediaDevices', {
      value: original,
      writable: true,
      configurable: true,
    });
  });

  it('shows supported formats hint text', () => {
    render(<ImageCapture {...defaultProps} />);
    expect(screen.getByText(/Hỗ trợ JPG, PNG/)).toBeInTheDocument();
  });
});
