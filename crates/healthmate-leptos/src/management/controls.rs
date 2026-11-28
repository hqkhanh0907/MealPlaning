use super::{Action, model::Catalog};
use leptos::prelude::*;

pub(super) fn view(data: ReadSignal<Catalog>, send: Action) -> impl IntoView {
    let ingredients = Memo::new(move |_| data.with(|d| d.ingredients()));
    let menu = Memo::new(move |_| data.with(|d| d.menu));
    let query = Memo::new(move |_| data.with(|d| d.query.clone()));
    let search = Memo::new(move |_| {
        data.with(|d| !d.query.trim().is_empty() || d.loading || !d.rows.is_empty())
    });
    let trigger = NodeRef::<leptos::html::Button>::new();
    let close = move |e: leptos::ev::KeyboardEvent| {
        if e.key() == "Escape" {
            send.run(("closeCreate", String::new()));
            if let Some(button) = trigger.get_untracked() {
                let _ = button.focus();
            }
        }
    };
    view! {
        <app-segmented-control>
            <div
                class="segment-control"
                role="tablist"
                aria-label="Chuyển giữa nguyên liệu và món ăn"
            >
                {[
                    ("ingredients", "Nguyên liệu", "Tab nguyên liệu"),
                    ("dishes", "Món ăn", "Tab món ăn"),
                ]
                    .into_iter()
                    .map(|(k, label, aria)| {
                        let selected = move || ingredients.get() == (k == "ingredients");
                        view! {
                            <button
                                type="button"
                                class="segment-button"
                                class:selected=selected
                                role="tab"
                                aria-selected=move || selected().to_string()
                                aria-label=aria
                                on:click=move |_| send.run(("tab", k.into()))
                            >
                                {label}
                            </button>
                        }
                    })
                    .collect_view()}
            </div>
        </app-segmented-control>
        <div class="management-create">
            <button
                node_ref=trigger
                class="management-create__trigger"
                type="button"
                aria-label=move || {
                    (!ingredients.get())
                        .then(|| {
                            if menu.get() {
                                "Đóng menu tạo món"
                            } else {
                                "Mở menu tạo món"
                            }
                        })
                }
                aria-expanded=move || (!ingredients.get()).then(|| menu.get().to_string())
                aria-controls=move || menu.get().then_some("dish-create-options")
                on:keydown=close
                on:click=move |_| send.run(("create", String::new()))
            >
                <ion-icon
                    aria-hidden="true"
                    name=move || if menu.get() { "close-outline" } else { "add-outline" }
                ></ion-icon>
                {move || if ingredients.get() { "Thêm nguyên liệu" } else { "Tạo món" }}
            </button>
            <Show when=move || menu.get()>
                <div class="management-create__options" id="dish-create-options">
                    {[
                        ("manualDish", "create-outline", "Tạo món từ nguyên liệu"),
                        ("aiDish", "sparkles-outline", "AI tự điền từ tên món"),
                    ]
                        .into_iter()
                        .map(|(k, icon, label)| {
                            view! {
                                <button
                                    type="button"
                                    class="management-create__option"
                                    aria-label=label
                                    on:keydown=close
                                    on:click=move |_| send.run((k, String::new()))
                                >
                                    <ion-icon name=icon aria-hidden="true"></ion-icon>
                                    <span>{label}</span>
                                </button>
                            }
                        })
                        .collect_view()}
                </div>
            </Show>
        </div>
        <Show when=move || search.get()>
            <app-search-toolbar>
                <label
                    class="search-toolbar"
                    role="search"
                    aria-label=move || {
                        if ingredients.get() { "Tìm nguyên liệu" } else { "Tìm món ăn" }
                    }
                >
                    <ion-icon
                        class="search-icon"
                        name="search-outline"
                        aria-hidden="true"
                    ></ion-icon>
                    <input
                        class="search-input"
                        type="text"
                        aria-label=move || {
                            if ingredients.get() { "Tìm nguyên liệu" } else { "Tìm món ăn" }
                        }
                        placeholder=move || {
                            if ingredients.get() {
                                "Tìm nguyên liệu..."
                            } else {
                                "Tìm món ăn..."
                            }
                        }
                        prop:value=move || query.get()
                        on:input=move |e| {
                            send
                                .run((
                                    if ingredients.get_untracked() {
                                        "searchIngredients"
                                    } else {
                                        "searchDishes"
                                    },
                                    event_target_value(&e),
                                ))
                        }
                    />
                    <Show when=move || !query.get().is_empty()>
                        <button
                            class="search-clear"
                            type="button"
                            aria-label="Xóa tìm kiếm"
                            on:click=move |_| {
                                send
                                    .run((
                                        if ingredients.get_untracked() {
                                            "searchIngredients"
                                        } else {
                                            "searchDishes"
                                        },
                                        String::new(),
                                    ))
                            }
                        >
                            <span class="search-clear-dot">
                                <ion-icon name="close-circle-outline" aria-hidden="true"></ion-icon>
                            </span>
                        </button>
                    </Show>
                </label>
            </app-search-toolbar>
        </Show>
    }
}
