import { signal } from '@angular/core';

export class DiscardChanges {
  readonly open = signal(false);
  private pending: Promise<boolean> | null = null;
  private resolve: ((discard: boolean) => void) | null = null;

  request(): Promise<boolean> {
    if (!this.pending) {
      this.pending = new Promise<boolean>((resolve) => {
        this.resolve = resolve;
      });
      this.open.set(true);
    }
    return this.pending;
  }

  answer(discard: boolean): void {
    this.open.set(false);
    this.resolve?.(discard);
    this.resolve = null;
    this.pending = null;
  }
}
