import type { PlanTemplate, TrainingProfile, TrainingExperience } from '../types';

const WEIGHT_DAYS = 0.3;
const WEIGHT_GOAL = 0.25;
const WEIGHT_LEVEL = 0.2;
const WEIGHT_EQUIPMENT = 0.15;
const WEIGHT_POPULARITY = 0.1;

const EXPERIENCE_ORDER: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];

function scoreDays(template: PlanTemplate, profile: TrainingProfile): number {
  const diff = Math.abs(template.daysPerWeek - profile.daysPerWeek);
  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0;
}

function scoreGoal(template: PlanTemplate, profile: TrainingProfile): number {
  if (template.trainingGoal === profile.trainingGoal) return 1;
  if (template.trainingGoal === 'general') return 0.5;
  return 0;
}

function scoreLevel(template: PlanTemplate, profile: TrainingProfile): number {
  if (template.experienceLevel === 'all') return 1;
  if (template.experienceLevel === profile.trainingExperience) return 1;

  const templateIdx = EXPERIENCE_ORDER.indexOf(template.experienceLevel as TrainingExperience);
  const profileIdx = EXPERIENCE_ORDER.indexOf(profile.trainingExperience);
  if (templateIdx === -1 || profileIdx === -1) return 0;

  return Math.abs(templateIdx - profileIdx) === 1 ? 0.5 : 0;
}

function scoreEquipment(template: PlanTemplate, profile: TrainingProfile): number {
  const templateSet = new Set(template.equipmentRequired);
  const profileSet = new Set(profile.availableEquipment);

  if (templateSet.size === 0 && profileSet.size === 0) return 1;

  const union = new Set([...templateSet, ...profileSet]);
  if (union.size === 0) return 1;

  let intersectionCount = 0;
  for (const item of templateSet) {
    if (profileSet.has(item)) intersectionCount++;
  }

  return intersectionCount / union.size;
}

function scorePopularity(template: PlanTemplate): number {
  return Math.min(Math.max(template.popularityScore, 0), 100) / 100;
}

export function computeMatchScore(template: PlanTemplate, profile: TrainingProfile): number {
  const days = scoreDays(template, profile) * WEIGHT_DAYS;
  const goal = scoreGoal(template, profile) * WEIGHT_GOAL;
  const level = scoreLevel(template, profile) * WEIGHT_LEVEL;
  const equipment = scoreEquipment(template, profile) * WEIGHT_EQUIPMENT;
  const popularity = scorePopularity(template) * WEIGHT_POPULARITY;

  return Math.round((days + goal + level + equipment + popularity) * 100);
}
