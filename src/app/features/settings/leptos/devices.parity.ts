import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AccountSession, AccountRequestError } from '../../../core/account/account-session';
import { DeviceSessionsPanel } from '../device-sessions/device-sessions-panel';
import { SettingsDevices } from './settings-devices';
import { loadRenderer } from './settings-renderer';

describe('Device session selection and revocation in both renderers', () => {
  it('confirms only the selected remote session and ignores responses for a departed owner', async () => {
    await loadRenderer();
    const an = { id: 'an', name: 'An', username: 'an' },
      binh = { id: 'binh', name: 'Bình', username: 'binh' },
      account = signal(an);
    const rows = [
      { id: 'current12345', label: '', current: true, createdAt: '2026-11-22T07:30:00Z' },
      {
        id: 'remote123456',
        label: 'Điện thoại',
        current: false,
        createdAt: '2026-11-20T13:05:00Z',
      },
    ];
    const get = jasmine.createSpy('listDeviceSessions').and.resolveTo(rows),
      revoke = jasmine.createSpy('revoke').and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [DeviceSessionsPanel, SettingsDevices],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        {
          provide: AccountSession,
          useValue: { current: account, listDeviceSessions: get, revokeDeviceSession: revoke },
        },
      ],
    }).compileComponents();
    const a = TestBed.createComponent(DeviceSessionsPanel),
      b = TestBed.createComponent(SettingsDevices),
      roots: HTMLElement[] = [a.nativeElement, b.nativeElement];
    const same = async () => {
      a.detectChanges();
      b.detectChanges();
      await new Promise<void>((r) => setTimeout(r, 10));
      a.detectChanges();
      b.detectChanges();
      const snapshot = (el: HTMLElement) =>
        Array.from(
          el.querySelectorAll('h2,h3,.device-note,.device-current,ion-button,button'),
          (n) => [
            n.textContent?.trim(),
            n.getAttribute('aria-label') ??
              n.shadowRoot?.querySelector('button,a')?.getAttribute('aria-label') ??
              null,
          ],
        );
      expect(snapshot(roots[1])).toEqual(snapshot(roots[0]));
    };
    const click = async (q: string, title: string) => {
      for (const root of roots) {
        Array.from(root.querySelectorAll<HTMLElement>(q))
          .find((el) => el.textContent?.trim() === title)!
          .click();
      }
      await same();
    };
    await same();
    await click('ion-button', 'Xem thiết bị đăng nhập');
    expect(roots[1].querySelectorAll('.device-row').length).toBe(2);
    await click('ion-button', 'Thu hồi');
    expect(revoke).not.toHaveBeenCalled();
    await click('button', 'Hủy');
    expect(revoke).not.toHaveBeenCalled();
    await click('ion-button', 'Thu hồi');
    await click('button', 'Thu hồi');
    expect(revoke.calls.allArgs()).toEqual([['remote123456'], ['remote123456']]);
    let finish!: (v: typeof rows) => void;
    const slow = new Promise<typeof rows>((resolve) => (finish = resolve));
    get.and.returnValue(slow);
    await click('ion-button', 'Tải lại');
    account.set(binh);
    finish(rows);
    await same();
    expect(roots[1].textContent).not.toContain('Điện thoại');
    get.and.rejectWith(new AccountRequestError(403, 'forbidden', 'account_forbidden'));
    await click('ion-button', 'Xem thiết bị đăng nhập');
    expect(roots[1].textContent).toContain('Đăng nhập lại để quản lý thiết bị.');
    a.destroy();
    b.destroy();
  });
});
