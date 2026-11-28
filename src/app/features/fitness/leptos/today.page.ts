import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import WorkoutToday from '../today/workout-today';
import { FitnessView, type FitnessAction } from './renderer';
import { workoutDay } from './schedule';

@Component({
  selector: 'app-leptos-workout-today',
  templateUrl: './today.page.html',
  styleUrl: './workout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
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
export default class LeptosWorkoutToday extends WorkoutToday {
  private readonly router = inject(Router);
  readonly snapshot = computed(() => {
    const f = this.fitness,
      day = f.todayDay(),
      session = f.activeSession();
    return JSON.stringify({
      loading: f.loading(),
      error: f.errorMessage(),
      success: f.successMessage(),
      progress: !!f.progress(),
      undo: !!f.lastCancelledSessionId(),
      current: session
        ? { title: session.training_day_name, count: session.exercises.length }
        : null,
      plan: !!f.activePlan(),
      day: day ? workoutDay(day, (id) => f.lastPerformance(id)) : null,
    });
  });
  dispatch({ type }: FitnessAction): void {
    switch (type) {
      case 'retry':
        void this.fitness.initialize();
        break;
      case 'free':
        void this.start(false);
        break;
      case 'guided':
        void this.start(true);
        break;
      case 'resume':
        void this.nav.session();
        break;
      case 'plans':
        void this.router.navigateByUrl('/training/plans');
        break;
      case 'undo':
        void this.fitness.undoCancelWorkout();
        break;
      case 'dismissUndo':
        this.fitness.dismissCancelUndo();
        break;
    }
  }
}
