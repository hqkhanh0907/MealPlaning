import { inject, Injectable, InjectionToken } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { AccountSession, type AccountIdentity } from './account-session';
import { accountData, type DataPort, type DataResult } from './bound-data';
import type { WorkoutSetInput } from '../models/fitness-workout-set';

type Measurements = Pick<WorkoutSetInput, 'weightKg' | 'reps'> & {
  durationSeconds?: number | null | 'invalid';
};
export type WorkoutCommand =
  | { op: 'getActiveSession' }
  | { op: 'getSession'; sessionId: string }
  | { op: 'completeSession'; sessionId: string; now: string | null }
  | {
      op: 'addSet';
      exerciseId: string;
      setId: string;
      input: Measurements & Omit<WorkoutSetInput, 'weightKg' | 'reps' | 'durationSeconds'>;
      now: string;
    }
  | { op: 'skipSet'; exerciseId: string; setId: string; weightKg: number; reps: number }
  | {
      op: 'reviseCompletedSet';
      sessionId: string;
      setId: string;
      input: Measurements;
      now: string;
    };

const native = registerPlugin<DataPort<WorkoutCommand>>('MealPlanWorkout');
export const WORKOUT_PORT = new InjectionToken<DataPort<WorkoutCommand>>('MealPlanWorkout', {
  providedIn: 'root',
  factory: () => ({ binding: (o) => native.binding(o), apply: (o) => native.apply(o) }),
});

export function workoutWireInput<
  T extends Pick<WorkoutSetInput, 'weightKg' | 'reps' | 'durationSeconds'>,
>(input: T): Omit<T, 'durationSeconds'> & Measurements {
  const duration = input.durationSeconds;
  // JSON serializes non-finite numbers as null, which is a valid absent duration for repetitions.
  return {
    ...input,
    durationSeconds: duration != null && !Number.isFinite(duration) ? 'invalid' : duration,
  };
}

@Injectable({ providedIn: 'root' })
export class WorkoutData {
  private readonly port = inject(WORKOUT_PORT);
  readonly current = inject(AccountSession).current;
  assertOwner(expected: AccountIdentity | null | undefined): void {
    if (!expected) throw Error('Workout account required.');
    if (this.current() !== expected) throw Error('Workout account changed.');
  }
  run<T>(command: WorkoutCommand): Promise<DataResult<T>> {
    return accountData<T, WorkoutCommand>(this.current, command, this.port, 'workout');
  }
}
