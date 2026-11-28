use healthmate_capacitor::{ReadError, calendar::read_calendar};
use healthmate_store::{DatabaseFlavor, account_path, open_account};
use rusqlite::{Connection, params};
use serde_json::{Value, json};
use std::path::Path;

const A: &str = "aaaaaaaaaaaaaaa";
const B: &str = "bbbbbbbbbbbbbbb";
fn label(owner: &str) -> String {
    format!("healthmate_{owner}")
}
fn days(dir: &Path, owner: &str, start: &str, end: &str) -> Value {
    read_calendar(dir, owner, &label(owner), start, end).unwrap()
}
fn insert_day(db: &Connection, id: &str, date: &str, target: f64) {
    db.execute("INSERT INTO day_plan(id,date,target_calories,target_protein,created_at) VALUES(?1,?2,?3,90,'2026-01-01')",params![id,date,target]).unwrap();
}

#[test]
fn reads_sparse_inclusive_days_without_creating_missing_dates_or_slots() {
    let dir = tempfile::tempdir().unwrap();
    let db = open_account(dir.path(), A, DatabaseFlavor::Production).unwrap();
    insert_day(&db, "sat", "2026-11-28", 1700.);
    insert_day(&db, "mon", "2026-11-30", 1800.);
    let result = days(dir.path(), A, "2026-11-28", "2026-11-30");
    assert_eq!(result["start"], "2026-11-28");
    assert_eq!(result["end"], "2026-11-30");
    assert_eq!(
        result["days"]
            .as_array()
            .unwrap()
            .iter()
            .map(|d| &d["id"])
            .collect::<Vec<_>>(),
        [&json!("sat"), &json!("mon")]
    );
    assert_eq!(result["days"][0]["meal_slots"], json!([]));
    for (start, end) in [("2026-11-29", "2026-11-29"), ("2026-11-30", "2026-11-28")] {
        assert_eq!(days(dir.path(), A, start, end)["days"], json!([]));
    }
    assert_eq!(
        db.query_row("SELECT COUNT(*) FROM day_plan", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        2
    );
    assert_eq!(
        db.query_row("SELECT COUNT(*) FROM meal_slot", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        0
    );
}

#[test]
fn calendar_selects_the_authenticated_database_and_refuses_to_initialize_or_repair_it() {
    let dir = tempfile::tempdir().unwrap();
    let a = open_account(dir.path(), A, DatabaseFlavor::Production).unwrap();
    let b = open_account(dir.path(), B, DatabaseFlavor::Production).unwrap();
    let dev = open_account(dir.path(), A, DatabaseFlavor::Development).unwrap();
    for (db, id, target) in [
        (&a, "prod-a", 111.),
        (&b, "prod-b", 222.),
        (&dev, "dev-a", 333.),
    ] {
        insert_day(db, id, "2024-02-29", target);
    }
    for (owner, name, id) in [
        (A, label(A), "prod-a"),
        (B, label(B), "prod-b"),
        (A, format!("healthmate_dev_{A}"), "dev-a"),
    ] {
        assert_eq!(
            read_calendar(dir.path(), owner, &name, "2024-02-29", "2024-02-29").unwrap()["days"][0]
                ["id"],
            id
        );
    }
    for (owner, name) in [
        (A, label(B)),
        ("../wrong", label("../wrong")),
        (A, format!("../{}", label(A))),
    ] {
        assert_eq!(
            read_calendar(dir.path(), owner, &name, "2024-01-01", "2024-12-31"),
            Err(ReadError::InvalidSession)
        );
    }
    for (start, end) in [("2025-02-29", "2025-03-01"), ("2024-02-29", "2024-13-01")] {
        assert_eq!(
            read_calendar(dir.path(), A, &label(A), start, end),
            Err(ReadError::InvalidDate)
        );
    }
    let missing = tempfile::tempdir().unwrap();
    assert_eq!(
        read_calendar(missing.path(), A, &label(A), "2024-01-01", "2024-01-01"),
        Err(ReadError::NotReady)
    );
    assert!(
        !account_path(missing.path(), A, DatabaseFlavor::Production)
            .unwrap()
            .exists()
    );
    a.pragma_update(None, "user_version", 12).unwrap();
    assert_eq!(
        read_calendar(dir.path(), A, &label(A), "2024-02-29", "2024-02-29"),
        Err(ReadError::NotReady)
    );
    assert_eq!(
        a.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        12
    );
}

#[test]
fn legacy_projection_keeps_raw_snapshots_live_per_serving_nutrition_and_rowid_ties() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open_account(dir.path(), A, DatabaseFlavor::Production).unwrap();
    insert_day(&db, "d", "2026-11-28", 1800.);
    db.execute_batch("INSERT INTO meal_slot(id,day_plan_id,meal_type,position) VALUES('later','d','dinner',3),('first','d','lunch',1);
        INSERT INTO ingredient(id,name,category,calories,protein,carbs,fat,fiber,source) VALUES('i','Đậu','Khác',100,10,12,1,3,'manual');
        INSERT INTO dish(id,name,type,source,servings) VALUES('food','Món đậu','ingredient_based','custom',2);
        INSERT INTO dish_ingredient(id,dish_id,ingredient_id,gram_weight) VALUES('link','food','i',150);
        INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,sort_order,created_at) VALUES('z','first','food',1.5,3,'2026-01-02'),('a','first','food',1,3,'2026-01-02'),('earlier','first','food',1,3,'2026-01-01');").unwrap();
    db.execute("INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,is_completed,completed_at,calories,protein,carbs,fat,fiber,sort_order,created_at) VALUES('logged','first','food',1,1,'2026-01-01',101,20,15,8,NULL,0,'2026-01-01')",[]).unwrap();
    let result = days(dir.path(), A, "2026-11-28", "2026-11-28");
    let slots = result["days"][0]["meal_slots"].as_array().unwrap();
    assert_eq!(slots[0]["id"], "first");
    assert_eq!(slots[1]["planned_dishes"], json!([]));
    let items = slots[0]["planned_dishes"].as_array().unwrap();
    assert_eq!(
        items
            .iter()
            .map(|r| r["id"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["logged", "earlier", "z", "a"]
    );
    let p = &items[2];
    assert_eq!(p["dish_name"], "Món đậu");
    assert_eq!(p["servings"], 1.5);
    assert_eq!(p["is_completed"], 0);
    assert!(p["calories"].is_null());
    assert!(p["completed_at"].is_null());
    for (key, v) in [
        ("effective_calories", 112.5),
        ("effective_protein", 11.25),
        ("effective_carbs", 13.5),
        ("effective_fat", 1.125),
        ("effective_fiber", 3.375),
    ] {
        assert_eq!(p[key].as_f64(), Some(v));
    }
    assert!(items[0]["fiber"].is_null());
    assert_eq!(items[0]["effective_fiber"].as_f64(), Some(0.));
    assert_eq!(items[0]["effective_calories"].as_f64(), Some(101.));
    assert_eq!(items[0]["calories"].as_f64(), Some(101.));
    assert_eq!(p.as_object().unwrap().len(), 19);
    let saved = healthmate_store::calendar::delete(&mut db, "z")
        .unwrap()
        .unwrap();
    let deleted = days(dir.path(), A, "2026-11-28", "2026-11-28");
    assert!(
        deleted["days"][0]["meal_slots"][0]["planned_dishes"]
            .as_array()
            .unwrap()
            .iter()
            .all(|r| r["id"] != "z")
    );
    healthmate_store::calendar::restore_deleted(&mut db, &saved).unwrap();
    db.execute("UPDATE ingredient SET calories=200 WHERE id='i'", [])
        .unwrap();
    let changed = days(dir.path(), A, "2026-11-28", "2026-11-28");
    let restored = changed["days"][0]["meal_slots"][0]["planned_dishes"]
        .as_array()
        .unwrap();
    assert_eq!(
        restored
            .iter()
            .map(|r| r["id"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["logged", "earlier", "z", "a"]
    );
    assert_eq!(restored[2]["effective_calories"], 225.);
    assert_eq!(restored[0]["effective_calories"], 101.);
    db.execute(
        "ALTER TABLE planned_dish ADD COLUMN local_metadata TEXT DEFAULT 'local-only'",
        [],
    )
    .unwrap();
    let extended = days(dir.path(), A, "2026-11-28", "2026-11-28");
    let projected = &extended["days"][0]["meal_slots"][0]["planned_dishes"][2];
    assert_eq!(projected, &restored[2]);
}

#[test]
fn a_week_sees_only_whole_committed_edits() {
    let dir = tempfile::tempdir().unwrap();
    let mut writer = open_account(dir.path(), A, DatabaseFlavor::Production).unwrap();
    writer.pragma_update(None, "journal_mode", "WAL").unwrap();
    insert_day(&writer, "d1", "2026-11-27", 0.);
    insert_day(&writer, "d2", "2026-11-28", 0.);
    let read = || {
        let data = days(dir.path(), A, "2026-11-27", "2026-11-28");
        let rows = data["days"].as_array().unwrap();
        assert_eq!(rows.len(), 2);
        let first = rows[0]["target_calories"].as_f64().unwrap();
        assert_eq!(first, rows[1]["target_calories"].as_f64().unwrap());
        first
    };
    let tx = writer.transaction().unwrap();
    tx.execute("UPDATE day_plan SET target_calories=1 WHERE id='d1'", [])
        .unwrap();
    assert_eq!(read(), 0.);
    tx.execute("UPDATE day_plan SET target_calories=1 WHERE id='d2'", [])
        .unwrap();
    tx.commit().unwrap();
    assert_eq!(read(), 1.);
    let gate = std::sync::Barrier::new(2);
    std::thread::scope(|scope| {
        let gate_ref = &gate;
        scope.spawn(move || {
            gate_ref.wait();
            for n in 2..32 {
                let tx = writer.transaction().unwrap();
                tx.execute("UPDATE day_plan SET target_calories=?1", [n])
                    .unwrap();
                tx.commit().unwrap();
            }
        });
        gate.wait();
        for _ in 0..24 {
            read();
        }
    });
    assert_eq!(read(), 31.);
}
