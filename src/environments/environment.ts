/**
 * Dev environment.
 *
 * Production uses a generated environment without provider credentials.
 */
export const environment = {
  production: false,
  appVersion: '0.2.2',
  geminiApiKeyObf: '',
  geminiModel: 'gemini-2.5-flash',
  dbName: 'healthmate_dev.db',
};
