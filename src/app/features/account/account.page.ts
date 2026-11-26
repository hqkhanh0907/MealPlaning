import { Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { AccountRequestError, AccountSession } from '../../core/account/account-session';
import { accountNameError } from '../../core/account/account-name';

type CredentialField = 'name' | 'username' | 'password';

@Component({
  selector: 'app-account-page',
  templateUrl: './account.page.html',
  styleUrl: './account.page.scss',
  imports: [IonContent],
})
export default class AccountPage {
  private readonly session = inject(AccountSession);
  protected readonly register = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly fullName = signal('');
  protected readonly fieldErrors = signal<Partial<Record<CredentialField, string>>>({});

  protected toggleMode(): void {
    this.register.update((value) => !value);
    this.error.set('');
    this.fieldErrors.set({});
  }

  protected async submit(event: Event, username: string, password: string): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.error.set('');
    const name = this.register() ? this.fullName() : undefined;
    const errors: Partial<Record<CredentialField, string>> = {};
    const invalidName = name === undefined ? null : accountNameError(name);
    if (invalidName) errors.name = invalidName;
    if (!/^[a-z0-9_]{3,32}$/.test(username.trim().toLowerCase())) {
      errors.username = 'Nhập 3 đến 32 ký tự. Dùng chữ không dấu, số hoặc dấu gạch dưới.';
    }
    if (password.length < 8 || password.length > 72) {
      errors.password = 'Mật khẩu cần từ 8 đến 72 ký tự.';
    }
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    this.busy.set(true);
    try {
      await this.session.authenticate(username, password, name);
      window.location.replace('/');
    } catch (error) {
      if (error instanceof AccountRequestError && error.field === 'name') {
        this.fieldErrors.set({ name: 'Kiểm tra lại họ và tên.' });
      } else if (error instanceof AccountRequestError && error.field === 'username') {
        this.fieldErrors.set({ username: 'Tên đăng nhập này không dùng được. Hãy thử tên khác.' });
      } else {
        const invalid = error instanceof AccountRequestError && [400, 401].includes(error.status);
        this.error.set(
          invalid
            ? this.register()
              ? 'Không tạo được tài khoản. Hãy kiểm tra thông tin.'
              : 'Tên đăng nhập hoặc mật khẩu chưa đúng.'
            : 'Chưa kết nối được. Hãy thử lại sau.',
        );
      }
    } finally {
      this.busy.set(false);
    }
  }
}
