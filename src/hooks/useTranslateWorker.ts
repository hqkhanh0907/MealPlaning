/**
 * useTranslateWorker.ts
 * Manages the lifecycle of the translate Web Worker singleton.
 * Registers message handlers that feed results back into the Zustand queue.
 *
 * Call once at the App root — the worker persists for the application lifetime.
 */

import { useEffect, useRef } from 'react';
import { useTranslateQueue } from '../services/translateQueueService';
import type { Ingredient, Dish, SupportedLang } from '../types';

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'result'; id: string; text: string }
  | { type: 'error'; id: string; message: string }
  | { type: 'progress'; direction: string; progress: number };

interface UseTranslateWorkerOptions {
  onTranslated: (
    itemId: string,
    itemType: 'ingredient' | 'dish',
    direction: 'vi-en' | 'en-vi',
    translated: string,
  ) => void;
  ingredients: Ingredient[];
  dishes: Dish[];
  currentLang: SupportedLang;
}

export function useTranslateWorker({
  onTranslated,
  ingredients,
  dishes,
  currentLang,
}: UseTranslateWorkerOptions) {
  const workerRef = useRef<Worker | null>(null);
  const setWorker = useTranslateQueue((s) => s.setWorker);
  const setWorkerReady = useTranslateQueue((s) => s.setWorkerReady);
  const markDone = useTranslateQueue((s) => s.markDone);
  const markError = useTranslateQueue((s) => s.markError);
  const jobs = useTranslateQueue((s) => s.jobs);
  const scanMissing = useTranslateQueue((s) => s.scanMissing);

  // Map jobId -> { itemId, itemType, direction } for routing results
  const jobMetaRef = useRef<
    Map<string, { itemId: string; itemType: 'ingredient' | 'dish'; direction: 'vi-en' | 'en-vi' }>
  >(new Map());

  const onTranslatedRef = useRef(onTranslated);
  useEffect(() => { onTranslatedRef.current = onTranslated; }, [onTranslated]);

  // Bootstrap worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/translate.worker.ts', import.meta.url),
      { type: 'module' },
    );

    workerRef.current = worker;
    setWorker(worker);

    worker.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        setWorkerReady(true);
        // After worker is ready, scan for missing translations in current data
        scanMissing(dishes, ingredients, currentLang);
      } else if (msg.type === 'result') {
        markDone(msg.id, msg.text);
        const meta = jobMetaRef.current.get(msg.id);
        if (meta && msg.text) {
          onTranslatedRef.current(meta.itemId, meta.itemType, meta.direction, msg.text);
        }
        jobMetaRef.current.delete(msg.id);
      } else if (msg.type === 'error') {
        markError(msg.id, msg.message);
        jobMetaRef.current.delete(msg.id);
      }
    });

    return () => {
      worker.terminate();
      setWorker(null);
      setWorkerReady(false);
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount/unmount only

  // Expose a sendJob helper used by the processor
  const sendJob = (jobId: string, text: string, direction: 'vi-en' | 'en-vi', itemId: string, itemType: 'ingredient' | 'dish') => {
    const worker = workerRef.current;
    if (!worker) return false;
    jobMetaRef.current.set(jobId, { itemId, itemType, direction });
    worker.postMessage({ type: 'translate', id: jobId, text, direction });
    return true;
  };

  return { sendJob, jobMetaRef, jobs };
}
