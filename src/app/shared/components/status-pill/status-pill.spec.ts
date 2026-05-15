import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusPill, type StatusPillStatus } from './status-pill';

describe('StatusPill', () => {
  let fixture: ComponentFixture<StatusPill>;
  let component: StatusPill;

  function setInputs(status: StatusPillStatus, completedAt: string | null = null): void {
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('completedAt', completedAt);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusPill] });
    fixture = TestBed.createComponent(StatusPill);
    component = fixture.componentInstance;
  });

  describe('planned variant', () => {
    it('uses bookmark-outline icon', () => {
      setInputs('planned');
      expect(component.icon()).toBe('bookmark-outline');
    });

    it('label is "Kế hoạch"', () => {
      setInputs('planned');
      expect(component.label()).toBe('Kế hoạch');
    });

    it('ignores completedAt for planned variant', () => {
      setInputs('planned', '2026-05-10T08:30:00Z');
      expect(component.label()).toBe('Kế hoạch');
    });
  });

  describe('logged variant', () => {
    it('uses lock-closed-outline icon', () => {
      setInputs('logged', '2026-05-10T08:30:00Z');
      expect(component.icon()).toBe('lock-closed-outline');
    });

    it('formats completedAt as "Đã ăn lúc HH:mm" in vi-VN locale', () => {
      // 2026-05-10T08:30:00Z → 15:30 in Asia/HCM (UTC+7).
      // Spec asserts shape, not timezone — extract HH:mm from output.
      setInputs('logged', '2026-05-10T08:30:00Z');
      expect(component.label()).toMatch(/^Đã ăn lúc \d{2}:\d{2}$/);
    });

    it('falls back to "Đã ăn" when completedAt is null', () => {
      setInputs('logged', null);
      expect(component.label()).toBe('Đã ăn');
    });

    it('falls back to "Đã ăn" when completedAt is invalid ISO', () => {
      setInputs('logged', 'not-a-date');
      expect(component.label()).toBe('Đã ăn');
    });
  });

  describe('rendered DOM', () => {
    it('applies status modifier class', () => {
      setInputs('logged', '2026-05-10T08:30:00Z');
      const el = (fixture.nativeElement as HTMLElement).querySelector('.status-pill');
      expect(el?.classList.contains('status-pill--logged')).toBeTrue();
    });

    it('renders icon as aria-hidden', () => {
      setInputs('planned');
      const icon = (fixture.nativeElement as HTMLElement).querySelector('.status-pill__icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
