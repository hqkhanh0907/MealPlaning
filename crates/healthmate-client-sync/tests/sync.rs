use healthmate_client_sync::{
    Action, CredentialStore, DatabaseFlavor, Error, Result, Session, SessionKey, Sessions,
    SyncEngine, SyncReport, Transport,
};
use rusqlite::{Connection, params};
use serde_json::{Value, json};
use std::{
    collections::VecDeque,
    path::Path,
    sync::{Arc, Mutex},
};
use tempfile::TempDir;

const OWNER: &str = "aaaaaaaaaaaaaaa";
const OTHER: &str = "bbbbbbbbbbbbbbb";
const META: &str = "/api/mealplan/workspace?metadata=1";
const WORK: &str = "/api/mealplan/workspace";
const GET: &str = "/api/mealplan/workspace?schema=13";

#[derive(Default)]
struct Vault(Option<Session>);
impl CredentialStore for Vault {
    fn load(&mut self) -> std::result::Result<Option<Session>, String> {
        Ok(self.0.clone())
    }
    fn store(&mut self, s: Option<&Session>) -> std::result::Result<(), String> {
        self.0 = s.cloned();
        Ok(())
    }
}

type Handler = Box<dyn FnOnce(&str, Option<&str>) -> Result<Value> + Send>;
#[derive(Clone, Default)]
struct Script(Arc<Mutex<VecDeque<(&'static str, Handler)>>>);
impl Script {
    fn step(
        &self,
        path: &'static str,
        h: impl FnOnce(&str, Option<&str>) -> Result<Value> + Send + 'static,
    ) {
        self.0.lock().unwrap().push_back((path, Box::new(h)));
    }
    fn answer(&self, path: &'static str, v: Value) {
        self.step(path, move |_, _| Ok(v));
    }
    fn exhausted(&self) {
        assert!(self.0.lock().unwrap().is_empty());
    }
}
impl Transport for Script {
    fn request(&self, origin: &str, path: &str, token: &str, body: Option<&str>) -> Result<Value> {
        assert_eq!(origin, "https://example.com");
        let (expected, h) = self
            .0
            .lock()
            .unwrap()
            .pop_front()
            .expect("unexpected request");
        assert_eq!(expected, path);
        h(token, body)
    }
}
fn login(owner: &str) -> Session {
    Session {
        key: SessionKey {
            owner: owner.into(),
            generation: String::new(),
        },
        origin: "https://example.com".into(),
        access_token: "access".into(),
        access_expires_at: "2100-01-01T00:00:00.000Z".into(),
        session_token: "device".into(),
        reason: String::new(),
        username: "an".into(),
        full_name: "An".into(),
    }
}
fn http(status: u16, code: &str) -> Error {
    Error::Http {
        status,
        code: code.into(),
        conflict: None,
    }
}
fn parse(s: Option<&str>) -> Value {
    serde_json::from_str(s.unwrap()).unwrap()
}
fn empty() -> Value {
    let schema: Value =
        serde_json::from_str(include_str!("../../../server/pb_hooks/sync-schema.json")).unwrap();
    let tables = schema
        .as_object()
        .unwrap()
        .keys()
        .map(|k| (k.clone(), json!([])))
        .collect::<serde_json::Map<_, _>>();
    json!({"schemaVersion":13,"tables":tables})
}
fn row(id: &str, day: &str, kg: f64) -> Value {
    json!({"id":id,"weight_kg":kg,"date":day,"notes":null,"created_at":"2026-11-28"})
}
fn weight(db: &Connection, id: &str, day: &str, kg: f64) {
    db.execute(
        "INSERT INTO weight_log(id,weight_kg,date,created_at) VALUES(?1,?2,?3,'2026-11-28')",
        params![id, kg, day],
    )
    .unwrap();
}
fn row_state(db: &Connection) -> (i64, i64, i64, Option<String>) {
    db.query_row(
        "SELECT revision,change_version,clean_version,pending FROM sync_workspace WHERE id=1",
        [],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
    )
    .unwrap()
}
struct Test {
    dir: TempDir,
    sessions: Arc<Sessions<Vault>>,
    key: SessionKey,
    net: Script,
}
impl Test {
    fn new() -> Self {
        let sessions = Arc::new(Sessions::new(Vault::default()));
        let key = sessions.replace(login(OWNER)).unwrap();
        Self {
            dir: tempfile::tempdir().unwrap(),
            sessions,
            key,
            net: Script::default(),
        }
    }
    fn open(&self) -> Connection {
        healthmate_store::open_account(self.dir.path(), OWNER, DatabaseFlavor::Production).unwrap()
    }
    fn path(&self) -> std::path::PathBuf {
        healthmate_store::account_path(self.dir.path(), OWNER, DatabaseFlavor::Production).unwrap()
    }
    fn engine(&self) -> SyncEngine<Vault, Script> {
        SyncEngine::new(self.sessions.clone(), self.net.clone())
    }
    fn run(&self, action: Action) -> SyncReport {
        self.engine()
            .run(
                self.dir.path(),
                DatabaseFlavor::Production,
                &self.key,
                "manual",
                action,
                || false,
            )
            .unwrap()
    }
    fn acknowledge(&self, rev: i64, f: impl FnOnce(Value) + Send + 'static) {
        self.net.step(WORK, move |token, body| {
            assert_eq!(token, "access");
            let v = parse(body);
            let id = v["operationId"].clone();
            f(v);
            Ok(json!({"revision":rev,"operationId":id}))
        });
        self.net.answer(META, json!({"revision":rev}));
    }
}

#[test]
fn unchanged_pending_bytes_survive_lost_reply_and_a_later_local_edit() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 74.);
    let raw = Arc::new(Mutex::new(String::new()));
    let first = raw.clone();
    t.net.step(WORK, move |_, b| {
        *first.lock().unwrap() = b.unwrap().into();
        Err(Error::Network)
    });
    let failed = t.run(Action::Sync);
    assert_eq!(
        (failed.status.as_str(), failed.reason.as_str()),
        ("offline", "network_unavailable")
    );
    assert_eq!(row_state(&db).3.as_ref().unwrap(), &*raw.lock().unwrap());
    weight(&db, "b", "2026-01-02", 75.);
    t.net.step(WORK, move |_, b| {
        assert_eq!(b.unwrap(), raw.lock().unwrap().as_str());
        assert_eq!(
            parse(b)["snapshot"]["tables"]["weight_log"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
        Ok(json!({"operationId":parse(b)["operationId"],"revision":1}))
    });
    t.net.answer(META, json!({"revision":1}));
    t.acknowledge(2, |v| {
        assert_eq!(v["baseRevision"], 1);
        assert_eq!(
            v["snapshot"]["tables"]["weight_log"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        assert!(v["snapshot"]["tables"].get("ai_chat_log").is_none());
    });
    let done = t.run(Action::Sync);
    assert_eq!(done.status, "saved");
    assert!(!done.remote_applied);
    let (r, c, clean, p) = row_state(&db);
    assert_eq!(r, 2);
    assert_eq!(c, clean);
    assert!(p.is_none());
    t.net.exhausted();
}

#[test]
fn clean_client_downloads_replaces_only_workspace_tables_and_marks_revision() {
    let t = Test::new();
    let db = t.open();
    db.execute(
        "INSERT OR REPLACE INTO app_config(key,value) VALUES('device_only','local')",
        [],
    )
    .unwrap();
    let mut remote = empty();
    remote["tables"]["weight_log"] = json!([row("b", "2026-01-02", 65.)]);
    t.net.answer(META, json!({"revision":6}));
    t.net.answer(GET, json!({"revision":6,"snapshot":remote}));
    let done = t.run(Action::Sync);
    assert_eq!(done.status, "saved");
    assert!(done.remote_applied);
    assert_eq!(done.remote_revision, 6);
    let (r, c, clean, p) = row_state(&db);
    assert_eq!(r, 6);
    assert_eq!(c, clean);
    assert!(p.is_none());
    let n: i64 = db
        .query_row(
            "SELECT count(*) FROM app_config WHERE key='device_only' AND value='local'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(n, 1);
    assert_eq!(
        db.query_row("SELECT weight_kg FROM weight_log WHERE id='b'", [], |r| r
            .get::<_, f64>(
            0
        ))
        .unwrap(),
        65.
    );
}

#[test]
fn changes_during_acknowledgement_are_rebased_before_the_next_upload() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    let path = t.path();
    let mut remote = empty();
    remote["tables"]["weight_log"] = json!([
        row("a", "2026-01-01", 70.),
        row("server", "2026-01-03", 60.)
    ]);
    t.net.step(WORK, move |_, body| {
        weight(&Connection::open(path).unwrap(), "b", "2026-01-02", 80.);
        Ok(json!({"revision":3,"operationId":parse(body)["operationId"],"merged":true}))
    });
    t.net.answer(META, json!({"revision":3}));
    t.net.answer(GET, json!({"revision":3,"snapshot":remote}));
    t.acknowledge(4, |v| {
        assert_eq!(v["baseRevision"], 3);
        assert_eq!(
            v["snapshot"]["tables"]["weight_log"]
                .as_array()
                .unwrap()
                .len(),
            3
        );
    });
    let done = t.run(Action::Sync);
    assert_eq!(done.status, "saved");
    assert!(done.remote_applied);
    assert_eq!(done.remote_revision, 3);
    assert_eq!(row_state(&db).0, 4);
    t.net.exhausted();
}

#[test]
fn overlapping_edits_while_uploading_leave_the_original_outbox_intact() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    let path = t.path();
    t.net.step(WORK, move |_, body| {
        Connection::open(path)
            .unwrap()
            .execute("UPDATE weight_log SET weight_kg=80 WHERE id='a'", [])
            .unwrap();
        Ok(json!({"revision":2,"operationId":parse(body)["operationId"],"merged":true}))
    });
    let mut remote = empty();
    remote["tables"]["weight_log"] = json!([row("a", "2026-01-01", 90.)]);
    t.net.answer(META, json!({"revision":2}));
    t.net
        .answer(GET, json!({"revision":2,"snapshot":remote.clone()}));
    let done = t.run(Action::Sync);
    assert_eq!(done.reason, "workspace_conflict");
    assert!(row_state(&db).3.is_some());
    t.net.answer(GET, json!({"revision":2,"snapshot":remote}));
    t.net.answer(META, json!({"revision":2}));
    let chosen = t.run(Action::UseServer);
    assert_eq!(chosen.status, "saved");
    assert_eq!(row_state(&db).0, 2);
    assert_eq!(
        db.query_row("SELECT weight_kg FROM weight_log WHERE id='a'", [], |r| r
            .get::<_, f64>(
            0
        ))
        .unwrap(),
        90.
    );
    t.net.exhausted();
}

#[test]
fn workout_choices_are_bound_to_the_historical_operation_and_revision() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    t.net.step(WORK, |_, _| {
        Err(Error::Http {
            status: 409,
            code: "workout_conflict".into(),
            conflict: Some(json!({"revision":3,"items":[{"key":"field"}]})),
        })
    });
    let clash = t.run(Action::Sync);
    let detail = clash.workout_conflict.unwrap();
    let id = detail["operationId"].as_str().unwrap().to_owned();
    assert_eq!(clash.reason, "workout_conflict");
    assert_eq!(t.run(Action::UseServer).reason, "workout_conflict");
    let previous = id.clone();
    t.acknowledge(4, move |req| {
        assert_ne!(req["operationId"], previous);
        assert_eq!(
            req["resolution"],
            json!({"revision":3,"choices":{"field":"local"}})
        );
    });
    let result = t.run(Action::Choose {
        operation_id: id,
        revision: 3,
        choices: json!({"field":"local"}),
    });
    assert_eq!(result.status, "saved");
    t.net.exhausted();
}

#[test]
fn revoked_sessions_persist_the_reason_and_never_upload_as_the_next_account() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    t.net.step(WORK, |_, _| Err(http(401, "session_revoked")));
    let out = t.run(Action::Sync);
    assert_eq!(
        (out.status.as_str(), out.reason.as_str()),
        ("expired", "session_revoked")
    );
    let session = t.sessions.current().unwrap().unwrap();
    assert!(session.access_token.is_empty());
    assert_eq!(session.reason, "session_revoked");
    assert!(row_state(&db).3.is_some());
    assert_eq!(t.run(Action::Sync).reason, "session_revoked");
    t.sessions.replace(login(OTHER)).unwrap();
    assert_eq!(t.run(Action::Sync).status, "idle");
    t.net.exhausted();
}

#[test]
fn switching_accounts_while_the_request_is_in_flight_cannot_acknowledge_or_write_status() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    let sessions = t.sessions.clone();
    t.net.step(WORK, move |_, body| {
        sessions.replace(login(OTHER))?;
        Ok(json!({"revision":1,"operationId":parse(body)["operationId"]}))
    });
    assert_eq!(t.run(Action::Sync).status, "idle");
    let (r, c, clean, p) = row_state(&db);
    assert_eq!(r, 0);
    assert!(c > clean);
    assert!(p.is_some());
    assert_eq!(t.sessions.current().unwrap().unwrap().key.owner, OTHER);
}

#[test]
fn plain_unauthorized_refreshes_once_then_retries_the_same_workspace_request() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    t.net.step(WORK, |_, _| Err(http(401, "")));
    t.net.step("/api/mealplan/session/refresh",|token,body|{assert_eq!(token,"");assert_eq!(parse(body)["sessionToken"],"device");
        Ok(json!({"ownerId":OWNER,"accessToken":"renewed","accessExpiresAt":"2100-01-01T00:00:00.000Z"}))});
    t.net.step(WORK, |token, body| {
        assert_eq!(token, "renewed");
        Ok(json!({"revision":1,"operationId":parse(body)["operationId"]}))
    });
    t.net.step(META, |token, _| {
        assert_eq!(token, "renewed");
        Ok(json!({"revision":1}))
    });
    assert_eq!(t.run(Action::Sync).status, "saved");
    assert_eq!(
        t.sessions.current().unwrap().unwrap().access_token,
        "renewed"
    );
    t.net.exhausted();
}

#[test]
fn worker_never_initializes_missing_account_files_and_respects_preflight_cancellation() {
    let t = Test::new();
    assert!(!Path::new(&t.path()).is_file());
    assert_eq!(t.run(Action::Sync).reason, "database_not_ready");
    assert!(!t.path().is_file());
    assert!(matches!(
        t.engine().run(
            t.dir.path(),
            DatabaseFlavor::Production,
            &t.key,
            "worker",
            Action::Sync,
            || true
        ),
        Err(Error::Cancelled)
    ));
    assert!(healthmate_client_sync::HttpTransport::new("http://example.com").is_err());
}

#[test]
fn a_stale_field_choice_after_an_edit_resnapshots_without_sending_the_old_choice() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    t.net.step(WORK, |_, _| {
        Err(Error::Http {
            status: 409,
            code: "workout_conflict".into(),
            conflict: Some(json!({"revision":7,"items":[{"key":"field"}]})),
        })
    });
    let prior = t.run(Action::Sync).workout_conflict.unwrap();
    weight(&db, "b", "2026-01-02", 65.);
    let id = prior["operationId"].as_str().unwrap().to_owned();
    let original = id.clone();
    t.acknowledge(8, move |req| {
        assert!(req.get("resolution").is_none());
        assert_ne!(req["operationId"], original);
        assert_eq!(
            req["snapshot"]["tables"]["weight_log"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
    });
    assert_eq!(
        t.run(Action::Choose {
            operation_id: id,
            revision: 7,
            choices: json!({"field":"local"})
        })
        .status,
        "saved"
    );
}

#[test]
fn whole_workspace_keep_local_restarts_at_the_latest_server_revision() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    t.net.step(WORK, |_, _| Err(http(409, "")));
    assert_eq!(t.run(Action::Sync).reason, "workspace_conflict");
    let first: Value = serde_json::from_str(&row_state(&db).3.unwrap()).unwrap();
    t.net.answer(META, json!({"revision":9}));
    t.acknowledge(10, move |req| {
        assert_eq!(req["baseRevision"], 9);
        assert_ne!(req["operationId"], first["operationId"]);
    });
    assert_eq!(t.run(Action::UseLocal).status, "saved");
    assert_eq!(row_state(&db).0, 10);
}

#[test]
fn a_different_receipt_or_a_server_revision_behind_the_receipt_preserves_the_outbox() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "a", "2026-01-01", 70.);
    t.net
        .answer(WORK, json!({"operationId":"different","revision":2}));
    assert_eq!(t.run(Action::Sync).reason, "network_unavailable");
    let pending = row_state(&db).3.unwrap();
    t.net.step(WORK, |_, body| {
        Ok(json!({"operationId":parse(body)["operationId"],"revision":2}))
    });
    t.net.answer(META, json!({"revision":1}));
    assert_eq!(t.run(Action::Sync).reason, "network_unavailable");
    assert_eq!(row_state(&db).3, Some(pending));
}

#[test]
fn legacy_access_is_exchanged_for_a_device_session_and_rejected_identity_does_not_replace_owner() {
    let t = Test::new();
    t.open();
    t.sessions
        .update(&t.key, |s| s.session_token.clear())
        .unwrap();
    t.net.step("/api/mealplan/session",|token,body|{
        assert_eq!(token,"access");assert_eq!(parse(body),json!({}));
        Ok(json!({"ownerId":OWNER,"accessToken":"new","sessionToken":"device-2","accessExpiresAt":"2100-01-01T00:00:00Z"}))
    });
    t.net.step(META, |token, _| {
        assert_eq!(token, "new");
        Ok(json!({"revision":0}))
    });
    assert_eq!(t.run(Action::Sync).status, "saved");
    assert_eq!(
        t.sessions.current().unwrap().unwrap().session_token,
        "device-2"
    );
    t.sessions
        .update(&t.key, |s| s.access_expires_at.clear())
        .unwrap();
    t.net.answer(
        "/api/mealplan/session/refresh",
        json!({"ownerId":OTHER,"accessToken":"other"}),
    );
    let forbidden = t.run(Action::Sync);
    assert_eq!(forbidden.status, "forbidden");
    assert_eq!(forbidden.reason, "account_forbidden");
    let session = t.sessions.current().unwrap().unwrap();
    assert_eq!(session.key.owner, OWNER);
    assert!(session.access_token.is_empty());
}

#[test]
fn four_busy_uploads_leave_remaining_changes_for_the_next_worker() {
    let t = Test::new();
    let db = t.open();
    weight(&db, "row0", "2026-01-01", 70.);
    for i in 1..=4 {
        let path = t.path();
        t.net.step(WORK, move |_, body| {
            weight(
                &Connection::open(path).unwrap(),
                &format!("row{i}"),
                &format!("2026-02-{i:02}"),
                69.,
            );
            Ok(json!({"revision":i,"operationId":parse(body)["operationId"]}))
        });
        t.net.answer(META, json!({"revision":i}));
    }
    let status = t.run(Action::Sync);
    assert_eq!(
        (status.status.as_str(), status.reason.as_str()),
        ("offline", "database_busy")
    );
    let (rev, change, clean, p) = row_state(&db);
    assert_eq!(rev, 4);
    assert!(change > clean);
    assert!(p.is_none());
    t.net.exhausted();
}
