import * as d from './driver.mjs';
export { d };
export const sleep = d.sleep;
export async function session(opts) {
  const c = await d.connect(opts);
  const { ev, waitFor } = c;
  const q = JSON.stringify;
  const tapText = async (t, nth = -1) => {
    const ok = await ev("(()=>{const all=[...document.querySelectorAll('ion-content *, ion-modal *, ion-alert *, ion-footer *, ion-tab-bar *, ion-header *')].filter(e=>e.getBoundingClientRect().width>0&&(e.textContent||'').replace(/\\s+/g,' ').trim().includes(" + q(t) + "));const deep=all.filter(e=>!all.some(o=>o!==e&&e.contains(o)));const el=deep.at(" + nth + ");if(!el)return false;el.scrollIntoView({block:'center'});el.click();return true})()");
    if (!ok) throw new Error('tapText: ' + t);
    await sleep(400);
  };
  const click = async (sel, nth = 0) => {
    const ok = await ev("(()=>{const el=[...document.querySelectorAll(" + q(sel) + ")].filter(e=>e.getBoundingClientRect().width>0)[" + nth + "];if(!el)return false;el.scrollIntoView({block:'center'});el.click();return true})()");
    if (!ok) throw new Error('click: ' + sel);
    await sleep(350);
  };
  const type = async (sel, value) => {
    const ok = await ev("(()=>{const el=document.querySelector(" + q(sel) + ");if(!el)return false;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el," + q(String(value)) + ");el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
    if (!ok) throw new Error('type: ' + sel);
    await sleep(200);
  };
  const clickLabel = async (label) => {
    const ok = await ev("(()=>{const el=[...document.querySelectorAll('ion-button,button')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('.ion-page-hidden')).find(e=>e.getAttribute('aria-label')===" + q(label) + "||e.shadowRoot?.querySelector('[aria-label=' + JSON.stringify(" + q(label) + ") + ']'));if(!el)return false;el.scrollIntoView({block:'center'});el.click();return true})()");
    if (!ok) throw new Error('clickLabel: ' + label);
    await sleep(400);
  };
  const ensureFreeEntry = async () => {
    const active = () => ev("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')");
    if (await active()) return;
    try { await clickLabel('Bắt đầu buổi tự do'); await waitFor("document.body.innerText.toUpperCase().includes('BUỔI TẬP ĐANG DIỄN RA')", 10000, 'free session'); } catch { /* training day: the first picked exercise starts the free session */ }
  };
  const page = (n = 1500) => ev("[...document.querySelectorAll('.ion-page:not(.ion-page-hidden) ion-content')].at(-1).innerText.replace(/\\n+/g,' | ').slice(0," + n + ")");
  const GUIDE = "[...document.querySelectorAll('ion-modal')].find(m=>m.querySelector('.guide'))";
  const readGuide = () => ev(`(() => {
    const modal = ${GUIDE};
    if (!modal) return null;
    const m = modal.querySelector('.guide');
    const imgs = [...m.querySelectorAll('.frames img')];
    const img = imgs[0];
    const fig = m.querySelector('.frames');
    const note = m.querySelector('.illustration-note');
    const noteBounds = note?.getBoundingClientRect();
    const beforeFrames = Boolean(note && fig && noteBounds.height > 0 &&
      (note.compareDocumentPosition(fig) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      noteBounds.bottom <= fig.getBoundingClientRect().top + 1);
    const r = (e) => e ? e.textContent.replace(/\\s+/g, ' ').trim() : null;
    return {
      id: m.dataset.guideId,
      h2: r(m.querySelector('h2')),
      purpose: r(m.querySelector('.purpose')),
      equipment: r(m.querySelector('.equipment')),
      start: r(m.querySelector('.start')),
      steps: [...m.querySelectorAll('ol li')].map(r),
      href: m.querySelector('.source a')?.getAttribute('href') ?? null,
      sourceText: r(m.querySelector('.source a')),
      src: img?.getAttribute('src') ?? null,
      frames: imgs.map((i) => {
        const bounds = i.getBoundingClientRect();
        return {
          src: i.getAttribute('src'),
          complete: i.complete,
          nw: i.naturalWidth,
          nh: i.naturalHeight,
          w: Math.round(bounds.width),
          h: Math.round(bounds.height),
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
          caption: r(i.parentElement.querySelector('figcaption')),
        };
      }),
      complete: imgs.length ? imgs.every((i) => i.complete) : null,
      nw: imgs.length ? Math.min(...imgs.map((i) => i.naturalWidth)) : 0,
      iw: Math.round(img?.getBoundingClientRect().width ?? 0),
      ih: Math.round(img?.getBoundingClientRect().height ?? 0),
      alt: fig?.getAttribute('aria-label') ?? null,
      illustrationNote: note ? { text: note.querySelector('.illustration-note__text')?.textContent.trim() ?? null, beforeFrames } : null,
      status: [...m.querySelectorAll('[role=status]')].map(r),
      overflow: m.scrollWidth - m.clientWidth,
      vw: innerWidth,
      right: Math.round(Math.max(...[...m.querySelectorAll('*')].map((x) => x.getBoundingClientRect().right))),
      choices: [...m.querySelectorAll('.variant')].map(r),
      apply: !!modal.querySelector('.variants ion-button'),
      perSideNote: [...m.querySelectorAll('.note')].map(r),
      online: navigator.onLine,
    };
  })()`);
  const openGuide = async () => { await click('.set-entry header ion-button'); await waitFor("!!(" + GUIDE + ")", 8000, 'guide open'); await sleep(500); await waitFor("(()=>{const i=[...(" + GUIDE + ").querySelectorAll('.frames img')];return i.every(x=>x.complete)})()", 6000, 'img settle').catch(() => {}); };
  const closeGuide = async () => { await ev("(()=>{const m=" + GUIDE + ";[...m.querySelectorAll('ion-button')].find(b=>b.textContent.trim()==='Đóng').click()})()"); await waitFor("!(" + GUIDE + ")", 8000, 'guide close'); await sleep(250); };
  const pickExercise = async (e) => {
    await click('ion-button[aria-label="Thêm bài tập tự do"]').catch(() => tapText('Thêm bài tập'));
    await waitFor("!!document.querySelector('#eps-search-input')", 8000, 'picker');
    await sleep(350);
    const pickRow = "(()=>{const b=[...document.querySelectorAll('.eps-row')].find(x=>x.querySelector('.eps-row__name').textContent.trim()===" + q(e.nameVi) + ");if(!b)return false;b.click();return true})()";
    await type('#eps-search-input', e.nameVi);
    await waitFor(pickRow, 5000, 'row ' + e.nameVi);
    await waitFor("document.querySelector('.set-entry header strong')?.textContent.trim()===" + q(e.nameVi), 8000, 'selected ' + e.nameVi);
    await waitFor("!document.querySelector('#eps-search-input')||document.querySelector('#eps-search-input').getBoundingClientRect().width===0", 5000, 'picker closed').catch(() => {});
    await sleep(300);
  };
  const selectTab = async (nameVi) => { await ev("(()=>{const b=[...document.querySelectorAll('.workout-tab')].find(x=>x.textContent.includes(" + q(nameVi) + "));b.scrollIntoView({block:'center'});b.click()})()"); await waitFor("document.querySelector('.set-entry header strong')?.textContent.trim()===" + q(nameVi), 6000, 'tab ' + nameVi); await sleep(300); };
  const logger = () => ev("(()=>{const r=(e)=>e?e.textContent.replace(/\\s+/g,' ').trim():null;const s=document.querySelector('.set-entry');return{name:r(s.querySelector('header strong')),labels:[...s.querySelectorAll('.set-grid label')].map(r),weight:document.querySelector('#weight-kg').value,reps:document.querySelector('#reps').value,rest:document.querySelector('#rest-seconds').value,notes:document.querySelector('#set-notes').value,sets:[...document.querySelectorAll('.set-history article .set-history__main')].map(r).filter(Boolean),timer:r(document.querySelector('.rest-timer strong')),timerStatus:r(document.querySelector('.rest-timer [role=status]')),tabs:[...document.querySelectorAll('.workout-tab')].map(r)}})()");
  return { ...c, ensureFreeEntry, clickLabel, tapText, click, type, page, readGuide, openGuide, closeGuide, pickExercise, selectTab, logger, GUIDE };
}
export function illustrationNoteMatches(seen, expected) {
  return expected ? seen?.text === expected && seen.beforeFrames === true : seen === null;
}

export function compareGuide(seen, e, guide) {
  const p = [];
  if (!seen) return ['không mở được bảng'];
  if (seen.id !== e.id) p.push('data-guide-id ' + seen.id);
  if (seen.purpose !== guide.purpose) p.push('vai trò lệch');
  if (seen.equipment !== 'Dụng cụ ' + guide.equipment) p.push('dụng cụ lệch: ' + seen.equipment);
  if (seen.start !== guide.startPosition) p.push('tư thế bắt đầu lệch');
  if (JSON.stringify(seen.steps) !== JSON.stringify(guide.steps)) p.push('các bước lệch');
  if (seen.href !== guide.sourceUrl || seen.sourceText !== guide.source) p.push('nguồn lệch');
  if (!illustrationNoteMatches(seen.illustrationNote, guide.illustration?.note)) p.push('chú thích hình lệch nội dung hoặc vị trí');
  if (!guide.illustration) {
    if (seen.frames.length || seen.status.join() !== 'Chưa có hình cho biến thể này.') p.push('mã còn mở về hình hiển thị sai: ' + seen.status.join('/'));
  } else {
    const want = guide.illustration.frames;
    if (JSON.stringify(seen.frames.map((f) => f.src)) !== JSON.stringify(want.map((f) => f.path))) p.push('khung hình lệch hoặc sai thứ tự: ' + seen.frames.map((f) => f.src).join(','));
    if (JSON.stringify(seen.frames.map((f) => f.caption)) !== JSON.stringify(want.map((f) => f.label))) p.push('nhãn khung lệch');
    if (seen.frames.some((f) => f.w < 150 || f.h < 100)) p.push('hình quá nhỏ để đọc ' + seen.frames.map((f) => f.w + 'x' + f.h).join(','));
    if (seen.frames.some((f) => !f.complete || !(f.nw > 0))) p.push('hình không tải được');
    if (seen.frames.some((f) => Math.abs(f.w / f.h - f.nw / f.nh) > 0.02)) p.push('hình bị méo tỷ lệ');
    if (seen.frames.some((f) => f.w < 110 || f.left < 0 || f.right > seen.vw)) p.push('hình quá nhỏ hoặc bị cắt ' + seen.frames.map((f) => f.w + 'x' + f.h).join(','));
    if (seen.alt !== guide.illustration.alt) p.push('alt lệch');
    if (seen.status.length) p.push('trạng thái: ' + seen.status.join('/'));
  }
  if (seen.overflow > 1 || seen.right > seen.vw + 1) p.push('tràn ngang');
  if (seen.choices.length) p.push('còn nút chọn biến thể');
  if (seen.online !== false) p.push('thiết bị đang có mạng');
  return p;
}
