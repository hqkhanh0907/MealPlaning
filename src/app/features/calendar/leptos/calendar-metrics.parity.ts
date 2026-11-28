import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { WeekDayTotal } from '../../../core/models/meal-plan.types';
import { ZERO_TOTALS } from '../../../core/models/nutrition';
import { NutritionStore } from '../../../core/stores/nutrition.store';
import type { KeyMetric } from '../../../core/utils/key-metric-router';
import { DayRow } from '../components/day-row/day-row';
import { DaySummaryCard } from '../components/day-summary-card/day-summary-card';
import { loadCalendarRenderer, type CalendarAction } from './calendar-renderer';

const dates = [
  '2026-12-28',
  '2026-12-29',
  '2026-12-30',
  '2026-12-31',
  '2027-01-01',
  '2027-01-02',
  '2027-01-03',
];
const firstDate = dates[0];

function data() {
  return {
    date: firstDate,
    today: firstDate,
    locale: 'en-US',
    view: 'day',
    weekDays: dates,
    week: null as WeekDayTotal[] | null,
    plan: { date: firstDate, meal_slots: [] },
    online: true,
    aiIssue: null,
    aiPlanning: false,
    copyingYesterday: false,
    copyingWeek: false,
    undo: null,
    summary: {
      totals: { calories: 1250.5, protein: 15.5, carbs: 90.3, fat: 30.6, fiber: 0 },
      targets: { calories: 1100, protein: 6.5, carbs: 0, fat: 30, fiber: 25 },
      primaryMetric: 'calories' as KeyMetric,
      loading: false,
    },
  };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const clean = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() ?? '';
const textAt = (el: Element, selector: string) => clean(el.querySelector(selector)?.textContent);

function measureSummary(root: Element) {
  const svg = root.querySelector('.calorie-ring');
  const fill = svg?.querySelector('.calorie-ring__fill');
  return {
    busy: root.getAttribute('aria-busy'),
    date: root.getAttribute('data-date'),
    dateLabel: textAt(root, '.day-summary-card__eyebrow'),
    status: textAt(root, '.day-summary-card__sync'),
    hero: root.querySelector('.day-summary-card__hero')?.getAttribute('aria-label'),
    value: textAt(root, '.day-summary-card__metric-value'),
    note: textAt(root, '.day-summary-card__metric-note'),
    expanded: root.querySelector('button')?.getAttribute('aria-expanded'),
    button: textAt(root, '.day-summary-card__detail-toggle'),
    ring: svg && [
      svg.getAttribute('aria-label'),
      svg.getAttribute('viewBox'),
      svg.getAttribute('width'),
      [...svg.classList].sort(),
      Number(fill?.getAttribute('stroke-dashoffset')).toFixed(5),
    ],
    macros: Array.from(root.querySelectorAll('.macro-row__item'), (item) => [
      item.getAttribute('aria-label'),
      item.classList.contains('macro-row__item--highlighted'),
      textAt(item, '.macro-row__values'),
      item.querySelector<HTMLElement>('.macro-row__bar-fill')?.style.width,
      [...(item.querySelector('.macro-row__bar')?.classList ?? [])].sort(),
    ]),
    fiberNote: textAt(root, '.day-summary-card__fiber-note'),
  };
}

function measureDay(root: Element, iconName?: string) {
  const icon = root.querySelector<HTMLElement & { name?: string }>('.day-row__status');
  return {
    classes: [...root.classList].filter((name) => name.startsWith('day-row')).sort(),
    label: root.getAttribute('aria-label'),
    current: root.getAttribute('aria-current'),
    day: textAt(root, '.day-row__label-date'),
    pill: textAt(root, '.day-row__today-pill'),
    name: textAt(root, '.day-row__label-name'),
    value: textAt(root, '.day-row__cal-num'),
    valueAndTarget: textAt(root, '.day-row__cal > span:first-child'),
    cap: textAt(root, '.day-row__cal-cap'),
    kind: textAt(root, '.day-row__cal-type'),
    icon: icon?.name || icon?.getAttribute('name') || iconName || null,
    dots: root.querySelectorAll('.day-row__dot').length,
  };
}

describe('Calendar nutrition and week views match the Angular components', () => {
  it('updates a visible expanded summary as the date, metric, targets and loading change', async () => {
    const renderer = await loadCalendarRenderer();
    const snapshot = data();
    const store = {
      today: signal(snapshot.summary.totals),
      targets: signal(snapshot.summary.targets),
      keyMetric: signal<KeyMetric>('calories'),
      loading: signal(false),
    };
    TestBed.configureTestingModule({
      imports: [DaySummaryCard],
      providers: [{ provide: NutritionStore, useValue: store }],
    });
    const original = TestBed.createComponent(DaySummaryCard);
    original.componentRef.setInput('date', snapshot.date);
    original.detectChanges();
    const body = document.createElement('div');
    const handle = renderer.mountCalendar(
      document.createElement('div'),
      body,
      document.createElement('div'),
      JSON.stringify(snapshot),
      () => undefined,
    );
    const angular = (original.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.day-summary-card',
    )!;
    const rust = () => body.querySelector<HTMLElement>('.day-summary-card')!;
    try {
      await nextFrame();
      expect(measureSummary(rust())).toEqual(measureSummary(angular));
      angular.querySelector('button')!.click();
      rust().querySelector('button')!.click();
      original.detectChanges();
      for (const metric of ['protein', 'carbs', 'fat', 'calories'] as const) {
        snapshot.date = '2027-01-03';
        snapshot.summary.primaryMetric = metric;
        snapshot.summary.loading = metric === 'fat';
        if (metric === 'calories') snapshot.summary.targets = { ...ZERO_TOTALS };
        store.targets.set(snapshot.summary.targets);
        store.keyMetric.set(metric);
        store.loading.set(snapshot.summary.loading);
        original.componentRef.setInput('date', snapshot.date);
        original.detectChanges();
        handle.update(JSON.stringify(snapshot));
        await nextFrame();
        expect(measureSummary(rust())).withContext(metric).toEqual(measureSummary(angular));
        expect(rust().querySelectorAll('.macro-row__item').length).toBe(4);
      }
    } finally {
      handle.free();
    }
  });

  it('keeps week navigation, date selection and status rows consistent with the original', async () => {
    const renderer = await loadCalendarRenderer();
    const snapshot = data();
    snapshot.view = 'week';
    const body = document.createElement('div');
    const actions: CalendarAction[] = [];
    const handle = renderer.mountCalendar(
      document.createElement('div'),
      body,
      document.createElement('div'),
      JSON.stringify(snapshot),
      (a) => actions.push(a),
    );
    TestBed.configureTestingModule({ imports: [DayRow] });
    try {
      await nextFrame();
      expect(textAt(body, '[role="status"]')).toBe('Đang tải dữ liệu tuần…');
      snapshot.week = dates.map((date, index) => ({
        date,
        label: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index],
        loggedCal: [0, 2999.5, 120.5, 109.5, 79.5, 50, 1249.5][index],
        plannedCal: 2450.7,
        targetCal: index === 6 ? 0 : 100,
        dotCount: index * 2,
        isToday: index === 0,
        isPast: index > 1,
        hasPlan: index !== 0,
      }));
      handle.update(JSON.stringify(snapshot));
      await nextFrame();
      expect(textAt(body, '.week-view__range')).toBe('28 tháng 12 – 3 tháng 1');
      const rows = body.querySelectorAll<HTMLButtonElement>('.day-row');
      expect(rows.length).toBe(7);
      const original = TestBed.createComponent(DayRow);
      snapshot.week.forEach((day, i) => {
        original.componentRef.setInput('day', day);
        original.detectChanges();
        expect(measureDay(rows[i]))
          .withContext(day.date)
          .toEqual(
            measureDay(
              (original.nativeElement as HTMLElement).querySelector('.day-row')!,
              original.componentInstance.statusIcon(),
            ),
          );
      });
      body.querySelector<HTMLButtonElement>('[aria-label="Tuần trước"]')!.click();
      body.querySelector<HTMLButtonElement>('[aria-label="Tuần sau"]')!.click();
      body.querySelector<HTMLButtonElement>('.week-view__copy-btn')!.click();
      rows[2].click();
      expect(actions).toEqual([
        { type: 'weekNav', delta: -7 },
        { type: 'weekNav', delta: 7 },
        { type: 'copyWeek' },
        { type: 'weekDay', date: dates[2] },
      ]);
      snapshot.copyingWeek = true;
      snapshot.week = [];
      handle.update(JSON.stringify(snapshot));
      await nextFrame();
      expect(body.querySelector<HTMLButtonElement>('.week-view__copy-btn')?.disabled).toBeTrue();
      expect(body.querySelector('.week-view__list')).not.toBeNull();
      expect(body.querySelector('[role="status"]')).toBeNull();
    } finally {
      handle.free();
    }
  });
});
