import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DaySummaryCard } from './day-summary-card';
import { NutritionStore } from '../../../../core/stores/nutrition.store';
import type { NutritionTotals } from '../../../../core/services/nutrition/nutrition-query';
import type { KeyMetric } from '../../../../core/utils/key-metric-router';

describe('DaySummaryCard', () => {
  let fixture: ComponentFixture<DaySummaryCard>;
  let today: ReturnType<typeof signal<NutritionTotals>>;
  let targets: ReturnType<typeof signal<NutritionTotals>>;
  let loading: ReturnType<typeof signal<boolean>>;
  let keyMetric: ReturnType<typeof signal<KeyMetric>>;

  beforeEach(() => {
    today = signal<NutritionTotals>({
      calories: 1600,
      protein: 120,
      carbs: 180,
      fat: 50,
      fiber: 18,
    });
    targets = signal<NutritionTotals>({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 70,
      fiber: 25,
    });
    loading = signal(false);
    keyMetric = signal<KeyMetric>('protein');

    TestBed.configureTestingModule({
      imports: [DaySummaryCard],
      providers: [
        {
          provide: NutritionStore,
          useValue: {
            today,
            targets,
            loading,
            keyMetric,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DaySummaryCard);
    fixture.componentRef.setInput('date', '2026-05-10');
    fixture.detectChanges();
  });

  it('mirrors date input as data-date attribute (Epic 4 hook)', () => {
    const el = (fixture.nativeElement as HTMLElement).querySelector('.day-summary-card');
    expect(el?.getAttribute('data-date')).toBe('2026-05-10');
  });

  it('renders real nutrition summary copy', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.day-summary-card__title')?.textContent).toContain(
      'Tổng quan dinh dưỡng',
    );
    expect(el.querySelector('.day-summary-card__metric-value')?.textContent).toContain(
      '120 / 150 g',
    );
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

  it('toggles macro detail including fiber', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.day-summary-card__details')).toBeNull();

    (el.querySelector('.day-summary-card__detail-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.day-summary-card__details')?.textContent).toContain('Fiber');
    expect(el.querySelector('.day-summary-card__fiber-note')?.textContent).toContain('25g/ngày');
  });
});
