use super::rows;
use crate::Result;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
struct Seed {
    id: String,
    name: String,
    name_vi: String,
    muscle_group: String,
    category: String,
    equipment: String,
    instructions: String,
}

const VERSION: &str = "2.0.0";
pub fn ensure_seed_exercises(db: &mut Connection) -> Result<usize> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let current: Option<String> = tx
        .query_row(
            "SELECT value FROM app_config WHERE key='fitness_seed_version'",
            [],
            |r| r.get(0),
        )
        .optional()?;
    if current.as_deref() != Some(VERSION) {
        let items: Vec<Seed> = serde_json::from_str(include_str!("exercises.json"))?;
        let mut insert=tx.prepare("INSERT INTO exercise (id,name,name_vi,muscle_group,category,equipment,instructions,source)
            VALUES(?1,?2,?3,?4,?5,?6,?7,'db') ON CONFLICT(id) DO UPDATE SET name=excluded.name,name_vi=excluded.name_vi,
            muscle_group=excluded.muscle_group,category=excluded.category,equipment=excluded.equipment,instructions=excluded.instructions
            WHERE exercise.source='db' AND (exercise.name,exercise.name_vi,exercise.muscle_group,exercise.category,exercise.equipment,exercise.instructions)
            IS NOT (excluded.name,excluded.name_vi,excluded.muscle_group,excluded.category,excluded.equipment,excluded.instructions)")?;
        for e in items {
            insert.execute(params![
                e.id,
                e.name,
                e.name_vi,
                e.muscle_group,
                e.category,
                e.equipment,
                e.instructions
            ])?;
        }
        drop(insert);
        tx.execute("INSERT INTO app_config(key,value,updated_at) VALUES('fitness_seed_version',?1,datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at",[VERSION])?;
    }
    let count = tx.query_row("SELECT COUNT(*) FROM exercise", [], |r| r.get::<_, i64>(0))?;
    tx.commit()?;
    Ok(count as usize)
}

pub fn list_exercises(
    db: &Connection,
    query: Option<&str>,
    muscle: Option<&str>,
    limit: usize,
) -> Result<Vec<Value>> {
    let query = query
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|q| format!("%{q}%"));
    let muscle = muscle.filter(|s| !s.is_empty());
    rows(db,"SELECT id,name,name_vi,muscle_group,category,equipment,instructions,source,created_at FROM exercise
        WHERE (?1 IS NULL OR muscle_group=?1) AND (?2 IS NULL OR name LIKE ?2 OR name_vi LIKE ?2 OR equipment LIKE ?2)
        ORDER BY CASE category WHEN 'compound' THEN 0 WHEN 'isolation' THEN 1 ELSE 2 END,name_vi COLLATE NOCASE ASC LIMIT ?3",
        params![muscle,query,limit.clamp(1,1000) as i64])
}
