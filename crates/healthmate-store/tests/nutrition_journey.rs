use healthmate_store::{
    initialize,
    management::{self, Portion},
    meals, profile,
};
use rusqlite::Connection;
use serde_json::json;

#[test]
fn changing_a_recipe_keeps_the_logged_meal_until_servings_are_edited() {
    let mut db = Connection::open_in_memory().unwrap();
    initialize(&mut db).unwrap();
    let input = json!({"name":"Cơm","category":"Ngũ cốc & Tinh bột","calories":100,"protein":4,"carbs":20,"fat":1,"fiber":2});
    let rice = management::save_ingredient(&db, None, &input).unwrap();
    let dish = management::save_dish(
        &mut db,
        None,
        &json!({"name":"Cơm hai phần","servings":2}),
        &[Portion {
            ingredient_id: rice.clone(),
            gram_weight: 200.,
        }],
    )
    .unwrap();
    let id = meals::plan(&mut db, "2026-11-28", "lunch", &dish, 1.5).unwrap();
    let day = meals::day(&db, "2026-11-28").unwrap().unwrap();
    assert_eq!(day["meal_slots"].as_array().unwrap().len(), 4);
    assert_eq!(
        day["meal_slots"][1]["planned_dishes"][0]["effective_calories"],
        150.
    );
    assert!(management::delete_dish(&db, &dish).is_err());
    meals::set_completed(&mut db, &id, true).unwrap();
    management::save_ingredient(&db, Some(&rice), &json!({"calories":200})).unwrap();
    meals::set_completed(&mut db, &id, true).unwrap();
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 150.);
    meals::set_servings(&mut db, &id, 2.).unwrap();
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 400.);
    meals::set_completed(&mut db, &id, false).unwrap();
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 0);
    assert!(meals::plan(&mut db, "2026-02-30", "dinner", &dish, 1.).is_err());
    assert!(meals::day(&db, "2026-02-30").unwrap().is_none());
    assert!(
        management::save_dish(
            &mut db,
            Some(&dish),
            &json!({"name":"Invalid","servings":2}),
            &[Portion {
                ingredient_id: "missing".into(),
                gram_weight: 10.
            }]
        )
        .is_err()
    );
    assert_eq!(
        meals::dish(&db, &dish).unwrap().unwrap()["name"],
        "Cơm hai phần"
    );
}

#[test]
fn onboarding_retries_preserve_the_existing_profile_and_measurements_update_once() {
    let mut db = Connection::open_in_memory().unwrap();
    initialize(&mut db).unwrap();
    let data = json!({"birth_date":"1995-03-01","height_cm":170,"weight_kg":70,"gender":"male","goal":"maintain","fitness_level":"beginner","activity_factor":1.2,"bmr":1600,"tdee":1920,"target_calories":2000,"target_protein":110,"theme":"light","onboarding_completed":1});
    let owner = profile::save(&mut db, &data).unwrap();
    assert_eq!(
        profile::save(&mut db, &json!({"invalid":true})).unwrap(),
        owner
    );
    profile::update(&mut db, &json!({"weight_kg":68})).unwrap();
    assert_eq!(profile::get(&db).unwrap().unwrap()["weight_kg"], 68.);
    assert_eq!(profile::weight_log(&db, None).unwrap()[0]["weight_kg"], 68.);
    assert!(profile::update(&mut db, &json!({"id":"cross-profile"})).is_err());
    assert!(profile::update(&mut db, &json!({"birth_date":"2035-01-31"})).is_err());
    assert_eq!(
        profile::get(&db).unwrap().unwrap()["birth_date"],
        "1995-03-01"
    );
}

#[test]
fn photo_logging_is_atomic_and_replaying_one_capture_does_not_duplicate_a_meal() {
    use healthmate_store::{calendar, photo};
    let mut db = Connection::open_in_memory().unwrap();
    initialize(&mut db).unwrap();
    let portions:Vec<photo::PhotoPortion>=serde_json::from_value(json!([{"item":{"name":"Cơm","estimatedGrams":50,"calories":65,"protein":1,"carbs":12,"fat":1,"fiber":0.5},"grams":100}])).unwrap();
    for _ in 0..2 {
        photo::log(&mut db, "capture-one", "2026-11-28", "snack", &portions).unwrap();
    }
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 130.);
    let id: String = db
        .query_row("SELECT id FROM planned_dish", [], |r| r.get(0))
        .unwrap();
    let deleted = calendar::delete(&mut db, &id).unwrap().unwrap();
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 0);
    calendar::restore_deleted(&mut db, &deleted).unwrap();
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 130.);
    assert_eq!(
        calendar::copy_to_empty_day(&mut db, "2026-11-28", "2026-11-29").unwrap(),
        1
    );
    assert_eq!(
        calendar::copy_to_empty_day(&mut db, "2026-11-28", "2026-11-29").unwrap(),
        0
    );
    assert_eq!(meals::totals(&db, "2026-11-29").unwrap()["calories"], 0);
    let item = calendar::Item {
        meal_type: "dinner".into(),
        dish_id: "capture-one".into(),
        servings: 2.,
    };
    calendar::replace_plan(&mut db, "2026-11-28", &[item]).unwrap();
    assert_eq!(meals::totals(&db, "2026-11-28").unwrap()["calories"], 130.);
    assert!(photo::log(&mut db, "bad-date", "broken-date", "snack", &portions).is_err());
    assert!(
        !db.query_row(
            "SELECT EXISTS(SELECT 1 FROM dish WHERE id='bad-date')",
            [],
            |r| r.get::<_, bool>(0)
        )
        .unwrap()
    );
}
