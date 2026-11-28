import {
  Component,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
  forwardRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ExercisePickerSheet } from '../../../shared/components/exercise-picker-sheet/exercise-picker-sheet';
import { AppFormField } from '../../../shared/forms';
import { FitnessView, createFitnessIndex, type FitnessAction, type FitnessIndex } from './renderer';
import {
  indexExercise,
  type ExerciseDiscoveryEntry,
} from '../../../core/models/exercise-discovery';
import { normalize } from '../../../core/utils/fuzzy-match';
@Component({
  selector: 'app-leptos-exercise-picker',
  templateUrl: './picker.html',
  styleUrl: './picker.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ExercisePickerSheet, useExisting: forwardRef(() => LeptosExercisePicker) },
  ],
  imports: [
    NgTemplateOutlet,
    FormField,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    AppFormField,
    FitnessView,
  ],
})
export class LeptosExercisePicker extends ExercisePickerSheet {
  private readonly entries = computed(() => this.exercises().map(indexExercise));
  private indexed?: readonly ExerciseDiscoveryEntry[];
  private indexHandle?: FitnessIndex;
  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.indexHandle?.free());
  }
  private readonly matched = computed(() => {
    const entries = this.entries();
    if (entries !== this.indexed || !this.indexHandle) {
      const handle = createFitnessIndex(
        JSON.stringify(
          entries.map(({ exercise, primary, secondary, required, equipment, searchTerms }) => ({
            id: exercise.id,
            primary,
            secondary,
            required,
            equipment,
            searchTerms,
          })),
        ),
      );
      this.indexHandle?.free();
      this.indexHandle = handle;
      this.indexed = entries;
    }
    const filters = {
      query: normalize(this.query()),
      muscle: this.muscle(),
      gear: this.equipment(),
      available: this.place()?.equipment ?? null,
    };
    const positions = JSON.parse(this.indexHandle.query(JSON.stringify(filters))) as [
      number,
      'primary' | 'secondary' | null,
    ][];
    return positions.map(([position, match]) => ({ row: entries[position], match }));
  });
  private readonly shown = computed(() =>
    this.embedded() ? this.matched().slice(0, this.limit()) : this.matched(),
  );
  readonly snapshot = computed(() => {
    const place = this.place(),
      muscle = this.muscle();
    return JSON.stringify({
      total: this.matched().length,
      embedded: this.embedded(),
      query: this.query(),
      filtered: this.hasFilters(),
      place: place?.name ?? null,
      known: place?.equipment != null,
      group: muscle ? this.muscleLabels[muscle] : null,
      rows: this.shown().map(({ row: r, match }) => ({
        id: r.exercise.id,
        name: r.exercise.name_vi || r.exercise.name,
        match,
        equipment: r.required?.map((k) => this.equipmentLabel(k)) ?? null,
      })),
    });
  });
  dispatch({ type, value }: FitnessAction, search: HTMLInputElement): void {
    switch (type) {
      case 'pick':
        if (this.shown().some((r) => r.row.exercise.id === value)) this.pick(value);
        break;
      case 'more':
        this.limit.update((n) => n + 40);
        break;
      case 'reset':
        this.clearFilters();
        break;
      case 'clearQuery':
        this.query.set('');
        search.focus();
        break;
    }
  }
}
