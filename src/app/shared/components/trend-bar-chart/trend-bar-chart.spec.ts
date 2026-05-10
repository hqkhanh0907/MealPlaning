import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { TrendPoint } from '../../../core/services/nutrition/nutrition-query';
import { TrendBarChart } from './trend-bar-chart';

const week: TrendPoint[] = [
  { date: '2026-05-04', value: 1800 },
  { date: '2026-05-05', value: 2100 },
  { date: '2026-05-06', value: 1500 },
  { date: '2026-05-07', value: 0 },
  { date: '2026-05-08', value: 1950 },
  { date: '2026-05-09', value: 2300 },
  { date: '2026-05-10', value: 1700 },
];

describe('TrendBarChart', () => {
  let fixture: ComponentFixture<TrendBarChart>;
  let component: TrendBarChart;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendBarChart],
    }).compileComponents();
    fixture = TestBed.createComponent(TrendBarChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('bars', week);
    fixture.componentRef.setInput('metric', 'calories');
    fixture.componentRef.setInput('targetLine', 2000);
  });

  it('renders one rect per non-zero bar', () => {
    fixture.detectChanges();
    const rects = fixture.nativeElement.querySelectorAll(
      'rect.trend-bar-chart__bar:not(.trend-bar-chart__bar--compare)',
    );
    // Empty (value=0) bar still renders rect with height=0; check 7 bars layout
    expect(component.mainBars().length).toBe(7);
    expect(rects.length).toBe(7);
  });

  it('week-mode (n=7) axis labels are T2..CN', () => {
    fixture.detectChanges();
    const labels = component.mainBars().map((b) => b.axisLabel);
    expect(labels).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  });

  it('empty bar (value=0) renders ─ in axis', () => {
    fixture.detectChanges();
    const axis = fixture.nativeElement.querySelectorAll('.trend-bar-chart__axis-label');
    // index 3 is the value=0 bar
    expect(axis[3].textContent.trim()).toBe('─');
  });

  it('renders target line when targetLine input set', () => {
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.trend-bar-chart__target-line');
    expect(line).toBeTruthy();
    expect(component.targetY()).not.toBeNull();
  });

  it('omits target line when null', () => {
    fixture.componentRef.setInput('targetLine', null);
    fixture.detectChanges();
    expect(component.targetY()).toBeNull();
    const line = fixture.nativeElement.querySelector('.trend-bar-chart__target-line');
    expect(line).toBeFalsy();
  });

  it('compareWith overlay renders extra rects with --compare class', () => {
    fixture.componentRef.setInput(
      'compareWith',
      week.map((p) => ({ ...p, value: p.value - 200 })),
    );
    fixture.detectChanges();
    const cmp = fixture.nativeElement.querySelectorAll('.trend-bar-chart__bar--compare');
    // Bars with value>0 only — week index 3 had 0 originally, so it becomes -200 → < 0, but it's <=0 so not rendered
    // 6 of 7 had value>200 originally
    expect(cmp.length).toBe(6);
  });

  it('maxScale gives headroom above peak for axis room', () => {
    fixture.detectChanges();
    const peak = Math.max(...week.map((b) => b.value), 2000);
    expect(component.maxScale()).toBeCloseTo(peak * 1.1, 5);
  });

  it('month-mode (n=30) labels only at 1/5/10/15/20/25/30', () => {
    const month: TrendPoint[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      value: 1500,
    }));
    fixture.componentRef.setInput('bars', month);
    fixture.componentRef.setInput('targetLine', null);
    fixture.detectChanges();
    const labels = component.mainBars().map((b) => b.axisLabel);
    expect(labels[0]).toBe('1');
    expect(labels[4]).toBe('5');
    expect(labels[9]).toBe('10');
    expect(labels[1]).toBe(''); // no label
    expect(labels[29]).toBe('30');
  });

  it('aria-label states metric and bar count in Vietnamese', () => {
    fixture.detectChanges();
    expect(component.ariaLabel()).toBe('Biểu đồ xu hướng Calo 7 điểm dữ liệu');
  });

  it('viewBox uses height input', () => {
    fixture.componentRef.setInput('height', 240);
    fixture.detectChanges();
    expect(component.viewBox()).toBe('0 0 700 240');
  });
});
