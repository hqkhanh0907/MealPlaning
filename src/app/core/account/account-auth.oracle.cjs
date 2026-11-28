const assert = require('node:assert/strict');
const fs = require('node:fs');
require('tsx/cjs');
require('@angular/compiler');
const { AccountSession } = require('./account-session.ts');

const storage = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
});

async function compare(fixture) {
  const account = new AccountSession();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const reply = fixture.replies[calls.length];
    calls.push([new URL(url).pathname, JSON.parse(options.body)]);
    assert.ok(reply, 'unexpected request');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'omit');
    return new Response(JSON.stringify(reply[1]), { status: reply[0], statusText: 'Fixture' });
  };
  let result;
  try {
    await account.authenticate(fixture.user, fixture.password, fixture.name ?? undefined);
    result = { identity: account.current() };
  } catch (error) {
    result = { error: [error.status ?? 0, error.message, error.code ?? '', error.field ?? ''] };
  }
  assert.deepEqual({ result, calls }, fixture.rust, fixture.case);
}

(async () => {
  for (const fixture of JSON.parse(fs.readFileSync(0, 'utf8'))) await compare(fixture);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
