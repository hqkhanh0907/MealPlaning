import { describe, it, expect, beforeEach } from 'vitest';
import type { DayPlan, Dish, Ingredient } from '../../types';
import type {
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  WorkoutSet,
} from '../../features/fitness/types';
import type { HealthProfile } from '../../features/health-profile/types';

// ─── Pure-function imports (NOT mocked) ───────────────────────────────
import {
  calculateDailyScore,
  calculateCalorieScore,
  calculateProteinScore,
  calculateWorkoutScore,
  calculateWeightLogScore,
  calculateStreakBonus,
} from '../../features/dashboard/utils/scoreCalculator';
import {
  calculateDishesNutrition,
} from '../../utils/nutrition';
import {
  calculateStreak,
  detectPRs,
  checkMilestones,
} from '../../features/fitness/utils/gamification';
import {
  calculateBMR,
  calculateTDEE,
  calculateTarget,
  calculateMacros,
  sessionsToLevel,
  getAutoAdjustedMultiplier,
  getCalorieOffset,
} from '../../services/nutritionEngine';
import type { ScoreInput } from '../../features/dashboard/types';
import {
  determineTodayPlanState,
} from '../../features/dashboard/hooks/useTodaysPlan';
import {
  selectInsight,
} from '../../features/dashboard/hooks/useInsightEngine';
import type { InsightInput } from '../../features/dashboard/hooks/useInsightEngine';
import { useNavigationStore } from '../../store/navigationStore';

// ─── Shared test-data helpers ─────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const d = new Date(Date.now() - 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const now = new Date().toISOString();

const sampleIngredients: Ingredient[] = [
  {
    id: 'ing-chicken',
    name: { vi: 'Ức gà' },
    caloriesPer100: 165,
    proteinPer100: 31,
    carbsPer100: 0,
    fatPer100: 3.6,
    fiberPer100: 0,
    unit: { vi: 'g' },
  },
  {
    id: 'ing-rice',
    name: { vi: 'Cơm trắng' },
    caloriesPer100: 130,
    proteinPer100: 2.7,
    carbsPer100: 28,
    fatPer100: 0.3,
    fiberPer100: 0.4,
    unit: { vi: 'g' },
  },
  {
    id: 'ing-egg',
    name: { vi: 'Trứng gà' },
    caloriesPer100: 155,
    proteinPer100: 13,
    carbsPer100: 1.1,
    fatPer100: 11,
    fiberPer100: 0,
    unit: { vi: 'g' },
  },
];

const sampleDishes: Dish[] = [
  {
    id: 'dish-chicken-rice',
    name: { vi: 'Cơm gà' },
    ingredients: [
      { ingredientId: 'ing-chicken', amount: 200 },
      { ingredientId: 'ing-rice', amount: 250 },
    ],
    tags: ['lunch', 'dinner'],
  },
  {
    id: 'dish-egg-rice',
    name: { vi: 'Cơm trứng' },
    ingredients: [
      { ingredientId: 'ing-egg', amount: 150 },
      { ingredientId: 'ing-rice', amount: 200 },
    ],
    tags: ['breakfast'],
  },
  {
    id: 'dish-grilled-chicken',
    name: { vi: 'Gà nướng' },
    ingredients: [{ ingredientId: 'ing-chicken', amount: 300 }],
    tags: ['dinner'],
  },
];

function mkWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'w-1',
    date: todayStr(),
    name: 'Push A',
    durationMin: 60,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mkActivePlan(overrides: Partial<TrainingPlan> = {}): TrainingPlan {
  return {
    id: 'plan-1',
    name: 'PPL 6-day',
    status: 'active',
    splitType: 'Push/Pull/Legs',
    durationWeeks: 8,
    currentWeek: 1,
    startDate: '2025-01-01',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mkPlanDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 'pd-1',
    planId: 'plan-1',
    dayOfWeek: new Date().getDay(),
    sessionOrder: 1,
    workoutType: 'Push A',
    muscleGroups: 'chest,shoulders,triceps',
    ...overrides,
  };
}

function mkDayPlan(overrides: Partial<DayPlan> = {}): DayPlan {
  return {
    date: todayStr(),
    breakfastDishIds: [],
    lunchDishIds: [],
    dinnerDishIds: [],
    ...overrides,
  };
}

function mkHealthProfile(overrides: Partial<HealthProfile> = {}): HealthProfile {
  return {
    id: 'user-1',
    name: '',
    gender: 'male',
    age: 28,
    dateOfBirth: null,
    heightCm: 175,
    weightKg: 80,
    activityLevel: 'moderate',
    proteinRatio: 2.0,
    fatPct: 0.25,
    targetCalories: 0,
    updatedAt: now,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  1. NUTRITION → DASHBOARD  (§6.1 Feedback Loop)
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-Feature: Nutrition → Dashboard', () => {
  it('meal nutrition flows into daily score calorie factor', () => {
    const plan = mkDayPlan({
      breakfastDishIds: ['dish-egg-rice'],
      lunchDishIds: ['dish-chicken-rice'],
    });
    const allDishIds = [
      ...plan.breakfastDishIds,
      ...plan.lunchDishIds,
      ...plan.dinnerDishIds,
    ];
    const nutrition = calculateDishesNutrition(
      allDishIds,
      sampleDishes,
      sampleIngredients,
    );

    const scoreInput: ScoreInput = {
      actualCalories: nutrition.calories,
      targetCalories: 2000,
      workoutCompleted: false,
      isRestDay: true,
      isBeforeEvening: true,
    };
    const result = calculateDailyScore(scoreInput);

    expect(result.factors.calories).toBeGreaterThan(0);
    expect(result.totalScore).toBeGreaterThan(0);
  });

  it('score color is emerald when calorie target is closely met', () => {
    const targetCal = 2000;
    const calorieScore = calculateCalorieScore(2020, targetCal);
    expect(calorieScore).toBe(100);
  });

  it('protein progress reaches 100% when target is met', () => {
    const targetProtein = 150;
    const proteinScore = calculateProteinScore(155, targetProtein);
    expect(proteinScore).toBe(100);
  });

  it('protein score is lower when only 60% of target is met', () => {
    const targetProtein = 150;
    const proteinScore = calculateProteinScore(90, targetProtein);
    expect(proteinScore).toBeLessThan(100);
  });

  it('DailyScoreHero receives correct macro data through the full pipeline', () => {
    const plan = mkDayPlan({
      breakfastDishIds: ['dish-egg-rice'],
      lunchDishIds: ['dish-chicken-rice'],
      dinnerDishIds: ['dish-grilled-chicken'],
    });
    const allDishIds = [
      ...plan.breakfastDishIds,
      ...plan.lunchDishIds,
      ...plan.dinnerDishIds,
    ];
    const nutrition = calculateDishesNutrition(
      allDishIds,
      sampleDishes,
      sampleIngredients,
    );

    expect(nutrition.calories).toBeGreaterThan(0);
    expect(nutrition.protein).toBeGreaterThan(0);
    expect(nutrition.carbs).toBeGreaterThan(0);
    expect(nutrition.fat).toBeGreaterThan(0);

    const scoreResult = calculateDailyScore({
      actualCalories: nutrition.calories,
      targetCalories: 2200,
      actualProteinG: nutrition.protein,
      targetProteinG: 160,
      workoutCompleted: true,
      isRestDay: false,
      isBeforeEvening: true,
      weightLoggedToday: true,
      weightLoggedYesterday: false,
      streakDays: 5,
    });

    expect(scoreResult.factors.calories).not.toBeNull();
    expect(scoreResult.factors.protein).not.toBeNull();
    expect(scoreResult.factors.workout).not.toBeNull();
    expect(scoreResult.factors.weightLog).not.toBeNull();
    expect(scoreResult.factors.streak).not.toBeNull();
    expect(scoreResult.totalScore).toBeGreaterThan(0);
  });

  it('energy balance shows "balanced" when actual ≈ target', () => {
    const nutrition = calculateDishesNutrition(
      ['dish-chicken-rice', 'dish-egg-rice', 'dish-grilled-chicken'],
      sampleDishes,
      sampleIngredients,
    );
    const target = 2000;
    const deviation = Math.abs(nutrition.calories - target);
    const calorieScore = calculateCalorieScore(nutrition.calories, target);

    if (deviation <= 50) {
      expect(calorieScore).toBe(100);
    } else {
      expect(calorieScore).toBeLessThan(100);
    }
  });

  it('servings multiplier affects calories flowing to dashboard', () => {
    const baseNutrition = calculateDishesNutrition(
      ['dish-chicken-rice'],
      sampleDishes,
      sampleIngredients,
    );
    const doubleServings = calculateDishesNutrition(
      ['dish-chicken-rice'],
      sampleDishes,
      sampleIngredients,
      { 'dish-chicken-rice': 2 },
    );

    expect(doubleServings.calories).toBeCloseTo(baseNutrition.calories * 2, 1);
    expect(doubleServings.protein).toBeCloseTo(baseNutrition.protein * 2, 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  2. FITNESS → DASHBOARD  (§6.2)
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-Feature: Fitness → Dashboard', () => {
  it('workout logged today → TodaysPlanCard shows training-completed', () => {
    const activePlan = mkActivePlan();
    const todayPlanDay = mkPlanDay();
    const todayWorkout = mkWorkout({ planDayId: todayPlanDay.id });

    const state = determineTodayPlanState(activePlan, [todayPlanDay], [todayWorkout]);
    expect(state).toBe('training-completed');
  });

  it('no workout today with plan → shows training-pending', () => {
    const activePlan = mkActivePlan();
    const todayPlanDay = mkPlanDay();

    const state = determineTodayPlanState(activePlan, [todayPlanDay], []);
    expect(state).toBe('training-pending');
  });

  it('no plan day scheduled → shows rest-day', () => {
    const activePlan = mkActivePlan();

    const state = determineTodayPlanState(activePlan, [], []);
    expect(state).toBe('rest-day');
  });

  it('no active training plan → shows no-plan', () => {
    const state = determineTodayPlanState(undefined, [], []);
    expect(state).toBe('no-plan');
  });

  it('workout streak data flows into score calculator', () => {
    const workouts: Workout[] = [
      mkWorkout({ id: 'w-1', date: todayStr() }),
      mkWorkout({ id: 'w-2', date: yesterdayStr() }),
    ];
    const planDays = [1, 3, 5];

    const streakInfo = calculateStreak(workouts, planDays, todayStr());
    expect(streakInfo.currentStreak).toBeGreaterThanOrEqual(1);

    const streakBonus = calculateStreakBonus(streakInfo.currentStreak);
    expect(streakBonus).toBeGreaterThanOrEqual(0);
  });

  it('weight entry logged today → weightLog score is 100', () => {
    const score = calculateWeightLogScore(true, false);
    expect(score).toBe(100);
  });

  it('weight entry logged yesterday only → weightLog score is 50', () => {
    const score = calculateWeightLogScore(false, true);
    expect(score).toBe(50);
  });

  it('workout completion score is 100 when workout done', () => {
    const score = calculateWorkoutScore(true, false, true);
    expect(score).toBe(100);
  });

  it('rest day gives workout score 100 even without exercise', () => {
    const score = calculateWorkoutScore(false, true, true);
    expect(score).toBe(100);
  });

  it('PR detection feeds into insight engine hasPRToday', () => {
    const currentSets: WorkoutSet[] = [
      {
        id: 'cs-1',
        workoutId: 'w-today',
        exerciseId: 'bench-press',
        setNumber: 1,
        reps: 8,
        weightKg: 100,
        updatedAt: now,
      },
    ];
    const previousSets: WorkoutSet[] = [
      {
        id: 'ps-1',
        workoutId: 'w-prev',
        exerciseId: 'bench-press',
        setNumber: 1,
        reps: 8,
        weightKg: 90,
        updatedAt: now,
      },
    ];
    const exercises = new Map([['bench-press', 'Bench Press']]);

    const prs = detectPRs(currentSets, previousSets, exercises);
    expect(prs).toHaveLength(1);
    expect(prs[0].improvement).toBe(10);

    const insightInput: InsightInput = { hasPRToday: prs.length > 0 };
    const insight = selectInsight(insightInput, [], todayStr());
    expect(insight.type).toBe('celebrate');
    expect(insight.id).toBe('p5-pr-today');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  3. NUTRITION ↔ FITNESS  (TDEE Adjustment)
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-Feature: Nutrition ↔ Fitness (TDEE)', () => {
  it('activity level from fitness profile affects BMR/TDEE', () => {
    const profile = mkHealthProfile({ activityLevel: 'sedentary' });
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdeeSedentary = calculateTDEE(bmr, 'sedentary');
    const tdeeActive = calculateTDEE(bmr, 'active');

    expect(tdeeActive).toBeGreaterThan(tdeeSedentary);
  });

  it('exercise sessions per week map to correct activity level', () => {
    expect(sessionsToLevel(0)).toBe('sedentary');
    expect(sessionsToLevel(2)).toBe('light');
    expect(sessionsToLevel(4)).toBe('moderate');
    expect(sessionsToLevel(6)).toBe('active');
    expect(sessionsToLevel(7)).toBe('extra_active');
  });

  it('auto-adjusted multiplier blends base + session-based level', () => {
    const blended = getAutoAdjustedMultiplier('sedentary', 5);
    const pureSedentary = 1.2;
    const pureActive = 1.725;

    expect(blended).toBeGreaterThan(pureSedentary);
    expect(blended).toBeLessThan(pureActive);
  });

  it('weight change triggers TDEE recalculation with different result', () => {
    const profile = mkHealthProfile({ weightKg: 80 });
    const bmr80 = calculateBMR(80, profile.heightCm, profile.age, profile.gender);
    const bmr75 = calculateBMR(75, profile.heightCm, profile.age, profile.gender);

    const tdee80 = calculateTDEE(bmr80, profile.activityLevel);
    const tdee75 = calculateTDEE(bmr75, profile.activityLevel);

    expect(tdee80).toBeGreaterThan(tdee75);
  });

  it('goal type cut → negative calorie offset reduces target', () => {
    const profile = mkHealthProfile();
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calculateTDEE(bmr, profile.activityLevel);

    const offset = getCalorieOffset('cut', 'moderate');
    const target = calculateTarget(tdee, offset);

    expect(offset).toBeLessThan(0);
    expect(target).toBeLessThan(tdee);
  });

  it('goal type bulk → positive calorie offset increases target', () => {
    const profile = mkHealthProfile();
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calculateTDEE(bmr, profile.activityLevel);

    const offset = getCalorieOffset('bulk', 'moderate');
    const target = calculateTarget(tdee, offset);

    expect(offset).toBeGreaterThan(0);
    expect(target).toBeGreaterThan(tdee);
  });

  it('macro split remains valid across goal types', () => {
    const profile = mkHealthProfile();
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calculateTDEE(bmr, profile.activityLevel);

    for (const goalType of ['cut', 'bulk', 'maintain'] as const) {
      const offset = getCalorieOffset(goalType, 'moderate');
      const targetCal = calculateTarget(tdee, offset);
      const macros = calculateMacros(
        targetCal,
        profile.weightKg,
        profile.proteinRatio,
        profile.fatPct,
      );

      expect(macros.proteinG).toBeGreaterThan(0);
      expect(macros.fatG).toBeGreaterThan(0);
      expect(macros.carbsG).toBeGreaterThanOrEqual(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  4. HEALTH PROFILE → ALL FEATURES
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-Feature: Health Profile → All Features', () => {
  it('profile weight change → recalculates TDEE and macro targets', () => {
    const profileBefore = mkHealthProfile({ weightKg: 80 });
    const profileAfter = mkHealthProfile({ weightKg: 75 });

    const bmrBefore = calculateBMR(profileBefore.weightKg, profileBefore.heightCm, profileBefore.age, profileBefore.gender);
    const bmrAfter = calculateBMR(profileAfter.weightKg, profileAfter.heightCm, profileAfter.age, profileAfter.gender);

    const tdeeBefore = calculateTDEE(bmrBefore, profileBefore.activityLevel);
    const tdeeAfter = calculateTDEE(bmrAfter, profileAfter.activityLevel);

    expect(tdeeBefore).not.toBe(tdeeAfter);

    const macrosBefore = calculateMacros(tdeeBefore, 80, 2.0, 0.25);
    const macrosAfter = calculateMacros(tdeeAfter, 75, 2.0, 0.25);

    expect(macrosBefore.proteinG).not.toBe(macrosAfter.proteinG);
  });

  it('profile height change → affects BMR', () => {
    const bmrShort = calculateBMR(80, 165, 28, 'male');
    const bmrTall = calculateBMR(80, 185, 28, 'male');
    expect(bmrTall).toBeGreaterThan(bmrShort);
  });

  it('goal change cut→bulk → updates calorie target in opposite direction', () => {
    const profile = mkHealthProfile();
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calculateTDEE(bmr, profile.activityLevel);

    const cutTarget = calculateTarget(tdee, getCalorieOffset('cut', 'moderate'));
    const bulkTarget = calculateTarget(tdee, getCalorieOffset('bulk', 'moderate'));

    expect(bulkTarget).toBeGreaterThan(cutTarget);
    expect(bulkTarget - cutTarget).toBe(1100);
  });

  it('body fat percentage affects lean body mass and protein target', () => {
    const targetCal = 2200;
    const weightKg = 80;

    const macrosNoBf = calculateMacros(targetCal, weightKg, 2.0, 0.25);
    const macrosWithBf = calculateMacros(targetCal, weightKg, 2.0, 0.25, 0.2);

    expect(macrosWithBf.proteinG).toBeLessThan(macrosNoBf.proteinG);
    expect(macrosWithBf.proteinG).toBe(Math.round(weightKg * (1 - 0.2) * 2.0));
  });

  it('nutrition targets flow into dashboard score correctly', () => {
    const profile = mkHealthProfile();
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const macros = calculateMacros(tdee, profile.weightKg, profile.proteinRatio, profile.fatPct);

    const scoreResult = calculateDailyScore({
      actualCalories: tdee - 30,
      targetCalories: tdee,
      actualProteinG: macros.proteinG,
      targetProteinG: macros.proteinG,
      workoutCompleted: true,
      isRestDay: false,
      isBeforeEvening: true,
      weightLoggedToday: true,
      streakDays: 3,
    });

    expect(scoreResult.totalScore).toBeGreaterThanOrEqual(80);
    expect(scoreResult.color).toBe('emerald');
  });

  it('gender change affects BMR calculation', () => {
    const maleBmr = calculateBMR(70, 170, 30, 'male');
    const femaleBmr = calculateBMR(70, 170, 30, 'female');
    expect(maleBmr).toBeGreaterThan(femaleBmr);
    expect(maleBmr - femaleBmr).toBe(166);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  5. NAVIGATION INTEGRATION
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-Feature: Navigation Integration', () => {
  beforeEach(() => {
    useNavigationStore.setState({
      activeTab: 'calendar',
      pageStack: [],
      showBottomNav: true,
      tabScrollPositions: {},
    });
  });

  it('navigateTab to dashboard clears page stack', () => {
    useNavigationStore.getState().pushPage({ id: 'p1', component: 'Detail' });
    expect(useNavigationStore.getState().pageStack).toHaveLength(1);

    useNavigationStore.getState().navigateTab('dashboard');
    expect(useNavigationStore.getState().activeTab).toBe('dashboard');
    expect(useNavigationStore.getState().pageStack).toHaveLength(0);
    expect(useNavigationStore.getState().showBottomNav).toBe(true);
  });

  it('QuickActionsBar "Log meal" → navigates to calendar tab', () => {
    useNavigationStore.getState().navigateTab('calendar');
    expect(useNavigationStore.getState().activeTab).toBe('calendar');
  });

  it('QuickActionsBar "Start workout" → navigates to fitness tab', () => {
    useNavigationStore.getState().navigateTab('fitness');
    expect(useNavigationStore.getState().activeTab).toBe('fitness');
  });

  it('TodaysPlanCard CTA → pushPage navigates to WorkoutLogger', () => {
    useNavigationStore.getState().navigateTab('dashboard');
    useNavigationStore.getState().pushPage({
      id: 'workout-logger',
      component: 'WorkoutLogger',
      props: { planDayId: 'pd-1' },
    });

    const state = useNavigationStore.getState();
    expect(state.pageStack).toHaveLength(1);
    expect(state.pageStack[0].component).toBe('WorkoutLogger');
    expect(state.showBottomNav).toBe(false);
  });

  it('cross-tab navigation preserves scroll position', () => {
    useNavigationStore.getState().navigateTab('dashboard');
    useNavigationStore.getState().setScrollPosition('dashboard', 250);

    useNavigationStore.getState().navigateTab('fitness');
    useNavigationStore.getState().setScrollPosition('fitness', 400);

    useNavigationStore.getState().navigateTab('dashboard');
    expect(useNavigationStore.getState().getScrollPosition('dashboard')).toBe(250);
    expect(useNavigationStore.getState().getScrollPosition('fitness')).toBe(400);
  });

  it('page stack depth is capped at MAX_PAGE_STACK_DEPTH (2)', () => {
    useNavigationStore.getState().pushPage({ id: 'p1', component: 'Page1' });
    useNavigationStore.getState().pushPage({ id: 'p2', component: 'Page2' });
    useNavigationStore.getState().pushPage({ id: 'p3', component: 'Page3' });

    const stack = useNavigationStore.getState().pageStack;
    expect(stack).toHaveLength(2);
    expect(stack[1].component).toBe('Page3');
  });

  it('popPage returns to previous page and restores bottom nav', () => {
    useNavigationStore.getState().pushPage({ id: 'p1', component: 'Detail' });
    expect(useNavigationStore.getState().showBottomNav).toBe(false);

    useNavigationStore.getState().popPage();
    expect(useNavigationStore.getState().pageStack).toHaveLength(0);
    expect(useNavigationStore.getState().showBottomNav).toBe(true);
  });

  it('canGoBack reflects page stack state', () => {
    expect(useNavigationStore.getState().canGoBack()).toBe(false);

    useNavigationStore.getState().pushPage({ id: 'p1', component: 'Detail' });
    expect(useNavigationStore.getState().canGoBack()).toBe(true);

    useNavigationStore.getState().popPage();
    expect(useNavigationStore.getState().canGoBack()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  6. INSIGHT ENGINE ← MULTI-FEATURE DATA
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-Feature: Insight Engine ← Multi-Feature Data', () => {
  it('auto-adjustment from nutrition engine → P1 alert insight', () => {
    const input: InsightInput = {
      hasAutoAdjustment: true,
      adjustmentDetails: { oldCal: 2200, newCal: 2000, reason: 'Giảm cân chậm' },
    };
    const insight = selectInsight(input, [], todayStr());
    expect(insight.id).toBe('p1-auto-adjust');
    expect(insight.type).toBe('alert');
    expect(insight.priority).toBe(1);
  });

  it('low protein after evening → P2 action insight', () => {
    const input: InsightInput = {
      proteinRatio: 0.5,
      isAfterEvening: true,
    };
    const insight = selectInsight(input, [], todayStr());
    expect(insight.id).toBe('p2-low-protein');
    expect(insight.type).toBe('action');
  });

  it('weight log overdue 5 days → P3 remind insight', () => {
    const input: InsightInput = { daysSinceWeightLog: 5 };
    const insight = selectInsight(input, [], todayStr());
    expect(insight.id).toBe('p3-weight-log');
    expect(insight.type).toBe('remind');
  });

  it('streak near record → P4 motivate insight', () => {
    const input: InsightInput = { currentStreak: 13, longestStreak: 14 };
    const insight = selectInsight(input, [], todayStr());
    expect(insight.id).toBe('p4-streak-near-record');
    expect(insight.type).toBe('motivate');
  });

  it('weekly adherence ≥85% → P6 praise insight', () => {
    const input: InsightInput = { weeklyAdherence: 90 };
    const insight = selectInsight(input, [], todayStr());
    expect(insight.id).toBe('p6-weekly-adherence');
    expect(insight.type).toBe('praise');
  });

  it('fallback to tip-of-the-day when no conditions met', () => {
    const input: InsightInput = {};
    const insight = selectInsight(input, [], todayStr());
    expect(insight.type).toBe('tip');
    expect(insight.priority).toBe(8);
  });

  it('dismissed insights are skipped to next priority', () => {
    const input: InsightInput = {
      hasAutoAdjustment: true,
      proteinRatio: 0.5,
      isAfterEvening: true,
    };
    const insight = selectInsight(input, ['p1-auto-adjust'], todayStr());
    expect(insight.id).toBe('p2-low-protein');
  });

  it('milestone check uses total sessions from fitness store', () => {
    const milestones = checkMilestones(50, 14);
    const sessionsAchieved = milestones.filter(
      (m) => m.type === 'sessions' && m.achievedDate,
    );
    const streakAchieved = milestones.filter(
      (m) => m.type === 'streak' && m.achievedDate,
    );

    expect(sessionsAchieved.length).toBeGreaterThanOrEqual(4);
    expect(streakAchieved.length).toBeGreaterThanOrEqual(2);
  });
});
