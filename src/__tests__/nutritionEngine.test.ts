import {
  ACTIVITY_MULTIPLIERS,
  calculateBMR,
  calculateMacros,
  calculateTarget,
  calculateTDEE,
  getAutoAdjustedMultiplier,
  getCalorieOffset,
  sessionsToLevel,
} from '../services/nutritionEngine';

// ---------------------------------------------------------------------------
// 1. BMR (Mifflin-St Jeor)
// ---------------------------------------------------------------------------
describe('calculateBMR', () => {
  it('calculates correctly for male', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR(80, 180, 30, 'male')).toBe(1780);
  });

  it('calculates correctly for female', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345);
  });

  it('returns bmrOverride when provided', () => {
    expect(calculateBMR(80, 180, 30, 'male', 2000)).toBe(2000);
  });

  it('ignores bmrOverride when it is 0 (falsy)', () => {
    // bmrOverride = 0 is falsy → should compute normally
    expect(calculateBMR(80, 180, 30, 'male', 0)).toBe(1780);
  });

  it('handles very light weight', () => {
    // 10*40 + 6.25*150 - 5*20 + 5 = 400 + 937.5 - 100 + 5 = 1242.5 → 1243
    expect(calculateBMR(40, 150, 20, 'male')).toBe(1243);
  });

  it('handles very heavy weight', () => {
    // 10*150 + 6.25*200 - 5*40 + 5 = 1500 + 1250 - 200 + 5 = 2555
    expect(calculateBMR(150, 200, 40, 'male')).toBe(2555);
  });

  it('handles elderly female', () => {
    // 10*55 + 6.25*155 - 5*70 - 161 = 550 + 968.75 - 350 - 161 = 1007.75 → 1008
    expect(calculateBMR(55, 155, 70, 'female')).toBe(1008);
  });
});

// ---------------------------------------------------------------------------
// 2. TDEE — all 5 activity levels
// ---------------------------------------------------------------------------
describe('calculateTDEE', () => {
  const bmr = 1780;

  it.each([
    ['sedentary', 1.2, Math.round(bmr * 1.2)],
    ['light', 1.375, Math.round(bmr * 1.375)],
    ['moderate', 1.55, Math.round(bmr * 1.55)],
    ['active', 1.725, Math.round(bmr * 1.725)],
    ['extra_active', 1.9, Math.round(bmr * 1.9)],
  ] as const)('calculates TDEE for %s (×%s)', (level, _mult, expected) => {
    expect(calculateTDEE(bmr, level)).toBe(expected);
  });

  it('rounds result to nearest integer', () => {
    // 1345 * 1.375 = 1849.375 → 1849
    expect(calculateTDEE(1345, 'light')).toBe(1849);
  });
});

// ---------------------------------------------------------------------------
// 3. sessionsToLevel — boundary values
// ---------------------------------------------------------------------------
describe('sessionsToLevel', () => {
  it.each([
    [-1, 'sedentary'],
    [0, 'sedentary'],
    [1, 'light'],
    [2, 'light'],
    [3, 'moderate'],
    [4, 'moderate'],
    [5, 'active'],
    [6, 'active'],
    [7, 'extra_active'],
    [10, 'extra_active'],
  ] as const)('maps %i sessions → %s', (sessions, expected) => {
    expect(sessionsToLevel(sessions)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 4. getAutoAdjustedMultiplier — blend formula
// ---------------------------------------------------------------------------
describe('getAutoAdjustedMultiplier', () => {
  it('returns pure sedentary blend when 0 sessions & sedentary base', () => {
    const result = getAutoAdjustedMultiplier('sedentary', 0);
    // auto=sedentary=1.2, base=sedentary=1.2 → 1.2*0.7 + 1.2*0.3 = 1.2
    expect(result).toBeCloseTo(1.2);
  });

  it('blends moderate auto with sedentary base for 3 sessions', () => {
    const result = getAutoAdjustedMultiplier('sedentary', 3);
    // auto=moderate=1.55, base=sedentary=1.2 → 1.55*0.7 + 1.2*0.3 = 1.085 + 0.36 = 1.445
    expect(result).toBeCloseTo(1.445);
  });

  it('blends active auto with light base for 6 sessions', () => {
    const result = getAutoAdjustedMultiplier('light', 6);
    // auto=active=1.725, base=light=1.375 → 1.725*0.7 + 1.375*0.3 = 1.2075 + 0.4125 = 1.62
    expect(result).toBeCloseTo(1.62);
  });

  it('blends extra_active auto with moderate base for 7 sessions', () => {
    const result = getAutoAdjustedMultiplier('moderate', 7);
    // auto=extra_active=1.9, base=moderate=1.55 → 1.9*0.7 + 1.55*0.3 = 1.33 + 0.465 = 1.795
    expect(result).toBeCloseTo(1.795);
  });
});

// ---------------------------------------------------------------------------
// 5. Caloric Target
// ---------------------------------------------------------------------------
describe('calculateTarget', () => {
  it('calculates cut target (negative offset)', () => {
    expect(calculateTarget(2500, -500)).toBe(2000);
  });

  it('calculates bulk target (positive offset)', () => {
    expect(calculateTarget(2500, 300)).toBe(2800);
  });

  it('calculates maintain target (zero offset)', () => {
    expect(calculateTarget(2500, 0)).toBe(2500);
  });
});

// ---------------------------------------------------------------------------
// 6. Macro Split
// ---------------------------------------------------------------------------
describe('calculateMacros', () => {
  it('calculates normal case without bodyFatPct', () => {
    // targetCal=2500, weightKg=80, proteinRatio=2.0, fatPct=0.25
    const result = calculateMacros(2500, 80, 2.0, 0.25);
    expect(result.proteinG).toBe(160); // 80 * 2.0
    expect(result.proteinCal).toBe(640); // 160 * 4
    expect(result.fatCal).toBe(625); // round(2500 * 0.25)
    expect(result.fatG).toBe(69); // round(625 / 9)
    expect(result.carbsCal).toBe(1235); // 2500 - 640 - 625
    expect(result.carbsG).toBe(309); // round(1235 / 4)
    expect(result.isOverallocated).toBe(false);
  });

  it('uses LBM when bodyFatPct is provided', () => {
    // bodyFatPct=0.20 → effectiveWeight = 80 * 0.80 = 64
    const result = calculateMacros(2500, 80, 2.0, 0.25, 0.2);
    expect(result.proteinG).toBe(128); // 64 * 2.0
    expect(result.proteinCal).toBe(512); // 128 * 4
    expect(result.fatCal).toBe(625);
    expect(result.carbsCal).toBe(1363); // 2500 - 512 - 625
    expect(result.isOverallocated).toBe(false);
  });

  it('handles bodyFatPct of 0 (uses full weight)', () => {
    const result = calculateMacros(2500, 80, 2.0, 0.25, 0);
    // effectiveWeight = 80 * (1 - 0) = 80
    expect(result.proteinG).toBe(160);
  });

  it('detects overallocated scenario', () => {
    // Extreme: heavy person on tight cut
    // targetCal=1200, weightKg=120, proteinRatio=2.5, fatPct=0.30
    // proteinG = 120 * 2.5 = 300, proteinCal = 1200
    // fatCal = round(1200 * 0.30) = 360
    // proteinCal + fatCal = 1560 > 1200 → overallocated
    const result = calculateMacros(1200, 120, 2.5, 0.3);
    expect(result.isOverallocated).toBe(true);
    expect(result.carbsCal).toBe(0); // clamped to 0
    expect(result.carbsG).toBe(0);
  });

  it('handles zero carbs edge case exactly at boundary', () => {
    // targetCal=2000, weight=100, ratio=3.0, fatPct=0.25
    // proteinG=300, proteinCal=1200, fatCal=500 → sum=1700
    // carbsCal=300 → still not zero, so push further
    // targetCal=1000, weight=100, ratio=2.0, fatPct=0.25
    // proteinG=200, proteinCal=800, fatCal=250 → sum=1050 > 1000 → overallocated
    const result = calculateMacros(1000, 100, 2.0, 0.25);
    expect(result.carbsCal).toBe(0);
    expect(result.carbsG).toBe(0);
    expect(result.isOverallocated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. getCalorieOffset — all 3 rates × 3 goals = 9 combos
// ---------------------------------------------------------------------------
describe('getCalorieOffset', () => {
  it.each([
    ['cut', 'conservative', -275],
    ['cut', 'moderate', -550],
    ['cut', 'aggressive', -1100],
    ['bulk', 'conservative', 275],
    ['bulk', 'moderate', 550],
    ['bulk', 'aggressive', 1100],
    ['maintain', 'conservative', 0],
    ['maintain', 'moderate', 0],
    ['maintain', 'aggressive', 0],
  ] as const)('%s + %s → %i', (goal, rate, expected) => {
    expect(getCalorieOffset(goal, rate)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 8. ACTIVITY_MULTIPLIERS constant
// ---------------------------------------------------------------------------
describe('ACTIVITY_MULTIPLIERS', () => {
  it('has exactly 5 levels', () => {
    expect(Object.keys(ACTIVITY_MULTIPLIERS)).toHaveLength(5);
  });

  it('values are within physiological range', () => {
    Object.values(ACTIVITY_MULTIPLIERS).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1.0);
      expect(v).toBeLessThanOrEqual(2.5);
    });
  });
});
