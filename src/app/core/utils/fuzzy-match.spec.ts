import { normalize } from './fuzzy-match';

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
