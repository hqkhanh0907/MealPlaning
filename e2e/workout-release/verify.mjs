import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { d, session, sleep } from '../exercise-guides/lib.mjs';
import { networkState, onboard, openTrainingScreen, resumeWorkout } from '../exercise-guides/setup.mjs';

const repo = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
assert.match(process.env.ANDROID_SERIAL ?? '', /^emulator-\d+$/, 'Select a test emulator');
assert(process.env.APK_PATH && process.env.OUTPUT_DIR, 'Set APK_PATH and a new OUTPUT_DIR');
const apk = realpathSync(process.env.APK_PATH);
const output = resolve(process.env.OUTPUT_DIR);
mkdirSync(dirname(output), { recursive: true });
assert(relative(realpathSync(repo), realpathSync(dirname(output))).startsWith('..'), 'Evidence must stay outside the repo');
mkdirSync(output);
const live = process.env.WORKOUT_SYNC_LIVE === '1';
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
const shell = (...args) => d.adb('shell', ...args).trim();
const result = {
  startedAt: new Date().toISOString(),
  sha: git('rev-parse', 'HEAD'),
  changes: git('status', '--short'),
  apkSha256: createHash('sha256').update(readFileSync(apk)).digest('hex'),
  apkBytes: statSync(apk).size,
  android: { serial: d.SERIAL, model: shell('getprop', 'ro.product.model'), sdk: shell('getprop', 'ro.build.version.sdk'), screen: shell('wm', 'size') },
  syncMode: live ? 'release server, new QA account' : 'offline fixture',
  checks: [],
  captures: [],
  measurements: {},
};
let app;
const q = JSON.stringify;
const deviceCall = (fn, ...args) => '(' + fn.toString() + ')(' + args.map(arg => q(arg)).join(',') + ')';
const visible = (selector) => '[...document.querySelectorAll(' + q(selector) + ')].some(x => x.getBoundingClientRect().width > 0 && !x.closest(".ion-page-hidden"))';
const wait = (selector) => app.waitFor(visible(selector), 20000, selector);
const open = (screen) => openTrainingScreen(app, screen);
const check = (name, pass) => {
  result.checks.push({ name, pass: Boolean(pass) });
  assert(pass, name);
};
const take = async (file) => {
  await sleep(350);
  const bytes = execFileSync(d.ADB, ['-s', d.SERIAL, 'exec-out', 'screencap', '-p'], { maxBuffer: 16e6 });
  writeFileSync(join(output, file), bytes);
  result.captures.push({ file, at: new Date().toISOString() });
};
const toggleNetwork = (online) => {
  shell('cmd', 'connectivity', 'airplane-mode', online ? 'disable' : 'enable');
  for (const service of ['wifi', 'data']) shell('svc', service, online ? 'enable' : 'disable');
};
const initialNetwork = networkState();

async function verifyOffline() {
  await waitForDefaultNetwork(false);
  result.offline = { ...networkState(), webviewOnline: await app.ev('navigator.onLine'), defaultNetwork: 'none' };
  check('Android disabled its default network', result.offline.airplane === '1' && result.offline.wifi === '0' && result.offline.mobileData === '0');
}

async function waitForDefaultNetwork(online) {
  const pattern = online ? /Active default network:\s*\d+/i : /Active default network:\s*none\b/i;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (pattern.test(shell('dumpsys', 'connectivity'))) return;
    await sleep(350);
  }
  throw Error('Android default network did not become ' + (online ? 'available' : 'offline'));
}

async function connect() {
  app = await session({ settleMs: 0 });
  await app.waitFor("location.pathname !== '/'", 40000, 'first app route');
}

async function launch() {
  app?.close();
  shell('am', 'force-stop', d.PKG);
  const start = performance.now();
  const androidTiming = shell('am', 'start', '-W', '-n', d.PKG + '/.MainActivity');
  await connect();
  await app.waitFor("location.pathname === '/tabs/dashboard' && " + visible('.dashboard-hero'), 30000, 'dashboard data visible after cold start');
  result.measurements.coldStartToDashboardUpperBoundMs = Math.round(performance.now() - start);
  result.measurements.androidActivityTotalMs = Number(androidTiming.match(/TotalTime:\s*(\d+)/)?.[1] ?? 0);
}

async function createAccount() {
  const username = 'qa' + randomBytes(7).toString('hex');
  await wait('.account-switch button');
  await app.click('.account-switch button');
  await app.type('#full-name', 'Workout Release QA');
  await app.type('#username', username);
  await app.type('#password', randomBytes(22).toString('hex'));
  await app.click('.account button[type=submit]');
  await app.waitFor("location.pathname === '/onboarding'", 60000, 'new QA account registration');
}

async function query(sql) {
  return app.ev(deviceCall(async (statement) => {
    const sqlite = Capacitor.Plugins.CapacitorSQLite;
    const owner = JSON.parse(localStorage.getItem('mealplan.account.v2')).id;
    const databaseFile = (await sqlite.getDatabaseList()).values.find(name => name.includes(owner));
    if (!databaseFile) throw Error('Account database missing');
    const database = databaseFile.replace(/(?:SQLite)?\.db$/, '');
    return (await sqlite.query({ database, statement, values: [], readonly: false })).values;
  }, sql));
}

async function readFinderPreferences() {
  const preferences = await query('SELECT key, value FROM workout_preference ORDER BY key');
  const byKey = new Map(preferences.map(row => [row.key, row.value]));
  const homeId = byKey.get('fitness_default_place');
  const home = JSON.parse(byKey.get('fitness_exercise_place:' + homeId) ?? 'null');
  const schedule = JSON.parse(byKey.get('fitness_finder_schedule') ?? 'null');
  check('Local account saved the selected venue, equipment and schedule',
    Boolean(homeId) && home?.id === homeId && home.name === 'Nhà' && home.equipment?.join(',') === 'dumbbell' &&
    schedule?.minutes === 25 && Array.isArray(schedule.weekdays) && [...schedule.weekdays].sort().join(',') === '3,6');
  return { preferences, homeId };
}

async function verifyRemote(rows, { preferences, homeId }) {
  const targets = await query('SELECT id, exercise_id, next_weight_kg FROM workout_exercise WHERE next_weight_kg IS NOT NULL');
  toggleNetwork(true);
  await waitForDefaultNetwork(true);
  const [{ user_version: schema }] = await query('PRAGMA user_version');
  await app.waitFor(deviceCall(async () => {
    const ownerId = JSON.parse(localStorage.getItem('mealplan.account.v2')).id;
    const sync = await Capacitor.Plugins.MealPlanSync.syncNow({ ownerId });
    return sync.status === 'saved' || sync.status === 'idle';
  }), 90000, 'native workspace sync');
  const expected = rows.map(({ id, weight_kg, reps }) => ({ id, weight_kg, reps }));
  const accepted = await app.ev(deviceCall(async (version) => {
    const account = await Capacitor.Plugins.MealPlanSync.session({ renew: true });
    const response = await fetch('https://cachyos-x8664.tailb306f9.ts.net/api/mealplan/workspace?schema=' + version, {
      headers: { Authorization: account.accessToken }, cache: 'no-store',
    });
    if (!response.ok) throw Error('Workspace HTTP ' + response.status);
    const { revision, snapshot } = await response.json();
    return {
      revision,
      version: snapshot.schemaVersion,
      sets: snapshot.tables.workout_set.map(({ id, weight_kg, reps }) => ({ id, weight_kg, reps })),
      preferences: snapshot.tables.workout_preference.map(({ key, value }) => ({ key, value })),
      sessions: snapshot.tables.workout_session.map(({ origin, place_id }) => ({ origin, place_id })),
      targets: snapshot.tables.workout_exercise.filter(row => row.next_weight_kg != null)
        .map(({ id, exercise_id, next_weight_kg }) => ({ id, exercise_id, next_weight_kg })),
    };
  }, schema));
  check('Server has exactly the saved offline sets and their quantities',
    accepted.revision > 0 && accepted.version === schema && accepted.sets.length === expected.length &&
    expected.every(row => accepted.sets.some(remote => remote.id === row.id && remote.weight_kg === row.weight_kg && remote.reps === row.reps)));
  check('Server projected the stored venue, equipment and schedule into this account',
    accepted.preferences.length === preferences.length &&
    preferences.every(local => accepted.preferences.some(remote => remote.key === local.key && remote.value === local.value)));
  check('Synced session retains the composed origin and selected venue',
    accepted.sessions.some(item => item.origin === 'composed' && item.place_id === homeId));
  check('Server preserves the accepted 10 kg per hand as a 20 kg total target',
    targets.length === 1 && targets[0].next_weight_kg === 20 &&
    accepted.targets.some(target => target.id === targets[0].id && target.exercise_id === 'dumbbell-floor-press' && target.next_weight_kg === 20));
  result.remote = { revision: accepted.revision, schema: accepted.version, setCount: accepted.sets.length, preferenceCount: accepted.preferences.length };
}

async function startComposedWorkout() {
  await app.click('[data-testid=find-workout-plan]');
  await app.waitFor(visible('#finder-minutes, [data-finder-start]'), 20000, 'finder ready');
  if (!await app.ev(visible('#finder-minutes'))) await app.click('[data-finder-start]');
  await app.click('[data-finder-day="3"]');
  await app.click('[data-finder-day="6"]');
  await app.type('#finder-minutes', '25');
  await app.click('[data-finder-place="Nhà"]');
  await app.click('[data-finder-gear="dumbbell"]');
  await app.click('[data-finder-avoid="none"]');
  await app.click('[data-finder-submit]');
  await wait('[data-finder-start-composed]');
  await take('one-off-preview.png');
  const before = await query('SELECT id FROM workout_session');
  check('A preview does not start a session', before.length === 0);
  await app.click('[data-finder-start-composed]');
  await wait('#weight-kg');
  check('Training view has its own route without a visible module bar',
    await app.ev('location.pathname === "/training/session" && !(' + visible('[data-testid=workout-tab-today]') + ')'));
}

async function inspectLibrary() {
  await open('exercises');
  await wait('[data-picker-open-filters]');
  await app.click('[data-picker-open-filters]');
  await wait('#eps-filter-equipment');
  await app.ev(deviceCall(() => {
    const select = document.getElementById('eps-filter-equipment');
    select.value = 'dumbbell';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }));
  await app.click('[data-picker-show-results]');
  await wait('[data-filter-chip="equipment"]');
  await app.type('#eps-search-input', 'goblet squat');
  await wait('[data-exercise-id="goblet-squat"]');
  await take('exercise-library.png');
  await app.click('[data-exercise-id="goblet-squat"]');
  await app.waitFor('!!(' + app.GUIDE + ')', 12000, 'exercise technique outside a session');
  check('Library opens the selected technique offline', (await app.readGuide())?.id === 'goblet-squat');
  await app.closeGuide();
  check('Consulting a technique leaves the session list empty', (await query('SELECT id FROM workout_session')).length === 0);
}

async function verifyJournal() {
  const first = await app.logger();
  const movement = first.name;
  check('First set leaves load and reps blank without any history', first.weight === '' && first.reps === '');
  await app.type('#weight-kg', '6');
  await app.type('#reps', '8');
  await app.openGuide();
  await take('exercise-technique.png');
  await app.closeGuide();
  let draft = await app.logger();
  check('The guide preserves the exact exercise, weight and reps', draft.name === movement && draft.weight === '6' && draft.reps === '8');
  await app.click('[data-testid=workout-back]');
  await wait('[data-testid=resume-workout]');
  await launch();
  await resumeWorkout(app);
  draft = await app.logger();
  check('Force stop and resume preserve unsaved input', draft.name === movement && draft.weight === '6' && draft.reps === '8' && draft.sets.length === 0);

  const start = performance.now();
  await app.type('#weight-kg', '7');
  await app.type('#reps', '9');
  await app.ev("(() => {const button=[...document.querySelectorAll('.set-entry ion-button')].find(el=>el.textContent.trim()==='Ghi hiệp');if(!button)throw Error('Log button missing');button.click();button.click();})()");
  await app.waitFor("document.querySelectorAll('.set-history article').length === 1", 10000, 'one set visible');
  result.measurements.editFieldsToSavedRowMs = Math.round(performance.now() - start);
  const logged = await query("SELECT id, weight_kg, reps FROM workout_set WHERE status='logged'");
  check('Double tap writes exactly one SQLite row with the entered values', logged.length === 1 && logged[0].weight_kg === 7 && logged[0].reps === 9);
  draft = await app.logger();
  check('Next set prefills last weight and clears reps', draft.weight === '7' && draft.reps === '');
  await take('saved-set.png');

  await app.clickLabel('Hoàn thành buổi tập');
  await wait('.wsm-done');
  await take('completed-workout.png');
  await app.click('.wsm-done');
  await open('history');
  await wait('.trend ion-button');
  await app.clickText('Xem xu hướng 8 tuần', '.trend ion-button');
  await app.waitFor("document.querySelectorAll('.week-volume li').length === 8", 15000, 'eight weekly figures');
  check('Trend shows the logged volume in the current week', await app.ev("Array.from(document.querySelectorAll('.week-volume meter'), meter => meter.value).filter(v => v === 63).length === 1"));
  await take('eight-week-progress.png');
  await app.clickText('Thu gọn', '.trend ion-button');
  await app.click('.session-card summary');
  await wait('[data-testid=replay-workout]');
  await take('workout-history.png');
  await app.click('[data-testid=replay-workout]');
  await wait('[data-testid=start-replay]');
  await app.clickText('Bắt đầu tập lại', '[data-testid=start-replay]');
  await wait('#weight-kg');
  const replay = await app.logger();
  const sessions = await query('SELECT id, status FROM workout_session ORDER BY started_at');
  const stored = await query("SELECT id FROM workout_set WHERE status='logged'");
  check('Replay starts a second session while preserving the original results',
    sessions.length === 2 && sessions[0].status === 'completed' && sessions[1].status === 'active' &&
    stored.length === 1 && stored[0].id === logged[0].id && replay.sets.length === 0 && replay.weight === '7' && replay.reps === '');
}

async function verifyNextLoad() {
  const press = 'Đẩy ngực tạ đơn nằm sàn';
  await app.selectTab(press);
  await app.type('#weight-kg', '8');
  for (let set = 1; set <= 2; set++) {
    await app.type('#reps', '12');
    if (set === 2) await app.clickText('Dễ', '.effort-chip');
    await app.clickText('Ghi hiệp', '.set-entry ion-button');
    await app.waitFor("document.querySelectorAll('.set-history article').length === " + set, 8000, 'working set ' + set);
  }
  await app.clickLabel('Hoàn thành buổi tập');
  await wait('.wsm-choice input');
  check('The summary explains two working sets and leaves an unknown next load blank',
    await app.ev("document.querySelector('.wsm-choice p').textContent.includes('2 hiệp') && document.querySelector('.wsm-choice input').value === ''"));
  await app.type('.wsm-choice input', '10');
  await app.clickText('Xác nhận tăng', '.wsm-choice button');
  await app.waitFor("document.querySelector('.wsm-choice')?.textContent.includes('Đã lưu 10 kg mỗi tay')", 10000, 'confirmed load');
  await take('confirmed-next-load.png');
  await app.click('.wsm-done');
  await wait('[data-testid=start-free]');
  await app.click('[data-testid=start-free]');
  await app.pickExercise({ nameVi: press });
  const draft = await app.logger();
  check('Next session shows the confirmed load per hand with blank reps',
    draft.name === press && draft.weight === '10' && draft.reps === '');
  await app.clickLabel('Xóa mức tạ');
  check('Clearing the next load leaves logged sets untouched',
    (await app.logger()).weight === '' && (await query("SELECT id FROM workout_set WHERE status='logged'")).length === 3);
}

try {
  if (shell('pm', 'list', 'packages', d.PKG).split('\n').includes('package:' + d.PKG)) {
    assert.equal(d.adb('uninstall', d.PKG).trim(), 'Success', 'remove the previous test install');
  }
  d.adb('install', apk);
  const installed = shell('pm', 'path', d.PKG).split('\n').find(line => line.endsWith('/base.apk'));
  assert(installed, 'Installed APK missing');
  result.installedSha256 = shell('sha256sum', installed.slice(8)).split(/\s+/)[0];
  check('Installed APK matches supplied artifact', result.installedSha256 === result.apkSha256);
  toggleNetwork(live);
  await waitForDefaultNetwork(live);
  shell('am', 'start', '-n', d.PKG + '/.MainActivity');
  await connect();
  await app.waitFor("location.pathname === '/account'", 30000, 'first-install account screen');
  await wait('.account-switch button');
  check('App opened before sign-in on a clean install', await app.ev(visible('.account-switch button')));
  if (live) await createAccount();
  await onboard(app, { openFitness: false });
  toggleNetwork(false);
  await verifyOffline();
  await app.click('[data-testid=tab-calendar]');
  await app.waitFor("location.pathname === '/tabs/calendar'", 10000, 'meal calendar');
  await open('today');
  await app.click('[data-testid=workout-back]');
  await app.waitFor("location.pathname === '/tabs/calendar'", 10000, 'return to origin');
  check('Leaving Workout returns to the previous main tab', await app.ev(visible('[data-testid=tab-fitness]')));
  await open('today');
  await wait('[data-testid=find-workout-plan]');
  await take('today-empty.png');
  await inspectLibrary();
  await open('today');
  await startComposedWorkout();
  await verifyJournal();
  await verifyNextLoad();
  const finder = await readFinderPreferences();
  if (live) await verifyRemote(await query("SELECT id, weight_kg, reps FROM workout_set WHERE status='logged'"), finder);
} catch (error) {
  result.error = error.stack ?? String(error);
  try { await take('failure.png'); } catch {}
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  writeFileSync(join(output, 'workout-release.json'), JSON.stringify(result, null, 2));
  app?.close();
  shell('cmd', 'connectivity', 'airplane-mode', initialNetwork.airplane === '1' ? 'enable' : 'disable');
  for (const [service, state] of [['wifi', initialNetwork.wifi], ['data', initialNetwork.mobileData]]) {
    shell('svc', service, state === '1' ? 'enable' : 'disable');
  }
  console.log(JSON.stringify(result, null, 2));
}
