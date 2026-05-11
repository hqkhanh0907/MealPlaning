import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonModal, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import type { DishListItem } from '../../../../core/repositories/dish.repository';
import type { MenuSuggestion } from '../../../../core/services/ai/menu-suggestion-ai';
import { SearchToolbar } from '../../../../shared/components/search-toolbar/search-toolbar';

type LoggingTab = 'all' | 'recent' | 'favorites';

export interface LoggingDishSelection {
  dishId: string;
  dishName: string;
  servings: number;
}

interface LoggingTabOption {
  value: LoggingTab;
  label: string;
}

const TABS: readonly LoggingTabOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'recent', label: 'Gần đây' },
  { value: 'favorites', label: 'Đã lưu' },
];

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase('vi-VN');
}

function round(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

@Component({
  selector: 'app-logging-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal, IonHeader, IonToolbar, IonContent, IonIcon, SearchToolbar],
  templateUrl: './logging-modal.html',
  styleUrl: './logging-modal.scss',
})
export class LoggingModal {
  readonly isOpen = input(false);
  readonly mealLabel = input('bữa ăn');
  readonly allDishes = input<readonly DishListItem[]>([]);
  readonly recentDishes = input<readonly DishListItem[]>([]);
  readonly loading = input(false);
  readonly aiSuggestions = input<readonly MenuSuggestion[]>([]);
  readonly aiLoading = input(false);
  readonly aiDisabledReason = input<string | null>(null);

  readonly dishSelected = output<LoggingDishSelection>();
  readonly createDishRequested = output<void>();
  readonly aiSuggestionsRequested = output<void>();
  readonly dismissed = output<void>();

  readonly tabs = TABS;
  readonly activeTab = signal<LoggingTab>('all');
  readonly query = signal('');
  readonly servings = signal(1);

  readonly favoriteDishes = computed<readonly DishListItem[]>(() =>
    this.allDishes().filter((dish) => dish.is_favorite === 1),
  );

  readonly visibleDishes = computed<readonly DishListItem[]>(() => {
    const source = this.sourceDishes();
    const q = normalize(this.query());
    if (!q) {
      return source;
    }
    return source.filter((dish) => normalize(dish.name).includes(q));
  });

  readonly emptyMessage = computed<string>(() => {
    if (this.query().trim()) {
      return 'Không tìm thấy món phù hợp. Thử từ khóa khác hoặc tạo món mới.';
    }
    switch (this.activeTab()) {
      case 'recent':
        return 'Chưa có món đã ăn gần đây.';
      case 'favorites':
        return 'Chưa có món đã lưu.';
      case 'all':
        return 'Chưa có món ăn nào trong thư viện.';
    }
  });

  constructor() {
    addIcons({ closeOutline });
  }

  setTab(tab: LoggingTab): void {
    this.activeTab.set(tab);
  }

  onQueryChange(value: string): void {
    this.query.set(value);
  }

  increaseServings(): void {
    this.servings.update((value) => Math.min(20, value + 0.5));
  }

  decreaseServings(): void {
    this.servings.update((value) => Math.max(0.5, value - 0.5));
  }

  selectDish(dish: DishListItem): void {
    this.dishSelected.emit({
      dishId: dish.id,
      dishName: dish.name,
      servings: this.servings(),
    });
  }

  selectAiSuggestion(suggestion: MenuSuggestion): void {
    if (!this.allDishes().some((dish) => dish.id === suggestion.dishId)) {
      return;
    }
    this.dishSelected.emit({
      dishId: suggestion.dishId,
      dishName: suggestion.dishName,
      servings: suggestion.servings,
    });
  }

  requestCreateDish(): void {
    this.createDishRequested.emit();
  }

  requestAiSuggestions(): void {
    if (this.aiLoading() || this.aiDisabledReason()) {
      return;
    }
    this.aiSuggestionsRequested.emit();
  }

  onDismiss(): void {
    this.query.set('');
    this.activeTab.set('all');
    this.dismissed.emit();
  }

  describeDish(dish: DishListItem): string {
    return `${round(dish.total_calories)} kcal • Protein ${round(dish.total_protein)}g • Carbs ${round(dish.total_carbs)}g • Fat ${round(dish.total_fat)}g`;
  }

  private sourceDishes(): readonly DishListItem[] {
    switch (this.activeTab()) {
      case 'recent':
        return this.recentDishes();
      case 'favorites':
        return this.favoriteDishes();
      case 'all':
        return this.allDishes();
    }
  }
}
