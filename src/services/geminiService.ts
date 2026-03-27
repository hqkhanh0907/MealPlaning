import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedDishResult, AvailableDishInfo, IngredientSuggestion, MealPlanSuggestion, NotFoodImageError, SuggestedDishIngredient } from '../types';

// ─── #4 Singleton AI client ───────────────────────────────────────────────────
let _ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!_ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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

const callWithTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timerId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    promise.then(
      value => { clearTimeout(timerId); resolve(value); },
      err   => { clearTimeout(timerId); reject(err); },
    );
  });

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

const withRetry = <T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  const attempt = (n: number): Promise<T> =>
    fn().catch((err: unknown) => {
      if (n >= MAX_RETRIES || !isRetryableError(err) || signal?.aborted) throw err;
      return new Promise<void>(resolve => setTimeout(resolve, 1_000 * Math.pow(2, n)))
        .then(() => attempt(n + 1));
    });
  return attempt(0);
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

const isValidNutrition = (n: unknown): boolean => {
  if (typeof n !== 'object' || n === null) return false;
  const v = n as Record<string, unknown>;
  return (
    typeof v.calories === 'number' && !Number.isNaN(v.calories) &&
    typeof v.protein === 'number' && !Number.isNaN(v.protein) &&
    typeof v.carbs === 'number' && !Number.isNaN(v.carbs) &&
    typeof v.fat === 'number' && !Number.isNaN(v.fat) &&
    typeof v.fiber === 'number' && !Number.isNaN(v.fiber)
  );
};

const isAnalyzedDishResult = (v: unknown): v is AnalyzedDishResult => {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.isFood !== 'boolean') return false;
  if (!r.isFood) return true;
  if (
    typeof r.name !== 'string' ||
    typeof r.description !== 'string' ||
    !Array.isArray(r.ingredients)
  ) {
    return false;
  }
  return (r.ingredients as unknown[]).every((ing) => {
    if (typeof ing !== 'object' || ing === null) return false;
    const i = ing as Record<string, unknown>;
    return (
      typeof i.name === 'string' &&
      typeof i.amount === 'number' &&
      typeof i.unit === 'string' &&
      isValidNutrition(i.nutritionPerStandardUnit)
    );
  });
};

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

const isSuggestedDishIngredients = (v: unknown): v is SuggestedDishIngredient[] => {
  if (!Array.isArray(v)) return false;
  return v.every(item => {
    if (typeof item !== 'object' || item === null) return false;
    const s = item as Record<string, unknown>;
    return (
      typeof s.name     === 'string' &&
      typeof s.amount   === 'number' &&
      typeof s.unit     === 'string' &&
      typeof s.calories === 'number' &&
      typeof s.protein  === 'number' &&
      typeof s.carbs    === 'number' &&
      typeof s.fat      === 'number' &&
      typeof s.fiber    === 'number'
    );
  });
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
export async function suggestMealPlan(
  targetCalories: number,
  targetProtein: number,
  availableDishes: AvailableDishInfo[],
  signal?: AbortSignal
): Promise<MealPlanSuggestion> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const ai = getAI();

  // #9 Smart dish sampling — pick up to MAX_PER_SLOT dishes per meal slot (shuffled
  //     for variety), then deduplicate. Keeps prompt lean even with 1000+ dish libraries.
  const MAX_PER_SLOT = 20;
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const seen = new Set<string>();
  const addSlot = (tag: 'breakfast' | 'lunch' | 'dinner') =>
    shuffle(availableDishes.filter(d => d.tags.includes(tag)))
      .slice(0, MAX_PER_SLOT)
      .filter(d => !seen.has(d.id) && (seen.add(d.id), true));

  // Dishes without any tag — include a small fallback batch so they're not ignored
  const fallback = shuffle(availableDishes.filter(d => d.tags.length === 0))
    .slice(0, 10)
    .filter(d => !seen.has(d.id) && (seen.add(d.id), true));

  const selectedDishes = [
    ...addSlot('breakfast'),
    ...addSlot('lunch'),
    ...addSlot('dinner'),
    ...fallback,
  ];

  const dishSummaries = selectedDishes.map(d => ({
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

  const effectivePromise = abortPromise === null
    ? responsePromise
    : Promise.race([responsePromise, abortPromise]);

  return effectivePromise.then(
    (response: { text?: string }) => {
      const result = parseJSON(response.text ?? '', isMealPlanSuggestion, 'MealPlanSuggestion');
      logAICall('suggestMealPlan', start, true);
      return result;
    },
  ).catch((err: unknown) => {
    logAICall('suggestMealPlan', start, false);
    throw err;
  });
}

/**
 * Analyze a food image to extract dish name, ingredients, and nutritional data.
 * @param base64Image - Base64-encoded image data (no data: prefix)
 * @param mimeType    - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @param signal      - Optional AbortSignal to cancel the request (#6)
 * @returns Analyzed dish with name, description, total nutrition, and per-ingredient breakdown
 * @throws {DOMException} If the request was aborted (name === 'AbortError')
 * @throws {Error}        If AI response fails validation
 */
export async function analyzeDishImage(
  base64Image: string,
  mimeType: string,
  signal?: AbortSignal
): Promise<AnalyzedDishResult> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const ai = getAI();

  const prompt = `
    Bạn là AI thị giác chuyên phân tích hình ảnh món ăn cho ứng dụng quản lý dinh dưỡng.
    Mục tiêu: xác định thực phẩm, ước tính dinh dưỡng, phân tích nguyên liệu. Trả về JSON hợp lệ.

    ====================================================
    BƯỚC 1 — KIỂM TRA THỰC PHẨM
    ====================================================

    Nếu KHÔNG phải thực phẩm/đồ uống/nguyên liệu:
    - Đặt isFood = false
    - Điền notFoodReason (tiếng Việt)
    - Đặt name = "", description = ""
    - Đặt totalNutrition = { calories: 0, protein: 0, fat: 0, carbs: 0 }
    - Đặt ingredients = []
    - Kết thúc, không thực hiện bước tiếp.

    Nếu LÀ thực phẩm: đặt isFood = true, tiếp tục BƯỚC 2.

    ====================================================
    BƯỚC 2 — NHẬN DIỆN VÀ TỔNG DINH DƯỠNG
    ====================================================

    - name: tên món ăn phổ biến nhất
    - description: mô tả ngắn gọn 1–2 câu

    - totalNutrition: ước tính tổng dinh dưỡng của toàn bộ món ăn (kcal/g):
      + calories (kcal)
      + protein (g)
      + fat (g)
      + carbs (g)   ← tên field là "carbs", KHÔNG phải "carbohydrates"

    ====================================================
    BƯỚC 3 — PHÂN TÍCH TỪNG NGUYÊN LIỆU
    ====================================================

    ingredients là mảng, mỗi phần tử gồm:
    - name: tên nguyên liệu
    - amount: khối lượng/số lượng ước tính trong món (không để 0)
    - unit: đơn vị (ưu tiên: g, ml, cái, quả, lát, muỗng)
    - nutritionPerStandardUnit: dinh dưỡng chuẩn hóa ← tên field CHÍNH XÁC
      + Nếu unit là g/kg/ml/l → giá trị cho 100g hoặc 100ml
      + Nếu unit là cái/quả/lát/... → giá trị cho 1 đơn vị
      + calories, protein, fat, carbs, fiber  ← "carbs" KHÔNG phải "carbohydrates"

    ====================================================
    QUY TẮC BẮT BUỘC
    ====================================================

    - Chỉ trả về JSON, không text ngoài JSON
    - Dùng ĐÚNG tên field: "name", "totalNutrition", "carbs", "nutritionPerStandardUnit"
    - Không bỏ field bắt buộc nào
    - Nếu không chắc số liệu → vẫn đưa ra ước lượng hợp lý
  `;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    : null;

  const start = Date.now();
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
              isFood:        { type: Type.BOOLEAN, description: "true nếu ảnh chứa món ăn/thực phẩm, false nếu không phải" },
              notFoodReason: { type: Type.STRING,  description: "Lý do ngắn gọn bằng tiếng Việt khi isFood = false" },
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
            required: ["isFood", "name", "description", "totalNutrition", "ingredients"]
          }
        }
      }),
      AI_CALL_TIMEOUT_MS,
      'Dish image analysis'
    ),
    signal
  );

  const effectivePromise = abortPromise === null
    ? responsePromise
    : Promise.race([responsePromise, abortPromise]);

  return effectivePromise.then(
    (response: { text?: string }) => {
      const result = parseJSON(response.text ?? '', isAnalyzedDishResult, 'AnalyzedDishResult');
      if (!result.isFood) {
        throw new NotFoodImageError(result.notFoodReason ?? 'Không phải món ăn');
      }
      logAICall('analyzeDishImage', start, true);
      return result;
    },
  ).catch((err: unknown) => {
    logAICall('analyzeDishImage', start, false);
    throw err;
  });
}

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
export async function suggestIngredientInfo(
  ingredientName: string,
  unit: string,
  signal?: AbortSignal
): Promise<IngredientSuggestion> {
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
    Bạn là một chuyên gia dinh dưỡng. Hãy TÌM KIẾM THÔNG TIN DINH DƯỠNG CHÍNH XÁC cho nguyên liệu sau, dựa trên dữ liệu công khai và Google Search:
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

  const effectivePromise = abortPromise === null
    ? responsePromise
    : Promise.race([responsePromise, abortPromise]);

  return effectivePromise.then(
    (response: { text?: string }) => {
      const result = parseJSON(response.text ?? '', isIngredientSuggestion, 'IngredientSuggestion');
      nutritionCache.set(cacheKey, { data: result, ts: Date.now() });
      logAICall('suggestIngredientInfo', start, true);
      return result;
    },
  ).catch((err: unknown) => {
    logAICall('suggestIngredientInfo', start, false);
    throw err;
  });
}

/**
 * Suggest ingredients for a dish based on its name using Gemini AI.
 * @param dishName - Name of the dish (e.g., "Phở bò")
 * @param signal   - Optional AbortSignal to cancel the request
 * @returns Array of suggested ingredients with amounts and nutritional data
 * @throws {DOMException} If the request was aborted (name === 'AbortError')
 * @throws {Error} If AI response fails validation or times out
 */
export async function suggestDishIngredients(
  dishName: string,
  signal?: AbortSignal
): Promise<SuggestedDishIngredient[]> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const ai = getAI();
  const safeName = sanitizeForPrompt(dishName);

  const prompt = `
    Bạn là một chuyên gia dinh dưỡng và ẩm thực. Dựa trên tên món ăn '${safeName}', hãy liệt kê các nguyên liệu phổ biến thường có trong món này.
    Với mỗi nguyên liệu, ghi rõ:
    - name: tên nguyên liệu (tiếng Việt)
    - amount: lượng ước tính cho 1 phần ăn (số)
    - unit: đơn vị (g, ml, cái, quả, lát, muỗng, v.v.)
    - calories: kcal per 100g hoặc 1 đơn vị (nếu unit là cái/quả/lát thì tính cho 1 đơn vị, nếu unit là g/ml thì tính cho 100g/100ml)
    - protein: gram per 100g hoặc 1 đơn vị
    - carbs: gram per 100g hoặc 1 đơn vị
    - fat: gram per 100g hoặc 1 đơn vị
    - fiber: gram per 100g hoặc 1 đơn vị
    Trả về mảng JSON. Nếu không nhận ra món ăn, trả về mảng rỗng [].
  `;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    : null;

  const start = Date.now();
  const responsePromise = withRetry(
    () => callWithTimeout(
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name:     { type: Type.STRING, description: "Tên nguyên liệu" },
                amount:   { type: Type.NUMBER, description: "Lượng cho 1 phần ăn" },
                unit:     { type: Type.STRING, description: "Đơn vị (g, ml, cái, quả...)" },
                calories: { type: Type.NUMBER, description: "Kcal per 100g hoặc 1 đơn vị" },
                protein:  { type: Type.NUMBER, description: "Gram protein per 100g hoặc 1 đơn vị" },
                carbs:    { type: Type.NUMBER, description: "Gram carbs per 100g hoặc 1 đơn vị" },
                fat:      { type: Type.NUMBER, description: "Gram fat per 100g hoặc 1 đơn vị" },
                fiber:    { type: Type.NUMBER, description: "Gram fiber per 100g hoặc 1 đơn vị" },
              },
              required: ["name", "amount", "unit", "calories", "protein", "carbs", "fat", "fiber"]
            }
          }
        }
      }),
      AI_CALL_TIMEOUT_MS,
      'Dish ingredients suggestion'
    ),
    signal
  );

  const effectivePromise = abortPromise === null
    ? responsePromise
    : Promise.race([responsePromise, abortPromise]);

  return effectivePromise.then(
    (response: { text?: string }) => {
      const result = parseJSON(response.text ?? '', isSuggestedDishIngredients, 'SuggestedDishIngredients');
      logAICall('suggestDishIngredients', start, true);
      return result;
    },
  ).catch((err: unknown) => {
    logAICall('suggestDishIngredients', start, false);
    throw err;
  });
}
