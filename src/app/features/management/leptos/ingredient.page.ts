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
} from '@ionic/angular/standalone';
import { AiOfflineBanner } from '../../../shared/components/ai-offline-banner/ai-offline-banner';
import { BottomSheetPicker } from '../../../shared/components/bottom-sheet-picker/bottom-sheet-picker';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AppFormField } from '../../../shared/forms';
import { ManagementView, type ManagementAction } from './renderer';
import IngredientEditPage from '../ingredient-edit/ingredient-edit.page';
import { AiLookupSheet } from '../../../shared/components/ai-lookup-sheet/ai-lookup-sheet';
import { DishesUsingSheet } from '../../../shared/components/dishes-using-sheet/dishes-using-sheet';

const nutrients = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
@Component({
  selector: 'app-leptos-ingredient-edit',
  templateUrl: './ingredient.page.html',
  styleUrl: './ingredient.page.scss',
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
    AiLookupSheet,
    DishesUsingSheet,
  ],
})
export default class LeptosIngredientPage extends IngredientEditPage {
  readonly snapshot = computed(() => {
    const form = this.formSignal();
    return JSON.stringify({
      category: form.category,
      values: nutrients.map((k) => form[k]),
      submitted: this.showErrors(),
    });
  });
  dispatch({ type, value }: ManagementAction): void {
    if (type === 'category') {
      this.openCategoryPicker();
      return;
    }
    const field = nutrients.find((k) => k === type);
    if (!field) return;
    const parsed = value.trim() === '' ? null : Number(value);
    this.formSignal.update((form) => ({
      ...form,
      [field]: parsed !== null && Number.isFinite(parsed) ? parsed : null,
    }));
  }
}
