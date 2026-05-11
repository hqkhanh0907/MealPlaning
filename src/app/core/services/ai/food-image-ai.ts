import { Injectable, inject } from '@angular/core';
import type { CapturedImage } from '../camera/camera-capture';
import { GeminiClient } from './gemini-client';
import {
  FOOD_IMAGE_SYSTEM_INSTRUCTION,
  buildFoodImagePrompt,
  foodImageGeminiSchema,
  foodImageResponseSchema,
  type FoodImageResponse,
} from './prompts/food-image-analysis.prompt';

export interface FoodImageAnalysisItem {
  readonly name: string;
  readonly estimatedGrams: number;
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
  readonly fiber: number;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly warning: string | null;
}

export interface FoodImageAnalysisResult {
  readonly overallConfidence: 'high' | 'medium' | 'low';
  readonly imageQualityWarning: string | null;
  readonly items: readonly FoodImageAnalysisItem[];
}

@Injectable({ providedIn: 'root' })
export class FoodImageAi {
  private readonly gemini = inject(GeminiClient);

  async analyzeMealPhoto(
    image: CapturedImage,
    mealContext = 'meal',
  ): Promise<FoodImageAnalysisResult> {
    const response = await this.gemini.generateContent<FoodImageResponse>(
      buildFoodImagePrompt(mealContext),
      {
        feature: 'image_analysis',
        systemInstruction: FOOD_IMAGE_SYSTEM_INSTRUCTION,
        responseSchema: foodImageGeminiSchema,
        schema: foodImageResponseSchema,
        imageParts: [{ mimeType: image.mimeType, data: image.data }],
        maxOutputTokens: 4096,
        timeoutMs: 60_000,
      },
    );

    return {
      overallConfidence: response.overall_confidence,
      imageQualityWarning: cleanOptional(response.image_quality_warning),
      items: response.items.map((item) => ({
        name: item.name.trim(),
        estimatedGrams: Math.round(item.estimated_grams),
        calories: Math.round(item.calories),
        protein: Math.round(item.protein),
        carbs: Math.round(item.carbs),
        fat: Math.round(item.fat),
        fiber: Math.round(item.fiber),
        confidence: item.confidence,
        warning: cleanOptional(item.warning),
      })),
    };
  }
}

function cleanOptional(value: string | null): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}
