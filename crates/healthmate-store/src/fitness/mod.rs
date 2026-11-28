mod catalog;
mod coaching;
mod places;
mod plans;
mod progress;
mod sessions;

pub use catalog::{ensure_seed_exercises, list_exercises};
pub use coaching::*;
pub use places::{ExercisePlace, default_place, list_places, save_place, set_default_place};
pub use plans::*;
pub use progress::*;
pub use sessions::*;

use crate::{Error, Result};
use rusqlite::{Connection, Params, Row, types::Value as SqlValue};
use serde_json::{Map, Value};

fn invalid(s: &str) -> Error {
    Error::InvalidInput(s.to_owned())
}

fn read_consistently<T>(db: &Connection, read: impl FnOnce(&Connection) -> Result<T>) -> Result<T> {
    if !db.is_autocommit() {
        return read(db);
    }
    let tx = db.unchecked_transaction()?;
    let value = read(&tx)?;
    tx.commit()?;
    Ok(value)
}

fn object(row: &Row<'_>) -> rusqlite::Result<Value> {
    let stmt = row.as_ref();
    let mut value = Map::new();
    for (idx, name) in stmt.column_names().enumerate() {
        let field = match row.get::<_, SqlValue>(idx)? {
            SqlValue::Null => Value::Null,
            SqlValue::Integer(n) => n.into(),
            SqlValue::Real(n) => n.into(),
            SqlValue::Text(s) => s.into(),
            SqlValue::Blob(_) => {
                return Err(rusqlite::Error::InvalidColumnType(
                    idx,
                    name.to_string(),
                    rusqlite::types::Type::Blob,
                ));
            }
        };
        value.insert(name.to_string(), field);
    }
    Ok(Value::Object(value))
}
fn rows(db: &Connection, sql: &str, params: impl Params) -> Result<Vec<Value>> {
    let mut stmt = db.prepare(sql)?;
    Ok(stmt
        .query_map(params, object)?
        .collect::<rusqlite::Result<Vec<_>>>()?)
}
fn one(db: &Connection, sql: &str, params: impl Params) -> Result<Option<Value>> {
    use rusqlite::OptionalExtension;
    Ok(db.query_row(sql, params, object).optional()?)
}
