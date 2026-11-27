import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
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
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  barbellOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timerOutline,
  trashOutline,
} from 'ionicons/icons';
import { loadFactor } from '../../core/models/workout-coaching';
import { isLoggedSet, workoutSetLimits } from '../../core/models/fitness-workout-set';
import { FitnessStore } from '../../core/stores/fitness.store';
import { WorkoutNavigation } from './workout-navigation';
import { WorkoutSubstitution } from './components/workout-substitution/workout-substitution';
import { RestTimer } from './components/rest-timer/rest-timer';
import { ExerciseGuideSheet } from './components/exercise-guide-sheet/exercise-guide-sheet';
import { displayWorkoutSet, exerciseAmountLabel } from '../../core/models/exercise-guides';
import { ExercisePickerSheet } from '../../shared/components/exercise-picker-sheet/exercise-picker-sheet';
import { WorkoutSummaryModal } from '../../shared/components/workout-summary-modal/workout-summary-modal';
import {
  isTimedExercise,
  workoutNumber,
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
    RestTimer,
    ExerciseGuideSheet,
    WorkoutSubstitution,
    ExercisePickerSheet,
    WorkoutSummaryModal,
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
  protected readonly amountLabel = exerciseAmountLabel;
  protected readonly setLimits = workoutSetLimits;
  protected readonly loadFactor = loadFactor;
  protected readonly timed = isTimedExercise;
  protected readonly setValue = displayWorkoutSet;
  protected readonly number = workoutNumber;
  protected setCount(exercise: WorkoutExerciseDetail): string {
    const logged = exercise.sets.filter(isLoggedSet).length;
    const skipped = exercise.sets.length - logged;
    return logged + ' hiệp đã ghi' + (skipped ? ' · ' + skipped + ' bỏ qua' : '');
  }
  protected readonly nav = inject(WorkoutNavigation);
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
      arrowBackOutline,
      barbellOutline,

      checkmarkCircleOutline,
      closeCircleOutline,

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

  readonly pickerOpen = signal(false);

  openPicker(): void {
    this.pickerOpen.set(true);
  }

  ionViewWillEnter(): void {
    void this.fitness.initialize();
  }

  protected dismissSummary(): void {
    this.fitness.dismissCompletedSummary();
    void this.nav.today();
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
            void this.fitness.cancelWorkout().then(() => {
              if (!this.fitness.activeSession()) void this.nav.today();
            });
          },
        },
      ],
    });
    await alert.present();
  }

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
