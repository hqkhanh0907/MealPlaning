import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalorieRing } from './calorie-ring';

describe('CalorieRing', () => {
  let fixture: ComponentFixture<CalorieRing>;
  let component: CalorieRing;

  function setInputs(
    value: number,
    target: number,
    opts: Partial<{
      size: 32 | 48 | 64;
      strokeWidth: number;
      showCenterLabel: boolean;
      variant: 'calories' | 'protein' | 'carbs' | 'fat';
    }> = {},
  ): void {
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('target', target);
    if (opts.size !== undefined) fixture.componentRef.setInput('size', opts.size);
    if (opts.strokeWidth !== undefined)
      fixture.componentRef.setInput('strokeWidth', opts.strokeWidth);
    if (opts.showCenterLabel !== undefined)
      fixture.componentRef.setInput('showCenterLabel', opts.showCenterLabel);
    if (opts.variant !== undefined) fixture.componentRef.setInput('variant', opts.variant);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CalorieRing] });
    fixture = TestBed.createComponent(CalorieRing);
    component = fixture.componentInstance;
  });

  describe('pct computed', () => {
    it('returns 0 when target is 0 (avoids divide-by-zero)', () => {
      setInputs(500, 0);
      expect(component.pct()).toBe(0);
    });

    it('returns 0 when target is negative', () => {
      setInputs(500, -100);
      expect(component.pct()).toBe(0);
    });

    it('clamps pct to 200 when value greatly exceeds target', () => {
      setInputs(5000, 1000); // 500% raw
      expect(component.pct()).toBe(200);
    });

    it('returns the raw percentage inside [0, 200]', () => {
      setInputs(750, 1000);
      expect(component.pct()).toBe(75);
    });
  });

  describe('colorClass derived from bandColor', () => {
    it('returns "low" when pct < 50', () => {
      setInputs(400, 1000);
      expect(component.colorClass()).toBe('low');
    });

    it('returns "good" when pct in 80–110 band', () => {
      setInputs(900, 1000);
      expect(component.colorClass()).toBe('good');
    });

    it('returns "high" when pct > 120', () => {
      setInputs(1500, 1000);
      expect(component.colorClass()).toBe('high');
    });
  });

  describe('SVG geometry', () => {
    it('derives radius from strokeWidth (default 8 → 46)', () => {
      setInputs(500, 1000);
      expect(component.radius()).toBe(46);
    });

    it('derives circumference from radius (2πr)', () => {
      setInputs(500, 1000);
      expect(component.circumference()).toBeCloseTo(2 * Math.PI * 46, 4);
    });

    it('caps visual dashOffset at pct=100 even when pct=200', () => {
      setInputs(5000, 1000); // pct=200 raw, visual capped to 100
      expect(component.dashOffset()).toBeCloseTo(0, 4);
    });
  });

  describe('Vietnamese aria-label', () => {
    it('formats label with variant and rounded pct', () => {
      setInputs(950, 1000);
      expect(component.ariaLabel()).toBe('Calo 950 trên 1000, 95 phần trăm');
    });

    it('uses Vietnamese name for protein variant', () => {
      setInputs(50, 100, { variant: 'protein' });
      expect(component.ariaLabel()).toBe('Đạm 50 trên 100, 50 phần trăm');
    });

    it('uses Vietnamese name for carbs variant', () => {
      setInputs(80, 100, { variant: 'carbs' });
      expect(component.ariaLabel()).toBe('Tinh bột 80 trên 100, 80 phần trăm');
    });

    it('uses Vietnamese name for fat variant', () => {
      setInputs(120, 100, { variant: 'fat' });
      expect(component.ariaLabel()).toBe('Chất béo 120 trên 100, 120 phần trăm');
    });
  });

  describe('center label rendering (showCenterLabel)', () => {
    it('renders <text> when showCenterLabel=true', () => {
      setInputs(750, 1000, { showCenterLabel: true });
      const text = (fixture.nativeElement as HTMLElement).querySelector('.calorie-ring__label');
      expect(text).toBeTruthy();
      expect(text?.textContent?.trim()).toBe('750');
    });

    it('omits <text> when showCenterLabel=false', () => {
      setInputs(750, 1000, { showCenterLabel: false });
      const text = (fixture.nativeElement as HTMLElement).querySelector('.calorie-ring__label');
      expect(text).toBeNull();
    });
  });
});
