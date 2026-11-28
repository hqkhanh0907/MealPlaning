const { copyFileSync } = require('node:fs');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { MigrationRunner } = require('../../../src/app/core/services/database/migration-runner.ts');
const { MIGRATION_REGISTRY } = require('../../../src/app/core/services/database/migrations.ts');
const { prepareWorkspace } = require('../../../src/app/core/account/workspace-snapshot.ts');

async function migrate(file, migrations) {
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const adapter = {
      query: (sql) => db.prepare(sql).all(),
      execute: (sql) => db.exec(sql),
      async executeAtomically(statements) {
        await this.withTransaction(() => {
          for (const { statement, values } of statements) db.prepare(statement).run(...values);
        });
      },
      async withTransaction(operation) {
        db.exec('BEGIN');
        try {
          await operation();
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    };
    await new MigrationRunner(adapter, migrations).run();
    if (migrations === MIGRATION_REGISTRY) await prepareWorkspace(adapter);
  } finally {
    db.close();
  }
}

async function main(directory) {
  const file = join(directory, 'healthmate_legacyaccount01SQLite.db');
  await migrate(file, MIGRATION_REGISTRY.filter((migration) => migration.version <= 2));
  const db = new DatabaseSync(file);
  try {
    db.exec(`
      PRAGMA foreign_keys=ON;
      INSERT INTO user_profile
        (id,height_cm,weight_kg,age,gender,goal,fitness_level,bmr,tdee,target_calories,target_protein)
        VALUES ('00100000-0000-4000-8000-000000000001',169.5,62,28,'female','maintain','beginner',1400,1900,1900,99);
      INSERT INTO ingredient(id,name,category,calories,protein) VALUES
        ('00100000-0000-4000-8000-000000000002','Đậu hũ','Đậu & Hạt',82.5,8.25);
      INSERT INTO dish(id,name,type,servings) VALUES
        ('00100000-0000-4000-8000-000000000003','Đậu hũ hấp','ingredient_based',1.5);
      INSERT INTO dish_ingredient(id,dish_id,ingredient_id,gram_weight)
        SELECT '00100000-0000-4000-8000-000000000004',dish.id,ingredient.id,175.5 FROM dish,ingredient;
      INSERT INTO day_plan(id,date,target_calories,target_protein) VALUES
        ('00100000-0000-4000-8000-000000000005','2026-05-12',1900,99);
      INSERT INTO meal_slot(id,day_plan_id,meal_type,position)
        SELECT '00100000-0000-4000-8000-000000000006',id,'lunch',1 FROM day_plan;
      INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,sort_order,is_completed,completed_at,calories,protein,carbs,fat)
        SELECT '00100000-0000-4000-8000-000000000007',meal_slot.id,dish.id,1.25,0,1,'2026-05-12T05:01:02.345Z',105.5,9.25,5.5,1.5 FROM meal_slot,dish;
      INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,sort_order)
        SELECT '00100000-0000-4000-8000-000000000008',meal_slot.id,dish.id,0.5,1 FROM meal_slot,dish;
      INSERT INTO exercise(id,name,name_vi,muscle_group,category,source) VALUES
        ('00100000-0000-4000-8000-000000000009','Bench press','Đẩy ngực','chest','compound','custom');
      INSERT INTO workout_session(id,date,mode,total_volume,started_at,completed_at) VALUES
        ('00100000-0000-4000-8000-000000000010','2026-05-12','free',240,'2026-05-12T07:00:00.000Z','2026-05-12T07:10:00.000Z');
      INSERT INTO workout_exercise(id,workout_session_id,exercise_id,total_volume)
        SELECT '00100000-0000-4000-8000-000000000011',workout_session.id,exercise.id,240 FROM workout_session,exercise;
      INSERT INTO workout_set(id,workout_exercise_id,set_number,weight_kg,reps,effort,created_at)
        SELECT '00100000-0000-4000-8000-000000000012',id,1,40,6,'just_right','2026-05-12T07:05:00.123Z' FROM workout_exercise;
      INSERT INTO app_config(key,value,updated_at) VALUES
        ('fitness_default_place','home','2026-05-12T07:05:00.123Z');
    `);
  } finally {
    db.close();
  }
  const reference = join(directory, 'typescript.db');
  copyFileSync(file, reference);
  await migrate(reference, MIGRATION_REGISTRY);
}

main(process.argv[2]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
