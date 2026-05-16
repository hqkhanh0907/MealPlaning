/**
 * Dish edit page — gram-only revision (schema v6).
 *
 * Each ingredient row stores just (ingredient_id, gram_weight). No unit
 * picker. Nutrition preview = sum(ingredient.calories * gram_weight / 100).
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  type OnInit,
  ViewChild,
  afterNextRender,
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
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, closeOutline, sparklesOutline, trashOutline } from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import { IngredientRepository } from '../../../core/repositories/ingredient.repository';
import type { HasUnsavedChanges } from '../../../core/guards/unsaved-changes-guard';
import type { MealTag } from '../../../core/models/management.types';
import { DishStore } from '../../../core/stores/dish.store';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import { ProfileStore } from '../../../core/stores/profile.store';
import { DishAutofillApplier } from '../../../core/services/ai/dish-autofill-applier';
import { NutritionAi, type DishAutofillResult } from '../../../core/services/ai/nutrition-ai';
import { GEMINI_ERROR_TOAST, GeminiError } from '../../../core/services/ai/gemini-types';
import {
  BottomSheetPicker,
  type PickerOption,
} from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  DishAutofillSheet,
  type DishAutofillAppliedPayload,
} from '../../../shared/components/dish-autofill-sheet/dish-autofill-sheet';
import { AppFormField } from '../../../shared/forms';
import { AiOfflineBanner } from '../../../shared/components/ai-offline-banner/ai-offline-banner';
import { NetworkStore } from '../../../core/stores/network.store';
import { dishFormSchema } from '../../../shared/forms/schemas/dish-form.schema';
import type { DishEditFormValue, DishIngredientFormItem } from './dish-edit.types';

export type { DishEditFormValue, DishIngredientFormItem } from './dish-edit.types';

interface GramDraft {
  local_id: string;
  ingredient_id: string;
  gram_weight: number;
  mode: 'create' | 'edit';
}

const MEAL_TAG_OPTIONS: readonly { value: MealTag; label: string }[] = [
  { value: 'breakfast', label: 'Bữa sáng' },
  { value: 'lunch', label: 'Bữa trưa' },
  { value: 'dinner', label: 'Bữa tối' },
];

const emptyForm = (): DishEditFormValue => ({
  name: '',
  description: '',
  servings: null,
  meal_tag: null,
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
    IonFooter,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonModal,
    IonSpinner,
    FormField,
    BottomSheetPicker,
    ConfirmDialog,
    AppFormField,
    AiOfflineBanner,
    DishAutofillSheet,
  ],
})
export default class DishEditPage implements HasUnsavedChanges, OnInit, OnDestroy {
  @ViewChild('ingredientPicker') private readonly ingredientPicker?: BottomSheetPicker;
  @ViewChild('mealTagPicker') private readonly mealTagPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private readonly nameInput?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dishStore = inject(DishStore);
  private readonly ingredientStore = inject(IngredientStore);
  private readonly profileStore = inject(ProfileStore);
  protected readonly network = inject(NetworkStore);
  private readonly ingredientRepo = inject(IngredientRepository);
  private readonly nutritionAi = inject(NutritionAi);
  private readonly autofillApplier = inject(DishAutofillApplier);
  private readonly toastCtrl = inject(ToastController);

  readonly dishId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => this.dishId() !== null);

  readonly availableIngredients = signal<IngredientListItem[]>([]);
  /** Recently-used ingredients (MRU) — top 5 by latest dish update. */
  readonly recentIngredients = signal<IngredientListItem[]>([]);

  /** id → ingredient for O(1) lookup in template (name + nutrition). */
  readonly ingredientIndex = computed<Map<string, IngredientListItem>>(() => {
    const map = new Map<string, IngredientListItem>();
    for (const ing of this.availableIngredients()) {
      map.set(ing.id, ing);
    }
    return map;
  });

  readonly saving = signal(false);
  protected readonly showErrors = signal(false);

  protected readonly formSignal = signal<DishEditFormValue>(emptyForm());
  protected readonly dishForm = form(this.formSignal, dishFormSchema);

  /** Active row id whose gram-weight sheet is open (null = closed). */
  readonly activeGramRowId = signal<string | null>(null);
  readonly gramDraft = signal<GramDraft | null>(null);

  readonly pendingDeleteId = signal<string | null>(null);
  readonly deleteReferenceCount = signal(0);
  readonly deleteReferenceLoading = signal(false);
  readonly discardDialogOpen = signal(false);

  // F-02 AI Dish Autofill state
  readonly aiAutofillLoading = signal(false);
  readonly aiAutofillResult = signal<DishAutofillResult | null>(null);
  readonly aiAutofillSheetOpen = signal(false);

  private discardDialogResolver: ((value: boolean) => void) | null = null;
  private dirtyBaseline = '';
  private skipUnsavedPrompt = false;

  /** Aggregate nutrition preview per single serving. */
  readonly previewTotals = computed<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }>(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const index = this.ingredientIndex();
    for (const item of this.formSignal().items) {
      const ing = index.get(item.ingredient_id);
      if (!ing || !Number.isFinite(item.gram_weight) || item.gram_weight <= 0) {
        continue;
      }
      const m = item.gram_weight / 100;
      totals.calories += ing.calories * m;
      totals.protein += ing.protein * m;
      totals.carbs += ing.carbs * m;
      totals.fat += ing.fat * m;
      totals.fiber += ing.fiber * m;
    }
    const servings = this.formSignal().servings;
    const divisor = Number.isFinite(servings) && (servings ?? 0) > 0 ? (servings as number) : 1;
    return {
      calories: totals.calories / divisor,
      protein: totals.protein / divisor,
      carbs: totals.carbs / divisor,
      fat: totals.fat / divisor,
      fiber: totals.fiber / divisor,
    };
  });

  /**
   * Daily calorie target from user profile (DS §2.6 nutrition hero).
   * Returns 0 when profile not loaded — hero card uses this to switch to
   * "no-target" state (hides ring, shows kcal block only).
   */
  readonly targetCalories = computed<number>(
    () => this.profileStore.profile()?.target_calories ?? 0,
  );

  /**
   * Calorie ring percent (0–100). 0 when target unavailable or zero, capped
   * at 100 when totals exceed target. Used by hero card conic-gradient
   * via `[style.--ring-percent.%]`.
   */
  readonly caloriePercent = computed<number>(() => {
    const target = this.targetCalories();
    if (target <= 0) {
      return 0;
    }
    const pct = (this.previewTotals().calories / target) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  });

  /**
   * Macro kcal share percentages for stacked bar (P×4 + C×4 + F×9).
   * All zero when totals=0 (renders empty bar).
   */
  readonly macroKcalShares = computed<{ protein: number; carbs: number; fat: number }>(() => {
    const t = this.previewTotals();
    const pKcal = t.protein * 4;
    const cKcal = t.carbs * 4;
    const fKcal = t.fat * 9;
    const total = pKcal + cKcal + fKcal;
    if (total <= 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    return {
      protein: Math.round((pKcal / total) * 100),
      carbs: Math.round((cKcal / total) * 100),
      fat: Math.round((fKcal / total) * 100),
    };
  });

  /**
   * Hero card display state (DS §2.6 nutrition hero):
   *  - 'with-target' = profile loaded with target>0 → show ring + bar + pills
   *  - 'no-target'   = profile null/target=0 → show kcal block + bar + pills
   *  - 'empty'       = totals.calories=0 → show ring/block at 0, bar empty
   */
  readonly nutritionState = computed<'with-target' | 'no-target' | 'empty'>(() => {
    if (this.previewTotals().calories <= 0) {
      return 'empty';
    }
    return this.targetCalories() > 0 ? 'with-target' : 'no-target';
  });

  constructor() {
    addIcons({ chevronDownOutline, closeOutline, sparklesOutline, trashOutline });
    afterNextRender(() => {
      void this.bootstrap();
    });
  }

  ngOnInit(): void {
    document.body.classList.add('edit-overlay-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('edit-overlay-open');
  }

  private async bootstrap(): Promise<void> {
    if (this.ingredientStore.ingredients().length === 0) {
      await this.ingredientStore.load();
    }
    this.availableIngredients.set(this.ingredientStore.ingredients());

    try {
      const recent = await this.ingredientRepo.findRecentlyUsed(5);
      this.recentIngredients.set(recent);
    } catch {
      this.recentIngredients.set([]);
    }

    const id = this.dishId();
    if (!id) {
      this.resetDirtyBaseline();
      return;
    }

    const dish = await this.dishStore.fetchById(id);
    if (!dish) {
      this.resetDirtyBaseline();
      return;
    }

    this.formSignal.set({
      name: dish.name,
      description: dish.description ?? '',
      servings: dish.servings,
      meal_tag: dish.meal_tag,
      items: dish.ingredients.map((row) => ({
        local_id: uuidv4(),
        ingredient_id: row.ingredient_id,
        gram_weight: row.gram_weight,
      })),
    });
    this.resetDirtyBaseline();
  }

  // ───────── picker options ─────────

  get ingredientOptions(): PickerOption[] {
    return this.availableIngredients().map((ingredient) => ({
      value: ingredient.id,
      label: ingredient.name,
      description: `${ingredient.category} · ${this.formatNumber(ingredient.calories)} kcal/100g`,
    }));
  }

  get recentIngredientOptions(): PickerOption[] {
    return this.recentIngredients().map((ingredient) => ({
      value: ingredient.id,
      label: ingredient.name,
      description: ingredient.category,
    }));
  }

  get mealTagOptions(): PickerOption[] {
    return MEAL_TAG_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));
  }

  get mealTagLabel(): string {
    const tag = this.formSignal().meal_tag;
    if (!tag) {
      return 'Chọn loại bữa (tuỳ chọn)';
    }
    return MEAL_TAG_OPTIONS.find((opt) => opt.value === tag)?.label ?? '';
  }

  // ───────── error helpers ─────────

  protected itemsErrorMessages(): string[] {
    return this.dishForm
      .items()
      .errors()
      .map((e) => e.message)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
  }

  // ───────── pickers ─────────

  openIngredientPicker(): void {
    this.ingredientPicker?.open();
  }

  openMealTagPicker(): void {
    this.mealTagPicker?.open();
  }

  onMealTagSelected(value: string): void {
    const allowed = MEAL_TAG_OPTIONS.find((opt) => opt.value === value)?.value ?? null;
    this.formSignal.update((v) => ({ ...v, meal_tag: allowed }));
  }

  /** Picked an ingredient → open gram sheet in 'create' mode (default 100 g). */
  onIngredientSelected(ingredientId: string): void {
    const ingredient = this.ingredientIndex().get(ingredientId);
    if (!ingredient) {
      return;
    }
    const localId = uuidv4();
    this.activeGramRowId.set(localId);
    this.gramDraft.set({
      local_id: localId,
      ingredient_id: ingredient.id,
      gram_weight: 100,
      mode: 'create',
    });
  }

  // ───────── ingredient row actions ─────────

  removeItem(localId: string): void {
    this.formSignal.update((v) => ({
      ...v,
      items: v.items.filter((item) => item.local_id !== localId),
    }));
  }

  openGramSheet(localId: string): void {
    const item = this.formSignal().items.find((candidate) => candidate.local_id === localId);
    if (!item) {
      return;
    }
    this.activeGramRowId.set(localId);
    this.gramDraft.set({
      local_id: item.local_id,
      ingredient_id: item.ingredient_id,
      gram_weight: item.gram_weight,
      mode: 'edit',
    });
  }

  closeGramSheet(): void {
    this.activeGramRowId.set(null);
    this.gramDraft.set(null);
  }

  updateGramDraftValue(event: Event): void {
    const numeric = Number(this.readInputValue(event));
    this.gramDraft.update((draft) =>
      draft ? { ...draft, gram_weight: Number.isFinite(numeric) ? numeric : 0 } : draft,
    );
  }

  saveGramDraft(): void {
    const draft = this.gramDraft();
    if (!draft || !Number.isFinite(draft.gram_weight) || draft.gram_weight <= 0) {
      this.showErrors.set(true);
      return;
    }

    const item: DishIngredientFormItem = {
      local_id: draft.local_id,
      ingredient_id: draft.ingredient_id,
      gram_weight: draft.gram_weight,
    };

    this.formSignal.update((v) => ({
      ...v,
      items:
        draft.mode === 'create'
          ? [...v.items, item]
          : v.items.map((current) => (current.local_id === draft.local_id ? item : current)),
    }));
    this.closeGramSheet();
  }

  // ───────── per-row display ─────────

  ingredientName(ingredientId: string): string {
    return this.ingredientIndex().get(ingredientId)?.name ?? 'Nguyên liệu';
  }

  itemCalories(item: DishIngredientFormItem): string {
    const ing = this.ingredientIndex().get(item.ingredient_id);
    if (!ing || !Number.isFinite(item.gram_weight) || item.gram_weight <= 0) {
      return '0 kcal';
    }
    const kcal = (ing.calories * item.gram_weight) / 100;
    return `${this.formatNumber(kcal)} kcal`;
  }

  itemDetail(item: DishIngredientFormItem): string {
    return `${this.formatNumber(item.gram_weight)} g`;
  }

  draftCalories(draft: GramDraft): string {
    const ing = this.ingredientIndex().get(draft.ingredient_id);
    if (!ing || !Number.isFinite(draft.gram_weight) || draft.gram_weight <= 0) {
      return '0 kcal';
    }
    const kcal = (ing.calories * draft.gram_weight) / 100;
    return `${this.formatNumber(kcal)} kcal`;
  }

  draftIngredientName(draft: GramDraft): string {
    return this.ingredientIndex().get(draft.ingredient_id)?.name ?? 'Nguyên liệu';
  }

  // ───────── delete dialog ─────────

  async openDeleteDialog(): Promise<void> {
    const id = this.dishId();
    if (!id) {
      return;
    }
    this.deleteReferenceLoading.set(true);
    this.pendingDeleteId.set(id);
    try {
      this.deleteReferenceCount.set(await this.dishStore.countReferences(id));
    } finally {
      this.deleteReferenceLoading.set(false);
    }
  }

  closeDeleteDialog(): void {
    this.pendingDeleteId.set(null);
    this.deleteReferenceCount.set(0);
    this.deleteReferenceLoading.set(false);
  }

  async confirmDelete(): Promise<void> {
    const id = this.pendingDeleteId();
    if (!id) {
      return;
    }
    if (this.deleteReferenceLoading() || this.deleteReferenceCount() > 0) {
      this.closeDeleteDialog();
      return;
    }
    await this.dishStore.remove(id);
    this.skipUnsavedPrompt = true;
    this.resetDirtyBaseline();
    this.closeDeleteDialog();
    await this.router.navigate(['/tabs/management']);
  }

  // ───────── unsaved-changes guard ─────────

  hasUnsavedChanges(): boolean {
    if (this.skipUnsavedPrompt) {
      return false;
    }
    return this.createDirtySnapshot() !== this.dirtyBaseline || this.gramDraft() !== null;
  }

  confirmDiscardChanges(): Promise<boolean> {
    this.discardDialogOpen.set(true);
    return new Promise<boolean>((resolve) => {
      this.discardDialogResolver = resolve;
    });
  }

  cancelDiscardChanges(): void {
    this.resolveDiscardDialog(false);
  }

  confirmDiscardChangesDialog(): void {
    this.skipUnsavedPrompt = true;
    this.resolveDiscardDialog(true);
  }

  // ───────── save ─────────

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
      const items = value.items.map((item, index) => ({
        ingredient_id: item.ingredient_id,
        gram_weight: item.gram_weight,
        sort_order: index,
      }));

      const trimmedDescription = value.description.trim();
      const payload = {
        name: value.name.trim(),
        description: trimmedDescription || null,
        type: 'ingredient_based' as const,
        source: 'custom' as const,
        servings: value.servings ?? 1,
        image_url: null,
        meal_tag: value.meal_tag,
      };

      const editingId = this.dishId();
      if (editingId) {
        await this.dishStore.edit(editingId, payload, items);
      } else {
        await this.dishStore.addFromIngredients(payload, items);
      }

      this.resetDirtyBaseline();
      this.skipUnsavedPrompt = true;
      await this.router.navigate(['/tabs/management']);
    } finally {
      this.saving.set(false);
    }
  }

  // ───────── F-02 AI Dish Autofill ─────────

  /**
   * User tapped "Điền tự động bằng AI". Read current `name` field — empty
   * → toast. Else: pull DB candidates, call NutritionAi.autofillDish, open
   * sheet on success.
   */
  async onAskAi(): Promise<void> {
    const dishName = this.formSignal().name.trim();
    if (!dishName) {
      await this.presentToast('Nhập tên món ăn trước khi hỏi AI');
      return;
    }
    if (this.aiAutofillLoading()) {
      return;
    }

    // Pre-check: dish trùng tên (case-insensitive) → block, không gọi AI.
    // Mode 'edit': bỏ qua chính dish đang edit (so id), chỉ block nếu trùng
    // tên với dish KHÁC trong DB.
    const existing = await this.dishStore.findByNormalizedName(dishName);
    if (existing && existing.id !== this.dishId()) {
      await this.presentToast(`Món "${existing.name}" đã tồn tại`);
      return;
    }

    this.aiAutofillLoading.set(true);
    try {
      const candidates = this.availableIngredients().map((ing) => ({
        id: ing.id,
        name: ing.name,
      }));
      const result = await this.nutritionAi.autofillDish(dishName, candidates);
      this.aiAutofillResult.set(result);
      this.aiAutofillSheetOpen.set(true);
    } catch (err) {
      const message =
        err instanceof GeminiError
          ? GEMINI_ERROR_TOAST[err.kind]
          : 'Có lỗi xảy ra, vui lòng thử lại';
      await this.presentToast(message);
    } finally {
      this.aiAutofillLoading.set(false);
    }
  }

  /**
   * Sheet emitted (applied) — call applier để materialize ingredients +
   * dish_ingredient list, append vào form (KHÔNG replace items hiện có).
   */
  async onAutofillApplied(payload: DishAutofillAppliedPayload): Promise<void> {
    try {
      const ops = await this.dishStore.applyAutofillAtomic(payload.result, {
        fuzzyDecisions: payload.fuzzyDecisions,
      });

      // Refresh availableIngredients từ store cache (đã được store bulk-merge).
      this.availableIngredients.set(this.ingredientStore.ingredients());

      // Append AI rows vào cuối list hiện tại (Decision: AI bổ sung, không thay thế).
      const newItems: DishIngredientFormItem[] = ops.dishIngredients.map((row) => ({
        local_id: uuidv4(),
        ingredient_id: row.ingredient_id,
        gram_weight: row.gram_weight,
      }));

      this.formSignal.update((v) => ({ ...v, items: [...v.items, ...newItems] }));

      this.aiAutofillSheetOpen.set(false);
      this.aiAutofillResult.set(null);

      const total = ops.dishIngredients.length;
      const created = ops.createdIngredientIds.length;
      const message =
        created > 0
          ? `Đã thêm ${total} nguyên liệu (${created} mới)`
          : `Đã thêm ${total} nguyên liệu`;
      await this.presentToast(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
      await this.presentToast(message);
    }
  }

  onAutofillSheetDismissed(): void {
    this.aiAutofillSheetOpen.set(false);
    this.aiAutofillResult.set(null);
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2400,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  // ───────── utils ─────────

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private resolveDiscardDialog(value: boolean): void {
    const resolver = this.discardDialogResolver;
    this.discardDialogResolver = null;
    this.discardDialogOpen.set(false);
    resolver?.(value);
  }

  private resetDirtyBaseline(): void {
    if (this.dirtyBaseline && this.createDirtySnapshot() !== this.dirtyBaseline) {
      return;
    }
    this.dirtyBaseline = this.createDirtySnapshot();
    this.skipUnsavedPrompt = false;
  }

  private createDirtySnapshot(): string {
    const value = this.formSignal();
    return JSON.stringify({
      name: value.name.trim(),
      description: value.description.trim(),
      servings: value.servings ?? null,
      meal_tag: value.meal_tag,
      items: value.items.map((item) => ({
        ingredient_id: item.ingredient_id,
        gram_weight: item.gram_weight,
      })),
    });
  }

  private focusFirstInvalidField(): void {
    const f = this.dishForm;
    const firstErrorSelector = this.firstDishErrorSelector();

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

  private readInputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }

  private firstDishErrorSelector(): string | null {
    const f = this.dishForm;
    if (f.name().errors().length) {
      return 'input';
    }
    if (f.servings().errors().length) {
      return 'input[type="number"]';
    }
    return f.items().errors().length ? '.ingredient-empty' : null;
  }
}
