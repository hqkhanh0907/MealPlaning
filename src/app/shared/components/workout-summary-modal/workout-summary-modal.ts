import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  checkmarkCircleOutline,
  closeOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';
import type { WorkoutSessionDetail } from '../../../core/models/fitness.types';

/**
 * Finish-summary modal — Apple-style acknowledgment after `completeWorkout()`.
 *
 * Replaces the previous silent dismiss (session disappears, only an inline
 * toast remains). Renders one centered hero card with the three numbers a
 * lifter actually cares about: total sets, total volume kg, duration min.
 * Per-exercise rows recap what was logged. Bottom CTA "Xong" dismisses.
 *
 * Drives off `WorkoutSessionDetail` snapshot captured by the store right
 * after `completeSession()` commits, so duration_minutes and
 * completed_at are already populated.
 */
@Component({
  selector: 'app-workout-summary-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon],
  templateUrl: './workout-summary-modal.html',
  styleUrl: './workout-summary-modal.scss',
})
export class WorkoutSummaryModal {
  @Input() set session(value: WorkoutSessionDetail | null) {
    this._session.set(value);
  }
  get session(): WorkoutSessionDetail | null {
    return this._session();
  }
  private readonly _session = signal<WorkoutSessionDetail | null>(null);

  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  private readonly _isOpen = signal(false);

  @Output() readonly closed = new EventEmitter<void>();

  protected readonly totalVolume = computed(() => {
    const s = this._session();
    if (!s) return 0;
    return Math.round(s.total_volume);
  });

  protected readonly durationLabel = computed(() => {
    const s = this._session();
    if (!s) return '—';
    const mins = s.duration_minutes;
    if (mins === null || !Number.isFinite(mins) || mins < 0) return '—';
    if (mins < 1) return '<1 phút';
    return `${Math.round(mins)} phút`;
  });

  protected readonly exerciseRows = computed(() => {
    const s = this._session();
    if (!s) return [];
    return s.exercises.flatMap((ex) => {
      const logged = ex.sets.filter((set) => set.status === 'logged');
      return logged.length === 0
        ? []
        : [
            {
              id: ex.id,
              name: ex.exercise_name_vi || ex.exercise_name,
              sets: logged.length,
              volume: Math.round(ex.total_volume),
              topSet: bestSet(logged),
            },
          ];
    });
  });

  protected readonly totalSets = computed(() =>
    this.exerciseRows().reduce((sum, row) => sum + row.sets, 0),
  );

  constructor() {
    addIcons({
      barbellOutline,
      checkmarkCircleOutline,
      closeOutline,
      timeOutline,
      trophyOutline,
    });
  }

  protected close(): void {
    this._isOpen.set(false);
    this.closed.emit();
  }

  protected onIonDismiss(): void {
    if (this._isOpen()) {
      this.close();
    }
  }
}

function bestSet(sets: { weight_kg: number; reps: number }[]): string {
  if (sets.length === 0) return '';
  // Top set = max weight, tiebreak by reps.
  let top = sets[0];
  for (const s of sets) {
    if (s.weight_kg > top.weight_kg || (s.weight_kg === top.weight_kg && s.reps > top.reps)) {
      top = s;
    }
  }
  return `${top.weight_kg} kg × ${top.reps}`;
}
