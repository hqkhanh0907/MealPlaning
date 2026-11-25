import fs from 'node:fs';
import { session, compareGuide, sleep, d } from './lib.mjs';
import { freshOffline, networkState, onboard } from './setup.mjs';
const exp = JSON.parse(fs.readFileSync(new URL('./expected.json', import.meta.url)));
const shots = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(shots, { recursive: true });
const wantShot = new Set((process.env.SHOTS || '').split(',').filter(Boolean));
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const CHUNK = Number(process.env.CHUNK || 40);
const resultsFile = new URL('./sweep-results.json', import.meta.url);
const prior = process.env.RESUME && fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile)).results.filter((r) => !r.problems.length) : [];
const done = new Set(prior.map((r) => r.id));
if (!process.env.KEEP) await freshOffline();
const s = await session({ settleMs: 8000 });
const { ev, waitFor } = s;
const results = [...prior];
const save = async () => { const out = { network: networkState(), webview: await ev('navigator.userAgent').catch(() => null), expected: exp.length, checked: results.length, failed: results.filter((r) => r.problems.length).length, results }; fs.writeFileSync(resultsFile, JSON.stringify(out, null, 1)); return out; };
const active = () => ev("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')");
const startFree = async () => { if (!(await active())) { await s.clickLabel('Bắt đầu buổi tự do').catch(() => s.tapText('Tập tự do')); await waitFor("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')", 10000, 'free session'); } };
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
    if ((only && !only.has(e.id)) || done.has(e.id)) continue;
    if (inChunk >= CHUNK) { await cancel(); inChunk = 0; }
    await startFree();
    const row = { id: e.id, name: e.nameVi, problems: [] };
    try {
      await s.pickExercise(e);
      await s.openGuide();
      const seen = await s.readGuide();
      if (seen.h2 !== e.nameVi) row.problems.push('tên lệch: ' + seen.h2);
      row.frames = seen.frames.map((f) => f.src.split('/').slice(-1)[0] + ' ' + f.w + 'x' + f.h + ' nw' + f.nw);
      row.problems.push(...compareGuide(seen, e, e.guide));
      const labels = (await s.logger()).labels;
      if (labels.includes('Tập (giây)') !== e.timed) row.problems.push('nhãn giây lệch');
      if (labels.includes('Số lần mỗi bên') !== Boolean(e.guide.perSide && !e.timed)) row.problems.push('nhãn từng bên lệch');
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
  console.log('ABORT ' + err.message);
} finally {
  const out = await save();
  console.log('SUMMARY expected', out.expected, 'checked', out.checked, 'failed', out.failed, JSON.stringify(out.network));
  s.close();
}
