use crate::{
    CredentialStore, DatabaseFlavor, Error, Result, SessionKey, Sessions, Transport, now,
    store::{State, Store},
};
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    path::Path,
    sync::{Arc, Mutex},
    time::Duration,
};

pub struct SyncRequest<'a> {
    pub directory: &'a Path,
    pub flavor: DatabaseFlavor,
    pub key: &'a SessionKey,
    pub source: &'a str,
    pub action: Action,
}

const WORKSPACE: &str = "/api/mealplan/workspace";
const METADATA: &str = "/api/mealplan/workspace?metadata=1";
static TRANSFER: Mutex<()> = Mutex::new(());

#[derive(Clone, Debug)]
pub enum Action {
    Sync,
    UseLocal,
    UseServer,
    Choose {
        operation_id: String,
        revision: i64,
        choices: Value,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Progress {
    Sending,
    Receiving,
    Complete,
    Cancel,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncReport {
    pub status: String,
    pub reason: String,
    pub source: String,
    pub last_sync: String,
    pub last_started: String,
    pub last_finished: String,
    pub remote_applied: bool,
    pub remote_revision: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workout_conflict: Option<Value>,
}

impl Default for SyncReport {
    fn default() -> Self {
        Self {
            status: "idle".into(),
            reason: String::new(),
            source: String::new(),
            last_sync: String::new(),
            last_started: String::new(),
            last_finished: String::new(),
            remote_applied: false,
            remote_revision: 0,
            workout_conflict: None,
        }
    }
}
impl SyncReport {
    pub fn should_retry(&self) -> bool {
        self.status == "offline"
    }
}

struct StatusStore(Connection);
impl StatusStore {
    fn open(directory: &Path, flavor: DatabaseFlavor) -> Result<Self> {
        let name = match flavor {
            DatabaseFlavor::Production => "healthmate_sync_status.db",
            DatabaseFlavor::Development => "healthmate_dev_sync_status.db",
        };
        let db = Connection::open(directory.join(name))?;
        db.busy_timeout(Duration::from_secs(5))?;
        db.execute_batch(
            "CREATE TABLE IF NOT EXISTS status(owner TEXT PRIMARY KEY, details TEXT NOT NULL)",
        )?;
        Ok(Self(db))
    }
    fn read(&self, owner: &str) -> Result<SyncReport> {
        match self
            .0
            .query_row("SELECT details FROM status WHERE owner=?1", [owner], |r| {
                r.get::<_, String>(0)
            })
            .optional()?
        {
            Some(data) => Ok(serde_json::from_str(&data)?),
            None => Ok(SyncReport::default()),
        }
    }
    fn write(&self, owner: &str, report: &SyncReport) -> Result<()> {
        self.0.execute("INSERT INTO status(owner,details) VALUES(?1,?2) ON CONFLICT(owner) DO UPDATE SET details=excluded.details",
            params![owner,serde_json::to_string(report)?])?;
        Ok(())
    }
}

pub struct SyncEngine<V, T> {
    sessions: Arc<Sessions<V>>,
    transport: T,
}

impl<V: CredentialStore, T: Transport> SyncEngine<V, T> {
    pub fn new(sessions: Arc<Sessions<V>>, transport: T) -> Self {
        Self {
            sessions,
            transport,
        }
    }
    pub fn status(
        &self,
        directory: &Path,
        flavor: DatabaseFlavor,
        key: &SessionKey,
    ) -> Result<SyncReport> {
        self.sessions.with_current(key, |_| {
            let mut report = StatusStore::open(directory, flavor)?.read(&key.owner)?;
            report.remote_applied = false;
            if report.status != "conflict" {
                report.workout_conflict = None;
            }
            Ok(report)
        })
    }
    pub fn run(
        &self,
        directory: &Path,
        flavor: DatabaseFlavor,
        key: &SessionKey,
        source: &str,
        action: Action,
        stopped: impl Fn() -> bool,
    ) -> Result<SyncReport> {
        self.run_with_progress(
            SyncRequest {
                directory,
                flavor,
                key,
                source,
                action,
            },
            stopped,
            |_| {},
        )
    }
    pub fn run_with_progress(
        &self,
        request: SyncRequest<'_>,
        stopped: impl Fn() -> bool,
        progress: impl Fn(Progress),
    ) -> Result<SyncReport> {
        let SyncRequest {
            directory,
            flavor,
            key,
            source,
            action,
        } = request;
        let _lock = TRANSFER.lock().map_err(|_| Error::DatabaseChanged)?;
        let mut transfer = Run {
            engine: self,
            key,
            stopped: &stopped,
            progress: &progress,
            applied: 0,
            conflict: None,
        };
        let result = (|| {
            transfer.check()?;
            let path = healthmate_store::account_path(directory, &key.owner, flavor)
                .map_err(|_| Error::InvalidData)?;
            let (status, mut report) = self.sessions.with_current(key, |_| {
                let status = StatusStore::open(directory, flavor)?;
                let mut report = status.read(&key.owner)?;
                report.status = "working".into();
                report.reason.clear();
                report.source = source.into();
                report.last_started = now();
                report.remote_applied = false;
                status.write(&key.owner, &report)?;
                Ok((status, report))
            })?;
            let run = Store::open(&path).and_then(|mut db| {
                transfer.perform(&mut db, &action, report.workout_conflict.as_ref())
            });
            let (state, reason) = match run {
                Ok(()) => ("saved", String::new()),
                Err(Error::Cancelled) => return Err(Error::Cancelled),
                Err(Error::SessionChanged) => return Err(Error::SessionChanged),
                Err(Error::Reauthenticate(reason)) => (
                    if reason == "account_forbidden" {
                        "forbidden"
                    } else {
                        "expired"
                    },
                    reason,
                ),
                Err(Error::Http { status: 409, .. }) | Err(Error::WorkspaceConflict) => (
                    "conflict",
                    if transfer.conflict.is_some() {
                        "workout_conflict"
                    } else {
                        "workspace_conflict"
                    }
                    .into(),
                ),
                Err(Error::Http {
                    status: 429 | 500..=599,
                    ..
                }) => ("offline", "server_unavailable".into()),
                Err(Error::Http { .. }) => ("error", "server_rejected_sync".into()),
                Err(Error::DatabaseNotReady) => ("offline", "database_not_ready".into()),
                Err(Error::DatabaseChanged) => ("offline", "database_busy".into()),
                Err(Error::Incompatible) => ("error", "upgrade_required".into()),
                Err(Error::Network) => ("offline", "network_unavailable".into()),
                Err(_) => ("error", "sync_failed".into()),
            };
            transfer.check()?;
            self.sessions.with_current(key, |_| {
                report.status = state.into();
                report.reason = reason;
                report.last_finished = now();
                if state == "saved" {
                    report.last_sync = report.last_finished.clone();
                }
                report.remote_applied = transfer.applied > 0;
                if report.remote_applied {
                    report.remote_revision = transfer.applied;
                }
                report.workout_conflict = transfer.conflict.take();
                status.write(&key.owner, &report)?;
                Ok(())
            })?;
            Ok(report)
        })();
        match result {
            Ok(report) => {
                progress(if report.status == "saved" {
                    Progress::Complete
                } else {
                    Progress::Cancel
                });
                Ok(report)
            }
            Err(Error::SessionChanged) => {
                progress(Progress::Cancel);
                Ok(SyncReport::default())
            }
            Err(other) => {
                progress(Progress::Cancel);
                Err(other)
            }
        }
    }
}

struct Run<'a, V, T> {
    engine: &'a SyncEngine<V, T>,
    key: &'a SessionKey,
    stopped: &'a dyn Fn() -> bool,
    progress: &'a dyn Fn(Progress),
    applied: i64,
    conflict: Option<Value>,
}

impl<V: CredentialStore, T: Transport> Run<'_, V, T> {
    fn check(&self) -> Result<()> {
        if (self.stopped)() {
            return Err(Error::Cancelled);
        }
        self.engine.sessions.with_current(self.key, |_| Ok(()))
    }
    fn guard<R>(&self, f: impl FnOnce() -> Result<R>) -> Result<R> {
        if (self.stopped)() {
            return Err(Error::Cancelled);
        }
        self.engine.sessions.with_current(self.key, |_| f())
    }
    fn request(&self, path: &str, body: Option<&str>) -> Result<Value> {
        self.check()?;
        let response = self
            .engine
            .sessions
            .request(self.key, &self.engine.transport, path, body);
        self.check()?;
        response
    }
    fn perform(&mut self, db: &mut Store, action: &Action, previous: Option<&Value>) -> Result<()> {
        self.engine.sessions.with_current(self.key, |s| {
            if s.reason.is_empty() {
                Ok(())
            } else {
                Err(Error::Reauthenticate(s.reason.clone()))
            }
        })?;
        match action {
            Action::Choose {
                operation_id,
                revision,
                choices,
            } => {
                if previous.is_some_and(|p| {
                    p["operationId"] == *operation_id && p["revision"].as_i64() == Some(*revision)
                }) {
                    self.guard(|| db.choose(operation_id, *revision, choices))?;
                }
            }
            Action::UseLocal | Action::UseServer => {
                if let Some(previous) = previous {
                    self.conflict = Some(previous.clone());
                    return Err(Error::WorkspaceConflict);
                }
                let local = db.state()?;
                if matches!(action, Action::UseServer) {
                    self.receive(db, &local, true, local.revision)?;
                } else {
                    let rev = self.metadata()?;
                    self.guard(|| db.keep_local(rev, &local))?;
                }
            }
            Action::Sync => {}
        }
        for _ in 0..4 {
            self.check()?;
            let state = db.state()?;
            if state.dirty() {
                if let Some(pending) = self.guard(|| db.prepare())? {
                    self.send(db, &pending)?;
                }
            } else {
                let latest = self.metadata()?;
                if latest > state.revision {
                    self.receive(db, &state, false, latest)?;
                }
            }
            if !db.state()?.dirty() {
                return Ok(());
            }
        }
        Err(Error::DatabaseChanged)
    }
    fn metadata(&self) -> Result<i64> {
        self.request(METADATA, None)?["revision"]
            .as_i64()
            .ok_or(Error::InvalidData)
    }
    fn fetch(&self, minimum: i64) -> Result<(i64, Value)> {
        (self.progress)(Progress::Receiving);
        let remote = self.request(
            &format!("{WORKSPACE}?schema={}", healthmate_protocol::SCHEMA_VERSION),
            None,
        )?;
        let revision = remote["revision"].as_i64().ok_or(Error::InvalidData)?;
        if revision < minimum {
            return Err(Error::Network);
        }
        if !remote["snapshot"].is_object() {
            return Err(Error::InvalidData);
        }
        Ok((revision, remote["snapshot"].clone()))
    }
    fn receive(&mut self, db: &mut Store, local: &State, overwrite: bool, min: i64) -> Result<()> {
        let (rev, snapshot) = self.fetch(min)?;
        self.guard(|| db.adopt(&snapshot, rev, local, overwrite))?;
        self.applied = rev;
        Ok(())
    }
    fn send(&mut self, db: &mut Store, pending: &crate::store::Pending) -> Result<()> {
        self.check()?;
        (self.progress)(Progress::Sending);
        let receipt = match self.request(WORKSPACE, Some(&pending.raw)) {
            Err(Error::Http {
                status: 409,
                code,
                conflict,
            }) => {
                if let Some(mut body) = conflict
                    && body["items"].is_array()
                    && body["revision"].as_i64().is_some_and(|r| r >= 0)
                {
                    body["operationId"] = json!(pending.id()?);
                    self.conflict = Some(body);
                }
                return Err(Error::Http {
                    status: 409,
                    code,
                    conflict: None,
                });
            }
            value => value?,
        };
        if receipt["operationId"].as_str() != Some(pending.id()?) {
            return Err(Error::Network);
        }
        let rev = receipt["revision"].as_i64().ok_or(Error::InvalidData)?;
        let latest = self.metadata()?;
        if latest < rev {
            return Err(Error::Network);
        }
        if receipt["merged"].as_bool() == Some(true) || latest > rev {
            let (r, remote) = self.fetch(latest)?;
            self.guard(|| db.acknowledge(pending, r, Some(&remote)))?;
            self.applied = r;
        } else {
            self.guard(|| db.acknowledge(pending, rev, None))?;
        }
        Ok(())
    }
}
