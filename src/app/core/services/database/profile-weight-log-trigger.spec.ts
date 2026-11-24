import { createTestDatabase, teardownTestDatabase } from './__test__/create-test-database';

describe('profile weight measurements', () => {
  afterEach(teardownTestDatabase);

  it('logs changed weight once per local day and keeps past entries and notes', async () => {
    const db = await createTestDatabase();
    await db.execute(`INSERT INTO user_profile
      (id, height_cm, weight_kg, age, gender, goal, fitness_level, bmr, tdee, target_calories, target_protein)
      VALUES ('test', 170, 70, 30, 'male', 'maintain', 'beginner', 1600, 2100, 2100, 100)`);
    await db.execute(
      "INSERT INTO weight_log (id, weight_kg, date) VALUES ('past', 72, '2001-01-01')",
    );
    await db.execute('UPDATE user_profile SET weight_kg = 70, age = 31');
    expect(await db.query('SELECT id FROM weight_log')).toEqual([{ id: 'past' }]);
    await db.execute('UPDATE user_profile SET weight_kg = 68.5');
    const [today] = await db.query<{ date: string; id: string }>(
      "SELECT date, id FROM weight_log WHERE date = date('now', 'localtime')",
    );
    expect(today.id).toBeTruthy();
    await db.execute("UPDATE weight_log SET notes = 'Buổi sáng' WHERE id = ?", [today.id]);
    await db.execute('UPDATE user_profile SET weight_kg = 68');
    expect(
      await db.query('SELECT id, date, weight_kg, notes FROM weight_log ORDER BY date'),
    ).toEqual([
      { id: 'past', date: '2001-01-01', weight_kg: 72, notes: null },
      { id: today.id, date: today.date, weight_kg: 68, notes: 'Buổi sáng' },
    ]);
  });
});
