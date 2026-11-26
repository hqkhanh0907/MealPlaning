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

const workoutTables = ["workout_session", "workout_exercise", "workout_set"];
const setMeasurements = ["weight_kg", "reps", "duration_seconds"];

function sameRecord(table, left, right) {
  if (!left || !right) return left === right;
  return Object.keys(left).every((column) =>
    left[column] === right[column] ||
    (column === "total_volume" && (table === "workout_exercise" || table === "workout_session")) ||
    (column === "updated_at" && table === "workout_set"));
}

function indexSnapshot(snapshot) {
  return Object.fromEntries(Object.entries(schema).map(([table, { key }]) => [
    table, new Map((snapshot?.tables[table] || []).map((row) => [row[key], row])),
  ]));
}

function workoutSession(index, table, row) {
  if (!row) return null;
  if (table === "workout_session") return row.id;
  if (table === "workout_exercise") return row.workout_session_id;
  return index.workout_exercise.get(row.workout_exercise_id)?.workout_session_id ?? null;
}

function groupWorkouts(index) {
  const groups = new Map();
  for (const session of index.workout_session.values()) {
    groups.set(session.id, { workout_session: [session], workout_exercise: [], workout_set: [] });
  }
  for (const table of ["workout_exercise", "workout_set"]) {
    for (const row of index[table].values()) {
      groups.get(workoutSession(index, table, row))?.[table].push(row);
    }
  }
  return groups;
}

function sameWorkout(left, right) {
  return workoutTables.every((table) =>
    left[table].length === right[table].length &&
    left[table].every((row, index) =>
      row.id === right[table][index].id && sameRecord(table, row, right[table][index])));
}

function resolveWorkoutDeletions(before, local, remote, choose) {
  const original = groupWorkouts(before);
  const own = groupWorkouts(local);
  const other = groupWorkouts(remote);
  const sides = new Map();
  for (const [id, group] of original) {
    const left = own.get(id);
    const right = other.get(id);
    if ((!left && !right) || (left && right) || sameWorkout(group, left ?? right)) continue;
    const ownSession = left?.workout_session[0];
    const otherSession = right?.workout_session[0];
    sides.set(id, choose({
      key: JSON.stringify(["workout_session", id]),
      kind: "workout_session_delete",
      sessionId: id,
      sessionDate: group.workout_session[0].date,
      local: ownSession?.total_volume ?? null,
      server: otherSession?.total_volume ?? null,
    }));
  }
  return sides;
}

function mergeSet(original, own, other, local, choose) {
  if (!original || !own || !other ||
      own.workout_exercise_id !== other.workout_exercise_id ||
      own.status !== other.status || own.legacy_unit_unknown !== other.legacy_unit_unknown ||
      (own.duration_seconds === null) !== (other.duration_seconds === null)) {
    invalid("Overlapping record changes.");
  }
  const merged = { ...other };
  const exercise = local.workout_exercise.get(own.workout_exercise_id);
  const session = local.workout_session.get(exercise?.workout_session_id);
  const definition = local.exercise.get(exercise?.exercise_id);
  for (const column of Object.keys(merged)) {
    if (column === "updated_at") {
      merged[column] = (own[column] ?? "") >= (other[column] ?? "") ? own[column] : other[column];
    } else if (own[column] !== original[column]) {
      if (other[column] !== original[column] && other[column] !== own[column]) {
        if (!setMeasurements.includes(column) || own.status !== "logged" || own.legacy_unit_unknown !== 0) {
          invalid("Overlapping record changes.");
        }
        const side = choose({
          key: JSON.stringify(["workout_set", own.id, column]),
          kind: "workout_set_field",
          sessionId: session?.id ?? "",
          sessionDate: session?.date ?? "",
          exerciseName: definition?.name_vi || definition?.name || "",
          setNumber: own.set_number,
          field: column,
          local: own[column],
          server: other[column],
        });
        if (side === "local") merged[column] = own[column];
      } else {
        merged[column] = own[column];
      }
    }
  }
  return merged;
}

function mergeSnapshots(base, incoming, current, choices) {
  const before = indexSnapshot(base);
  const local = indexSnapshot(incoming);
  const remote = indexSnapshot(current);
  const items = [];
  let missingChoice = false;
  function choose(item) {
    items.push(item);
    const side = choices?.[item.key];
    if (side) return side;
    missingChoice = true;
    return "server";
  }
  const workoutChoices = resolveWorkoutDeletions(before, local, remote, choose);
  const tables = {};
  for (const table of Object.keys(schema)) {
    tables[table] = [];
    const originalRows = before[table];
    const localRows = local[table];
    const remoteRows = remote[table];
    for (const id of new Set([...originalRows.keys(), ...localRows.keys(), ...remoteRows.keys()])) {
      const original = originalRows.get(id);
      const own = localRows.get(id);
      const other = remoteRows.get(id);
      if (workoutChoices.size > 0 && workoutTables.includes(table)) {
        const session = workoutSession(before, table, original) ??
          workoutSession(local, table, own) ?? workoutSession(remote, table, other);
        const choice = workoutChoices.get(session);
        if (choice) {
          const row = choice === "local" ? own : other;
          if (row) tables[table].push(row);
          continue;
        }
      }
      const localChanged = !sameRecord(table, original, own);
      const remoteChanged = !sameRecord(table, original, other);
      if (localChanged && remoteChanged && !sameRecord(table, own, other)) {
        if (table !== "workout_set") invalid("Overlapping record changes.");
        tables[table].push(mergeSet(original, own, other, local, choose));
      } else {
        const selected = localChanged ? own : other;
        if (selected) tables[table].push(selected);
      }
    }
  }
  if (missingChoice) return { items };
  if (choices && Object.keys(choices).length !== items.length) invalid("Unexpected conflict choice.");
  return { snapshot: normalize({ schemaVersion, tables }) };
}

module.exports = { mergeSnapshots, normalize, schemaVersion };
