import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fastFoodOutline, nutritionOutline, restaurantOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="empty-state" aria-live="polite">
      <div class="empty-icon-shell" aria-hidden="true">
        <ion-icon class="empty-icon" [name]="icon" />
      </div>
      <h2 class="empty-title">{{ title }}</h2>
      <p class="empty-description">{{ description }}</p>
      @if (actionLabel) {
        <button class="empty-action" type="button" (click)="action.emit()">{{ actionLabel }}</button>
      }
    </section>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 320px;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon-shell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background: var(--primary-50);
      color: var(--primary-700);
    }

    .empty-icon {
      font-size: 28px;
    }

    .empty-title {
      margin: 0;
      color: var(--text-secondary);
      font-size: 16px;
      font-weight: 500;
      line-height: 1.4;
    }

    .empty-description {
      margin: 0;
      max-width: 280px;
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.5;
    }

    .empty-action {
      min-height: 44px;
      padding: 12px 24px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--ion-color-secondary);
      color: var(--ion-color-secondary-contrast);
      font-size: 14px;
      font-weight: 500;
    }

    :host-context(body.dark),
    :host-context(.dark) {
      .empty-icon-shell {
        background: var(--quick-action-bg);
        color: var(--quick-action-text);
      }
    }
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'restaurant-outline';
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() actionLabel: string | null = null;
  @Output() action = new EventEmitter<void>();

  constructor() {
    addIcons({ restaurantOutline, nutritionOutline, fastFoodOutline, searchOutline });
  }
}
