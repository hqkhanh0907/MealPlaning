use super::{
    Action,
    model::{Catalog, Row, number},
};
use leptos::prelude::*;

pub(super) fn view(data: ReadSignal<Catalog>, send: Action) -> impl IntoView {
    let controls = super::controls::view(data, send);
    let show_filters = Memo::new(move |_| data.with(Catalog::show_categories));
    let categories = Memo::new(move |_| data.with(|c| c.categories.clone()));
    let selected = Memo::new(move |_| data.with(|c| c.filter.clone()));
    let filters = view! {
        <Show when=move || show_filters.get()>
            <div class="filter-strip" role="group" aria-label="Lọc theo nhóm nguyên liệu">
                <For each=move || categories.get() key=|name| name.clone() let:name>
                    {
                        let value = name.clone();
                        let label = StoredValue::new(name.clone());
                        let picked = move || selected.with(|s| label.with_value(|v| s == v));
                        view! {
                            <button
                                type="button"
                                class="filter-chip"
                                class:filter-chip--active=picked
                                aria-pressed=move || picked().to_string()
                                on:click=move |_| send.run(("filter", value.clone()))
                            >
                                {name}
                            </button>
                        }
                    }
                </For>
            </div>
        </Show>
    };
    let results = move || {
        let c = data.get();
        let ingredients = c.ingredients();
        if c.loading {
            view! {
                <p class="state-text" role="status">
                    {if ingredients {
                        "Đang tải nguyên liệu…"
                    } else {
                        "Đang tải món ăn…"
                    }}
                </p>
            }
            .into_any()
        } else if c.failed {
            view! {
                <div class="management-error">
                    <p class="state-text" role="alert">
                        {if ingredients {
                            "Không thể tải nguyên liệu."
                        } else {
                            "Không thể tải món ăn."
                        }}
                    </p>
                    <button type="button" on:click=move |_| send.run(("retry", String::new()))>
                        "Thử lại"
                    </button>
                </div>
            }
            .into_any()
        } else {
            let rows = c.visible();
            if rows.is_empty() {
                let (title, desc, icon) = c.empty();
                view! {
                    <app-empty-state class:search-empty=!c.query.trim().is_empty()>
                        <section class="empty-state" aria-live="polite">
                            <div class="empty-icon-shell" aria-hidden="true">
                                <ion-icon class="empty-icon" name=icon></ion-icon>
                            </div>
                            <h2 class="empty-title">{title}</h2>
                            <p class="empty-description">{desc}</p>
                        </section>
                    </app-empty-state>
                }
                .into_any()
            } else {
                let hint = c.hint(rows.len());
                view! {
                    <div class="card-list">
                        {rows.into_iter().map(|r| card(r, ingredients, send)).collect_view()}
                    </div>
                    {hint.map(|h| view! { <p class="result-hint result-hint--centered">{h}</p> })}
                }
                .into_any()
            }
        }
    };
    (controls, filters, results)
}

fn card(row: &Row, ingredient: bool, send: Action) -> impl IntoView {
    let open = row.id.clone();
    let options = open.clone();
    let name = row.name.clone();
    let source = row.source_label().to_string();
    let details = if ingredient {
        let category = row.category.clone();
        let badge = format!("badge badge--category badge--category-{}", row.badge());
        view! {
            <div class="item-card__split">
                <div class="item-card__heading">
                    <h3>{name.clone()}</h3>
                    <div class="badge-row">
                        <span class=badge>{category}</span>
                        <span class="badge badge--source">{source}</span>
                    </div>
                </div>
            </div>
        }
        .into_any()
    } else {
        let ai = row.kind == "ai_autofill";
        view! {
            <div class="item-card__heading item-card__heading--dish">
                <h3>{name.clone()}</h3>
                <div class="badge-row">
                    <span class=if ai {
                        "badge badge--type-ai"
                    } else {
                        "badge badge--type-ingredient"
                    }>{if ai { "AI tự điền" } else { "Nguyên liệu" }}</span>
                </div>
            </div>
            <div class="dish-calories">{number(row.total_calories)}" kcal/phần"</div>
            <p class="dish-macros">
                <span class="macro macro--protein">"Protein "{number(row.total_protein)}"g"</span>
                <span class="macro macro--carbs">"Carbs "{number(row.total_carbs)}"g"</span>
                <span class="macro macro--fat">"Fat "{number(row.total_fat)}"g"</span>
            </p>
            <p class="item-card__detail item-card__detail--dish">
                "Công thức "{number(row.servings)}" phần · "
                <span class="badge badge--source-inline">{source}</span>
            </p>
        }
        .into_any()
    };
    let edit = if ingredient {
        "editIngredient"
    } else {
        "editDish"
    };
    let menu = if ingredient {
        "ingredientOptions"
    } else {
        "dishOptions"
    };
    view! {
        <article class=if ingredient {
            "item-card item-card--ingredient"
        } else {
            "item-card item-card--dish"
        }>
            <button
                type="button"
                class="kebab-button"
                aria-haspopup="dialog"
                aria-label=format!("Tuỳ chọn cho {name}")
                on:click=move |_| send.run((menu, options.clone()))
            >
                <ion-icon name="ellipsis-vertical"></ion-icon>
            </button>
            <button
                type="button"
                class="item-card__main-action"
                aria-label=format!(
                    "Mở {} {name}",
                    if ingredient { "nguyên liệu" } else { "món ăn" },
                )
                on:click=move |_| send.run((edit, open.clone()))
            >
                {details}
            </button>
        </article>
    }
}
