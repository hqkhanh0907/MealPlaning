import type { Workout, WorkoutSet } from '../types';
import { addDays, daysBetween, formatDate, getDayOfWeek, getMondayOfWeek } from './dateUtils';

// ===== Interfaces =====

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  weekDots: Array<{
    day: number;
    status: 'completed' | 'rest' | 'missed' | 'today' | 'upcoming';
  }>;
  gracePeriodUsed: boolean;
  streakAtRisk: boolean;
}

export interface Milestone {
  id: string;
  emoji: string;
  label: string;
  threshold: number;
  type: 'sessions' | 'streak';
  achievedDate?: string;
}

export interface PRDetection {
  exerciseId: string;
  exerciseName: string;
  newWeight: number;
  previousWeight: number;
  reps: number;
  improvement: number;
}

// ===== Constants =====

export const MILESTONES: Milestone[] = [
  { id: 'sessions-1', emoji: '🥇', label: 'sessions1', threshold: 1, type: 'sessions' },
  { id: 'sessions-10', emoji: '💪', label: 'sessions10', threshold: 10, type: 'sessions' },
  { id: 'sessions-25', emoji: '⚡', label: 'sessions25', threshold: 25, type: 'sessions' },
  { id: 'sessions-50', emoji: '🔥', label: 'sessions50', threshold: 50, type: 'sessions' },
  { id: 'sessions-100', emoji: '💎', label: 'sessions100', threshold: 100, type: 'sessions' },
  { id: 'streak-7', emoji: '📅', label: 'streak7', threshold: 7, type: 'streak' },
  { id: 'streak-14', emoji: '🌟', label: 'streak14', threshold: 14, type: 'streak' },
  { id: 'streak-30', emoji: '🦁', label: 'streak30', threshold: 30, type: 'streak' },
  { id: 'streak-60', emoji: '👑', label: 'streak60', threshold: 60, type: 'streak' },
  { id: 'streak-90', emoji: '🏆', label: 'streak90', threshold: 90, type: 'streak' },
];

// ===== Core Functions =====

function buildWeekDots(
  todayStr: string,
  monday: string,
  workoutDates: Set<string>,
  planDaySet: Set<number>,
): StreakInfo['weekDots'] {
  const hasPlan = planDaySet.size > 0;
  const weekDots: StreakInfo['weekDots'] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const dow = i + 1;
    if (d === todayStr) {
      weekDots.push({ day: dow, status: 'today' });
    } else if (d > todayStr) {
      weekDots.push({ day: dow, status: 'upcoming' });
    } else if (workoutDates.has(d)) {
      weekDots.push({ day: dow, status: 'completed' });
    } else if (hasPlan && !planDaySet.has(dow)) {
      weekDots.push({ day: dow, status: 'rest' });
    } else {
      weekDots.push({ day: dow, status: 'missed' });
    }
  }
  return weekDots;
}

function computeCurrentStreak(
  todayStr: string,
  workoutDates: Set<string>,
  planDaySet: Set<number>,
): { currentStreak: number; gracePeriodUsed: boolean; streakAtRisk: boolean } {
  const hasPlan = planDaySet.size > 0;
  let currentStreak = 0;
  let graceUsed = false;
  let atRisk = false;

  for (let i = 0; i <= 365; i++) {
    const d = addDays(todayStr, -i);
    const dow = getDayOfWeek(d);
    const hasWorkout = workoutDates.has(d);

    if (hasPlan) {
      const isRestDay = !planDaySet.has(dow);
      if (hasWorkout || isRestDay) {
        currentStreak++;
      } else if (d === todayStr) {
        // Today is planned but no workout yet — don't penalize
      } else if (graceUsed) {
        break;
      } else {
        graceUsed = true;
        atRisk = true;
      }
    } else if (hasWorkout) {
      currentStreak++;
    } else if (d === todayStr) {
      // No plan, no workout today — skip
    } else {
      break;
    }
  }

  return { currentStreak, gracePeriodUsed: graceUsed, streakAtRisk: atRisk };
}

function computeLongestStreak(
  todayStr: string,
  workoutDates: Set<string>,
  planDaySet: Set<number>,
  currentStreak: number,
): number {
  const hasPlan = planDaySet.size > 0;
  const sorted = [...workoutDates].sort((a, b) => a.localeCompare(b));
  const earliest = sorted[0];
  const totalDays = daysBetween(earliest, todayStr);
  let longestStreak = 0;
  let tempStreak = 0;
  let tempGrace = false;

  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(earliest, i);
    const dow = getDayOfWeek(d);
    const hasWorkout = workoutDates.has(d);

    if (hasPlan) {
      const isRestDay = !planDaySet.has(dow);
      if (hasWorkout || isRestDay) {
        tempStreak++;
      } else if (d === todayStr) {
        // skip today — day not over
      } else if (tempGrace) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        tempGrace = false;
      } else {
        tempGrace = true;
      }
    } else if (hasWorkout) {
      tempStreak++;
    } else if (d === todayStr) {
      // skip today
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  return Math.max(longestStreak, tempStreak, currentStreak);
}

export function calculateStreak(workouts: Workout[], planDays: number[], today?: string): StreakInfo {
  const todayStr = today ?? formatDate(new Date());
  const workoutDates = new Set(workouts.map(w => w.date.split('T')[0]));
  const planDaySet = new Set(planDays);

  const monday = getMondayOfWeek(todayStr);
  const weekDots = buildWeekDots(todayStr, monday, workoutDates, planDaySet);

  if (workouts.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      weekDots,
      gracePeriodUsed: false,
      streakAtRisk: false,
    };
  }

  const { currentStreak, gracePeriodUsed, streakAtRisk } = computeCurrentStreak(todayStr, workoutDates, planDaySet);

  const longestStreak = computeLongestStreak(todayStr, workoutDates, planDaySet, currentStreak);

  return { currentStreak, longestStreak, weekDots, gracePeriodUsed, streakAtRisk };
}

export function checkMilestones(totalSessions: number, longestStreak: number): Milestone[] {
  const today = formatDate(new Date());
  return MILESTONES.map(m => {
    const value = m.type === 'sessions' ? totalSessions : longestStreak;
    return {
      ...m,
      achievedDate: value >= m.threshold ? today : undefined,
    };
  });
}

export function detectPRs(
  currentSets: WorkoutSet[],
  allPreviousSets: WorkoutSet[],
  exercises: Map<string, string>,
): PRDetection[] {
  const prs: PRDetection[] = [];
  const seen = new Set<string>();

  for (const set of currentSets) {
    if (!set.exerciseId || seen.has(set.exerciseId) || !set.reps || set.weightKg <= 0) {
      continue;
    }

    const prevForExercise = allPreviousSets.filter(s => s.exerciseId === set.exerciseId && s.reps === set.reps);
    if (prevForExercise.length === 0) continue;

    const previousMax = Math.max(...prevForExercise.map(s => s.weightKg));
    if (set.weightKg > previousMax) {
      seen.add(set.exerciseId);
      prs.push({
        exerciseId: set.exerciseId,
        exerciseName: exercises.get(set.exerciseId) ?? set.exerciseId,
        newWeight: set.weightKg,
        previousWeight: previousMax,
        reps: set.reps,
        improvement: set.weightKg - previousMax,
      });
    }
  }

  return prs;
}
