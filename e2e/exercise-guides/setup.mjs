import { d, sleep } from './lib.mjs';
export async function freshOffline() {
  d.adb('shell', 'am', 'force-stop', d.PKG);
  d.adb('shell', 'pm', 'clear', d.PKG);
  d.adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable');
  d.adb('shell', 'svc', 'wifi', 'disable');
  d.adb('shell', 'svc', 'data', 'disable');
  await sleep(1500);
  d.adb('shell', 'am', 'start', '-n', d.PKG + '/.MainActivity');
}
export function networkState() {
  return {
    airplane: d.adb('shell', 'settings', 'get', 'global', 'airplane_mode_on').trim(),
    wifi: d.adb('shell', 'settings', 'get', 'global', 'wifi_on').trim(),
    mobileData: d.adb('shell', 'settings', 'get', 'global', 'mobile_data').trim(),
    sdk: d.adb('shell', 'getprop', 'ro.build.version.sdk').trim(),
  };
}
export async function openTrainingScreen(s, screen) {
  const route = await s.ev('location.pathname');
  if (route === '/training/' + screen) return;
  if (!route.startsWith('/training/')) {
    await s.click('[data-testid=tab-fitness]');
    await s.waitFor("location.pathname === '/training/today'", 15000, 'open workout module');
  }
  if (screen !== 'today' || route.startsWith('/training/')) {
    await s.click('[data-testid=workout-tab-' + screen + ']');
    await s.waitFor('location.pathname === ' + JSON.stringify('/training/' + screen), 15000, 'open ' + screen);
  }
}
export async function resumeWorkout(s) {
  const route = await s.ev('location.pathname');
  if (route === '/training/session') return;
  await openTrainingScreen(s, 'today');
  await s.waitFor("document.querySelector('[data-testid=resume-workout]')?.getBoundingClientRect().width > 0", 20000, 'active session on Today');
  await s.click('[data-testid=resume-workout]');
  await s.waitFor("location.pathname === '/training/session'", 10000, 'resumed workout');
}
export async function useFullBodyPreset(s) {
  await openTrainingScreen(s, 'plans');
  if (!await s.ev("document.querySelector('.plan-grid')?.getBoundingClientRect().width > 0")) {
    await s.click('[data-testid=manual-plans]');
  }
  await s.clickLabel('Chọn Full Body 3 buổi');
  await s.waitFor("document.querySelector('[aria-label=\"Thứ 2: Full Body A\"]')?.getBoundingClientRect().width > 0", 15000, 'chosen Full Body plan');
}
export async function onboard(s, { openFitness = true } = {}) {
  const { ev, waitFor, tapText, click, type } = s;
  await waitFor("location.pathname.length>1", 30000, 'route');
  if ((await ev('location.pathname')) === '/account') {
    const account = { id: 'exerciseguideqa', username: 'exercise_guide_qa', token: 'offline-test-fixture' };
    const session = JSON.stringify(account);
    await ev(`localStorage.setItem('mealplan.session.v1', ${JSON.stringify(session)})`);
    await ev("location.replace('/')");
    await waitFor("location.pathname === '/onboarding' || location.pathname.startsWith('/tabs')", 30000, 'offline test account');
  }
  if ((await ev('location.pathname')).includes('onboarding')) {
    await waitFor("!!document.querySelector('[data-testid=onb-step1-continue]')", 20000, 'step1');
    await tapText('Tăng cơ'); await click('[data-testid=onb-step1-continue]'); await sleep(900);
    await type('#field-height', '170'); await type('#field-weight', '65'); await type('#field-birth-date', '1995-05-20');
    await tapText('Nam'); await click('[data-testid=onb-step2-continue]'); await sleep(900);
    await tapText('Ít vận động'); await tapText('Chưa bao giờ'); await click('[data-testid=onb-step3-finish]');
    await waitFor("!location.pathname.includes('onboarding')", 30000, 'leave onboarding');
    await sleep(1500);
  }
  if (!openFitness) return;
  const t0 = Date.now();
  await click('[data-testid=tab-fitness]');
  await waitFor("location.pathname === '/training/today'", 30000, 'workout module');
  await waitFor("document.querySelector('[data-testid=workout-tab-plans]')?.getBoundingClientRect().width > 0", 90000, 'workout tabs');
  s.fitnessReadyMs = Date.now() - t0;
}
