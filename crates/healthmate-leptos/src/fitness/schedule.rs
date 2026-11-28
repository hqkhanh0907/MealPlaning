use super::{
    Action,
    model::{Planned, Today, Week},
};
use leptos::prelude::*;

fn exercises(rows: Vec<Planned>, history: bool) -> impl IntoView {
    view! {
        <div class="planned-exercise-list">
            {rows
                .into_iter()
                .map(|row| {
                    let name = row.name().to_owned();
                    let prescription = row.prescription();
                    view! {
                        <article class="planned-exercise">
                            <strong>{name}</strong>
                            <span>{prescription}</span>
                            {history
                                .then_some(row.notes)
                                .flatten()
                                .filter(|s| !s.is_empty())
                                .map(|s| view! { <small>{s}</small> })}
                            {history
                                .then_some(row.last)
                                .flatten()
                                .filter(|s| !s.is_empty())
                                .map(|s| view! { <small>"Lần trước: "{s}</small> })}
                            <small>{row.purpose}</small>
                        </article>
                    }
                })
                .collect_view()}
        </div>
    }
}

pub(super) fn today(data: ReadSignal<Today>, send: Action) -> impl IntoView {
    move || {
        let d = data.get();
        let active = d.current.is_some();
        let no_issue = d.error.as_ref().is_none_or(String::is_empty);
        let primary = if let Some(current) = d.current {
            view! {
                <section class="fitness-card today-workout">
                    <p class="eyebrow">"Buổi tập đang diễn ra"</p>
                    <h2>
                        {current
                            .title
                            .filter(|s| !s.is_empty())
                            .unwrap_or_else(|| "Tập tự do".into())}
                    </h2>
                    <p>{current.count}" bài tập"</p>
                    <ion-button
                        expand="block"
                        data-testid="resume-workout"
                        on:click=move |_| send.run(("resume", String::new()))
                    >
                        "Tiếp tục buổi tập"
                    </ion-button>
                </section>
            }
            .into_any()
        } else if !d.plan && !d.loading && no_issue {
            view! {
            <section class="fitness-card today-workout">
                <h2>"Bắt đầu tập luyện"</h2>
                <p>
                    "Chọn giáo án theo lịch và dụng cụ của bạn, hoặc tự thêm bài cho buổi hôm nay."
                </p>
                <ion-button
                    expand="block"
                    data-testid="find-workout-plan"
                    href="/training/plans"
                    on:click=move |e: leptos::ev::MouseEvent| {
                        if !e.ctrl_key() && !e.meta_key() && !e.shift_key() && !e.alt_key()
                            && e.button() == 0
                        {
                            e.prevent_default();
                            send.run(("plans", String::new()))
                        }
                    }
                >
                    "Tìm giáo án phù hợp"
                </ion-button>
                <ion-button
                    expand="block"
                    fill="outline"
                    data-testid="start-free"
                    on:click=move |_| send.run(("free", String::new()))
                >
                    "Bắt đầu tập tự do"
                </ion-button>
            </section>
        }.into_any()
        } else if d.plan {
            let offer_free = d.day.as_ref().is_none_or(|day| day.is_rest_day != 1);
            let details = match d.day {
                None => view! {
                    <div class="empty-workout">
                        <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
                        <strong>"Giáo án trống hôm nay"</strong>
                    </div>
                }
                .into_any(),
                Some(day) if day.is_rest_day == 1 => view! {
                    <div class="empty-workout">
                        <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
                        <strong>{day.name}</strong>
                        <ion-button
                            fill="outline"
                            aria-label="Bắt đầu buổi tự do"
                            on:click=move |_| send.run(("free", String::new()))
                        >
                            "Tập tự do"
                        </ion-button>
                    </div>
                }
                .into_any(),
                Some(day) => view! {
                    <div class="today-plan">
                        <div>
                            <strong>{day.name}</strong>
                            <span>{day.exercises.len()}" bài · theo giáo án"</span>
                        </div>
                        <ion-button
                            fill="solid"
                            aria-label="Bắt đầu buổi tập theo giáo án"
                            on:click=move |_| send.run(("guided", String::new()))
                        >
                            <ion-icon slot="start" name="flash-outline"></ion-icon>
                            "Bắt đầu"
                        </ion-button>
                    </div>
                    {exercises(day.exercises, true)}
                }
                .into_any(),
            };
            view! {
                <section class="fitness-card today-workout" aria-labelledby="today-workout-title">
                    <header class="section-header">
                        <div>
                            <h2 id="today-workout-title">"Buổi tập hôm nay"</h2>
                        </div>
                    </header>
                    {details}
                    {offer_free
                        .then(|| {
                            view! {
                                <ion-button
                                    fill="outline"
                                    data-testid="start-free"
                                    on:click=move |_| send.run(("free", String::new()))
                                >
                                    "Bắt đầu tập tự do"
                                </ion-button>
                            }
                        })}
                </section>
            }
            .into_any()
        } else {
            ().into_any()
        };
        view! {
            {d
                .loading
                .then(|| {
                    view! {
                        <p class="status-banner" role="status">
                            "Đang tải dữ liệu tập luyện…"
                        </p>
                    }
                })}
            {d
                .error
                .filter(|s| !s.is_empty())
                .map(|s| {
                    view! {
                        <div class="status-banner status-banner--error">
                            <p role="alert">{s}</p>
                            {(!d.loading && !d.progress)
                                .then(|| {
                                    view! {
                                        <ion-button
                                            fill="outline"
                                            on:click=move |_| send.run(("retry", String::new()))
                                        >
                                            "Thử lại"
                                        </ion-button>
                                    }
                                })}
                        </div>
                    }
                })}
            {d
                .success
                .filter(|s| !s.is_empty())
                .map(|s| {
                    view! {
                        <p class="status-banner status-banner--success" role="status">
                            {s}
                        </p>
                    }
                })}
            {(d.undo && !active)
                .then(|| {
                    view! {
                        <div class="undo-snackbar">
                            <span class="undo-snackbar__msg" role="status">
                                "Đã hủy buổi tập."
                            </span>
                            <button
                                type="button"
                                class="undo-snackbar__action"
                                aria-label="Hoàn tác hủy buổi tập"
                                on:click=move |_| send.run(("undo", String::new()))
                            >
                                "Hoàn tác"
                            </button>
                            <button
                                type="button"
                                class="undo-snackbar__dismiss"
                                aria-label="Đóng"
                                on:click=move |_| send.run(("dismissUndo", String::new()))
                            >
                                "✕"
                            </button>
                        </div>
                    }
                })}
            {primary}
        }
    }
}
pub(super) fn week(data: ReadSignal<Week>, send: Action) -> impl IntoView {
    let plan = Memo::new(move |_| data.with(|w| w.plan.clone()));
    let selected_id = Memo::new(move |_| data.with(|w| w.selected.clone()));
    move || {
        plan.get().map(|plan|{
        let days=StoredValue::new(plan.days.clone());
        let selected=move ||selected_id.with(|id|days.with_value(|days|days.iter().find(|day|Some(&day.id)==id.as_ref()).cloned()));
        let id=plan.id;
        view! {
            <section class="fitness-card active-plan-card" aria-labelledby="active-plan-title">
                <header class="active-plan-card__head">
                    <div class="active-plan-card__meta">
                        <p class="eyebrow">"Giáo án"</p>
                        <h2 id="active-plan-title">{plan.name}</h2>
                        <span class="active-plan-card__sub">
                            {plan.frequency}" buổi/tuần · "{plan.planned_exercises}" bài"
                        </span>
                    </div>
                    <ion-button
                        fill="outline"
                        on:click=move |_| send.run(("finder", String::new()))
                    >
                        "Tìm giáo án phù hợp"
                    </ion-button>
                </header>
                <div class="week-strip" role="group" aria-label="Lịch tập trong tuần">
                    {plan
                        .days
                        .into_iter()
                        .map(|day| {
                            let key = day.id.clone();
                            let picked = move || selected_id.with(|id| Some(&key) == id.as_ref());
                            let rest = day.is_rest_day == 1;
                            let short = if day.day_of_week == 0 {
                                "CN".into()
                            } else {
                                format!("T{}", day.day_of_week + 1)
                            };
                            let full = if day.day_of_week == 0 {
                                "Chủ nhật".into()
                            } else {
                                format!("Thứ {}", day.day_of_week + 1)
                            };
                            view! {
                                <button
                                    type="button"
                                    class="week-day"
                                    class:week-day--rest=rest
                                    aria-pressed=move || picked().to_string()
                                    aria-label=format!("{full}: {}", day.name)
                                    on:click=move |_| send.run(("day", day.id.clone()))
                                >
                                    <span>{short}</span>
                                    <small>
                                        {if rest {
                                            "Nghỉ".into()
                                        } else {
                                            format!("{} bài", day.exercises.len())
                                        }}
                                    </small>
                                </button>
                            }
                        })
                        .collect_view()}
                </div>
                <ion-button
                    size="small"
                    fill="outline"
                    disabled=move || data.with(|w| w.loading || w.busy || w.active)
                    on:click=move |_| send.run(("editPlan", id.clone()))
                >
                    "Chỉnh giáo án"
                </ion-button>
                {move || {
                    selected()
                        .map(|day| {
                            let start = day.is_rest_day != 1 && !day.exercises.is_empty();
                            view! {
                                <section aria-label="Chi tiết buổi tập">
                                    <div class="today-plan">
                                        <strong>{day.name}</strong>
                                        {start
                                            .then(|| {
                                                view! {
                                                    <ion-button
                                                        size="small"
                                                        fill="outline"
                                                        disabled=move || data.with(|w| w.active)
                                                        on:click=move |_| send.run(("startDay", day.id.clone()))
                                                    >
                                                        "Tập buổi này"
                                                    </ion-button>
                                                }
                                            })}
                                    </div>
                                    {exercises(day.exercises, false)}
                                </section>
                            }
                        })
                }}
            </section>
        }
    })
    }
}
