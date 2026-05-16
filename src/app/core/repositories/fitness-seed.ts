import type { ExerciseCategory, MuscleGroup, TrainingPlanType } from '../models/fitness.types';

export const FITNESS_SEED_VERSION = '1.0.1';

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

export const SEED_EXERCISES: readonly SeedExercise[] = [
  ex(
    'ex_barbell_bench_press',
    'Barbell Bench Press',
    'Đẩy ngực tạ đòn',
    'chest',
    'compound',
    'Barbell',
  ),
  ex(
    'ex_incline_dumbbell_press',
    'Incline Dumbbell Press',
    'Đẩy ngực dốc tạ đơn',
    'chest',
    'compound',
    'Dumbbell',
  ),
  ex('ex_push_up', 'Push-up', 'Chống đẩy', 'chest', 'compound', 'Bodyweight'),
  ex('ex_chest_fly', 'Chest Fly', 'Ép ngực', 'chest', 'isolation', 'Machine/Dumbbell'),
  ex('ex_dip', 'Dip', 'Nhún xà kép', 'chest', 'compound', 'Bodyweight'),
  ex('ex_pull_up', 'Pull-up', 'Kéo xà', 'back', 'compound', 'Bodyweight'),
  ex('ex_lat_pulldown', 'Lat Pulldown', 'Kéo xô máy', 'back', 'compound', 'Cable'),
  ex('ex_barbell_row', 'Barbell Row', 'Kéo lưng tạ đòn', 'back', 'compound', 'Barbell'),
  ex('ex_seated_cable_row', 'Seated Cable Row', 'Kéo cáp ngồi', 'back', 'compound', 'Cable'),
  ex('ex_deadlift', 'Deadlift', 'Deadlift', 'back', 'compound', 'Barbell'),
  ex('ex_face_pull', 'Face Pull', 'Kéo cáp mặt', 'shoulders', 'isolation', 'Cable'),
  ex('ex_overhead_press', 'Overhead Press', 'Đẩy vai tạ đòn', 'shoulders', 'compound', 'Barbell'),
  ex(
    'ex_dumbbell_shoulder_press',
    'Dumbbell Shoulder Press',
    'Đẩy vai tạ đơn',
    'shoulders',
    'compound',
    'Dumbbell',
  ),
  ex('ex_lateral_raise', 'Lateral Raise', 'Dang vai ngang', 'shoulders', 'isolation', 'Dumbbell'),
  ex(
    'ex_rear_delt_fly',
    'Rear Delt Fly',
    'Ép vai sau',
    'shoulders',
    'isolation',
    'Dumbbell/Machine',
  ),
  ex('ex_upright_row', 'Upright Row', 'Kéo tạ đứng', 'shoulders', 'compound', 'Barbell/Cable'),
  ex('ex_barbell_curl', 'Barbell Curl', 'Cuốn tay trước tạ đòn', 'biceps', 'isolation', 'Barbell'),
  ex(
    'ex_dumbbell_curl',
    'Dumbbell Curl',
    'Cuốn tay trước tạ đơn',
    'biceps',
    'isolation',
    'Dumbbell',
  ),
  ex('ex_hammer_curl', 'Hammer Curl', 'Cuốn búa', 'biceps', 'isolation', 'Dumbbell'),
  ex(
    'ex_preacher_curl',
    'Preacher Curl',
    'Cuốn tay ghế nghiêng',
    'biceps',
    'isolation',
    'Machine/Barbell',
  ),
  ex('ex_triceps_pushdown', 'Triceps Pushdown', 'Đẩy cáp tay sau', 'triceps', 'isolation', 'Cable'),
  ex('ex_skull_crusher', 'Skull Crusher', 'Nằm duỗi tay sau', 'triceps', 'isolation', 'EZ Bar'),
  ex(
    'ex_overhead_triceps_extension',
    'Overhead Triceps Extension',
    'Duỗi tay sau qua đầu',
    'triceps',
    'isolation',
    'Dumbbell/Cable',
  ),
  ex(
    'ex_close_grip_bench_press',
    'Close-grip Bench Press',
    'Đẩy ngực tay hẹp',
    'triceps',
    'compound',
    'Barbell',
  ),
  ex('ex_back_squat', 'Back Squat', 'Squat tạ đòn', 'quads', 'compound', 'Barbell'),
  ex('ex_front_squat', 'Front Squat', 'Front squat', 'quads', 'compound', 'Barbell'),
  ex('ex_leg_press', 'Leg Press', 'Đạp đùi máy', 'quads', 'compound', 'Machine'),
  ex('ex_lunge', 'Lunge', 'Chùng chân', 'quads', 'compound', 'Dumbbell/Bodyweight'),
  ex('ex_leg_extension', 'Leg Extension', 'Đá đùi trước', 'quads', 'isolation', 'Machine'),
  ex(
    'ex_romanian_deadlift',
    'Romanian Deadlift',
    'Deadlift Romania',
    'hamstrings',
    'compound',
    'Barbell/Dumbbell',
  ),
  ex('ex_leg_curl', 'Leg Curl', 'Cuốn đùi sau', 'hamstrings', 'isolation', 'Machine'),
  ex('ex_good_morning', 'Good Morning', 'Good morning', 'hamstrings', 'compound', 'Barbell'),
  ex('ex_hip_thrust', 'Hip Thrust', 'Đẩy hông', 'glutes', 'compound', 'Barbell'),
  ex('ex_glute_bridge', 'Glute Bridge', 'Cầu mông', 'glutes', 'compound', 'Bodyweight/Barbell'),
  ex('ex_cable_kickback', 'Cable Kickback', 'Đá mông cáp', 'glutes', 'isolation', 'Cable'),
  ex(
    'ex_standing_calf_raise',
    'Standing Calf Raise',
    'Nhón bắp chân đứng',
    'calves',
    'isolation',
    'Machine',
  ),
  ex(
    'ex_seated_calf_raise',
    'Seated Calf Raise',
    'Nhón bắp chân ngồi',
    'calves',
    'isolation',
    'Machine',
  ),
  ex('ex_plank', 'Plank', 'Plank', 'abs', 'isolation', 'Bodyweight'),
  ex('ex_crunch', 'Crunch', 'Gập bụng', 'abs', 'isolation', 'Bodyweight'),
  ex(
    'ex_hanging_leg_raise',
    'Hanging Leg Raise',
    'Nâng chân treo xà',
    'abs',
    'isolation',
    'Bodyweight',
  ),
  ex(
    'ex_russian_twist',
    'Russian Twist',
    'Xoay bụng kiểu Nga',
    'abs',
    'isolation',
    'Bodyweight/Plate',
  ),
  ex(
    'ex_farmer_carry',
    'Farmer Carry',
    'Đi bộ xách tạ',
    'forearms',
    'compound',
    'Dumbbell/Kettlebell',
  ),
  ex('ex_wrist_curl', 'Wrist Curl', 'Cuốn cổ tay', 'forearms', 'isolation', 'Dumbbell/Barbell'),
  ex('ex_treadmill_run', 'Treadmill Run', 'Chạy bộ máy', 'full_body', 'cardio', 'Treadmill'),
  ex('ex_stationary_bike', 'Stationary Bike', 'Đạp xe tại chỗ', 'quads', 'cardio', 'Bike'),
  ex('ex_rowing_machine', 'Rowing Machine', 'Máy chèo thuyền', 'back', 'cardio', 'Rowing Machine'),
  ex('ex_burpee', 'Burpee', 'Burpee', 'full_body', 'cardio', 'Bodyweight'),
  ex(
    'ex_kettlebell_swing',
    'Kettlebell Swing',
    'Vung tạ chuông',
    'full_body',
    'compound',
    'Kettlebell',
  ),
  ex('ex_goblet_squat', 'Goblet Squat', 'Squat ôm tạ', 'quads', 'compound', 'Kettlebell/Dumbbell'),
  ex(
    'ex_split_squat',
    'Bulgarian Split Squat',
    'Split squat Bulgaria',
    'quads',
    'compound',
    'Dumbbell',
  ),
  ex(
    'ex_machine_chest_press',
    'Machine Chest Press',
    'Đẩy ngực máy',
    'chest',
    'compound',
    'Machine',
  ),
  ex(
    'ex_machine_shoulder_press',
    'Machine Shoulder Press',
    'Đẩy vai máy',
    'shoulders',
    'compound',
    'Machine',
  ),
  ex('ex_assisted_pull_up', 'Assisted Pull-up', 'Kéo xà hỗ trợ', 'back', 'compound', 'Machine'),
  ex('ex_cable_woodchop', 'Cable Woodchop', 'Xoay bụng cáp', 'abs', 'isolation', 'Cable'),
];

export const SEED_TRAINING_PLANS: readonly SeedTrainingPlan[] = [
  {
    id: 'plan_full_body_3x',
    name: 'Full Body 3 buổi',
    type: 'full_body',
    frequency: 3,
    description: 'Phù hợp người mới: tập toàn thân 3 ngày/tuần, ưu tiên kỹ thuật và phục hồi.',
    days: [
      day(1, 'Full Body A', [
        pe('ex_back_squat', 3, 8, 10, 120, 'Giữ form ổn định trước khi tăng tạ.'),
        pe('ex_barbell_bench_press', 3, 8, 10, 120, 'Tăng 2,5kg khi đạt đủ reps.'),
        pe('ex_seated_cable_row', 3, 10, 12, 90, 'Kéo khuỷu về sau, không giật người.'),
        pe('ex_plank', 3, 30, 45, 60, 'Ghi reps là số giây giữ plank.'),
      ]),
      rest(2),
      day(3, 'Full Body B', [
        pe('ex_romanian_deadlift', 3, 8, 10, 120, 'Cảm nhận đùi sau, lưng trung lập.'),
        pe('ex_overhead_press', 3, 6, 8, 120, 'Không ưỡn lưng quá mức.'),
        pe('ex_lat_pulldown', 3, 10, 12, 90, 'Kéo xuống trước ngực.'),
        pe('ex_lunge', 2, 10, 12, 90, 'Mỗi bên tính là một set.'),
      ]),
      rest(4),
      day(5, 'Full Body C', [
        pe('ex_leg_press', 3, 10, 12, 120, 'Biên độ kiểm soát.'),
        pe('ex_incline_dumbbell_press', 3, 8, 12, 90, 'Tạ đơn cho biên độ tự nhiên.'),
        pe('ex_barbell_row', 3, 8, 10, 120, 'Giữ core chặt.'),
        pe('ex_hanging_leg_raise', 3, 8, 12, 60, 'Có thể thay bằng crunch nếu quá khó.'),
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
        pe('ex_barbell_bench_press', 4, 6, 8, 150, 'Compound chính.'),
        pe('ex_barbell_row', 4, 8, 10, 120, 'Kéo cùng khối lượng với đẩy.'),
        pe('ex_dumbbell_shoulder_press', 3, 8, 10, 90, 'Không khóa khuỷu quá mạnh.'),
        pe('ex_triceps_pushdown', 3, 10, 15, 60, 'Kiểm soát eccentric.'),
        pe('ex_barbell_curl', 3, 10, 12, 60, 'Không đung đưa người.'),
      ]),
      day(2, 'Lower A', [
        pe('ex_back_squat', 4, 6, 8, 150, 'Top priority của buổi.'),
        pe('ex_romanian_deadlift', 3, 8, 10, 120, 'Hinge chậm.'),
        pe('ex_leg_extension', 3, 12, 15, 60, 'Siết đùi trước.'),
        pe('ex_standing_calf_raise', 4, 10, 15, 60, 'Dừng 1 giây ở đỉnh.'),
      ]),
      rest(3),
      day(4, 'Upper B', [
        pe('ex_overhead_press', 4, 6, 8, 150, 'Compound chính vai.'),
        pe('ex_pull_up', 4, 6, 10, 120, 'Dùng assisted nếu cần.'),
        pe('ex_incline_dumbbell_press', 3, 8, 12, 90, 'Upper chest.'),
        pe('ex_face_pull', 3, 12, 15, 60, 'Bảo vệ vai sau.'),
        pe('ex_hammer_curl', 3, 10, 12, 60, 'Brachialis/forearm.'),
      ]),
      day(5, 'Lower B', [
        pe('ex_deadlift', 3, 4, 6, 180, 'Tập nặng nhưng không max-out mỗi tuần.'),
        pe('ex_leg_press', 4, 10, 12, 120, 'Volume chính cho đùi.'),
        pe('ex_leg_curl', 3, 10, 15, 60, 'Đùi sau isolation.'),
        pe('ex_hip_thrust', 3, 8, 12, 90, 'Mông/hip extension.'),
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
        pe('ex_barbell_bench_press', 4, 6, 8, 150, 'Đẩy ngang nặng.'),
        pe('ex_overhead_press', 3, 6, 8, 120, 'Đẩy vai.'),
        pe('ex_incline_dumbbell_press', 3, 8, 12, 90, 'Ngực trên.'),
        pe('ex_lateral_raise', 4, 12, 15, 60, 'Vai giữa.'),
        pe('ex_triceps_pushdown', 3, 10, 15, 60, 'Tay sau.'),
      ]),
      day(2, 'Pull A', [
        pe('ex_deadlift', 3, 4, 6, 180, 'Không tập tới failure.'),
        pe('ex_pull_up', 4, 6, 10, 120, 'Vertical pull.'),
        pe('ex_barbell_row', 4, 8, 10, 120, 'Horizontal pull.'),
        pe('ex_face_pull', 3, 12, 15, 60, 'Vai sau.'),
        pe('ex_barbell_curl', 3, 10, 12, 60, 'Biceps.'),
      ]),
      day(3, 'Legs A', [
        pe('ex_back_squat', 4, 6, 8, 150, 'Quad dominant.'),
        pe('ex_romanian_deadlift', 3, 8, 10, 120, 'Hamstrings.'),
        pe('ex_leg_press', 3, 10, 12, 120, 'Volume thêm.'),
        pe('ex_standing_calf_raise', 4, 10, 15, 60, 'Calves.'),
      ]),
      day(4, 'Push B', [
        pe('ex_incline_dumbbell_press', 4, 8, 10, 120, 'Ngực trên.'),
        pe('ex_dumbbell_shoulder_press', 3, 8, 10, 90, 'Vai trước.'),
        pe('ex_chest_fly', 3, 12, 15, 60, 'Stretch ngực.'),
        pe('ex_rear_delt_fly', 3, 12, 15, 60, 'Cân bằng vai.'),
        pe('ex_skull_crusher', 3, 10, 12, 60, 'Tay sau.'),
      ]),
      day(5, 'Pull B', [
        pe('ex_lat_pulldown', 4, 8, 12, 90, 'Lats.'),
        pe('ex_seated_cable_row', 4, 8, 12, 90, 'Mid-back.'),
        pe('ex_assisted_pull_up', 3, 8, 10, 90, 'Volume bổ sung.'),
        pe('ex_hammer_curl', 3, 10, 12, 60, 'Biceps/forearm.'),
        pe('ex_farmer_carry', 3, 30, 45, 90, 'Ghi reps là số giây carry.'),
      ]),
      day(6, 'Legs B', [
        pe('ex_front_squat', 4, 6, 8, 150, 'Quad focus.'),
        pe('ex_leg_curl', 4, 10, 15, 60, 'Hamstring isolation.'),
        pe('ex_hip_thrust', 4, 8, 12, 90, 'Glutes.'),
        pe('ex_split_squat', 3, 8, 12, 90, 'Mỗi bên.'),
        pe('ex_seated_calf_raise', 4, 12, 15, 60, 'Calves.'),
      ]),
      rest(0),
    ],
  },
];

function ex(
  id: string,
  name: string,
  nameVi: string,
  muscleGroup: MuscleGroup,
  category: ExerciseCategory,
  equipment: string,
): SeedExercise {
  return {
    id,
    name,
    name_vi: nameVi,
    muscle_group: muscleGroup,
    category,
    equipment,
    instructions: 'Khởi động kỹ, kiểm soát biên độ và dừng set khi form xuống cấp.',
  };
}

function day(dayOfWeek: number, name: string, exercises: SeedPlannedExercise[]): SeedTrainingDay {
  return { dayOfWeek, name, isRestDay: false, exercises };
}

function rest(dayOfWeek: number): SeedTrainingDay {
  return { dayOfWeek, name: 'Ngày nghỉ', isRestDay: true, exercises: [] };
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
