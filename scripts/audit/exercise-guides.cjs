const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { FITNESS_SEED_VERSION, SEED_EXERCISES, SEED_TRAINING_PLANS } = require('../../src/app/core/repositories/fitness-seed.ts');
const { exerciseAmountLabel, exerciseGuide, exerciseUnitNote } = require('../../src/app/core/models/exercise-guides.ts');
const { catalogSearchNames } = require('../../src/app/core/models/exercise-catalog.ts');
const { exerciseGuideText, guidedExerciseIds } = require('../../src/app/core/models/exercise-guide-texts.ts');
const { isTimedExercise } = require('../../src/app/core/models/fitness.types.ts');
const openItems = require('./exercise-guides.open.json');

const root = path.join(__dirname, '../..');
const pinnedDir = path.join(root, 'scripts/fitness/open-exercise-illustrations');
const pinned = JSON.parse(fs.readFileSync(path.join(pinnedDir, 'exercises.json'), 'utf8'));
const pin = JSON.parse(fs.readFileSync(path.join(pinnedDir, 'source.json'), 'utf8'));
const assetDir = path.join(root, 'src/assets/fitness/exercises');
const sourceById = new Map(pinned.exercises.map((exercise) => [exercise.id, exercise]));
const appById = new Map(SEED_EXERCISES.map((exercise) => [exercise.id, exercise]));
const muscleGroups = {
  chest: 'chest', back: 'back', lats: 'back', lower_back: 'back', traps: 'back', shoulders: 'shoulders', neck: 'shoulders',
  biceps: 'biceps', triceps: 'triceps', quads: 'quads', hamstrings: 'hamstrings', glutes: 'glutes', calves: 'calves',
  tibialis: 'calves', core: 'abs', obliques: 'abs', forearms: 'forearms',
};

const timedOutsidePattern = new Set([
  'battle-rope-double-waves', 'bear-crawl', 'crab-walk', 'flutter-kicks', 'mountain-climbers', 'butt-kicks',
  'foam-rolling-quads', 'foam-rolling-upper-back', 'marching-in-place', 'high-knees', 'jump-rope', 'shadow-boxing',
]);
const repsInsideTimedPattern = new Set([
  'band-pallof-press', 'pallof-press', 'reverse-nordic', 'squat-thrust', 'step-jack', 'towel-wring', 'wrist-roller',
]);
const categories = { compound: 'compound', isolation: 'isolation', conditioning: 'compound', stretch: 'isolation', mobility: 'isolation' };

function compareIdSets(sourceIds, appIds) {
  const source = new Set(sourceIds);
  const app = new Set(appIds);
  return {
    missing: sourceIds.filter((id) => !app.has(id)),
    extra: appIds.filter((id) => !source.has(id)),
    duplicates: appIds.filter((id, index) => appIds.indexOf(id) !== index),
  };
}

function brokenPlanReferences(plans, knownIds) {
  return plans.flatMap((plan) =>
    plan.days.flatMap((day) =>
      day.exercises.filter((exercise) => !knownIds.has(exercise.exerciseId)).map((exercise) => plan.id + ': ' + exercise.exerciseId),
    ),
  );
}

function missingImages(exercises, exists) {
  return exercises.flatMap((exercise) =>
    exercise.frames.map((frame) => exercise.id + '/' + frame + '.webp').filter((file) => !exists(file)),
  );
}

function textProblems(id) {
  const text = exerciseGuideText(id);
  if (!text) return ['thiếu hướng dẫn'];
  const problems = [];
  const prose = [text.nameVi, text.equipment, text.purpose, text.startPosition, text.alt, ...text.steps];
  if (prose.some((value) => typeof value !== 'string' || !value.trim())) problems.push('chữ trống');
  if (text.steps.length < 2 || text.steps.length > 3) problems.push('số bước');
  if (!text.source?.trim() || !/^https:\/\/\S+$/.test(text.sourceUrl ?? '')) problems.push('nguồn trống');
  if ([text.purpose, text.startPosition, ...text.steps].some((value) => /\d/.test(value))) problems.push('chữ kỹ thuật chứa con số định lượng');
  if (!['reps', 'seconds'].includes(text.measure)) problems.push('thiếu đơn vị ghi');
  return problems;
}

test('danh mục ứng dụng khớp hai chiều với exercises.json của phiên bản đã ghim', (t) => {
  assert.equal(pin.commit, '2786aefa4b36a08faeca8114e0d1eb0af3ef6732');
  assert.equal(pin.repository, 'hitmanrepo/open-exercise-illustrations');
  const sourceIds = pinned.exercises.map((exercise) => exercise.id);
  const appIds = SEED_EXERCISES.map((exercise) => exercise.id);
  t.diagnostic('Mã nguồn: ' + sourceIds.length + ' · mã ứng dụng: ' + appIds.length);
  assert.deepEqual(compareIdSets(sourceIds, appIds), { missing: [], extra: [], duplicates: [] });
  assert.deepEqual(compareIdSets(sourceIds, [...guidedExerciseIds]), { missing: [], extra: [], duplicates: [] });
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  assert.match(FITNESS_SEED_VERSION, /^2\./);
});

test('mỗi mã giữ đúng tên, dụng cụ, nhóm cơ, số bên và thứ tự khung của nguồn', () => {
  const failures = [];
  for (const source of pinned.exercises) {
    const app = appById.get(source.id);
    const guide = exerciseGuide(source.id);
    if (!app || !guide) continue;
    if (app.name !== source.name) failures.push(source.id + ': tên gốc');
    if (app.equipment !== (source.equipmentLabel ?? 'Bodyweight')) failures.push(source.id + ': dụng cụ');
    if (app.muscle_group !== muscleGroups[source.muscles.primary[0]]) failures.push(source.id + ': nhóm cơ');
    const category = source.movementPattern === 'cardio' ? 'cardio' : categories[source.category];
    if (app.category !== category) failures.push(source.id + ': loại bài');
    if (Boolean(guide.perSide) !== source.unilateral) failures.push(source.id + ': số bên');
    const frames = guide.illustration.frames;
    if (frames.map((frame) => frame.phase).join() !== source.frames.join()) failures.push(source.id + ': thứ tự khung');
    if (frames.some((frame) => frame.path !== 'assets/fitness/exercises/' + source.images[frame.phase].replace(/^images\//, ''))) {
      failures.push(source.id + ': đường dẫn khung');
    }
    if (source.frames.join() === 'hold' && frames.length !== 1) failures.push(source.id + ': bài giữ tĩnh');
    const labels = { start: 'Bắt đầu', mid: 'Giữa', end: 'Kết thúc', hold: source.movementPattern === 'cardio' ? 'Tư thế tập' : 'Tư thế giữ' };
    if (frames.some((frame) => frame.label !== labels[frame.phase])) failures.push(source.id + ': nhãn khung');
    if (guide.illustration.stacked !== (source.frames.length > 1 && source.width > source.height)) failures.push(source.id + ': bố cục khung');
  }
  assert.deepEqual(failures, []);
});

test('mọi tệp hình của nguồn nằm trong ứng dụng đúng từng byte, không thừa tệp', () => {
  const expected = pinned.exercises.flatMap((exercise) => exercise.frames.map((frame) => exercise.images[frame]));
  assert.deepEqual(Object.keys(pin.images).sort(), [...expected].sort());
  assert.deepEqual(missingImages(pinned.exercises, (file) => fs.existsSync(path.join(assetDir, file))), []);
  const wrong = expected.filter((image) => {
    const file = path.join(assetDir, image.replace(/^images\//, ''));
    return fs.existsSync(file) && createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== pin.images[image];
  });
  assert.deepEqual(wrong, []);
  const shipped = fs.readdirSync(assetDir, { withFileTypes: true }).flatMap((dir) =>
    dir.isDirectory() ? fs.readdirSync(path.join(assetDir, dir.name)).map((file) => 'images/' + dir.name + '/' + file) : ['images/' + dir.name],
  );
  assert.deepEqual(shipped.filter((file) => !expected.includes(file)), []);
  const rights = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/fitness/illustration-sources.json'), 'utf8'));
  assert.equal(rights.commit, pin.commit);
  assert.equal(rights.license, 'CC0 1.0 Universal');
  assert.equal(rights.files, expected.length);
  assert.match(fs.readFileSync(path.join(pinnedDir, 'LICENSE'), 'utf8'), /CC0 1\.0 Universal/);
});

test('mỗi mã có tên và hướng dẫn tiếng Việt, nguồn kỹ thuật và mô tả hình', () => {
  const failures = pinned.exercises.flatMap((exercise) => textProblems(exercise.id).map((problem) => exercise.id + ': ' + problem));
  assert.deepEqual(failures, []);
  const names = SEED_EXERCISES.map((exercise) => exercise.name_vi);
  assert.deepEqual([...new Set(names.filter((name, index) => names.indexOf(name) !== index))], []);
});

test('bí danh và tên biến thể của nguồn tìm ra đúng bài, không thành bài riêng', () => {
  for (const exercise of pinned.exercises) {
    for (const alias of exercise.aliases ?? []) assert.ok(catalogSearchNames(exercise.id).includes(alias), exercise.id + ': ' + alias);
  }
  for (const variant of pinned.variants) {
    assert.ok(catalogSearchNames(variant.imageOf).includes(variant.name), variant.id);
    assert.ok(!appById.has(variant.id), variant.id);
  }
});

test('đơn vị ghi: bài giữ tĩnh tính giây, bài một bên ghi từng bên, tổng hai tạ chỉ ở bài tạ rời', () => {
  const failures = [];
  for (const source of pinned.exercises) {
    const text = exerciseGuideText(source.id);
    if (!text) continue;
    const timedByPattern = ['isometric', 'stretch', 'carry', 'cardio'].includes(source.movementPattern);
    if (isTimedExercise(source.id) !== ((timedByPattern && !repsInsideTimedPattern.has(source.id)) || timedOutsidePattern.has(source.id))) {
      failures.push(source.id + ': đơn vị giây hoặc lần lệch quy tắc');
    }
    if (text.loadTotalOfTwo && !source.equipment.some((item) => ['dumbbell', 'kettlebell'].includes(item))) {
      failures.push(source.id + ': tổng hai tạ ở bài không có tạ rời');
    }
    const unit = exerciseUnitNote(source.id) ?? '';
    const sideLabel = isTimedExercise(source.id) ? 'Số giây mỗi bên' : 'Số lần mỗi bên';
    const otherLabel = isTimedExercise(source.id) ? 'Số lần mỗi bên' : 'Số giây mỗi bên';
    if (unit.includes(sideLabel) !== source.unilateral || unit.includes(otherLabel)) failures.push(source.id + ': nhãn từng bên');
    const amount = exerciseAmountLabel(source.id);
    const wantAmount = isTimedExercise(source.id)
      ? source.unilateral ? 'Tập mỗi bên (giây)' : 'Tập (giây)'
      : source.unilateral ? 'Số lần mỗi bên' : 'Số lần';
    if (amount !== wantAmount) failures.push(source.id + ': nhãn ô nhập');
  }
  assert.deepEqual(failures, []);
  assert.equal(isTimedExercise('plank'), true);
  assert.equal(exerciseUnitNote('side-plank'), 'Số giây mỗi bên');
  assert.equal(exerciseAmountLabel('side-plank'), 'Tập mỗi bên (giây)');
  assert.equal(exerciseAmountLabel('bulgarian-split-squat'), 'Số lần mỗi bên');
  assert.equal(exerciseAmountLabel('custom'), 'Số lần');
  assert.equal(isTimedExercise('kettlebell-goblet-squat'), false);
});

test('giáo án mẫu chỉ tham chiếu mã có trong nguồn và hợp dụng cụ', () => {
  assert.deepEqual(brokenPlanReferences(SEED_TRAINING_PLANS, new Set(sourceById.keys())), []);
  for (const plan of SEED_TRAINING_PLANS) {
    for (const day of plan.days) {
      const ids = day.exercises.map((exercise) => exercise.exerciseId);
      assert.equal(new Set(ids).size, ids.length, plan.id + ' ' + day.name);
      for (const exercise of day.exercises) {
        const timedRange = exercise.repsMin >= 30;
        assert.equal(isTimedExercise(exercise.exerciseId), timedRange, plan.id + ': ' + exercise.exerciseId);
      }
    }
  }
  const floorPlan = SEED_TRAINING_PLANS.find((plan) => plan.id === 'plan_two_dumbbells_floor');
  for (const exercise of floorPlan.days.flatMap((day) => day.exercises)) {
    const equipment = sourceById.get(exercise.exerciseId).equipment;
    assert.ok(equipment.every((item) => item === 'dumbbell'), exercise.exerciseId + ': ' + equipment.join('+'));
  }
});

test('phép kiểm phát hiện mã thiếu, thừa, trùng, tham chiếu hỏng và hình thiếu', () => {
  assert.deepEqual(compareIdSets(['a', 'b', 'c'], ['a', 'c', 'c', 'x']), { missing: ['b'], extra: ['x'], duplicates: ['c'] });
  assert.deepEqual(compareIdSets(['a', 'b'], ['b', 'c']), { missing: ['a'], extra: ['c'], duplicates: [] });
  const plan = { id: 'p', days: [{ exercises: [{ exerciseId: 'plank' }, { exerciseId: 'ex_back_squat' }] }] };
  assert.deepEqual(brokenPlanReferences([plan], new Set(sourceById.keys())), ['p: ex_back_squat']);
  const squat = sourceById.get('kettlebell-goblet-squat');
  assert.deepEqual(missingImages([squat], (file) => !file.endsWith('end.webp')), ['kettlebell-goblet-squat/end.webp']);
  for (const id of ['custom', 'ex_back_squat', 'band-good-morning', 'constructor']) {
    assert.equal(exerciseGuide(id), undefined, id);
    assert.deepEqual(textProblems(id), ['thiếu hướng dẫn']);
  }
  assert.deepEqual(exerciseGuide('kettlebell-goblet-squat').illustration.frames.map((frame) => frame.phase), ['start', 'end']);
  assert.deepEqual(exerciseGuide('plank').illustration.frames.map((frame) => frame.phase), ['hold']);
  assert.notDeepEqual(exerciseGuide('goblet-squat').illustration.frames, exerciseGuide('kettlebell-goblet-squat').illustration.frames);
});

test('mã còn vướng giữa chữ và hình được ghi rõ, vẫn nằm trong danh mục', (t) => {
  for (const [id, issue] of Object.entries(openItems.flagged)) {
    assert.ok(sourceById.has(id) && appById.has(id), id);
    assert.ok(issue.trim().length > 15, id);
  }
  for (const id of Object.keys(openItems.weakSources)) assert.ok(sourceById.has(id), id);
  t.diagnostic('Mã còn vướng chữ và hình: ' + Object.keys(openItems.flagged).length);
  t.diagnostic('Mã có nguồn kỹ thuật chưa đạt mức chuyên môn: ' + Object.keys(openItems.weakSources).length);
});

test('APK chứa mọi hình hướng dẫn', { skip: !process.env.EXERCISE_GUIDE_APK }, () => {
  const entries = new Set(
    execFileSync('unzip', ['-Z1', process.env.EXERCISE_GUIDE_APK], { encoding: 'utf8', maxBuffer: 64e6 }).split('\n'),
  );
  const expected = pinned.exercises.flatMap((exercise) =>
    exercise.frames.map((frame) => 'assets/public/assets/fitness/exercises/' + exercise.id + '/' + frame + '.webp'),
  );
  assert.equal(expected.length, 796);
  assert.deepEqual(expected.filter((entry) => !entries.has(entry)), []);
  assert.ok(entries.has('assets/public/assets/fitness/illustration-sources.json'));
});
