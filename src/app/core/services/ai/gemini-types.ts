/**
 * Type definitions for Gemini API client.
 *
 * Source-of-truth: `docs/5-development/phase-1.5b-ai-foundation.md` §3.5
 * (error taxonomy) + §3.2 (GeminiOptions).
 */

import type { z } from 'zod';

/**
 * Feature tag — must match the CHECK constraint on `ai_chat_log.feature`
 * (xem core/services/database/schema.ts §ai_chat_log).
 *
 * Adding a new value here without migrating the DB will violate the CHECK
 * constraint at INSERT time.
 */
export type AiFeature =
  // Phase 1.5B
  | 'ingredient_lookup'
  | 'dish_autofill'
  // Phase 2
  | 'meal_plan_day'
  | 'meal_plan_week'
  // Phase 5
  | 'image_analysis'
  | 'menu_suggestion'
  | 'daily_insight'
  | 'weekly_review'
  | 'training_plan';

/**
 * Options for a single `GeminiClient.generateContent` call.
 */
export interface GeminiOptions<T> {
  /** Required — used for ai_chat_log.feature column + analytics. */
  readonly feature: AiFeature;
  /** zod schema to validate the parsed JSON response. */
  readonly schema: z.ZodType<T>;
  /** Optional system instruction (preceding the user prompt). */
  readonly systemInstruction?: string;
  /**
   * JSON Schema for Gemini Structured Output. When set, Gemini guarantees
   * the response matches this schema (we still re-validate with `schema`).
   *
   * @see https://ai.google.dev/gemini-api/docs/structured-output
   */
  readonly responseSchema?: object;
  /** 0.0–2.0. Default 0.2 (deterministic for data extraction tasks). */
  readonly temperature?: number;
  /** Default 2048. */
  readonly maxOutputTokens?: number;
  /** Default 15_000ms. Set higher for image analysis (Phase 5). */
  readonly timeoutMs?: number;
  /** Override default model from `environment.geminiModel`. */
  readonly model?: string;
  /** Optional inline images for Gemini Vision calls. Data must be base64 without data URL prefix. */
  readonly imageParts?: readonly GeminiInlineImagePart[];
}

export interface GeminiInlineImagePart {
  readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly data: string;
}

/**
 * Discriminated union of all errors `GeminiClient` may throw.
 *
 * Retry policy (xem `phase-1.5b-ai-foundation.md` §3.5):
 *   - network, http_5xx, parse  → retry (max 3, exp backoff 1s/2s/4s)
 *   - http_400, http_401, http_403, http_429, empty, validation → no retry
 */
export type GeminiErrorKind =
  | 'network' // fetch failed (timeout, DNS, offline)
  | 'http_400' // bad prompt
  | 'http_401' // invalid key
  | 'http_403' // forbidden (key disabled, billing, etc.)
  | 'http_429' // rate limit (paid tier hard cap or per-second)
  | 'http_5xx' // 500/502/503/504
  | 'parse' // JSON.parse failed
  | 'validation' // zod validation failed (after parse)
  | 'empty'; // candidates array empty

export class GeminiError extends Error {
  constructor(
    readonly kind: GeminiErrorKind,
    message: string,
    override readonly cause?: unknown,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Vietnamese toast text per error kind. Used by callers (NutritionAi,
 * UI integrations) to surface user-friendly messages.
 *
 * Source: ai-strategy.md §5.1 (post Phase 1.5B revision).
 */
export const GEMINI_ERROR_TOAST: Readonly<Record<GeminiErrorKind, string>> = {
  network: 'Cần kết nối mạng để dùng AI',
  http_400: 'Lỗi gửi yêu cầu AI, vui lòng thử lại',
  http_401: 'Lỗi cấu hình AI, vui lòng cập nhật app',
  http_403: 'Lỗi cấu hình AI, vui lòng cập nhật app',
  http_429: 'Đã đạt giới hạn AI, thử lại sau',
  http_5xx: 'AI đang bận, thử lại sau',
  parse: 'AI trả kết quả lạ, vui lòng thử lại',
  validation: 'AI trả kết quả lạ, vui lòng thử lại',
  empty: 'AI không có gợi ý, hãy thử lại',
};
