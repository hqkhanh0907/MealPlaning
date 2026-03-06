import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ImageCapture } from '../components/ImageCapture';
import { compressImage } from '../utils/imageCompression';

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
    const original = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      writable: true,
      configurable: true,
    });
    render(<ImageCapture {...defaultProps} />);
    expect(screen.getByText('Chụp ảnh')).toBeInTheDocument();
    expect(screen.getByText('Tải ảnh lên')).toBeInTheDocument();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: original,
      writable: true,
      configurable: true,
    });
  });

  it('shows image preview and "Chọn ảnh khác" when image is provided', () => {
    render(<ImageCapture {...defaultProps} image="data:image/png;base64,abc123" />);
    const img = screen.getByAltText('Ảnh món ăn đã tải lên');
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
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    if (!input) return;

    const file = new File(['fake-image'], 'test.png', { type: 'image/png' });

    // Simulate file selection
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    fireEvent.change(input);

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalled();
    });
  });

  it('hides camera button when getUserMedia is not available', async () => {
    // Remove getUserMedia
    const original = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    expect(screen.queryByText('Chụp ảnh')).not.toBeInTheDocument();
    expect(screen.getByText('Tải ảnh lên')).toBeInTheDocument();

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

    // Camera UI is open — full-screen overlay + close button appears
    await waitFor(() => expect(screen.getByTestId('camera-overlay')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText('Đóng camera')).toBeInTheDocument());
  });

  it('renders switch camera button when camera is open', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    await act(async () => { fireEvent.click(screen.getByText('Chụp ảnh')); });
    await waitFor(() => expect(screen.getByLabelText('Đổi camera')).toBeInTheDocument());
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
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('switches between front and back camera', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    await act(async () => { fireEvent.click(screen.getByText('Chụp ảnh')); });
    await waitFor(() => expect(screen.getByLabelText('Đổi camera')).toBeInTheDocument());

    // First call is with environment (back camera)
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment' } });

    await act(async () => { fireEvent.click(screen.getByLabelText('Đổi camera')); });

    // After switch, called again with user (front camera)
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'user' } });
    });
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

  it('shows camera error when getUserMedia rejects', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')) },
      writable: true,
      configurable: true,
    });

    render(<ImageCapture {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Chụp ảnh'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Không thể truy cập camera/)).toBeInTheDocument();
    });
  });

  it('file upload falls back to raw data when compression fails', async () => {
    vi.mocked(compressImage).mockRejectedValueOnce(new Error('compress fail'));

    render(<ImageCapture {...defaultProps} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) return;
    const file = new File(['fake-image'], 'test.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    fireEvent.change(input);

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalled();
    });
  });

  it('paste falls back to raw data when compression fails', async () => {
    vi.mocked(compressImage).mockRejectedValueOnce(new Error('compress fail'));

    render(<ImageCapture {...defaultProps} />);
    const blob = new Blob(['fake-image-data'], { type: 'image/png' });
    const mockItem = { type: 'image/png', getAsFile: () => blob };
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', { value: { items: [mockItem] } });

    await act(async () => {
      globalThis.dispatchEvent(pasteEvent);
    });

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalled();
    });
  });

  it('capturePhoto does nothing when canvas context is null', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as typeof HTMLCanvasElement.prototype.getContext;

    render(<ImageCapture {...defaultProps} />);
    await act(async () => { fireEvent.click(screen.getByText('Chụp ảnh')); });
    await waitFor(() => expect(screen.getByLabelText('Chụp ảnh')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByLabelText('Chụp ảnh')); });

    // context is null, so onImageReady should never be called
    expect(defaultProps.onImageReady).not.toHaveBeenCalled();
  });

  it('capturePhoto falls back to raw data URL when compression fails', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() }) as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,raw');
    vi.mocked(compressImage).mockRejectedValueOnce(new Error('compress fail'));

    render(<ImageCapture {...defaultProps} />);
    await act(async () => { fireEvent.click(screen.getByText('Chụp ảnh')); });
    await waitFor(() => expect(screen.getByLabelText('Chụp ảnh')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByLabelText('Chụp ảnh')); });

    await waitFor(() => {
      expect(defaultProps.onImageReady).toHaveBeenCalledWith('data:image/png;base64,raw');
    });
  });
});
