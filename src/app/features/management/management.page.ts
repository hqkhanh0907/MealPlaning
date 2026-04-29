import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  closeOutline,
  ellipsisVertical,
  nutritionOutline,
  restaurantOutline,
  searchOutline,
  settingsOutline,
  sparklesOutline,
  trashOutline,
} from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../core/models/management.constants';
import type { DishListItem } from '../../core/repositories/dish.repository';
import type { IngredientListItem } from '../../core/repositories/ingredient.repository';
import { DishStore } from '../../core/stores/dish.store';
import { IngredientStore } from '../../core/stores/ingredient.store';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SearchToolbar } from '../../shared/components/search-toolbar/search-toolbar';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '../../shared/components/segmented-control/segmented-control';

type ManagementTab = 'ingredients' | 'dishes';
type DishCreateMode = 'ingredient' | 'ai';
type IngredientFilter = 'Tất cả' | (typeof INGREDIENT_CATEGORIES)[number];

@Component({
  selector: 'app-management',
  templateUrl: './management.page.html',
  styleUrl: './management.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    SegmentedControl,
    NgClass,
    EmptyState,
    SearchToolbar,
    ConfirmDialog,
  ],
})
export default class ManagementPage {
  private readonly router = inject(Router);
  readonly ingredientStore = inject(IngredientStore);
  readonly dishStore = inject(DishStore);

  readonly managementTabs: SegmentedControlOption<ManagementTab>[] = [
    { value: 'ingredients', label: 'Nguyên liệu', ariaLabel: 'Tab nguyên liệu' },
    { value: 'dishes', label: 'Món ăn', ariaLabel: 'Tab món ăn' },
  ];
  readonly ingredientFilters: IngredientFilter[] = ['Tất cả', ...INGREDIENT_CATEGORIES];
  readonly tab = signal<ManagementTab>('ingredients');
  readonly activeIngredientFilter = signal<IngredientFilter>('Tất cả');

  readonly ingredientOptionsItem = signal<IngredientListItem | null>(null);
  readonly dishOptionsItem = signal<DishListItem | null>(null);

  readonly pendingIngredientDeleteId = signal<string | null>(null);
  readonly pendingIngredientDeleteName = signal('');
  readonly ingredientDeleteReferenceCount = signal(0);

  readonly pendingDishDeleteId = signal<string | null>(null);
  readonly pendingDishDeleteName = signal('');
  readonly dishDeleteReferenceCount = signal(0);
  readonly fabMenuOpen = signal(false);

  readonly filteredIngredients = computed(() => {
    const activeFilter = this.activeIngredientFilter();
    const items = this.ingredientStore.ingredients();
    if (activeFilter === 'Tất cả') {
      return items;
    }

    return items.filter((item) => item.category === activeFilter);
  });

  readonly filteredDishes = computed(() => this.dishStore.dishes());

  readonly showIngredientResultHint = computed(() => {
    return (
      this.ingredientStore.searchQuery().trim().length > 0 ||
      this.activeIngredientFilter() !== 'Tất cả'
    );
  });

  readonly showIngredientSearch = computed(() => {
    return (
      this.ingredientStore.searchQuery().trim().length > 0 ||
      this.ingredientStore.loading() ||
      this.ingredientStore.ingredients().length > 0
    );
  });

  readonly showIngredientFilters = computed(() => {
    return (
      this.ingredientStore.searchQuery().trim().length === 0 &&
      (this.ingredientStore.loading() || this.ingredientStore.ingredients().length > 0)
    );
  });

  readonly showDishSearch = computed(() => {
    return (
      this.dishStore.searchQuery().trim().length > 0 ||
      this.dishStore.loading() ||
      this.dishStore.dishes().length > 0
    );
  });

  readonly ingredientResultHint = computed(() => {
    if (!this.showIngredientResultHint()) {
      return null;
    }

    const query = this.ingredientStore.searchQuery().trim();
    const count = this.filteredIngredients().length;
    if (count === 0) {
      return null;
    }

    if (query) {
      return `${count} kết quả cho “${query}”`;
    }

    if (this.activeIngredientFilter() !== 'Tất cả') {
      return `${count} nguyên liệu trong “${this.activeIngredientFilter()}”`;
    }

    return null;
  });

  readonly dishResultHint = computed(() => {
    const query = this.dishStore.searchQuery().trim();
    const count = this.filteredDishes().length;
    if (!query || count === 0) {
      return null;
    }

    return `${count} kết quả`;
  });

  readonly hideFab = computed(() => {
    if (this.pendingIngredientDeleteId() !== null || this.pendingDishDeleteId() !== null) {
      return true;
    }

    if (
      this.ingredientOptionsItem() !== null ||
      this.dishOptionsItem() !== null ||
      this.fabMenuOpen()
    ) {
      return true;
    }

    if (this.tab() === 'ingredients') {
      return (
        !this.ingredientStore.loading() &&
        this.filteredIngredients().length === 0 &&
        this.ingredientStore.searchQuery().trim().length === 0
      );
    }

    return (
      !this.dishStore.loading() &&
      this.filteredDishes().length === 0 &&
      this.dishStore.searchQuery().trim().length === 0
    );
  });

  readonly ingredientDeleteBlocked = computed(() => this.ingredientDeleteReferenceCount() > 0);
  readonly ingredientDeleteDialogTitle = computed(() =>
    this.ingredientDeleteBlocked() ? 'Không thể xóa' : 'Xóa nguyên liệu?',
  );
  readonly ingredientDeleteCancelLabel = computed(() =>
    this.ingredientDeleteBlocked() ? 'Đóng' : 'Giữ lại',
  );
  readonly ingredientDeleteConfirmAriaLabel = computed(() =>
    this.ingredientDeleteBlocked()
      ? `Xem ${this.ingredientDeleteReferenceCount()} món đang dùng nguyên liệu ${this.pendingIngredientDeleteName()}`
      : `Xóa nguyên liệu ${this.pendingIngredientDeleteName()}`,
  );
  readonly ingredientDeleteMessage = computed(() => {
    if (this.ingredientDeleteBlocked()) {
      return `Nguyên liệu “${this.pendingIngredientDeleteName()}” đang được dùng trong ${this.ingredientDeleteReferenceCount()} món ăn.`;
    }

    return this.pendingIngredientDeleteName()
      ? `Bạn có chắc muốn xóa “${this.pendingIngredientDeleteName()}”? Thao tác này không thể hoàn tác.`
      : 'Nguyên liệu này sẽ bị xóa khỏi thư viện hiện tại.';
  });

  readonly dishDeleteBlocked = computed(() => this.dishDeleteReferenceCount() > 0);
  readonly dishDeleteDialogTitle = computed(() =>
    this.dishDeleteBlocked() ? 'Không thể xóa' : 'Xóa món ăn?',
  );
  readonly dishDeleteCancelLabel = computed(() => (this.dishDeleteBlocked() ? 'Đóng' : 'Giữ lại'));
  readonly dishDeleteConfirmAriaLabel = computed(() =>
    this.dishDeleteBlocked()
      ? `Đóng hộp thoại món ${this.pendingDishDeleteName()}`
      : `Xóa món ${this.pendingDishDeleteName()}`,
  );
  readonly dishDeleteMessage = computed(() => {
    if (this.dishDeleteBlocked()) {
      return `Món ăn “${this.pendingDishDeleteName()}” đang được dùng trong kế hoạch ăn nên chưa thể xóa.`;
    }

    return this.pendingDishDeleteName()
      ? `Bạn có chắc muốn xóa “${this.pendingDishDeleteName()}”? Thao tác này không thể hoàn tác.`
      : 'Món ăn này sẽ bị xóa khỏi thư viện hiện tại.';
  });

  constructor() {
    addIcons({
      settingsOutline,
      addOutline,
      closeOutline,
      nutritionOutline,
      restaurantOutline,
      searchOutline,
      ellipsisVertical,
      sparklesOutline,
      trashOutline,
    });

    effect(() => {
      const activeTab = this.tab();
      if (activeTab === 'ingredients') {
        void this.ingredientStore.load();
      } else {
        void this.dishStore.load();
      }
    });
  }

  onTabChange(value: ManagementTab | string | null | undefined): void {
    this.tab.set(value === 'dishes' ? 'dishes' : 'ingredients');
    this.closeFabMenu();
  }

  setIngredientFilter(category: IngredientFilter): void {
    this.activeIngredientFilter.set(category);
  }

  async openSettings(): Promise<void> {
    await this.router.navigate(['/settings']);
  }

  async onIngredientSearch(query: string): Promise<void> {
    await this.ingredientStore.search(query);
  }

  async onDishSearch(query: string): Promise<void> {
    await this.dishStore.search(query);
  }

  clearIngredientSearch(): void {
    void this.ingredientStore.search('');
  }

  clearDishSearch(): void {
    void this.dishStore.search('');
  }

  openCreateAction(): void {
    if (this.tab() === 'ingredients') {
      this.openCreateIngredient();
      return;
    }

    this.fabMenuOpen.update((open) => !open);
  }

  openIngredientOptions(item: IngredientListItem, event?: Event): void {
    event?.stopPropagation();
    this.ingredientOptionsItem.set(item);
  }

  closeIngredientOptions(): void {
    this.ingredientOptionsItem.set(null);
  }

  handleIngredientDeleteOption(): void {
    const active = this.ingredientOptionsItem();
    this.closeIngredientOptions();
    if (active) {
      void this.openIngredientDeleteDialog(active.id, active.name);
    }
  }

  handleIngredientBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeIngredientOptions();
    }
  }

  openDishOptions(item: DishListItem, event?: Event): void {
    event?.stopPropagation();
    this.dishOptionsItem.set(item);
  }

  closeDishOptions(): void {
    this.dishOptionsItem.set(null);
  }

  closeFabMenu(): void {
    this.fabMenuOpen.set(false);
  }

  handleDishCreateMode(mode: DishCreateMode): void {
    this.closeFabMenu();
    if (mode === 'ingredient') {
      void this.openCreateDish();
      return;
    }

    void this.openCreateAiDish();
  }

  handleDishDeleteOption(): void {
    const active = this.dishOptionsItem();
    this.closeDishOptions();
    if (active) {
      void this.openDishDeleteDialog(active.id, active.name);
    }
  }

  handleDishBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDishOptions();
    }
  }

  async openCreateDish(): Promise<void> {
    this.closeFabMenu();
    await this.router.navigate(['/tabs/management/dish/new']);
  }

  async openCreateAiDish(): Promise<void> {
    this.closeFabMenu();
    await this.router.navigate(['/tabs/management/dish/new']);
  }

  async openEditDish(id: string): Promise<void> {
    await this.router.navigate(['/tabs/management/dish/edit', id]);
  }

  openCreateIngredient(): void {
    void this.router.navigate(['/tabs/management/ingredient/new']);
  }

  openEditIngredient(id: string): void {
    void this.router.navigate(['/tabs/management/ingredient/edit', id]);
  }

  async openIngredientDeleteDialog(id: string, name: string): Promise<void> {
    this.pendingIngredientDeleteId.set(id);
    this.pendingIngredientDeleteName.set(name);
    this.ingredientDeleteReferenceCount.set(await this.ingredientStore.countDishReferences(id));
  }

  closeIngredientDeleteDialog(): void {
    this.pendingIngredientDeleteId.set(null);
    this.pendingIngredientDeleteName.set('');
    this.ingredientDeleteReferenceCount.set(0);
  }

  async confirmIngredientDelete(): Promise<void> {
    const id = this.pendingIngredientDeleteId();
    if (!id) {
      return;
    }

    if (this.ingredientDeleteBlocked()) {
      this.closeIngredientDeleteDialog();
      this.tab.set('dishes');
      await this.dishStore.load();
      return;
    }

    await this.ingredientStore.remove(id);
    this.closeIngredientDeleteDialog();
  }

  async openDishDeleteDialog(id: string, name: string): Promise<void> {
    this.pendingDishDeleteId.set(id);
    this.pendingDishDeleteName.set(name);
    this.dishDeleteReferenceCount.set(await this.dishStore.countReferences(id));
  }

  closeDishDeleteDialog(): void {
    this.pendingDishDeleteId.set(null);
    this.pendingDishDeleteName.set('');
    this.dishDeleteReferenceCount.set(0);
  }

  async confirmDishDelete(): Promise<void> {
    const id = this.pendingDishDeleteId();
    if (!id) {
      return;
    }

    if (this.dishDeleteBlocked()) {
      this.closeDishDeleteDialog();
      return;
    }

    await this.dishStore.remove(id);
    this.closeDishDeleteDialog();
  }

  ingredientSourceLabel(source: string): string {
    return source === 'db' ? 'Có sẵn' : source === 'ai' ? 'AI' : 'Tự tạo';
  }

  ingredientCategoryClass(category: string): string {
    const categoryMap: Record<string, string> = {
      Thịt: 'badge--category-cat-thit',
      'Cá & Hải sản': 'badge--category-cat-ca',
      'Trứng & Sữa': 'badge--category-cat-trung',
      'Rau củ': 'badge--category-cat-rau',
      'Ngũ cốc & Tinh bột': 'badge--category-cat-ngu-coc',
      'Đậu & Hạt': 'badge--category-cat-dau-hat',
      'Dầu & Mỡ': 'badge--category-cat-dau-mo',
      'Gia vị': 'badge--category-cat-gia-vi',
      'Nước dùng & Nước chấm': 'badge--category-cat-nuoc-dung',
      'Trái cây': 'badge--category-cat-trai-cay',
      Khác: 'badge--category-cat-khac',
    };

    return categoryMap[category] ?? 'badge--category-cat-khac';
  }

  dishSourceLabel(source: string): string {
    return source === 'db' ? 'Có sẵn' : source === 'ai' ? 'AI' : 'Tự tạo';
  }

  dishTypeClass(type: string): string {
    return type === 'ai_autofill' ? 'badge--type-ai' : 'badge--type-ingredient';
  }

  dishTypeLabel(type: string): string {
    return type === 'ai_autofill' ? 'AI tự điền' : 'Nguyên liệu';
  }

  ingredientUnitSummary(
    units: {
      display_label: string | null;
      short_name_vi?: string;
      is_default: number;
      is_approximate: number;
    }[],
  ): string {
    const defaultUnit = units.find((unit) => unit.is_default === 1);
    const approximateUnit = units.find((unit) => unit.is_approximate === 1);
    const defaultLabel = defaultUnit?.display_label ?? defaultUnit?.short_name_vi ?? '—';
    if (approximateUnit) {
      return `Mặc định: ${defaultLabel} · Có đơn vị ước lượng`;
    }

    return `Mặc định: ${defaultLabel}`;
  }

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }
}
