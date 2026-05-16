/**
 * Dev environment.
 *
 * `geminiApiKeyObf` chứa key đã được obfuscate (XOR + base64) bằng
 * `scripts/obfuscate-gemini-key.mjs` từ file `.env` (gitignored).
 * Trong dev mode, dev có thể paste plain key tạm vào đây để test —
 * `decodeApiKey` sẽ thử decode trước, fallback về plain string nếu fail.
 *
 * Production: `environment.prod.ts` được generate bởi script, gitignored.
 */
export const environment = {
  production: false,
  appVersion: '0.2.2',
  geminiApiKeyObf: '',
  geminiModel: 'gemini-2.5-flash',
  dbName: 'healthmate_dev.db',
};
