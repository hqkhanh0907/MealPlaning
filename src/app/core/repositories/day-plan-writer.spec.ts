import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { AccountSession } from '../account/account-session';
import { NATIVE_CALENDAR_READ } from '../account/calendar-read';
import { Database } from '../services/database/database';
import { DayPlanRepository } from './day-plan.repository';

describe('day-plan reads during a native outer transaction', () => {
  it('sees the uncommitted day on the writer connection during a week copy', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const date = '2026-12-01';
    const day = {
      id: 'new-day',
      date,
      target_calories: 0,
      target_protein: 0,
      created_at: '2026-11-24',
      updated_at: null,
    };
    const nativeRead = jasmine.createSpy('committed native snapshot').and.resolveTo([]);
    const writer = {
      hasActiveTransaction: true,
      getOne: jasmine.createSpy('getOne').and.resolveTo(day),
      query: jasmine
        .createSpy('query')
        .and.callFake(async (sql: string) => (sql.includes('FROM day_plan') ? [day] : [])),
    };
    TestBed.configureTestingModule({
      providers: [
        DayPlanRepository,
        { provide: Database, useValue: writer },
        { provide: AccountSession, useValue: { current: signal({ id: 'an' }) } },
        { provide: NATIVE_CALENDAR_READ, useValue: nativeRead },
      ],
    });
    const repo = TestBed.inject(DayPlanRepository);
    expect((await repo.findByDate(date))?.id).toBe(day.id);
    expect((await repo.findByDateRange(date, date)).map((r) => r.id)).toEqual([day.id]);
    expect(nativeRead).not.toHaveBeenCalled();
    writer.hasActiveTransaction = false;
    expect(await repo.findByDate(date)).toBeNull();
    expect(nativeRead).toHaveBeenCalledOnceWith(date, date, 'an');
  });
});
