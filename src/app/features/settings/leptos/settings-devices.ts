import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { DeviceSessionsPanel } from '../device-sessions/device-sessions-panel';
import { SettingsSection } from './settings-section';
import type { SettingsAction } from './settings-renderer';
@Component({
  selector: 'app-leptos-settings-devices',
  templateUrl: './settings-devices.html',
  styleUrl: './settings-devices.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [SettingsSection, ConfirmDialog],
})
export class SettingsDevices extends DeviceSessionsPanel {
  private readonly router = inject(Router);
  protected readonly data = computed(() => {
    const p = this.panel();
    return JSON.stringify({
      panel: p && {
        devices: p.devices,
        busy: p.busy,
        error: p.error,
        requiresLogin: p.requiresLogin,
      },
    });
  });
  protected run(a: SettingsAction): void {
    if (a.type === 'load') void this.load();
    if (a.type === 'login') void this.router.navigateByUrl('/account');
    if (a.type === 'choose') {
      const device = this.panel()?.devices.find((d) => d.id === a.id);
      if (device) this.choose(device);
    }
  }
}
