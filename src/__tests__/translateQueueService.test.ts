/**
 * translateQueueService.test.ts
 * Unit tests for the Zustand background translation queue.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslateQueue } from '../services/translateQueueService';

function resetStore() {
  useTranslateQueue.setState({
    jobs: [],
    workerReady: false,
    _worker: null,
  });
}

describe('useTranslateQueue', () => {
  beforeEach(resetStore);

  it('enqueues a new job', () => {
    const { enqueue, jobs } = useTranslateQueue.getState();
    expect(jobs).toHaveLength(0);

    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'Thịt bò', direction: 'vi-en' });

    const updated = useTranslateQueue.getState().jobs;
    expect(updated).toHaveLength(1);
    expect(updated[0].itemId).toBe('ing-1');
    expect(updated[0].direction).toBe('vi-en');
    expect(updated[0].status).toBe('pending');
  });

  it('does not enqueue duplicate pending job for same item+direction', () => {
    const { enqueue } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'Thịt bò', direction: 'vi-en' });
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'Thịt bò', direction: 'vi-en' });

    expect(useTranslateQueue.getState().jobs).toHaveLength(1);
  });

  it('allows different directions for the same item', () => {
    const { enqueue } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'Thịt bò', direction: 'vi-en' });
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'Beef', direction: 'en-vi' });

    expect(useTranslateQueue.getState().jobs).toHaveLength(2);
  });

  it('markRunning transitions job to running', () => {
    const { enqueue, markRunning } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'X', direction: 'vi-en' });

    const jobId = useTranslateQueue.getState().jobs[0].jobId;
    markRunning(jobId);

    expect(useTranslateQueue.getState().jobs[0].status).toBe('running');
  });

  it('markDone transitions job to done with result', () => {
    const { enqueue, markRunning, markDone } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'X', direction: 'vi-en' });
    const jobId = useTranslateQueue.getState().jobs[0].jobId;
    markRunning(jobId);
    markDone(jobId, 'Beef');

    const job = useTranslateQueue.getState().jobs[0];
    expect(job.status).toBe('done');
    expect(job.result).toBe('Beef');
  });

  it('markError transitions job to error with message', () => {
    const { enqueue, markError } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'X', direction: 'vi-en' });
    const jobId = useTranslateQueue.getState().jobs[0].jobId;
    markError(jobId, 'Model not found');

    const job = useTranslateQueue.getState().jobs[0];
    expect(job.status).toBe('error');
    expect(job.error).toBe('Model not found');
  });

  it('pruneCompleted removes old done/error jobs', () => {
    const { enqueue, markDone, pruneCompleted } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'X', direction: 'vi-en' });
    const jobId = useTranslateQueue.getState().jobs[0].jobId;
    markDone(jobId, 'result');

    // Override createdAt to be old
    useTranslateQueue.setState((s) => ({
      jobs: s.jobs.map((j) => ({ ...j, createdAt: Date.now() - 40 * 60 * 1000 })),
    }));

    pruneCompleted(30 * 60 * 1000);
    expect(useTranslateQueue.getState().jobs).toHaveLength(0);
  });

  it('pruneCompleted keeps pending jobs regardless of age', () => {
    const { enqueue, pruneCompleted } = useTranslateQueue.getState();
    enqueue({ itemId: 'ing-1', itemType: 'ingredient', sourceText: 'X', direction: 'vi-en' });

    useTranslateQueue.setState((s) => ({
      jobs: s.jobs.map((j) => ({ ...j, createdAt: Date.now() - 40 * 60 * 1000 })),
    }));

    pruneCompleted(30 * 60 * 1000);
    expect(useTranslateQueue.getState().jobs).toHaveLength(1);
  });

  it('setWorker stores the worker reference', () => {
    const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
    const { setWorker } = useTranslateQueue.getState();
    setWorker(mockWorker);
    expect(useTranslateQueue.getState()._worker).toBe(mockWorker);
  });

  it('setWorker can clear the worker by passing null', () => {
    const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
    const { setWorker } = useTranslateQueue.getState();
    setWorker(mockWorker);
    expect(useTranslateQueue.getState()._worker).toBe(mockWorker);
    setWorker(null);
    expect(useTranslateQueue.getState()._worker).toBeNull();
  });

  it('setWorkerReady updates the workerReady flag', () => {
    const { setWorkerReady } = useTranslateQueue.getState();
    expect(useTranslateQueue.getState().workerReady).toBe(false);
    setWorkerReady(true);
    expect(useTranslateQueue.getState().workerReady).toBe(true);
    setWorkerReady(false);
    expect(useTranslateQueue.getState().workerReady).toBe(false);
  });

  describe('scanMissing', () => {
    const dishes = [
      { id: 'dish-1', name: { vi: 'Phở bò', en: '' } },
      { id: 'dish-2', name: { vi: '', en: 'Grilled chicken' } },
      { id: 'dish-3', name: { vi: 'Cơm rang', en: 'Fried rice' } }, // complete — skip
    ];
    const ingredients = [
      { id: 'ing-1', name: { vi: 'Thịt bò', en: '' } },
      { id: 'ing-2', name: { vi: '', en: 'Chicken' } },
      { id: 'ing-3', name: { vi: 'Rau cải', en: 'Cabbage' } }, // complete — skip
    ];

    it('enqueues vi→en jobs for items missing EN when switching to VI', () => {
      const { scanMissing } = useTranslateQueue.getState();
      scanMissing(dishes, ingredients, 'vi');

      const jobs = useTranslateQueue.getState().jobs;
      // dish-1 has VI, missing EN → vi-en
      expect(jobs.some((j) => j.itemId === 'dish-1' && j.direction === 'vi-en')).toBe(true);
      // dish-2 has EN, missing VI → en-vi
      expect(jobs.some((j) => j.itemId === 'dish-2' && j.direction === 'en-vi')).toBe(true);
      // dish-3 is complete → no job
      expect(jobs.some((j) => j.itemId === 'dish-3')).toBe(false);
      // ing-1 has VI, missing EN → vi-en
      expect(jobs.some((j) => j.itemId === 'ing-1' && j.direction === 'vi-en')).toBe(true);
      // ing-2 has EN, missing VI → en-vi
      expect(jobs.some((j) => j.itemId === 'ing-2' && j.direction === 'en-vi')).toBe(true);
      // ing-3 is complete → no job
      expect(jobs.some((j) => j.itemId === 'ing-3')).toBe(false);
    });

    it('enqueues en→vi jobs for items missing VI when switching to EN', () => {
      const { scanMissing } = useTranslateQueue.getState();
      scanMissing(dishes, ingredients, 'en');

      const jobs = useTranslateQueue.getState().jobs;
      // dish-1 has VI, missing EN → vi-en
      expect(jobs.some((j) => j.itemId === 'dish-1' && j.direction === 'vi-en')).toBe(true);
      // dish-2 has EN, missing VI → en-vi
      expect(jobs.some((j) => j.itemId === 'dish-2' && j.direction === 'en-vi')).toBe(true);
    });

    it('enqueues vi-en job when both names are identical (never translated)', () => {
      const { scanMissing } = useTranslateQueue.getState();
      const untranslated = [{ id: 'dish-u', name: { vi: 'Ramen', en: 'Ramen' } }];
      scanMissing(untranslated, [], 'vi');

      const jobs = useTranslateQueue.getState().jobs;
      expect(jobs.some((j) => j.itemId === 'dish-u' && j.direction === 'vi-en' && j.sourceText === 'Ramen')).toBe(true);
    });
  });
});
