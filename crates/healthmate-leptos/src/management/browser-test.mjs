import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

async function exercise() {
  const { default: init, mountManagement } = await import('/healthmate_dashboard.js');
  await init();
  const root = document.querySelector('main');
  const actions = [];
  const checks = [];
  function check(ok, message) {
    if (!ok) throw Error(message);
    checks.push(message);
  }
  const next = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  let kind = 'catalog';
  let data = {
    tab: 'ingredients',
    categories: ['Tất cả', 'Rau củ'],
    filter: 'Tất cả',
    query: '',
    menu: false,
    loading: false,
    failed: false,
    rows: [
      { id: 'b', name: 'Ớt', source: 'db', category: 'Rau củ' },
      { id: 'a', name: 'Bò', source: 'custom', category: 'Thịt' },
    ],
  };
  let handle;
  const mount = () => {
    handle = mountManagement(root, kind, JSON.stringify(data), (action) => actions.push(action));
  };
  const update = async (value) => {
    Object.assign(data, value);
    handle.update(JSON.stringify(data));
    await next();
  };
  mount();
  await next();
  check(root.querySelectorAll('.item-card').length === 2, 'two stored ingredient rows');
  root.querySelector('.kebab-button').click();
  check(
    actions.at(-1).type === 'ingredientOptions' && actions.at(-1).value === 'b',
    'menu carries displayed ID',
  );
  root.querySelectorAll('.item-card__main-action')[1].click();
  check(
    actions.at(-1).type === 'editIngredient' && actions.at(-1).value === 'a',
    'edit targets second row',
  );
  const chip = root.querySelectorAll('.filter-chip')[1];
  chip.focus();
  chip.click();
  check(actions.at(-1).value === 'Rau củ', 'category action');
  await update({ filter: 'Rau củ' });
  check(
    chip === document.activeElement && chip.getAttribute('aria-pressed') === 'true',
    'chosen category retains focus',
  );
  check(
    root.querySelectorAll('.item-card').length === 1 &&
      root.querySelector('.result-hint').textContent.includes('1 nguyên liệu'),
    'category narrows in Rust',
  );
  const input = root.querySelector('.search-input');
  input.focus();
  input.value = 'Ớt';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  check(
    actions.at(-1).type === 'searchIngredients' && actions.at(-1).value === 'Ớt',
    'Vietnamese query preserved',
  );
  await update({ query: 'Ớt', loading: true });
  check(
    root.querySelector('[role=status]') && document.activeElement === input,
    'search focus retained during request',
  );
  await update({ loading: false, failed: true });
  root.querySelector('.management-error button').click();
  check(actions.at(-1).type === 'retry', 'error retry');
  await update({
    tab: 'dishes',
    failed: false,
    query: '',
    filter: 'Tất cả',
    rows: [
      {
        id: 'd',
        name: 'Bò kho',
        source: 'ai',
        type: 'ai_autofill',
        servings: 2,
        total_calories: 155.25,
        total_protein: 12,
        total_carbs: 8,
        total_fat: 2,
      },
    ],
  });
  check(
    root.querySelector('.dish-calories').textContent.trim() === '155.3 kcal/phần',
    'dish rounding to one decimal',
  );
  await update({ menu: true });
  root.querySelectorAll('.management-create__option')[1].click();
  check(actions.at(-1).type === 'aiDish', 'AI route choice');
  root
    .querySelector('.management-create__option')
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check(
    actions.at(-1).type === 'closeCreate' &&
      document.activeElement.matches('.management-create__trigger'),
    'Escape restores focus',
  );
  handle.free();
  check(!root.children.length, 'catalog cleanup');
  kind = 'ingredient';
  data = { category: 'Rau củ', values: [null, 0, 20, 4, 3], submitted: false };
  mount();
  await next();
  const protein = root.querySelector('#ingr-field-protein');
  check(
    root.querySelector('#ingr-field-calories').value === '' && protein.value === '0',
    'null and zero separate',
  );
  protein.focus();
  protein.value = '80';
  protein.dispatchEvent(new Event('input', { bubbles: true }));
  check(actions.at(-1).type === 'protein' && actions.at(-1).value === '80', 'numeric edit');
  await update({ values: [null, 80, 20, 4, 3], submitted: true });
  check(
    root.querySelector('#ingr-field-calories').getAttribute('aria-describedby') ===
      'err-ingr-calories' && document.activeElement === protein,
    'visible error associated and input focus preserved',
  );
  handle.free();
  const rows = [
    {
      id: 'local1',
      name: 'Đậu',
      grams: 50,
      nutrition: { calories: 110, protein: 10, carbs: 12, fat: 3, fiber: 2 },
    },
  ];
  data = { target: 1800, servings: 2, loading: false, errors: [], rows };
  kind = 'dishNutrition';
  mount();
  await next();
  check(
    root.querySelector('.nutrition-hero__ring-value').textContent === '27.5',
    'calories per serving',
  );
  await update({ servings: 1 });
  check(
    root.querySelector('.nutrition-hero__ring-value').textContent === '55',
    'changing servings recalculates',
  );
  handle.free();
  kind = 'dishItems';
  mount();
  await next();
  root.querySelector('.ingredient-item__main-action').click();
  check(
    actions.at(-1).type === 'editItem' && actions.at(-1).value === 'local1',
    'gram edit uses row UUID',
  );
  root.querySelector('.ingredient-item__delete').click();
  check(actions.at(-1).type === 'removeItem', 'remove row');
  await update({ rows: [], errors: ['Cần ít nhất 1 nguyên liệu trước khi lưu món ăn.'] });
  check(
    root.querySelector('[role=alert]') && root.querySelector('.ingredient-empty'),
    'empty recipe and error',
  );
  root.querySelector('.btn-outline').click();
  check(actions.at(-1).type === 'addItem', 'reopen ingredient picker');
  handle.dispose();
  handle.free();
  check(!root.children.length, 'dispose then free');
  return checks;
}

const pkg = resolve(process.argv[2] || 'target/leptos-web');
const profile = await mkdtemp(join(tmpdir(), 'hm-management-chrome-'));
let finish;
const result = new Promise((resolve) => {
  finish = resolve;
});
const server = createServer(async (req, res) => {
  if (req.url === '/result' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    res.end();
    finish(JSON.parse(body));
    return;
  }
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.end(
      '<!doctype html><main></main><script type="module">const test=' +
        exercise.toString() +
        ';try{await fetch("/result",{method:"POST",body:JSON.stringify({checks:await test()})})}catch(error){await fetch("/result",{method:"POST",body:JSON.stringify({error:String(error.stack||error)})})}</script>',
    );
    return;
  }
  const files = {
    '/healthmate_dashboard.js': 'text/javascript',
    '/healthmate_dashboard_bg.wasm': 'application/wasm',
  };
  if (!Object.hasOwn(files, req.url)) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    res.setHeader('Content-Type', files[req.url]);
    res.end(await readFile(join(pkg, req.url.slice(1))));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const chrome = spawn(
  process.env.CHROME_BIN ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : 'chromium'),
  [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + profile,
    'http://127.0.0.1:' + server.address().port,
  ],
  { stdio: 'ignore' },
);
const stopped = new Promise((r) => chrome.once('exit', r));
const timer = setTimeout(() => finish({ error: 'Timed out waiting for browser' }), 30000);
try {
  const { error, checks } = await result;
  assert.ifError(error);
  console.log(checks.join('\n'));
  console.log(checks.length + ' browser checks passed');
} finally {
  clearTimeout(timer);
  chrome.kill('SIGTERM');
  await stopped;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await rm(profile, { recursive: true, force: true });
}
