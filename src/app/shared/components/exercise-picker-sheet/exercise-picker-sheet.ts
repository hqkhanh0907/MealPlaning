import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline, searchOutline } from 'ionicons/icons';
import { FitnessStore } from '../../../core/stores/fitness.store';

function inputValue(event: Event): string {
  const target = event.target as HTMLInputElement | null;
  return target?.value ?? '';
}

/**
 * Free-mode exercise picker presented as a bottom-sheet modal.
 *
 * Replaces the inline `.free-mode` block previously embedded inside the
 * fitness hub. Single responsibility: search + tap-to-add. State (search
 * query, filtered list, addExerciseToActive) lives in FitnessStore — this
 * component is a thin presenter so the hub stays focused on planned-day
 * overview + active session controls.
 *
 * Two-way `isOpen` pattern; emits `closed` on dismiss. After tapping an
 * exercise chip the sheet auto-dismisses to confirm the action (matches
 * Apple sheet UX: pick → commit → close).
 */
@Component({
  selector: 'app-exercise-picker-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon],
  templateUrl: './exercise-picker-sheet.html',
  styleUrl: './exercise-picker-sheet.scss',
})
export class ExercisePickerSheet {
  protected readonly fitness = inject(FitnessStore);

  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  private readonly _isOpen = signal(false);

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly exerciseAdded = new EventEmitter<string>();

  constructor() {
    addIcons({ addOutline, closeOutline, searchOutline });
  }

  protected onSearchInput(event: Event): void {
    this.fitness.updateExerciseSearch(inputValue(event));
  }

  protected async onPick(exerciseId: string): Promise<void> {
    this.exerciseAdded.emit(exerciseId);
    await this.fitness.addExerciseToActive(exerciseId);
    this.close();
  }

  protected close(): void {
    this._isOpen.set(false);
    this.closed.emit();
  }

  protected onIonDismiss(): void {
    if (this._isOpen()) {
      this.close();
    }
  }
}
