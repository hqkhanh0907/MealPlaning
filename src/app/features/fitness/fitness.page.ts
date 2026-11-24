import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
  IonTitle,
  AlertController,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { AiAvailability } from '../../shared/ai-availability';
import { addIcons } from 'ionicons';
import {
  addOutline,
  barbellOutline,
  bodyOutline,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  flashOutline,
  flameOutline,
  pulseOutline,
  settingsOutline,
  sparklesOutline,
  statsChartOutline,
  timeOutline,
  timerOutline,
  trashOutline,
} from 'ionicons/icons';
import { isLoggedSet, workoutSetLimits } from '../../core/models/fitness-workout-set';
import { FitnessStore } from '../../core/stores/fitness.store';
import { RestTimer } from './components/rest-timer/rest-timer';
import { ExerciseGuideSheet } from './components/exercise-guide-sheet/exercise-guide-sheet';
import { PlanPreview } from './components/plan-preview/plan-preview';
import { exerciseGuide, exercisePurpose } from '../../core/models/exercise-guides';
import { PlanEditor } from './components/plan-editor/plan-editor';
import { ExercisePickerSheet } from '../../shared/components/exercise-picker-sheet/exercise-picker-sheet';
import { WorkoutSummaryModal } from '../../shared/components/workout-summary-modal/workout-summary-modal';
import {
  isTimedExercise,
  setValueLabel,
  workoutNumber,
  type ActiveTrainingPlan,
  type WorkoutEffort,
  type WorkoutExerciseDetail,
} from '../../core/models/fitness.types';

const EFFORT_LABELS: Record<WorkoutEffort, string> = {
  easy: 'Dễ',
  just_right: 'Vừa',
  hard: 'Nặng',
  maxed: 'Tối đa',
};
const SET_TAP_INTERVAL_MS = 250;
type SetAction = 'logSet' | 'skipSet' | 'repeatLastSet';

@Component({
  selector: 'app-fitness',
  templateUrl: './fitness.page.html',
  styleUrl: './fitness.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keyboardWillShow)': 'keyboardOpen.set(true)',
    '(window:ionKeyboardDidShow)': 'onKeyboardShown()',
    '(window:ionKeyboardDidHide)': 'keyboardOpen.set(false)',
  },
  imports: [
    NgTemplateOutlet,
    RestTimer,
    ExerciseGuideSheet,
    PlanPreview,
    PlanEditor,
    ExercisePickerSheet,
    WorkoutSummaryModal,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButtons,
    IonButton,
    IonIcon,
  ],
})
export default class FitnessPage {
  protected readonly guideOpen = signal(false);
  protected readonly purpose = exercisePurpose;
  protected readonly guideFor = exerciseGuide;
  protected readonly ai = inject(AiAvailability);
  protected readonly setLimits = workoutSetLimits;
  protected readonly timed = isTimedExercise;
  protected readonly setValue = setValueLabel;
  protected readonly number = workoutNumber;
  protected setCount(exercise: WorkoutExerciseDetail): string {
    const logged = exercise.sets.filter(isLoggedSet).length;
    const skipped = exercise.sets.length - logged;
    return logged + ' hiệp đã ghi' + (skipped ? ' · ' + skipped + ' bỏ qua' : '');
  }
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly content = viewChild(IonContent);
  private readonly setEntry = viewChild<ElementRef<HTMLElement>>('setEntry');
  private visibleSessionId: string | null = null;
  private lastSetTap: { action: SetAction; at: number } | null = null;
  protected readonly fitness = inject(FitnessStore);
  protected readonly keyboardOpen = signal(false);

  constructor() {
    addIcons({
      addOutline,
      barbellOutline,
      bodyOutline,
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      flashOutline,
      flameOutline,
      pulseOutline,
      settingsOutline,
      sparklesOutline,
      statsChartOutline,
      timeOutline,
      timerOutline,
      trashOutline,
    });

    afterRenderEffect(() => {
      const content = this.content();
      const sessionId = this.fitness.activeSession()?.id ?? null;
      if (!content || this.visibleSessionId === sessionId) return;
      const wasCancelled =
        this.visibleSessionId !== null &&
        this.fitness.lastCancelledSessionId() === this.visibleSessionId;
      this.visibleSessionId = sessionId;
      if (sessionId || wasCancelled) void content.scrollToTop();
    });
  }

  protected submitSet(action: SetAction): void {
    const at = performance.now();
    const last = this.lastSetTap;
    if (last?.action === action && at - last.at < SET_TAP_INTERVAL_MS) return;
    this.lastSetTap = { action, at };
    void this.fitness[action]();
  }

  protected onKeyboardShown(): void {
    this.keyboardOpen.set(true);
    requestAnimationFrame(() => void this.revealSetEntry());
  }

  protected async revealSetEntry(): Promise<void> {
    const content = this.content();
    const entry = this.setEntry()?.nativeElement;
    if (!content || !entry || !this.keyboardOpen()) return;

    const scroll = await content.getScrollElement();
    if (!this.keyboardOpen() || !entry.querySelector('.set-grid input:focus')) return;

    const viewport = scroll.getBoundingClientRect();
    const form = entry.getBoundingClientRect();
    const visible = window.visualViewport;
    const top = Math.max(viewport.top, visible?.offsetTop ?? 0);
    const bottom = Math.min(
      viewport.bottom,
      visible ? visible.offsetTop + visible.height : Infinity,
    );
    const offset = form.top < top ? form.top - top : Math.max(0, form.bottom - bottom);
    if (offset) await content.scrollByPoint(0, offset, 0);
  }

  /**
   * Bottom-sheet picker open state. Replaces the inline `.free-mode` block — chips
   * + search now live in `<app-exercise-picker-sheet>` so the hub stays focused
   * on planned-day overview + active session controls (Apple HIG: one screen, one job).
   */
  readonly pickerOpen = signal(false);

  /**
   * Active plan card progressive-disclosure: collapsed by default to keep the
   * hub focused on today's workout. User taps "Đổi giáo án" to expand the full plan
   * grid + AI callout in the same card (no nav, Apple HIG: stay-in-place).
   */
  readonly switchPlanOpen = signal(false);
  protected readonly planEditorSource = signal<ActiveTrainingPlan | null>(null);
  protected readonly selectedPlanDayId = signal<string | null>(null);
  protected readonly previewPlanDay = computed(() =>
    this.fitness.activePlan()?.days.find((day) => day.id === this.selectedPlanDayId()),
  );

  openPicker(): void {
    this.pickerOpen.set(true);
  }

  toggleSwitchPlan(): void {
    this.switchPlanOpen.update((v) => !v);
  }

  protected dayLabel(dayOfWeek: number): string {
    return dayOfWeek === 0 ? 'Chủ nhật' : `Thứ ${dayOfWeek + 1}`;
  }

  ionViewWillEnter(): void {
    void this.fitness.initialize();
  }

  openSettings(): void {
    void this.router.navigate(['/settings']);
  }

  onWeightInput(event: Event): void {
    this.fitness.updateWeight(inputValue(event));
  }

  onRepsInput(event: Event): void {
    this.fitness.updateReps(inputValue(event));
  }

  onRestInput(event: Event): void {
    this.fitness.updateRestSeconds(inputValue(event));
  }

  onNotesInput(event: Event): void {
    this.fitness.updateNotes(inputValue(event));
  }

  setEffort(effort: WorkoutEffort | null): void {
    this.fitness.updateEffort(effort);
  }

  effortLabel(effort: WorkoutEffort): string {
    return EFFORT_LABELS[effort];
  }

  barWidth(value: number, max: number): string {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return '0%';
    return `${Math.max(0, Math.min(100, Math.round((value / max) * 100)))}%`;
  }

  async confirmCancelSession(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Hủy buổi tập?',
      message: 'Buổi này sẽ dừng. Bạn có thể hoàn tác ngay sau khi hủy.',
      buttons: [
        { text: 'Giữ lại', role: 'cancel' },
        {
          text: 'Hủy buổi',
          role: 'destructive',
          handler: () => {
            void this.fitness.cancelWorkout();
          },
        },
      ],
    });
    await alert.present();
  }

  /** Destructive: remove a single exercise (and its sets) from the active session. */
  async confirmRemoveExercise(workoutExerciseId: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Xóa bài khỏi buổi tập?',
      message: 'Bạn sẽ mất các hiệp đã ghi cho bài này.',
      buttons: [
        { text: 'Hủy', role: 'cancel' },
        {
          text: 'Xóa',
          role: 'destructive',
          handler: () => {
            void this.fitness.removeExerciseFromActive(workoutExerciseId);
          },
        },
      ],
    });
    await alert.present();
  }

  /** Destructive: delete a single logged set. Re-numbers remaining sets server-side. */
  async confirmDeleteSet(setId: string, setNumber: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: `Xóa hiệp ${setNumber}?`,
      message: 'Ứng dụng sẽ xóa vĩnh viễn hiệp này.',
      buttons: [
        { text: 'Hủy', role: 'cancel' },
        {
          text: 'Xóa',
          role: 'destructive',
          handler: () => {
            void this.fitness.deleteSet(setId);
          },
        },
      ],
    });
    await alert.present();
  }
}

function inputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ? event.target.value : '';
}
