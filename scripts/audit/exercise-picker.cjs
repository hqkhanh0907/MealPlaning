const assert = require('node:assert/strict');
const { test } = require('node:test');
const { sourceCatalogEntries } = require('../../src/app/core/models/exercise-catalog.generated.ts');
const { equipmentLabels, equipmentReviews, exerciseCatalogCorrections } = require('../../src/app/core/models/exercise-catalog-review.data.ts');
const { catalogEntry, catalogReviewedFacts } = require('../../src/app/core/models/exercise-catalog.ts');
const { exerciseGuide } = require('../../src/app/core/models/exercise-guides.ts');
const { exerciseGuideText } = require('../../src/app/core/models/exercise-guide-texts.ts');
const { vietnameseGuideTexts } = require('../../src/app/core/models/exercise-guides/index.ts');
const { filterExerciseIndex, indexExercise } = require('../../src/app/core/models/exercise-discovery.ts');
const { SEED_EXERCISES } = require('../../src/app/core/repositories/fitness-seed.ts');

const catalog = SEED_EXERCISES.map((exercise) => indexExercise({ ...exercise, source: 'db' }));
const byId = new Map(catalog.map((entry) => [entry.exercise.id, entry]));
const filters = { query: '', muscle: null, equipment: null, available: null };

function visible(criteria, index = catalog) {
  return filterExerciseIndex(index, { ...filters, ...criteria }).map(({ exercise }) => exercise.id);
}

test('equipment review covers stable catalog IDs and uses concrete inventory keys', () => {
  assert.equal(byId.size, 415);
  assert.equal(catalog.length, sourceCatalogEntries.length);
  for (const [id, review] of Object.entries(equipmentReviews)) {
    assert.ok(byId.has(id), id);
    assert.ok(review.source.trim() && review.reason.trim(), id);
    assert.equal(byId.get(id).required, review.required, id);
  }
  for (const entry of catalog) {
    assert.ok(entry.primary.length, entry.exercise.id);
    assert.equal(new Set(entry.primary).size, entry.primary.length, entry.exercise.id);
    assert.ok(entry.secondary.every((group) => !entry.primary.includes(group)), entry.exercise.id);
    assert.ok(entry.required?.every((key) => Object.hasOwn(equipmentLabels, key)) ?? true, entry.exercise.id);
  }
  for (const entry of sourceCatalogEntries.filter(({ equipment }) => equipment.includes('machine') || equipment.includes('cardio-machine'))) {
    assert.ok(Object.hasOwn(equipmentReviews, entry.id), entry.id);
  }
});

test('reviewed catalog metadata stays separate from the pinned import and history buckets', () => {
  const pinned = require('../fitness/open-exercise-illustrations/exercises.json');
  assert.equal(sourceCatalogEntries.length, 415);
  for (const [index, exercise] of pinned.exercises.entries()) {
    const generated = sourceCatalogEntries[index];
    const variants = pinned.variants.filter(({ imageOf }) => imageOf === exercise.id)
      .map(({ id, name, difference }) => ({ id, name, ...(difference ? { difference } : {}) }));
    assert.deepEqual(generated, {
      id: exercise.id, name: exercise.name, aliases: exercise.aliases, variants,
      equipment: exercise.equipment, equipmentLabel: exercise.equipmentLabel,
      primaryMuscles: exercise.muscles.primary, secondaryMuscles: exercise.muscles.secondary,
      movementPattern: exercise.movementPattern, category: exercise.category,
      unilateral: exercise.unilateral, frames: exercise.frames, width: exercise.width, height: exercise.height,
    }, exercise.id);
  }
  for (const [id, review] of Object.entries(exerciseCatalogCorrections)) {
    const source = catalogEntry(id);
    assert.ok(source && review.reason.trim() && review.source.trim(), id);
    const facts = catalogReviewedFacts(source);
    for (const field of ['primary', 'secondary', 'movementPattern', 'perSide', 'required']) {
      if (review[field]) assert.deepEqual(facts[field], review[field].after, id + ': ' + field);
    }
    if (review.perSide) {
      assert.equal(review.perSide.before, source.unilateral, id);
      assert.equal(Boolean(exerciseGuide(id).perSide), review.perSide.after, id);
    }
    if (review.movementPattern) assert.equal(review.movementPattern.before, source.movementPattern, id);
    for (const [field, value] of Object.entries(review.guide?.before ?? {}))
      assert.deepEqual(vietnameseGuideTexts[id][field], value, id + ': previous ' + field);
    for (const [field, value] of Object.entries(review.guide?.after ?? {}))
      assert.deepEqual(exerciseGuideText(id)[field], value, id + ': corrected ' + field);
  }
  assert.ok(visible({ muscle: 'adductors' }).includes('side-lunge-adductor-stretch'));
  assert.ok(visible({ muscle: 'neck' }).includes('neck-side-stretch'));
  assert.ok(visible({ muscle: 'hip-flexors' }).includes('kneeling-hip-flexor-stretch'));
  assert.equal(byId.get('side-lunge-adductor-stretch').exercise.muscle_group, 'glutes');
  assert.equal(byId.get('kettlebell-press').exercise.muscle_group, 'chest');
  assert.ok(visible({ muscle: 'shoulders' }).includes('kettlebell-press'));
});

test('chest search and Home equipment require the complete set', () => {
  const home = { muscle: 'chest', equipment: 'dumbbell', available: ['dumbbell'] };
  assert.ok(visible(home).includes('dumbbell-floor-press'));
  assert.ok(!visible(home).includes('dumbbell-chest-press'));
  assert.ok(!visible(home).includes('dumbbell-squeeze-press'));
  assert.ok(!visible({ ...home, equipment: null }).includes('bench-press'));
  assert.ok(visible({ ...home, available: ['dumbbell', 'bench'] }).includes('dumbbell-squeeze-press'));
});

test('changing place keeps a Vietnamese query and combines it with other filters', () => {
  const query = byId.get('pull-up').exercise.name_vi ?? 'pull-up';
  const criteria = { query, muscle: 'back' };
  assert.ok(!visible({ ...criteria, available: ['dumbbell'] }).includes('pull-up'));
  assert.ok(visible({ ...criteria, available: ['pull-up-bar'] }).includes('pull-up'));
  assert.ok(!visible({ ...criteria, available: ['pull-up-bar'], equipment: 'dumbbell' }).includes('pull-up'));
  const aliasEntry = sourceCatalogEntries.find(({ aliases }) => aliases.length > 0);
  assert.ok(visible({ query: aliasEntry.aliases[0] }).includes(aliasEntry.id));
  assert.ok(visible({ query: 'day ta don' }).some((id) => id.startsWith('dumbbell-')));
});

test('every mapped primary and secondary muscle is searchable without changing statistics', () => {
  assert.ok(visible({ muscle: 'chest' }).includes('archer-push-up'));
  assert.ok(visible({ muscle: 'triceps' }).includes('archer-push-up'));
  assert.ok(visible({ muscle: 'shoulders' }).includes('archer-push-up'));
  assert.equal(byId.get('archer-push-up').exercise.muscle_group, 'chest');
});

test('chest results partition stable primary and secondary matches after checking equipment', () => {
  const names = [
    'single-arm-overhead-press',
    'dumbbell-squeeze-press',
    'dumbbell-floor-press',
    'archer-push-up',
    'bench-press',
    'dumbbell-floor-press',
  ];
  const shuffled = names.map((id) => byId.get(id));
  const result = filterExerciseIndex(shuffled, {
    ...filters,
    muscle: 'chest',
    available: ['dumbbell'],
  });
  assert.deepEqual(result.map(({ exercise, muscleMatch }) => [exercise.id, muscleMatch]), [
    ['dumbbell-floor-press', 'primary'],
    ['archer-push-up', 'primary'],
    ['single-arm-overhead-press', 'secondary'],
  ]);
  assert.deepEqual(
    visible({ query: 'press' }, shuffled.slice(0, -1)),
    ['single-arm-overhead-press', 'dumbbell-squeeze-press', 'dumbbell-floor-press', 'bench-press'],
  );
});

test('default profiles and gear-free profiles treat unknown metadata differently', () => {
  const custom = indexExercise({
    id: 'custom-offline',
    name: 'Bài riêng ngoại tuyến',
    name_vi: null,
    muscle_group: 'back',
    category: 'isolation',
    equipment: 'Dumbbell',
    source: 'custom',
    instructions: null,
    created_at: '2026-11-26T00:00:00Z',
  });
  const index = [...catalog, custom];
  assert.deepEqual(visible({ query: 'bai rieng' }, index), [custom.exercise.id]);
  assert.deepEqual(visible({ query: 'bai rieng', muscle: 'chest' }, index), []);
  assert.deepEqual(visible({ query: 'bai rieng', muscle: 'back', equipment: 'dumbbell' }, index), [custom.exercise.id]);
  assert.deepEqual(visible({ query: 'bai rieng', available: ['dumbbell'] }, index), []);
  assert.equal(custom.required, null);
  assert.equal(visible({}, index).length, 416);
  assert.ok(visible({ available: [] }, index).includes('push-up'));
  assert.ok(!visible({ available: [] }, index).includes('bodyweight-hip-thrust'));
  assert.ok(!visible({ available: [] }, index).includes('dumbbell-floor-press'));
});
