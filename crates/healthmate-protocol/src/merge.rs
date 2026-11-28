use crate::{Result, SCHEMA_VERSION, invalid, js_stringify, normalize, same_value, schema, truthy};
use indexmap::{IndexMap, IndexSet};
use serde_json::{Map, Value, json};
use std::collections::HashMap;

const SESSION: &str = "workout_session";
const EXERCISE: &str = "workout_exercise";
const SET: &str = "workout_set";

type RowMap<'a> = IndexMap<&'a str, &'a Value>;
type SnapshotIndex<'a> = HashMap<&'static str, RowMap<'a>>;

fn index_snapshot(snapshot: Option<&Value>) -> Result<SnapshotIndex<'_>> {
    let mut indexed = HashMap::new();
    for table in schema() {
        let mut rows = IndexMap::new();
        if let Some(source) = snapshot.filter(|s| !s.is_null()) {
            let tables = source["tables"]
                .as_object()
                .ok_or_else(|| invalid("Invalid table set."))?;
            if let Some(records) = tables.get(&table.name).filter(|v| truthy(v)) {
                for row in records
                    .as_array()
                    .ok_or_else(|| invalid(format!("Invalid rows: {}", table.name)))?
                {
                    let id = row[&table.key]
                        .as_str()
                        .ok_or_else(|| invalid(format!("Invalid identity: {}", table.name)))?;
                    rows.insert(id, row);
                }
            }
        }
        indexed.insert(table.name.as_str(), rows);
    }
    Ok(indexed)
}

fn same_record(table: &str, left: Option<&Value>, right: Option<&Value>) -> bool {
    let (Some(a), Some(b)) = (left, right) else {
        return left.is_none() && right.is_none();
    };
    a.as_object().is_some_and(|a| {
        a.iter().all(|(key, v)| {
            (key == "total_volume" && matches!(table, EXERCISE | SESSION))
                || (key == "updated_at" && table == SET)
                || b.get(key).is_some_and(|b| same_value(v, b))
        })
    })
}

fn session_id<'a>(
    index: &SnapshotIndex<'a>,
    table: &str,
    row: Option<&'a Value>,
) -> Option<&'a str> {
    let row = row?;
    match table {
        SESSION => row["id"].as_str(),
        EXERCISE => row["workout_session_id"].as_str(),
        SET => index[EXERCISE].get(row["workout_exercise_id"].as_str()?)?["workout_session_id"]
            .as_str(),
        _ => None,
    }
}

struct Workout<'a> {
    session: &'a Value,
    exercises: Vec<&'a Value>,
    sets: Vec<&'a Value>,
}

impl Workout<'_> {
    fn same(&self, other: &Self) -> bool {
        let same_rows = |table: &str, a: &[&Value], b: &[&Value]| {
            a.len() == b.len()
                && a.iter()
                    .zip(b)
                    .all(|(a, b)| a["id"] == b["id"] && same_record(table, Some(a), Some(b)))
        };
        same_record(SESSION, Some(self.session), Some(other.session))
            && same_rows(EXERCISE, &self.exercises, &other.exercises)
            && same_rows(SET, &self.sets, &other.sets)
    }
}

fn group<'a>(index: &SnapshotIndex<'a>) -> IndexMap<&'a str, Workout<'a>> {
    let mut groups: IndexMap<_, _> = index[SESSION]
        .iter()
        .map(|(&id, &session)| {
            (
                id,
                Workout {
                    session,
                    exercises: vec![],
                    sets: vec![],
                },
            )
        })
        .collect();
    for table in [EXERCISE, SET] {
        for &row in index[table].values() {
            if let Some(workout) =
                session_id(index, table, Some(row)).and_then(|s| groups.get_mut(s))
            {
                if table == EXERCISE {
                    workout.exercises.push(row);
                } else {
                    workout.sets.push(row);
                }
            }
        }
    }
    groups
}

#[derive(Copy, Clone, PartialEq)]
enum Side {
    Local,
    Server,
}

struct Decisions<'a> {
    choices: Option<&'a Value>,
    items: Vec<Value>,
    missing: bool,
}
impl Decisions<'_> {
    fn choose(&mut self, item: Value) -> Side {
        let choice = self
            .choices
            .and_then(|v| v.get(item["key"].as_str()?))
            .filter(|v| truthy(v));
        self.items.push(item);
        if choice.is_none() {
            self.missing = true;
        }
        if choice.and_then(Value::as_str) == Some("local") {
            Side::Local
        } else {
            Side::Server
        }
    }
}

fn deletion_choices<'a>(
    base: &SnapshotIndex<'a>,
    local: &SnapshotIndex,
    remote: &SnapshotIndex,
    decisions: &mut Decisions,
) -> HashMap<&'a str, Side> {
    let original = group(base);
    let local = group(local);
    let remote = group(remote);
    let mut choices = HashMap::new();
    for (id, before) in original {
        let left = local.get(id);
        let right = remote.get(id);
        let changed = match (left, right) {
            (Some(one), None) | (None, Some(one)) => !before.same(one),
            _ => false,
        };
        if changed {
            let side=decisions.choose(json!({"key":js_stringify(&json!([SESSION,id])),"kind":"workout_session_delete",
                "sessionId":id,"sessionDate":before.session["date"],
                "local":left.map(|g|&g.session["total_volume"]),"server":right.map(|g|&g.session["total_volume"])}));
            choices.insert(id, side);
        }
    }
    choices
}

fn merge_set(
    base: Option<&Value>,
    local_row: Option<&Value>,
    remote_row: Option<&Value>,
    local: &SnapshotIndex,
    decisions: &mut Decisions,
) -> Result<Value> {
    let (Some(base), Some(own), Some(other)) = (base, local_row, remote_row) else {
        return Err(invalid("Overlapping record changes."));
    };
    if ["workout_exercise_id", "status", "legacy_unit_unknown"]
        .iter()
        .any(|k| !same_value(&own[*k], &other[*k]))
        || own["duration_seconds"].is_null() != other["duration_seconds"].is_null()
    {
        return Err(invalid("Overlapping record changes."));
    }
    let parent = own["workout_exercise_id"]
        .as_str()
        .and_then(|id| local[EXERCISE].get(id))
        .copied();
    let session = parent
        .and_then(|p| p["workout_session_id"].as_str())
        .and_then(|id| local[SESSION].get(id))
        .copied();
    let exercise = parent
        .and_then(|p| p["exercise_id"].as_str())
        .and_then(|id| local["exercise"].get(id))
        .copied();
    let mut merged = other.clone();
    for (column, server) in crate::object(other)? {
        let candidate = &own[column];
        let previous = &base[column];
        if column == "updated_at" {
            let a = candidate.as_str().unwrap_or_default().encode_utf16();
            let b = server.as_str().unwrap_or_default().encode_utf16();
            if a.cmp(b).is_ge() {
                merged[column] = candidate.clone();
            }
        } else if !same_value(candidate, previous) {
            if !same_value(server, previous) && !same_value(server, candidate) {
                if !matches!(column.as_str(), "weight_kg" | "reps" | "duration_seconds")
                    || own["status"] != "logged"
                    || own["legacy_unit_unknown"].as_f64() != Some(0.)
                {
                    return Err(invalid("Overlapping record changes."));
                }
                let name = exercise
                    .and_then(|e| {
                        e["name_vi"]
                            .as_str()
                            .filter(|s| !s.is_empty())
                            .or_else(|| e["name"].as_str())
                    })
                    .unwrap_or_default();
                let side=decisions.choose(json!({"key":js_stringify(&json!([SET,own["id"],column])),"kind":"workout_set_field",
                    "sessionId":session.and_then(|s|s["id"].as_str()).unwrap_or_default(),
                    "sessionDate":session.and_then(|s|s["date"].as_str()).unwrap_or_default(),"exerciseName":name,
                    "setNumber":own["set_number"],"field":column,"local":candidate,"server":server}));
                if side == Side::Local {
                    merged[column] = candidate.clone();
                }
            } else {
                merged[column] = candidate.clone();
            }
        }
    }
    Ok(merged)
}

pub fn merge_snapshots(
    base: Option<&Value>,
    incoming: &Value,
    current: &Value,
    choices: Option<&Value>,
) -> Result<Value> {
    let before = index_snapshot(base)?;
    let local = index_snapshot(Some(incoming))?;
    let remote = index_snapshot(Some(current))?;
    let mut decisions = Decisions {
        choices,
        items: vec![],
        missing: false,
    };
    let workout_choices = deletion_choices(&before, &local, &remote, &mut decisions);
    let mut tables = Map::new();
    for table in schema() {
        let name = table.name.as_str();
        let a = &before[name];
        let b = &local[name];
        let c = &remote[name];
        let ids: IndexSet<_> = a.keys().chain(b.keys()).chain(c.keys()).copied().collect();
        let mut merged = Vec::new();
        for id in ids {
            let previous = a.get(id).copied();
            let own = b.get(id).copied();
            let other = c.get(id).copied();
            if !workout_choices.is_empty() && matches!(name, SESSION | EXERCISE | SET) {
                let choice = session_id(&before, name, previous)
                    .or_else(|| session_id(&local, name, own))
                    .or_else(|| session_id(&remote, name, other))
                    .and_then(|session| workout_choices.get(session));
                if let Some(choice) = choice {
                    if let Some(selected) = if *choice == Side::Local { own } else { other } {
                        merged.push(selected.clone());
                    }
                    continue;
                }
            }
            let local_changed = !same_record(name, previous, own);
            let remote_changed = !same_record(name, previous, other);
            if local_changed && remote_changed && !same_record(name, own, other) {
                if name != SET {
                    return Err(invalid("Overlapping record changes."));
                }
                merged.push(merge_set(previous, own, other, &local, &mut decisions)?);
            } else if let Some(row) = if local_changed { own } else { other } {
                merged.push(row.clone());
            }
        }
        tables.insert(table.name.clone(), Value::Array(merged));
    }
    if decisions.missing {
        return Ok(json!({"items":decisions.items}));
    }
    if let Some(choices) = choices.filter(|c| truthy(c)) {
        let keys = match choices {
            Value::Object(obj) => obj.len(),
            Value::Array(arr) => arr.len(),
            Value::String(s) => s.encode_utf16().count(),
            _ => 0,
        };
        if keys != decisions.items.len() {
            return Err(invalid("Unexpected conflict choice."));
        }
    }
    Ok(
        json!({"snapshot":normalize(&json!({"schemaVersion":SCHEMA_VERSION,"tables":tables}),false)?}),
    )
}
