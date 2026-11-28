use leptos::{mount::mount_to, prelude::*};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

#[derive(Clone, Deserialize, PartialEq)]
struct Dish {
    id: String,
    name: String,
    is_favorite: u8,
    total_calories: Option<f64>,
    total_protein: Option<f64>,
    total_carbs: Option<f64>,
    total_fat: Option<f64>,
}

impl Dish {
    fn description(&self) -> String {
        let round = |n: Option<f64>| {
            let n = n.filter(|v| v.is_finite()).unwrap_or_default();
            let floor = n.floor();
            if n - floor >= 0.5 { floor + 1.0 } else { floor }
        };
        format!(
            "Mỗi phần: {} kcal • Protein {}g • Carbs {}g • Fat {}g",
            round(self.total_calories),
            round(self.total_protein),
            round(self.total_carbs),
            round(self.total_fat)
        )
    }
}

#[derive(Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct Suggestion {
    dish_id: String,
    dish_name: String,
    servings: f64,
    reason: String,
}

#[derive(Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct Catalog {
    meal_label: String,
    all_dishes: Vec<Dish>,
    recent_dishes: Vec<Dish>,
    loading: bool,
    ai_loading: bool,
    ai_disabled_reason: Option<String>,
    ai_suggestions: Vec<Suggestion>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Tab {
    All,
    Recent,
    Favorites,
}

fn trim_query(text: &str) -> &str {
    text.trim_matches(|c: char| c == '\u{feff}' || (c.is_whitespace() && c != '\u{0085}'))
}

impl Tab {
    fn label(self) -> &'static str {
        match self {
            Self::All => "Tất cả",
            Self::Recent => "Gần đây",
            Self::Favorites => "Đã lưu",
        }
    }

    fn empty_message(self, query: &str) -> &'static str {
        if !trim_query(query).is_empty() {
            return "Không tìm thấy món phù hợp. Thử từ khóa khác hoặc tạo món mới.";
        }
        match self {
            Self::Recent => "Chưa có món đã ăn gần đây.",
            Self::Favorites => "Chưa có món đã lưu.",
            Self::All => "Chưa có món ăn nào trong thư viện.",
        }
    }
}

#[derive(Serialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
enum PickerAction {
    Selected {
        dish_id: String,
        dish_name: String,
        servings: f64,
    },
    Servings {
        value: f64,
    },
    Create,
    Ai,
}

#[derive(Clone, Copy)]
struct Picker {
    data: RwSignal<Catalog>,
    query: RwSignal<String>,
    tab: RwSignal<Tab>,
    portions: RwSignal<f64>,
    send: UnsyncCallback<PickerAction>,
}

impl Picker {
    fn adjust(self, delta: f64) {
        let value = (self.portions.get_untracked() + delta).clamp(0.5, 20.0);
        self.portions.set(value);
        self.send.run(PickerAction::Servings { value });
    }

    fn visible(self) -> Vec<Dish> {
        let q = self.query.with(|q| trim_query(q).to_lowercase());
        let tab = self.tab.get();
        self.data.with(|d| {
            let source = if tab == Tab::Recent {
                &d.recent_dishes
            } else {
                &d.all_dishes
            };
            source
                .iter()
                .filter(|dish| {
                    (tab != Tab::Favorites || dish.is_favorite == 1)
                        && (q.is_empty() || trim_query(&dish.name).to_lowercase().contains(&q))
                })
                .cloned()
                .collect()
        })
    }
}

fn suggestions(s: Picker) -> impl IntoView {
    view! {
        <section class="logging-modal__ai" aria-labelledby="logging-ai-title">
            <div class="logging-modal__ai-header">
                <div>
                    <h3 id="logging-ai-title">"Gợi ý AI theo bữa"</h3>
                    <p>
                        "AI chỉ chọn từ thư viện món hiện có, không tự tạo món ngoài dữ liệu của bạn."
                    </p>
                </div>
                <button
                    type="button"
                    class="logging-modal__ai-button"
                    disabled=move || {
                        s.data
                            .with(|d| {
                                d.ai_loading
                                    || d.ai_disabled_reason.as_ref().is_some_and(|r| !r.is_empty())
                            })
                    }
                    aria-label=move || {
                        s.data
                            .with(|d| {
                                d.ai_disabled_reason
                                    .clone()
                                    .filter(|r| !r.is_empty())
                                    .unwrap_or_else(|| "Tạo gợi ý món bằng AI".into())
                            })
                    }
                    on:click=move |_| {
                        if s
                            .data
                            .with_untracked(|d| {
                                !d.ai_loading
                                    && d.ai_disabled_reason.as_deref().is_none_or(str::is_empty)
                            })
                        {
                            s.send.run(PickerAction::Ai)
                        }
                    }
                >
                    {move || {
                        s.data.with(|d| if d.ai_loading { "Đang gợi ý…" } else { "Gợi ý" })
                    }}
                </button>
            </div>
            {move || {
                s.data
                    .with(|d| {
                        if let Some(reason) = d
                            .ai_disabled_reason
                            .as_ref()
                            .filter(|r| !r.is_empty())
                        {
                            return view! {
                                <p class="logging-modal__ai-state" role="status">
                                    {reason.clone()}
                                </p>
                            }
                                .into_any();
                        }
                        if d.ai_suggestions.is_empty() {
                            return ().into_any();
                        }
                        view! {
                            <div class="logging-modal__ai-list">
                                {d
                                    .ai_suggestions
                                    .iter()
                                    .cloned()
                                    .map(|suggestion| {
                                        let selection = suggestion.clone();
                                        let aria = format!(
                                            "Thêm món AI gợi ý {}",
                                            suggestion.dish_name,
                                        );
                                        view! {
                                            <button
                                                type="button"
                                                class="logging-modal__ai-card"
                                                aria-label=aria
                                                on:click=move |_| {
                                                    if s
                                                        .data
                                                        .with_untracked(|d| {
                                                            d.all_dishes.iter().any(|dish| dish.id == selection.dish_id)
                                                        })
                                                    {
                                                        s.send
                                                            .run(PickerAction::Selected {
                                                                dish_id: selection.dish_id.clone(),
                                                                dish_name: selection.dish_name.clone(),
                                                                servings: selection.servings,
                                                            });
                                                    }
                                                }
                                            >
                                                <span>
                                                    <strong>{suggestion.dish_name}</strong>
                                                    <small>{suggestion.reason}</small>
                                                </span>
                                                <span>
                                                    {suggestion.servings.to_string()}" khẩu phần"
                                                </span>
                                            </button>
                                        }
                                    })
                                    .collect_view()}
                            </div>
                        }
                            .into_any()
                    })
            }}
        </section>
    }
}

fn dish_row(s: Picker, dish: Memo<Dish>) -> impl IntoView {
    view! {
        <li>
            <button
                type="button"
                class="logging-modal__dish"
                aria-label=move || {
                    s
                        .data
                        .with(|d| {
                            dish.with(|item| format!("Thêm {} vào {}", item.name, d.meal_label))
                        })
                }
                on:click=move |_| {
                    dish.with_untracked(|item| {
                        s
                            .send
                            .run(PickerAction::Selected {
                                dish_id: item.id.clone(),
                                dish_name: item.name.clone(),
                                servings: s.portions.get_untracked(),
                            })
                    });
                }
            >
                <span class="logging-modal__dish-main">
                    <span class="logging-modal__dish-name">
                        {move || dish.with(|d| d.name.clone())}
                    </span>
                    <span class="logging-modal__dish-meta">
                        {move || dish.with(Dish::description)}
                    </span>
                </span>
                <span class="logging-modal__dish-action">"Thêm"</span>
            </button>
        </li>
    }
}

fn body(s: Picker) -> impl IntoView {
    let visible = Memo::new(move |_| s.visible());
    let list_state = Memo::new(move |_| (s.data.with(|d| d.loading), visible.with(Vec::is_empty)));
    view! {
        <div class="logging-modal__servings" role="group" aria-label="Chọn khẩu phần">
            <span class="logging-modal__servings-label">"Khẩu phần"</span>
            <div class="logging-modal__stepper">
                <button
                    type="button"
                    aria-label="Giảm khẩu phần"
                    on:click=move |_| s.adjust(-0.5)
                >
                    "−"
                </button>
                <output>{move || s.portions.get().to_string()}</output>
                <button
                    type="button"
                    aria-label="Tăng khẩu phần"
                    on:click=move |_| s.adjust(0.5)
                >
                    "+"
                </button>
            </div>
        </div>
        <div class="logging-modal__tabs" role="tablist" aria-label="Bộ lọc món ăn">
            {[Tab::All, Tab::Recent, Tab::Favorites]
                .map(|tab| {
                    view! {
                        <button
                            type="button"
                            role="tab"
                            class:logging-modal__tab--active=move || s.tab.get() == tab
                            aria-selected=move || (s.tab.get() == tab).to_string()
                            on:click=move |_| s.tab.set(tab)
                        >
                            {tab.label()}
                        </button>
                    }
                })
                .collect_view()}
        </div>
        {suggestions(s)}
        {move || {
            let (loading, empty) = list_state.get();
            if loading {
                return view! {
                    <p class="logging-modal__loading" role="status">
                        "Đang tải thư viện món…"
                    </p>
                }
                    .into_any();
            }
            if empty {
                return view! {
                    <div class="logging-modal__empty">
                        <p>{move || s.query.with(|q| s.tab.get().empty_message(q))}</p>
                        <Show when=move || {
                            s.tab.get() == Tab::All || s.query.with(|q| !trim_query(q).is_empty())
                        }>
                            <button
                                type="button"
                                class="logging-modal__create"
                                on:click=move |_| s.send.run(PickerAction::Create)
                            >
                                "Tạo món mới"
                            </button>
                        </Show>
                    </div>
                }
                    .into_any();
            }
            view! {
                <ul class="logging-modal__list">
                    <ForEnumerate
                        each=move || visible.get()
                        key=|d| d.id.clone()
                        children=move |index, initial| {
                            let current = Memo::new(move |_| {
                                visible
                                    .with(|items| {
                                        items
                                            .get(index.get())
                                            .filter(|item| item.id == initial.id)
                                            .unwrap_or(&initial)
                                            .clone()
                                    })
                            });
                            dish_row(s, current)
                        }
                    />
                </ul>
            }
                .into_any()
        }}
    }
}

fn parse(json: &str) -> Result<Catalog, JsValue> {
    serde_json::from_str(json)
        .map_err(|e| js_sys::Error::new(&format!("Invalid logging picker: {e}")).into())
}

#[wasm_bindgen]
pub struct LoggingPickerHandle {
    data: RwSignal<Catalog>,
    query: RwSignal<String>,
    owner: Owner,
    unmount: Option<Box<dyn FnOnce()>>,
}

#[wasm_bindgen(js_name=mountLoggingPicker)]
pub fn mount_logging_picker(
    host: HtmlElement,
    json: &str,
    servings: f64,
    dispatch: js_sys::Function,
) -> Result<LoggingPickerHandle, JsValue> {
    let catalog = parse(json)?;
    let owner = Owner::new();
    let s = owner.with(|| Picker {
        data: RwSignal::new(catalog),
        query: RwSignal::new(String::new()),
        tab: RwSignal::new(Tab::All),
        portions: RwSignal::new(servings),
        send: UnsyncCallback::new(move |action| {
            let text = serde_json::to_string(&action).expect("picker action is serializable");
            let action = js_sys::JSON::parse(&text).unwrap_throw();
            dispatch.call1(&JsValue::UNDEFINED, &action).unwrap_throw();
        }),
    });
    let mounted = mount_to(host, move || body(s));
    Ok(LoggingPickerHandle {
        data: s.data,
        query: s.query,
        owner,
        unmount: Some(Box::new(move || drop(mounted))),
    })
}

#[wasm_bindgen]
impl LoggingPickerHandle {
    pub fn update(&self, json: &str) -> Result<(), JsValue> {
        let updated = parse(json)?;
        if self.data.with_untracked(|current| *current != updated) {
            self.data.set(updated)
        }
        Ok(())
    }

    pub fn search(&self, query: String) {
        if self.query.with_untracked(|old| old != &query) {
            self.query.set(query)
        }
    }
}

impl Drop for LoggingPickerHandle {
    fn drop(&mut self) {
        if let Some(unmount) = self.unmount.take() {
            unmount()
        }
        self.owner.cleanup();
    }
}
