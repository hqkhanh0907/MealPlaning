import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IonModal } from '@ionic/angular/standalone';
import type { DishListItem } from '../../../../core/repositories/dish.repository';
import {
  LoggingModal,
  type LoggingDishSelection,
} from '../../components/logging-modal/logging-modal';
import { LoggingPicker } from './logging-picker';
import { loadLoggingPicker, type PickerData, type PickerAction } from './picker-renderer';

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

function dish(id: string, name: string, is_favorite: 0 | 1): DishListItem {
  return {
    id,
    name,
    is_favorite,
    type: 'ingredient_based',
    source: 'custom',
    servings: 1,
    image_url: null,
    meal_tag: 'lunch',
    description: null,
    created_at: '2026-11-28T00:00:00Z',
    updated_at: null,
    total_calories: 499.5,
    total_protein: 12.5,
    total_fat: 18.49,
    total_carbs: 63.1,
    total_fiber: 3,
  };
}

describe('Rust dish picker matches the original meal logging sheet', () => {
  it('filters the library, recent and saved dishes and emits exact servings from each path', async () => {
    const renderer = await loadLoggingPicker();
    TestBed.configureTestingModule({ imports: [LoggingModal] });
    const old = TestBed.createComponent(LoggingModal);
    const component = old.componentInstance;
    const library = [dish('a', 'Cơm gà', 1), dish('b', 'BÚN BÒ', 0)];
    const data: PickerData = {
      mealLabel: 'bữa trưa',
      allDishes: library,
      recentDishes: [library[1]],
      loading: false,
      aiLoading: false,
      aiDisabledReason: null,
      aiSuggestions: [
        { dishId: 'a', dishName: 'Cơm từ gợi ý', reason: 'Có trong thư viện', servings: 2.5 },
        { dishId: 'missing', dishName: 'Món lạ', reason: '', servings: 3 },
      ],
    };
    const syncInputs = (): void => {
      Object.entries(data).forEach(([key, value]) => old.componentRef.setInput(key, value));
      old.detectChanges();
    };
    syncInputs();
    const expected: LoggingDishSelection[] = [];
    component.dishSelected.subscribe((s) => expected.push(s));
    const actions: PickerAction[] = [];
    const body = document.createElement('div');
    const picker = renderer.mountLoggingPicker(body, JSON.stringify(data), 1, (a) =>
      actions.push(a),
    );
    const buttons = (selector: string): HTMLButtonElement[] =>
      Array.from(body.querySelectorAll<HTMLButtonElement>(selector));
    const checkRows = (): void => {
      const rows = buttons('.logging-modal__dish');
      expect(rows.map((r) => r.querySelector('.logging-modal__dish-name')?.textContent)).toEqual(
        component.visibleDishes().map((d) => d.name),
      );
      expect(rows.map((r) => r.querySelector('.logging-modal__dish-meta')?.textContent)).toEqual(
        component.visibleDishes().map((d) => component.describeDish(d)),
      );
      expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual(
        component.visibleDishes().map((d) => 'Thêm ' + d.name + ' vào ' + data.mealLabel),
      );
    };
    try {
      await frame();
      checkRows();
      const firstDish = buttons('.logging-modal__dish')[0];
      data.aiLoading = true;
      picker.update(JSON.stringify(data));
      await frame();
      expect(buttons('.logging-modal__dish')[0]).toBe(firstDish);
      data.aiLoading = false;
      picker.update(JSON.stringify(data));
      for (const [index, tab] of (['all', 'recent', 'favorites'] as const).entries()) {
        component.setTab(tab);
        buttons('[role="tab"]')[index].click();
        await frame();
        checkRows();
      }
      component.setTab('all');
      buttons('[role="tab"]')[0].click();
      for (const search of ['  bÚn  ', '\uFEFFbÚn\uFEFF', 'bun', '']) {
        component.onQueryChange(search);
        picker.search(search);
        await frame();
        checkRows();
        if (!component.visibleDishes().length) {
          expect(body.querySelector('.logging-modal__empty p')?.textContent).toBe(
            component.emptyMessage(),
          );
          buttons('.logging-modal__create')[0].click();
          expect(actions.at(-1)).toEqual({ type: 'create' });
        }
      }
      for (let i = 0; i < 42; i++) {
        buttons('[aria-label="Tăng khẩu phần"]')[0].click();
        component.increaseServings();
      }
      await frame();
      expect(body.querySelector('output')?.textContent).toBe(String(component.servings()));
      for (let i = 0; i < 42; i++) {
        buttons('[aria-label="Giảm khẩu phần"]')[0].click();
        component.decreaseServings();
      }
      await frame();
      expect(body.querySelector('output')?.textContent).toBe(String(component.servings()));
      buttons('.logging-modal__dish')[1].click();
      component.selectDish(library[1]);
      data.aiSuggestions.forEach((suggestion, index) => {
        buttons('.logging-modal__ai-card')[index].click();
        component.selectAiSuggestion(suggestion);
      });
      const selections = actions
        .filter((a) => a.type === 'selected')
        .map(({ dishId, dishName, servings }) => ({ dishId, dishName, servings }));
      expect(selections).toEqual(expected);
      expect(selections.length).toBe(2);
      buttons('.logging-modal__ai-button')[0].click();
      expect(actions.at(-1)).toEqual({ type: 'ai' });
      data.aiDisabledReason = 'Cần kết nối mạng';
      data.loading = true;
      picker.update(JSON.stringify(data));
      await frame();
      expect(buttons('.logging-modal__ai-button')[0].disabled).toBeTrue();
      expect(body.querySelector('.logging-modal__ai-state')?.textContent).toBe(
        data.aiDisabledReason,
      );
      expect(body.querySelector('.logging-modal__loading')?.textContent).toBe(
        'Đang tải thư viện món…',
      );
      expect(buttons('.logging-modal__ai-card').length).toBe(0);
    } finally {
      picker.free();
    }
  });

  it('opens the recipe editor only after Ionic confirms dismissal', async () => {
    TestBed.configureTestingModule({ imports: [LoggingPicker] });
    const fixture = TestBed.createComponent(LoggingPicker);
    fixture.detectChanges();
    const modal: IonModal = fixture.debugElement.query(By.directive(IonModal)).componentInstance;
    const resolve: ((ok: boolean) => void)[] = [];
    spyOn(modal, 'dismiss').and.callFake(() => new Promise<boolean>((r) => resolve.push(r)));
    const create = jasmine.createSpy('recipe editor');
    fixture.componentInstance.createDishRequested.subscribe(create);
    for (const ok of [false, true]) {
      const result = fixture.componentInstance['handleAction']({ type: 'create' });
      expect(create).not.toHaveBeenCalled();
      resolve.shift()!(ok);
      await result;
      expect(create).toHaveBeenCalledTimes(Number(ok));
    }
  });
});
