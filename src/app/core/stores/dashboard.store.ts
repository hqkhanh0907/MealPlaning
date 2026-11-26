import { percentOfNutritionTarget, ZERO_TOTALS, type NutritionTotals } from '../models/nutrition';
import { addCalendarDays, localIsoDate, parseLocalDate } from '../utils/local-date';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { v4 as uuid } from 'uuid';
import type { MealType } from '../models/meal-plan.types';
import { validPhotoGrams, validPhotoName, type PhotoMealReviewPortion } from '../models/photo-meal';
import { PhotoMealRepository } from '../repositories/photo-meal.repository';
import { CalendarStore, type PendingMealTarget } from './calendar.store';
import { NutritionStore } from './nutrition.store';
import { ProfileStore } from './profile.store';
import { NetworkStore } from './network.store';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import { WorkoutRepository } from '../repositories/workout.repository';
import { workoutNumber, type FitnessProgressSummary } from '../models/fitness.types';
import { CameraCapture } from '../services/camera/camera-capture';
import { FoodImageAi, type FoodImageAnalysisResult } from '../services/ai/food-image-ai';
import { InsightAi, type DailyInsight, type DailyInsightAiInput } from '../services/ai/insight-ai';
import { NutritionQuery, type DayTotals } from '../services/nutrition/nutrition-query';

type DashboardInsightTone = 'info' | 'warning';
type MacroMetric = 'protein' | 'carbs' | 'fat' | 'fiber';

export interface DashboardInsight {
  tone: DashboardInsightTone;
  title: string;
  body: string;
  ctaLabel: string;
  ctaRoute: string;
}

export interface DashboardMacroRow {
  metric: MacroMetric;
  label: string;
  value: number;
  target: number;
  percent: number | null;
  valueLabel: string;
  targetLabel: string;
  percentLabel: string;
  progressCss: string;
}

export interface DashboardWeightSummary {
  currentKg: number | null;
  source: 'weight_log' | 'profile' | null;
  date: string | null;
  deltaKg: number | null;
}

export interface DashboardWorkoutSummary {
  currentWeekVolume: number;
  previousWeekVolume: number;
  streakWeeks: number;
  lastSessionLabel: string | null;
}

const STREAK_LOOKBACK_DAYS = 30;
const CALORIE_STREAK_MIN_PCT = 80;
const CALORIE_STREAK_MAX_PCT = 120;

interface MealPhotoDraft {
  captureId: string;
  date: string;
  mealType: MealType;
  analysis: FoodImageAnalysisResult;
  portions: readonly PhotoMealReviewPortion[];
}

const MACRO_LABELS: Record<MacroMetric, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
};

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly calendarStore = inject(CalendarStore);
  private readonly nutritionStore = inject(NutritionStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly networkStore = inject(NetworkStore);
  private readonly profileRepo = inject(UserProfileRepository);
  private readonly dayPlanRepo = inject(DayPlanRepository);
  private readonly nutritionQuery = inject(NutritionQuery);
  private readonly workoutRepo = inject(WorkoutRepository);
  private readonly cameraCapture = inject(CameraCapture);
  private readonly foodImageAi = inject(FoodImageAi);
  private readonly photoMeals = inject(PhotoMealRepository);
  private readonly insightAi = inject(InsightAi);
  readonly insightProvider = this.insightAi.providerName;

  private refreshSeq = 0;

  readonly todayIso = signal(localIsoDate());
  readonly totals = signal<NutritionTotals>({ ...ZERO_TOTALS });
  readonly loggedTotals = signal<NutritionTotals>({ ...ZERO_TOTALS });
  readonly loggedCalories = computed(() => Math.round(this.loggedTotals().calories));
  readonly pendingMeal = signal<PendingMealTarget | null>(null);
  readonly loading = signal(true);
  readonly refreshFailed = signal(false);
  readonly nutritionStreakDays = signal<number | null>(null);
  readonly weightSummary = signal<DashboardWeightSummary>({
    currentKg: null,
    source: null,
    date: null,
    deltaKg: null,
  });
  readonly workoutSummary = signal<DashboardWorkoutSummary>({
    currentWeekVolume: 0,
    previousWeekVolume: 0,
    streakWeeks: 0,
    lastSessionLabel: null,
  });
  private insightRequest = 0;
  private readonly savedInsight = signal<{ key: string; value: DailyInsight } | null>(null);
  readonly dailyAiLoading = signal(false);
  readonly photoDraft = signal<MealPhotoDraft | null>(null);
  readonly foodImageLoading = signal(false);
  readonly photoSaving = signal(false);
  private readonly includedPhotoPortions = computed(
    () => this.photoDraft()?.portions.filter(({ included }) => included) ?? [],
  );
  readonly canSavePhoto = computed(() => {
    const portions = this.includedPhotoPortions();
    return (
      !this.photoSaving() &&
      portions.length > 0 &&
      portions.every(({ item, grams }) => validPhotoGrams(grams) && validPhotoName(item.name))
    );
  });

  readonly targets = computed(() => this.nutritionStore.targets());

  private readonly insightInput = computed<DailyInsightAiInput>(() => ({
    date: this.todayIso(),
    level: this.profileStore.profile()?.fitness_level ?? 'beginner',
    totals: this.totals(),
    logged: this.loggedTotals(),
    targets: this.targets(),
    workoutVolumeKg: this.workoutSummary().currentWeekVolume,
    workoutStreakWeeks: this.workoutSummary().streakWeeks,
  }));
  private readonly insightKey = computed(() => JSON.stringify(this.insightInput()));
  readonly dailyAiInsight = computed(() => {
    const saved = this.savedInsight();
    return saved?.key === this.insightKey() ? saved.value : null;
  });

  readonly todayLabel = computed(() => formatDisplayDate(this.todayIso()));
  readonly roundedCalories = computed(() => Math.round(this.totals().calories));
  readonly caloriePercent = computed(() =>
    percentOfNutritionTarget(this.totals().calories, this.targets().calories),
  );
  readonly proteinPercent = computed(() =>
    percentOfNutritionTarget(this.totals().protein, this.targets().protein),
  );
  readonly caloriePercentLabel = computed(() => percentLabel(this.caloriePercent()));
  readonly calorieTargetLabel = computed(() => {
    const target = this.targets().calories;
    return isPositive(target)
      ? `${formatNumber(Math.round(target))} kcal`
      : 'Chưa có mục tiêu kcal';
  });
  readonly hasNutritionData = computed(() => this.totals().calories > 0);

  readonly macroRows = computed<DashboardMacroRow[]>(() => {
    const totals = this.totals();
    const targets = this.targets();
    return (['protein', 'carbs', 'fat', 'fiber'] as const).map((metric) => {
      const pct = percentOfNutritionTarget(totals[metric], targets[metric]);
      return {
        metric,
        label: MACRO_LABELS[metric],
        value: Math.round(totals[metric]),
        target: targets[metric],
        percent: pct,
        valueLabel: `${formatNumber(Math.round(totals[metric]))} g`,
        targetLabel: isPositive(targets[metric])
          ? `${formatNumber(Math.round(targets[metric]))} g`
          : 'Chưa có mục tiêu',
        percentLabel: percentLabel(pct),
        progressCss: percentCss(pct),
      };
    });
  });

  readonly insight = computed<DashboardInsight | null>(() => {
    const totals = this.totals();
    const targets = this.targets();
    const caloriePct = this.caloriePercent();
    const proteinPct = this.proteinPercent();

    if (totals.calories <= 0) return null;

    if (caloriePct !== null && caloriePct > CALORIE_STREAK_MAX_PCT) {
      return {
        tone: 'warning',
        title: 'Kế hoạch calo đang vượt mục tiêu',
        body: `Các món theo lịch cả ngày tương ứng ${Math.round(caloriePct)}% mục tiêu kcal.`,
        ctaLabel: 'Điều chỉnh lịch ăn',
        ctaRoute: '/tabs/calendar',
      };
    }

    if (isPositive(targets.protein) && proteinPct !== null && caloriePct !== null) {
      const hasMeaningfulPlan = caloriePct >= 50;
      if (hasMeaningfulPlan && proteinPct < 70) {
        return {
          tone: 'warning',
          title: 'Protein đang thấp so với kế hoạch',
          body: `Các món theo lịch cung cấp ${Math.round(proteinPct)}% mục tiêu Protein và ${Math.round(caloriePct)}% mục tiêu kcal.`,
          ctaLabel: 'Thêm món giàu Protein',
          ctaRoute: '/tabs/calendar',
        };
      }
    }

    return null;
  });

  readonly weightDisplay = computed(() => {
    const weight = this.weightSummary().currentKg;
    return weight === null ? '—' : `${formatWeight(weight)} kg`;
  });

  readonly weightMeta = computed(() => {
    const summary = this.weightSummary();
    if (summary.currentKg === null) return 'Chưa có cân nặng trong hồ sơ';
    if (summary.deltaKg === null) {
      return summary.source === 'weight_log'
        ? 'Chưa có mốc cân trước đó'
        : 'Dữ liệu từ hồ sơ cá nhân';
    }
    const prefix = summary.deltaKg > 0 ? '+' : '';
    return `${prefix}${formatWeight(summary.deltaKg)} kg so với lần cân trước`;
  });

  readonly workoutTitle = computed(() => {
    const summary = this.workoutSummary();
    if (summary.currentWeekVolume > 0) {
      return `Tuần này ${workoutNumber.format(summary.currentWeekVolume)} kg khối lượng`;
    }
    if (summary.streakWeeks > 0) return 'Đã tập trong tuần này';
    return summary.lastSessionLabel ? 'Tuần này chưa có buổi tập' : 'Chưa có buổi tập nào';
  });

  readonly workoutBody = computed(() => {
    const summary = this.workoutSummary();
    if (summary.currentWeekVolume > 0) {
      if (summary.previousWeekVolume > 0) {
        const delta = summary.currentWeekVolume - summary.previousWeekVolume;
        if (delta > 0) {
          return `Tăng ${workoutNumber.format(delta)} kg khối lượng so với tuần trước.`;
        }
        if (delta < 0) {
          return `Giảm ${workoutNumber.format(Math.abs(delta))} kg khối lượng so với tuần trước.`;
        }
        return 'Khối lượng hiện bằng tuần trước.';
      }
      return 'Tuần trước chưa ghi nhận khối lượng tạ để so sánh.';
    }
    if (summary.lastSessionLabel) {
      return `Buổi gần nhất: ${summary.lastSessionLabel}. Mở tab Tập luyện để bắt đầu buổi mới.`;
    }
    return 'Chọn giáo án hoặc bắt đầu Buổi tự do trong tab Tập luyện để Dashboard hiển thị số liệu thật.';
  });

  readonly workoutStreakDisplay = computed(() => {
    const streak = this.workoutSummary().streakWeeks;
    return streak > 0 ? `${streak} tuần` : '—';
  });

  constructor() {
    effect(() => {
      this.calendarStore.invalidationTick();
      this.profileStore.profile();
      untracked(() => {
        queueMicrotask(() => {
          void this.refresh();
        });
      });
    });
  }

  async refresh(now: Date = new Date()): Promise<void> {
    const seq = ++this.refreshSeq;
    const date = localIsoDate(now);
    this.todayIso.set(date);
    this.loading.set(true);
    this.refreshFailed.set(false);

    try {
      const [totals, logged, weightSummary, nutritionStreakDays, workoutSummary, pendingMeal] =
        await Promise.all([
          this.nutritionQuery.dailyTotals(date),
          this.nutritionQuery.loggedTotalsForDates([date]),
          this.loadWeightSummary(),
          this.loadNutritionStreak(now),
          this.loadWorkoutSummary(now),
          this.findPendingMeal(date),
        ]);

      if (seq !== this.refreshSeq) return;
      this.totals.set(totals);
      this.loggedTotals.set(logged.find((day) => day.date === date) ?? ZERO_TOTALS);
      this.weightSummary.set(weightSummary);
      this.nutritionStreakDays.set(nutritionStreakDays);
      this.workoutSummary.set(workoutSummary);
      this.pendingMeal.set(pendingMeal);
    } catch {
      if (seq === this.refreshSeq) this.refreshFailed.set(true);
    } finally {
      if (seq === this.refreshSeq) {
        this.loading.set(false);
      }
    }
  }

  private async findPendingMeal(date: string): Promise<PendingMealTarget | null> {
    const plan = await this.dayPlanRepo.findByDate(date);
    for (const slot of plan?.meal_slots ?? []) {
      const dish = slot.planned_dishes.find((item) => item.is_completed === 0);
      if (dish) return { date, mealType: slot.meal_type, plannedDishId: dish.id };
    }
    return null;
  }

  async generateDailyAiInsight(): Promise<DailyInsight | null> {
    if (!this.networkStore.online()) {
      throw new Error('DashboardStore: daily insight requires network connection.');
    }
    const request = ++this.insightRequest;
    const key = this.insightKey();
    this.dailyAiLoading.set(true);
    try {
      const insight = await this.insightAi.generateDailyInsight(this.insightInput());
      if (request !== this.insightRequest || key !== this.insightKey()) return null;
      this.savedInsight.set({ key, value: insight });
      return insight;
    } finally {
      if (request === this.insightRequest) this.dailyAiLoading.set(false);
    }
  }

  async analyzeMealPhoto(): Promise<FoodImageAnalysisResult> {
    if (!this.networkStore.online()) {
      throw new Error('DashboardStore: food image analysis requires network connection.');
    }
    if (this.foodImageLoading() || this.photoDraft()) {
      throw new Error('Một ảnh món ăn đang chờ xác nhận.');
    }
    const now = new Date();
    this.foodImageLoading.set(true);
    try {
      const image = await this.cameraCapture.captureMealPhoto();
      const analysis = await this.foodImageAi.analyzeMealPhoto(image, 'bữa ăn hôm nay');
      const hour = now.getHours();
      this.photoDraft.set({
        captureId: uuid(),
        date: localIsoDate(now),
        mealType: hour < 10 ? 'breakfast' : hour < 15 ? 'lunch' : 'dinner',
        analysis,
        portions: analysis.items.map((item) => ({
          item,
          grams: item.estimatedGrams,
          included: true,
        })),
      });
      return analysis;
    } finally {
      this.foodImageLoading.set(false);
    }
  }

  setPhotoGrams(index: number, grams: number): void {
    this.editPhotoPortion(index, (portion) => ({ ...portion, grams }));
  }

  setPhotoName(index: number, name: string): void {
    this.editPhotoPortion(index, (portion) => ({ ...portion, item: { ...portion.item, name } }));
  }

  setPhotoIncluded(index: number, included: boolean): void {
    this.editPhotoPortion(index, (portion) => ({ ...portion, included }));
  }

  private editPhotoPortion(
    index: number,
    edit: (portion: PhotoMealReviewPortion) => PhotoMealReviewPortion,
  ): void {
    if (this.photoSaving()) return;
    this.photoDraft.update((draft) =>
      draft?.portions[index]
        ? {
            ...draft,
            portions: draft.portions.map((portion, i) => (i === index ? edit(portion) : portion)),
          }
        : draft,
    );
  }

  setPhotoMealType(mealType: MealType): void {
    if (!this.photoSaving()) this.photoDraft.update((draft) => draft && { ...draft, mealType });
  }

  discardPhoto(): void {
    if (!this.photoSaving()) this.photoDraft.set(null);
  }

  async savePhoto(): Promise<boolean> {
    const draft = this.photoDraft();
    if (!draft || !this.canSavePhoto()) return false;
    this.photoSaving.set(true);
    try {
      const portions = this.includedPhotoPortions().map(({ item, grams }) => ({
        item: { ...item, name: item.name.trim() },
        grams,
      }));
      await this.photoMeals.save(draft.date, draft.mealType, portions, draft.captureId);
      this.photoDraft.set(null);
      this.calendarStore.invalidationTick.update((n) => n + 1);
      return true;
    } finally {
      this.photoSaving.set(false);
    }
  }

  private async loadWeightSummary(): Promise<DashboardWeightSummary> {
    const [profile, latest] = await Promise.all([
      Promise.resolve(this.profileStore.profile()),
      this.profileRepo.getLatestWeightLog(),
    ]);
    if (!latest) {
      return {
        currentKg: profile?.weight_kg ?? null,
        source: profile ? 'profile' : null,
        date: null,
        deltaKg: null,
      };
    }

    const previous = await this.profileRepo.getPreviousWeightLog(latest.date);
    return {
      currentKg: latest.weight_kg,
      source: 'weight_log',
      date: latest.date,
      deltaKg: previous ? roundOneDecimal(latest.weight_kg - previous.weight_kg) : null,
    };
  }

  private async loadNutritionStreak(now: Date): Promise<number | null> {
    const target = this.targets().calories;
    if (!isPositive(target)) return null;

    const dates = previousDates(now, STREAK_LOOKBACK_DAYS);
    const rows = await this.nutritionQuery.loggedTotalsForDates(dates);
    return countConsecutiveStreak(rows, target);
  }

  private async loadWorkoutSummary(now: Date): Promise<DashboardWorkoutSummary> {
    const [progress, recent] = await Promise.all([
      this.workoutRepo.progressSummary(now),
      this.workoutRepo.recentSessions(1),
    ]);
    return toDashboardWorkoutSummary(progress, recent[0] ?? null);
  }
}

function percentCss(pct: number | null): string {
  if (pct === null) return '0%';
  return `${Math.min(100, Math.round(pct))}%`;
}

function percentLabel(pct: number | null): string {
  return pct === null ? '—' : `${formatNumber(Math.round(pct))}%`;
}

function countConsecutiveStreak(rows: readonly DayTotals[], targetCalories: number): number {
  let count = 0;
  for (const row of rows) {
    const pct = percentOfNutritionTarget(row.calories, targetCalories);
    if (
      pct === null ||
      row.calories <= 0 ||
      pct < CALORIE_STREAK_MIN_PCT ||
      pct > CALORIE_STREAK_MAX_PCT
    ) {
      break;
    }
    count += 1;
  }
  return count;
}

function previousDates(now: Date, count: number): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    dates.push(localIsoDate(addCalendarDays(now, -i)));
  }
  return dates;
}

function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(parseLocalDate(iso));
}

function toDashboardWorkoutSummary(
  progress: FitnessProgressSummary,
  lastSession: { date: string; total_volume: number } | null,
): DashboardWorkoutSummary {
  return {
    currentWeekVolume: progress.currentWeekVolume,
    previousWeekVolume: progress.previousWeekVolume,
    streakWeeks: progress.workoutStreakWeeks,
    lastSessionLabel: lastSession
      ? `${formatDisplayDate(lastSession.date)} · ${workoutNumber.format(lastSession.total_volume)} kg khối lượng tạ`
      : null,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

function formatWeight(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function isPositive(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
