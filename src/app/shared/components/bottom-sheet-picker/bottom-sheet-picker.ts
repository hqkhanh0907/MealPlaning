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
  templateUrl: './bottom-sheet-picker.html',
  styleUrl: './bottom-sheet-picker.scss',
})
export class BottomSheetPicker {
  @Input({ required: true }) title = '';
  @Input() value: string | null = null;
  @Input() searchable = false;

  private readonly _options = signal<PickerOption[]>([]);
  @Input({ required: true }) set options(list: PickerOption[]) {
    this._options.set(list ?? []);
  }

  /**
   * Optional "Recently used" (MRU) section rendered above the main options.
   * Per design-system §8l: max 5 items, hidden when empty. Caller is responsible
   * for limiting + ordering. Hidden automatically when search query is non-empty.
   */
  private readonly _recentOptions = signal<PickerOption[]>([]);
  @Input() set recentOptions(list: PickerOption[] | null | undefined) {
    this._recentOptions.set(list ?? []);
  }
  /**
   * Section label for the recent group. Defaults to "Gần đây".
   */
  @Input() recentLabel = 'Gần đây';
  /**
   * Section label rendered above the main options when a recent section is
   * visible. Defaults to "Tất cả nguyên liệu".
   */
  @Input() allLabel = 'Tất cả nguyên liệu';

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
  /**
   * Recent options visible only when query is empty (search hides MRU to avoid
   * duplicate hits) AND recent list is non-empty.
   */
  readonly visibleRecentOptions = computed(() => {
    if (this.query().trim().length > 0) return [];
    return this._recentOptions();
  });
  readonly hasRecentSection = computed(() => this.visibleRecentOptions().length > 0);

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
