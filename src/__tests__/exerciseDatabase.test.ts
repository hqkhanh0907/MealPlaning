import type { ExerciseSeed } from '../features/fitness/data/exerciseDatabase';
import { EXERCISES, seedExercises } from '../features/fitness/data/exerciseDatabase';
import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/*  Mock DatabaseService                                                 */
/* ------------------------------------------------------------------ */
function createMockDb(): DatabaseService & { rows: Record<string, unknown>[] } {
  const rows: Record<string, unknown>[] = [];
  return {
    rows,
    initialize: vi.fn(),
    execute: vi.fn(async (_sql: string, params?: unknown[]) => {
      if (params) rows.push({ id: params[0] });
    }),
    query: vi.fn(async () => [{ count: rows.length }]) as DatabaseService['query'],
    queryOne: vi.fn(async () => null),
    transaction: vi.fn(async (fn: () => Promise<void>) => fn()),
    exportBinary: vi.fn().mockReturnValue(new Uint8Array()),
    importBinary: vi.fn(),
    exportToJSON: vi.fn(async () => '{}'),
    importFromJSON: vi.fn(),
  };
}

/* ------------------------------------------------------------------ */
/*  Valid values from schema                                             */
/* ------------------------------------------------------------------ */
const VALID_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes', 'cardio'] as const;

const VALID_CATEGORIES = ['compound', 'secondary', 'isolation'] as const;
const VALID_EXERCISE_TYPES = ['strength', 'cardio'] as const;

/* ================================================================== */
/*  Tests                                                                */
/* ================================================================== */
describe('exerciseDatabase', () => {
  /* ---------------------------------------------------------------- */
  /*  Data integrity                                                    */
  /* ---------------------------------------------------------------- */
  it('contains between 130 and 170 exercises', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(130);
    expect(EXERCISES.length).toBeLessThanOrEqual(170);
  });

  it('every exercise has all required fields', () => {
    const requiredKeys: (keyof ExerciseSeed)[] = [
      'id',
      'nameVi',
      'nameEn',
      'muscleGroup',
      'secondaryMuscles',
      'category',
      'equipment',
      'contraindicated',
      'exerciseType',
      'defaultRepsMin',
      'defaultRepsMax',
      'isCustom',
    ];

    for (const ex of EXERCISES) {
      for (const key of requiredKeys) {
        expect(ex).toHaveProperty(key);
      }
      expect(ex.nameVi.length).toBeGreaterThan(0);
      expect(ex.nameEn.length).toBeGreaterThan(0);
      expect(ex.defaultRepsMin).toBeLessThanOrEqual(ex.defaultRepsMax);
      expect(ex.isCustom).toBe(false);
    }
  });

  it('all IDs are unique', () => {
    const ids = EXERCISES.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all muscleGroup values are valid', () => {
    for (const ex of EXERCISES) {
      expect(VALID_MUSCLE_GROUPS).toContain(ex.muscleGroup);
    }
  });

  it('all category values are valid', () => {
    for (const ex of EXERCISES) {
      expect(VALID_CATEGORIES).toContain(ex.category);
    }
  });

  it('all exerciseType values are valid', () => {
    for (const ex of EXERCISES) {
      expect(VALID_EXERCISE_TYPES).toContain(ex.exerciseType);
    }
  });

  it('each muscle group has at least 5 exercises', () => {
    for (const group of VALID_MUSCLE_GROUPS) {
      const count = EXERCISES.filter(e => e.muscleGroup === group).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });

  /* ---------------------------------------------------------------- */
  /*  seedExercises                                                      */
  /* ---------------------------------------------------------------- */
  it('inserts all exercises into DB', async () => {
    const db = createMockDb();
    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ count: 0 }]);

    const inserted = await seedExercises(db);

    expect(inserted).toBe(EXERCISES.length);
    expect(db.execute).toHaveBeenCalledTimes(EXERCISES.length);
  });

  it('is idempotent — second call returns 0', async () => {
    const db = createMockDb();

    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ count: 0 }]);
    const first = await seedExercises(db);
    expect(first).toBe(EXERCISES.length);

    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ count: EXERCISES.length }]);
    const second = await seedExercises(db);
    expect(second).toBe(0);
  });
});
