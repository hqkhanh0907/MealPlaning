import { CommonModule } from '@angular/common';
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
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronDownOutline, closeOutline } from 'ionicons/icons';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import {
  BottomSheetPickerComponent,
  type PickerOption,
} from '../bottom-sheet-picker/bottom-sheet-picker.component';

export interface DishIngredientFormItem {
  local_id: string;
  ingredient_id: string;
  amount_value: number;
  unit_id: string;
}

export interface DishEditFormValue {
  name: string;
  description: string;
  servings: number;
  items: DishIngredientFormItem[];
}

@Component({
  selector: 'app-dish-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, BottomSheetPickerComponent],
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

            <div class="input-wrapper" [class.invalid]="showErrors && !form.name.trim()">
              <label
                class="input-label"
                for="dish-field-1"
                [class.invalid]="showErrors && !form.name.trim()"
                >Tên món ăn</label
              >
              <input
                id="dish-field-1"
                class="input-native"
                #nameInput
                [(ngModel)]="form.name"
                placeholder="Ví dụ: Cơm trứng"
              />
            </div>
            @if (showErrors && !form.name.trim()) {
              <div class="field-error">Vui lòng nhập tên món ăn</div>
            }

            <div class="input-wrapper">
              <label class="input-label" for="dish-field-2">Mô tả</label>
              <textarea
                id="dish-field-2"
                class="input-native"
                rows="2"
                style="resize: none;"
                [(ngModel)]="form.description"
                placeholder="Mô tả ngắn (tùy chọn)"
              ></textarea>
            </div>

            <div
              class="input-wrapper"
              [class.invalid]="showErrors && (form.servings < 0.5 || form.servings > 20)"
            >
              <label
                class="input-label"
                for="dish-field-3"
                [class.invalid]="showErrors && (form.servings < 0.5 || form.servings > 20)"
                >Số phần ăn</label
              >
              <input
                id="dish-field-3"
                class="input-native"
                type="number"
                inputmode="decimal"
                [(ngModel)]="form.servings"
                min="0.5"
                max="20"
                step="0.5"
              />
            </div>
            @if (showErrors && (form.servings < 0.5 || form.servings > 20)) {
              <div class="field-error">Số phần ăn cần nằm trong khoảng 0.5 đến 20.</div>
            }

            <div class="section-label">Nguyên liệu</div>

            @if (form.items.length === 0) {
              <div class="ingredient-empty" [class.invalid]="showErrors && form.items.length === 0">
                <div class="ingredient-empty-title">Chưa có nguyên liệu nào</div>
                <button type="button" class="btn-outline" (click)="openIngredientPicker()">
                  + Thêm nguyên liệu đầu tiên
                </button>
              </div>
            } @else {
              <div class="ingredient-list">
                @for (item of form.items; track item.local_id) {
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
                      <div
                        class="input-wrapper"
                        [class.invalid]="showErrors && !(item.amount_value > 0)"
                      >
                        <label
                          class="input-label"
                          [attr.for]="'dish-amount-' + item.local_id"
                          [class.invalid]="showErrors && !(item.amount_value > 0)"
                          >Số lượng</label
                        >
                        <input
                          [id]="'dish-amount-' + item.local_id"
                          class="input-native"
                          type="number"
                          inputmode="decimal"
                          [ngModel]="item.amount_value"
                          (ngModelChange)="updateAmount(item.local_id, $event)"
                          min="0.1"
                          max="10000"
                          step="0.1"
                        />
                      </div>

                      <div class="input-wrapper">
                        <label class="input-label" [attr.for]="'dish-unit-' + item.local_id"
                          >Đơn vị</label
                        >
                        <button
                          type="button"
                          [id]="'dish-unit-' + item.local_id"
                          class="picker-trigger--floating"
                          (click)="openUnitPicker(item.local_id)"
                        >
                          <span>{{ unitLabel(item) }}</span>
                          <ion-icon name="chevron-down-outline" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>

              <button type="button" class="btn-outline" (click)="openIngredientPicker()">
                + Thêm nguyên liệu
              </button>
            }

            @if (showErrors && form.items.length === 0) {
              <div class="field-error">Cần ít nhất 1 nguyên liệu trước khi lưu món ăn.</div>
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
  @Input() form: DishEditFormValue = {
    name: '',
    description: '',
    servings: 1,
    items: [],
  };
  @Output() dismissed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<DishEditFormValue>();
  @Output() deleteRequested = new EventEmitter<void>();

  showErrors = false;
  activeUnitRowId: string | null = null;

  constructor() {
    addIcons({ chevronBackOutline, chevronDownOutline, closeOutline });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.showErrors = false;
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
    const item = this.form.items.find((candidate) => candidate.local_id === this.activeUnitRowId);
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
      this.form.items.find((candidate) => candidate.local_id === this.activeUnitRowId)?.unit_id ??
      null
    );
  }

  get previewTotals(): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } {
    return this.form.items.reduce(
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

    this.form.items = [
      ...this.form.items,
      {
        local_id: this.createLocalId('dish-item'),
        ingredient_id: ingredient.id,
        amount_value: 1,
        unit_id: defaultUnit.unit_id,
      },
    ];
  }

  onUnitSelected(unitId: string): void {
    if (!this.activeUnitRowId) {
      return;
    }

    this.form.items = this.form.items.map((item) =>
      item.local_id === this.activeUnitRowId ? { ...item, unit_id: unitId } : item,
    );
  }

  updateAmount(localId: string, value: string | number): void {
    const parsed = Number(value);
    this.form.items = this.form.items.map((item) =>
      item.local_id === localId
        ? { ...item, amount_value: Number.isFinite(parsed) ? parsed : 0 }
        : item,
    );
  }

  removeItem(localId: string): void {
    this.form.items = this.form.items.filter((item) => item.local_id !== localId);
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

    this.submitted.emit({
      ...this.form,
      name: this.form.name.trim(),
      description: this.form.description.trim(),
      items: this.form.items.map((item) => ({ ...item })),
    });
  }

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private focusFirstInvalidField(): void {
    const firstErrorSelector = !this.form.name.trim()
      ? 'input'
      : this.form.servings < 0.5 || this.form.servings > 20
        ? 'input[type="number"]'
        : this.form.items.length === 0
          ? '.ingredient-empty'
          : null;

    setTimeout(() => {
      if (!this.form.name.trim()) {
        this.nameInput?.nativeElement.focus();
      }

      const target = firstErrorSelector
        ? (document.querySelector(firstErrorSelector) as HTMLElement | null)
        : null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private isValid(): boolean {
    return (
      this.form.name.trim().length > 0 &&
      this.form.servings >= 0.5 &&
      this.form.servings <= 20 &&
      this.form.items.length > 0 &&
      this.form.items.every((item) => item.amount_value > 0 && item.unit_id.trim().length > 0)
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
