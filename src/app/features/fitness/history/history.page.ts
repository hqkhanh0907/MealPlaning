import {
  addCalendarDays,
  localIsoDate,
  mondayOfWeek,
  parseLocalDate,
} from '../../../core/utils/local-date';
import {
  isLoggedSet,
  workoutSetIssue,
  workoutSetLimits,
} from '../../../core/models/fitness-workout-set';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  barbellOutline,
  calendarOutline,
  chevronDownOutline,
  timerOutline,
  listOutline,
} from 'ionicons/icons';
import {
  displayWorkoutSet,
  exerciseAmountLabel,
  exerciseGuide,
  exerciseUnitNote,
} from '../../../core/models/exercise-guides';
import { loadFactor, type WorkoutVenuePreview } from '../../../core/models/workout-coaching';
import { exerciseGuideText } from '../../../core/models/exercise-guide-texts';
import { WorkoutNavigation } from '../workout-navigation';
import { FitnessStore } from '../../../core/stores/fitness.store';
import { catalogEntry, catalogReviewedFacts } from '../../../core/models/exercise-catalog';
import { exerciseEquipmentLabel, expandEquipment } from '../../../core/models/exercise-discovery';
import { WorkoutRepository } from '../../../core/repositories/workout.repository';
import {
  isTimedExercise,
  workoutNumber,
  type WorkoutSessionDetail,
  type WorkoutSet,
  type FitnessProgressSummary,
} from '../../../core/models/fitness.types';

interface HistoryWeekGroup {
  weekLabel: string;
  weekStartIso: string;
  sessions: WorkoutSessionDetail[];
}

interface SetEditor {
  sessionId: string;
  setId: string;
  exerciseId: string;
  timed: boolean;
  weight: string;
  amount: string;
}

@Component({
  selector: 'app-fitness-history',
  templateUrl: './history.page.html',
  styleUrl: './history.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class FitnessHistoryPage implements OnInit {
  protected readonly setValue = displayWorkoutSet;
  protected readonly unitNote = exerciseUnitNote;
  protected readonly amountLabel = exerciseAmountLabel;
  protected readonly limits = workoutSetLimits;
  protected readonly loadFactor = loadFactor;
  protected readonly guideFor = exerciseGuide;
  protected readonly editor = signal<SetEditor | null>(null);
  protected readonly deleting = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly actionError = signal<string | null>(null);
  private readonly workoutRepo = inject(WorkoutRepository);

  protected readonly nav = inject(WorkoutNavigation);
  private readonly injector = inject(Injector);
  protected readonly trendOpen = signal(false);
  protected readonly progress = signal<FitnessProgressSummary | null>(null);
  protected readonly weeks = signal<{ date: string; volume: number }[]>([]);
  protected readonly trendError = signal(false);
  protected readonly maxVolume = computed(() =>
    Math.max(1, ...this.weeks().map((week) => week.volume)),
  );
  protected readonly replayPreview = signal<{
    id: string;
    venue: WorkoutVenuePreview;
    place: string;
    exercises: { name: string; note: string }[];
  } | null>(null);
  protected readonly activeWorkout = signal(false);
  protected readonly replayError = signal<string | null>(null);
  protected readonly replayBusy = signal(false);
  private replayAction = 0;

  readonly loading = signal(true);
  readonly groups = signal<HistoryWeekGroup[]>([]);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({
      arrowBackOutline,
      barbellOutline,
      calendarOutline,
      chevronDownOutline,
      timerOutline,
      listOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  ionViewWillEnter(): void {
    if (!this.loading() && !this.saving()) void this.refresh();
  }

  ionViewWillLeave(): void {
    this.clearAction();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [sessions] = await Promise.all([
        this.workoutRepo.recentSessions(20),
        this.refreshTrend(),
      ]);
      this.groups.set(this.groupByIsoWeek(sessions));
    } catch {
      this.errorMessage.set('Không tải được lịch sử buổi tập.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async refreshTrend(): Promise<void> {
    const monday = mondayOfWeek(new Date());
    const first = addCalendarDays(monday, -49);
    try {
      const [progress, results] = await Promise.all([
        this.workoutRepo.progressSummary(),
        this.workoutRepo.weeklyVolumes(
          localIsoDate(first),
          localIsoDate(addCalendarDays(monday, 6)),
        ),
      ]);
      const byDate = new Map(results.map((point) => [point.week_start, point.volume]));
      this.weeks.set(
        Array.from({ length: 8 }, (_, index) => {
          const date = localIsoDate(addCalendarDays(first, 7 * index));
          return { date, volume: byDate.get(date) ?? 0 };
        }),
      );
      this.progress.set(progress);
      this.trendError.set(false);
    } catch {
      this.trendError.set(true);
    }
  }

  protected async prepareReplay(session: WorkoutSessionDetail): Promise<void> {
    if (session.mode !== 'free' || !session.exercises.length || this.replayBusy()) return;
    this.clearAction();
    const action = this.replayAction;
    this.replayBusy.set(true);
    try {
      const [active, venue] = await Promise.all([
        this.workoutRepo.getActiveSession(),
        this.injector.get(FitnessStore).previewReplay(session),
      ]);
      if (action !== this.replayAction) return;
      this.activeWorkout.set(!!active);
      const available = venue.equipment ? expandEquipment(venue.equipment) : null;
      const exercises = venue.movements.map(({ exerciseId }) => {
        const entry = catalogEntry(exerciseId);
        const original = session.exercises.find((item) => item.exercise_id === exerciseId);
        const name =
          original?.exercise_name_vi ||
          original?.exercise_name ||
          exerciseGuideText(exerciseId)?.nameVi ||
          entry?.name ||
          exerciseId;
        const required = entry && catalogReviewedFacts(entry).required;
        const missing = required?.filter((key) => !available?.has(key)) ?? [];
        const note =
          !available || !required
            ? 'Chưa đối chiếu dụng cụ'
            : missing.length
              ? 'Cần ' + missing.map(exerciseEquipmentLabel).join(', ')
              : '';
        return { name, note };
      });
      this.replayPreview.set({
        id: session.id,
        venue,
        place: venue.placeName ?? 'Chưa chọn nơi mặc định',
        exercises,
      });
    } catch {
      if (action === this.replayAction)
        this.replayError.set('Không mở được bản xem trước. Hãy thử lại.');
    } finally {
      if (action === this.replayAction) this.replayBusy.set(false);
    }
  }

  protected async startReplay(): Promise<void> {
    const preview = this.replayPreview();
    if (!preview || this.replayBusy()) return;
    const action = ++this.replayAction;
    this.replayBusy.set(true);
    try {
      const fitness = this.injector.get(FitnessStore);
      await fitness.replay(preview.id, preview.venue);
      if (action !== this.replayAction) return;
      if (fitness.errorMessage()) this.replayError.set(fitness.errorMessage());
      else if (fitness.activeSession()) await this.nav.session();
    } catch {
      if (action === this.replayAction)
        this.replayError.set('Không mở được buổi tập. Hãy thử lại.');
    } finally {
      if (action === this.replayAction) this.replayBusy.set(false);
    }
  }

  protected canEditSet(exerciseId: string, set: WorkoutSet): boolean {
    return (
      isLoggedSet(set) &&
      !set.legacy_unit_unknown &&
      isTimedExercise(exerciseId) === (set.duration_seconds != null)
    );
  }

  protected editSet(sessionId: string, exerciseId: string, set: WorkoutSet): void {
    if (this.saving() || !this.canEditSet(exerciseId, set)) return;
    this.clearAction();
    this.editor.set({
      sessionId,
      setId: set.id,
      exerciseId,
      timed: isTimedExercise(exerciseId),
      weight: String(set.weight_kg / loadFactor(exerciseId)),
      amount: String(set.duration_seconds ?? set.reps),
    });
  }

  protected updateEditor(field: 'weight' | 'amount', event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = event.target.value;
    this.editor.update((current) => (current ? { ...current, [field]: value } : current));
    this.actionError.set(null);
  }

  protected async saveSet(event: Event): Promise<void> {
    event.preventDefault();
    const edit = this.editor();
    if (!edit || this.saving()) return;
    const amount = Number(edit.amount);
    const measurement = {
      weightKg: edit.weight.trim() === '' ? NaN : Number(edit.weight) * loadFactor(edit.exerciseId),
      reps: edit.timed ? 0 : amount,
      durationSeconds: edit.timed ? amount : undefined,
    };
    const issue = workoutSetIssue(edit.exerciseId, {
      ...measurement,
      restSeconds: 0,
      effort: null,
      notes: null,
    });
    if (issue) {
      const messages = {
        weight:
          'Nhập mức tạ từ 0 đến ' +
          workoutSetLimits.maxWeightKg / loadFactor(edit.exerciseId) +
          ' kg.',
        reps: 'Nhập số lần nguyên từ 1 đến 100.',
        duration: 'Nhập số giây nguyên từ 1 đến 86.400.',
        rest: 'Dữ liệu nghỉ không hợp lệ.',
      };
      this.actionError.set(messages[issue]);
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    try {
      const session = await this.workoutRepo.reviseCompletedSet(
        edit.sessionId,
        edit.setId,
        measurement,
      );
      this.groups.update((groups) =>
        groups.map((group) => ({
          ...group,
          sessions: group.sessions.map((previous) =>
            previous.id === session.id ? session : previous,
          ),
        })),
      );
      this.editor.set(null);
      await this.refreshTrend();
    } catch {
      this.actionError.set('Không lưu được thay đổi. Thử lại.');
    } finally {
      this.saving.set(false);
    }
  }

  protected requestDelete(sessionId: string): void {
    if (this.saving()) return;
    this.clearAction();
    this.deleting.set(sessionId);
  }

  protected async confirmDelete(): Promise<void> {
    const sessionId = this.deleting();
    if (!sessionId || this.saving()) return;
    this.saving.set(true);
    this.actionError.set(null);
    try {
      await this.workoutRepo.deleteCompletedSession(sessionId);
      this.groups.update((groups) =>
        groups
          .map((group) => ({
            ...group,
            sessions: group.sessions.filter((session) => session.id !== sessionId),
          }))
          .filter((group) => group.sessions.length > 0),
      );
      this.deleting.set(null);
      await this.refreshTrend();
    } catch {
      this.actionError.set('Không xóa được buổi tập. Thử lại.');
    } finally {
      this.saving.set(false);
    }
  }

  protected clearAction(): void {
    if (this.saving()) return;
    ++this.replayAction;
    this.replayBusy.set(false);
    this.editor.set(null);
    this.replayPreview.set(null);
    this.replayError.set(null);
    this.deleting.set(null);
    this.actionError.set(null);
  }

  formatSessionDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
  }

  formatVolume(volume: number): string {
    return `${workoutNumber.format(volume)} kg`;
  }

  setCount(session: WorkoutSessionDetail): number {
    return session.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter(isLoggedSet).length,
      0,
    );
  }

  trackByGroup(_: number, group: HistoryWeekGroup): string {
    return group.weekStartIso;
  }

  trackBySession(_: number, session: WorkoutSessionDetail): string {
    return session.id;
  }

  private groupByIsoWeek(sessions: WorkoutSessionDetail[]): HistoryWeekGroup[] {
    const buckets = new Map<string, HistoryWeekGroup>();
    for (const session of sessions) {
      const weekStartIso = FitnessHistoryPage._isoWeekStart(session.date);
      const existing = buckets.get(weekStartIso);
      if (existing) {
        existing.sessions.push(session);
      } else {
        buckets.set(weekStartIso, {
          weekStartIso,
          weekLabel: this.weekLabel(weekStartIso),
          sessions: [session],
        });
      }
    }
    return Array.from(buckets.values()).sort((a, b) =>
      b.weekStartIso.localeCompare(a.weekStartIso),
    );
  }

  static _isoWeekStart(iso: string): string {
    return localIsoDate(mondayOfWeek(parseLocalDate(iso)));
  }

  static readonly _formatLocalIsoDate = localIsoDate;

  private weekLabel(weekStartIso: string): string {
    const monday = parseLocalDate(weekStartIso);
    const sunday = addCalendarDays(monday, 6);
    const fmt = (d: Date): string =>
      d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    return `Tuần ${fmt(monday)} – ${fmt(sunday)}`;
  }
}

export default FitnessHistoryPage;
