use super::model::*;
use serde_json::json;

#[test]
fn catalog_filters_without_reordering_and_names_query_and_category_empty_states() {
    let mut data: Catalog = serde_json::from_value(json!({"tab":"ingredients","filter":"Rau củ","query":"","loading":false,"failed":false,"categories":["Tất cả","Rau củ"],"rows":[
        {"id":"z","name":"Ớt","category":"Rau củ","source":"db"},
        {"id":"k","name":"Khoai","category":"Rau củ","source":"custom"},
        {"id":"m","name":"Mỡ","category":"Khác","source":"ai"}]})).unwrap();
    assert_eq!(
        data.visible()
            .iter()
            .map(|r| r.id.as_str())
            .collect::<Vec<_>>(),
        ["z", "k"]
    );
    assert_eq!(
        data.hint(2).as_deref(),
        Some("2 nguyên liệu trong “Rau củ”")
    );
    data.filter = "Trái cây".into();
    assert_eq!(data.empty().0, "Không có nguyên liệu trong nhóm này");
    data.query = "  đậu  ".into();
    assert_eq!(data.empty().0, "Không tìm thấy nguyên liệu nào");
    assert!(!data.show_categories());
}

#[test]
fn dish_uses_each_row_weight_per_serving_and_preserves_fiber_and_fallback() {
    let mut dish:Dish=serde_json::from_value(json!({"servings":2,"target":50,"loading":false,"errors":[],
        "rows":[{"id":"one","name":"Trứng","grams":50,"nutrition":{"calories":200,"protein":16,"carbs":8,"fat":6,"fiber":2}},
        {"id":"two","name":"Khác","grams":100,"nutrition":null}]})).unwrap();
    let p = dish.preview();
    assert_eq!(
        (p.totals.calories, p.totals.fiber, p.percent, p.state),
        (50., 0.5, 100., "with-target")
    );
    dish.servings = None;
    dish.target = 0.;
    assert_eq!(dish.preview().totals.calories, 100.);
    assert_eq!(dish.preview().state, "no-target");
    dish.rows.clear();
    assert_eq!(dish.preview().state, "empty");
}

#[test]
fn optional_ingredient_values_keep_individual_errors_before_combined_macros() {
    let mut form = Ingredient {
        category: String::new(),
        values: [None; 5],
        submitted: false,
    };
    assert_eq!(form.error(0), "");
    form.submitted = true;
    assert_eq!(form.error(0), "Vui lòng chọn nhóm nguyên liệu");
    assert_eq!(form.error(1), "");
    form.values = [Some(1001.), Some(70.), Some(30.), Some(1.), Some(101.)];
    assert_eq!(form.error(1), "Calories không được vượt 1000 kcal/100g");
    assert_eq!(form.error(5), "Fiber không được vượt 100 g/100g");
    form.values[0] = None;
    assert_eq!(
        form.error(1),
        "Protein + Carbs + Fat trên 100 g không được vượt 100 g."
    );
    form.values[1] = Some(-1.);
    assert_eq!(form.error(1), "");
    assert_eq!(form.error(2), "Protein không được nhỏ hơn 0");
}

#[test]
fn real_editors_render_labels_and_the_original_empty_states() {
    use leptos::prelude::*;
    Owner::new().with(||{
        let action=UnsyncCallback::new(|_|{});
        let (catalog,_)=signal(serde_json::from_value(json!({"tab":"dishes","query":"x","filter":"Tất cả","rows":[],"categories":[],"loading":false,"failed":false})).unwrap());
        let (ingredient,_)=signal(Ingredient{category:String::new(),values:[None;5],submitted:true});
        let (dish,_)=signal(Dish{servings:Some(2.),target:1800.,errors:vec![],rows:vec![],loading:false});
        assert!(super::catalog::view(catalog,action).to_html().contains("Không tìm thấy món ăn nào"));
        assert!(super::ingredient::view(ingredient,action).to_html().contains("Vui lòng chọn nhóm nguyên liệu"));
        assert!(super::dish::items(dish,action).to_html().contains("Thêm nguyên liệu đầu tiên"));
        assert!(super::dish::hero(dish).to_html().contains("Chưa có dữ liệu"));
    });
}
