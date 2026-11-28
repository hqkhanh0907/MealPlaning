use healthmate_domain::dashboard_presentation::{DashboardInput, DashboardPresentation, present};
use serde::{Deserialize, Deserializer, Serialize};

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
pub struct AiInsight {
    pub title: String,
    pub body: String,
    pub action: String,
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
    #[serde(deserialize_with = "dashboard_metrics")]
    pub metrics: DashboardPresentation,
    pub pending_meal: Option<PendingMeal>,
    pub daily_ai_insight: Option<AiInsight>,
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

fn dashboard_metrics<'de, D: Deserializer<'de>>(raw: D) -> Result<DashboardPresentation, D::Error> {
    DashboardInput::deserialize(raw).map(|input| present(&input))
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
