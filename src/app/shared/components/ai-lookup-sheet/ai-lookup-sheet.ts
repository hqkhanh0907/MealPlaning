/**
 * AiLookupSheet — bottom sheet preview cho F-01 AI Ingredient Lookup.
 *
 * Source-of-truth: `docs/5-development/phase-1.5b-ai-foundation.md` §4.1.
 *
 * Responsibilities:
 *   1. Hiện dữ liệu AI trả ở dạng form chỉnh sửa (8 fields).
 *   2. Cho user edit trước khi save (Decision #1 — AI là chính, save = INSERT
 *      hoặc UPDATE tuỳ `mode`).
 *   3. Emit `(saved)` với payload đầy đủ; caller (ingredient-edit page) gọi
 *      IngredientStore.add()/edit() — sheet KHÔNG tự ghi DB để dễ test.
 *   4. Hiện confidence badge (Decision #11 — text + color).
 *
 * Pattern tham khảo: `dishes-using-sheet` (IonModal + breakpoints + handle).
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, closeOutline } from 'ionicons/icons';

import {
  INGREDIENT_CATEGORIES,
  type IngredientCategory,
} from '../../../core/models/management.constants';
import { AppFormField } from '../../forms/form-field/form-field';
import { BottomSheetPicker, type PickerOption } from '../bottom-sheet-picker/bottom-sheet-picker';
import type { IngredientLookupResult } from '../../../core/services/ai/nutrition-ai';

/**
 * Mode hiển thị bottom sheet:
 *   - `create`: insert ingredient mới (`source = 'ai'`).
 *   - `update`: user chọn "Cập nhật cũ" trong duplicate alert; sheet hiển banner
 *     "Đang cập nhật ‘<name>’" và emit payload với `existingIngredientId`.
 *
 * Decision #4 — pre-fill data AI; save = UPDATE record cũ.
 */
export type AiLookupSheetMode = 'create' | 'update';

/**
 * Payload emit khi user bấm Lưu — caller chịu trách nhiệm ghi DB.
 */
export interface AiLookupSavePayload {
  mode: AiLookupSheetMode;
  /** Chỉ set khi mode === 'update'. */
  existingIngredientId?: string;
  name: string;
  category: IngredientCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

@Component({
  selector: 'app-ai-lookup-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    AppFormField,
    BottomSheetPicker,
  ],
  templateUrl: './ai-lookup-sheet.html',
  styleUrl: './ai-lookup-sheet.scss',
})
export class AiLookupSheet {
  /** Two-way: caller set true để mở. */
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  private readonly _isOpen = signal(false);

  /** AI lookup result — required khi isOpen=true. */
  @Input() set result(value: IngredientLookupResult | null) {
    this._result.set(value);
    if (value) {
      this.form.set({
        name: value.name,
        category: value.category,
        calories: value.calories,
        protein: value.protein,
        carbs: value.carbs,
        fat: value.fat,
        fiber: value.fiber,
      });
      this.showErrors.set(false);
    }
  }
  private readonly _result = signal<IngredientLookupResult | null>(null);

  /** create | update — Decision #3 + #4. */
  @Input() mode: AiLookupSheetMode = 'create';

  /** Required khi mode='update' — id ingredient cũ trong DB. */
  @Input() existingIngredientId: string | null = null;

  /** Emit khi user bấm Lưu. */
  @Output() readonly saved = new EventEmitter<AiLookupSavePayload>();

  /** Emit khi sheet bị dismiss (user bấm X / kéo xuống / bấm Hủy). */
  @Output() readonly dismissed = new EventEmitter<void>();

  // --------------------------------------------------------------------------
  // Form state
  // --------------------------------------------------------------------------

  protected readonly form = signal<{
    name: string;
    category: IngredientCategory;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }>({
    name: '',
    category: 'Khác',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  protected readonly showErrors = signal(false);
  protected readonly categories = INGREDIENT_CATEGORIES;
  protected readonly categoryOptions: PickerOption[] = INGREDIENT_CATEGORIES.map((c) => ({
    value: c,
    label: c,
  }));

  @ViewChild('categoryPicker') private categoryPicker?: BottomSheetPicker;

  protected readonly resultView = this._result.asReadonly();

  protected readonly nameInvalid = computed(() => !this.form().name.trim());
  protected readonly canSave = computed(() => !this.nameInvalid());

  protected readonly confidenceLabel = computed(() => {
    const r = this._result();
    if (!r) return '';
    return r.confidence === 'high'
      ? 'Độ tin cậy cao'
      : r.confidence === 'medium'
        ? 'Trung bình'
        : 'Thấp';
  });

  /** CSS modifier class for confidence badge — Decision #11. */
  protected readonly confidenceClass = computed(() => {
    const r = this._result();
    return r ? `als-confidence--${r.confidence}` : '';
  });

  constructor() {
    addIcons({ chevronDownOutline, closeOutline });
  }

  // --------------------------------------------------------------------------
  // Two-way ngModel sync helpers (signal-based form)
  // --------------------------------------------------------------------------

  protected updateField<K extends keyof ReturnType<typeof this.form>>(
    key: K,
    value: ReturnType<typeof this.form>[K],
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected openCategoryPicker(): void {
    this.categoryPicker?.open();
  }

  protected onCategorySelected(value: string): void {
    this.updateField('category', value as IngredientCategory);
  }

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  protected onSave(): void {
    if (!this.canSave()) {
      this.showErrors.set(true);
      return;
    }
    const f = this.form();
    this.saved.emit({
      mode: this.mode,
      existingIngredientId:
        this.mode === 'update' && this.existingIngredientId ? this.existingIngredientId : undefined,
      name: f.name.trim().replace(/\s+/g, ' '),
      category: f.category,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber,
    });
    this._isOpen.set(false);
  }

  protected onCancel(): void {
    this._isOpen.set(false);
    this.dismissed.emit();
  }

  protected onIonDismiss(): void {
    this._isOpen.set(false);
    this.dismissed.emit();
  }
}
