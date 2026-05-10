import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ServingsStepper } from './servings-stepper';

describe('ServingsStepper', () => {
  let fixture: ComponentFixture<ServingsStepper>;
  let component: ServingsStepper;

  function setInputs(
    value: number,
    opts: Partial<{ min: number; max: number; step: number; disabled: boolean }> = {},
  ): void {
    fixture.componentRef.setInput('value', value);
    if (opts.min !== undefined) fixture.componentRef.setInput('min', opts.min);
    if (opts.max !== undefined) fixture.componentRef.setInput('max', opts.max);
    if (opts.step !== undefined) fixture.componentRef.setInput('step', opts.step);
    if (opts.disabled !== undefined) fixture.componentRef.setInput('disabled', opts.disabled);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServingsStepper] });
    fixture = TestBed.createComponent(ServingsStepper);
    component = fixture.componentInstance;
  });

  describe('clamp + step rounding', () => {
    it('decrements once by step', () => {
      setInputs(1);
      component.decrementOnce();
      expect(component.value()).toBeCloseTo(0.9, 5);
    });

    it('increments once by step', () => {
      setInputs(1);
      component.incrementOnce();
      expect(component.value()).toBeCloseTo(1.1, 5);
    });

    it('clamps to min when decrementing past it', () => {
      setInputs(0.2);
      component.decrementOnce(); // → 0.1
      component.decrementOnce(); // would be 0, clamp to 0.1
      expect(component.value()).toBe(0.1);
    });

    it('clamps to max when incrementing past it', () => {
      setInputs(20, { max: 20 });
      component.incrementOnce();
      expect(component.value()).toBe(20);
    });
  });

  describe('disabled state', () => {
    it('does NOT mutate value when disabled', () => {
      setInputs(5, { disabled: true });
      component.incrementOnce();
      component.decrementOnce();
      expect(component.value()).toBe(5);
    });

    it('canDecrement/canIncrement reflect disabled', () => {
      setInputs(5, { disabled: true });
      expect(component.canDecrement()).toBeFalse();
      expect(component.canIncrement()).toBeFalse();
    });

    it('canDecrement is false at min boundary', () => {
      setInputs(0.1);
      expect(component.canDecrement()).toBeFalse();
    });

    it('canIncrement is false at max boundary', () => {
      setInputs(20, { max: 20 });
      expect(component.canIncrement()).toBeFalse();
    });
  });

  describe('direct numeric input', () => {
    it('clamps + emits committed on blur', () => {
      setInputs(1);
      const spy = jasmine.createSpy('committed');
      component.committed.subscribe(spy);

      component.onDirectInput('100'); // > max=20

      expect(component.value()).toBe(20);
      expect(spy).toHaveBeenCalledWith(20);
    });

    it('falls back to min when input is non-numeric', () => {
      setInputs(5);
      component.onDirectInput('abc');
      expect(component.value()).toBe(0.1);
    });

    it('rounds to step grid (e.g. 1.234 → 1.2)', () => {
      setInputs(1);
      component.onDirectInput('1.234');
      expect(component.value()).toBeCloseTo(1.2, 5);
    });
  });

  describe('tap-and-hold accelerator', () => {
    it('fires immediate increment on startHold("inc")', () => {
      setInputs(1);
      component.startHold('inc');
      expect(component.value()).toBeCloseTo(1.1, 5);
      component.cancelHold();
    });

    it('repeats every 50ms after a 500ms hold delay', fakeAsync(() => {
      setInputs(1);
      component.startHold('inc'); // immediate +1
      tick(500); // delay elapses, no extra ticks yet
      tick(150); // 3 interval ticks (50/100/150)
      component.cancelHold();
      // 1 immediate + 3 interval = 4 increments total → 1 + 4*0.1 = 1.4
      expect(component.value()).toBeCloseTo(1.4, 5);
    }));

    it('cancelHold clears pending timers (no further increments)', fakeAsync(() => {
      setInputs(1);
      component.startHold('inc');
      component.cancelHold();
      tick(2000);
      expect(component.value()).toBeCloseTo(1.1, 5);
    }));

    it('ngOnDestroy cancels active hold', fakeAsync(() => {
      setInputs(1);
      component.startHold('inc');
      component.ngOnDestroy();
      tick(2000);
      expect(component.value()).toBeCloseTo(1.1, 5);
    }));
  });
});
