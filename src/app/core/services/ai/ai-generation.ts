import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { TimeoutError } from 'rxjs';
import { ZodError, type z } from 'zod';

import { GeminiClient } from './gemini-client';
import { GEMINI_API_KEY } from './gemini-key';
import { geminiResponseSchema } from './gemini-response-schema';
import { GEMINI_ERROR_TOAST, GeminiError, type AiFeature } from './gemini-types';
import { GROQ_API_KEY, GroqClient } from './groq-client';
import { GroqCredentials, NativeGroqError } from './groq-credentials';

type Provider = 'Groq' | 'Gemini';
type Capability = 'text' | 'photo';
type TextFeature = Extract<
  AiFeature,
  | 'ingredient_lookup'
  | 'dish_autofill'
  | 'meal_plan_day'
  | 'menu_suggestion'
  | 'daily_insight'
  | 'training_plan'
>;

interface GenerationOptions<T> {
  readonly feature: TextFeature;
  readonly schema: z.ZodType<T>;
  readonly systemInstruction?: string;
  readonly maxOutputTokens?: number;
  readonly timeoutMs?: number;
}

export class AiRequestError extends Error {}

export function aiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AiRequestError) return error.message;
  if (error instanceof Error && error.message.includes('requires network'))
    return 'Cần kết nối mạng để dùng AI';
  if (error instanceof GeminiError) return mapRequestError('Gemini', error).message;
  return fallback;
}

const missingConfiguration: Record<Capability, string> = {
  text: 'Ứng dụng chưa có khóa AI. Hãy cấu hình khóa Groq hoặc Gemini.',
  photo: 'Ứng dụng chưa có khóa Groq để phân tích ảnh.',
};

@Injectable({ providedIn: 'root' })
export class AiGeneration {
  private readonly injector = inject(Injector);
  private readonly groq = inject(GroqCredentials);
  private readonly hasGroq = !this.groq.supported && Boolean(inject(GROQ_API_KEY).trim());
  private readonly hasGemini = !this.groq.supported && Boolean(inject(GEMINI_API_KEY).trim());

  providerFor(capability: Capability): Provider | null {
    if (this.groq.supported) return this.groq.configured() ? 'Groq' : null;
    if (this.hasGroq) return 'Groq';
    return capability === 'text' && this.hasGemini ? 'Gemini' : null;
  }

  configurationIssue(capability: Capability): string | null {
    return this.providerFor(capability) ? null : this.missingConfiguration(capability);
  }

  private requireProvider(capability: Capability): Provider {
    const provider = this.providerFor(capability);
    if (!provider) throw new AiRequestError(this.missingConfiguration(capability));
    return provider;
  }

  private missingConfiguration(capability: Capability): string {
    return this.groq.supported
      ? 'Thêm khóa Groq trong Cài đặt, mục AI.'
      : missingConfiguration[capability];
  }

  async generateText<T>(prompt: string, options: GenerationOptions<T>): Promise<T> {
    const provider = this.requireProvider('text');
    try {
      if (provider === 'Gemini') {
        return await this.injector.get(GeminiClient).generateContent(prompt, {
          ...options,
          responseSchema: geminiResponseSchema(options.schema),
        });
      }
      return await this.injector
        .get(GroqClient)
        .generate(
          options.feature,
          options.schema,
          [
            ...(options.systemInstruction
              ? [{ role: 'system' as const, content: options.systemInstruction }]
              : []),
            { role: 'user', content: prompt },
          ],
          options.timeoutMs ?? 15_000,
          options.maxOutputTokens,
        );
    } catch (error) {
      throw mapRequestError(provider, error);
    }
  }

  async generatePhoto<T>(
    prompt: string,
    image: { readonly mimeType: string; readonly data: string },
    schema: z.ZodType<T>,
  ): Promise<T> {
    const provider = this.requireProvider('photo');
    try {
      return await this.injector.get(GroqClient).generate(
        'food_photo_analysis',
        schema,
        [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.data}` },
              },
            ],
          },
        ],
        60_000,
      );
    } catch (error) {
      throw mapRequestError(provider, error);
    }
  }
}

function mapRequestError(provider: Provider, error: unknown): Error {
  if (error instanceof NativeGroqError) return new AiRequestError(error.message);
  const status =
    error instanceof HttpErrorResponse
      ? error.status
      : error instanceof GeminiError
        ? error.httpStatus
        : undefined;
  if (status === 401 || status === 403)
    return new AiRequestError(
      `${provider} từ chối khóa. Hãy kiểm tra quyền truy cập của khóa ${provider}.`,
    );
  if (status === 402)
    return new AiRequestError(
      `${provider} yêu cầu thanh toán. Hãy kiểm tra hạn mức tài khoản ${provider}.`,
    );
  if (status === 429)
    return new AiRequestError(`${provider} đã đạt giới hạn yêu cầu. Hãy thử lại sau.`);
  if (error instanceof TimeoutError)
    return new AiRequestError(`${provider} mất quá nhiều thời gian để phản hồi. Hãy thử lại.`);
  if (status === 0 || (error instanceof GeminiError && error.kind === 'network'))
    return new AiRequestError(`Không kết nối được với ${provider}. Hãy kiểm tra mạng.`);
  if (error instanceof HttpErrorResponse)
    return new AiRequestError(`${provider} chưa thể xử lý yêu cầu. Hãy thử lại sau.`);
  if (error instanceof GeminiError) return new AiRequestError(GEMINI_ERROR_TOAST[error.kind]);
  if (error instanceof SyntaxError || error instanceof ZodError)
    return new AiRequestError(`${provider} trả về kết quả không hợp lệ. Hãy thử lại.`);
  return error instanceof Error
    ? error
    : new AiRequestError(`${provider} chưa thể xử lý yêu cầu. Hãy thử lại sau.`);
}
