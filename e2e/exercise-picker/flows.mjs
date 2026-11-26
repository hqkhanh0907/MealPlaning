import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { d, session, sleep } from '../exercise-guides/lib.mjs';
import { freshOffline, networkState, onboard } from '../exercise-guides/setup.mjs';

const repo = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const output = process.env.OUTPUT_DIR;
assert(output && isAbsolute(output), 'Set OUTPUT_DIR to an absolute path outside the repo');
let outputParent = resolve(output);
while (!existsSync(outputParent)) outputParent = dirname(outputParent);
const out = resolve(realpathSync(outputParent), relative(outputParent, resolve(output)));
assert(relative(repo, out).startsWith('../'), 'OUTPUT_DIR must be outside the repo');
assert.match(process.env.ANDROID_SERIAL ?? '', /^emulator-\d+$/, 'Select a dedicated test emulator');
mkdirSync(out, { recursive: true });

const results = { started: new Date().toISOString(), serial: d.SERIAL, checks: [], images: [] };
const git = (...args) => execFileSync('git', ['-C', repo, ...args], {
  encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, maxBuffer: 32e6,
});
const q = JSON.stringify;
const catalog = new Map(JSON.parse(readFileSync(new URL('../exercise-guides/expected.json', import.meta.url)))
  .map((exercise) => [exercise.id, exercise]));
const name = (id) => catalog.get(id).nameVi;
const search = '#eps-search-input';
const filters = '[data-picker-open-filters]';
const filterResults = '[data-picker-show-results]';
const row = (id) => '.eps-row[data-exercise-id=' + q(id) + ']';
const custom = { id: 'qa-exercise-picker-legacy', name: 'QA Legacy Picker Move', nameVi: 'Bài thử cũ của bộ chọn' };
let s;
let previousDisplay;
let previousKeyboard;
let defaultText;

function check(label, pass, detail) {
  results.checks.push({ label, pass: Boolean(pass), detail });
  assert(pass, label + ' · ' + q(detail));
}

function shot(file) {
  const image = execFileSync(d.ADB, ['-s', d.SERIAL, 'exec-out', 'screencap', '-p'], { maxBuffer: 8e6 });
  writeFileSync(join(out, file), image, { flag: 'wx' });
  results.images.push(file);
}

function adb(...args) {
  return d.adb('shell', ...args).trim();
}

function display() {
  return {
    size: adb('wm', 'size'),
    density: adb('wm', 'density'),
    fontScale: adb('settings', 'get', 'system', 'font_scale'),
  };
}

async function launch({ restart = false } = {}) {
  if (restart) {
    s?.close();
    s = undefined;
    adb('am', 'force-stop', d.PKG);
    adb('am', 'start', '-n', d.PKG + '/.MainActivity');
  }
  s = await session();
  await onboard(s);
  const network = { ...networkState(), browserOnline: await s.ev('navigator.onLine') };
  check('Android stays offline', network.airplane === '1' && network.wifi === '0'
    && network.mobileData === '0' && network.browserOnline === false, network);
}

async function seedLegacyExercise() {
  const legacy = await s.ev(`(async () => {
    const sqlite = Capacitor.Plugins.CapacitorSQLite;
    const databases = (await sqlite.getDatabaseList()).values;
    const file = databases.find((filename) => /healthmate/i.test(filename));
    if (!file) throw new Error('Fixture database missing');
    const database = file.replace(/SQLite\\.db$/, '').replace(/\\.db$/, '');
    await sqlite.run({
      database,
      statement: 'INSERT INTO exercise (id,name,name_vi,muscle_group,category,equipment,instructions,source) VALUES (?,?,?,?,?,?,?,?)',
      values: ${q([custom.id, custom.name, custom.nameVi, 'back', 'compound', 'QA unknown equipment', null, 'custom'])},
      transaction: true,
      readonly: false,
    });
    return sqlite.query({
      database,
      statement: 'SELECT id, source, equipment FROM exercise WHERE id = ?',
      values: [${q(custom.id)}],
      readonly: false,
    });
  })()`);
  check('Legacy fixture inserted', legacy.values?.length === 1
    && legacy.values[0].id === custom.id && legacy.values[0].source === 'custom', legacy);
}

const present = (selector) => `!!document.querySelector(${q(selector)})`;
const wait = (selector) => s.waitFor(present(selector), 10000, selector);
const rows = () => s.ev("[...document.querySelectorAll('.eps-row[data-exercise-id]')].map(e=>e.dataset.exerciseId)");
const query = (value) => s.type(search, value);

async function openPicker(trigger) {
  await s.click(trigger);
  await wait(search);
}

async function closePicker(selector = '.eps-close') {
  await s.click(selector);
  await s.waitFor('!(' + present(search) + ')', 8000, 'picker dismissed');
}

async function openFilters() {
  await s.click(filters);
  await wait(filterResults);
}

async function showResults() {
  await s.click(filterResults);
  await wait(search);
}

const muscle = (key) => s.click('[data-muscle=' + q(key) + ']');

async function selectEquipment(key) {
  const selector = '[data-equipment-filter=' + q(key) + ']';
  await wait(selector);
  await s.ev(`(() => {
    const option = document.querySelector(${q(selector)});
    const field = option.closest('select');
    field.value = option.value;
    field.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

async function choosePlace(label) {
  const clicked = await s.ev(`(() => {
    const button = [...document.querySelectorAll('[data-place-id]')]
      .find((entry) => entry.textContent.trim().startsWith(${q(label)}));
    button?.click();
    return button?.dataset.placeId ?? null;
  })()`);
  check('Selected place ' + label, clicked, clicked);
}

async function inventory() {
  return s.ev(`[...document.querySelectorAll('[data-inventory-key]')]
    .map((item) => ({
      key: item.dataset.inventoryKey,
      checked: (item.matches('input') ? item : item.querySelector('input')).checked,
    }))`);
}

async function savePlace(label, key, rename) {
  await choosePlace(label);
  await s.click('[data-place-edit]');
  await wait('#eps-place-name');
  if (rename) await s.type('#eps-place-name', rename);
  for (const item of await inventory()) {
    if (item.checked !== (item.key === key)) {
      await s.click('[data-inventory-key=' + q(item.key) + ']');
    }
  }
  const selected = (await inventory()).filter((item) => item.checked).map((item) => item.key);
  check('Inventory before saving ' + (rename ?? label), selected.join() === key, selected);
  await s.click('[data-place-save]');
  await wait(filterResults);
}

async function clearFilters() {
  await openFilters();
  if (await s.ev(present('[data-picker-clear]'))) await s.click('[data-picker-clear]');
  await showResults();
}

async function ax(selector, shadowSelector) {
  const host = `document.querySelector(${q(selector)})`;
  const expression = shadowSelector ? `${host}.shadowRoot.querySelector(${q(shadowSelector)})` : host;
  const { result: { result: { objectId } } } = await s.client.send('Runtime.evaluate', { expression });
  assert(objectId, expression);
  try {
    const { result: { node: { backendNodeId } } } = await s.client.send('DOM.describeNode', { objectId });
    const { result: { nodes: [node] } } = await s.client.send('Accessibility.getPartialAXTree', {
      backendNodeId,
      fetchRelatives: false,
    });
    return {
      role: node.role?.value,
      name: node.name?.value,
      ignored: node.ignored,
      properties: Object.fromEntries(node.properties?.map(({ name, value }) => [name, value.value]) ?? []),
    };
  } finally {
    await s.client.send('Runtime.releaseObject', { objectId });
  }
}

const viewport = () => s.ev(`({
  layoutWidth: innerWidth, layoutHeight: innerHeight, width: visualViewport.width,
  height: visualViewport.height, pixelRatio: devicePixelRatio,
})`);

const imeState = () => adb('dumpsys', 'input_method').match(/mInputShown=(true|false)/)?.[1];
const focusedWindow = () => adb('dumpsys', 'window').match(/mCurrentFocus=([^\n]*)/)?.[1]?.trim();

async function nativeTap(selector) {
  const point = await s.ev(`(() => {
    const box = document.querySelector(${q(selector)}).getBoundingClientRect();
    return { x: Math.round((box.left + box.width / 2) * devicePixelRatio),
      y: Math.round((box.top + box.height / 2) * devicePixelRatio), width: box.width, height: box.height };
  })()`);
  adb('input', 'tap', String(point.x), String(point.y));
  return point;
}

async function awaitKeyboard(shown) {
  const end = Date.now() + 8000;
  const expected = String(shown);
  let state = imeState();
  while (state !== expected && Date.now() < end) {
    await sleep(250);
    state = imeState();
  }
  return state === expected;
}

async function keyboardSearch() {
  const initial = await viewport();
  const windowBefore = focusedWindow();
  check('Android foreground is the APK before the native search tap', windowBefore?.includes(d.PKG), windowBefore);
  await nativeTap(search);
  const shown = await awaitKeyboard(true);
  const focused = await s.ev(`document.activeElement?.matches(${q(search)})`);
  check('Touch opened Android keyboard on the search input', shown && focused, {
    focused, keyboard: shown, initial, open: await viewport(), windowAfter: focusedWindow(),
  });
  const searchText = name('dumbbell-floor-press').toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/đ/g, 'd');
  assert.match(searchText, /^[a-z0-9 ]+$/);
  adb('input', 'text', searchText.replaceAll(' ', '%s'));
  await wait(row('dumbbell-floor-press'));
  const value = await s.ev(`document.querySelector(${q(search)}).value`);
  const matches = await rows();
  check('Vietnamese search without accents through the keyboard', value === searchText
    && matches.length === 1 && matches[0] === 'dumbbell-floor-press', { value, matches });
  shot('01-keyboard.png');
  adb('input', 'keyevent', '4');
  check('Native Back hides the keyboard and keeps the picker', await awaitKeyboard(false)
    && await s.ev(present(search)), await viewport());
}

async function inspectAccessibility() {
  const modal = 'ion-modal.show-modal:has(#eps-search-input)';
  const dialog = await ax(modal, '[role="dialog"]');
  const input = await ax(search);
  const close = await ax('.eps-close');
  const filter = await ax(filters);
  const status = await ax(modal + ' [role="status"]');
  const exercise = await ax(row('glute-ham-raise'));
  check('Picker dialog, search and buttons have accessible labels', dialog.role === 'dialog'
    && dialog.name === 'Chọn bài tập' && !dialog.ignored && input.role === 'searchbox'
    && input.name === 'Tìm bài tập' && close.role === 'button' && close.name === 'Đóng bộ chọn bài tập'
    && filter.role === 'button' && /lọc/i.test(filter.name ?? '') && exercise.role === 'button'
    && exercise.name?.includes(name('glute-ham-raise')), { dialog, input, close, filter, exercise });
  const visibleStatus = await s.ev(`document.querySelector(${q(modal + ' [role="status"]')}).textContent.trim()`);
  check('Results count is exposed as a live status', status.role === 'status' && !status.ignored
    && /\b1\b/.test(visibleStatus), { status, visibleStatus });
}

async function hitTargets(selectors) {
  const targets = await s.ev(`(() => ${q(selectors)}.map((selector) => {
    const el = document.querySelector(selector);
    if (!el) return { selector, missing: true };
    const { left, top, width, height } = el.getBoundingClientRect();
    let hit = document.elementFromPoint(left + width / 2, top + height / 2);
    while (hit?.shadowRoot?.elementFromPoint) {
      const inner = hit.shadowRoot.elementFromPoint(left + width / 2, top + height / 2);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    while (hit && hit !== el && !el.contains(hit)) hit = hit.getRootNode().host;
    return { selector, width, height, hit: Boolean(hit) };
  }))()`);
  check('Visible targets are touchable at 44 × 44 CSS pixels', targets.every(({ width, height, hit }) =>
    width >= 44 && height >= 44 && hit), targets);
}

async function longNameLayout() {
  await query(catalog.get('glute-ham-raise').name);
  const current = row('glute-ham-raise');
  await wait(current);
  return s.ev(`(async () => {
    const entry = document.querySelector(${q(current)});
    const label = entry.querySelector('.eps-row__name');
    const scroller = await entry.closest('ion-content').getScrollElement();
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = [...range.getClientRects()];
    const box = entry.getBoundingClientRect();
    return {
      width: innerWidth, font: getComputedStyle(label).fontSize, glyphHeight: text[0]?.height,
      wrapping: text.length, contained: text.every((line) =>
        line.left >= box.left - 1 && line.right <= box.right + 1
        && line.top >= box.top - 1 && line.bottom <= box.bottom + 1),
      horizontalOverflow: scroller.scrollWidth - scroller.clientWidth,
    };
  })()`);
}

async function largeText() {
  const receipt = display();
  check('Emulator uses the compact viewport and large font', receipt.size.includes('Override size: 720x1280')
    && receipt.density.includes('Override density: 320') && Number(receipt.fontScale) === 1.3, receipt);
  const layout = await longNameLayout();
  const defaultScale = Number(previousDisplay.fontScale === 'null' ? 1 : previousDisplay.fontScale);
  check('Long label wraps without clipping or horizontal scroll on the compact viewport',
    layout.width <= 360 && layout.wrapping >= 2 && layout.contained && layout.horizontalOverflow <= 1,
    { layout, defaultText, defaultScale });
  if (defaultScale < 1.3) {
    check('Android large font increases the rendered text height', layout.glyphHeight > defaultText.glyphHeight,
      { large: layout.glyphHeight, default: defaultText.glyphHeight });
  }
  await hitTargets([search, filters, '.eps-close', row('glute-ham-raise')]);
  await inspectAccessibility();
  shot('07-large-text.png');
  await openFilters();
  await hitTargets([filterResults]);
  shot('08-large-text-filters.png');
  await s.ev(`document.addEventListener('click', (event) => {
    window.pickerNavigationTap = event.composedPath().slice(0, 7).map((item) => item.tagName);
  }, { capture: true, once: true })`);
  const backTarget = await nativeTap('[data-picker-back]');
  const returned = await wait(search).then(() => true, () => false);
  check('Native Back button returns to results and provides a 44 × 44 target', returned
    && backTarget.width >= 44 && backTarget.height >= 44,
  { backTarget, returned, touched: await s.ev('window.pickerNavigationTap ?? null') });

  await query('');
  await openFilters();
  await choosePlace('Nhà');
  await muscle('chest');
  await selectEquipment('dumbbell');
  await showResults();
  const support = row('single-arm-overhead-press');
  await wait(support);
  const compact = await s.ev(`(async () => {
    const item = document.querySelector(${q(support)});
    item.scrollIntoView({block: 'center'});
    const heading = item.querySelector('.eps-row__muscle');
    const label = heading.getBoundingClientRect();
    const button = item.getBoundingClientRect();
    const scrolling = await item.closest('ion-content').getScrollElement();
    return { width: innerWidth, label: heading.textContent.trim(), match: item.dataset.muscleMatch,
      fits: label.left >= button.left && label.right <= button.right
        && label.top >= button.top && label.bottom <= button.bottom,
      overflow: scrolling.scrollWidth - scrolling.clientWidth };
  })()`);
  check('Compact Chest results display the complete secondary label', compact.width <= 360
    && compact.match === 'secondary' && compact.label === 'Cơ phụ · Ngực' && compact.fits
    && compact.overflow <= 1, compact);
  shot('08a-chest-compact.png');
  await clearFilters();
}

async function activeWorkout() {
  await s.click('[aria-label="Thứ 2: Full Body A"]');
  await s.tapText('Tập buổi này');
  await s.waitFor("document.querySelectorAll('.workout-tab').length >= 4", 12000, 'active workout tabs');
  const baselineTabs = await s.ev("document.querySelectorAll('.workout-tab').length");
  await openPicker('.active-workout .free-mode__toggle');
  const initial = await rows();
  check('Unfiltered workout picker shows all catalog entries and the fixture',
    initial.length === catalog.size + 1 && [...catalog.keys()].every((id) => initial.includes(id))
      && initial.includes(custom.id), { count: initial.length, expected: catalog.size + 1 });
  shot('00-results.png');
  await keyboardSearch();
  defaultText = await longNameLayout();
  shot('01a-default-text.png');
  await query('');

  await openFilters();
  await savePlace('Nhà', 'dumbbell');
  await muscle('chest');
  await showResults();
  const homeChest = await rows();
  check('Home with dumbbells excludes exercises requiring a bench or barbell',
    homeChest.includes('dumbbell-floor-press') && homeChest.includes('archer-push-up')
      && ['dumbbell-chest-press', 'dumbbell-squeeze-press', 'bench-press', custom.id]
        .every((id) => !homeChest.includes(id)), homeChest);
  await openFilters();
  await selectEquipment('dumbbell');
  shot('02-active-filters.png');
  await showResults();
  const compatible = await rows();
  check('Explicit equipment narrows Home and Chest results', compatible.includes('dumbbell-floor-press')
    && !compatible.includes('archer-push-up') && compatible.every((id) => homeChest.includes(id)), compatible);
  const chestRows = await s.ev(`[...document.querySelectorAll('.eps-row')].map(button => ({
    id: button.dataset.exerciseId,
    match: button.dataset.muscleMatch,
    label: button.querySelector('.eps-row__muscle')?.textContent.trim() ?? null,
  }))`);
  const floor = chestRows.find((entry) => entry.id === 'dumbbell-floor-press');
  const overhead = chestRows.find((entry) => entry.id === 'single-arm-overhead-press');
  const firstSupporting = chestRows.findIndex((entry) => entry.match === 'secondary');
  check('Home Chest ranks every primary match before secondary matches', floor?.match === 'primary'
    && firstSupporting > 0 && chestRows.slice(0, firstSupporting).every((entry) => entry.match === 'primary')
    && chestRows.slice(firstSupporting).every((entry) => entry.match === 'secondary')
    && new Set(chestRows.map((entry) => entry.id)).size === chestRows.length, chestRows);
  const overheadAx = await ax(row('single-arm-overhead-press'));
  check('One arm overhead press reads as a secondary Chest match', overhead?.match === 'secondary'
    && overhead.label === 'Cơ phụ · Ngực' && overheadAx.name?.includes('Cơ phụ · Ngực'), { overhead, overheadAx });
  const focus = await s.ev(`document.activeElement?.matches(${q(filters)})`);
  check('Closing filters restores focus to the filter opener', focus, focus);
  shot('03-home-chest.png');

  await clearFilters();
  await query(custom.name);
  await wait(row(custom.id));
  const legacy = await s.ev(`document.querySelector(${q(row(custom.id))}).textContent.trim()`);
  check('Legacy exercise remains searchable and marks unknown equipment', legacy.includes(custom.nameVi)
    && legacy.includes('Chưa xác định dụng cụ'), legacy);
  shot('04-legacy.png');

  for (const group of ['chest', 'triceps']) {
    await clearFilters();
    await query(catalog.get('archer-push-up').name);
    await wait(row('archer-push-up'));
    await openFilters();
    await muscle(group);
    await showResults();
    const found = await rows();
    const match = await s.ev(`document.querySelector(${q(row('archer-push-up'))})?.dataset.muscleMatch`);
    check('Archer Push-Up is a primary match for ' + group, found.includes('archer-push-up')
      && match === 'primary', { found, match });
  }

  await clearFilters();
  await query('pull-up');
  await openFilters();
  await savePlace('Ngoài trời', 'pull-up-bar', 'Công viên');
  await muscle('back');
  await showResults();
  const found = await rows();
  const searchValue = await s.ev(`document.querySelector(${q(search)}).value`);
  check('Park and back criteria preserve the search and find Pull-Up',
    searchValue === 'pull-up' && found.includes('pull-up'), { query: searchValue, found });
  shot('05-park-back.png');
  await openFilters();
  await choosePlace('Nhà');
  await showResults();
  const homePull = await rows();
  const homeQuery = await s.ev(`document.querySelector(${q(search)}).value`);
  check('Switching from Park to Home changes the results without clearing the search',
    homeQuery === searchValue && !homePull.includes('pull-up'), { query: homeQuery, homePull });
  await openFilters();
  await choosePlace('Công viên');
  await showResults();
  await wait(row('pull-up'));
  await closePicker(row('pull-up'));
  const logger = await s.logger();
  check('Workout adds exactly one chosen exercise and selects its logger',
    logger.tabs.length === baselineTabs + 1 && logger.name === name('pull-up'), logger);
  shot('06-workout-added.png');

  await s.clickLabel('Hủy buổi tập');
  await wait('ion-alert button');
  await s.clickText('Hủy buổi', 'ion-alert button');
  await s.waitFor('!(' + present('.active-workout') + ')', 10000, 'workout cancelled');
}

const editPlan = async () => {
  await s.clickText('Chỉnh giáo án', 'ion-button,button', 0);
  await wait('#personal-plan-name');
};
const planRows = () => s.ev(`[...document.querySelectorAll('.editor-exercise')].map((row) => ({
  name: row.querySelector('strong').textContent.trim(),
  dose: row.querySelector('p').textContent.replace(/\\s+/g, ' ').trim(),
}))`);

async function editAndSavePlan() {
  const add = '#personal-plan-exercise';
  const before = await planRows();
  assert(before.some((exercise) => exercise.name === name('squat')), 'Expected squat in the day fixture');
  await openPicker(add);
  await query('');
  const available = await rows();
  check('Plan picker excludes cardio and existing exercises in the selected day',
    !available.includes('treadmill-run') && !available.includes('squat')
      && available.includes('ab-wheel-rollout'), { count: available.length, baseline: before });
  await query(catalog.get('ab-wheel-rollout').searchNames[0]);
  await wait(row('ab-wheel-rollout'));
  await closePicker(row('ab-wheel-rollout'));
  const added = await planRows();
  const addDose = added.find((entry) => entry.name === name('ab-wheel-rollout'))?.dose;
  check('Editor adds by source alias with default sets, reps and rest', added.length === before.length + 1
    && addDose === '3 × 8–12 lần · nghỉ 90 giây', added);

  await s.clickLabel('Thay ' + name('squat'));
  await wait(search);
  await query(name('side-plank'));
  await wait(row('side-plank'));
  await closePicker(row('side-plank'));
  const replaced = await planRows();
  const removeIndex = before.findIndex((entry) => entry.name === name('squat'));
  check('Editor replaces the same row and applies timed defaults', replaced.length === added.length
    && !replaced.some((entry) => entry.name === name('squat'))
    && replaced[removeIndex]?.name === name('side-plank')
    && replaced[removeIndex].dose.includes('30–45 giây'), replaced);
  await s.type('#personal-plan-name', 'Giáo án QA bộ chọn');
  shot('09-editor-draft.png');
  await s.clickText('Lưu giáo án', 'ion-button,button', 0);
  await s.waitFor('!(' + present('#personal-plan-name') + ')', 10000, 'plan saved');
  return replaced;
}

async function checkAfterRestart(expectedPlan) {
  await editPlan();
  const saved = await planRows();
  const savedName = await s.ev("document.querySelector('#personal-plan-name').value");
  check('Plan name and exercise changes persist after application restart',
    savedName === 'Giáo án QA bộ chọn' && q(saved) === q(expectedPlan), { savedName, saved });
  shot('10-editor-relaunched.png');

  await openPicker('#personal-plan-exercise');
  await openFilters();
  await choosePlace('Công viên');
  await s.click('[data-place-edit]');
  await wait('#eps-place-name');
  const placeName = await s.ev("document.querySelector('#eps-place-name').value");
  const selected = (await inventory()).filter((item) => item.checked).map((item) => item.key);
  check('The renamed park and exact inventory survive restart', placeName === 'Công viên'
    && selected.join() === 'pull-up-bar', { placeName, selected });
  shot('11-park-relaunched.png');
}

try {
  const apk = resolve(process.env.APK_PATH ?? join(repo, 'android/app/build/outputs/apk/debug/app-debug.apk'));
  const version = adb('getprop', 'ro.build.version.release');
  const device = adb('getprop', 'ro.product.model');
  const apkHash = createHash('sha256').update(readFileSync(apk)).digest('hex');
  const installedPath = adb('pm', 'path', d.PKG).split('\n').find((line) => line.endsWith('/base.apk'))?.slice(8);
  assert(installedPath, 'Install the debug APK on the chosen emulator before running');
  const installedHash = adb('sha256sum', installedPath).split(/\s+/)[0];
  results.provenance = { revision: git('rev-parse', 'HEAD').trim(), apk, apkHash, installedHash, version, device };
  writeFileSync(join(out, 'workspace.diff'), git('diff', 'HEAD', '--no-ext-diff', '--binary'), { flag: 'wx' });
  writeFileSync(join(out, 'workspace-status.txt'), git('status', '--short'), { flag: 'wx' });
  check('The installed APK matches the build under test', installedHash === apkHash, { apkHash, installedHash });

  previousKeyboard = adb('settings', 'get', 'secure', 'show_ime_with_hard_keyboard');
  adb('settings', 'put', 'secure', 'show_ime_with_hard_keyboard', '1');
  await freshOffline();
  await launch();
  await seedLegacyExercise();
  await launch({ restart: true });
  results.webView = await s.ev('navigator.userAgent');
  await activeWorkout();

  previousDisplay = display();
  results.defaultDisplay = previousDisplay;
  adb('wm', 'size', '720x1280');
  adb('wm', 'density', '320');
  adb('settings', 'put', 'system', 'font_scale', '1.3');
  await launch({ restart: true });
  await editPlan();
  await openPicker('#personal-plan-exercise');
  await largeText();
  await closePicker();
  const saved = await editAndSavePlan();
  await launch({ restart: true });
  await checkAfterRestart(saved);
} catch (error) {
  results.error = error.stack ?? String(error);
  try { shot('failure.png'); } catch {}
  process.exitCode = 1;
} finally {
  s?.close();
  if (previousKeyboard !== undefined) {
    try {
      if (previousKeyboard === 'null') adb('settings', 'delete', 'secure', 'show_ime_with_hard_keyboard');
      else adb('settings', 'put', 'secure', 'show_ime_with_hard_keyboard', previousKeyboard);
    } catch (error) {
      results.keyboardRestoreError = String(error);
      process.exitCode = 1;
    }
  }
  if (previousDisplay) {
    try {
      adb('wm', 'size', previousDisplay.size.match(/Override size: (\S+)/)?.[1] ?? 'reset');
      adb('wm', 'density', previousDisplay.density.match(/Override density: (\S+)/)?.[1] ?? 'reset');
      if (previousDisplay.fontScale === 'null') adb('settings', 'delete', 'system', 'font_scale');
      else adb('settings', 'put', 'system', 'font_scale', previousDisplay.fontScale);
    } catch (error) {
      results.restoreError = String(error);
      process.exitCode = 1;
    }
  }
  results.finished = new Date().toISOString();
  results.passed = !process.exitCode;
  writeFileSync(join(out, 'flows-results.json'), JSON.stringify(results, null, 2) + '\n', { flag: 'wx' });
  console.log(q({ passed: results.passed, checks: results.checks.length, out, error: results.error }));
}
