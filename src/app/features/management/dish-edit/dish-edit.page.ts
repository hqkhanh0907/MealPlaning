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
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, closeOutline } from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import { IngredientRepository } from '../../../core/repositories/ingredient.repository';
import type { HasUnsavedChanges } from '../../../core/guards/unsaved-changes-guard';
import type { MealTag } from '../../../core/models/management.types';
import { DishStore } from '../../../core/stores/dish.store';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import {
  BottomSheetPicker,
  type PickerOption,
} from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AppFormField } from '../../../shared/forms';
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
    IonButtons,
    IonBackButton,
    IonIcon,
    IonModal,
    FormField,
    BottomSheetPicker,
    ConfirmDialog,
    AppFormField,
  ],
})
export default class DishEditPage implements HasUnsavedChanges {
  @ViewChild('ingredientPicker') private ingredientPicker?: BottomSheetPicker;
  @ViewChild('mealTagPicker') private mealTagPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dishStore = inject(DishStore);
  private readonly ingredientStore = inject(IngredientStore);
  private readonly ingredientRepo = inject(IngredientRepository);

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

  constructor() {
    addIcons({ chevronDownOutline, closeOutline });
    void this.bootstrap();
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

  private readInputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }
}
