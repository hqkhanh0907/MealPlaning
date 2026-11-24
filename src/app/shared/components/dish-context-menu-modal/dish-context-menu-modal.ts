import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copyOutline, createOutline, swapHorizontalOutline, trashOutline } from 'ionicons/icons';

export type DishContextMenuAction = 'servings' | 'copy' | 'move' | 'delete';

@Component({
  selector: 'app-dish-context-menu-modal',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dish-context-menu-modal.html',
  styleUrl: './dish-context-menu-modal.scss',
})
export class DishContextMenuModal {
  constructor() {
    addIcons({ copyOutline, createOutline, swapHorizontalOutline, trashOutline });
  }

  readonly isOpen = input<boolean>(false);
  readonly canEditServings = input(false);
  readonly dishName = input.required<string>();
  readonly actionSelected = output<DishContextMenuAction>();
  readonly dismissed = output<void>();

  select(action: DishContextMenuAction): void {
    this.actionSelected.emit(action);
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
