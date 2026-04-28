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
import { chevronDownOutline } from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../../core/models/management.constants';
import type { UnitModel } from '../../../core/models/management.model';
import type { NutritionBasisUnit } from '../../../core/models/management.types';
import { UnitRepository } from '../../../core/repositories/unit.repository';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import {
  BottomSheetPicker,
  type PickerOption,
} from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { AppFormField } from '../../../shared/forms';
import { ingredientFormSchema } from '../../../shared/forms/schemas/ingredient-form.schema';
import type { IngredientEditFormValue, IngredientEditUnitFormValue } from './ingredient-edit.types';

export type { IngredientEditFormValue, IngredientEditUnitFormValue } from './ingredient-edit.types';

const emptyForm = (): IngredientEditFormValue => ({
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

@Component({
  selector: 'app-ingredient-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ingredient-edit.page.html',
  styleUrl: './ingredient-edit.page.scss',
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
export default class IngredientEditPage {
  @ViewChild('categoryPicker') private categoryPicker?: BottomSheetPicker;
  @ViewChild('unitPicker') private unitPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly unitRepository = inject(UnitRepository);
  private readonly ingredientStore = inject(IngredientStore);

  readonly categories = INGREDIENT_CATEGORIES;

  readonly ingredientId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => this.ingredientId() !== null);

  readonly availableUnits = signal<UnitModel[]>([]);
  readonly saving = signal(false);
  protected readonly showErrors = signal(false);

  protected readonly formSignal = signal<IngredientEditFormValue>(emptyForm());
  protected readonly ingredientForm = form(this.formSignal, ingredientFormSchema);

  constructor() {
    addIcons({ chevronDownOutline });
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    this.availableUnits.set(await this.unitRepository.list());
    const id = this.ingredientId();
    if (!id) {
      return;
    }

    if (this.ingredientStore.ingredients().length === 0) {
      await this.ingredientStore.load();
    }

    const ingredient = this.ingredientStore.ingredients().find((item) => item.id === id);
    if (!ingredient) {
      return;
    }

    this.formSignal.set({
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
  }

  get categoryOptions(): PickerOption[] {
    return this.categories.map((category) => ({ value: category, label: category }));
  }

  get unitOptions(): PickerOption[] {
    const usedIds = new Set(this.formSignal().units.map((unit) => unit.unit_id));
    return this.availableUnits()
      .filter((unit) => !usedIds.has(unit.id))
      .map((unit) => ({
        value: unit.id,
        label: unit.display_name_vi,
        description: unit.is_approximate === 1 ? 'Đơn vị ước lượng' : unit.short_name_vi,
      }));
  }

  protected unitListErrorMessages(): string[] {
    return this.ingredientForm
      .units()
      .errorSummary()
      .map((e) => e.message)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
  }

  openCategoryPicker(): void {
    this.categoryPicker?.open();
  }

  openUnitPicker(): void {
    this.unitPicker?.open();
  }

  onCategorySelected(category: string): void {
    this.formSignal.update((v) => ({ ...v, category }));
  }

  onUnitSelected(unitId: string): void {
    const unit = this.availableUnits().find((item) => item.id === unitId);
    if (!unit) {
      return;
    }

    const factor = this.getSuggestedFactor(unit);
    this.formSignal.update((v) => ({
      ...v,
      units: [
        ...v.units,
        {
          local_id: `${unit.id}-${crypto.randomUUID()}`,
          unit_id: unit.id,
          factor_to_basis: factor,
          is_default: v.units.length === 0,
          display_label: unit.short_name_vi,
          is_approximate: unit.is_approximate === 1,
          short_name_vi: unit.short_name_vi,
        },
      ],
    }));
  }

  setBasisUnit(unit: NutritionBasisUnit): void {
    this.formSignal.update((v) => ({
      ...v,
      nutrition_basis_unit: unit,
      units: v.units.map((item) => {
        const definition = this.availableUnits().find((c) => c.id === item.unit_id);
        if (!definition) {
          return item;
        }
        const usesGlobalDefault =
          (unit === 'g' && definition.unit_type === 'mass' && definition.base_factor_g !== null) ||
          (unit === 'ml' &&
            definition.unit_type === 'volume' &&
            definition.base_factor_ml !== null);
        return usesGlobalDefault
          ? { ...item, factor_to_basis: this.getSuggestedFactor(definition, unit) }
          : item;
      }),
    }));
  }

  markDefault(localId: string): void {
    this.formSignal.update((v) => ({
      ...v,
      units: v.units.map((unit) => ({
        ...unit,
        is_default: unit.local_id === localId,
      })),
    }));
  }

  removeUnit(localId: string): void {
    this.formSignal.update((v) => {
      const nextUnits = v.units.filter((unit) => unit.local_id !== localId);
      if (nextUnits.length === 1) {
        nextUnits[0] = { ...nextUnits[0], is_default: true };
      }
      return { ...v, units: nextUnits };
    });
  }

  unitTitle(unit: IngredientEditUnitFormValue): string {
    return unit.is_approximate
      ? `≈ ${unit.display_label || unit.short_name_vi}`
      : unit.display_label || unit.short_name_vi;
  }

  unitExample(unit: IngredientEditUnitFormValue): string {
    const label = unit.display_label || unit.short_name_vi;
    return `Hiển thị: ${label} · 1 ${label} ≈ ${this.formatNumber(unit.factor_to_basis)}${this.formSignal().nutrition_basis_unit}`;
  }

  async onSave(): Promise<void> {
    this.showErrors.set(true);
    if (!this.ingredientForm().valid()) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      const value = untracked(() => this.formSignal());
      const trimmedName = value.name.trim();
      const trimmedCategory = value.category.trim();
      const units = value.units.map((unit) => ({
        unit_id: unit.unit_id,
        factor_to_basis: unit.factor_to_basis,
        is_default: unit.is_default ? 1 : 0,
        display_label: unit.display_label.trim() || null,
      }));

      const nutrition = {
        calories: value.calories ?? 0,
        protein: value.protein ?? 0,
        carbs: value.carbs ?? 0,
        fat: value.fat ?? 0,
        fiber: value.fiber ?? 0,
      };

      const editingId = this.ingredientId();
      if (editingId) {
        await this.ingredientStore.edit(editingId, {
          name: trimmedName,
          category: trimmedCategory,
          nutrition_basis_unit: value.nutrition_basis_unit,
          nutrition_basis_quantity: 100,
          ...nutrition,
          density_g_per_ml: value.density_g_per_ml,
          source: 'manual',
          units,
        });
      } else {
        await this.ingredientStore.add({
          name: trimmedName,
          category: trimmedCategory,
          nutrition_basis_unit: value.nutrition_basis_unit,
          nutrition_basis_quantity: 100,
          ...nutrition,
          density_g_per_ml: value.density_g_per_ml,
          source: 'manual',
          units,
        });
      }

      await this.router.navigate(['/tabs/management']);
    } finally {
      this.saving.set(false);
    }
  }

  private focusFirstInvalidField(): void {
    const f = this.ingredientForm;
    const firstErrorSelector = f.name().errors().length
      ? 'input'
      : f.category().errors().length
        ? '.picker-trigger--floating'
        : f.calories().errors().length
          ? 'input[type="number"]'
          : f.units().errorSummary().length
            ? '.unit-empty, .unit-list'
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

  private getSuggestedFactor(unit: UnitModel, basis?: NutritionBasisUnit): number {
    const b = basis ?? this.formSignal().nutrition_basis_unit;
    if (b === 'g' && unit.unit_type === 'mass' && unit.base_factor_g !== null) {
      return unit.base_factor_g;
    }
    if (b === 'ml' && unit.unit_type === 'volume' && unit.base_factor_ml !== null) {
      return unit.base_factor_ml;
    }
    return 1;
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  }

  private createLocalId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
