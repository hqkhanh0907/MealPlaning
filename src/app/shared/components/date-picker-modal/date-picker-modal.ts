import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { IonDatetime } from '@ionic/angular/standalone';

const CLAMP_DAYS = 365;

function isoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayIso(): string {
  return isoLocal(new Date());
}

function clampToBounds(iso: string, minIso: string, maxIso: string): string {
  if (iso < minIso) return minIso;
  if (iso > maxIso) return maxIso;
  return iso;
}

@Component({
  selector: 'app-date-picker-modal',
  standalone: true,
  imports: [IonDatetime],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker-modal.html',
  styleUrl: './date-picker-modal.scss',
})
export class DatePickerModal {
  readonly locale = inject(LOCALE_ID, { optional: true }) ?? 'vi-VN';

  readonly isOpen = input<boolean>(false);
  readonly initialDate = input<string>(todayIso());
  readonly clampDays = input<number>(CLAMP_DAYS);

  readonly dateSelected = output<string>();
  readonly dismissed = output<void>();

  /** Internal selection buffer; commit on "Chọn". */
  private readonly selectionInternal = signal<string>(todayIso());

  readonly minIso = computed<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - this.clampDays());
    return isoLocal(d);
  });

  readonly maxIso = computed<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + this.clampDays());
    return isoLocal(d);
  });

  readonly selection = computed<string>(() => this.selectionInternal());

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.selectionInternal.set(
          clampToBounds(this.initialDate() || todayIso(), this.minIso(), this.maxIso()),
        );
      }
    });
  }

  /** ion-datetime emits ISO 8601 datetime; we keep date-only portion. */
  onIonChange(event: Event): void {
    const value = (event as CustomEvent<{ value: string | string[] | null }>).detail?.value;
    if (typeof value === 'string' && value.length >= 10) {
      this.selectionInternal.set(value.slice(0, 10));
    }
  }

  jumpToday(): void {
    this.selectionInternal.set(clampToBounds(todayIso(), this.minIso(), this.maxIso()));
  }

  confirm(): void {
    this.dateSelected.emit(this.selection());
  }

  cancel(): void {
    this.dismissed.emit();
  }
}
