import {
  calculateTargetWeeklySets,
  distributeVolume,
  getVolumeLandmarks,
  MAV_TABLE,
  MEV_TABLE,
  MRV_TABLE,
  type MuscleGroup,
  type TrainingExperience,
  VOLUME_TABLE,
} from '../features/fitness/utils/volumeCalculator';

describe('volumeCalculator', () => {
  const allMuscles: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
  const allExperiences: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];

  describe('calculateTargetWeeklySets — base volume per experience level', () => {
    it.each(allExperiences)('returns base volume for %s with maintain goal, age ≤ 40', exp => {
      for (const muscle of allMuscles) {
        const result = calculateTargetWeeklySets(muscle, exp, 'maintain', 30);
        expect(result).toBe(Math.max(Math.round(VOLUME_TABLE[exp][muscle]), MEV_TABLE[muscle]));
      }
    });
  });

  describe('calculateTargetWeeklySets — cut modifier (-20%)', () => {
    it('reduces volume by 20% on cut', () => {
      const result = calculateTargetWeeklySets('chest', 'intermediate', 'cut', 30);
      expect(result).toBe(Math.max(Math.round(14 * 0.8), MEV_TABLE['chest']));
    });

    it('floors at MEV when cut pushes volume low', () => {
      const result = calculateTargetWeeklySets('core', 'beginner', 'cut', 30);
      const raw = Math.round(6 * 0.8);
      expect(result).toBe(Math.max(raw, MEV_TABLE['core']));
    });
  });

  describe('calculateTargetWeeklySets — bulk modifier (+10%)', () => {
    it('increases volume by 10% on bulk', () => {
      const result = calculateTargetWeeklySets('chest', 'intermediate', 'bulk', 30);
      expect(result).toBe(Math.max(Math.round(14 * 1.1), MEV_TABLE['chest']));
    });
  });

  describe('calculateTargetWeeklySets — age modifier (>40 = -10%)', () => {
    it('reduces volume by 10% when age > 40', () => {
      const result = calculateTargetWeeklySets('back', 'advanced', 'maintain', 45);
      expect(result).toBe(Math.max(Math.round(18 * 0.9), MEV_TABLE['back']));
    });

    it('does not reduce volume when age is exactly 40', () => {
      const result = calculateTargetWeeklySets('back', 'advanced', 'maintain', 40);
      expect(result).toBe(Math.max(18, MEV_TABLE['back']));
    });
  });

  describe('calculateTargetWeeklySets — sleep modifier (<7h = -10%)', () => {
    it('reduces volume by 10% when sleep < 7', () => {
      const result = calculateTargetWeeklySets('legs', 'intermediate', 'maintain', 30, 5);
      expect(result).toBe(Math.max(Math.round(14 * 0.9), MEV_TABLE['legs']));
    });

    it('does not reduce volume when sleep is exactly 7', () => {
      const result = calculateTargetWeeklySets('legs', 'intermediate', 'maintain', 30, 7);
      expect(result).toBe(Math.max(14, MEV_TABLE['legs']));
    });

    it('does not reduce volume when sleep is undefined', () => {
      const result = calculateTargetWeeklySets('legs', 'intermediate', 'maintain', 30);
      expect(result).toBe(Math.max(14, MEV_TABLE['legs']));
    });
  });

  describe('calculateTargetWeeklySets — priority muscle caps at MAV', () => {
    it('caps at MAV when muscle is in priority list', () => {
      const result = calculateTargetWeeklySets('chest', 'advanced', 'bulk', 30, 8, ['chest']);
      const raw = Math.round(18 * 1.1);
      expect(result).toBe(Math.min(raw, MAV_TABLE['chest']));
    });

    it('applies MAV cap even when volume exceeds MAV', () => {
      const result = calculateTargetWeeklySets('core', 'advanced', 'bulk', 30, 8, ['core']);
      const raw = Math.round(10 * 1.1);
      expect(result).toBe(Math.min(raw, MAV_TABLE['core']));
    });
  });

  describe('calculateTargetWeeklySets — non-priority muscle floors at MEV', () => {
    it('floors at MEV when modifiers push volume below MEV', () => {
      const result = calculateTargetWeeklySets('core', 'beginner', 'cut', 50, 5);
      const raw = Math.round(6 * 0.8 * 0.9 * 0.9);
      expect(result).toBe(Math.max(raw, MEV_TABLE['core']));
    });
  });

  describe('calculateTargetWeeklySets — combined modifiers stack', () => {
    it('applies cut + age + sleep modifiers together', () => {
      const result = calculateTargetWeeklySets('chest', 'intermediate', 'cut', 45, 5);
      const raw = Math.round(14 * 0.8 * 0.9 * 0.9);
      expect(result).toBe(Math.max(raw, MEV_TABLE['chest']));
    });

    it('applies bulk + age modifiers together', () => {
      const result = calculateTargetWeeklySets('back', 'advanced', 'bulk', 50);
      const raw = Math.round(18 * 1.1 * 0.9);
      expect(result).toBe(Math.max(raw, MEV_TABLE['back']));
    });

    it('applies bulk + sleep modifiers with priority', () => {
      const result = calculateTargetWeeklySets('legs', 'advanced', 'bulk', 30, 5, ['legs']);
      const raw = Math.round(18 * 1.1 * 0.9);
      expect(result).toBe(Math.min(raw, MAV_TABLE['legs']));
    });

    it('applies all modifiers: cut + age + sleep + priority', () => {
      const result = calculateTargetWeeklySets('arms', 'advanced', 'cut', 50, 5, ['arms']);
      const raw = Math.round(14 * 0.8 * 0.9 * 0.9);
      expect(result).toBe(Math.min(raw, MAV_TABLE['arms']));
    });
  });

  describe('distributeVolume', () => {
    it('distributes evenly when divisible', () => {
      expect(distributeVolume(3, 12)).toEqual([4, 4, 4]);
    });

    it('distributes evenly for single exercise', () => {
      expect(distributeVolume(1, 5)).toEqual([5]);
    });

    it('gives remainder to first exercises when uneven', () => {
      expect(distributeVolume(3, 10)).toEqual([4, 3, 3]);
    });

    it('handles remainder of 2 across 3 exercises', () => {
      expect(distributeVolume(3, 11)).toEqual([4, 4, 3]);
    });

    it('returns empty array when exerciseCount is 0', () => {
      expect(distributeVolume(0, 10)).toEqual([]);
    });

    it('returns all zeros when totalSets is 0', () => {
      expect(distributeVolume(3, 0)).toEqual([0, 0, 0]);
    });

    it('returns empty array when exerciseCount is negative', () => {
      expect(distributeVolume(-1, 10)).toEqual([]);
    });
  });

  describe('getVolumeLandmarks', () => {
    it.each(allMuscles)('returns correct landmarks for %s', muscle => {
      const result = getVolumeLandmarks(muscle);
      expect(result).toEqual({
        mev: MEV_TABLE[muscle],
        mav: MAV_TABLE[muscle],
        mrv: MRV_TABLE[muscle],
      });
    });

    it('returns specific known values for chest', () => {
      expect(getVolumeLandmarks('chest')).toEqual({ mev: 6, mav: 18, mrv: 24 });
    });

    it('returns specific known values for legs', () => {
      expect(getVolumeLandmarks('legs')).toEqual({ mev: 6, mav: 20, mrv: 26 });
    });
  });

  describe('calculateTargetWeeklySets — sessionDurationMin multiplier', () => {
    it('60min produces same volume as no duration param (baseline)', () => {
      for (const muscle of allMuscles) {
        const withoutDuration = calculateTargetWeeklySets(muscle, 'intermediate', 'maintain', 30);
        const with60min = calculateTargetWeeklySets(muscle, 'intermediate', 'maintain', 30, undefined, undefined, 60);
        expect(with60min).toBe(withoutDuration);
      }
    });

    it('undefined duration produces same volume as 60min', () => {
      for (const muscle of allMuscles) {
        const withUndefined = calculateTargetWeeklySets(
          muscle,
          'intermediate',
          'maintain',
          30,
          undefined,
          undefined,
          undefined,
        );
        const with60min = calculateTargetWeeklySets(muscle, 'intermediate', 'maintain', 30, undefined, undefined, 60);
        expect(withUndefined).toBe(with60min);
      }
    });

    it('30min produces ~65% of 60min volume', () => {
      const vol60 = calculateTargetWeeklySets('chest', 'intermediate', 'maintain', 30, undefined, undefined, 60);
      const vol30 = calculateTargetWeeklySets('chest', 'intermediate', 'maintain', 30, undefined, undefined, 30);
      // 30min multiplier = 0.65, baseline 14 → 14*0.65=9.1 → round 9
      expect(vol30).toBe(Math.max(Math.round(14 * 0.65), MEV_TABLE['chest']));
      expect(vol30).toBeLessThan(vol60);
    });

    it('45min produces ~82.5% of 60min volume', () => {
      const vol45 = calculateTargetWeeklySets('back', 'intermediate', 'maintain', 30, undefined, undefined, 45);
      // 45min multiplier = 0.825, baseline 14 → 14*0.825=11.55 → round 12
      expect(vol45).toBe(Math.max(Math.round(14 * 0.825), MEV_TABLE['back']));
    });

    it('90min produces clamped 1.3x of baseline volume', () => {
      const vol90 = calculateTargetWeeklySets('legs', 'intermediate', 'maintain', 30, undefined, undefined, 90);
      // 90min raw = 1.35, clamped to 1.3 → 14*1.3=18.2 → round 18
      expect(vol90).toBe(Math.max(Math.round(14 * 1.3), MEV_TABLE['legs']));
    });

    it('duration scaling is monotonically increasing: 30 < 45 < 60 < 90', () => {
      const durations = [30, 45, 60, 90] as const;
      const volumes = durations.map(d =>
        calculateTargetWeeklySets('chest', 'advanced', 'maintain', 30, undefined, undefined, d),
      );
      for (let i = 1; i < volumes.length; i++) {
        expect(volumes[i]).toBeGreaterThanOrEqual(volumes[i - 1]);
      }
    });
  });

  describe('calculateTargetWeeklySets — MEV floor with duration', () => {
    it('30min session never drops below MEV for any muscle', () => {
      for (const muscle of allMuscles) {
        const result = calculateTargetWeeklySets(muscle, 'beginner', 'maintain', 30, undefined, undefined, 30);
        expect(result).toBeGreaterThanOrEqual(MEV_TABLE[muscle]);
      }
    });

    it('30min + cut + age>40 + poor sleep still respects MEV floor', () => {
      for (const muscle of allMuscles) {
        const result = calculateTargetWeeklySets(muscle, 'beginner', 'cut', 50, 5, undefined, 30);
        expect(result).toBeGreaterThanOrEqual(MEV_TABLE[muscle]);
      }
    });

    it('15min extreme case still respects MEV for beginner', () => {
      for (const muscle of allMuscles) {
        const result = calculateTargetWeeklySets(muscle, 'beginner', 'cut', 50, 5, undefined, 15);
        expect(result).toBeGreaterThanOrEqual(MEV_TABLE[muscle]);
      }
    });
  });

  describe('calculateTargetWeeklySets — duration edge cases', () => {
    it('15min clamps multiplier at 0.5 minimum', () => {
      // 15min: 0.3 + (15/60)*0.7 = 0.475 → clamped to 0.5
      const result = calculateTargetWeeklySets('chest', 'intermediate', 'maintain', 30, undefined, undefined, 15);
      expect(result).toBe(Math.max(Math.round(14 * 0.5), MEV_TABLE['chest']));
    });

    it('120min clamps multiplier at 1.3 maximum (same as 90min)', () => {
      const vol90 = calculateTargetWeeklySets('chest', 'intermediate', 'maintain', 30, undefined, undefined, 90);
      const vol120 = calculateTargetWeeklySets('chest', 'intermediate', 'maintain', 30, undefined, undefined, 120);
      expect(vol120).toBe(vol90);
    });

    it('duration multiplier stacks with other modifiers', () => {
      // cut(0.8) + age>40(0.9) + duration 30min(0.65)
      const result = calculateTargetWeeklySets('chest', 'intermediate', 'cut', 45, undefined, undefined, 30);
      const expected = Math.max(Math.round(14 * 0.8 * 0.9 * 0.65), MEV_TABLE['chest']);
      expect(result).toBe(expected);
    });

    it('duration + priority muscle caps at MAV and floors at MEV', () => {
      const result = calculateTargetWeeklySets('chest', 'advanced', 'bulk', 30, 8, ['chest'], 90);
      // bulk(1.1) * duration(1.3) = 1.43 → 18*1.43=25.74 → round 26, cap MAV 18
      const raw = Math.round(18 * 1.1 * 1.3);
      expect(result).toBe(Math.max(Math.min(raw, MAV_TABLE['chest']), MEV_TABLE['chest']));
    });

    it('duration with priority muscle still floors at MEV', () => {
      const result = calculateTargetWeeklySets('core', 'beginner', 'cut', 50, 5, ['core'], 15);
      // cut(0.8)*age(0.9)*sleep(0.9)*duration(0.5) = 0.324 → 6*0.324=1.944 → round 2
      // capped at MAV(10), floored at MEV(4)
      expect(result).toBeGreaterThanOrEqual(MEV_TABLE['core']);
      expect(result).toBeLessThanOrEqual(MAV_TABLE['core']);
    });
  });

  describe('exported tables have correct structure', () => {
    it('VOLUME_TABLE has all experience levels and muscles', () => {
      for (const exp of allExperiences) {
        for (const muscle of allMuscles) {
          expect(typeof VOLUME_TABLE[exp][muscle]).toBe('number');
          expect(VOLUME_TABLE[exp][muscle]).toBeGreaterThan(0);
        }
      }
    });

    it('MEV_TABLE has all muscles', () => {
      for (const muscle of allMuscles) {
        expect(typeof MEV_TABLE[muscle]).toBe('number');
      }
    });

    it('MAV_TABLE has all muscles', () => {
      for (const muscle of allMuscles) {
        expect(typeof MAV_TABLE[muscle]).toBe('number');
      }
    });

    it('MRV_TABLE has all muscles', () => {
      for (const muscle of allMuscles) {
        expect(typeof MRV_TABLE[muscle]).toBe('number');
      }
    });

    it('MEV < MAV < MRV for all muscles', () => {
      for (const muscle of allMuscles) {
        expect(MEV_TABLE[muscle]).toBeLessThan(MAV_TABLE[muscle]);
        expect(MAV_TABLE[muscle]).toBeLessThan(MRV_TABLE[muscle]);
      }
    });
  });
});
