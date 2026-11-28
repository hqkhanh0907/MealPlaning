import { Location } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonContent,
  IonFooter,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkmarkCircle, chevronDownOutline } from 'ionicons/icons';
import { AccountRequestError, AccountSession } from '../../../../core/account/account-session';
import { LocalDay } from '../../../../core/stores/local-day';
import { ProfileStore } from '../../../../core/stores/profile.store';
import { loadRenderer, type Handle, type EditWrite } from '../settings-renderer';
import { registerControls } from '../settings-section';

const editors = {
  name: 'Họ và tên',
  body: 'Cơ thể',
  goals: 'Mục tiêu',
  activity: 'Vận động và trình độ tập',
} as const;
const failure = {
  body: 'Chưa lưu được thông tin cơ thể. Hãy thử lại.',
  goals: 'Chưa lưu được mục tiêu. Hãy thử lại.',
  activity: 'Chưa lưu được mức vận động và trình độ tập. Hãy thử lại.',
};
@Component({
  selector: 'app-leptos-settings-editor',
  templateUrl: './editor.page.html',
  styleUrl: './editor.page.scss',
  encapsulation: ViewEncapsulation.None,
  host: { '[attr.data-settings-editor]': 'kind' },
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonFooter],
})
export default class SettingsEditorPage {
  protected readonly kind = inject(ActivatedRoute).snapshot.routeConfig
    ?.path as keyof typeof editors;
  protected readonly title = editors[this.kind];
  protected readonly arrow = arrowBackOutline;
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly footer = viewChild.required<ElementRef<HTMLElement>>('footer');
  private readonly stores = inject(ProfileStore);
  private readonly day = inject(LocalDay);
  private readonly sessions = inject(AccountSession);
  private readonly owner = this.sessions.current()?.id;
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly handle = signal<Handle | null>(null);
  private readonly snapshot = computed(() =>
    JSON.stringify({
      profile: this.stores.profile(),
      today: this.day.iso(),
      name: this.sessions.current()?.name ?? '',
    }),
  );
  constructor() {
    afterNextRender(async () => {
      const renderer = await loadRenderer();
      if (this.destroy.destroyed) return;
      registerControls();
      addIcons({ checkmarkCircle, chevronDownOutline });
      this.handle.set(
        renderer.mountSettingsEditor(
          this.body().nativeElement,
          this.footer().nativeElement,
          this.kind,
          this.snapshot(),
          (p) => this.write(p),
        ),
      );
    });
    effect(() => this.handle()?.update(this.snapshot()));
    this.destroy.onDestroy(() => this.handle()?.free());
  }
  private async write(data: EditWrite): Promise<void> {
    const current = () => !this.destroy.destroyed && this.owner === this.sessions.current()?.id;
    if (this.kind === 'name' && 'name' in data) {
      try {
        if (!current()) throw new AccountRequestError(401, 'Session changed');
        await this.sessions.updateName(data.name);
        if (current()) await this.router.navigateByUrl('/settings');
      } catch (err) {
        throw Error(
          err instanceof AccountRequestError && [401, 403].includes(err.status)
            ? 'Xác thực lại tài khoản để đổi họ và tên.'
            : 'Chưa lưu được họ và tên. Hãy kiểm tra kết nối rồi thử lại.',
        );
      }
    } else if (this.kind !== 'name' && 'patch' in data) {
      try {
        if (!current()) throw Error('Session changed');
        if (Object.keys(data.patch).length) await this.stores.updateProfile(data.patch);
      } catch {
        throw Error(failure[this.kind]);
      }
      if (current()) this.location.back();
    }
  }
}
