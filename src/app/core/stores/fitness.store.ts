import { computed, inject, Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { workoutDraftIssue, type WorkoutPreferences } from '../models/workout-plan-recommendation';
import {
  loadFactor,
  loadLabel,
  type LastWorkoutSet,
  type ComposedWorkoutPreview,
  type WorkoutVenuePreview,
} from '../models/workout-coaching';
import { ExercisePlaceRepository } from '../repositories/exercise-place.repository';
import { ageOnDate } from '../services/profile/profile-birth-date';
import { AccountSession } from '../account/account-session';
import { isTimedExercise, workoutNumber } from '../models/fitness.types';
import type {
  ActiveTrainingPlan,
  AiTrainingPlanDraft,
  Exercise,
  FitnessProgressSummary,
  PersonalTrainingPlanDraft,
  TrainingPlanDayWithExercises,
  TrainingPlanExerciseDraft,
  TrainingPlanSummary,
  WorkoutEffort,
  WorkoutExerciseDetail,
  WorkoutSessionDetail,
  WorkoutSetDraft,
} from '../models/fitness.types';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { TrainingPlanRepository } from '../repositories/training-plan.repository';
import { isLoggedSet, workoutSetIssue, type WorkoutSetInput } from '../models/fitness-workout-set';
import { localIsoDate } from '../utils/local-date';
import { WorkoutRepository } from '../repositories/workout.repository';
import { FitnessAi } from '../services/ai/fitness-ai';
import { ReminderCoordinator } from '../services/notifications/reminder-coordinator';
import { NetworkStore } from './network.store';
import { ProfileStore } from './profile.store';

const DEFAULT_SET_DRAFT: WorkoutSetDraft = {
  weightKg: '',
  reps: '',
  restSeconds: '90',
  effort: null,
  notes: '',
};

/** F-006 — localStorage key prefix for autosave drafts. Scoped per workout_exercise.id. */
const DRAFT_STORAGE_PREFIX = 'fitness:draft:';

@Injectable({ providedIn: 'root' })
export class FitnessStore {
  private readonly account = inject(AccountSession);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly places = inject(ExercisePlaceRepository);
  private readonly planRepo = inject(TrainingPlanRepository);
  private readonly workoutRepo = inject(WorkoutRepository);
  private readonly fitnessAi = inject(FitnessAi);
  private readonly network = inject(NetworkStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly reminders = inject(ReminderCoordinator);

  readonly plans = signal<TrainingPlanSummary[]>([]);
  readonly activePlan = signal<ActiveTrainingPlan | null>(null);
  readonly todayDay = signal<TrainingPlanDayWithExercises | null>(null);
  readonly exercises = signal<Exercise[]>([]);
  readonly activeSession = signal<WorkoutSessionDetail | null>(null);

  /**
   * Snapshot of the most recently completed session, used by the
   * finish-summary modal in the hub. Cleared when the user dismisses
   * the modal or starts a new workout.
   */
  readonly lastCompletedSession = signal<WorkoutSessionDetail | null>(null);

  /**
   * Id of the session most recently soft-cancelled by the user. Hub renders an
   * undo snackbar while non-null; cleared on undo, on dismiss, or on next
   * session start.
   */
  readonly lastCancelledSessionId = signal<string | null>(null);
  readonly selectedWorkoutExerciseId = signal<string | null>(null);
  readonly setDraft = signal<WorkoutSetDraft>({ ...DEFAULT_SET_DRAFT });
  readonly progress = signal<FitnessProgressSummary | null>(null);
  readonly restSeconds = signal(0);
  readonly loading = signal(false);
  readonly savingSet = signal(false);
  readonly aiPlanLoading = signal(false);
  private aiGeneration = 0;
  private aiPreferences: WorkoutPreferences | null = null;
  private aiPreviewActiveId: string | null = null;
  readonly pendingAiPlan = signal<AiTrainingPlanDraft | null>(null);
  readonly aiPlanRationale = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly lastLoggedSet = signal<{
    id: string;
    setNumber: number;
    weightKg: number;
    reps: number;
    exerciseName: string;
  } | null>(null);

  private startingWorkout = false;
  private seeded: Promise<void> | null = null;
  private initializing: Promise<void> | null = null;
  private readonly lastSets = signal<ReadonlyMap<string, LastWorkoutSet>>(new Map());
  private slotId = uuidv4();
  private refreshSequence = 0;
  readonly loadLabel = loadLabel;

  lastPerformance(exerciseId: string): string {
    const prior = this.lastSets().get(exerciseId);
    if (!prior) return '';
    const weight = workoutNumber.format(prior.weight_kg / loadFactor(exerciseId));
    const kg = loadFactor(exerciseId) === 2 ? ' kg mỗi tay' : ' kg';
    const amount =
      prior.duration_seconds == null ? prior.reps + ' lần' : prior.duration_seconds + ' giây';
    const day = prior.date?.split('-').reverse().join('/');
    return (prior.weight_kg ? weight + kg + ' · ' : '') + amount + (day ? ' · ' + day : '');
  }

  private writeDraft(draft: WorkoutSetDraft): void {
    this.setDraft.set(draft);
    const ex = this.selectedWorkoutExercise();
    if (!ex) return;
    try {
      localStorage.setItem(
        this.draftKey(ex.id),
        JSON.stringify({
          ...draft,
          slot: this.slotId,
          exerciseId: ex.exercise_id,
          unit: isTimedExercise(ex.exercise_id) ? 'seconds' : 'reps',
        }),
      );
    } catch {
      return;
    }
  }

  private loadDraft(ex: WorkoutExerciseDetail): WorkoutSetDraft {
    this.slotId = uuidv4();
    const priorSet = ex.sets
      .slice()
      .reverse()
      .find((set) => isLoggedSet(set) && !set.legacy_unit_unknown);
    const prior = this.lastSets().get(ex.exercise_id);
    const kg = priorSet?.weight_kg ?? prior?.next_weight_kg ?? prior?.weight_kg;
    const defaults = {
      ...DEFAULT_SET_DRAFT,
      restSeconds: String(ex.planned_rest ?? 90),
      weightKg:
        kg != null
          ? String(kg / loadFactor(ex.exercise_id))
          : ex.equipment?.includes('Bodyweight') || ex.category === 'cardio'
            ? '0'
            : '',
    };
    try {
      const raw = localStorage.getItem(this.draftKey(ex.id));
      if (!raw) return defaults;
      const p = JSON.parse(raw) as Partial<WorkoutSetDraft> & {
        unit?: string;
        slot?: string;
        exerciseId?: string;
      };
      if (
        (p.exerciseId && p.exerciseId !== ex.exercise_id) ||
        (isTimedExercise(ex.exercise_id) && p.unit !== 'seconds') ||
        (p.slot && ex.sets.some((set) => set.id === p.slot))
      )
        return defaults;
      if (typeof p.slot === 'string') this.slotId = p.slot;
      let weight = typeof p.weightKg === 'string' ? p.weightKg : defaults.weightKg;
      if (!p.slot && weight.trim() && loadFactor(ex.exercise_id) === 2)
        weight = String(Number(weight) / 2);
      return {
        weightKg: weight,
        reps: typeof p.reps === 'string' ? p.reps : '',
        restSeconds: p.restSeconds ?? defaults.restSeconds,
        effort: p.effort ?? null,
        notes: typeof p.notes === 'string' ? p.notes : '',
      };
    } catch {
      return defaults;
    }
  }

  private restoreSelection(session: WorkoutSessionDetail | null, prefer?: string): void {
    const current = this.selectedWorkoutExerciseId();
    this.activeSession.set(session);
    if (!session) {
      this.selectedWorkoutExerciseId.set(null);
      return;
    }
    let cursor = prefer ?? current;
    if (!session.exercises.some((ex) => ex.id === cursor)) {
      try {
        cursor = localStorage.getItem(this.draftKey('cursor:' + session.id));
      } catch {
        cursor = null;
      }
    }
    const selected = session.exercises.find((ex) => ex.id === cursor) ?? session.exercises[0];
    if (selected) this.selectWorkoutExercise(selected.id);
    else this.selectedWorkoutExerciseId.set(null);
  }

  private async loadLastSets(place: string | null): Promise<void> {
    const values = await this.workoutRepo.lastSets(place);
    this.lastSets.set(new Map(values.map((row) => [row.exercise_id, row])));
  }

  private draftKey(exerciseId: string): string {
    const accountId = this.account.current()?.id;
    return DRAFT_STORAGE_PREFIX + (accountId ? accountId + ':' : '') + exerciseId;
  }

  skipRest(): void {
    this.restSeconds.set(0);
  }

  readonly isRestDay = computed(() => this.todayDay()?.is_rest_day === 1);
  readonly canCompleteWorkout = computed(
    () =>
      !this.savingSet() &&
      (this.activeSession()?.exercises.some((exercise) => exercise.sets.some(isLoggedSet)) ??
        false),
  );

  readonly selectedWorkoutExercise = computed<WorkoutExerciseDetail | null>(() => {
    const id = this.selectedWorkoutExerciseId();
    if (!id) return this.activeSession()?.exercises[0] ?? null;
    return this.activeSession()?.exercises.find((exercise) => exercise.id === id) ?? null;
  });

  readonly selectedExerciseLastLoggedSet = computed(() =>
    this.selectedWorkoutExercise()
      ?.sets.slice()
      .reverse()
      .find((set) => isLoggedSet(set) && !set.legacy_unit_unknown),
  );

  readonly currentWeekVolumeLabel = computed(() => {
    const value = this.progress()?.currentWeekVolume ?? 0;
    return `${workoutNumber.format(value)} kg`;
  });

  readonly previousWeekVolumeLabel = computed(() => {
    const value = this.progress()?.previousWeekVolume ?? 0;
    return `${workoutNumber.format(value)} kg`;
  });

  readonly volumeChangeLabel = computed(() => {
    const progress = this.progress();
    if (!progress || progress.previousWeekVolume <= 0) return 'Chưa đủ dữ liệu so sánh';
    const delta = progress.currentWeekVolume - progress.previousWeekVolume;
    const pct = Math.round((delta / progress.previousWeekVolume) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}% so với tuần trước`;
  });

  readonly maxMuscleVolume = computed(() =>
    Math.max(1, ...(this.progress()?.volumeByMuscle ?? []).map((point) => point.volume)),
  );

  readonly maxEstimatedOneRm = computed(() =>
    Math.max(1, ...(this.progress()?.strength ?? []).map((point) => point.estimated_1rm)),
  );

  initialize(): Promise<void> {
    if (this.initializing) return this.initializing;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.initializing = this.initializeWorkspace()
      .catch((error) => {
        this.errorMessage.set(toErrorMessage(error));
      })
      .finally(() => {
        this.loading.set(false);
        this.initializing = null;
      });
    return this.initializing;
  }

  private async initializeWorkspace(): Promise<void> {
    this.seeded ??= this.planRepo
      .ensurePresetPlans()
      .then(async () => {
        this.exercises.set(await this.exerciseRepo.list({ limit: 1000 }));
        this.refreshWorkoutReminders();
      })
      .catch((error) => {
        this.seeded = null;
        throw error;
      });
    await this.seeded;
    await this.refresh();
  }

  async refresh(now: Date = new Date()): Promise<void> {
    const version = ++this.refreshSequence;
    const today = localIsoDate(now);
    const [plans, activePlan, todayDay, activeSession, progress] = await Promise.all([
      this.planRepo.listPlans(),
      this.planRepo.getActivePlan(),
      this.planRepo.getTodayTrainingDay(today),
      this.workoutRepo.getActiveSession(),
      this.workoutRepo.progressSummary(now),
    ]);
    const last = await this.workoutRepo.lastSets(
      activeSession?.place_id ?? (await this.places.getDefaultId()),
    );
    if (this.refreshSequence !== version) return;
    this.lastSets.set(new Map(last.map((row) => [row.exercise_id, row])));
    this.plans.set(plans);
    this.activePlan.set(activePlan);
    this.todayDay.set(todayDay);
    this.restoreSelection(activeSession);
    this.progress.set(progress);
  }

  async activatePlan(planId: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.planRepo.activatePlanById(planId);
      this.refreshWorkoutReminders();
      await this.refresh();
      this.successMessage.set('Đã đổi giáo án tập luyện.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async savePersonalPlan(sourcePlanId: string, draft: PersonalTrainingPlanDraft): Promise<boolean> {
    this.errorMessage.set(null);
    try {
      await this.planRepo.savePersonalPlan(sourcePlanId, draft);
      this.refreshWorkoutReminders();
      await this.refresh();
      this.successMessage.set('Đã lưu giáo án cá nhân.');
      return true;
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
      return false;
    }
  }

  async generateAiCustomPlan(preferences?: WorkoutPreferences): Promise<void> {
    if (!this.network.online()) {
      this.errorMessage.set('Cần kết nối mạng để tạo giáo án AI.');
      return;
    }
    if (this.aiPlanLoading()) return;
    if ((ageOnDate(this.profileStore.profile()?.birth_date ?? null) ?? 0) < 18) {
      this.errorMessage.set('Gợi ý tự động dành cho người từ 18 tuổi có ngày sinh trong hồ sơ.');
      return;
    }
    const generation = ++this.aiGeneration;
    this.pendingAiPlan.set(null);
    this.aiPlanLoading.set(true);
    this.errorMessage.set(null);
    try {
      const expectedPlan = this.activePlan()?.id ?? null;
      const draft = await this.fitnessAi.generateTrainingPlan({
        ...(preferences ? { preferences } : {}),
        profile: this.profileStore.profile(),
        exercises: this.exercises(),
        progress: this.progress(),
      });
      if (generation !== this.aiGeneration || expectedPlan !== (this.activePlan()?.id ?? null))
        return;
      if (preferences) {
        const issue = workoutDraftIssue(preferences, draft.days);
        if (issue) throw new Error(issue);
      }
      this.aiPreferences = preferences ?? null;
      this.aiPreviewActiveId = expectedPlan;
      this.pendingAiPlan.set(draft);
      this.aiPlanRationale.set(draft.rationale);
    } catch (error) {
      if (generation === this.aiGeneration) this.errorMessage.set(toErrorMessage(error));
    } finally {
      if (generation === this.aiGeneration) this.aiPlanLoading.set(false);
    }
  }

  dismissAiPlan(): void {
    ++this.aiGeneration;
    this.aiPreferences = null;
    this.aiPlanLoading.set(false);
    this.pendingAiPlan.set(null);
    this.aiPlanRationale.set(null);
  }

  async acceptAiPlan(): Promise<void> {
    const draft = this.pendingAiPlan();
    if (!draft || this.aiPlanLoading()) return;
    if (
      (ageOnDate(this.profileStore.profile()?.birth_date ?? null) ?? 0) < 18 ||
      this.activeSession()
    ) {
      this.errorMessage.set('Kiểm tra ngày sinh và kết thúc buổi đang tập trước khi chọn giáo án.');
      return;
    }
    this.aiPlanLoading.set(true);
    this.errorMessage.set(null);
    try {
      const issue = this.aiPreferences && workoutDraftIssue(this.aiPreferences, draft.days);
      if (issue) throw new Error(issue);
      await this.planRepo.createAiPlan(draft, this.aiPreviewActiveId);
      this.dismissAiPlan();
      this.refreshWorkoutReminders();
      await this.refresh();
      this.successMessage.set('Đã chọn giáo án.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.aiPlanLoading.set(false);
    }
  }

  private refreshWorkoutReminders(): void {
    if (this.account.required && this.reminders.workoutEnabled()) {
      void this.reminders
        .refresh()
        .catch((error) => console.warn('[Fitness] notification sync failed:', error));
    }
  }

  async startTodayGuided(): Promise<void> {
    await this.startGuidedDay(this.todayDay());
  }

  async startGuidedDay(day: TrainingPlanDayWithExercises | null): Promise<void> {
    if (this.startingWorkout) return;
    if (!day || day.is_rest_day === 1) {
      this.errorMessage.set('Hôm nay là ngày nghỉ hoặc chưa có giáo án đang hoạt động.');
      return;
    }

    await this.start(
      (place) => this.workoutRepo.startGuidedSession(day.id, new Date(), place),
      'Đã bắt đầu buổi tập theo giáo án.',
    );
  }

  async startFree(): Promise<void> {
    await this.start(
      (place) => this.workoutRepo.startFreeSession(new Date(), place),
      'Đã bắt đầu buổi tập tự do.',
    );
  }

  async previewComposed(
    draft: readonly TrainingPlanExerciseDraft[],
    placeId?: string | null,
  ): Promise<ComposedWorkoutPreview> {
    const place = placeId === undefined ? await this.places.getDefaultId() : placeId;
    const captured = draft.map((item) => ({ ...item }));
    return { ...(await this.workoutRepo.previewMovements(captured, place)), draft: captured };
  }

  async previewReplay(
    session: WorkoutSessionDetail,
    placeId?: string | null,
  ): Promise<WorkoutVenuePreview> {
    const place = placeId === undefined ? await this.places.getDefaultId() : placeId;
    return this.workoutRepo.previewMovements(
      session.exercises.map((ex) => ({
        exerciseId: ex.exercise_id,
        originalExerciseId: ex.original_exercise_id,
        sets: ex.planned_sets ?? null,
        repsMin: ex.planned_min ?? null,
        repsMax: ex.planned_max ?? null,
        restSeconds: ex.planned_rest ?? null,
        notes: ex.planned_notes ?? null,
      })),
      place,
    );
  }

  async startComposed(
    input: readonly (TrainingPlanExerciseDraft | string)[] | ComposedWorkoutPreview,
    placeId?: string,
  ): Promise<void> {
    const preview = 'draft' in input ? input : undefined;
    const exercises = 'draft' in input ? input.draft : input;
    await this.start(
      (place) => this.workoutRepo.startComposedSession(exercises, place, new Date(), preview),
      'Đã bắt đầu buổi gợi ý.',
      preview ? preview.placeId : placeId,
    );
  }

  async replay(sessionId: string, preview?: WorkoutVenuePreview): Promise<void> {
    await this.start(
      (place) => this.workoutRepo.replaySession(sessionId, place, new Date(), preview),
      'Đã mở buổi tập lại.',
    );
  }

  private async start(
    open: (place: string | null) => Promise<WorkoutSessionDetail>,
    message: string,
    placeId?: string | null,
  ): Promise<void> {
    if (this.startingWorkout) return;
    this.startingWorkout = true;
    this.errorMessage.set(null);
    try {
      const session = await open(
        placeId === undefined ? await this.places.getDefaultId() : placeId,
      );
      await this.loadLastSets(session.place_id ?? null);
      ++this.refreshSequence;
      this.restoreSelection(session);
      this.lastCompletedSession.set(null);
      this.successMessage.set(message);
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.startingWorkout = false;
    }
  }

  async recordCompletionNote(exercise: WorkoutExerciseDetail, note: string): Promise<void> {
    try {
      await this.workoutRepo.recordCompletionNote(exercise.id, note);
      if (this.lastCompletedSession()?.id === exercise.workout_session_id) {
        this.lastCompletedSession.set(
          await this.workoutRepo.completionSummary(exercise.workout_session_id),
        );
      }
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async confirmNextLoad(exercise: WorkoutExerciseDetail, kg: number | null): Promise<void> {
    try {
      await this.workoutRepo.confirmNextLoad(exercise.id, kg);
      const updated = await this.workoutRepo.completionSummary(exercise.workout_session_id);
      if (this.lastCompletedSession()?.id === exercise.workout_session_id)
        this.lastCompletedSession.set(updated);
      await this.loadLastSets(updated?.place_id ?? null);
      this.successMessage.set(
        kg === null ? 'Đã giữ mức tạ hiện tại.' : 'Đã lưu mức tạ cho lần tới.',
      );
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async substitute(id: string, atPlace: boolean): Promise<boolean> {
    const selected = this.selectedWorkoutExercise();
    if (!selected || this.savingSet()) return false;
    try {
      const session = await this.workoutRepo.replaceMovement(selected.id, id, atPlace);
      this.restoreSelection(session, session.exercises.find((ex) => ex.exercise_id === id)?.id);
      this.successMessage.set('Đã đổi bài tập.');
      return true;
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
      return false;
    }
  }

  async addExerciseToActive(exerciseId: string): Promise<void> {
    const session = this.activeSession();
    if (!session) {
      await this.startFree();
    }
    const active = this.activeSession();
    if (!active) return;

    this.errorMessage.set(null);
    try {
      const exercise = await this.workoutRepo.addExerciseToSession(active.id, exerciseId);
      const refreshed = await this.workoutRepo.getSession(active.id);
      this.activeSession.set(refreshed);
      this.selectWorkoutExercise(exercise.id);
      this.successMessage.set('Đã thêm bài vào buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  selectWorkoutExercise(id: string): void {
    const session = this.activeSession();
    const selected = session?.exercises.find((ex) => ex.id === id);
    if (!session || !selected) return;
    this.selectedWorkoutExerciseId.set(id);
    this.setDraft.set(this.loadDraft(selected));
    try {
      localStorage.setItem(this.draftKey('cursor:' + session.id), id);
    } catch {
      return;
    }
  }

  updateWeight(weightKg: string): void {
    this.writeDraft({ ...this.setDraft(), weightKg });
  }
  updateReps(reps: string): void {
    this.writeDraft({ ...this.setDraft(), reps });
  }
  updateRestSeconds(restSeconds: string): void {
    this.writeDraft({ ...this.setDraft(), restSeconds });
  }
  updateEffort(effort: WorkoutEffort | null): void {
    this.writeDraft({ ...this.setDraft(), effort });
  }
  updateNotes(notes: string): void {
    this.writeDraft({ ...this.setDraft(), notes });
  }

  private advanceDraft(exerciseId: string): void {
    ++this.refreshSequence;
    try {
      localStorage.removeItem(this.draftKey(exerciseId));
    } catch {
      this.slotId = uuidv4();
    }
    if (this.selectedWorkoutExerciseId() === exerciseId) {
      const selected = this.selectedWorkoutExercise();
      if (selected) this.setDraft.set(this.loadDraft(selected));
    }
  }

  async logSet(): Promise<void> {
    if (this.savingSet()) return;
    const exercise = this.selectedWorkoutExercise();
    if (!exercise) {
      this.errorMessage.set('Chọn một bài tập trước khi ghi hiệp.');
      return;
    }

    const draft = parseDraft(this.setDraft(), exercise.exercise_id);
    if (draft.ok === false) {
      this.errorMessage.set(draft.message);
      return;
    }

    this.savingSet.set(true);
    this.errorMessage.set(null);
    try {
      // F-015 — repo returns set + refreshed session in one shot, eliminating the
      // stale-read race where getSession() ran before WAL flushed the new row.
      this.writeDraft(this.setDraft());
      const { set: createdSet, session: refreshedSession } = await this.workoutRepo.addSet(
        exercise.id,
        draft.value,
        this.slotId,
      );
      this.activeSession.set(refreshedSession);
      this.restSeconds.set(draft.value.restSeconds);
      this.advanceDraft(exercise.id);
      this.lastLoggedSet.set({
        id: createdSet.id,
        setNumber: createdSet.set_number,
        weightKg: createdSet.weight_kg,
        reps: createdSet.reps,
        exerciseName: exercise.exercise_name_vi || exercise.exercise_name,
      });
      this.successMessage.set('Đã ghi hiệp tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.savingSet.set(false);
    }
  }

  /**
   * p3-2 — Skip the current set. Persists a placeholder row with status='skipped'
   * so the session timeline reflects user intent and progressive overload logic
   * can distinguish skipped sets from missing data. Uses the current draft's
   * planned weight/reps as a hint (won't be counted toward volume).
   */
  async skipSet(): Promise<void> {
    if (this.savingSet()) return;
    const exercise = this.selectedWorkoutExercise();
    if (!exercise) {
      this.errorMessage.set('Chọn một bài tập trước khi bỏ qua hiệp.');
      return;
    }

    const draftSnapshot = this.setDraft();
    const plannedWeightKg =
      (Number.parseFloat(draftSnapshot.weightKg) || 0) * loadFactor(exercise.exercise_id);
    const plannedReps = Number.parseInt(draftSnapshot.reps, 10) || 0;

    this.savingSet.set(true);
    this.errorMessage.set(null);
    try {
      this.writeDraft(draftSnapshot);
      const { session: refreshedSession } = await this.workoutRepo.skipSet(
        exercise.id,
        plannedWeightKg,
        isTimedExercise(exercise.exercise_id) ? 0 : plannedReps,
        this.slotId,
      );
      this.activeSession.set(refreshedSession);
      this.advanceDraft(exercise.id);
      this.successMessage.set('Đã bỏ qua hiệp.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.savingSet.set(false);
    }
  }

  async completeWorkout(): Promise<void> {
    const session = this.activeSession();
    if (!session || this.savingSet()) return;
    if (!this.canCompleteWorkout()) {
      this.errorMessage.set('Ghi ít nhất một hiệp trước khi hoàn thành buổi tập.');
      return;
    }

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.completeSession(session.id);
      // Fetch the finalized session (with completed_at + duration) so the
      // summary modal can show duration alongside sets/volume.
      const finalized = await this.workoutRepo.completionSummary(session.id);
      this.lastCompletedSession.set(finalized ?? session);
      this.activeSession.set(null);
      this.selectedWorkoutExerciseId.set(null);
      this.restSeconds.set(0);
      await this.refresh();
      this.successMessage.set('Đã hoàn thành buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  /** Dismiss the finish-summary modal in the hub. */
  dismissCompletedSummary(): void {
    this.lastCompletedSession.set(null);
  }

  async cancelWorkout(): Promise<void> {
    const session = this.activeSession();
    if (!session || this.savingSet()) return;

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.cancelSession(session.id);
      // Remember which session was cancelled so the UI can offer undo.
      this.lastCancelledSessionId.set(session.id);
      this.activeSession.set(null);
      this.selectedWorkoutExerciseId.set(null);
      this.restSeconds.set(0);
      this.lastLoggedSet.set(null);
      await this.refresh();
      this.successMessage.set('Đã hủy buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  /**
   * Restore the most recently soft-cancelled session. Idempotent: clears the
   * undo handle on success or failure so the snackbar doesn't linger.
   */
  async undoCancelWorkout(): Promise<void> {
    const sessionId = this.lastCancelledSessionId();
    if (!sessionId) return;

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.undoCancel(sessionId);
      const restored = await this.workoutRepo.getActiveSession();
      this.activeSession.set(restored);
      await this.refresh();
      this.successMessage.set('Đã khôi phục buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.lastCancelledSessionId.set(null);
    }
  }

  /** Dismiss the undo handle without restoring (timeout or user dismiss). */
  dismissCancelUndo(): void {
    this.lastCancelledSessionId.set(null);
  }

  async deleteSet(setId: string): Promise<void> {
    const sessionId = this.activeSession()?.id;
    if (!sessionId) return;

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.deleteSet(setId);
      this.activeSession.set(await this.workoutRepo.getSession(sessionId));
      // Clear lastLoggedSet if it was this one.
      if (this.lastLoggedSet()?.id === setId) {
        this.lastLoggedSet.set(null);
      }
      this.successMessage.set('Đã xóa hiệp.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async updateSet(setId: string, input: WorkoutSetInput): Promise<void> {
    const sessionId = this.activeSession()?.id;
    if (!sessionId) return;

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.updateSet(setId, input);
      this.activeSession.set(await this.workoutRepo.getSession(sessionId));
      this.successMessage.set('Đã cập nhật hiệp.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  /**
   * Remove an exercise (and its sets) from the active session. UI must confirm. After remove we
   * fall back to the first remaining exercise as the selected tab.
   */
  async removeExerciseFromActive(workoutExerciseId: string): Promise<void> {
    const session = this.activeSession();
    if (!session) return;
    this.errorMessage.set(null);
    try {
      await this.workoutRepo.removeExerciseFromSession(workoutExerciseId);
      const refreshed = await this.workoutRepo.getSession(session.id);
      this.activeSession.set(refreshed);
      if (this.selectedWorkoutExerciseId() === workoutExerciseId) {
        this.restoreSelection(refreshed);
      }
      this.successMessage.set('Đã xóa bài khỏi buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async repeatLastSet(): Promise<void> {
    if (this.savingSet()) return;
    const lastSet = this.selectedExerciseLastLoggedSet();
    if (!lastSet) {
      this.errorMessage.set('Chưa có hiệp nào để lặp lại.');
      return;
    }
    this.setDraft.set({
      weightKg: String(lastSet.weight_kg / loadFactor(this.selectedWorkoutExercise()!.exercise_id)),
      reps: String(lastSet.duration_seconds ?? lastSet.reps),
      restSeconds: String(lastSet.rest_seconds ?? 90),
      effort: lastSet.effort,
      notes: '',
    });
    await this.logSet();
  }

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}

function parseDraft(
  draft: WorkoutSetDraft,
  exerciseId: string,
): { ok: true; value: WorkoutSetInput } | { ok: false; message: string } {
  const amount = Number(draft.reps);
  const timed = isTimedExercise(exerciseId);
  const value: WorkoutSetInput = {
    weightKg: Number(draft.weightKg) * loadFactor(exerciseId),
    reps: timed ? 0 : amount,
    ...(timed ? { durationSeconds: amount } : {}),
    restSeconds: Number(draft.restSeconds),
    effort: draft.effort,
    notes: draft.notes.trim() || null,
  };
  const issue = workoutSetIssue(exerciseId, value);
  if (draft.weightKg.trim() === '' && (issue === null || issue === 'rest')) {
    return { ok: false, message: 'Nhập mức tạ thực tế. Nhập 0 nếu tập không thêm tạ.' };
  }
  if (issue) {
    const messages = {
      weight: 'Mức tạ phải từ 0 đến 500 kg.',
      duration: 'Nhập thời gian tập từ 1 đến 86.400 giây.',
      reps: 'Số lần phải là số nguyên từ 1 đến 100.',
      rest: 'Thời gian nghỉ phải từ 0 đến 600 giây.',
    };
    return { ok: false, message: messages[issue] };
  }
  return { ok: true, value };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'FitnessStore: thao tác thất bại.';
}
