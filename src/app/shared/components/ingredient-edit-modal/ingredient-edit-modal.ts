import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronDownOutline } from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../../core/models/management.constants';
import type { UnitModel } from '../../../core/models/management.model';
import type { NutritionBasisUnit } from '../../../core/models/management.types';
import { BottomSheetPicker, type PickerOption } from '../bottom-sheet-picker/bottom-sheet-picker';
import { FormFieldComponent } from '../../forms';
import { ingredientFormSchema } from '../../forms/schemas/ingredient-form.schema';
import type {
  IngredientEditFormValue,
  IngredientEditUnitFormValue,
} from './ingredient-edit-modal.types';

export type {
  IngredientEditFormValue,
  IngredientEditUnitFormValue,
} from './ingredient-edit-modal.types';

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

const cloneForm = (value: IngredientEditFormValue): IngredientEditFormValue => ({
  ...value,
  units: value.units.map((unit) => ({ ...unit })),
});

@Component({
  selector: 'app-ingredient-edit-modal',
  standalone: true,
  imports: [FormField, IonIcon, BottomSheetPicker, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ingredient-edit-modal.html',
  styleUrl: './ingredient-edit-modal.scss',
})
export class IngredientEditModal implements OnChanges {
  @ViewChild('categoryPicker') private categoryPicker?: BottomSheetPicker;
  @ViewChild('unitPicker') private unitPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  @Input() isOpen = false;
  @Input() title = 'Thêm nguyên liệu';
  @Input() saveLabel = 'Lưu nguyên liệu';
  @Input() saving = false;
  @Input() allowDelete = false;
  @Input() availableUnits: UnitModel[] = [];
  @Input() form: IngredientEditFormValue = emptyForm();
  @Output() dismissed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<IngredientEditFormValue>();
  @Output() deleteRequested = new EventEmitter<void>();

  readonly categories = INGREDIENT_CATEGORIES;
  showErrors = false;

  /**
   * Internal writable signal mirroring the @Input `form` object. Signal Forms
   * binds against this; ngOnChanges keeps it in sync with the parent.
   */
  protected readonly formSignal = signal<IngredientEditFormValue>(emptyForm());

  /** Signal Forms FieldTree built from {@link formSignal} + schema. */
  protected readonly ingredientForm = form(this.formSignal, ingredientFormSchema);

  constructor() {
    addIcons({ chevronBackOutline, chevronDownOutline });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form']) {
      this.formSignal.set(cloneForm(this.form));
    }
    if (changes['isOpen']?.currentValue) {
      this.showErrors = false;
      // Re-mirror the parent's form when reopening even if reference unchanged.
      this.formSignal.set(cloneForm(this.form));
      queueMicrotask(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        document
          .querySelector('.modal')
          ?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      });
    }
  }

  get categoryOptions(): PickerOption[] {
    return this.categories.map((category) => ({ value: category, label: category }));
  }

  get unitOptions(): PickerOption[] {
    const usedIds = new Set(this.formSignal().units.map((unit) => unit.unit_id));
    return this.availableUnits
      .filter((unit) => !usedIds.has(unit.id))
      .map((unit) => ({
        value: unit.id,
        label: unit.display_name_vi,
        description: unit.is_approximate === 1 ? 'Đơn vị ước lượng' : unit.short_name_vi,
      }));
  }

  protected nameValid(): boolean {
    return this.formSignal().name.trim().length > 0;
  }

  protected categoryValid(): boolean {
    return this.formSignal().category.trim().length > 0;
  }

  protected unitErrors(): string[] {
    const errors: string[] = [];
    const units = this.formSignal().units;
    if (units.length === 0) {
      errors.push('Cần ít nhất 1 đơn vị hợp lệ.');
    }
    if (units.length > 0 && units.filter((unit) => unit.is_default).length !== 1) {
      errors.push('Chọn đúng 1 đơn vị mặc định trước khi lưu.');
    }
    if (units.some((unit) => unit.factor_to_basis <= 0)) {
      errors.push('Mỗi đơn vị cần có quy đổi lớn hơn 0.');
    }
    return errors;
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
    const unit = this.availableUnits.find((item) => item.id === unitId);
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
        const definition = this.availableUnits.find((c) => c.id === item.unit_id);
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

  isNegative(value: number | null): boolean {
    return value !== null && value < 0;
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

  submit(): void {
    this.showErrors = true;
    if (!this.isValid()) {
      this.focusFirstInvalidField();
      return;
    }

    const value = untracked(() => this.formSignal());
    this.submitted.emit({
      ...value,
      name: value.name.trim(),
      category: value.category.trim(),
      calories: value.calories ?? 0,
      protein: value.protein ?? 0,
      carbs: value.carbs ?? 0,
      fat: value.fat ?? 0,
      fiber: value.fiber ?? 0,
      units: value.units.map((unit) => ({
        ...unit,
        display_label: unit.display_label.trim(),
      })),
    });
  }

  private isValid(): boolean {
    return (
      this.nameValid() &&
      this.categoryValid() &&
      !this.isNegative(this.formSignal().calories) &&
      this.unitErrors().length === 0
    );
  }

  private focusFirstInvalidField(): void {
    const v = this.formSignal();
    const firstErrorSelector = !v.name.trim()
      ? 'input'
      : !v.category.trim()
        ? '.picker-trigger'
        : this.isNegative(v.calories)
          ? 'input[type="number"]'
          : this.unitErrors().length > 0
            ? '.unit-empty, .unit-list'
            : null;

    setTimeout(() => {
      if (!this.formSignal().name.trim()) {
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
}
