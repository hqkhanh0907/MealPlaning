import { Component, computed, ViewEncapsulation } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import ManagementPage from '../management.page';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';
import { ManagementView, type ManagementAction } from './renderer';

@Component({
  selector: 'app-leptos-catalog',
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    ConfirmDialog,
    ManagementView,
  ],
})
export default class LeptosCatalogPage extends ManagementPage {
  constructor() {
    super();
    addIcons({ closeCircleOutline });
  }
  readonly snapshot = computed(() => {
    const tab = this.tab();
    const store = tab === 'ingredients' ? this.ingredientStore : this.dishStore;
    return JSON.stringify({
      tab,
      query: store.searchQuery(),
      filter: this.activeIngredientFilter(),
      loading: store.loading(),
      failed: this.listError() === tab,
      menu: this.createMenuOpen(),
      categories: this.ingredientFilters,
      rows: tab === 'ingredients' ? this.ingredientStore.ingredients() : this.dishStore.dishes(),
    });
  });
  dispatch({ type, value }: ManagementAction): void {
    switch (type) {
      case 'tab':
        this.onTabChange(value);
        break;
      case 'searchIngredients':
        void this.onIngredientSearch(value);
        break;
      case 'searchDishes':
        void this.onDishSearch(value);
        break;
      case 'create':
        this.openCreateAction();
        break;
      case 'closeCreate':
        this.closeCreateMenu();
        break;
      case 'manualDish':
        this.handleDishCreateMode('ingredient');
        break;
      case 'aiDish':
        this.handleDishCreateMode('ai');
        break;
      case 'filter': {
        const category = this.ingredientFilters.find((item) => item === value);
        if (category) this.setIngredientFilter(category);
        break;
      }
      case 'retry':
        this.retryActiveList();
        break;
      case 'editIngredient':
        this.openEditIngredient(value);
        break;
      case 'editDish':
        void this.openEditDish(value);
        break;
      case 'ingredientOptions': {
        const item = this.ingredientStore.ingredients().find((row) => row.id === value);
        if (item) this.openIngredientOptions(item);
        break;
      }
      case 'dishOptions': {
        const item = this.dishStore.dishes().find((row) => row.id === value);
        if (item) this.openDishOptions(item);
        break;
      }
    }
  }
}
