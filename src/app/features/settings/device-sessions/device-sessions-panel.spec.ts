import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccountSession, type AccountIdentity } from '../../../core/account/account-session';
import { DeviceSessionsPanel } from './device-sessions-panel';

describe('DeviceSessionsPanel', () => {
  const an = { id: 'an', username: 'an', name: 'An' };
  const binh = { id: 'binh', username: 'binh', name: 'Bình' };
  const current = signal<AccountIdentity | null>(an);
  const listDeviceSessions = jasmine.createSpy('listDeviceSessions');
  const revokeDeviceSession = jasmine.createSpy('revokeDeviceSession');
  const date = '2026-11-26T10:00:00.000Z';
  const phone = {
    id: '18568245-7170-42a2-85e3-96e7592a06bb',
    label: 'Máy đã mất',
    current: false,
    createdAt: date,
    expiresAt: date,
  };
  const local = {
    ...phone,
    id: '275bbc81-fe71-4996-8e22-cc110cbddbd2',
    label: 'Máy hiện tại',
    current: true,
  };

  beforeEach(async () => {
    current.set(an);
    listDeviceSessions.calls.reset();
    listDeviceSessions.and.resolveTo([local, phone]);
    revokeDeviceSession.calls.reset();
    revokeDeviceSession.and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [DeviceSessionsPanel],
      providers: [
        { provide: AccountSession, useValue: { current, listDeviceSessions, revokeDeviceSession } },
      ],
    }).compileComponents();
  });

  it('only offers revocation for other devices and requires confirmation', async () => {
    const fixture = TestBed.createComponent(DeviceSessionsPanel);
    fixture.detectChanges();
    const view = fixture.nativeElement as HTMLElement;
    view.querySelector<HTMLElement>('ion-button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(view.textContent).toContain('Thiết bị này');
    const revoke = [...view.querySelectorAll<HTMLElement>('ion-button')].filter(
      (button) => button.textContent?.trim() === 'Thu hồi',
    );
    expect(revoke.length).toBe(1);
    revoke[0].click();
    fixture.detectChanges();
    expect(revokeDeviceSession).not.toHaveBeenCalled();
    view.querySelector<HTMLElement>('.dialog-btn-danger')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(revokeDeviceSession).toHaveBeenCalledOnceWith(phone.id);
    expect(view.textContent).not.toContain(phone.label);
  });

  it('hides another account’s rows when a late request finishes', async () => {
    let finish!: (devices: (typeof phone)[]) => void;
    listDeviceSessions.and.returnValue(new Promise((resolve) => (finish = resolve)));
    const fixture = TestBed.createComponent(DeviceSessionsPanel);
    const view = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    view.querySelector<HTMLElement>('ion-button')!.click();
    current.set(binh);
    finish([phone]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(view.textContent).not.toContain(phone.label);
    expect(view.textContent).toContain('Xem thiết bị đăng nhập');
  });
});
