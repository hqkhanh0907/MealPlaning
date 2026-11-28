use healthmate_capacitor::profile_data::execute;
use healthmate_store::{DatabaseFlavor, open_account};
use serde_json::{Value, json};
use std::{cell::Cell, path::Path};
use tempfile::tempdir;

const OWNER: &str = "abcdefghijklmno";
const DB: &str = "healthmate_abcdefghijklmno";
fn profile() -> Value {
    json!({"height_cm":165,"weight_kg":65.5,"birth_date":"2008-02-29","gender":"female","goal":"maintain",
 "fitness_level":"beginner","activity_factor":1.55,"bmr":0,"tdee":0,"target_calories":0,"calorie_target_mode":"auto",
 "target_protein":121,"protein_target_mode":"manual","target_carbs":0,"target_fat":null,"theme":"light",
 "notif_morning":0,"notif_lunch":0,"notif_evening":0,"notif_weekly":0,"onboarding_completed":1})
}
fn call(dir: &Path, command: &Value) -> Value {
    execute(dir, OWNER, DB, command, || Ok(())).unwrap()["value"].clone()
}
#[test]
fn uses_existing_database_local_day_and_one_transaction_per_mutation() {
    let scratch = tempdir().unwrap();
    let dir = scratch.path();
    let scheduled = Cell::new(0);
    let op = |command: Value| {
        execute(dir, OWNER, DB, &command, || {
            scheduled.set(scheduled.get() + 1);
            Ok(())
        })
    };
    assert!(op(json!({"op":"get"})).is_err());
    assert_eq!(std::fs::read_dir(dir).unwrap().count(), 0);
    let db = open_account(dir, OWNER, DatabaseFlavor::Production).unwrap();
    assert_eq!(call(dir, &json!({"op":"get"})), Value::Null);
    let insert = json!({"op":"insert","today":"2026-02-27","data":profile()});
    let first = op(insert).unwrap();
    assert_eq!(first["changed"], true);
    let id = first["value"]["id"].as_str().unwrap();
    assert_eq!(id.len(), 36);
    assert_eq!(id.as_bytes()[14], b'4');
    assert_eq!(first["value"]["bmr"].as_f64(), Some(0.));
    assert_eq!(first["value"]["target_carbs"].as_f64(), Some(0.));
    assert_eq!(first["value"]["target_fat"], Value::Null);
    assert_eq!(first["value"]["updated_at"], Value::Null);
    assert_eq!(scheduled.get(), 1);
    assert_eq!(call(dir, &json!({"op":"latestWeight"})), Value::Null);
    let duplicate =
        op(json!({"op":"insert","today":"2026-02-27","data":{"birth_date":"broken"}})).unwrap();
    assert_eq!(duplicate["value"], first["value"]);
    assert_eq!(duplicate["changed"], false);
    assert_eq!(scheduled.get(), 1);
    assert!(op(json!({"op":"update","today":"2026-02-27","data":{"weight_kg":0}})).is_err());
    assert_eq!(scheduled.get(), 1);
    let update = op(json!({"op":"update","today":"2027-02-28","data":{"weight_kg":70.5}})).unwrap();
    assert_eq!(update["changed"], true);
    assert_eq!(scheduled.get(), 2);
    let saved = call(dir, &json!({"op":"get"}));
    assert_eq!(saved["id"], id);
    assert_eq!(saved["bmr"].as_f64(), Some(1480.));
    assert_eq!(saved["target_protein"].as_f64(), Some(121.));
    assert!(saved["updated_at"].is_string());
    let weight = call(dir, &json!({"op":"latestWeight"}));
    assert_eq!(weight["weight_kg"].as_f64(), Some(70.5));
    assert_eq!(
        call(
            dir,
            &json!({"op":"previousWeight","beforeDate":weight["date"]})
        ),
        Value::Null
    );
    db.execute(
        "INSERT INTO weight_log(id,weight_kg,date,notes) VALUES('older',60,'2001-01-01','fixture')",
        [],
    )
    .unwrap();
    assert_eq!(
        call(
            dir,
            &json!({"op":"previousWeight","beforeDate":weight["date"]})
        )["id"],
        "older"
    );
    assert!(op(json!({"op":"update","today":"2026-02-27","data":{"id":"wrong"}})).is_err());
    let changed: i64 = db
        .query_row(
            "SELECT change_version FROM sync_workspace WHERE id=1",
            [],
            |row| row.get(0),
        )
        .unwrap();
    assert!(changed >= 3);
}

#[test]
fn denies_wrong_binding_and_rolls_back_if_a_write_cannot_start() {
    let root = tempdir().unwrap();
    let dir = root.path();
    let db = open_account(dir, OWNER, DatabaseFlavor::Production).unwrap();
    let insert = json!({"op":"insert","today":"2026-02-27","data":profile()});
    assert!(execute(dir, OWNER, "healthmate_other", &insert, || Ok(())).is_err());
    assert!(execute(dir, "../bad", "healthmate_../bad", &insert, || Ok(())).is_err());
    let denied = || Err(healthmate_store::Error::InvalidInput("cancelled".into()));
    assert!(execute(dir, OWNER, DB, &insert, denied).is_err());
    assert_eq!(call(dir, &json!({"op":"get"})), Value::Null);
    db.pragma_update(None, "user_version", 1).unwrap();
    assert!(execute(dir, OWNER, DB, &insert, || panic!("must not schedule")).is_err());
}

#[test]
fn concurrent_onboarding_inserts_one_uuid_and_arms_one_guard() {
    use std::sync::{
        Arc, Barrier,
        atomic::{AtomicUsize, Ordering},
    };
    let root = tempdir().unwrap();
    drop(open_account(root.path(), OWNER, DatabaseFlavor::Production).unwrap());
    let gate = Arc::new(Barrier::new(2));
    let count = AtomicUsize::new(0);
    let rows = std::thread::scope(|scope| {
        let workers: Vec<_> = (0..2)
            .map(|_| {
                let barrier = gate.clone();
                let dir = root.path();
                let counter = &count;
                scope.spawn(move || {
                    barrier.wait();
                    execute(
                        dir,
                        OWNER,
                        DB,
                        &json!({"op":"insert","today":"2027-02-28","data":profile()}),
                        || {
                            counter.fetch_add(1, Ordering::SeqCst);
                            Ok(())
                        },
                    )
                    .unwrap()
                })
            })
            .collect();
        workers
            .into_iter()
            .map(|worker| worker.join().unwrap())
            .collect::<Vec<_>>()
    });
    assert_eq!(count.load(Ordering::SeqCst), 1);
    assert_eq!(rows[0]["value"], rows[1]["value"]);
    assert_ne!(rows[0]["changed"], rows[1]["changed"]);
}

#[test]
#[ignore = "runs the original Angular repository with Node and its installed dependencies"]
fn compare_the_angular_repository_and_native_store_on_separate_databases() {
    use std::{
        io::Write,
        process::{Command, Stdio},
    };
    let native = tempdir().unwrap();
    let oracle = tempdir().unwrap();
    let db = open_account(native.path(), OWNER, DatabaseFlavor::Production).unwrap();
    drop(open_account(oracle.path(), OWNER, DatabaseFlavor::Production).unwrap());
    let commands = [
        json!({"op":"get"}),
        json!({"op":"update","today":"2026-02-27","data":{"weight_kg":31}}),
        json!({"op":"insert","today":"2026-02-27","data":profile()}),
        json!({"op":"insert","today":"2026-02-28","data":{"birth_date":"invalid"}}),
        json!({"op":"insert","today":"invalid-date","data":{"gender":"invalid"}}),
        json!({"op":"latestWeight"}),
        json!({"op":"previousWeight","beforeDate":"date with old format"}),
        json!({"op":"update","today":"2027-02-28","data":{"weight_kg":71.5}}),
        json!({"op":"get"}),
        json!({"op":"latestWeight"}),
        json!({"op":"previousWeight","beforeDate":"2999-12-31"}),
        json!({"op":"update","today":"2027-02-28","data":{"height_cm":99}}),
        json!({"op":"update","today":"2027-02-28","data":{"birth_date":"2999-12-31"}}),
        json!({"op":"update","today":"2027-02-28","data":{"target_protein":19}}),
        json!({"op":"update","today":"2027-02-28","data":{"gender":"invalid"}}),
        json!({"op":"update","today":"2027-02-28","data":{"weight_kg":null}}),
        json!({"op":"update","today":"2027-02-28","data":{"target_carbs":null,"target_fat":0}}),
        json!({"op":"update","today":"2027-02-28","data":{"calorie_target_mode":"manual","target_calories":0}}),
        json!({"op":"update","today":"2027-02-28","data":{"weight_kg":70.75,"notif_evening":1}}),
        json!({"op":"update","today":"2027-02-28","data":{}}),
        json!({"op":"previousWeight","beforeDate":"1999-12-31"}),
    ];
    let mut rows = vec![];
    for command in commands {
        let (value, error) = match execute(native.path(), OWNER, DB, &command, || Ok(())) {
            Ok(result) => (result["value"].clone(), Value::Null),
            Err(e) => (Value::Null, json!(e.to_string())),
        };
        rows.push(json!({"command":command,"value":value,"error":error,"profile":healthmate_store::profile::get(&db).unwrap(),
            "log":healthmate_store::profile::weight_log(&db,None).unwrap(),
            "change":db.query_row("SELECT change_version FROM sync_workspace WHERE id=1",[],|r|r.get::<_,i64>(0)).unwrap()}));
    }
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    let path =
        healthmate_store::account_path(oracle.path(), OWNER, DatabaseFlavor::Production).unwrap();
    let mut child = Command::new("node")
        .arg(root.join("src/app/core/account/profile-data.oracle.cjs"))
        .arg(path)
        .stdin(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(serde_json::to_string(&rows).unwrap().as_bytes())
        .unwrap();
    assert!(child.wait().unwrap().success());
}
