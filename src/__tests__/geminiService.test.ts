// Mock @google/genai before importing geminiService
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    ThinkingLevel: { HIGH: 'HIGH' },
    Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' },
  };
});

// Set env before import
process.env.GEMINI_API_KEY = 'test-key';

import { suggestMealPlan, analyzeDishImage, suggestIngredientInfo } from '../services/geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  // --- suggestMealPlan ---
  describe('suggestMealPlan', () => {
    const availableDishes = [
      { id: 'd1', name: 'Dish 1', tags: ['breakfast' as const], calories: 300, protein: 20 },
    ];

    it('returns valid MealPlanSuggestion on success', async () => {
      const mockResult = {
        breakfastDishIds: ['d1'],
        lunchDishIds: ['d2'],
        dinnerDishIds: ['d3'],
        reasoning: 'Good plan',
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const result = await suggestMealPlan(2000, 100, availableDishes);
      expect(result).toEqual(mockResult);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('throws when response fails validation', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ bad: 'data' }) });

      await expect(suggestMealPlan(2000, 100, availableDishes)).rejects.toThrow('Invalid MealPlanSuggestion');
    });

    it('throws AbortError when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(suggestMealPlan(2000, 100, availableDishes, controller.signal)).rejects.toThrow('Aborted');
    });

    it('throws AbortError when signal aborts during request', async () => {
      const controller = new AbortController();
      mockGenerateContent.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 10);
          setTimeout(() => controller.abort(), 5);
        })
      );
      // The abort promise should race and win
      await expect(suggestMealPlan(2000, 100, availableDishes, controller.signal)).rejects.toThrow();
    });

    it('throws when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(suggestMealPlan(2000, 100, availableDishes)).rejects.toThrow('Gemini API key is missing');
    });

    it('throws on invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not json' });
      await expect(suggestMealPlan(2000, 100, availableDishes)).rejects.toThrow();
    });

    it('handles timeout correctly', async () => {
      vi.useFakeTimers();
      mockGenerateContent.mockImplementation(() => new Promise(() => { /* never resolves */ }));

      const promise = suggestMealPlan(2000, 100, availableDishes);
      vi.advanceTimersByTime(30001);

      await expect(promise).rejects.toThrow('timed out after 30s');
      vi.useRealTimers();
    });
  });

  // --- analyzeDishImage ---
  describe('analyzeDishImage', () => {
    it('returns valid AnalyzedDishResult on success', async () => {
      const mockResult = {
        name: 'Phở',
        description: 'Vietnamese soup',
        totalNutrition: { calories: 400, protein: 20, fat: 10, carbs: 50 },
        ingredients: [{ name: 'Noodles', amount: 200, unit: 'g', nutritionPerStandardUnit: { calories: 130, protein: 3, fat: 1, carbs: 28, fiber: 1 } }],
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const result = await analyzeDishImage('base64data', 'image/jpeg');
      expect(result.name).toBe('Phở');
      expect(result.ingredients).toHaveLength(1);
    });

    it('throws when response missing required fields', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ name: 'X' }) });
      await expect(analyzeDishImage('base64', 'image/jpeg')).rejects.toThrow('Invalid AnalyzedDishResult');
    });

    it('handles timeout correctly', async () => {
      vi.useFakeTimers();
      mockGenerateContent.mockImplementation(() => new Promise(() => { /* never resolves */ }));

      const promise = analyzeDishImage('base64data', 'image/jpeg');
      vi.advanceTimersByTime(30001);

      await expect(promise).rejects.toThrow('timed out after 30s');
      vi.useRealTimers();
    });
  });

  // --- suggestIngredientInfo ---
  describe('suggestIngredientInfo', () => {
    it('returns valid IngredientSuggestion for weight units', async () => {
      const mockResult = { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, unit: 'g' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const result = await suggestIngredientInfo('Ức gà', 'g');
      expect(result.calories).toBe(165);
      expect(result.protein).toBe(31);
    });

    it('returns valid IngredientSuggestion for countable units', async () => {
      const mockResult = { calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, unit: 'quả' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const result = await suggestIngredientInfo('Trứng gà', 'quả');
      expect(result.unit).toBe('quả');
    });

    it('throws when response missing required fields', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ calories: 100 }) });
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Invalid IngredientSuggestion');
    });

    it('handles timeout correctly', async () => {
      vi.useFakeTimers();
      mockGenerateContent.mockImplementation(() => new Promise(() => { /* never resolves */ }));

      const promise = suggestIngredientInfo('Slow item', 'g');
      vi.advanceTimersByTime(30001);

      await expect(promise).rejects.toThrow('timed out after 30s');
      vi.useRealTimers();
    });
  });

  // --- parseJSON edge cases (tested via public API) ---
  describe('parseJSON (via public API)', () => {
    it('parses empty text as {}', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });
      // undefined → JSON.parse("{}") = {} → fails validator → throws
      await expect(suggestMealPlan(2000, 100, [])).rejects.toThrow('Invalid MealPlanSuggestion');
    });
  });
});
