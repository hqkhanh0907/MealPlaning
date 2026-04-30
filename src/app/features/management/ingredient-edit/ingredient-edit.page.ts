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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../../core/models/management.constants';
import type { HasUnsavedChanges } from '../../../core/guards/unsaved-changes-guard';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import {
  BottomSheetPicker,
  type PickerOption,
} from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { DishesUsingSheet } from '../../../shared/components/dishes-using-sheet/dishes-using-sheet';
import { AppFormField } from '../../../shared/forms';
import { ingredientFormSchema } from '../../../shared/forms/schemas/ingredient-form.schema';
import type { IngredientEditFormValue } from './ingredient-edit.types';

export type { IngredientEditFormValue } from './ingredient-edit.types';

const emptyForm = (): IngredientEditFormValue => ({
  name: '',
  category: '',
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
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
    IonBackButton,
    IonIcon,
    FormField,
    BottomSheetPicker,
    DishesUsingSheet,
    ConfirmDialog,
    AppFormField,
  ],
})
export default class IngredientEditPage implements HasUnsavedChanges {
  @ViewChild('categoryPicker') private categoryPicker?: BottomSheetPicker;
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ingredientStore = inject(IngredientStore);

  readonly categories = INGREDIENT_CATEGORIES;

  readonly ingredientId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => this.ingredientId() !== null);

  /** Whether the "Đang dùng trong N món" sheet is open. Edit mode only. */
  readonly isDishesSheetOpen = signal(false);

  readonly pendingDeleteId = signal<string | null>(null);
  readonly deleteReferenceCount = signal(0);
  readonly deleteReferenceLoading = signal(false);
  readonly discardDialogOpen = signal(false);
  private discardDialogResolver: ((value: boolean) => void) | null = null;
  private dirtyBaseline = '';
  private skipUnsavedPrompt = false;

  readonly saving = signal(false);
  protected readonly showErrors = signal(false);

  protected readonly formSignal = signal<IngredientEditFormValue>(emptyForm());
  protected readonly ingredientForm = form(this.formSignal, ingredientFormSchema);

  constructor() {
    addIcons({ chevronDownOutline });
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const id = this.ingredientId();
    if (!id) {
      this.resetDirtyBaseline();
      return;
    }

    if (this.ingredientStore.ingredients().length === 0) {
      await this.ingredientStore.load();
    }

    const ingredient = this.ingredientStore.ingredients().find((item) => item.id === id);
    if (!ingredient) {
      this.resetDirtyBaseline();
      return;
    }

    this.formSignal.set({
      name: ingredient.name,
      category: ingredient.category,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      fiber: ingredient.fiber,
    });
    this.resetDirtyBaseline();
  }

  get categoryOptions(): PickerOption[] {
    return this.categories.map((category) => ({ value: category, label: category }));
  }

  /** Cross-field error surfaced from the calories path (macroOver100 etc.). */
  protected caloriesErrorMessage(): string {
    const errs = this.ingredientForm.calories().errors();
    return errs[0]?.message ?? '';
  }

  openCategoryPicker(): void {
    this.categoryPicker?.open();
  }

  /** Open the "Đang dùng trong N món" sheet. No-op in create mode. */
  openDishesSheet(): void {
    if (!this.isEdit()) {
      return;
    }
    this.isDishesSheetOpen.set(true);
  }

  onDishesSheetClosed(): void {
    this.isDishesSheetOpen.set(false);
  }

  async onDishSelectedFromSheet(dishId: string): Promise<void> {
    this.isDishesSheetOpen.set(false);
    await this.router.navigate(['/tabs/management/dish/edit', dishId]);
  }

  onCategorySelected(category: string): void {
    this.formSignal.update((v) => ({ ...v, category }));
  }

  async openDeleteDialog(): Promise<void> {
    const id = this.ingredientId();
    if (!id) {
      return;
    }

    this.deleteReferenceLoading.set(true);
    this.pendingDeleteId.set(id);
    try {
      this.deleteReferenceCount.set(await this.ingredientStore.countDishReferences(id));
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

    await this.ingredientStore.remove(id);
    this.skipUnsavedPrompt = true;
    this.resetDirtyBaseline();
    this.closeDeleteDialog();
    await this.router.navigate(['/tabs/management']);
  }

  hasUnsavedChanges(): boolean {
    if (this.skipUnsavedPrompt) {
      return false;
    }
    return this.createDirtySnapshot() !== this.dirtyBaseline;
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
      const payload = {
        name: value.name.trim(),
        category: value.category.trim(),
        calories: value.calories ?? 0,
        protein: value.protein ?? 0,
        carbs: value.carbs ?? 0,
        fat: value.fat ?? 0,
        fiber: value.fiber ?? 0,
        source: 'manual' as const,
      };

      const editingId = this.ingredientId();
      if (editingId) {
        await this.ingredientStore.edit(editingId, payload);
      } else {
        await this.ingredientStore.add(payload);
      }

      this.resetDirtyBaseline();
      this.skipUnsavedPrompt = true;
      await this.router.navigate(['/tabs/management']);
    } finally {
      this.saving.set(false);
    }
  }

  private resolveDiscardDialog(value: boolean): void {
    const resolver = this.discardDialogResolver;
    this.discardDialogResolver = null;
    this.discardDialogOpen.set(false);
    resolver?.(value);
  }

  private resetDirtyBaseline(): void {
    this.dirtyBaseline = this.createDirtySnapshot();
    this.skipUnsavedPrompt = false;
  }

  private createDirtySnapshot(): string {
    const value = this.formSignal();
    return JSON.stringify({
      name: value.name.trim(),
      category: value.category.trim(),
      calories: value.calories ?? null,
      protein: value.protein ?? null,
      carbs: value.carbs ?? null,
      fat: value.fat ?? null,
      fiber: value.fiber ?? null,
    });
  }

  private focusFirstInvalidField(): void {
    const f = this.ingredientForm;
    setTimeout(() => {
      if (f.name().errors().length) {
        this.nameInput?.nativeElement.focus();
        return;
      }
      const sel = f.category().errors().length
        ? '.picker-trigger--floating'
        : f.calories().errors().length
          ? 'input[type="number"]'
          : null;
      const target = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
