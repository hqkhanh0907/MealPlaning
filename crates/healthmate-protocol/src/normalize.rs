use crate::coaching::extra_columns;
use crate::{Column, Result, SCHEMA_VERSION, canonical_number, invalid, rows, rows_mut, schema};
use serde_json::{Map, Value, json};
use std::collections::{HashMap, HashSet};

fn field(value: Option<&Value>, column: &Column) -> Option<Value> {
    let value = value?;
    if value.is_null() {
        return (!column.required).then_some(Value::Null);
    }
    if column.kind == "TEXT" {
        return value
            .as_str()
            .filter(|s| s.encode_utf16().count() <= 32768)
            .map(Value::from);
    }
    let n = value.as_f64()?;
    if !n.is_finite()
        || (column.kind == "INTEGER" && (n.fract() != 0. || n.abs() > 9_007_199_254_740_991.0))
    {
        return None;
    }
    Some(canonical_number(n))
}

fn normalize_rows(input: &Value) -> Result<Value> {
    let version = input["schemaVersion"].as_f64();
    if !matches!(version, Some(12.0 | 13.0)) || !crate::truthy(&input["tables"]) {
        return Err(invalid("Unsupported data version."));
    }
    let legacy = version == Some(12.0);
    let spec = schema();
    let source = input["tables"]
        .as_object()
        .ok_or_else(|| invalid("Invalid table set."))?;
    if source.len() != spec.len() - usize::from(legacy)
        || spec
            .iter()
            .filter(|t| !legacy || t.name != "workout_preference")
            .any(|t| !source.get(&t.name).is_some_and(Value::is_array))
    {
        return Err(invalid("Invalid table set."));
    }
    let mut tables = Map::new();
    let mut ids = HashMap::new();
    for table in spec {
        let name = table.name.as_str();
        let data = if legacy && name == "workout_preference" {
            &[][..]
        } else {
            rows(input, name)?
        };
        if data.len() > 16000 {
            return Err(invalid(format!("Invalid rows: {name}")));
        }
        let added = if legacy { extra_columns(name) } else { &[] };
        let mut seen = HashSet::with_capacity(data.len());
        let mut clean = Vec::with_capacity(data.len());
        for source in data {
            let row = source
                .as_object()
                .ok_or_else(|| invalid(format!("Invalid row: {name}")))?;
            if added.iter().any(|k| row.contains_key(*k)) {
                return Err(invalid(format!("Invalid legacy row: {name}")));
            }
            if row.len() + added.len() != table.columns.len() {
                return Err(invalid(format!("Invalid row: {name}")));
            }
            let mut copy = Map::with_capacity(table.columns.len());
            for column in &table.columns {
                let value = if added.contains(&column.name.as_str()) {
                    Some(&Value::Null)
                } else {
                    row.get(&column.name)
                };
                let valid = field(value, column)
                    .ok_or_else(|| invalid(format!("Invalid field: {name}.{}", column.name)))?;
                copy.insert(column.name.clone(), valid);
            }
            let id = copy[&table.key]
                .as_str()
                .filter(|s| !s.is_empty() && s.encode_utf16().count() <= 128);
            if !id.is_some_and(|s| seen.insert(s.to_owned())) {
                return Err(invalid(format!("Invalid identity: {name}")));
            }
            clean.push(Value::Object(copy));
        }
        clean.sort_unstable_by(|a, b| {
            let left = a[&table.key].as_str().expect("validated identity");
            let right = b[&table.key].as_str().expect("validated identity");
            left.encode_utf16().cmp(right.encode_utf16())
        });
        ids.insert(name, seen);
        tables.insert(table.name.clone(), Value::Array(clean));
    }
    let result = json!({"schemaVersion":SCHEMA_VERSION,"tables":tables});
    if rows(&result, "user_profile")?.len() > 1 {
        return Err(invalid("A workspace has one profile."));
    }
    for table in spec {
        for (column, parent, parent_column) in &table.references {
            if !spec
                .iter()
                .any(|t| &t.name == parent && &t.key == parent_column)
            {
                return Err(invalid("Invalid schema relation."));
            }
            for row in rows(&result, &table.name)? {
                let value = &row[column];
                if !value.is_null()
                    && !value
                        .as_str()
                        .is_some_and(|key| ids[parent.as_str()].contains(key))
                {
                    return Err(invalid(format!("Missing parent: {}.{column}", table.name)));
                }
            }
        }
    }
    Ok(result)
}

fn validate_meals(snapshot: &Value) -> Result<()> {
    let mut dates = HashSet::new();
    for row in rows(snapshot, "day_plan")? {
        if !dates.insert(row["date"].as_str()) {
            return Err(invalid("Duplicate meal plan date."));
        }
    }
    let mut slots = HashSet::new();
    for row in rows(snapshot, "meal_slot")? {
        let day = row["day_plan_id"].as_str().expect("validated day");
        let meal = row["meal_type"].as_str().expect("validated meal");
        if !slots.insert(format!("{day}:{meal}")) {
            return Err(invalid("Duplicate meal slot."));
        }
    }
    for row in rows(snapshot, "planned_dish")? {
        let servings = row["servings"].as_f64().expect("validated servings");
        let done = row["is_completed"].as_i64();
        if !matches!(done, Some(0 | 1))
            || !(0.1..=20.0).contains(&servings)
            || [
                "calories",
                "protein",
                "carbs",
                "fat",
                "fiber",
                "completed_at",
            ]
            .iter()
            .any(|c| row[*c].is_null() == (done == Some(1)))
        {
            return Err(invalid("Invalid meal snapshot."));
        }
    }
    Ok(())
}

pub fn normalize(input: &Value, legacy_workout_totals: bool) -> Result<Value> {
    let mut snapshot = normalize_rows(input)?;
    for row in rows(&snapshot, "workout_preference")? {
        let key = row["key"].as_str().expect("validated key");
        if !matches!(key, "fitness_default_place" | "fitness_finder_schedule")
            && !key
                .strip_prefix("fitness_exercise_place:")
                .is_some_and(|s| !s.is_empty() && !s.contains(['\n', '\r', '\u{2028}', '\u{2029}']))
        {
            return Err(invalid("Invalid workout preference key."));
        }
    }
    validate_meals(&snapshot)?;
    let mut volumes: HashMap<String, f64> = HashMap::new();
    for row in rows(&snapshot, "workout_set")? {
        let kg = row["weight_kg"].as_f64().expect("validated weight");
        let reps = row["reps"].as_f64().expect("validated reps");
        let status = row["status"].as_str();
        if kg < 0. || reps < 0. || !matches!(status, Some("logged" | "skipped")) {
            return Err(invalid("Invalid workout set."));
        }
        if status == Some("logged")
            && (legacy_workout_totals
                || (row["duration_seconds"].is_null()
                    && row["legacy_unit_unknown"].as_i64() == Some(0)))
        {
            let parent = row["workout_exercise_id"]
                .as_str()
                .expect("validated exercise id");
            *volumes.entry(parent.to_owned()).or_default() += kg * reps;
        }
    }
    let mut sessions: HashMap<String, f64> = HashMap::new();
    for row in rows_mut(&mut snapshot, "workout_exercise")? {
        let volume = volumes
            .get(row["id"].as_str().expect("validated id"))
            .copied()
            .unwrap_or_default();
        row["total_volume"] = canonical_number(volume);
        let id = row["workout_session_id"]
            .as_str()
            .expect("validated session id");
        *sessions.entry(id.to_owned()).or_default() += volume;
    }
    for row in rows(&snapshot, "workout_exercise")? {
        if (!row["use_at_place"].is_null() && row["use_at_place"].as_i64() != Some(1))
            || row["next_weight_kg"]
                .as_f64()
                .is_some_and(|v| !(0.0..=500.0).contains(&v))
        {
            return Err(invalid("Invalid workout preference."));
        }
    }
    for row in rows_mut(&mut snapshot, "workout_session")? {
        if !row["origin"].is_null()
            && !matches!(
                row["origin"].as_str(),
                Some("free" | "composed" | "plan_day")
            )
        {
            return Err(invalid("Invalid workout origin."));
        }
        row["total_volume"] = canonical_number(
            sessions
                .get(row["id"].as_str().expect("validated id"))
                .copied()
                .unwrap_or_default(),
        );
    }
    Ok(snapshot)
}
