import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const envFile = new URL('../.env', import.meta.url);
const local = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
const key = (process.env.GROQ_API_KEY ?? local.GROQ_API_KEY ?? '').trim();
const output = new URL('../src/environments/groq.local.ts', import.meta.url);
writeFileSync(output, `export const groqApiKey = ${JSON.stringify(key)};\n`, { mode: 0o600 });
