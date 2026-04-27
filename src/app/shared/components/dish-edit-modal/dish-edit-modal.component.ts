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
import {
  BottomSheetPickerComponent,
  type PickerOption,
} from '../bottom-sheet-picker/bottom-sheet-picker.component';
import { FormFieldComponent } from '../../forms';
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
  imports: [FormField, IonIcon, BottomSheetPickerComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="overlay">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="dish-modal-title">
          <div class="modal-toolbar">
            <button
              type="button"
              class="toolbar-icon-button"
              (click)="dismissed.emit()"
              aria-label="Quay lại"
            >
              <ion-icon name="chevron-back-outline" />
            </button>
            <h2 id="dish-modal-title">{{ title }}</h2>
            <button
              type="button"
              class="toolbar-save-button"
              [disabled]="saving"
              (click)="submit()"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>

          <div class="form-content">
            <div class="section-label">Thông tin cơ bản</div>

            <app-form-field
              label="Tên món ăn"
              inputId="dish-field-name"
              errorId="err-dish-name"
              [invalid]="showErrors && !formSignal().name.trim()"
              errorMessage="Vui lòng nhập tên món ăn"
            >
              <input
                id="dish-field-name"
                class="input-native"
                #nameInput
                [formField]="dishForm.name"
                [attr.aria-invalid]="showErrors && !formSignal().name.trim() ? 'true' : null"
                [attr.aria-describedby]="
                  showErrors && !formSignal().name.trim() ? 'err-dish-name' : null
                "
              />
            </app-form-field>

            <app-form-field label="Mô tả" inputId="dish-field-description">
              <textarea
                id="dish-field-description"
                class="input-native input-native--textarea"
                rows="2"
                [formField]="dishForm.description"
              ></textarea>
            </app-form-field>

            <app-form-field
              label="Số phần ăn"
              inputId="dish-field-servings"
              errorId="err-dish-servings"
              [invalid]="showErrors && !isServingsValid()"
              errorMessage="Số phần ăn cần nằm trong khoảng 0.5 đến 20."
            >
              <input
                id="dish-field-servings"
                class="input-native"
                type="number"
                inputmode="decimal"
                [formField]="dishForm.servings"
                step="0.5"
                [attr.aria-invalid]="showErrors && !isServingsValid() ? 'true' : null"
                [attr.aria-describedby]="
                  showErrors && !isServingsValid() ? 'err-dish-servings' : null
                "
              />
            </app-form-field>

            <div class="section-label">Nguyên liệu</div>

            @if (formSignal().items.length === 0) {
              <div
                class="ingredient-empty"
                [class.invalid]="showErrors && formSignal().items.length === 0"
              >
                <div class="ingredient-empty-title">Chưa có nguyên liệu nào</div>
                <button type="button" class="btn-outline" (click)="openIngredientPicker()">
                  + Thêm nguyên liệu đầu tiên
                </button>
              </div>
            } @else {
              <div class="ingredient-list">
                @for (item of formSignal().items; track item.local_id; let i = $index) {
                  <article class="ingredient-item">
                    <div class="ingredient-item__row">
                      <div class="ingredient-item__info">
                        <div class="ingredient-item__name">
                          {{ ingredientName(item.ingredient_id) }}
                        </div>
                        <div class="ingredient-item__detail">{{ ingredientDetail(item) }}</div>
                      </div>
                      <button
                        type="button"
                        class="icon-button icon-button--danger"
                        (click)="removeItem(item.local_id)"
                        [attr.aria-label]="'Xóa ' + ingredientName(item.ingredient_id)"
                      >
                        <ion-icon name="close-outline" />
                      </button>
                    </div>

                    <div class="ingredient-item__grid">
                      <app-form-field
                        label="Số lượng"
                        [inputId]="'dish-amount-' + item.local_id"
                        [invalid]="showErrors && !(item.amount_value > 0)"
                      >
                        <input
                          [id]="'dish-amount-' + item.local_id"
                          class="input-native"
                          type="number"
                          inputmode="decimal"
                          [formField]="dishForm.items[i].amount_value"
                          step="0.1"
                          [attr.aria-invalid]="
                            showErrors && !(item.amount_value > 0) ? 'true' : null
                          "
                        />
                      </app-form-field>

                      <app-form-field label="Đơn vị" [inputId]="'dish-unit-' + item.local_id">
                        <button
                          type="button"
                          [id]="'dish-unit-' + item.local_id"
                          class="picker-trigger--floating"
                          (click)="openUnitPicker(item.local_id)"
                        >
                          <span>{{ unitLabel(item) }}</span>
                          <ion-icon name="chevron-down-outline" aria-hidden="true" />
                        </button>
                      </app-form-field>
                    </div>
                  </article>
                }
              </div>

              <button type="button" class="btn-outline" (click)="openIngredientPicker()">
                + Thêm nguyên liệu
              </button>
            }

            @if (showErrors && formSignal().items.length === 0) {
              <div id="err-dish-items" class="field-error" role="alert">
                Cần ít nhất 1 nguyên liệu trước khi lưu món ăn.
              </div>
            }

            <div class="section-label">Tổng dinh dưỡng (1 phần)</div>
            <p class="section-hint">
              Dinh dưỡng được tính tự động từ danh sách nguyên liệu hiện tại.
            </p>
            <div class="nutrition-card">
              <div class="nutrition-row">
                <span class="nutrition-label">Calories</span>
                <strong class="nutrition-value"
                  >{{ formatNumber(previewTotals.calories) }} kcal</strong
                >
              </div>
              <div class="nutrition-row">
                <span class="nutrition-label">Protein</span>
                <strong class="nutrition-value">{{ formatNumber(previewTotals.protein) }}g</strong>
              </div>
              <div class="nutrition-row">
                <span class="nutrition-label">Carbs</span>
                <strong class="nutrition-value">{{ formatNumber(previewTotals.carbs) }}g</strong>
              </div>
              <div class="nutrition-row">
                <span class="nutrition-label">Fat</span>
                <strong class="nutrition-value">{{ formatNumber(previewTotals.fat) }}g</strong>
              </div>
              <div class="nutrition-row">
                <span class="nutrition-label">Chất xơ</span>
                <strong class="nutrition-value">{{ formatNumber(previewTotals.fiber) }}g</strong>
              </div>
            </div>

            <button type="button" class="btn-cta" [disabled]="saving" (click)="submit()">
              {{ saving ? 'Đang lưu...' : saveLabel }}
            </button>

            @if (allowDelete) {
              <button type="button" class="btn-danger-text" (click)="deleteRequested.emit()">
                Xóa món ăn
              </button>
            }
          </div>

          <app-bottom-sheet-picker
            #ingredientPicker
            title="Chọn nguyên liệu"
            [options]="ingredientOptions"
            [searchable]="true"
            (valueChange)="onIngredientSelected($event)"
          />

          <app-bottom-sheet-picker
            #unitPicker
            title="Chọn đơn vị"
            [value]="activeUnitValue"
            [options]="unitOptions"
            (valueChange)="onUnitSelected($event)"
          />
        </section>
      </div>
    }
  `,
  styles: `
    /* Shared modal scaffolding (overlay, .modal, .modal-toolbar, .form-content,
       .section-label, .section-hint, .field, .picker-trigger, .btn-outline,
       .btn-danger-text, .btn-cta, .field-error) lives in
       src/theme/form-modal.scss to keep this component under the 4 kB
       anyComponentStyle budget. */

    .icon-button {
      min-width: 44px;
      min-height: 44px;
      border: none;
      background: transparent;
      color: #fff;
      font-size: 16px;
      font-weight: 500;
      width: 44px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon-button ion-icon {
      font-size: 22px;
    }

    .icon-button--danger {
      color: var(--ion-color-danger);
    }

    .ingredient-item__detail {
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }

    .ingredient-empty,
    .ingredient-item,
    .nutrition-card {
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 16px;
    }

    .ingredient-empty.invalid {
      border-color: rgba(244, 67, 54, 0.4);
    }

    .ingredient-empty {
      text-align: center;
    }

    .ingredient-empty-title,
    .ingredient-item__name {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }

    .ingredient-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ingredient-item__row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
    }

    .ingredient-item__info {
      min-width: 0;
      flex: 1;
    }

    .ingredient-item__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .nutrition-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .nutrition-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-variant-numeric: tabular-nums;
    }

    .nutrition-label {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .nutrition-value {
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
    }

    /* Dashed variant of the shared .btn-outline used inside dish ingredient list */
    .btn-outline {
      border-style: dashed;
      border-color: rgba(var(--ion-color-primary-rgb), 0.5);
    }

    @media (max-width: 480px) {
      .ingredient-item__grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DishEditModalComponent implements OnChanges {
  @ViewChild('ingredientPicker') private ingredientPicker?: BottomSheetPickerComponent;
  @ViewChild('unitPicker') private unitPicker?: BottomSheetPickerComponent;
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

  showErrors = false;
  activeUnitRowId: string | null = null;

  constructor() {
    addIcons({ chevronBackOutline, chevronDownOutline, closeOutline });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form']) {
      this.formSignal.set(cloneForm(this.form));
    }
    if (changes['isOpen']?.currentValue) {
      this.showErrors = false;
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
    this.showErrors = true;
    if (!this.isValid()) {
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

  isServingsValid(): boolean {
    const value = this.formSignal().servings;
    return (
      value !== null && value !== undefined && !Number.isNaN(value) && value >= 0.5 && value <= 20
    );
  }

  private focusFirstInvalidField(): void {
    const v = this.formSignal();
    const firstErrorSelector = !v.name.trim()
      ? 'input'
      : !this.isServingsValid()
        ? 'input[type="number"]'
        : v.items.length === 0
          ? '.ingredient-empty'
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

  private isValid(): boolean {
    const v = this.formSignal();
    return (
      v.name.trim().length > 0 &&
      this.isServingsValid() &&
      v.items.length > 0 &&
      v.items.every((item) => item.amount_value > 0 && item.unit_id.trim().length > 0)
    );
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
