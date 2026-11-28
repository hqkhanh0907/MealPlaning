use healthmate_capacitor::workout_data::execute;
use healthmate_store::{DatabaseFlavor, Error, account_path, open_account};
use rusqlite::Connection;
use serde_json::{Value, json};
use std::{
    cell::Cell,
    io::Write,
    path::Path,
    process::{Command, Stdio},
};

const A: &str = "aaaaaaaaaaaaaaa";
const DB: &str = "healthmate_aaaaaaaaaaaaaaa";
const NOW: &str = "2026-11-28T08:01:30.000Z";

fn setup(dir: &Path) -> Connection {
    let db = open_account(dir, A, DatabaseFlavor::Production).unwrap();
    db.execute_batch("INSERT INTO exercise (id,name,name_vi,muscle_group,category,equipment,source,created_at) VALUES
        ('biceps-curl','Curl','Cuốn tay','biceps','isolation','dumbbell','db','2026-11-28'),
        ('side-plank','Plank','Plank nghiêng','abs','isolation','bodyweight','db','2026-11-28');
        INSERT INTO workout_session (id,date,mode,origin,started_at,created_at,status) VALUES
        ('s','2026-11-28','free','free','2026-11-28T08:00:00.000Z','2026-11-28','active'),
        ('round','2026-11-28','free','free','2026-11-28T14:00:00.001+06:00','2026-11-28','active'),
        ('old','2026-11-27','free','free','2026-11-27T08:00:00.000Z','2026-11-27','completed');
        INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order,next_weight_kg)
        VALUES ('ex','s','biceps-curl',0,30),('clock','s','side-plank',0,NULL),('old-ex','old','biceps-curl',0,NULL),('round-ex','round','biceps-curl',0,NULL);
        INSERT INTO workout_set(id,workout_exercise_id,set_number,weight_kg,reps,status,legacy_unit_unknown) VALUES ('legacy','old-ex',1,20,6,'logged',1);").unwrap();
    db
}

fn add(ex: &str, id: &str, input: Value) -> Value {
    json!({"op":"addSet","exerciseId":ex,"setId":id,"now":NOW,"input":input})
}
fn edit(session: &str, id: &str, input: Value) -> Value {
    json!({"op":"reviseCompletedSet","sessionId":session,"setId":id,"now":NOW,"input":input})
}
fn valid() -> Value {
    json!({"weightKg":25,"reps":6,"restSeconds":0,"effort":"just_right","notes":"Hiệp thử"})
}

#[test]
fn compares_real_repository_results_errors_rows_and_idempotence() {
    let native = tempfile::tempdir().unwrap();
    let oracle = tempfile::tempdir().unwrap();
    let write = setup(native.path());
    drop(setup(oracle.path()));
    let complete = json!({"op":"completeSession","sessionId":"s","now":NOW});
    let mut invalid = valid();
    invalid["weightKg"] = Value::Null;
    let mut commands = vec![
        json!({"op":"getActiveSession"}),
        json!({"op":"getSession","sessionId":"none"}),
        complete.clone(),
        json!({"op":"completeSession","sessionId":"absent","now":NOW}),
        add("missing", "bad", invalid.clone()),
        add("ex", "bad", invalid.clone()),
    ];
    for (key, val) in [
        ("weightKg", json!(501)),
        ("reps", json!(2.5)),
        ("restSeconds", json!(1.2)),
        ("durationSeconds", json!(45)),
        ("effort", json!("not-a-valid-effort")),
    ] {
        let mut input = valid();
        input[key] = val;
        commands.push(add("ex", "bad", input));
    }
    commands.extend([
        add(
            "clock",
            "bad",
            json!({"weightKg":0,"reps":0,"durationSeconds":0,"restSeconds":0}),
        ),
        add("ex", "set", valid()),
        add("ex", "set", invalid.clone()),
        add("clock", "set", invalid.clone()),
        json!({"op":"skipSet","exerciseId":"ex","setId":"skipped","weightKg":-1,"reps":2.5}),
        json!({"op":"skipSet","exerciseId":"ex","setId":"skipped","weightKg":50,"reps":3}),
        add(
            "clock",
            "timed",
            json!({"weightKg":0,"reps":0,"durationSeconds":45,"restSeconds":600}),
        ),
        edit("s", "set", json!({"weightKg":25,"reps":8})),
        complete.clone(),
        complete,
        add("ex", "set", invalid.clone()),
        add("ex", "new", invalid),
        edit("s", "skipped", json!({"weightKg":2,"reps":8})),
        edit("old", "legacy", json!({"weightKg":5,"reps":4})),
        edit("s", "set", json!({"weightKg":25,"reps":6})),
        edit("s", "set", json!({"weightKg":25,"reps":8})),
        edit(
            "s",
            "timed",
            json!({"weightKg":0,"reps":0,"durationSeconds":55}),
        ),
        json!({"op":"getActiveSession"}),
        json!({"op":"getSession","sessionId":"s"}),
    ]);
    commands.extend([
        add("round-ex", "boundary", valid()),
        json!({"op":"completeSession","sessionId":"round","now":null}),
        json!({"op":"completeSession","sessionId":"round","now":NOW}),
        json!({"op":"getSession","sessionId":"round"}),
        json!({"op":"getActiveSession"}),
    ]);
    let results: Vec<Value> = commands
        .iter()
        .map(|c| {
            let writes = Cell::new(0);
            let result = execute(native.path(), A, DB, c, || {
                writes.set(writes.get() + 1);
                Ok(())
            });
            match result {
                Ok(reply) => {
                    assert_eq!(writes.get(), usize::from(reply["changed"] == true));
                    json!({"ok":true,"value":reply["value"]})
                }
                Err(err) => {
                    assert_eq!(writes.get(), 0);
                    json!({"ok":false,"error":err.to_string()})
                }
            }
        })
        .collect();
    let rows = write
        .query_row(
            "SELECT total_volume,duration_minutes FROM workout_session WHERE id='s'",
            [],
            |r| Ok((r.get::<_, f64>(0)?, r.get::<_, i64>(1)?)),
        )
        .unwrap();
    assert_eq!(rows, (200., 2));
    assert_eq!(
        write
            .query_row(
                "SELECT duration_minutes FROM workout_session WHERE id='round'",
                [],
                |r| r.get::<_, i64>(0)
            )
            .unwrap(),
        1
    );
    let fixture = json!({"commands":commands,"results":results,"now":NOW});
    compare_repository(native.path(), oracle.path(), &fixture);
}

fn compare_repository(native: &Path, oracle: &Path, fixture: &Value) {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let mut node = Command::new("node")
        .arg(root.join("src/app/core/account/workout-data.oracle.cjs"))
        .arg(account_path(oracle, A, DatabaseFlavor::Production).unwrap())
        .arg(account_path(native, A, DatabaseFlavor::Production).unwrap())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    node.stdin
        .take()
        .unwrap()
        .write_all(fixture.to_string().as_bytes())
        .unwrap();
    let result = node.wait_with_output().unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
}

#[test]
fn guards_first_write_and_returns_no_data_for_an_unbound_database() {
    let dir = tempfile::tempdir().unwrap();
    let db = setup(dir.path());
    let c = add("ex", "stable", valid());
    assert!(
        execute(dir.path(), "bbbbbbbbbbbbbbb", DB, &c, || panic!(
            "wrong owner"
        ))
        .is_err()
    );
    assert!(
        execute(dir.path(), A, DB, &c, || Err(Error::InvalidInput(
            "account changed".into()
        )))
        .is_err()
    );
    assert_eq!(
        db.query_row(
            "SELECT COUNT(*) FROM workout_set WHERE id='stable'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
    let inserted = execute(dir.path(), A, DB, &c, || Ok(())).unwrap();
    assert_eq!(inserted["changed"], true);
    let replay = execute(dir.path(), A, DB, &c, || panic!("duplicate write")).unwrap();
    assert_eq!(replay["changed"], false);
    assert_eq!(replay["value"], inserted["value"]);
}

#[test]
fn rolls_back_an_interrupted_rollup_and_serializes_competing_retries() {
    use std::sync::{
        Arc, Barrier,
        atomic::{AtomicUsize, Ordering},
    };
    let dir = tempfile::tempdir().unwrap();
    let db = setup(dir.path());
    let fault = "CREATE TRIGGER fail_rollup BEFORE UPDATE OF total_volume ON workout_session BEGIN SELECT RAISE(ABORT,'fixture rollup failure'); END;";
    db.execute_batch(fault).unwrap();
    let cmd = add("ex", "same-id", valid());
    let called = Cell::new(false);
    let error = execute(dir.path(), A, DB, &cmd, || {
        called.set(true);
        Ok(())
    })
    .unwrap_err();
    assert!(called.get());
    assert_eq!(
        db.query_row(
            "SELECT count(*) FROM workout_set WHERE id='same-id'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
    db.execute_batch("DROP TRIGGER fail_rollup").unwrap();
    let guards = Arc::new(AtomicUsize::new(0));
    let start = Arc::new(Barrier::new(2));
    let replies = std::thread::scope(|s| {
        let attempts: Vec<_> = (0..2)
            .map(|_| {
                let g = Arc::clone(&guards);
                let b = Arc::clone(&start);
                let path = dir.path();
                let c = &cmd;
                s.spawn(move || {
                    b.wait();
                    execute(path, A, DB, c, || {
                        g.fetch_add(1, Ordering::Relaxed);
                        Ok(())
                    })
                    .unwrap()
                })
            })
            .collect();
        attempts
            .into_iter()
            .map(|t| t.join().unwrap())
            .collect::<Vec<_>>()
    });
    assert_eq!(guards.load(Ordering::Relaxed), 1);
    assert_eq!(replies[0]["value"], replies[1]["value"]);
    assert_ne!(replies[0]["changed"], replies[1]["changed"]);
    assert_eq!(replies[0]["value"]["session"]["total_volume"], 150.);
    let oracle = tempfile::tempdir().unwrap();
    drop(setup(oracle.path()));
    compare_repository(
        dir.path(),
        oracle.path(),
        &json!({
            "now":NOW,"commands":[],"results":[],
            "rollback":{"trigger":fault,"command":cmd,"error":error.to_string(),"receipt":replies[0]["value"]}
        }),
    );
}
