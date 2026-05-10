import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MacroRow } from './macro-row';

describe('MacroRow', () => {
  let fixture: ComponentFixture<MacroRow>;
  let component: MacroRow;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroRow],
    }).compileComponents();

    fixture = TestBed.createComponent(MacroRow);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('protein', { value: 30, target: 100 });
    fixture.componentRef.setInput('carbs', { value: 80, target: 200 });
    fixture.componentRef.setInput('fat', { value: 20, target: 60 });
  });

  it('renders 3 macros in P→C→F order by default', () => {
    fixture.detectChanges();
    const items = component.macros();
    expect(items.length).toBe(3);
    expect(items.map((m) => m.key)).toEqual(['protein', 'carbs', 'fat']);
  });

  it('appends fiber as 4th when provided', () => {
    fixture.componentRef.setInput('fiber', { value: 10, target: 25 });
    fixture.detectChanges();
    expect(component.macros().map((m) => m.key)).toEqual(['protein', 'carbs', 'fat', 'fiber']);
  });

  it('compact mode renders mini ring per macro', () => {
    fixture.componentRef.setInput('mode', 'compact');
    fixture.detectChanges();
    const rings = fixture.nativeElement.querySelectorAll('app-calorie-ring');
    expect(rings.length).toBe(3);
  });

  it('expanded mode renders bar fill per macro', () => {
    fixture.componentRef.setInput('mode', 'expanded');
    fixture.detectChanges();
    const bars = fixture.nativeElement.querySelectorAll('.macro-row__bar-fill');
    expect(bars.length).toBe(3);
  });

  it('clamps pct to [0,200] range', () => {
    expect(component.pct({ value: -10, target: 100 })).toBe(0);
    expect(component.pct({ value: 50, target: 100 })).toBe(50);
    expect(component.pct({ value: 500, target: 100 })).toBe(200);
    expect(component.pct({ value: 10, target: 0 })).toBe(0);
  });

  it('visualPct caps at 100 even when over-target', () => {
    expect(component.visualPct({ value: 150, target: 100 })).toBe(100);
    expect(component.visualPct({ value: 50, target: 100 })).toBe(50);
  });

  it('highlightedMetric matches the macro key', () => {
    fixture.componentRef.setInput('highlightedMetric', 'protein');
    fixture.detectChanges();
    const macros = component.macros();
    expect(component.isHighlighted(macros[0])).toBe(true); // protein
    expect(component.isHighlighted(macros[1])).toBe(false); // carbs
  });

  it('isHighlighted returns false when highlightedMetric is null', () => {
    fixture.detectChanges();
    expect(component.isHighlighted(component.macros()[0])).toBe(false);
  });

  it('band classifies pct correctly per macro', () => {
    fixture.detectChanges();
    const macros = component.macros();
    // protein 30/100 = 30% → low
    expect(component.band(macros[0])).toBe('low');
    // carbs 80/200 = 40% → low
    expect(component.band(macros[1])).toBe('low');
  });

  it('aria-label uses Vietnamese label and rounded percentage', () => {
    fixture.detectChanges();
    const protein = component.macros()[0];
    expect(component.ariaLabel(protein)).toBe('Đạm 30 trên 100, 30 phần trăm');
  });

  it('highlight border applied to correct DOM node', () => {
    fixture.componentRef.setInput('highlightedMetric', 'fat');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.macro-row__item');
    expect(items[0].classList.contains('macro-row__item--highlighted')).toBe(false); // protein
    expect(items[2].classList.contains('macro-row__item--highlighted')).toBe(true); // fat
  });
});
