import { mkdirSync, mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const output = process.env.GUIDE_EVIDENCE_DIR
  ? resolve(process.env.GUIDE_EVIDENCE_DIR)
  : mkdtempSync(join(tmpdir(), 'mealplan-exercise-guides-'));
mkdirSync(output, { recursive: true });
const repo = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
if (realpathSync(output) === repo || realpathSync(output).startsWith(repo + sep)) {
  throw Error('Choose an evidence folder outside the repository');
}
export const shots = join(output, 'shots') + sep;
mkdirSync(shots, { recursive: true });
console.log('Android evidence:', output);
