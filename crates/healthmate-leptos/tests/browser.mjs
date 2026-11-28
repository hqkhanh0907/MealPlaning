import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';

const directory = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = {
  '/pkg/': resolve(process.env.LEPTOS_PKG || join(directory, 'pkg')),
  '/ionic/': resolve(directory, '../../node_modules/@ionic/core/dist/ionic'),
  '/fixture/': resolve(directory, 'tests'),
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      return res.end(
        '<!doctype html><meta charset=utf-8><div id=body></div><div id=footer></div><script type=module src=/ionic/ionic.esm.js></script>',
      );
    }
    const [prefix, base] =
      Object.entries(publicFiles).find(([key]) => url.pathname.startsWith(key)) || [];
    if (!base) {
      res.writeHead(404);
      return res.end();
    }
    const filename = resolve(base, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (!filename.startsWith(base + sep)) {
      res.writeHead(403);
      return res.end();
    }
    res.setHeader(
      'Content-Type',
      { '.wasm': 'application/wasm', '.js': 'application/javascript', '.json': 'application/json' }[
        extname(filename)
      ] || 'application/octet-stream',
    );
    res.end(await readFile(filename));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'healthmate-leptos-chrome-'));
const executable =
  process.env.CHROME_BIN ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'chromium');
const browser = spawn(
  executable,
  [
    '--headless',
    '--disable-gpu',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-port=0',
    '--user-data-dir=' + profile,
    origin,
  ],
  { stdio: 'ignore' },
);
const browserExit = new Promise((resolve) => browser.once('exit', resolve));
let connection;
async function exercise(metricsExamples) {
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const checks = [];
  function check(ok, description) {
    if (!ok) throw Error(description);
    checks.push(description);
  }
  const settle = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const base = await (await fetch('/fixture/base.json')).json();
  const { default: init, mountDashboard } = await import('/pkg/healthmate_dashboard.js');
  await init();
  const body = document.querySelector('#body'),
    footer = document.querySelector('#footer'),
    actions = [];
  const show = (state) => handle.update(JSON.stringify(state));
  const state = structuredClone(base);
  state.pendingMeal = { date: '2026-10-02', mealType: 'lunch', plannedDishId: 'dish-7' };
  const handle = mountDashboard(body, footer, JSON.stringify(state), (action) =>
    actions.push(action),
  );
  await settle();
  const text = (element) => element?.textContent.trim().replace(/\s+/g, ' ');
  for (const { name, input, expected } of metricsExamples) {
    show({ ...state, metrics: input });
    await settle();
    const headlines = [...body.querySelectorAll('.today-nutrition dd')].map(text);
    const stats = [...body.querySelectorAll('.stat-list dd')].map(text);
    const macros = [...body.querySelectorAll('.macro-item')].map((row) => [
      text(row.querySelector('.macro-item__header span')),
      text(row.querySelector('.macro-item__header strong')),
      ...[...row.querySelectorAll('.macro-item__meta span')].map(text),
      row.querySelector('.progress-fill').style.getPropertyValue('--progress').trim(),
    ]);
    const expectedMacros = expected.hasNutritionData
      ? expected.macroRows.map((row) => [
          row.label,
          row.percentLabel,
          row.valueLabel,
          (row.target > 0 ? 'Mục tiêu ' : '') + row.targetLabel,
          row.progressCss,
        ])
      : [];
    check(
      eq(headlines, [expected.loggedCalories + ' kcal', expected.roundedCalories + ' kcal']) &&
        eq(macros, expectedMacros) &&
        eq(stats, [
          expected.nutritionStreakDisplay,
          expected.workoutStreakDisplay,
          expected.weightDisplay,
        ]) &&
        text(body.querySelector('.stat-list div:last-child small')) === expected.weightMeta &&
        text(body.querySelector('.nutrition-overview span')) === expected.calorieTargetLabel &&
        text(body.querySelector('.nutrition-overview small')) ===
          (expected.hasCalorieTarget
            ? 'Theo lịch đạt ' + expected.caloriePercentLabel + ' mục tiêu.'
            : 'Bạn vẫn có thể ghi bữa ăn.') &&
        (text(body.querySelector('#ai-insight-title')) ?? null) ===
          (expected.insight?.title ?? null),
      'raw metrics produce Angular values: ' + name,
    );
  }
  show(state);
  await settle();
  const pending = body.querySelector('a.today-primary-action');
  const sendClick = (el, props = {}) => {
    const e = new MouseEvent('click', { bubbles: true, cancelable: true, ...props });
    // Suppress browser navigation after inspecting the renderer's behavior.
    let prevented;
    const observe = (event) => {
      prevented = event.defaultPrevented;
      event.preventDefault();
    };
    document.addEventListener('click', observe, { once: true });
    el.dispatchEvent(e);
    return prevented;
  };
  check(
    sendClick(pending) && eq(actions.pop(), { type: 'openPendingMeal', target: state.pendingMeal }),
    'pending link dispatches the displayed target once',
  );
  for (const props of [
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { shiftKey: true },
    { button: 1 },
  ]) {
    const n = actions.length;
    check(
      !sendClick(pending, props) && actions.length === n,
      'modified pending link remains native ' + JSON.stringify(props),
    );
  }
  body.querySelector('.add-today-meal').click();
  check(actions.pop()?.type === 'addMeal', 'add meal click');
  state.pendingMeal = null;
  show(state);
  await settle();
  check(
    sendClick(body.querySelector('.dashboard-hero a')) &&
      eq(actions.pop(), { type: 'navigate', route: '/tabs/calendar' }),
    'ordinary calendar route',
  );
  const ai = body.querySelector('.quick-action--primary');
  ai.click();
  check(actions.pop()?.type === 'generateDailyInsight', 'daily insight click');
  body.querySelector('[aria-label="Chụp hoặc chọn ảnh món ăn"]').click();
  check(actions.pop()?.type === 'analyzeMealPhoto', 'photo analysis click');
  state.online = false;
  state.textIssue = 'Cần kết nối mạng để dùng AI';
  state.photoIssue = 'Cần kết nối mạng để dùng AI';
  show(state);
  await settle();
  check(
    body.querySelector('output[aria-live="polite"]') &&
      ai.disabled &&
      body.querySelector('[aria-label="Chụp hoặc chọn ảnh món ăn"]').disabled,
    'offline banner and disabled actions',
  );
  state.online = true;
  state.textIssue = null;
  state.photoIssue = null;
  state.dailyAiInsight = { title: 'Kết quả thử', body: 'Mô tả', action: 'Kiểm tra', tone: 'info' };
  state.photoDraft = {
    captureId: 'capture-01',
    dateLabel: '02/10/2026',
    mealType: 'dinner',
    imageQualityWarning: null,
    portions: [
      {
        name: 'Bún bò Huế',
        grams: 100,
        included: true,
        warning: null,
        confidence: 'high',
        nutritionLabel: '100 kcal',
      },
    ],
  };
  state.canSavePhoto = true;
  show(state);
  await settle();
  for (const tag of ['ion-button', 'ion-checkbox']) await customElements.whenDefined(tag);
  const name = body.querySelector('#photo-name-0'),
    grams = body.querySelector('#photo-grams-0');
  check(
    body.querySelector('#photo-meal-type').value === 'dinner' &&
      name.value === 'Bún bò Huế' &&
      grams.value === '100',
    'review populated with original date, label and quantity',
  );
  handle.focusResult('photo');
  await settle();
  check(document.activeElement?.id === 'photo-analysis-title', 'focus review');
  handle.focusResult('insight');
  await settle();
  check(document.activeElement?.id === 'ai-insight-title', 'focus generated insight');
  name.focus();
  name.setSelectionRange(2, 2);
  state.metrics.weightSummary = { currentKg: 71.05, deltaKg: 0.05, source: 'weight_log' };
  show(state);
  await settle();
  check(
    body.querySelector('#photo-name-0') === name &&
      document.activeElement === name &&
      name.selectionStart === 2,
    'unrelated update preserves the live input, focus and caret',
  );
  name.value = 'Hủ tiếu';
  name.dispatchEvent(new Event('input', { bubbles: true }));
  check(
    eq(actions.pop(), { type: 'setPhotoName', index: 0, value: 'Hủ tiếu' }),
    'rename input dispatch',
  );
  grams.value = '';
  grams.dispatchEvent(new Event('input', { bubbles: true }));
  check(
    eq(actions.pop(), { type: 'setPhotoGrams', index: 0, value: null }),
    'blank quantity dispatch',
  );
  const select = body.querySelector('#photo-meal-type');
  select.value = 'snack';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  check(eq(actions.pop(), { type: 'selectPhotoMeal', value: 'snack' }), 'meal change dispatch');
  const checkbox = body.querySelector('ion-checkbox');
  await checkbox.componentOnReady();
  check(checkbox.checked === true, 'Ionic checkbox hydrated with original inclusion');
  checkbox.click();
  await settle();
  check(
    eq(actions.pop(), { type: 'setPhotoIncluded', index: 0, checked: false }),
    'Ionic checkbox click dispatch',
  );
  state.photoDraft.portions[0].included = false;
  show(state);
  await settle();
  check(
    !body.querySelector('#photo-name-0') && body.textContent.includes('Bỏ qua khi lưu'),
    'excluded photo item',
  );
  const buttons = footer.querySelectorAll('ion-button');
  buttons[0].click();
  check(actions.pop()?.type === 'cancelPhoto', 'cancel photo');
  buttons[1].click();
  check(actions.pop()?.type === 'savePhoto', 'save photo');
  body.querySelector('.photo-card__manual').click();
  check(actions.pop()?.type === 'enterPhotoMealManually', 'manual handoff');
  state.photoSaving = true;
  state.canSavePhoto = false;
  show(state);
  await settle();
  check(
    buttons[0].disabled &&
      buttons[1].disabled &&
      body.querySelector('.photo-card__manual').disabled,
    'saving locks every conflicting action',
  );
  const before = body.textContent;
  let rejected = false;
  try {
    handle.update('{"wrong":true}');
  } catch {
    rejected = true;
  }
  check(rejected && body.textContent === before, 'invalid state leaves visible UI untouched');
  show({ ...state, loading: true, refreshFailed: true });
  await settle();
  check(
    body.querySelector('[role=status]') && !body.querySelector('.dashboard-error'),
    'loading takes precedence over error',
  );
  show({ ...state, loading: false, refreshFailed: true });
  await settle();
  body.querySelector('.dashboard-error ion-button').click();
  check(actions.pop()?.type === 'refresh', 'retry click');
  handle.dispose();
  check(body.children.length === 0 && footer.children.length === 0, 'dispose detaches both mounts');
  handle.free();
  const replacement = {
    ...base,
    dailyAiInsight: { title: 'New result', body: 'New body', action: 'Review', tone: 'info' },
  };
  const stale = mountDashboard(body, footer, JSON.stringify(replacement), () => {});
  stale.focusResult('insight');
  stale.free();
  const mounted = mountDashboard(body, footer, JSON.stringify(replacement), (action) =>
    actions.push(action),
  );
  await settle();
  check(
    document.activeElement !== body.querySelector('#ai-insight-title'),
    'discarded handle cannot focus the replacement dashboard',
  );
  const n = actions.length;
  body.querySelector('.add-today-meal').click();
  check(actions.length === n + 1, 'remount does not duplicate listeners');
  mounted.free();
  check(
    body.children.length === 0 && footer.children.length === 0,
    'free detaches both mounts without explicit dispose',
  );
  return checks;
}
try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try {
      port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
    } catch {
      await wait(100);
    }
  }
  if (!port) throw Error('Headless Chrome did not start');
  const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  connection = new WebSocket(list.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((ok, no) => {
    connection.onopen = ok;
    connection.onerror = no;
  });
  let id = 0;
  const pending = new Map();
  connection.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  function cdp(method, params) {
    const token = ++id;
    return new Promise((resolve) => {
      pending.set(token, resolve);
      connection.send(JSON.stringify({ id: token, method, params }));
    });
  }
  await cdp('Page.navigate', { url: origin });
  let loaded = false;
  for (let i = 0; i < 80 && !loaded; i++) {
    const check = await cdp('Runtime.evaluate', {
      expression:
        'Boolean(document.querySelector("#footer") && location.origin===' +
        JSON.stringify(origin) +
        ')',
      returnByValue: true,
    });
    loaded = check.result?.result?.value === true;
    if (!loaded) await wait(75);
  }
  if (!loaded) throw Error('Browser fixture did not load');
  const corpus = await readFile(
    join(directory, '../healthmate-domain/tests/dashboard_presentation.jsonl'),
    'utf8',
  );
  const examples = corpus
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  const answer = await cdp('Runtime.evaluate', {
    expression: '(' + exercise.toString() + ')(' + JSON.stringify(examples) + ')',
    awaitPromise: true,
    returnByValue: true,
    timeout: 35000,
  });
  if (answer.error || answer.result?.exceptionDetails)
    throw Error(JSON.stringify(answer.error || answer.result.exceptionDetails));
  console.log(JSON.stringify(answer.result.result.value, null, 2));
} finally {
  connection?.close();
  browser.kill('SIGTERM');
  await browserExit;
  server.closeAllConnections();
  server.close();
  await rm(profile, { recursive: true, force: true });
}
