use super::{Action, model::number};
use leptos::prelude::*;
use serde::Deserialize;
#[derive(Clone, Deserialize, PartialEq)]
struct Point {
    label: String,
    volume: f64,
}
#[derive(Clone, Deserialize, PartialEq)]
struct Strength {
    exercise_name: String,
    exercise_name_vi: Option<String>,
    estimated_1rm: f64,
}
#[derive(Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct Stats {
    current_week_volume: f64,
    previous_week_volume: f64,
    workout_streak_weeks: u32,
    weekly_avg_weight_kg: Option<f64>,
    weight_source: Option<String>,
    volume_by_muscle: Vec<Point>,
    strength: Vec<Strength>,
}
#[derive(Clone, Deserialize, PartialEq)]
struct Week {
    date: String,
    label: String,
    volume: f64,
}
#[derive(Clone, Deserialize, PartialEq)]
pub struct Trend {
    error: bool,
    open: bool,
    stats: Option<Stats>,
    weeks: Vec<Week>,
}
fn kg(n: f64) -> String {
    format!("{} kg", number(n))
}
pub(super) fn view(data: ReadSignal<Trend>, send: Action) -> impl IntoView {
    move || {
        let d = data.get();
        let body = if d.error {
            view! {
        <p role="alert">"Chưa tải được số liệu tiến bộ."</p>
        <ion-button fill="outline" on:click=move |_| send.run(("reloadTrend", String::new()))>
            "Tải lại số liệu"
        </ion-button>
    }.into_any()
        } else if let Some(stats) = d.stats {
            let max = d.weeks.iter().map(|w| w.volume).fold(1., f64::max);
            view! {
            <p>
                <strong>{kg(stats.current_week_volume)}</strong>
                " tuần này · "
                {kg(stats.previous_week_volume)}
                " tuần trước"
            </p>
            <ion-button
                fill="clear"
                aria-expanded=d.open.to_string()
                on:click=move |_| send.run(("toggleTrend", String::new()))
            >
                {if d.open { "Thu gọn" } else { "Xem xu hướng 8 tuần" }}
            </ion-button>
            {d
                .open
                .then(|| {
                    view! {
                        <ol class="week-volume" aria-label="Khối lượng theo tuần">
                            {d
                                .weeks
                                .into_iter()
                                .map(|w| {
                                    view! {
                                        <li>
                                            <time datetime=w.date>{w.label}</time>
                                            <meter
                                                min="0"
                                                max=max
                                                value=w.volume
                                                aria-label="Khối lượng đã ghi"
                                            ></meter>
                                            <strong>{kg(w.volume)}</strong>
                                        </li>
                                    }
                                })
                                .collect_view()}
                        </ol>
                        <p>
                            {stats.workout_streak_weeks}
                            " tuần tập liên tiếp trong 12 tuần gần nhất."
                        </p>
                        {stats
                            .weekly_avg_weight_kg
                            .map(|v| {
                                view! {
                                    <p>
                                        {if stats.weight_source.as_deref() == Some("profile") {
                                            "Cân nặng trong hồ sơ"
                                        } else {
                                            "Cân nặng trung bình 7 ngày"
                                        }}" · "{kg(v)}
                                    </p>
                                }
                            })}
                        {(!stats.volume_by_muscle.is_empty())
                            .then(|| {
                                view! {
                                    <h3>"Khối lượng tuần này theo nhóm cơ"</h3>
                                    <ul>
                                        {stats
                                            .volume_by_muscle
                                            .into_iter()
                                            .map(|p| view! { <li>{p.label}" · "{kg(p.volume)}</li> })
                                            .collect_view()}
                                    </ul>
                                }
                            })}
                        {(!stats.strength.is_empty())
                            .then(|| {
                                view! {
                                    <h3>"Sức mạnh ước tính (Epley)"</h3>
                                    <p>
                                        "Từ hiệp 1–10 lần đánh dấu Tối đa trong 12 tuần. Hiệp một lần dùng mức tạ đã ghi."
                                    </p>
                                    <ul>
                                        {stats
                                            .strength
                                            .into_iter()
                                            .map(|p| {
                                                view! {
                                                    <li>
                                                        {p
                                                            .exercise_name_vi
                                                            .filter(|n| !n.is_empty())
                                                            .unwrap_or(p.exercise_name)}" · "{kg(p.estimated_1rm)}
                                                    </li>
                                                }
                                            })
                                            .collect_view()}
                                    </ul>
                                }
                            })}
                    }
                })}
        }.into_any()
        } else {
            ().into_any()
        };
        view! {
            <section class="trend" aria-labelledby="trend-title">
                <h2 id="trend-title">"Tiến bộ qua các tuần"</h2>
                {body}
            </section>
        }
    }
}
