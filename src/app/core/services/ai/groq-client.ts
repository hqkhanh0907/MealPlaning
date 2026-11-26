import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import type { z } from 'zod';
import { groqApiKey } from '../../../../environments/groq-development';
import { AccountSession } from '../../account/account-session';
import { GroqCredentials, NATIVE_GROQ, NativeGroqError, nativeGroqError } from './groq-credentials';

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
  private readonly credentials = inject(GroqCredentials);
  private readonly key = this.credentials.supported ? '' : inject(GROQ_API_KEY).trim();
  private readonly account = inject(AccountSession);
  private readonly native = inject(NATIVE_GROQ);

  async generate<T>(
    name: string,
    schema: z.ZodType<T>,
    messages: { role: 'system' | 'user'; content: MessageContent }[],
    timeoutMs: number,
    maxOutputTokens?: number,
  ): Promise<T> {
    const payload = {
      model: 'qwen/qwen3.8-27b',
      response_format: {
        type: 'json_schema',
        json_schema: { name, strict: true, schema: schema.toJSONSchema({ target: 'draft-7' }) },
      },
      ...(maxOutputTokens ? { max_completion_tokens: maxOutputTokens } : {}),
      messages,
    };
    const content = this.credentials.supported
      ? await this.generateNative(payload, timeoutMs)
      : await this.generateWeb(payload, timeoutMs);
    return schema.parse(typeof content === 'string' ? JSON.parse(content) : null);
  }

  private async generateWeb(payload: object, timeoutMs: number): Promise<unknown> {
    const request = this.http.post<{ choices?: { message?: { content?: unknown } }[] }>(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
      { headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' } },
    );
    const response = await firstValueFrom(request.pipe(timeout(timeoutMs)));
    return response?.choices?.[0]?.message?.content;
  }

  private async generateNative(payload: object, timeoutMs: number): Promise<string | undefined> {
    const account = this.account.current();
    if (!account) throw new NativeGroqError('groq_no_session');
    const response = await this.native
      .generate({ ownerId: account.id, payload, timeoutMs })
      .catch((error: unknown) => {
        if (this.account.current() !== account) throw new NativeGroqError('groq_session_changed');
        const failure = nativeGroqError(error);
        if (failure.code === 'groq_not_configured') void this.credentials.refresh();
        throw failure;
      });
    if (this.account.current() !== account) throw new NativeGroqError('groq_session_changed');
    if (response.status < 200 || response.status >= 300) {
      throw new HttpErrorResponse({ status: response.status });
    }
    return response.content;
  }
}
