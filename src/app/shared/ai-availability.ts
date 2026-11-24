import { computed, inject, Injectable } from '@angular/core';
import { AiGeneration } from '../core/services/ai/ai-generation';
import { NetworkStore } from '../core/stores/network.store';

@Injectable({ providedIn: 'root' })
export class AiAvailability {
  private readonly generation = inject(AiGeneration);
  private readonly network = inject(NetworkStore);
  readonly textIssue = computed(() => this.issue('text'));
  readonly photoIssue = computed(() => this.issue('photo'));

  private issue(capability: 'text' | 'photo'): string | null {
    return this.network.online()
      ? this.generation.configurationIssue(capability)
      : 'Cần kết nối mạng để dùng AI';
  }
}
