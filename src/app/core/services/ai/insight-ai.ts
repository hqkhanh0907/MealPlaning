import { Injectable, inject } from '@angular/core';
import { AiGeneration } from './ai-generation';
import {
  DAILY_INSIGHT_SYSTEM_INSTRUCTION,
  buildDailyInsightPrompt,
  dailyInsightResponseSchema,
  type BuildDailyInsightPromptInput,
  type DailyInsightResponse,
} from './prompts/daily-insight.prompt';

export type DailyInsightAiInput = BuildDailyInsightPromptInput;
export type DailyInsight = Readonly<DailyInsightResponse>;
export { AiRequestError as DailyInsightError } from './ai-generation';

@Injectable({ providedIn: 'root' })
export class InsightAi {
  private readonly ai = inject(AiGeneration);
  readonly providerName = this.ai.providerFor('text');

  async generateDailyInsight(input: DailyInsightAiInput): Promise<DailyInsight> {
    const response = await this.ai.generateText(buildDailyInsightPrompt(input), {
      feature: 'daily_insight',
      systemInstruction: DAILY_INSIGHT_SYSTEM_INSTRUCTION,
      schema: dailyInsightResponseSchema,
      maxOutputTokens: 1024,
      timeoutMs: 30_000,
    });
    return {
      tone: response.tone,
      title: response.title.trim(),
      body: response.body.trim(),
      action: response.action.trim(),
    };
  }
}
