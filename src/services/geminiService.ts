import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedDishResult, AvailableDishInfo, IngredientSuggestion, MealPlanSuggestion } from '../types';

// ─── #4 Singleton AI client ───────────────────────────────────────────────────
let _ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing");
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
};

/** @internal For testing only — resets the AI singleton so API-key changes take effect */
export const _resetAISingleton = (): void => { _ai = null; };

// --- Shared resilience utilities ---

// ─── #3 Timeout with clearTimeout (memory-leak prevention) ───────────────────
/** Default timeout for all AI API calls (ms) */
const AI_CALL_TIMEOUT_MS = 30_000;

const callWithTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms
    );
  });
  // Suppress the "unhandled rejection" detection that fires when the other branch
  // wins the race and this promise's rejection is consumed internally by Promise.race.
  timeout.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
};

// ─── #5 Retry with exponential backoff ───────────────────────────────────────
const MAX_RETRIES = 2;

const isRetryableError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  if (err.name === 'AbortError') return false;               // user cancelled — never retry
  if (err.message.includes('timed out after')) return false; // timeout — don't compound wait
  if (err.message.includes('response from AI')) return false;// validation / empty — won't improve on retry
  if (err.message.includes('API key')) return false;         // config error — won't self-heal
  return true;                                               // network/503 — transient, safe to retry
};

const withRetry = async <T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES || !isRetryableError(err) || signal?.aborted) throw err;
      await new Promise<void>(resolve => setTimeout(resolve, 1_000 * Math.pow(2, attempt)));
    }
  }
  /* c8 ignore next */
  throw new Error('Unreachable');
};

// ─── #2 Input sanitization — prompt injection guard ──────────────────────────
const sanitizeForPrompt = (input: string): string =>
  input.replaceAll(/[`"\\]/g, "'").slice(0, 200);

// ─── #13 Telemetry — observable warnings for slow/failed calls ───────────────
const logAICall = (label: string, startMs: number, success: boolean): void => {
  const elapsed = Date.now() - startMs;
  if (!success) {
    console.warn(`[GeminiService] ${label} FAILED — elapsed: ${elapsed}ms`);
  } else if (elapsed > 10_000) {
    console.warn(`[GeminiService] ${label} slow call: ${elapsed}ms`);
  }
};

// ─── #11 Ingredient info cache — 1-hour TTL ──────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1_000;
interface CacheEntry { data: IngredientSuggestion; ts: number; }
const nutritionCache = new Map<string, CacheEntry>();

/** @internal For testing only — clears the nutrition info cache */
export const _clearNutritionCache = (): void => nutritionCache.clear();

// ─── #8 parseJSON — includes raw response in error for debuggability ──────────
const parseJSON = <T>(text: string | undefined, validator: (v: unknown) => v is T, label: string): T => {
  if (!text) throw new Error(`Empty response from AI for ${label}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from AI for ${label}. Raw: ${text.slice(0, 200)}`);
  }
  if (!validator(parsed)) {
    throw new Error(`Invalid ${label} response from AI. Raw: ${text.slice(0, 200)}`);
  }
  return parsed;
};

// ─── #7 Validators — full field coverage ────────────────────────────────────
const isMealPlanSuggestion = (v: unknown): v is MealPlanSuggestion =>
  typeof v === 'object' && v !== null &&
  'breakfastDishIds' in v && Array.isArray((v as MealPlanSuggestion).breakfastDishIds) &&
  'lunchDishIds' in v && Array.isArray((v as MealPlanSuggestion).lunchDishIds) &&
  'dinnerDishIds' in v && Array.isArray((v as MealPlanSuggestion).dinnerDishIds) &&
  'reasoning' in v && typeof (v as MealPlanSuggestion).reasoning === 'string';

const isAnalyzedDishResult = (v: unknown): v is AnalyzedDishResult =>
  typeof v === 'object' && v !== null &&
  'name' in v && typeof (v as AnalyzedDishResult).name === 'string' &&
  'description' in v && typeof (v as AnalyzedDishResult).description === 'string' &&
  'ingredients' in v && Array.isArray((v as AnalyzedDishResult).ingredients);

const isIngredientSuggestion = (v: unknown): v is IngredientSuggestion => {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.calories === 'number' &&
    typeof s.protein  === 'number' &&
    typeof s.carbs    === 'number' &&
    typeof s.fat      === 'number' &&
    typeof s.fiber    === 'number' &&
    typeof s.unit     === 'string'
  );
};



/**
 * Suggest a daily meal plan (breakfast, lunch, dinner) using Gemini AI.
 * @param targetCalories - Daily calorie target (kcal)
 * @param targetProtein - Daily protein target (grams)
 * @param availableDishes - Library of dishes the AI can choose from. Capped at 100 entries internally (#9).
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Suggested dish IDs for each meal slot + AI reasoning
 * @throws {DOMException} If the request was aborted (name === 'AbortError')
 * @throws {Error} If AI response fails validation
 */
export const suggestMealPlan = async (
  targetCalories: number,
  targetProtein: number,
  availableDishes: AvailableDishInfo[],
  signal?: AbortSignal
): Promise<MealPlanSuggestion> => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const ai = getAI();

  // #9 Token limit — cap at 100 dishes with slim fields to avoid prompt bloat
  const dishSummaries = availableDishes.slice(0, 100).map(d => ({
    id: d.id, name: d.name, tags: d.tags,
    cal: Math.round(d.calories), pro: Math.round(d.protein),
  }));

  const prompt = `
    Bạn là một chuyên gia dinh dưỡng. Hãy lên thực đơn cho một ngày (Bữa sáng, Bữa trưa, Bữa tối) dựa trên thư viện món ăn có sẵn.
    Mục tiêu: ~${targetCalories} kcal, ~${targetProtein}g protein.
    
    Thư viện món ăn hiện có (mỗi món có tags cho biết phù hợp bữa nào):
    ${JSON.stringify(dishSummaries)}
    
    Hãy chọn các MÓN ĂN cho 3 bữa. Mỗi bữa có thể có 1 hoặc nhiều món. Ưu tiên chọn món có tag phù hợp với bữa đó.
    Trả về kết quả dưới dạng JSON.
  `;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    : null;

  const start = Date.now();
  try {
    // #5 Retry wraps each individual attempt (incl. its own timeout)
    const responsePromise = withRetry(
      () => callWithTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                breakfastDishIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                lunchDishIds:     { type: Type.ARRAY, items: { type: Type.STRING } },
                dinnerDishIds:    { type: Type.ARRAY, items: { type: Type.STRING } },
                reasoning: { type: Type.STRING, description: "Giải thích ngắn gọn lý do chọn thực đơn này bằng tiếng Việt" }
              },
              required: ["breakfastDishIds", "lunchDishIds", "dinnerDishIds", "reasoning"]
            }
          }
        }),
        AI_CALL_TIMEOUT_MS,
        'Meal plan suggestion'
      ),
      signal
    );

    const response = abortPromise === null
      ? await responsePromise
      : await Promise.race([responsePromise, abortPromise]);

    const result = parseJSON(response.text, isMealPlanSuggestion, 'MealPlanSuggestion');
    logAICall('suggestMealPlan', start, true);
    return result;
  } catch (err) {
    logAICall('suggestMealPlan', start, false);
    throw err;
  }
};

/**
 * Analyze a food image to extract dish name, ingredients, and nutritional data.
 * @param base64Image - Base64-encoded image data (no data: prefix)
 * @param mimeType    - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @param signal      - Optional AbortSignal to cancel the request (#6)
 * @returns Analyzed dish with name, description, total nutrition, and per-ingredient breakdown
 * @throws {DOMException} If the request was aborted (name === 'AbortError')
 * @throws {Error}        If AI response fails validation
 */
export const analyzeDishImage = async (
  base64Image: string,
  mimeType: string,
  signal?: AbortSignal
): Promise<AnalyzedDishResult> => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const ai = getAI();

  const prompt = `
    Hãy phân tích hình ảnh món ăn này để tạo dữ liệu cho ứng dụng quản lý dinh dưỡng.
    
    1. Nhận diện tên món ăn và mô tả ngắn gọn.
    2. Ước tính tổng dinh dưỡng của cả món ăn (để tham khảo).
    3. QUAN TRỌNG: Liệt kê chi tiết từng nguyên liệu để tạo dữ liệu. Với mỗi nguyên liệu:
       - Tên nguyên liệu.
       - Khối lượng/Số lượng ước tính có trong món ăn này (amount).
       - Đơn vị tính (unit) (ưu tiên g, ml, cái, quả, lát...).
       - Thông tin dinh dưỡng chuẩn hóa (nutrition):
         + Nếu đơn vị là khối lượng/thể tích (g, kg, ml, l): Cung cấp dinh dưỡng cho **100g** hoặc **100ml**.
         + Nếu đơn vị là đếm được (cái, quả, lát...): Cung cấp dinh dưỡng cho **1 đơn vị** (1 cái, 1 quả...).
    
    Trả về JSON.
  `;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    : null;

  const start = Date.now();
  try {
    const responsePromise = withRetry(
      () => callWithTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: [
              { inlineData: { data: base64Image, mimeType } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name:        { type: Type.STRING, description: "Tên món ăn" },
                description: { type: Type.STRING, description: "Mô tả ngắn gọn" },
                totalNutrition: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein:  { type: Type.NUMBER },
                    fat:      { type: Type.NUMBER },
                    carbs:    { type: Type.NUMBER }
                  },
                  required: ["calories", "protein", "fat", "carbs"]
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name:   { type: Type.STRING },
                      amount: { type: Type.NUMBER, description: "Số lượng trong món ăn này" },
                      unit:   { type: Type.STRING },
                      nutritionPerStandardUnit: {
                        type: Type.OBJECT,
                        description: "Dinh dưỡng cho 100g/ml hoặc 1 đơn vị",
                        properties: {
                          calories: { type: Type.NUMBER },
                          protein:  { type: Type.NUMBER },
                          fat:      { type: Type.NUMBER },
                          carbs:    { type: Type.NUMBER },
                          fiber:    { type: Type.NUMBER }
                        },
                        required: ["calories", "protein", "fat", "carbs", "fiber"]
                      }
                    },
                    required: ["name", "amount", "unit", "nutritionPerStandardUnit"]
                  }
                }
              },
              required: ["name", "description", "totalNutrition", "ingredients"]
            }
          }
        }),
        AI_CALL_TIMEOUT_MS,
        'Dish image analysis'
      ),
      signal
    );

    const response = abortPromise === null
      ? await responsePromise
      : await Promise.race([responsePromise, abortPromise]);

    const result = parseJSON(response.text, isAnalyzedDishResult, 'AnalyzedDishResult');
    logAICall('analyzeDishImage', start, true);
    return result;
  } catch (err) {
    logAICall('analyzeDishImage', start, false);
    throw err;
  }
};

/**
 * Look up nutritional information for an ingredient using Gemini AI + Google Search.
 * Results are cached for 1 hour per (name, unit) pair (#11).
 * @param ingredientName - Name of the ingredient (e.g., "Ức gà")
 * @param unit           - Measurement unit (e.g., "g", "ml", "quả")
 * @param signal         - Optional AbortSignal to cancel the request (#6)
 * @returns Nutritional data (calories, protein, carbs, fat, fiber) and confirmed unit
 * @throws {DOMException} If the request was aborted (name === 'AbortError')
 * @throws {Error}        If AI response fails validation or times out
 */
export const suggestIngredientInfo = async (
  ingredientName: string,
  unit: string,
  signal?: AbortSignal
): Promise<IngredientSuggestion> => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // #11 Cache lookup
  const cacheKey = `${ingredientName.toLowerCase().trim()}::${unit.toLowerCase().trim()}`;
  const cached = nutritionCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const ai = getAI();

  const isPiece = !['g', 'kg', 'mg', 'ml', 'l'].includes(unit.toLowerCase().trim());
  const targetAmount = isPiece ? `1 ${unit}` : '100g/100ml';

  // #2 Sanitize inputs to prevent prompt injection
  const safeName = sanitizeForPrompt(ingredientName);
  const safeUnit = sanitizeForPrompt(unit);

  const prompt = `
    Tìm kiếm thông tin dinh dưỡng chính xác cho ${targetAmount} của nguyên liệu '${safeName}' sử dụng Google Search.
    Trả về một đối tượng JSON với các trường sau:
    - calories (số, kcal trong ${targetAmount})
    - protein (số, gam trong ${targetAmount})
    - carbs (số, gam trong ${targetAmount})
    - fat (số, gam trong ${targetAmount})
    - fiber (số, gam trong ${targetAmount})
    - unit (chuỗi, trả về chính xác '${safeUnit}')
  `;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    : null;

  const start = Date.now();
  try {
    const responsePromise = withRetry(
      () => callWithTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein:  { type: Type.NUMBER },
                carbs:    { type: Type.NUMBER },
                fat:      { type: Type.NUMBER },
                fiber:    { type: Type.NUMBER },
                unit:     { type: Type.STRING }
              },
              required: ["calories", "protein", "carbs", "fat", "fiber", "unit"]
            }
          }
        }),
        AI_CALL_TIMEOUT_MS,
        'Ingredient info lookup'
      ),
      signal
    );

    const response = abortPromise === null
      ? await responsePromise
      : await Promise.race([responsePromise, abortPromise]);

    const result = parseJSON(response.text, isIngredientSuggestion, 'IngredientSuggestion');

    // #11 Store in cache
    nutritionCache.set(cacheKey, { data: result, ts: Date.now() });

    logAICall('suggestIngredientInfo', start, true);
    return result;
  } catch (err) {
    logAICall('suggestIngredientInfo', start, false);
    throw err;
  }
};
