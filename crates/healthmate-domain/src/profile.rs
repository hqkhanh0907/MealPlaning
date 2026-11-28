pub use crate::dates::age_on_date;
use chrono::NaiveDate;
mod measurements;
pub use measurements::{
    Change, MeasurementProfile, ProfilePatch, update_measurement_targets, validate_profile_changes,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Gender {
    Male,
    Female,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Goal {
    LoseWeight,
    Maintain,
    GainMuscle,
    Performance,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActivityLevel {
    Sedentary,
    Light,
    Moderate,
    Heavy,
}

impl ActivityLevel {
    pub fn factor(self) -> f64 {
        match self {
            Self::Sedentary => 1.2,
            Self::Light => 1.375,
            Self::Moderate => 1.55,
            Self::Heavy => 1.725,
        }
    }
    pub fn from_factor(factor: f64) -> Option<Self> {
        [Self::Sedentary, Self::Light, Self::Moderate, Self::Heavy]
            .into_iter()
            .find(|v| v.factor() == factor)
    }
    pub fn labels(self) -> (&'static str, &'static str) {
        match self {
            Self::Sedentary => ("Ít vận động", "Ít vận động (ngồi nhiều)"),
            Self::Light => ("Vận động nhẹ", "Nhẹ (1-3 ngày/tuần)"),
            Self::Moderate => ("Vận động vừa", "Trung bình (3-5 ngày/tuần)"),
            Self::Heavy => ("Vận động nặng", "Nặng (6-7 ngày/tuần)"),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct RecalcInput {
    pub weight_kg: f64,
    pub height_cm: f64,
    pub age: f64,
    pub gender: Gender,
    pub goal: Goal,
    pub activity_factor: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RecalcOutput {
    pub bmr: f64,
    pub tdee: f64,
    pub target_calories: f64,
    pub target_protein: f64,
    #[serde(rename = "energyNote")]
    pub energy_note: Option<String>,
}

pub fn calculate_bmr(weight_kg: f64, height_cm: f64, age: f64, gender: Gender) -> f64 {
    if age.fract() != 0.0 || !(19.0..=78.0).contains(&age) {
        return 0.0;
    }
    crate::js_round(
        10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
            + match gender {
                Gender::Male => 5.0,
                Gender::Female => -161.0,
            },
    )
}
pub fn calculate_tdee(bmr: f64, level: ActivityLevel) -> f64 {
    crate::js_round(bmr * level.factor())
}
pub fn calculate_target_calories(tdee: f64, goal: Goal, weight_kg: f64, height_cm: f64) -> f64 {
    let bmi = weight_kg / (height_cm / 100.0).powi(2);
    if tdee <= 0.0 || !bmi.is_finite() || (goal == Goal::LoseWeight && bmi <= 18.5) {
        return 0.0;
    }
    let value = crate::js_round(
        tdee + match goal {
            Goal::LoseWeight => -500.0,
            Goal::GainMuscle => 300.0,
            Goal::Maintain => 0.0,
            Goal::Performance => 200.0,
        },
    );
    if value > 1200.0 && value <= 6000.0 {
        value
    } else {
        0.0
    }
}
pub fn calculate_target_protein(weight_kg: f64, goal: Goal) -> f64 {
    crate::js_round(
        weight_kg
            * match goal {
                Goal::GainMuscle | Goal::LoseWeight => 2.2,
                Goal::Maintain => 1.6,
                Goal::Performance => 2.0,
            },
    )
}

pub fn recalc_targets(p: &RecalcInput) -> RecalcOutput {
    let bmr = calculate_bmr(p.weight_kg, p.height_cm, p.age, p.gender);
    let tdee = calculate_tdee(
        bmr,
        ActivityLevel::from_factor(p.activity_factor).unwrap_or(ActivityLevel::Moderate),
    );
    let target_calories = calculate_target_calories(tdee, p.goal, p.weight_kg, p.height_cm);
    let protein = calculate_target_protein(p.weight_kg, p.goal);
    let target_protein = if p.age >= 18.0 && (20.0..=400.0).contains(&protein) {
        protein
    } else {
        0.0
    };
    let energy_note = if bmr == 0.0 || bmr.is_nan() {
        Some("Ứng dụng chỉ ước tính năng lượng cho người từ 19 đến 78 tuổi.".to_owned())
    } else if target_calories == 0.0 {
        Some("Ứng dụng chưa có mức năng lượng phù hợp để đề xuất cho hồ sơ này.".to_owned())
    } else {
        None
    };
    RecalcOutput {
        bmr,
        tdee,
        target_calories,
        target_protein,
        energy_note,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TargetMode {
    Auto,
    Manual,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct SavedTargets {
    pub calorie_target_mode: Option<TargetMode>,
    pub target_calories: f64,
    pub protein_target_mode: Option<TargetMode>,
    pub target_protein: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AutomaticTargetUpdate {
    pub bmr: f64,
    pub tdee: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_calories: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_protein: Option<f64>,
}

pub fn automatic_target_update(
    current: &RecalcInput,
    saved: SavedTargets,
    next: &RecalcOutput,
) -> AutomaticTargetUpdate {
    let old = recalc_targets(current);
    let auto = |mode: Option<TargetMode>, saved: f64, previous: f64| {
        mode.map_or(saved == previous, |m| m == TargetMode::Auto)
    };
    AutomaticTargetUpdate {
        bmr: next.bmr,
        tdee: next.tdee,
        target_calories: auto(
            saved.calorie_target_mode,
            saved.target_calories,
            old.target_calories,
        )
        .then_some(next.target_calories),
        target_protein: auto(
            saved.protein_target_mode,
            saved.target_protein,
            old.target_protein,
        )
        .then_some(next.target_protein),
    }
}

#[derive(Debug, Clone, Copy)]
pub enum Target {
    Calories,
    Protein,
    Carbs,
    Fat,
}
pub fn valid_manual_target(key: Target, value: Option<f64>) -> bool {
    let (min, max) = match key {
        Target::Calories => (800.0, 6000.0),
        Target::Protein => (20.0, 400.0),
        Target::Carbs | Target::Fat => (0.0, 1000.0),
    };
    value.is_none_or(|v| (min..=max).contains(&v))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Measurement {
    HeightCm,
    WeightKg,
    Age,
}
pub fn body_measurement_error(field: Measurement, value: Option<f64>) -> Option<&'static str> {
    let (min, max, error) = match field {
        Measurement::HeightCm => (100.0, 250.0, "Chiều cao cần từ 100 đến 250 cm."),
        Measurement::WeightKg => (30.0, 300.0, "Cân nặng cần từ 30 đến 300 kg."),
        Measurement::Age => (10.0, 120.0, "Tuổi cần từ 10 đến 120."),
    };
    match value {
        Some(v) if (min..=max).contains(&v) => {
            (field == Measurement::Age && v.fract() != 0.0).then_some("Nhập tuổi theo số năm tròn.")
        }
        _ => Some(error),
    }
}
pub fn birth_date_error(birth: &str, today: NaiveDate) -> Option<&'static str> {
    if birth.is_empty() {
        return Some("Vui lòng nhập ngày sinh.");
    }
    match age_on_date(Some(birth), today) {
        Some(age) => body_measurement_error(Measurement::Age, Some(f64::from(age))),
        None => Some("Ngày sinh cần hợp lệ và không ở tương lai."),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FitnessLevel {
    Beginner,
    Intermediate,
    Advanced,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GymExperience {
    #[serde(rename = "never")]
    Never,
    #[serde(rename = "under_6m")]
    UnderSixMonths,
    #[serde(rename = "6m_2y")]
    SixMonthsToTwoYears,
    #[serde(rename = "over_2y")]
    OverTwoYears,
}
pub fn derive_fitness_level(experience: GymExperience) -> FitnessLevel {
    match experience {
        GymExperience::Never | GymExperience::UnderSixMonths => FitnessLevel::Beginner,
        GymExperience::SixMonthsToTwoYears => FitnessLevel::Intermediate,
        GymExperience::OverTwoYears => FitnessLevel::Advanced,
    }
}
