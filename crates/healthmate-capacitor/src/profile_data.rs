use crate::{ReadError, account_database_path, read_account};
use healthmate_domain::dates::parse_local_date;
use healthmate_domain::profile::{Measurement, birth_date_error, body_measurement_error};
use healthmate_store::{Error as StoreError, SCHEMA_VERSION, profile};
use rusqlite::{Connection, OpenFlags, OptionalExtension, TransactionBehavior};
use serde_json::{Value, json};
use std::{fmt, path::Path, time::Duration};

#[derive(Debug)]
pub enum ProfileError {
    Account(ReadError),
    Data(StoreError),
    Invalid(String),
}
impl fmt::Display for ProfileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Account(ReadError::Query) => f.write_str("Could not access profile data"),
            Self::Account(e) => e.fmt(f),
            Self::Data(e) => e.fmt(f),
            Self::Invalid(s) => f.write_str(s),
        }
    }
}
impl std::error::Error for ProfileError {}
impl From<StoreError> for ProfileError {
    fn from(e: StoreError) -> Self {
        Self::Data(e)
    }
}
impl From<ReadError> for ProfileError {
    fn from(e: ReadError) -> Self {
        Self::Account(e)
    }
}

fn weight(db: &Connection, before: Option<&str>) -> rusqlite::Result<Option<Value>> {
    db.query_row(
        "SELECT id,weight_kg,date,notes,created_at FROM weight_log
         WHERE ?1 IS NULL OR date < ?1 ORDER BY date DESC LIMIT 1",
        [before],
        |row| {
            Ok(json!({
                "id": row.get::<_,String>(0)?,
                "weight_kg": row.get::<_,f64>(1)?,
                "date": row.get::<_,String>(2)?,
                "notes": row.get::<_,Option<String>>(3)?,
                "created_at": row.get::<_,String>(4)?,
            }))
        },
    )
    .optional()
}

pub fn execute(
    directory: &Path,
    owner: &str,
    database: &str,
    command: &Value,
    before_write: impl FnOnce() -> healthmate_store::Result<()>,
) -> Result<Value, ProfileError> {
    let op = command["op"].as_str().unwrap_or_default();
    if matches!(op, "get" | "latestWeight" | "previousWeight") {
        let before = if op == "previousWeight" {
            Some(
                command["beforeDate"]
                    .as_str()
                    .ok_or_else(|| ProfileError::Invalid("Expected weight history date".into()))?,
            )
        } else {
            None
        };
        let value = read_account(directory, owner, database, |db| {
            if op == "get" {
                profile::get(db).map_err(|_| ReadError::Query)
            } else {
                weight(db, before).map_err(|_| ReadError::Query)
            }
        })?;
        return Ok(json!({"value":value,"changed":false}));
    }
    if !matches!(op, "insert" | "update") {
        return Err(ProfileError::Invalid("Unknown profile operation".into()));
    }
    let path = account_database_path(directory, owner, database)?;
    let mut db = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| ReadError::NotReady)?;
    db.busy_timeout(Duration::from_secs(5))
        .map_err(|_| ReadError::Query)?;
    db.pragma_update(None, "foreign_keys", true)
        .map_err(|_| ReadError::Query)?;
    let tx = db
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| ReadError::Query)?;
    let version: i64 = tx
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(|_| ReadError::Query)?;
    if version != SCHEMA_VERSION {
        return Err(ReadError::NotReady.into());
    }
    let data = &command["data"];
    let parsed_date = parse_local_date(command["today"].as_str().unwrap_or_default());
    let malformed = ["weight_kg", "height_cm"]
        .iter()
        .any(|field| data.get(field).is_some_and(|value| !value.is_number()))
        || data
            .get("gender")
            .is_some_and(|gender| !matches!(gender.as_str(), Some("male" | "female")));
    if malformed || parsed_date.is_none() {
        let old = profile::get(&tx)?;
        if op == "insert" && old.is_some() || op == "update" && old.is_none() {
            return Ok(json!({"value":old,"changed":false}));
        }
        let Some(date) = parsed_date else {
            if op == "update" && data.as_object().is_some_and(serde_json::Map::is_empty) {
                return Ok(json!({"value":null,"changed":false}));
            }
            return Err(ProfileError::Invalid("Ngày sinh không hợp lệ.".into()));
        };
        let current = old.as_ref();
        let changed = |key: &str| {
            data.get(key)
                .is_some_and(|value| current.and_then(|row| row.get(key)) != Some(value))
        };
        if (current.is_none() || changed("birth_date"))
            && let Some(message) =
                birth_date_error(data["birth_date"].as_str().unwrap_or_default(), date)
        {
            return Err(ProfileError::Invalid(message.into()));
        }
        for (key, field) in [
            ("weight_kg", Measurement::WeightKg),
            ("height_cm", Measurement::HeightCm),
        ] {
            if changed(key)
                && let Some(message) = body_measurement_error(field, data[key].as_f64())
            {
                return Err(ProfileError::Invalid(message.into()));
            }
        }
        return Err(ProfileError::Invalid("Giới tính không hợp lệ.".into()));
    }
    let date =
        parsed_date.ok_or_else(|| ProfileError::Invalid("Ngày sinh không hợp lệ.".into()))?;
    let (value, changed) = if op == "insert" {
        let (_, inserted) = profile::save_on(&tx, data, date, before_write)?;
        (profile::get(&tx)?.unwrap_or(Value::Null), inserted)
    } else {
        (
            Value::Null,
            profile::update_on(&tx, data, date, before_write)?,
        )
    };
    tx.commit().map_err(|_| ReadError::Query)?;
    Ok(json!({"value":value,"changed":changed}))
}

#[cfg(target_os = "android")]
mod android {
    use super::*;
    use jni::{
        JNIEnv,
        objects::{JClass, JObject, JString},
        sys::jstring,
    };
    use std::{
        panic::{AssertUnwindSafe, catch_unwind},
        ptr,
    };
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanProfilePlugin_profileNative(
        mut env: JNIEnv<'_>,
        _: JClass<'_>,
        directory: JString<'_>,
        owner: JString<'_>,
        database: JString<'_>,
        command: JString<'_>,
        guard: JObject<'_>,
    ) -> jstring {
        let result = catch_unwind(AssertUnwindSafe(|| -> Result<String, ProfileError> {
            let mut extract = |input: &JString| -> Result<String, ProfileError> {
                env.get_string(input)
                    .map(String::from)
                    .map_err(|_| ReadError::InvalidSession.into())
            };
            let directory = extract(&directory)?;
            let owner = extract(&owner)?;
            let database = extract(&database)?;
            let raw = extract(&command)?;
            let input = serde_json::from_str(&raw)
                .map_err(|_| ProfileError::Invalid("Invalid profile request".into()))?;
            if input == json!({"op":"probe"}) {
                return Ok("1".to_owned());
            }
            let result = execute(Path::new(&directory), &owner, &database, &input, || {
                env.call_method(&guard, "run", "()V", &[])
                    .map(|_| ())
                    .map_err(|_| StoreError::InvalidInput("Could not prepare profile write".into()))
            })?;
            Ok(result.to_string())
        }));
        match result {
            Ok(Ok(value)) => env
                .new_string(value)
                .map(JString::into_raw)
                .unwrap_or(ptr::null_mut()),
            Ok(Err(err)) => {
                let _ = env.throw_new("java/io/IOException", err.to_string());
                ptr::null_mut()
            }
            Err(_) => {
                let _ = env.throw_new("java/io/IOException", "Profile data unavailable");
                ptr::null_mut()
            }
        }
    }
}
