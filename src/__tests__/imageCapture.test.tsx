import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

  it('opens camera when getUserMedia succeeds', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Chụp ảnh'));
    });

    // Camera UI is open — close button appears
    await waitFor(() => expect(screen.getByLabelText('Đóng camera')).toBeInTheDocument());
  });

  it('closes camera and stops stream when close button clicked', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Chụp ảnh'));
    });
    await waitFor(() => expect(screen.getByLabelText('Đóng camera')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Đóng camera'));
    expect(screen.getByText('Chụp ảnh')).toBeInTheDocument();
  });

  it('capturePhoto calls onImageReady with compressed data URL', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    // Mock canvas getContext to return a fake 2d context
    const mockDrawImage = vi.fn();
    const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,captured');
    const mockGetContext = vi.fn().mockReturnValue({ drawImage: mockDrawImage });
    HTMLCanvasElement.prototype.getContext = mockGetContext as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

    render(<ImageCapture {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Chụp ảnh'));
    });
    await waitFor(() => expect(screen.getByLabelText('Chụp ảnh')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Chụp ảnh'));
    });

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalledWith(expect.stringContaining('captured'));
    });
  });

  it('handles paste event with image data', async () => {
    render(<ImageCapture {...defaultProps} />);

    // Create a fake blob for the clipboard item
    const blob = new Blob(['fake-image-data'], { type: 'image/png' });
    const mockItem = {
      type: 'image/png',
      getAsFile: () => blob,
    };

    // Build a ClipboardEvent with a fake clipboardData
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { items: [mockItem] },
    });

    await act(async () => {
      globalThis.dispatchEvent(pasteEvent);
    });

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalled();
    });
  });
});
