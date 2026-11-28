use healthmate_domain::{fitness::Effort, recommendation::TrainingDay};
use healthmate_store::{fitness::*, initialize};
use rusqlite::Connection;
use serde_json::{Value, json};

const DATE: &str = "2026-11-28";
const NOW: &str = "2026-11-28T09:00:00.000Z";
const END: &str = "2026-11-28T10:00:00.000Z";
fn db() -> Connection {
    let mut db = Connection::open_in_memory().unwrap();
    initialize(&mut db).unwrap();
    db
}
fn id(v: &Value) -> String {
    v["id"].as_str().unwrap().to_owned()
}
fn version(db: &Connection) -> i64 {
    db.query_row(
        "SELECT change_version FROM sync_workspace WHERE id=1",
        [],
        |r| r.get(0),
    )
    .unwrap()
}
fn bench(d: usize) -> Value {
    json!({"exerciseId":"bench-press","sets":d,"repsMin":6,"repsMax":8,"restSeconds":90,"notes":"Theo dõi mức tạ"})
}
fn plan_days_input() -> Vec<TrainingDay> {
    (0..7)
        .map(|i| {
            serde_json::from_value(
                json!({"dayOfWeek":i,"name":format!("Ngày {i}"),"isRestDay":i!=2&&i!=5,
        "exercises":if i==2||i==5{vec![bench(2)]}else{vec![]}}),
            )
            .unwrap()
        })
        .collect()
}
#[test]
fn seed_plan_selection_and_edits_preserve_data_and_change_versions() {
    let mut db = db();
    let all = ensure_preset_plans(&mut db).unwrap();
    assert_eq!(all.len(), 4);
    assert!(active_plan(&db).unwrap().is_none());
    let before = version(&db);
    ensure_preset_plans(&mut db).unwrap();
    assert_eq!(before, version(&db));
    db.execute(
        "DELETE FROM app_config WHERE key='fitness_seed_version'",
        [],
    )
    .unwrap();
    ensure_seed_exercises(&mut db).unwrap();
    assert_eq!(before, version(&db));
    let prefs = FinderSchedule {
        weekdays: vec![2, 5, 2],
        minutes: 40,
    };
    save_finder_schedule(&db, &prefs).unwrap();
    let before = version(&db);
    save_finder_schedule(&db, &prefs).unwrap();
    assert_eq!(version(&db), before);
    assert_eq!(finder_schedule(&db).unwrap().unwrap().weekdays, vec![2, 5]);
    activate_plan_type(&mut db, "full_body").unwrap();
    let active = active_plan(&db).unwrap().unwrap();
    assert_eq!(active["id"], "plan_full_body_3x");
    assert_eq!(active["days"].as_array().unwrap().len(), 7);
    let day = today_training_day(&db, "2026-11-23").unwrap().unwrap();
    assert_eq!(day["day_of_week"], 1);
    let session = start_guided_session(&mut db, &id(&day), "2026-11-23", NOW, None).unwrap();
    assert_eq!(session["mode"], "guided");
    assert_eq!(session["origin"], "plan_day");
    assert_eq!(session["exercises"][0]["planned_sets"], 3);
    assert!(activate_plan_type(&mut db, "upper_lower").is_err());
    let sid = id(&session);
    cancel_session(&mut db, &sid, END).unwrap();
    let draft = plan_days_input();
    let personal = save_personal_plan(
        &mut db,
        "plan_two_dumbbells_floor",
        "Lịch của An",
        &draft,
        ExpectedActive::Exact(Some("plan_full_body_3x")),
    )
    .unwrap();
    assert!(
        save_personal_plan(
            &mut db,
            "plan_two_dumbbells_floor",
            "Lịch cũ",
            &draft,
            ExpectedActive::Exact(Some("plan_full_body_3x"))
        )
        .is_err()
    );
    assert_eq!(active_plan(&db).unwrap().unwrap()["id"], personal);
    let prior = plan_days(&db, &personal).unwrap();
    save_personal_plan(
        &mut db,
        &personal,
        "Đổi tên",
        &draft,
        ExpectedActive::Unchecked,
    )
    .unwrap();
    let updated = plan_days(&db, &personal).unwrap();
    assert_eq!(
        prior.iter().map(id).collect::<Vec<_>>(),
        updated.iter().map(id).collect::<Vec<_>>()
    );
    let ai = create_ai_plan(
        &mut db,
        "Đề xuất",
        "Giáo án thử",
        &draft,
        ExpectedActive::Exact(Some(&personal)),
    )
    .unwrap();
    assert_eq!(ai["source"], "ai");
    assert_eq!(ai["training_days"], 2);
    assert_eq!(list_plans(&db).unwrap().len(), 6);
    assert!(get_session(&db, &sid).unwrap().is_some());
}

#[test]
fn venue_preview_replay_and_confirmed_load_require_the_same_prescription() {
    let mut db = db();
    ensure_seed_exercises(&mut db).unwrap();
    let mut gym = list_places(&db).unwrap()[1].clone();
    gym.equipment = Some(vec!["dumbbell".into(), "bench".into(), "barbell".into()]);
    save_place(&mut db, &gym).unwrap();
    let key = &gym.id;
    set_default_place(&db, key).unwrap();
    assert_eq!(default_place(&db).unwrap().as_deref(), Some(key.as_str()));
    let preview = preview_movements(&db, &[bench(2)], Some(key)).unwrap();
    assert!(
        start_composed_session(&mut db, &[bench(3)], DATE, NOW, Some(key), Some(&preview)).is_err()
    );
    assert!(active_session(&db).unwrap().is_none());
    let session =
        start_composed_session(&mut db, &[bench(2)], DATE, NOW, Some(key), Some(&preview)).unwrap();
    let sid = id(&session);
    let mid = id(&session["exercises"][0]);
    let mut input = SetInput::repetitions(40.0, 8);
    input.effort = Some(Effort::Easy);
    append_set(&mut db, &mid, &input, None, NOW).unwrap();
    append_set(&mut db, &mid, &input, None, NOW).unwrap();
    complete_session(&mut db, &sid, END).unwrap();
    confirm_next_load(&mut db, &mid, Some(42.5)).unwrap();
    record_completion_note(&db, &mid, "  Mức tạ ổn  ").unwrap();
    let summary = completion_summary(&db, &sid).unwrap().unwrap();
    assert_eq!(summary["exercises"][0]["next_weight_kg"], 42.5);
    assert_eq!(summary["exercises"][0]["completion_note"], "Mức tạ ổn");
    let rebuilt = replay_session(&mut db, &sid, DATE, NOW, Some(key), None).unwrap();
    assert_eq!(rebuilt["source_session_id"], sid);
    assert_eq!(rebuilt["exercises"][0]["planned_notes"], "Theo dõi mức tạ");
    assert_eq!(rebuilt["exercises"][0]["sets"], json!([]));
    assert!(rebuilt["exercises"][0]["next_weight_kg"].is_null());
    let another = id(&rebuilt["exercises"][0]);
    append_set(&mut db, &another, &input, None, NOW).unwrap();
    let replaced = replace_movement(&mut db, &another, "dumbbell-chest-press", true).unwrap();
    assert_eq!(replaced["exercises"].as_array().unwrap().len(), 2);
    assert_eq!(
        replaced["exercises"][0]["sets"].as_array().unwrap().len(),
        1
    );
    assert_eq!(replaced["exercises"][1]["planned_sets"], 1);
    assert_eq!(
        replaced["exercises"][1]["original_exercise_id"],
        "bench-press"
    );
    complete_session(&mut db, &id(&rebuilt), END).unwrap();
    let next = start_composed_session(&mut db, &[bench(2)], DATE, NOW, Some(key), None).unwrap();
    assert_eq!(next["exercises"][0]["exercise_id"], "dumbbell-chest-press");
    cancel_session(&mut db, &id(&next), END).unwrap();
    let plain = start_composed_session(&mut db, &[bench(2)], DATE, NOW, None, None).unwrap();
    assert_eq!(plain["exercises"][0]["exercise_id"], "bench-press");
}

#[test]
fn recorded_units_skip_restore_and_progress_use_real_rows() {
    let mut db = db();
    ensure_seed_exercises(&mut db).unwrap();
    let sid = id(&start_free_session(&mut db, DATE, NOW, None).unwrap());
    let timed = id(&add_exercise(&mut db, &sid, "plank", None).unwrap());
    skip_set(&mut db, &timed, 75.0, 20.0, Some("skip")).unwrap();
    assert!(complete_session(&mut db, &sid, END).is_err());
    assert!(append_set(&mut db, &timed, &SetInput::repetitions(0.0, 15), None, NOW).is_err());
    let mut seconds = SetInput::repetitions(0.0, 0);
    seconds.duration_seconds = Some(45);
    append_set(&mut db, &timed, &seconds, Some("hold"), NOW).unwrap();
    let bench = id(&add_exercise(&mut db, &sid, "bench-press", None).unwrap());
    let mut reps = SetInput::repetitions(40.5, 6);
    reps.effort = Some(Effort::Maxed);
    reps.notes = Some("Đã ghi".into());
    append_set(&mut db, &bench, &reps, Some("reps"), NOW).unwrap();
    assert!(append_set(&mut db, &bench, &reps, Some("hold"), NOW).is_err());
    cancel_session(&mut db, &sid, NOW).unwrap();
    let other = id(&start_free_session(&mut db, DATE, NOW, None).unwrap());
    assert!(undo_cancel(&mut db, &sid).is_err());
    cancel_session(&mut db, &other, NOW).unwrap();
    undo_cancel(&mut db, &sid).unwrap();
    complete_session(&mut db, &sid, END).unwrap();
    let report = progress_summary(&db, DATE).unwrap();
    assert_eq!(report.current_week_volume, 243.0);
    assert_eq!(report.workout_streak_weeks, 1);
    assert_eq!(report.strength[0].estimated_1rm, 49.0);
    let history = last_sets(&db, None).unwrap();
    assert_eq!(history.len(), 2);
    assert!(revise_completed_set(&mut db, &sid, "skip", 40.0, 2, None, END).is_err());
    assert!(revise_completed_set(&mut db, &sid, "hold", 0.0, 2, None, END).is_err());
    delete_set(&mut db, "skip").unwrap();
    let detail = get_session(&db, &sid).unwrap().unwrap();
    assert_eq!(detail["exercises"][0]["sets"][0]["set_number"], 1);
    let weekly = weekly_volumes(&db, "2026-11-23", "2026-11-29").unwrap();
    assert_eq!(weekly[0]["volume"], 243.0);
    delete_completed_session(&mut db, &sid).unwrap();
    delete_completed_session(&mut db, &sid).unwrap();
    assert!(recent_sessions(&db, 5).unwrap().is_empty());
}
