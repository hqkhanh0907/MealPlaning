use crate::{Result, SCHEMA_VERSION, invalid, normalize, object, rows, rows_mut, same_value};
use serde_json::{Map, Value, json};
use std::collections::{HashMap, HashSet};

const COACHING_TABLES: [&str; 2] = ["workout_session", "workout_exercise"];

pub(crate) fn extra_columns(table: &str) -> &'static [&'static str] {
    match table {
        "workout_session" => &["origin", "place_id", "source_session_id"],
        "workout_exercise" => &[
            "original_exercise_id",
            "use_at_place",
            "next_weight_kg",
            "planned_notes",
            "completion_note",
        ],
        _ => &[],
    }
}

pub fn workout_wire_version(snapshot: &Value, version: i64) -> Result<Value> {
    if version == SCHEMA_VERSION {
        return Ok(snapshot.clone());
    }
    if version != 12 {
        return Err(invalid("Unsupported data version."));
    }
    let mut tables = snapshot["tables"]
        .as_object()
        .cloned()
        .ok_or_else(|| invalid("Invalid table set."))?;
    tables.shift_remove("workout_preference");
    for table in COACHING_TABLES {
        let rows = tables
            .get_mut(table)
            .and_then(Value::as_array_mut)
            .ok_or_else(|| invalid(format!("Invalid rows: {table}")))?;
        for row in rows {
            let record = row
                .as_object_mut()
                .ok_or_else(|| invalid(format!("Invalid row: {table}")))?;
            for key in extra_columns(table) {
                record.shift_remove(*key);
            }
        }
    }
    Ok(json!({"schemaVersion":version,"tables":tables}))
}

fn by_id(rows: &[Value]) -> Result<HashMap<&str, &Value>> {
    rows.iter()
        .map(|r| {
            Ok((
                r["id"]
                    .as_str()
                    .ok_or_else(|| invalid("Invalid identity."))?,
                r,
            ))
        })
        .collect()
}

pub fn preserve_workout_coaching(target: &mut Value, base: &Value) -> Result<()> {
    if base.is_null() {
        return Ok(());
    }
    let preferences = rows(base, "workout_preference")?.to_vec();
    *rows_mut(target, "workout_preference")? = preferences;
    let exercise_ids: HashSet<String> = rows(target, "exercise")?
        .iter()
        .filter_map(|r| r["id"].as_str().map(str::to_owned))
        .collect();
    let mut old = by_id(rows(base, "workout_set")?)?;
    let mut changed = HashSet::new();
    let keys = [
        "workout_exercise_id",
        "weight_kg",
        "reps",
        "duration_seconds",
        "legacy_unit_unknown",
        "status",
        "effort",
        "set_number",
    ];
    for set in rows(target, "workout_set")? {
        let id = set["id"]
            .as_str()
            .ok_or_else(|| invalid("Invalid identity: workout_set"))?;
        let previous = old.remove(id);
        if previous.is_none_or(|p| keys.iter().any(|key| !same_value(&set[*key], &p[*key]))) {
            if let Some(id) = set["workout_exercise_id"].as_str() {
                changed.insert(id.to_owned());
            }
            if let Some(id) = previous.and_then(|p| p["workout_exercise_id"].as_str()) {
                changed.insert(id.to_owned());
            }
        }
    }
    changed.extend(
        old.values()
            .filter_map(|r| r["workout_exercise_id"].as_str().map(str::to_owned)),
    );
    for table in COACHING_TABLES {
        let previous = by_id(rows(base, table)?)?;
        for row in rows_mut(target, table)? {
            let id = row["id"]
                .as_str()
                .ok_or_else(|| invalid(format!("Invalid identity: {table}")))?;
            let Some(old) = previous.get(id) else {
                continue;
            };
            if table == "workout_exercise" && row["exercise_id"] != old["exercise_id"] {
                continue;
            }
            let clear_load = changed.contains(id);
            for key in extra_columns(table) {
                row[*key] = old[*key].clone();
            }
            if table == "workout_exercise" {
                if clear_load {
                    row["next_weight_kg"] = Value::Null;
                }
                if !row["original_exercise_id"].is_null()
                    && !row["original_exercise_id"]
                        .as_str()
                        .is_some_and(|id| exercise_ids.contains(id))
                {
                    row["original_exercise_id"] = Value::Null;
                    row["use_at_place"] = Value::Null;
                }
            }
        }
    }
    Ok(())
}

pub fn stored_workout_envelope(snapshot: &Value) -> Result<Value> {
    let mut wire = workout_wire_version(snapshot, 12)?;
    let mut extension = Map::new();
    extension.insert(
        "workout_preference".into(),
        Value::Array(rows(snapshot, "workout_preference")?.to_vec()),
    );
    for table in COACHING_TABLES {
        let mut extra = Vec::new();
        for row in rows(snapshot, table)? {
            let row = object(row)?;
            let mut fields = Map::new();
            fields.insert(
                "id".into(),
                row.get("id")
                    .cloned()
                    .ok_or_else(|| invalid("Invalid identity."))?,
            );
            for key in extra_columns(table) {
                if let Some(value) = row.get(*key).filter(|v| !v.is_null()) {
                    fields.insert((*key).into(), value.clone());
                }
            }
            if fields.len() > 1 {
                extra.push(Value::Object(fields));
            }
        }
        extension.insert(table.into(), Value::Array(extra));
    }
    wire["workoutCoaching13"] = Value::Object(extension);
    Ok(wire)
}

pub fn restore_stored_workout(data: &Value) -> Result<Value> {
    let mut snapshot = normalize(data, false)?;
    let ext = &data["workoutCoaching13"];
    if data["schemaVersion"].as_f64() != Some(12.) || !crate::truthy(ext) {
        return Ok(snapshot);
    }
    for table in COACHING_TABLES {
        let source = ext[table]
            .as_array()
            .ok_or_else(|| invalid(format!("Invalid rows: {table}")))?;
        if source.iter().any(Value::is_null) {
            return Err(invalid(format!("Invalid row: {table}")));
        }
        let by_id: HashMap<_, _> = source
            .iter()
            .filter_map(|r| r["id"].as_str().map(|id| (id, r)))
            .collect();
        for row in rows_mut(&mut snapshot, table)? {
            if let Some(source) = row["id"].as_str().and_then(|id| by_id.get(id)) {
                for key in extra_columns(table) {
                    row[*key] = source[*key].clone();
                }
            }
        }
    }
    snapshot["tables"]["workout_preference"] = ext["workout_preference"].clone();
    normalize(&snapshot, false)
}
