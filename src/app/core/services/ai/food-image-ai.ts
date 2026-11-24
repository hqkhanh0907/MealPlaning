import { Injectable, inject } from '@angular/core';
import type { FoodImageAnalysisItem } from '../../models/photo-meal';
import type { CapturedImage } from '../camera/camera-capture';
import { AiGeneration, AiRequestError } from './ai-generation';
import {
  buildFoodImagePrompt,
  foodImageResponseSchema,
} from './prompts/food-image-analysis.prompt';

export type { FoodImageAnalysisItem } from '../../models/photo-meal';

export interface FoodImageAnalysisResult {
  readonly overallConfidence: 'high' | 'medium' | 'low';
  readonly imageQualityWarning: string | null;
  readonly items: readonly FoodImageAnalysisItem[];
}

@Injectable({ providedIn: 'root' })
export class FoodImageAi {
  private readonly ai = inject(AiGeneration);

  async analyzeMealPhoto(
    image: CapturedImage,
    mealContext = 'meal',
  ): Promise<FoodImageAnalysisResult> {
    const response = await this.ai.generatePhoto(
      buildFoodImagePrompt(mealContext),
      image,
      foodImageResponseSchema,
    );
    if (!response.items.length)
      throw new AiRequestError('Chưa nhận diện được món ăn. Hãy thử ảnh khác.');

    return {
      overallConfidence: response.overall_confidence,
      imageQualityWarning: response.image_quality_warning?.trim() || null,
      items: response.items.map((item) => ({
        name: item.name.trim(),
        estimatedGrams: item.estimated_grams,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        confidence: item.confidence,
        warning: item.warning?.trim() || null,
      })),
    };
  }
}
