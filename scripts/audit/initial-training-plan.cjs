const assert = require('node:assert/strict');
const test = require('node:test');
const { SEED_EXERCISES, SEED_TRAINING_PLANS } = require('../../src/app/core/repositories/fitness-seed.ts');
const { exerciseGuide } = require('../../src/app/core/models/exercise-guides.ts');

const catalogIds = new Set(SEED_EXERCISES.map((exercise) => exercise.id));
const movements = ['gập gối', 'đẩy', 'kéo', 'gập hông'];
const rowId = 'ex_dumbbell_bent_over_row';
const variants = {
  ex_dumbbell_goblet_squat: { movement: 'gập gối', muscle: 'quads', needs: ['tạ đơn'] },
  ex_push_up: { movement: 'đẩy', muscle: 'chest', needs: ['sàn'] },
  [rowId]: { movement: 'kéo', muscle: 'back', needs: ['tạ đơn'] },
  ex_dumbbell_romanian_deadlift: { movement: 'gập hông', muscle: 'hamstrings', needs: ['tạ đơn'] },
  ex_incline_dumbbell_press: { movement: 'đẩy', muscle: 'chest', needs: ['tạ đơn', 'ghế dốc'] },
};
const exampleIds = ['ex_dumbbell_goblet_squat', 'ex_push_up', rowId, 'ex_dumbbell_romanian_deadlift'];
const referenceCatalog = new Set([...catalogIds, rowId]);
const profile = { days: [2, 5], minutes: 35, equipment: ['tạ đơn', 'sàn'], excluded: [] };

test('mẫu ngoại tuyến dùng đúng bốn biến thể và giữ lịch mẫu ba buổi riêng', () => {
  const template = SEED_TRAINING_PLANS.find((plan) => plan.id === 'plan_two_dumbbells_floor');
  const days = template.days.filter((day) => !day.isRestDay);
  assert.deepEqual(days.map((day) => day.dayOfWeek), [2, 5]);
  for (const day of days) {
    assert.deepEqual(day.exercises.map((exercise) => exercise.exerciseId), exampleIds);
    for (const exercise of day.exercises) {
      assert.ok(catalogIds.has(exercise.exerciseId));
      assert.deepEqual([exercise.sets, exercise.repsMin, exercise.repsMax, exercise.restSeconds], [2, 8, 12, 90]);
      const guide = exerciseGuide(exercise.exerciseId);
      assert.ok(guide.steps.length > 1 && guide.sourceUrl.startsWith('https://'));
    }
  }
  assert.equal(SEED_TRAINING_PLANS.find((plan) => plan.id === 'plan_full_body_3x').frequency, 3);
});

test('hình kéo hai tạ chỉ đi cùng bài không tựa ghế', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const guide = exerciseGuide(rowId);
  assert.match(guide.equipment, /không tựa ghế/);
  assert.match(guide.steps.join(' '), /đồng thời/);
  assert.ok(fs.existsSync(path.join(__dirname, '../../src', guide.illustration.path)));
  assert.equal(exerciseGuide('ex_push_up').illustration, undefined);
  for (const different of ['ex_barbell_row', 'ex_romanian_deadlift', 'ex_goblet_squat', 'custom']) {
    assert.equal(exerciseGuide(different), undefined);
  }
});

function exampleWeek(days, sets, ids = exampleIds) {
  return days.map((day) => ({
    day,
    exercises: ids.map((id) => ({ id, sets, externalKg: null })),
  }));
}

function estimatedMinutes(exercises) {
  const warmupAndBuffer = 10 * 60;
  const transitions = Math.max(0, exercises.length - 1) * 120;
  const workAndRest = exercises.reduce((sum, { sets }) => sum + sets * 45 + (sets - 1) * 90, 0);
  return (warmupAndBuffer + transitions + workAndRest) / 60;
}

function inspectWeek(person, sessions, catalog) {
  const problems = new Set();
  const movementsSeen = new Set();
  const muscles = new Map();
  const days = sessions.map((session) => session.day).sort();
  if (days.join() !== [...person.days].sort().join()) problems.add('ngày tập');

  for (const session of sessions) {
    if (estimatedMinutes(session.exercises) > person.minutes) problems.add('thời lượng');
    for (const { id, sets, externalKg } of session.exercises) {
      if (!catalog.has(id)) {
        problems.add('thiếu bài: ' + id);
        continue;
      }
      const variant = variants[id];
      if (!variant || !variant.needs.every((item) => person.equipment.includes(item))) {
        problems.add('dụng cụ');
        continue;
      }
      if (person.excluded.includes(id)) {
        problems.add('bài đã loại');
        continue;
      }
      const bodyweightOnly = id === 'ex_push_up' && externalKg === 0;
      if (externalKg !== null && !bodyweightOnly) problems.add('tự điền tải khi chưa có lịch sử');
      movementsSeen.add(variant.movement);
      const tally = muscles.get(variant.muscle) ?? { days: new Set(), sets: 0 };
      tally.days.add(session.day);
      tally.sets += sets;
      muscles.set(variant.muscle, tally);
    }
  }
  for (const movement of movements) {
    if (!movementsSeen.has(movement)) problems.add('thiếu động tác: ' + movement);
  }
  return { problems, muscles };
}

test('hai buổi 35 phút, mỗi nhóm chính có hai ngày và bốn hiệp trực tiếp', () => {
  const week = exampleWeek(profile.days, 2);
  const result = inspectWeek(profile, week, referenceCatalog);
  assert.deepEqual([...result.problems], []);
  assert.deepEqual(week.map((s) => estimatedMinutes(s.exercises)), [28, 28]);
  for (const group of ['chest', 'back', 'quads', 'hamstrings']) {
    assert.deepEqual(result.muscles.get(group), { days: new Set([2, 5]), sets: 4 });
  }
});

test('so danh mục đang có với yêu cầu dụng cụ và động tác kéo', (t) => {
  const week = exampleWeek(profile.days, 2);
  const actual = inspectWeek(profile, week, catalogIds);
  t.diagnostic('Danh mục đang dùng: ' + ([...actual.problems].join(', ') || 'đủ bài cho ví dụ'));
  const missingRow = new Set(referenceCatalog);
  missingRow.delete(rowId);
  const expected = ['thiếu bài: ' + rowId, 'thiếu động tác: kéo'];
  assert.deepEqual([...inspectWeek(profile, week, missingRow).problems], expected);
  assert.deepEqual([...actual.problems], catalogIds.has(rowId) ? [] : expected);
});

test('chuyển ngày hoặc chỉ chọn một buổi làm đổi số ngày và hiệp đúng theo lịch', () => {
  for (const days of [[3, 6], [2]]) {
    const person = { ...profile, days };
    assert.ok(inspectWeek(person, exampleWeek(profile.days, 2), referenceCatalog).problems.has('ngày tập'));
    const matched = inspectWeek(person, exampleWeek(days, 2), referenceCatalog);
    assert.deepEqual([...matched.problems], []);
    assert.deepEqual(matched.muscles.get('chest'), { days: new Set(days), sets: 2 * days.length });
  }
});

test('20 phút một buổi vừa bản 19 phút và loại bản 28 phút', () => {
  const person = { ...profile, minutes: 20 };
  const shorter = exampleWeek(person.days, 1);
  assert.deepEqual([...inspectWeek(person, exampleWeek(person.days, 2), referenceCatalog).problems], ['thời lượng']);
  assert.equal(estimatedMinutes(shorter[0].exercises), 19);
  const result = inspectWeek(person, shorter, referenceCatalog);
  assert.deepEqual([...result.problems], []);
  assert.deepEqual(result.muscles.get('chest'), { days: new Set([2, 5]), sets: 2 });
});

test('đẩy ngực dốc cần ghế, còn bài người dùng đã loại không được dùng để đủ nhóm', () => {
  const week = exampleWeek(profile.days, 2, exampleIds.map((id) => id === 'ex_push_up' ? 'ex_incline_dumbbell_press' : id));
  assert.ok(inspectWeek(profile, week, referenceCatalog).problems.has('dụng cụ'));
  const withBench = { ...profile, equipment: [...profile.equipment, 'ghế dốc'] };
  assert.deepEqual([...inspectWeek(withBench, week, referenceCatalog).problems], []);
  const excluded = { ...profile, excluded: ['ex_push_up'] };
  const result = inspectWeek(excluded, exampleWeek(profile.days, 2), referenceCatalog);
  assert.deepEqual([...result.problems], ['bài đã loại', 'thiếu động tác: đẩy']);
});

test('hai ngày toàn ngực vẫn thiếu ba động tác của giáo án toàn thân', () => {
  const onlyChest = exampleWeek(profile.days, 3, ['ex_push_up']);
  const result = inspectWeek(profile, onlyChest, referenceCatalog);
  assert.deepEqual([...result.problems], movements.filter((m) => m !== 'đẩy').map((m) => 'thiếu động tác: ' + m));
});

test('đổi riêng cân nặng không cho phép tự điền kg tạ khi chưa có lịch sử', () => {
  for (const weightKg of [55, 90]) {
    const person = { ...profile, weightKg };
    const week = exampleWeek(profile.days, 2);
    week[0].exercises.find((exercise) => exercise.id === 'ex_push_up').externalKg = 0;
    assert.deepEqual([...inspectWeek(person, week, referenceCatalog).problems], []);
    week[0].exercises[0].externalKg = weightKg / 10;
    assert.ok(inspectWeek(person, week, referenceCatalog).problems.has('tự điền tải khi chưa có lịch sử'));
  }
});

function previousPerformance(sessions, exerciseId, loadUnit) {
  const latestFirst = [...sessions].sort((left, right) => right.date.localeCompare(left.date));
  for (const session of latestFirst) {
    if (!session.completed) continue;
    const recorded = session.sets.filter((set) =>
      set.id === exerciseId && set.unit === loadUnit && set.status === 'logged',
    );
    if (recorded.length) return { date: session.date, sets: recorded.map(({ kg, reps }) => [kg, reps]) };
  }
  return null;
}

test('lịch sử cùng biến thể và đơn vị đổi đúng từ 6 sang 10 kg mỗi tay', () => {
  for (const kg of [6, 10]) {
    const set = { id: rowId, kg, reps: 10, status: 'logged', unit: 'kg/hand' };
    const logs = [
      { date: '2026-11-16', completed: true, sets: [set, { ...set, reps: 0, status: 'skipped' }] },
      { date: '2026-11-17', completed: true, sets: [{ ...set, id: 'ex_dumbbell_curl', kg: 15 }] },
      { date: '2026-11-19', completed: true, sets: [{ ...set, kg: 20, unit: 'kg/pair' }] },
      { date: '2026-11-20', completed: false, sets: [{ ...set, kg: 12 }] },
    ];
    assert.deepEqual(previousPerformance(logs, rowId, 'kg/hand'), { date: '2026-11-16', sets: [[kg, 10]] });
    assert.equal(previousPerformance(logs.slice(1), rowId, 'kg/hand'), null);
  }
});

test('thay ngày buổi cũ chỉ đổi ngày tham chiếu, tải buổi đầu vẫn để trống', () => {
  const set = { id: rowId, kg: 6, reps: 10, status: 'logged', unit: 'kg/hand' };
  for (const date of ['2026-11-17', '2026-03-24']) {
    const history = [{ date, completed: true, sets: [set] }];
    const prior = previousPerformance(history, rowId, 'kg/hand');
    assert.deepEqual(prior, { date, sets: [[6, 10]] });
    assert.equal(exampleWeek(profile.days, 2)[0].exercises.find((e) => e.id === rowId).externalKg, null);
  }
});
