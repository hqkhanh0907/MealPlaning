export type WorkoutConflictSide = 'local' | 'server';
export type WorkoutConflictChoices = Record<string, WorkoutConflictSide>;

interface WorkoutConflictItemBase {
  key: string;
  sessionId: string;
  sessionDate: string;
  local: number | null;
  server: number | null;
}

export type WorkoutConflictItem = WorkoutConflictItemBase &
  (
    | {
        kind: 'workout_set_field';
        exerciseName: string;
        setNumber: number;
        field: 'weight_kg' | 'reps' | 'duration_seconds';
      }
    | { kind: 'workout_session_delete' }
  );

export interface WorkoutSyncConflict {
  operationId: string;
  revision: number;
  items: WorkoutConflictItem[];
}

export interface WorkoutConflictResolution {
  operationId: string;
  revision: number;
  choices: WorkoutConflictChoices;
}
