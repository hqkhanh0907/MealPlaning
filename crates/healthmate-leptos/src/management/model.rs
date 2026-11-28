use healthmate_domain::nutrition::{
    NutritionTotals, ingredient_portion, percent_of_nutrition_target, scale_nutrition,
};
use serde::Deserialize;

#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct Row {
    pub id: String,
    pub name: String,
    pub source: String,
    #[serde(default)]
    pub category: String,
    #[serde(default, rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub servings: f64,
    #[serde(default)]
    pub total_calories: f64,
    #[serde(default)]
    pub total_protein: f64,
    #[serde(default)]
    pub total_carbs: f64,
    #[serde(default)]
    pub total_fat: f64,
}
impl Row {
    pub fn source_label(&self) -> &str {
        match self.source.as_str() {
            "db" => "Có sẵn",
            "ai" => "AI",
            _ => "Tự tạo",
        }
    }
    pub fn badge(&self) -> &str {
        match self.category.as_str() {
            "Thịt" => "cat-thit",
            "Cá & Hải sản" => "cat-ca",
            "Trứng & Sữa" => "cat-trung",
            "Rau củ" => "cat-rau",
            "Ngũ cốc & Tinh bột" => "cat-ngu-coc",
            "Đậu & Hạt" => "cat-dau-hat",
            "Dầu & Mỡ" => "cat-dau-mo",
            "Gia vị" => "cat-gia-vi",
            "Nước dùng & Nước chấm" => "cat-nuoc-dung",
            "Trái cây" => "cat-trai-cay",
            _ => "cat-khac",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct Catalog {
    pub tab: String,
    pub query: String,
    pub filter: String,
    pub loading: bool,
    pub failed: bool,
    #[serde(default)]
    pub menu: bool,
    pub categories: Vec<String>,
    pub rows: Vec<Row>,
}
impl Catalog {
    pub fn ingredients(&self) -> bool {
        self.tab == "ingredients"
    }
    pub fn show_categories(&self) -> bool {
        self.ingredients()
            && self.query.trim().is_empty()
            && (self.loading || !self.rows.is_empty())
    }
    pub fn visible(&self) -> Vec<&Row> {
        self.rows
            .iter()
            .filter(|r| !self.ingredients() || self.filter == "Tất cả" || r.category == self.filter)
            .collect()
    }
    pub fn hint(&self, n: usize) -> Option<String> {
        if n == 0 {
            return None;
        }
        let query = self.query.trim();
        if !query.is_empty() {
            return Some(if self.ingredients() {
                format!("{n} kết quả cho “{query}”")
            } else {
                format!("{n} kết quả")
            });
        }
        (self.ingredients() && self.filter != "Tất cả")
            .then(|| format!("{n} nguyên liệu trong “{}”", self.filter))
    }
    pub fn empty(&self) -> (&'static str, &'static str, &'static str) {
        match (
            self.ingredients(),
            !self.query.trim().is_empty(),
            self.filter == "Tất cả",
        ) {
            (true, true, _) => (
                "Không tìm thấy nguyên liệu nào",
                "Thử từ khóa khác hoặc thêm nguyên liệu mới.",
                "search-outline",
            ),
            (true, false, false) => (
                "Không có nguyên liệu trong nhóm này",
                "Chọn nhóm khác hoặc thêm nguyên liệu.",
                "nutrition-outline",
            ),
            (true, false, true) => (
                "Chưa có nguyên liệu nào",
                "Thêm nguyên liệu để tạo công thức cho món ăn.",
                "nutrition-outline",
            ),
            (false, true, _) => (
                "Không tìm thấy món ăn nào",
                "Thử tên món khác hoặc thêm món ăn mới.",
                "search-outline",
            ),
            (false, false, _) => (
                "Chưa có món ăn nào",
                "Thêm món ăn đầu tiên để bắt đầu lập kế hoạch bữa ăn.",
                "restaurant-outline",
            ),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct Portion {
    pub id: String,
    pub name: String,
    pub grams: f64,
    pub nutrition: Option<NutritionTotals>,
}
impl Portion {
    pub fn totals(&self) -> NutritionTotals {
        self.nutrition
            .filter(|_| self.grams > 0.)
            .map(|n| ingredient_portion(n, self.grams))
            .unwrap_or_default()
    }
}
#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct Dish {
    pub servings: Option<f64>,
    pub target: f64,
    pub rows: Vec<Portion>,
    pub loading: bool,
    pub errors: Vec<String>,
}
pub struct Preview {
    pub totals: NutritionTotals,
    pub percent: f64,
    pub shares: [f64; 3],
    pub state: &'static str,
}
impl Dish {
    pub fn preview(&self) -> Preview {
        let mut sum = NutritionTotals::default();
        for row in &self.rows {
            let n = row.totals();
            sum.calories += n.calories;
            sum.protein += n.protein;
            sum.carbs += n.carbs;
            sum.fat += n.fat;
            sum.fiber += n.fiber;
        }
        let totals = scale_nutrition(sum, 1. / self.servings.filter(|s| *s > 0.).unwrap_or(1.));
        let weights = [totals.protein * 4., totals.carbs * 4., totals.fat * 9.];
        let kcal = weights.iter().sum::<f64>();
        let shares = weights.map(|v| {
            if kcal > 0. {
                (v / kcal * 100.).round()
            } else {
                0.
            }
        });
        let percent = percent_of_nutrition_target(totals.calories, self.target)
            .unwrap_or_default()
            .round()
            .min(100.);
        let state = if totals.calories <= 0. {
            "empty"
        } else if self.target > 0. {
            "with-target"
        } else {
            "no-target"
        };
        Preview {
            totals,
            percent,
            shares,
            state,
        }
    }
}
#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct Ingredient {
    pub category: String,
    pub values: [Option<f64>; 5],
    pub submitted: bool,
}
impl Ingredient {
    pub fn error(&self, index: usize) -> String {
        if !self.submitted {
            return String::new();
        }
        if index == 0 {
            return if crate::model::trimmed(&self.category).is_empty() {
                "Vui lòng chọn nhóm nguyên liệu".into()
            } else {
                String::new()
            };
        }
        let label = ["Calories", "Protein", "Carbs", "Fat", "Fiber"][index - 1];
        if let Some(value) = self.values[index - 1] {
            if !value.is_finite() {
                return "Số không hợp lệ".into();
            }
            if value < 0. {
                return format!("{label} không được nhỏ hơn 0");
            }
            if value > if index == 1 { 1000. } else { 100. } {
                return if index == 1 {
                    "Calories không được vượt 1000 kcal/100g".into()
                } else {
                    format!("{label} không được vượt 100 g/100g")
                };
            }
        }
        let macros = &self.values[1..4];
        if index == 1
            && macros.iter().flatten().all(|v| *v >= 0.)
            && macros.iter().flatten().sum::<f64>() > 100.
        {
            return "Protein + Carbs + Fat trên 100 g không được vượt 100 g.".into();
        }
        String::new()
    }
}

pub fn number(value: f64) -> String {
    if value.fract() == 0. {
        let mut buffer = ryu_js::Buffer::new();
        return buffer.format(value).into();
    }
    // The nearest tenth on an exact tie rounds away from zero in Number.toFixed.
    let magnitude = value.abs();
    let rounded = if (magnitude * 4.).fract() == 0. {
        format!("{:.1}", (magnitude * 10.).round() / 10.)
    } else {
        format!("{magnitude:.1}")
    };
    let digits = rounded.strip_suffix(".0").unwrap_or(&rounded);
    if value.is_sign_negative() {
        format!("-{digits}")
    } else {
        digits.into()
    }
}
