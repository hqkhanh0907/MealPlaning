#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const packageFile = new URL('../package.json', import.meta.url);
const output = new URL('../src/environments/environment.prod.ts', import.meta.url);
const { version } = JSON.parse(readFileSync(packageFile, 'utf8'));

writeFileSync(
  output,
  `export const environment = {
  production: true,
  appVersion: ${JSON.stringify(version)},
  geminiApiKeyObf: '',
  geminiModel: 'gemini-2.5-flash',
  dbName: 'healthmate.db',
};
`,
  { mode: 0o600 },
);
