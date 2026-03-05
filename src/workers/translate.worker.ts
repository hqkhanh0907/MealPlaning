/**
 * translate.worker.ts
 * Web Worker that loads opus-mt models via @xenova/transformers (WASM, offline).
 * Models are bundled in public/models/ — no remote downloads at runtime.
 *
 * Message protocol:
 *   IN:  { type: 'translate', id: string, text: string, direction: 'vi-en' | 'en-vi' }
 *   OUT: { type: 'result',   id: string, text: string }
 *       { type: 'error',    id: string, message: string }
 *       { type: 'ready' }
 *       { type: 'progress', direction: string, progress: number }
 */

import { pipeline, env, type TranslationPipeline } from '@xenova/transformers';

// ── Offline configuration ──────────────────────────────────────────────────
// Use only the local model files bundled in public/models/; never hit the internet.
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
  if (pipelines[direction]) return pipelines[direction]!;

  if (loading[direction]) return loading[direction]!;

  loading[direction] = pipeline('translation', MODEL_IDS[direction], {
    progress_callback: (p: { progress?: number }) => {
      self.postMessage({
        type: 'progress',
        direction,
        progress: Math.round(p.progress ?? 0),
      });
    },
  }) as Promise<TranslationPipeline>;

  const p = await loading[direction]!;
  pipelines[direction] = p;
  return p;
}

// Signal that the worker script initialised correctly
self.postMessage({ type: 'ready' });

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, id, text, direction } = event.data as {
    type: string;
    id: string;
    text: string;
    direction: Direction;
  };

  if (type !== 'translate') return;

  if (!text || !text.trim()) {
    self.postMessage({ type: 'result', id, text: '' });
    return;
  }

  try {
    const pipe = await getPipeline(direction);
    const output = await pipe(text, { max_new_tokens: 512 });
    const translated =
      Array.isArray(output) && output.length > 0
        ? (output[0] as { translation_text: string }).translation_text
        : '';
    self.postMessage({ type: 'result', id, text: translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', id, message });
  }
});
