const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '../../../..');
const app = createRequire(path.join(root, 'package.json'));
app('tsx/cjs');
app('@angular/compiler');
const ng = app('@angular/core');
const { IngredientRepository } = app(
  path.join(root, 'src/app/core/repositories/ingredient.repository.ts'),
);
const { Database } = app(path.join(root, 'src/app/core/services/database/database.ts'));
const { AccountSession } = app(path.join(root, 'src/app/core/account/account-session.ts'));
const { NATIVE_CATALOG_READ, CatalogRead } = app(
  path.join(root, 'src/app/core/account/catalog-read.ts'),
);
const { IngredientStore } = app(path.join(root, 'src/app/core/stores/ingredient.store.ts'));
const db = new DatabaseSync(process.argv[2], { readOnly: true });
const port = {
  query: async (sql, args = []) => db.prepare(sql).all(...args),
  getOne: async (sql, args = []) => db.prepare(sql).get(...args) ?? null,
};
const injector = ng.Injector.create({ providers: [{ provide: Database, useValue: port }] });
const repository = ng.runInInjectionContext(injector, () => new IngredientRepository());
const { commands, results } = JSON.parse(fs.readFileSync(0, 'utf8'));
const args = {
  list: [],
  getById: ['id'],
  findByIds: ['ids'],
  searchByName: ['query'],
  findByExactName: ['name'],
  findRecentlyUsed: ['limit'],
  countDishReferences: ['id'],
};
function signature(command) {
  return JSON.stringify(command, Object.keys(command).sort());
}
async function compare(repo) {
  for (const [index, request] of commands.entries()) {
    const actual = await repo[request.op](...args[request.op].map((key) => request[key]));
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), results[index], JSON.stringify(request));
  }
}
void (async () => {
  await compare(repository);
  const responses = new Map(commands.map((command, index) => [signature(command), results[index]]));
  const owner = { id: 'aaaaaaaaaaaaaaa', username: 'qa', name: 'An' };
  const platform = app('@capacitor/core').Capacitor;
  platform.getPlatform = () => 'android';
  const android = ng.Injector.create({
    providers: [
      CatalogRead,
      IngredientStore,
      IngredientRepository,
      { provide: AccountSession, useValue: { current: () => owner } },
      { provide: Database, useValue: { hasActiveTransaction: false } },
      {
        provide: NATIVE_CATALOG_READ,
        useValue: async ({ ownerId, command }) => {
          assert.equal(ownerId, owner.id);
          const key = signature(command);
          assert.ok(responses.has(key), key);
          return { ownerId, op: command.op, value: responses.get(key) };
        },
      },
    ],
  });
  await compare(android.get(IngredientRepository));
  const store = android.get(IngredientStore);
  await store.load();
  assert.deepEqual(store.ingredients(), responses.get(signature({ op: 'list' })));
  await store.search('  uc ga  ');
  assert.deepEqual(
    store.ingredients(),
    responses.get(signature({ op: 'searchByName', query: 'uc ga' })),
  );
  assert.equal(
    await store.countDishReferences('third'),
    responses.get(signature({ op: 'countDishReferences', id: 'third' })),
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.close());
