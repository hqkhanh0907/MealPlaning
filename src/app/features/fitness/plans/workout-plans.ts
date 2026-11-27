import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, sparklesOutline } from 'ionicons/icons';
import { FitnessStore } from '../../../core/stores/fitness.store';
import {
  workoutExerciseName,
  type WorkoutPreferences,
} from '../../../core/models/workout-plan-recommendation';
import { exercisePurpose } from '../../../core/models/exercise-guides';
import {
  isTimedExercise,
  type ActiveTrainingPlan,
  type TrainingPlanDayWithExercises,
} from '../../../core/models/fitness.types';
import type { ComposedWorkoutPreview } from '../../../core/models/workout-coaching';
import { AiAvailability } from '../../../shared/ai-availability';
import { PlanPreview } from '../components/plan-preview/plan-preview';
import { PlanEditor } from '../components/plan-editor/plan-editor';
import { WorkoutPlanFinder } from '../components/workout-plan-finder/workout-plan-finder';
import { WorkoutNavigation } from '../workout-navigation';

@Component({
  selector: 'app-workout-plans',
  templateUrl: './workout-plans.html',
  styleUrl: '../fitness.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    PlanPreview,
    PlanEditor,
    WorkoutPlanFinder,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export default class WorkoutPlans {
  protected readonly fitness = inject(FitnessStore);
  protected readonly nav = inject(WorkoutNavigation);
  protected readonly ai = inject(AiAvailability);
  protected readonly timed = isTimedExercise;
  protected readonly purpose = exercisePurpose;
  protected readonly exerciseName = workoutExerciseName;
  protected readonly visit = signal(0);
  private readonly finder = viewChild(WorkoutPlanFinder);
  protected async acceptAi(): Promise<void> {
    const visit = this.visit();
    await this.fitness.acceptAiPlan();
    if (visit === this.visit() && !this.fitness.pendingAiPlan() && !this.fitness.errorMessage())
      await this.nav.today();
  }
  protected readonly aiContext = signal<WorkoutPreferences | null>(null);
  protected updateAiContext(context: WorkoutPreferences | null): void {
    this.aiContext.set(context);
    this.fitness.dismissAiPlan();
  }
  protected generateAi(): void {
    const context = this.aiContext();
    if (context) void this.fitness.generateAiCustomPlan(context);
  }
  protected readonly showFinder = signal(false);
  protected toggleFinder(): void {
    if (this.showFinder()) this.updateAiContext(null);
    this.showFinder.update((open) => !open);
  }
  protected readonly manualOpen = signal(false);
  protected readonly editor = signal<ActiveTrainingPlan | null>(null);
  protected readonly selectedDay = signal<string | null>(null);
  protected readonly previewDay = computed(() =>
    this.fitness.activePlan()?.days.find((d) => d.id === this.selectedDay()),
  );
  constructor() {
    addIcons({ arrowBackOutline, sparklesOutline });
  }
  async ionViewWillEnter(): Promise<void> {
    const visit = this.visit();
    const finder = this.finder();
    await this.fitness.initialize();
    if (visit === this.visit() && finder === this.finder()) await finder?.refreshPreview();
  }
  ionViewWillLeave(): void {
    this.visit.update((value) => value + 1);
  }
  protected dayLabel(day: number): string {
    return day ? 'Thứ ' + (day + 1) : 'Chủ nhật';
  }
  protected async applied(visit: number): Promise<void> {
    this.updateAiContext(null);
    await this.fitness.initialize();
    this.showFinder.set(false);
    this.manualOpen.set(false);
    if (visit === this.visit()) await this.nav.today();
  }
  private async openSession(start: Promise<void>): Promise<void> {
    const visit = this.visit();
    await start;
    if (visit === this.visit() && this.fitness.activeSession() && !this.fitness.errorMessage())
      await this.nav.session();
  }
  protected start(day: TrainingPlanDayWithExercises): Promise<void> {
    return this.openSession(this.fitness.startGuidedDay(day));
  }
  protected async composed(preview: ComposedWorkoutPreview): Promise<void> {
    await this.openSession(this.fitness.startComposed(preview));
    if (this.fitness.errorMessage()) await this.finder()?.refreshPreview();
  }
  protected free(): Promise<void> {
    return this.openSession(this.fitness.startFree());
  }
}
