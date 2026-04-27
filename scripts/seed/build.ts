/**
 * Phase 1 §5.2 — Seed build orchestrator.
 *
 * Steps wired:
 *   §5.2.2 build-ingredients.ts    — atomic ingredients + ingredient_units
 *   §5.2.3 build-composites.ts     — derived composite ingredients
 *   §5.2.4 build-dishes.ts         — curated 20 dishes
 *   §5.2.4 validate-seed.ts        — AC1/AC6/AC12/AC15 cross-ref pass
 *
 * Output: src/assets/seed/*.json (committed to repo).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCompositesToDisk } from './build-composites';
import { buildDishesToDisk } from './build-dishes';
import { buildIngredientsToDisk } from './build-ingredients';
import { VI_COMPOSITES } from './curated/vi-composites';
import { VI_DISHES } from './curated/vi-dishes';
import { VI_INGREDIENTS } from './curated/vi-ingredients';
import { validateSeed } from './validate-seed';

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

const composites = buildCompositesToDisk(outDir);
console.log(`  [§5.2.3] wrote ${composites.length} composites`);

const dishes = buildDishesToDisk(outDir);
console.log(`  [§5.2.4] wrote ${dishes.length} dishes`);

const report = validateSeed({
  ingredients,
  composites,
  composite_recipes: VI_COMPOSITES,
  dishes,
});
console.log(
  `  [§5.2.4] cross-artifact validate: ok (${report.dish_macros.length} dishes, ${report.warnings.length} warnings)`,
);
for (const w of report.warnings) console.log(`    ⚠ ${w}`);

console.log('  status: §5.2.2-5.2.4 complete.');
