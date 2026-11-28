use healthmate_domain::reminders::{Input, plan};
use serde_json::{Value, json};
fn actual(input: Value) -> Value {
    serde_json::to_value(plan(&serde_json::from_value::<Input>(input).unwrap())).unwrap()
}
fn flags() -> Value {
    json!({"notif_morning":1,"notif_lunch":1,"notif_evening":1,"notif_weekly":1})
}
#[test]
fn recurrence_encodes_local_clock_fields_without_synthesizing_seconds() {
    let days: Vec<_> = [6., 0., 6., -1., 7., 1.5]
        .into_iter()
        .map(|day| json!({"weekday":day,"rest":0,"exercises":1}))
        .chain([
            json!({"weekday":3,"rest":1,"exercises":1}),
            json!({"weekday":5,"rest":0,"exercises":0}),
        ])
        .collect();
    let result =
        actual(json!({"profile":flags(),"granted":true,"workoutEnabled":true,"days":days}));
    assert_eq!(
        result["cancelIds"],
        json!([101, 102, 103, 104, 151, 152, 153, 154, 155, 156, 157])
    );
    let rows = result["notifications"].as_array().unwrap();
    assert_eq!(
        rows.iter()
            .map(|r| r["id"].as_u64().unwrap())
            .collect::<Vec<_>>(),
        [101, 102, 103, 104, 151, 157]
    );
    assert_eq!(
        rows[0],
        json!({"id":101,"title":"Bữa sáng","body":"Hôm nay ăn gì? Ghi lại nhé.","schedule":{"on":{"hour":7,"minute":30},"repeats":true}})
    );
    assert_eq!(rows[1]["schedule"]["on"], json!({"hour":12,"minute":0}));
    assert_eq!(rows[2]["schedule"]["on"], json!({"hour":18,"minute":30}));
    assert_eq!(
        rows[3]["schedule"]["on"],
        json!({"hour":20,"minute":0,"weekday":1})
    );
    assert_eq!(
        rows[4]["schedule"]["on"],
        json!({"hour":17,"minute":30,"weekday":1})
    );
    assert_eq!(
        rows[5]["schedule"]["on"],
        json!({"hour":17,"minute":30,"weekday":7})
    );
}
#[test]
fn absence_permission_and_opt_out_control_both_kinds_of_reminder() {
    let day = json!([{"weekday":2,"rest":0,"exercises":3}]);
    for (profile, granted) in [(Value::Null, true), (flags(), false)] {
        let result =
            actual(json!({"profile":profile,"granted":granted,"workoutEnabled":true,"days":day}));
        assert_eq!(result["notifications"], json!([]));
        assert_eq!(result["cancelIds"].as_array().unwrap().len(), 11);
    }
    let result = actual(
        json!({"profile":{"notif_morning":0,"notif_lunch":0,"notif_evening":-1,"notif_weekly":null},"granted":true,"workoutEnabled":false,"days":day}),
    );
    assert_eq!(result["notifications"].as_array().unwrap().len(), 1);
    assert_eq!(result["notifications"][0]["id"], 103);
}

#[test]
fn every_training_weekday_keeps_its_package_id_and_capacitor_weekday() {
    let days: Vec<_> = (0..7)
        .rev()
        .map(|weekday| json!({"weekday":weekday,"rest":0,"exercises":1}))
        .collect();
    let result = actual(json!({"profile":{},"granted":true,"workoutEnabled":true,"days":days}));
    let rows = result["notifications"].as_array().unwrap();
    assert_eq!(rows.len(), 7);
    for (day, row) in rows.iter().enumerate() {
        assert_eq!(
            row,
            &json!({"id":151+day,"title":"Nhắc buổi tập","body":"Mở ứng dụng để xem lịch hôm nay.",
            "schedule":{"on":{"hour":17,"minute":30,"weekday":day+1},"repeats":true}})
        );
    }
}
