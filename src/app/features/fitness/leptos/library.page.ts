import { ChangeDetectionStrategy, Component } from '@angular/core';
import WorkoutLibrary from '../library/workout-library';
import { ExerciseGuideSheet } from '../components/exercise-guide-sheet/exercise-guide-sheet';
import { LeptosExercisePicker } from './picker';
@Component({
  selector: 'app-leptos-workout-library',
  templateUrl: './library.page.html',
  styleUrl: '../library/workout-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LeptosExercisePicker, ExerciseGuideSheet],
})
export default class LeptosWorkoutLibrary extends WorkoutLibrary {}
