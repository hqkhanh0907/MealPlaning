import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { defineCustomElement as button } from '@ionic/core/components/ion-button';
import { defineCustomElement as item } from '@ionic/core/components/ion-item';
import { defineCustomElement as label } from '@ionic/core/components/ion-label';
import { defineCustomElement as list } from '@ionic/core/components/ion-list';
import { defineCustomElement as listHeader } from '@ionic/core/components/ion-list-header';
import { defineCustomElement as note } from '@ionic/core/components/ion-note';
import { defineCustomElement as toggle } from '@ionic/core/components/ion-toggle';
import { defineCustomElement as radio } from '@ionic/core/components/ion-radio';
import { defineCustomElement as radioGroup } from '@ionic/core/components/ion-radio-group';
import { defineCustomElement as icon } from 'ionicons/components/ion-icon';
import { loadRenderer, type SettingsAction, type Handle } from './settings-renderer';
export function registerControls(): void {
  for (const register of [
    button,
    item,
    label,
    list,
    listHeader,
    note,
    toggle,
    radio,
    radioGroup,
    icon,
  ])
    register();
}
@Directive({ selector: '[appSettingsSection]' })
export class SettingsSection {
  readonly appSettingsSection = input.required<'account' | 'preferences' | 'devices'>();
  readonly snapshot = input.required<string>();
  readonly action = output<SettingsAction>();
  private readonly handle = signal<Handle | null>(null);
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      destroy = inject(DestroyRef);
    afterNextRender(async () => {
      const renderer = await loadRenderer();
      if (destroy.destroyed) return;
      registerControls();
      this.handle.set(
        renderer.mountSettings(host, this.appSettingsSection(), this.snapshot(), (a) =>
          this.action.emit(a),
        ),
      );
      host.dataset['settingsRenderer'] = this.appSettingsSection();
    });
    effect(() => this.handle()?.update(this.snapshot()));
    destroy.onDestroy(() => this.handle()?.free());
  }
}
