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
