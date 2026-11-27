import { SEED_TRAINING_PLANS } from './fitness-seed';
import { catalogEntry, catalogReviewedFacts } from './exercise-catalog';
import { expandEquipment } from './exercise-discovery';
import { exerciseGuideText } from './exercise-guide-texts';
import { isTimedExercise } from './exercise-measures';
import type { TrainingPlanDayDraft, TrainingPlanExerciseDraft } from './fitness.types';
import { normalizeTrainingPrescription } from './fitness-prescription';

export interface WorkoutPreferences {
  age: number | null;
  weekdays: readonly number[];
  minutes: number;
  equipment: readonly string[] | null;
  avoid: readonly string[] | 'unclear' | null;
  frequency: number | null;
  familiarVolume: boolean;
}

export interface WorkoutPlanOption {
  sourceId: string;
  name: string;
  days: readonly TrainingPlanDayDraft[];
  frequency: number;
  setsPerWeek: number;
  maxMinutes: number;
  shifted: boolean;
  shortened: boolean;
  adjusted: boolean;
}

export interface WorkoutRecommendation {
  status: 'manual' | 'incomplete' | 'ready';
  explanation: string;
  plans: WorkoutPlanOption[];
  shortPlans: WorkoutPlanOption[];
  session: TrainingPlanExerciseDraft[];
  sessionMinutes: number;
}

export const workoutWeekdays = [
  { day: 1, label: 'Thứ Hai', short: 'T2' },
  { day: 2, label: 'Thứ Ba', short: 'T3' },
  { day: 3, label: 'Thứ Tư', short: 'T4' },
  { day: 4, label: 'Thứ Năm', short: 'T5' },
  { day: 5, label: 'Thứ Sáu', short: 'T6' },
  { day: 6, label: 'Thứ Bảy', short: 'T7' },
  { day: 0, label: 'Chủ nhật', short: 'CN' },
] as const;

export function workoutExerciseName(id: string): string {
  return exerciseGuideText(id)?.nameVi ?? catalogEntry(id)?.name ?? id;
}

export function workoutDayName(day: number): string {
  return workoutWeekdays.find((item) => item.day === day)?.label ?? '';
}

export function upperMinutes(exercises: readonly TrainingPlanExerciseDraft[]): number {
  if (!exercises.length) return 0;
  let seconds = 600 + 120 * (exercises.length - 1);
  for (const exercise of exercises) {
    const entry = catalogEntry(exercise.exerciseId);
    const sides = entry && catalogReviewedFacts(entry).perSide ? 2 : 1;
    const secondsPerSet = isTimedExercise(exercise.exerciseId) ? exercise.repsMax : 60;
    seconds += exercise.sets * secondsPerSet * sides + (exercise.sets - 1) * exercise.restSeconds;
  }
  return Math.ceil(seconds / 60);
}

function fitBudget(
  exercises: readonly TrainingPlanExerciseDraft[],
  minutes: number,
): TrainingPlanExerciseDraft[] {
  const draft = exercises.map((exercise) => ({ ...exercise }));
  while (draft.length && upperMinutes(draft) > minutes) {
    let largest = draft[draft.length - 1];
    for (const item of draft) if (item.sets > largest.sets) largest = item;
    if (largest.sets > 1) largest.sets--;
    else draft.pop();
  }
  return draft;
}

const starterChoices: readonly (readonly string[])[] = [
  ['goblet-squat', 'bodyweight-squat'],
  ['dumbbell-floor-press', 'push-up'],
  ['dumbbell-row', 'renegade-row', 'dumbbell-romanian-deadlift', 'glute-bridge'],
];

function preferenceIssue(
  input: WorkoutPreferences,
): Pick<WorkoutRecommendation, 'status' | 'explanation'> | null {
  if (
    input.age === null ||
    !Number.isFinite(input.age) ||
    input.age < 18 ||
    input.avoid === 'unclear'
  ) {
    return {
      status: 'manual',
      explanation:
        input.avoid === 'unclear'
          ? 'Hãy xác định động tác cần tránh trước khi nhận gợi ý. Bạn vẫn có thể xem bài hoặc ghi buổi tự do.'
          : 'Gợi ý tự động dành cho người từ 18 tuổi có ngày sinh trong hồ sơ. Bạn vẫn có thể ghi buổi tập tự do.',
    };
  }
  if (
    !input.weekdays.length ||
    new Set(input.weekdays).size !== input.weekdays.length ||
    input.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
    !Number.isInteger(input.minutes) ||
    input.minutes <= 0 ||
    input.equipment === null ||
    input.avoid === null
  ) {
    return {
      status: 'incomplete',
      explanation: 'Chọn ngày rảnh, thời gian, dụng cụ và động tác cần tránh.',
    };
  }
  return null;
}

export function workoutExerciseUsable(
  id: string,
  available: ReadonlySet<string>,
  avoid: ReadonlySet<string>,
): boolean {
  const entry = catalogEntry(id);
  if (!entry || avoid.has(id)) return false;
  const facts = catalogReviewedFacts(entry);
  return (
    !!facts.movementPattern &&
    facts.required !== null &&
    !avoid.has(facts.movementPattern) &&
    facts.required.every((key) => available.has(key))
  );
}

export function workoutDraftIssue(
  input: WorkoutPreferences,
  days: readonly TrainingPlanDayDraft[],
): string | null {
  const issue = preferenceIssue(input);
  if (issue) return issue.explanation;
  const scheduled = days.filter((day) => !day.isRestDay);
  if (
    days.length !== 7 ||
    new Set(days.map((d) => d.dayOfWeek)).size !== 7 ||
    days.some(
      (d) =>
        !Number.isInteger(d.dayOfWeek) ||
        d.dayOfWeek < 0 ||
        d.dayOfWeek > 6 ||
        (d.isRestDay && d.exercises.length > 0),
    )
  ) {
    return 'Bản nháp cần đủ bảy ngày riêng biệt và ghi đúng ngày nghỉ.';
  }
  if (
    !scheduled.length ||
    scheduled.some((day) => !input.weekdays.includes(day.dayOfWeek)) ||
    (input.frequency !== null && scheduled.length !== input.frequency) ||
    (scheduled.length >= 4 && !input.familiarVolume)
  ) {
    return 'Số buổi hoặc ngày tập trong bản nháp chưa phù hợp với lịch của bạn.';
  }
  const available = expandEquipment(input.equipment ?? []);
  const avoid = new Set(Array.isArray(input.avoid) ? input.avoid : []);
  for (const day of scheduled) {
    if (
      !day.exercises.length ||
      new Set(day.exercises.map((item) => item.exerciseId)).size !== day.exercises.length
    )
      return 'Mỗi buổi cần có bài tập riêng biệt.';
    for (const item of day.exercises) {
      if (!workoutExerciseUsable(item.exerciseId, available, avoid))
        return (
          workoutExerciseName(item.exerciseId) + ' chưa phù hợp với dụng cụ hoặc động tác đã chọn.'
        );
      const expected = normalizeTrainingPrescription(item);
      if (
        item.sets !== expected.sets ||
        item.repsMin !== expected.repsMin ||
        item.repsMax !== expected.repsMax ||
        item.restSeconds !== expected.restSeconds
      )
        return 'Chỉ tiêu của bài tập chưa hợp lệ.';
    }
    if (upperMinutes(day.exercises) > input.minutes)
      return 'Thời lượng ước tính vượt số phút bạn có.';
  }
  return null;
}

export function recommendWorkout(input: WorkoutPreferences): WorkoutRecommendation {
  const issue = preferenceIssue(input);
  const result: WorkoutRecommendation = {
    status: issue?.status ?? 'ready',
    explanation: issue?.explanation ?? '',
    plans: [],
    shortPlans: [],
    session: [],
    sessionMinutes: 0,
  };
  if (issue) return result;
  const available = expandEquipment(input.equipment ?? []);
  const avoid = new Set<string>(Array.isArray(input.avoid) ? input.avoid : []);
  const usable = (id: string): boolean => workoutExerciseUsable(id, available, avoid);
  for (const plan of SEED_TRAINING_PLANS) {
    if (plan.frequency > input.weekdays.length || (plan.frequency >= 4 && !input.familiarVolume))
      continue;
    const trainingDays = plan.days.filter((day) => !day.isRestDay);
    const shift = [0, 1, 2, 3, 4, 5, 6].find((offset) =>
      trainingDays.every((day) => input.weekdays.includes((day.dayOfWeek + offset) % 7)),
    );
    if (
      shift === undefined ||
      trainingDays.some((day) => day.exercises.some((e) => !usable(e.exerciseId)))
    )
      continue;
    const max = Math.max(...trainingDays.map((d) => upperMinutes(d.exercises)));
    const shortened = max > input.minutes;
    const days = plan.days.map((day) => ({
      ...day,
      dayOfWeek: (day.dayOfWeek + shift) % 7,
      exercises: shortened ? fitBudget(day.exercises, input.minutes) : day.exercises,
    }));
    if (days.some((day, index) => day.exercises.length !== plan.days[index].exercises.length))
      continue;
    days.sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7));
    const option: WorkoutPlanOption = {
      sourceId: plan.id,
      name: plan.name,
      frequency: plan.frequency,
      days,
      maxMinutes: shortened ? Math.max(...days.map((d) => upperMinutes(d.exercises))) : max,
      setsPerWeek: days.flatMap((d) => d.exercises).reduce((total, item) => total + item.sets, 0),
      shifted: shift !== 0,
      shortened,
      adjusted: shortened || shift !== 0,
    };
    (shortened ? result.shortPlans : result.plans).push(option);
  }
  const rank = (a: WorkoutPlanOption, b: WorkoutPlanOption): number =>
    Number(b.frequency === input.frequency) - Number(a.frequency === input.frequency) ||
    Number(a.adjusted) - Number(b.adjusted) ||
    a.maxMinutes - b.maxMinutes ||
    a.name.localeCompare(b.name, 'vi');
  result.plans.sort(rank);
  result.shortPlans.sort(rank);
  const exercises = starterChoices.flatMap((choices) => {
    const exerciseId = choices.find(usable);
    return exerciseId
      ? [{ exerciseId, sets: 2, repsMin: 8, repsMax: 12, restSeconds: 90, notes: null }]
      : [];
  });
  result.session = fitBudget(exercises, input.minutes);
  result.sessionMinutes = upperMinutes(result.session);
  result.explanation = result.plans.length
    ? 'Đã kiểm ngày rảnh, dụng cụ, động tác cần tránh và thời lượng của từng buổi.'
    : 'Không có mẫu nguyên bản vừa lịch, thời gian, dụng cụ và điều kiện bạn chọn.';
  return result;
}
