mod engine;
mod session;
mod store;
mod transport;

pub use engine::{Action, Progress, SyncEngine, SyncReport, SyncRequest};
pub use healthmate_store::DatabaseFlavor;
pub use session::{CredentialStore, Session, SessionKey, Sessions};
pub use transport::{HttpTransport, Transport};

use serde_json::Value;
use std::fmt;

#[derive(Debug)]
pub enum Error {
    SessionChanged,
    Cancelled,
    Reauthenticate(String),
    Http {
        status: u16,
        code: String,
        conflict: Option<Value>,
    },
    Network,
    DatabaseNotReady,
    DatabaseChanged,
    Incompatible,
    WorkspaceConflict,
    InvalidData,
    CredentialStore,
    Database(rusqlite::Error),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::SessionChanged => f.write_str("The active account or session changed"),
            Self::Cancelled => f.write_str("Synchronization was cancelled"),
            Self::Reauthenticate(reason) => write!(f, "Sign in again: {reason}"),
            Self::Http { status, .. } => write!(f, "Workspace request returned HTTP {status}"),
            Self::Network => f.write_str("Workspace response unavailable"),
            Self::DatabaseNotReady => f.write_str("Account database is not initialized"),
            Self::DatabaseChanged => f.write_str("Account database changed during sync"),
            Self::Incompatible => f.write_str("Incompatible workspace version"),
            Self::WorkspaceConflict => f.write_str("Concurrent changes need a choice"),
            Self::InvalidData => f.write_str("Invalid synchronization data"),
            Self::CredentialStore => f.write_str("Secure session storage unavailable"),
            Self::Database(e) => e.fmt(f),
        }
    }
}

impl std::error::Error for Error {}
impl From<rusqlite::Error> for Error {
    fn from(err: rusqlite::Error) -> Self {
        if matches!(
            err.sqlite_error_code(),
            Some(rusqlite::ErrorCode::DatabaseBusy | rusqlite::ErrorCode::DatabaseLocked)
        ) {
            Self::DatabaseChanged
        } else {
            Self::Database(err)
        }
    }
}
impl From<serde_json::Error> for Error {
    fn from(_: serde_json::Error) -> Self {
        Self::InvalidData
    }
}
impl From<healthmate_protocol::ProtocolError> for Error {
    fn from(_: healthmate_protocol::ProtocolError) -> Self {
        Self::InvalidData
    }
}
pub type Result<T> = std::result::Result<T, Error>;

pub(crate) fn now() -> String {
    time::OffsetDateTime::now_utc()
        .format(time::macros::format_description!(
            "[year]-[month]-[day]T[hour]:[minute]:[second].[subsecond digits:3]Z"
        ))
        .expect("UTC timestamp")
}
