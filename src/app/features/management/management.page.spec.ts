import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { CreateIngredientInput } from '../../core/repositories/ingredient.repository';
import type { UnitModel } from '../../core/models/management.model';
import { UnitRepository } from '../../core/repositories/unit.repository';
import { DishStore } from '../../core/stores/dish.store';
import { IngredientStore } from '../../core/stores/ingredient.store';
import ManagementPage from './management.page';

describe('ManagementPage', () => {
  let fixture: ComponentFixture<ManagementPage>;
  let component: ManagementPage;
  let router: jasmine.SpyObj<Router>;
  let ingredientItems: {
    id: string;
    name: string;
    category: string;
    nutrition_basis_unit: 'g' | 'ml';
    nutrition_basis_quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    density_g_per_ml: number | null;
    source: 'manual' | 'ai' | 'db';
    created_at: string;
    updated_at: string | null;
    units: {
      ingredient_id: string;
      unit_id: string;
      factor_to_basis: number;
      is_default: number;
      display_label: string | null;
      is_approximate: number;
      short_name_vi: string;
      display_name_vi: string;
    }[];
  }[];
  let dishItems: {
    id: string;
    name: string;
    description: string | null;
    type: 'ingredient_based' | 'ai_autofill';
    source: 'custom' | 'ai' | 'db';
    servings: number;
    image_url: string | null;
    created_at: string;
    updated_at: string | null;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    total_fiber: number;
  }[];

  beforeEach(async () => {
    ingredientItems = [];
    dishItems = [];
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    const ingredientStore = {
      ingredients: () => ingredientItems,
      loading: () => false,
      searchQuery: () => '',
      load: jasmine.createSpy().and.resolveTo(),
      search: jasmine.createSpy().and.resolveTo(),
      remove: jasmine.createSpy().and.resolveTo(),
      add: jasmine.createSpy().and.resolveTo(),
      edit: jasmine.createSpy().and.resolveTo(),
      countDishReferences: jasmine.createSpy().and.resolveTo(0),
    };

    const dishStore = {
      dishes: () => dishItems,
      loading: () => false,
      searchQuery: () => '',
      load: jasmine.createSpy().and.resolveTo(),
      search: jasmine.createSpy().and.resolveTo(),
      addFromIngredients: jasmine.createSpy().and.resolveTo(),
      edit: jasmine.createSpy().and.resolveTo(),
      fetchById: jasmine.createSpy().and.resolveTo(null),
      remove: jasmine.createSpy().and.resolveTo(),
      countReferences: jasmine.createSpy().and.resolveTo(0),
    };

    const unitRepository = {
      list: jasmine.createSpy().and.resolveTo([
        {
          id: 'g',
          display_name_vi: 'gram',
          display_name_en: 'gram',
          short_name_vi: 'g',
          unit_type: 'mass',
          is_global: 1,
          base_factor_g: 1,
          base_factor_ml: null,
          is_approximate: 0,
          display_order: 1,
        },
      ] satisfies UnitModel[]),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: IngredientStore, useValue: ingredientStore },
        { provide: DishStore, useValue: dishStore },
        { provide: UnitRepository, useValue: unitRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders segment labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nguyên liệu');
    expect(text).toContain('Món ăn');
  });

  it('renders reusable segmented control shell', () => {
    const segment = fixture.nativeElement.querySelector('app-segmented-control');
    expect(segment).toBeTruthy();
  });

  it('forwards ingredient search query to the store', async () => {
    await component.onIngredientSearch('trứng');

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as {
      search: jasmine.Spy;
    };
    expect(ingredientStore.search).toHaveBeenCalledWith('trứng');
  });

  it('navigates to settings when settings button is clicked', async () => {
    await component.openSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('removes ingredient after confirm delete when there are no references', async () => {
    await component.openIngredientDeleteDialog('ingredient-1', 'Trứng gà');
    await component.confirmIngredientDelete();

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as {
      remove: jasmine.Spy;
    };
    expect(ingredientStore.remove).toHaveBeenCalledWith('ingredient-1');
    expect(component.pendingIngredientDeleteId()).toBeNull();
  });

  it('opens create ingredient modal and submits payload with explicit units', async () => {
    component.openCreateIngredient();
    expect(component.ingredientModalOpen()).toBeTrue();

    await component.submitIngredient({
      name: 'Trứng gà',
      category: 'Trứng & Sữa',
      nutrition_basis_unit: 'g',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      density_g_per_ml: null,
      units: [
        {
          local_id: 'u1',
          unit_id: 'g',
          factor_to_basis: 1,
          is_default: true,
          display_label: 'g',
          is_approximate: false,
          short_name_vi: 'g',
        },
      ],
    });

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as {
      add: jasmine.Spy;
    };
    expect(ingredientStore.add).toHaveBeenCalledWith(
      jasmine.objectContaining<CreateIngredientInput>({
        name: 'Trứng gà',
        nutrition_basis_unit: 'g',
        nutrition_basis_quantity: 100,
        source: 'manual',
        units: [jasmine.objectContaining({ unit_id: 'g', factor_to_basis: 1, is_default: 1 })],
      }),
    );
    expect(component.ingredientModalOpen()).toBeFalse();
  });

  it('opens edit ingredient modal and forwards update payload', async () => {
    ingredientItems = [
      {
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
      },
    ];

    component.openEditIngredient('ingredient-1');
    expect(component.ingredientModalOpen()).toBeTrue();
    expect(component.ingredientModalTitle()).toBe('Sửa nguyên liệu');

    await component.submitIngredient({
      name: 'Trứng gà ta',
      category: 'Trứng & Sữa',
      nutrition_basis_unit: 'g',
      calories: 160,
      protein: 14,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      density_g_per_ml: null,
      units: [
        {
          local_id: 'u1',
          unit_id: 'g',
          factor_to_basis: 1,
          is_default: true,
          display_label: 'g',
          is_approximate: false,
          short_name_vi: 'g',
        },
      ],
    });

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as {
      edit: jasmine.Spy;
    };
    expect(ingredientStore.edit).toHaveBeenCalledWith(
      'ingredient-1',
      jasmine.objectContaining({
        name: 'Trứng gà ta',
        calories: 160,
        units: [jasmine.objectContaining({ unit_id: 'g', factor_to_basis: 1, is_default: 1 })],
      }),
    );
    expect(component.ingredientModalOpen()).toBeFalse();
  });

  it('opens create dish modal and forwards ingredient-based payload', async () => {
    ingredientItems = [
      {
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
      },
    ];

    component.onTabChange('dishes');
    await component.openCreateDish();
    expect(component.dishModalOpen()).toBeTrue();

    await component.submitDish({
      name: 'Cơm trứng',
      description: 'Món nhanh',
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

    const dishStore = TestBed.inject(DishStore) as unknown as {
      addFromIngredients: jasmine.Spy;
    };
    expect(dishStore.addFromIngredients).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Cơm trứng',
        description: 'Món nhanh',
        type: 'ingredient_based',
        source: 'custom',
        servings: 1,
      }),
      [jasmine.objectContaining({ ingredient_id: 'ingredient-1', amount_value: 2, unit_id: 'g' })],
    );
    expect(component.dishModalOpen()).toBeFalse();
    expect(component.tab()).toBe('dishes');
  });

  it('shows source labels using Vietnamese display names', () => {
    expect(component.ingredientSourceLabel('db')).toBe('Có sẵn');
    expect(component.ingredientSourceLabel('manual')).toBe('Tự tạo');
    expect(component.dishSourceLabel('custom')).toBe('Tự tạo');
  });

  it('maps ingredient categories and dish types to visual badge classes', () => {
    expect(component.ingredientCategoryClass('Thịt')).toBe('badge--category-cat-thit');
    expect(component.ingredientCategoryClass('Trứng & Sữa')).toBe('badge--category-cat-trung');
    expect(component.ingredientCategoryClass('Không rõ')).toBe('badge--category-cat-khac');
    expect(component.dishTypeClass('ingredient_based')).toBe('badge--type-ingredient');
    expect(component.dishTypeClass('ai_autofill')).toBe('badge--type-ai');
  });
});
