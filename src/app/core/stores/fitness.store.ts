import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AccountSession } from '../account/account-session';
import { isTimedExercise, workoutNumber } from '../models/fitness.types';
import type {
  ActiveTrainingPlan,
  Exercise,
  FitnessProgressSummary,
  PersonalTrainingPlanDraft,
  TrainingPlanDayWithExercises,
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
import { NetworkStore } from './network.store';
import { ProfileStore } from './profile.store';

const DEFAULT_SET_DRAFT: WorkoutSetDraft = {
  weightKg: '',
  reps: '10',
  restSeconds: '90',
  effort: null,
  notes: '',
};

/** F-006 — localStorage key prefix for autosave drafts. Scoped per workout_exercise.id. */
const DRAFT_STORAGE_PREFIX = 'fitness:draft:';
const DRAFT_AUTOSAVE_DEBOUNCE_MS = 500;

@Injectable({ providedIn: 'root' })
export class FitnessStore {
  private readonly account = inject(AccountSession);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly planRepo = inject(TrainingPlanRepository);
  private readonly workoutRepo = inject(WorkoutRepository);
  private readonly fitnessAi = inject(FitnessAi);
  private readonly network = inject(NetworkStore);
  private readonly profileStore = inject(ProfileStore);

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
  /** F-006 — pending autosave timer handle. */
  private draftSaveTimerId: ReturnType<typeof setTimeout> | null = null;
  /** F-006 — last exercise id whose draft we hydrated, to avoid re-hydrating on every keystroke. */
  private lastHydratedExerciseId: string | null = null;

  constructor() {
    // F-006 — autosave set draft to localStorage debounced 500ms per workout_exercise.id.
    // Avoids losing typed weight/reps/notes when OS kills the app before GHI SET.
    effect(() => {
      const exerciseId = this.selectedWorkoutExerciseId();
      const draft = this.setDraft();
      if (!exerciseId) {
        return;
      }
      if (this.draftSaveTimerId !== null) {
        clearTimeout(this.draftSaveTimerId);
      }
      this.draftSaveTimerId = setTimeout(() => {
        const movement = this.activeSession()?.exercises.find((ex) => ex.id === exerciseId);
        if (movement) this.persistDraft(exerciseId, draft, isTimedExercise(movement.exercise_id));
        this.draftSaveTimerId = null;
      }, DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    // F-006 hydration — when selectedWorkoutExerciseId changes (including internal sets from
    // refreshActiveSession/startGuided/addExerciseToSession), restore any persisted draft.
    // Tracks last-hydrated id to avoid re-applying on every setDraft tick.
    effect(() => {
      const exerciseId = this.selectedWorkoutExerciseId();
      if (exerciseId === this.lastHydratedExerciseId) {
        return;
      }
      this.lastHydratedExerciseId = exerciseId;
      if (exerciseId === null) {
        return;
      }
      const selected = this.selectedWorkoutExercise();
      if (selected) this.setDraft.set(this.loadDraft(selected));
    });
  }

  /** F-006 helper — write draft to localStorage; silent on storage errors (private browsing). */
  private persistDraft(exerciseId: string, draft: WorkoutSetDraft, timed: boolean): void {
    try {
      localStorage.setItem(
        this.draftKey(exerciseId),
        JSON.stringify({ ...draft, unit: timed ? 'seconds' : 'reps' }),
      );
    } catch {
      // localStorage may be unavailable (private mode, quota). Silent fail OK — non-critical.
    }
  }

  /** F-006 helper — load draft for an exercise; falls back to DEFAULT_SET_DRAFT on miss/parse fail. */
  private loadDraft(exercise: WorkoutExerciseDetail): WorkoutSetDraft {
    const defaults: WorkoutSetDraft = {
      ...DEFAULT_SET_DRAFT,
      weightKg:
        exercise.equipment?.includes('Bodyweight') || exercise.category === 'cardio' ? '0' : '',
      reps: String(exercise.planned_min ?? (isTimedExercise(exercise.exercise_id) ? 30 : 10)),
      restSeconds: String(exercise.planned_rest ?? 90),
    };
    try {
      const raw = localStorage.getItem(this.draftKey(exercise.id));
      if (!raw) {
        return defaults;
      }
      const parsed = JSON.parse(raw) as Partial<WorkoutSetDraft> & { unit?: string };
      if (isTimedExercise(exercise.exercise_id) && parsed.unit !== 'seconds') return defaults;
      return {
        weightKg: typeof parsed.weightKg === 'string' ? parsed.weightKg : defaults.weightKg,
        reps: typeof parsed.reps === 'string' ? parsed.reps : defaults.reps,
        restSeconds:
          typeof parsed.restSeconds === 'string' ? parsed.restSeconds : defaults.restSeconds,
        effort: (parsed.effort ?? null) as WorkoutEffort | null,
        notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      };
    } catch {
      return defaults;
    }
  }

  /** F-006 helper — drop persisted draft after a successful logSet so next session starts clean. */
  private clearPersistedDraft(exerciseId: string): void {
    try {
      localStorage.removeItem(this.draftKey(exerciseId));
    } catch {
      // ignored
    }
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

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const plans = await this.planRepo.ensurePresetPlans();
      const exercises = await this.exerciseRepo.list({ limit: 1000 });
      this.plans.set(plans);
      this.exercises.set(exercises);
      await this.refresh();
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(now: Date = new Date()): Promise<void> {
    const today = localIsoDate(now);
    const [plans, activePlan, todayDay, activeSession, progress] = await Promise.all([
      this.planRepo.listPlans(),
      this.planRepo.getActivePlan(),
      this.planRepo.getTodayTrainingDay(today),
      this.workoutRepo.getActiveSession(),
      this.workoutRepo.progressSummary(now),
    ]);
    this.plans.set(plans);
    this.activePlan.set(activePlan);
    this.todayDay.set(todayDay);
    this.activeSession.set(activeSession);
    this.progress.set(progress);

    const currentSelected = this.selectedWorkoutExerciseId();
    const stillExists = activeSession?.exercises.some(
      (exercise) => exercise.id === currentSelected,
    );
    if (!stillExists) {
      this.selectedWorkoutExerciseId.set(activeSession?.exercises[0]?.id ?? null);
    }
  }

  async activatePlan(planId: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.planRepo.activatePlanById(planId);
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
      await this.refresh();
      this.successMessage.set('Đã lưu giáo án cá nhân.');
      return true;
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
      return false;
    }
  }

  async generateAiCustomPlan(): Promise<void> {
    if (!this.network.online()) {
      this.errorMessage.set('Cần kết nối mạng để tạo giáo án AI.');
      return;
    }
    this.aiPlanLoading.set(true);
    this.errorMessage.set(null);
    try {
      const draft = await this.fitnessAi.generateTrainingPlan({
        profile: this.profileStore.profile(),
        exercises: this.exercises(),
        progress: this.progress(),
      });
      await this.planRepo.createAiPlan(draft);
      this.aiPlanRationale.set(draft.rationale);
      await this.refresh();
      this.successMessage.set('Đã tạo và kích hoạt giáo án AI custom.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.aiPlanLoading.set(false);
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

    this.startingWorkout = true;
    this.errorMessage.set(null);
    try {
      const session = await this.workoutRepo.startGuidedSession(day.id);
      this.activeSession.set(session);
      this.selectedWorkoutExerciseId.set(session.exercises[0]?.id ?? null);
      this.successMessage.set('Đã bắt đầu buổi tập theo giáo án.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.startingWorkout = false;
    }
  }

  async startFree(): Promise<void> {
    if (this.startingWorkout) return;
    this.startingWorkout = true;
    this.errorMessage.set(null);
    try {
      const session = await this.workoutRepo.startFreeSession();
      this.activeSession.set(session);
      this.selectedWorkoutExerciseId.set(session.exercises[0]?.id ?? null);
      this.successMessage.set('Đã bắt đầu buổi tập tự do.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    } finally {
      this.startingWorkout = false;
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
      this.selectedWorkoutExerciseId.set(exercise.id);
      this.successMessage.set('Đã thêm bài vào buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  selectWorkoutExercise(id: string): void {
    this.selectedWorkoutExerciseId.set(id);
    // Hydration happens via the effect in constructor — fires for any selectedWorkoutExerciseId
    // change, including internal sets from refresh/start/select paths.
  }

  updateWeight(value: string): void {
    this.setDraft.update((draft) => ({ ...draft, weightKg: value }));
  }

  updateReps(value: string): void {
    this.setDraft.update((draft) => ({ ...draft, reps: value }));
  }

  updateRestSeconds(value: string): void {
    this.setDraft.update((draft) => ({ ...draft, restSeconds: value }));
  }

  updateEffort(effort: WorkoutEffort | null): void {
    this.setDraft.update((draft) => ({ ...draft, effort }));
  }

  updateNotes(notes: string): void {
    this.setDraft.update((draft) => ({ ...draft, notes }));
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
      const { set: createdSet, session: refreshedSession } = await this.workoutRepo.addSet(
        exercise.id,
        draft.value,
      );
      this.activeSession.set(refreshedSession);
      this.restSeconds.set(draft.value.restSeconds);
      this.setDraft.update((current) => ({ ...current, notes: '' }));
      // F-006 — clear persisted draft so a fresh log starts clean; user can still re-edit fields,
      // autosave effect will re-persist immediately if they do.
      this.clearPersistedDraft(exercise.id);
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
    const plannedWeightKg = Number.parseFloat(draftSnapshot.weightKg) || 0;
    const plannedReps = Number.parseInt(draftSnapshot.reps, 10) || 0;

    this.savingSet.set(true);
    this.errorMessage.set(null);
    try {
      const { session: refreshedSession } = await this.workoutRepo.skipSet(
        exercise.id,
        plannedWeightKg,
        isTimedExercise(exercise.exercise_id) ? 0 : plannedReps,
      );
      this.activeSession.set(refreshedSession);
      this.setDraft.update((current) => ({ ...current, notes: '' }));
      this.clearPersistedDraft(exercise.id);
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
      const finalized = await this.workoutRepo.getSession(session.id);
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
        this.selectedWorkoutExerciseId.set(refreshed?.exercises[0]?.id ?? null);
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
      weightKg: String(lastSet.weight_kg),
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
    weightKg: Number(draft.weightKg),
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
