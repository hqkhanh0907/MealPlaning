mod auth;
mod db;
mod error;
mod operations;
mod routes;
mod workspace;

use axum::{Router, extract::Request};
use rusqlite::Connection;
use std::{
    collections::HashMap,
    io,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
use tokio::sync::Semaphore;

#[derive(Clone)]
pub struct Server(Arc<Shared>);

struct Shared {
    path: PathBuf,
    release: String,
    dummy_hash: String,
    auth_windows: Mutex<HashMap<String, (i64, u32)>>,
    jobs: Arc<Semaphore>,
}

impl Server {
    pub fn open(path: impl AsRef<Path>, release: impl Into<String>) -> io::Result<Self> {
        let path = path.as_ref().to_owned();
        db::initialize(&path).map_err(io::Error::other)?;
        let dummy_hash = auth::hash_password(&uuid::Uuid::new_v4().to_string())
            .map_err(|e| io::Error::other(e.message))?;
        Ok(Self(Arc::new(Shared {
            path,
            release: release.into(),
            dummy_hash,
            auth_windows: Mutex::new(HashMap::new()),
            jobs: Arc::new(Semaphore::new(8)),
        })))
    }

    pub fn public_router(&self) -> Router {
        let state = self.clone();
        Router::new().fallback(move |r: Request| routes::handle(state.clone(), r, true))
    }

    pub fn private_router(&self) -> Router {
        let state = self.clone();
        Router::new().fallback(move |r: Request| routes::handle(state.clone(), r, false))
    }

    pub fn provision_operator(&self, email: &str, password: &str) -> io::Result<()> {
        let mut db = db::open(&self.0.path).map_err(io::Error::other)?;
        auth::provision(&mut db, email, password).map_err(|e| io::Error::other(e.message))
    }
}

pub fn copy_database(source: &Path, destination: &Path) -> io::Result<()> {
    use rusqlite::{OpenFlags, backup::Backup};
    let db = Connection::open_with_flags(source, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(io::Error::other)?;
    let application: i32 = db
        .pragma_query_value(None, "application_id", |r| r.get(0))
        .map_err(io::Error::other)?;
    let version: i32 = db
        .pragma_query_value(None, "user_version", |r| r.get(0))
        .map_err(io::Error::other)?;
    if application != db::APPLICATION_ID || version != 1 {
        return Err(io::Error::other("Unrecognized HealthMate database."));
    }
    let parent = destination
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    let temporary = tempfile::NamedTempFile::new_in(parent)?;
    {
        let mut dest = Connection::open(temporary.path()).map_err(io::Error::other)?;
        let backup = Backup::new(&db, &mut dest).map_err(io::Error::other)?;
        backup
            .run_to_completion(128, std::time::Duration::from_millis(15), None)
            .map_err(io::Error::other)?;
        drop(backup);
        dest.pragma_update(None, "journal_mode", "DELETE")
            .map_err(io::Error::other)?;
        let check: String = dest
            .pragma_query_value(None, "integrity_check", |r| r.get(0))
            .map_err(io::Error::other)?;
        let broken: bool = dest
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM pragma_foreign_key_check)",
                [],
                |r| r.get(0),
            )
            .map_err(io::Error::other)?;
        if check != "ok" || broken {
            return Err(io::Error::other("Backup failed integrity checks."));
        }
    }
    temporary.as_file().sync_all()?;
    temporary
        .persist_noclobber(destination)
        .map_err(|e| e.error)?;
    Ok(())
}
