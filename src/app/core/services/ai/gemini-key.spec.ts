import { decodeApiKey } from './gemini-key';

describe('decodeApiKey', () => {
  // Mirror obfuscate() from scripts/obfuscate-gemini-key.mjs for round-trip.
  const OBF_KEY = 'HealthMate-2026';
  function obfuscate(plain: string): string {
    let xored = '';
    for (let i = 0; i < plain.length; i++) {
      xored += String.fromCharCode(plain.charCodeAt(i) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length));
    }
    // browser-side base64 encode of binary string
    return btoa(xored);
  }

  it('round-trips a Gemini-shaped key', () => {
    const plain = 'AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890';
    expect(decodeApiKey(obfuscate(plain))).toBe(plain);
  });

  it('returns empty for empty input', () => {
    expect(decodeApiKey('')).toBe('');
  });

  it('handles short keys', () => {
    expect(decodeApiKey(obfuscate('a'))).toBe('a');
  });

  it('handles keys longer than OBF_KEY (rotation)', () => {
    const plain = 'a'.repeat(200);
    expect(decodeApiKey(obfuscate(plain))).toBe(plain);
  });

  it('treats invalid base64 as plain string (dev convenience)', () => {
    // `!@#$%` is not valid base64 — should return as-is.
    expect(decodeApiKey('!@#$%')).toBe('!@#$%');
  });
});
