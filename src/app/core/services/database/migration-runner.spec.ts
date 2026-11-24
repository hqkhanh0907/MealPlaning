import { Database } from './database';
import { MigrationRunner, type Migration } from './migration-runner';
import { createTestDatabase, teardownTestDatabase } from './__test__/create-test-database';
import { MIGRATION_REGISTRY } from './migrations';
import { SCHEMA_VERSION } from './schema';

describe('MigrationRunner', () => {
  let db: jasmine.SpyObj<Database>;

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('DatabaseService', ['execute', 'query', 'withTransaction']);
    db.withTransaction.and.callFake((work) => work());
  });

  it('applies pending migrations in version order and stamps user_version', async () => {
    const migrations: Migration[] = [
      { version: 1, statements: ['CREATE TABLE one (id INTEGER PRIMARY KEY)'] },
      {
        version: 2,
        statements: [
          'CREATE TABLE two (id INTEGER PRIMARY KEY)',
          'CREATE INDEX idx_two_id ON two(id)',
        ],
      },
    ];
    db.query.and.resolveTo([{ user_version: 0 }]);
    db.execute.and.resolveTo();

    await new MigrationRunner(db, migrations).run();

    expect(db.query).toHaveBeenCalledWith('PRAGMA user_version;');
    expect(db.execute.calls.allArgs()).toEqual([
      ['CREATE TABLE one (id INTEGER PRIMARY KEY)'],
      ['PRAGMA user_version = 1;'],
      ['CREATE TABLE two (id INTEGER PRIMARY KEY)'],
      ['CREATE INDEX idx_two_id ON two(id)'],
      ['PRAGMA user_version = 2;'],
    ]);
  });

  it('skips all migrations when schema is already up to date', async () => {
    const migrations: Migration[] = [
      { version: 2, statements: ['CREATE TABLE ignored (id INTEGER PRIMARY KEY)'] },
    ];
    db.query.and.resolveTo([{ user_version: 2 }]);

    await new MigrationRunner(db, migrations).run();

    expect(db.execute).not.toHaveBeenCalled();
  });

  it('treats missing user_version rows as version zero', async () => {
    const migrations: Migration[] = [
      { version: 1, statements: ['CREATE TABLE first (id INTEGER PRIMARY KEY)'] },
    ];
    db.query.and.resolveTo([]);
    db.execute.and.resolveTo();

    await new MigrationRunner(db, migrations).run();

    expect(db.execute.calls.allArgs()).toEqual([
      ['CREATE TABLE first (id INTEGER PRIMARY KEY)'],
      ['PRAGMA user_version = 1;'],
    ]);
  });
});

async function removeBirthDateForOlderFixture(db: Database): Promise<void> {
  await db.execute('DROP TRIGGER require_new_profile_birth_date');
  await db.execute('DROP TRIGGER retain_profile_birth_date');
  await db.execute('ALTER TABLE user_profile DROP COLUMN birth_date');
}

describe('MigrationRunner idempotency — runtime (Story 3.1)', () => {
  it('preserves ambiguous timed entries from v7 without counting seconds as lifted kilograms', async () => {
    const db = await createTestDatabase();
    try {
      for (const column of ['planned_sets', 'planned_min', 'planned_max', 'planned_rest']) {
        await db.execute('ALTER TABLE workout_exercise DROP COLUMN ' + column);
      }
      await db.execute('ALTER TABLE workout_set DROP COLUMN duration_seconds');
      await db.execute('ALTER TABLE workout_set DROP COLUMN legacy_unit_unknown');
      await db.execute('ALTER TABLE user_profile DROP COLUMN protein_target_mode');
      await db.execute('PRAGMA user_version = 7');
      await removeBirthDateForOlderFixture(db);
      await db.execute('ALTER TABLE user_profile ADD COLUMN age INTEGER');
      await db.execute(`INSERT INTO exercise (id,name,muscle_group,category,source) VALUES
        ('ex_farmer_carry','Carry','forearms','compound','db'),('ex_back_squat','Squat','quads','compound','db')`);
      await db.execute(`INSERT INTO workout_session
        (id,date,training_day_name,mode,total_volume,started_at,status,completed_at)
        VALUES ('s','2026-11-24','Free Workout','free',827.5,'2026-11-24T08:00:00','completed','2026-11-24T08:10:00')`);
      await db.execute(`INSERT INTO workout_exercise (id,workout_session_id,exercise_id,total_volume)
        VALUES ('carry','s','ex_farmer_carry',600),('squat','s','ex_back_squat',227.5)`);
      await db.execute(`INSERT INTO workout_set (id,workout_exercise_id,set_number,weight_kg,reps,status)
        VALUES ('c','carry',1,20,30,'logged'),('a','squat',1,32.5,7,'logged')`);
      await new MigrationRunner(db, MIGRATION_REGISTRY).run();
      expect(await db.getOne('SELECT training_day_name,total_volume FROM workout_session')).toEqual(
        {
          training_day_name: 'Tập tự do',
          total_volume: 227.5,
        },
      );
      expect(
        await db.getOne(
          "SELECT weight_kg,reps,legacy_unit_unknown,duration_seconds FROM workout_set WHERE id='c'",
        ),
      ).toEqual({
        weight_kg: 20,
        reps: 30,
        legacy_unit_unknown: 1,
        duration_seconds: null,
      });
      expect(
        await db.getOne("SELECT weight_kg,reps,legacy_unit_unknown FROM workout_set WHERE id='a'"),
      ).toEqual({
        weight_kg: 32.5,
        reps: 7,
        legacy_unit_unknown: 0,
      });
    } finally {
      teardownTestDatabase();
    }
  });

  it('migrates old energy goals and preserves manual targets and previous day plans', async () => {
    const liveDb = await createTestDatabase();
    try {
      await removeBirthDateForOlderFixture(liveDb);
      await liveDb.execute('ALTER TABLE user_profile ADD COLUMN age INTEGER');
      await liveDb.execute('ALTER TABLE user_profile DROP COLUMN calorie_target_mode');
      await liveDb.execute('PRAGMA user_version = 6');
      for (const [id, age, tdee, target] of [
        ['low', 65, 1142, 642],
        ['supervised', 28, 1596, 1096],
        ['manual', 65, 1142, 1800],
        ['manual-low', 65, 1142, 1150],
        ['young', 17, 2200, 1700],
        ['adult', 30, 2600, 2100],
      ]) {
        await liveDb.execute(
          `INSERT INTO user_profile
             (id, height_cm, weight_kg, age, gender, goal, fitness_level, activity_factor, bmr, tdee, target_calories, target_protein)
           VALUES (?, 150, 50, ?, 'female', 'lose_weight', 'beginner', 1.2, 952, ?, ?, 110)`,
          [id, age, tdee, target],
        );
      }
      await liveDb.execute(
        "INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES ('past','2026-01-01',1900,110)",
      );
      await new MigrationRunner(
        liveDb,
        MIGRATION_REGISTRY.filter((m) => m.version <= 7),
      ).run();
      const rows = await liveDb.query<{
        id: string;
        target_calories: number;
        calorie_target_mode: string;
      }>('SELECT id, target_calories, calorie_target_mode FROM user_profile ORDER BY id');
      expect(rows.map((r) => [r.id, r.target_calories, r.calorie_target_mode])).toEqual([
        ['adult', 2100, 'auto'],
        ['low', 0, 'auto'],
        ['manual', 1800, 'manual'],
        ['manual-low', 1150, 'manual'],
        ['supervised', 0, 'auto'],
        ['young', 0, 'auto'],
      ]);
      expect(
        await liveDb.getOne<{ target_calories: number }>(
          "SELECT target_calories FROM day_plan WHERE id = 'past'",
        ),
      ).toEqual({ target_calories: 1900 });
    } finally {
      teardownTestDatabase();
    }
  });

  it('keeps an age-only profile available until the user enters their birth date', async () => {
    const db = await createTestDatabase();
    try {
      await removeBirthDateForOlderFixture(db);
      await db.execute('ALTER TABLE user_profile ADD COLUMN age INTEGER');
      await db.execute('ALTER TABLE user_profile ADD COLUMN birth_date TEXT');
      await db.execute('PRAGMA user_version = 10');
      await db.execute(`INSERT INTO user_profile
        (id,height_cm,weight_kg,age,gender,goal,fitness_level,bmr,tdee,target_calories,target_protein)
        VALUES ('me',170,70,29,'male','maintain','beginner',1623,2232,2100,112)`);
      const runner = new MigrationRunner(db, MIGRATION_REGISTRY);
      await runner.run();
      expect(await db.getOne('PRAGMA user_version')).toEqual({ user_version: SCHEMA_VERSION });
      expect(await db.getOne('SELECT birth_date, target_calories FROM user_profile')).toEqual({
        birth_date: null,
        target_calories: 2100,
      });
      expect(
        (await db.query<{ name: string }>('PRAGMA table_info(user_profile)')).map((c) => c.name),
      ).not.toContain('age');
      await expectAsync(
        db.execute(
          "INSERT INTO user_profile SELECT 'other',height_cm,weight_kg,NULL,gender,goal,fitness_level,activity_factor,bmr,tdee,target_calories,target_protein,target_carbs,target_fat,theme,notif_morning,notif_lunch,notif_evening,notif_weekly,onboarding_completed,created_at,updated_at,calorie_target_mode,protein_target_mode FROM user_profile",
        ),
      ).toBeRejected();
      await db.execute("UPDATE user_profile SET birth_date = '1996-11-25'");
      await runner.run();
      expect(await db.getOne('SELECT birth_date,target_calories FROM user_profile')).toEqual({
        birth_date: '1996-11-25',
        target_calories: 2100,
      });
    } finally {
      teardownTestDatabase();
    }
  });

  it('is idempotent when MigrationRunner.run() executes a second time', async () => {
    const liveDb = await createTestDatabase();
    try {
      // First run already happened inside `WebDatabase.initialize()`; capture
      // the post-init footprint to compare against.
      const beforeVersion = await liveDb.query<{ user_version: number }>('PRAGMA user_version;');
      expect(beforeVersion[0].user_version).toBe(SCHEMA_VERSION);

      const beforeTables = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'index', 'view') AND name NOT LIKE 'sqlite_%'`,
      );

      // Insert a sentinel row so the test can detect a hidden DROP+CREATE
      // regression: if the runner ever stops filtering `version > current`
      // and replays v2 (which DROPs planned_dish/meal_slot/day_plan), this
      // row disappears even though `user_version` and table count remain
      // unchanged. Counting rows survives that regression where counting
      // tables does not.
      const dayId = crypto.randomUUID();
      const slotId = crypto.randomUUID();
      await liveDb.execute(
        `INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES (?, ?, ?, ?)`,
        [dayId, '2026-05-10', 2000, 150],
      );
      await liveDb.execute(`INSERT INTO meal_slot (id, day_plan_id, meal_type) VALUES (?, ?, ?)`, [
        slotId,
        dayId,
        'breakfast',
      ]);

      // Run the registry again on the same DB — must not redo migrations.
      await new MigrationRunner(liveDb, MIGRATION_REGISTRY).run();

      const afterVersion = await liveDb.query<{ user_version: number }>('PRAGMA user_version;');
      const afterTables = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'index', 'view') AND name NOT LIKE 'sqlite_%'`,
      );
      const afterDayPlanCount = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM day_plan WHERE id = ?`,
        [dayId],
      );
      const afterMealSlotCount = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM meal_slot WHERE id = ?`,
        [slotId],
      );

      expect(afterVersion[0].user_version).toBe(SCHEMA_VERSION);
      expect(afterTables[0].count).toBe(beforeTables[0].count);
      // Sentinel rows survive — proves replay was actually skipped, not
      // re-executed-and-recreated-with-same-shape.
      expect(afterDayPlanCount[0].count).toBe(1);
      expect(afterMealSlotCount[0].count).toBe(1);
    } finally {
      teardownTestDatabase();
    }
  });

  it('migrates protein provenance without changing historical gram amounts', async () => {
    const db = await createTestDatabase();
    try {
      await db.execute('ALTER TABLE user_profile DROP COLUMN protein_target_mode');
      await db.execute('PRAGMA user_version = 8');
      await removeBirthDateForOlderFixture(db);
      await db.execute('ALTER TABLE user_profile ADD COLUMN age INTEGER');
      for (const grams of [104, 137]) {
        await db.execute(
          `INSERT INTO user_profile
           (id,height_cm,weight_kg,age,gender,goal,fitness_level,activity_factor,bmr,tdee,target_calories,target_protein)
           VALUES (?,170,65,28,'male','maintain','beginner',1.55,1564,2424,2424,?)`,
          [String(grams), grams],
        );
      }
      await new MigrationRunner(
        db,
        MIGRATION_REGISTRY.filter((m) => m.version <= 9),
      ).run();
      expect(
        await db.query(
          'SELECT target_protein, protein_target_mode FROM user_profile ORDER BY target_protein',
        ),
      ).toEqual([
        { target_protein: 104, protein_target_mode: 'auto' },
        { target_protein: 137, protein_target_mode: 'manual' },
      ]);
    } finally {
      teardownTestDatabase();
    }
  });
});
