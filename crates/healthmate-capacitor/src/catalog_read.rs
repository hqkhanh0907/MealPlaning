use crate::{ReadError, read_account};
use rusqlite::{Connection, OptionalExtension, Params, Row, params_from_iter};
use serde_json::{Value, json};
use std::{collections::HashMap, path::Path};
use unicode_normalization::UnicodeNormalization;

fn normalize(text: &str) -> String {
    let decomposed: String = text
        .nfd()
        .filter(|c| !('\u{0300}'..='\u{036f}').contains(c))
        .map(|c| if matches!(c, 'Đ' | 'đ') { 'd' } else { c })
        .collect();
    decomposed
        .to_lowercase()
        .split(|c: char| c == '\u{feff}' || (c != '\u{0085}' && c.is_whitespace()))
        .filter(|word| !word.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
}

fn ingredient(row: &Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "id": row.get::<_, String>("id")?,
        "name": row.get::<_, String>("name")?,
        "category": row.get::<_, String>("category")?,
        "calories": row.get::<_, f64>("calories")?,
        "protein": row.get::<_, f64>("protein")?,
        "carbs": row.get::<_, f64>("carbs")?,
        "fat": row.get::<_, f64>("fat")?,
        "fiber": row.get::<_, f64>("fiber")?,
        "source": row.get::<_, String>("source")?,
        "created_at": row.get::<_, String>("created_at")?,
        "updated_at": row.get::<_, Option<String>>("updated_at")?,
    }))
}

fn rows(db: &Connection, sql: &str, args: impl Params) -> rusqlite::Result<Vec<Value>> {
    db.prepare(sql)?.query_map(args, ingredient)?.collect()
}

fn search(db: &Connection, query: &str) -> rusqlite::Result<Vec<Value>> {
    let term = normalize(query);
    let mut stmt = db.prepare(
        "SELECT *, name LIKE ?1 AS direct_match FROM ingredient ORDER BY name COLLATE NOCASE ASC",
    )?;
    let mut matches = Vec::new();
    let mut cursor = stmt.query([format!("%{query}%")])?;
    while let Some(row) = cursor.next()? {
        if row.get::<_, bool>("direct_match")?
            || (!term.is_empty() && normalize(&row.get::<_, String>("name")?).contains(&term))
        {
            matches.push(ingredient(row)?);
        }
    }
    Ok(matches)
}

fn exact(db: &Connection, name: &str) -> rusqlite::Result<Option<Value>> {
    let term = normalize(name);
    if term.is_empty() {
        return Ok(None);
    }
    let mut stmt = db.prepare("SELECT * FROM ingredient")?;
    let mut cursor = stmt.query([])?;
    while let Some(row) = cursor.next()? {
        if normalize(&row.get::<_, String>("name")?) == term {
            return ingredient(row).map(Some);
        }
    }
    Ok(None)
}

fn ordered(db: &Connection, ids: &[&str]) -> rusqlite::Result<Vec<Value>> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }
    let placeholders = std::iter::repeat_n("?", ids.len())
        .collect::<Vec<_>>()
        .join(",");
    let sql = format!("SELECT * FROM ingredient WHERE id IN ({placeholders})");
    let found = rows(db, &sql, params_from_iter(ids))?;
    let index: HashMap<_, _> = found
        .iter()
        .filter_map(|row| Some((row["id"].as_str()?, row)))
        .collect();
    Ok(ids
        .iter()
        .filter_map(|id| index.get(id).map(|row| (*row).clone()))
        .collect())
}

pub fn read_catalog(
    directory: &Path,
    owner: &str,
    database: &str,
    command: &Value,
) -> Result<Value, ReadError> {
    let text = |key: &str| command[key].as_str().ok_or(ReadError::Query);
    let op = text("op")?;
    read_account(directory, owner, database, |db| {
        let value: rusqlite::Result<Value> = match op {
            "list" => rows(
                db,
                "SELECT * FROM ingredient ORDER BY name COLLATE NOCASE ASC",
                [],
            )
            .map(Value::Array),
            "searchByName" => search(db, text("query")?).map(Value::Array),
            "findRecentlyUsed" => {
                let limit = command["limit"].as_f64().ok_or(ReadError::Query)?;
                rows(db, "SELECT i.* FROM ingredient i INNER JOIN (
                    SELECT di.ingredient_id, MAX(COALESCE(d.updated_at, d.created_at)) AS last_used
                    FROM dish_ingredient di INNER JOIN dish d ON d.id=di.dish_id GROUP BY di.ingredient_id
                ) recent ON recent.ingredient_id=i.id ORDER BY recent.last_used DESC LIMIT ?1", [limit]).map(Value::Array)
            }
            "getById" => db
                .query_row(
                    "SELECT * FROM ingredient WHERE id=?1",
                    [text("id")?],
                    ingredient,
                )
                .optional()
                .map(Value::from),
            "findByIds" => {
                let ids: Vec<_> = command["ids"]
                    .as_array()
                    .ok_or(ReadError::Query)?
                    .iter()
                    .map(|id| id.as_str().ok_or(ReadError::Query))
                    .collect::<Result<_, _>>()?;
                ordered(db, &ids).map(Value::Array)
            }
            "findByExactName" => exact(db, text("name")?).map(Value::from),
            "countDishReferences" => db
                .query_row(
                    "SELECT COUNT(*) FROM dish_ingredient WHERE ingredient_id=?1",
                    [text("id")?],
                    |row| row.get::<_, i64>(0),
                )
                .map(Value::from),
            _ => return Err(ReadError::Query),
        };
        Ok(json!({"op":op,"value":value.map_err(|_| ReadError::Query)?}))
    })
}

#[cfg(target_os = "android")]
mod android {
    use super::*;
    use jni::{
        JNIEnv,
        objects::{JClass, JString},
        sys::jstring,
    };
    use std::{
        panic::{AssertUnwindSafe, catch_unwind},
        ptr,
    };

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanSyncPlugin_catalogReadNative(
        mut env: JNIEnv<'_>,
        _: JClass<'_>,
        dir: JString<'_>,
        owner: JString<'_>,
        database: JString<'_>,
        command: JString<'_>,
    ) -> jstring {
        let result = catch_unwind(AssertUnwindSafe(|| {
            let mut string =
                |v: &JString, err| env.get_string(v).map(String::from).map_err(|_| err);
            let dir = string(&dir, ReadError::InvalidSession)?;
            let owner = string(&owner, ReadError::InvalidSession)?;
            let database = string(&database, ReadError::InvalidSession)?;
            let command = serde_json::from_str(&string(&command, ReadError::Query)?)
                .map_err(|_| ReadError::Query)?;
            let response = read_catalog(Path::new(&dir), &owner, &database, &command)?;
            env.new_string(response.to_string())
                .map(|s| s.into_raw())
                .map_err(|_| ReadError::Query)
        }));
        match result.unwrap_or(Err(ReadError::Query)) {
            Ok(value) => value,
            Err(err) => {
                let (class, message) = match err {
                    ReadError::InvalidSession => (
                        "java/lang/SecurityException",
                        "Invalid account database binding",
                    ),
                    ReadError::NotReady => (
                        "java/io/FileNotFoundException",
                        "Account database not ready",
                    ),
                    _ => ("java/io/IOException", "Could not read ingredient catalog"),
                };
                if !env.exception_check().unwrap_or(true) {
                    let _ = env.throw_new(class, message);
                }
                ptr::null_mut()
            }
        }
    }
}
