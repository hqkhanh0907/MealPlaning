use healthmate_domain::dates::parse_local_date;
use healthmate_store::{DatabaseFlavor, SCHEMA_VERSION, account_path};
use rusqlite::{Connection, OpenFlags, OptionalExtension};
use serde_json::{Value, json};
use std::{fmt, path::Path, time::Duration};

pub mod account_auth;
#[cfg(target_os = "android")]
mod android;
pub mod calendar;
pub mod catalog_read;
#[cfg(target_os = "android")]
mod groq;
pub mod profile_data;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ReadError {
    InvalidDate,
    InvalidSession,
    NotReady,
    Query,
}

impl fmt::Display for ReadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::InvalidDate => "Invalid dashboard date",
            Self::InvalidSession => "Invalid account database binding",
            Self::NotReady => "Account database not ready",
            Self::Query => "Could not read dashboard",
        })
    }
}
impl std::error::Error for ReadError {}

pub fn read_dashboard(
    directory: &Path,
    owner: &str,
    database: &str,
    date: &str,
) -> Result<Value, ReadError> {
    parse_local_date(date).ok_or(ReadError::InvalidDate)?;
    read_account(directory, owner, database, |db| {
        let mut data =
            healthmate_store::dashboard::summary(db, date).map_err(|_| ReadError::Query)?;
        let latest = db.query_row(
            "SELECT date,total_volume FROM workout_session WHERE completed_at IS NOT NULL ORDER BY date DESC,completed_at DESC LIMIT 1",
            [],
            |row| {
                let date: String = row.get(0)?;
                let volume: f64 = row.get(1)?;
                Ok(json!({"date":date, "total_volume":volume}))
            },
        ).optional().map_err(|_| ReadError::Query)?;
        data["lastSession"] = latest.unwrap_or(Value::Null);
        Ok(data)
    })
}

pub(crate) fn read_account<T>(
    directory: &Path,
    owner: &str,
    database: &str,
    read: impl FnOnce(&Connection) -> Result<T, ReadError>,
) -> Result<T, ReadError> {
    let path = account_database_path(directory, owner, database)?;
    let mut db = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| ReadError::NotReady)?;
    db.busy_timeout(Duration::from_secs(5))
        .map_err(|_| ReadError::Query)?;
    let tx = db.transaction().map_err(|_| ReadError::Query)?;
    let version: i64 = tx
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(|_| ReadError::Query)?;
    if version != SCHEMA_VERSION {
        return Err(ReadError::NotReady);
    }
    let result = read(&tx)?;
    tx.commit().map_err(|_| ReadError::Query)?;
    Ok(result)
}

pub(crate) fn account_database_path(
    directory: &Path,
    owner: &str,
    database: &str,
) -> Result<std::path::PathBuf, ReadError> {
    let flavor = if database == format!("healthmate_{owner}") {
        DatabaseFlavor::Production
    } else if database == format!("healthmate_dev_{owner}") {
        DatabaseFlavor::Development
    } else {
        return Err(ReadError::InvalidSession);
    };
    let path = account_path(directory, owner, flavor).map_err(|_| ReadError::InvalidSession)?;
    if !path.is_file() {
        return Err(ReadError::NotReady);
    }
    Ok(path)
}
