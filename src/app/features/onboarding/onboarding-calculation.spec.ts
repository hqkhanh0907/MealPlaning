import {
  calculateBmr,
  calculateTargetCalories,
  calculateTargetProtein,
  calculateTdee,
  deriveFitnessLevel,
  getActivityFactor,
} from './onboarding-calculation';

describe('onboarding-calculation', () => {
  it('calculates male BMR with Mifflin-St Jeor formula', () => {
    expect(calculateBmr({ weightKg: 65, heightCm: 170, age: 30, gender: 'male' })).toBe(1568);
  });

  it('calculates female BMR with Mifflin-St Jeor formula', () => {
    expect(calculateBmr({ weightKg: 55, heightCm: 160, age: 28, gender: 'female' })).toBe(1249);
  });

  it('maps activity level to factor and TDEE correctly', () => {
    expect(getActivityFactor('moderate')).toBe(1.55);
    expect(calculateTdee(1618, 'moderate')).toBe(2508);
  });

  it('calculates target calories by goal', () => {
    expect(calculateTargetCalories(2508, 'lose_weight')).toBe(2008);
    expect(calculateTargetCalories(2508, 'gain_muscle')).toBe(2808);
    expect(calculateTargetCalories(2508, 'maintain')).toBe(2508);
    expect(calculateTargetCalories(2508, 'performance')).toBe(2708);
  });

  it('calculates target protein by goal', () => {
    expect(calculateTargetProtein(65, 'lose_weight')).toBe(143);
    expect(calculateTargetProtein(65, 'gain_muscle')).toBe(143);
    expect(calculateTargetProtein(65, 'maintain')).toBe(104);
    expect(calculateTargetProtein(65, 'performance')).toBe(130);
  });

  it('derives fitness level from gym experience', () => {
    expect(deriveFitnessLevel('never')).toBe('beginner');
    expect(deriveFitnessLevel('under_6m')).toBe('beginner');
    expect(deriveFitnessLevel('6m_2y')).toBe('intermediate');
    expect(deriveFitnessLevel('over_2y')).toBe('advanced');
  });
});
