export const GENDER_LABELS = { male: 'Nam', female: 'Nữ' } as const;
export type Gender = keyof typeof GENDER_LABELS;

export const GOAL_LABELS = {
  lose_weight: 'Giảm cân',
  maintain: 'Duy trì',
  gain_muscle: 'Tăng cơ',
  performance: 'Tăng sức mạnh',
} as const;
export type Goal = keyof typeof GOAL_LABELS;

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'heavy'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type FitnessLevel = (typeof FITNESS_LEVELS)[number];
export const FITNESS_LEVEL_LABELS: Readonly<Record<FitnessLevel, string>> = {
  beginner: 'Mới tập',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export type GymExperience = 'never' | 'under_6m' | '6m_2y' | 'over_2y';

const experienceLevels: Readonly<Record<GymExperience, FitnessLevel>> = {
  never: 'beginner',
  under_6m: 'beginner',
  '6m_2y': 'intermediate',
  over_2y: 'advanced',
};

export function deriveFitnessLevel(experience: GymExperience): FitnessLevel {
  return experienceLevels[experience];
}
