import { Injectable, computed, signal } from '@angular/core';

const DEFAULT_DURATION_MS = 8_000;

export interface UndoToastItem {
  id: string;
  message: string;
  /** Async restore action invoked when user taps "Hoàn tác". */
  undo: () => void | Promise<void>;
  /** Total time-to-live in ms; default 8000. */
  durationMs?: number;
}

interface ActiveToast extends UndoToastItem {
  timerId: ReturnType<typeof setTimeout>;
  durationMs: number;
}

/**
 * FIFO queue of undo toasts. Each toast self-expires after `durationMs`.
 * UI consumes `activeToast()` (the head) and renders an Ionic toast with
 * `Hoàn tác` action. If user taps undo, the queued callback runs.
 */
@Injectable({ providedIn: 'root' })
export class UndoToastQueue {
  private readonly _queue = signal<ActiveToast[]>([]);

  readonly queue = computed<readonly UndoToastItem[]>(() =>
    this._queue().map(({ timerId: _t, ...rest }) => rest),
  );

  readonly activeToast = computed<UndoToastItem | null>(() => {
    const head = this._queue()[0];
    if (!head) return null;
    const { timerId: _t, ...rest } = head;
    return rest;
  });

  readonly size = computed<number>(() => this._queue().length);

  enqueue(item: UndoToastItem): void {
    const durationMs = item.durationMs ?? DEFAULT_DURATION_MS;
    const timerId = setTimeout(() => this.expire(item.id), durationMs);
    this._queue.update((list) => [...list, { ...item, durationMs, timerId }]);
  }

  /**
   * Run the undo callback for `id` and remove it from queue.
   * Returns true if found+invoked, false otherwise.
   */
  async undo(id: string): Promise<boolean> {
    const target = this._queue().find((t) => t.id === id);
    if (!target) return false;
    clearTimeout(target.timerId);
    this._queue.update((list) => list.filter((t) => t.id !== id));
    await target.undo();
    return true;
  }

  /** Expire and drop a toast without running undo (timer fired or programmatic). */
  expire(id: string): void {
    const target = this._queue().find((t) => t.id === id);
    if (!target) return;
    clearTimeout(target.timerId);
    this._queue.update((list) => list.filter((t) => t.id !== id));
  }

  /** Clear all pending toasts (e.g., on route leave). Does NOT invoke undo. */
  clear(): void {
    for (const t of this._queue()) clearTimeout(t.timerId);
    this._queue.set([]);
  }
}
