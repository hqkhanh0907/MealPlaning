use super::model::*;
use serde_json::json;

#[test]
fn set_history_preserves_skips_seconds_and_each_hand_load() {
    let timed:SetRow=serde_json::from_value(json!({"id":"a","set_number":2,"status":"logged","weight_kg":0,"reps":0,"duration_seconds":45})).unwrap();
    assert_eq!(timed.value("plank"), "45 giây");
    let paired: SetRow = serde_json::from_value(
        json!({"id":"b","set_number":1,"status":"logged","weight_kg":25,"reps":6}),
    )
    .unwrap();
    assert_eq!(paired.value("biceps-curl"), "12,5 kg mỗi tay × 6 lần");
    assert_eq!(duration(Some(65)), "1 giờ 5 phút");
    assert_eq!(duration(None), "—");
}

#[test]
fn vietnamese_workout_numbers_round_to_two_optional_decimals() {
    assert_eq!(number(12345.678), "12.345,68");
    assert_eq!(number(40.125), "40,13");
    assert_eq!(number(8.50), "8,5");
    assert_eq!(number(0.), "0");
}

#[test]
fn search_ranks_primary_before_secondary_and_distinguishes_unknown_equipment() {
    use super::discovery::{Entry, Filters, select};
    let rows:Vec<Entry>=serde_json::from_value(json!([
        {"id":"secondary","primary":[],"secondary":["chest"],"required":[],"equipment":["no-equipment"],"searchTerms":["day ta"]},
        {"id":"primary","primary":["chest"],"secondary":[],"required":["dumbbell"],"equipment":["dumbbell"],"searchTerms":["day ta"]},
        {"id":"unknown","primary":["chest"],"secondary":[],"required":null,"equipment":[],"searchTerms":["day ta"]},
        {"id":"primary","primary":["chest"],"secondary":[],"required":["dumbbell"],"equipment":["dumbbell"],"searchTerms":["day ta"]}
    ])).unwrap();
    let mut f: Filters = serde_json::from_value(
        json!({"query":"day","muscle":"chest","gear":null,"available":["hex-dumbbell"]}),
    )
    .unwrap();
    assert_eq!(
        select(&rows, &f),
        [(1, Some("primary")), (0, Some("secondary"))]
    );
    f.available = None;
    assert_eq!(select(&rows, &f).len(), 3);
    f.gear = Some("no-equipment".into());
    assert_eq!(select(&rows, &f), [(0, Some("secondary"))]);
}

#[test]
fn renderers_cover_legacy_waiting_plan_replay_and_library_states() {
    use leptos::prelude::*;
    fn state<T: serde::de::DeserializeOwned + Send + Sync + 'static>(
        v: serde_json::Value,
    ) -> ReadSignal<T> {
        signal(serde_json::from_value::<T>(v).unwrap()).0
    }
    Owner::new().with(||{
        let send=UnsyncCallback::new(|_|{});
        let today=state(json!({"loading":false,"error":null,"success":null,"progress":true,"undo":true,"current":null,"plan":false,"day":null}));
        let view=super::schedule::today(today,send).to_html();
        assert!(view.contains("Hoàn tác hủy buổi tập")&&view.contains("Bắt đầu tập tự do"));
        let week=state(json!({"plan":{"id":"p","name":"Lịch","frequency":3,"planned_exercises":1,"days":[{"id":"a","name":"Nghỉ","day_of_week":0,"is_rest_day":1,"exercises":[]}]},"selected":"a","loading":false,"busy":false,"active":true}));
        let html=super::schedule::week(week,send).to_html();
        assert!(html.contains("Chủ nhật: Nghỉ")&&!html.contains("Tập buổi này"));
        let logger=state(json!({"exercise":"biceps-curl","busy":false,"draft":{"weightKg":"","reps":"10","restSeconds":"0","notes":"","effort":null},"rows":[{"id":"old","status":"logged","set_number":1,"weight_kg":12.5,"reps":8,"legacy_unit_unknown":1}]}));
        assert!(super::logger::entry(logger,send).to_html().contains("Tạ mỗi tay (kg)"));
        assert!(super::logger::effort(logger,send).to_html().contains("Mức gắng sức"));
        assert!(super::logger::rows(logger,send).to_html().contains("12,5 kg · 8 (bản cũ chưa ghi đơn vị)"));
        assert!(!super::logger::actions(logger,send).to_html().contains("Lặp hiệp"));
        let tabs=state(json!({"selected":"e","rows":[{"id":"e","name":"Đẩy tạ","states":["logged","skipped"]}]}));
        assert!(super::logger::tabs(tabs,send).to_html().contains("1 hiệp đã ghi · 1 bỏ qua"));
        let history=state(json!({"id":"s","date":"2026-11-28","dateLabel":"28 thg 11","title":null,"mode":"free","volume":75,"minutes":62,"exercises":[{"id":"plank","name":"Plank","unit":null,"note":null,"sets":[]}],"busy":false,"active":true,"preview":{"place":"Tại nhà","exercises":[{"name":"Squat","note":"Cần tạ"}]}}));
        assert!(super::history::summary(history,send).to_html().contains("hiệp đã ghi"));
        assert!(super::history::replay(history,send).to_html().contains("Tiếp tục buổi đang tập"));
        assert!(super::history::details(history,send).to_html().contains("Chưa ghi hiệp nào."));
        let trend=state(json!({"open":true,"error":false,"weeks":[],"stats":{"currentWeekVolume":1500,"previousWeekVolume":0,"workoutStreakWeeks":1,"weeklyAvgWeightKg":65,"weightSource":"profile","volumeByMuscle":[],"strength":[]}}));
        assert!(super::trend::view(trend,send).to_html().contains("1.500 kg"));
        let library=state(json!({"total":2,"embedded":true,"query":"","filtered":false,"known":false,"place":"Nhà","group":null,"rows":[{"id":"a","name":"Squat","match":null,"equipment":null}]}));
        let html=super::library::view(library,send).to_html();
        assert!(html.contains("Chưa xác định dụng cụ")&&html.contains("Xem thêm bài tập"));
    });
}
