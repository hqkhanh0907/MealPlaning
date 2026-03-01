/**
 * Compress and resize an image data URL for API upload.
 * Reduces payload size significantly while maintaining enough quality for AI analysis.
 *
 * @param dataUrl - Base64 data URL (e.g., from FileReader or canvas.toDataURL)
 * @param maxWidth - Maximum width in pixels (default: 1024)
 * @param maxHeight - Maximum height in pixels (default: 1024)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image as base64 data URL (JPEG format)
 */
export const compressImage = (
  dataUrl: string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
};

