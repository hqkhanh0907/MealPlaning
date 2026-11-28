import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { ZERO_TOTALS } from '../../core/models/nutrition';
import { DayPlanRepository } from '../../core/repositories/day-plan.repository';
import { PhotoMealRepository } from '../../core/repositories/photo-meal.repository';
import { UserProfileRepository } from '../../core/repositories/user-profile.repository';
import { WorkoutRepository } from '../../core/repositories/workout.repository';
import { FoodImageAi } from '../../core/services/ai/food-image-ai';
import { InsightAi } from '../../core/services/ai/insight-ai';
import { CameraCapture } from '../../core/services/camera/camera-capture';
import { NutritionQuery } from '../../core/services/nutrition/nutrition-query';
import { CalendarStore } from '../../core/stores/calendar.store';
import { LocalDay } from '../../core/stores/local-day';
import { NutritionStore } from '../../core/stores/nutrition.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { DashboardStore } from '../../core/stores/dashboard.store';
import { NetworkStore } from '../../core/stores/network.store';
import { AiAvailability } from '../../shared/ai-availability';
import DashboardPage from './dashboard.page';
import LeptosDashboardPage from './leptos-dashboard.page';
import { loadDashboardRenderer } from './leptos-renderer';

function fixtureData() {
  const portion = {
    item: {
      name: 'Bún bò Huế',
      estimatedGrams: 120,
      calories: 200,
      protein: 12.6,
      carbs: 20.2,
      fat: 5.5,
      fiber: 3,
      warning: null,
      confidence: 'low' as const,
    },
    grams: 135,
    included: true,
  };
  const draft: NonNullable<ReturnType<DashboardStore['photoDraft']>> = {
    captureId: 'same-photo',
    date: '2026-11-28',
    mealType: 'lunch',
    analysis: {
      overallConfidence: 'low',
      imageQualityWarning: 'Ảnh hơi tối',
      items: [portion.item],
    },
    portions: [portion],
  };
  const pending = { date: '2026-11-28', mealType: 'lunch' as const, plannedDishId: 'lunch-1' };
  const aiInsight = {
    title: 'Nhận xét hôm nay',
    body: 'Nội dung nhận xét.',
    action: 'Thêm rau.',
    tone: 'info',
  };
  return {
    draft,
    pending,
    aiInsight,
    targets: signal({ ...ZERO_TOTALS, fiber: 25 }),
    online: signal(true),
    availability: {
      textIssue: signal<string | null>(null),
      photoIssue: signal<string | null>(null),
    },
  };
}

function screen(root: HTMLElement) {
  const clean = (text: string | null) => text?.replace(/\s+/g, ' ').trim() ?? '';
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  return {
    headings: all('h1,h2').map((item) => [item.id, clean(item.textContent)]),
    links: all('ion-content a').map((item) => [
      item.getAttribute('href'),
      item.getAttribute('aria-label'),
      clean(item.textContent),
    ]),
    controls: all('ion-content button,ion-content ion-button,ion-footer ion-button').map((item) => [
      clean(item.textContent),
      item.getAttribute('aria-label'),
      (item as HTMLButtonElement).disabled === true,
    ]),
    nutrition: all('.nutrition-overview span,.nutrition-overview small').map((item) =>
      clean(item.textContent),
    ),
    macros: all('.macro-item').map((item) => [
      clean(item.querySelector('.macro-item__header')?.textContent ?? null),
      clean(item.querySelector('.macro-item__meta')?.textContent ?? null),
      item
        .querySelector<HTMLElement>('.progress-fill')
        ?.style.getPropertyValue('--progress')
        .trim(),
    ]),
    data: all('dt,dd,.macro-item__meta,p,li strong,li span,.stat-list small').map((item) =>
      clean(item.textContent),
    ),
    checkboxes: all('ion-checkbox').map((item) => [
      item.getAttribute('aria-label'),
      (item as HTMLIonCheckboxElement).checked,
      (item as HTMLIonCheckboxElement).disabled,
    ]),
    inputs: all('input:not([type="hidden"]),select').map((item) => [
      item.id,
      (item as HTMLInputElement).value,
      item.getAttribute('aria-invalid'),
      item.getAttribute('aria-describedby'),
    ]),
  };
}

describe('Angular and Leptos dashboard parity', () => {
  it('renders and edits the same live data in both implementations', async () => {
    await loadDashboardRenderer();
    const data = fixtureData();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        DashboardStore,
        { provide: NetworkStore, useValue: { online: data.online } },
        { provide: CalendarStore, useValue: { invalidationTick: signal(0) } },
        { provide: LocalDay, useValue: { iso: signal('2026-11-28') } },
        { provide: ProfileStore, useValue: { profile: signal(null) } },
        { provide: NutritionStore, useValue: { targets: data.targets } },
        {
          provide: InsightAi,
          useValue: { providerName: 'Groq', generateDailyInsight: async () => data.aiInsight },
        },
        ...[
          DayPlanRepository,
          PhotoMealRepository,
          UserProfileRepository,
          WorkoutRepository,
          FoodImageAi,
          CameraCapture,
          NutritionQuery,
        ].map((provide) => ({ provide, useValue: {} })),
        { provide: AiAvailability, useValue: data.availability },
      ],
    });
    const store = TestBed.inject(DashboardStore);
    spyOn(store, 'refresh').and.resolveTo();
    const setName = spyOn(store, 'setPhotoName');
    const setGrams = spyOn(store, 'setPhotoGrams');
    store.todayIso.set('2026-11-28');
    store.loading.set(false);
    const original = TestBed.createComponent(DashboardPage);
    const migrated = TestBed.createComponent(LeptosDashboardPage);
    const html = (fixture: typeof original | typeof migrated): HTMLElement => fixture.nativeElement;
    async function compare(state: string) {
      original.detectChanges();
      migrated.detectChanges();
      await migrated.whenStable();
      TestBed.tick();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      expect(html(migrated).querySelector('app-dashboard'))
        .withContext(state + ': Leptos fallback')
        .toBeNull();
      expect(screen(html(migrated)))
        .withContext(state)
        .toEqual(screen(html(original)));
    }
    await compare('today without plan');
    store.loading.set(true);
    await compare('loading');
    store.refreshFailed.set(true);
    await compare('loading takes precedence');
    store.loading.set(false);
    await compare('refresh error');
    store.refreshFailed.set(false);
    store.loggedTotals.set({ ...ZERO_TOTALS, calories: 200.5 });
    data.targets.set({ calories: 100, protein: 100, carbs: 0, fat: 0, fiber: 25 });
    store.nutritionStreakDays.set(0);
    store.workoutSummary.set({ ...store.workoutSummary(), streakWeeks: 2 });
    store.weightSummary.set({
      currentKg: 70.05,
      deltaKg: -0.05,
      source: 'weight_log',
      date: '2026-11-28',
    });
    store.pendingMeal.set(data.pending);
    for (const [calories, protein] of [
      [49.99, 40],
      [50, 69.99],
      [120, 70],
      [120.01, 30],
    ]) {
      store.totals.set({ calories, protein, carbs: 20.5, fat: 4, fiber: 31 });
      await compare(`raw plan ${calories} kcal, ${protein} g protein`);
    }
    await store.generateDailyAiInsight();
    data.online.set(false);
    data.availability.textIssue.set('Cần kết nối mạng để dùng AI');
    data.availability.photoIssue.set('Cần kết nối mạng để dùng AI');
    await compare('AI replaces local insight, offline controls');
    store.photoDraft.set(data.draft);
    await compare('photo capture and meal footer');
    for (const fixture of [original, migrated]) {
      expect(html(fixture).querySelector<HTMLSelectElement>('#photo-meal-type')!.value).toBe(
        data.draft.mealType,
      );
      const name = html(fixture).querySelector<HTMLInputElement>('#photo-name-0')!;
      name.value = 'Món đã sửa';
      name.dispatchEvent(new Event('input', { bubbles: true }));
      const grams = html(fixture).querySelector<HTMLInputElement>('#photo-grams-0')!;
      grams.value = '';
      grams.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(setName.calls.allArgs()).toEqual([
      [0, 'Món đã sửa'],
      [0, 'Món đã sửa'],
    ]);
    expect(setGrams.calls.allArgs()).toEqual([
      [0, NaN],
      [0, NaN],
    ]);
    store.photoDraft.set({
      ...data.draft,
      portions: [
        {
          ...data.draft.portions[0],
          grams: NaN,
          item: { ...data.draft.portions[0].item, name: '' },
        },
      ],
    });
    await compare('invalid name and grams after an edit');
    store.photoDraft.set({
      ...data.draft,
      portions: [{ ...data.draft.portions[0], included: false }],
    });
    store.photoSaving.set(true);
    await compare('excluded portion while saving');
    store.loggedTotals.set({ ...ZERO_TOTALS, calories: Infinity });
    migrated.detectChanges();
    await migrated.whenStable();
    TestBed.tick();
    expect(html(migrated).querySelector('app-dashboard #dashboard-title')?.textContent).toBe(
      'Hôm nay',
    );
  });
});
