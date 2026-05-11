import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { DishListItem } from '../../../../core/repositories/dish.repository';
import { LoggingModal } from './logging-modal';

function makeDish(overrides: Partial<DishListItem> = {}): DishListItem {
  return {
    id: 'dish-1',
    name: 'Cơm gà',
    description: null,
    type: 'ingredient_based',
    source: 'custom',
    servings: 1,
    image_url: null,
    meal_tag: 'lunch',
    is_favorite: 0,
    created_at: '2026-05-10T00:00:00Z',
    updated_at: null,
    total_calories: 500,
    total_protein: 35,
    total_carbs: 60,
    total_fat: 12,
    total_fiber: 4,
    ...overrides,
  };
}

describe('LoggingModal', () => {
  let fixture: ComponentFixture<LoggingModal>;
  let component: LoggingModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoggingModal] }).compileComponents();
    fixture = TestBed.createComponent(LoggingModal);
    component = fixture.componentInstance;
  });

  it('filters all dishes by Vietnamese query', () => {
    fixture.componentRef.setInput('allDishes', [
      makeDish({ id: 'dish-1', name: 'Cơm gà' }),
      makeDish({ id: 'dish-2', name: 'Phở bò' }),
    ]);
    component.onQueryChange('phở');
    fixture.detectChanges();

    expect(component.visibleDishes().map((dish) => dish.name)).toEqual(['Phở bò']);
  });

  it('switches to favorite tab using is_favorite flag', () => {
    fixture.componentRef.setInput('allDishes', [
      makeDish({ id: 'dish-1', name: 'Cơm gà', is_favorite: 0 }),
      makeDish({ id: 'dish-2', name: 'Ức gà', is_favorite: 1 }),
    ]);
    component.setTab('favorites');
    fixture.detectChanges();

    expect(component.visibleDishes().map((dish) => dish.name)).toEqual(['Ức gà']);
  });

  it('emits selected dish with current servings', () => {
    const emitted: unknown[] = [];
    component.dishSelected.subscribe((selection) => emitted.push(selection));
    component.increaseServings();
    component.selectDish(makeDish({ id: 'dish-9', name: 'Bún bò' }));

    expect(emitted).toEqual([{ dishId: 'dish-9', dishName: 'Bún bò', servings: 1.5 }]);
  });

  it('emits AI suggestion with AI-proposed servings when dish exists', () => {
    const emitted: unknown[] = [];
    fixture.componentRef.setInput('allDishes', [makeDish({ id: 'dish-1', name: 'Cơm gà' })]);
    component.dishSelected.subscribe((selection) => emitted.push(selection));

    component.selectAiSuggestion({
      dishId: 'dish-1',
      dishName: 'Cơm gà',
      servings: 0.5,
      reason: 'Protein vừa đủ cho bữa trưa.',
    });

    expect(emitted).toEqual([{ dishId: 'dish-1', dishName: 'Cơm gà', servings: 0.5 }]);
  });
});
