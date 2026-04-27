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
import { chevronBackOutline, chevronDownOutline } from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../../core/models/management.constants';
import type { UnitModel } from '../../../core/models/management.model';
import type { NutritionBasisUnit } from '../../../core/models/management.types';
import {
  BottomSheetPickerComponent,
  type PickerOption,
} from '../bottom-sheet-picker/bottom-sheet-picker.component';
import { FormFieldComponent } from '../../forms';

export interface IngredientEditUnitFormValue {
  local_id: string;
  unit_id: string;
  factor_to_basis: number;
  is_default: boolean;
  display_label: string;
  is_approximate: boolean;
  short_name_vi: string;
}

export interface IngredientEditFormValue {
  name: string;
  category: string;
  nutrition_basis_unit: NutritionBasisUnit;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  density_g_per_ml: number | null;
  units: IngredientEditUnitFormValue[];
}

@Component({
  selector: 'app-ingredient-edit-modal',
  standalone: true,
  imports: [FormsModule, IonIcon, BottomSheetPickerComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="overlay">
        <section
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingredient-modal-title"
        >
          <div class="modal-toolbar">
            <button
              type="button"
              class="toolbar-icon-button"
              (click)="dismissed.emit()"
              aria-label="Quay lại"
            >
              <ion-icon name="chevron-back-outline" />
            </button>
            <h2 id="ingredient-modal-title">{{ title }}</h2>
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
            <app-form-field
              label="Tên nguyên liệu"
              inputId="ingr-field-name"
              errorId="err-ingr-name"
              [invalid]="showErrors && !form.name.trim()"
              errorMessage="Vui lòng nhập tên nguyên liệu"
            >
              <input
                id="ingr-field-name"
                class="input-native"
                #nameInput
                [(ngModel)]="form.name"
                [attr.aria-invalid]="showErrors && !form.name.trim() ? 'true' : null"
                [attr.aria-describedby]="showErrors && !form.name.trim() ? 'err-ingr-name' : null"
              />
            </app-form-field>

            <app-form-field
              label="Nhóm"
              inputId="ingr-field-category"
              errorId="err-ingr-category"
              [invalid]="showErrors && !form.category.trim()"
              errorMessage="Vui lòng chọn nhóm nguyên liệu"
            >
              <button
                type="button"
                id="ingr-field-category"
                class="picker-trigger--floating"
                (click)="openCategoryPicker()"
                [attr.aria-invalid]="showErrors && !form.category.trim() ? 'true' : null"
                [attr.aria-describedby]="
                  showErrors && !form.category.trim() ? 'err-ingr-category' : null
                "
              >
                <span>{{ form.category || 'Chọn nhóm nguyên liệu' }}</span>
                <ion-icon name="chevron-down-outline" aria-hidden="true" />
              </button>
            </app-form-field>

            <div class="section-label">Tính dinh dưỡng theo</div>
            <div class="segmented" role="tablist" aria-label="Tính dinh dưỡng theo">
              <button
                type="button"
                class="segment-btn"
                [class.active]="form.nutrition_basis_unit === 'g'"
                (click)="setBasisUnit('g')"
              >
                100g
              </button>
              <button
                type="button"
                class="segment-btn"
                [class.active]="form.nutrition_basis_unit === 'ml'"
                (click)="setBasisUnit('ml')"
              >
                100ml
              </button>
            </div>

            <app-form-field
              label="Calories (kcal)"
              inputId="ingr-field-calories"
              errorId="err-ingr-calories"
              [invalid]="showErrors && isNegative(form.calories)"
              errorMessage="Calories không được nhỏ hơn 0"
            >
              <input
                id="ingr-field-calories"
                class="input-native"
                type="number"
                inputmode="decimal"
                [ngModel]="form.calories"
                (ngModelChange)="onNutritionChange('calories', $event)"
                min="0"
                step="0.1"
                [attr.aria-invalid]="showErrors && isNegative(form.calories) ? 'true' : null"
                [attr.aria-describedby]="
                  showErrors && isNegative(form.calories) ? 'err-ingr-calories' : null
                "
              />
            </app-form-field>

            <div class="nutrition-grid">
              <app-form-field label="Protein (g)" inputId="ingr-field-protein">
                <input
                  id="ingr-field-protein"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [ngModel]="form.protein"
                  (ngModelChange)="onNutritionChange('protein', $event)"
                  min="0"
                  step="0.1"
                />
              </app-form-field>
              <app-form-field label="Carbs (g)" inputId="ingr-field-carbs">
                <input
                  id="ingr-field-carbs"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [ngModel]="form.carbs"
                  (ngModelChange)="onNutritionChange('carbs', $event)"
                  min="0"
                  step="0.1"
                />
              </app-form-field>
              <app-form-field label="Fat (g)" inputId="ingr-field-fat">
                <input
                  id="ingr-field-fat"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [ngModel]="form.fat"
                  (ngModelChange)="onNutritionChange('fat', $event)"
                  min="0"
                  step="0.1"
                />
              </app-form-field>
              <app-form-field label="Chất xơ (g)" inputId="ingr-field-fiber">
                <input
                  id="ingr-field-fiber"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [ngModel]="form.fiber"
                  (ngModelChange)="onNutritionChange('fiber', $event)"
                  min="0"
                  step="0.1"
                />
              </app-form-field>
            </div>

            <div class="section-label">Đơn vị có thể nhập khi thêm vào món</div>
            <p class="section-hint">
              Mỗi nguyên liệu cần ít nhất 1 đơn vị hợp lệ và đúng 1 đơn vị mặc định.
            </p>

            @if (form.units.length === 0) {
              <div class="unit-empty" [class.invalid]="showErrors && unitErrors.length > 0">
                <div class="unit-empty-title">Chưa có đơn vị nào</div>
                <div class="unit-empty-copy">
                  Thêm đơn vị quen thuộc như quả, g, ml hoặc đơn vị riêng của nguyên liệu này.
                </div>
                <button type="button" class="btn-outline" (click)="openUnitPicker()">
                  + Thêm đơn vị đầu tiên
                </button>
              </div>
            } @else {
              <div class="unit-list" [class.invalid]="showErrors && unitErrors.length > 0">
                @for (unit of form.units; track unit.local_id) {
                  <article class="unit-card">
                    <div class="unit-card__top">
                      <div class="unit-card__title">{{ unitTitle(unit) }}</div>
                      <div class="unit-card__badges">
                        @if (unit.is_default) {
                          <span class="unit-badge badge-default">mặc định</span>
                        }
                        <span
                          class="unit-badge"
                          [class.badge-approx]="unit.is_approximate"
                          [class.badge-exact]="!unit.is_approximate"
                        >
                          {{ unit.is_approximate ? 'ước lượng' : 'chuẩn' }}
                        </span>
                      </div>
                    </div>

                    <div class="unit-grid">
                      <app-form-field
                        label="Hiển thị"
                        [inputId]="'ingr-unit-display-' + unit.local_id"
                      >
                        <input
                          [id]="'ingr-unit-display-' + unit.local_id"
                          class="input-native"
                          [ngModel]="unit.display_label"
                          (ngModelChange)="
                            updateUnit(unit.local_id, 'display_label', normalizeText($event))
                          "
                          [placeholder]="unit.short_name_vi"
                        />
                      </app-form-field>
                      <app-form-field
                        [label]="'1 đơn vị = ? ' + form.nutrition_basis_unit"
                        [inputId]="'ingr-unit-factor-' + unit.local_id"
                      >
                        <input
                          [id]="'ingr-unit-factor-' + unit.local_id"
                          class="input-native"
                          type="number"
                          inputmode="decimal"
                          [ngModel]="unit.factor_to_basis"
                          (ngModelChange)="
                            updateUnit(unit.local_id, 'factor_to_basis', normalizeNumber($event, 0))
                          "
                          min="0.001"
                          step="0.001"
                        />
                      </app-form-field>
                    </div>

                    <div class="unit-meta">
                      {{ unitExample(unit) }}
                    </div>

                    <div class="unit-actions">
                      <button
                        type="button"
                        class="unit-action"
                        (click)="markDefault(unit.local_id)"
                      >
                        Đặt mặc định
                      </button>
                      <button
                        type="button"
                        class="unit-action unit-action--danger"
                        (click)="removeUnit(unit.local_id)"
                      >
                        Xóa
                      </button>
                    </div>
                  </article>
                }
              </div>
              <button type="button" class="btn-outline" (click)="openUnitPicker()">
                + Thêm đơn vị
              </button>
            }

            @if (showErrors && unitErrors.length > 0) {
              @for (error of unitErrors; track error) {
                <div class="field-error">{{ error }}</div>
              }
            }

            <div class="info-card">
              <div class="info-card-title">Quy đổi g ↔ ml (tùy chọn)</div>
              <div class="info-card-copy">
                Chỉ nhập mật độ khi cần quy đổi giữa g và ml. Nếu chưa có quy đổi phù hợp, app sẽ
                báo không thể dùng đơn vị đó.
              </div>
            </div>

            <app-form-field label="Mật độ (g/ml) — tùy chọn" inputId="ingr-field-density">
              <input
                id="ingr-field-density"
                class="input-native"
                type="number"
                inputmode="decimal"
                [ngModel]="form.density_g_per_ml"
                (ngModelChange)="onDensityChange($event)"
                min="0"
                step="0.001"
              />
            </app-form-field>

            <button type="button" class="btn-cta" [disabled]="saving" (click)="submit()">
              {{ saving ? 'Đang lưu...' : saveLabel }}
            </button>

            @if (allowDelete) {
              <button type="button" class="btn-danger-text" (click)="deleteRequested.emit()">
                Xóa nguyên liệu
              </button>
            }
          </div>

          <app-bottom-sheet-picker
            #categoryPicker
            title="Chọn nhóm nguyên liệu"
            [value]="form.category"
            [options]="categoryOptions"
            (valueChange)="onCategorySelected($event)"
          />

          <app-bottom-sheet-picker
            #unitPicker
            title="Thêm đơn vị"
            [options]="unitOptions"
            [searchable]="true"
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

    .info-card-copy,
    .unit-meta {
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }

    .segmented {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px;
      padding: 4px;
      border-radius: 12px;
      background: var(--bg-muted);
    }

    .segment-btn {
      min-height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      font-size: 14px;
      font-weight: 500;
    }

    .segment-btn.active {
      border-color: transparent;
      background: var(--bg-card);
      box-shadow: var(--shadow-md);
      color: var(--text-primary);
      font-weight: 600;
    }

    .nutrition-grid,
    .unit-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .unit-empty,
    .info-card,
    .unit-card {
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 16px;
    }

    .unit-empty.invalid,
    .unit-list.invalid {
      border-color: rgba(244, 67, 54, 0.4);
    }

    .unit-empty {
      text-align: center;
    }

    .unit-empty-title,
    .info-card-title,
    .unit-card__title {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }

    .unit-empty-copy {
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.5;
      margin: 8px 0 16px;
    }

    .unit-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .unit-card__top,
    .unit-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .unit-card__badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .unit-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius-xs);
      font-size: 11px;
      font-weight: 500;
      line-height: 1.4;
    }

    .badge-default {
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      color: var(--primary-700);
    }

    .badge-exact {
      background: rgba(76, 175, 80, 0.12);
      color: var(--ion-color-success);
    }

    .badge-approx {
      background: rgba(255, 193, 7, 0.16);
      color: #b26a00;
    }

    .unit-actions {
      justify-content: flex-start;
      margin-top: 12px;
    }

    .unit-action {
      min-height: 44px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      padding: 10px 16px;
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.32);
      background: transparent;
      color: var(--primary-700);
      font-weight: 500;
    }

    .unit-action--danger {
      border: none;
      background: transparent;
      color: var(--ion-color-danger);
      font-weight: 500;
      padding: 0;
    }

    @media (max-width: 480px) {
      .nutrition-grid,
      .unit-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class IngredientEditModalComponent implements OnChanges {
  @ViewChild('categoryPicker') private categoryPicker?: BottomSheetPickerComponent;
  @ViewChild('unitPicker') private unitPicker?: BottomSheetPickerComponent;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  @Input() isOpen = false;
  @Input() title = 'Thêm nguyên liệu';
  @Input() saveLabel = 'Lưu nguyên liệu';
  @Input() saving = false;
  @Input() allowDelete = false;
  @Input() availableUnits: UnitModel[] = [];
  @Input() form: IngredientEditFormValue = {
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
  };
  @Output() dismissed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<IngredientEditFormValue>();
  @Output() deleteRequested = new EventEmitter<void>();

  readonly categories = INGREDIENT_CATEGORIES;
  showErrors = false;

  constructor() {
    addIcons({ chevronBackOutline, chevronDownOutline });
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

  get categoryOptions(): PickerOption[] {
    return this.categories.map((category) => ({ value: category, label: category }));
  }

  get unitOptions(): PickerOption[] {
    const usedIds = new Set(this.form.units.map((unit) => unit.unit_id));
    return this.availableUnits
      .filter((unit) => !usedIds.has(unit.id))
      .map((unit) => ({
        value: unit.id,
        label: unit.display_name_vi,
        description: unit.is_approximate === 1 ? 'Đơn vị ước lượng' : unit.short_name_vi,
      }));
  }

  get unitErrors(): string[] {
    const errors: string[] = [];
    if (this.form.units.length === 0) {
      errors.push('Cần ít nhất 1 đơn vị hợp lệ.');
    }
    if (
      this.form.units.length > 0 &&
      this.form.units.filter((unit) => unit.is_default).length !== 1
    ) {
      errors.push('Chọn đúng 1 đơn vị mặc định trước khi lưu.');
    }
    if (this.form.units.some((unit) => unit.factor_to_basis <= 0)) {
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
    this.form.category = category;
  }

  onUnitSelected(unitId: string): void {
    const unit = this.availableUnits.find((item) => item.id === unitId);
    if (!unit) {
      return;
    }

    const factor = this.getSuggestedFactor(unit);
    this.form.units = [
      ...this.form.units,
      {
        local_id: `${unit.id}-${crypto.randomUUID()}`,
        unit_id: unit.id,
        factor_to_basis: factor,
        is_default: this.form.units.length === 0,
        display_label: unit.short_name_vi,
        is_approximate: unit.is_approximate === 1,
        short_name_vi: unit.short_name_vi,
      },
    ];
  }

  setBasisUnit(unit: NutritionBasisUnit): void {
    this.form.nutrition_basis_unit = unit;
    this.form.units = this.form.units.map((item) => {
      const definition = this.availableUnits.find((candidate) => candidate.id === item.unit_id);
      if (!definition) {
        return item;
      }
      const suggestedFactor = this.getSuggestedFactor(definition);
      const usesGlobalDefault =
        (unit === 'g' && definition.unit_type === 'mass' && definition.base_factor_g !== null) ||
        (unit === 'ml' && definition.unit_type === 'volume' && definition.base_factor_ml !== null);
      return usesGlobalDefault ? { ...item, factor_to_basis: suggestedFactor } : item;
    });
  }

  normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  normalizeNumber(value: unknown, fallback: number | null): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback ?? 0);
  }

  onDensityChange(value: string | number | null): void {
    if (value === null || value === '' || Number.isNaN(Number(value))) {
      this.form.density_g_per_ml = null;
      return;
    }
    this.form.density_g_per_ml = Number(value);
  }

  isNegative(value: number | null): boolean {
    return value !== null && value < 0;
  }

  onNutritionChange(
    field: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber',
    value: string | number | null,
  ): void {
    if (value === null || value === '' || value === undefined) {
      this.form[field] = null;
      return;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    this.form[field] = Number.isFinite(parsed) ? parsed : null;
  }

  updateUnit(
    localId: string,
    field: 'display_label' | 'factor_to_basis',
    value: string | number,
  ): void {
    this.form.units = this.form.units.map((unit) =>
      unit.local_id === localId ? { ...unit, [field]: value } : unit,
    );
  }

  markDefault(localId: string): void {
    this.form.units = this.form.units.map((unit) => ({
      ...unit,
      is_default: unit.local_id === localId,
    }));
  }

  removeUnit(localId: string): void {
    const nextUnits = this.form.units.filter((unit) => unit.local_id !== localId);
    if (nextUnits.length === 1) {
      nextUnits[0] = { ...nextUnits[0], is_default: true };
    }
    this.form.units = nextUnits;
  }

  unitTitle(unit: IngredientEditUnitFormValue): string {
    return unit.is_approximate
      ? `≈ ${unit.display_label || unit.short_name_vi}`
      : unit.display_label || unit.short_name_vi;
  }

  unitExample(unit: IngredientEditUnitFormValue): string {
    const label = unit.display_label || unit.short_name_vi;
    return `Hiển thị: ${label} · 1 ${label} ≈ ${this.formatNumber(unit.factor_to_basis)}${this.form.nutrition_basis_unit}`;
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
      category: this.form.category.trim(),
      calories: this.form.calories ?? 0,
      protein: this.form.protein ?? 0,
      carbs: this.form.carbs ?? 0,
      fat: this.form.fat ?? 0,
      fiber: this.form.fiber ?? 0,
      units: this.form.units.map((unit) => ({
        ...unit,
        display_label: unit.display_label.trim(),
      })),
    });
  }

  private isValid(): boolean {
    return (
      this.form.name.trim().length > 0 &&
      this.form.category.trim().length > 0 &&
      !this.isNegative(this.form.calories) &&
      this.unitErrors.length === 0
    );
  }

  private focusFirstInvalidField(): void {
    const firstErrorSelector = !this.form.name.trim()
      ? 'input'
      : !this.form.category.trim()
        ? '.picker-trigger'
        : this.isNegative(this.form.calories)
          ? 'input[type="number"]'
          : this.unitErrors.length > 0
            ? '.unit-empty, .unit-list'
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

  private getSuggestedFactor(unit: UnitModel): number {
    if (
      this.form.nutrition_basis_unit === 'g' &&
      unit.unit_type === 'mass' &&
      unit.base_factor_g !== null
    ) {
      return unit.base_factor_g;
    }
    if (
      this.form.nutrition_basis_unit === 'ml' &&
      unit.unit_type === 'volume' &&
      unit.base_factor_ml !== null
    ) {
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
