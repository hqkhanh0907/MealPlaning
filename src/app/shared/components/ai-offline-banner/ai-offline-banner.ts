/**
 * AiOfflineBanner — small inline banner shown above any AI feature CTA
 * (e.g. "Hỏi AI" button) when device is offline.
 *
 * Source-of-truth: `docs/5-development/phase-1.5b-ai-foundation.md` §3.6.
 *
 * Usage:
 *   <app-ai-offline-banner />
 *
 * Renders nothing when online → caller does NOT need to wrap in @if.
 * Reads `NetworkStore.online()` directly so the banner reacts to status
 * changes without further wiring.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';

import { NetworkStore } from '../../../core/stores/network.store';

@Component({
  selector: 'app-ai-offline-banner',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-offline-banner.html',
  styleUrl: './ai-offline-banner.scss',
})
export class AiOfflineBanner {
  private readonly network = inject(NetworkStore);
  readonly hidden = computed(() => this.network.online());

  constructor() {
    addIcons({ cloudOfflineOutline });
  }
}
