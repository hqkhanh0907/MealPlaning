import { Injectable, computed, signal } from '@angular/core';
import { localIsoDate, parseLocalDate } from '../utils/local-date';

@Injectable({ providedIn: 'root' })
export class LocalDay {
  readonly iso = signal(localIsoDate());
  readonly date = computed(() => parseLocalDate(this.iso()));
}
