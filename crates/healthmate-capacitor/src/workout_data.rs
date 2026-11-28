use crate::{ReadError, account_database_path, read_account};
use healthmate_domain::fitness::WorkoutSetInput;
use healthmate_store::{Error as StoreError, SCHEMA_VERSION, fitness};
use rusqlite::{Connection, OpenFlags, TransactionBehavior};
use serde_json::{Value, json};
use std::{fmt, path::Path, time::Duration};

#[derive(Debug)]
pub enum WorkoutError {
    Account(ReadError),
    Data(StoreError),
    Invalid(String),
}

impl fmt::Display for WorkoutError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Account(ReadError::Query) => f.write_str("Could not access workout data"),
            Self::Account(e) => e.fmt(f),
            Self::Data(e) => e.fmt(f),
            Self::Invalid(message) => f.write_str(message),
        }
    }
}
impl std::error::Error for WorkoutError {}
impl From<ReadError> for WorkoutError {
    fn from(value: ReadError) -> Self {
        Self::Account(value)
    }
}
impl From<StoreError> for WorkoutError {
    fn from(value: StoreError) -> Self {
        Self::Data(value)
    }
}
impl From<rusqlite::Error> for WorkoutError {
    fn from(value: rusqlite::Error) -> Self {
        Self::Data(value.into())
    }
}

fn field<'a>(v: &'a Value, key: &str) -> Result<&'a str, WorkoutError> {
    v[key]
        .as_str()
        .ok_or_else(|| WorkoutError::Invalid(format!("Expected workout field {key}.")))
}

fn number(input: &Value, key: &str) -> f64 {
    input[key].as_f64().unwrap_or(f64::NAN)
}

fn set_input(
    movement: &str,
    input: &Value,
    revision: bool,
) -> healthmate_store::Result<fitness::SetInput> {
    let data = WorkoutSetInput {
        weight_kg: number(input, "weightKg"),
        reps: number(input, "reps"),
        duration_seconds: (!input["durationSeconds"].is_null())
            .then(|| number(input, "durationSeconds")),
        rest_seconds: if revision {
            0.0
        } else {
            number(input, "restSeconds")
        },
    };
    fitness::validate_set_measurements(movement, &data)?;
    let effort =
        if revision || input["effort"].is_null() {
            None
        } else {
            Some(
                serde_json::from_value(input["effort"].clone()).map_err(|_| {
                    StoreError::InvalidInput(
            "CHECK constraint failed: effort IN ('easy', 'just_right', 'hard', 'maxed')".into())
                })?,
            )
        };
    Ok(fitness::SetInput {
        weight_kg: data.weight_kg,
        reps: data.reps as u32,
        duration_seconds: data.duration_seconds.map(|s| s as u32),
        rest_seconds: data.rest_seconds as u32,
        effort,
        notes: input["notes"].as_str().map(str::to_owned),
    })
}

fn repository_error(error: StoreError, op: &str, id: &str) -> WorkoutError {
    let StoreError::InvalidInput(message) = &error else {
        return error.into();
    };
    match (op, message.as_str()) {
        ("addSet" | "skipSet", "Không tìm thấy bài trong buổi tập.") => {
            WorkoutError::Invalid(format!(
                "WorkoutRepository: workout exercise '{id}' not found."
            ))
        }
        ("completeSession", "Buổi tập này đã kết thúc.") => WorkoutError::Invalid(
            format!("WorkoutRepository: active session '{id}' not found."),
        ),
        ("completeSession", "Cần ghi ít nhất một hiệp trước khi hoàn tất buổi tập.") => {
            WorkoutError::Invalid("WorkoutRepository: at least one logged set is required.".into())
        }
        ("reviseCompletedSet", "Không thể chỉnh hiệp này trong buổi đã hoàn tất.") => {
            WorkoutError::Invalid(
                "WorkoutRepository: set is not editable in this finished workout.".into(),
            )
        }
        _ => error.into(),
    }
}

pub fn execute(
    directory: &Path,
    owner: &str,
    database: &str,
    command: &Value,
    before_write: impl FnOnce() -> healthmate_store::Result<()>,
) -> Result<Value, WorkoutError> {
    let op = field(command, "op")?;
    if matches!(op, "getSession" | "getActiveSession") {
        let session = if op == "getSession" {
            Some(field(command, "sessionId")?)
        } else {
            None
        };
        let value = read_account(directory, owner, database, |db| {
            match session {
                Some(id) => fitness::get_session(db, id),
                None => fitness::active_session(db),
            }
            .map_err(|_| ReadError::Query)
        })?;
        return Ok(json!({"value":value,"changed":false}));
    }
    if !matches!(
        op,
        "addSet" | "skipSet" | "completeSession" | "reviseCompletedSet"
    ) {
        return Err(WorkoutError::Invalid("Unknown workout operation".into()));
    }
    let file = account_database_path(directory, owner, database)?;
    let mut db = Connection::open_with_flags(
        file,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| ReadError::NotReady)?;
    db.busy_timeout(Duration::from_secs(5))?;
    db.pragma_update(None, "foreign_keys", true)?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    if tx.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))? != SCHEMA_VERSION {
        return Err(ReadError::NotReady.into());
    }
    let (value, changed) = match op {
        "addSet" | "skipSet" => {
            let ex = field(command, "exerciseId")?;
            let completed = if op == "addSet" {
                Some(field(command, "now")?)
            } else {
                None
            };
            fitness::append_set_on(
                &tx,
                ex,
                field(command, "setId")?,
                completed,
                |movement| {
                    if completed.is_some() {
                        set_input(movement, &command["input"], false)
                    } else {
                        Ok(fitness::skipped_set_input(
                            number(command, "weightKg"),
                            number(command, "reps"),
                        ))
                    }
                },
                before_write,
            )
            .map_err(|e| repository_error(e, op, ex))?
        }
        "completeSession" => {
            let id = field(command, "sessionId")?;
            fitness::complete_session_on(&tx, id, command["now"].as_str(), before_write)
                .map_err(|e| repository_error(e, op, id))?;
            (Value::Null, true)
        }
        _ => {
            let id = field(command, "sessionId")?;
            fitness::revise_completed_set_on(
                &tx,
                id,
                field(command, "setId")?,
                field(command, "now")?,
                |movement| set_input(movement, &command["input"], true),
                before_write,
            )
            .map_err(|e| repository_error(e, op, id))?
        }
    };
    tx.commit()?;
    Ok(json!({"value":value,"changed":changed}))
}
