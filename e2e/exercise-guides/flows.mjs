import fs from 'node:fs';
import { session, sleep, d } from './lib.mjs';
import { freshOffline, networkState, onboard } from './setup.mjs';
const shots = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(shots, { recursive: true });
const exp = Object.fromEntries(JSON.parse(fs.readFileSync(new URL('./expected.json', import.meta.url))).map((e) => [e.id, e]));
const nameOf = (id) => exp[id].nameVi;
const framesOf = (id) => exp[id].guide.illustration.frames.map((f) => f.path);
const sameFrames = (seen, id) => JSON.stringify(seen.frames.map((f) => f.src)) === JSON.stringify(framesOf(id)) && seen.frames.every((f) => f.complete && f.nw > 0);
const checks = [];
const check = (name, ok, detail = '') => { const text = typeof detail === 'string' ? detail : JSON.stringify(detail); checks.push({ name, ok: !!ok, detail: text.slice(0, 900) }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' :: ' + text.slice(0, 500))); };
const secs = (label) => { const m = /(\d+):(\d+)/.exec(label || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
const data = { logged: [] };
await freshOffline();
let s = await session({ settleMs: 8000 });
const bind = () => ({ ev: s.ev, waitFor: s.waitFor, click: s.click, type: s.type, tapText: s.tapText });
let { ev, waitFor, click, type, tapText } = bind();
const headerText = () => ev("document.querySelector('.set-entry header').innerText.replace(/\\n+/g,' | ')");
async function logSet({ id, weight, amount, expectRow, labels, volume }) {
  if (weight !== undefined) await type('#weight-kg', weight);
  await type('#reps', amount);
  const before = await s.logger();
  await s.openGuide();
  const guide = await s.readGuide();
  await sleep(500);
  await s.closeGuide();
  const afterGuide = await s.logger();
  check('số đang nhập giữ nguyên sau khi mở rồi đóng hướng dẫn · ' + before.name, afterGuide.weight === before.weight && afterGuide.reps === before.reps && afterGuide.rest === before.rest && afterGuide.sets.length === before.sets.length && afterGuide.name === before.name, { before: [before.weight, before.reps, before.rest], after: [afterGuide.weight, afterGuide.reps, afterGuide.rest] });
  check('hướng dẫn đúng mã, đúng chữ và đủ khung hình · ' + before.name, guide.id === id && guide.h2 === nameOf(id) && guide.purpose === exp[id].guide.purpose && sameFrames(guide, id), [guide.id, guide.h2, guide.frames]);
  if (labels) check('nhãn đơn vị màn ghi · ' + before.name, labels.every((l) => before.labels.includes(l)), before.labels);
  await tapText('Ghi hiệp');
  await waitFor("document.querySelectorAll('.set-history article').length>" + before.sets.length, 8000, 'set saved');
  await sleep(700);
  const after = await s.logger();
  check('hiệp hiện đúng số liệu · ' + before.name, after.sets.join(' || ').includes(expectRow), after.sets);
  if (volume) check('khối lượng hiệp đúng, không nhân đôi · ' + before.name, (await headerText()).includes(volume), await headerText());
  data.logged.push({ id, exercise: before.name, labels: before.labels, row: expectRow });
  return { before, after, guide };
}
async function completeWorkout(tag) {
  await s.clickLabel('Hoàn thành buổi tập');
  await sleep(1200);
  await ev("(()=>{const a=document.querySelector('ion-alert');if(!a)return;const b=[...a.querySelectorAll('button')];(b.find(x=>/Hoàn thành|Xác nhận|Đồng ý|Kết thúc/.test(x.textContent))||b.at(-1)).click()})()");
  await waitFor("!!document.querySelector('.wsm-done')", 12000, 'summary');
  await sleep(600);
  data['summary_' + tag] = await ev("document.querySelector('.wsm-done').closest('ion-modal').innerText.replace(/\\n+/g,' | ').slice(0,700)");
  s.shot(shots + 'summary-' + tag + '.png');
  await click('.wsm-done');
  await sleep(1000);
}
async function previewGuide(planIndex, id, shotName) {
  await tapText('Xem trước giáo án', planIndex); await sleep(1500);
  const ok = await ev("(()=>{const li=[...document.querySelectorAll('app-plan-preview li')].filter(x=>x.getBoundingClientRect().width>0||true).find(x=>x.querySelector('strong')?.textContent.trim()===" + JSON.stringify(nameOf(id)) + ");if(!li)return false;const b=li.querySelector('.guide-link');b.scrollIntoView({block:'center'});b.click();return true})()");
  if (!ok) throw new Error('preview row not found: ' + id);
  await waitFor('!!(' + s.GUIDE + ')', 8000, 'preview guide');
  await sleep(1200);
  const seen = await s.readGuide();
  s.shot(shots + shotName);
  await s.closeGuide();
  return seen;
}
try {
  await onboard(s);
  data.firstFitnessLoadMs = s.fitnessReadyMs;
  data.network = networkState();
  data.device = { size: d.adb('shell', 'wm', 'size').trim(), density: d.adb('shell', 'wm', 'density').trim(), android: d.adb('shell', 'getprop', 'ro.build.version.release').trim(), fontScale: d.adb('shell', 'settings', 'get', 'system', 'font_scale').trim() };
  check('thiết bị ở chế độ máy bay, Wi-Fi và dữ liệu di động tắt', data.network.airplane === '1' && data.network.wifi === '0' && (await ev('navigator.onLine')) === false, data.network);

  // --- Bản xem trước giáo án
  await tapText('Đổi giáo án'); await sleep(700);
  const pvRow = await previewGuide(0, 'renegade-row', 'preview-two-dumbbells-pull.png');
  check('bản xem trước mẫu Hai tạ đơn và sàn mở đúng bài kéo hai tạ trên sàn', pvRow.id === 'renegade-row' && sameFrames(pvRow, 'renegade-row') && pvRow.frames.map((f) => f.caption).join() === 'Bắt đầu,Kết thúc', pvRow.frames);
  const pvPlank = await previewGuide(1, 'plank', 'preview-plank.png');
  check('bản xem trước Full Body mở plank với một hình tư thế giữ', pvPlank.id === 'plank' && sameFrames(pvPlank, 'plank') && pvPlank.frames.length === 1 && pvPlank.frames[0].caption === 'Tư thế giữ', pvPlank.frames);
  await tapText('Đóng', 0).catch(() => {});

  // --- Buổi theo giáo án Full Body A: tạ đòn, cáp, bài tính giây
  await click('[aria-label="Thứ 2: Full Body A"]'); await sleep(700);
  await tapText('Tập buổi này');
  await waitFor("document.querySelectorAll('.workout-tab').length===4", 10000, 'guided session');
  await s.selectTab(nameOf('squat'));
  const squat = await logSet({ id: 'squat', weight: '50', amount: '8', expectRow: '50 kg × 8 lần', labels: ['Tạ (kg)', 'Số lần'], volume: '400 kg khối lượng' });
  await sleep(1000);
  const t0 = await s.logger(); const at0 = Date.now();
  check('ghi hiệp xong đồng hồ nghỉ chạy', t0.timerStatus === 'Đang nghỉ' && secs(t0.timer) <= 120 && secs(t0.timer) > 100, [t0.timerStatus, t0.timer]);
  await s.openGuide(); await sleep(3000); s.shot(shots + 'guide-during-rest.png'); await s.closeGuide();
  const t1 = await s.logger(); const elapsed = (Date.now() - at0) / 1000; const drop = secs(t0.timer) - secs(t1.timer);
  check('mở hướng dẫn khi đang nghỉ: hiệp đã lưu và bài đang chọn giữ nguyên', JSON.stringify(t1.sets) === JSON.stringify(t0.sets) && t1.name === t0.name, [t0.sets, t1.sets]);
  check('mở hướng dẫn khi đang nghỉ: đồng hồ chạy tiếp theo thời gian thực', t1.timerStatus === 'Đang nghỉ' && drop > 0 && Math.abs(drop - elapsed) <= 2.5, { before: t0.timer, after: t1.timer, elapsed });
  data.timer = { before: t0.timer, after: t1.timer, elapsedSeconds: Math.round(elapsed * 10) / 10 };
  await s.selectTab(nameOf('bench-press'));
  const bench = await logSet({ id: 'bench-press', weight: '40', amount: '8', expectRow: '40 kg × 8 lần' });
  check('đổi bài đổi đúng tên, dụng cụ, chữ và hình', squat.guide.h2 !== bench.guide.h2 && squat.guide.equipment !== bench.guide.equipment && squat.guide.steps.join() !== bench.guide.steps.join() && squat.guide.frames[0].src !== bench.guide.frames[0].src, [squat.guide.frames[0].src, bench.guide.frames[0].src]);
  const backToSquat = await (async () => { await s.selectTab(nameOf('squat')); return s.logger(); })();
  check('hiệp đã ghi vẫn thuộc bài cũ sau khi đổi bài', backToSquat.sets.join().includes('50 kg × 8 lần') && backToSquat.sets.length === 1, backToSquat.sets);
  await s.selectTab(nameOf('seated-cable-row'));
  await logSet({ id: 'seated-cable-row', weight: '35', amount: '10', expectRow: '35 kg × 10 lần' });
  await s.selectTab(nameOf('plank'));
  await logSet({ id: 'plank', amount: '30', expectRow: '30 giây', labels: ['Tập (giây)'] });
  s.shot(shots + 'logger-plank.png');
  await completeWorkout('guided');

  // --- Buổi tự do: tạ đơn tổng hai tạ, từng bên, máy, trọng lượng cơ thể, tạ chuông
  await s.clickLabel('Bắt đầu buổi tự do').catch(() => tapText('Tập tự do'));
  await waitFor("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')", 10000, 'free session');
  const totalId = ['dumbbell-romanian-deadlift', 'renegade-row', 'dumbbell-lunge', 'farmers-walk'].find((id) => exp[id].guide.loadLabel && !exp[id].timed && !exp[id].guide.perSide);
  const sideId = ['bulgarian-split-squat', 'dumbbell-row', 'single-leg-romanian-deadlift'].find((id) => exp[id].guide.perSide && !exp[id].timed);
  data.unitCases = { totalId, sideId };
  const free = [
    totalId && { id: totalId, weight: '20', amount: '8', row: '20 kg × 8 lần', volume: '160 kg khối lượng', labels: ['Tổng hai tạ (kg)', 'Số lần'] },
    sideId && { id: sideId, weight: '16', amount: '8', row: '16 kg × 8 lần', volume: '128 kg khối lượng', labels: ['Số lần mỗi bên'] },
    { id: 'leg-press', weight: '80', amount: '10', row: '80 kg × 10 lần', labels: ['Tạ (kg)', 'Số lần'] },
    { id: 'push-up', amount: '12', row: '0 kg × 12 lần', labels: ['Tạ (kg)', 'Số lần'] },
    { id: 'kettlebell-goblet-squat', weight: '16', amount: '10', row: '16 kg × 10 lần', labels: ['Tạ (kg)', 'Số lần'] },
  ].filter(Boolean);
  check('danh mục có bài ghi tổng hai tạ và bài ghi từng bên để thử', Boolean(totalId && sideId), data.unitCases);
  for (const f of free) {
    await s.pickExercise(exp[f.id]);
    await logSet({ id: f.id, weight: f.weight, amount: f.amount, expectRow: f.row, labels: f.labels, volume: f.volume });
    if (f.id === 'kettlebell-goblet-squat') s.shot(shots + 'logger-kettlebell-goblet-squat.png');
  }

  // --- Tìm theo bí danh và tên biến thể của nguồn
  const aliasCase = Object.values(exp).find((e) => e.searchNames.length && !e.name.toLowerCase().includes(e.searchNames[0].toLowerCase()));
  await s.clickLabel('Thêm bài tập tự do').catch(() => tapText('Thêm bài tập'));
  await waitFor("!!document.querySelector('#eps-search-input')", 8000, 'picker'); await sleep(400);
  await type('#eps-search-input', ''); await sleep(1200);
  const total = await ev("document.querySelectorAll('.eps-row').length");
  check('bộ chọn bài hiện đủ toàn bộ danh mục khi chưa tìm', total === Object.keys(exp).length, total);
  await type('#eps-search-input', aliasCase.searchNames[0]); await sleep(700);
  const found = await ev("[...document.querySelectorAll('.eps-row__name')].map(x=>x.textContent.trim())");
  check('tìm theo bí danh của nguồn ra đúng bài · ' + aliasCase.searchNames[0], found.includes(aliasCase.nameVi), found.slice(0, 6));
  data.aliasSearch = { query: aliasCase.searchNames[0], expected: aliasCase.id, found: found.slice(0, 6) };
  await type('#eps-search-input', 'ex_back_squat'); await sleep(600);
  check('mã của seed cũ không còn trong bộ chọn', (await ev("document.querySelectorAll('.eps-row').length")) === 0);
  await ev("document.querySelector('.eps-close').click()"); await sleep(700);

  // --- Bàn phím đang mở khi nhập số lần
  await s.selectTab(nameOf('leg-press'));
  await type('#weight-kg', '82.5'); await type('#reps', '9');
  await ev("document.querySelector('#reps').scrollIntoView({block:'center'})"); await sleep(500);
  const tap = await ev("(()=>{const r=document.querySelector('#reps').getBoundingClientRect();const top=(window.outerHeight-window.innerHeight)>0?0:0;return{x:Math.round((r.left+r.width/2)*devicePixelRatio),y:Math.round((r.top+r.height/2)*devicePixelRatio)+top}})()");
  d.adb('shell', 'input', 'tap', String(tap.x), String(tap.y)); await sleep(1500);
  const ime = d.adb('shell', 'dumpsys', 'input_method').match(/mInputShown=(\w+)/)?.[1];
  await s.openGuide(); const kbGuide = await s.readGuide(); s.shot(shots + 'keyboard-then-guide.png'); await s.closeGuide();
  const kbAfter = await s.logger();
  check('bàn phím đang mở: mở rồi đóng hướng dẫn giữ tạ và số lần đang nhập', kbAfter.weight === '82.5' && kbAfter.reps === '9' && kbGuide.id === 'leg-press' && kbGuide.overflow <= 1, { ime, weight: kbAfter.weight, reps: kbAfter.reps });
  data.keyboard = { imeShownBeforeGuide: ime };
  await ev('document.activeElement?.blur()'); await sleep(700);
  if (d.adb('shell', 'dumpsys', 'input_method').match(/mInputShown=(\w+)/)?.[1] === 'true') { d.adb('shell', 'input', 'keyevent', '4'); await sleep(900); }
  data.keyboard.imeShownAfterClose = d.adb('shell', 'dumpsys', 'input_method').match(/mInputShown=(\w+)/)?.[1];
  await waitFor("[...document.querySelectorAll('ion-footer ion-button')].some(b=>b.textContent.includes('Hoàn thành buổi tập')&&b.getBoundingClientRect().width>0)", 8000, 'footer after keyboard closed');
  await type('#weight-kg', '80'); await type('#reps', '10');

  await completeWorkout('free');

  // --- Mã ngoài danh mục: chèn một bài tự tạo để chứng minh app vẫn báo thiếu
  const dbs = await ev("Capacitor.Plugins.CapacitorSQLite.getDatabaseList().then(r=>r.values.join(','))").catch((e) => 'ERR ' + e.message);
  const dbName = (dbs.split(',').find((n) => /healthmate/.test(n)) || 'healthmate').replace(/SQLite\.db$/, '').replace(/\.db$/, '');
  data.customInsert = await ev("Capacitor.Plugins.CapacitorSQLite.run({database:" + JSON.stringify(dbName) + ",statement:\"INSERT OR REPLACE INTO exercise (id,name,name_vi,muscle_group,category,equipment,instructions,source) VALUES ('custom-e2e-unsupported','E2E Unsupported Move','Bài thử ngoài danh mục','back','compound','Dumbbell',NULL,'custom')\",values:[],transaction:true,readonly:false}).then(r=>JSON.stringify(r))").catch((e) => 'ERR ' + e.message);

  // --- Đóng hẳn rồi mở lại khi vẫn ngoại tuyến
  s.close();
  d.adb('shell', 'am', 'force-stop', d.PKG); await sleep(1500);
  d.adb('shell', 'am', 'start', '-n', d.PKG + '/.MainActivity');
  s = await session({ settleMs: 8000 }); ({ ev, waitFor, click, type, tapText } = bind());
  await waitFor("location.pathname.includes('tabs')", 30000, 'relaunch');
  check('mở lại app khi vẫn ngoại tuyến', (await ev('navigator.onLine')) === false && networkState().airplane === '1');
  await click('[data-testid=tab-fitness]'); await sleep(2000);
  await s.clickLabel('Xem lịch sử buổi tập');
  await waitFor("location.pathname.includes('history')", 10000, 'history');
  await sleep(1500);
  await ev("document.querySelectorAll('details').forEach(x=>x.open=true)"); await sleep(800);
  const history = await ev("[...document.querySelectorAll('details')].map(c=>({title:c.querySelector('.session-card__day-name')?.textContent.trim(),stats:[...c.querySelectorAll('.stat')].map(x=>x.textContent.replace(/\\s+/g,' ').trim()),exercises:[...c.querySelectorAll('.session-exercise')].map(x=>({name:x.querySelector('h3').textContent.trim(),unit:x.querySelector('.session-exercise__unit')?.textContent.trim()??null,sets:[...x.querySelectorAll('.session-sets li')].map(l=>l.textContent.replace(/\\s+/g,' ').trim())}))}))");
  data.history = history;
  const all = history.flatMap((h) => h.exercises);
  for (const logged of data.logged) {
    const row = all.find((x) => x.name === logged.exercise);
    check('lịch sử sau khi mở lại khớp hiệp đã ghi · ' + logged.exercise, row?.sets.length === 1 && row.sets[0].includes(logged.row), row);
  }
  const plankRow = all.find((x) => x.name === nameOf('plank'));
  check('plank lưu đúng 30 giây, không thành số lần', plankRow?.sets[0].includes('30 giây') && !plankRow.sets[0].includes('lần'), plankRow);
  if (totalId) check('lịch sử ghi đơn vị tổng hai tạ', all.find((x) => x.name === nameOf(totalId))?.unit?.includes('Tổng hai tạ (kg)'), all.find((x) => x.name === nameOf(totalId)));
  if (sideId) check('lịch sử ghi đơn vị từng bên', all.find((x) => x.name === nameOf(sideId))?.unit?.includes('Số lần mỗi bên'), all.find((x) => x.name === nameOf(sideId)));
  check('lịch sử có đủ hai buổi vừa tập', history.length === 2 && history.some((h) => h.title === 'Full Body A') && history.some((h) => h.title === 'Tập tự do'), history.map((h) => [h.title, h.stats]));
  s.shot(shots + 'history.png');
  await ev('history.back()'); await sleep(1500);
  await click('[data-testid=tab-fitness]').catch(() => {}); await sleep(1500);

  // --- Buổi đang tập sống sót khi hệ thống dựng lại màn hình (đổi cỡ chữ, màn hình nhỏ)
  await s.clickLabel('Bắt đầu buổi tự do').catch(() => tapText('Tập tự do'));
  await waitFor("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')", 10000, 'free session 2');
  await s.pickExercise(exp['kettlebell-goblet-squat']);
  await type('#weight-kg', '12'); await type('#reps', '9');
  await tapText('Ghi hiệp');
  await waitFor("document.querySelectorAll('.set-history article').length>0", 8000, 'set saved');
  const longest = Object.values(exp).sort((x, y) => y.nameVi.length - x.nameVi.length)[0];
  await s.pickExercise(longest);
  s.close();
  d.adb('shell', 'wm', 'size', '720x1280'); d.adb('shell', 'wm', 'density', '320'); d.adb('shell', 'settings', 'put', 'system', 'font_scale', '1.3');
  await sleep(5000);
  s = await session({ settleMs: 6000 }); ({ ev, waitFor, click, type, tapText } = bind());
  await waitFor("location.pathname.includes('tabs')", 30000, 'after display change');
  await click('[data-testid=tab-fitness]').catch(() => {}); 
  await waitFor("document.querySelectorAll('.workout-tab').length===2", 30000, 'session restored');
  await s.selectTab(nameOf('kettlebell-goblet-squat'));
  const restored = await s.logger();
  check('đổi cỡ chữ và cỡ màn hình giữa buổi: buổi đang tập và hiệp đã ghi còn nguyên', restored.sets.join().includes('12 kg × 9 lần') && restored.tabs.length === 2, restored);
  data.smallScreen = [];
  for (const id of [longest.id, 'kettlebell-goblet-squat', 'plank']) {
    if (id === 'plank') await s.pickExercise(exp.plank); else await s.selectTab(nameOf(id));
    await s.openGuide();
    const small = await s.readGuide();
    const chrome = await ev('(()=>{const m=' + s.GUIDE + ";const b=[...m.querySelectorAll('ion-button')].find(x=>x.textContent.trim()==='Đóng').getBoundingClientRect();const a=m.querySelector('.source a');a.scrollIntoView({block:'end'});const r=a.getBoundingClientRect();return{close:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.width>=40&&b.height>=40,sourceReachable:r.bottom<=innerHeight+1&&r.top>=0,vw:innerWidth,vh:innerHeight,font:getComputedStyle(m.querySelector('ol li')).fontSize,title:m.querySelector('h2').getBoundingClientRect().right<=innerWidth}})()");
    check('màn hình nhỏ, cỡ chữ 1.3: không tràn ngang, ảnh giữ tỷ lệ, tên dài không bị cắt, nút Đóng và nguồn bấm được · ' + nameOf(id), sameFrames(small, id) && small.overflow <= 1 && small.right <= small.vw + 1 && chrome.close && chrome.title && chrome.sourceReachable && small.frames.every((f) => f.right <= small.vw && f.left >= 0 && Math.abs(f.w / f.h - f.nw / f.nh) < 0.02), { chrome, frames: small.frames.map((f) => f.w + 'x' + f.h), overflow: small.overflow });
    await ev('(' + s.GUIDE + ").querySelector('ion-content').scrollToTop?.(0)").catch(() => {}); await sleep(400);
    s.shot(shots + 'small-large-font-' + id + '.png');
    data.smallScreen.push({ id, ...chrome });
    await s.closeGuide();
  }
  s.close();
  d.adb('shell', 'wm', 'size', 'reset'); d.adb('shell', 'wm', 'density', 'reset'); d.adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0');
  await sleep(5000);
  s = await session({ settleMs: 6000 }); ({ ev, waitFor, click, type, tapText } = bind());
  await waitFor("location.pathname.includes('tabs')", 30000, 'after display reset');
  await click('[data-testid=tab-fitness]').catch(() => {});
  await waitFor("document.querySelectorAll('.workout-tab').length===3", 30000, 'session restored again');

  // --- Mở lại hình khi vẫn ngoại tuyến, và ca âm
  await s.selectTab(nameOf('kettlebell-goblet-squat'));
  await s.openGuide(); const again = await s.readGuide(); s.shot(shots + 'reopened-kettlebell-goblet-squat.png'); await s.closeGuide();
  check('sau khi mở lại app, hình squat tạ chuông vẫn mở được ngoại tuyến', again.id === 'kettlebell-goblet-squat' && sameFrames(again, 'kettlebell-goblet-squat') && again.online === false && again.frames.map((f) => f.caption).join() === 'Bắt đầu,Kết thúc', again.frames);
  await s.selectTab(nameOf('plank'));
  await s.openGuide(); const plankAgain = await s.readGuide(); s.shot(shots + 'reopened-plank.png'); await s.closeGuide();
  check('sau khi mở lại app, hình plank vẫn mở được ngoại tuyến', plankAgain.id === 'plank' && sameFrames(plankAgain, 'plank') && plankAgain.frames[0].caption === 'Tư thế giữ', plankAgain.frames);
  await s.pickExercise({ name: 'E2E Unsupported Move', nameVi: 'Bài thử ngoài danh mục' });
  await s.openGuide(); const missing = await s.readGuide(); s.shot(shots + 'unsupported.png'); await s.closeGuide();
  check('mã ngoài danh mục báo thiếu hướng dẫn, không mượn hình bài khác', missing.status.join() === 'Chưa có hướng dẫn và hình minh họa cho bài này.' && missing.frames.length === 0 && missing.steps.length === 0, missing);
} catch (err) {
  check('kịch bản chạy hết', false, err.message);
  try { s.shot(shots + 'failure.png'); } catch {}
} finally {
  try { d.adb('shell', 'wm', 'size', 'reset'); d.adb('shell', 'wm', 'density', 'reset'); d.adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0'); } catch {}
  const out = { ...data, passed: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length, checks };
  fs.writeFileSync(new URL('./flows-results.json', import.meta.url), JSON.stringify(out, null, 2));
  console.log('SUMMARY passed', out.passed, 'failed', out.failed);
  s.close();
}
