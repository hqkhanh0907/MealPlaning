import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, closeOutline } from 'ionicons/icons';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import { DishStore } from '../../../core/stores/dish.store';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import {
  BottomSheetPicker,
  type PickerOption,
} from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { AppFormField } from '../../../shared/forms';
import { dishFormSchema } from '../../../shared/forms/schemas/dish-form.schema';
import type { DishEditFormValue, DishIngredientFormItem } from './dish-edit.types';

export type { DishEditFormValue, DishIngredientFormItem } from './dish-edit.types';

const emptyForm = (): DishEditFormValue => ({
  name: '',
  description: '',
  servings: null,
  items: [],
});

@Component({
  selector: 'app-dish-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dish-edit.page.html',
  styleUrl: './dish-edit.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    FormField,
    BottomSheetPicker,
    AppFormField,
  ],
})
export default class DishEditPage {
  @ViewChild('ingredientPicker') private ingredientPicker?: BottomSheetPicker;
  @ViewChild('unitPicker') private unitPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dishStore = inject(DishStore);
  private readonly ingredientStore = inject(IngredientStore);

  readonly dishId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => this.dishId() !== null);

  readonly availableIngredients = signal<IngredientListItem[]>([]);
  readonly saving = signal(false);
  protected readonly showErrors = signal(false);

  protected readonly formSignal = signal<DishEditFormValue>(emptyForm());
  protected readonly dishForm = form(this.formSignal, dishFormSchema);

  activeUnitRowId: string | null = null;

  constructor() {
    addIcons({ chevronDownOutline, closeOutline });
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    if (this.ingredientStore.ingredients().length === 0) {
      await this.ingredientStore.load();
    }
    this.availableIngredients.set(this.ingredientStore.ingredients());

    const id = this.dishId();
    if (!id) {
      return;
    }

    const dish = await this.dishStore.fetchById(id);
    if (!dish) {
      return;
    }

    this.formSignal.set({
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
  }

  get ingredientOptions(): PickerOption[] {
    return this.availableIngredients().map((ingredient) => ({
      value: ingredient.id,
      label: ingredient.name,
      description: `${ingredient.category} · Dinh dưỡng theo ${ingredient.nutrition_basis_quantity}${ingredient.nutrition_basis_unit}`,
    }));
  }

  get unitOptions(): PickerOption[] {
    const item = this.formSignal().items.find(
      (candidate) => candidate.local_id === this.activeUnitRowId,
    );
    const ingredient = item
      ? this.availableIngredients().find((candidate) => candidate.id === item.ingredient_id)
      : null;
    return (ingredient?.units ?? []).map((unit) => ({
      value: unit.unit_id,
      label:
        unit.is_approximate === 1
          ? `≈ ${unit.display_label || unit.short_name_vi}`
          : unit.display_label || unit.short_name_vi,
      description:
        unit.is_approximate === 1
          ? 'Đơn vị ước lượng'
          : `1 ${unit.display_label || unit.short_name_vi} ≈ ${this.formatNumber(unit.factor_to_basis)}${ingredient?.nutrition_basis_unit ?? ''}`,
    }));
  }

  get activeUnitValue(): string | null {
    return (
      this.formSignal().items.find((candidate) => candidate.local_id === this.activeUnitRowId)
        ?.unit_id ?? null
    );
  }

  get previewTotals(): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } {
    return this.formSignal().items.reduce(
      (totals, item) => {
        const ingredient = this.availableIngredients().find(
          (candidate) => candidate.id === item.ingredient_id,
        );
        const unit = ingredient?.units.find((candidate) => candidate.unit_id === item.unit_id);
        if (!ingredient || !unit || item.amount_value <= 0) {
          return totals;
        }

        const normalizedAmount = item.amount_value * unit.factor_to_basis;
        const multiplier = normalizedAmount / ingredient.nutrition_basis_quantity;
        return {
          calories: totals.calories + ingredient.calories * multiplier,
          protein: totals.protein + ingredient.protein * multiplier,
          carbs: totals.carbs + ingredient.carbs * multiplier,
          fat: totals.fat + ingredient.fat * multiplier,
          fiber: totals.fiber + ingredient.fiber * multiplier,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }

  /** Aggregated own-errors on the `items` array field. */
  protected itemsErrorMessages(): string[] {
    return this.dishForm
      .items()
      .errors()
      .map((e) => e.message)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
  }

  openIngredientPicker(): void {
    this.ingredientPicker?.open();
  }

  openUnitPicker(localId: string): void {
    this.activeUnitRowId = localId;
    this.unitPicker?.open();
  }

  onIngredientSelected(ingredientId: string): void {
    const ingredient = this.availableIngredients().find(
      (candidate) => candidate.id === ingredientId,
    );
    if (!ingredient) {
      return;
    }

    const defaultUnit =
      ingredient.units.find((unit) => unit.is_default === 1) ?? ingredient.units[0];
    if (!defaultUnit) {
      return;
    }

    this.formSignal.update((v) => ({
      ...v,
      items: [
        ...v.items,
        {
          local_id: this.createLocalId('dish-item'),
          ingredient_id: ingredient.id,
          amount_value: 1,
          unit_id: defaultUnit.unit_id,
        },
      ],
    }));
  }

  onUnitSelected(unitId: string): void {
    if (!this.activeUnitRowId) {
      return;
    }

    const targetId = this.activeUnitRowId;
    this.formSignal.update((v) => ({
      ...v,
      items: v.items.map((item) =>
        item.local_id === targetId ? { ...item, unit_id: unitId } : item,
      ),
    }));
  }

  removeItem(localId: string): void {
    this.formSignal.update((v) => ({
      ...v,
      items: v.items.filter((item) => item.local_id !== localId),
    }));
  }

  ingredientName(ingredientId: string): string {
    return (
      this.availableIngredients().find((ingredient) => ingredient.id === ingredientId)?.name ??
      'Nguyên liệu'
    );
  }

  unitLabel(item: DishIngredientFormItem): string {
    const unit = this.findUnit(item);
    if (!unit) {
      return 'Chọn đơn vị';
    }
    const label = unit.display_label || unit.short_name_vi;
    return unit.is_approximate === 1 ? `≈ ${label}` : label;
  }

  ingredientDetail(item: DishIngredientFormItem): string {
    const ingredient = this.availableIngredients().find(
      (candidate) => candidate.id === item.ingredient_id,
    );
    const unit = this.findUnit(item);
    if (!ingredient || !unit) {
      return 'Thiếu cấu hình đơn vị';
    }

    const label = unit.display_label || unit.short_name_vi;
    const prefix = unit.is_approximate === 1 ? '≈ ' : '';
    return `${prefix}${this.formatNumber(item.amount_value)} ${label}${unit.is_approximate === 1 ? ' · ước lượng' : ''}`;
  }

  async onSave(): Promise<void> {
    this.showErrors.set(true);
    if (!this.dishForm().valid()) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      const value = untracked(() => this.formSignal());
      const items = value.items.map((item) => ({
        ingredient_id: item.ingredient_id,
        amount_value: item.amount_value,
        unit_id: item.unit_id,
      }));

      const trimmedDescription = value.description.trim();
      const payload = {
        name: value.name.trim(),
        description: trimmedDescription || null,
        type: 'ingredient_based' as const,
        source: 'custom' as const,
        servings: value.servings ?? 1,
        image_url: null,
      };

      const editingId = this.dishId();
      if (editingId) {
        await this.dishStore.edit(editingId, payload, items);
      } else {
        await this.dishStore.addFromIngredients(payload, items);
      }

      await this.router.navigate(['/tabs/management']);
    } finally {
      this.saving.set(false);
    }
  }

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private focusFirstInvalidField(): void {
    const f = this.dishForm;
    const firstErrorSelector = f.name().errors().length
      ? 'input'
      : f.servings().errors().length
        ? 'input[type="number"]'
        : f.items().errors().length
          ? '.ingredient-empty'
          : null;

    setTimeout(() => {
      if (f.name().errors().length) {
        this.nameInput?.nativeElement.focus();
      }

      const target = firstErrorSelector
        ? (document.querySelector(firstErrorSelector) as HTMLElement | null)
        : null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private findUnit(item: DishIngredientFormItem): IngredientListItem['units'][number] | undefined {
    return this.availableIngredients()
      .find((candidate) => candidate.id === item.ingredient_id)
      ?.units.find((candidate) => candidate.unit_id === item.unit_id);
  }

  private createLocalId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
