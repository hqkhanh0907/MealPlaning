import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { ExercisePickerSheet } from '../../../shared/components/exercise-picker-sheet/exercise-picker-sheet';
import { ExerciseGuideSheet } from '../components/exercise-guide-sheet/exercise-guide-sheet';
import { FitnessStore } from '../../../core/stores/fitness.store';
import { WorkoutNavigation } from '../workout-navigation';

@Component({
  selector: 'app-workout-library',
  templateUrl: './workout-library.html',
  styleUrl: './workout-library.scss',
  imports: [ExercisePickerSheet, ExerciseGuideSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WorkoutLibrary {
  protected readonly fitness = inject(FitnessStore);
  protected readonly nav = inject(WorkoutNavigation);
  protected readonly guideId = signal<string | null>(null);
  protected readonly guide = computed(() =>
    this.fitness.exercises().find((e) => e.id === this.guideId()),
  );
  private readonly picker = viewChild(ExercisePickerSheet);
  private readonly platform = inject(Platform);
  private back?: Subscription;
  ionViewWillEnter(): void {
    void this.fitness.initialize();
    this.back?.unsubscribe();
    this.back = this.platform.backButton.subscribeWithPriority(10, (next) => {
      if (!this.picker()?.backInLibrary()) next();
    });
  }
  ionViewWillLeave(): void {
    this.back?.unsubscribe();
  }
}
