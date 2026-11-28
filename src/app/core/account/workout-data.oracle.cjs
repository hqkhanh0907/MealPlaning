const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { tmpdir } = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '../../../..');
const app = createRequire(path.join(root, 'package.json'));
app('tsx/cjs');
app('@angular/compiler');
const ng = app('@angular/core');
const { WorkoutRepository } = app(
  path.join(root, 'src/app/core/repositories/workout.repository.ts'),
);
const { ExercisePlaceRepository } = app(
  path.join(root, 'src/app/core/repositories/exercise-place.repository.ts'),
);
const { Database } = app(path.join(root, 'src/app/core/services/database/database.ts'));
const { commands, results, now, rollback } = JSON.parse(fs.readFileSync(0, 'utf8'));
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [now]));
  }
  static now() {
    return RealDate.parse(now);
  }
};
const sql = new DatabaseSync(process.argv[2]);
const other = new DatabaseSync(process.argv[3], { readOnly: true });
const db = {
  get hasActiveTransaction() {
    return sql.isTransaction;
  },
  query: async (s, args = []) => sql.prepare(s).all(...args),
  getOne: async (s, args = []) => sql.prepare(s).get(...args) ?? null,
  execute: async (s, args = []) => sql.prepare(s).run(...args),
  withTransaction: async (work) => {
    if (sql.isTransaction) return work();
    sql.exec('BEGIN IMMEDIATE');
    try {
      const r = await work();
      sql.exec('COMMIT');
      return r;
    } catch (e) {
      sql.exec('ROLLBACK');
      throw e;
    }
  },
};
const inj = ng.Injector.create({
  providers: [
    { provide: Database, useValue: db },
    { provide: ExercisePlaceRepository, useValue: {} },
  ],
});
let scratch;
function referenceRepository() {
  const revision = process.env.WORKOUT_ORACLE_REVISION;
  if (!revision) return WorkoutRepository;
  const file = 'src/app/core/repositories/workout.repository.ts';
  const original = execFileSync('git', ['-C', root, 'show', revision + ':' + file]);
  scratch = fs.mkdtempSync(path.join(tmpdir(), 'healthmate-workout-oracle-'));
  const core = path.join(scratch, 'src/app/core'),
    repos = path.join(core, 'repositories');
  fs.mkdirSync(repos, { recursive: true });
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
  for (const dir of ['utils', 'models', 'services'])
    fs.symlinkSync(path.join(root, 'src/app/core', dir), path.join(core, dir), 'dir');
  fs.symlinkSync(
    path.join(root, 'src/app/core/repositories/exercise-place.repository.ts'),
    path.join(repos, 'exercise-place.repository.ts'),
  );
  fs.writeFileSync(
    path.join(scratch, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { experimentalDecorators: true, target: 'ES2022' } }),
  );
  fs.writeFileSync(path.join(scratch, file), original);
  return app(path.join(scratch, file)).WorkoutRepository;
}
const ReferenceRepository = referenceRepository();
let repo = ng.runInInjectionContext(inj, () => new ReferenceRepository());
function canonical(input) {
  return JSON.parse(
    JSON.stringify(input, (k, v) =>
      k === 'created_at' && typeof v === 'string' && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v)
        ? 'sqlite-time'
        : v,
    ),
  );
}
async function invoke(c) {
  switch (c.op) {
    case 'getSession':
      return repo.getSession(c.sessionId);
    case 'getActiveSession':
      return repo.getActiveSession();
    case 'addSet':
      return repo.addSet(c.exerciseId, c.input, c.setId);
    case 'skipSet':
      return repo.skipSet(c.exerciseId, c.weightKg, c.reps, c.setId);
    case 'completeSession':
      return (await repo.completeSession(c.sessionId, new Date(c.now ?? NaN))) ?? null;
    case 'reviseCompletedSet':
      return repo.reviseCompletedSet(c.sessionId, c.setId, c.input);
    default:
      throw Error('Unexpected fixture command');
  }
}
void (async () => {
  if (rollback) {
    sql.exec(rollback.trigger);
    await assert.rejects(invoke(rollback.command), (error) => error.message === rollback.error);
    assert.equal(
      sql.prepare('SELECT COUNT(*) AS n FROM workout_set WHERE id=?').get(rollback.command.setId).n,
      0,
    );
    assert.equal(
      sql.prepare("SELECT total_volume FROM workout_session WHERE id='s'").get().total_volume,
      0,
    );
    sql.exec('DROP TRIGGER fail_rollup');
    const receipts = await Promise.all([invoke(rollback.command), invoke(rollback.command)]);
    for (const receipt of receipts)
      assert.deepEqual(canonical(receipt), canonical(rollback.receipt));
  }
  for (const [i, c] of commands.entries()) {
    let real;
    try {
      real = { ok: true, value: await invoke(c) };
    } catch (e) {
      real = { ok: false, error: e.message };
    }
    assert.deepEqual(canonical(real), canonical(results[i]), JSON.stringify(c));
  }
  for (const table of ['workout_session', 'workout_exercise', 'workout_set']) {
    const statement = 'SELECT * FROM ' + table + ' ORDER BY id';
    assert.deepEqual(
      canonical(sql.prepare(statement).all()),
      canonical(other.prepare(statement).all()),
      table,
    );
  }
  const { AccountSession } = app(path.join(root, 'src/app/core/account/account-session.ts'));
  const { WorkoutData, WORKOUT_PORT } = app(
    path.join(root, 'src/app/core/account/workout-data.ts'),
  );
  app('@capacitor/core').Capacitor.getPlatform = () => 'android';
  const owner = { id: 'aaaaaaaaaaaaaaa', name: 'An', username: 'workout_qa' };
  const bound = { ownerId: owner.id, generation: 'workout-rust-qa', reason: '' };
  let index = 0;
  const bridge = {
    binding: async ({ ownerId }) => {
      assert.equal(ownerId, owner.id);
      return bound;
    },
    apply: async ({ command, ...request }) => {
      assert.deepEqual(request, bound);
      assert.deepEqual(JSON.parse(JSON.stringify(command)), commands[index]);
      const response = results[index++];
      if (!response.ok) throw Error(response.error);
      return { ...bound, value: response.value };
    },
  };
  const native = ng.Injector.create({
    providers: [
      WorkoutData,
      { provide: Database, useValue: { hasActiveTransaction: false } },
      { provide: ExercisePlaceRepository, useValue: {} },
      { provide: AccountSession, useValue: { current: () => owner } },
      { provide: WORKOUT_PORT, useValue: bridge },
    ],
  });
  repo = ng.runInInjectionContext(native, () => new WorkoutRepository());
  for (const [i, c] of commands.entries()) {
    let actual;
    try {
      actual = { ok: true, value: await invoke(c) };
    } catch (e) {
      actual = { ok: false, error: e.message };
    }
    assert.deepEqual(canonical(actual), canonical(results[i]), JSON.stringify(c));
  }
  assert.equal(index, commands.length);
  if (process.env.WORKOUT_ORACLE_REPORT_DIR) {
    const proof = process.env.WORKOUT_ORACLE_REPORT_DIR;
    fs.mkdirSync(proof, { recursive: true });
    const revision = process.env.WORKOUT_ORACLE_REVISION || 'working';
    const tables = Object.fromEntries(
      ['workout_session', 'workout_exercise', 'workout_set'].map((table) => {
        const records = canonical(sql.prepare('SELECT * FROM ' + table + ' ORDER BY id').all());
        return [table, createHash('sha256').update(JSON.stringify(records)).digest('hex')];
      }),
    );
    const name = revision + '-' + (rollback ? 'rollback' : 'corpus') + '.json';
    fs.writeFileSync(
      path.join(proof, name),
      JSON.stringify(
        {
          revision,
          commands: commands.length,
          returnedErrors: results.filter((r) => !r.ok).length,
          rollbackCompared: !!rollback,
          sqlAndRustEqual: true,
          androidCommandContractCompared: true,
          tables,
        },
        null,
        2,
      ),
    );
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    sql.close();
    other.close();
    if (scratch) fs.rmSync(scratch, { recursive: true, force: true });
  });
