import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  fastFoodOutline,
  nutritionOutline,
  restaurantOutline,
  searchOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
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
