import type { MuscleGroup, SplitType, TrainingPlanDay, SplitChangePreview } from '../types';
import { safeParseJsonArray } from '../types';

interface SplitDayDefinition {
  dayLabel: string;
  muscleGroups: MuscleGroup[];
}

const FULL_BODY_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];

const SPLIT_DEFINITIONS: Record<Exclude<SplitType, 'custom'>, SplitDayDefinition[]> = {
  full_body: [
    { dayLabel: 'Full Body A', muscleGroups: [...FULL_BODY_MUSCLES] },
    { dayLabel: 'Full Body B', muscleGroups: [...FULL_BODY_MUSCLES] },
    { dayLabel: 'Full Body C', muscleGroups: [...FULL_BODY_MUSCLES] },
  ],
  upper_lower: [
    { dayLabel: 'Upper', muscleGroups: ['chest', 'back', 'shoulders', 'arms'] },
    { dayLabel: 'Lower', muscleGroups: ['legs', 'glutes', 'core'] },
  ],
  ppl: [
    { dayLabel: 'Push', muscleGroups: ['chest', 'shoulders'] },
    { dayLabel: 'Pull', muscleGroups: ['back'] },
    { dayLabel: 'Legs', muscleGroups: ['legs', 'glutes'] },
  ],
  bro_split: [
    { dayLabel: 'Chest', muscleGroups: ['chest'] },
    { dayLabel: 'Back', muscleGroups: ['back'] },
    { dayLabel: 'Shoulders', muscleGroups: ['shoulders'] },
    { dayLabel: 'Legs', muscleGroups: ['legs', 'glutes'] },
    { dayLabel: 'Arms', muscleGroups: ['arms'] },
  ],
};

function parseMuscleGroups(day: TrainingPlanDay): MuscleGroup[] {
  return safeParseJsonArray<MuscleGroup>(day.muscleGroups);
}

function getSplitDays(splitType: SplitType, daysPerWeek: number): SplitDayDefinition[] {
  if (splitType === 'custom') {
    return Array.from({ length: daysPerWeek }, (_, i) => ({
      dayLabel: `Day ${String(i + 1)}`,
      muscleGroups: [...FULL_BODY_MUSCLES],
    }));
  }

  const baseDays = SPLIT_DEFINITIONS[splitType];
  const result: SplitDayDefinition[] = [];

  for (let i = 0; i < daysPerWeek; i++) {
    const base = baseDays[i % baseDays.length];
    const suffix = Math.floor(i / baseDays.length) + 1;
    const label = i >= baseDays.length ? `${base.dayLabel} ${String(suffix + 1)}` : base.dayLabel;
    result.push({ dayLabel: label, muscleGroups: [...base.muscleGroups] });
  }

  return result;
}

function findBestMatchingDay(
  dayMuscles: MuscleGroup[],
  targetDays: SplitDayDefinition[],
  usedIndices: Set<number>,
): { index: number; overlap: number } | null {
  let bestIndex = -1;
  let bestOverlap = 0;

  for (let i = 0; i < targetDays.length; i++) {
    if (usedIndices.has(i)) continue;
    const targetMuscles = new Set(targetDays[i].muscleGroups);
    let overlap = 0;
    for (const m of dayMuscles) {
      if (targetMuscles.has(m)) overlap++;
    }
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) return null;
  return { index: bestIndex, overlap: bestOverlap };
}

export function remapExercisesToNewSplit(
  currentDays: TrainingPlanDay[],
  newSplitType: SplitType,
  daysPerWeek: number,
): SplitChangePreview {
  const targetDays = getSplitDays(newSplitType, daysPerWeek);
  const mapped: SplitChangePreview['mapped'] = [];
  const suggested: SplitChangePreview['suggested'] = [];
  const unmapped: TrainingPlanDay[] = [];
  const usedIndices = new Set<number>();

  for (const day of currentDays) {
    const dayMuscles = parseMuscleGroups(day);
    if (dayMuscles.length === 0) {
      unmapped.push(day);
      continue;
    }

    const match = findBestMatchingDay(dayMuscles, targetDays, usedIndices);
    if (match && match.overlap > 0) {
      usedIndices.add(match.index);
      mapped.push({
        from: day,
        toDay: targetDays[match.index].dayLabel,
        toMuscleGroups: targetDays[match.index].muscleGroups,
      });
    } else {
      unmapped.push(day);
    }
  }

  for (let i = 0; i < targetDays.length; i++) {
    if (!usedIndices.has(i)) {
      suggested.push({
        day: targetDays[i].dayLabel,
        muscleGroups: targetDays[i].muscleGroups,
        reason: 'No existing day matched this slot',
      });
    }
  }

  return { mapped, suggested, unmapped };
}
