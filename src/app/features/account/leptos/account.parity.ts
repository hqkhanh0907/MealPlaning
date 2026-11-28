import { type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AccountRequestError, AccountSession } from '../../../core/account/account-session';
import AccountPage from '../account.page';
import LeptosAccountPage from './account.page';
import { loadAccountPage } from './entry';

function visibleForm(root: HTMLElement) {
  return {
    text: Array.from(root.querySelectorAll('h1,p,button,label,.account-switch span'), (el) =>
      el.textContent?.trim(),
    ),
    fields: Array.from(root.querySelectorAll('input'), (el) => ({
      id: el.id,
      type: el.type,
      value: el.type === 'password' ? el.value.length : el.value,
      autocomplete: el.autocomplete,
      disabled: el.disabled,
      invalid: el.getAttribute('aria-invalid'),
      description: el.getAttribute('aria-describedby'),
    })),
  };
}

async function exercise(page: Type<AccountPage | LeptosAccountPage>) {
  const authenticate = jasmine.createSpy('authenticate');
  await TestBed.configureTestingModule({
    imports: [page],
    providers: [provideIonicAngular(), { provide: AccountSession, useValue: { authenticate } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(page);
  const root: HTMLElement = fixture.nativeElement;
  const observations: Record<string, ReturnType<typeof visibleForm>> = {};
  const observe = async (label: string): Promise<void> => {
    fixture.detectChanges();
    TestBed.tick();
    await fixture.whenStable();
    await new Promise<void>((done) => requestAnimationFrame(() => done()));
    expect(root.isConnected).withContext(label).toBeTrue();
    expect(root.querySelector('form')).withContext(label).not.toBeNull();
    if (page === LeptosAccountPage) expect(root.querySelector('app-account-page')).toBeNull();
    observations[label] = visibleForm(root);
  };
  const set = (selector: string, value: string): void => {
    const field = root.querySelector<HTMLInputElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const click = (selector: string): void => root.querySelector<HTMLElement>(selector)!.click();
  try {
    await observe('sign in');
    click('.secondary');
    await observe('register');
    set('#full-name', '😀'.repeat(101));
    click('[type=submit]');
    await observe('invalid fields');
    expect(authenticate).not.toHaveBeenCalled();
    expect(root.querySelectorAll('[role=alert]').length).toBe(3);
    set('#full-name', '  Bình  ');
    set('#username', '  TEST_42  ');
    set('#password', '😀'.repeat(4));
    await observe('corrected name');
    let reject!: (reason: unknown) => void;
    authenticate.and.callFake(
      () =>
        new Promise<void>((_, no) => {
          reject = no;
        }),
    );
    click('[type=submit]');
    root.querySelector('form')!.requestSubmit();
    await observe('pending request');
    expect(authenticate).toHaveBeenCalledOnceWith('  TEST_42  ', '😀'.repeat(4), '  Bình  ');
    reject(new AccountRequestError(400, 'invalid', 'invalid_username', 'username'));
    await observe('username taken');
    click('.secondary');
    await observe('back to sign in');
    for (const [label, error] of Object.entries({
      denied: new AccountRequestError(403, 'denied', 'account_forbidden'),
      invalid: new AccountRequestError(401, 'invalid'),
      offline: new TypeError('offline'),
    })) {
      authenticate.and.rejectWith(error);
      click('[type=submit]');
      await observe(label);
    }
    expect(authenticate).toHaveBeenCalledTimes(4);
    return observations;
  } finally {
    fixture.destroy();
    TestBed.resetTestingModule();
  }
}

describe('Account page in Angular and Leptos', () => {
  it('matches the original form, credentials and failure handling through the real route factory', async () => {
    const baseline = await exercise(AccountPage);
    const page = await loadAccountPage();
    expect(page).toBe(LeptosAccountPage);
    expect(await exercise(page)).toEqual(baseline);
  });
});
