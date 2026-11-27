import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { arrowBackOutline, barbellOutline, calendarOutline, flashOutline } from 'ionicons/icons';
import { FitnessStore } from '../../../core/stores/fitness.store';
import { exercisePurpose } from '../../../core/models/exercise-guides';
import { isTimedExercise } from '../../../core/models/fitness.types';
import { WorkoutNavigation } from '../workout-navigation';

@Component({
  selector: 'app-workout-today',
  templateUrl: './workout-today.html',
  styleUrl: '../fitness.page.scss',
  imports: [
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WorkoutToday {
  private visit = 0;
  protected readonly fitness = inject(FitnessStore);
  protected readonly nav = inject(WorkoutNavigation);
  protected readonly timed = isTimedExercise;
  protected readonly purpose = exercisePurpose;

  constructor() {
    addIcons({ arrowBackOutline, barbellOutline, calendarOutline, flashOutline });
  }

  ionViewWillEnter(): void {
    void this.fitness.initialize();
  }

  ionViewWillLeave(): void {
    this.visit++;
  }

  protected async start(guided: boolean): Promise<void> {
    const visit = this.visit;
    if (guided) await this.fitness.startTodayGuided();
    else await this.fitness.startFree();
    if (visit === this.visit && this.fitness.activeSession() && !this.fitness.errorMessage())
      await this.nav.session();
  }
}
