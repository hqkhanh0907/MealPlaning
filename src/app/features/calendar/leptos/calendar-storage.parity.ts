import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular, ToastController } from '@ionic/angular/standalone';
import { Database } from '../../../core/services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../../../core/services/database/__test__/create-test-database';
import { DayPlanRepository } from '../../../core/repositories/day-plan.repository';
import { LocalDay } from '../../../core/stores/local-day';
import { CalendarStore } from '../../../core/stores/calendar.store';
import { NetworkStore } from '../../../core/stores/network.store';
import { MealPlanAi } from '../../../core/services/ai/meal-plan-ai';
import { MenuSuggestionAi } from '../../../core/services/ai/menu-suggestion-ai';
import { AiAvailability } from '../../../shared/ai-availability';
import CalendarPage from '../calendar.page';
import LeptosCalendarPage from './calendar.page';

const date = '2026-11-28',
  otherDate = '2026-11-29';
async function readiness(
  fixture: ComponentFixture<CalendarPage>,
  predicate: () => boolean,
  expected = 'calendar state',
) {
  const until = performance.now() + 3000;
  while (!predicate()) {
    if (performance.now() > until)
      throw new Error(
        'Calendar did not reach ' + expected + ': ' + fixture.nativeElement.textContent,
      );
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  fixture.detectChanges();
}

async function scenario(component: typeof CalendarPage | typeof LeptosCalendarPage) {
  const db = await createTestDatabase();
  const dishId = crypto.randomUUID(),
    ingredient = crypto.randomUUID();
  await db.execute(
    "INSERT INTO dish(id,name,type,source) VALUES(?,?,'ingredient_based','custom')",
    [dishId, 'Cơm đậu'],
  );
  await db.execute(
    "INSERT INTO ingredient(id,name,category,calories,protein,carbs,fat,fiber) VALUES(?,?,'Khác',100,8,13,2,3)",
    [ingredient, 'Đậu thử'],
  );
  await db.execute(
    'INSERT INTO dish_ingredient(id,dish_id,ingredient_id,gram_weight) VALUES(?,?,?,100)',
    [crypto.randomUUID(), dishId, ingredient],
  );
  const online = signal(false);
  const issue = signal<string | null>('Cần kết nối mạng để dùng AI');
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      provideIonicAngular(),
      { provide: Database, useValue: db },
      { provide: NetworkStore, useValue: { online } },
      { provide: AiAvailability, useValue: { textIssue: issue } },
      {
        provide: MealPlanAi,
        useValue: {
          planDay: async () => [
            { mealType: 'dinner', dishId, servings: 0.5, reason: 'Dữ liệu kiểm thử' },
          ],
        },
      },
      { provide: MenuSuggestionAi, useValue: {} },
      {
        provide: ToastController,
        useValue: {
          create: async () => ({ present: async () => undefined, dismiss: async () => true }),
        },
      },
    ],
  }).compileComponents();
  TestBed.inject(LocalDay).iso.set(date);
  const repo = TestBed.inject(DayPlanRepository),
    store = TestBed.inject(CalendarStore);
  const fixture: ComponentFixture<CalendarPage> = TestBed.createComponent<CalendarPage>(component);
  const root: HTMLElement = fixture.nativeElement,
    page = fixture.componentInstance;
  const results: unknown[] = [];
  async function read(target = date) {
    const plan = await repo.findByDate(target);
    return (
      plan?.meal_slots.flatMap((s) =>
        s.planned_dishes.map((d) => [
          s.meal_type,
          d.dish_name,
          d.servings,
          d.is_completed,
          d.effective_calories,
          d.calories,
          !!d.completed_at,
        ]),
      ) ?? []
    );
  }
  async function click(selector: string, text?: string) {
    const find = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).find(
        (el) => text === undefined || el.textContent?.includes(text),
      );
    await readiness(fixture, () => !!find(), selector + ' ' + (text ?? ''));
    find()!.click();
    fixture.detectChanges();
  }
  async function hasRow(meal: string, completed: number) {
    await readiness(
      fixture,
      () =>
        !!store
          .dayPlan()
          ?.meal_slots.find((s) => s.meal_type === meal)
          ?.planned_dishes.some((d) => d.is_completed === completed),
      meal + ', is_completed=' + completed,
    );
  }
  try {
    fixture.detectChanges();
    const modal = root.querySelector<HTMLElement>('ion-modal')!;
    await click('.empty-day__btn--primary');
    await readiness(
      fixture,
      () => page.loggingModalOpen() && !page.loggingLoading(),
      'open sheet with library loaded',
    );
    const pickerDish = () => modal.querySelector<HTMLButtonElement>('.logging-modal__dish');
    await readiness(fixture, () => !!pickerDish(), 'visible Ionic dish picker');
    modal.querySelector<HTMLButtonElement>('[aria-label="Tăng khẩu phần"]')!.click();
    await readiness(
      fixture,
      () => modal.querySelector('.logging-modal__stepper output')?.textContent?.trim() === '1.5',
      '1.5 servings',
    );
    (pickerDish() as HTMLButtonElement).click();
    await hasRow('breakfast', 0);
    results.push(await read());
    await click('.meal-slot__action', 'Ghi đã ăn');
    await click('app-confirm-eat-modal .dialog-btn-primary');
    await hasRow('breakfast', 1);
    await db.execute('UPDATE ingredient SET calories=200 WHERE id=?', [ingredient]);
    results.push(await read());
    await click('.meal-slot__action', 'Bỏ đánh dấu');
    await click('app-confirm-eat-modal .dialog-btn-primary');
    await hasRow('breakfast', 0);
    results.push(await read());
    await click('.meal-slot__options');
    await click('.sheet-action', 'Di chuyển');
    await click('.msp-chip', 'Trưa');
    await hasRow('lunch', 0);
    results.push(await read());
    await click('.meal-slot__options');
    await click('.sheet-action', 'Sao chép');
    await page.onCopyDatePicked(otherDate);
    results.push(await read(otherDate));
    await click('.meal-slot__options');
    await click('.sheet-action', 'Xoá');
    await readiness(fixture, () => !!page.activeUndo());
    results.push(await read());
    await click('.undo-toast__btn', 'Hoàn tác');
    await hasRow('lunch', 0);
    results.push(await read());
    online.set(true);
    issue.set(null);
    await click('.calendar-ai-cta');
    await hasRow('dinner', 0);
    results.push(await read());
    store.setDate('2026-12-05');
    await click('.calendar-view-toggle');
    await click('.week-view__copy-btn');
    await click('app-confirm-dialog .dialog-actions button', 'Sao chép');
    await readiness(fixture, () => !page.copyingPreviousWeek());
    results.push(await read('2026-12-05'));
    return results;
  } finally {
    fixture.destroy();
    TestBed.resetTestingModule();
    teardownTestDatabase();
  }
}
describe('Calendar writes through the app SQLite repositories', () => {
  it('preserves logged snapshots and restores the moved meal on both renderers', async () => {
    const old = await scenario(CalendarPage);
    const rust = await scenario(LeptosCalendarPage);
    expect(rust).toEqual(old);
    expect(rust).toEqual([
      [['breakfast', 'Cơm đậu', 1.5, 0, 150, null, false]],
      [['breakfast', 'Cơm đậu', 1.5, 1, 150, 150, true]],
      [['breakfast', 'Cơm đậu', 1.5, 0, 300, null, false]],
      [['lunch', 'Cơm đậu', 1.5, 0, 300, null, false]],
      [['lunch', 'Cơm đậu', 1.5, 0, 300, null, false]],
      [],
      [['lunch', 'Cơm đậu', 1.5, 0, 300, null, false]],
      [['dinner', 'Cơm đậu', 0.5, 0, 100, null, false]],
      [['dinner', 'Cơm đậu', 0.5, 0, 100, null, false]],
    ]);
  }, 20000);
});
