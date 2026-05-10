import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  input,
  model,
  output,
} from '@angular/core';

const HOLD_DELAY_MS = 500;
const HOLD_INTERVAL_MS = 50;

@Component({
  selector: 'app-servings-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servings-stepper.html',
  styleUrl: './servings-stepper.scss',
})
export class ServingsStepper implements OnDestroy {
  readonly value = model.required<number>();
  readonly min = input<number>(0.1);
  readonly max = input<number>(20);
  readonly step = input<number>(0.1);
  readonly disabled = input<boolean>(false);
  readonly committed = output<number>();

  readonly canDecrement = computed<boolean>(() => !this.disabled() && this.value() > this.min());
  readonly canIncrement = computed<boolean>(() => !this.disabled() && this.value() < this.max());

  private holdTimeout: ReturnType<typeof setTimeout> | null = null;
  private holdInterval: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.cancelHold();
  }

  /** Pure clamp + step rounding to avoid floating-point drift (0.1 + 0.2 = 0.30000…). */
  private clamp(raw: number): number {
    if (!Number.isFinite(raw)) return this.min();
    const stepped = Math.round(raw / this.step()) * this.step();
    const rounded = Math.round(stepped * 1000) / 1000;
    return Math.min(Math.max(rounded, this.min()), this.max());
  }

  decrementOnce(): void {
    if (this.disabled()) return;
    this.value.set(this.clamp(this.value() - this.step()));
  }

  incrementOnce(): void {
    if (this.disabled()) return;
    this.value.set(this.clamp(this.value() + this.step()));
  }

  /** Start tap-and-hold accelerator on pointerdown. Caller passes direction. */
  startHold(direction: 'inc' | 'dec'): void {
    if (this.disabled()) return;
    // Fire one tick immediately for snappy feel.
    if (direction === 'inc') {
      this.incrementOnce();
    } else {
      this.decrementOnce();
    }
    this.cancelHold();
    this.holdTimeout = setTimeout(() => {
      this.holdInterval = setInterval(() => {
        if (direction === 'inc') {
          this.incrementOnce();
        } else {
          this.decrementOnce();
        }
      }, HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }

  cancelHold(): void {
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
    if (this.holdInterval !== null) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
  }

  /** Direct numeric input → on blur clamp + emit `committed`. */
  onDirectInput(rawString: string): void {
    const parsed = Number.parseFloat(rawString);
    const clamped = this.clamp(parsed);
    this.value.set(clamped);
    this.committed.emit(clamped);
  }
}
