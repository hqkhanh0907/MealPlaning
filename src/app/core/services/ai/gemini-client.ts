/**
 * GeminiClient — thin HTTP wrapper around Google Generative Language API.
 *
 * Responsibilities:
 *   1. Build & send request to `models/{model}:generateContent`.
 *   2. Retry on network / HTTP 5xx (max 3 attempts, exp backoff 1s/2s/4s).
 *   3. Parse + zod-validate JSON response.
 *   4. Log every attempt (success + failure) to `ai_chat_log` for debugging.
 *   5. Throw typed `GeminiError` on failure.
 *
 * NOT responsibilities (handled in callers e.g. NutritionAi):
 *   - Prompt template rendering
 *   - Bottom sheet preview / user confirmation
 *   - DB persist of result (ingredient/dish rows)
 *
 * Source-of-truth: `docs/5-development/phase-1.5b-ai-foundation.md` §3.
 */

import { Injectable, inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { Database } from '../database/database';
import { GEMINI_API_KEY } from './gemini-key';
import { GeminiError, type GeminiErrorKind, type GeminiOptions } from './gemini-types';
import { environment } from '../../../../environments/environment';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 2048;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

/**
 * Errors that benefit from retry. Anything else → fail fast.
 *   - network: transient connectivity glitch
 *   - http_5xx: server hiccup
 *   - parse: rare; sometimes Gemini returns truncated JSON when load is high
 */
const RETRYABLE: ReadonlySet<GeminiErrorKind> = new Set<GeminiErrorKind>([
  'network',
  'http_5xx',
  'parse',
]);

/** Shape of the Gemini API response (subset we actually read). */
interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  usageMetadata?: { totalTokenCount?: number };
  error?: { code?: number; message?: string; status?: string };
}

@Injectable({ providedIn: 'root' })
export class GeminiClient {
  private readonly db = inject(Database);
  private readonly apiKey = inject(GEMINI_API_KEY);

  /**
   * Generate a structured JSON response from Gemini.
   *
   * @throws {GeminiError} on any failure (network, HTTP, parse, validation).
   */
  async generateContent<T>(prompt: string, options: GeminiOptions<T>): Promise<T> {
    const model = options.model ?? environment.geminiModel;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (!this.apiKey) {
      // Surfaces in dev when .env missing; treat as 401 so caller shows
      // the "Lỗi cấu hình AI" toast.
      const err = new GeminiError('http_401', 'Gemini API key not configured (empty after decode)');
      await this.logAttempt(options.feature, prompt, err, model);
      throw err;
    }

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      let responseText: string | undefined;
      let responseTokens: number | undefined;

      try {
        const { text, tokens } = await this.callOnce(prompt, options, model, timeoutMs);
        responseText = text;
        responseTokens = tokens;

        // Parse + validate (any failure here is also retry candidate for parse).
        const parsed = this.parseAndValidate(text, options.schema);

        // Success — log full prompt + response + token count.
        await this.logSuccess(options.feature, prompt, text, model, tokens);
        return parsed;
      } catch (err) {
        const geminiError =
          err instanceof GeminiError ? err : new GeminiError('network', String(err), err);

        if (!RETRYABLE.has(geminiError.kind) || attempt === MAX_RETRY_ATTEMPTS - 1) {
          await this.logAttempt(
            options.feature,
            prompt,
            geminiError,
            model,
            responseText,
            responseTokens,
          );
          throw geminiError;
        }
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }

    throw new GeminiError('network', 'Retry loop exhausted unexpectedly');
  }

  /**
   * Single HTTP attempt. Throws GeminiError tagged with the right kind.
   */
  private async callOnce<T>(
    prompt: string,
    options: GeminiOptions<T>,
    model: string,
    timeoutMs: number,
  ): Promise<{ text: string; tokens: number | undefined }> {
    const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const parts: unknown[] = [{ text: prompt }];
    for (const image of options.imageParts ?? []) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_TOKENS,
        responseMimeType: 'application/json',
        ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
      },
    };
    if (options.systemInstruction) {
      body['systemInstruction'] = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // fetch rejects on: network down, timeout (DOMException 'TimeoutError'),
      // CORS, DNS. All bucket as 'network'.
      throw new GeminiError('network', err instanceof Error ? err.message : String(err), err);
    }

    if (!res.ok) {
      throw new GeminiError(
        httpKindFromStatus(res.status),
        `Gemini HTTP ${res.status}`,
        await safeReadText(res),
        res.status,
      );
    }

    let json: GeminiResponse;
    try {
      json = (await res.json()) as GeminiResponse;
    } catch (err) {
      throw new GeminiError('parse', 'Response body not valid JSON', err);
    }

    if (json.error) {
      throw new GeminiError(
        'http_400',
        json.error.message ?? 'Gemini error',
        json.error,
        json.error.code,
      );
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new GeminiError('empty', 'Gemini returned no candidate text', json);
    }
    return { text, tokens: json.usageMetadata?.totalTokenCount };
  }

  private parseAndValidate<T>(text: string, schema: GeminiOptions<T>['schema']): T {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (err) {
      throw new GeminiError('parse', 'JSON.parse failed', err);
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw new GeminiError('validation', 'zod validation failed', result.error);
    }
    return result.data;
  }

  private async logSuccess(
    feature: string,
    prompt: string,
    response: string,
    model: string,
    tokens: number | undefined,
  ): Promise<void> {
    await this.writeLog(feature, prompt, response, model, tokens);
  }

  private async logAttempt(
    feature: string,
    prompt: string,
    err: GeminiError,
    model: string,
    responseText?: string,
    tokens?: number,
  ): Promise<void> {
    const responsePayload = JSON.stringify({
      error: { kind: err.kind, message: err.message, httpStatus: err.httpStatus },
      ...(responseText ? { rawResponse: responseText } : {}),
    });
    await this.writeLog(feature, prompt, responsePayload, model, tokens);
  }

  private async writeLog(
    feature: string,
    prompt: string,
    response: string,
    model: string,
    tokens: number | undefined,
  ): Promise<void> {
    try {
      await this.db.execute(
        `INSERT INTO ai_chat_log (id, feature, prompt, response, model, tokens_used)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), feature, prompt, response, model, tokens ?? null],
      );
    } catch (err) {
      // Logging must never crash the AI flow — surface to console only.
      // (e.g. DB locked, schema not migrated yet)
      console.warn('[GeminiClient] ai_chat_log write failed:', err);
    }
  }
}

// =========================================================================
// Helpers
// =========================================================================

function httpKindFromStatus(status: number): GeminiErrorKind {
  if (status === 400) return 'http_400';
  if (status === 401) return 'http_401';
  if (status === 403) return 'http_403';
  if (status === 429) return 'http_429';
  if (status >= 500 && status <= 599) return 'http_5xx';
  return 'http_400';
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Delete `ai_chat_log` rows older than N days.
 *
 * Uses SQLite-side `datetime('now', '-N days')` to avoid timezone
 * mismatches between JS `toISOString()` and the schema's
 * `DEFAULT (datetime('now'))` (UTC, no Z suffix).
 *
 * Called once at app startup from `App` component (see `app.ts`).
 */
export async function cleanupOldAiLogs(db: Database, retentionDays = 30): Promise<void> {
  if (!Number.isInteger(retentionDays) || retentionDays <= 0) return;
  await db.execute(
    `DELETE FROM ai_chat_log WHERE created_at < datetime('now', '-' || ? || ' days')`,
    [retentionDays],
  );
}
