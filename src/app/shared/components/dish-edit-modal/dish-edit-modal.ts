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
import { chevronBackOutline, chevronDownOutline, closeOutline } from 'ionicons/icons';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import { BottomSheetPicker, type PickerOption } from '../bottom-sheet-picker/bottom-sheet-picker';
import { AppFormField } from '../../forms';
import { dishFormSchema } from '../../forms/schemas/dish-form.schema';
import type { DishEditFormValue, DishIngredientFormItem } from './dish-edit-modal.types';

export type { DishEditFormValue, DishIngredientFormItem } from './dish-edit-modal.types';

const emptyForm = (): DishEditFormValue => ({
  name: '',
  description: '',
  servings: null,
  items: [],
});

const cloneForm = (value: DishEditFormValue): DishEditFormValue => ({
  ...value,
  items: value.items.map((item) => ({ ...item })),
});

@Component({
  selector: 'app-dish-edit-modal',
  standalone: true,
  imports: [FormField, IonIcon, BottomSheetPicker, AppFormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dish-edit-modal.html',
  styleUrl: './dish-edit-modal.scss',
})
export class DishEditModal implements OnChanges {
  @ViewChild('ingredientPicker') private ingredientPicker?: BottomSheetPicker;
  @ViewChild('unitPicker') private unitPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  @Input() isOpen = false;
  @Input() title = 'Thêm món ăn';
  @Input() saveLabel = 'Lưu món ăn';
  @Input() saving = false;
  @Input() allowDelete = false;
  @Input() ingredients: IngredientListItem[] = [];
  @Input() form: DishEditFormValue = emptyForm();
  @Output() dismissed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<DishEditFormValue>();
  @Output() deleteRequested = new EventEmitter<void>();

  /**
   * Internal writable signal mirroring the @Input `form` object. Signal Forms
   * binds against this; ngOnChanges keeps it in sync with the parent.
   */
  protected readonly formSignal = signal<DishEditFormValue>(emptyForm());

  /** Signal Forms FieldTree built from {@link formSignal} + schema. */
  protected readonly dishForm = form(this.formSignal, dishFormSchema);

  /**
   * Live error gate. Toggled to `true` on first submit attempt; templates
   * render `field.errors()` only when this is `true`.
   */
  protected readonly showErrors = signal(false);
  activeUnitRowId: string | null = null;

  constructor() {
    addIcons({ chevronBackOutline, chevronDownOutline, closeOutline });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form']) {
      this.formSignal.set(cloneForm(this.form));
    }
    if (changes['isOpen']?.currentValue) {
      this.showErrors.set(false);
      // Re-sync from input on each open (parent may have mutated `form` in place).
      this.formSignal.set(cloneForm(this.form));
      queueMicrotask(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        document
          .querySelector('.modal')
          ?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      });
    }
  }

  get ingredientOptions(): PickerOption[] {
    return this.ingredients.map((ingredient) => ({
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
      ? this.ingredients.find((candidate) => candidate.id === item.ingredient_id)
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
        const ingredient = this.ingredients.find(
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

  /** Aggregated own-errors on the `items` array field (eg. "Cần ít nhất 1 nguyên liệu"). */
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
    const ingredient = this.ingredients.find((candidate) => candidate.id === ingredientId);
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
      this.ingredients.find((ingredient) => ingredient.id === ingredientId)?.name ?? 'Nguyên liệu'
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
    const ingredient = this.ingredients.find((candidate) => candidate.id === item.ingredient_id);
    const unit = this.findUnit(item);
    if (!ingredient || !unit) {
      return 'Thiếu cấu hình đơn vị';
    }

    const label = unit.display_label || unit.short_name_vi;
    const prefix = unit.is_approximate === 1 ? '≈ ' : '';
    return `${prefix}${this.formatNumber(item.amount_value)} ${label}${unit.is_approximate === 1 ? ' · ước lượng' : ''}`;
  }

  submit(): void {
    this.showErrors.set(true);
    if (!this.dishForm().valid()) {
      this.focusFirstInvalidField();
      return;
    }

    const value = untracked(() => this.formSignal());
    this.submitted.emit({
      ...value,
      name: value.name.trim(),
      description: value.description.trim(),
      servings: value.servings ?? 1,
      items: value.items.map((item) => ({ ...item })),
    });
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
    return this.ingredients
      .find((candidate) => candidate.id === item.ingredient_id)
      ?.units.find((candidate) => candidate.unit_id === item.unit_id);
  }

  private createLocalId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
