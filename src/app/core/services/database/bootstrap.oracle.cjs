const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
require('tsx/cjs');
require('@angular/compiler');
const { NativeDatabase } = require('./native-database.ts');
const { prepareWorkspace } = require('../../account/workspace-snapshot.ts');

async function compare() {
  const reference = new DatabaseSync(':memory:');
  const native = new DatabaseSync(process.argv[2]);
  const original = new NativeDatabase();
  original.sqlite.createConnection = async () => ({
    open() {},
    execute: (sql) => reference.exec(sql),
    run: (sql, values) => reference.prepare(sql).run(...values),
    query: (sql, values = []) => ({ values: reference.prepare(sql).all(...values) }),
    executeSet(statements) {
      for (const { statement, values } of statements) reference.prepare(statement).run(...values);
      return { changes: { changes: statements.length } };
    },
  });
  await original.initialize();
  await prepareWorkspace(original);
  const query = (sql) => {
    const expected = reference.prepare(sql).all();
    assert.deepEqual(native.prepare(sql).all(), expected, sql);
    return expected;
  };
  query('PRAGMA user_version');
  query('SELECT type,name,tbl_name FROM sqlite_schema ORDER BY type,name');
  const tables = query("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name");
  for (const { name } of tables) {
    assert.match(name, /^[a-z_][a-z_0-9]*$/);
    query(`PRAGMA table_info("${name}")`);
    query(`PRAGMA foreign_key_list("${name}")`);
    query(`PRAGMA index_list("${name}")`);
    query(`SELECT * FROM "${name}" ORDER BY rowid`);
  }
  for (const db of [native, reference]) {
    db.exec("INSERT INTO ingredient(id,name,category,calories,protein) VALUES ('a','Đậu','Khác',20,4)");
    db.exec("UPDATE ingredient SET protein=5 WHERE id='a'");
    db.exec("DELETE FROM ingredient WHERE id='a'");
  }
  assert.equal(query('SELECT change_version FROM sync_workspace')[0].change_version, 3);
  native.close();
  reference.close();
}

compare().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
