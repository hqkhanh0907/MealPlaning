import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';
import { inventoryChoices, expandEquipment } from '../../../../core/models/exercise-discovery';
import type { ComposedWorkoutPreview } from '../../../../core/models/workout-coaching';
import { FitnessStore } from '../../../../core/stores/fitness.store';
import { isTimedExercise, type TrainingPlanSummary } from '../../../../core/models/fitness.types';
import {
  recommendWorkout,
  workoutDayName,
  workoutExerciseName,
  workoutWeekdays,
  upperMinutes,
  workoutExerciseUsable,
  type WorkoutPlanOption,
  type WorkoutPreferences,
} from '../../../../core/models/workout-plan-recommendation';
import {
  ExercisePlaceRepository,
  type ExercisePlace,
} from '../../../../core/repositories/exercise-place.repository';
import { TrainingPlanRepository } from '../../../../core/repositories/training-plan.repository';
import { UserProfileRepository } from '../../../../core/repositories/user-profile.repository';
import { ageOnDate } from '../../../../core/services/profile/profile-birth-date';
import { PlanPreview } from '../plan-preview/plan-preview';

const quickKeys = ['dumbbell', 'hex-dumbbell', 'bench', 'barbell', 'squat-rack', 'pull-up-bar'];
const knownGear = new Set(inventoryChoices.map(([key]) => key));
const avoidChoices = [
  ['squat', 'Ngồi xổm'],
  ['hinge', 'Gập hông'],
  ['lunge', 'Chùng chân'],
  ['push-h', 'Đẩy ngang'],
  ['push-v', 'Đẩy qua đầu'],
  ['pull-h', 'Kéo ngang'],
  ['pull-v', 'Kéo dọc'],
  ['renegade-row', 'Kéo tạ ở tư thế chống tay'],
  ['push-up', 'Chống đẩy'],
] as const;

function toggle<T>(values: readonly T[], key: T): T[] {
  return values.includes(key) ? values.filter((value) => value !== key) : [...values, key];
}

@Component({
  selector: 'app-workout-plan-finder',
  imports: [IonButton, NgTemplateOutlet, PlanPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout-plan-finder.html',
  styleUrl: './workout-plan-finder.scss',
})
export class WorkoutPlanFinder implements OnInit {
  readonly initiallyOpen = input(true);
  readonly visit = input(0);
  readonly planApplied = output<number>();
  readonly composedRequested = output<ComposedWorkoutPreview>();
  readonly freeRequested = output<void>();
  readonly aiContextChanged = output<WorkoutPreferences | null>();
  private readonly planRepo = inject(TrainingPlanRepository);
  private readonly fitness = inject(FitnessStore);
  private readonly placeRepo = inject(ExercisePlaceRepository);
  private readonly profileRepo = inject(UserProfileRepository);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly composedPreview = signal<ComposedWorkoutPreview | null>(null);
  protected readonly effectiveSession = computed(() => {
    const preview = this.composedPreview();
    if (!preview || !preview.equipment || preview.draft.length !== preview.movements.length)
      return [];
    const gear = expandEquipment(preview.equipment);
    const avoid = this.avoid();
    if (!Array.isArray(avoid)) return [];
    const excluded = new Set<string>(avoid);
    const draft = preview.draft.map((item, index) => ({
      ...item,
      exerciseId: preview.movements[index].exerciseId,
    }));
    if (
      draft.some((item) => !workoutExerciseUsable(item.exerciseId, gear, excluded)) ||
      upperMinutes(draft) > Number(this.minutes())
    )
      return [];
    return draft;
  });
  protected readonly sessionMinutes = computed(() => upperMinutes(this.effectiveSession()));
  protected readonly error = signal('');
  protected readonly open = signal(true);
  protected readonly reviewing = signal(false);
  protected readonly confirmedOptions = signal<readonly string[]>([]);
  protected readonly moreGearOpen = signal(false);
  protected readonly weekdays = signal<number[]>([]);
  protected readonly minutes = signal('');
  protected readonly places = signal<readonly ExercisePlace[]>([]);
  protected readonly placeId = signal('');
  protected readonly equipment = signal<readonly string[] | null>(null);
  protected readonly avoid = signal<readonly string[] | 'unclear' | null>(null);
  protected readonly editingAvoid = signal(false);
  protected readonly familiar = signal(false);
  protected readonly frequency = signal<number | null>(null);
  protected readonly answeredFrequency = signal(false);
  protected readonly age = signal<number | null>(null);
  protected readonly plans = signal<TrainingPlanSummary[]>([]);
  protected readonly saved = computed(() => this.plans().filter((p) => p.source !== 'preset'));
  protected readonly active = computed(() => this.plans().find((p) => p.is_active === 1));
  protected readonly adult = computed(() => (this.age() ?? 0) >= 18);
  protected readonly place = computed(() =>
    this.places().find((item) => item.id === this.placeId()),
  );
  private readonly preferences = computed<WorkoutPreferences>(() => ({
    age: this.age(),
    weekdays: this.weekdays(),
    minutes: Number(this.minutes()),
    equipment: this.equipment()?.filter((key) => knownGear.has(key)) ?? null,
    avoid: this.avoid(),
    frequency: this.frequency(),
    familiarVolume: this.familiar(),
  }));
  protected readonly result = computed(() => recommendWorkout(this.preferences()));
  constructor() {
    effect(() => {
      const ready = this.reviewing() && this.adult() && this.result().status === 'ready';
      this.aiContextChanged.emit(ready ? this.preferences() : null);
    });
  }
  protected readonly frequencies = computed(() =>
    [...new Set(this.result().plans.map((p) => p.frequency))].sort((a, b) => a - b),
  );
  protected readonly dayOptions = workoutWeekdays;
  protected readonly moves = avoidChoices;
  protected readonly quickGear = quickKeys.flatMap((key) =>
    inventoryChoices.filter((item) => item[0] === key),
  );
  protected readonly otherGear = inventoryChoices.filter(([key]) => !quickKeys.includes(key));
  protected readonly exerciseName = workoutExerciseName;
  protected readonly dayName = workoutDayName;
  protected readonly timed = isTimedExercise;

  ngOnInit(): void {
    this.open.set(this.initiallyOpen());
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [profile, places, placeId, plans, schedule] = await Promise.all([
        this.profileRepo.getProfile(),
        this.placeRepo.list(),
        this.placeRepo.getDefaultId(),
        this.planRepo.listPlans(),
        this.planRepo.getFinderSchedule(),
      ]);
      this.age.set(ageOnDate(profile?.birth_date ?? null));
      this.places.set(places);
      this.plans.set(plans);
      if (placeId) this.selectPlace(placeId);
      if (schedule) {
        this.weekdays.set(schedule.weekdays);
        this.minutes.set(String(schedule.minutes));
      }
    } catch {
      this.error.set('Chưa tải được thông tin tập luyện. Hãy thử lại.');
    } finally {
      this.loading.set(false);
    }
  }

  protected selectPlace(id: string): void {
    this.placeId.set(id);
    this.equipment.set(this.place()?.equipment ?? null);
  }

  protected toggleDay(day: number): void {
    this.weekdays.update((days) => toggle(days, day));
  }
  protected toggleGear(key: string): void {
    this.equipment.update((keys) => toggle(keys ?? [], key));
  }
  protected toggleAvoid(key: string): void {
    this.avoid.update((keys) => {
      const next = toggle(Array.isArray(keys) ? keys : [], key);
      return next.length ? next : null;
    });
  }
  protected setAvoid(mode: 'none' | 'select' | 'unclear'): void {
    this.editingAvoid.set(mode === 'select');
    this.avoid.set(mode === 'none' ? [] : mode === 'unclear' ? 'unclear' : null);
  }
  protected avoids(key: string): boolean {
    const keys = this.avoid();
    return Array.isArray(keys) && keys.includes(key);
  }

  protected async preview(): Promise<void> {
    if (this.busy()) return;
    this.error.set('');
    const place = this.place();
    const state = this.result();
    if (state.status !== 'ready' || !place) {
      if (state.status === 'manual') this.reviewing.set(true);
      else this.error.set(!place ? 'Chọn nơi bạn sẽ tập.' : state.explanation);
      return;
    }
    this.busy.set(true);
    try {
      this.places.set(await this.placeRepo.save({ ...place, equipment: this.equipment() }));
      await this.placeRepo.setDefaultId(place.id);
      await this.planRepo.saveFinderSchedule(this.weekdays(), Number(this.minutes()));
      this.frequency.set(null);
      this.answeredFrequency.set(false);
      this.confirmedOptions.set([]);
      await this.prepareComposed();
      this.reviewing.set(true);
    } catch {
      this.error.set('Chưa mở được bản xem trước. Hãy thử lại.');
    } finally {
      this.busy.set(false);
    }
  }

  private async prepareComposed(): Promise<void> {
    const result = this.result();
    if (!result.plans.length && result.session.length) {
      this.composedPreview.set(await this.fitness.previewComposed(result.session, this.placeId()));
    } else this.composedPreview.set(null);
  }

  async refreshPreview(): Promise<void> {
    if (!this.reviewing() || this.busy() || this.result().status !== 'ready') return;
    const visit = this.visit();
    this.busy.set(true);
    try {
      const [profile, places, placeId, plans, schedule] = await Promise.all([
        this.profileRepo.getProfile(),
        this.placeRepo.list(),
        this.placeRepo.getDefaultId(),
        this.planRepo.listPlans(),
        this.planRepo.getFinderSchedule(),
      ]);
      if (visit !== this.visit() || !this.reviewing()) return;
      const place = places.find((item) => item.id === placeId);
      const age = ageOnDate(profile?.birth_date ?? null);
      const changed =
        age !== this.age() ||
        placeId !== this.placeId() ||
        JSON.stringify(place?.equipment) !== JSON.stringify(this.equipment()) ||
        (plans.find((p) => p.is_active)?.id ?? null) !== (this.active()?.id ?? null) ||
        schedule?.minutes !== Number(this.minutes()) ||
        JSON.stringify(schedule?.weekdays) !== JSON.stringify(this.weekdays());
      this.places.set(places);
      this.plans.set(plans);
      if (changed) {
        this.age.set(age);
        this.selectPlace(placeId ?? '');
        this.minutes.set(schedule ? String(schedule.minutes) : '');
        this.weekdays.set(schedule?.weekdays ?? []);
        this.reviewing.set(false);
        this.error.set('Điều kiện tập đã thay đổi. Hãy kiểm tra rồi xem lại đề xuất.');
      } else {
        await this.prepareComposed();
      }
    } catch {
      this.reviewing.set(false);
      this.error.set('Chưa kiểm tra được điều kiện tập hiện tại. Hãy thử lại.');
    } finally {
      this.busy.set(false);
    }
  }

  protected setFrequency(value: number | null): void {
    this.frequency.set(value);
    this.answeredFrequency.set(true);
  }

  protected confirmOption(id: string): void {
    this.confirmedOptions.update((ids) => toggle(ids, id));
  }

  protected async apply(option: WorkoutPlanOption | TrainingPlanSummary): Promise<void> {
    if (this.busy() || ('sourceId' in option && !this.confirmedOptions().includes(option.sourceId)))
      return;
    this.busy.set(true);
    this.error.set('');
    const expected = this.active()?.id ?? null;
    const visit = this.visit();
    try {
      if ('sourceId' in option && option.adjusted) {
        await this.planRepo.savePresetPreview(
          option.sourceId,
          {
            name: option.name + (option.shortened ? ' · Rút gọn' : ' · Đổi lịch'),
            days: option.days,
          },
          expected,
        );
      } else {
        await this.planRepo.activatePlanById(
          'sourceId' in option ? option.sourceId : option.id,
          expected,
        );
      }
      this.planApplied.emit(visit);
    } catch {
      this.reviewing.set(false);
      try {
        this.plans.set(await this.planRepo.listPlans());
      } catch {
        /* giữ bản đã tải */
      }
      this.error.set('Chưa đổi được giáo án. Hãy kiểm tra buổi đang tập và xem lại lựa chọn.');
    } finally {
      this.busy.set(false);
    }
  }
}
