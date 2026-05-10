import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DishContextMenuAction = 'copy' | 'move' | 'delete';

@Component({
  selector: 'app-dish-context-menu-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dish-context-menu-modal.html',
  styleUrl: './dish-context-menu-modal.scss',
})
export class DishContextMenuModal {
  readonly isOpen = input<boolean>(false);
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
