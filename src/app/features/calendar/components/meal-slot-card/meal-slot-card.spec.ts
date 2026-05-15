import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  MealSlotWithDishes,
  MealType,
  PlannedDishWithEffective,
} from '../../../../core/models/meal-plan.types';
import { MealSlotCard } from './meal-slot-card';

function makeDish(overrides: Partial<PlannedDishWithEffective> = {}): PlannedDishWithEffective {
  return {
    id: 'pd-1',
    meal_slot_id: 'slot-1',
    dish_id: 'dish-1',
    servings: 1,
    sort_order: 0,
    is_completed: 0,
    completed_at: null,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    created_at: '2026-05-10T08:00:00Z',
    dish_name: 'Phở bò',
    effective_calories: 450,
    effective_protein: 30,
    effective_carbs: 50,
    effective_fat: 12,
    effective_fiber: 5,
    ...overrides,
  };
}

function makeSlot(dishes: PlannedDishWithEffective[]): MealSlotWithDishes {
  return {
    id: 'slot-1',
    day_plan_id: 'dp-1',
    meal_type: 'breakfast',
    position: 0,
    created_at: '2026-05-10T07:00:00Z',
    planned_dishes: dishes,
  };
}

describe('MealSlotCard', () => {
  let fixture: ComponentFixture<MealSlotCard>;
  let component: MealSlotCard;

  function setInputs(slot: MealSlotWithDishes, mealType: MealType): void {
    fixture.componentRef.setInput('slot', slot);
    fixture.componentRef.setInput('mealType', mealType);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MealSlotCard] });
    fixture = TestBed.createComponent(MealSlotCard);
    component = fixture.componentInstance;
  });

  describe('Vietnamese labels', () => {
    it('breakfast → Bữa sáng', () => {
      setInputs(makeSlot([]), 'breakfast');
      expect(component.label()).toBe('Bữa sáng');
    });

    it('lunch → Bữa trưa', () => {
      setInputs(makeSlot([]), 'lunch');
      expect(component.label()).toBe('Bữa trưa');
    });

    it('dinner → Bữa chiều', () => {
      setInputs(makeSlot([]), 'dinner');
      expect(component.label()).toBe('Bữa chiều');
    });

    it('snack → Bữa phụ', () => {
      setInputs(makeSlot([]), 'snack');
      expect(component.label()).toBe('Bữa phụ');
    });
  });

  describe('totalCalories', () => {
    it('sums planned effective calories for planning visibility', () => {
      setInputs(
        makeSlot([makeDish({ is_completed: 0 }), makeDish({ id: 'pd-2', is_completed: 0 })]),
        'breakfast',
      );
      expect(component.totalCalories()).toBe(900);
    });

    it('sums effective_calories of planned and logged dishes', () => {
      setInputs(
        makeSlot([
          makeDish({
            id: 'pd-1',
            is_completed: 1,
            completed_at: '2026-05-10T08:00:00Z',
            effective_calories: 450,
          }),
          makeDish({ id: 'pd-2', is_completed: 0, effective_calories: 300 }),
          makeDish({
            id: 'pd-3',
            is_completed: 1,
            completed_at: '2026-05-10T08:30:00Z',
            effective_calories: 200,
          }),
        ]),
        'breakfast',
      );
      expect(component.totalCalories()).toBe(950);
    });
  });

  describe('outputs', () => {
    it('emits openLog with mealType on tap [+]', () => {
      setInputs(makeSlot([]), 'lunch');
      const spy = jasmine.createSpy('openLog');
      component.openLog.subscribe(spy);
      component.onAddTap();
      expect(spy).toHaveBeenCalledWith('lunch');
    });

    it('emits markEaten with id when planned dish action tapped', () => {
      setInputs(makeSlot([makeDish({ id: 'pd-99', is_completed: 0 })]), 'dinner');
      const spy = jasmine.createSpy('markEaten');
      component.markEaten.subscribe(spy);
      component.onActionTap('pd-99', 0);
      expect(spy).toHaveBeenCalledWith('pd-99');
    });

    it('emits unmarkEaten with id when logged dish action tapped', () => {
      setInputs(
        makeSlot([
          makeDish({ id: 'pd-77', is_completed: 1, completed_at: '2026-05-10T08:00:00Z' }),
        ]),
        'dinner',
      );
      const spy = jasmine.createSpy('unmarkEaten');
      component.unmarkEaten.subscribe(spy);
      component.onActionTap('pd-77', 1);
      expect(spy).toHaveBeenCalledWith('pd-77');
    });

    it('does NOT emit markEaten when action is for logged dish', () => {
      setInputs(makeSlot([]), 'breakfast');
      const spy = jasmine.createSpy('markEaten');
      component.markEaten.subscribe(spy);
      component.onActionTap('pd-x', 1);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('long-press (Story 3.7 AC-3)', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('emits dishLongPress after 500ms hold', () => {
      setInputs(makeSlot([makeDish({ id: 'pd-99' })]), 'breakfast');
      const spy = jasmine.createSpy('long');
      component.dishLongPress.subscribe(spy);
      component.onPressStart('pd-99');
      jasmine.clock().tick(499);
      expect(spy).not.toHaveBeenCalled();
      jasmine.clock().tick(2);
      expect(spy).toHaveBeenCalledWith('pd-99');
    });

    it('cancel before 500ms suppresses emit', () => {
      setInputs(makeSlot([]), 'breakfast');
      const spy = jasmine.createSpy('long');
      component.dishLongPress.subscribe(spy);
      component.onPressStart('pd-1');
      jasmine.clock().tick(200);
      component.onPressCancel();
      jasmine.clock().tick(1000);
      expect(spy).not.toHaveBeenCalled();
    });

    it('subsequent tap is suppressed once if long-press fired', () => {
      setInputs(makeSlot([makeDish({ id: 'pd-1', is_completed: 0 })]), 'breakfast');
      const longSpy = jasmine.createSpy('long');
      const markSpy = jasmine.createSpy('mark');
      component.dishLongPress.subscribe(longSpy);
      component.markEaten.subscribe(markSpy);
      component.onPressStart('pd-1');
      jasmine.clock().tick(600);
      expect(longSpy).toHaveBeenCalled();
      // Click event after long-press should be eaten:
      component.onActionTap('pd-1', 0);
      expect(markSpy).not.toHaveBeenCalled();
      // Next tap goes through normally:
      component.onActionTap('pd-1', 0);
      expect(markSpy).toHaveBeenCalledWith('pd-1');
    });
  });

  describe('rendered DOM', () => {
    it('renders empty hint when no dishes', () => {
      setInputs(makeSlot([]), 'breakfast');
      const empty = (fixture.nativeElement as HTMLElement).querySelector('.meal-slot__empty');
      expect(empty?.textContent).toContain('Chưa có món');
    });

    it('renders expected kcal for planned rows', () => {
      setInputs(makeSlot([makeDish({ is_completed: 0 })]), 'breakfast');
      const cal = (fixture.nativeElement as HTMLElement).querySelector('.meal-slot__cal');
      expect(cal?.textContent).toContain('450 kcal dự kiến');
    });

    it('renders status-pill + numeric calo for logged rows', () => {
      setInputs(
        makeSlot([
          makeDish({
            is_completed: 1,
            completed_at: '2026-05-10T08:00:00Z',
            effective_calories: 450,
          }),
        ]),
        'breakfast',
      );
      const pill = (fixture.nativeElement as HTMLElement).querySelector('app-status-pill');
      const cal = (fixture.nativeElement as HTMLElement).querySelector('.meal-slot__cal');
      expect(pill).toBeTruthy();
      expect(cal?.textContent).toContain('450 kcal');
    });

    it('action button label switches with completion state', () => {
      setInputs(makeSlot([makeDish({ is_completed: 0 })]), 'breakfast');
      let btn = (fixture.nativeElement as HTMLElement).querySelector('.meal-slot__action');
      expect(btn?.textContent?.trim()).toBe('Đã ăn');

      setInputs(
        makeSlot([makeDish({ is_completed: 1, completed_at: '2026-05-10T08:00:00Z' })]),
        'breakfast',
      );
      btn = (fixture.nativeElement as HTMLElement).querySelector('.meal-slot__action');
      expect(btn?.textContent?.trim()).toBe('Bỏ đánh dấu');
    });
  });
});
