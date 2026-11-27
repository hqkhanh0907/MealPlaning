import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { output, shots } from './artifacts.mjs';
import { session } from './lib.mjs';
import { freshOffline, onboard } from './setup.mjs';

await freshOffline();
const app = await session();
const results = [];
try {
  await onboard(app, { openFitness: false });
  for (const tab of ['dashboard', 'calendar', 'management', 'fitness']) {
    await app.click(`[data-testid="tab-${tab}"]`);
    const destination = tab === 'fitness' ? '/training/today' : `/tabs/${tab}`;
    await app.waitFor(`location.pathname === ${JSON.stringify(destination)}`, 10000, tab);
    await app.waitFor(
      'Array.from(document.querySelectorAll(".ion-page:not(.ion-page-hidden) ion-content")).some(e=>e.innerText.trim().length>0)',
      10000,
      `${tab} content`,
    );
    app.shot(join(shots, `offline-${tab}.png`));
    results.push(tab);
  }
} finally {
  writeFileSync(join(output, 'offline-tabs-results.json'), JSON.stringify(results));
  app.close();
}
