const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../../..');
const app = createRequire(path.join(root, 'package.json'));
app('tsx/cjs');
app('@angular/compiler');
const ng = app('@angular/core');
const { Database } = app(path.join(root, 'src/app/core/services/database/database.ts'));
const { UserProfileRepository } = app(
  path.join(root, 'src/app/core/repositories/user-profile.repository.ts'),
);
const native = JSON.parse(fs.readFileSync(0, 'utf8'));
const sql = new DatabaseSync(process.argv[2]);
const database = {
  getOne: async (query, values = []) => sql.prepare(query).get(...values) ?? null,
  execute: async (query, values = []) => sql.prepare(query).run(...values),
};
const injector = ng.Injector.create({ providers: [{ provide: Database, useValue: database }] });
const repository = ng.runInInjectionContext(injector, () => new UserProfileRepository());
function canonical(values) {
  const ids = new Map();
  return JSON.parse(
    JSON.stringify(values, (key, value) => {
      if (key === 'id' && typeof value === 'string') {
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
          value,
        );
        const trigger = /^[0-9a-f]{32}$/.test(value);
        if (uuid || trigger) {
          if (!ids.has(value)) ids.set(value, (uuid ? 'uuid4-' : 'hex-') + ids.size);
          return ids.get(value);
        }
      }
      if (['created_at', 'updated_at'].includes(key) && value !== null) {
        assert.match(value, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
        return 'sqlite-utc';
      }
      return value;
    }),
  );
}
(async () => {
  const observed = [];
  for (const { command } of native) {
    let value = null,
      error = null;
    const day = new Date((command.today ?? '2026-11-28') + 'T00:00:00');
    try {
      switch (command.op) {
        case 'get':
          value = await repository.getProfile();
          break;
        case 'latestWeight':
          value = await repository.getLatestWeightLog();
          break;
        case 'previousWeight':
          value = await repository.getPreviousWeightLog(command.beforeDate);
          break;
        case 'insert':
          value = await repository.insert(command.data, day);
          break;
        case 'update':
          await repository.update(command.data, day);
          break;
        default:
          throw Error('Unknown test operation');
      }
    } catch (e) {
      error = e.message;
    }
    observed.push({
      command,
      value,
      error,
      profile: await repository.getProfile(),
      log: sql
        .prepare('SELECT id,weight_kg,date,notes,created_at FROM weight_log ORDER BY date DESC')
        .all(),
      change: sql.prepare('SELECT change_version FROM sync_workspace WHERE id=1').get()
        .change_version,
    });
  }
  assert.deepEqual(canonical(native), canonical(observed));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.close());
