import { ChangeDetectionStrategy, Component, computed, ViewEncapsulation } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonModal,
} from '@ionic/angular/standalone';
import { AiOfflineBanner } from '../../../shared/components/ai-offline-banner/ai-offline-banner';
import { BottomSheetPicker } from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AppFormField } from '../../../shared/forms';
import { ManagementView, type ManagementAction } from './renderer';
import DishEditPage from '../dish-edit/dish-edit.page';
import { DishAutofillSheet } from '../../../shared/components/dish-autofill-sheet/dish-autofill-sheet';

@Component({
  selector: 'app-leptos-dish-edit',
  templateUrl: './dish.page.html',
  styleUrl: './dish.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
    FormField,
    AiOfflineBanner,
    BottomSheetPicker,
    ConfirmDialog,
    AppFormField,
    ManagementView,
    DishAutofillSheet,
    IonModal,
  ],
})
export default class LeptosDishPage extends DishEditPage {
  readonly snapshot = computed(() => {
    const form = this.formSignal();
    const ingredients = this.ingredientIndex();
    return JSON.stringify({
      servings: form.servings,
      target: this.targetCalories(),
      loading: this.ingredientsLoading(),
      errors: this.showErrors() ? this.itemsErrorMessages() : [],
      rows: form.items.map((item) => {
        const n = ingredients.get(item.ingredient_id);
        return {
          id: item.local_id,
          name: n?.name ?? 'Nguyên liệu',
          grams: item.gram_weight,
          nutrition: n
            ? {
                calories: n.calories,
                protein: n.protein,
                carbs: n.carbs,
                fat: n.fat,
                fiber: n.fiber,
              }
            : null,
        };
      }),
    });
  });
  dispatch({ type, value }: ManagementAction): void {
    if (type === 'addItem') {
      void this.openIngredientPicker();
    }
    if (type === 'editItem') {
      this.openGramSheet(value);
    }
    if (type === 'removeItem') {
      this.removeItem(value);
    }
  }
}
