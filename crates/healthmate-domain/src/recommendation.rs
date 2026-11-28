use crate::fitness::{
    TrainingPrescription, exercise_facts, exercise_name, normalize_training_prescription,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::LazyLock;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PlannedExercise {
    pub exercise_id: String,
    #[serde(flatten)]
    pub prescription: TrainingPrescription,
    pub notes: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TrainingDay {
    pub day_of_week: u8,
    pub name: String,
    pub is_rest_day: bool,
    pub exercises: Vec<PlannedExercise>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SeedPlan {
    id: String,
    name: String,
    frequency: u8,
    name_order: u8,
    days: Vec<TrainingDay>,
}
static PLANS: LazyLock<Vec<SeedPlan>> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../data/training-plans.json"))
        .expect("checked-in training plans")
});

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Avoid {
    Movements(Vec<String>),
    Unclear(Unclear),
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Unclear {
    Unclear,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutPreferences {
    pub age: Option<f64>,
    pub weekdays: Vec<f64>,
    pub minutes: f64,
    pub equipment: Option<Vec<String>>,
    pub avoid: Option<Avoid>,
    pub frequency: Option<f64>,
    pub familiar_volume: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutPlanOption {
    pub source_id: String,
    pub name: String,
    pub days: Vec<TrainingDay>,
    pub frequency: u8,
    pub sets_per_week: u32,
    pub max_minutes: i32,
    pub shifted: bool,
    pub shortened: bool,
    pub adjusted: bool,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecommendationStatus {
    Manual,
    Incomplete,
    Ready,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutRecommendation {
    pub status: RecommendationStatus,
    pub explanation: String,
    pub plans: Vec<WorkoutPlanOption>,
    pub short_plans: Vec<WorkoutPlanOption>,
    pub session: Vec<PlannedExercise>,
    pub session_minutes: i32,
}

pub fn workout_day_name(day: u8) -> &'static str {
    [
        "Chủ nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
    ]
    .get(day as usize)
    .copied()
    .unwrap_or("")
}
pub fn upper_minutes(exercises: &[PlannedExercise]) -> i32 {
    if exercises.is_empty() {
        return 0;
    }
    let mut seconds = 600.0 + 120.0 * (exercises.len() - 1) as f64;
    for e in exercises {
        let f = exercise_facts(&e.exercise_id);
        let p = e.prescription;
        let set_secs = if f.is_some_and(|f| f.timed) {
            p.reps_max
        } else {
            60.0
        };
        let sides = if f.is_some_and(|f| f.per_side) {
            2.0
        } else {
            1.0
        };
        seconds += p.sets * set_secs * sides + (p.sets - 1.0) * p.rest_seconds;
    }
    (seconds / 60.0).ceil() as i32
}

fn fit_budget(exercises: &[PlannedExercise], minutes: f64) -> Vec<PlannedExercise> {
    let mut draft = exercises.to_vec();
    while !draft.is_empty() && f64::from(upper_minutes(&draft)) > minutes {
        let mut largest = draft.len() - 1;
        for (i, e) in draft.iter().enumerate() {
            if e.prescription.sets > draft[largest].prescription.sets {
                largest = i;
            }
        }
        if draft[largest].prescription.sets > 1.0 {
            draft[largest].prescription.sets -= 1.0;
        } else {
            draft.pop();
        }
    }
    draft
}

fn preference_issue(p: &WorkoutPreferences) -> Option<(RecommendationStatus, &'static str)> {
    if matches!(p.avoid, Some(Avoid::Unclear(_))) {
        return Some((
            RecommendationStatus::Manual,
            "Hãy xác định động tác cần tránh trước khi nhận gợi ý. Bạn vẫn có thể xem bài hoặc ghi buổi tự do.",
        ));
    }
    if !p.age.is_some_and(|age| age.is_finite() && age >= 18.0) {
        return Some((
            RecommendationStatus::Manual,
            "Gợi ý tự động dành cho người từ 18 tuổi có ngày sinh trong hồ sơ. Bạn vẫn có thể ghi buổi tập tự do.",
        ));
    }
    if p.weekdays.is_empty()
        || p.weekdays
            .iter()
            .enumerate()
            .any(|(i, d)| p.weekdays[..i].contains(d))
        || p.weekdays
            .iter()
            .any(|d| d.fract() != 0.0 || !(0.0..=6.0).contains(d))
        || p.minutes.fract() != 0.0
        || p.minutes <= 0.0
        || p.equipment.is_none()
        || p.avoid.is_none()
    {
        return Some((
            RecommendationStatus::Incomplete,
            "Chọn ngày rảnh, thời gian, dụng cụ và động tác cần tránh.",
        ));
    }
    None
}
pub fn expand_equipment(keys: &[String]) -> HashSet<&str> {
    let mut expanded: HashSet<&str> = keys.iter().map(String::as_str).collect();
    for (specific, standard) in [
        ("dual-cable", "cable"),
        ("cable-handle-pair", "cable-single-handle"),
        ("incline-treadmill", "treadmill"),
        ("muscle-up-bar", "pull-up-bar"),
        ("hex-dumbbell", "dumbbell"),
    ] {
        if expanded.contains(specific) {
            expanded.insert(standard);
        }
    }
    expanded
}
fn restriction_set(input: &WorkoutPreferences) -> HashSet<&str> {
    match &input.avoid {
        Some(Avoid::Movements(ids)) => ids.iter().map(String::as_str).collect(),
        _ => HashSet::new(),
    }
}
pub fn workout_exercise_usable(id: &str, available: &HashSet<&str>, avoid: &HashSet<&str>) -> bool {
    let Some(f) = exercise_facts(id) else {
        return false;
    };
    !f.pattern.is_empty()
        && !avoid.contains(id)
        && !avoid.contains(f.pattern.as_str())
        && f.required
            .as_ref()
            .is_some_and(|gear| gear.iter().all(|key| available.contains(key.as_str())))
}
pub fn workout_draft_issue(p: &WorkoutPreferences, days: &[TrainingDay]) -> Option<String> {
    if let Some((_, why)) = preference_issue(p) {
        return Some(why.to_owned());
    }
    let active: Vec<_> = days.iter().filter(|d| !d.is_rest_day).collect();
    if days.len() != 7
        || days
            .iter()
            .map(|d| d.day_of_week)
            .collect::<HashSet<_>>()
            .len()
            != 7
        || days
            .iter()
            .any(|d| d.day_of_week > 6 || (d.is_rest_day && !d.exercises.is_empty()))
    {
        return Some("Bản nháp cần đủ bảy ngày riêng biệt và ghi đúng ngày nghỉ.".into());
    }
    if active.is_empty()
        || active
            .iter()
            .any(|d| !p.weekdays.contains(&f64::from(d.day_of_week)))
        || p.frequency.is_some_and(|f| f != active.len() as f64)
        || (active.len() >= 4 && !p.familiar_volume)
    {
        return Some("Số buổi hoặc ngày tập trong bản nháp chưa phù hợp với lịch của bạn.".into());
    }
    let available = expand_equipment(p.equipment.as_deref().unwrap_or_default());
    let avoid = restriction_set(p);
    for day in active {
        if day.exercises.is_empty()
            || day
                .exercises
                .iter()
                .map(|i| &i.exercise_id)
                .collect::<HashSet<_>>()
                .len()
                != day.exercises.len()
        {
            return Some("Mỗi buổi cần có bài tập riêng biệt.".into());
        }
        for e in &day.exercises {
            if !workout_exercise_usable(&e.exercise_id, &available, &avoid) {
                return Some(format!(
                    "{} chưa phù hợp với dụng cụ hoặc động tác đã chọn.",
                    exercise_name(&e.exercise_id)
                ));
            }
            if e.prescription != normalize_training_prescription(e.prescription) {
                return Some("Chỉ tiêu của bài tập chưa hợp lệ.".into());
            }
        }
        if f64::from(upper_minutes(&day.exercises)) > p.minutes {
            return Some("Thời lượng ước tính vượt số phút bạn có.".into());
        }
    }
    None
}
pub fn recommend_workout(p: &WorkoutPreferences) -> WorkoutRecommendation {
    let issue = preference_issue(p);
    let mut r = WorkoutRecommendation {
        status: issue.map_or(RecommendationStatus::Ready, |e| e.0),
        explanation: issue.map_or("", |e| e.1).to_owned(),
        plans: vec![],
        short_plans: vec![],
        session: vec![],
        session_minutes: 0,
    };
    if issue.is_some() {
        return r;
    }
    let gear = expand_equipment(p.equipment.as_deref().unwrap_or_default());
    let avoid = restriction_set(p);
    let usable = |id: &str| workout_exercise_usable(id, &gear, &avoid);
    for seed in PLANS.iter() {
        if usize::from(seed.frequency) > p.weekdays.len()
            || (seed.frequency >= 4 && !p.familiar_volume)
        {
            continue;
        }
        let training: Vec<_> = seed.days.iter().filter(|d| !d.is_rest_day).collect();
        let Some(shift) = (0..7).find(|&offset| {
            training.iter().all(|day| {
                let shifted = (day.day_of_week + offset) % 7;
                p.weekdays.contains(&f64::from(shifted))
            })
        }) else {
            continue;
        };
        if training
            .iter()
            .any(|d| d.exercises.iter().any(|e| !usable(&e.exercise_id)))
        {
            continue;
        }
        let shortened = training
            .iter()
            .any(|d| f64::from(upper_minutes(&d.exercises)) > p.minutes);
        let mut days = seed.days.clone();
        for day in &mut days {
            day.day_of_week = (day.day_of_week + shift) % 7;
            if shortened {
                day.exercises = fit_budget(&day.exercises, p.minutes);
            }
        }
        if days
            .iter()
            .zip(&seed.days)
            .any(|(a, b)| a.exercises.len() != b.exercises.len())
        {
            continue;
        }
        days.sort_by_key(|d| (d.day_of_week + 6) % 7);
        let max_minutes = days
            .iter()
            .map(|d| upper_minutes(&d.exercises))
            .max()
            .unwrap_or(0);
        let sets_per_week = days
            .iter()
            .flat_map(|d| &d.exercises)
            .map(|e| e.prescription.sets as u32)
            .sum();
        let option = WorkoutPlanOption {
            source_id: seed.id.clone(),
            name: seed.name.clone(),
            frequency: seed.frequency,
            sets_per_week,
            max_minutes,
            shifted: shift != 0,
            shortened,
            adjusted: shortened || shift != 0,
            days,
        };
        if shortened {
            r.short_plans.push(option)
        } else {
            r.plans.push(option)
        }
    }
    let order = |o: &WorkoutPlanOption| {
        (
            Some(f64::from(o.frequency)) != p.frequency,
            o.adjusted,
            o.max_minutes,
            PLANS
                .iter()
                .find(|s| s.id == o.source_id)
                .map_or(u8::MAX, |s| s.name_order),
        )
    };
    r.plans.sort_by_key(order);
    r.short_plans.sort_by_key(order);
    let choices: &[&[&str]] = &[
        &["goblet-squat", "bodyweight-squat"],
        &["dumbbell-floor-press", "push-up"],
        &[
            "dumbbell-row",
            "renegade-row",
            "dumbbell-romanian-deadlift",
            "glute-bridge",
        ],
    ];
    let session: Vec<_> = choices
        .iter()
        .filter_map(|ids| ids.iter().find(|id| usable(id)))
        .map(|id| PlannedExercise {
            exercise_id: (*id).into(),
            prescription: TrainingPrescription {
                sets: 2.0,
                reps_min: 8.0,
                reps_max: 12.0,
                rest_seconds: 90.0,
            },
            notes: None,
        })
        .collect();
    r.session = fit_budget(&session, p.minutes);
    r.session_minutes = upper_minutes(&r.session);
    r.explanation = if r.plans.is_empty() {
        "Không có mẫu nguyên bản vừa lịch, thời gian, dụng cụ và điều kiện bạn chọn."
    } else {
        "Đã kiểm ngày rảnh, dụng cụ, động tác cần tránh và thời lượng của từng buổi."
    }
    .to_owned();
    r
}
