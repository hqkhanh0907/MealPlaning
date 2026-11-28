import { ChangeDetectionStrategy, Component, computed, ViewEncapsulation } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { LeptosExercisePicker } from './picker';
import { WorkoutSummaryModal } from '../../../shared/components/workout-summary-modal/workout-summary-modal';
import FitnessPage from '../fitness.page';
import { ExerciseGuideSheet } from '../components/exercise-guide-sheet/exercise-guide-sheet';
import { WorkoutSubstitution } from '../components/workout-substitution/workout-substitution';
import { RestTimer } from '../components/rest-timer/rest-timer';
import { FitnessView, type FitnessAction } from './renderer';
@Component({
  selector: 'app-leptos-workout-session',
  templateUrl: './session.page.html',
  styleUrl: './workout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RestTimer,
    ExerciseGuideSheet,
    WorkoutSubstitution,
    LeptosExercisePicker,
    WorkoutSummaryModal,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    FitnessView,
  ],
})
export default class LeptosWorkoutSession extends FitnessPage {
  readonly tabsJson = computed(() =>
    JSON.stringify({
      selected: this.fitness.selectedWorkoutExercise()?.id ?? null,
      rows: (this.fitness.activeSession()?.exercises ?? []).map((e) => ({
        id: e.id,
        name: e.exercise_name_vi || e.exercise_name,
        states: e.sets.map((s) => s.status),
      })),
    }),
  );
  readonly snapshot = computed(() => {
    const selected = this.fitness.selectedWorkoutExercise();
    return JSON.stringify({
      exercise: selected?.exercise_id ?? '',
      rows: selected?.sets ?? [],
      draft: this.fitness.setDraft(),
      busy: this.fitness.savingSet(),
    });
  });
  dispatch({ type, value }: FitnessAction): void {
    const f = this.fitness;
    switch (type) {
      case 'reveal':
        void this.revealSetEntry();
        break;
      case 'weight':
        f.updateWeight(value);
        break;
      case 'reps':
        f.updateReps(value);
        break;
      case 'rest':
        f.updateRestSeconds(value);
        break;
      case 'notes':
        f.updateNotes(value);
        break;
      case 'logSet':
      case 'skipSet':
      case 'repeatLastSet':
        this.submitSet(type);
        break;
      case 'selectExercise':
        if (f.activeSession()?.exercises.some((e) => e.id === value))
          f.selectWorkoutExercise(value);
        break;
      case 'effort':
        if (value === 'easy' || value === 'just_right' || value === 'hard' || value === 'maxed')
          this.setEffort(value);
        break;
      case 'deleteSet': {
        const set = f.selectedWorkoutExercise()?.sets.find((s) => s.id === value);
        if (set) void this.confirmDeleteSet(set.id, set.set_number);
        break;
      }
    }
  }
}
