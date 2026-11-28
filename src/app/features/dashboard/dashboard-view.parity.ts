import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { CalendarStore } from '../../core/stores/calendar.store';
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
      confidence: 'low',
    },
    grams: 135,
    included: true,
  };
  const draft = {
    captureId: 'same-photo',
    date: '2026-11-28',
    mealType: 'lunch',
    analysis: { imageQualityWarning: 'Ảnh hơi tối' },
    portions: [portion],
  };
  const pending = { date: '2026-11-28', mealType: 'lunch', plannedDishId: 'lunch-1' };
  const warning = {
    title: 'Điều chỉnh kế hoạch',
    body: 'Nội dung gợi ý.',
    tone: 'warning',
    ctaLabel: 'Điều chỉnh lịch ăn',
    ctaRoute: '/tabs/calendar',
  };
  const aiInsight = {
    title: 'Nhận xét hôm nay',
    body: 'Nội dung nhận xét.',
    action: 'Thêm rau.',
    tone: 'info',
  };
  const store = {
    loading: signal(false),
    refreshFailed: signal(false),
    todayLabel: () => 'Thứ Bảy, 28/11',
    loggedCalories: signal(200),
    roundedCalories: () => 370,
    pendingMeal: signal<typeof pending | null>(null),
    calorieTargetLabel: () => '2.000 kcal',
    caloriePercentLabel: () => '19%',
    targets: () => ({ calories: 2000 }),
    hasNutritionData: signal(false),
    macroRows: () => [
      {
        metric: 'protein',
        label: 'Protein',
        valueLabel: '31 g',
        target: 90,
        targetLabel: '90 g',
        percentLabel: '34%',
        progressCss: '34%',
      },
    ],
    insight: signal<typeof warning | null>(null),
    dailyAiInsight: signal<typeof aiInsight | null>(null),
    nutritionStreakDays: signal<number | null>(null),
    workoutStreakDisplay: () => '2 tuần',
    weightDisplay: () => '70 kg',
    weightMeta: () => 'Dữ liệu từ hồ sơ cá nhân',
    insightProvider: 'Groq',
    dailyAiLoading: signal(false),
    foodImageLoading: signal(false),
    photoSaving: signal(false),
    canSavePhoto: signal(true),
    photoDraft: signal<typeof draft | null>(null),
    setPhotoName: jasmine.createSpy('setPhotoName'),
    setPhotoGrams: jasmine.createSpy('setPhotoGrams'),
    setPhotoIncluded: jasmine.createSpy('setPhotoIncluded'),
    refresh: jasmine.createSpy('refresh'),
  };
  return {
    store,
    draft,
    pending,
    warning,
    aiInsight,
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
    const { store } = data;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: DashboardStore, useValue: store },
        { provide: NetworkStore, useValue: { online: data.online } },
        { provide: CalendarStore, useValue: {} },
        { provide: AiAvailability, useValue: data.availability },
      ],
    });
    const original = TestBed.createComponent(DashboardPage);
    const migrated = TestBed.createComponent(LeptosDashboardPage);
    const html = (fixture: typeof original | typeof migrated): HTMLElement => fixture.nativeElement;
    async function compare(state: string) {
      original.detectChanges();
      migrated.detectChanges();
      await migrated.whenStable();
      TestBed.tick();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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
    store.hasNutritionData.set(true);
    store.nutritionStreakDays.set(0);
    store.pendingMeal.set(data.pending);
    store.insight.set(data.warning);
    await compare('pending meal, nutrition, zero streak and local insight');
    store.dailyAiInsight.set(data.aiInsight);
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
    expect(store.setPhotoName.calls.allArgs()).toEqual([
      [0, 'Món đã sửa'],
      [0, 'Món đã sửa'],
    ]);
    expect(store.setPhotoGrams.calls.allArgs()).toEqual([
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
    store.canSavePhoto.set(false);
    await compare('invalid name and grams after an edit');
    store.photoDraft.set({
      ...data.draft,
      portions: [{ ...data.draft.portions[0], included: false }],
    });
    store.photoSaving.set(true);
    await compare('excluded portion while saving');
    store.loggedCalories.set(Infinity);
    migrated.detectChanges();
    await migrated.whenStable();
    TestBed.tick();
    expect(html(migrated).querySelector('app-dashboard #dashboard-title')?.textContent).toBe(
      'Hôm nay',
    );
  });
});
