export type ScoreColor = 'emerald' | 'amber' | 'slate';

export type InsightPriority = 'high' | 'medium' | 'low';

export type InsightCategory = 'nutrition' | 'workout' | 'weight' | 'streak' | 'general';

export interface ScoreInput {
  actualCalories?: number;
  targetCalories?: number;
  actualProteinG?: number;
  targetProteinG?: number;
  workoutCompleted?: boolean;
  isRestDay?: boolean;
  isBeforeEvening?: boolean;
  weightLoggedToday?: boolean;
  weightLoggedYesterday?: boolean;
  streakDays?: number;
}

export interface ScoreResult {
  totalScore: number;
  factors: {
    calories: number | null;
    protein: number | null;
    workout: number | null;
    weightLog: number | null;
    streak: number | null;
  };
  color: ScoreColor;
  availableFactors: number;
}

export interface Insight {
  id: string;
  message: string;
  priority: InsightPriority;
  category: InsightCategory;
  actionable: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  description: string;
}

export interface DailyTip {
  id: string;
  text: string;
  category: InsightCategory;
}
