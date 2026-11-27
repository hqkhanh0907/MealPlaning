import type { ExerciseCategory, MuscleGroup, TrainingPlanType } from './fitness.types';
import { catalogCategory, catalogEquipment, catalogMuscleGroup } from './exercise-catalog';
import { sourceCatalogEntries } from './exercise-catalog.generated';
import { exerciseGuideText } from './exercise-guide-texts';
import { exerciseInstructions } from './exercise-guides';

export const FITNESS_SEED_VERSION = '2.0.0';

export interface SeedExercise {
  id: string;
  name: string;
  name_vi: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  equipment: string;
  instructions: string;
}

export interface SeedPlannedExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes: string;
}

export interface SeedTrainingDay {
  dayOfWeek: number;
  name: string;
  isRestDay: boolean;
  exercises: SeedPlannedExercise[];
}

export interface SeedTrainingPlan {
  id: string;
  name: string;
  type: TrainingPlanType;
  frequency: number;
  description: string;
  days: SeedTrainingDay[];
}

export const SEED_EXERCISES: readonly SeedExercise[] = sourceCatalogEntries.map((entry) => ({
  id: entry.id,
  name: entry.name,
  name_vi: exerciseGuideText(entry.id)?.nameVi ?? entry.name,
  muscle_group: catalogMuscleGroup(entry),
  category: catalogCategory(entry),
  equipment: catalogEquipment(entry),
  instructions: exerciseInstructions(entry.id) ?? '',
}));

export const SEED_TRAINING_PLANS: readonly SeedTrainingPlan[] = [
  {
    id: 'plan_two_dumbbells_floor',
    name: 'Hai tạ đơn và sàn',
    type: 'full_body',
    frequency: 2,
    description:
      'Mẫu khởi đầu cho người lớn khỏe mạnh. Tập thứ Ba và thứ Sáu với hai tạ đơn, không cần ghế.',
    days: [rest(1), dumbbellDay(2), rest(3), rest(4), dumbbellDay(5), rest(6), rest(0)],
  },
  {
    id: 'plan_full_body_3x',
    name: 'Full Body 3 buổi',
    type: 'full_body',
    frequency: 3,
    description: 'Phù hợp người mới: tập toàn thân 3 ngày/tuần, ưu tiên kỹ thuật và phục hồi.',
    days: [
      day(1, 'Full Body A', [
        pe('squat', 3, 8, 10, 120, 'Giữ form ổn định trước khi tăng tạ.'),
        pe('bench-press', 3, 8, 10, 120, 'Giữ hai chân vững khi đẩy.'),
        pe('seated-cable-row', 3, 10, 12, 90, 'Kéo khuỷu về sau, không giật người.'),
        pe('plank', 3, 30, 45, 60, 'Ghi thời gian giữ plank.'),
      ]),
      rest(2),
      day(3, 'Full Body B', [
        pe('romanian-deadlift', 3, 8, 10, 120, 'Cảm nhận đùi sau, lưng trung lập.'),
        pe('overhead-press', 3, 6, 8, 120, 'Không ưỡn lưng quá mức.'),
        pe('lat-pulldown', 3, 10, 12, 90, 'Kéo xuống trước ngực.'),
        pe('dumbbell-lunge', 2, 10, 12, 90, 'Ghi số lần của một bên sau khi tập cả hai bên.'),
      ]),
      rest(4),
      day(5, 'Full Body C', [
        pe('leg-press', 3, 10, 12, 120, 'Biên độ kiểm soát.'),
        pe('incline-dumbbell-press', 3, 8, 12, 90, 'Tạ đơn cho biên độ tự nhiên.'),
        pe('bent-over-row', 3, 8, 10, 120, 'Giữ core chặt.'),
        pe('hanging-knee-raise', 3, 8, 12, 60, 'Gập gối khi nâng. Dừng khi thân bắt đầu đung đưa.'),
      ]),
      rest(6),
      rest(0),
    ],
  },
  {
    id: 'plan_upper_lower_4x',
    name: 'Upper / Lower 4 buổi',
    type: 'upper_lower',
    frequency: 4,
    description: 'Trình độ trung cấp: tăng khối lượng thân trên/thân dưới, nghỉ giữa các block.',
    days: [
      day(1, 'Upper A', [
        pe('bench-press', 4, 6, 8, 150, 'Compound chính.'),
        pe('bent-over-row', 4, 8, 10, 120, 'Kéo cùng khối lượng với đẩy.'),
        pe('dumbbell-shoulder-press', 3, 8, 10, 90, 'Không khóa khuỷu quá mạnh.'),
        pe('tricep-pushdowns', 3, 10, 15, 60, 'Kiểm soát eccentric.'),
        pe('barbell-curl', 3, 10, 12, 60, 'Không đung đưa người.'),
      ]),
      day(2, 'Lower A', [
        pe('squat', 4, 6, 8, 150, 'Top priority của buổi.'),
        pe('romanian-deadlift', 3, 8, 10, 120, 'Hinge chậm.'),
        pe('leg-extension', 3, 12, 15, 60, 'Siết đùi trước.'),
        pe('standing-calf-raise-machine', 4, 10, 15, 60, 'Dừng 1 giây ở đỉnh.'),
      ]),
      rest(3),
      day(4, 'Upper B', [
        pe('overhead-press', 4, 6, 8, 150, 'Compound chính vai.'),
        pe('pull-up', 4, 6, 10, 120, 'Dùng assisted nếu cần.'),
        pe('incline-dumbbell-press', 3, 8, 12, 90, 'Upper chest.'),
        pe('face-pulls', 3, 12, 15, 60, 'Bảo vệ vai sau.'),
        pe('hammer-curls', 3, 10, 12, 60, 'Brachialis/forearm.'),
      ]),
      day(5, 'Lower B', [
        pe('deadlift', 3, 4, 6, 180, 'Tập nặng nhưng không max-out mỗi tuần.'),
        pe('leg-press', 4, 10, 12, 120, 'Volume chính cho đùi.'),
        pe('leg-curl', 3, 10, 15, 60, 'Đùi sau isolation.'),
        pe('hip-thrusts', 3, 8, 12, 90, 'Mông/hip extension.'),
      ]),
      rest(6),
      rest(0),
    ],
  },
  {
    id: 'plan_ppl_6x',
    name: 'PPL 6 buổi',
    type: 'ppl',
    frequency: 6,
    description: 'Trình độ nâng cao: Đẩy/Kéo/Chân lặp 2 vòng, khối lượng cao và cần phục hồi tốt.',
    days: [
      day(1, 'Push A', [
        pe('bench-press', 4, 6, 8, 150, 'Đẩy ngang nặng.'),
        pe('overhead-press', 3, 6, 8, 120, 'Đẩy vai.'),
        pe('incline-dumbbell-press', 3, 8, 12, 90, 'Ngực trên.'),
        pe('lateral-raises', 4, 12, 15, 60, 'Vai giữa.'),
        pe('tricep-pushdowns', 3, 10, 15, 60, 'Tay sau.'),
      ]),
      day(2, 'Pull A', [
        pe('deadlift', 3, 4, 6, 180, 'Không tập tới failure.'),
        pe('pull-up', 4, 6, 10, 120, 'Vertical pull.'),
        pe('bent-over-row', 4, 8, 10, 120, 'Horizontal pull.'),
        pe('face-pulls', 3, 12, 15, 60, 'Vai sau.'),
        pe('barbell-curl', 3, 10, 12, 60, 'Biceps.'),
      ]),
      day(3, 'Legs A', [
        pe('squat', 4, 6, 8, 150, 'Quad dominant.'),
        pe('romanian-deadlift', 3, 8, 10, 120, 'Hamstrings.'),
        pe('leg-press', 3, 10, 12, 120, 'Volume thêm.'),
        pe('standing-calf-raise-machine', 4, 10, 15, 60, 'Calves.'),
      ]),
      day(4, 'Push B', [
        pe('incline-dumbbell-press', 4, 8, 10, 120, 'Ngực trên.'),
        pe('dumbbell-shoulder-press', 3, 8, 10, 90, 'Vai trước.'),
        pe('pec-deck', 3, 12, 15, 60, 'Stretch ngực.'),
        pe('reverse-pec-deck', 3, 12, 15, 60, 'Cân bằng vai.'),
        pe('skull-crushers', 3, 10, 12, 60, 'Tay sau.'),
      ]),
      day(5, 'Pull B', [
        pe('lat-pulldown', 4, 8, 12, 90, 'Lats.'),
        pe('seated-cable-row', 4, 8, 12, 90, 'Mid-back.'),
        pe('assisted-pull-up', 3, 8, 10, 90, 'Volume bổ sung.'),
        pe('hammer-curls', 3, 10, 12, 60, 'Biceps/forearm.'),
        pe('farmers-walk', 3, 30, 45, 90, 'Ghi tổng tạ mang theo và thời gian đi.'),
      ]),
      day(6, 'Legs B', [
        pe('front-squat', 4, 6, 8, 150, 'Quad focus.'),
        pe('leg-curl', 4, 10, 15, 60, 'Hamstring isolation.'),
        pe('hip-thrusts', 4, 8, 12, 90, 'Glutes.'),
        pe('bulgarian-split-squat', 3, 8, 12, 90, 'Mỗi bên.'),
        pe('seated-calf-raise-machine', 4, 12, 15, 60, 'Calves.'),
      ]),
      rest(0),
    ],
  },
];

function day(dayOfWeek: number, name: string, exercises: SeedPlannedExercise[]): SeedTrainingDay {
  return { dayOfWeek, name, isRestDay: false, exercises };
}

function rest(dayOfWeek: number): SeedTrainingDay {
  return { dayOfWeek, name: 'Ngày nghỉ', isRestDay: true, exercises: [] };
}

function dumbbellDay(dayOfWeek: number): SeedTrainingDay {
  return day(dayOfWeek, 'Toàn thân với tạ đơn', [
    pe('goblet-squat', 2, 8, 12, 90, ''),
    pe('push-up', 2, 8, 12, 90, ''),
    pe('renegade-row', 2, 8, 12, 90, ''),
    pe('dumbbell-romanian-deadlift', 2, 8, 12, 90, ''),
  ]);
}

function pe(
  exerciseId: string,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSeconds: number,
  notes: string,
): SeedPlannedExercise {
  return { exerciseId, sets, repsMin, repsMax, restSeconds, notes };
}
