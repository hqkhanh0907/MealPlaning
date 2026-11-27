import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
export const ADB = (process.env.ADB || process.env.HOME + '/Library/Android/sdk/platform-tools/adb');
export const SERIAL = process.env.ANDROID_SERIAL || 'emulator-5556';
export const PKG = 'com.healthmate.ai';
export const PORT = Number(process.env.CDP_PORT || 9336);
export const adb = (...args) => execFileSync(ADB, ['-s', SERIAL, ...args], { encoding: 'utf8', maxBuffer: 64e6 });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function connect({ settleMs = 5000 } = {}) {
  let socket = '';
  for (let i = 0; i < 60 && !socket; i++) {
    let pid = '';
    try { pid = adb('shell', 'pidof', PKG).trim().split(/\s+/)[0] || ''; } catch {}
    if (!pid) { if (i % 10 === 0) { adb('shell', 'am', 'start', '-n', PKG + '/.MainActivity'); } await sleep(700); continue; }
    if (adb('shell', 'cat /proc/net/unix').includes('@webview_devtools_remote_' + pid)) socket = 'webview_devtools_remote_' + pid;
    else await sleep(500);
  }
  if (!socket) throw new Error('app webview not running');
  await sleep(settleMs);
  const forwards = adb('forward', '--list');
  if (!forwards.includes('tcp:' + PORT + ' localabstract:' + socket)) {
    if (forwards.includes('tcp:' + PORT + ' ')) adb('forward', '--remove', 'tcp:' + PORT);
    adb('forward', 'tcp:' + PORT, 'localabstract:' + socket);
  }
  let target;
  const deadline = Date.now() + 5000;
  while (!target && Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:' + PORT + '/json', { signal: AbortSignal.timeout(1000) });
      target = (await response.json()).find((t) => t.type === 'page');
    } catch {}
    if (!target) await sleep(100);
  }
  if (!target) throw new Error('no webview page target');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', (message) => {
    const reply = JSON.parse(message.data);
    const command = pending.get(reply.id);
    if (command) {
      clearTimeout(command.timeout);
      pending.delete(reply.id);
      command.resolve(reply);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('cdp timeout ' + method));
    }, 20000);
    pending.set(id, { resolve, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const client = { close: () => ws.close(), send };
  const ev = async (expression) => {
    const r = (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result;
    if (!r) throw new Error('no result');
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const waitFor = async (expression, ms = 15000, label = expression) => {
    const end = Date.now() + ms;
    for (;;) {
      const v = await ev(expression).catch(() => null);
      if (v) return v;
      if (Date.now() > end) throw new Error('timeout: ' + label);
      await sleep(250);
    }
  };
  const visible = "(e)=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'}";
  const clickText = async (text, selector = 'button,ion-button,a,summary,[role=button],ion-tab-button,ion-segment-button,label', nth = 0) => {
    const ok = await ev(`(()=>{const vis=${visible};const els=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>vis(e)&&e.textContent.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));const el=els[${nth}];if(!el)return false;el.scrollIntoView({block:'center'});el.click();return true})()`);
    if (!ok) throw new Error('clickText not found: ' + text);
    await sleep(350);
  };
  const click = async (selector, nth = 0) => {
    const ok = await ev(`(()=>{const vis=${visible};const el=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(vis)[${nth}];if(!el)return false;el.scrollIntoView({block:'center'});el.click();return true})()`);
    if (!ok) throw new Error('click not found: ' + selector);
    await sleep(350);
  };
  const type = async (selector, value) => {
    const ok = await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    if (!ok) throw new Error('type not found: ' + selector);
    await sleep(150);
  };
  const shot = (file) => {
    const png = execFileSync(ADB, ['-s', SERIAL, 'exec-out', 'screencap', '-p'], { maxBuffer: 16e6 });
    writeFileSync(file, png);
    return file;
  };
  return { client, ev, waitFor, clickText, click, type, shot, close: () => client.close() };
}
