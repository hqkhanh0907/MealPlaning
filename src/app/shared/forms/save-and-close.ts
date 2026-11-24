import { signal } from '@angular/core';

export class SaveAndClose {
  readonly locked = signal(false);
  readonly error = signal('');

  constructor(
    private readonly close: () => void,
    private readonly failureMessage: string,
  ) {}

  async submit(write: () => Promise<void> | void): Promise<void> {
    if (this.locked()) return;
    this.locked.set(true);
    this.error.set('');
    try {
      await write();
    } catch {
      this.error.set(this.failureMessage);
      this.locked.set(false);
      return;
    }
    // Keep the button locked while the page is leaving after a successful write.
    this.close();
  }
}
