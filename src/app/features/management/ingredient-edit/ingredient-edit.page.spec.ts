import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { IngredientStore } from '../../../core/stores/ingredient.store';
import { DishRepository } from '../../../core/repositories/dish.repository';
import { NutritionAi } from '../../../core/services/ai/nutrition-ai';
import IngredientEditPage from './ingredient-edit.page';

interface FormSignalAccessor {
  formSignal: {
    set: (value: {
      name: string;
      category: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    }) => void;
  };
}

describe('IngredientEditPage (gram-only)', () => {
  describe('create mode', () => {
    let fixture: ComponentFixture<IngredientEditPage>;
    let component: IngredientEditPage;
    let navigateSpy: jasmine.Spy;
    let ingredientStore: { add: jasmine.Spy; edit: jasmine.Spy; load: jasmine.Spy };

    beforeEach(async () => {
      ingredientStore = {
        ingredients: () => [] as never[],
        load: jasmine.createSpy().and.resolveTo(),
        add: jasmine.createSpy().and.resolveTo(),
        edit: jasmine.createSpy().and.resolveTo(),
      } as unknown as { add: jasmine.Spy; edit: jasmine.Spy; load: jasmine.Spy };

      const activatedRoute = {
        snapshot: { paramMap: convertToParamMap({}) },
      };

      await TestBed.configureTestingModule({
        imports: [IngredientEditPage],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: activatedRoute },
          { provide: IngredientStore, useValue: ingredientStore },
          { provide: NutritionAi, useValue: { lookupIngredient: jasmine.createSpy() } },
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

    it('renders Vietnamese category options', () => {
      const labels = component.categoryOptions.map((o) => o.label).join(' ');
      expect(labels).toContain('Trứng & Sữa');
      expect(labels).toContain('Rau củ');
    });

    it('saves new ingredient with gram-only payload and navigates back', async () => {
      const accessor = component as unknown as FormSignalAccessor;
      accessor.formSignal.set({
        name: 'Trứng gà',
        category: 'Trứng & Sữa',
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        fiber: 0,
      });

      await component.onSave();

      expect(ingredientStore.add).toHaveBeenCalledOnceWith({
        name: 'Trứng gà',
        category: 'Trứng & Sữa',
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        fiber: 0,
        source: 'manual',
      });
      expect(ingredientStore.edit).not.toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/tabs/management']);
    });

    it('does not save when form is invalid (missing name)', async () => {
      await component.onSave();
      expect(ingredientStore.add).not.toHaveBeenCalled();
    });

    it('scrolls the category trigger when category is invalid', fakeAsync(() => {
      const accessor = component as unknown as FormSignalAccessor;
      const target = {
        scrollIntoView: jasmine.createSpy('scrollIntoView'),
      } as unknown as HTMLElement;
      spyOn(document, 'querySelector').and.returnValue(target);
      accessor.formSignal.set({
        name: 'Trứng gà',
        category: '',
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        fiber: 0,
      });

      void component.onSave();
      tick();

      expect(document.querySelector).toHaveBeenCalledWith('.picker-trigger--floating');
      expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(ingredientStore.add).not.toHaveBeenCalled();
    }));

    it('scrolls the first number input when calories are invalid', fakeAsync(() => {
      const accessor = component as unknown as FormSignalAccessor;
      const target = {
        scrollIntoView: jasmine.createSpy('scrollIntoView'),
      } as unknown as HTMLElement;
      spyOn(document, 'querySelector').and.returnValue(target);
      accessor.formSignal.set({
        name: 'Trứng gà',
        category: 'Trứng & Sữa',
        calories: -1,
        protein: 13,
        carbs: 1,
        fat: 11,
        fiber: 0,
      });

      void component.onSave();
      tick();

      expect(document.querySelector).toHaveBeenCalledWith('input[type="number"]');
      expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(ingredientStore.add).not.toHaveBeenCalled();
    }));
  });

  describe('edit mode', () => {
    let fixture: ComponentFixture<IngredientEditPage>;
    let component: IngredientEditPage;
    let ingredientStore: {
      add: jasmine.Spy;
      edit: jasmine.Spy;
      load: jasmine.Spy;
      ingredients: () => {
        id: string;
        name: string;
        category: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        source: 'manual';
        created_at: string;
        updated_at: string | null;
      }[];
    };

    beforeEach(async () => {
      ingredientStore = {
        ingredients: () => [
          {
            id: 'ing-1',
            name: 'Trứng gà',
            category: 'Trứng & Sữa',
            calories: 155,
            protein: 13,
            carbs: 1,
            fat: 11,
            fiber: 0,
            source: 'manual',
            created_at: '2026-01-01',
            updated_at: null,
          },
        ],
        load: jasmine.createSpy().and.resolveTo(),
        add: jasmine.createSpy().and.resolveTo(),
        edit: jasmine.createSpy().and.resolveTo(),
      };

      const dishRepo = { listForIngredient: jasmine.createSpy().and.resolveTo([]) };

      const activatedRoute = {
        snapshot: { paramMap: convertToParamMap({ id: 'ing-1' }) },
      };

      await TestBed.configureTestingModule({
        imports: [IngredientEditPage],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: activatedRoute },
          { provide: IngredientStore, useValue: ingredientStore },
          { provide: NutritionAi, useValue: { lookupIngredient: jasmine.createSpy() } },
          { provide: DishRepository, useValue: dishRepo },
        ],
      }).compileComponents();

      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);

      fixture = TestBed.createComponent(IngredientEditPage);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('detects edit mode from id route param', () => {
      expect(component.isEdit()).toBeTrue();
      expect(component.ingredientId()).toBe('ing-1');
    });

    it('calls store.edit() on save with gram-only payload', async () => {
      await component.onSave();
      expect(ingredientStore.edit).toHaveBeenCalledOnceWith('ing-1', {
        name: 'Trứng gà',
        category: 'Trứng & Sữa',
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        fiber: 0,
        source: 'manual',
      });
      expect(ingredientStore.add).not.toHaveBeenCalled();
    });
  });
});
