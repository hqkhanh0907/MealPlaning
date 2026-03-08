/**
 * translateQueueService.ts
 * Zustand store that manages background translation jobs.
 *
 * Jobs are persisted to localStorage (minus the in-memory worker ref)
 * so that pending translations survive page refreshes.
 *
 * Usage:
 *   const enqueue = useTranslateQueue(s => s.enqueue);
 *   enqueue({ itemId: 'ing-123', itemType: 'ingredient', sourceText: 'Thịt bò', direction: 'vi-en' });
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TranslateDirection = 'vi-en' | 'en-vi';
export type TranslateItemType = 'ingredient' | 'dish';

export type TranslateJob = {
  /** Unique job id */
  jobId: string;
  /** id of the ingredient / dish to update after translation */
  itemId: string;
  itemType: TranslateItemType;
  /** The text that needs to be translated */
  sourceText: string;
  direction: TranslateDirection;
  /** Status lifecycle */
  status: 'pending' | 'running' | 'done' | 'error';
  /** Translated result — available when status === 'done' */
  result?: string;
  error?: string;
  createdAt: number;
};

type TranslateQueueState = {
  jobs: TranslateJob[];
  /** Whether the worker is ready (loaded models) */
  workerReady: boolean;
  /** Live Worker ref — NOT persisted */
  _worker: Worker | null;

  // Actions
  setWorker: (w: Worker | null) => void;
  setWorkerReady: (ready: boolean) => void;
  enqueue: (params: {
    itemId: string;
    itemType: TranslateItemType;
    sourceText: string;
    direction: TranslateDirection;
  }) => void;
  markRunning: (jobId: string) => void;
  markDone: (jobId: string, result: string) => void;
  markError: (jobId: string, error: string) => void;
  /** Removes completed / errored jobs older than maxAgeMs (default 30 min) */
  pruneCompleted: (maxAgeMs?: number) => void;
  /**
   * Scan ingredients and dishes for missing translations and enqueue as needed.
   * Called when the user switches language so the new primary language is complete.
   */
  scanMissing: (
    dishes: Array<{ id: string; name: { vi: string; en: string } }>,
    ingredients: Array<{ id: string; name: { vi: string; en: string } }>,
    newLang: 'vi' | 'en',
  ) => void;
};

let jobCounter = 0;
function newJobId(): string {
  return `jb-${Date.now()}-${++jobCounter}`;
}

export const useTranslateQueue = create<TranslateQueueState>()(
  persist(
    (set, get) => ({
      jobs: [],
      workerReady: false,
      _worker: null,

      setWorker: (w) => set({ _worker: w }),

      setWorkerReady: (ready) => set({ workerReady: ready }),

      enqueue: ({ itemId, itemType, sourceText, direction }) => {
        const existing = get().jobs.find(
          (j) =>
            j.itemId === itemId &&
            j.direction === direction &&
            (j.status === 'pending' || j.status === 'running'),
        );
        if (existing) return; // already queued

        const job: TranslateJob = {
          jobId: newJobId(),
          itemId,
          itemType,
          sourceText,
          direction,
          status: 'pending',
          createdAt: Date.now(),
        };
        set((s) => ({ jobs: [...s.jobs, job] }));
      },

      markRunning: (jobId) =>
        set((s) => ({
          jobs: s.jobs.map((j) => (j.jobId === jobId ? { ...j, status: 'running' } : j)),
        })),

      markDone: (jobId, result) =>
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.jobId === jobId ? { ...j, status: 'done', result } : j,
          ),
        })),

      markError: (jobId, error) =>
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.jobId === jobId ? { ...j, status: 'error', error } : j,
          ),
        })),

      pruneCompleted: (maxAgeMs = 30 * 60 * 1000) => {
        const cutoff = Date.now() - maxAgeMs;
        set((s) => ({
          jobs: s.jobs.filter(
            (j) =>
              j.status === 'pending' ||
              j.status === 'running' ||
              j.createdAt > cutoff,
          ),
        }));
      },

      scanMissing: (dishes, ingredients, newLang) => {
        const { enqueue } = get();
        const otherLang: 'vi' | 'en' = newLang === 'vi' ? 'en' : 'vi';
        const toOtherDir: TranslateDirection = newLang === 'vi' ? 'vi-en' : 'en-vi';
        const toNewDir: TranslateDirection = newLang === 'vi' ? 'en-vi' : 'vi-en';

        const scanItem = (
          id: string,
          itemType: TranslateItemType,
          name: { vi: string; en: string },
        ) => {
          const primary = name[newLang];
          const other = name[otherLang];

          if (primary && other && primary === other) {
            // Both names are identical — data was never translated.
            // Source language is Vietnamese (app's origin language).
            enqueue({ itemId: id, itemType, sourceText: name.vi, direction: 'vi-en' });
          } else if (primary && !other) {
            enqueue({ itemId: id, itemType, sourceText: primary, direction: toOtherDir });
          } else if (other && !primary) {
            enqueue({ itemId: id, itemType, sourceText: other, direction: toNewDir });
          }
        };

        for (const ing of ingredients) scanItem(ing.id, 'ingredient', ing.name);
        for (const dish of dishes) scanItem(dish.id, 'dish', dish.name);
      },
    }),
    {
      name: 'mp-translate-queue',
      // Do not persist the live Worker reference
      partialize: (s) => ({
        jobs: s.jobs.filter((j) => j.status === 'pending' || j.status === 'running'),
        workerReady: false,
      }),
    },
  ),
);
