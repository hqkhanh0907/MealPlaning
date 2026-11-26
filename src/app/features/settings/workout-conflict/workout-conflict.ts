import { Component, computed, inject, input, signal } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { AccountSync } from '../../../core/account/account-sync';
import {
  type WorkoutConflictChoices,
  type WorkoutConflictItem,
  type WorkoutConflictSide,
  type WorkoutSyncConflict,
} from '../../../core/account/workout-sync-conflict';

@Component({
  selector: 'app-workout-conflict',
  imports: [IonButton],
  templateUrl: './workout-conflict.html',
  styleUrl: './workout-conflict.scss',
})
export class WorkoutConflict {
  readonly conflict = input.required<WorkoutSyncConflict>();
  private readonly accountSync = inject(AccountSync);
  private readonly selection = signal<{
    conflict: WorkoutSyncConflict;
    choices: WorkoutConflictChoices;
  } | null>(null);
  protected readonly choices = computed(() => {
    const selected = this.selection();
    return selected?.conflict === this.conflict() ? selected.choices : {};
  });
  protected readonly complete = computed(() => {
    const items = this.conflict().items;
    return items.length > 0 && items.every((item) => this.choices()[item.key]);
  });

  protected choose(item: WorkoutConflictItem, side: WorkoutConflictSide): void {
    this.selection.set({
      conflict: this.conflict(),
      choices: { ...this.choices(), [item.key]: side },
    });
  }

  protected apply(): void {
    if (this.complete()) void this.accountSync.resolveWorkoutConflict(this.choices());
  }

  protected label(item: WorkoutConflictItem): string {
    if (item.kind === 'workout_session_delete') return `Buổi tập ${item.sessionDate}`;
    const field = { weight_kg: 'Mức tạ', reps: 'Số lần', duration_seconds: 'Thời gian' }[
      item.field
    ];
    const exercise = item.exerciseName ? ` · ${item.exerciseName}` : '';
    return `${item.sessionDate}${exercise} · Hiệp ${item.setNumber} · ${field}`;
  }

  protected value(item: WorkoutConflictItem, side: WorkoutConflictSide): string {
    const value = item[side];
    if (item.kind === 'workout_session_delete') {
      return value === null ? 'Xóa buổi tập' : `Giữ buổi tập · ${value} kg`;
    }
    if (value === null) return 'Chưa có giá trị';
    const unit = { weight_kg: 'kg', reps: 'lần', duration_seconds: 'giây' }[item.field];
    return `${value} ${unit}`;
  }
}
