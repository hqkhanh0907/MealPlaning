import { DOCUMENT, NgClass } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
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
  createOutline,
  ellipsisVertical,
  nutritionOutline,
  restaurantOutline,
  searchOutline,
  settingsOutline,
  sparklesOutline,
  trashOutline,
} from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../core/models/management.constants';
import type { UnitModel } from '../../core/models/management.model';
import type { DishListItem } from '../../core/repositories/dish.repository';
import type { IngredientListItem } from '../../core/repositories/ingredient.repository';
import { UnitRepository } from '../../core/repositories/unit.repository';
import { DishStore } from '../../core/stores/dish.store';
import { IngredientStore } from '../../core/stores/ingredient.store';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  DishEditModal,
  type DishEditFormValue,
} from '../../shared/components/dish-edit-modal/dish-edit-modal';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import {
  IngredientEditModal,
  type IngredientEditFormValue,
} from '../../shared/components/ingredient-edit-modal/ingredient-edit-modal';
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
    IngredientEditModal,
    DishEditModal,
  ],
})
export default class ManagementPage implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly unitRepository = inject(UnitRepository);
  readonly ingredientStore = inject(IngredientStore);
  readonly dishStore = inject(DishStore);

  readonly managementTabs: SegmentedControlOption<ManagementTab>[] = [
    { value: 'ingredients', label: 'Nguyên liệu', ariaLabel: 'Tab nguyên liệu' },
    { value: 'dishes', label: 'Món ăn', ariaLabel: 'Tab món ăn' },
  ];
  readonly ingredientFilters: IngredientFilter[] = ['Tất cả', ...INGREDIENT_CATEGORIES];
  readonly tab = signal<ManagementTab>('ingredients');
  readonly activeIngredientFilter = signal<IngredientFilter>('Tất cả');
  readonly availableUnits = signal<UnitModel[]>([]);

  readonly ingredientOptionsItem = signal<IngredientListItem | null>(null);
  readonly dishOptionsItem = signal<DishListItem | null>(null);

  readonly pendingIngredientDeleteId = signal<string | null>(null);
  readonly pendingIngredientDeleteName = signal('');
  readonly ingredientDeleteReferenceCount = signal(0);
  readonly ingredientModalOpen = signal(false);
  readonly ingredientSaving = signal(false);
  readonly editingIngredientId = signal<string | null>(null);

  readonly pendingDishDeleteId = signal<string | null>(null);
  readonly pendingDishDeleteName = signal('');
  readonly dishDeleteReferenceCount = signal(0);
  readonly dishModalOpen = signal(false);
  readonly dishSaving = signal(false);
  readonly editingDishId = signal<string | null>(null);
  readonly fabMenuOpen = signal(false);
  readonly editOverlayOpen = computed(() => this.ingredientModalOpen() || this.dishModalOpen());

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
    if (
      this.editOverlayOpen() ||
      this.pendingIngredientDeleteId() !== null ||
      this.pendingDishDeleteId() !== null
    ) {
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

  readonly ingredientModalTitle = computed(() =>
    this.editingIngredientId() ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu',
  );
  readonly ingredientModalSaveLabel = computed(() =>
    this.editingIngredientId() ? 'Lưu thay đổi' : 'Lưu nguyên liệu',
  );
  readonly dishModalTitle = computed(() => (this.editingDishId() ? 'Sửa món ăn' : 'Thêm món ăn'));
  readonly dishModalSaveLabel = computed(() =>
    this.editingDishId() ? 'Lưu thay đổi' : 'Lưu món ăn',
  );

  readonly dishForm = signal<DishEditFormValue>({
    name: '',
    description: '',
    servings: 1,
    items: [],
  });
  readonly ingredientForm = signal<IngredientEditFormValue>({
    name: '',
    category: '',
    nutrition_basis_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    density_g_per_ml: null,
    units: [],
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
      createOutline,
      sparklesOutline,
      trashOutline,
    });
    void this.loadUnits();

    effect(() => {
      const activeTab = this.tab();
      if (activeTab === 'ingredients') {
        void this.ingredientStore.load();
      } else {
        void this.dishStore.load();
      }
    });
  }

  /**
   * Ensure the body-level overlay class is always cleared when this page is
   * destroyed. Without this, navigating away (e.g. Android hardware-back from
   * an open modal) can leave `body.edit-overlay-open` stuck, which hides the
   * bottom tab bar globally via the rule in tabs.page.ts.
   */
  ngOnDestroy(): void {
    this.document.body.classList.remove('edit-overlay-open');
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

  handleIngredientEditOption(): void {
    const active = this.ingredientOptionsItem();
    this.closeIngredientOptions();
    if (active) {
      this.openEditIngredient(active.id);
    }
  }

  handleIngredientDeleteOption(): void {
    const active = this.ingredientOptionsItem();
    this.closeIngredientOptions();
    if (active) {
      void this.openIngredientDeleteDialog(active.id, active.name);
    }
  }

  handleIngredientDeleteFromModal(): void {
    const id = this.editingIngredientId();
    if (!id) {
      return;
    }

    const ingredient = this.ingredientStore.ingredients().find((item) => item.id === id);
    this.closeIngredientModal();
    void this.openIngredientDeleteDialog(id, ingredient?.name ?? 'nguyên liệu');
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

  handleDishEditOption(): void {
    const active = this.dishOptionsItem();
    this.closeDishOptions();
    if (active) {
      void this.openEditDish(active.id);
    }
  }

  handleDishDeleteOption(): void {
    const active = this.dishOptionsItem();
    this.closeDishOptions();
    if (active) {
      void this.openDishDeleteDialog(active.id, active.name);
    }
  }

  handleDishDeleteFromModal(): void {
    const id = this.editingDishId();
    if (!id) {
      return;
    }

    const dish = this.dishStore.dishes().find((item) => item.id === id);
    this.closeDishModal();
    void this.openDishDeleteDialog(id, dish?.name ?? 'món ăn');
  }

  handleDishBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDishOptions();
    }
  }

  async openCreateDish(): Promise<void> {
    this.closeFabMenu();
    await this.ingredientStore.load();
    this.editingDishId.set(null);
    this.dishForm.set({
      name: '',
      description: '',
      servings: null,
      items: [],
    });
    this.dishModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  async openCreateAiDish(): Promise<void> {
    this.closeFabMenu();
    await this.openCreateDish();
  }

  async openEditDish(id: string): Promise<void> {
    const dish = await this.dishStore.fetchById(id);
    if (!dish) {
      return;
    }

    await this.ingredientStore.load();
    this.editingDishId.set(id);
    this.dishForm.set({
      name: dish.name,
      description: dish.description ?? '',
      servings: dish.servings,
      items: dish.ingredients.map((item) => ({
        local_id: this.createLocalId('dish-item'),
        ingredient_id: item.ingredient_id,
        amount_value: item.amount_value,
        unit_id: item.unit_id,
      })),
    });
    this.dishModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  closeDishModal(): void {
    this.dishModalOpen.set(false);
    this.dishSaving.set(false);
    this.editingDishId.set(null);
    this.closeFabMenu();
    this.document.body.classList.remove('edit-overlay-open');
  }

  async submitDish(form: DishEditFormValue): Promise<void> {
    this.dishSaving.set(true);
    try {
      const items = form.items.map((item) => ({
        ingredient_id: item.ingredient_id,
        amount_value: item.amount_value,
        unit_id: item.unit_id,
      }));

      const payload = {
        name: form.name,
        description: form.description || null,
        type: 'ingredient_based' as const,
        source: 'custom' as const,
        servings: form.servings ?? 1,
        image_url: null,
      };

      const editingId = this.editingDishId();
      if (editingId) {
        await this.dishStore.edit(editingId, payload, items);
      } else {
        await this.dishStore.addFromIngredients(payload, items);
      }
      this.closeDishModal();
      this.tab.set('dishes');
    } finally {
      this.dishSaving.set(false);
    }
  }

  openCreateIngredient(): void {
    this.editingIngredientId.set(null);
    this.ingredientForm.set({
      name: '',
      category: '',
      nutrition_basis_unit: 'g',
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      density_g_per_ml: null,
      units: [],
    });
    this.ingredientModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  closeIngredientModal(): void {
    this.ingredientModalOpen.set(false);
    this.ingredientSaving.set(false);
    this.editingIngredientId.set(null);
    this.closeFabMenu();
    this.document.body.classList.remove('edit-overlay-open');
  }

  openEditIngredient(id: string): void {
    const ingredient = this.ingredientStore.ingredients().find((item) => item.id === id);
    if (!ingredient) {
      return;
    }

    this.editingIngredientId.set(id);
    this.ingredientForm.set({
      name: ingredient.name,
      category: ingredient.category,
      nutrition_basis_unit: ingredient.nutrition_basis_unit,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      fiber: ingredient.fiber,
      density_g_per_ml: ingredient.density_g_per_ml,
      units: ingredient.units.map((unit) => ({
        local_id: this.createLocalId('ingredient-unit'),
        unit_id: unit.unit_id,
        factor_to_basis: unit.factor_to_basis,
        is_default: unit.is_default === 1,
        display_label: unit.display_label ?? unit.short_name_vi,
        is_approximate: unit.is_approximate === 1,
        short_name_vi: unit.short_name_vi,
      })),
    });
    this.ingredientModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  async submitIngredient(form: IngredientEditFormValue): Promise<void> {
    this.ingredientSaving.set(true);
    try {
      const editingId = this.editingIngredientId();
      const units = form.units.map((unit) => ({
        unit_id: unit.unit_id,
        factor_to_basis: unit.factor_to_basis,
        is_default: unit.is_default ? 1 : 0,
        display_label: unit.display_label.trim() || null,
      }));

      const nutrition = {
        calories: form.calories ?? 0,
        protein: form.protein ?? 0,
        carbs: form.carbs ?? 0,
        fat: form.fat ?? 0,
        fiber: form.fiber ?? 0,
      };

      if (editingId) {
        await this.ingredientStore.edit(editingId, {
          name: form.name,
          category: form.category,
          nutrition_basis_unit: form.nutrition_basis_unit,
          nutrition_basis_quantity: 100,
          ...nutrition,
          density_g_per_ml: form.density_g_per_ml,
          source: 'manual',
          units,
        });
      } else {
        await this.ingredientStore.add({
          name: form.name,
          category: form.category,
          nutrition_basis_unit: form.nutrition_basis_unit,
          nutrition_basis_quantity: 100,
          ...nutrition,
          density_g_per_ml: form.density_g_per_ml,
          source: 'manual',
          units,
        });
      }
      this.closeIngredientModal();
    } finally {
      this.ingredientSaving.set(false);
    }
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

  private async loadUnits(): Promise<void> {
    this.availableUnits.set(await this.unitRepository.list());
  }

  private createLocalId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
