import { TestBed } from '@angular/core/testing';
import { UndoToastQueue } from './undo-toast-queue';

describe('UndoToastQueue', () => {
  let svc: UndoToastQueue;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(UndoToastQueue);
    jasmine.clock().install();
  });

  afterEach(() => {
    svc.clear();
    jasmine.clock().uninstall();
  });

  it('starts empty', () => {
    expect(svc.size()).toBe(0);
    expect(svc.activeToast()).toBeNull();
    expect(svc.queue().length).toBe(0);
  });

  it('enqueue adds toast and exposes head as activeToast (FIFO)', () => {
    svc.enqueue({ id: 'a', message: 'A', undo: () => undefined });
    svc.enqueue({ id: 'b', message: 'B', undo: () => undefined });
    expect(svc.size()).toBe(2);
    expect(svc.activeToast()?.id).toBe('a');
    expect(svc.queue().map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('toast auto-expires after default 8s timer', () => {
    svc.enqueue({ id: 'a', message: 'A', undo: () => undefined });
    expect(svc.size()).toBe(1);
    jasmine.clock().tick(7_999);
    expect(svc.size()).toBe(1);
    jasmine.clock().tick(2);
    expect(svc.size()).toBe(0);
  });

  it('custom durationMs honored', () => {
    svc.enqueue({ id: 'a', message: 'A', undo: () => undefined, durationMs: 1_000 });
    jasmine.clock().tick(999);
    expect(svc.size()).toBe(1);
    jasmine.clock().tick(2);
    expect(svc.size()).toBe(0);
  });

  it('undo() runs callback and removes toast, returns true', async () => {
    const spy = jasmine.createSpy('undo');
    svc.enqueue({ id: 'x', message: 'X', undo: spy });
    const ok = await svc.undo('x');
    expect(ok).toBeTrue();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(svc.size()).toBe(0);
  });

  it('undo() returns false for unknown id', async () => {
    const ok = await svc.undo('nope');
    expect(ok).toBeFalse();
  });

  it('expire() removes silently without invoking undo callback', () => {
    const spy = jasmine.createSpy('undo');
    svc.enqueue({ id: 'x', message: 'X', undo: spy });
    svc.expire('x');
    expect(svc.size()).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('clear() drops all toasts and cancels timers', () => {
    const spy = jasmine.createSpy('undo');
    svc.enqueue({ id: 'a', message: 'A', undo: spy });
    svc.enqueue({ id: 'b', message: 'B', undo: spy });
    svc.clear();
    expect(svc.size()).toBe(0);
    jasmine.clock().tick(20_000);
    expect(spy).not.toHaveBeenCalled();
  });

  it('FIFO: after head expires, next becomes active', () => {
    svc.enqueue({ id: 'a', message: 'A', undo: () => undefined, durationMs: 1_000 });
    svc.enqueue({ id: 'b', message: 'B', undo: () => undefined, durationMs: 5_000 });
    expect(svc.activeToast()?.id).toBe('a');
    jasmine.clock().tick(1_001);
    expect(svc.activeToast()?.id).toBe('b');
  });

  it('await undo() waits for async callback', async () => {
    let resolved = false;
    svc.enqueue({
      id: 'x',
      message: 'X',
      undo: async () => {
        await Promise.resolve();
        resolved = true;
      },
    });
    await svc.undo('x');
    expect(resolved).toBeTrue();
  });
});
