import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, barbellOutline, checkmarkCircleOutline, trashOutline } from 'ionicons/icons';
import { FitnessStore } from '../../../core/stores/fitness.store';
import type { WorkoutEffort, WorkoutSet } from '../../../core/models/fitness.types';
import { RestTimer } from '../components/rest-timer/rest-timer';

@Component({
  selector: 'app-active-workout',
  templateUrl: './active-workout.page.html',
  styleUrl: './active-workout.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RestTimer,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export default class ActiveWorkoutPage {
  private readonly alertCtrl = inject(AlertController);
  protected readonly fitness = inject(FitnessStore);

  constructor() {
    addIcons({ addOutline, barbellOutline, checkmarkCircleOutline, trashOutline });
  }

  ionViewWillEnter(): void {
    void this.fitness.initialize();
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

  async confirmDeleteSet(setId: string, setNumber: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: `Xóa Set ${setNumber}?`,
      message: 'Set sẽ bị xóa khỏi buổi tập và các set sau được đánh số lại.',
      buttons: [
        { text: 'Giữ lại', role: 'cancel' },
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

  async confirmCancelWorkout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Hủy buổi tập?',
      message: 'Toàn bộ set đã log sẽ mất. Hành động này không thể hoàn tác.',
      buttons: [
        { text: 'Tiếp tục tập', role: 'cancel' },
        {
          text: 'Hủy buổi tập',
          role: 'destructive',
          handler: () => {
            void this.fitness.cancelWorkout();
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmCompleteWorkout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Hoàn thành buổi tập?',
      message: 'Buổi tập sẽ được lưu vào lịch sử và đóng logger hiện tại.',
      buttons: [
        { text: 'Tập tiếp', role: 'cancel' },
        {
          text: 'Hoàn thành',
          handler: () => {
            void this.fitness.completeWorkout();
          },
        },
      ],
    });
    await alert.present();
  }

  async editSet(set: WorkoutSet): Promise<void> {
    // F-004: alert now exposes ALL mutable set fields (weight, reps, rest,
    // effort, notes) so editing never silently drops data. Effort is mapped to
    // a 0..4 numeric input here because Ionic AlertController can't mix radio
    // groups with other input types in a single alert — a dedicated edit-set
    // sheet (IA-proposal P1) is the long-term home for proper chip UX.
    const effortIndex = EFFORT_OPTIONS.findIndex((e) => e === set.effort);
    const alert = await this.alertCtrl.create({
      header: `Sửa Set ${set.set_number}`,
      message: 'Mức nỗ lực: 0 = bỏ trống · 1 = Dễ · 2 = Vừa · 3 = Nặng · 4 = Tối đa',
      inputs: [
        {
          name: 'weightKg',
          type: 'number',
          value: set.weight_kg,
          attributes: { inputmode: 'decimal', min: 0, max: 500, step: 0.5 },
          placeholder: 'Tạ (kg)',
        },
        {
          name: 'reps',
          type: 'number',
          value: set.reps,
          attributes: { inputmode: 'numeric', min: 1, max: 100, step: 1 },
          placeholder: 'Số lần',
        },
        {
          name: 'restSeconds',
          type: 'number',
          value: set.rest_seconds ?? 0,
          attributes: { inputmode: 'numeric', min: 0, max: 600, step: 15 },
          placeholder: 'Nghỉ (giây)',
        },
        {
          name: 'effortIndex',
          type: 'number',
          value: effortIndex >= 0 ? effortIndex + 1 : 0,
          attributes: { inputmode: 'numeric', min: 0, max: 4, step: 1 },
          placeholder: 'Mức nỗ lực (0-4)',
        },
        {
          name: 'notes',
          type: 'textarea',
          value: set.notes ?? '',
          placeholder: 'Ghi chú (tuỳ chọn)',
        },
      ],
      buttons: [
        { text: 'Hủy', role: 'cancel' },
        {
          text: 'Lưu',
          handler: (data: {
            weightKg: string;
            reps: string;
            restSeconds: string;
            effortIndex: string;
            notes: string;
          }) => {
            const weightKg = Number(data.weightKg);
            const reps = Number(data.reps);
            const restSeconds = Number(data.restSeconds);
            const effortIdxRaw = Number(data.effortIndex);
            if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) return false;
            if (!Number.isInteger(reps) || reps < 1 || reps > 100) return false;
            if (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600)
              return false;
            if (!Number.isInteger(effortIdxRaw) || effortIdxRaw < 0 || effortIdxRaw > 4)
              return false;
            const effort: WorkoutEffort | null =
              effortIdxRaw === 0 ? null : EFFORT_OPTIONS[effortIdxRaw - 1];
            const notesTrimmed = (data.notes ?? '').trim();
            void this.fitness.updateSet(set.id, {
              weightKg,
              reps,
              restSeconds,
              effort,
              notes: notesTrimmed.length > 0 ? notesTrimmed : null,
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  effortLabel(effort: WorkoutEffort | null | undefined): string {
    switch (effort) {
      case 'easy':
        return 'Dễ';
      case 'just_right':
        return 'Vừa';
      case 'hard':
        return 'Nặng';
      case 'maxed':
        return 'Tối đa';
      default:
        return '';
    }
  }
}

function inputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ? event.target.value : '';
}

// Ordering must match the helper text "1=Dễ 2=Vừa 3=Nặng 4=Tối đa".
const EFFORT_OPTIONS: readonly WorkoutEffort[] = ['easy', 'just_right', 'hard', 'maxed'] as const;
