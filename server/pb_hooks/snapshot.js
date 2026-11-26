const schema = require("./sync-schema.json");
const schemaVersion = 12;

function invalid(message) {
  throw new Error(message);
}

function rowsWithKeys(input) {
  if (!input || input.schemaVersion !== schemaVersion || !input.tables) {
    invalid("Unsupported data version.");
  }
  const tableNames = Object.keys(schema);
  if (Object.keys(input.tables).length !== tableNames.length) invalid("Invalid table set.");
  const tables = {};
  const byId = {};
  for (const table of tableNames) {
    const { key, cols, required } = schema[table];
    const rows = input.tables[table];
    if (!Array.isArray(rows) || rows.length > 16000) invalid("Invalid rows: " + table);
    const columns = Object.keys(cols);
    const index = new Map();
    const clean = rows.map((row) => {
      if (!row || Array.isArray(row) || typeof row !== "object" ||
          Object.keys(row).length !== columns.length) invalid("Invalid row: " + table);
      const copy = {};
      for (const column of columns) {
        const value = row[column];
        const type = cols[column];
        const valid = value === null
          ? !required.includes(column)
          : type === "TEXT"
            ? typeof value === "string" && value.length <= 32768
            : Number.isFinite(value) && (type !== "INTEGER" || Number.isSafeInteger(value));
        if (!valid) invalid("Invalid field: " + table + "." + column);
        copy[column] = value;
      }
      const id = copy[key];
      if (typeof id !== "string" || id.length === 0 || id.length > 128 || index.has(id)) {
        invalid("Invalid identity: " + table);
      }
      index.set(id, copy);
      return copy;
    });
    clean.sort((a, b) => a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0);
    byId[table] = index;
    tables[table] = clean;
  }
  if (tables.user_profile.length > 1) invalid("A workspace has one profile.");
  for (const table of tableNames) {
    for (const [column, parent, parentColumn] of schema[table].refs) {
      if (schema[parent].key !== parentColumn) invalid("Invalid schema relation.");
      for (const row of tables[table]) {
        if (row[column] !== null && !byId[parent].has(row[column])) {
          invalid("Missing parent: " + table + "." + column);
        }
      }
    }
  }
  return { schemaVersion, tables };
}

function normalize(input, legacyWorkoutTotals = false) {
  const snapshot = rowsWithKeys(input);
  const { tables } = snapshot;
  const exerciseVolumes = new Map();
  const sessionVolumes = new Map();
  const dayMeals = new Set();
  const dates = new Set();
  const loggedFields = ["calories", "protein", "carbs", "fat", "fiber", "completed_at"];

  for (const day of tables.day_plan) {
    if (dates.has(day.date)) invalid("Duplicate meal plan date.");
    dates.add(day.date);
  }
  for (const slot of tables.meal_slot) {
    const key = slot.day_plan_id + ":" + slot.meal_type;
    if (dayMeals.has(key)) invalid("Duplicate meal slot.");
    dayMeals.add(key);
  }
  for (const dish of tables.planned_dish) {
    if ((dish.is_completed !== 0 && dish.is_completed !== 1) ||
        dish.servings < 0.1 || dish.servings > 20 ||
        loggedFields.some((key) => (dish[key] !== null) !== (dish.is_completed === 1))) {
      invalid("Invalid meal snapshot.");
    }
  }
  for (const set of tables.workout_set) {
    if (set.weight_kg < 0 || set.reps < 0 || (set.status !== "logged" && set.status !== "skipped")) {
      invalid("Invalid workout set.");
    }
    if (set.status === "logged" &&
        (legacyWorkoutTotals || (set.duration_seconds === null && set.legacy_unit_unknown === 0))) {
      const id = set.workout_exercise_id;
      exerciseVolumes.set(id, (exerciseVolumes.get(id) || 0) + set.weight_kg * set.reps);
    }
  }
  for (const exercise of tables.workout_exercise) {
    exercise.total_volume = exerciseVolumes.get(exercise.id) || 0;
    const id = exercise.workout_session_id;
    sessionVolumes.set(id, (sessionVolumes.get(id) || 0) + exercise.total_volume);
  }
  for (const session of tables.workout_session) {
    session.total_volume = sessionVolumes.get(session.id) || 0;
  }
  return snapshot;
}

function sameRecord(table, left, right) {
  if (!left || !right) return left === right;
  return Object.keys(left).every((column) =>
    left[column] === right[column] ||
    (column === "total_volume" && (table === "workout_exercise" || table === "workout_session")));
}

function mergeSnapshots(base, incoming, current) {
  const tables = {};
  for (const [table, { key }] of Object.entries(schema)) {
    const index = (snapshot) => new Map((snapshot?.tables[table] || []).map((row) => [row[key], row]));
    const before = index(base);
    const local = index(incoming);
    const remote = index(current);
    tables[table] = [];
    for (const id of new Set([...before.keys(), ...local.keys(), ...remote.keys()])) {
      const original = before.get(id);
      const own = local.get(id);
      const other = remote.get(id);
      const localChanged = !sameRecord(table, original, own);
      const remoteChanged = !sameRecord(table, original, other);
      if (localChanged && remoteChanged && !sameRecord(table, own, other)) {
        invalid("Overlapping record changes.");
      }
      const selected = localChanged ? own : other;
      if (selected) tables[table].push(selected);
    }
  }
  return normalize({ schemaVersion, tables });
}

module.exports = { mergeSnapshots, normalize, schemaVersion };
