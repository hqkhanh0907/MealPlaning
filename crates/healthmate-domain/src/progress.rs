use crate::dates::{NaiveDate, add_calendar_days, monday_of_week};
use crate::fitness::{RecordedSet, SetStatus};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MuscleGroup {
    Abs,
    Back,
    Biceps,
    Calves,
    Chest,
    Forearms,
    FullBody,
    Glutes,
    Hamstrings,
    Quads,
    Shoulders,
    Triceps,
}
impl MuscleGroup {
    pub fn label(self) -> &'static str {
        match self {
            Self::Chest => "Ngực",
            Self::Back => "Lưng",
            Self::Shoulders => "Vai",
            Self::Biceps => "Tay trước",
            Self::Triceps => "Tay sau",
            Self::Quads => "Đùi trước",
            Self::Hamstrings => "Đùi sau",
            Self::Glutes => "Mông",
            Self::Calves => "Bắp chân",
            Self::Abs => "Core",
            Self::Forearms => "Cẳng tay",
            Self::FullBody => "Toàn thân",
        }
    }
}

#[derive(Clone, Debug, Deserialize)]
pub struct ProgressSet {
    pub date: NaiveDate,
    pub completed: bool,
    pub exercise_id: String,
    pub exercise_name: String,
    pub exercise_name_vi: Option<String>,
    pub muscle_group: MuscleGroup,
    pub set: RecordedSet,
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MuscleVolume {
    pub muscle_group: MuscleGroup,
    pub label: String,
    pub volume: f64,
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StrengthPoint {
    pub exercise_id: String,
    pub exercise_name: String,
    pub exercise_name_vi: Option<String>,
    pub estimated_1rm: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WeightSource {
    WeightLog,
    Profile,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressSummary {
    pub current_week_volume: f64,
    pub previous_week_volume: f64,
    pub workout_streak_weeks: u8,
    pub weekly_avg_weight_kg: Option<f64>,
    pub weight_source: Option<WeightSource>,
    pub volume_by_muscle: Vec<MuscleVolume>,
    pub strength: Vec<StrengthPoint>,
}
pub fn progress_summary(
    today: NaiveDate,
    sets: &[ProgressSet],
    weights: &[(NaiveDate, f64)],
    profile_weight: Option<f64>,
) -> Option<ProgressSummary> {
    let monday = monday_of_week(today)?;
    let previous = add_calendar_days(monday, -7)?;
    let end = add_calendar_days(monday, 6)?;
    let strength_start = add_calendar_days(monday, -77)?;
    let weight_start = add_calendar_days(today, -6)?;
    let mut current_week_volume = 0.0;
    let mut previous_week_volume = 0.0;
    let mut groups = BTreeMap::<MuscleGroup, f64>::new();
    let mut lifts = BTreeMap::<&str, StrengthPoint>::new();
    let mut weeks = BTreeSet::new();
    for row in sets
        .iter()
        .filter(|r| r.completed && r.date >= strength_start && r.date <= end)
    {
        let set = &row.set;
        if set.status == SetStatus::Logged {
            weeks.insert(monday_of_week(row.date)?);
        }
        if !set.is_logged_repetition() {
            continue;
        }
        let volume = set.volume();
        if row.date >= monday {
            current_week_volume += volume;
            *groups.entry(row.muscle_group).or_default() += volume;
        } else if row.date >= previous {
            previous_week_volume += volume;
        }
        if let Some(estimate) = set.strength_estimate(&row.exercise_id) {
            let best = lifts
                .entry(&row.exercise_id)
                .or_insert_with(|| StrengthPoint {
                    exercise_id: row.exercise_id.clone(),
                    exercise_name: row.exercise_name.clone(),
                    exercise_name_vi: row.exercise_name_vi.clone(),
                    estimated_1rm: estimate,
                });
            best.estimated_1rm = best.estimated_1rm.max(estimate);
        }
    }
    let mut volume_by_muscle: Vec<_> = groups
        .into_iter()
        .map(|(group, volume)| MuscleVolume {
            muscle_group: group,
            label: group.label().into(),
            volume,
        })
        .collect();
    volume_by_muscle.sort_by(|a, b| b.volume.total_cmp(&a.volume));
    volume_by_muscle.truncate(6);
    let mut strength: Vec<_> = lifts.into_values().collect();
    strength.sort_by(|a, b| b.estimated_1rm.total_cmp(&a.estimated_1rm));
    strength.truncate(5);
    for point in &mut strength {
        point.estimated_1rm = crate::js_round(point.estimated_1rm);
    }
    let mut workout_streak_weeks = 0;
    for n in 0..12 {
        if !weeks.contains(&add_calendar_days(monday, -7 * n)?) {
            break;
        }
        workout_streak_weeks += 1;
    }
    let (sum, count) = weights
        .iter()
        .filter(|(d, _)| *d >= weight_start && *d <= today)
        .fold((0.0, 0), |(sum, n), (_, v)| (sum + v, n + 1));
    let (average, weight_source) = if count > 0 {
        (Some(sum / f64::from(count)), Some(WeightSource::WeightLog))
    } else {
        (
            profile_weight,
            profile_weight.map(|_| WeightSource::Profile),
        )
    };
    let weekly_avg_weight_kg = average.map(|kg| crate::js_round(kg * 10.0) / 10.0);
    Some(ProgressSummary {
        current_week_volume,
        previous_week_volume,
        workout_streak_weeks,
        weekly_avg_weight_kg,
        weight_source,
        volume_by_muscle,
        strength,
    })
}
