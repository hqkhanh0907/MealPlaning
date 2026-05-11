import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DishRepository, type DishListItem } from '../../../core/repositories/dish.repository';
import { DishesUsingSheet } from './dishes-using-sheet';

describe('DishesUsingSheet', () => {
  let fixture: ComponentFixture<DishesUsingSheet>;
  let component: DishesUsingSheet;
  let repo: { findDishesUsingIngredient: jasmine.Spy };

  const sampleDishes: DishListItem[] = [
    {
      id: 'dish-1',
      name: 'Bún bò',
      description: 'Đặc sản Huế',
      type: 'ingredient_based',
      source: 'custom',
      servings: 2,
      image_url: null,
      meal_tag: null,
      is_favorite: 0,
      created_at: '2026-04-26T00:00:00Z',
      updated_at: null,
      total_calories: 650,
      total_protein: 30,
      total_carbs: 70,
      total_fat: 18,
      total_fiber: 4,
    } as DishListItem,
  ];

  beforeEach(async () => {
    repo = {
      findDishesUsingIngredient: jasmine.createSpy('findDishesUsingIngredient').and.resolveTo([]),
    };

    await TestBed.configureTestingModule({
      imports: [DishesUsingSheet],
      providers: [{ provide: DishRepository, useValue: repo }],
    }).compileComponents();

    fixture = TestBed.createComponent(DishesUsingSheet);
    component = fixture.componentInstance;
    component.ingredientId = 'ingredient-x';
    fixture.detectChanges();
  });

  it('does not query dishes until isOpen flips to true', () => {
    expect(repo.findDishesUsingIngredient).not.toHaveBeenCalled();
  });

  it('loads dishes when isOpen becomes true', async () => {
    repo.findDishesUsingIngredient.and.resolveTo(sampleDishes);
    component.isOpen = true;
    await fixture.whenStable();
    expect(repo.findDishesUsingIngredient).toHaveBeenCalledWith('ingredient-x');
  });

  it('emits dishSelected and closes when a dish row is selected', async () => {
    repo.findDishesUsingIngredient.and.resolveTo(sampleDishes);
    const selectedSpy = jasmine.createSpy('selected');
    const closedSpy = jasmine.createSpy('closed');
    component.dishSelected.subscribe(selectedSpy);
    component.closed.subscribe(closedSpy);
    component.isOpen = true;
    await fixture.whenStable();

    const access = component as unknown as { onSelect: (d: DishListItem) => void };
    access.onSelect(sampleDishes[0]);

    expect(selectedSpy).toHaveBeenCalledWith('dish-1');
    expect(closedSpy).toHaveBeenCalled();
    expect(component.isOpen).toBeFalse();
  });

  it('handles repo errors gracefully and surfaces an error message', async () => {
    repo.findDishesUsingIngredient.and.rejectWith(new Error('boom'));
    component.isOpen = true;
    await fixture.whenStable();
    const access = component as unknown as { errorMessage: () => string | null };
    expect(access.errorMessage()).toBe('boom');
  });
});
