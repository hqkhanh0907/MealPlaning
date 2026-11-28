use super::{
    Gender, Goal, Measurement, RecalcInput, SavedTargets, Target, TargetMode, age_on_date,
    automatic_target_update, birth_date_error, body_measurement_error, recalc_targets,
    valid_manual_target,
};
use crate::dates::NaiveDate;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Debug, Clone, Default, PartialEq)]
pub enum Change<T> {
    #[default]
    Unchanged,
    Set(T),
}
impl<T> Change<T> {
    fn is_unchanged(&self) -> bool {
        matches!(self, Self::Unchanged)
    }
    fn or<'a>(&'a self, current: &'a T) -> &'a T {
        match self {
            Self::Set(value) => value,
            Self::Unchanged => current,
        }
    }
}
impl<'de, T: Deserialize<'de>> Deserialize<'de> for Change<T> {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        Ok(Self::Set(T::deserialize(d)?))
    }
}
impl<T: Serialize> Serialize for Change<T> {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::Set(value) => value.serialize(s),
            Self::Unchanged => s.serialize_none(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeasurementProfile {
    pub birth_date: Option<String>,
    pub height_cm: f64,
    pub weight_kg: f64,
    pub gender: Gender,
    pub goal: Goal,
    pub activity_factor: f64,
    pub bmr: f64,
    pub tdee: f64,
    #[serde(flatten)]
    pub targets: SavedTargets,
    pub target_carbs: Option<f64>,
    pub target_fat: Option<f64>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct ProfilePatch {
    #[serde(skip_serializing_if = "Change::is_unchanged")]
    pub birth_date: Change<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight_kg: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height_cm: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gender: Option<Gender>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub goal: Option<Goal>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activity_factor: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub calorie_target_mode: Option<TargetMode>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protein_target_mode: Option<TargetMode>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_calories: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_protein: Option<f64>,
    #[serde(skip_serializing_if = "Change::is_unchanged")]
    pub target_carbs: Change<Option<f64>>,
    #[serde(skip_serializing_if = "Change::is_unchanged")]
    pub target_fat: Change<Option<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bmr: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tdee: Option<f64>,
}

pub fn validate_profile_changes(
    p: &ProfilePatch,
    old: Option<&MeasurementProfile>,
    today: NaiveDate,
) -> Result<(), &'static str> {
    let prior_birth = old.and_then(|s| s.birth_date.as_deref());
    let changed = match &p.birth_date {
        Change::Set(value) => Some(value.as_deref()),
        Change::Unchanged => None,
    };
    if old.is_none() || changed.is_some_and(|d| d != prior_birth) {
        if let Some(error) = birth_date_error(changed.flatten().unwrap_or(""), today) {
            return Err(error);
        }
    }
    for (key, new, prev) in [
        (Measurement::WeightKg, p.weight_kg, old.map(|s| s.weight_kg)),
        (Measurement::HeightCm, p.height_cm, old.map(|s| s.height_cm)),
    ] {
        if new.is_some() && new != prev {
            if let Some(e) = body_measurement_error(key, new) {
                return Err(e);
            }
        }
    }
    let invalid = "Mục tiêu dinh dưỡng không hợp lệ.";
    for (key, new, prior, mode, prior_mode) in [
        (
            Target::Calories,
            p.target_calories,
            old.map(|s| s.targets.target_calories),
            p.calorie_target_mode,
            old.and_then(|s| s.targets.calorie_target_mode),
        ),
        (
            Target::Protein,
            p.target_protein,
            old.map(|s| s.targets.target_protein),
            p.protein_target_mode,
            old.and_then(|s| s.targets.protein_target_mode),
        ),
    ] {
        if mode.or(prior_mode) == Some(TargetMode::Auto) {
            continue;
        }
        let switches = mode == Some(TargetMode::Manual) && mode != prior_mode;
        if !switches && (new.is_none() || new == prior) {
            continue;
        }
        let target = new.or(prior);
        if target != Some(0.0) && !valid_manual_target(key, target) {
            return Err(invalid);
        }
    }
    for (key, change, prior) in [
        (
            Target::Carbs,
            &p.target_carbs,
            old.and_then(|s| s.target_carbs),
        ),
        (Target::Fat, &p.target_fat, old.and_then(|s| s.target_fat)),
    ] {
        if let Change::Set(new) = change {
            if *new != prior && !valid_manual_target(key, *new) {
                return Err(invalid);
            }
        }
    }
    Ok(())
}

pub fn update_measurement_targets(
    old: &MeasurementProfile,
    mut patch: ProfilePatch,
    today: NaiveDate,
) -> Result<ProfilePatch, &'static str> {
    let next_birth = patch.birth_date.or(&old.birth_date).as_deref();
    let Some(next_birth) = next_birth.filter(|s| !s.is_empty()) else {
        return Ok(patch);
    };
    let age = |birth: &str| {
        age_on_date(Some(birth), today)
            .map(f64::from)
            .ok_or("Ngày sinh không hợp lệ.")
    };
    let previous = RecalcInput {
        weight_kg: old.weight_kg,
        height_cm: old.height_cm,
        age: age(old.birth_date.as_deref().unwrap_or(next_birth))?,
        gender: old.gender,
        goal: old.goal,
        activity_factor: old.activity_factor,
    };
    let next = RecalcInput {
        weight_kg: patch.weight_kg.unwrap_or(old.weight_kg),
        height_cm: patch.height_cm.unwrap_or(old.height_cm),
        age: age(next_birth)?,
        gender: patch.gender.unwrap_or(old.gender),
        goal: patch.goal.unwrap_or(old.goal),
        activity_factor: patch.activity_factor.unwrap_or(old.activity_factor),
    };
    let saved = SavedTargets {
        calorie_target_mode: patch
            .calorie_target_mode
            .or(old.targets.calorie_target_mode),
        protein_target_mode: patch
            .protein_target_mode
            .or(old.targets.protein_target_mode),
        ..old.targets
    };
    let values = automatic_target_update(&previous, saved, &recalc_targets(&next));
    for (target, before, new) in [
        (&mut patch.bmr, old.bmr, Some(values.bmr)),
        (&mut patch.tdee, old.tdee, Some(values.tdee)),
        (
            &mut patch.target_calories,
            old.targets.target_calories,
            values.target_calories,
        ),
        (
            &mut patch.target_protein,
            old.targets.target_protein,
            values.target_protein,
        ),
    ] {
        if let Some(v) = new {
            if v != before || target.is_some() {
                *target = Some(v);
            }
        }
    }
    Ok(patch)
}
