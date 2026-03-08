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

import { suggestMealPlan, analyzeDishImage, suggestIngredientInfo, suggestDishIngredients, _resetAISingleton, _clearNutritionCache } from '../services/geminiService';

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
        isFood: true,
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

    it('throws NotFoodImageError when isFood is false', async () => {
      const mockResult = { isFood: false, notFoodReason: 'Đây là ảnh con mèo' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const { NotFoodImageError } = await import('../types');
      await expect(analyzeDishImage('base64data', 'image/jpeg')).rejects.toThrow(NotFoodImageError);
      await expect(analyzeDishImage('base64data', 'image/jpeg')).rejects.toThrow('Đây là ảnh con mèo');
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

    it('throws AbortError when signal aborts during request', async () => {
      const controller = new AbortController();
      mockGenerateContent.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 50);
          setTimeout(() => controller.abort(), 10);
        })
      );
      await expect(suggestIngredientInfo('Test', 'g', controller.signal)).rejects.toThrow();
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

    it('AnalyzedDishResult validator returns false for non-object parsed value', async () => {
      mockGenerateContent.mockResolvedValue({ text: '"just a string"' });
      await expect(analyzeDishImage('base64', 'image/png')).rejects.toThrow('Invalid AnalyzedDishResult');
    });

    it('IngredientSuggestion validator returns false for non-object parsed value', async () => {
      mockGenerateContent.mockResolvedValue({ text: '42' });
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Invalid IngredientSuggestion');
    });
  });

  describe('isRetryableError branches', () => {
    it('does NOT retry on validation errors (contains "response from AI")', async () => {
      mockGenerateContent
        .mockResolvedValueOnce({ text: JSON.stringify({ bad: 'data' }) })
        .mockResolvedValue({ text: JSON.stringify({ calories: 100, protein: 5, carbs: 1, fat: 1, fiber: 0, unit: 'g' }) });
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Invalid IngredientSuggestion');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on API key errors', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API key is invalid'));
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('API key');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on AbortError thrown during request', async () => {
      mockGenerateContent.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Aborted');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry when Error has AbortError name', async () => {
      const abortErr = new Error('Aborted');
      abortErr.name = 'AbortError';
      mockGenerateContent.mockRejectedValueOnce(abortErr);
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('Aborted');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry when error message includes "response from AI"', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Invalid response from AI'));
      await expect(suggestIngredientInfo('Test', 'g')).rejects.toThrow('response from AI');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('logAICall slow call warning', () => {
    it('logs warning when successful call exceeds 10 seconds', async () => {
      const mockResult = { calories: 100, protein: 5, carbs: 1, fat: 1, fiber: 0, unit: 'g' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const _realDateNow = Date.now;
      let callCount = 0;
      vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 15000;
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await suggestIngredientInfo('Slow test', 'g');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('slow call'));
      warnSpy.mockRestore();
      vi.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('suggestMealPlan with diverse dish library', () => {
    it('shuffles and deduplicates when given multiple dishes across tags and untagged', async () => {
      const diverseDishes = [
        { id: 'd1', name: 'Bún bò', tags: ['breakfast' as const], calories: 300, protein: 20 },
        { id: 'd2', name: 'Phở', tags: ['breakfast' as const], calories: 350, protein: 25 },
        { id: 'd3', name: 'Cơm tấm', tags: ['lunch' as const], calories: 500, protein: 30 },
        { id: 'd4', name: 'Bún riêu', tags: ['lunch' as const], calories: 400, protein: 22 },
        { id: 'd5', name: 'Canh chua', tags: ['dinner' as const], calories: 200, protein: 15 },
        { id: 'd6', name: 'Gà rán', tags: ['dinner' as const], calories: 600, protein: 40 },
        { id: 'd7', name: 'Bánh mì', tags: [] as ('breakfast' | 'lunch' | 'dinner')[], calories: 250, protein: 10 },
        { id: 'd8', name: 'Xôi', tags: [] as ('breakfast' | 'lunch' | 'dinner')[], calories: 300, protein: 8 },
      ];
      const mockResult = {
        breakfastDishIds: ['d1'], lunchDishIds: ['d3'], dinnerDishIds: ['d5'], reasoning: 'Varied menu',
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });

      const result = await suggestMealPlan(2000, 100, diverseDishes);
      expect(result.reasoning).toBe('Varied menu');
    });
  });

  describe('analyzeDishImage abort during request', () => {
    it('throws AbortError when signal aborts while API call is in progress', async () => {
      const controller = new AbortController();
      mockGenerateContent.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new DOMException('Aborted', 'AbortError'));
          }, 10);
        })
      );
      await expect(analyzeDishImage('base64', 'image/jpeg', controller.signal)).rejects.toThrow('Aborted');
    });
  });

  // --- suggestDishIngredients ---
  describe('suggestDishIngredients', () => {
    const validResult = [
      { name: 'Bánh phở', amount: 250, unit: 'g', calories: 356, protein: 3, carbs: 80, fat: 0.5, fiber: 1 },
      { name: 'Thịt bò', amount: 150, unit: 'g', calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
    ];

    it('returns valid SuggestedDishIngredient[] on success', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(validResult) });
      const result = await suggestDishIngredients('Phở bò');
      expect(result).toEqual(validResult);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when AI returns []', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[]' });
      const result = await suggestDishIngredients('Unknown dish');
      expect(result).toEqual([]);
    });

    it('throws when response fails validation', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ bad: 'data' }) });
      await expect(suggestDishIngredients('Phở')).rejects.toThrow('Invalid SuggestedDishIngredients');
    });

    it('throws when array items have missing fields', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify([{ name: 'Test' }]) });
      await expect(suggestDishIngredients('Phở')).rejects.toThrow('Invalid SuggestedDishIngredients');
    });

    it('throws AbortError when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(suggestDishIngredients('Phở', controller.signal)).rejects.toThrow('Aborted');
    });

    it('throws AbortError when signal aborts during request', async () => {
      const controller = new AbortController();
      mockGenerateContent.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new DOMException('Aborted', 'AbortError'));
          }, 10);
        })
      );
      await expect(suggestDishIngredients('Phở', controller.signal)).rejects.toThrow('Aborted');
    });

    it('throws on invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not json {{' });
      await expect(suggestDishIngredients('Phở')).rejects.toThrow('Non-JSON');
    });

    it('throws on empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });
      await expect(suggestDishIngredients('Phở')).rejects.toThrow('Empty response');
    });

    it('handles timeout correctly', async () => {
      vi.useFakeTimers();
      mockGenerateContent.mockImplementation(() => new Promise(() => { /* never resolves */ }));
      const promise = suggestDishIngredients('Phở');
      vi.advanceTimersByTime(30001);
      await expect(promise).rejects.toThrow('timed out after 30s');
      vi.useRealTimers();
    });

    it('sanitizes dish name for prompt injection', async () => {
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(validResult) });
      await suggestDishIngredients('Test `injection" attempt\\');
      const callArg = mockGenerateContent.mock.calls[0][0];
      const prompt = typeof callArg === 'string' ? callArg : callArg.contents;
      expect(prompt).not.toContain('`');
      expect(prompt).not.toContain('"');
      expect(prompt).not.toContain('\\');
    });
  });
});
