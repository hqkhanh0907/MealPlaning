import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';

const pocketbase = process.env.POCKETBASE_BIN;
const tableNames = Object.keys(JSON.parse(readFileSync(new URL('./pb_hooks/sync-schema.json', import.meta.url))));
const workspace = '/api/mealplan/workspace';
const sessions = '/api/mealplan/sessions';

function migrateDatabase(cwd, dir, migrationsDir) {
  execFileSync(pocketbase, ['migrate', 'up', '--dir=' + dir, '--migrationsDir=' + migrationsDir], {
    cwd,
    stdio: process.env.POCKETBASE_TEST_VERBOSE ? 'inherit' : 'pipe',
  });
}

function seedLegacySession(cwd, dir) {
  const legacyMigrations = join(dir, 'legacy-migrations');
  cpSync(new URL('./pb_migrations', cwd), legacyMigrations, {
    recursive: true,
    filter: (path) => !path.endsWith('1795750001_mealplan_device_sessions.js'),
  });
  migrateDatabase(cwd, dir, legacyMigrations);
  const db = new DatabaseSync(join(dir, 'data.db'));
  const owner = 'legacydevice001';
  const created = Math.floor(Date.now() / 1000) - 3600;
  const sessionToken = 'mps_' + 'A'.repeat(64);
  const accessToken = 'mpa_' + 'B'.repeat(64);
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  try {
    db.prepare('INSERT INTO users (id, username, name) VALUES (?, ?, ?)').run(owner, 'legacy_device', 'An');
    db.prepare('INSERT INTO mealplan_sessions (digest, owner, expires) VALUES (?, ?, ?)')
      .run(hash(sessionToken), owner, created + 90 * 24 * 3600);
    db.prepare('INSERT INTO mealplan_access (digest, session, expires) VALUES (?, ?, ?)')
      .run(hash(accessToken), hash(sessionToken), created + 7200);
  } finally {
    db.close();
  }
  return { owner, created, sessionToken, accessToken };
}

async function withPocketBase(run, legacy = false) {
  const dir = mkdtempSync(join(tmpdir(), 'mealplan-device-sessions-'));
  const cwd = new URL('.', import.meta.url);
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = '127.0.0.1:' + reservation.address().port;
  reservation.close();
  await once(reservation, 'close');
  let instance;
  try {
    const previous = legacy ? seedLegacySession(cwd, dir) : null;
    migrateDatabase(cwd, dir, 'pb_migrations');
    execFileSync(pocketbase, ['superuser', 'upsert', 'admin@example.test', randomUUID(), '--dir=' + dir], {
      cwd, stdio: 'pipe',
    });
    instance = spawn(pocketbase, [
      'serve', '--http=' + address, '--dir=' + dir, '--automigrate=false', '--hooksWatch=false',
      '--hooksDir=pb_hooks',
    ], { cwd, stdio: process.env.POCKETBASE_TEST_VERBOSE ? 'inherit' : 'ignore' });
    async function call(path, token, data) {
      const response = await fetch('http://' + address + path, {
        method: data === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return {
        status: response.status,
        payload: response.status === 204 ? null : await response.json(),
      };
    }
    for (let attempt = 0; ; attempt++) {
      const health = await call('/health').catch(() => null);
      if (health?.status === 200) break;
      assert.ok(attempt < 50, 'PocketBase did not start');
      await setTimeout(100);
    }
    async function expectStatus(status, ...args) {
      const response = await call(...args);
      assert.equal(response.status, status, args[0] + ': ' + (response.payload?.message ?? ''));
      return response.payload;
    }
    await run(expectStatus, previous);
  } finally {
    if (instance && instance.exitCode === null && instance.signalCode === null) {
      instance.kill();
      await once(instance, 'exit');
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

test('device sessions are owner-scoped and revocation spares other devices', { skip: !pocketbase }, async () => {
  await withPocketBase(async (request) => {
    const password = randomUUID();
    const signUp = async (username, name) => {
      await request(200, '/api/collections/users/records', null, {
        username, name, password, passwordConfirm: password,
      });
    };
    const login = (username, deviceLabel) =>
      request(200, '/api/mealplan/session', null, { username, password, deviceLabel });
    await signUp('an_device_test', 'An');
    await signUp('binh_device_test', 'Bình');
    const first = await login('an_device_test', 'Máy một');
    const second = await login('an_device_test', ' Máy   hai ');
    const other = await login('binh_device_test', 'Máy Bình');
    await request(401, sessions);
    const { token: loginToken } = await request(200, '/api/collections/users/auth-with-password', null, {
      identity: 'an_device_test', password,
    });
    await request(401, sessions, loginToken);
    const { devices } = await request(200, sessions, first.accessToken);
    const { devices: otherDevices } = await request(200, sessions, other.accessToken);
    assert.equal(devices.length, 2);
    assert.deepEqual(devices.map((device) => [device.label, device.current]),
      [['Máy một', true], ['Máy hai', false]]);
    assert.equal(otherDevices.length, 1);
    assert.equal(otherDevices[0].label, 'Máy Bình');
    assert.equal(new Set([...devices, ...otherDevices].map((device) => device.id)).size, 3);
    for (const device of [...devices, ...otherDevices]) {
      assert.deepEqual(Object.keys(device).sort(), ['createdAt', 'current', 'expiresAt', 'id', 'label']);
      assert.match(device.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      assert.ok(Date.parse(device.createdAt) <= Date.now());
      assert.ok(Date.parse(device.expiresAt) > Date.parse(device.createdAt));
    }
    const { devices: secondView } = await request(200, sessions, second.accessToken);
    assert.equal(secondView.find((device) => device.current)?.id, devices[1].id);
    await request(409, sessions + '/revoke', first.accessToken, { id: devices[0].id });
    const foreign = await request(404, sessions + '/revoke', first.accessToken, { id: otherDevices[0].id });
    const unknown = await request(404, sessions + '/revoke', first.accessToken, { id: randomUUID() });
    assert.deepEqual(foreign, unknown);
    await request(204, sessions + '/revoke', first.accessToken, { id: devices[1].id });
    await request(204, sessions + '/revoke', first.accessToken, { id: devices[1].id });
    await request(401, sessions, second.accessToken);
    await request(401, workspace, second.accessToken);
    await request(401, workspace, second.accessToken, {});
    const rejected = await request(401, '/api/mealplan/session/refresh', null, { sessionToken: second.sessionToken });
    assert.equal(rejected.data.code, 'session_revoked');
    const write = {
      operationId: randomUUID(), baseRevision: 0,
      snapshot: { schemaVersion: 13, tables: Object.fromEntries(tableNames.map((table) => [table, []])) },
    };
    assert.equal((await request(200, workspace, first.accessToken, write)).revision, 1);
    assert.deepEqual(await request(200, workspace, other.accessToken), { revision: 0, snapshot: null });
    assert.deepEqual((await request(200, sessions, first.accessToken)).devices, [devices[0]]);
    const freshSecond = await login('an_device_test', 'Máy hai');
    await request(204, '/api/mealplan/logout', null, { sessionToken: first.sessionToken });
    await request(401, workspace, first.accessToken);
    await request(200, workspace, freshSecond.accessToken);
    await request(200, '/api/mealplan/session/refresh', null, { sessionToken: freshSecond.sessionToken });
  });
});

test('the device migration keeps a preexisting active login', { skip: !pocketbase }, async () => {
  await withPocketBase(async (request, previous) => {
    await request(200, workspace, previous.accessToken);
    const { devices } = await request(200, sessions, previous.accessToken);
    assert.equal(devices.length, 1);
    assert.equal(devices[0].current, true);
    assert.equal(devices[0].createdAt, new Date(previous.created * 1000).toISOString());
    assert.equal(devices[0].label, '');
    const refreshed = await request(200, '/api/mealplan/session/refresh', null, {
      sessionToken: previous.sessionToken,
    });
    assert.equal(refreshed.ownerId, previous.owner);
    assert.deepEqual((await request(200, sessions, refreshed.accessToken)).devices, devices);
  }, true);
});
