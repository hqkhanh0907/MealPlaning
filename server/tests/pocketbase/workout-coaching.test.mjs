import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalize, workoutWireVersion, preserveWorkoutCoaching } = require('./pb_hooks/snapshot.js');
const schema = require('./pb_hooks/sync-schema.json');

test('a previous client can round trip a workout without erasing newer coaching fields', () => {
  const tables = Object.fromEntries(Object.keys(schema).filter(table => table !== 'workout_preference').map(key => [key, []]));
  const session = { id: 's', date: '2026-11-27', training_plan_day_id: null, training_day_name: 'Tập tự do',
    mode: 'free', total_volume: 0, duration_minutes: null, started_at: '2026-11-27T08:00:00Z',
    completed_at: null, created_at: '2026-11-27T08:00:00Z', status: 'active', cancelled_at: null };
  tables.workout_session.push(session);
  const legacy = { schemaVersion: 12, tables };
  const upgraded = normalize(legacy);
  assert.equal(upgraded.schemaVersion, 13);
  assert.equal(upgraded.tables.workout_session[0].place_id, null);
  upgraded.tables.workout_session[0].place_id = 'gym';
  const wire = workoutWireVersion(upgraded, 12);
  assert.deepEqual(wire, legacy);
  const incoming = normalize(wire);
  preserveWorkoutCoaching(incoming, upgraded);
  assert.equal(incoming.tables.workout_session[0].place_id, 'gym');
  assert.equal(upgraded.tables.workout_session[0].place_id, 'gym');
});
