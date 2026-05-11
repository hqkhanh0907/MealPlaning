import { Injectable, inject } from '@angular/core';
import type { NutritionTotals } from '../nutrition/nutrition-query';
import { GeminiClient } from './gemini-client';
import {
  DAILY_INSIGHT_SYSTEM_INSTRUCTION,
  buildDailyInsightPrompt,
  dailyInsightGeminiSchema,
  dailyInsightResponseSchema,
  type DailyInsightResponse,
} from './prompts/daily-insight.prompt';

export interface DailyInsightAiInput {
  readonly date: string;
  readonly level: 'beginner' | 'intermediate' | 'advanced';
  readonly totals: NutritionTotals;
  readonly targets: NutritionTotals;
  readonly workoutVolumeKg: number;
  readonly workoutStreakWeeks: number;
}

export interface DailyInsight {
  readonly tone: 'info' | 'warning' | 'success';
  readonly title: string;
  readonly body: string;
  readonly action: string;
}

@Injectable({ providedIn: 'root' })
export class InsightAi {
  private readonly gemini = inject(GeminiClient);

  async generateDailyInsight(input: DailyInsightAiInput): Promise<DailyInsight> {
    const response = await this.gemini.generateContent<DailyInsightResponse>(
      buildDailyInsightPrompt(input),
      {
        feature: 'daily_insight',
        systemInstruction: DAILY_INSIGHT_SYSTEM_INSTRUCTION,
        responseSchema: dailyInsightGeminiSchema,
        schema: dailyInsightResponseSchema,
        maxOutputTokens: 1024,
        timeoutMs: 30_000,
      },
    );

    return {
      tone: response.tone,
      title: response.title.trim(),
      body: response.body.trim(),
      action: response.action.trim(),
    };
  }
}
