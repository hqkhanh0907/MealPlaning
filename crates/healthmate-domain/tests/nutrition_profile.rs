use healthmate_domain::{dates::*, nutrition::*, profile::*};

fn date(s: &str) -> NaiveDate {
    parse_local_date(s).unwrap()
}
fn person(goal: Goal) -> RecalcInput {
    RecalcInput {
        weight_kg: 70.0,
        height_cm: 175.0,
        age: 30.0,
        gender: Gender::Male,
        goal,
        activity_factor: 1.55,
    }
}

#[test]
fn strict_local_dates_and_february_anniversaries() {
    for (birth, today, age) in [
        ("1996-11-24", "2026-01-01", 29),
        ("1996-11-24", "2026-11-23", 29),
        ("1996-11-24", "2026-11-24", 30),
        ("2000-02-29", "2025-02-27", 24),
        ("2000-02-29", "2025-02-28", 25),
        ("2000-02-29", "2024-02-28", 23),
        ("2000-02-29", "2024-02-29", 24),
    ] {
        assert_eq!(age_on_date(Some(birth), date(today)), Some(age));
    }
    for bad in [
        "2026-02-29",
        "2026-03-01T00:00:00Z",
        "2026-3-01",
        "2026-11-25",
        "",
        "２０２６-11-22",
    ] {
        assert_eq!(age_on_date(Some(bad), date("2026-11-24")), None);
    }
    assert_eq!(week_dates("2024-02-26").last(), Some(&date("2024-03-03")));
    assert_eq!(monday_of_week(date("2026-01-04")), Some(date("2025-12-29")));
}

#[test]
fn measured_ranges_and_targets_preserve_editor_boundaries() {
    for (key, samples) in [
        (Measurement::HeightCm, &[100.0, 129.0, 170.5, 250.0][..]),
        (Measurement::WeightKg, &[30.0, 65.2, 201.0, 300.0]),
        (Measurement::Age, &[10.0, 12.0, 18.0, 120.0]),
    ] {
        for &v in samples {
            assert_eq!(body_measurement_error(key, Some(v)), None);
        }
        for v in [None, Some(f64::NAN), Some(f64::INFINITY)] {
            assert!(body_measurement_error(key, v).is_some());
        }
    }
    assert_eq!(
        body_measurement_error(Measurement::Age, Some(30.5)),
        Some("Nhập tuổi theo số năm tròn.")
    );
    assert!(serde_json::from_str::<Gender>("\"other\"").is_err());
    assert_eq!(
        birth_date_error("", date("2026-11-24")),
        Some("Vui lòng nhập ngày sinh.")
    );
    assert!(valid_manual_target(Target::Calories, Some(800.0)));
    assert!(!valid_manual_target(Target::Calories, Some(799.99)));
    assert!(valid_manual_target(Target::Protein, Some(400.0)));
    assert!(!valid_manual_target(Target::Protein, Some(0.0)));
    assert!(valid_manual_target(Target::Carbs, None));
    assert!(valid_manual_target(Target::Fat, Some(0.0)));
}

#[test]
fn profile_energy_uses_existing_age_bmi_and_goal_limits() {
    let p = person(Goal::Maintain);
    let target = recalc_targets(&p);
    assert_eq!(
        (
            target.bmr,
            target.tdee,
            target.target_calories,
            target.target_protein
        ),
        (1649.0, 2556.0, 2556.0, 112.0)
    );
    for factor in [f64::NAN, 1.4, 0.0] {
        assert_eq!(
            recalc_targets(&RecalcInput {
                activity_factor: factor,
                ..p
            }),
            target
        );
    }
    assert_eq!(
        recalc_targets(&RecalcInput {
            activity_factor: 1.375,
            ..p
        })
        .tdee,
        2267.0
    );
    assert_eq!(
        recalc_targets(&RecalcInput {
            activity_factor: 1.725,
            ..p
        })
        .tdee,
        2845.0
    );
    let loss = RecalcInput {
        weight_kg: 60.0,
        height_cm: 165.0,
        age: 28.0,
        gender: Gender::Female,
        goal: Goal::LoseWeight,
        activity_factor: 1.2,
    };
    let calculated = recalc_targets(&loss);
    assert_eq!(
        (
            calculated.bmr,
            calculated.tdee,
            calculated.target_calories,
            calculated.target_protein
        ),
        (1330.0, 1596.0, 0.0, 132.0)
    );
    let older = recalc_targets(&RecalcInput {
        weight_kg: 50.0,
        height_cm: 150.0,
        age: 65.0,
        ..loss
    });
    assert_eq!(
        (older.bmr, older.tdee, older.target_calories),
        (952.0, 1142.0, 0.0)
    );
    for age in [13.0, 18.0, 79.0, 120.0] {
        let out = recalc_targets(&RecalcInput { age, ..loss });
        assert_eq!(out.bmr, 0.0);
        assert!(out.energy_note.unwrap().contains("19 đến 78"));
    }
    assert_eq!(
        recalc_targets(&RecalcInput {
            weight_kg: 200.0,
            goal: Goal::GainMuscle,
            ..p
        })
        .target_protein,
        0.0
    );
    assert_eq!(
        calculate_target_calories(1700.0, Goal::LoseWeight, 80.0, 180.0),
        0.0
    );
    assert_eq!(
        calculate_target_calories(1701.0, Goal::LoseWeight, 80.0, 180.0),
        1201.0
    );
    assert_eq!(
        calculate_target_calories(2600.0, Goal::LoseWeight, 74.0, 200.0),
        0.0
    );
}

#[test]
fn manual_modes_and_missing_mode_history_survive_measurement_edits() {
    let base = person(Goal::Maintain);
    let next = recalc_targets(&RecalcInput {
        weight_kg: 80.0,
        ..base
    });
    let legacy = automatic_target_update(
        &base,
        SavedTargets {
            target_calories: 2556.0,
            target_protein: 125.0,
            ..Default::default()
        },
        &next,
    );
    assert_eq!(legacy.target_calories, Some(next.target_calories));
    assert_eq!(legacy.target_protein, None);
    let profile:MeasurementProfile=serde_json::from_value(serde_json::json!({
        "birth_date":"1996-11-24","gender":"male","height_cm":175,"weight_kg":70,"activity_factor":1.55,"goal":"maintain",
        "bmr":1649,"tdee":2556,"target_calories":2556,"target_protein":125,"target_carbs":null,"target_fat":null
    })).unwrap();
    let mut patch = ProfilePatch {
        weight_kg: Some(80.0),
        ..Default::default()
    };
    validate_profile_changes(&patch, Some(&profile), date("2026-11-24")).unwrap();
    let changed = update_measurement_targets(&profile, patch.clone(), date("2026-11-24")).unwrap();
    assert_eq!(changed.target_calories, Some(next.target_calories));
    assert_eq!(changed.target_protein, None);
    patch.protein_target_mode = Some(TargetMode::Auto);
    assert_eq!(
        update_measurement_targets(&profile, patch, date("2026-11-24"))
            .unwrap()
            .target_protein,
        Some(next.target_protein)
    );
    let clear: ProfilePatch =
        serde_json::from_str(r#"{"birth_date":null,"target_fat":null}"#).unwrap();
    assert!(validate_profile_changes(&clear, Some(&profile), date("2026-11-24")).is_err());
    assert_eq!(
        serde_json::to_value(&clear).unwrap(),
        serde_json::json!({"birth_date":null,"target_fat":null})
    );
}

#[test]
fn portions_and_logged_snapshots_are_independent_of_later_recipe_changes() {
    let amount = NutritionTotals {
        calories: 400.,
        protein: 32.,
        carbs: 40.,
        fat: 12.,
        fiber: 4.,
    };
    assert_eq!(
        ingredient_portion(amount, 25.),
        scale_nutrition(amount, 0.25)
    );
    assert_eq!(
        portion_nutrition(amount, 160., 80.),
        scale_nutrition(amount, 0.5)
    );
    assert_eq!(per_serving(amount, Some(0.)), amount);
    assert_eq!(
        PlannedNutrition::Planned {
            per_serving: per_serving(amount, Some(2.0)),
            servings: 1.5
        }
        .totals(),
        scale_nutrition(amount, 0.75)
    );
    assert_eq!(
        PlannedNutrition::Completed { snapshot: amount }.totals(),
        amount
    );
    for invalid in [0., -1., f64::INFINITY, f64::NAN] {
        assert_eq!(percent_of_nutrition_target(2., invalid), None);
    }
    assert_eq!(percent_of_nutrition_target(-1., 2.), Some(0.));
    assert_eq!(percent_of_nutrition_target(3., 2.), Some(150.));
    assert!(valid_photo_name(&"🍊".repeat(40)));
    assert!(!valid_photo_name(&"🍊".repeat(41)));
    assert!(!valid_photo_name("\u{FEFF} \t"));
    assert!(!valid_photo_grams(0.0));
    assert!(valid_photo_grams(2000.0));
    assert!(!valid_photo_grams(2001.0));
    assert_eq!(round_suggested_servings(0.75), 1.0);
    assert_eq!(round_suggested_servings(3.4), 3.0);
    assert!(valid_planned_servings(0.1));
    assert!(!valid_planned_servings(0.099));
    assert!(valid_planned_servings(20.));
    assert!(!valid_planned_servings(20.1));
}
