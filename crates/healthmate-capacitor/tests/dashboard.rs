use healthmate_capacitor::{ReadError, read_dashboard};
use healthmate_store::{DatabaseFlavor, open_account};
use rusqlite::{Connection, params};
use serde_json::{Value, json};
use std::path::Path;

const AN: &str = "aaaaaaaaaaaaaaa";
const BINH: &str = "bbbbbbbbbbbbbbb";
const DAY: &str = "2026-11-28";

#[test]
fn a_small_weight_loss_keeps_its_direction_across_json() {
    let dir = tempfile::tempdir().unwrap();
    let db = fixture(dir.path(), AN, DatabaseFlavor::Production, "An", 120.);
    db.execute("UPDATE weight_log SET weight_kg=75 WHERE id='w'", [])
        .unwrap();
    db.execute(
        "INSERT INTO weight_log(id,date,weight_kg) VALUES('previous','2026-11-27',75.04)",
        [],
    )
    .unwrap();
    let snapshot = read_dashboard(dir.path(), AN, &format!("healthmate_{AN}"), DAY).unwrap();
    assert_eq!(snapshot["weight"]["deltaKg"].as_f64(), Some(0.0));
    assert_eq!(snapshot["weight"]["negativeZeroDelta"], true);
}
fn fixture(dir: &Path, owner: &str, flavor: DatabaseFlavor, label: &str, kcal: f64) -> Connection {
    let db = open_account(dir, owner, flavor).unwrap();
    db.execute("INSERT INTO dish(id,name,type,source,servings) VALUES('dish',?1,'ingredient_based','custom',1)",[label]).unwrap();
    db.execute(
        "INSERT INTO day_plan(id,date,target_calories,target_protein) VALUES('day',?1,2000,90)",
        [DAY],
    )
    .unwrap();
    db.execute(
        "INSERT INTO meal_slot(id,day_plan_id,meal_type,position) VALUES('slot','day','lunch',0)",
        [],
    )
    .unwrap();
    db.execute("INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,is_completed,completed_at,calories,protein,carbs,fat,fiber,sort_order) VALUES('logged','slot','dish',1,1,'2026-11-28T12:00:00Z',?1,25,12,7,3,0)",[kcal]).unwrap();
    db.execute("INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,sort_order) VALUES('pending','slot','dish',1,1)",[]).unwrap();
    db.execute(
        "INSERT INTO weight_log(id,weight_kg,date) VALUES('w',?1,?2)",
        params![kcal / 10.0, DAY],
    )
    .unwrap();
    db
}
fn fetch(dir: &Path, owner: &str, name: &str) -> Value {
    read_dashboard(dir, owner, name, DAY).unwrap()
}

#[test]
fn each_authenticated_database_returns_its_own_authoritative_summary() {
    let dir = tempfile::tempdir().unwrap();
    let a = fixture(
        dir.path(),
        AN,
        DatabaseFlavor::Production,
        "Món của An",
        650.0,
    );
    let b = fixture(
        dir.path(),
        BINH,
        DatabaseFlavor::Production,
        "Món của Bình",
        820.0,
    );
    let a_dev = fixture(
        dir.path(),
        AN,
        DatabaseFlavor::Development,
        "Dữ liệu phát triển",
        400.0,
    );
    for (con, owner, name, kcal) in [
        (&a, AN, format!("healthmate_{AN}"), 650.0),
        (&b, BINH, format!("healthmate_{BINH}"), 820.0),
        (&a_dev, AN, format!("healthmate_dev_{AN}"), 400.0),
    ] {
        let mut snapshot = fetch(dir.path(), owner, &name);
        assert_eq!(
            snapshot.as_object_mut().unwrap().remove("lastSession"),
            Some(Value::Null)
        );
        assert_eq!(
            snapshot,
            healthmate_store::dashboard::summary(con, DAY).unwrap()
        );
        assert_eq!(snapshot["loggedTotals"]["calories"].as_f64(), Some(kcal));
        assert_eq!(snapshot["weight"]["currentKg"].as_f64(), Some(kcal / 10.0));
        assert_eq!(
            snapshot["pendingMeal"],
            json!({"date":DAY,"mealType":"lunch","plannedDishId":"pending"})
        );
    }
    for (owner, name) in [
        (AN, format!("healthmate_{BINH}")),
        (BINH, format!("healthmate_dev_{AN}")),
        ("../invalid", "healthmate_../invalid".into()),
        (AN, format!("../healthmate_{AN}")),
    ] {
        assert_eq!(
            read_dashboard(dir.path(), owner, &name, DAY),
            Err(ReadError::InvalidSession)
        );
    }
}

#[test]
fn missing_old_and_invalid_data_are_never_initialized_or_repaired() {
    let dir = tempfile::tempdir().unwrap();
    let n = format!("healthmate_{AN}");
    let f = dir.path().join(format!("{n}SQLite.db"));
    assert_eq!(
        read_dashboard(dir.path(), AN, &n, DAY),
        Err(ReadError::NotReady)
    );
    assert!(!f.exists());
    let db = Connection::open(&f).unwrap();
    db.execute_batch(
        "CREATE TABLE sentinel(x); INSERT INTO sentinel VALUES(8); PRAGMA user_version=12;",
    )
    .unwrap();
    drop(db);
    let bytes = std::fs::read(&f).unwrap();
    assert_eq!(
        read_dashboard(dir.path(), AN, &n, DAY),
        Err(ReadError::NotReady)
    );
    assert_eq!(bytes, std::fs::read(&f).unwrap());
    for invalid in ["2025-02-29", "2026-4-3", "", "2026-11-28T10:00:00Z"] {
        assert_eq!(
            read_dashboard(dir.path(), AN, &n, invalid),
            Err(ReadError::InvalidDate)
        );
    }
    std::fs::write(&f, b"not a SQLite database").unwrap();
    assert!(read_dashboard(dir.path(), AN, &n, DAY).is_err());
    assert_eq!(std::fs::read(&f).unwrap(), b"not a SQLite database");
}

#[test]
fn read_live_wal_without_observing_uncommitted_writes() {
    let dir = tempfile::tempdir().unwrap();
    let n = format!("healthmate_{AN}");
    let mut writer = fixture(dir.path(), AN, DatabaseFlavor::Production, "Món ăn", 650.0);
    let tx = writer.transaction().unwrap();
    tx.execute("UPDATE planned_dish SET calories=800 WHERE id='logged'", [])
        .unwrap();
    tx.execute("UPDATE weight_log SET weight_kg=80 WHERE id='w'", [])
        .unwrap();
    let before = fetch(dir.path(), AN, &n);
    assert_eq!(
        (
            before["totals"]["calories"].as_f64(),
            before["weight"]["currentKg"].as_f64()
        ),
        (Some(650.), Some(65.))
    );
    tx.commit().unwrap();
    let after = fetch(dir.path(), AN, &n);
    assert_eq!(
        (
            after["totals"]["calories"].as_f64(),
            after["weight"]["currentKg"].as_f64()
        ),
        (Some(800.), Some(80.))
    );
}
#[test]
fn last_session_uses_completed_workouts_and_latest_completion_for_the_date() {
    let dir = tempfile::tempdir().unwrap();
    let db = fixture(dir.path(), AN, DatabaseFlavor::Production, "Bữa trưa", 650.);
    for (id, day, finished, volume) in [
        (
            "earlier",
            "2026-11-25",
            Some("2026-11-25T09:30:00Z"),
            95.0_f64,
        ),
        ("morning", "2026-11-27", Some("2026-11-27T09:00:00Z"), 70.0),
        ("evening", "2026-11-27", Some("2026-11-27T18:30:00Z"), 190.0),
        ("in-progress", DAY, None, 120.0),
    ] {
        let status = if finished.is_some() {
            "completed"
        } else {
            "active"
        };
        db.execute("INSERT INTO workout_session(id,date,started_at,completed_at,mode,status,total_volume) VALUES(?1,?2,?2,?3,'free',?4,?5)",params![id,day,finished,status,volume]).unwrap();
    }
    assert_eq!(
        fetch(dir.path(), AN, &format!("healthmate_{AN}"))["lastSession"],
        json!({"date":"2026-11-27","total_volume":190.0})
    );
}
#[test]
fn workout_and_nutrition_share_a_snapshot_during_commits() {
    let dir = tempfile::tempdir().unwrap();
    let mut writer = fixture(dir.path(), AN, DatabaseFlavor::Production, "Bữa tối", 650.0);
    writer.execute("INSERT INTO workout_session(id,date,started_at,completed_at,mode,status,total_volume) VALUES('last',?1,?1,?1,'free','completed',650)", [DAY]).unwrap();
    let gate = std::sync::Barrier::new(2);
    std::thread::scope(|scope| {
        let gate_ref = &gate;
        scope.spawn(move || {
            gate_ref.wait();
            for n in 1..=40 {
                let kcal = 650.0 + f64::from(n);
                let tx = writer.transaction().unwrap();
                tx.execute(
                    "UPDATE planned_dish SET calories=?1 WHERE id='logged'",
                    [kcal],
                )
                .unwrap();
                tx.execute(
                    "UPDATE weight_log SET weight_kg=?1 WHERE id='w'",
                    [kcal / 10.0],
                )
                .unwrap();
                tx.execute(
                    "UPDATE workout_session SET total_volume=?1 WHERE id='last'",
                    [kcal],
                )
                .unwrap();
                tx.commit().unwrap();
                std::thread::yield_now();
            }
        });
        gate.wait();
        let name = format!("healthmate_{AN}");
        for _ in 0..25 {
            let summary = fetch(dir.path(), AN, &name);
            let kcal = summary["loggedTotals"]["calories"].as_f64().unwrap();
            assert_eq!(summary["weight"]["currentKg"].as_f64(), Some(kcal / 10.0));
            assert_eq!(summary["lastSession"]["total_volume"].as_f64(), Some(kcal));
        }
    });
}
