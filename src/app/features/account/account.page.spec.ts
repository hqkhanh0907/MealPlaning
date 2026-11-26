import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountSession } from '../../core/account/account-session';
import AccountPage from './account.page';

describe('AccountPage', () => {
  let fixture: ComponentFixture<AccountPage>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccountPage] }).compileComponents();
    fixture = TestBed.createComponent(AccountPage);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  async function submitSignIn(): Promise<string | undefined> {
    const authenticate = spyOn(TestBed.inject(AccountSession), 'authenticate').and.callThrough();
    root.querySelector<HTMLInputElement>('#username')!.value = 'qa_account';
    root.querySelector<HTMLInputElement>('#password')!.value = 'sample-only';
    root.querySelector('form')!.requestSubmit();
    await authenticate.calls.mostRecent().returnValue.catch(() => undefined);
    await fixture.whenStable();
    fixture.detectChanges();
    return root.querySelector('[role="alert"]')?.textContent?.trim();
  }

  it('reports missing sync permission after successful password verification', async () => {
    const fetchSession = spyOn(window, 'fetch').and.resolveTo(
      Response.json(
        { message: 'The account cannot use MealPlaning.', data: { code: 'account_forbidden' } },
        { status: 403 },
      ),
    );

    expect(await submitSignIn()).toContain('thiếu quyền đồng bộ');
    expect(fetchSession).toHaveBeenCalledOnceWith(
      jasmine.stringMatching(/\/api\/mealplan\/session$/),
      jasmine.objectContaining({ method: 'POST' }),
    );
  });

  it('reports incorrect credentials when password verification fails', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      Response.json({ message: 'Failed to authenticate.' }, { status: 400 }),
    );

    expect(await submitSignIn()).toContain('mật khẩu chưa đúng');
  });

  it('reports a connection problem when the request fails to reach the server', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('Failed to fetch'));

    expect(await submitSignIn()).toContain('Chưa kết nối được');
  });

  it('clears the name limit error as soon as the name is valid', () => {
    root.querySelector<HTMLButtonElement>('.account-switch button')!.click();
    fixture.detectChanges();
    const field = root.querySelector<HTMLInputElement>('#full-name')!;
    const updateName = (length: number): void => {
      field.value = 'Á'.repeat(length);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    };

    updateName(102);
    root.querySelector('form')!.requestSubmit();
    fixture.detectChanges();
    expect(root.querySelector('#name-error')?.textContent).toContain('tối đa 100 ký tự');

    updateName(101);
    expect(field.getAttribute('aria-invalid')).toBe('true');

    updateName(100);
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(root.querySelector('#name-error')).toBeNull();
  });
});
