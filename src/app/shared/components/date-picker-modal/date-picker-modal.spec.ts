import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerModal } from './date-picker-modal';

const DAY_MS = 86_400_000;

function isoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('DatePickerModal', () => {
  let fixture: ComponentFixture<DatePickerModal>;
  let component: DatePickerModal;
  let appRef: ApplicationRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerModal],
    }).compileComponents();
    fixture = TestBed.createComponent(DatePickerModal);
    component = fixture.componentInstance;
    appRef = TestBed.inject(ApplicationRef);
  });

  function flushEffects(): void {
    appRef.tick();
  }

  it('clamps initialDate to ±365 days bounds when opened (AC-6)', () => {
    const farFuture = isoLocal(new Date(Date.now() + 1000 * DAY_MS));
    fixture.componentRef.setInput('initialDate', farFuture);
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    expect(component.selection()).toBe(component.maxIso());
    expect(component.selection() <= component.maxIso()).toBeTrue();
  });

  it('uses initialDate as-is when within bounds', () => {
    const inRange = isoLocal(new Date(Date.now() + 5 * DAY_MS));
    fixture.componentRef.setInput('initialDate', inRange);
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    expect(component.selection()).toBe(inRange);
  });

  it('forces Vietnamese locale for the Ionic date grid', () => {
    expect(component.locale).toBe('vi-VN');
  });

  it('uses Monday as the first day of week for Vietnamese planning flows', () => {
    expect(component.firstDayOfWeek).toBe(1);
  });

  it('jumpToday() resets selection to today (AC-1 Today shortcut)', () => {
    fixture.componentRef.setInput('initialDate', isoLocal(new Date(Date.now() + 30 * DAY_MS)));
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    component.jumpToday();
    expect(component.selection()).toBe(isoLocal(new Date()));
  });

  it('confirm() emits selection date-only ISO', () => {
    const captured: string[] = [];
    component.dateSelected.subscribe((d) => captured.push(d));
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    component.confirm();
    expect(captured.length).toBe(1);
    expect(captured[0]).toBe(component.selection());
  });

  it('cancel() emits dismissed without committing date', () => {
    let dismissed = 0;
    let confirmed = 0;
    component.dismissed.subscribe(() => dismissed++);
    component.dateSelected.subscribe(() => confirmed++);
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    component.cancel();
    expect(dismissed).toBe(1);
    expect(confirmed).toBe(0);
  });

  it('onIonChange updates selection from custom event payload', () => {
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    const ev = new CustomEvent('ionChange', { detail: { value: '2026-07-04T08:00:00' } });
    component.onIonChange(ev);
    expect(component.selection()).toBe('2026-07-04');
  });

  it('min/max bounds reflect ±clampDays from today', () => {
    fixture.componentRef.setInput('clampDays', 7);
    fixture.componentRef.setInput('isOpen', true);
    flushEffects();
    expect(component.minIso()).toBe(isoLocal(new Date(Date.now() - 7 * DAY_MS)));
    expect(component.maxIso()).toBe(isoLocal(new Date(Date.now() + 7 * DAY_MS)));
  });
});
