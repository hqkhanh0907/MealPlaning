const { SEED_EXERCISES, SEED_TRAINING_PLANS } = require('../../src/app/core/repositories/fitness-seed.ts');
const { exerciseGuide } = require('../../src/app/core/models/exercise-guides.ts');
const { isTimedExercise } = require('../../src/app/core/models/fitness.types.ts');
const { catalogSearchNames } = require('../../src/app/core/models/exercise-catalog.ts');
const out = SEED_EXERCISES.map((e) => ({ id: e.id, name: e.name, nameVi: e.name_vi, equipment: e.equipment, category: e.category, timed: isTimedExercise(e.id), guide: exerciseGuide(e.id) ?? null, choices: [], searchNames: catalogSearchNames(e.id) }));
require('node:fs').writeFileSync('' + __dirname + '/expected.json', JSON.stringify(out));
require('node:fs').writeFileSync('' + __dirname + '/plans.json', JSON.stringify(SEED_TRAINING_PLANS));
console.log(out.length, out.filter((e) => e.guide).length);
