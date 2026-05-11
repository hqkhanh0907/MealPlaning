import { normalize, levenshtein, thresholdForLength, findFuzzyMatches } from './fuzzy-match';

describe('fuzzy-match — normalize', () => {
  it('lowercases ASCII string', () => {
    expect(normalize('Hello WORLD')).toBe('hello world');
  });

  it('strips Vietnamese diacritics (à→a, ạ→a, ơ→o, ă→a, â→a) and maps đ→d', () => {
    expect(normalize('Đậu hũ chiên giòn')).toBe('dau hu chien gion');
    expect(normalize('Cà chua bi đỏ')).toBe('ca chua bi do');
    expect(normalize('Hành lá tươi')).toBe('hanh la tuoi');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalize('  hành lá  ')).toBe('hanh la');
  });

  it('collapses internal multi-spaces to single space', () => {
    expect(normalize('Hành    lá   tươi')).toBe('hanh la tuoi');
  });

  it('handles mixed-case + accent + extra spaces in one shot', () => {
    expect(normalize('Hành Lá  ')).toBe('hanh la');
  });

  it('returns empty string for empty input', () => {
    expect(normalize('')).toBe('');
  });
});

describe('fuzzy-match — thresholdForLength', () => {
  it('returns 0 for very short words (≤3 chars) — exact match only', () => {
    expect(thresholdForLength(0)).toBe(0);
    expect(thresholdForLength(1)).toBe(0);
    expect(thresholdForLength(2)).toBe(0);
    expect(thresholdForLength(3)).toBe(0);
  });

  it('returns 1 for short-to-medium words (4-9 chars) — single-typo tolerance', () => {
    expect(thresholdForLength(4)).toBe(1);
    expect(thresholdForLength(5)).toBe(1);
    expect(thresholdForLength(6)).toBe(1);
    expect(thresholdForLength(7)).toBe(1);
    expect(thresholdForLength(8)).toBe(1);
    expect(thresholdForLength(9)).toBe(1);
  });

  it('returns 2 for long phrases (≥10 chars)', () => {
    expect(thresholdForLength(10)).toBe(2);
    expect(thresholdForLength(20)).toBe(2);
  });
});

describe('fuzzy-match — levenshtein (early-exit, default threshold 2)', () => {
  it('returns 0 for equal strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
    expect(levenshtein('', '')).toBe(0);
  });

  it('returns 1 for single insert', () => {
    expect(levenshtein('abc', 'abcd')).toBe(1);
  });

  it('returns 1 for single delete', () => {
    expect(levenshtein('abcd', 'abc')).toBe(1);
  });

  it('returns 1 for single substitution', () => {
    expect(levenshtein('abc', 'abd')).toBe(1);
  });

  it('returns 2 for distance exactly 2 (boundary)', () => {
    expect(levenshtein('abc', 'aXY')).toBe(2);
    expect(levenshtein('hanh la', 'hanh las')).toBe(1);
    expect(levenshtein('hanh la', 'hanh laa')).toBe(1);
  });

  it('returns sentinel (threshold+1) for distance beyond threshold', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abcdef', 'xyzwvu')).toBe(3);
    expect(levenshtein('hanh la', 'abcxyz')).toBe(3);
  });

  it('returns concrete empty-string distance when within threshold', () => {
    expect(levenshtein('', 'ab', 2)).toBe(2);
    expect(levenshtein('ab', '', 2)).toBe(2);
  });

  it('bounds memory for unexpectedly long same-length inputs', () => {
    expect(levenshtein('a'.repeat(256), 'b'.repeat(256))).toBe(3);
  });

  it('respects custom threshold parameter', () => {
    // threshold=0 → exact match only, sentinel=1
    expect(levenshtein('bun', 'bo', 0)).toBe(1);
    expect(levenshtein('bun', 'bun', 0)).toBe(0);
    // threshold=1 → single edit ok, sentinel=2
    expect(levenshtein('hanh la', 'hanh las', 1)).toBe(1);
    expect(levenshtein('abc', 'aXY', 1)).toBe(2);
  });

  it('handles 1000 short pairs in < 100ms', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      levenshtein('hanh la', 'hanh las');
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

describe('fuzzy-match — findFuzzyMatches (dynamic threshold)', () => {
  it('finds exact match (distance 0) when target equals candidate name', () => {
    const result = findFuzzyMatches('hành lá', [{ id: 'a', name: 'Hành lá' }]);
    expect(result).toEqual([{ match: { id: 'a', name: 'Hành lá' }, distance: 0 }]);
  });

  it('finds match across diacritics + case via normalize', () => {
    const result = findFuzzyMatches('hanh la', [{ id: 'a', name: 'Hành Lá' }]);
    expect(result.length).toBe(1);
    expect(result[0].distance).toBe(0);
    expect(result[0].match.id).toBe('a');
  });

  it('returns multiple matches sorted by distance ascending (long words ≥10)', () => {
    // "ca chua bi do" (13 chars after normalize) → threshold 2
    const result = findFuzzyMatches('Cà chua bi đỏ', [
      { id: 'a', name: 'Cà chua bi đỏ' }, // dist 0
      { id: 'b', name: 'Cà chua bi đỏ khô' }, // length diff 4 → out
      { id: 'c', name: 'Ca chua bi dos' }, // dist 1
      { id: 'd', name: 'Ca chua bi doss' }, // dist 2
    ]);
    expect(result.map((r) => r.match.id)).toEqual(['a', 'c', 'd']);
    expect(result[0].distance).toBe(0);
    expect(result[1].distance).toBe(1);
    expect(result[2].distance).toBe(2);
  });

  it('returns empty array when no candidate is within fuzzy range', () => {
    const result = findFuzzyMatches('abcxyz', [{ id: 'a', name: 'Hành lá' }]);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty candidates', () => {
    expect(findFuzzyMatches('hanh la', [])).toEqual([]);
  });

  // ── Regression: 2026-05-01 E2E false-positive review ──────────────────
  // Real Gemini false positives observed on emulator: short Vietnamese
  // words were matching unrelated ingredients with a flat threshold of 2.
  // After dynamic threshold (≤3 char → exact only), all of these MUST NOT
  // match. Each pair is `(AI-suggested name, pantry name)`.

  it('does NOT match short distinct Vietnamese words (≤3 chars)', () => {
    expect(findFuzzyMatches('Bún', [{ id: '1', name: 'Bơ' }])).toEqual([]);
    expect(findFuzzyMatches('Bơ', [{ id: '1', name: 'Bún' }])).toEqual([]);
    expect(findFuzzyMatches('Tôm', [{ id: '1', name: 'tỏi' }])).toEqual([]);
    expect(findFuzzyMatches('Hẹ', [{ id: '1', name: 'Bơ' }])).toEqual([]);
    expect(findFuzzyMatches('Bún', [{ id: '1', name: 'dứa' }])).toEqual([]);
  });

  it('still matches short words EXACTLY after normalize (diacritic-insensitive)', () => {
    expect(findFuzzyMatches('bún', [{ id: '1', name: 'Bún' }])).toEqual([
      { match: { id: '1', name: 'Bún' }, distance: 0 },
    ]);
    expect(findFuzzyMatches('Tôm', [{ id: '1', name: 'tom' }])).toEqual([
      { match: { id: '1', name: 'tom' }, distance: 0 },
    ]);
  });

  it('still matches longer phrases that differ by 1 typo (4-6 chars)', () => {
    // "thit bo" (7 chars) is in the 7+ bucket → threshold 2, allows minor edits.
    // For the 4-6 bucket, use a 5-char example.
    expect(findFuzzyMatches('hanh', [{ id: '1', name: 'hành' }])).toEqual([
      { match: { id: '1', name: 'hành' }, distance: 0 },
    ]);
    // "hanhx" vs "hành" → normalized "hanhx" vs "hanh", minLen=4, threshold 1, dist 1 → match
    expect(findFuzzyMatches('hanhx', [{ id: '1', name: 'hành' }]).length).toBe(1);
  });

  it('matches "Thịt heo" against "Thịt bò" → REJECTED (dist 2 > new thr 1 for minLen 7)', () => {
    // "thit heo" (8) vs "thit bo" (7) → minLen 7 → threshold 1.
    // Levenshtein dist = 2 → above threshold → no match.
    // Same-category-but-different-protein causes ~30% protein/fat shift,
    // so erring on "Tạo mới" is the safe default. User keeps full control.
    expect(findFuzzyMatches('Thịt heo', [{ id: '1', name: 'Thịt bò' }])).toEqual([]);
  });

  it('rejects "Sữa tươi" ↔ "bún tươi" (shared suffix masking 2 head subs)', () => {
    // Real E2E false positive (Sinh to bo, 2026-05-01 v2):
    // "sua tuoi" (8) vs "bun tuoi" (8) → minLen 8 → threshold 1.
    // Dist = 2 (s→b, u→u, a→n) → REJECTED. Without dynamic threshold this
    // matched at flat thr 2 because shared " tuoi" hid head divergence.
    expect(findFuzzyMatches('Sữa tươi', [{ id: '1', name: 'bún tươi' }])).toEqual([]);
  });

  it('still matches plural / trailing-letter variants on long names', () => {
    // 'ca chua bi do' (13) vs 'ca chua bi dos' (14) → minLen 13 → threshold 2 → match
    const r = findFuzzyMatches('Cà chua bi đỏ', [{ id: '1', name: 'Cà chua bi đỏs' }]);
    expect(r.length).toBe(1);
    expect(r[0].distance).toBe(1);
  });
});
