use super::Action;
use leptos::prelude::*;
use serde::Deserialize;

#[derive(Deserialize, Clone, PartialEq)]
pub struct Results {
    total: usize,
    embedded: bool,
    query: String,
    filtered: bool,
    place: Option<String>,
    known: bool,
    group: Option<String>,
    rows: Vec<ResultRow>,
}
#[derive(Deserialize, Clone, PartialEq)]
struct ResultRow {
    id: String,
    name: String,
    #[serde(rename = "match")]
    muscle: Option<String>,
    equipment: Option<Vec<String>>,
}

pub(super) fn view(d: ReadSignal<Results>, send: Action) -> impl IntoView {
    move || {
        let r = d.get();
        let page_more = r.embedded && r.rows.len() < r.total;
        let list = if r.total == 0 {
            view! {
                <div class="eps-empty">
                    <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
                    <p>"Không tìm thấy bài tập phù hợp."</p>
                    {r
                        .filtered
                        .then(|| {
                            view! {
                                <button
                                    type="button"
                                    class="eps-button"
                                    data-picker-clear=""
                                    on:click=move |_| send.run(("reset", String::new()))
                                >
                                    "Bỏ tất cả bộ lọc"
                                </button>
                            }
                        })}
                    {(!r.query.is_empty())
                        .then(|| {
                            view! {
                                <button
                                    type="button"
                                    class="eps-button"
                                    on:click=move |_| send.run(("clearQuery", String::new()))
                                >
                                    "Xóa từ khóa"
                                </button>
                            }
                        })}
                </div>
            }
            .into_any()
        } else {
            view! {
            <ul class="eps-list" role="list">
                {r
                    .rows
                    .into_iter()
                    .map(|row| {
                        let equip = match row.equipment {
                            Some(keys) if keys.is_empty() => "Không cần dụng cụ".into(),
                            Some(keys) => keys.join(" · "),
                            None => "Chưa xác định dụng cụ".into(),
                        };
                        let group = if row.muscle.as_deref() == Some("secondary") {
                            r.group.clone()
                        } else {
                            None
                        };
                        let id = row.id;
                        let shown = id.clone();
                        view! {
                            <li>
                                <button
                                    type="button"
                                    class="eps-row"
                                    data-exercise-id=shown
                                    data-muscle-match=row.muscle
                                    on:click=move |_| send.run(("pick", id.clone()))
                                >
                                    <span class="eps-row__details">
                                        <span class="eps-row__name">{row.name}</span>
                                        {group
                                            .map(|g| {
                                                view! {
                                                    <span class="eps-row__muscle">"Cơ phụ · "{g}</span>
                                                }
                                            })}
                                        <span class="eps-row__equipment">{equip}</span>
                                    </span>
                                    <ion-icon
                                        name=if r.embedded {
                                            "chevron-forward-outline"
                                        } else {
                                            "add-outline"
                                        }
                                        aria-hidden="true"
                                    ></ion-icon>
                                </button>
                            </li>
                        }
                    })
                    .collect_view()}
            </ul>
            {page_more
                .then(|| {
                    view! {
                        <button
                            type="button"
                            class="eps-button"
                            on:click=move |_| send.run(("more", String::new()))
                        >
                            "Xem thêm bài tập"
                        </button>
                    }
                })}
        }.into_any()
        };
        view! {
            <p class="eps-count" role="status">
                {r.total}
                " bài tập"
            </p>
            {r
                .place
                .map(|place| {
                    view! {
                        <p class="eps-note">
                            {if r.known {
                                "Tập được với dụng cụ tại "
                            } else {
                                "Chưa khai báo dụng cụ tại "
                            }}{place}"."
                        </p>
                    }
                })}
            {list}
        }
    }
}
