use super::{Action, Screen};
use healthmate_domain::dates::parse_local_date;
use leptos::prelude::*;
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(super) struct WeekDay {
    date: String,
    label: String,
    dot_count: u32,
    logged_cal: f64,
    planned_cal: f64,
    target_cal: f64,
    is_today: bool,
    is_past: bool,
    has_plan: bool,
}

impl WeekDay {
    fn status(&self) -> (&'static str, &'static str) {
        if !self.has_plan {
            return ("no-plan", "ellipse-outline");
        }
        if self.is_today {
            return ("today-recording", "radio-button-on-outline");
        }
        if !self.is_past {
            return ("future-planned", "ellipse-outline");
        }
        if self.target_cal <= 0.0 {
            return ("past-no-target", "ellipse-outline");
        }
        let percent = (self.logged_cal / self.target_cal * 100.0).round();
        if !(50.0..=120.0).contains(&percent) {
            ("past-extreme", "close-circle-outline")
        } else if percent >= 110.0 {
            ("past-over", "alert-circle-outline")
        } else if percent >= 80.0 {
            ("past-on-target", "checkmark-circle-outline")
        } else {
            ("past-under", "remove-circle-outline")
        }
    }

    fn display_cal(&self) -> f64 {
        if self.is_past {
            self.logged_cal
        } else {
            self.planned_cal
        }
    }

    fn calorie_type(&self) -> &'static str {
        if self.is_past {
            "Đã ăn"
        } else {
            "Dự kiến"
        }
    }

    fn aria_label(&self) -> String {
        let target = if self.target_cal > 0.0 {
            format!(" trên {} kcal", self.target_cal)
        } else {
            " kcal, chưa đặt mục tiêu".to_owned()
        };
        format!(
            "{} {}, {} {}{target}",
            self.label,
            self.date,
            self.calorie_type(),
            self.display_cal()
        )
    }
}

fn range_label(days: &[String]) -> String {
    if days.len() != 7 {
        return String::new();
    }
    let a = parse_local_date(&days[0]);
    let b = parse_local_date(&days[6]);
    if let (Some(a), Some(b)) = (a, b)
        && a.format("%Y-%m").to_string() == b.format("%Y-%m").to_string()
    {
        return format!(
            "{} – {} tháng {}",
            a.format("%-d"),
            b.format("%-d"),
            b.format("%-m")
        );
    }
    let endpoint = |d: Option<healthmate_domain::dates::NaiveDate>| {
        d.map_or_else(
            || "NaN tháng NaN".into(),
            |d| d.format("%-d tháng %-m").to_string(),
        )
    };
    format!("{} – {}", endpoint(a), endpoint(b))
}

#[cfg(target_arch = "wasm32")]
fn whole_number(value: f64, locale: &str) -> String {
    let rounded = value.round();
    js_sys::Number::from(if rounded == 0.0 { 0.0 } else { rounded })
        .to_locale_string(locale)
        .into()
}

#[cfg(not(target_arch = "wasm32"))]
fn whole_number(value: f64, locale: &str) -> String {
    let rounded = value.round();
    let digits = rounded.abs().to_string();
    let mut result = if rounded < 0.0 {
        "-".to_owned()
    } else {
        String::new()
    };
    let separator = if locale.starts_with("vi") { '.' } else { ',' };
    for (i, digit) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i).is_multiple_of(3) {
            result.push(separator);
        }
        result.push(digit);
    }
    result
}

fn day_row(s: Screen, initial: WeekDay) -> impl IntoView {
    let date = initial.date.clone();
    let day = Memo::new(move |_| {
        s.data.with(|d| {
            d.week
                .as_deref()
                .unwrap_or_default()
                .iter()
                .find(|entry| entry.date == initial.date)
                .unwrap_or(&initial)
                .clone()
        })
    });
    let locale = Memo::new(move |_| s.data.with(|d| d.locale.clone()));
    view! {
        <li>
            <app-day-row>
                <button
                    type="button"
                    class=move || {
                        day
                            .with(|d| {
                                format!(
                                    "day-row day-row--{}{}",
                                    d.status().0,
                                    if d.is_today { " day-row--today" } else { "" },
                                )
                            })
                    }
                    on:click=move |_| {
                        s
                            .send
                            .run(Action::WeekDay {
                                date: date.clone(),
                            })
                    }
                    aria-current=move || day.with(|d| d.is_today.then_some("date"))
                    aria-label=move || day.with(WeekDay::aria_label)
                >
                    <span class="day-row__label">
                        <span>
                            <span class="day-row__label-name">
                                {move || day.with(|d| d.label.clone())}
                            </span>
                            <span class="day-row__label-date">
                                {move || {
                                    day
                                        .with(|d| {
                                            parse_local_date(&d.date)
                                                .map(|date| date.format("%-d").to_string())
                                                .unwrap_or_default()
                                        })
                                }}
                            </span>
                        </span>
                        {move || {
                            day
                                .with(|d| d.is_today)
                                .then(|| {
                                    view! { <span class="day-row__today-pill">"Hôm nay"</span> }
                                })
                        }}
                    </span>
                    <ion-icon
                        class="day-row__status"
                        name=move || day.with(|d| d.status().1)
                        aria-hidden="true"
                    ></ion-icon>
                    <span class="day-row__cal">
                        <span>
                            <span class="day-row__cal-num">
                                {move || day.with(|d| whole_number(d.display_cal(), &locale.get()))}
                            </span>
                            " "<span class="day-row__cal-cap">
                                {move || {
                                    day
                                        .with(|d| {
                                            if d.target_cal > 0.0 {
                                                format!(
                                                    "/ {} kcal",
                                                    whole_number(d.target_cal, &locale.get()),
                                                )
                                            } else {
                                                "kcal".into()
                                            }
                                        })
                                }}
                            </span>
                        </span>
                        <span class="day-row__cal-type">
                            {move || day.with(WeekDay::calorie_type)}
                        </span>
                    </span>
                    {move || {
                        day
                            .with(|d| {
                                (d.dot_count > 0)
                                    .then(|| {
                                        view! {
                                            <span class="day-row__dots" aria-hidden="true">
                                                {(0..d.dot_count.min(6))
                                                    .map(|_| view! { <span class="day-row__dot"></span> })
                                                    .collect_view()}
                                            </span>
                                        }
                                    })
                            })
                    }}
                </button>
            </app-day-row>
        </li>
    }
}

pub(super) fn week(s: Screen) -> impl IntoView {
    view! {
        <section class="week-view" aria-labelledby="calendar-week-title">
            <header class="week-view__header">
                <div class="week-view__title-block">
                    <h2 class="week-view__title" id="calendar-week-title">
                        "Lịch theo tuần"
                    </h2>
                    <span class="week-view__range">
                        {move || s.data.with(|d| range_label(&d.week_days))}
                    </span>
                </div>
                <nav class="week-view__nav" aria-label="Điều hướng tuần">
                    <button
                        type="button"
                        class="week-view__nav-btn"
                        on:click=move |_| s.send.run(Action::WeekNav { delta: -7 })
                        aria-label="Tuần trước"
                    >
                        <ion-icon name="chevron-back" aria-hidden="true"></ion-icon>
                    </button>
                    <button
                        type="button"
                        class="week-view__nav-btn"
                        on:click=move |_| s.send.run(Action::WeekNav { delta: 7 })
                        aria-label="Tuần sau"
                    >
                        <ion-icon name="chevron-forward" aria-hidden="true"></ion-icon>
                    </button>
                </nav>
            </header>
            <button
                type="button"
                class="week-view__copy-btn"
                disabled=move || s.data.with(|d| d.copying_week)
                on:click=move |_| s.send.run(Action::CopyWeek)
            >
                <ion-icon name="copy-outline" aria-hidden="true"></ion-icon>
                <span>
                    {move || {
                        s
                            .data
                            .with(|d| {
                                if d.copying_week {
                                    "Đang sao chép…"
                                } else {
                                    "Sao chép tuần trước"
                                }
                            })
                    }}
                </span>
            </button>
            <Show
                when=move || s.data.with(|d| d.week.is_some())
                fallback=|| {
                    view! {
                        <p class="calendar-loading" role="status">
                            "Đang tải dữ liệu tuần…"
                        </p>
                    }
                }
            >
                <ul class="week-view__list">
                    <For
                        each=move || s.data.with(|d| d.week.clone().unwrap_or_default())
                        key=|day| day.date.clone()
                        children=move |entry| day_row(s, entry)
                    />
                </ul>
            </Show>
        </section>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn weekday_status_uses_the_rounded_ratio_after_the_plan_and_date_checks() {
        let mut day: WeekDay = serde_json::from_value(serde_json::json!({
            "date":"2026-05-17", "label":"CN", "dotCount":9, "loggedCal":109.5,
            "plannedCal":12.2, "targetCal":100, "isToday":false, "isPast":true, "hasPlan":true
        }))
        .unwrap();
        assert_eq!(day.status().0, "past-over");
        day.logged_cal = 120.49;
        assert_eq!(day.status().0, "past-over");
        day.logged_cal = 120.5;
        assert_eq!(day.status().0, "past-extreme");
        day.is_today = true;
        day.has_plan = false;
        assert_eq!(day.status().0, "no-plan");
    }

    #[test]
    fn week_across_new_year_displays_both_months() {
        let days: Vec<_> = healthmate_domain::dates::week_dates("2026-12-28")
            .into_iter()
            .map(|date| date.to_string())
            .collect();
        assert_eq!(range_label(&days), "28 tháng 12 – 3 tháng 1");
        assert_eq!(range_label(&days[..6]), "");
    }
}
