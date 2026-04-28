import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, restaurantOutline } from 'ionicons/icons';
import {
  DishRepository,
  type DishListItem,
} from '../../../core/repositories/dish.repository';

/**
 * Bottom sheet that lists every dish currently using a given ingredient. Opens
 * from the ingredient-edit page so the user can preview impact before changing
 * or deleting the ingredient. Tap a dish row → emits `dishSelected` (caller
 * navigates to the dish-edit route).
 *
 * Per design-system §8m: max-height 60vh, sage themed, sorted by dish name asc.
 */
@Component({
  selector: 'app-dishes-using-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon],
  templateUrl: './dishes-using-sheet.html',
  styleUrl: './dishes-using-sheet.scss',
})
export class DishesUsingSheet {
  private readonly dishRepo = inject(DishRepository);

  /**
   * Whether the sheet is open. Caller controls this via two-way pattern:
   * pass `isOpen=true` to open, listen for `closed` to know when user dismisses.
   */
  @Input() set isOpen(value: boolean) {
    const wasOpen = this._isOpen();
    this._isOpen.set(value);
    if (value && !wasOpen) {
      void this.loadDishes();
    }
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  private readonly _isOpen = signal(false);

  /** Required: ingredient id whose using-dishes will be listed. */
  @Input({ required: true }) ingredientId!: string;

  /** Emitted when the user taps a dish row. Payload = dish id. */
  @Output() readonly dishSelected = new EventEmitter<string>();
  /** Emitted when the user dismisses the sheet (backdrop / handle / close). */
  @Output() readonly closed = new EventEmitter<void>();

  protected readonly dishes = signal<DishListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly count = computed(() => this.dishes().length);

  constructor() {
    addIcons({ closeOutline, restaurantOutline });
  }

  private async loadDishes(): Promise<void> {
    if (!this.ingredientId) {
      this.dishes.set([]);
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const list = await this.dishRepo.findDishesUsingIngredient(this.ingredientId);
      this.dishes.set(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách món.';
      this.errorMessage.set(message);
      this.dishes.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected onSelect(dish: DishListItem): void {
    this.dishSelected.emit(dish.id);
    this.close();
  }

  protected close(): void {
    this._isOpen.set(false);
    this.closed.emit();
  }

  protected onIonDismiss(): void {
    if (this._isOpen()) {
      this.close();
    }
  }
}
