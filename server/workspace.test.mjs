import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';

const schema = JSON.parse(readFileSync(new URL('./pb_hooks/sync-schema.json', import.meta.url)));
const pb = process.env.POCKETBASE_BIN;
let server;
const password = randomUUID();
const adminEmail = 'test-admin@example.test';

function fixtureRow(table, values) {
  return Object.fromEntries(Object.entries(schema[table].cols).map(([column, type]) => [
    column, values[column] ?? (schema[table].required.includes(column)
      ? type === 'TEXT' ? 'test' : 0 : null),
  ]));
}

function workout() {
  const tables = Object.fromEntries(Object.keys(schema).map((table) => [table, []]));
  tables.exercise.push(fixtureRow('exercise', { id: 'test-exercise' }));
  tables.workout_session.push(fixtureRow('workout_session', {
    id: 'session-a', mode: 'free', status: 'completed',
  }));
  tables.workout_exercise.push(fixtureRow('workout_exercise', {
    id: 'exercise-a', workout_session_id: 'session-a', exercise_id: 'test-exercise',
  }));
  tables.workout_set.push(...[6, 5].map((reps, index) => fixtureRow('workout_set', {
    id: 'set-' + index, workout_exercise_id: 'exercise-a', weight_kg: 40, reps,
    set_number: index + 1, status: 'logged',
  })));
  return { schemaVersion: 13, tables };
}

async function call(path, token, data) {
  const response = await fetch(server + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const payload = response.status === 204 ? null : await response.json();
  return { status: response.status, payload };
}

async function expectStatus(status, ...args) {
  const response = await call(...args);
  assert.equal(response.status, status, args[0] + ': ' + (response.payload?.message ?? ''));
  return response.payload;
}

test('two devices synchronize owned workouts, including retries and conflict choices', { skip: !pb }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mealplan-backend-'));
  const cwd = new URL('.', import.meta.url);
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const address = '127.0.0.1:' + reservation.address().port;
  server = 'http://' + address;
  await new Promise((resolve) => reservation.close(resolve));
  execFileSync(pb, ['superuser', 'upsert', adminEmail, password, '--dir=' + dir],
    { cwd, stdio: 'ignore' });
  const serverProcess = spawn(pb, ['serve', '--http=' + address, '--dir=' + dir, '--automigrate=false', '--hooksWatch=false',
    '--hooksDir=pb_hooks', '--migrationsDir=pb_migrations', '--publicDir=pb_public'],
    { cwd, stdio: process.env.POCKETBASE_TEST_VERBOSE ? 'inherit' : 'ignore' });
  try {
    for (let attempt = 0; ; attempt++) {
      const health = await call('/health').catch(() => null);
      if (health?.status === 200) break;
      assert.ok(attempt < 50, 'PocketBase did not start');
      await setTimeout(100);
    }

    async function signup(username, name) {
      const record = await expectStatus(200, '/api/collections/users/records', null,
        { username, name, password, passwordConfirm: password });
      const { token: loginToken } = await expectStatus(200, '/api/collections/users/auth-with-password', null,
        { identity: username, password });
      const session = await expectStatus(200, '/api/mealplan/session', loginToken, {});
      assert.equal(session.ownerId, record.id);
      assert.equal(session.name, name.trim());
      return { id: record.id, loginToken, token: session.accessToken, sessionToken: session.sessionToken };
    }

    const credentials = { username: 'name_test', password, passwordConfirm: password };
    for (const invalidName of [undefined, '', '  ', 'A'.repeat(101)]) {
      await expectStatus(400, '/api/collections/users/records', null, { ...credentials, name: invalidName });
    }
    const lengthLimit = await signup('name_test', 'ữ'.repeat(100));
    assert.ok(lengthLimit.id);
    await signup('single_test', 'An');
    await signup('punctuation_test', "D’An-Lê");

    const an = await signup('an_test', '  Nguyễn Minh An  ');
    const binh = await signup('binh_test', 'Nguyễn Minh An');
    assert.notEqual(an.id, binh.id);
    await expectStatus(400, '/api/collections/users/records', null,
      { username: 'an_test', name: 'An', password, passwordConfirm: password });
    await expectStatus(400, '/api/collections/users/auth-with-password', null,
      { identity: 'an_test', password: 'incorrect password' });
    const route = '/api/mealplan/workspace';
    await expectStatus(401, route);
    await expectStatus(401, route, an.loginToken);
    await expectStatus(401, route, an.loginToken, {
      operationId: randomUUID(), baseRevision: 0, snapshot: workout(),
    });
    await expectStatus(401, '/api/mealplan/session', an.loginToken, {});
    await expectStatus(400, '/api/mealplan/session', null,
      { username: 'an_test', password: 'incorrect password' });
    const otherDevice = await expectStatus(200, '/api/mealplan/session', null,
      { username: 'an_test', password });
    assert.equal(otherDevice.ownerId, an.id);
    assert.notEqual(otherDevice.sessionToken, an.sessionToken);
    const refreshed = await expectStatus(200, '/api/mealplan/session/refresh', null, { sessionToken: an.sessionToken });
    assert.equal(refreshed.ownerId, an.id);
    assert.ok(refreshed.accessToken !== an.token, 'refresh issues new access');
    await expectStatus(200, route, refreshed.accessToken);
    await expectStatus(400, '/api/mealplan/profile', an.token, { name: '  ' });
    const profile = await expectStatus(200, '/api/mealplan/profile', an.token,
      { name: "  D'An-Lê  ", ownerId: binh.id });
    assert.deepEqual(profile, { ownerId: an.id, username: 'an_test', name: "D'An-Lê" });
    const request = { operationId: randomUUID(), baseRevision: 0, snapshot: workout() };
    const answers = await Promise.all([expectStatus(200, route, an.token, request),
      expectStatus(200, route, an.token, request)]);
    assert.deepEqual(answers[0], answers[1]);
    assert.equal(answers[0].revision, 1);
    assert.deepEqual(await expectStatus(200, route, an.token, request), answers[0]);
    const written = await expectStatus(200, route, an.token);
    assert.equal(written.snapshot.tables.workout_session[0].total_volume, 440);
    assert.equal(written.snapshot.tables.workout_set.length, 2);
    assert.deepEqual(await expectStatus(200, route, binh.token), { revision: 0, snapshot: null });

    assert.deepEqual(await expectStatus(200, route + '?metadata=1', an.token), { revision: 1, snapshot: null });
    const deviceSnapshot = structuredClone(written.snapshot);
    deviceSnapshot.tables.workout_set[1].reps = 7;
    await expectStatus(200, route, otherDevice.accessToken,
      { operationId: randomUUID(), baseRevision: 1, snapshot: deviceSnapshot });
    const edited = await expectStatus(200, route, an.token);
    assert.equal(edited.revision, 2);
    assert.equal(edited.snapshot.tables.workout_session[0].id, 'session-a');
    assert.equal(edited.snapshot.tables.workout_session[0].total_volume, 520);
    await expectStatus(409, route, an.token,
      { operationId: randomUUID(), baseRevision: 1, snapshot: request.snapshot });

    const differentRecord = structuredClone(written.snapshot);
    differentRecord.tables.workout_set[0].reps = 8;
    const mergeRequest = {
      operationId: randomUUID(), baseRevision: 1, mergeIndependent: true, snapshot: differentRecord,
    };
    const merged = await expectStatus(200, route, an.token, mergeRequest);
    assert.equal(merged.merged, true);
    assert.equal(merged.revision, 3);
    assert.deepEqual(await expectStatus(200, route, an.token, mergeRequest), merged);
    const adjusted = await expectStatus(200, route, an.token);
    assert.deepEqual(adjusted.snapshot.tables.workout_set.map((set) => set.reps), [8, 7]);
    assert.equal(adjusted.snapshot.tables.workout_session[0].total_volume, 600);
    const sameRecord = structuredClone(written.snapshot);
    sameRecord.tables.workout_set[1].reps = 9;
    sameRecord.tables.workout_set[1].notes = 'independent note';
    const overlap = {
      operationId: randomUUID(), baseRevision: 1, mergeIndependent: true, snapshot: sameRecord,
    };
    const disagreement = await expectStatus(409, route, an.token, overlap);
    assert.equal(disagreement.data.code, 'workout_conflict');
    const { revision: conflictRevision, items } = disagreement.data.conflict;
    assert.equal(conflictRevision, 3);
    assert.equal(items.length, 1);
    assert.deepEqual(
      [items[0].kind, items[0].field, items[0].local, items[0].server],
      ['workout_set_field', 'reps', 9, 7],
    );
    await expectStatus(409, route, an.token, {
      ...overlap, operationId: randomUUID(),
      resolution: { revision: conflictRevision - 1, choices: { [items[0].key]: 'local' } },
    });
    assert.deepEqual(await expectStatus(200, route, an.token), adjusted);
    const selection = {
      ...overlap, operationId: randomUUID(),
      resolution: { revision: conflictRevision, choices: { [items[0].key]: 'local' } },
    };
    const chosen = await expectStatus(200, route, an.token, selection);
    assert.deepEqual(await expectStatus(200, route, an.token, selection), chosen);
    const selected = await expectStatus(200, route, otherDevice.accessToken);
    assert.equal(selected.revision, 4);
    assert.equal(selected.snapshot.tables.workout_session[0].total_volume, 680);
    assert.deepEqual(selected.snapshot.tables.workout_set.map((set) => set.reps), [8, 9]);
    assert.equal(selected.snapshot.tables.workout_set[1].notes, 'independent note');

    const keepWorkout = structuredClone(selected.snapshot);
    keepWorkout.tables.workout_set[0].reps = 10;
    await expectStatus(200, route, otherDevice.accessToken, {
      operationId: randomUUID(), baseRevision: 4, snapshot: keepWorkout,
    });
    const removeWorkout = structuredClone(selected.snapshot);
    for (const table of ['workout_session', 'workout_exercise', 'workout_set']) {
      removeWorkout.tables[table] = [];
    }
    removeWorkout.tables.ingredient.push(fixtureRow('ingredient', { id: 'independent-ingredient' }));
    const remove = {
      operationId: randomUUID(), baseRevision: 4, snapshot: removeWorkout, mergeIndependent: true,
    };
    const deletion = (await expectStatus(409, route, an.token, remove)).data.conflict;
    assert.equal(deletion.revision, 5);
    assert.equal(deletion.items.length, 1);
    assert.equal(deletion.items[0].kind, 'workout_session_delete');
    assert.deepEqual([deletion.items[0].local, deletion.items[0].server], [null, 760]);
    const keepChoice = {
      ...remove, operationId: randomUUID(),
      resolution: { revision: 5, choices: { [deletion.items[0].key]: 'server' } },
    };
    const kept = await expectStatus(200, route, an.token, keepChoice);
    assert.deepEqual(await expectStatus(200, route, an.token, keepChoice), kept);
    const preserved = (await expectStatus(200, route, an.token)).snapshot.tables;
    assert.equal(preserved.workout_session[0].total_volume, 760);
    assert.equal(preserved.ingredient[0].id, 'independent-ingredient');
    const removed = await expectStatus(200, route, an.token,
      { operationId: randomUUID(), baseRevision: kept.revision, snapshot: removeWorkout });
    assert.equal((await expectStatus(200, route, an.token)).snapshot.tables.workout_set.length, 0);
    assert.deepEqual(await expectStatus(200, route, binh.token), { revision: 0, snapshot: null });

    const pair = workout();
    const pairTables = pair.tables;
    pairTables.workout_session.push({ ...pairTables.workout_session[0], id: 'session-b' });
    pairTables.workout_exercise.push({
      ...pairTables.workout_exercise[0], id: 'exercise-b', workout_session_id: 'session-b',
    });
    pairTables.workout_set.push(...pairTables.workout_set.map((entry, index) => ({
      ...entry, id: 'second-' + index, workout_exercise_id: 'exercise-b',
    })));
    const pairBase = await expectStatus(200, route, an.token, {
      operationId: randomUUID(), baseRevision: removed.revision, snapshot: pair,
    });
    const deviceOne = structuredClone(pair);
    const deviceTwo = structuredClone(pair);
    deviceOne.tables.workout_set.find((set) => set.id === 'set-1').reps = 7;
    deviceTwo.tables.workout_set.find((set) => set.id === 'second-1').reps = 8;
    await expectStatus(200, route, an.token, {
      operationId: randomUUID(), baseRevision: pairBase.revision, snapshot: deviceOne,
    });
    await expectStatus(200, route, otherDevice.accessToken, {
      operationId: randomUUID(), baseRevision: pairBase.revision, snapshot: deviceTwo, mergeIndependent: true,
    });
    const viewOne = await expectStatus(200, route, an.token);
    assert.deepEqual(await expectStatus(200, route, otherDevice.accessToken), viewOne);
    assert.deepEqual(
      viewOne.snapshot.tables.workout_session.map((entry) => [entry.id, entry.total_volume]),
      [['session-a', 520], ['session-b', 560]],
    );
    assert.deepEqual(await expectStatus(200, route, binh.token), { revision: 0, snapshot: null });

    const unitCases = workout();
    const entries = unitCases.tables.workout_set;
    entries.push(
      { ...entries[0], id: 'timed', set_number: 3, reps: 21, duration_seconds: 30 },
      { ...entries[0], id: 'legacy', set_number: 4, reps: 45, legacy_unit_unknown: 1 },
      { ...entries[0], id: 'skipped', set_number: 5, reps: 17, status: 'skipped' },
    );
    const unitsRequest = { operationId: randomUUID(), baseRevision: 0, snapshot: unitCases };
    const unitsReceipt = await expectStatus(200, route, binh.token, unitsRequest);
    const binhSnapshot = (await expectStatus(200, route, binh.token)).snapshot;
    const b = binhSnapshot.tables;
    assert.equal(b.workout_session[0].total_volume, 440);
    assert.equal(b.workout_set.find((set) => set.id === 'legacy').reps, 45);
    assert.equal(b.workout_set.find((set) => set.id === 'timed').duration_seconds, 30);

    const coach = await signup('coach_demo', 'Demo');
    const currentWorkout = workout();
    const studio = {key: 'fitness_exercise_place:studio', value: JSON.stringify({id:'studio',name:'Studio',equipment:['cable']}), updated_at:'2026-11-27'};
    currentWorkout.tables.workout_preference.push(studio);
    currentWorkout.tables.workout_session[0].place_id = 'studio';
    currentWorkout.tables.workout_session[0].origin = 'composed';
    currentWorkout.tables.workout_exercise[0].next_weight_kg = 45;
    await expectStatus(200, route, coach.token, { operationId: randomUUID(), baseRevision: 0, snapshot: currentWorkout });
    const modern = await expectStatus(200, route + '?schema=13', coach.token);
    assert.equal(modern.snapshot.tables.workout_session[0].place_id, 'studio');
    const older = await expectStatus(200, route, coach.token);
    assert.equal(older.snapshot.schemaVersion, 12);
    assert.equal('place_id' in older.snapshot.tables.workout_session[0], false);
    assert.equal('workout_preference' in older.snapshot.tables, false);
    older.snapshot.tables.workout_set[0].reps += 1;
    await expectStatus(200, route, coach.token, { operationId: randomUUID(), baseRevision: older.revision, snapshot: older.snapshot });
    const roundTrip = await expectStatus(200, route + '?schema=13', coach.token);
    assert.equal(roundTrip.snapshot.tables.workout_session[0].origin, 'composed');
    assert.deepEqual(roundTrip.snapshot.tables.workout_preference, [studio]);
    assert.equal(roundTrip.snapshot.tables.workout_exercise[0].next_weight_kg, null);
    assert.equal(roundTrip.snapshot.tables.workout_session[0].place_id, 'studio');
    assert.equal(roundTrip.snapshot.tables.workout_set[0].reps, older.snapshot.tables.workout_set[0].reps);
    const expiration = await signup('expire_test', 'Hết hạn');
    const digest = (value) => createHash('sha256').update(value).digest('hex');
    const localDb = new DatabaseSync(join(dir, 'data.db'));
    try {
      const coachingStored = JSON.parse(localDb.prepare('SELECT snapshot FROM mealplan_workspaces WHERE owner=?').get(coach.id).snapshot);
      assert.equal(coachingStored.schemaVersion, 12);
      assert.equal('workout_preference' in coachingStored.tables, false);
      assert.equal('place_id' in coachingStored.tables.workout_session[0], false);
      assert.deepEqual(coachingStored.workoutCoaching13.workout_preference, [studio]);
      const rollbackRow = localDb.prepare('SELECT revision,snapshot FROM mealplan_workspaces WHERE owner=?').get(coach.id);
      localDb.prepare('INSERT INTO mealplan_workspace_history (owner,revision,snapshot) VALUES (?,?,?)').run(coach.id, rollbackRow.revision, rollbackRow.snapshot);
      delete coachingStored.workoutCoaching13;
      localDb.prepare('UPDATE mealplan_workspaces SET snapshot=?,revision=revision+1 WHERE owner=?').run(JSON.stringify(coachingStored), coach.id);
      const resumed = await expectStatus(200, route + '?schema=13', coach.token);
      assert.deepEqual(resumed.snapshot.tables.workout_preference, [studio]);
      assert.equal(resumed.snapshot.tables.workout_session[0].place_id, 'studio');
      const oldSnapshot = structuredClone(unitCases);
      oldSnapshot.tables.workout_set.sort((left, right) => left.id < right.id ? -1 : 1);
      oldSnapshot.tables.workout_exercise[0].total_volume = 3080;
      oldSnapshot.tables.workout_session[0].total_volume = 3080;
      localDb.prepare('UPDATE mealplan_receipts SET request_hash = ? WHERE owner = ? AND operation = ?')
        .run(digest(JSON.stringify([0, oldSnapshot])), binh.id, unitsRequest.operationId);
      localDb.prepare('UPDATE mealplan_workspaces SET snapshot = ? WHERE owner = ?')
        .run(JSON.stringify(oldSnapshot), binh.id);
      assert.deepEqual(await expectStatus(200, route, binh.token, unitsRequest), unitsReceipt);
      assert.equal((await expectStatus(200, route, binh.token)).snapshot.tables.workout_session[0].total_volume, 440);

      const access = localDb.prepare('SELECT expires FROM mealplan_access WHERE digest = ?').get(digest(expiration.token));
      assert.ok(access.expires > Date.now() / 1000);
      localDb.prepare('UPDATE mealplan_access SET expires = 0 WHERE digest = ?').run(digest(expiration.token));
      const ended = await expectStatus(401, route, expiration.token);
      assert.equal(ended.data.code, 'access_expired');
      const reissued = await expectStatus(200, '/api/mealplan/session/refresh', null,
        { sessionToken: expiration.sessionToken });
      await expectStatus(200, route, reissued.accessToken);
      const pending = localDb.prepare('SELECT expires FROM mealplan_sessions WHERE digest = ?').get(digest(expiration.sessionToken));
      assert.ok(pending.expires > Date.now() / 1000);
      localDb.prepare('UPDATE users SET mealplan_disabled = 1 WHERE id = ?').run(expiration.id);
      assert.equal((await expectStatus(403, route, reissued.accessToken)).data.code, 'account_forbidden');
      assert.equal((await expectStatus(403, '/api/mealplan/session/refresh', null,
        { sessionToken: expiration.sessionToken })).data.code, 'account_forbidden');
      localDb.prepare('UPDATE mealplan_sessions SET expires = 0 WHERE digest = ?').run(digest(expiration.sessionToken));
      assert.equal((await expectStatus(401, '/api/mealplan/session/refresh', null,
        { sessionToken: expiration.sessionToken })).data.code, 'session_expired');
      assert.equal(localDb.prepare('SELECT COUNT(*) AS total FROM mealplan_receipts WHERE owner = ? AND operation = ?')
        .get(an.id, request.operationId).total, 1);
    } finally {
      localDb.close();
    }

    await expectStatus(204, '/api/mealplan/logout', null, { sessionToken: an.sessionToken });
    await expectStatus(204, '/api/mealplan/logout', null, { sessionToken: an.sessionToken });
    await expectStatus(401, route, an.token);
    await expectStatus(401, route, refreshed.accessToken);
    const revoked = await expectStatus(401, '/api/mealplan/session/refresh', null, { sessionToken: an.sessionToken });
    assert.equal(revoked.data.code, 'session_revoked');
    await expectStatus(401, '/api/mealplan/session', an.loginToken, {});
    await expectStatus(200, route, otherDevice.accessToken);
    await expectStatus(200, route, binh.token);
  } finally {
    if (serverProcess.exitCode === null && serverProcess.signalCode === null) {
      const exited = new Promise((resolve) => serverProcess.once('exit', resolve));
      serverProcess.kill();
      await exited;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});
