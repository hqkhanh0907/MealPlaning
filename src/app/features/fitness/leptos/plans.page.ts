import { ChangeDetectionStrategy, Component, computed, ViewEncapsulation } from '@angular/core';
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
import WorkoutPlans from '../plans/workout-plans';
import { PlanPreview } from '../components/plan-preview/plan-preview';
import { PlanEditor } from '../components/plan-editor/plan-editor';
import { WorkoutPlanFinder } from '../components/workout-plan-finder/workout-plan-finder';
import { FitnessView, type FitnessAction } from './renderer';
import { workoutDay } from './schedule';
@Component({
  selector: 'app-leptos-workout-plans',
  templateUrl: './plans.page.html',
  styleUrl: './workout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
    FitnessView,
  ],
})
export default class LeptosWorkoutPlans extends WorkoutPlans {
  readonly snapshot = computed(() => {
    const f = this.fitness,
      p = f.activePlan();
    return JSON.stringify({
      plan: p
        ? {
            id: p.id,
            name: p.name,
            frequency: p.frequency,
            planned_exercises: p.planned_exercises,
            days: p.days.map((day) => workoutDay(day)),
          }
        : null,
      selected: this.selectedDay(),
      loading: f.loading(),
      busy: f.aiPlanLoading(),
      active: !!f.activeSession(),
    });
  });
  dispatch({ type, value }: FitnessAction): void {
    const p = this.fitness.activePlan();
    switch (type) {
      case 'finder':
        this.toggleFinder();
        break;
      case 'day':
        if (p?.days.some((day) => day.id === value)) this.selectedDay.set(value);
        break;
      case 'editPlan':
        if (
          p?.id === value &&
          !this.fitness.loading() &&
          !this.fitness.aiPlanLoading() &&
          !this.fitness.activeSession()
        )
          this.editor.set(p);
        break;
      case 'startDay': {
        const day = p?.days.find((d) => d.id === value);
        if (day && day.is_rest_day !== 1 && day.exercises.length && !this.fitness.activeSession())
          void this.start(day);
        break;
      }
    }
  }
}
