import { recalcTargets } from './recalc-targets';

describe('recalcTargets', () => {
  it('computes targets for male maintain at moderate (1.55)', () => {
    const result = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: 1.55,
    });
    // bmr = round(10*70 + 6.25*175 - 5*30 + 5) = round(1648.75) = 1649
    expect(result.bmr).toBe(1649);
    // tdee = round(1649 * 1.55) = round(2555.95) = 2556
    expect(result.tdee).toBe(2556);
    // maintain: +0
    expect(result.target_calories).toBe(2556);
    // 70 * 1.6 = 112
    expect(result.target_protein).toBe(112);
  });

  it('applies lose_weight adjustments (-500 cal, 2.2 protein) for female sedentary (1.2)', () => {
    const result = recalcTargets({
      weight_kg: 60,
      height_cm: 165,
      age: 28,
      gender: 'female',
      goal: 'lose_weight',
      activity_factor: 1.2,
    });
    // bmr = round(10*60 + 6.25*165 - 5*28 - 161) = round(1330.25) = 1330
    expect(result.bmr).toBe(1330);
    // tdee = round(1330 * 1.2) = 1596
    expect(result.tdee).toBe(1596);
    expect(result.target_calories).toBe(1096);
    expect(result.target_protein).toBe(132);
  });

  it('computes tdee for light activity (1.375)', () => {
    const result = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: 1.375,
    });
    // bmr 1649 * 1.375 = 2267.375 → 2267
    expect(result.bmr).toBe(1649);
    expect(result.tdee).toBe(2267);
  });

  it('computes tdee for heavy activity (1.725)', () => {
    const result = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: 1.725,
    });
    // 1649 * 1.725 = 2844.525 → 2845
    expect(result.tdee).toBe(2845);
  });

  it('applies performance goal (+200 cal, 2.0 protein)', () => {
    const result = recalcTargets({
      weight_kg: 75,
      height_cm: 180,
      age: 32,
      gender: 'male',
      goal: 'performance',
      activity_factor: 1.55,
    });
    // bmr = round(10*75 + 6.25*180 - 5*32 + 5) = round(750 + 1125 - 160 + 5) = 1720
    expect(result.bmr).toBe(1720);
    // tdee = round(1720 * 1.55) = round(2666) = 2666
    expect(result.tdee).toBe(2666);
    // performance: +200
    expect(result.target_calories).toBe(2866);
    // 75 * 2.0 = 150
    expect(result.target_protein).toBe(150);
  });

  it('falls back to moderate (1.55) when activity_factor is unknown', () => {
    const known = recalcTargets({
      weight_kg: 80,
      height_cm: 180,
      age: 35,
      gender: 'male',
      goal: 'gain_muscle',
      activity_factor: 1.55,
    });
    const unknown = recalcTargets({
      weight_kg: 80,
      height_cm: 180,
      age: 35,
      gender: 'male',
      goal: 'gain_muscle',
      activity_factor: 1.4,
    });
    expect(unknown.tdee).toBe(known.tdee);
    expect(unknown.target_calories).toBe(known.target_calories);
    // gain_muscle: +300, protein 80*2.2=176
    expect(unknown.target_protein).toBe(176);
    expect(unknown.target_calories).toBe(known.tdee + 300);
  });

  it('falls back to moderate when activity_factor is NaN', () => {
    const ref = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: 1.55,
    });
    const nan = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: Number.NaN,
    });
    expect(nan.tdee).toBe(ref.tdee);
  });

  it('falls back to moderate when activity_factor is 0', () => {
    const ref = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: 1.55,
    });
    const zero = recalcTargets({
      weight_kg: 70,
      height_cm: 175,
      age: 30,
      gender: 'male',
      goal: 'maintain',
      activity_factor: 0,
    });
    expect(zero.tdee).toBe(ref.tdee);
  });
});
