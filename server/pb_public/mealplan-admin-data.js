export const tables = {
  user_profile: ['Hồ sơ', '_title', 'height_cm', 'weight_kg', 'goal', 'target_calories'],
  weight_log: ['Cân nặng', '_date', 'weight_kg', 'notes'],
  ingredient: ['Nguyên liệu', 'name', 'category', 'calories', 'protein'],
  dish: ['Món ăn', 'name', 'type', 'servings'],
  dish_ingredient: ['Thành phần món', '_title', '_ingredient', 'gram_weight'],
  day_plan: ['Lịch ăn', '_date', 'target_calories', 'target_protein'],
  meal_slot: ['Bữa ăn', '_date', 'meal_type', 'position'],
  planned_dish: ['Món trong lịch', '_date', '_title', '_meal', 'servings', 'is_completed'],
  exercise: ['Bài tập', '_title', 'muscle_group', 'category', 'equipment'],
  training_plan: ['Giáo án', 'name', 'frequency', 'is_active'],
  training_plan_day: ['Ngày tập theo giáo án', 'name', 'day_of_week', 'is_rest_day'],
  planned_exercise: ['Bài trong giáo án', '_title', 'sets', 'reps_min', 'reps_max', 'rest_seconds'],
  workout_session: ['Buổi tập', '_date', '_title', 'total_volume', 'status'],
  workout_exercise: ['Bài trong buổi tập', '_date', '_title', 'total_volume'],
  workout_set: ['Hiệp tập', '_date', '_title', 'set_number', 'weight_kg', 'reps', 'duration_seconds', 'status'],
  streak_log: ['Chuỗi theo dõi', '_date', 'nutrition_hit', 'workout_hit'],
  seed_artifact: ['Dữ liệu khởi tạo', 'artifact_id', 'artifact_type', 'seed_version'],
};

const labels = {
  _date: 'Ngày', _title: 'Tên', _ingredient: 'Nguyên liệu', _meal: 'Bữa ăn',
  id: 'Mã bản ghi', date: 'Ngày', name: 'Tên', notes: 'Ghi chú', status: 'Trạng thái',
  name_vi: 'Tên tiếng Việt', height_cm: 'Chiều cao (cm)', weight_kg: 'Tạ (kg)',
  goal: 'Mục tiêu', target_calories: 'Năng lượng mục tiêu (kcal)',
  target_protein: 'Protein mục tiêu (g)', calories: 'Năng lượng (kcal)',
  protein: 'Protein (g)', carbs: 'Carbs (g)', fat: 'Fat (g)', fiber: 'Fiber (g)',
  category: 'Nhóm', type: 'Loại', servings: 'Khẩu phần', gram_weight: 'Khối lượng (g)',
  meal_type: 'Bữa ăn', position: 'Vị trí', is_completed: 'Đã ăn',
  muscle_group: 'Nhóm cơ', equipment: 'Dụng cụ', frequency: 'Buổi mỗi tuần',
  is_active: 'Đang dùng', day_of_week: 'Ngày trong tuần', is_rest_day: 'Ngày nghỉ',
  sets: 'Số hiệp', reps_min: 'Số lần tối thiểu', reps_max: 'Số lần tối đa',
  rest_seconds: 'Nghỉ (giây)', set_number: 'Hiệp', reps: 'Số lần',
  total_volume: 'Tổng khối lượng (kg)', mode: 'Chế độ', artifact_id: 'Mã dữ liệu',
  artifact_type: 'Loại dữ liệu', seed_version: 'Phiên bản', nutrition_hit: 'Đạt mục tiêu ăn',
  workout_hit: 'Đạt mục tiêu tập', duration_seconds: 'Thời gian (giây)',
  started_at: 'Bắt đầu', completed_at: 'Hoàn thành', created_at: 'Thời điểm tạo',
  updated_at: 'Lần sửa gần nhất', cancelled_at: 'Thời điểm hủy', duration_minutes: 'Thời gian (phút)',
  legacy_unit_unknown: 'Chưa rõ đơn vị giá trị cũ',
};
const statuses = {
  completed: 'Hoàn thành', logged: 'Đã ghi', skipped: 'Bỏ qua', pending: 'Chưa tập',
  in_progress: 'Đang tập', cancelled: 'Đã hủy',
};

const mealTypes = { breakfast: 'Bữa sáng', lunch: 'Bữa trưa', dinner: 'Bữa tối', snack: 'Bữa phụ' };
const booleanColumns = new Set([
  'is_completed', 'is_active', 'is_rest_day', 'nutrition_hit', 'workout_hit', 'legacy_unit_unknown',
]);

const datePattern = /^\d{4}-\d{2}-\d{2}/;
const localNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 });
export const viCollator = new Intl.Collator('vi', { numeric: true });

export function tableLabel(table) {
  return tables[table]?.[0] ?? table;
}

export function columnLabel(table, key, hasLegacySet = false) {
  if (key === 'weight_kg' && table !== 'workout_set') return 'Cân nặng (kg)';
  if (key === 'reps' && table === 'workout_set' && hasLegacySet) return 'Số lần / giá trị cũ';
  return labels[key] ?? key;
}

export function rowKey(table, row) {
  return table === 'seed_artifact' ? row.artifact_id : row.id;
}

export function searchText(value) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
}

export function makeRowViews(snapshot) {
  const source = snapshot.tables;
  const indexed = Object.fromEntries(Object.entries(source).map(([table, rows]) => [
    table, new Map(rows.map((row) => [rowKey(table, row), row])),
  ]));
  const lookup = (table, id) => indexed[table]?.get(id);

  return (table, row) => {
    const workoutExercise = table === 'workout_exercise' ? row : lookup('workout_exercise', row.workout_exercise_id);
    const session = table === 'workout_session' ? row : lookup('workout_session', workoutExercise?.workout_session_id);
    const meal = table === 'meal_slot' ? row : lookup('meal_slot', row.meal_slot_id);
    const day = table === 'day_plan' ? row : lookup('day_plan', meal?.day_plan_id);
    const dish = lookup('dish', row.dish_id);
    const exercise = table === 'exercise' ? row : lookup('exercise', workoutExercise?.exercise_id ?? row.exercise_id);
    const title = exercise?.name_vi || exercise?.name || dish?.name || row.name
      || (table === 'workout_session' && (row.training_day_name || 'Tập tự do'))
      || (table === 'user_profile' && 'Hồ sơ cá nhân') || '';

    return {
      ...row,
      _title: title,
      _date: session?.date ?? day?.date ?? row.date,
      _meal: meal?.meal_type,
      _ingredient: lookup('ingredient', row.ingredient_id)?.name,
      parent: workoutExercise?.workout_session_id ?? meal?.day_plan_id,
    };
  };
}

export function displayValue(key, row) {
  const value = row[key];
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'status') return statuses[value] ?? String(value);
  if (key === 'meal_type' || key === '_meal') return mealTypes[value] ?? String(value);
  if (key === 'mode') return value === 'free' ? 'Tập tự do' : value === 'planned' ? 'Theo giáo án' : String(value);
  if (booleanColumns.has(key)) return value ? 'Có' : 'Không';
  if (typeof value === 'number') {
    const number = localNumber.format(value);
    return key === 'reps' && row.legacy_unit_unknown ? number + ' (chưa rõ đơn vị)' : number;
  }
  if (datePattern.test(value) && (key === '_date' || key === 'date')) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return [day, month, year].join('/');
  }
  return String(value);
}

export function editableFields(table, row) {
  if (table === 'planned_dish' && !row.is_completed) return [['servings', 0.1, 'any', 20]];
  if (table !== 'workout_set' || row.status === 'skipped' || row.legacy_unit_unknown) return [];
  if (row.duration_seconds != null) return [['duration_seconds', 0, 1]];
  return [['weight_kg', 0, 'any'], ['reps', 0, 1]];
}
