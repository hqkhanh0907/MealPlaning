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
import {
  BottomSheetPickerComponent,
  type PickerOption,
} from '../bottom-sheet-picker/bottom-sheet-picker.component';
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
  imports: [FormField, IonIcon, BottomSheetPickerComponent, FormFieldComponent],
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
              [invalid]="showErrors && !nameValid()"
              errorMessage="Vui lòng nhập tên nguyên liệu"
            >
              <input
                id="ingr-field-name"
                class="input-native"
                #nameInput
                [formField]="ingredientForm.name"
                [attr.aria-invalid]="showErrors && !nameValid() ? 'true' : null"
                [attr.aria-describedby]="showErrors && !nameValid() ? 'err-ingr-name' : null"
              />
            </app-form-field>

            <app-form-field
              label="Nhóm"
              inputId="ingr-field-category"
              errorId="err-ingr-category"
              [invalid]="showErrors && !categoryValid()"
              errorMessage="Vui lòng chọn nhóm nguyên liệu"
            >
              <button
                type="button"
                id="ingr-field-category"
                class="picker-trigger--floating"
                (click)="openCategoryPicker()"
                [attr.aria-invalid]="showErrors && !categoryValid() ? 'true' : null"
                [attr.aria-describedby]="
                  showErrors && !categoryValid() ? 'err-ingr-category' : null
                "
              >
                <span>{{ formSignal().category || 'Chọn nhóm nguyên liệu' }}</span>
                <ion-icon name="chevron-down-outline" aria-hidden="true" />
              </button>
            </app-form-field>

            <div class="section-label">Tính dinh dưỡng theo</div>
            <div class="segment-control" role="tablist" aria-label="Tính dinh dưỡng theo">
              <button
                type="button"
                class="segment-button"
                [class.selected]="formSignal().nutrition_basis_unit === 'g'"
                (click)="setBasisUnit('g')"
              >
                100g
              </button>
              <button
                type="button"
                class="segment-button"
                [class.selected]="formSignal().nutrition_basis_unit === 'ml'"
                (click)="setBasisUnit('ml')"
              >
                100ml
              </button>
            </div>

            <app-form-field
              label="Calories (kcal)"
              inputId="ingr-field-calories"
              errorId="err-ingr-calories"
              [invalid]="showErrors && isNegative(formSignal().calories)"
              errorMessage="Calories không được nhỏ hơn 0"
            >
              <input
                id="ingr-field-calories"
                class="input-native"
                type="number"
                inputmode="decimal"
                [formField]="ingredientForm.calories"
                step="0.1"
                [attr.aria-invalid]="
                  showErrors && isNegative(formSignal().calories) ? 'true' : null
                "
                [attr.aria-describedby]="
                  showErrors && isNegative(formSignal().calories) ? 'err-ingr-calories' : null
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
                  [formField]="ingredientForm.protein"
                  step="0.1"
                />
              </app-form-field>
              <app-form-field label="Carbs (g)" inputId="ingr-field-carbs">
                <input
                  id="ingr-field-carbs"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [formField]="ingredientForm.carbs"
                  step="0.1"
                />
              </app-form-field>
              <app-form-field label="Fat (g)" inputId="ingr-field-fat">
                <input
                  id="ingr-field-fat"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [formField]="ingredientForm.fat"
                  step="0.1"
                />
              </app-form-field>
              <app-form-field label="Chất xơ (g)" inputId="ingr-field-fiber">
                <input
                  id="ingr-field-fiber"
                  class="input-native"
                  type="number"
                  inputmode="decimal"
                  [formField]="ingredientForm.fiber"
                  step="0.1"
                />
              </app-form-field>
            </div>

            <div class="section-label">Đơn vị có thể nhập khi thêm vào món</div>
            <p class="section-hint">
              Mỗi nguyên liệu cần ít nhất 1 đơn vị hợp lệ và đúng 1 đơn vị mặc định.
            </p>

            @if (formSignal().units.length === 0) {
              <div class="unit-empty" [class.invalid]="showErrors && unitErrors().length > 0">
                <div class="unit-empty-title">Chưa có đơn vị nào</div>
                <div class="unit-empty-copy">
                  Thêm đơn vị quen thuộc như quả, g, ml hoặc đơn vị riêng của nguyên liệu này.
                </div>
                <button type="button" class="btn-outline" (click)="openUnitPicker()">
                  + Thêm đơn vị đầu tiên
                </button>
              </div>
            } @else {
              <div class="unit-list" [class.invalid]="showErrors && unitErrors().length > 0">
                @for (unit of formSignal().units; track unit.local_id; let i = $index) {
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
                          [formField]="ingredientForm.units[i].display_label"
                          [placeholder]="unit.short_name_vi"
                        />
                      </app-form-field>
                      <app-form-field
                        [label]="'1 đơn vị = ? ' + formSignal().nutrition_basis_unit"
                        [inputId]="'ingr-unit-factor-' + unit.local_id"
                      >
                        <input
                          [id]="'ingr-unit-factor-' + unit.local_id"
                          class="input-native"
                          type="number"
                          inputmode="decimal"
                          [formField]="ingredientForm.units[i].factor_to_basis"
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

            @if (showErrors && unitErrors().length > 0) {
              @for (error of unitErrors(); track error) {
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
                [formField]="ingredientForm.density_g_per_ml"
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
            [value]="formSignal().category"
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

    /* Segment control styles sống ở src/theme/segment-control.scss
       (.segment-control / .segment-button / .selected) — canonical §8.8. */

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
