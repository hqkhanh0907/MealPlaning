import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';

const schema = JSON.parse(readFileSync(new URL('./pb_hooks/sync-schema.json', import.meta.url)));
const pb = process.env.POCKETBASE_BIN;
const server = 'http://127.0.0.1:18670';
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
  return { schemaVersion: 12, tables };
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
  assert.equal(response.status, status, JSON.stringify(response.payload));
  return response.payload;
}

test('username auth, owner data, repeated writes, admin edit and delete', { skip: !pb }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mealplan-backend-'));
  const cwd = new URL('.', import.meta.url);
  execFileSync(pb, ['superuser', 'upsert', adminEmail, password, '--dir=' + dir],
    { cwd, stdio: 'ignore' });
  const process = spawn(pb, ['serve', '--http=127.0.0.1:18670', '--dir=' + dir, '--automigrate=false',
    '--hooksDir=pb_hooks', '--migrationsDir=pb_migrations', '--publicDir=pb_public'],
    { cwd, stdio: 'ignore' });
  try {
    for (let attempt = 0; ; attempt++) {
      const health = await call('/health').catch(() => null);
      if (health?.status === 200) break;
      assert.ok(attempt < 50, 'PocketBase did not start');
      await setTimeout(100);
    }

    async function signup(username) {
      const record = await expectStatus(200, '/api/collections/users/records', null,
        { username, password, passwordConfirm: password });
      const { token } = await expectStatus(200, '/api/collections/users/auth-with-password', null,
        { identity: username, password });
      return { id: record.id, token };
    }

    const an = await signup('an_test');
    const binh = await signup('binh_test');
    await expectStatus(400, '/api/collections/users/records', null,
      { username: 'an_test', password, passwordConfirm: password });
    await expectStatus(400, '/api/collections/users/auth-with-password', null,
      { identity: 'an_test', password: 'incorrect password' });
    const route = '/api/mealplan/workspace';
    await expectStatus(401, route);
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

    const privateRoute = '/api/mealplan-admin/workspaces/' + an.id;
    await expectStatus(403, privateRoute, binh.token);
    await expectStatus(403, privateRoute, binh.token, request);
    const admin = await expectStatus(200, '/api/collections/_superusers/auth-with-password', null,
      { identity: adminEmail, password });
    const adminSnapshot = structuredClone(written.snapshot);
    adminSnapshot.tables.workout_set[1].reps = 7;
    await expectStatus(200, privateRoute, admin.token,
      { operationId: randomUUID(), baseRevision: 1, snapshot: adminSnapshot });
    const edited = await expectStatus(200, route, an.token);
    assert.equal(edited.revision, 2);
    assert.equal(edited.snapshot.tables.workout_session[0].total_volume, 520);
    await expectStatus(409, route, an.token,
      { operationId: randomUUID(), baseRevision: 1, snapshot: request.snapshot });

    for (const table of ['workout_session', 'workout_exercise', 'workout_set']) {
      edited.snapshot.tables[table] = [];
    }
    await expectStatus(200, route, an.token,
      { operationId: randomUUID(), baseRevision: 2, snapshot: edited.snapshot });
    assert.equal((await expectStatus(200, route, an.token)).snapshot.tables.workout_set.length, 0);
    await expectStatus(204, '/api/mealplan/logout', an.token, {});
    await expectStatus(401, route, an.token);
  } finally {
    const exited = new Promise((resolve) => process.once('exit', resolve));
    process.kill();
    await exited;
    rmSync(dir, { recursive: true, force: true });
  }
});
