import type { FitnessState } from '../fitnessStore';

export const selectActivePlan = (s: FitnessState) => s.trainingPlans.find(p => p.status === 'active');
