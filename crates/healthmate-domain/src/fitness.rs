use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};
use std::sync::LazyLock;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExerciseFacts {
    pub name: String,
    pub pattern: String,
    pub required: Option<Vec<String>>,
    pub per_side: bool,
    pub timed: bool,
    pub paired_load: bool,
}
static CATALOG: LazyLock<BTreeMap<String, ExerciseFacts>> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../data/exercise-facts.json"))
        .expect("checked-in exercise catalogue")
});
pub fn exercise_facts(id: &str) -> Option<&'static ExerciseFacts> {
    CATALOG.get(id)
}
pub fn exercise_name(id: &str) -> &str {
    exercise_facts(id).map_or(id, |e| e.name.as_str())
}
pub fn is_timed_exercise(id: &str) -> bool {
    exercise_facts(id).is_some_and(|e| e.timed)
}
pub fn load_factor(id: &str) -> u8 {
    if exercise_facts(id).is_some_and(|e| e.paired_load) {
        2
    } else {
        1
    }
}
pub fn load_label(id: &str) -> &'static str {
    if load_factor(id) == 2 {
        "Tạ mỗi tay (kg)"
    } else {
        "Mức tạ (kg)"
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TrainingPrescription {
    pub sets: f64,
    pub reps_min: f64,
    pub reps_max: f64,
    pub rest_seconds: f64,
}
pub fn default_training_range(id: &str) -> (u8, u8) {
    if is_timed_exercise(id) {
        (30, 45)
    } else {
        (8, 12)
    }
}
pub fn normalize_training_prescription(p: TrainingPrescription) -> TrainingPrescription {
    let clamp = |v: f64, min: f64, max: f64| {
        if v.is_finite() {
            crate::js_round(v).clamp(min, max)
        } else {
            min
        }
    };
    let max = if p.reps_min.is_nan() || p.reps_max.is_nan() {
        f64::NAN
    } else {
        p.reps_min.max(p.reps_max)
    };
    TrainingPrescription {
        sets: clamp(p.sets, 1.0, 10.0),
        reps_min: clamp(p.reps_min, 1.0, 50.0),
        reps_max: clamp(max, 1.0, 50.0),
        rest_seconds: clamp(p.rest_seconds, 30.0, 600.0),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Effort {
    Easy,
    JustRight,
    Hard,
    Maxed,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SetStatus {
    Logged,
    Skipped,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SetIssue {
    Weight,
    Duration,
    Reps,
    Rest,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutSetInput {
    pub weight_kg: f64,
    pub reps: f64,
    pub duration_seconds: Option<f64>,
    pub rest_seconds: f64,
}

pub fn workout_set_issue(id: &str, s: &WorkoutSetInput) -> Option<SetIssue> {
    fn integer(v: f64, min: f64, max: f64) -> bool {
        v.fract() == 0.0 && (min..=max).contains(&v)
    }
    if !(0.0..=500.0).contains(&s.weight_kg) {
        return Some(SetIssue::Weight);
    }
    if is_timed_exercise(id) {
        if s.reps != 0.0 || !s.duration_seconds.is_some_and(|d| integer(d, 1.0, 86400.0)) {
            return Some(SetIssue::Duration);
        }
    } else if s.duration_seconds.is_some() || !integer(s.reps, 1.0, 100.0) {
        return Some(SetIssue::Reps);
    }
    (!integer(s.rest_seconds, 0.0, 600.0)).then_some(SetIssue::Rest)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordedSet {
    pub status: SetStatus,
    pub weight_kg: f64,
    pub reps: u32,
    pub duration_seconds: Option<u32>,
    #[serde(default)]
    pub legacy_unit_unknown: bool,
    pub effort: Option<Effort>,
}
impl RecordedSet {
    pub fn is_logged_repetition(&self) -> bool {
        self.status == SetStatus::Logged
            && !self.legacy_unit_unknown
            && self.duration_seconds.is_none()
    }
    pub fn volume(&self) -> f64 {
        if self.is_logged_repetition() {
            self.weight_kg * f64::from(self.reps)
        } else {
            0.0
        }
    }
    pub fn strength_estimate(&self, exercise_id: &str) -> Option<f64> {
        if !matches!(exercise_id, "bench-press" | "squat" | "deadlift")
            || !self.is_logged_repetition()
            || self.effort != Some(Effort::Maxed)
            || !(self.weight_kg > 0.0 && (1..=10).contains(&self.reps))
        {
            return None;
        }
        Some(if self.reps == 1 {
            self.weight_kg
        } else {
            self.weight_kg * (1.0 + f64::from(self.reps) / 30.0)
        })
    }
}
pub fn progression_load(
    id: &str,
    planned_max: Option<u32>,
    planned_sets: Option<usize>,
    sets: &[RecordedSet],
) -> Option<f64> {
    let target = planned_max.filter(|n| *n > 0)?;
    let count = planned_sets.filter(|n| *n > 0)?;
    if sets.len() < count || is_timed_exercise(id) || sets.last()?.effort != Some(Effort::Easy) {
        return None;
    }
    let kg = sets.first()?.weight_kg;
    (kg > 0.0
        && sets
            .iter()
            .all(|s| s.is_logged_repetition() && s.weight_kg == kg && s.reps >= target))
    .then_some(kg)
}

pub fn valid_next_load(completed: bool, last: Option<f64>, next: Option<f64>) -> bool {
    completed
        && last.is_some_and(|old| next.is_none_or(|kg| kg.is_finite() && kg > old && kg <= 500.0))
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MovementSource {
    pub exercise_id: String,
    pub original_exercise_id: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct VenueMovement {
    pub source_id: String,
    pub exercise_id: String,
    pub original_exercise_id: Option<String>,
}

pub fn venue_movements(
    sources: &[MovementSource],
    rules: &BTreeMap<String, String>,
) -> Vec<VenueMovement> {
    let mut moves: Vec<_> = sources
        .iter()
        .map(|s| {
            let basis = s
                .original_exercise_id
                .as_ref()
                .filter(|s| !s.is_empty() && rules.contains_key(*s))
                .unwrap_or(&s.exercise_id);
            let target = rules.get(basis).unwrap_or(&s.exercise_id);
            let original = if target != basis {
                Some(basis.clone())
            } else if rules.contains_key(basis) {
                None
            } else {
                s.original_exercise_id.clone()
            };
            VenueMovement {
                source_id: s.exercise_id.clone(),
                exercise_id: target.clone(),
                original_exercise_id: original,
            }
        })
        .collect();
    loop {
        let mut targets = BTreeMap::<String, HashSet<String>>::new();
        for m in &moves {
            targets
                .entry(m.exercise_id.clone())
                .or_default()
                .insert(m.source_id.clone());
        }
        let mut reverted = false;
        for (m, source) in moves.iter_mut().zip(sources) {
            if m.exercise_id != m.source_id && targets[&m.exercise_id].len() > 1 {
                m.exercise_id.clone_from(&m.source_id);
                m.original_exercise_id
                    .clone_from(&source.original_exercise_id);
                reverted = true;
            }
        }
        if !reverted {
            return moves;
        }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VenuePreview {
    pub place_id: Option<String>,
    pub equipment: Option<Vec<String>>,
    pub prescription_snapshot: Option<String>,
    pub movements: Vec<VenueMovement>,
}
pub fn same_venue_preview(expected: &VenuePreview, actual: &VenuePreview) -> bool {
    expected.place_id == actual.place_id
        && expected
            .prescription_snapshot
            .as_ref()
            .is_none_or(|s| Some(s) == actual.prescription_snapshot.as_ref())
        && expected.equipment == actual.equipment
        && expected.movements == actual.movements
}
