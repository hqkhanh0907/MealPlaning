import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import type {
  ActiveTrainingPlan,
  TrainingPlanDayDraft,
} from '../../../../core/models/fitness.types';
import { defaultTrainingRange } from '../../../../core/models/fitness-prescription';
import { FitnessStore } from '../../../../core/stores/fitness.store';
import { isTimedExercise } from '../../../../core/models/fitness.types';

const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0];

@Component({
  selector: 'app-plan-editor',
  templateUrl: './plan-editor.html',
  styleUrl: './plan-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
})
export class PlanEditor implements OnInit {
  protected readonly timed = isTimedExercise;
  private readonly fitness = inject(FitnessStore);
  readonly plan = input.required<ActiveTrainingPlan>();
  readonly closed = output<void>();

  protected readonly name = signal('');
  protected readonly days = signal<TrainingPlanDayDraft[]>([]);
  protected readonly selectedWeekday = signal(1);
  protected readonly selectedDay = computed(() =>
    this.days().find((day) => day.dayOfWeek === this.selectedWeekday()),
  );
  protected readonly availableExercises = computed(() => {
    const selectedIds = new Set(
      this.selectedDay()?.exercises.map((exercise) => exercise.exerciseId),
    );
    return this.fitness
      .exercises()
      .filter((exercise) => exercise.category !== 'cardio' && !selectedIds.has(exercise.id));
  });
  protected readonly exerciseToReplace = signal<string | null>(null);
  protected readonly open = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const plan = this.plan();
    this.name.set(plan.source === 'custom' ? plan.name : 'Giáo án cá nhân');
    this.days.set(
      WEEK_DAYS.map((dayOfWeek) => {
        const day = plan.days.find((item) => item.day_of_week === dayOfWeek);
        return {
          dayOfWeek,
          name: day?.name ?? 'Ngày nghỉ',
          isRestDay: !day || day.is_rest_day === 1,
          exercises:
            day?.exercises.map((exercise) => ({
              exerciseId: exercise.exercise_id,
              sets: exercise.sets,
              repsMin: exercise.reps_min,
              repsMax: exercise.reps_max,
              restSeconds: exercise.rest_seconds,
              notes: exercise.notes,
            })) ?? [],
        };
      }),
    );
    this.selectedWeekday.set(this.days().find((day) => !day.isRestDay)?.dayOfWeek ?? 1);
  }

  protected dayLabel(dayOfWeek: number): string {
    return dayOfWeek === 0 ? 'CN' : `T${dayOfWeek + 1}`;
  }

  protected exerciseName(id: string): string {
    const exercise = this.fitness.exercises().find((item) => item.id === id);
    return exercise?.name_vi || exercise?.name || 'Bài tập';
  }

  protected useDay(dayOfWeek: number): void {
    this.selectedWeekday.set(dayOfWeek);
    this.exerciseToReplace.set(null);
  }

  protected moveDay(target: string): void {
    const selected = this.selectedDay();
    const targetDay = this.days().find((day) => day.dayOfWeek === Number(target));
    if (!target || !selected || !targetDay || selected.dayOfWeek === targetDay.dayOfWeek) return;

    this.days.update((days) =>
      days.map((day) => {
        if (day.dayOfWeek === targetDay.dayOfWeek) return { ...selected, dayOfWeek: day.dayOfWeek };
        if (day.dayOfWeek === selected.dayOfWeek) return { ...targetDay, dayOfWeek: day.dayOfWeek };
        return day;
      }),
    );
    this.useDay(targetDay.dayOfWeek);
  }

  protected changeExercise(id: string, originalId: string | null): void {
    if (!this.availableExercises().some((exercise) => exercise.id === id)) return;

    this.days.update((days) =>
      days.map((day) => {
        if (day.dayOfWeek !== this.selectedWeekday()) return day;
        const exercises = originalId
          ? day.exercises.map((exercise) =>
              exercise.exerciseId === originalId
                ? {
                    ...exercise,
                    exerciseId: id,
                    ...(isTimedExercise(id) !== isTimedExercise(originalId)
                      ? defaultTrainingRange(id)
                      : {}),
                    notes: null,
                  }
                : exercise,
            )
          : [
              ...day.exercises,
              {
                exerciseId: id,
                sets: 3,
                ...defaultTrainingRange(id),
                restSeconds: 90,
                notes: null,
              },
            ];
        return { ...day, exercises, name: day.isRestDay ? 'Buổi tập' : day.name, isRestDay: false };
      }),
    );
    this.exerciseToReplace.set(null);
  }

  protected removeExercise(id: string): void {
    this.days.update((days) =>
      days.map((day) => {
        if (day.dayOfWeek !== this.selectedWeekday()) return day;
        const exercises = day.exercises.filter((exercise) => exercise.exerciseId !== id);
        return {
          ...day,
          exercises,
          name: exercises.length ? day.name : 'Ngày nghỉ',
          isRestDay: !exercises.length,
        };
      }),
    );
    this.exerciseToReplace.set(null);
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const saved = await this.fitness.savePersonalPlan(this.plan().id, {
      name: this.name(),
      days: this.days(),
    });
    this.saving.set(false);
    if (saved) {
      this.open.set(false);
    } else {
      this.error.set(this.fitness.errorMessage());
    }
  }
}
