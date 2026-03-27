import { formatElapsed } from '../features/fitness/utils/timeFormat';

describe('formatElapsed', () => {
  it('formats seconds < 60', () => expect(formatElapsed(45)).toBe('00:45'));
  it('formats minutes', () => expect(formatElapsed(125)).toBe('02:05'));
  it('formats hours', () => expect(formatElapsed(3661)).toBe('1:01:01'));
  it('handles zero', () => expect(formatElapsed(0)).toBe('00:00'));
  it('handles NaN', () => expect(formatElapsed(NaN)).toBe('00:00'));
  it('handles negative', () => expect(formatElapsed(-10)).toBe('00:00'));
  it('handles Infinity', () => expect(formatElapsed(Infinity)).toBe('00:00'));
});
