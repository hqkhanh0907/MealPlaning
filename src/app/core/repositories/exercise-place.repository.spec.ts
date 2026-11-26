import { Injector } from '@angular/core';
import { Database } from '../services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { WebDatabase } from '../services/database/web-database';
import { defaultExercisePlaces, ExercisePlaceRepository } from './exercise-place.repository';

const configKey = 'fitness_exercise_places';

function repositoryFor(db: Database): ExercisePlaceRepository {
  return Injector.create({
    providers: [ExercisePlaceRepository, { provide: Database, useValue: db }],
  }).get(ExercisePlaceRepository);
}

describe('ExercisePlaceRepository', () => {
  let db: WebDatabase;
  let repository: ExercisePlaceRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = repositoryFor(db);
  });

  afterEach(teardownTestDatabase);

  it('lists three unconfigured places with stable UUIDs', async () => {
    const places = await repository.list();
    expect(places.map(({ name }) => name)).toEqual(['Nhà', 'Phòng gym', 'Ngoài trời']);
    expect(places.map(({ equipment }) => equipment)).toEqual([null, null, null]);
    expect(new Set(places.map(({ id }) => id)).size).toBe(3);
    for (const { id } of places) {
      expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
    }
    expect(await repositoryFor(db).list()).toEqual(places);
  });

  it('reopens saved names, explicit empty equipment and unknown keys', async () => {
    const [home, , outdoors] = defaultExercisePlaces;
    await repository.save({ ...home, equipment: [] });
    await repository.save({
      ...outdoors,
      name: 'Công viên',
      equipment: ['pull-up-bar', 'future-key'],
    });

    const reopened = new WebDatabase();
    await reopened.initialize();
    const places = await repositoryFor(reopened).list();

    expect(places.map(({ name }) => name)).toEqual(['Nhà', 'Phòng gym', 'Công viên']);
    expect(places.map(({ equipment }) => equipment)).toEqual([
      [],
      null,
      ['pull-up-bar', 'future-key'],
    ]);
    expect(places[2].id).toBe(outdoors.id);
  });

  it('keeps both changes when saves overlap for two places', async () => {
    const [home, gym] = defaultExercisePlaces;
    const [, result] = await Promise.all([
      repository.save({ ...home, name: 'Phòng khách', equipment: ['dumbbell'] }),
      repository.save({ ...gym, name: 'Phòng tập', equipment: ['barbell', 'bench'] }),
    ]);

    expect(result.map(({ name }) => name)).toEqual(['Phòng khách', 'Phòng tập', 'Ngoài trời']);
    expect(await repository.list()).toEqual(result);
  });

  it('uses defaults for malformed or obsolete documents', async () => {
    for (const raw of ['{', '{"version":0,"places":[]}', '{"version":1,"places":{}}']) {
      await writeConfig(raw);
      expect(await repository.list()).toEqual(defaultExercisePlaces);
    }
  });

  it('recovers a malformed place while retaining valid siblings', async () => {
    const [home, gym, outdoors] = defaultExercisePlaces;
    const savedOutdoors = { ...outdoors, name: 'Công viên', equipment: ['pull-up-bar'] };
    await writeConfig(
      JSON.stringify({
        version: 1,
        places: [{ ...home, name: 'Invalid', equipment: ['dumbbell', null] }, savedOutdoors],
      }),
    );

    expect(await repository.list()).toEqual([home, gym, savedOutdoors]);
    const recovered = await repository.save({ ...home, equipment: [] });
    expect(recovered).toEqual([{ ...home, equipment: [] }, gym, savedOutdoors]);
    expect(await repository.list()).toEqual(recovered);
  });

  it('rejects a busy atomic write and can save again afterwards', async () => {
    const [home] = defaultExercisePlaces;
    const updated = { ...home, name: 'Phòng khách', equipment: [] };
    const execute = spyOn(db, 'executeAtomically').and.rejectWith(new Error('Database is busy.'));
    await expectAsync(repository.save(updated)).toBeRejectedWithError('Database is busy.');
    expect((await repository.list())[0]).toEqual(home);

    execute.and.callThrough();
    expect((await repository.save(updated))[0]).toEqual(updated);
  });

  async function writeConfig(value: string): Promise<void> {
    await db.execute(
      `INSERT INTO app_config (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [configKey, value],
    );
  }
});
