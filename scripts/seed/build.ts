/**
 * Phase 1 §5.2 — Seed build orchestrator.
 *
 * In §5.2.1 this script just smoke-tests that the curated TS modules load
 * cleanly and reports the inventory. Real emission to JSON happens in
 * §5.2.2 (build-ingredients), §5.2.3 (build-composites), §5.2.4 (build-dishes
 * + validate-seed).
 */
import { VI_INGREDIENTS } from './curated/vi-ingredients';
import { VI_COMPOSITES } from './curated/vi-composites';
import { VI_DISHES } from './curated/vi-dishes';

function main(): void {
  // eslint-disable-next-line no-console
  console.log('§5.2 seed build pipeline');
  // eslint-disable-next-line no-console
  console.log(
    `  curated atomic ingredients: ${VI_INGREDIENTS.length}\n` +
      `  curated composite recipes:  ${VI_COMPOSITES.length}\n` +
      `  curated dishes:             ${VI_DISHES.length}`,
  );
  // eslint-disable-next-line no-console
  console.log('  status: §5.2.1 scaffolding complete; emit steps wired in §5.2.2-5.2.4.');
}

main();
