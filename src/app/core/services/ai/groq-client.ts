import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { groqApiKey } from '@groq-config';
import { firstValueFrom, timeout } from 'rxjs';
import type { z } from 'zod';

export const GROQ_API_KEY = new InjectionToken<string>('GROQ_API_KEY', {
  providedIn: 'root',
  factory: () => groqApiKey,
});

type MessageContent =
  | string
  | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];

@Injectable({ providedIn: 'root' })
export class GroqClient {
  private readonly http = inject(HttpClient);
  private readonly key = inject(GROQ_API_KEY).trim();

  async generate<T>(
    name: string,
    schema: z.ZodType<T>,
    messages: { role: 'system' | 'user'; content: MessageContent }[],
    timeoutMs: number,
    maxOutputTokens?: number,
  ): Promise<T> {
    const request = this.http.post<{ choices?: { message?: { content?: unknown } }[] }>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'qwen/qwen3.8-27b',
        response_format: {
          type: 'json_schema',
          json_schema: { name, strict: true, schema: schema.toJSONSchema({ target: 'draft-7' }) },
        },
        ...(maxOutputTokens ? { max_completion_tokens: maxOutputTokens } : {}),
        messages,
      },
      { headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' } },
    );
    const response = await firstValueFrom(request.pipe(timeout(timeoutMs)));
    const content = response?.choices?.[0]?.message?.content;
    return schema.parse(typeof content === 'string' ? JSON.parse(content) : null);
  }
}
