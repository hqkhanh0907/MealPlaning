use super::invalid;
use crate::Result;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};

const DEFAULTS: [(&str, &str); 3] = [
    ("b4e9c054-0537-43af-8985-2a8f71e1fbbf", "Nhà"),
    ("ed35d641-b355-493a-ad5f-6e055a6d0708", "Phòng gym"),
    ("47229611-954e-4ec6-92c1-cd61176fc16c", "Ngoài trời"),
];
const PREFIX: &str = "fitness_exercise_place:";
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct ExercisePlace {
    pub id: String,
    pub name: String,
    pub equipment: Option<Vec<String>>,
}

pub fn default_place(db: &Connection) -> Result<Option<String>> {
    let saved: Option<String> = db
        .query_row(
            "SELECT value FROM workout_preference WHERE key='fitness_default_place'",
            [],
            |r| r.get(0),
        )
        .optional()?;
    Ok(saved.filter(|s| DEFAULTS.iter().any(|(id, _)| s == id)))
}
pub fn set_default_place(db: &Connection, id: &str) -> Result<()> {
    if !DEFAULTS.iter().any(|(i, _)| *i == id) {
        return Err(invalid("Nơi tập không hợp lệ."));
    }
    set_pref(db, "fitness_default_place", id)
}
pub(super) fn set_pref(db: &Connection, key: &str, value: &str) -> Result<()> {
    db.execute("INSERT INTO workout_preference(key,value,updated_at) VALUES(?1,?2,datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at WHERE workout_preference.value IS NOT excluded.value",params![key,value])?;
    Ok(())
}
pub fn list_places(db: &Connection) -> Result<Vec<ExercisePlace>> {
    let mut result = Vec::new();
    for (id, name) in DEFAULTS {
        let key = format!("{PREFIX}{id}");
        let raw: Option<String> = db
            .query_row(
                "SELECT value FROM workout_preference WHERE key=?1",
                [key],
                |r| r.get(0),
            )
            .optional()?;
        let value = raw.and_then(|s| {
            let v: serde_json::Value = serde_json::from_str(&s).ok()?;
            v.get("equipment")?;
            let mut place: ExercisePlace = serde_json::from_value(v).ok()?;
            place.name = place.name.trim().to_owned();
            (place.id == id && !place.name.is_empty()).then_some(place)
        });
        result.push(value.unwrap_or_else(|| ExercisePlace {
            id: id.into(),
            name: name.into(),
            equipment: None,
        }));
    }
    Ok(result)
}
pub fn save_place(db: &mut Connection, place: &ExercisePlace) -> Result<Vec<ExercisePlace>> {
    let mut next = place.clone();
    next.name = next.name.trim().to_owned();
    if next.name.is_empty() || !DEFAULTS.iter().any(|(id, _)| *id == next.id) {
        return Err(invalid("Hồ sơ nơi tập không hợp lệ."));
    }
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    set_pref(
        &tx,
        &format!("{PREFIX}{}", next.id),
        &serde_json::to_string(&next)?,
    )?;
    let all = list_places(&tx)?;
    tx.commit()?;
    Ok(all)
}
