use super::Screen;
use healthmate_domain::{
    dates::parse_local_date,
    nutrition::{NutritionTotals, percent_of_nutrition_target},
};
use leptos::prelude::*;
use serde::Deserialize;

#[derive(Clone, Copy, Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(super) struct Summary {
    totals: NutritionTotals,
    targets: NutritionTotals,
    primary_metric: Metric,
    loading: bool,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum Metric {
    Calories,
    Protein,
    Carbs,
    Fat,
    Fiber,
}

impl Metric {
    fn label(self) -> &'static str {
        match self {
            Self::Calories => "Calo",
            Self::Protein => "Protein",
            Self::Carbs => "Carbs",
            Self::Fat => "Fat",
            Self::Fiber => "Fiber",
        }
    }

    fn ring_label(self) -> &'static str {
        match self {
            Self::Calories | Self::Fiber => "Calo",
            Self::Protein => "Đạm",
            Self::Carbs => "Tinh bột",
            Self::Fat => "Chất béo",
        }
    }

    fn unit(self) -> &'static str {
        if self == Self::Calories { "kcal" } else { "g" }
    }

    fn read(self, totals: NutritionTotals) -> f64 {
        let value = match self {
            Self::Calories => totals.calories,
            Self::Protein => totals.protein,
            Self::Carbs => totals.carbs,
            Self::Fat => totals.fat,
            Self::Fiber => totals.fiber,
        };
        if !value.is_finite() {
            return 0.0;
        }
        let floor = value.floor();
        let rounded = if value - floor >= 0.5 {
            floor + 1.0
        } else {
            floor
        };
        if rounded == 0.0 { 0.0 } else { rounded }
    }
}

#[derive(Clone, Copy)]
struct Measure {
    value: f64,
    target: f64,
}

impl Measure {
    fn percent(self) -> f64 {
        percent_of_nutrition_target(self.value, self.target).unwrap_or_default()
    }
}

impl Summary {
    fn metric(self, metric: Metric) -> Measure {
        Measure {
            value: metric.read(self.totals),
            target: metric.read(self.targets),
        }
    }
}

fn summary_date(iso: &str) -> String {
    let Some(date) = parse_local_date(iso) else {
        return iso.into();
    };
    let weekday = match date.format("%w").to_string().as_str() {
        "0" => "Chủ nhật",
        "1" => "Thứ 2",
        "2" => "Thứ 3",
        "3" => "Thứ 4",
        "4" => "Thứ 5",
        "5" => "Thứ 6",
        _ => "Thứ 7",
    };
    format!("{weekday}, {}", date.format("%d/%m/%Y"))
}

fn band(percent: f64) -> &'static str {
    if !percent.is_finite() || percent < 50.0 {
        "low"
    } else if percent < 80.0 {
        "medium"
    } else if percent <= 110.0 {
        "good"
    } else if percent <= 120.0 {
        "medium"
    } else {
        "high"
    }
}

fn ring(metric: Metric, measure: Measure) -> impl IntoView {
    let percent = measure.percent();
    let circumference = std::f64::consts::TAU * 46.0;
    let offset = circumference * (1.0 - percent.min(100.0) / 100.0);
    let label = format!(
        "{} {} trên {}, {} phần trăm",
        metric.ring_label(),
        measure.value,
        measure.target,
        percent.round()
    );
    view! {
        <app-calorie-ring>
            <svg
                class=format!("calorie-ring calorie-ring--{}", band(percent))
                width="64"
                height="64"
                viewBox="0 0 100 100"
                role="img"
                aria-label=label
            >
                <circle
                    class="calorie-ring__track"
                    cx="50"
                    cy="50"
                    r="46"
                    stroke-width="8"
                    fill="none"
                />
                <circle
                    class="calorie-ring__fill"
                    cx="50"
                    cy="50"
                    r="46"
                    stroke-width="8"
                    fill="none"
                    stroke-dasharray=circumference
                    stroke-dashoffset=offset
                    transform="rotate(-90 50 50)"
                />
                <text class="calorie-ring__label" x="50" y="55" text-anchor="middle">
                    {measure.value.to_string()}
                </text>
            </svg>
        </app-calorie-ring>
    }
}

fn macro_row(data: Summary, metric: Metric) -> impl IntoView {
    let Measure { value, target } = data.metric(metric);
    let percent = data.metric(metric).percent().min(200.0);
    let label = metric.label();
    let values = if target > 0.0 {
        format!("{value}/{target} g")
    } else {
        format!("{value} g · chưa đặt mục tiêu")
    };
    let aria = if target > 0.0 {
        format!(
            "{label} {value} trên {target}, {} phần trăm",
            percent.round()
        )
    } else {
        format!("{label} {values}")
    };
    view! {
        <div
            class="macro-row__item"
            class:macro-row__item--highlighted=(metric == data.primary_metric)
            aria-label=aria
        >
            <div class="macro-row__row-head">
                <span class="macro-row__label">{label}</span>
                <span class="macro-row__values">{values}</span>
            </div>
            {(target > 0.0)
                .then(|| {
                    view! {
                        <div class=format!("macro-row__bar macro-row__bar--{}", band(percent))>
                            <div
                                class="macro-row__bar-fill"
                                style:width=format!("{}%", percent.min(100.0))
                            ></div>
                        </div>
                    }
                })}
        </div>
    }
}

fn hero(data: Summary) -> impl IntoView {
    let metric = data.primary_metric;
    let measure = data.metric(metric);
    let Measure { value, target } = measure;
    let label = metric.label();
    let unit = metric.unit();
    let percent = measure.percent().round();
    let (aria, text, note) = if target > 0.0 {
        (
            format!("{label} {value} trên {target} {unit}, {percent} phần trăm mục tiêu"),
            format!("{value} / {target} {unit}"),
            format!("{percent}% mục tiêu"),
        )
    } else {
        (
            format!("{label} {value} {unit}, chưa đặt mục tiêu"),
            format!("{value} {unit}"),
            "Chưa đặt mục tiêu".into(),
        )
    };
    view! {
        <div class="day-summary-card__hero" aria-label=aria>
            {(target > 0.0).then(|| ring(metric, measure))}
            <div class="day-summary-card__metric">
                <span class="day-summary-card__metric-label">{label}" theo lịch"</span>
                <strong class="day-summary-card__metric-value">{text}</strong>
                <span class="day-summary-card__metric-note">{note}</span>
            </div>
        </div>
    }
}

pub(super) fn summary(s: Screen) -> impl IntoView {
    let expanded = RwSignal::new(false);
    let data = Memo::new(move |_| s.data.with(|d| d.summary));
    view! {
        <app-day-summary-card>
            <section
                class="day-summary-card"
                data-date=move || s.data.with(|d| d.date.clone())
                aria-label="Tổng quan dinh dưỡng"
                aria-busy=move || data.get().loading.to_string()
            >
                <header class="day-summary-card__header">
                    <div>
                        <p class="day-summary-card__eyebrow">
                            {move || s.data.with(|d| summary_date(&d.date))}
                        </p>
                        <h2 class="day-summary-card__title">"Tổng quan dinh dưỡng"</h2>
                    </div>
                    {move || {
                        data
                            .get()
                            .loading
                            .then(|| {
                                view! {
                                    <span class="day-summary-card__sync">
                                        "Đang cập nhật…"
                                    </span>
                                }
                            })
                    }}
                </header>
                {move || hero(data.get())}
                <button
                    type="button"
                    class="day-summary-card__detail-toggle"
                    aria-expanded=move || expanded.get().to_string()
                    aria-controls="day-summary-detail"
                    on:click=move |_| expanded.update(|open| *open = !*open)
                >
                    {move || {
                        if expanded.get() {
                            "Ẩn chi tiết macro"
                        } else {
                            "Xem chi tiết macro"
                        }
                    }}
                </button>
                <Show when=move || expanded.get()>
                    <div id="day-summary-detail" class="day-summary-card__details">
                        <app-macro-row>
                            <div class="macro-row macro-row--expanded">
                                {move || {
                                    [Metric::Protein, Metric::Carbs, Metric::Fat, Metric::Fiber]
                                        .map(|m| macro_row(data.get(), m))
                                        .collect_view()
                                }}
                            </div>
                        </app-macro-row>
                        <p class="day-summary-card__fiber-note">
                            "Mục tiêu tham chiếu của Fiber là 25 g mỗi ngày. Món đã ăn từ bản cũ hiển thị 0 g nếu trước đó chưa lưu chỉ số này."
                        </p>
                    </div>
                </Show>
            </section>
        </app-day-summary-card>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn summary_rounds_before_calculating_percent_and_keeps_the_uncapped_value() {
        let summary: Summary = serde_json::from_value(serde_json::json!({
            "loading": false, "primaryMetric": "protein",
            "totals": { "calories": 0, "protein": 15.5, "carbs": 0, "fat": 0, "fiber": 0 },
            "targets": { "calories": 0, "protein": 6.5, "carbs": 0, "fat": 0, "fiber": 25 }
        }))
        .unwrap();
        let primary = summary.metric(summary.primary_metric);
        assert_eq!(primary.value, 16.0);
        assert_eq!(primary.target, 7.0);
        assert_eq!(primary.percent().round(), 229.0);
        assert_eq!(summary_date("2026-05-17"), "Chủ nhật, 17/05/2026");
        assert_eq!(summary_date("2026-02-30"), "2026-02-30");
        assert_eq!(band(110.0), "good");
        assert_eq!(band(110.1), "medium");
    }
}
