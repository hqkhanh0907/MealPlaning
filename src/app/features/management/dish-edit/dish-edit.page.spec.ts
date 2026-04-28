import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import { IngredientRepository } from '../../../core/repositories/ingredient.repository';
import { DishStore } from '../../../core/stores/dish.store';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import DishEditPage from './dish-edit.page';

describe('DishEditPage', () => {
  let fixture: ComponentFixture<DishEditPage>;
  let component: DishEditPage;
  let navigateSpy: jasmine.Spy;

  const sampleIngredient: IngredientListItem = {
    id: 'ingredient-1',
    name: 'Trứng gà',
    category: 'Trứng & Sữa',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    density_g_per_ml: null,
    source: 'manual',
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
    units: [
      {
        ingredient_id: 'ingredient-1',
        unit_id: 'g',
        factor_to_basis: 1,
        is_default: 1,
        display_label: 'g',
        is_approximate: 0,
        short_name_vi: 'g',
        display_name_vi: 'gram',
      },
    ],
  };

  beforeEach(async () => {
    const dishStore = {
      dishes: () => [],
      load: jasmine.createSpy().and.resolveTo(),
      fetchById: jasmine.createSpy().and.resolveTo(null),
      addFromIngredients: jasmine.createSpy().and.resolveTo(),
      edit: jasmine.createSpy().and.resolveTo(),
    };

    const ingredientStore = {
      ingredients: () => [sampleIngredient],
      load: jasmine.createSpy().and.resolveTo(),
    };

    const ingredientRepo = {
      findRecentlyUsed: jasmine.createSpy('findRecentlyUsed').and.resolveTo([]),
    };

    const activatedRoute = {
      snapshot: { paramMap: convertToParamMap({}) },
    };

    await TestBed.configureTestingModule({
      imports: [DishEditPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: DishStore, useValue: dishStore },
        { provide: IngredientStore, useValue: ingredientStore },
        { provide: IngredientRepository, useValue: ingredientRepo },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(DishEditPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('starts in create mode (no id param)', () => {
    expect(component.isEdit()).toBeFalse();
  });

  it('loads recent ingredients into picker on bootstrap', async () => {
    const repo = TestBed.inject(IngredientRepository) as unknown as {
      findRecentlyUsed: jasmine.Spy;
    };
    expect(repo.findRecentlyUsed).toHaveBeenCalledWith(5);
    // Default mock resolves to [] so MRU options are empty.
    expect(component.recentIngredientOptions.length).toBe(0);
  });

  it('exposes recent ingredients as picker options when present', async () => {
    const repo = TestBed.inject(IngredientRepository) as unknown as {
      findRecentlyUsed: jasmine.Spy;
    };
    repo.findRecentlyUsed.and.resolveTo([sampleIngredient]);
    // Force re-bootstrap by setting signal directly (covers transformation logic).
    const access = component as unknown as {
      recentIngredients: { set: (v: IngredientListItem[]) => void };
    };
    access.recentIngredients.set([sampleIngredient]);
    expect(component.recentIngredientOptions.length).toBe(1);
    expect(component.recentIngredientOptions[0].value).toBe('ingredient-1');
    expect(component.recentIngredientOptions[0].label).toBe('Trứng gà');
  });

  it('rejects submit when required fields are empty', async () => {
    await component.onSave();
    const showErrorsAccess = component as unknown as { showErrors: () => boolean };
    expect(showErrorsAccess.showErrors()).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('rejects submit when items list is empty', async () => {
    const access = component as unknown as {
      formSignal: {
        set: (v: { name: string; description: string; servings: number; items: never[] }) => void;
      };
    };
    access.formSignal.set({ name: 'Cơm trứng', description: '', servings: 2, items: [] });

    await component.onSave();
    const dishStore = TestBed.inject(DishStore) as unknown as { addFromIngredients: jasmine.Spy };
    expect(dishStore.addFromIngredients).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('saves new dish and navigates back to management', async () => {
    const access = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          description: string;
          servings: number;
          items: {
            local_id: string;
            ingredient_id: string;
            amount_value: number;
            unit_id: string;
          }[];
        }) => void;
      };
    };

    access.formSignal.set({
      name: ' Cơm trứng ',
      description: ' nhanh ',
      servings: 1,
      items: [
        {
          local_id: 'item-1',
          ingredient_id: 'ingredient-1',
          amount_value: 2,
          unit_id: 'g',
        },
      ],
    });

    await component.onSave();

    const dishStore = TestBed.inject(DishStore) as unknown as { addFromIngredients: jasmine.Spy };
    expect(dishStore.addFromIngredients).toHaveBeenCalled();
    const [payload, items] = dishStore.addFromIngredients.calls.mostRecent().args;
    expect(payload.name).toBe('Cơm trứng');
    expect(payload.description).toBe('nhanh');
    expect(payload.servings).toBe(1);
    expect(payload.type).toBe('ingredient_based');
    expect(payload.source).toBe('custom');
    expect(items.length).toBe(1);
    expect(items[0].ingredient_id).toBe('ingredient-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/tabs/management']);
  });
});
