import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { CalendarStore } from './calendar.store';
import { ProfileStore } from './profile.store';
import {
  NutritionQuery,
  type DayTotals,
  type NutritionTotals,
  type TrendPoint,
} from '../services/nutrition/nutrition-query';
import {
  pickKeyMetric,
  routeKeyMetric,
  visibleMetrics,
  type KeyMetric,
  type KeyMetricVariant,
} from '../utils/key-metric-router';

const ZERO_TOTALS: NutritionTotals = Object.freeze({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

export const DEFAULT_FIBER_TARGET_GRAMS = 25;

const TREND_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const trendKey = (start: string, end: string, metric: KeyMetric): string =>
  `${start}_${end}_${metric}`;

interface TrendCacheEntry {
  expiresAt: number;
  value: TrendPoint[];
}

/**
 * NutritionStore — Phase 3 layer 1 reactive aggregate state for F-04
 * (DEC-04: ONE-WAY listen on CalendarStore, never emits back).
 *
 * Responsibilities:
 *   - `today` : NutritionTotals for `CalendarStore.currentDate`,
 *               auto-reloaded on `currentDate` or `invalidationTick` change.
 *   - `targets` (computed) : pulled from `ProfileStore.profile()`.
 *   - `keyMetric` (computed) : router-selected primary metric for the active
 *               profile (driven by `KeyMetricRouter`).
 *   - `loadTrend(start, end, metric)` : on-demand fetch with in-memory cache
 *               (5-min TTL, cleared whenever `invalidationTick` changes).
 */
@Injectable({ providedIn: 'root' })
export class NutritionStore {
  private readonly calendarStore = inject(CalendarStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly query = inject(NutritionQuery);

  // ─── live state ───────────────────────────────────────────────────────
  readonly today = signal<NutritionTotals>({ ...ZERO_TOTALS });
  readonly week = signal<DayTotals[] | null>(null);
  readonly loading = signal(false);

  // ─── derived ──────────────────────────────────────────────────────────
  readonly targets = computed<NutritionTotals>(() => {
    const profile = this.profileStore.profile();
    if (!profile) {
      return { ...ZERO_TOTALS, fiber: DEFAULT_FIBER_TARGET_GRAMS };
    }
    return {
      calories: profile.target_calories ?? 0,
      protein: profile.target_protein ?? 0,
      carbs: profile.target_carbs ?? 0,
      fat: profile.target_fat ?? 0,
      fiber: DEFAULT_FIBER_TARGET_GRAMS,
    };
  });

  readonly keyMetricVariant = computed<KeyMetricVariant>(() => {
    const profile = this.profileStore.profile();
    return routeKeyMetric(profile?.fitness_level, profile?.goal);
  });

  readonly visibleMetrics = computed<readonly KeyMetric[]>(() =>
    visibleMetrics(this.keyMetricVariant()),
  );

  readonly keyMetric = computed<KeyMetric>(() => pickKeyMetric(this.profileStore.profile())[0]);

  // ─── trend cache (in-memory) ─────────────────────────────────────────
  private readonly trendCache = new Map<string, TrendCacheEntry>();
  /** Tick value the cache is keyed against — when it changes, cache resets. */
  private cacheTick = 0;

  constructor() {
    // One-way wire: re-fetch today whenever currentDate or invalidationTick
    // changes. `untracked` so the async load doesn't observe its own writes.
    effect(() => {
      const date = this.calendarStore.currentDate();
      const tick = this.calendarStore.invalidationTick();
      // Clear trend cache eagerly BEFORE awaiting the today fetch, so any
      // concurrent loadTrend() call sees an empty cache (Pitfall:
      // cache-invalidation race).
      if (tick !== this.cacheTick) {
        this.trendCache.clear();
        this.cacheTick = tick;
      }
      untracked(() => {
        void this.refreshToday(date);
      });
    });
  }

  // ─── public API ───────────────────────────────────────────────────────

  async refreshToday(date?: string): Promise<void> {
    const target = date ?? this.calendarStore.currentDate();
    this.loading.set(true);
    try {
      const totals = await this.query.dailyTotals(target);
      this.today.set(totals);
    } finally {
      this.loading.set(false);
    }
  }

  async loadWeek(weekStart: string): Promise<DayTotals[]> {
    const data = await this.query.weekTotals(weekStart);
    this.week.set(data);
    return data;
  }

  /**
   * Fetch trend with in-memory cache (TTL 5 min, cleared on invalidationTick).
   * Concurrent calls for the same key await the same in-flight promise (no
   * dedup map needed because await on a cached resolved value is cheap).
   */
  async loadTrend(start: string, end: string, metric: KeyMetric): Promise<TrendPoint[]> {
    const key = trendKey(start, end, metric);
    const now = Date.now();
    const hit = this.trendCache.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.value;
    }
    const value = await this.query.trend(start, end, metric);
    this.trendCache.set(key, { value, expiresAt: now + TREND_CACHE_TTL_MS });
    return value;
  }

  /** Test hook: force-clear trend cache. */
  clearTrendCache(): void {
    this.trendCache.clear();
  }
}
