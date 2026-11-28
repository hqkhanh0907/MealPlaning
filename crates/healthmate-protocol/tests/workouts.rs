use healthmate_protocol::{
    merge_snapshots, normalize, preserve_workout_coaching, restore_stored_workout,
    stored_workout_envelope, workout_wire_version,
};
use serde_json::{Value, json};

fn workout() -> Value {
    let schema: Value =
        serde_json::from_str(include_str!("../../../server/pb_hooks/sync-schema.json")).unwrap();
    let mut tables = serde_json::Map::new();
    for (name, _) in schema.as_object().unwrap() {
        tables.insert(name.clone(), json!([]));
    }
    tables["exercise"] = json!([{
        "id":"press","name":"Press","name_vi":"Đẩy ngực","muscle_group":"chest","category":"strength",
        "equipment":null,"instructions":null,"source":"manual","created_at":"2026-11-27"
    }]);
    tables["workout_session"] = json!([{
        "id":"session","date":"2026-11-27","training_plan_day_id":null,"training_day_name":null,
        "mode":"free","total_volume":999,"duration_minutes":null,"started_at":"2026-11-27","completed_at":null,
        "created_at":"2026-11-27","status":"active","cancelled_at":null,"origin":"free","place_id":"gym","source_session_id":null
    }]);
    tables["workout_exercise"] = json!([{
        "id":"entry","workout_session_id":"session","exercise_id":"press","sort_order":0,"total_volume":999,
        "planned_sets":null,"planned_min":null,"planned_max":null,"planned_rest":null,"original_exercise_id":null,
        "use_at_place":null,"next_weight_kg":45,"planned_notes":null,"completion_note":null
    }]);
    tables["workout_set"] = json!([{
        "id":"set","workout_exercise_id":"entry","set_number":1,"weight_kg":40,"reps":6,"rest_seconds":null,
        "effort":null,"notes":null,"created_at":"2026-11-27","updated_at":null,"status":"logged",
        "completed_at":null,"duration_seconds":null,"legacy_unit_unknown":0
    }]);
    json!({"schemaVersion":13,"tables":tables})
}

#[test]
fn derived_volume_and_conflict_choices_keep_both_devices_edits() {
    let original = normalize(&workout(), false).unwrap();
    assert_eq!(
        original["tables"]["workout_session"][0]["total_volume"],
        240
    );

    let mut tablet = original.clone();
    tablet["tables"]["workout_set"][0]["reps"] = json!(7);
    tablet["tables"]["workout_set"][0]["notes"] = json!("Keep this note");
    let mut phone = original.clone();
    phone["tables"]["workout_set"][0]["reps"] = json!(9);
    phone["tables"]["workout_set"][0]["weight_kg"] = json!(42.5);
    let conflict = merge_snapshots(Some(&original), &tablet, &phone, None).unwrap();
    let item = &conflict["items"][0];
    assert_eq!(item["exerciseName"], "Đẩy ngực");
    assert_eq!(item["local"], 7);
    assert_eq!(item["server"], 9);

    let choices = json!({(item["key"].as_str().unwrap()):"local"});
    let resolved = merge_snapshots(Some(&original), &tablet, &phone, Some(&choices)).unwrap();
    let tables = &resolved["snapshot"]["tables"];
    assert_eq!(tables["workout_set"][0]["notes"], "Keep this note");
    assert_eq!(tables["workout_set"][0]["weight_kg"], 42.5);
    assert_eq!(tables["workout_session"][0]["total_volume"], 297.5);
}

#[test]
fn older_client_writes_keep_the_place_and_clear_a_stale_load_recommendation() {
    let original = normalize(&workout(), false).unwrap();
    let saved = stored_workout_envelope(&original).unwrap();
    assert_eq!(saved["schemaVersion"], 12);
    assert_eq!(restore_stored_workout(&saved).unwrap(), original);

    let mut old = workout_wire_version(&original, 12).unwrap();
    assert!(old["tables"].get("workout_preference").is_none());
    old["tables"]["workout_set"][0]["reps"] = json!(8);
    let mut incoming = normalize(&old, false).unwrap();
    preserve_workout_coaching(&mut incoming, &original).unwrap();
    assert_eq!(incoming["tables"]["workout_session"][0]["place_id"], "gym");
    assert_eq!(
        incoming["tables"]["workout_exercise"][0]["next_weight_kg"],
        Value::Null
    );
    assert_eq!(
        incoming["tables"]["workout_session"][0]["total_volume"],
        320
    );
}
