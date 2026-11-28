pub mod calendar;
pub mod dashboard;

mod catalog;
pub mod fitness;
pub mod management;
pub mod photo;

pub mod meals;

pub mod profile;
mod query;
mod schema;
mod write;

pub use catalog::seed_catalog;
use rusqlite::Connection;
pub use schema::{SCHEMA_VERSION, initialize};
use std::fmt;
use std::path::{Path, PathBuf};

#[derive(Debug)]
pub enum Error {
    Sql(rusqlite::Error),
    Data(serde_json::Error),
    InvalidOwner,
    UnsupportedSchema(i64),
    InvalidInput(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Sql(e) => e.fmt(f),
            Self::Data(e) => e.fmt(f),
            Self::InvalidOwner => f.write_str("Invalid HealthMate account identifier"),
            Self::UnsupportedSchema(version) => {
                write!(f, "Unsupported HealthMate database version {version}")
            }
            Self::InvalidInput(msg) => f.write_str(msg),
        }
    }
}

impl std::error::Error for Error {}

impl From<rusqlite::Error> for Error {
    fn from(value: rusqlite::Error) -> Self {
        Self::Sql(value)
    }
}

impl From<serde_json::Error> for Error {
    fn from(value: serde_json::Error) -> Self {
        Self::Data(value)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Clone, Copy)]
pub enum DatabaseFlavor {
    Production,
    Development,
}

pub fn account_path(directory: &Path, owner: &str, flavor: DatabaseFlavor) -> Result<PathBuf> {
    if owner.len() != 15
        || !owner
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit())
    {
        return Err(Error::InvalidOwner);
    }
    let prefix = match flavor {
        DatabaseFlavor::Production => "healthmate",
        DatabaseFlavor::Development => "healthmate_dev",
    };
    Ok(directory.join(format!("{prefix}_{owner}SQLite.db")))
}

pub fn open_account(directory: &Path, owner: &str, flavor: DatabaseFlavor) -> Result<Connection> {
    let mut db = Connection::open(account_path(directory, owner, flavor)?)?;
    initialize(&mut db)?;
    Ok(db)
}
