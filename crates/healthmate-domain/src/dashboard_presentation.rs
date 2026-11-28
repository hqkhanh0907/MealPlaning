use crate::nutrition::{NutritionTotals, percent_of_nutrition_target};
use serde::{Deserialize, Serialize, Serializer};

#[derive(Clone, Copy, Debug, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardInput {
    pub totals: NutritionTotals,
    pub logged_totals: NutritionTotals,
    pub targets: NutritionTotals,
    pub weight_summary: WeightSummary,
    pub nutrition_streak_days: Option<u32>,
    pub workout_streak_weeks: u32,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WeightSummary {
    pub current_kg: Option<f64>,
    pub delta_kg: Option<f64>,
    pub source: Option<WeightSource>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum WeightSource {
    WeightLog,
    Profile,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MacroRow {
    pub metric: String,
    pub label: String,
    pub value: f64,
    pub target: f64,
    pub percent: Option<f64>,
    pub value_label: String,
    pub target_label: String,
    pub percent_label: String,
    pub progress_css: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Insight {
    pub tone: String,
    pub title: String,
    pub body: String,
    pub cta_label: String,
    pub cta_route: String,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardPresentation {
    #[serde(serialize_with = "serialize_rounded")]
    pub logged_calories: f64,
    #[serde(serialize_with = "serialize_rounded")]
    pub rounded_calories: f64,
    pub calorie_percent: Option<f64>,
    pub protein_percent: Option<f64>,
    pub has_calorie_target: bool,
    pub has_nutrition_data: bool,
    pub calorie_target_label: String,
    pub calorie_percent_label: String,
    pub macro_rows: Vec<MacroRow>,
    pub insight: Option<Insight>,
    pub nutrition_streak_days: Option<u32>,
    pub nutrition_streak_display: String,
    pub workout_streak_display: String,
    pub weight_display: String,
    pub weight_meta: String,
}

fn serialize_rounded<S: Serializer>(value: &f64, serializer: S) -> Result<S::Ok, S::Error> {
    if value.fract() == 0.0 && *value >= i64::MIN as f64 && *value < -(i64::MIN as f64) {
        serializer.serialize_i64(*value as i64)
    } else {
        serializer.serialize_f64(*value)
    }
}

fn rounded(value: f64) -> f64 {
    if value.is_sign_negative() && value >= -0.5 {
        -0.0
    } else {
        crate::js_round(value)
    }
}

fn positive(value: f64) -> bool {
    value.is_finite() && value > 0.0
}

fn percent(value: f64, target: f64) -> Option<f64> {
    percent_of_nutrition_target(value, target).map(|p| if p == 0.0 { 0.0 } else { p })
}

// Intl rounds the shortest decimal representation, so 1.05 kg displays as 1,1 kg.
fn vi_decimal(value: f64, places: usize) -> String {
    if value.is_nan() {
        return "NaN".into();
    }
    if value.is_infinite() {
        return if value.is_sign_negative() {
            "-∞"
        } else {
            "∞"
        }
        .into();
    }
    let text = value.abs().to_string();
    let (integer, fraction) = text.split_once('.').unwrap_or((&text, ""));
    let mut digits: Vec<u8> = integer
        .bytes()
        .chain(fraction.bytes().chain(std::iter::repeat(b'0')).take(places))
        .collect();
    if fraction
        .as_bytes()
        .get(places)
        .is_some_and(|digit| *digit >= b'5')
    {
        let mut carry = true;
        for digit in digits.iter_mut().rev() {
            if *digit < b'9' {
                *digit += 1;
                carry = false;
                break;
            }
            *digit = b'0';
        }
        if carry {
            digits.insert(0, b'1');
        }
    }
    let split = digits.len() - places;
    let mut result = String::new();
    if value.is_sign_negative() {
        result.push('-');
    }
    for (i, digit) in digits[..split].iter().enumerate() {
        if i > 0 && (split - i).is_multiple_of(3) {
            result.push('.');
        }
        result.push(char::from(*digit));
    }
    if let Some(last) = digits[split..].iter().rposition(|digit| *digit != b'0') {
        result.push(',');
        result.extend(
            digits[split..=split + last]
                .iter()
                .map(|digit| char::from(*digit)),
        );
    }
    result
}

fn ungrouped_integer(value: f64) -> String {
    if value == 0.0 {
        return "0".into();
    }
    if value.is_infinite() {
        return if value.is_sign_negative() {
            "-Infinity"
        } else {
            "Infinity"
        }
        .into();
    }
    if value.abs() >= 1e21 {
        let s = format!("{value:e}");
        if let Some((base, exponent)) = s.split_once('e') {
            return format!("{base}e+{exponent}");
        }
    }
    value.to_string()
}

fn percentage_label(percent: Option<f64>) -> String {
    percent.map_or_else(|| "—".into(), |v| format!("{}%", vi_decimal(rounded(v), 0)))
}

fn macro_row(metric: &str, label: &str, amount: f64, target: f64) -> MacroRow {
    let value = rounded(amount);
    let percent = percent(amount, target);
    let width = percent.map_or(0.0, |v| {
        let n = rounded(v);
        if n > 100.0 { 100.0 } else { n }
    });
    MacroRow {
        metric: metric.into(),
        label: label.into(),
        value,
        target,
        percent,
        value_label: format!("{} g", vi_decimal(value, 0)),
        target_label: if positive(target) {
            format!("{} g", vi_decimal(rounded(target), 0))
        } else {
            "Chưa có mục tiêu".into()
        },
        percent_label: percentage_label(percent),
        progress_css: format!("{}%", ungrouped_integer(width)),
    }
}

fn insight(
    calories: f64,
    calorie_percent: Option<f64>,
    protein_percent: Option<f64>,
) -> Option<Insight> {
    if calories <= 0.0 {
        return None;
    }
    let kcal = calorie_percent?;
    let (title, body, cta) = if kcal > 120.0 {
        (
            "Kế hoạch calo đang vượt mục tiêu",
            format!(
                "Các món theo lịch cả ngày tương ứng {}% mục tiêu kcal.",
                ungrouped_integer(rounded(kcal))
            ),
            "Điều chỉnh lịch ăn",
        )
    } else {
        let protein = protein_percent?;
        if !(kcal >= 50.0 && protein < 70.0) {
            return None;
        }
        (
            "Protein đang thấp so với kế hoạch",
            format!(
                "Các món theo lịch cung cấp {}% mục tiêu Protein và {}% mục tiêu kcal.",
                ungrouped_integer(rounded(protein)),
                ungrouped_integer(rounded(kcal))
            ),
            "Thêm món giàu Protein",
        )
    };
    Some(Insight {
        tone: "warning".into(),
        title: title.into(),
        body,
        cta_label: cta.into(),
        cta_route: "/tabs/calendar".into(),
    })
}

fn weight_labels(summary: WeightSummary) -> (String, String) {
    let Some(weight) = summary.current_kg else {
        return ("—".into(), "Chưa có cân nặng trong hồ sơ".into());
    };
    let meta = match summary.delta_kg {
        Some(delta) => format!(
            "{}{} kg so với lần cân trước",
            if delta > 0.0 { "+" } else { "" },
            vi_decimal(delta, 1)
        ),
        None if summary.source == Some(WeightSource::WeightLog) => {
            "Chưa có mốc cân trước đó".into()
        }
        None => "Dữ liệu từ hồ sơ cá nhân".into(),
    };
    (format!("{} kg", vi_decimal(weight, 1)), meta)
}

pub fn present(input: &DashboardInput) -> DashboardPresentation {
    let t = input.totals;
    let g = input.targets;
    let calorie_percent = percent(t.calories, g.calories);
    let protein_percent = percent(t.protein, g.protein);
    let (weight_display, weight_meta) = weight_labels(input.weight_summary);
    DashboardPresentation {
        logged_calories: rounded(input.logged_totals.calories),
        rounded_calories: rounded(t.calories),
        calorie_percent,
        protein_percent,
        has_calorie_target: g.calories > 0.0,
        has_nutrition_data: t.calories > 0.0,
        calorie_target_label: if positive(g.calories) {
            format!("{} kcal", vi_decimal(rounded(g.calories), 0))
        } else {
            "Chưa có mục tiêu kcal".into()
        },
        calorie_percent_label: percentage_label(calorie_percent),
        macro_rows: vec![
            macro_row("protein", "Protein", t.protein, g.protein),
            macro_row("carbs", "Carbs", t.carbs, g.carbs),
            macro_row("fat", "Fat", t.fat, g.fat),
            macro_row("fiber", "Fiber", t.fiber, g.fiber),
        ],
        insight: insight(t.calories, calorie_percent, protein_percent),
        nutrition_streak_days: input.nutrition_streak_days,
        nutrition_streak_display: input
            .nutrition_streak_days
            .map_or_else(|| "—".into(), |n| format!("{n} ngày")),
        workout_streak_display: if input.workout_streak_weeks > 0 {
            format!("{} tuần", input.workout_streak_weeks)
        } else {
            "—".into()
        },
        weight_display,
        weight_meta,
    }
}
