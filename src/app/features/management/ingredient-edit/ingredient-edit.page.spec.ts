import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import type { UnitModel } from '../../../core/models/management.model';
import { UnitRepository } from '../../../core/repositories/unit.repository';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import IngredientEditPage from './ingredient-edit.page';

describe('IngredientEditPage', () => {
  let fixture: ComponentFixture<IngredientEditPage>;
  let component: IngredientEditPage;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    const ingredientStore = {
      ingredients: () => [],
      load: jasmine.createSpy().and.resolveTo(),
      add: jasmine.createSpy().and.resolveTo(),
      edit: jasmine.createSpy().and.resolveTo(),
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

    const activatedRoute = {
      snapshot: { paramMap: convertToParamMap({}) },
    };

    await TestBed.configureTestingModule({
      imports: [IngredientEditPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: IngredientStore, useValue: ingredientStore },
        { provide: UnitRepository, useValue: unitRepository },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(IngredientEditPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('starts in create mode (no id param)', () => {
    expect(component.isEdit()).toBeFalse();
  });

  it('renders category options', () => {
    const categories = component.categoryOptions.map((o) => o.label).join(' ');
    expect(categories).toContain('Trứng & Sữa');
    expect(categories).toContain('Rau củ');
  });

  it('saves new ingredient and navigates back to management', async () => {
    const protectedAccess = component as unknown as {
      formSignal: {
        set: (v: {
          name: string;
          category: string;
          nutrition_basis_unit: 'g';
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          density_g_per_ml: null;
          units: {
            local_id: string;
            unit_id: string;
            factor_to_basis: number;
            is_default: boolean;
            display_label: string;
            is_approximate: boolean;
            short_name_vi: string;
          }[];
        }) => void;
      };
    };

    protectedAccess.formSignal.set({
      name: 'Trứng gà',
      category: 'Trứng & Sữa',
      nutrition_basis_unit: 'g',
      calories: 155,
      protein: 13,
      carbs: 1,
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

    await component.onSave();

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as { add: jasmine.Spy };
    expect(ingredientStore.add).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/tabs/management']);
  });
});
