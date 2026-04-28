import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';

export interface PickerOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * BottomSheetPicker — §8.6c.1
 * Single-select bottom sheet following Design System Rule §8.6c.
 * Use when N >= 6 options. For N = 2 use segment control, for N = 3-5 use radio cards.
 * Search input auto-enabled when N >= 16 or searchable=true.
 */
@Component({
  selector: 'app-bottom-sheet-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal, IonHeader, IonToolbar, IonContent, IonIcon, IonSearchbar],
  templateUrl: './bottom-sheet-picker.component.html',
  styleUrl: './bottom-sheet-picker.component.scss',
})
export class BottomSheetPickerComponent {
  @Input({ required: true }) title = '';
  @Input() value: string | null = null;
  @Input() searchable = false;

  private _options = signal<PickerOption[]>([]);
  @Input({ required: true }) set options(list: PickerOption[]) {
    this._options.set(list ?? []);
  }

  @Output() valueChange = new EventEmitter<string>();
  @Output() dismissed = new EventEmitter<void>();

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly titleId = `bsp-title-${Math.random().toString(36).slice(2, 9)}`;

  readonly showSearch = computed(() => this.searchable || this._options().length >= 16);
  readonly filteredOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this._options();
    return this._options().filter((o) => o.label.toLowerCase().includes(q));
  });

  constructor() {
    addIcons({ checkmarkOutline, closeOutline });
  }

  open(): void {
    this.query.set('');
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(option: PickerOption): void {
    this.valueChange.emit(option.value);
    this.close();
  }

  onSearch(event: Event): void {
    const value = (event as CustomEvent<{ value: string }>).detail.value ?? '';
    this.query.set(value);
  }

  onDismiss(): void {
    this.isOpen.set(false);
    this.dismissed.emit();
  }
}
