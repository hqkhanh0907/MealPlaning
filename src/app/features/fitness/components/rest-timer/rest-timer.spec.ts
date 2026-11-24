import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RestTimer } from './rest-timer';

describe('RestTimer', () => {
  let component: RestTimer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new RestTimer());
    TestBed.flushEffects();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts from the provided seconds and counts down', fakeAsync(() => {
    component.reset(2);
    component.start();

    expect(component.label()).toBe('0:02');
    tick(1000);
    expect(component.label()).toBe('0:01');
    tick(1000);
    expect(component.label()).toBe('0:00');
    expect(component.isRunning()).toBeFalse();
  }));

  it('reset restores the configured seconds', fakeAsync(() => {
    component.reset(5);
    component.start();
    tick(2000);

    component.reset(5);

    expect(component.label()).toBe('0:05');
    expect(component.isRunning()).toBeFalse();
  }));

  it('counts elapsed time when Android delays interval callbacks', fakeAsync(() => {
    const clock = spyOn(Date, 'now').and.returnValue(10000);
    component.reset(10);
    component.start();
    clock.and.returnValue(16000);
    tick(1000);
    expect(component.remaining()).toBe(4);
    clock.and.returnValue(21000);
    tick(1000);
    expect(component.remaining()).toBe(0);
    expect(component.isRunning()).toBeFalse();
    component.reset(0);
  }));
});

describe('RestTimer input', () => {
  it('starts once for the configured input and stays stopped after reset', fakeAsync(() => {
    TestBed.configureTestingModule({ imports: [RestTimer] });
    const fixture = TestBed.createComponent(RestTimer);
    const timer = fixture.componentInstance;
    const start = timer.start.bind(timer);
    const startSpy = spyOn(timer, 'start').and.callFake(() => {
      if (startSpy.calls.count() <= 2) start();
    });

    fixture.componentRef.setInput('seconds', 3);
    fixture.detectChanges();
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(timer.label()).toBe('0:03');

    tick(1000);
    fixture.detectChanges();
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(timer.label()).toBe('0:02');

    timer.reset();
    fixture.detectChanges();
    tick(1000);
    expect(timer.label()).toBe('0:03');
    expect(timer.isRunning()).toBeFalse();

    fixture.componentRef.setInput('restartKey', 'next-set');
    fixture.detectChanges();
    expect(timer.isRunning()).toBeTrue();
    tick(1000);
    expect(timer.label()).toBe('0:02');
    fixture.destroy();
  }));
});
