/**
 * translate.worker.ts
 * Web Worker for translating food-related terms between Vietnamese and English.
 *
 * Translation strategy (fastest first):
 *   1. Static dictionary lookup (~0ms) — covers 200+ common food terms.
 *   2. opus-mt WASM model fallback — for terms not in the dictionary.
 *
 * Message protocol:
 *   IN:  { type: 'translate', id: string, text: string, direction: 'vi-en' | 'en-vi' }
 *   OUT: { type: 'result',   id: string, text: string }
 *       { type: 'error',    id: string, message: string }
 *       { type: 'ready' }
 *       { type: 'progress', direction: string, progress: number }
 */

import { pipeline, env, type TranslationPipeline } from '@xenova/transformers';
import { lookupFoodTranslation } from '../data/foodDictionary';

// ── Offline configuration ──────────────────────────────────────────────────
env.allowRemoteModels = false;
env.localModelPath = '/models/';
// ──────────────────────────────────────────────────────────────────────────

type Direction = 'vi-en' | 'en-vi';

const MODEL_IDS: Record<Direction, string> = {
  'vi-en': 'opus-mt-vi-en',
  'en-vi': 'opus-mt-en-vi',
};

const pipelines: Partial<Record<Direction, TranslationPipeline>> = {};
const loading: Partial<Record<Direction, Promise<TranslationPipeline>>> = {};

async function getPipeline(direction: Direction): Promise<TranslationPipeline> {
  const cached = pipelines[direction];
  if (cached) return cached;

  const pending = loading[direction];
  if (pending !== undefined) return pending;

  const loadPromise: Promise<TranslationPipeline> = pipeline('translation', MODEL_IDS[direction], {
    progress_callback: (p: { progress?: number }) => {
      globalThis.postMessage({
        type: 'progress',
        direction,
        progress: Math.round(p.progress ?? 0),
      });
    },
  });

  loading[direction] = loadPromise;

  const p = await loadPromise;
  pipelines[direction] = p;
  return p;
}

// Signal that the worker script initialised correctly
globalThis.postMessage({ type: 'ready' });

interface TranslateMessageData {
  type: string;
  id: string;
  text: string;
  direction: Direction;
}

function isTranslateMessageData(data: unknown): data is TranslateMessageData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    typeof obj.id === 'string' &&
    typeof obj.text === 'string' &&
    typeof obj.direction === 'string'
  );
}

globalThis.onmessage = async (event: MessageEvent) => {
  if (!isTranslateMessageData(event.data)) return;

  const { type, id, text, direction } = event.data;

  if (type !== 'translate') return;

  if (!text?.trim()) {
    globalThis.postMessage({ type: 'result', id, text: '' });
    return;
  }

  // Fast path: static dictionary lookup (~0ms)
  const dictResult = lookupFoodTranslation(text, direction);
  if (dictResult) {
    globalThis.postMessage({ type: 'result', id, text: dictResult });
    return;
  }

  // Slow path: ML model translation
  try {
    const pipe = await getPipeline(direction);
    const output = await pipe(text, { max_new_tokens: 512 });
    const translated =
      Array.isArray(output) && output.length > 0
        ? (output[0] as { translation_text: string }).translation_text
        : '';
    globalThis.postMessage({ type: 'result', id, text: translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    globalThis.postMessage({ type: 'error', id, message });
  }
};
