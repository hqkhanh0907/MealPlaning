use serde_json::{Value, json};
fn fixture() -> Value {
    serde_json::from_str(include_str!("../tests/base.json")).unwrap()
}
fn output(value: Value) -> (String, String) {
    super::render_snapshot(&value.to_string()).unwrap()
}

#[test]
fn loading_error_and_ready_are_exclusive() {
    let mut v = fixture();
    v["loading"] = true.into();
    v["refreshFailed"] = true.into();
    let (a, _) = output(v.clone());
    assert!(a.contains("Đang cập nhật số liệu…"));
    assert!(!a.contains("Thử lại"));
    assert!(!a.contains("Hôm nay"));
    v["loading"] = false.into();
    let (a, _) = output(v);
    assert!(a.contains("Không thể tải số liệu tổng quan."));
    assert!(a.contains("Thử lại"));
    assert!(!a.contains("Hôm nay"));
}
#[test]
fn ready_keeps_semantic_links_and_missing_states() {
    let (a, f) = output(fixture());
    assert!(f.is_empty() || !f.contains("Lưu vào nhật ký"));
    for text in [
        "Hôm nay",
        "Đã ăn",
        "Theo lịch cả ngày",
        "Dinh dưỡng theo lịch",
        "Chuỗi theo dõi và cân nặng",
        "Cân nặng gần nhất",
        "Mở lịch ăn",
        "Thêm món",
    ] {
        assert!(a.contains(text), "{text}");
    }
    assert!(!a.contains("macro-item--"));
    assert!(!a.contains("ai-insight-title"));
    assert!(!a.contains("Tính đến hôm qua"));
    assert!(a.contains("Bạn vẫn có thể ghi bữa ăn."));
    let mut v = fixture();
    v["pendingMeal"] = json!({"date":"2026-10-02","mealType":"lunch","plannedDishId":"dish-7"});
    v["hasNutritionData"] = true.into();
    v["macroRows"] = json!([{"metric":"protein","label":"Protein","target":90,"valueLabel":"50 g","targetLabel":"90 g","percentLabel":"56%","progressCss":"56%"}]);
    v["nutritionStreakDays"] = 0.into();
    let (a, _) = output(v);
    assert!(a.contains("Bữa trưa chưa ghi"));
    assert!(a.contains("macro-item--protein"));
    assert!(a.contains("Mục tiêu 90 g"));
    assert!(a.contains("Tính đến hôm qua"));
}
#[test]
fn insights_precedence_permissions_and_safe_text() {
    let mut v = fixture();
    v["insight"] = json!({"title":"Nhận xét theo dữ liệu","body":"Ít năng lượng","ctaLabel":"Mở lịch","ctaRoute":"/tabs/calendar","tone":"warning"});
    let (a, _) = output(v.clone());
    assert!(a.contains("Nhận xét theo dữ liệu"));
    assert!(a.contains("ai-card--warning"));
    v["dailyAiInsight"] = json!({"title":"<script>alert(0)</script>","body":"Đã tạo từ dữ liệu","action":"Kiểm tra","tone":"info"});
    v["online"] = false.into();
    v["textIssue"] = "Cần kết nối mạng để dùng AI".into();
    v["photoError"] = "Lỗi ảnh thử".into();
    let (a, _) = output(v);
    assert!(!a.contains("<script>"));
    assert!(!a.contains("Nhận xét theo dữ liệu"));
    assert!(a.contains("Đã tạo từ dữ liệu"));
    assert!(a.contains("ai-offline-banner"));
    assert!(a.contains("Ghi món thủ công"));
    assert!(a.contains("Lỗi ảnh thử"));
}
#[test]
fn captured_review_validates_each_item_and_keeps_footer_separate() {
    let mut v = fixture();
    v["photoSaving"] = true.into();
    v["photoDraft"] = json!({"captureId":"p1","dateLabel":"02/10/2026","mealType":"lunch","imageQualityWarning":"Ảnh tối","portions":[
        {"included":true,"name":" ","grams":2001,"confidence":"low","warning":"Mờ","nutritionLabel":""},
        {"included":true,"name":"Cá","grams":62.5,"confidence":"high","warning":null,"nutritionLabel":"123 kcal · Protein 13 g · Carbs 0 g · Fat 5 g"},
        {"included":false,"name":"Bánh","grams":null,"confidence":"low","warning":null,"nutritionLabel":""}]});
    let (a, f) = output(v);
    for s in [
        "Kiểm tra món và khẩu phần",
        "02/10/2026",
        "Ảnh tối",
        "photo-name-error-0",
        "photo-hint-0",
        "Nhập khối lượng lớn hơn 0 và tối đa 2.000 g.",
        "AI chưa chắc về mục này.",
        "123 kcal",
        "Bỏ qua khi lưu",
    ] {
        assert!(a.contains(s), "{s}");
    }
    assert!(!a.contains("photo-name-2"));
    assert!(!a.contains("Chụp hoặc chọn ảnh món ăn"));
    assert!(f.contains("Đang lưu…"));
    assert!(f.contains("Xác nhận khẩu phần từ ảnh"));
}
