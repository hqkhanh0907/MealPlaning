import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import {
  AccountRequestError,
  AccountSession,
  type AccountIdentity,
} from '../../../core/account/account-session';
import type { DeviceSessionSummary } from '../../../core/account/native-account';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

interface Panel {
  owner: AccountIdentity;
  devices: DeviceSessionSummary[];
  busy: boolean;
  error?: string;
  requiresLogin?: boolean;
}

@Component({
  selector: 'app-device-sessions-panel',
  templateUrl: './device-sessions-panel.html',
  styleUrl: './device-sessions-panel.scss',
  imports: [IonButton, RouterLink, ConfirmDialog],
})
export class DeviceSessionsPanel {
  private readonly account = inject(AccountSession);
  private readonly devices = signal<Panel | null>(null);
  private readonly target = signal<{ owner: AccountIdentity; id: string } | null>(null);
  protected readonly panel = computed(() => {
    const panel = this.devices();
    return panel?.owner === this.account.current() ? panel : null;
  });
  protected readonly selected = computed(() => {
    const target = this.target();
    const panel = this.panel();
    return panel?.owner === target?.owner
      ? (panel?.devices.find((device) => device.id === target?.id) ?? null)
      : null;
  });

  protected async load(): Promise<void> {
    const owner = this.account.current();
    if (!owner || this.panel()?.busy) return;
    this.target.set(null);
    const pending = { owner, devices: this.panel()?.devices ?? [], busy: true };
    this.devices.set(pending);
    try {
      const rows = await this.account.listDeviceSessions();
      if (this.panel() === pending) this.devices.set({ owner, devices: rows ?? [], busy: false });
    } catch (error) {
      this.showError(pending, error, 'Chưa thể tải thiết bị. Hãy thử lại.');
    }
  }

  protected choose(device: DeviceSessionSummary): void {
    const panel = this.panel();
    if (panel && !panel.busy && !device.current)
      this.target.set({ owner: panel.owner, id: device.id });
  }

  protected cancel(): void {
    this.target.set(null);
  }

  protected async revoke(): Promise<void> {
    const panel = this.panel();
    const device = this.selected();
    if (!panel || !device || device.current || panel.busy) return;
    this.target.set(null);
    const pending = { ...panel, busy: true, error: undefined };
    this.devices.set(pending);
    try {
      const removed = await this.account.revokeDeviceSession(device.id);
      if (this.panel() === pending) {
        const devices = removed
          ? panel.devices.filter((row) => row.id !== device.id)
          : panel.devices;
        this.devices.set({ owner: panel.owner, devices, busy: false });
      }
    } catch (error) {
      this.showError(pending, error, 'Chưa thu hồi được phiên. Hãy thử lại.');
    }
  }

  private showError(pending: Panel, error: unknown, fallback: string): void {
    if (this.panel() !== pending) return;
    const code = error instanceof AccountRequestError ? error.code : '';
    const requiresLogin = ['session_expired', 'session_revoked', 'account_forbidden'].includes(
      code,
    );
    const message = requiresLogin
      ? 'Đăng nhập lại để quản lý thiết bị.'
      : code === 'offline'
        ? 'Kết nối mạng để quản lý thiết bị.'
        : fallback;
    this.devices.set({ ...pending, busy: false, error: message, requiresLogin });
  }

  protected deviceName(device: DeviceSessionSummary): string {
    return device.label || 'Thiết bị chưa có tên';
  }

  protected signedInAt(device: DeviceSessionSummary): string {
    return new Date(device.createdAt).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
}
