import { relativeDateLabel } from './relative-date-label';

describe('relativeDateLabel', () => {
  const today = '2026-05-10'; // Sunday

  it('returns "Hôm nay" when target == today', () => {
    expect(relativeDateLabel('2026-05-10', today)).toBe('Hôm nay');
  });

  it('returns "Hôm qua" when target == today - 1', () => {
    expect(relativeDateLabel('2026-05-09', today)).toBe('Hôm qua');
  });

  it('returns "Ngày mai" when target == today + 1', () => {
    expect(relativeDateLabel('2026-05-11', today)).toBe('Ngày mai');
  });

  it('returns "Thứ N, dd/mm/yy" for arbitrary future date', () => {
    // 2026-05-15 was a Friday
    expect(relativeDateLabel('2026-05-15', today)).toBe('Thứ 6, 15/05/26');
  });

  it('returns "Thứ N, dd/mm/yy" for arbitrary past date', () => {
    // 2026-05-04 was a Monday
    expect(relativeDateLabel('2026-05-04', today)).toBe('Thứ 2, 04/05/26');
  });

  it('handles Sunday → "Chủ Nhật"', () => {
    // 2026-05-17 was a Sunday
    expect(relativeDateLabel('2026-05-17', today)).toBe('Chủ Nhật, 17/05/26');
  });

  it('crosses month boundary correctly', () => {
    // 2026-06-01 from 2026-05-10 → diff = 22
    expect(relativeDateLabel('2026-06-01', today)).toMatch(/Thứ \d|Chủ Nhật/);
  });

  it('falls back to raw input on invalid target', () => {
    expect(relativeDateLabel('not-a-date', today)).toBe('not-a-date');
  });

  it('falls back to raw input on invalid today', () => {
    expect(relativeDateLabel('2026-05-10', 'bad')).toBe('2026-05-10');
  });
});
