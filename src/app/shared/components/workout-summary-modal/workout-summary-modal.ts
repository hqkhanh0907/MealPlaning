import { displayWorkoutSet } from '../../../core/models/exercise-guides';
import { loadFactor, loadLabel, progressionLoad } from '../../../core/models/workout-coaching';
import { isLoggedSet } from '../../../core/models/fitness-workout-set';
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
  listOutline,
} from 'ionicons/icons';
import {
  isTimedExercise,
  workoutNumber,
  type WorkoutSessionDetail,
  type WorkoutExerciseDetail,
  type WorkoutSet,
} from '../../../core/models/fitness.types';

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
    if (this._session()?.id !== value?.id) {
      this.choices.set({});
      this.notes.set({});
      this.hidden.set(new Set());
      this.kept.set(new Set());
    }
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

  @Output() readonly nextLoadChosen = new EventEmitter<{
    exercise: WorkoutExerciseDetail;
    kg: number | null;
  }>();
  protected readonly choices = signal<Record<string, string>>({});
  protected readonly kept = signal<ReadonlySet<string>>(new Set());
  @Output() readonly completionNoteChosen = new EventEmitter<{
    exercise: WorkoutExerciseDetail;
    note: string;
  }>();
  protected readonly notes = signal<Record<string, string>>({});
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());
  protected readonly incompleteRows = computed(
    () =>
      this._session()?.exercises.filter(
        (ex) =>
          !this.hidden().has(ex.id) &&
          !!ex.planned_sets &&
          ex.sets.some(isLoggedSet) &&
          ex.sets.filter(isLoggedSet).length < ex.planned_sets,
      ) ?? [],
  );
  protected readonly loggedCount = (exercise: WorkoutExerciseDetail): number =>
    exercise.sets.filter(isLoggedSet).length;

  protected setNote(id: string, note: string): void {
    this.notes.update((before) => ({ ...before, [id]: note }));
  }
  protected skipNote(id: string): void {
    this.hidden.update((before) => new Set(before).add(id));
  }
  protected record(exercise: WorkoutExerciseDetail, note: string): void {
    if (note.trim()) this.completionNoteChosen.emit({ exercise, note });
  }

  protected readonly loadLabel = loadLabel;
  protected readonly progressionRows = computed(
    () => this._session()?.exercises.filter((ex) => progressionLoad(ex) !== null) ?? [],
  );
  protected nextValue(ex: WorkoutExerciseDetail): string {
    const known = ex.next_weight_kg ?? ex.known_heavier_kg;
    return (
      this.choices()[ex.id] ?? (known == null ? '' : String(known / loadFactor(ex.exercise_id)))
    );
  }

  protected enterLoad(ex: WorkoutExerciseDetail, raw: string): void {
    this.choices.update((values) => ({ ...values, [ex.id]: raw }));
  }

  protected nextKg(ex: WorkoutExerciseDetail): number | null {
    const raw = this.nextValue(ex);
    const kg = Number(raw) * loadFactor(ex.exercise_id);
    const current = progressionLoad(ex);
    return raw.trim() && current != null && Number.isFinite(kg) && kg > current && kg <= 500
      ? kg
      : null;
  }

  protected confirm(ex: WorkoutExerciseDetail): void {
    const kg = this.nextKg(ex);
    if (kg !== null) this.nextLoadChosen.emit({ exercise: ex, kg });
  }

  protected keep(ex: WorkoutExerciseDetail): void {
    this.kept.update((previous) => new Set(previous).add(ex.id));
    this.nextLoadChosen.emit({ exercise: ex, kg: null });
  }

  protected readonly totalVolume = computed(() => {
    return workoutNumber.format(this._session()?.total_volume ?? 0);
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
      const logged = ex.sets.filter(isLoggedSet);
      const seconds = logged.reduce((sum, set) => sum + (set.duration_seconds ?? 0), 0);
      return logged.length === 0
        ? []
        : [
            {
              id: ex.id,
              name: ex.exercise_name_vi || ex.exercise_name,
              sets: logged.length,
              measure: isTimedExercise(ex.exercise_id)
                ? seconds > 0
                  ? seconds + ' giây'
                  : 'Chưa rõ thời gian'
                : workoutNumber.format(ex.total_volume) + ' kg',
              topSet: bestSet(ex.exercise_id, logged),
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
      listOutline,
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

function bestSet(exerciseId: string, sets: WorkoutSet[]): string {
  let top: WorkoutSet | undefined;
  for (const s of sets) {
    if (s.legacy_unit_unknown || s.duration_seconds != null) continue;
    if (!top) {
      top = s;
      continue;
    }
    if (s.weight_kg > top.weight_kg || (s.weight_kg === top.weight_kg && s.reps > top.reps)) {
      top = s;
    }
  }
  return top ? displayWorkoutSet(exerciseId, top) : '';
}
