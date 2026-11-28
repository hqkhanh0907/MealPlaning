import { ChangeDetectionStrategy, Component, computed, ViewEncapsulation } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import type { WorkoutSessionDetail } from '../../../core/models/fitness.types';
import FitnessHistoryPage from '../history/history.page';
import { FitnessView, type FitnessAction } from './renderer';
@Component({
  selector: 'app-leptos-workout-history',
  templateUrl: './history.page.html',
  styleUrl: './history.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
    FitnessView,
  ],
})
export default class LeptosWorkoutHistory extends FitnessHistoryPage {
  readonly trendJson = computed(() =>
    JSON.stringify({
      error: this.trendError(),
      open: this.trendOpen(),
      stats: this.progress(),
      weeks: this.weeks().map((w) => ({ ...w, label: this.formatSessionDate(w.date) })),
    }),
  );
  trendAction({ type }: FitnessAction): void {
    if (type === 'reloadTrend') void this.refreshTrend();
    if (type === 'toggleTrend') this.trendOpen.update((v) => !v);
  }
  readonly snapshots = computed(
    () =>
      new Map(
        this.groups().flatMap((group) =>
          group.sessions.map((s) => [s.id, this.snapshotFor(s)] as const),
        ),
      ),
  );
  private snapshotFor(s: WorkoutSessionDetail): string {
    const p = this.replayPreview();
    return JSON.stringify({
      id: s.id,
      date: s.date,
      dateLabel: this.formatSessionDate(s.date),
      title: s.training_day_name,
      mode: s.mode,
      volume: s.total_volume,
      minutes: s.duration_minutes,
      saving: this.saving(),
      exercises: s.exercises.map((ex) => ({
        id: ex.exercise_id,
        name: ex.exercise_name_vi || ex.exercise_name,
        unit: this.unitNote(ex.exercise_id),
        note: ex.completion_note ?? null,
        sets: ex.sets.map((row) => ({
          id: row.id,
          set_number: row.set_number,
          status: row.status,
          weight_kg: row.weight_kg,
          reps: row.reps,
          duration_seconds: row.duration_seconds,
          legacy_unit_unknown: row.legacy_unit_unknown,
          effort: row.effort,
        })),
      })),
      busy: this.replayBusy(),
      active: this.activeWorkout(),
      preview: p?.id === s.id ? { place: p.place, exercises: p.exercises } : null,
    });
  }
  dispatch({ type, value }: FitnessAction, session: WorkoutSessionDetail): void {
    switch (type) {
      case 'editSet': {
        for (const ex of session.exercises) {
          const set = ex.sets.find((s) => s.id === value);
          if (set) {
            this.editSet(session.id, ex.exercise_id, set);
            break;
          }
        }
        break;
      }
      case 'prepareReplay':
        if (session.id === value) void this.prepareReplay(session);
        break;
      case 'startReplay':
        if (this.replayPreview()?.id === value && !this.activeWorkout()) void this.startReplay();
        break;
      case 'resume':
        void this.nav.session();
        break;
      case 'clear':
        this.clearAction();
        break;
    }
  }
}
