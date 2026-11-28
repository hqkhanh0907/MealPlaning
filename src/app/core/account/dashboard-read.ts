import type { FitnessProgressSummary } from '../models/fitness.types';
import type { NutritionTotals } from '../models/nutrition';
import type { PendingMealTarget } from '../stores/calendar.store';
import type { DashboardWeightSummary } from '../stores/dashboard.store';
import { nativeAccount } from './native-account';

export interface NativeDashboardSummary {
  ownerId: string;
  date: string;
  totals: NutritionTotals;
  loggedTotals: NutritionTotals;
  weight: DashboardWeightSummary & { negativeZeroDelta?: boolean };
  streakDays: number | null;
  pendingMeal: PendingMealTarget | null;
  workout: FitnessProgressSummary;
  lastSession: { date: string; total_volume: number } | null;
}

export async function readAccountDashboard(
  date: string,
  ownerId: string,
  read: (request: { date: string }) => Promise<NativeDashboardSummary> = (request) =>
    nativeAccount.dashboardSummary(request),
): Promise<NativeDashboardSummary | null> {
  try {
    const result = await read({ date });
    if (result.ownerId !== ownerId) throw new Error('Dashboard account changed.');
    if (result.date !== date) throw new Error('Dashboard date changed.');
    return result;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code === 'UNIMPLEMENTED' || code === 'dashboard_native_unavailable') return null;
    throw error;
  }
}
