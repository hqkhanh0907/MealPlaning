import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  SEED_EXERCISES,
  SEED_TRAINING_PLANS,
} from '../../../src/app/core/models/fitness-seed';

test('the native workout catalog and preset plans match every TypeScript seed field', () => {
  const read = (name: string) =>
    JSON.parse(readFileSync(new URL('../src/fitness/' + name, import.meta.url), 'utf8'));
  assert.deepEqual(read('exercises.json'), SEED_EXERCISES);
  assert.deepEqual(read('preset-plans.json'), SEED_TRAINING_PLANS);
});
