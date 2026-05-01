import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import type { IngredientListItem } from '../../../core/repositories/ingredient.repository';
import { IngredientRepository } from '../../../core/repositories/ingredient.repository';
import type { UserProfile } from '../../../core/models/user-profile.model';
import { NutritionAi } from '../../../core/services/ai/nutrition-ai';
import { DishAutofillApplier } from '../../../core/services/ai/dish-autofill-applier';
import { DishStore } from '../../../core/stores/dish.store';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import { ProfileStore } from '../../../core/stores/profile.store';
import DishEditPage from './dish-edit.page';

describe('DishEditPage (gram-only)', () => {
  let fixture: ComponentFixture<DishEditPage>;
  let component: DishEditPage;
  let navigateSpy: jasmine.Spy;

  const sampleIngredient: IngredientListItem = {
    id: 'ingredient-1',
    name: 'Trứng gà',
    category: 'Trứng & Sữa',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    source: 'manual',
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
  };

  const setup = async (
    paramMap: Record<string, string> = {},
    profile: UserProfile | null = null,
  ): Promise<void> => {
    const dishStore = {
      dishes: () => [],
      load: jasmine.createSpy().and.resolveTo(),
      fetchById: jasmine.createSpy('fetchById').and.resolveTo(null),
      addFromIngredients: jasmine.createSpy('addFromIngredients').and.resolveTo(),
      edit: jasmine.createSpy('edit').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
      countReferences: jasmine.createSpy('countReferences').and.resolveTo(0),
      findByNormalizedName: jasmine.createSpy('findByNormalizedName').and.resolveTo(null),
    };

    const ingredientStore = {
      ingredients: () => [sampleIngredient],
      load: jasmine.createSpy().and.resolveTo(),
    };

    const profileStore = {
      profile: signal<UserProfile | null>(profile),
    };

    const ingredientRepo = {
      findRecentlyUsed: jasmine.createSpy('findRecentlyUsed').and.resolveTo([]),
      findAllForFuzzy: jasmine.createSpy('findAllForFuzzy').and.resolveTo([]),
    };

    const nutritionAi = {
      autofillDish: jasmine.createSpy('autofillDish').and.resolveTo({
        rows: [],
        nameByLanguage: { en: '', vi: '' },
        servings: 1,
      }),
    };

    const autofillApplier = {
      apply: jasmine
        .createSpy('apply')
        .and.resolveTo({ ingredientCreations: [], dishIngredients: [] }),
    };

    const activatedRoute = {
      snapshot: { paramMap: convertToParamMap(paramMap) },
    };

    await TestBed.configureTestingModule({
      imports: [DishEditPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: DishStore, useValue: dishStore },
        { provide: IngredientStore, useValue: ingredientStore },
        { provide: ProfileStore, useValue: profileStore },
        { provide: IngredientRepository, useValue: ingredientRepo },
        { provide: NutritionAi, useValue: nutritionAi },
        { provide: DishAutofillApplier, useValue: autofillApplier },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(DishEditPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await setup();
  });

  it('creates the component in create mode (no id param)', () => {
    expect(component).toBeTruthy();
    expect(component.isEdit()).toBeFalse();
  });

  it('loads recent ingredients into picker on bootstrap', () => {
    const repo = TestBed.inject(IngredientRepository) as unknown as {
      findRecentlyUsed: jasmine.Spy;
    };
    expect(repo.findRecentlyUsed).toHaveBeenCalledWith(5);
    expect(component.recentIngredientOptions.length).toBe(0);
  });

  it('rejects submit when items list is empty', async () => {
    const access = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          description: string;
          servings: number;
          meal_tag: null;
          items: never[];
        }) => void;
      };
    };
    access.formSignal.set({
      name: 'Cơm trứng',
      description: '',
      servings: 2,
      meal_tag: null,
      items: [],
    });

    await component.onSave();

    const dishStore = TestBed.inject(DishStore) as unknown as {
      addFromIngredients: jasmine.Spy;
    };
    expect(dishStore.addFromIngredients).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('calls addFromIngredients with gram-only items in create mode', async () => {
    const access = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          description: string;
          servings: number;
          meal_tag: null;
          items: { local_id: string; ingredient_id: string; gram_weight: number }[];
        }) => void;
      };
    };

    access.formSignal.set({
      name: ' Cơm trứng ',
      description: ' nhanh ',
      servings: 1,
      meal_tag: null,
      items: [
        { local_id: 'item-1', ingredient_id: 'ingredient-1', gram_weight: 50 },
        { local_id: 'item-2', ingredient_id: 'ingredient-1', gram_weight: 25 },
      ],
    });

    await component.onSave();

    const dishStore = TestBed.inject(DishStore) as unknown as {
      addFromIngredients: jasmine.Spy;
    };
    expect(dishStore.addFromIngredients).toHaveBeenCalled();
    const [payload, items] = dishStore.addFromIngredients.calls.mostRecent().args;
    expect(payload.name).toBe('Cơm trứng');
    expect(payload.description).toBe('nhanh');
    expect(payload.servings).toBe(1);
    expect(payload.type).toBe('ingredient_based');
    expect(payload.source).toBe('custom');
    expect(payload.image_url).toBeNull();
    expect(items.length).toBe(2);
    expect(items[0].ingredient_id).toBe('ingredient-1');
    expect(items[0].gram_weight).toBe(50);
    expect(items[0].sort_order).toBe(0);
    expect(items[1].sort_order).toBe(1);
    // Gram-only contract: legacy fields must NOT be present.
    expect((items[0] as Record<string, unknown>)['amount_value']).toBeUndefined();
    expect((items[0] as Record<string, unknown>)['unit_id']).toBeUndefined();
    expect(navigateSpy).toHaveBeenCalledWith(['/tabs/management']);
  });

  it('calls edit() with gram-only items in edit mode', async () => {
    TestBed.resetTestingModule();
    await setup({ id: 'dish-42' });

    const access = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          description: string;
          servings: number;
          meal_tag: null;
          items: { local_id: string; ingredient_id: string; gram_weight: number }[];
        }) => void;
      };
    };

    access.formSignal.set({
      name: 'Cơm trứng',
      description: '',
      servings: 2,
      meal_tag: null,
      items: [{ local_id: 'item-1', ingredient_id: 'ingredient-1', gram_weight: 80 }],
    });

    await component.onSave();

    const dishStore = TestBed.inject(DishStore) as unknown as { edit: jasmine.Spy };
    expect(dishStore.edit).toHaveBeenCalled();
    const [id, payload, items] = dishStore.edit.calls.mostRecent().args;
    expect(id).toBe('dish-42');
    expect(payload.name).toBe('Cơm trứng');
    expect(items.length).toBe(1);
    expect(items[0].gram_weight).toBe(80);
  });

  it('computes preview totals per single serving (servings=1 → full sum)', () => {
    const access = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          description: string;
          servings: number;
          meal_tag: null;
          items: { local_id: string; ingredient_id: string; gram_weight: number }[];
        }) => void;
      };
    };
    access.formSignal.set({
      name: 'Test',
      description: '',
      servings: 1,
      meal_tag: null,
      items: [{ local_id: 'a', ingredient_id: 'ingredient-1', gram_weight: 200 }],
    });
    // 155 kcal/100g × 200g / 100 / 1 serving = 310
    expect(component.previewTotals().calories).toBeCloseTo(310, 5);
    expect(component.previewTotals().protein).toBeCloseTo(26, 5);
  });

  it('divides preview totals by servings when servings > 1', () => {
    const access = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          description: string;
          servings: number;
          meal_tag: null;
          items: { local_id: string; ingredient_id: string; gram_weight: number }[];
        }) => void;
      };
    };
    access.formSignal.set({
      name: 'Test',
      description: '',
      servings: 2,
      meal_tag: null,
      items: [{ local_id: 'a', ingredient_id: 'ingredient-1', gram_weight: 200 }],
    });
    // 310 kcal total / 2 servings = 155
    expect(component.previewTotals().calories).toBeCloseTo(155, 5);
    expect(component.previewTotals().protein).toBeCloseTo(13, 5);
  });

  describe('Nutrition Hero (DS §2.6)', () => {
    const setItems = (gramWeight: number): void => {
      const access = component as unknown as {
        formSignal: {
          set: (v: {
            name: string;
            description: string;
            servings: number;
            meal_tag: null;
            items: { local_id: string; ingredient_id: string; gram_weight: number }[];
          }) => void;
        };
      };
      access.formSignal.set({
        name: 'Test',
        description: '',
        servings: 1,
        meal_tag: null,
        items: [{ local_id: 'a', ingredient_id: 'ingredient-1', gram_weight: gramWeight }],
      });
    };

    it('returns "with-target" state and computes ring percent when profile target>0', async () => {
      TestBed.resetTestingModule();
      await setup({}, {
        id: 'p-1',
        target_calories: 2000,
        onboarding_completed: true,
      } as unknown as UserProfile);
      setItems(200); // 310 kcal total
      expect(component.targetCalories()).toBe(2000);
      expect(component.nutritionState()).toBe('with-target');
      // 310 / 2000 = 15.5% → rounded 16
      expect(component.caloriePercent()).toBe(16);
      // shares: P 26g×4=104, C 2.2g×4=8.8, F 22g×9=198 → total 310.8 → P≈33%, C≈3%, F≈64%
      const shares = component.macroKcalShares();
      expect(shares.protein + shares.carbs + shares.fat).toBeGreaterThan(95);
    });

    it('returns "no-target" state and 0 percent when profile target=0', async () => {
      TestBed.resetTestingModule();
      await setup({}, {
        id: 'p-1',
        target_calories: 0,
        onboarding_completed: false,
      } as unknown as UserProfile);
      setItems(200);
      expect(component.targetCalories()).toBe(0);
      expect(component.nutritionState()).toBe('no-target');
      expect(component.caloriePercent()).toBe(0);
    });

    it('returns "empty" state when totals.calories=0 (no items)', () => {
      // Default beforeEach setup: profile=null, no items.
      expect(component.previewTotals().calories).toBe(0);
      expect(component.nutritionState()).toBe('empty');
      expect(component.caloriePercent()).toBe(0);
      const shares = component.macroKcalShares();
      expect(shares).toEqual({ protein: 0, carbs: 0, fat: 0 });
    });
  });

  describe('onAskAi pre-check (duplicate dish name)', () => {
    const setName = (name: string): void => {
      const access = component as unknown as {
        formSignal: {
          set: (v: {
            name: string;
            description: string;
            servings: number;
            meal_tag: null;
            items: never[];
          }) => void;
        };
      };
      access.formSignal.set({
        name,
        description: '',
        servings: 1,
        meal_tag: null,
        items: [],
      });
    };

    it('blocks AI call and toasts when an existing dish has the same normalized name', async () => {
      const dishStore = TestBed.inject(DishStore) as unknown as {
        findByNormalizedName: jasmine.Spy;
      };
      const nutritionAi = TestBed.inject(NutritionAi) as unknown as {
        autofillDish: jasmine.Spy;
      };
      dishStore.findByNormalizedName.and.resolveTo({ id: 'dish-existing', name: 'Phở bò' });
      const toastSpy = spyOn(
        component as unknown as { presentToast: (m: string) => Promise<void> },
        'presentToast',
      ).and.resolveTo();

      setName('  phở bò  ');
      await component.onAskAi();

      expect(dishStore.findByNormalizedName).toHaveBeenCalledWith('phở bò');
      expect(nutritionAi.autofillDish).not.toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalledWith('Món "Phở bò" đã tồn tại');
    });

    it('proceeds to AI when name is not used by any other dish', async () => {
      const dishStore = TestBed.inject(DishStore) as unknown as {
        findByNormalizedName: jasmine.Spy;
      };
      const nutritionAi = TestBed.inject(NutritionAi) as unknown as {
        autofillDish: jasmine.Spy;
      };
      dishStore.findByNormalizedName.and.resolveTo(null);

      setName('Món hoàn toàn mới');
      await component.onAskAi();

      expect(dishStore.findByNormalizedName).toHaveBeenCalled();
      expect(nutritionAi.autofillDish).toHaveBeenCalled();
    });
  });
});
