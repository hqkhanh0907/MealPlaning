/**
 * Phase 1 §5.2 — Seed build orchestrator.
 *
 * Steps wired so far:
 *   §5.2.2 build-ingredients.ts    — atomic ingredients + ingredient_units
 *   §5.2.3 build-composites.ts     — TODO
 *   §5.2.4 build-dishes.ts         — TODO
 *   §5.2.4 validate-seed.ts        — TODO
 *
 * Output: src/assets/seed/*.json (committed to repo).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildIngredientsToDisk } from './build-ingredients';
import { VI_COMPOSITES } from './curated/vi-composites';
import { VI_DISHES } from './curated/vi-dishes';
import { VI_INGREDIENTS } from './curated/vi-ingredients';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../src/assets/seed');

console.log('§5.2 seed build pipeline');
console.log(`  curated atomic ingredients: ${VI_INGREDIENTS.length}`);
console.log(`  curated composite recipes:  ${VI_COMPOSITES.length}`);
console.log(`  curated dishes:             ${VI_DISHES.length}`);
console.log(`  outDir:                     ${outDir}`);

const { ingredients, ingredient_units } = buildIngredientsToDisk(outDir);
console.log(
  `  [§5.2.2] wrote ${ingredients.length} ingredients, ${ingredient_units.length} ingredient_units`,
);

console.log('  status: §5.2.2 wired; §5.2.3-5.2.4 pending.');
