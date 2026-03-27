import { safeJsonParse } from '../features/fitness/utils/safeJsonParse';

describe('safeJsonParse', () => {
  it('parses valid JSON', () => expect(safeJsonParse('["a","b"]', [])).toEqual(['a', 'b']));
  it('returns fallback for corrupted JSON', () => expect(safeJsonParse('{broken', [])).toEqual([]));
  it('returns fallback for null', () => expect(safeJsonParse(null, [])).toEqual([]));
  it('returns fallback for undefined', () => expect(safeJsonParse(undefined, [])).toEqual([]));
  it('returns fallback for empty string', () => expect(safeJsonParse('', [])).toEqual([]));
});
