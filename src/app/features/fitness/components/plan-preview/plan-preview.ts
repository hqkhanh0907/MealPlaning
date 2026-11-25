import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { exercisePurpose } from '../../../../core/models/exercise-guides';
import type { PlannedExerciseWithExercise } from '../../../../core/models/fitness.types';
import { TrainingPlanRepository } from '../../../../core/repositories/training-plan.repository';
import { ExerciseGuideSheet } from '../exercise-guide-sheet/exercise-guide-sheet';

@Component({
  selector: 'app-plan-preview',
  imports: [ExerciseGuideSheet],
  templateUrl: './plan-preview.html',
  styleUrl: './plan-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPreview {
  private readonly plans = inject(TrainingPlanRepository);
  readonly planId = input.required<string>();
  protected readonly expanded = signal(false);
  protected readonly guideExercise = signal<PlannedExerciseWithExercise | null>(null);
  protected readonly details = resource({
    params: () => (this.expanded() ? this.planId() : undefined),
    loader: ({ params }) => this.plans.getPlanDays(params),
  });
  protected readonly trainingDays = computed(
    () => this.details.value()?.filter((day) => !day.is_rest_day) ?? [],
  );
  protected readonly purpose = exercisePurpose;
}
