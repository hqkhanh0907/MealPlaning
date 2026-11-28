use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Meal {
    Breakfast,
    Lunch,
    Dinner,
    Snack,
}

impl Meal {
    pub const ALL: [Self; 4] = [Self::Breakfast, Self::Lunch, Self::Dinner, Self::Snack];
    pub fn label(self) -> &'static str {
        match self {
            Self::Breakfast => "Bữa sáng",
            Self::Lunch => "Bữa trưa",
            Self::Dinner => "Bữa tối",
            Self::Snack => "Bữa phụ",
        }
    }
    pub fn key(self) -> &'static str {
        match self {
            Self::Breakfast => "breakfast",
            Self::Lunch => "lunch",
            Self::Dinner => "dinner",
            Self::Snack => "snack",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingMeal {
    pub date: String,
    pub meal_type: Meal,
    pub planned_dish_id: String,
}

#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MacroRow {
    pub metric: String,
    pub label: String,
    pub value_label: String,
    pub target_label: String,
    pub percent_label: String,
    pub progress_css: String,
    pub target: f64,
}
#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct AiInsight {
    pub title: String,
    pub body: String,
    pub action: String,
    pub tone: String,
}
#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Insight {
    pub title: String,
    pub body: String,
    pub cta_label: String,
    pub cta_route: String,
    pub tone: String,
}

#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Portion {
    pub name: String,
    pub grams: Option<f64>,
    pub included: bool,
    pub warning: Option<String>,
    pub confidence: String,
    pub nutrition_label: String,
}
pub fn trimmed(s: &str) -> &str {
    s.trim_matches(|c|matches!(c,'\u{9}'..='\u{d}'|'\u{20}'|'\u{a0}'|'\u{1680}'|'\u{2000}'..='\u{200a}'|'\u{2028}'|'\u{2029}'|'\u{202f}'|'\u{205f}'|'\u{3000}'|'\u{feff}'))
}
impl Portion {
    pub fn display_name(&self) -> &str {
        let name = trimmed(&self.name);
        if name.is_empty() {
            "Món chưa đặt tên"
        } else {
            name
        }
    }
    pub fn valid_name(&self) -> bool {
        (1..=80).contains(&trimmed(&self.name).encode_utf16().count())
    }
    pub fn valid_grams(&self) -> bool {
        self.grams
            .is_some_and(|g| g.is_finite() && g > 0.0 && g <= 2000.0)
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoDraft {
    pub capture_id: String,
    pub date_label: String,
    pub meal_type: Meal,
    pub image_quality_warning: Option<String>,
    pub portions: Vec<Portion>,
}

#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dashboard {
    pub loading: bool,
    pub refresh_failed: bool,
    pub today_label: String,
    pub logged_calories: i64,
    pub rounded_calories: i64,
    pub pending_meal: Option<PendingMeal>,
    pub calorie_target_label: String,
    pub calorie_percent_label: String,
    pub has_calorie_target: bool,
    pub has_nutrition_data: bool,
    pub macro_rows: Vec<MacroRow>,
    pub daily_ai_insight: Option<AiInsight>,
    pub insight: Option<Insight>,
    pub nutrition_streak_days: Option<u32>,
    pub workout_streak_display: String,
    pub weight_display: String,
    pub weight_meta: String,
    pub online: bool,
    pub daily_ai_loading: bool,
    pub text_issue: Option<String>,
    pub insight_provider: Option<String>,
    pub insight_error: String,
    pub food_image_loading: bool,
    pub photo_issue: Option<String>,
    pub photo_saving: bool,
    pub can_save_photo: bool,
    pub photo_error: String,
    pub photo_draft: Option<PhotoDraft>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Action {
    Refresh,
    AddMeal,
    OpenPendingMeal { target: PendingMeal },
    Navigate { route: String },
    GenerateDailyInsight,
    AnalyzeMealPhoto,
    EnterPhotoMealManually,
    CancelPhoto,
    SavePhoto,
    SelectPhotoMeal { value: Meal },
    SetPhotoIncluded { index: usize, checked: bool },
    SetPhotoName { index: usize, value: String },
    SetPhotoGrams { index: usize, value: Option<f64> },
}
