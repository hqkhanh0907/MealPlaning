import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DaySummaryCard } from './day-summary-card';

describe('DaySummaryCard', () => {
  let fixture: ComponentFixture<DaySummaryCard>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DaySummaryCard] });
    fixture = TestBed.createComponent(DaySummaryCard);
    fixture.componentRef.setInput('date', '2026-05-10');
    fixture.detectChanges();
  });

  it('mirrors date input as data-date attribute (Epic 4 hook)', () => {
    const el = (fixture.nativeElement as HTMLElement).querySelector('.day-summary-card');
    expect(el?.getAttribute('data-date')).toBe('2026-05-10');
  });

  it('renders Vietnamese placeholder copy', () => {
    const placeholder = (fixture.nativeElement as HTMLElement).querySelector(
      '.day-summary-card__placeholder',
    );
    expect(placeholder?.textContent).toContain('Tổng quan dinh dưỡng');
  });

  it('exposes aria-label for accessibility', () => {
    const el = (fixture.nativeElement as HTMLElement).querySelector('.day-summary-card');
    expect(el?.getAttribute('aria-label')).toBe('Tổng quan dinh dưỡng');
  });

  it('updates data-date when input changes', () => {
    fixture.componentRef.setInput('date', '2026-05-11');
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('.day-summary-card');
    expect(el?.getAttribute('data-date')).toBe('2026-05-11');
  });
});
