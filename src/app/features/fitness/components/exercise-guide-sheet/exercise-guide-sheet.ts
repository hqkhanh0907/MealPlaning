import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { exerciseGuide } from '../../../../core/models/exercise-guides';

@Component({
  selector: 'app-exercise-guide-sheet',
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
  templateUrl: './exercise-guide-sheet.html',
  styleUrl: './exercise-guide-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseGuideSheet {
  readonly exerciseId = input.required<string>();
  readonly exerciseName = input.required<string>();
  readonly closed = output<void>();
  protected readonly guide = computed(() => exerciseGuide(this.exerciseId()));
  protected readonly failedFrames = signal<readonly string[]>([]);
  protected readonly open = signal(true);
}
