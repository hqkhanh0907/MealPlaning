import { mkdirSync, writeFileSync } from 'node:fs';
import { session } from './lib.mjs';
import { freshOffline, onboard } from './setup.mjs';

const outputs = new URL('./shots/', import.meta.url);
mkdirSync(outputs, { recursive: true });
await freshOffline();
const app = await session();
const results = [];
try {
  await onboard(app);
  for (const tab of ['dashboard', 'calendar', 'management', 'fitness']) {
    await app.click(`[data-testid="tab-${tab}"]`);
    await app.waitFor(`location.pathname === "/tabs/${tab}"`, 10000, tab);
    await app.waitFor(
      'Array.from(document.querySelectorAll(".ion-page:not(.ion-page-hidden) ion-content")).some(e=>e.innerText.trim().length>0)',
      10000,
      `${tab} content`,
    );
    app.shot(new URL(`offline-${tab}.png`, outputs).pathname);
    results.push(tab);
  }
} finally {
  writeFileSync(new URL('./offline-tabs-results.json', import.meta.url), JSON.stringify(results));
  app.close();
}
