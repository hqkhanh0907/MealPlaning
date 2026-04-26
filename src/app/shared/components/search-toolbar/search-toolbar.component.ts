import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    <label class="search-toolbar" [attr.aria-label]="ariaLabel" role="search">
      <ion-icon class="search-icon" name="search-outline" aria-hidden="true" />
      <input
        class="search-input"
        type="text"
        [value]="query"
        [placeholder]="placeholder"
        (input)="handleInput($event)"
      />
      @if (query) {
        <button class="search-clear" type="button" aria-label="Xóa tìm kiếm" (click)="clear()">
          <span class="search-clear-dot">
            <ion-icon name="close-circle-outline" aria-hidden="true" />
          </span>
        </button>
      }
    </label>
  `,
  styles: `
    .search-toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      width: 100%;
      min-height: 48px;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .search-toolbar:focus-within {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.12);
    }

    .search-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--text-tertiary);
    }

    .search-input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.5;
      outline: none;
    }

    .search-input::placeholder {
      color: var(--text-disabled);
    }

    .search-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      min-width: 44px;
      height: 44px;
      margin: -10px -10px -10px 0;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
    }

    .search-clear-dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      background: var(--bg-muted);
      color: var(--text-tertiary);
    }

    .search-clear ion-icon {
      font-size: 14px;
    }
  `,
})
export class SearchToolbarComponent {
  @Input() query = '';
  @Input() placeholder = 'Tìm kiếm';
  @Input() ariaLabel = 'Thanh tìm kiếm';
  @Output() queryChange = new EventEmitter<string>();

  constructor() {
    addIcons({ searchOutline, closeCircleOutline });
  }

  onInput(value: string): void {
    this.queryChange.emit(value);
  }

  handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.onInput(value);
  }

  clear(): void {
    this.queryChange.emit('');
  }
}
