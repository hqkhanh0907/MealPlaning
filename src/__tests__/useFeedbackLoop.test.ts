import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUTO_ADJUST_CONFIG,
  calculateAdherence,
  calculateMovingAverage,
  evaluateAndSuggestAdjustment,
  getEntriesInWindow,
  useFeedbackLoop,
} from '../features/dashboard/hooks/useFeedbackLoop';
import type { WeightEntry } from '../features/fitness/types';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import type { Goal } from '../features/health-profile/types';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: () => ({
    targetCalories: 2000,
    targetProtein: 150,
    targetFat: 70,
    targetCarbs: 250,
    bmr: 1700,
    tdee: 2200,
  }),
}));

function makeEntry(date: string, weightKg: number): WeightEntry {
  return {
    id: `w-${date}-${weightKg}`,
    date,
    weightKg,
    createdAt: date,
    updatedAt: date,
  };
}

function daysAgoDate(daysAgo: number): string {
  const d = new Date('2024-06-15T00:00:00.000Z');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function buildEntriesAcrossWeeks(currentWeekWeights: number[], previousWeekWeights: number[]): WeightEntry[] {
  const entries: WeightEntry[] = [];
  currentWeekWeights.forEach((w, i) => {
    entries.push(makeEntry(daysAgoDate(i), w));
  });
  previousWeekWeights.forEach((w, i) => {
    entries.push(makeEntry(daysAgoDate(7 + i), w));
  });
  return entries;
}

function makeGoal(type: 'cut' | 'bulk' | 'maintain', calorieOffset = 0): Goal {
  return {
    id: 'goal-1',
    type,
    rateOfChange: 'moderate',
    calorieOffset,
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };
}

describe('useFeedbackLoop — pure functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateMovingAverage', () => {
    it('returns null when fewer than 3 entries', () => {
      expect(calculateMovingAverage([])).toBeNull();
      expect(calculateMovingAverage([makeEntry('2024-06-14', 80), makeEntry('2024-06-13', 81)])).toBeNull();
    });

    it('returns correct average for 3+ entries', () => {
      const entries = [makeEntry('2024-06-14', 80), makeEntry('2024-06-13', 82), makeEntry('2024-06-12', 81)];
      expect(calculateMovingAverage(entries)).toBeCloseTo(81, 5);
    });
  });

  describe('getEntriesInWindow', () => {
    it('filters entries by date range', () => {
      const entries = [
        makeEntry('2024-06-15', 80),
        makeEntry('2024-06-14', 81),
        makeEntry('2024-06-10', 82),
        makeEntry('2024-06-08', 83),
        makeEntry('2024-06-01', 84),
      ];
      const result = getEntriesInWindow(entries, 0, 7);
      expect(result).toHaveLength(3);
      expect(result.map(e => e.date)).toEqual(expect.arrayContaining(['2024-06-15', '2024-06-14', '2024-06-10']));
    });

    it('returns empty array when no entries in range', () => {
      const entries = [makeEntry('2024-01-01', 80), makeEntry('2024-01-02', 81)];
      const result = getEntriesInWindow(entries, 0, 7);
      expect(result).toHaveLength(0);
    });
  });

  describe('evaluateAndSuggestAdjustment', () => {
    it('reduces calories when cut + stalled', () => {
      const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 2000, 'cut', 2200);
      expect(result).not.toBeNull();
      expect(result!.newTargetCal).toBe(2000 - AUTO_ADJUST_CONFIG.calorieAdjustment);
      expect(result!.oldTargetCal).toBe(2000);
      expect(result!.triggerType).toBe('auto');
      expect(result!.reason).toContain('stalled');
    });

    it('returns null when cut + losing weight', () => {
      const entries = buildEntriesAcrossWeeks([78, 78, 78, 78, 78], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 2000, 'cut', 2200);
      expect(result).toBeNull();
    });

    it('increases calories when bulk + stalled', () => {
      const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 3000, 'bulk', 2500);
      expect(result).not.toBeNull();
      expect(result!.newTargetCal).toBe(3000 + AUTO_ADJUST_CONFIG.calorieAdjustment);
      expect(result!.reason).toContain('stalled');
    });

    it('returns null when bulk + gaining weight', () => {
      const entries = buildEntriesAcrossWeeks([82, 82, 82, 82, 82], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 3000, 'bulk', 2500);
      expect(result).toBeNull();
    });

    it('returns null for maintain goal', () => {
      const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
      expect(evaluateAndSuggestAdjustment(entries, 2000, 'maintain', 2200)).toBeNull();
    });

    it('returns null with insufficient data', () => {
      const fewEntries = [makeEntry(daysAgoDate(0), 80), makeEntry(daysAgoDate(1), 80), makeEntry(daysAgoDate(2), 80)];
      expect(evaluateAndSuggestAdjustment(fewEntries, 2000, 'cut', 2200)).toBeNull();
    });

    it('respects minCalories floor', () => {
      const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 1250, 'cut', 2200);
      expect(result).not.toBeNull();
      expect(result!.newTargetCal).toBe(AUTO_ADJUST_CONFIG.minCalories);
    });

    it('respects maxSurplus cap', () => {
      const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
      const tdee = 2500;
      const cap = tdee + AUTO_ADJUST_CONFIG.maxSurplus;
      const result = evaluateAndSuggestAdjustment(entries, cap - 50, 'bulk', tdee);
      expect(result).not.toBeNull();
      expect(result!.newTargetCal).toBe(cap);
    });
  });

  describe('calculateAdherence', () => {
    it('returns 100 when all days on target', () => {
      const actual = [2000, 2050, 1950, 2100];
      const target = [2000, 2000, 2000, 2000];
      const protein = [140, 145, 135, 150];
      const protTarget = [150, 150, 150, 150];
      const result = calculateAdherence(actual, target, protein, protTarget);
      expect(result.calorie).toBe(100);
      expect(result.protein).toBe(100);
    });

    it('returns 0 when no data provided', () => {
      const result = calculateAdherence([], [], [], []);
      expect(result.calorie).toBe(0);
      expect(result.protein).toBe(0);
    });

    it('calculates correct percentage for mixed results', () => {
      const actual = [2000, 2500, 1500, 2050];
      const target = [2000, 2000, 2000, 2000];
      const protein = [150, 100, 140, 135];
      const protTarget = [150, 150, 150, 150];
      const result = calculateAdherence(actual, target, protein, protTarget);
      expect(result.calorie).toBe(50);
      expect(result.protein).toBe(75);
    });

    it('returns 0 protein when only calorie data provided', () => {
      const result = calculateAdherence([2000], [2000], [], []);
      expect(result.calorie).toBe(100);
      expect(result.protein).toBe(0);
    });

    it('returns 0 calorie when only protein data provided', () => {
      const result = calculateAdherence([], [], [150], [150]);
      expect(result.calorie).toBe(0);
      expect(result.protein).toBe(100);
    });
  });

  describe('evaluateAndSuggestAdjustment — additional branches', () => {
    it('reduces calories when cut + gaining weight', () => {
      const entries = buildEntriesAcrossWeeks([82, 82, 82, 82, 82], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 2000, 'cut', 2200);
      expect(result).not.toBeNull();
      expect(result!.reason).toContain('increasing');
    });

    it('increases calories when bulk + losing weight', () => {
      const entries = buildEntriesAcrossWeeks([78, 78, 78, 78, 78], [80, 80, 80, 80, 80]);
      const result = evaluateAndSuggestAdjustment(entries, 3000, 'bulk', 2500);
      expect(result).not.toBeNull();
      expect(result!.reason).toContain('decreasing');
    });

    it('returns null when entries exist but one week has < 3', () => {
      const entries = [
        makeEntry(daysAgoDate(0), 80),
        makeEntry(daysAgoDate(1), 80.1),
        makeEntry(daysAgoDate(2), 80.2),
        makeEntry(daysAgoDate(3), 80.3),
        makeEntry(daysAgoDate(4), 80.4),
        makeEntry(daysAgoDate(5), 80.5),
        makeEntry(daysAgoDate(5), 80.6),
        makeEntry(daysAgoDate(6), 80.7),
        makeEntry(daysAgoDate(7), 80),
        makeEntry(daysAgoDate(8), 80),
      ];
      const result = evaluateAndSuggestAdjustment(entries, 2000, 'cut', 2200);
      expect(result).toBeNull();
    });
  });
});

describe('useFeedbackLoop — hook', () => {
  const fitnessInitial = useFitnessStore.getState();
  const healthInitial = useHealthProfileStore.getState();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    useFitnessStore.setState({ ...fitnessInitial, weightEntries: [] });
    useHealthProfileStore.setState({
      ...healthInitial,
      activeGoal: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null movingAverage and adjustment with no data', () => {
    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.movingAverage).toBeNull();
    expect(result.current.adjustment).toBeNull();
    expect(result.current.adherence).toEqual({ calorie: 0, protein: 0 });
  });

  it('computes movingAverage from weight entries', () => {
    useFitnessStore.setState({
      weightEntries: [makeEntry('2024-06-14', 80), makeEntry('2024-06-13', 82), makeEntry('2024-06-12', 81)],
    });
    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.movingAverage).toBeCloseTo(81, 5);
  });

  it('returns adjustment when conditions are met', () => {
    const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
    useFitnessStore.setState({ weightEntries: entries });
    useHealthProfileStore.setState({
      activeGoal: makeGoal('cut', -200),
    });

    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.adjustment).not.toBeNull();
    expect(result.current.adjustment!.triggerType).toBe('auto');
  });

  it('returns null adjustment with no active goal', () => {
    const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
    useFitnessStore.setState({ weightEntries: entries });
    useHealthProfileStore.setState({ activeGoal: null });

    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.adjustment).toBeNull();
  });

  it('applyAdjustment updates store and clears adjustment', () => {
    const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
    useFitnessStore.setState({ weightEntries: entries });
    useHealthProfileStore.setState({
      activeGoal: makeGoal('cut', -200),
    });

    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.adjustment).not.toBeNull();

    act(() => {
      result.current.applyAdjustment();
    });

    expect(result.current.adjustment).toBeNull();
    const updatedGoal = useHealthProfileStore.getState().activeGoal;
    expect(updatedGoal).not.toBeNull();
    expect(updatedGoal!.calorieOffset).not.toBe(-200);
  });

  it('dismissAdjustment clears the adjustment', () => {
    const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
    useFitnessStore.setState({ weightEntries: entries });
    useHealthProfileStore.setState({
      activeGoal: makeGoal('cut', -200),
    });

    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.adjustment).not.toBeNull();

    act(() => {
      result.current.dismissAdjustment();
    });

    expect(result.current.adjustment).toBeNull();
  });

  it('applyAdjustment is a no-op when no adjustment exists', () => {
    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.adjustment).toBeNull();

    act(() => {
      result.current.applyAdjustment();
    });

    expect(result.current.adjustment).toBeNull();
  });

  it('applyAdjustment is a no-op when goal was removed', () => {
    const entries = buildEntriesAcrossWeeks([80, 80, 80, 80, 80], [80, 80, 80, 80, 80]);
    useFitnessStore.setState({ weightEntries: entries });
    useHealthProfileStore.setState({
      activeGoal: makeGoal('cut', -200),
    });

    const { result } = renderHook(() => useFeedbackLoop());
    expect(result.current.adjustment).not.toBeNull();

    act(() => {
      useHealthProfileStore.setState({ activeGoal: null });
      result.current.applyAdjustment();
    });

    const goal = useHealthProfileStore.getState().activeGoal;
    expect(goal).toBeNull();
  });
});
