// Mock @google/genai before importing geminiService
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    ThinkingLevel: { HIGH: 'HIGH', MEDIUM: 'MEDIUM' },
    Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' },
  };
});

// Set env before import
process.env.GEMINI_API_KEY = 'test-key';

import { suggestMealPlan, analyzeDishImage, suggestIngredientInfo, _resetAISingleton, _clearNutritionCache } from '../services/geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetAISingleton();       // Reset singleton so API-key changes apply per test
    _clearNutritionCache();    // Clear cache so cache tests are isolated
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
    it('throws on empty response text', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });
      // undefined text now throws 'Empty response' (previously fell through to validator)
      await expect(suggestMealPlan(2000, 100, [])).rejects.toThrow('Empty response from AI');
    });

    it('includes raw text in error for non-JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'definitely not json {{{{' });
      await expect(suggestMealPlan(2000, 100, [])).rejects.toThrow('Raw:');
    });

    it('includes raw text in error for invalid-schema JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ bad: 'data' }) });
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Raw:');
    });
  });

  // --- Retry behaviour ---
  describe('retry', () => {
    it('retries on transient network error and returns result on 2nd attempt', async () => {
      const mockResult = { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, unit: 'g' };
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Network error'))  // 1st attempt fails
        .mockResolvedValue({ text: JSON.stringify(mockResult) }); // 2nd succeeds

      vi.useFakeTimers();
      const promise = suggestIngredientInfo('Ức gà', 'g');
      // runAllTimersAsync fires all scheduled timers (incl. the 1 s retry-delay)
      // AND drains the microtask queue between each timer tick, so the retry
      // delay is only scheduled after the first attempt's rejection propagates.
      await vi.runAllTimersAsync();
      const result = await promise;
      vi.useRealTimers();

      expect(result.calories).toBe(165);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on timeout errors', async () => {
      vi.useFakeTimers();
      mockGenerateContent.mockImplementation(() => new Promise(() => { /* never resolves */ }));
      const promise = suggestIngredientInfo('Slow item', 'g');
      vi.advanceTimersByTime(30001); // same sync pattern as other timeout tests

      await expect(promise).rejects.toThrow('timed out after 30s');
      // Only 1 attempt — no retry on timeout
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('does NOT retry on AbortError', async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(suggestMealPlan(2000, 100, [], controller.signal)).rejects.toThrow('Aborted');
      expect(mockGenerateContent).toHaveBeenCalledTimes(0);
    });
  });

  // --- Ingredient info cache ---
  describe('suggestIngredientInfo cache', () => {
    it('returns cached result on 2nd call with same args (no extra API call)', async () => {
      const mockResult = { calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, unit: 'quả' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      await suggestIngredientInfo('Trứng gà', 'quả');
      await suggestIngredientInfo('Trứng gà', 'quả'); // second call — should hit cache

      expect(mockGenerateContent).toHaveBeenCalledTimes(1); // API called only once
    });

    it('treats (name, unit) as case-insensitive cache key', async () => {
      const mockResult = { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, unit: 'g' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      await suggestIngredientInfo('Ức Gà', 'G');
      await suggestIngredientInfo('ức gà', 'g'); // same key after normalization

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('makes separate API calls for different (name, unit) pairs', async () => {
      const mockResult = { calories: 100, protein: 5, carbs: 10, fat: 2, fiber: 1, unit: 'g' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      await suggestIngredientInfo('Cà rốt', 'g');
      await suggestIngredientInfo('Khoai tây', 'g'); // different name → different key

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });

  // --- AbortSignal support for analyzeDishImage and suggestIngredientInfo ---
  describe('analyzeDishImage abort', () => {
    it('throws AbortError when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(analyzeDishImage('base64', 'image/jpeg', controller.signal)).rejects.toThrow('Aborted');
      expect(mockGenerateContent).toHaveBeenCalledTimes(0);
    });
  });

  describe('suggestIngredientInfo abort', () => {
    it('throws AbortError when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(suggestIngredientInfo('Test', 'g', controller.signal)).rejects.toThrow('Aborted');
      expect(mockGenerateContent).toHaveBeenCalledTimes(0);
    });
  });

  // --- Prompt injection sanitization ---
  describe('prompt injection sanitization', () => {
    it('replaces injection characters in ingredientName and still calls API', async () => {
      const mockResult = { calories: 99, protein: 5, carbs: 1, fat: 1, fiber: 0, unit: 'g' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const maliciousName = 'Test`"\\injection';
      const result = await suggestIngredientInfo(maliciousName, 'g');

      expect(result.calories).toBe(99);
      // Verify the prompt passed to the API does not contain the raw injection chars
      const callArg = mockGenerateContent.mock.calls[0][0];
      const promptText: string = callArg.contents as string;
      expect(promptText).not.toContain('`');
      expect(promptText).not.toContain('\\');
    });
  });

  // --- Validator strictness ---
  describe('validator strictness', () => {
    it('IngredientSuggestion validator rejects response missing carbs/fat/fiber', async () => {
      // calories + protein only (old, weak check would have passed)
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ calories: 100, protein: 5 }) });
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Invalid IngredientSuggestion');
    });

    it('MealPlanSuggestion validator requires reasoning field', async () => {
      // Missing reasoning — old validator only checked the three id arrays
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }),
      });
      await expect(suggestMealPlan(2000, 100, [])).rejects.toThrow('Invalid MealPlanSuggestion');
    });

    it('AnalyzedDishResult validator requires description field', async () => {
      // Missing description — old validator only checked name + ingredients
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ name: 'Phở', ingredients: [] }),
      });
      await expect(analyzeDishImage('base64', 'image/png')).rejects.toThrow('Invalid AnalyzedDishResult');
    });
  });
});
