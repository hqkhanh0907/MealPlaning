import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { AccountRequestError, AccountSession } from '../../../core/account/account-session';
import LegacyAccountPage from '../account.page';

import { accountRenderer } from './account-renderer';

@Component({
  selector: 'app-leptos-account',
  templateUrl: './account.page.html',
  styleUrl: './account.page.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [IonContent, LegacyAccountPage],
})
export default class LeptosAccountPage {
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly session = inject(AccountSession);
  private readonly destroy = inject(DestroyRef);
  protected readonly fallback = signal(false);

  constructor() {
    afterNextRender(() => {
      try {
        const module = accountRenderer();
        if (this.destroy.destroyed) return;
        const handle = module.mountAccount(this.body().nativeElement, (user, password, name) =>
          this.authenticate(user, password, name),
        );
        this.destroy.onDestroy(() => handle.free());
      } catch {
        if (!this.destroy.destroyed) this.fallback.set(true);
      }
    });
  }

  private async authenticate(user: string, password: string, name?: string): Promise<unknown> {
    try {
      await this.session.authenticate(user, password, name);
      window.location.replace('/');
      return null;
    } catch (error) {
      return error instanceof AccountRequestError
        ? { status: error.status, code: error.code, field: error.field }
        : { status: 0 };
    }
  }
}
