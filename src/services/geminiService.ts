import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");
  return new GoogleGenAI({ apiKey });
};

export const suggestMealPlan = async (
  targetCalories: number,
  targetProtein: number,
  availableMeals: any[]
) => {
  const ai = getAI();

  const prompt = `
    Bạn là một chuyên gia dinh dưỡng. Hãy lên thực đơn cho một ngày (Bữa sáng, Bữa trưa, Bữa tối) dựa trên thư viện món ăn có sẵn.
    Mục tiêu: ~${targetCalories} kcal, ~${targetProtein}g protein.
    
    Thư viện món ăn hiện có:
    ${JSON.stringify(availableMeals)}
    
    Hãy chọn 1 bữa sáng, 1 bữa trưa và 1 bữa tối từ thư viện sao cho tổng dinh dưỡng gần với mục tiêu nhất có thể.
    Trả về kết quả dưới dạng JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          breakfastId: { type: Type.STRING },
          lunchId: { type: Type.STRING },
          dinnerId: { type: Type.STRING },
          reasoning: { type: Type.STRING, description: "Giải thích ngắn gọn lý do chọn thực đơn này bằng tiếng Việt" }
        },
        required: ["breakfastId", "lunchId", "dinnerId", "reasoning"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzeDishImage = async (base64Image: string, mimeType: string) => {
  const ai = getAI();

  const prompt = `
    Hãy phân tích hình ảnh món ăn này.
    Nhận diện tên món ăn, ước tính lượng calo và protein cho một khẩu phần ăn thông thường.
    Liệt kê các nguyên liệu chính.
    Trả về kết quả bằng tiếng Việt dưới dạng JSON.
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
          calories: { type: Type.NUMBER, description: "Ước tính calo" },
          protein: { type: Type.NUMBER, description: "Ước tính protein (gram)" },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Danh sách nguyên liệu chính"
          },
          description: { type: Type.STRING, description: "Mô tả ngắn gọn về món ăn" }
        },
        required: ["name", "calories", "protein", "ingredients", "description"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const suggestIngredientInfo = async (ingredientName: string, unit: string) => {
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

  // Set a timeout for the API call
  const timeoutPromise = new Promise((_, reject) => 
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

  const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;

  return JSON.parse(response.text || "{}");
};
