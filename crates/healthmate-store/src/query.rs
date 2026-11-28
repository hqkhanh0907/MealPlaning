use rusqlite::{
    Connection, Params, Row,
    types::{Type, ValueRef},
};
use serde_json::{Map, Value};

fn record(row: &Row<'_>) -> rusqlite::Result<Value> {
    let mut values = Map::new();
    for (i, key) in row.as_ref().column_names().enumerate() {
        let v = match row.get_ref(i)? {
            ValueRef::Null => Value::Null,
            ValueRef::Integer(n) => Value::from(n),
            ValueRef::Real(n) => Value::from(n),
            ValueRef::Text(_) => Value::String(row.get::<_, String>(i)?),
            ValueRef::Blob(_) => {
                return Err(rusqlite::Error::InvalidColumnType(
                    i,
                    key.to_owned(),
                    Type::Blob,
                ));
            }
        };
        values.insert(key.to_owned(), v);
    }
    Ok(Value::Object(values))
}

pub(crate) fn rows(db: &Connection, sql: &str, params: impl Params) -> crate::Result<Vec<Value>> {
    let mut statement = db.prepare_cached(sql)?;
    let results = statement
        .query_map(params, record)?
        .collect::<rusqlite::Result<_>>()?;
    Ok(results)
}
