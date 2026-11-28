use healthmate_domain::{dates::parse_local_date, fitness::*, progress::*, recommendation::*};
use serde::Deserialize;
use std::collections::BTreeMap;
fn logged(kg: f64, reps: u32) -> RecordedSet {
    RecordedSet {
        weight_kg: kg,
        reps,
        status: SetStatus::Logged,
        effort: Some(Effort::Easy),
        duration_seconds: None,
        legacy_unit_unknown: false,
    }
}
#[test]
fn typed_and_timed_measurements_and_prescriptions_match_ts() {
    let s = WorkoutSetInput {
        weight_kg: 500.,
        reps: 100.,
        rest_seconds: 600.,
        duration_seconds: None,
    };
    assert_eq!(workout_set_issue("squat", &s), None);
    for (set, issue) in [
        (
            WorkoutSetInput {
                duration_seconds: Some(10.),
                ..s
            },
            SetIssue::Reps,
        ),
        (
            WorkoutSetInput {
                weight_kg: 500.01,
                ..s
            },
            SetIssue::Weight,
        ),
        (
            WorkoutSetInput {
                rest_seconds: -1.,
                ..s
            },
            SetIssue::Rest,
        ),
        (
            WorkoutSetInput {
                weight_kg: f64::NAN,
                ..s
            },
            SetIssue::Weight,
        ),
    ] {
        assert_eq!(workout_set_issue("squat", &set), Some(issue));
    }
    let t = WorkoutSetInput {
        weight_kg: 0.,
        reps: 0.,
        duration_seconds: Some(86400.),
        ..s
    };
    assert_eq!(workout_set_issue("plank", &t), None);
    for st in [
        WorkoutSetInput { reps: 1., ..t },
        WorkoutSetInput {
            duration_seconds: Some(86401.),
            ..t
        },
    ] {
        assert_eq!(workout_set_issue("plank", &st), Some(SetIssue::Duration));
    }
    assert_eq!(default_training_range("squat"), (8, 12));
    assert_eq!(default_training_range("plank"), (30, 45));
    let x = normalize_training_prescription(TrainingPrescription {
        sets: 14.,
        reps_min: 14.4,
        reps_max: 6.,
        rest_seconds: 2.,
    });
    assert_eq!(
        (x.sets, x.reps_min, x.reps_max, x.rest_seconds),
        (10., 14., 14., 30.)
    );
    let bad = normalize_training_prescription(TrainingPrescription {
        sets: f64::NAN,
        reps_min: 11.,
        reps_max: f64::NAN,
        rest_seconds: f64::INFINITY,
    });
    assert_eq!(
        (bad.sets, bad.reps_min, bad.reps_max, bad.rest_seconds),
        (1., 11., 1., 30.)
    );
}
#[test]
fn coaching_rejects_unknown_units_and_uses_cascading_collision_rules() {
    let eligible = vec![logged(40., 7), logged(40., 7)];
    assert_eq!(
        progression_load("squat", Some(6), Some(2), &eligible),
        Some(40.)
    );
    assert_eq!(progression_load("plank", Some(6), Some(2), &eligible), None);
    let base = &eligible[1];
    for invalid in [
        RecordedSet {
            status: SetStatus::Skipped,
            ..base.clone()
        },
        RecordedSet {
            weight_kg: 41.,
            ..base.clone()
        },
        RecordedSet {
            effort: Some(Effort::Hard),
            ..base.clone()
        },
        RecordedSet {
            legacy_unit_unknown: true,
            ..base.clone()
        },
        RecordedSet {
            duration_seconds: Some(30),
            ..base.clone()
        },
    ] {
        assert_eq!(
            progression_load("squat", Some(6), Some(2), &[eligible[0].clone(), invalid]),
            None
        );
    }
    assert!(valid_next_load(true, Some(40.), Some(42.5)));
    assert!(!valid_next_load(true, Some(40.), Some(40.)));
    let f = |ids: &[&str], rules: &[(&str, &str)]| {
        let sources = ids
            .iter()
            .map(|id| MovementSource {
                exercise_id: (*id).into(),
                original_exercise_id: None,
            })
            .collect::<Vec<_>>();
        let map: BTreeMap<_, _> = rules
            .iter()
            .map(|(s, t)| ((*s).into(), (*t).into()))
            .collect();
        venue_movements(&sources, &map)
            .into_iter()
            .map(|v| v.exercise_id)
            .collect::<Vec<_>>()
    };
    assert_eq!(
        f(&["press", "fly"], &[("press", "fly"), ("fly", "press")]),
        ["fly", "press"]
    );
    assert_eq!(
        f(&["press", "fly"], &[("press", "row"), ("fly", "row")]),
        ["press", "fly"]
    );
    assert_eq!(
        f(
            &["press", "fly", "row"],
            &[("press", "fly"), ("fly", "row")]
        ),
        ["press", "fly", "row"]
    );
    assert_eq!(
        f(&["press", "fly"], &[("press", "fly"), ("fly", "row")]),
        ["fly", "row"]
    );
}
#[test]
fn recommendations_match_all_fields_of_typescript_reference_outputs() {
    #[derive(Deserialize)]
    struct Case {
        name: String,
        input: WorkoutPreferences,
        expected: WorkoutRecommendation,
    }
    let cases: Vec<Case> =
        serde_json::from_str(include_str!("workout-recommendations.json")).unwrap();
    for case in cases {
        let actual = recommend_workout(&case.input);
        assert_eq!(actual, case.expected, "{}", case.name);
        if case.name == "home" {
            let days = &actual.plans[0].days;
            assert_eq!(workout_draft_issue(&case.input, days), None);
            for invalid in [
                WorkoutPreferences {
                    age: Some(17.),
                    ..case.input.clone()
                },
                WorkoutPreferences {
                    equipment: None,
                    ..case.input.clone()
                },
                WorkoutPreferences {
                    weekdays: vec![3.0, 6.0],
                    ..case.input.clone()
                },
                WorkoutPreferences {
                    minutes: 15.0,
                    ..case.input.clone()
                },
                WorkoutPreferences {
                    frequency: Some(3.0),
                    ..case.input.clone()
                },
                WorkoutPreferences {
                    avoid: Some(Avoid::Movements(vec!["push-h".into()])),
                    ..case.input.clone()
                },
            ] {
                assert!(workout_draft_issue(&invalid, days).is_some())
            }
        }
    }
}

#[test]
fn progress_aggregates_only_eligible_sets_and_uses_local_calendar_windows() {
    let date = |s| parse_local_date(s).unwrap();
    let maxed = RecordedSet {
        effort: Some(Effort::Maxed),
        ..logged(40., 6)
    };
    let row = ProgressSet {
        date: date("2026-11-23"),
        completed: true,
        exercise_id: "squat".into(),
        exercise_name: "Squat".into(),
        exercise_name_vi: None,
        muscle_group: MuscleGroup::Quads,
        set: maxed,
    };
    let sets = vec![
        row.clone(),
        ProgressSet {
            date: date("2026-11-20"),
            ..row.clone()
        },
        ProgressSet {
            set: RecordedSet {
                duration_seconds: Some(30),
                ..logged(90., 0)
            },
            ..row.clone()
        },
        ProgressSet {
            set: RecordedSet {
                legacy_unit_unknown: true,
                ..logged(100., 99)
            },
            ..row.clone()
        },
        ProgressSet {
            set: RecordedSet {
                status: SetStatus::Skipped,
                ..logged(100., 99)
            },
            ..row.clone()
        },
        ProgressSet {
            completed: false,
            ..row
        },
    ];
    let stats = progress_summary(
        date("2026-11-28"),
        &sets,
        &[
            (date("2026-11-26"), 65.),
            (date("2026-11-28"), 66.),
            (date("2026-11-18"), 70.),
        ],
        Some(80.),
    )
    .unwrap();
    assert_eq!(
        (
            stats.current_week_volume,
            stats.previous_week_volume,
            stats.workout_streak_weeks
        ),
        (240., 240., 2)
    );
    assert_eq!(
        (stats.weekly_avg_weight_kg, stats.weight_source),
        (Some(65.5), Some(WeightSource::WeightLog))
    );
    assert_eq!(stats.volume_by_muscle[0].label, "Đùi trước");
    assert_eq!(stats.strength[0].estimated_1rm, 48.);
    let fallback = progress_summary(date("2026-11-28"), &[], &[], Some(64.25)).unwrap();
    assert_eq!(fallback.weekly_avg_weight_kg, Some(64.3));
    assert_eq!(fallback.weight_source, Some(WeightSource::Profile));
}
