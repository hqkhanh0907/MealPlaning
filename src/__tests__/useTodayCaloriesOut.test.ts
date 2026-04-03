import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { useTodayCaloriesOut } from '../hooks/useTodayCaloriesOut';
import { useFitnessStore } from '../store/fitnessStore';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-06T12:00:00'));
  useFitnessStore.setState({ workouts: [], workoutSets: [] });
  useHealthProfileStore.setState({ profile: { weightKg: 70 } as never });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTodayCaloriesOut', () => {
  it('returns 0 when no workouts today', () => {
    useFitnessStore.setState({ workouts: [], workoutSets: [] });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(0);
  });

  it('sums estimatedCalories from cardio sets', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Cardio',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 200,
          updatedAt: '2025-01-06',
        },
        {
          id: 's2',
          workoutId: 'w1',
          exerciseId: 'e2',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 150,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(350);
  });

  it('counts strength sets (weightKg > 0, no estimatedCalories) as 8 cal each', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Strength',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 50,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
        {
          id: 's2',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 2,
          weightKg: 60,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
        {
          id: 's3',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 3,
          weightKg: 70,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(24); // 3 sets × 8
  });

  it('sums cardio + strength calories for mixed workouts', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Mixed',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 200,
          updatedAt: '2025-01-06',
        },
        {
          id: 's2',
          workoutId: 'w1',
          exerciseId: 'e2',
          setNumber: 1,
          weightKg: 50,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
        {
          id: 's3',
          workoutId: 'w1',
          exerciseId: 'e2',
          setNumber: 2,
          weightKg: 60,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(216); // 200 cardio + 2×8 strength
  });

  it('ignores workouts from other dates', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-05',
          name: 'Yesterday',
          createdAt: '2025-01-05',
          updatedAt: '2025-01-05',
        },
        {
          id: 'w2',
          date: '2025-01-07',
          name: 'Tomorrow',
          createdAt: '2025-01-07',
          updatedAt: '2025-01-07',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 500,
          updatedAt: '2025-01-05',
        },
        {
          id: 's2',
          workoutId: 'w2',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 300,
          updatedAt: '2025-01-07',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(0);
  });

  it('excludes strength sets with zero weightKg', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Strength',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(0);
  });

  it('handles multiple workouts on the same day', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Morning',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
        {
          id: 'w2',
          date: '2025-01-06',
          name: 'Evening',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 100,
          updatedAt: '2025-01-06',
        },
        {
          id: 's2',
          workoutId: 'w2',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 200,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(300);
  });

  it('rounds the result to nearest integer', () => {
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Cardio',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 0,
          estimatedCalories: 100.7,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(101);
  });

  it('uses MET-based calculation when workout has durationMin', () => {
    useHealthProfileStore.setState({ profile: { weightKg: 80 } as never });
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Strength',
          durationMin: 60,
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 50,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    // MET calculation: Math.round((5 * 80 * 60) / 60) = 400
    expect(result.current).toBe(400);
  });

  it('falls back to flat rate when workout has no durationMin', () => {
    useHealthProfileStore.setState({ profile: { weightKg: 80 } as never });
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Strength',
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 50,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
        {
          id: 's2',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 2,
          weightKg: 60,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    expect(result.current).toBe(16); // 2 sets × 8 cal
  });

  it('uses default weight when profile is null', () => {
    useHealthProfileStore.setState({ profile: null });
    useFitnessStore.setState({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-06',
          name: 'Strength',
          durationMin: 60,
          createdAt: '2025-01-06',
          updatedAt: '2025-01-06',
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          weightKg: 50,
          estimatedCalories: undefined,
          updatedAt: '2025-01-06',
        },
      ],
    });
    const { result } = renderHook(() => useTodayCaloriesOut());
    // MET: Math.round((5 * 70 * 60) / 60) = 350
    expect(result.current).toBe(350);
  });
});
