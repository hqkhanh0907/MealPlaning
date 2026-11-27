import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catalogEntry, catalogReviewedFacts } from '../../../../core/models/exercise-catalog';
import {
  expandEquipment,
  exerciseEquipmentLabel,
} from '../../../../core/models/exercise-discovery';
import { isTimedExercise } from '../../../../core/models/fitness.types';
import {
  ExercisePlaceRepository,
  type ExercisePlace,
} from '../../../../core/repositories/exercise-place.repository';
import { FitnessStore } from '../../../../core/stores/fitness.store';

@Component({
  selector: 'app-workout-substitution',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout-substitution.html',
  styleUrl: './workout-substitution.scss',
})
export class WorkoutSubstitution {
  protected readonly fitness = inject(FitnessStore);
  private readonly places = inject(ExercisePlaceRepository);
  private readonly openedFor = signal<string | null>(null);
  protected readonly open = computed(
    () => !!this.openedFor() && this.fitness.selectedWorkoutExercise()?.id === this.openedFor(),
  );
  protected readonly place = signal<ExercisePlace | null>(null);
  protected readonly selected = signal('');
  protected readonly atPlace = signal(false);
  protected readonly reason = signal('busy');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly equipmentLabel = exerciseEquipmentLabel;
  protected readonly unavailable = signal('');
  protected readonly originalGear = computed(() => {
    const ex = this.fitness.selectedWorkoutExercise();
    const entry = ex && catalogEntry(ex.exercise_id);
    return entry ? (catalogReviewedFacts(entry).required ?? []) : [];
  });
  protected readonly choices = computed(() => {
    const active = this.fitness.selectedWorkoutExercise();
    const original = active && catalogEntry(active.exercise_id);
    const gear = this.place()?.equipment;
    if (!original) return [];
    const facts = catalogReviewedFacts(original);
    const available = expandEquipment(gear ?? []);
    const busy = this.reason() === 'busy' || this.reason() === 'missing';
    const excluded = new Set(this.fitness.activeSession()?.exercises.map((ex) => ex.exercise_id));
    return this.fitness
      .exercises()
      .flatMap((ex) => {
        const entry = catalogEntry(ex.id);
        if (
          !entry ||
          excluded.has(ex.id) ||
          isTimedExercise(ex.id) !== isTimedExercise(original.id)
        )
          return [];
        const other = catalogReviewedFacts(entry);
        if (
          other.movementPattern !== facts.movementPattern ||
          !other.primary.some((group) => facts.primary.includes(group))
        )
          return [];
        if (!other.required || !other.required.every((key) => available.has(key))) return [];
        if (busy && this.unavailable() && expandEquipment(other.required).has(this.unavailable()))
          return [];
        return [
          {
            id: ex.id,
            practiced: !!this.fitness.lastPerformance(ex.id),
            primaryMatches: other.primary.filter((group) => facts.primary.includes(group)).length,
            sameSides: other.perSide === facts.perSide,
            name: ex.name_vi ?? ex.name,
            equipment: other.required.map(exerciseEquipmentLabel).join(', ') || 'Không cần dụng cụ',
          },
        ];
      })
      .sort(
        (a, b) =>
          Number(b.practiced) - Number(a.practiced) ||
          b.primaryMatches - a.primaryMatches ||
          Number(b.sameSides) - Number(a.sameSides) ||
          a.name.localeCompare(b.name, 'vi'),
      )
      .slice(0, 5);
  });

  protected async show(): Promise<void> {
    const active = this.fitness.selectedWorkoutExercise();
    if (!active) return;
    this.error.set('');
    this.reason.set('busy');
    this.atPlace.set(false);
    this.place.set(null);
    this.selected.set('');
    this.openedFor.set(active.id);
    this.loading.set(true);
    try {
      const id = this.fitness.activeSession()?.place_id;
      this.place.set((await this.places.list()).find((item) => item.id === id) ?? null);
      this.setUnavailable(this.originalGear()[0] ?? '');
    } catch {
      this.error.set('Không đọc được dụng cụ đã lưu.');
    } finally {
      this.loading.set(false);
    }
  }

  protected setUnavailable(key: string): void {
    this.unavailable.set(key);
    this.selected.set(this.choices()[0]?.id ?? '');
  }

  protected changeReason(reason: string): void {
    this.reason.set(reason);
    this.atPlace.set(reason === 'missing' && !!this.place());
    if (reason === 'missing') {
      const gear = expandEquipment(this.place()?.equipment ?? []);
      this.unavailable.set(
        this.originalGear().find((key) => !gear.has(key)) ?? this.originalGear()[0] ?? '',
      );
    }
    this.selected.set(this.choices()[0]?.id ?? '');
  }

  protected close(): void {
    this.openedFor.set(null);
  }
  protected async apply(): Promise<void> {
    const id = this.selected();
    if (this.loading() || !this.choices().some((item) => item.id === id)) return;
    this.loading.set(true);
    try {
      if (await this.fitness.substitute(id, this.atPlace())) this.close();
      else this.error.set(this.fitness.errorMessage() ?? 'Chưa đổi được bài.');
    } finally {
      this.loading.set(false);
    }
  }
}
