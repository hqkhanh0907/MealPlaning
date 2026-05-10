import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { WeekDayTotal } from '../../../../core/models/meal-plan.types';
import { DayRow } from './day-row';

function makeDay(overrides: Partial<WeekDayTotal> = {}): WeekDayTotal {
  return {
    date: '2026-05-04',
    label: 'T2',
    dotCount: 0,
    loggedCal: 0,
    plannedCal: 0,
    targetCal: 2000,
    isToday: false,
    isPast: false,
    hasPlan: false,
    ...overrides,
  };
}

describe('DayRow', () => {
  let fixture: ComponentFixture<DayRow>;

  function setDay(d: WeekDayTotal): void {
    fixture.componentRef.setInput('day', d);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DayRow] }).compileComponents();
    fixture = TestBed.createComponent(DayRow);
  });

  it('shows label + dots count clamped to 6', () => {
    setDay(makeDay({ dotCount: 9, hasPlan: true }));
    const dots = fixture.nativeElement.querySelectorAll('.day-row__dot');
    expect(dots.length).toBe(6);
  });

  it('shows logged calories for past days', () => {
    setDay(makeDay({ isPast: true, loggedCal: 1800, plannedCal: 0 }));
    const num = fixture.nativeElement.querySelector('.day-row__cal-num').textContent.trim();
    expect(num).toBe('1,800');
  });

  it('shows planned calories for today/future days', () => {
    setDay(makeDay({ isToday: true, plannedCal: 1500 }));
    const num = fixture.nativeElement.querySelector('.day-row__cal-num').textContent.trim();
    expect(num).toBe('1,500');
  });

  it('emits tap with iso date on click', () => {
    setDay(makeDay({ date: '2026-05-04' }));
    let received: string | undefined;
    fixture.componentInstance.tap.subscribe((d) => (received = d));
    (fixture.nativeElement.querySelector('.day-row') as HTMLButtonElement).click();
    expect(received).toBe('2026-05-04');
  });

  it('applies today modifier border', () => {
    setDay(makeDay({ isToday: true }));
    expect(fixture.nativeElement.querySelector('.day-row--today')).toBeTruthy();
  });

  it('applies status modifier (past-over) when logged ≥110% target', () => {
    setDay(makeDay({ isPast: true, loggedCal: 2700, targetCal: 2000, hasPlan: true, dotCount: 5 }));
    expect(fixture.nativeElement.querySelector('.day-row--past-over')).toBeTruthy();
  });
});
