import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { session, compareGuide, sleep } from './lib.mjs';
import { freshOffline, networkState, onboard } from './setup.mjs';
const fixture = fs.readFileSync(new URL('./expected.json', import.meta.url));
const exp = JSON.parse(fixture);
const fixtureSha256 = createHash('sha256').update(fixture).digest('hex');
const shots = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(shots, { recursive: true });
const wantShot = new Set((process.env.SHOTS || '').split(',').filter(Boolean));
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const catalogue = new Map(exp.map((e) => [e.id, e]));
const targetIds = only ?? new Set(catalogue.keys());
const CHUNK = Number(process.env.CHUNK || 40);
const resultsFile = new URL('./sweep-results.json', import.meta.url);
const previous = process.env.RESUME && fs.existsSync(resultsFile)
  ? JSON.parse(fs.readFileSync(resultsFile))
  : null;
const prior = previous?.fixtureSha256 === fixtureSha256
  ? previous.results.filter((row) => targetIds.has(row.id) && !row.problems.length)
  : [];
const done = new Set(prior.map((r) => r.id));
if (!process.env.KEEP) await freshOffline();
const s = await session({ settleMs: 8000 });
const { ev, waitFor } = s;
const results = [...prior];
const save = async () => {
  const out = {
    fixtureSha256,
    network: networkState(),
    webview: await ev('navigator.userAgent').catch(() => null),
    expected: exp.length,
    checked: results.length,
    failed: results.filter((row) => row.problems.length).length,
    results,
  };
  fs.writeFileSync(resultsFile, JSON.stringify(out, null, 1));
  return out;
};
const active = () => ev("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')");
const startFree = () => s.ensureFreeEntry();
const cancel = async () => {
  if (!(await active())) return;
  await s.clickLabel('Hủy buổi tập');
  await waitFor("!!document.querySelector('ion-alert')", 6000, 'cancel alert').catch(() => {});
  await sleep(400);
  await ev("(()=>{const a=document.querySelector('ion-alert');if(!a)return;const b=[...a.querySelectorAll('button')];(b.find(x=>/Hủy buổi|Xác nhận|Đồng ý/.test(x.textContent))||b.at(-1)).click()})()");
  await waitFor("!document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')", 10000, 'session cancelled');
  await sleep(800);
};
try {
  await onboard(s);
  let inChunk = 0;
  for (const e of exp) {
    if (!targetIds.has(e.id) || done.has(e.id)) continue;
    if (inChunk >= CHUNK) { await cancel(); inChunk = 0; }
    await startFree();
    const row = { id: e.id, name: e.nameVi, problems: [] };
    try {
      await s.pickExercise(e);
      await s.openGuide();
      const seen = await s.readGuide();
      if (seen.h2 !== e.nameVi) row.problems.push('tên lệch: ' + seen.h2);
      row.frames = seen.frames.map((f) => f.src.split('/').slice(-1)[0] + ' ' + f.w + 'x' + f.h + ' nw' + f.nw);
      row.illustrationNote = seen.illustrationNote;
      row.problems.push(...compareGuide(seen, e, e.guide));
      const labels = (await s.logger()).labels;
      const wantAmount = e.timed ? (e.guide.perSide ? 'Tập mỗi bên (giây)' : 'Tập (giây)') : e.guide.perSide ? 'Số lần mỗi bên' : 'Số lần';
      if (!labels.includes(wantAmount)) row.problems.push('nhãn ô nhập lệch: ' + labels.join('/'));
      if (labels.includes('Tổng hai tạ (kg)') !== Boolean(e.guide.loadLabel)) row.problems.push('nhãn tổng hai tạ lệch');
      if (wantShot.has(e.id)) s.shot(shots + e.id + '.png');
      await s.closeGuide();
    } catch (err) {
      row.problems.push('lỗi thao tác: ' + err.message);
      await ev('(' + s.GUIDE + ")?.querySelectorAll('ion-button')[0]?.click()").catch(() => {});
      await ev("document.querySelector('.eps-close')?.click()").catch(() => {});
      await sleep(800);
    }
    inChunk++;
    results.push(row);
    console.log((row.problems.length ? 'FAIL ' : 'ok   ') + e.id + (row.problems.length ? ' :: ' + row.problems.join(' , ') : ''));
    if (results.length % 20 === 0) await save();
  }
} catch (err) {
  console.error('ABORT ' + err.message);
  process.exitCode = 1;
} finally {
  const out = await save();
  const checkedIds = new Set(out.results.map((row) => row.id));
  const missing = [...targetIds].filter((id) => !checkedIds.has(id));
  if (missing.length) console.error('Chưa kiểm tra: ' + missing.join(', '));
  if (out.failed || missing.length || checkedIds.size !== out.checked || (!only && out.checked !== out.expected)) process.exitCode = 1;
  console.log('SUMMARY expected', out.expected, 'checked', out.checked, 'failed', out.failed, JSON.stringify(out.network));
  s.close();
}
