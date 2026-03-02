import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIImageAnalyzer } from '../components/AIImageAnalyzer';
import { AnalyzedDishResult } from '../types';

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

const mockAnalyzeDishImage = vi.fn();
vi.mock('../services/geminiService', () => ({
  analyzeDishImage: (...args: unknown[]) => mockAnalyzeDishImage(...args),
}));

// Mock child components for isolation
vi.mock('../components/ImageCapture', () => ({
  ImageCapture: ({ image, onImageReady, onClear }: { image: string | null; onImageReady: (b64: string) => void; onClear: () => void }) => (
    <div data-testid="image-capture">
      <button onClick={() => onImageReady('data:image/png;base64,abc123')}>Select Image</button>
      {image && <button onClick={onClear}>Clear</button>}
      {image && <span data-testid="has-image">has-image</span>}
    </div>
  ),
}));

vi.mock('../components/AnalysisResultView', () => ({
  AnalysisResultView: ({ result, isAnalyzing, onOpenSaveModal }: { result: AnalyzedDishResult | null; isAnalyzing: boolean; onOpenSaveModal?: () => void }) => (
    <div data-testid="analysis-result">
      {isAnalyzing && <span>analyzing</span>}
      {result && <span>{result.name}</span>}
      {onOpenSaveModal && <button onClick={onOpenSaveModal}>Save Modal</button>}
    </div>
  ),
}));

vi.mock('../components/modals/SaveAnalyzedDishModal', () => ({
  SaveAnalyzedDishModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="save-modal"><button onClick={onClose}>Close Save Modal</button></div>
  ),
}));

const mockResult: AnalyzedDishResult = {
  name: 'Test Dish',
  description: 'A test dish',
  totalNutrition: { calories: 100, protein: 10, carbs: 20, fat: 5 },
  ingredients: [],
};

describe('AIImageAnalyzer', () => {
  const defaultProps = {
    onAnalysisComplete: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders ImageCapture and AnalysisResultView', () => {
    render(<AIImageAnalyzer {...defaultProps} />);
    expect(screen.getByTestId('image-capture')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
  });

  it('renders analyze button disabled when no image', () => {
    render(<AIImageAnalyzer {...defaultProps} />);
    const analyzeBtn = screen.getByText('Phân tích món ăn');
    expect(analyzeBtn).toBeDisabled();
  });

  it('enables analyze button after selecting image', () => {
    render(<AIImageAnalyzer {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    const analyzeBtn = screen.getByText('Phân tích món ăn');
    expect(analyzeBtn).not.toBeDisabled();
  });

  it('analyzes image and calls onAnalysisComplete', async () => {
    mockAnalyzeDishImage.mockResolvedValue(mockResult);

    render(<AIImageAnalyzer {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Phân tích món ăn'));

    await waitFor(() => {
      expect(mockAnalyzeDishImage).toHaveBeenCalledWith('abc123', 'image/png');
    });
    await waitFor(() => {
      expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(mockResult);
    });
  });

  it('shows error notification on analysis failure', async () => {
    mockAnalyzeDishImage.mockRejectedValue(new Error('API fail'));

    render(<AIImageAnalyzer {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Phân tích món ăn'));

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Phân tích thất bại', expect.any(String));
    });
  });

  it('clears image and result', async () => {
    mockAnalyzeDishImage.mockResolvedValue(mockResult);

    render(<AIImageAnalyzer {...defaultProps} />);
    // Select and analyze
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Phân tích món ăn'));

    await waitFor(() => {
      expect(screen.getByText('Test Dish')).toBeInTheDocument();
    });

    // Clear
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.queryByText('Test Dish')).not.toBeInTheDocument();
  });

  it('opens save modal via AnalysisResultView', async () => {
    mockAnalyzeDishImage.mockResolvedValue(mockResult);

    render(<AIImageAnalyzer {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Phân tích món ăn'));

    await waitFor(() => {
      expect(screen.getByText('Save Modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Modal'));
    expect(screen.getByTestId('save-modal')).toBeInTheDocument();
  });
});
