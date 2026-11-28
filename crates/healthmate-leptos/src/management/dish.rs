use super::{
    Action,
    model::{Dish, number},
};
use leptos::prelude::*;

pub(super) fn hero(data: ReadSignal<Dish>) -> impl IntoView {
    move || {
        let dish = data.get();
        let p = dish.preview();
        let n = p.totals;
        let kcal = number(n.calories);
        let target = number(dish.target);
        let ring_label = format!("Calo: {kcal} / {target} kcal ({}%)", p.percent);
        let top = if p.state == "with-target" {
            view! {
                <div
                    class="nutrition-hero__ring"
                    style=format!("--ring-percent: {}", p.percent)
                    aria-label=ring_label
                >
                    <div class="nutrition-hero__ring-inner">
                        <strong class="nutrition-hero__ring-value">{kcal}</strong>
                        <span class="nutrition-hero__ring-unit">"kcal"</span>
                    </div>
                </div>
                <div class="nutrition-hero__meta">
                    <div class="nutrition-hero__meta-primary">{p.percent}"% mục tiêu"</div>
                    <div class="nutrition-hero__meta-sub">{target}" kcal hôm nay"</div>
                </div>
            }
            .into_any()
        } else {
            let (title, subtitle) = if p.state == "empty" {
                ("Chưa có dữ liệu", "Thêm nguyên liệu để xem tóm tắt")
            } else {
                ("Chưa có mục tiêu calo", "Cập nhật trong hồ sơ")
            };
            view! {
                <div class="nutrition-hero__kcal-block">
                    <strong class="nutrition-hero__kcal-value">{kcal}</strong>
                    <span class="nutrition-hero__kcal-unit">"kcal"</span>
                </div>
                <div class="nutrition-hero__meta">
                    <div class="nutrition-hero__meta-primary">{title}</div>
                    <div class="nutrition-hero__meta-sub">{subtitle}</div>
                </div>
            }
            .into_any()
        };
        view! {
            <section
                class="nutrition-hero"
                data-state=p.state
                aria-label="Tóm tắt dinh dưỡng / 1 phần"
            >
                <div class="nutrition-hero__header">
                    <div class="nutrition-hero__label">"Dinh dưỡng / 1 phần"</div>
                </div>
                <div class="nutrition-hero__top">{top}</div>
                <div class="nutrition-hero__bar" aria-hidden="true">
                    {["protein", "carbs", "fat"]
                        .into_iter()
                        .zip(p.shares)
                        .map(|(k, v)| {
                            view! {
                                <div
                                    class=format!(
                                        "nutrition-hero__bar-seg nutrition-hero__bar-seg--{k}",
                                    )
                                    style=format!("flex-grow: {v}")
                                ></div>
                            }
                        })
                        .collect_view()}
                </div>
                <ul class="nutrition-hero__pills">
                    {[
                        ("Protein", n.protein),
                        ("Carbs", n.carbs),
                        ("Fat", n.fat),
                        ("Fiber", n.fiber),
                    ]
                        .into_iter()
                        .map(|(k, v)| {
                            view! {
                                <li class=format!(
                                    "nutrition-hero__pill nutrition-hero__pill--{}",
                                    k.to_ascii_lowercase(),
                                )>
                                    <span
                                        class="nutrition-hero__pill-dot"
                                        aria-hidden="true"
                                    ></span>
                                    <span class="nutrition-hero__pill-text">
                                        {k}" "{number(v)}"g"
                                    </span>
                                </li>
                            }
                        })
                        .collect_view()}
                </ul>
            </section>
        }
    }
}
pub(super) fn items(data: ReadSignal<Dish>, send: Action) -> impl IntoView {
    move || {
        let dish = data.get();
        let count = dish.rows.len();
        let add = view! {
            <button
                type="button"
                class="btn-outline"
                disabled=dish.loading
                on:click=move |_| send.run(("addItem", String::new()))
            >
                {if dish.loading {
                    "Đang tải nguyên liệu…"
                } else if count == 0 {
                    "+ Thêm nguyên liệu đầu tiên"
                } else {
                    "+ Thêm nguyên liệu"
                }}
            </button>
        };
        let list = if count == 0 {
            view! {
                <div class="ingredient-empty" class:invalid=!dish.errors.is_empty()>
                    <div class="ingredient-empty-title">"Chưa có nguyên liệu nào"</div>
                    {add}
                </div>
            }
            .into_any()
        } else {
            view! {
            <div class="ingredient-list">
                {dish
                    .rows
                    .into_iter()
                    .map(|r| {
                        let id = r.id.clone();
                        let kcal = number(r.totals().calories);
                        view! {
                            <article class="ingredient-item ingredient-item--summary">
                                <button
                                    type="button"
                                    class="ingredient-item__main-action"
                                    aria-label=format!("Cập nhật trọng lượng {}", r.name)
                                    on:click=move |_| send.run(("editItem", id.clone()))
                                >
                                    <span class="ingredient-item__info">
                                        <span class="ingredient-item__name">{r.name.clone()}</span>" "
                                        <span class="ingredient-item__detail">
                                            {number(r.grams)}" g"
                                        </span>
                                    </span>
                                    <span class="ingredient-item__kcal">{kcal}" kcal"</span>
                                </button>
                                <button
                                    type="button"
                                    class="icon-button icon-button--danger ingredient-item__delete"
                                    aria-label=format!("Xóa {}", r.name)
                                    on:click=move |_| send.run(("removeItem", r.id.clone()))
                                >
                                    <ion-icon name="close-outline"></ion-icon>
                                </button>
                            </article>
                        }
                    })
                    .collect_view()}
            </div>
            {add}
        }.into_any()
        };
        view! {
            <div class="section-label">
                <span>
                    {if count == 0 {
                        "Nguyên liệu".to_owned()
                    } else {
                        format!("Nguyên liệu ({count})")
                    }}
                </span>
            </div>
            {list}
            {dish
                .errors
                .into_iter()
                .enumerate()
                .map(|(i, e)| {
                    view! {
                        <div
                            class="field-error"
                            id=if i == 0 {
                                "err-dish-items".into()
                            } else {
                                format!("err-dish-items-{i}")
                            }
                            role="alert"
                        >
                            {e}
                        </div>
                    }
                })
                .collect_view()}
        }
    }
}
