use crate::{Error, Result};
use rusqlite::{Connection, params_from_iter, types::Value as Sql};
use serde_json::{Map, Value};

pub(crate) fn fields(input: &Value, allowed: &[&str]) -> Result<Map<String, Value>> {
    let fields = input
        .as_object()
        .ok_or_else(|| Error::InvalidInput("Expected an object".into()))?;
    for key in fields.keys() {
        if !allowed.contains(&key.as_str()) {
            return Err(Error::InvalidInput(format!("Unknown field {key}")));
        }
    }
    Ok(fields.clone())
}

fn bind(value: &Value) -> Result<Sql> {
    Ok(match value {
        Value::Null => Sql::Null,
        Value::Bool(b) => Sql::Integer(i64::from(*b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Sql::Integer(i)
            } else {
                Sql::Real(
                    n.as_f64()
                        .ok_or_else(|| Error::InvalidInput("Invalid number".into()))?,
                )
            }
        }
        Value::String(s) => Sql::Text(s.clone()),
        _ => return Err(Error::InvalidInput("Expected a scalar column value".into())),
    })
}

pub(crate) fn insert(db: &Connection, table: &str, fields: &Map<String, Value>) -> Result<()> {
    let columns = fields
        .keys()
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(",");
    let placeholders = vec!["?"; fields.len()].join(",");
    let values = fields.values().map(bind).collect::<Result<Vec<_>>>()?;
    db.execute(
        &format!("INSERT INTO {table} ({columns}) VALUES ({placeholders})"),
        params_from_iter(values),
    )?;
    Ok(())
}

pub(crate) fn update(
    db: &Connection,
    table: &str,
    id: &str,
    fields: &Map<String, Value>,
) -> Result<()> {
    if fields.is_empty() {
        return Ok(());
    }
    let columns = fields
        .keys()
        .map(|k| format!("{k}=?"))
        .collect::<Vec<_>>()
        .join(",");
    let mut values = fields.values().map(bind).collect::<Result<Vec<_>>>()?;
    values.push(Sql::Text(id.into()));
    let n = db.execute(
        &format!("UPDATE {table} SET {columns},updated_at=datetime('now') WHERE id=?"),
        params_from_iter(values),
    )?;
    if n == 0 {
        return Err(Error::Sql(rusqlite::Error::QueryReturnedNoRows));
    }
    Ok(())
}
