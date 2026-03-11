# AI Image Analysis - Test Code Snippets

## 1. COMPONENT TEST SKELETON

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIImageAnalyzer } from '../components/AIImageAnalyzer';
import * as geminiService from '../services/geminiService';
import { NotFoodImageError, AnalyzedDishResult } from '../types';

vi.mock('../services/geminiService');
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AIImageAnalyzer', () => {
  const mockOnAnalysisComplete = vi.fn();
  const mockOnSave = vi.fn();

  const mockResult: AnalyzedDishResult = {
    isFood: true,
    name: 'Phở',
    description: 'Vietnamese noodle soup',
    totalNutrition: {
      calories: 250,
      protein: 15,
      fat: 5,
      carbs: 30,
    },
    ingredients: [
      {
        name: 'Rice noodles',
        amount: 150,
        unit: 'g',
        nutritionPerStandardUnit: {
          calories: 130,
          protein: 3,
          fat: 0,
          carbs: 28,
          fiber: 1,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display 3-step progress indicator initially', () => {
    render(
      <AIImageAnalyzer
        onAnalysisComplete={mockOnAnalysisComplete}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.getByTestId('ai-image-analyzer')).toBeInTheDocument();
    // Verify 3-step indicator elements
  });

  it('should call analyzeDishImage when analyze button clicked with image', async () => {
    vi.mocked(geminiService.analyzeDishImage).mockResolvedValueOnce(
      mockResult
    );

    const { getByTestId, getByRole } = render(
      <AIImageAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />
    );

    // Simulate image upload
    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
    // Mock ImageCapture to call onImageReady
    
    const analyzeButton = getByRole('button', { name: /analyzeDish/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(geminiService.analyzeDishImage).toHaveBeenCalled();
    });
  });

  it('should handle NotFoodImageError gracefully', async () => {
    const mockNotify = { warning: vi.fn() };
    vi.mocked(useNotification).mockReturnValue(mockNotify);
    
    vi.mocked(geminiService.analyzeDishImage).mockRejectedValueOnce(
      new NotFoodImageError('Đây là ảnh phong cảnh')
    );

    // Render and trigger analysis
    
    await waitFor(() => {
      expect(mockNotify.warning).toHaveBeenCalledWith(
        'ai.notFoodTitle',
        'Đây là ảnh phong cảnh'
      );
    });
  });
});
```

---

## 2. IMAGECAPTURE CAMERA TEST

```typescript
describe('ImageCapture - Camera', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockStream: any;

  beforeEach(() => {
    mockStream = {
      getTracks: vi.fn().mockReturnValue([
        { stop: vi.fn(), kind: 'video' },
      ]),
    };

    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });
  });

  it('should request camera with environment facing mode by default', async () => {
    const onImageReady = vi.fn();
    const { getByRole } = render(
      <ImageCapture
        image={null}
        onImageReady={onImageReady}
        onClear={() => {}}
      />
    );

    const cameraButton = getByRole('button', { name: /takePhoto/i });
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' },
      });
    });
  });

  it('should switch from rear to front camera', async () => {
    const onImageReady = vi.fn();
    const { getByLabelText } = render(
      <ImageCapture
        image={null}
        onImageReady={onImageReady}
        onClear={() => {}}
      />
    );

    // Open camera
    const cameraButton = screen.getByRole('button', { name: /takePhoto/i });
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' },
      });
    });

    // Switch camera
    const switchButton = getByLabelText(/switchCamera/i);
    fireEvent.click(switchButton);

    // Verify it stopped old stream
    expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();

    // Verify it requested front camera
    expect(mockGetUserMedia).toHaveBeenLastCalledWith({
      video: { facingMode: 'user' },
    });
  });

  it('should show error and allow close on permission denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError')
    );

    const { getByRole, getByText } = render(
      <ImageCapture
        image={null}
        onImageReady={() => {}}
        onClear={() => {}}
      />
    );

    const cameraButton = getByRole('button', { name: /takePhoto/i });
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(getByText(/imageCapture.cameraAccessDenied/i)).toBeInTheDocument();
    });

    // Close button should be available
    const closeButton = getByRole('button', { name: /closeCamera/i });
    fireEvent.click(closeButton);

    // Should be back to initial state
    expect(getByRole('button', { name: /takePhoto/i })).toBeInTheDocument();
  });
});
```

---

## 3. IMAGECAPTURE FILE UPLOAD TEST

```typescript
describe('ImageCapture - File Upload', () => {
  it('should compress uploaded image and call onImageReady', async () => {
    const onImageReady = vi.fn();
    const compressedBase64 = 'data:image/jpeg;base64,compressed...';
    
    vi.mocked(compressImage).mockResolvedValueOnce(compressedBase64);

    const { getByRole } = render(
      <ImageCapture
        image={null}
        onImageReady={onImageReady}
        onClear={() => {}}
      />
    );

    const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = getByRole('button', { name: /uploadImage/i }).querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(compressImage).toHaveBeenCalled();
      expect(onImageReady).toHaveBeenCalledWith(compressedBase64);
    });
  });

  it('should fallback to uncompressed if compression fails', async () => {
    const onImageReady = vi.fn();
    const originalBase64 = 'data:image/jpeg;base64,original...';
    
    vi.mocked(compressImage).mockRejectedValueOnce(
      new Error('Compression failed')
    );

    // Mock FileReader to return originalBase64
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      result: originalBase64,
      onloadend: null as any,
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    const { container } = render(
      <ImageCapture
        image={null}
        onImageReady={onImageReady}
        onClear={() => {}}
      />
    );

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger FileReader onloadend
    mockFileReader.onloadend();

    await waitFor(() => {
      expect(onImageReady).toHaveBeenCalledWith(originalBase64);
    });
  });
});
```

---

## 4. CLIPBOARD PASTE TEST

```typescript
describe('ImageCapture - Clipboard Paste', () => {
  it('should paste image from clipboard', async () => {
    const onImageReady = vi.fn();
    const compressedBase64 = 'data:image/jpeg;base64,compressed...';

    vi.mocked(compressImage).mockResolvedValueOnce(compressedBase64);

    render(
      <ImageCapture
        image={null}
        onImageReady={onImageReady}
        onClear={() => {}}
      />
    );

    // Simulate paste event
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
    });

    const imageFile = new File(['image'], 'paste.jpg', { type: 'image/jpeg' });
    pasteEvent.clipboardData?.items.add(imageFile);

    fireEvent.paste(document, pasteEvent);

    await waitFor(() => {
      expect(onImageReady).toHaveBeenCalledWith(compressedBase64);
    });
  });

  it('should ignore non-image clipboard content', () => {
    const onImageReady = vi.fn();

    render(
      <ImageCapture
        image={null}
        onImageReady={onImageReady}
        onClear={() => {}}
      />
    );

    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
    });

    // Add text instead of image
    pasteEvent.clipboardData?.setData('text/plain', 'some text');

    fireEvent.paste(document, pasteEvent);

    // Should not call onImageReady
    expect(onImageReady).not.toHaveBeenCalled();
  });
});
```

---

## 5. IMAGE COMPRESSION TEST

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { compressImage } from '../utils/imageCompression';

describe('compressImage', () => {
  it('should not resize image smaller than max dimensions', async () => {
    const mockImage = {
      width: 500,
      height: 400,
      onload: null as any,
      src: '',
    };

    const mockDrawImage = vi.fn();
    const mockToDataURL = vi
      .fn()
      .mockReturnValue('data:image/jpeg;base64,compressed');

    global.Image = vi.fn(() => mockImage) as any;
    
    const mockCanvas = document.createElement('canvas');
    mockCanvas.getContext = vi.fn().mockReturnValue({
      drawImage: mockDrawImage,
    });
    mockCanvas.toDataURL = mockToDataURL;

    const result = await compressImage('data:image/jpeg;base64,original');

    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      500,
      400
    );
    expect(result).toBe('data:image/jpeg;base64,compressed');
  });

  it('should resize large image maintaining aspect ratio', async () => {
    const mockImage = {
      width: 2048,
      height: 1024,
      onload: null as any,
      src: '',
    };

    global.Image = vi.fn(() => mockImage) as any;

    // Ratio = min(1024/2048, 1024/1024) = 0.5
    // Expected: width=1024, height=512

    const mockDrawImage = vi.fn();
    const mockCanvas = document.createElement('canvas');
    mockCanvas.getContext = vi.fn().mockReturnValue({
      drawImage: mockDrawImage,
    });

    await compressImage('data:image/jpeg;base64,original', 1024, 1024, 0.8);

    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1024,
      512
    );
  });

  it('should reject on image load error', async () => {
    const mockImage = {
      width: 0,
      height: 0,
      onload: null as any,
      onerror: null as any,
      src: '',
    };

    global.Image = vi.fn(() => mockImage) as any;

    const promise = compressImage('invalid');

    // Trigger onerror
    mockImage.onerror?.();

    await expect(promise).rejects.toThrow('Failed to load image');
  });

  it('should use provided quality setting', async () => {
    const mockImage = { width: 100, height: 100, onload: null as any, src: '' };
    global.Image = vi.fn(() => mockImage) as any;

    const mockToDataURL = vi
      .fn()
      .mockReturnValue('data:image/jpeg;base64,compressed');

    const mockCanvas = document.createElement('canvas');
    mockCanvas.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
    mockCanvas.toDataURL = mockToDataURL;

    await compressImage('data:image/jpeg;base64,test', 1024, 1024, 0.6);

    // Verify quality parameter passed to toDataURL
    expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.6);
  });
});
```

---

## 6. GEMINI SERVICE ANALYSIS TEST

```typescript
import { analyzeDishImage } from '../services/geminiService';
import { NotFoodImageError } from '../types';

describe('analyzeDishImage', () => {
  beforeEach(() => {
    vi.mocked(GoogleGenAI).mockClear();
  });

  it('should return AnalyzedDishResult for valid food image', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValueOnce({
      text: JSON.stringify({
        isFood: true,
        name: 'Phở',
        description: 'Vietnamese noodle soup',
        totalNutrition: {
          calories: 250,
          protein: 15,
          fat: 5,
          carbs: 30,
        },
        ingredients: [
          {
            name: 'Rice noodles',
            amount: 150,
            unit: 'g',
            nutritionPerStandardUnit: {
              calories: 130,
              protein: 3,
              fat: 0,
              carbs: 28,
              fiber: 1,
            },
          },
        ],
      }),
    });

    vi.mocked(GoogleGenAI).mockReturnValueOnce({
      models: { generateContent: mockGenerateContent },
    } as any);

    const result = await analyzeDishImage('base64imagedata', 'image/jpeg');

    expect(result.name).toBe('Phở');
    expect(result.totalNutrition.calories).toBe(250);
    expect(result.ingredients).toHaveLength(1);
    expect(result.ingredients[0].unit).toBe('g');
    expect(
      result.ingredients[0].nutritionPerStandardUnit.fiber
    ).toBe(1);
  });

  it('should throw NotFoodImageError when isFood is false', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValueOnce({
      text: JSON.stringify({
        isFood: false,
        notFoodReason: 'Đây là ảnh phong cảnh, không phải thực phẩm',
        name: '',
        description: '',
        totalNutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
        ingredients: [],
      }),
    });

    vi.mocked(GoogleGenAI).mockReturnValueOnce({
      models: { generateContent: mockGenerateContent },
    } as any);

    await expect(
      analyzeDishImage('base64imagedata', 'image/jpeg')
    ).rejects.toThrow(NotFoodImageError);

    try {
      await analyzeDishImage('base64imagedata', 'image/jpeg');
    } catch (error) {
      if (error instanceof NotFoodImageError) {
        expect(error.reason).toBe(
          'Đây là ảnh phong cảnh, không phải thực phẩm'
        );
      }
    }
  });

  it('should retry on transient network error', async () => {
    const mockGenerateContent = vi.fn();

    // First call fails with network error
    mockGenerateContent.mockRejectedValueOnce(new Error('Network error'));

    // Second call succeeds
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        isFood: true,
        name: 'Phở',
        description: 'Vietnamese noodle soup',
        totalNutrition: {
          calories: 250,
          protein: 15,
          fat: 5,
          carbs: 30,
        },
        ingredients: [],
      }),
    });

    vi.mocked(GoogleGenAI).mockReturnValue({
      models: { generateContent: mockGenerateContent },
    } as any);

    const result = await analyzeDishImage('base64', 'image/jpeg');

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result.name).toBe('Phở');
  });

  it('should not retry on validation error', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValueOnce(
      new Error('Invalid response from AI: missing field')
    );

    vi.mocked(GoogleGenAI).mockReturnValue({
      models: { generateContent: mockGenerateContent },
    } as any);

    await expect(
      analyzeDishImage('base64', 'image/jpeg')
    ).rejects.toThrow();

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should not retry on timeout error', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValueOnce(
      new Error('Dish image analysis timed out after 30s')
    );

    vi.mocked(GoogleGenAI).mockReturnValue({
      models: { generateContent: mockGenerateContent },
    } as any);

    await expect(
      analyzeDishImage('base64', 'image/jpeg')
    ).rejects.toThrow();

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should throw AbortError when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      analyzeDishImage('base64', 'image/jpeg', controller.signal)
    ).rejects.toThrow(DOMException);
  });

  it('should properly encode image data in request', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValueOnce({
      text: JSON.stringify({
        isFood: true,
        name: 'Phở',
        description: '',
        totalNutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
        ingredients: [],
      }),
    });

    vi.mocked(GoogleGenAI).mockReturnValueOnce({
      models: { generateContent: mockGenerateContent },
    } as any);

    await analyzeDishImage('abc123base64', 'image/jpeg');

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          inlineData: {
            data: 'abc123base64',
            mimeType: 'image/jpeg',
          },
        }),
      ])
    );
  });
});
```

---

## 7. SAVE MODAL TEST

```typescript
describe('SaveAnalyzedDishModal', () => {
  const mockResult: AnalyzedDishResult = {
    isFood: true,
    name: 'Phở',
    description: 'Vietnamese noodle soup',
    totalNutrition: {
      calories: 250,
      protein: 15,
      fat: 5,
      carbs: 30,
    },
    ingredients: [
      {
        name: 'Rice noodles',
        amount: 150,
        unit: 'g',
        nutritionPerStandardUnit: {
          calories: 130,
          protein: 3,
          fat: 0,
          carbs: 28,
          fiber: 1,
        },
      },
      {
        name: 'Broth',
        amount: 500,
        unit: 'ml',
        nutritionPerStandardUnit: {
          calories: 20,
          protein: 2,
          fat: 0,
          carbs: 2,
          fiber: 0,
        },
      },
    ],
  };

  it('should show dish info fields when saveDish toggle is true', async () => {
    const { getByLabelText, getByRole } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const saveToggle = getByLabelText(/saveDish/i);
    expect(saveToggle).toBeChecked();

    // Verify dish info fields are visible
    expect(getByRole('textbox', { name: /dishName/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /description/i })).toBeInTheDocument();
  });

  it('should hide dish info fields when saveDish toggle is false', async () => {
    const { getByLabelText, getByRole, queryByRole } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const saveToggle = getByLabelText(/saveDish/i);
    fireEvent.click(saveToggle);

    // Verify dish info fields are hidden
    expect(queryByRole('textbox', { name: /dishName/i })).not.toBeInTheDocument();
  });

  it('should validate tags when saveDish is true', async () => {
    const { getByRole, getByText } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    // Try to save without selecting tags
    const confirmButton = getByRole('button', { name: /confirmSave/i });
    fireEvent.click(confirmButton);

    // Should show validation error
    expect(
      getByText(/saveAnalyzed.validationSelectMeal/i)
    ).toBeInTheDocument();
  });

  it('should allow save without tags when saveDish is false', async () => {
    const mockOnSave = vi.fn();

    const { getByLabelText, getByRole } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={mockOnSave}
      />
    );

    // Uncheck saveDish
    const saveToggle = getByLabelText(/saveDish/i);
    fireEvent.click(saveToggle);

    // Save should be allowed
    const confirmButton = getByRole('button', { name: /confirmSave/i });
    fireEvent.click(confirmButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldCreateDish: false,
        tags: undefined,
      })
    );
  });

  it('should filter out unselected ingredients from payload', async () => {
    const mockOnSave = vi.fn();

    const { getAllByRole, getByTestId } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={mockOnSave}
      />
    );

    // Get all ingredient checkboxes (first is "Broth")
    const checkboxes = getAllByRole('checkbox');
    const brothCheckbox = checkboxes[1]; // Second checkbox (Broth)

    fireEvent.click(brothCheckbox);

    // Confirm save
    const confirmButton = getByTestId('btn-confirm-save-analyzed');
    fireEvent.click(confirmButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: [mockResult.ingredients[0]], // Only Rice noodles
      })
    );
  });

  it('should update ingredient fields when edited', async () => {
    const mockOnSave = vi.fn();

    const { getByRole, getByTestId } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={mockOnSave}
      />
    );

    // Edit ingredient name
    const nameInput = getByRole('textbox', { name: /name/i });
    fireEvent.change(nameInput, { target: { value: 'Noodles (modified)' } });

    // Edit amount
    const amountInput = getByRole('spinbutton', { name: /quantity/i });
    fireEvent.change(amountInput, { target: { value: '200' } });

    // Save
    const confirmButton = getByTestId('btn-confirm-save-analyzed');
    fireEvent.click(confirmButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: expect.arrayContaining([
          expect.objectContaining({
            name: 'Noodles (modified)',
            amount: 200,
          }),
        ]),
      })
    );
  });

  it('should call suggestIngredientInfo when AI Research clicked', async () => {
    vi.mocked(suggestIngredientInfo).mockResolvedValueOnce({
      calories: 150,
      protein: 4,
      carbs: 32,
      fat: 0,
      fiber: 1,
      unit: 'g',
    });

    const { getByRole } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const researchButton = getByRole('button', { name: /aiResearch/i });
    fireEvent.click(researchButton);

    await waitFor(() => {
      expect(suggestIngredientInfo).toHaveBeenCalledWith('Rice noodles', 'g');
    });
  });

  it('should show error notification if AI Research fails', async () => {
    const mockNotify = { error: vi.fn() };
    vi.mocked(useNotification).mockReturnValue(mockNotify);

    vi.mocked(suggestIngredientInfo).mockRejectedValueOnce(
      new Error('Lookup failed')
    );

    const { getByRole } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const researchButton = getByRole('button', { name: /aiResearch/i });
    fireEvent.click(researchButton);

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith(
        'saveAnalyzed.lookupFailed',
        'saveAnalyzed.lookupFailedDesc'
      );
    });
  });

  it('should prevent double submission', async () => {
    const mockOnSave = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByTestId } = render(
      <SaveAnalyzedDishModal
        result={mockResult}
        onClose={() => {}}
        onSave={mockOnSave}
      />
    );

    const confirmButton = getByTestId('btn-confirm-save-analyzed');

    // Select a tag first
    const breakfastTag = getByRole('button', { name: /breakfast/i });
    fireEvent.click(breakfastTag);

    // Click confirm twice rapidly
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

## 8. INTEGRATION TEST

```typescript
describe('AI Image Analysis - Full User Flow', () => {
  it('should complete full workflow: capture → analyze → save', async () => {
    const mockOnSave = vi.fn();
    const mockOnAnalysisComplete = vi.fn();

    // Mock API responses
    vi.mocked(analyzeDishImage).mockResolvedValueOnce({
      isFood: true,
      name: 'Phở',
      description: 'Vietnamese beef noodle soup',
      totalNutrition: { calories: 250, protein: 15, fat: 5, carbs: 30 },
      ingredients: [
        {
          name: 'Rice noodles',
          amount: 150,
          unit: 'g',
          nutritionPerStandardUnit: {
            calories: 130,
            protein: 3,
            fat: 0,
            carbs: 28,
            fiber: 1,
          },
        },
      ],
    });

    const { getByRole, getByTestId, queryByRole } = render(
      <AIImageAnalyzer
        onAnalysisComplete={mockOnAnalysisComplete}
        onSave={mockOnSave}
      />
    );

    // Step 1: Upload image
    const file = new File(['image'], 'pho.jpg', { type: 'image/jpeg' });
    const fileInput = getByRole('button', {
      name: /uploadImage/i,
    }).querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, file);

    // Verify image is shown
    await waitFor(() => {
      expect(getByRole('img', { name: /uploadedDishAlt/i })).toBeInTheDocument();
    });

    // Step 2: Analyze
    const analyzeButton = getByRole('button', { name: /analyzeDish/i });
    fireEvent.click(analyzeButton);

    // Verify results shown
    await waitFor(() => {
      expect(screen.getByText('Phở')).toBeInTheDocument();
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Phở' })
      );
    });

    // Step 3: Save
    const saveButton = getByRole('button', { name: /saveToLibrary/i });
    fireEvent.click(saveButton);

    // Modal should open
    await waitFor(() => {
      expect(getByRole('textbox', { name: /dishName/i })).toBeInTheDocument();
    });

    // Select tags
    const breakfastTag = getByRole('button', { name: /breakfast/i });
    fireEvent.click(breakfastTag);

    // Confirm save
    const confirmButton = getByTestId('btn-confirm-save-analyzed');
    fireEvent.click(confirmButton);

    // Verify save callback
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Phở',
          shouldCreateDish: true,
          tags: ['breakfast'],
          ingredients: expect.arrayContaining([
            expect.objectContaining({ name: 'Rice noodles' }),
          ]),
        })
      );
    });
  });
});
```

---

**End of Code Snippets**
