import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  repeatOutline,
  settingsOutline,
  sparklesOutline,
  statsChartOutline,
  timeOutline,
  timerOutline,
  trashOutline,
} from 'ionicons/icons';
import { FitnessStore } from '../../core/stores/fitness.store';
import { RestTimer } from './components/rest-timer/rest-timer';
import { ExercisePickerSheet } from '../../shared/components/exercise-picker-sheet/exercise-picker-sheet';
import type { WorkoutEffort } from '../../core/models/fitness.types';

const EFFORT_LABELS: Record<WorkoutEffort, string> = {
  easy: 'Dễ',
  just_right: 'Vừa',
  hard: 'Nặng',
  maxed: 'Tối đa',
};

@Component({
  selector: 'app-fitness',
  templateUrl: './fitness.page.html',
  styleUrl: './fitness.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RestTimer,
    ExercisePickerSheet,
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
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  protected readonly fitness = inject(FitnessStore);

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
      repeatOutline,
      settingsOutline,
      sparklesOutline,
      statsChartOutline,
      timeOutline,
      timerOutline,
      trashOutline,
    });
  }

  /**
   * Bottom-sheet picker open state. Replaces the inline `.free-mode` block — chips
   * + search now live in `<app-exercise-picker-sheet>` so the hub stays focused
   * on planned-day overview + active session controls (Apple HIG: one screen, one job).
   */
  readonly pickerOpen = signal(false);

  openPicker(): void {
    this.pickerOpen.set(true);
  }

  /**
   * Apple-style entry path when active session has 0 exercises: opens the picker sheet
   * from the empty active card so user has a single tap to pick a first exercise.
   */
  openFreeModeAndScroll(): void {
    this.pickerOpen.set(true);
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

  /** Destructive: discard the in-progress workout entirely. */
  async confirmCancelSession(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Hủy buổi tập?',
      message: 'Mọi set đã ghi trong buổi này sẽ bị xóa. Hành động không thể hoàn tác.',
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
      message: 'Toàn bộ set đã ghi cho bài này sẽ bị xóa.',
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
      header: `Xóa Set ${setNumber}?`,
      message: 'Hành động không thể hoàn tác.',
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
