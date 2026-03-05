/**
 * useTranslateProcessor.ts
 * Picks pending translation jobs from the Zustand queue and dispatches them
 * to the Web Worker during browser idle time.
 *
 * Uses requestIdleCallback with a setTimeout fallback for environments that
 * don't support it (e.g. jsdom in tests).
 */

import { useEffect, useRef } from 'react';
import { useTranslateQueue } from '../services/translateQueueService';

// requestIdleCallback shim for environments without it (tests, old Safari)
const scheduleIdle: (cb: () => void) => void =
  typeof requestIdleCallback === 'function'
    ? (cb) => requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => setTimeout(cb, 50);

interface UseTranslateProcessorOptions {
  sendJob: (
    jobId: string,
    text: string,
    direction: 'vi-en' | 'en-vi',
    itemId: string,
    itemType: 'ingredient' | 'dish',
  ) => boolean;
}

export function useTranslateProcessor({ sendJob }: UseTranslateProcessorOptions) {
  const workerReady = useTranslateQueue((s) => s.workerReady);
  const jobs = useTranslateQueue((s) => s.jobs);
  const markRunning = useTranslateQueue((s) => s.markRunning);
  const pruneCompleted = useTranslateQueue((s) => s.pruneCompleted);
  const sendJobRef = useRef(sendJob);
  useEffect(() => { sendJobRef.current = sendJob; }, [sendJob]);

  useEffect(() => {
    if (!workerReady) return;

    const pendingJobs = jobs.filter((j) => j.status === 'pending');
    if (pendingJobs.length === 0) return;

    scheduleIdle(() => {
      for (const job of pendingJobs) {
        const sent = sendJobRef.current(
          job.jobId,
          job.sourceText,
          job.direction,
          job.itemId,
          job.itemType,
        );
        if (sent) {
          markRunning(job.jobId);
        }
      }
      pruneCompleted();
    });
  }, [workerReady, jobs, markRunning, pruneCompleted]);
}
