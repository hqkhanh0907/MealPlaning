use crate::{
    model::{Action, Dashboard},
    photo,
};
use leptos::prelude::*;

#[derive(Clone, Copy)]
pub(crate) struct Screen {
    pub data: RwSignal<Dashboard>,
    pub send: UnsyncCallback<Action>,
}
impl Screen {
    pub fn read<T>(&self, f: impl FnOnce(&Dashboard) -> T) -> T {
        self.data.with(f)
    }
    pub fn action(&self, a: Action) {
        self.send.run(a)
    }
}
pub(crate) fn icon(name: &'static str) -> impl IntoView {
    view! { <ion-icon name=name aria-hidden="true"></ion-icon> }
}
fn follow(e: web_sys::MouseEvent, screen: Screen, action: Action) {
    if e.default_prevented()
        || e.button() != 0
        || e.ctrl_key()
        || e.meta_key()
        || e.alt_key()
        || e.shift_key()
    {
        return;
    }
    e.prevent_default();
    screen.action(action);
}

fn hero(s: Screen) -> impl IntoView {
    let pending = Memo::new(move |_| s.read(|d| d.pending_meal.clone()));
    view! {
        <section class="dashboard-hero" aria-labelledby="dashboard-title">
            <div class="dashboard-hero__date">
                {icon("calendar-outline")}" "{move || s.read(|d| d.today_label.clone())}
            </div>
            <h1 id="dashboard-title">"Hôm nay"</h1>
            <dl class="today-nutrition">
                <div>
                    <dt>"Đã ăn"</dt>
                    <dd>{move || s.read(|d| ryu_js::Buffer::new().format(d.metrics.logged_calories).to_owned())}" "<small>"kcal"</small></dd>
                </div>
                <div>
                    <dt>"Theo lịch cả ngày"</dt>
                    <dd>{move || s.read(|d| ryu_js::Buffer::new().format(d.metrics.rounded_calories).to_owned())}" "<small>"kcal"</small></dd>
                </div>
            </dl>
            <div class="dashboard-hero__actions">
                {move || {
                    pending
                        .get()
                        .map(|target| {
                            let label = target.meal_type.label();
                            view! {
                                <a
                                    class="card-link today-primary-action"
                                    href="/tabs/calendar"
                                    aria-label=format!("{label} chưa ghi. Mở lịch ăn")
                                    on:click=move |e| follow(
                                        e,
                                        s,
                                        Action::OpenPendingMeal {
                                            target: target.clone(),
                                        },
                                    )
                                >
                                    {label}
                                    " chưa ghi "
                                    {icon("chevron-forward-outline")}
                                </a>
                            }
                        })
                }}
                <button
                    class="card-link add-today-meal"
                    class:today-primary-action=move || pending.with(Option::is_none)
                    type="button"
                    on:click=move |_| s.action(Action::AddMeal)
                >
                    "Thêm món"
                </button> <Show when=move || pending.with(Option::is_none)>
                    <a
                        class="card-link"
                        href="/tabs/calendar"
                        on:click=move |e| follow(
                            e,
                            s,
                            Action::Navigate {
                                route: "/tabs/calendar".into(),
                            },
                        )
                    >
                        "Mở lịch ăn "
                        {icon("chevron-forward-outline")}
                    </a>
                </Show>
            </div>
        </section>
    }
}

fn nutrition(s: Screen) -> impl IntoView {
    let macros = Memo::new(move |_| s.read(|d| d.metrics.macro_rows.clone()));
    view! {
        <section class="dashboard-card nutrition-card" aria-labelledby="nutrition-card-title">
            <header class="dashboard-card__header">
                <h2 id="nutrition-card-title">"Dinh dưỡng theo lịch"</h2>
            </header>
            <div class="nutrition-overview">
                <div>
                    <span>{move || s.read(|d| d.metrics.calorie_target_label.clone())}</span>
                    <small>
                        {move || {
                            s
                                .read(|d| {
                                    if d.metrics.has_calorie_target {
                                        format!(
                                            "Theo lịch đạt {} mục tiêu.",
                                            d.metrics.calorie_percent_label,
                                        )
                                    } else {
                                        "Bạn vẫn có thể ghi bữa ăn.".into()
                                    }
                                })
                        }}
                    </small>
                </div>
            </div>
            <Show when=move || s.read(|d| d.metrics.has_nutrition_data)>
                <div
                    class="macro-list"
                    aria-label="Dinh dưỡng của các món theo lịch hôm nay"
                >
                    {move || {
                        macros
                            .get()
                            .into_iter()
                            .map(|r| {
                                view! {
                                    <article class=format!("macro-item macro-item--{}", r.metric)>
                                        <div class="macro-item__header">
                                            <span>{r.label}</span>
                                            <strong>{r.percent_label}</strong>
                                        </div>
                                        <div class="macro-item__meta">
                                            <span>{r.value_label}</span>
                                            <span>
                                                {if r.target > 0. {
                                                    format!("Mục tiêu {}", r.target_label)
                                                } else {
                                                    r.target_label
                                                }}
                                            </span>
                                        </div>
                                        <div class="progress-track" aria-hidden="true">
                                            <span
                                                class="progress-fill"
                                                style=("--progress", r.progress_css)
                                            ></span>
                                        </div>
                                    </article>
                                }
                            })
                            .collect_view()
                    }}
                </div>
            </Show>
        </section>
    }
}
fn insights(s: Screen) -> impl IntoView {
    let source =
        Memo::new(move |_| s.read(|d| (d.daily_ai_insight.clone(), d.metrics.insight.clone())));
    move || {
        let (ai, local) = source.get();
        if let Some(a) = ai {
            Some(
                view! {
                    <section
                        class="dashboard-card ai-card"
                        class:ai-card--warning=a.tone == "warning"
                        aria-labelledby="ai-insight-title"
                    >
                        <div class="dashboard-card__icon" aria-hidden="true">
                            {icon("sparkles-outline")}
                        </div>
                        <div class="dashboard-card__content">
                            <p class="dashboard-card__eyebrow">"Nhận xét của AI"</p>
                            <h2 id="ai-insight-title" tabindex="-1">
                                {a.title}
                            </h2>
                            <p>{a.body}</p>
                            <p class="ai-card__action">{a.action}</p>
                        </div>
                    </section>
                }
                .into_any(),
            )
        } else {
            local.map(|i| {
                let route = i.cta_route.clone();
                view! {
                    <section
                        class="dashboard-card ai-card"
                        class:ai-card--warning=i.tone == "warning"
                        aria-labelledby="ai-insight-title"
                    >
                        <div class="dashboard-card__icon" aria-hidden="true">
                            {icon("sparkles-outline")}
                        </div>
                        <div class="dashboard-card__content">
                            <p class="dashboard-card__eyebrow">"Gợi ý dinh dưỡng"</p>
                            <h2 id="ai-insight-title">{i.title}</h2>
                            <p>{i.body}</p>
                            <a
                                class="card-link"
                                href=i.cta_route
                                on:click=move |e| follow(
                                    e,
                                    s,
                                    Action::Navigate {
                                        route: route.clone(),
                                    },
                                )
                            >
                                {i.cta_label}
                                " "
                                {icon("chevron-forward-outline")}
                            </a>
                        </div>
                    </section>
                }
                .into_any()
            })
        }
    }
}
fn stats(s: Screen) -> impl IntoView {
    view! {
        <section class="stat-section" aria-labelledby="stat-section-title">
            <header class="section-header">
                <h2 id="stat-section-title">"Chuỗi theo dõi và cân nặng"</h2>
            </header>
            <dl class="stat-list">
                <div>
                    <dt>{icon("flame-outline")}"Ngày liên tiếp ăn gần mục tiêu"</dt>
                    <dd>
                        {move || s.read(|d| d.metrics.nutrition_streak_display.clone())}
                    </dd>
                    <Show when=move || s.read(|d| d.metrics.nutrition_streak_days.is_some())>
                        <small>
                            "Tính đến hôm qua, trong khoảng 80–120% mục tiêu kcal hiện tại."
                        </small>
                    </Show>
                </div>
                <div>
                    <dt>{icon("fitness-outline")}"Tuần tập liên tiếp"</dt>
                    <dd>{move || s.read(|d| d.metrics.workout_streak_display.clone())}</dd>
                </div>
                <div>
                    <dt>{icon("scale-outline")}"Cân nặng gần nhất"</dt>
                    <dd>{move || s.read(|d| d.metrics.weight_display.clone())}</dd>
                    <small>{move || s.read(|d| d.metrics.weight_meta.clone())}</small>
                </div>
            </dl>
        </section>
    }
}
fn quick_actions(s: Screen) -> impl IntoView {
    view! {
        <section class="quick-actions" aria-label="Hành động nhanh">
            <app-ai-offline-banner>
                <Show when=move || s.read(|d| !d.online)>
                    <output class="ai-offline-banner" aria-live="polite">
                        <ion-icon
                            class="ai-offline-icon"
                            name="cloud-offline-outline"
                            aria-hidden="true"
                        ></ion-icon>
                        <span class="ai-offline-text">
                            "Cần kết nối mạng để dùng AI"
                        </span>
                    </output>
                </Show>
            </app-ai-offline-banner>
            <button
                class="quick-action quick-action--primary quick-action--button"
                type="button"
                disabled=move || {
                    s
                        .read(|d| {
                            d.daily_ai_loading
                                || d.text_issue.as_ref().is_some_and(|i| !i.is_empty())
                        })
                }
                aria-busy=move || s.read(|d| d.daily_ai_loading.to_string())
                on:click=move |_| s.action(Action::GenerateDailyInsight)
            >
                <span class="quick-action__icon" aria-hidden="true">
                    {icon("sparkles-outline")}
                </span>
                <span>
                    <strong>
                        {move || {
                            s
                                .read(|d| {
                                    if d.daily_ai_loading {
                                        "AI đang phân tích…"
                                    } else {
                                        "Nhận xét của AI"
                                    }
                                })
                        }}
                    </strong>
                    <small>
                        {move || {
                            s
                                .read(|d| match d
                                    .insight_provider
                                    .as_deref()
                                    .filter(|p| !p.is_empty())
                                {
                                    Some(p) => {
                                        format!(
                                            "Gửi tổng dinh dưỡng và tập luyện tới {p} để nhận gợi ý.",
                                        )
                                    }
                                    None => d.text_issue.clone().unwrap_or_default(),
                                })
                        }}
                    </small>
                </span>
            </button>
            <Show when=move || s.read(|d| !d.insight_error.is_empty())>
                <p class="quick-action-error" role="alert">
                    {move || s.read(|d| d.insight_error.clone())}
                </p>
            </Show>
            <Show
                when=move || s.read(|d| d.photo_draft.is_some())
                fallback=move || photo::capture(s)
            >
                {photo::review(s)}
            </Show>
            <Show when=move || s.read(|d| !d.photo_error.is_empty())>
                <p class="photo-card__error" role="alert">
                    {move || s.read(|d| d.photo_error.clone())}
                </p>
                <Show when=move || s.read(|d| d.photo_draft.is_none())>
                    <ion-button
                        fill="clear"
                        on:click=move |_| s.action(Action::EnterPhotoMealManually)
                    >
                        "Ghi món thủ công"
                    </ion-button>
                </Show>
            </Show>
        </section>
    }
}
pub(crate) fn body(s: Screen) -> impl IntoView {
    view! {
        <Show
            when=move || s.read(|d| !d.loading)
            fallback=|| {
                view! {
                    <p class="dashboard-loading" role="status">
                        "Đang cập nhật số liệu…"
                    </p>
                }
            }
        >
            <Show
                when=move || s.read(|d| !d.refresh_failed)
                fallback=move || {
                    view! {
                        <div class="dashboard-card dashboard-error">
                            <p role="alert">"Không thể tải số liệu tổng quan."</p>
                            <ion-button fill="outline" on:click=move |_| s.action(Action::Refresh)>
                                "Thử lại"
                            </ion-button>
                        </div>
                    }
                }
            >
                {hero(s)}
                {nutrition(s)}
                {insights(s)}
                {stats(s)}
                {quick_actions(s)}
            </Show>
        </Show>
    }
}
