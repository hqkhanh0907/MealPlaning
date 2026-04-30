/**
 * API key obfuscation/decoding for `GeminiClient`.
 *
 * Strategy: XOR with rotating key 'HealthMate-2026' + base64.
 * NOT encryption — only stops casual `strings app.apk | grep AIzaSy`
 * extraction. See `docs/5-development/phase-1.5b-ai-foundation.md` §3.7
 * for security caveat (V1 trade-off, mitigation in V2+).
 *
 * Build pipeline:
 *   1. Dev writes plain key to `.env` (gitignored)
 *   2. `scripts/obfuscate-gemini-key.mjs` reads .env, XOR+base64 it,
 *      writes `environment.prod.ts` (gitignored)
 *   3. Angular fileReplacements swaps environment.ts → environment.prod.ts
 *      at production build time
 *   4. Runtime calls `decodeApiKey(environment.geminiApiKeyObf)`
 */

import { InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

const OBF_KEY = 'HealthMate-2026';

/**
 * Decode an obfuscated API key produced by `scripts/obfuscate-gemini-key.mjs`.
 * Returns empty string when input is empty (dev mode without .env).
 *
 * Round-trip property: `decodeApiKey(obfuscate(x)) === x` for any string x.
 */
export function decodeApiKey(obfuscated: string): string {
  if (!obfuscated) return '';
  let xored: string;
  try {
    xored = atob(obfuscated);
  } catch {
    // Not valid base64 — assume input is plain key (dev mode convenience).
    return obfuscated;
  }
  let out = '';
  for (let i = 0; i < xored.length; i++) {
    out += String.fromCharCode(xored.charCodeAt(i) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length));
  }
  return out;
}

/**
 * DI token that resolves to the decoded API key at runtime.
 *
 * Test override:
 *   TestBed.configureTestingModule({
 *     providers: [{ provide: GEMINI_API_KEY, useValue: 'TEST_KEY' }]
 *   });
 */
export const GEMINI_API_KEY = new InjectionToken<string>('GEMINI_API_KEY', {
  providedIn: 'root',
  factory: () => decodeApiKey(environment.geminiApiKeyObf),
});
