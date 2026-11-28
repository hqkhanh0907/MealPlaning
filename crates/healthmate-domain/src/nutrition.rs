use serde::{Deserialize, Serialize};

#[derive(Default, Copy, Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct NutritionTotals {
    pub calories: f64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    #[serde(default)]
    pub fiber: f64,
}

pub fn scale_nutrition(amount: NutritionTotals, factor: f64) -> NutritionTotals {
    NutritionTotals {
        calories: amount.calories * factor,
        protein: amount.protein * factor,
        carbs: amount.carbs * factor,
        fat: amount.fat * factor,
        fiber: amount.fiber * factor,
    }
}

pub fn ingredient_portion(per_100g: NutritionTotals, grams: f64) -> NutritionTotals {
    scale_nutrition(per_100g, grams / 100.0)
}

pub fn portion_nutrition(
    estimate: NutritionTotals,
    estimated_grams: f64,
    grams: f64,
) -> NutritionTotals {
    scale_nutrition(estimate, grams / estimated_grams)
}

pub fn percent_of_nutrition_target(value: f64, target: f64) -> Option<f64> {
    if !target.is_finite() || target <= 0.0 {
        return None;
    }
    let percent = value / target * 100.0;
    Some(if percent < 0.0 { 0.0 } else { percent })
}

pub const MIN_PLANNED_SERVINGS: f64 = 0.1;
pub const MAX_PLANNED_SERVINGS: f64 = 20.0;
pub const MAX_PHOTO_GRAMS: f64 = 2000.0;

pub fn valid_planned_servings(value: f64) -> bool {
    (MIN_PLANNED_SERVINGS..=MAX_PLANNED_SERVINGS).contains(&value)
}
pub fn round_suggested_servings(value: f64) -> f64 {
    (crate::js_round(value * 2.0) / 2.0).clamp(0.5, 3.0)
}
pub fn valid_photo_grams(grams: f64) -> bool {
    grams > 0.0 && grams <= MAX_PHOTO_GRAMS
}

pub fn valid_photo_name(name: &str) -> bool {
    let trimmed = name.trim_matches(|c: char| matches!(c,'\u{0009}'..='\u{000D}'|'\u{0020}'|'\u{00A0}'|'\u{1680}'|'\u{2000}'..='\u{200A}'|'\u{2028}'|'\u{2029}'|'\u{202F}'|'\u{205F}'|'\u{3000}'|'\u{FEFF}'));
    (1..=80).contains(&trimmed.encode_utf16().count())
}

pub fn per_serving(recipe: NutritionTotals, servings: Option<f64>) -> NutritionTotals {
    let yield_count = servings.filter(|n| *n > 0.0).unwrap_or(1.0);
    NutritionTotals {
        calories: recipe.calories / yield_count,
        protein: recipe.protein / yield_count,
        carbs: recipe.carbs / yield_count,
        fat: recipe.fat / yield_count,
        fiber: recipe.fiber / yield_count,
    }
}

pub enum PlannedNutrition {
    Planned {
        per_serving: NutritionTotals,
        servings: f64,
    },
    Completed {
        snapshot: NutritionTotals,
    },
}

impl PlannedNutrition {
    pub fn totals(self) -> NutritionTotals {
        match self {
            Self::Completed { snapshot } => snapshot,
            Self::Planned {
                per_serving,
                servings,
            } => scale_nutrition(per_serving, servings),
        }
    }
}
