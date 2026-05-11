import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, timerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-rest-timer',
  standalone: true,
  imports: [IonButton, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rest-timer.html',
  styleUrl: './rest-timer.scss',
})
export class RestTimer {
  private readonly destroyRef = inject(DestroyRef);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly seconds = input(0);
  readonly remaining = signal(0);
  readonly isRunning = signal(false);

  readonly label = computed(() => {
    const value = this.remaining();
    const minutes = Math.floor(value / 60);
    const seconds = String(value % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  constructor() {
    addIcons({ refreshOutline, timerOutline });
    effect(() => {
      const next = this.seconds();
      this.reset(next);
      if (next > 0) {
        this.start();
      }
    });
    this.destroyRef.onDestroy(() => this.clearInterval());
  }

  start(): void {
    if (this.remaining() <= 0 || this.isRunning()) return;
    this.isRunning.set(true);
    this.clearInterval();
    this.intervalId = setInterval(() => {
      this.remaining.update((value) => {
        const next = Math.max(0, value - 1);
        if (next === 0) {
          this.isRunning.set(false);
          this.clearInterval();
        }
        return next;
      });
    }, 1000);
  }

  reset(seconds = this.seconds()): void {
    this.clearInterval();
    this.isRunning.set(false);
    this.remaining.set(Math.max(0, Math.round(seconds)));
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
