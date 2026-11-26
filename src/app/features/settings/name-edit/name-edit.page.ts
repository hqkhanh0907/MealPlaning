import { Component, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { accountNameError } from '../../../core/account/account-name';
import { AccountRequestError, AccountSession } from '../../../core/account/account-session';

@Component({
  selector: 'app-name-edit',
  templateUrl: './name-edit.page.html',
  styleUrl: './name-edit.page.scss',
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export default class NameEditPage {
  private readonly session = inject(AccountSession);
  private readonly router = inject(Router);
  protected readonly name = signal(this.session.current()?.name ?? '');
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.saving()) return;
    const error = accountNameError(this.name());
    this.error.set(error ?? '');
    if (error) return;
    this.saving.set(true);
    try {
      await this.session.updateName(this.name());
      await this.router.navigateByUrl('/settings');
    } catch (failure) {
      this.error.set(
        failure instanceof AccountRequestError && [401, 403].includes(failure.status)
          ? 'Xác thực lại tài khoản để đổi họ và tên.'
          : 'Chưa lưu được họ và tên. Hãy kiểm tra kết nối rồi thử lại.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
