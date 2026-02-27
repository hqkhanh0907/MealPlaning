import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { AnalyzedDishResult, IngredientSuggestion, MealPlanSuggestion, MealType } from '../types';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");
  return new GoogleGenAI({ apiKey });
};

export type AvailableDishInfo = {
  id: string;
  name: string;
  tags: MealType[];
  calories: number;
  protein: number;
};

export const suggestMealPlan = async (
  targetCalories: number,
  targetProtein: number,
  availableDishes: AvailableDishInfo[],
  signal?: AbortSignal
): Promise<MealPlanSuggestion> => {
  // Check if already aborted
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const ai = getAI();

  const prompt = `
    Bạn là một chuyên gia dinh dưỡng. Hãy lên thực đơn cho một ngày (Bữa sáng, Bữa trưa, Bữa tối) dựa trên thư viện món ăn có sẵn.
    Mục tiêu: ~${targetCalories} kcal, ~${targetProtein}g protein.
    
    Thư viện món ăn hiện có (mỗi món có tags cho biết phù hợp bữa nào):
    ${JSON.stringify(availableDishes)}
    
    Hãy chọn các MÓN ĂN cho 3 bữa. Mỗi bữa có thể có 1 hoặc nhiều món. Ưu tiên chọn món có tag phù hợp với bữa đó.
    Trả về kết quả dưới dạng JSON.
  `;

  // Create a promise that rejects when abort signal is triggered
  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    : null;

  const apiCallPromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          breakfastDishIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          lunchDishIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          dinnerDishIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING, description: "Giải thích ngắn gọn lý do chọn thực đơn này bằng tiếng Việt" }
        },
        required: ["breakfastDishIds", "lunchDishIds", "dinnerDishIds", "reasoning"]
      }
    }
  });

  const response = abortPromise
    ? await Promise.race([apiCallPromise, abortPromise])
    : await apiCallPromise;

  return JSON.parse(response.text || "{}") as MealPlanSuggestion;
};

export const analyzeDishImage = async (base64Image: string, mimeType: string): Promise<AnalyzedDishResult> => {
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
          name: { type: Type.STRING, description: "Tên món ăn" },
          description: { type: Type.STRING, description: "Mô tả ngắn gọn" },
          totalNutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER }
            },
            required: ["calories", "protein", "fat", "carbs"]
          },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER, description: "Số lượng trong món ăn này" },
                unit: { type: Type.STRING },
                nutritionPerStandardUnit: {
                  type: Type.OBJECT,
                  description: "Dinh dưỡng cho 100g/ml hoặc 1 đơn vị",
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fiber: { type: Type.NUMBER }
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
  });

  return JSON.parse(response.text || "{}") as AnalyzedDishResult;
};

export const suggestIngredientInfo = async (ingredientName: string, unit: string): Promise<IngredientSuggestion> => {
  const ai = getAI();

  const isPiece = !['g', 'kg', 'mg', 'ml', 'l'].includes(unit.toLowerCase().trim());
  const targetAmount = isPiece ? `1 ${unit}` : '100g/100ml';

  const prompt = `
    Tìm kiếm thông tin dinh dưỡng chính xác cho ${targetAmount} của nguyên liệu "${ingredientName}" sử dụng Google Search.
    Trả về một đối tượng JSON với các trường sau:
    - calories (số, kcal trong ${targetAmount})
    - protein (số, gam trong ${targetAmount})
    - carbs (số, gam trong ${targetAmount})
    - fat (số, gam trong ${targetAmount})
    - fiber (số, gam trong ${targetAmount})
    - unit (chuỗi, trả về chính xác "${unit}")
  `;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 300000)
  );

  const apiCallPromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          unit: { type: Type.STRING }
        },
        required: ["calories", "protein", "carbs", "fat", "fiber", "unit"]
      }
    }
  });

  const response = await Promise.race([apiCallPromise, timeoutPromise]);

  return JSON.parse(response.text || "{}") as IngredientSuggestion;
};
