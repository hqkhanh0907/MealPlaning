import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { AccountSession, AccountRequestError } from './account-session';
import { ACCOUNT_AUTH_PORT, type AccountAuthPort, type AccountReply } from './account-auth-port';

const saved = (id: string, username: string, generation: string): AccountReply => ({
  generation,
  identity: { id, username, name: username === 'an' ? 'An' : 'Bình' },
});
const an = saved('aaaaaaaaaaaaaaa', 'an', 'one'),
  binh = saved('bbbbbbbbbbbbbbb', 'binh', 'two');
function deferred<T>() {
  let done!: (value: T) => void;
  const promise = new Promise<T>((r) => (done = r));
  return { promise, done };
}
describe('AccountSession native authentication', () => {
  let api: jasmine.SpyObj<AccountAuthPort>, service: AccountSession;
  beforeEach(() => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    api = jasmine.createSpyObj('MealPlanAccount', [
      'capability',
      'identity',
      'authenticate',
      'rename',
      'clear',
    ]);
    api.capability.and.resolveTo({ supported: true });
    api.identity.and.resolveTo(an);
    api.authenticate.and.resolveTo(an);
    TestBed.configureTestingModule({ providers: [{ provide: ACCOUNT_AUTH_PORT, useValue: api }] });
    service = TestBed.inject(AccountSession);
    localStorage.removeItem('mealplan.account.v2');
    localStorage.removeItem('mealplan.session.v1');
  });
  afterEach(() => {
    localStorage.removeItem('mealplan.account.v2');
    localStorage.removeItem('mealplan.session.v1');
  });
  it('forwards untouched credentials, publishes only identity, and restores without token transport', async () => {
    const fetch = spyOn(globalThis, 'fetch').and.rejectWith(Error('unexpected web call'));
    localStorage.setItem(
      'mealplan.session.v1',
      JSON.stringify({ id: 'aaaaaaaaaaaaaaa', token: 'fixture-old-value', username: 'an' }),
    );
    await service.restore();
    expect(service.current()?.name).toBe('An');
    expect(localStorage.getItem('mealplan.session.v1')).toBeNull();
    await service.authenticate(' AN ', '😀'.repeat(4), '  An  ');
    expect(api.authenticate).toHaveBeenCalledOnceWith({
      username: ' AN ',
      password: '😀'.repeat(4),
      name: '  An  ',
      databasePrefix: 'healthmate_dev',
    });
    expect(Object.keys(service.current()!).sort()).toEqual(['id', 'name', 'username']);
    expect(Object.keys(JSON.parse(localStorage.getItem('mealplan.account.v2')!)).sort()).toEqual([
      'id',
      'name',
      'username',
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('never replays the registration once native work has started', async () => {
    api.identity.and.resolveTo({ identity: null });
    const fetch = spyOn(globalThis, 'fetch').and.rejectWith(Error('retry'));
    const unavailable = { code: 'UNIMPLEMENTED' };
    api.authenticate.and.rejectWith(unavailable);
    await expectAsync(service.authenticate('an', 'fixture', 'An')).toBeRejectedWith(unavailable);
    api.authenticate.and.resolveTo({
      error: { status: 400, message: 'duplicate', field: 'username', code: '' },
    });
    await expectAsync(service.authenticate('an', 'fixture', 'An')).toBeRejectedWith(
      jasmine.objectContaining({ status: 400, field: 'username' }),
    );
    api.authenticate.and.resolveTo({
      error: { status: 403, message: 'denied', field: '', code: 'account_forbidden' },
    });
    await expectAsync(service.authenticate('an', 'fixture')).toBeRejectedWith(
      jasmine.objectContaining({ status: 403, code: 'account_forbidden' }),
    );
    expect(service.current()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('cannot publish an older native grant after another sign-in', async () => {
    const started = deferred<void>(),
      firstGrant = deferred<AccountReply>();
    api.authenticate.and.callFake(async (req) => {
      if (req.username === 'an') {
        started.done();
        return firstGrant.promise;
      }
      return binh;
    });
    api.identity.and.resolveTo(binh);
    const first = service.authenticate('an', 'fixture');
    await started.promise;
    await service.authenticate('binh', 'fixture');
    firstGrant.done(an);
    await expectAsync(first).toBeRejected();
    expect(service.current()?.username).toBe('binh');
  });
  it('recovers a committed first login when the newer attempt is denied', async () => {
    const beganConfirm = deferred<void>(),
      slowConfirm = deferred<AccountReply>();
    let reads = 0;
    api.identity.and.callFake(async () => {
      if (++reads === 1) {
        beganConfirm.done();
        return slowConfirm.promise;
      }
      return an;
    });
    api.authenticate.and.callFake(async (req) =>
      req.username === 'an'
        ? an
        : { error: { status: 401, message: 'denied', field: '', code: '' } },
    );
    const first = service.authenticate('an', 'fixture');
    await beganConfirm.promise;
    await expectAsync(service.authenticate('other', 'fixture')).toBeRejected();
    expect(service.current()?.username).toBe('an');
    slowConfirm.done(an);
    await expectAsync(first).toBeRejected();
    expect(JSON.parse(localStorage.getItem('mealplan.account.v2') ?? 'null')?.id).toBe(
      'aaaaaaaaaaaaaaa',
    );
    expect(api.authenticate).toHaveBeenCalledTimes(2);
  });
  it('keeps two overlapping name changes in order and publishes the final vault name', async () => {
    await service.restore();
    const began = deferred<void>(),
      release = deferred<void>();
    let actual = an;
    api.identity.and.callFake(async () => actual);
    api.rename.and.callFake(async (req) => {
      if (req.name === 'First') {
        began.done();
        await release.promise;
      }
      actual = {
        identity: { id: 'aaaaaaaaaaaaaaa', username: 'an', name: req.name },
        generation: 'one',
      };
      return actual;
    });
    const first = service.updateName('First');
    await began.promise;
    const second = service.updateName('Second');
    await new Promise<void>((r) => setTimeout(r, 0));
    expect(api.rename).toHaveBeenCalledTimes(1);
    release.done();
    await first;
    await second;
    expect(service.current()?.name).toBe('Second');
    expect(JSON.parse(localStorage.getItem('mealplan.account.v2')!).name).toBe('Second');
  });
  it('updates the display name through the native vault and keeps permission failure fields', async () => {
    const fetch = spyOn(globalThis, 'fetch').and.rejectWith(Error('unexpected'));
    await service.restore();
    const before = service.dataBinding();
    const edited: AccountReply = {
      generation: 'one',
      identity: { id: 'aaaaaaaaaaaaaaa', username: 'an', name: 'An Nguyễn' },
    };
    api.rename.and.resolveTo(edited);
    api.identity.and.resolveTo(edited);
    await service.updateName('  An Nguyễn ');
    expect(api.rename).toHaveBeenCalledOnceWith({
      ownerId: 'aaaaaaaaaaaaaaa',
      generation: 'one',
      name: '  An Nguyễn ',
    });
    expect(service.current()?.name).toBe('An Nguyễn');
    expect(service.dataBinding()).toBe(before);
    api.rename.and.resolveTo({
      error: { status: 401, message: 'expired', code: 'session_revoked', field: '' },
    });
    await expectAsync(service.updateName('An')).toBeRejectedWith(jasmine.any(AccountRequestError));
    expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps a queued logout fenced to its owner when another sign-in wins', async () => {
    await service.restore();
    const before = service.dataBinding(),
      started = deferred<void>(),
      release = deferred<void>();
    api.clear.and.callFake(async (opts) => {
      expect(opts).toEqual({ ownerId: 'aaaaaaaaaaaaaaa', generation: 'one' });
      started.done();
      await release.promise;
      throw Error('session changed');
    });
    const logout = service.clear();
    await started.promise;
    api.authenticate.and.resolveTo(binh);
    api.identity.and.resolveTo(binh);
    await service.authenticate('binh', 'fixture');
    release.done();
    await expectAsync(logout).toBeRejected();
    expect(service.current()?.username).toBe('binh');
    expect(service.dataBinding()).not.toEqual(before);
    const previous = service.dataBinding();
    const again = saved('bbbbbbbbbbbbbbb', 'binh', 'three');
    api.authenticate.and.resolveTo(again);
    api.identity.and.resolveTo(again);
    await service.authenticate('binh', 'fixture');
    expect(service.dataBinding()).not.toEqual(previous);
    api.clear.and.resolveTo();
    await service.clear();
    expect(service.current()).toBeNull();
    expect(service.dataBinding()).toBeNull();
  });
  it('allows legacy handling only when the capability explicitly reports no native support', async () => {
    api.capability.and.resolveTo({ supported: false });
    const fetch = spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ message: 'duplicate', data: { username: {} } }), {
        status: 400,
      }),
    );
    await expectAsync(service.authenticate(' AN ', 'fixture', 'An')).toBeRejectedWith(
      jasmine.objectContaining({ status: 400, field: 'username' }),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(api.authenticate).not.toHaveBeenCalled();
  });
});
