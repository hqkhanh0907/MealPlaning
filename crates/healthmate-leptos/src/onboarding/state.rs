use healthmate_domain::{
    dates::{NaiveDate, age_on_date, parse_local_date},
    profile::{
        ActivityLevel, Gender, Goal, GymExperience, Measurement, RecalcInput, RecalcOutput,
        birth_date_error, body_measurement_error, derive_fitness_level, recalc_targets,
    },
};
use serde_json::{Value, json};

#[derive(Clone, Copy, PartialEq, Eq)]
pub(super) enum Field {
    Height,
    Weight,
    Birth,
    Gender,
}

impl Field {
    pub(super) fn error_id(self) -> &'static str {
        match self {
            Self::Height => "err-height",
            Self::Weight => "err-weight",
            Self::Birth => "err-birth-date",
            Self::Gender => "err-gender",
        }
    }
}

#[derive(Clone)]
pub(super) struct Wizard {
    pub day: NaiveDate,
    pub step: u8,
    pub goal: Option<Goal>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub birth: String,
    pub gender: Option<Gender>,
    pub activity: Option<ActivityLevel>,
    pub experience: Option<GymExperience>,
    pub submitted_body: bool,
    pub date_touched: bool,
    pub saving: bool,
    pub saved: bool,
    pub save_error: bool,
}

impl Wizard {
    pub fn new(day: NaiveDate) -> Self {
        Self {
            day,
            step: 1,
            goal: None,
            height: None,
            weight: None,
            birth: String::new(),
            gender: None,
            activity: None,
            experience: None,
            submitted_body: false,
            date_touched: false,
            saving: false,
            saved: false,
            save_error: false,
        }
    }
    pub fn present(&self) -> bool {
        self.height.is_some()
            && self.weight.is_some()
            && !self.birth.is_empty()
            && self.gender.is_some()
    }
    pub fn error(&self, field: Field) -> Option<&'static str> {
        match field {
            Field::Height => body_measurement_error(Measurement::HeightCm, self.height),
            Field::Weight => body_measurement_error(Measurement::WeightKg, self.weight),
            Field::Birth => birth_date_error(&self.birth, self.day),
            Field::Gender => self.gender.is_none().then_some("Vui lòng chọn giới tính"),
        }
    }
    pub fn visible_error(&self, field: Field) -> Option<&'static str> {
        if self.submitted_body
            || (field == Field::Birth && self.date_touched && self.birth.is_empty())
        {
            self.error(field)
        } else {
            None
        }
    }
    pub fn first_invalid(&self) -> Option<Field> {
        [Field::Height, Field::Weight, Field::Birth, Field::Gender]
            .into_iter()
            .find(|field| self.error(*field).is_some())
    }
    pub fn age(&self) -> Option<i32> {
        age_on_date(Some(&self.birth), self.day)
    }
    pub fn date_display(&self) -> Option<String> {
        parse_local_date(&self.birth).map(|day| day.format("%d/%m/%-Y").to_string())
    }
    pub fn estimate(&self) -> Option<RecalcOutput> {
        if self.error(Field::Birth).is_some() {
            return None;
        }
        Some(recalc_targets(&RecalcInput {
            weight_kg: self.weight?,
            height_cm: self.height?,
            age: f64::from(self.age()?),
            gender: self.gender?,
            goal: self.goal?,
            activity_factor: self.activity?.factor(),
        }))
    }
    pub fn profile(&self) -> Option<Value> {
        let targets = self.estimate()?;
        Some(json!({
            "height_cm":self.height?, "weight_kg":self.weight?, "birth_date":self.birth, "gender":self.gender?,
            "goal":self.goal?, "fitness_level":derive_fitness_level(self.experience?), "activity_factor":self.activity?.factor(),
            "bmr":targets.bmr, "tdee":targets.tdee, "target_calories":targets.target_calories,
            "calorie_target_mode":"auto", "target_protein":targets.target_protein, "protein_target_mode":"auto",
            "target_carbs":null, "target_fat":null, "theme":"light", "notif_morning":0, "notif_lunch":0,
            "notif_evening":0, "notif_weekly":0, "onboarding_completed":1
        }))
    }
}
