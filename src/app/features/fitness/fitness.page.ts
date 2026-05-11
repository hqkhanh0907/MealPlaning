import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  barbellOutline,
  bodyOutline,
  calendarOutline,
  checkmarkCircleOutline,
  flashOutline,
  flameOutline,
  pulseOutline,
  settingsOutline,
  sparklesOutline,
  statsChartOutline,
  timerOutline,
} from 'ionicons/icons';
import { FitnessStore } from '../../core/stores/fitness.store';
import { RestTimer } from './components/rest-timer/rest-timer';
import type { WorkoutEffort } from '../../core/models/fitness.types';

@Component({
  selector: 'app-fitness',
  templateUrl: './fitness.page.html',
  styleUrl: './fitness.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RestTimer, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon],
})
export default class FitnessPage {
  private readonly router = inject(Router);
  protected readonly fitness = inject(FitnessStore);

  constructor() {
    addIcons({
      addOutline,
      barbellOutline,
      bodyOutline,
      calendarOutline,
      checkmarkCircleOutline,
      flashOutline,
      flameOutline,
      pulseOutline,
      settingsOutline,
      sparklesOutline,
      statsChartOutline,
      timerOutline,
    });
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

  onSearchInput(event: Event): void {
    this.fitness.updateExerciseSearch(inputValue(event));
  }

  setEffort(effort: WorkoutEffort | null): void {
    this.fitness.updateEffort(effort);
  }

  barWidth(value: number, max: number): string {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return '0%';
    return `${Math.max(0, Math.min(100, Math.round((value / max) * 100)))}%`;
  }
}

function inputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ? event.target.value : '';
}
