use crate::{Error, Result, query::rows, write};
use healthmate_domain::dates::{NaiveDate, parse_local_date};
use healthmate_domain::profile::{
    MeasurementProfile, ProfilePatch, update_measurement_targets, validate_profile_changes,
};
use rusqlite::{Connection, TransactionBehavior};
use serde_json::{Map, Value, json};
use uuid::Uuid;

const COLUMNS: &[&str] = &[
    "height_cm",
    "weight_kg",
    "birth_date",
    "gender",
    "goal",
    "fitness_level",
    "activity_factor",
    "bmr",
    "tdee",
    "target_calories",
    "calorie_target_mode",
    "target_protein",
    "protein_target_mode",
    "target_carbs",
    "target_fat",
    "theme",
    "notif_morning",
    "notif_lunch",
    "notif_evening",
    "notif_weekly",
    "onboarding_completed",
];

pub fn get(db: &Connection) -> Result<Option<Value>> {
    Ok(rows(db, "SELECT * FROM user_profile LIMIT 1", [])?.pop())
}

fn today(db: &Connection) -> Result<NaiveDate> {
    let date: String = db.query_row("SELECT date('now','localtime')", [], |r| r.get(0))?;
    parse_local_date(&date).ok_or_else(|| Error::InvalidInput("Invalid device date".into()))
}

fn merge_calculated(fields: &mut Map<String, Value>, patch: ProfilePatch) {
    for (name, value) in [
        ("bmr", patch.bmr),
        ("tdee", patch.tdee),
        ("target_calories", patch.target_calories),
        ("target_protein", patch.target_protein),
    ] {
        if let Some(value) = value {
            fields.insert(name.into(), json!(value));
        }
    }
}

pub fn save(db: &mut Connection, input: &Value) -> Result<String> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    if let Some(old) = get(&tx)? {
        return Ok(old["id"]
            .as_str()
            .ok_or_else(|| Error::InvalidInput("Invalid profile id".into()))?
            .into());
    }
    let mut all = write::fields(input, COLUMNS)?;
    for mode in ["calorie_target_mode", "protein_target_mode"] {
        if all.get(mode).is_none_or(Value::is_null) {
            all.insert(mode.into(), json!("manual"));
        }
    }
    let initial: MeasurementProfile = serde_json::from_value(Value::Object(all.clone()))?;
    let patch: ProfilePatch = serde_json::from_value(Value::Object(all.clone()))?;
    let date = today(&tx)?;
    validate_profile_changes(&patch, None, date).map_err(|s| Error::InvalidInput(s.into()))?;
    let computed = update_measurement_targets(&initial, ProfilePatch::default(), date)
        .map_err(|s| Error::InvalidInput(s.into()))?;
    merge_calculated(&mut all, computed);
    let id = Uuid::new_v4().to_string();
    all.insert("id".into(), json!(id));
    write::insert(&tx, "user_profile", &all)?;
    tx.commit()?;
    Ok(id)
}

pub fn update(db: &mut Connection, input: &Value) -> Result<()> {
    let mut all = write::fields(input, COLUMNS)?;
    if all.is_empty() {
        return Ok(());
    }
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let Some(old) = get(&tx)? else { return Ok(()) };
    let profile: MeasurementProfile = serde_json::from_value(old.clone())?;
    let patch: ProfilePatch = serde_json::from_value(input.clone())?;
    let date = today(&tx)?;
    validate_profile_changes(&patch, Some(&profile), date)
        .map_err(|s| Error::InvalidInput(s.into()))?;
    let computed = update_measurement_targets(&profile, patch, date)
        .map_err(|s| Error::InvalidInput(s.into()))?;
    merge_calculated(&mut all, computed);
    let id = old["id"]
        .as_str()
        .ok_or_else(|| Error::InvalidInput("Invalid profile id".into()))?;
    write::update(&tx, "user_profile", id, &all)?;
    tx.commit()?;
    Ok(())
}

pub fn weight_log(db: &Connection, before: Option<&str>) -> Result<Vec<Value>> {
    rows(
        db,
        "SELECT id,weight_kg,date,notes,created_at FROM weight_log WHERE ?1 IS NULL OR date < ?1 ORDER BY date DESC",
        [before],
    )
}
