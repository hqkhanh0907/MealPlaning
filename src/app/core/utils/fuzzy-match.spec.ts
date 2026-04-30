import { normalize, levenshtein, findFuzzyMatches } from './fuzzy-match';

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

describe('fuzzy-match — levenshtein (early-exit ≤2)', () => {
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

  it('returns 3 for any distance > 2 (early-exit)', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abcdef', 'xyzwvu')).toBe(3);
    expect(levenshtein('hanh la', 'abcxyz')).toBe(3);
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

describe('fuzzy-match — findFuzzyMatches', () => {
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

  it('returns multiple matches sorted by distance ascending', () => {
    const result = findFuzzyMatches('hanh la', [
      { id: 'a', name: 'Hành lá' }, // distance 0 after normalize
      { id: 'b', name: 'Hành la khô' }, // length diff 4 → sentinel 3 → filtered out
      { id: 'c', name: 'Hanh las' }, // distance 1
    ]);
    // Only candidates with distance ≤ 2 should appear.
    expect(result.map((r) => r.match.id)).toEqual(['a', 'c']);
    expect(result[0].distance).toBe(0);
    expect(result[1].distance).toBe(1);
  });

  it('returns empty array when no candidate is within fuzzy range', () => {
    const result = findFuzzyMatches('abcxyz', [{ id: 'a', name: 'Hành lá' }]);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty candidates', () => {
    expect(findFuzzyMatches('hanh la', [])).toEqual([]);
  });
});
