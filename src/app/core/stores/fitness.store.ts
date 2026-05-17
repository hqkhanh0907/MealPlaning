import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type {
  ActiveTrainingPlan,
  Exercise,
  FitnessProgressSummary,
  TrainingPlanDayWithExercises,
  TrainingPlanSummary,
  TrainingPlanType,
  WorkoutEffort,
  WorkoutExerciseDetail,
  WorkoutSessionDetail,
  WorkoutSetDraft,
} from '../models/fitness.types';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { TrainingPlanRepository } from '../repositories/training-plan.repository';
import { WorkoutRepository, type WorkoutSetInput } from '../repositories/workout.repository';
import { FitnessAi } from '../services/ai/fitness-ai';
import { NetworkStore } from './network.store';
import { ProfileStore } from './profile.store';

const DEFAULT_SET_DRAFT: WorkoutSetDraft = {
  weightKg: '20',
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
  readonly selectedWorkoutExerciseId = signal<string | null>(null);
  readonly setDraft = signal<WorkoutSetDraft>({ ...DEFAULT_SET_DRAFT });
  readonly progress = signal<FitnessProgressSummary | null>(null);
  readonly exerciseSearch = signal('');
  readonly restSeconds = signal(0);
  readonly loading = signal(false);
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

  private restIntervalId: ReturnType<typeof setInterval> | null = null;
  /** F-006 — pending autosave timer handle. */
  private draftSaveTimerId: ReturnType<typeof setTimeout> | null = null;
  /** F-006 — last exercise id whose draft we hydrated, to avoid re-hydrating on every keystroke. */
  private lastHydratedExerciseId: string | null = null;

  constructor() {
    // Auto countdown rest timer when restSeconds > 0. Stops at 0.
    effect(() => {
      const seconds = this.restSeconds();
      if (this.restIntervalId !== null) {
        clearInterval(this.restIntervalId);
        this.restIntervalId = null;
      }
      if (seconds > 0) {
        this.restIntervalId = setInterval(() => {
          const next = this.restSeconds() - 1;
          if (next <= 0) {
            this.restSeconds.set(0);
            if (this.restIntervalId !== null) {
              clearInterval(this.restIntervalId);
              this.restIntervalId = null;
            }
          } else {
            this.restSeconds.set(next);
          }
        }, 1000);
      }
    });

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
        this.persistDraft(exerciseId, draft);
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
      this.setDraft.set(this.loadDraft(exerciseId));
    });
  }

  /** F-006 helper — write draft to localStorage; silent on storage errors (private browsing). */
  private persistDraft(exerciseId: string, draft: WorkoutSetDraft): void {
    try {
      localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${exerciseId}`, JSON.stringify(draft));
    } catch {
      // localStorage may be unavailable (private mode, quota). Silent fail OK — non-critical.
    }
  }

  /** F-006 helper — load draft for an exercise; falls back to DEFAULT_SET_DRAFT on miss/parse fail. */
  private loadDraft(exerciseId: string): WorkoutSetDraft {
    try {
      const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${exerciseId}`);
      if (!raw) {
        return { ...DEFAULT_SET_DRAFT };
      }
      const parsed = JSON.parse(raw) as Partial<WorkoutSetDraft>;
      return {
        weightKg: typeof parsed.weightKg === 'string' ? parsed.weightKg : DEFAULT_SET_DRAFT.weightKg,
        reps: typeof parsed.reps === 'string' ? parsed.reps : DEFAULT_SET_DRAFT.reps,
        restSeconds:
          typeof parsed.restSeconds === 'string' ? parsed.restSeconds : DEFAULT_SET_DRAFT.restSeconds,
        effort: (parsed.effort ?? null) as WorkoutEffort | null,
        notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      };
    } catch {
      return { ...DEFAULT_SET_DRAFT };
    }
  }

  /** F-006 helper — drop persisted draft after a successful logSet so next session starts clean. */
  private clearPersistedDraft(exerciseId: string): void {
    try {
      localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${exerciseId}`);
    } catch {
      // ignored
    }
  }

  skipRest(): void {
    this.restSeconds.set(0);
  }

  readonly isRestDay = computed(() => this.todayDay()?.is_rest_day === 1);
  readonly canCompleteWorkout = computed(
    () => this.activeSession()?.exercises.some((exercise) => exercise.sets.length > 0) ?? false,
  );

  readonly selectedWorkoutExercise = computed<WorkoutExerciseDetail | null>(() => {
    const id = this.selectedWorkoutExerciseId();
    if (!id) return this.activeSession()?.exercises[0] ?? null;
    return this.activeSession()?.exercises.find((exercise) => exercise.id === id) ?? null;
  });

  readonly filteredExercises = computed(() => {
    const query = normalize(this.exerciseSearch());
    const list = this.exercises();
    if (!query) return list.slice(0, 12);
    return list
      .filter((exercise) =>
        [exercise.name, exercise.name_vi ?? '', exercise.equipment ?? ''].some((value) =>
          normalize(value).includes(query),
        ),
      )
      .slice(0, 12);
  });

  readonly currentWeekVolumeLabel = computed(() => {
    const value = this.progress()?.currentWeekVolume ?? 0;
    return `${formatNumber(value)} kg`;
  });

  readonly previousWeekVolumeLabel = computed(() => {
    const value = this.progress()?.previousWeekVolume ?? 0;
    return `${formatNumber(value)} kg`;
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
      const exercises = await this.exerciseRepo.list({ limit: 200 });
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
    const today = toIsoDate(now);
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

  async activatePlan(type: TrainingPlanType): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.planRepo.activatePlan(type);
      await this.refresh();
      this.successMessage.set('Đã đổi giáo án tập luyện.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
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
    const todayDay = this.todayDay();
    if (!todayDay || todayDay.is_rest_day === 1) {
      this.errorMessage.set('Hôm nay là ngày nghỉ hoặc chưa có giáo án đang hoạt động.');
      return;
    }

    this.errorMessage.set(null);
    try {
      const session = await this.workoutRepo.startGuidedSession(todayDay.id);
      this.activeSession.set(session);
      this.selectedWorkoutExerciseId.set(session.exercises[0]?.id ?? null);
      this.successMessage.set('Đã bắt đầu buổi tập theo giáo án.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async startFree(): Promise<void> {
    this.errorMessage.set(null);
    try {
      const session = await this.workoutRepo.startFreeSession();
      this.activeSession.set(session);
      this.selectedWorkoutExerciseId.set(session.exercises[0]?.id ?? null);
      this.successMessage.set('Đã bắt đầu buổi tập tự do.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
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

  updateExerciseSearch(query: string): void {
    this.exerciseSearch.set(query);
  }

  async logSet(): Promise<void> {
    const exercise = this.selectedWorkoutExercise();
    if (!exercise) {
      this.errorMessage.set('Chọn một bài tập trước khi log set.');
      return;
    }

    const draft = parseDraft(this.setDraft());
    if (draft.ok === false) {
      this.errorMessage.set(draft.message);
      return;
    }

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
      this.successMessage.set('Đã log set tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async completeWorkout(): Promise<void> {
    const session = this.activeSession();
    if (!session) return;
    if (session.exercises.every((exercise) => exercise.sets.length === 0)) {
      this.errorMessage.set('Cần log ít nhất 1 set trước khi hoàn thành buổi tập.');
      return;
    }

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.completeSession(session.id);
      this.activeSession.set(null);
      this.selectedWorkoutExerciseId.set(null);
      await this.refresh();
      this.successMessage.set('Đã hoàn thành buổi tập.');
    } catch (error) {
      this.errorMessage.set(toErrorMessage(error));
    }
  }

  async cancelWorkout(): Promise<void> {
    const session = this.activeSession();
    if (!session) return;

    this.errorMessage.set(null);
    try {
      await this.workoutRepo.cancelSession(session.id);
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
      this.successMessage.set('Đã xóa set.');
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
      this.successMessage.set('Đã cập nhật set.');
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

  /**
   * Repeat the most-recent set in the selected exercise: prefills the draft with last set's
   * weight/reps/rest/effort then calls logSet(). Apple Fitness-style "+1 same set" shortcut so user
   * doesn't re-type the same values 4 times per exercise.
   */
  async repeatLastSet(): Promise<void> {
    const selected = this.selectedWorkoutExercise();
    const lastSet = selected?.sets[selected.sets.length - 1];
    if (!lastSet) {
      this.errorMessage.set('Chưa có set nào để lặp lại.');
      return;
    }
    this.setDraft.set({
      weightKg: String(lastSet.weight_kg),
      reps: String(lastSet.reps),
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

function parseDraft(draft: WorkoutSetDraft):
  | {
      ok: true;
      value: {
        weightKg: number;
        reps: number;
        restSeconds: number;
        effort: WorkoutEffort | null;
        notes: string | null;
      };
    }
  | { ok: false; message: string } {
  const weightKg = Number(draft.weightKg);
  const reps = Number(draft.reps);
  const restSeconds = Number(draft.restSeconds);

  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) {
    return { ok: false, message: 'Weight phải nằm trong khoảng 0-500 kg.' };
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    return { ok: false, message: 'Reps phải là số nguyên 1-100.' };
  }
  if (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600) {
    return { ok: false, message: 'Rest timer phải nằm trong khoảng 0-600 giây.' };
  }

  return {
    ok: true,
    value: {
      weightKg,
      reps,
      restSeconds,
      effort: draft.effort,
      notes: draft.notes.trim() || null,
    },
  };
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'FitnessStore: thao tác thất bại.';
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}
