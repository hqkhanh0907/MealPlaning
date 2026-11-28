use healthmate_domain::fitness::{exercise_facts, is_timed_exercise, load_factor};
use serde::Deserialize;

pub fn number(value: f64) -> String {
    healthmate_domain::dashboard_presentation::vi_decimal(value, 2)
}
pub fn duration(min: Option<u32>) -> String {
    match min {
        None => "—".into(),
        Some(m) if m < 60 => format!("{m} phút"),
        Some(m) if m % 60 == 0 => format!("{} giờ", m / 60),
        Some(m) => format!("{} giờ {} phút", m / 60, m % 60),
    }
}
pub fn amount_label(id: &str) -> &'static str {
    let side = exercise_facts(id).is_some_and(|f| f.per_side);
    match (is_timed_exercise(id), side) {
        (true, true) => "Tập mỗi bên (giây)",
        (true, false) => "Tập (giây)",
        (false, true) => "Số lần mỗi bên",
        (false, false) => "Số lần",
    }
}
pub const EFFORTS: [(&str, &str); 4] = [
    ("easy", "Dễ"),
    ("just_right", "Vừa"),
    ("hard", "Nặng"),
    ("maxed", "Tối đa"),
];
#[derive(Deserialize, Clone, Debug, PartialEq)]
pub struct SetRow {
    pub id: String,
    pub set_number: u32,
    pub status: String,
    pub weight_kg: f64,
    pub reps: u32,
    pub duration_seconds: Option<u32>,
    #[serde(default)]
    pub legacy_unit_unknown: u8,
    pub effort: Option<String>,
}
impl SetRow {
    pub fn can_edit(&self, id: &str) -> bool {
        self.status == "logged"
            && self.legacy_unit_unknown == 0
            && is_timed_exercise(id) == self.duration_seconds.is_some()
    }
    pub fn value(&self, id: &str) -> String {
        let legacy = self.legacy_unit_unknown != 0;
        let paired = !legacy && load_factor(id) == 2;
        let load = format!(
            "{} kg{}",
            number(if paired {
                self.weight_kg / 2.
            } else {
                self.weight_kg
            }),
            if paired { " mỗi tay" } else { "" }
        );
        if legacy {
            return format!("{load} · {} (bản cũ chưa ghi đơn vị)", self.reps);
        }
        if let Some(sec) = self.duration_seconds {
            return if self.weight_kg == 0. {
                format!("{sec} giây")
            } else {
                format!("{load} · {sec} giây")
            };
        }
        format!("{load} × {} lần", self.reps)
    }
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Draft {
    #[serde(rename = "weightKg")]
    pub weight: String,
    pub reps: String,
    #[serde(rename = "restSeconds")]
    pub rest: String,
    pub notes: String,
    pub effort: Option<String>,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Logger {
    pub exercise: String,
    pub rows: Vec<SetRow>,
    pub draft: Draft,
    pub busy: bool,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Planned {
    pub exercise_id: String,
    pub exercise_name: String,
    pub exercise_name_vi: Option<String>,
    pub sets: u32,
    pub reps_min: u32,
    pub reps_max: u32,
    pub rest_seconds: u32,
    pub notes: Option<String>,
    #[serde(default)]
    pub last: Option<String>,
    pub purpose: String,
}
impl Planned {
    pub fn name(&self) -> &str {
        self.exercise_name_vi
            .as_deref()
            .filter(|n| !n.is_empty())
            .unwrap_or(&self.exercise_name)
    }
    pub fn prescription(&self) -> String {
        format!(
            "{} × {}–{} {} · nghỉ {} giây",
            self.sets,
            self.reps_min,
            self.reps_max,
            if is_timed_exercise(&self.exercise_id) {
                "giây"
            } else {
                "lần"
            },
            self.rest_seconds
        )
    }
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Day {
    pub id: String,
    pub day_of_week: u8,
    pub name: String,
    pub is_rest_day: u8,
    pub exercises: Vec<Planned>,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Plan {
    pub id: String,
    pub name: String,
    pub frequency: u32,
    pub planned_exercises: u32,
    pub days: Vec<Day>,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct SessionHeading {
    pub title: Option<String>,
    pub count: usize,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Today {
    pub loading: bool,
    pub error: Option<String>,
    pub success: Option<String>,
    pub progress: bool,
    pub undo: bool,
    pub current: Option<SessionHeading>,
    pub plan: bool,
    pub day: Option<Day>,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Week {
    pub plan: Option<Plan>,
    pub selected: Option<String>,
    pub loading: bool,
    pub busy: bool,
    pub active: bool,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct PreviewItem {
    pub name: String,
    pub note: String,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct Preview {
    pub place: String,
    pub exercises: Vec<PreviewItem>,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct HistoryExercise {
    pub id: String,
    pub name: String,
    pub unit: Option<String>,
    pub note: Option<String>,
    pub sets: Vec<SetRow>,
}
#[derive(Clone, Deserialize, Debug, PartialEq)]
pub struct History {
    pub id: String,
    pub date: String,
    #[serde(rename = "dateLabel")]
    pub date_label: String,
    pub title: Option<String>,
    pub mode: String,
    pub volume: f64,
    pub minutes: Option<u32>,
    pub exercises: Vec<HistoryExercise>,
    #[serde(default)]
    pub saving: bool,
    pub busy: bool,
    pub active: bool,
    pub preview: Option<Preview>,
}
impl History {
    pub fn count(&self) -> usize {
        self.exercises
            .iter()
            .flat_map(|ex| ex.sets.iter())
            .filter(|s| s.status == "logged")
            .count()
    }
}
