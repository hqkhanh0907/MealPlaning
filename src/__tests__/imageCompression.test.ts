import { compressImage } from '../utils/imageCompression';

// Mock canvas context
const mockDrawImage = vi.fn();
const mockToDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,compressed');

const mockGetContext = vi.fn().mockReturnValue({
  drawImage: mockDrawImage,
});

// Track created canvas elements
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') {
    const canvas = originalCreateElement('canvas') as HTMLCanvasElement;
    Object.defineProperty(canvas, 'getContext', { value: mockGetContext });
    Object.defineProperty(canvas, 'toDataURL', { value: mockToDataURL });
    return canvas;
  }
  return originalCreateElement(tag);
});

describe('compressImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves with compressed data URL for small image (no resize)', async () => {
    // Create a mock for Image that fires onload with small dimensions
    const originalImage = globalThis.Image;
    class MockImage {
      width = 500;
      height = 400;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => {
          this.onload?.();
        }, 0);
      }
    }
    globalThis.Image = MockImage as unknown as typeof Image;

    const result = await compressImage('data:image/png;base64,abc');
    expect(result).toBe('data:image/jpeg;base64,compressed');
    expect(mockGetContext).toHaveBeenCalledWith('2d');
    expect(mockDrawImage).toHaveBeenCalled();

    globalThis.Image = originalImage;
  });

  it('resizes image when larger than maxWidth/maxHeight', async () => {
    const originalImage = globalThis.Image;
    class MockImage {
      width = 2048;
      height = 1024;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    globalThis.Image = MockImage as unknown as typeof Image;

    await compressImage('data:image/png;base64,abc', 1024, 1024);
    // width=2048 > 1024, ratio = min(1024/2048, 1024/1024) = 0.5
    // new width = round(2048*0.5)=1024, new height = round(1024*0.5)=512
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 512);

    globalThis.Image = originalImage;
  });

  it('rejects when image fails to load', async () => {
    const originalImage = globalThis.Image;
    class MockImage {
      width = 0;
      height = 0;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    globalThis.Image = MockImage as unknown as typeof Image;

    await expect(compressImage('invalid')).rejects.toThrow('Failed to load image');

    globalThis.Image = originalImage;
  });

  it('rejects when canvas context is null', async () => {
    const originalImage = globalThis.Image;
    class MockImage {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    globalThis.Image = MockImage as unknown as typeof Image;

    mockGetContext.mockReturnValueOnce(null);

    await expect(compressImage('data:image/png;base64,abc')).rejects.toThrow('Failed to get canvas context');

    globalThis.Image = originalImage;
  });
});
