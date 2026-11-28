import { readAccountCalendar } from './calendar-read';

describe('native calendar account boundary', () => {
  const date = '2026-11-28';
  it('uses the legacy date lookup for inputs outside the native date format', async () => {
    const read = jasmine.createSpy('native read');
    expect(await readAccountCalendar('legacy-date', date, 'an', read)).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });
  it('keeps an empty database result distinct from an unavailable native reader', async () => {
    const read = jasmine
      .createSpy('native read')
      .and.resolveTo({ ownerId: 'an', start: date, end: date, days: [] });
    expect(await readAccountCalendar(date, date, 'an', read)).toEqual([]);
    expect(read).toHaveBeenCalledOnceWith({ start: date, end: date });
    read.and.rejectWith({ code: 'UNIMPLEMENTED' });
    expect(await readAccountCalendar(date, date, 'an', read)).toBeNull();
  });
  it('discards replies for a different account or calendar window', async () => {
    const read = jasmine
      .createSpy('native read')
      .and.resolveTo({ ownerId: 'binh', start: date, end: date, days: [] });
    await expectAsync(readAccountCalendar(date, date, 'an', read)).toBeRejected();
    read.and.resolveTo({ ownerId: 'an', start: '2026-11-27', end: date, days: [] });
    await expectAsync(readAccountCalendar(date, date, 'an', read)).toBeRejected();
  });
});
