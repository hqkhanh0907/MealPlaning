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
});
