use healthmate_store::{DatabaseFlavor, fitness::*, open_account};
use serde_json::Value;

const AN: &str = "fitaccount00001";
const BINH: &str = "fitaccount00002";
const DATE: &str = "2026-11-28";
const START: &str = "2026-11-28T03:00:00.000Z";
const END: &str = "2026-11-28T03:31:30.000Z";
fn id(v: &Value) -> &str {
    v["id"].as_str().unwrap()
}
#[test]
fn seeded_offline_workout_reopens_with_measured_volume_and_account_isolation() {
    let tmp = tempfile::tempdir().unwrap();
    let mut db = open_account(tmp.path(), AN, DatabaseFlavor::Production).unwrap();
    db.execute("INSERT INTO user_profile(id,height_cm,weight_kg,birth_date,gender,goal,fitness_level,bmr,tdee,target_calories,target_protein,onboarding_completed)
        VALUES('profile',170,70,'1998-05-12','male','maintain','beginner',1600,2000,2000,110,1)",[]).unwrap();
    assert_eq!(ensure_seed_exercises(&mut db).unwrap(), 415);
    let exercise = list_exercises(&db, Some("Bench Press"), None, 100)
        .unwrap()
        .into_iter()
        .find(|r| r["id"] == "bench-press")
        .unwrap();
    assert!(!exercise["instructions"].as_str().unwrap().is_empty());
    let session = start_free_session(&mut db, DATE, START, None).unwrap();
    let session = id(&session);
    let workout = add_exercise(&mut db, session, id(&exercise), None).unwrap();
    let exercise_id = id(&workout);
    assert_eq!(
        id(&add_exercise(&mut db, session, "bench-press", None).unwrap()),
        exercise_id
    );
    append_set(
        &mut db,
        exercise_id,
        &SetInput::repetitions(40.0, 6),
        Some("first"),
        START,
    )
    .unwrap();
    append_set(
        &mut db,
        exercise_id,
        &SetInput::repetitions(40.0, 5),
        Some("second"),
        START,
    )
    .unwrap();
    let replay = append_set(
        &mut db,
        exercise_id,
        &SetInput::repetitions(40.0, 5),
        Some("second"),
        START,
    )
    .unwrap();
    assert_eq!(
        replay["session"]["exercises"][0]["sets"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    assert_eq!(replay["session"]["total_volume"], 440.0);
    complete_session(&mut db, session, END).unwrap();
    drop(db);
    let mut db = open_account(tmp.path(), AN, DatabaseFlavor::Production).unwrap();
    let history = recent_sessions(&db, 5).unwrap();
    assert!(active_session(&db).unwrap().is_none());
    assert_eq!(history[0]["duration_minutes"], 32);
    assert_eq!(history[0]["exercises"][0]["total_volume"], 440.0);
    let changed = revise_completed_set(&mut db, session, "second", 40.0, 7, None, END).unwrap();
    assert_eq!(changed["total_volume"], 520.0);
    let other = open_account(tmp.path(), BINH, DatabaseFlavor::Production).unwrap();
    assert!(recent_sessions(&other, 5).unwrap().is_empty());
}
