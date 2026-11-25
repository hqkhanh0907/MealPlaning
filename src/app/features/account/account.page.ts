import { Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { AccountRequestError, AccountSession } from '../../core/account/account-session';

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

  protected toggleMode(): void {
    this.register.update((value) => !value);
    this.error.set('');
  }

  protected async submit(event: Event, username: string, password: string): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.error.set('');
    if (!/^[a-z0-9_]{3,32}$/.test(username.trim().toLowerCase())) {
      this.error.set('Tên đăng nhập cần từ 3 đến 32 ký tự, gồm chữ không dấu, số hoặc dấu gạch dưới.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      this.error.set('Mật khẩu cần từ 8 đến 72 ký tự.');
      return;
    }
    this.busy.set(true);
    try {
      await this.session.authenticate(username, password, this.register());
      window.location.replace('/');
    } catch (error) {
      const invalid = error instanceof AccountRequestError && error.status < 500 && error.status !== 429;
      this.error.set(invalid
        ? this.register() ? 'Không tạo được tài khoản. Hãy thử tên đăng nhập khác.' : 'Tên đăng nhập hoặc mật khẩu chưa đúng.'
        : 'Chưa kết nối được. Hãy thử lại sau.');
    } finally {
      this.busy.set(false);
    }
  }
}
