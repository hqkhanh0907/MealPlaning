import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';

const pb = process.env.POCKETBASE_BIN;
const cwd = new URL('.', import.meta.url);
const statusPath = '/api/mealplan-ops/status';
const operatorPath = '/api/collections/mealplan_operators';
const workspacePath = '/api/mealplan/workspace';
const usersPath = '/api/collections/users';
const workspacesPath = '/api/collections/mealplan_workspaces/records';
const release = '0123456789abcdef0123456789abcdef01234567';

async function port() {
  const listener = createServer().listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const value = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return value;
}

async function stop(process) {
  if (process.exitCode !== null || process.signalCode !== null) return;
  const exited = once(process, 'exit');
  process.kill();
  await exited;
}

function client(baseUrl) {
  return async (path, { token, method = 'GET', data } = {}) => {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(token ? { Authorization: token } : {}),
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(5_000),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text,
      headers: response.headers,
    };
  };
}

async function waitForHealth(call) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const response = await call('/health').catch(() => null);
    if (response?.status === 200) return;
    await setTimeout(100);
  }
  assert.fail('PocketBase or the gateway did not start');
}

function assertDenied(result, route) {
  assert.ok(result.status >= 400 && result.status < 500, route + ': HTTP ' + result.status);
}

function workout() {
  const schema = JSON.parse(readFileSync(new URL('./pb_hooks/sync-schema.json', import.meta.url)));
  const tables = Object.fromEntries(Object.keys(schema).map((table) => [table, []]));
  function add(table, values) {
    tables[table].push(Object.fromEntries(Object.entries(schema[table].cols).map(([column, type]) => [
      column, values[column] ?? (schema[table].required.includes(column) ? type === 'TEXT' ? 'test' : 0 : null),
    ])));
  }
  add('exercise', { id: 'private-exercise', name: 'Private workout name' });
  add('workout_session', { id: 'private-session', mode: 'free', status: 'completed' });
  add('workout_exercise', {
    id: 'private-workout-exercise', workout_session_id: 'private-session', exercise_id: 'private-exercise',
  });
  add('workout_set', {
    id: 'private-set', workout_exercise_id: 'private-workout-exercise',
    weight_kg: 40, reps: 6, set_number: 1, status: 'logged',
  });
  return { schemaVersion: 12, tables };
}

test('operators see aggregate status and cannot access owner data', { skip: !pb }, async () => {
  const directory = mkdtempSync(join(tmpdir(), 'mealplan-ops-test-'));
  const password = randomUUID();
  const adminEmail = 'admin@example.test';
  const appPort = await port();
  const publicPort = await port();
  const direct = client('http://127.0.0.1:' + appPort);
  const publicApi = client('http://127.0.0.1:' + publicPort);
  const children = [];
  async function post(path, data, token) {
    return direct(path, { method: 'POST', data, token });
  }
  function identity(email) {
    return { email, password, passwordConfirm: password };
  }
  try {
    execFileSync(pb, ['superuser', 'upsert', adminEmail, password, '--dir=' + directory],
      { cwd, stdio: 'ignore' });
    children.push(spawn(pb, ['serve', '--http=127.0.0.1:' + appPort, '--dir=' + directory,
      '--automigrate=false', '--hooksWatch=false', '--hooksDir=pb_hooks',
      '--migrationsDir=pb_migrations', '--publicDir=pb_public'], {
      cwd,
      env: { ...process.env, MEALPLAN_RELEASE: release },
      stdio: process.env.POCKETBASE_TEST_VERBOSE ? 'inherit' : 'ignore',
    }));
    await waitForHealth(direct);

    const admin = await post('/api/collections/_superusers/auth-with-password', {
      identity: adminEmail, password,
    });
    assert.equal(admin.status, 200);
    const superuser = admin.body.token;
    const oldPath = '/api/mealplan-admin/workspaces';
    assert.equal((await direct(oldPath, { token: superuser })).status, 404, 'legacy journal list');
    assert.equal((await direct('/mealplan-admin-data.js')).status, 404, 'legacy journal client asset');

    const user = await post(usersPath + '/records', {
      username: 'an_fixture', name: 'An Fixture', password, passwordConfirm: password,
    });
    assert.equal(user.status, 200);
    const owner = user.body.id;
    const login = await post(usersPath + '/auth-with-password', { identity: 'an_fixture', password });
    assert.equal(login.status, 200);
    const active = await post('/api/mealplan/session', {}, login.body.token);
    assert.equal(active.status, 200);
    const appAccess = active.body.accessToken;
    const fixture = { baseRevision: 0, operationId: randomUUID(), snapshot: workout() };
    assert.equal((await post(workspacePath, fixture, appAccess)).status, 200);
    const before = await direct(workspacePath, { token: appAccess });
    assert.equal(before.status, 200);
    assert.equal(before.body.snapshot.tables.workout_session[0].total_volume, 240);
    const rows = await direct(workspacesPath, { token: superuser });
    assert.equal(rows.status, 200);
    const ownerWorkspace = rows.body.items.find((row) => row.owner === owner);
    assert.ok(ownerWorkspace);

    const provision = await post(operatorPath + '/records', identity('ops@example.test'), superuser);
    assert.equal(provision.status, 200);
    const operatorLogin = await post(operatorPath + '/auth-with-password', {
      identity: 'ops@example.test', password,
    });
    assert.equal(operatorLogin.status, 200);
    assert.equal(operatorLogin.body.record.collectionName, 'mealplan_operators');
    const operator = operatorLogin.body.token;

    for (const token of [undefined, login.body.token, appAccess, superuser]) {
      assertDenied(await direct(statusPath, { token }), statusPath);
    }
    for (const token of [operator, superuser]) {
      assert.equal((await direct(oldPath + '/' + owner, { token })).status, 404);
      assert.equal((await post(oldPath + '/' + owner, fixture, token)).status, 404);
    }

    const blocked = [
      [workspacePath, 'GET'],
      [workspacePath, 'POST', { ...fixture, baseRevision: 1, operationId: randomUUID() }],
      ['/api/mealplan/session', 'POST', {}],
      ['/api/mealplan/profile', 'POST', { ownerId: owner, name: 'Changed' }],
      [usersPath + '/records', 'GET'],
      [usersPath + '/records', 'POST', {
        username: 'from_ops', name: 'Denied', password, passwordConfirm: password,
      }],
      [usersPath + '/records/' + owner, 'GET'],
      [usersPath + '/records/' + owner, 'PATCH', { name: 'Changed' }],
      [usersPath + '/records/' + owner, 'DELETE'],
      [workspacesPath, 'GET'],
      [workspacesPath, 'POST', { owner, revision: 99, snapshot: fixture.snapshot }],
      [workspacesPath + '/' + ownerWorkspace.id, 'GET'],
      [workspacesPath + '/' + ownerWorkspace.id, 'PATCH', { revision: 99 }],
      [workspacesPath + '/' + ownerWorkspace.id, 'DELETE'],
      [operatorPath + '/records', 'GET'],
      [operatorPath + '/records', 'POST', identity('unexpected@example.test')],
      [operatorPath + '/records/' + provision.body.id, 'PATCH', { email: 'changed@example.test' }],
      [operatorPath + '/records/' + provision.body.id, 'DELETE'],
      ['/api/collections/_superusers/records', 'GET'],
      ['/api/logs', 'GET'],
    ];
    for (const [path, method, data] of blocked) {
      assertDenied(await direct(path, { token: operator, method, data }), method + ' ' + path);
    }

    assert.equal((await post(workspacePath, { invalid: 'private-error-example' }, appAccess)).status, 400);
    assert.equal((await post(workspacePath, { ...fixture, operationId: randomUUID() }, appAccess)).status, 409);
    const status = await direct(statusPath, { token: operator });
    assert.equal(status.status, 200);
    assert.equal(status.headers.get('cache-control'), 'no-store');
    assert.deepEqual(Object.keys(status.body).sort(), ['release', 'services', 'sync', 'syncFailures']);
    assert.equal(status.body.release, release);
    assert.deepEqual(status.body.services, { api: 'available', database: 'available' });
    assert.deepEqual(Object.keys(status.body.sync).sort(), ['lastDownloadAt', 'lastUploadAt']);
    assert.ok(Date.parse(status.body.sync.lastUploadAt));
    assert.ok(Date.parse(status.body.sync.lastDownloadAt));
    assert.deepEqual(status.body.syncFailures.map(({ code, count }) => [code, count]), [
      ['conflict', 1], ['invalid_request', 1], ['unavailable', 0],
    ]);
    for (const event of status.body.syncFailures) {
      assert.deepEqual(Object.keys(event).sort(), ['code', 'count', 'lastSeenAt']);
      if (event.count) assert.ok(Date.parse(event.lastSeenAt));
      else assert.equal(event.lastSeenAt, null);
    }
    const statusText = JSON.stringify(status.body);
    for (const privateValue of [owner, 'An Fixture', 'private-session', 'private-error-example', fixture.operationId]) {
      assert.ok(!statusText.includes(privateValue));
    }

    assert.deepEqual((await direct(workspacePath, { token: appAccess })).body, before.body);
    assert.equal((await direct(usersPath + '/records/' + owner, { token: superuser })).body.name, 'An Fixture');
    assert.equal((await post(workspacePath, fixture, appAccess)).body.revision, 1);
    const database = new DatabaseSync(join(directory, 'data.db'), { readOnly: true });
    try {
      assert.equal(database.prepare('SELECT COUNT(*) AS n FROM mealplan_receipts WHERE owner = ?').get(owner).n, 1);
    } finally {
      database.close();
    }

    children.push(spawn(process.execPath, ['public-proxy.mjs'], {
      cwd, env: { ...process.env, MEALPLAN_API_PORT: publicPort, MEALPLAN_DB_PORT: appPort },
      stdio: 'ignore',
    }));
    await waitForHealth(publicApi);
    assert.equal((await publicApi(statusPath, { token: operator })).status, 404);
    assert.equal((await publicApi(operatorPath + '/auth-with-password', {
      method: 'POST', data: { identity: 'ops@example.test', password },
    })).status, 404);
    assert.equal((await publicApi('/mealplan-admin.html')).status, 404);
    assert.equal((await publicApi(workspacePath, { token: appAccess })).status, 200);
  } finally {
    await Promise.all(children.map(stop));
    rmSync(directory, { recursive: true, force: true });
  }
});
