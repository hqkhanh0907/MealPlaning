import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { CalendarStore } from './calendar.store';
import { NutritionStore } from './nutrition.store';
import { ProfileStore } from './profile.store';
import { NetworkStore } from './network.store';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import { WorkoutRepository } from '../repositories/workout.repository';
import type { FitnessProgressSummary } from '../models/fitness.types';
import { CameraCapture } from '../services/camera/camera-capture';
import { FoodImageAi, type FoodImageAnalysisResult } from '../services/ai/food-image-ai';
import { InsightAi, type DailyInsight } from '../services/ai/insight-ai';
import {
  NutritionQuery,
  type DayTotals,
  type NutritionTotals,
} from '../services/nutrition/nutrition-query';
import type { KeyMetric } from '../utils/key-metric-router';

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

const ZERO_TOTALS: NutritionTotals = Object.freeze({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

const STREAK_LOOKBACK_DAYS = 30;
const CALORIE_STREAK_MIN_PCT = 80;
const CALORIE_STREAK_MAX_PCT = 120;

const MACRO_LABELS: Record<MacroMetric, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
};

const METRIC_LABELS: Record<KeyMetric, string> = {
  calories: 'Calo',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly calendarStore = inject(CalendarStore);
  private readonly nutritionStore = inject(NutritionStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly networkStore = inject(NetworkStore);
  private readonly profileRepo = inject(UserProfileRepository);
  private readonly nutritionQuery = inject(NutritionQuery);
  private readonly workoutRepo = inject(WorkoutRepository);
  private readonly cameraCapture = inject(CameraCapture);
  private readonly foodImageAi = inject(FoodImageAi);
  private readonly insightAi = inject(InsightAi);

  private refreshSeq = 0;

  readonly todayIso = signal(todayIso());
  readonly totals = signal<NutritionTotals>({ ...ZERO_TOTALS });
  readonly loading = signal(false);
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
  readonly dailyAiInsight = signal<DailyInsight | null>(null);
  readonly dailyAiLoading = signal(false);
  readonly foodImageAnalysis = signal<FoodImageAnalysisResult | null>(null);
  readonly foodImageLoading = signal(false);

  readonly targets = computed(() => this.nutritionStore.targets());
  readonly keyMetric = computed(() => this.nutritionStore.keyMetric());

  readonly todayLabel = computed(() => formatDisplayDate(this.todayIso()));
  readonly roundedCalories = computed(() => Math.round(this.totals().calories));
  readonly caloriePercent = computed(() =>
    progressPercent(this.totals().calories, this.targets().calories),
  );
  readonly proteinPercent = computed(() =>
    progressPercent(this.totals().protein, this.targets().protein),
  );
  readonly calorieProgressCss = computed(() => percentCss(this.caloriePercent()));
  readonly caloriePercentLabel = computed(() => percentLabel(this.caloriePercent()));
  readonly calorieTargetLabel = computed(() => {
    const target = this.targets().calories;
    return isPositive(target)
      ? `${formatNumber(Math.round(target))} kcal`
      : 'Chưa có mục tiêu kcal';
  });
  readonly remainingCalories = computed(() => {
    const target = this.targets().calories;
    if (!isPositive(target)) return null;
    return Math.max(0, Math.round(target - this.totals().calories));
  });

  readonly heroTitle = computed(() => {
    const pct = this.caloriePercent();
    if (pct === null) return 'Thiết lập mục tiêu để bắt đầu';
    if (this.totals().calories <= 0) return 'Sẵn sàng cho hôm nay';
    if (pct < CALORIE_STREAK_MIN_PCT) {
      const remaining = this.remainingCalories();
      return remaining === null
        ? 'Còn thiếu dữ liệu mục tiêu'
        : `Còn ${formatNumber(remaining)} kcal`;
    }
    if (pct <= 110) return 'Hôm nay đang đúng nhịp';
    if (pct <= CALORIE_STREAK_MAX_PCT) return 'Hơi cao so với mục tiêu';
    return 'Vượt mục tiêu kcal';
  });

  readonly heroBody = computed(() => {
    const cal = Math.round(this.totals().calories);
    if (cal <= 0) return 'Bắt đầu ghi bữa đầu tiên để Dashboard sống động hơn.';
    const key = this.keyMetric();
    const label = METRIC_LABELS[key];
    const value = Math.round(this.totals()[key]);
    return `${label} hôm nay: ${formatNumber(value)}.`;
  });

  /** True khi user chưa log bữa nào hôm nay → Dashboard hiển thị empty-state gọn. */
  readonly hasNutritionData = computed(() => this.totals().calories > 0);

  readonly macroRows = computed<DashboardMacroRow[]>(() => {
    const totals = this.totals();
    const targets = this.targets();
    return (['protein', 'carbs', 'fat', 'fiber'] as const).map((metric) => {
      const pct = progressPercent(totals[metric], targets[metric]);
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

    // Empty state đã được Hero card cover (heroTitle + heroBody) — không cần
    // duplicate AI Insight card cho cùng thông điệp. Hide khi chưa có dữ liệu.
    if (totals.calories <= 0) return null;

    if (caloriePct !== null && caloriePct > CALORIE_STREAK_MAX_PCT) {
      return {
        tone: 'warning',
        title: 'Kế hoạch calo đang vượt mục tiêu',
        body: `Bạn đang ở ${Math.round(caloriePct)}% mục tiêu kcal. Hãy giảm khẩu phần hoặc đổi món trước khi log bữa tiếp theo.`,
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
          body: `Bạn mới đạt ${Math.round(proteinPct)}% mục tiêu Protein trong khi calo đã qua nửa ngày kế hoạch.`,
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
    const volume = this.workoutSummary().currentWeekVolume;
    if (volume > 0) return `Tuần này ${formatNumber(volume)} kg khối lượng`;
    return this.workoutSummary().lastSessionLabel
      ? 'Tuần này chưa có buổi tập'
      : 'Chưa có buổi tập nào';
  });

  readonly workoutBody = computed(() => {
    const summary = this.workoutSummary();
    if (summary.currentWeekVolume > 0) {
      if (summary.previousWeekVolume > 0) {
        const delta = summary.currentWeekVolume - summary.previousWeekVolume;
        if (delta > 0) {
          return `Tăng ${formatNumber(delta)} kg khối lượng so với tuần trước. Tiếp tục giữ nhịp và ưu tiên kỹ thuật đúng.`;
        }
        if (delta < 0) {
          return `Giảm ${formatNumber(Math.abs(delta))} kg khối lượng so với tuần trước. Kiểm tra lịch tập để không mất nhịp.`;
        }
        return 'Khối lượng đang ngang tuần trước. Nếu cơ thể ổn, tăng nhẹ mức tạ hoặc số set.';
      }
      return 'Đã ghi nhận khối lượng tập luyện tuần này. Hoàn thành thêm buổi để Dashboard bắt đầu so sánh xu hướng.';
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
    const date = todayIso(now);
    this.todayIso.set(date);
    this.loading.set(true);

    try {
      const [totals, weightSummary, nutritionStreakDays, workoutSummary] = await Promise.all([
        this.nutritionQuery.dailyTotals(date),
        this.loadWeightSummary(),
        this.loadNutritionStreak(now),
        this.loadWorkoutSummary(now),
      ]);

      if (seq !== this.refreshSeq) return;
      this.totals.set(totals);
      this.weightSummary.set(weightSummary);
      this.nutritionStreakDays.set(nutritionStreakDays);
      this.workoutSummary.set(workoutSummary);
    } finally {
      if (seq === this.refreshSeq) {
        this.loading.set(false);
      }
    }
  }

  async generateDailyAiInsight(): Promise<DailyInsight> {
    if (!this.networkStore.online()) {
      throw new Error('DashboardStore: daily insight requires network connection.');
    }
    this.dailyAiLoading.set(true);
    try {
      const profile = this.profileStore.profile();
      const insight = await this.insightAi.generateDailyInsight({
        date: this.todayIso(),
        level: profile?.fitness_level ?? 'beginner',
        totals: this.totals(),
        targets: this.targets(),
        workoutVolumeKg: this.workoutSummary().currentWeekVolume,
        workoutStreakWeeks: this.workoutSummary().streakWeeks,
      });
      this.dailyAiInsight.set(insight);
      return insight;
    } finally {
      this.dailyAiLoading.set(false);
    }
  }

  async analyzeMealPhoto(): Promise<FoodImageAnalysisResult> {
    if (!this.networkStore.online()) {
      throw new Error('DashboardStore: food image analysis requires network connection.');
    }
    this.foodImageLoading.set(true);
    try {
      const image = await this.cameraCapture.captureMealPhoto();
      const analysis = await this.foodImageAi.analyzeMealPhoto(image, 'bữa ăn hôm nay');
      this.foodImageAnalysis.set(analysis);
      return analysis;
    } finally {
      this.foodImageLoading.set(false);
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

function progressPercent(value: number, target: number): number | null {
  if (!isPositive(target)) return null;
  return Math.max(0, Math.min(200, (value / target) * 100));
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
    const pct = progressPercent(row.calories, targetCalories);
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
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(todayIso(d));
  }
  return dates;
}

function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${iso}T00:00:00`));
}

function toDashboardWorkoutSummary(
  progress: FitnessProgressSummary,
  lastSession: { date: string; total_volume: number } | null,
): DashboardWorkoutSummary {
  return {
    currentWeekVolume: Math.round(progress.currentWeekVolume),
    previousWeekVolume: Math.round(progress.previousWeekVolume),
    streakWeeks: progress.workoutStreakWeeks,
    lastSessionLabel: lastSession
      ? `${formatDisplayDate(lastSession.date)} · ${formatNumber(Math.round(lastSession.total_volume))} kg`
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
