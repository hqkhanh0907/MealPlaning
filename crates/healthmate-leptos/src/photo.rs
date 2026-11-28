use crate::{
    model::{Action, Meal, Portion},
    view::{Screen, icon},
};
use leptos::prelude::*;
use web_sys::{CustomEvent, HtmlInputElement, HtmlSelectElement};

pub(crate) fn capture(s: Screen) -> impl IntoView {
    view! {
        <button
            type="button"
            class="quick-action quick-action--button"
            disabled=move || {
                s
                    .read(|d| {
                        d.food_image_loading
                            || d.photo_issue.as_ref().is_some_and(|i| !i.is_empty())
                    })
            }
            aria-label=move || {
                s
                    .read(|d| {
                        if d.food_image_loading {
                            "AI đang phân tích ảnh món ăn"
                        } else {
                            "Chụp hoặc chọn ảnh món ăn"
                        }
                    })
            }
            on:click=move |_| s.action(Action::AnalyzeMealPhoto)
        >
            <span class="quick-action__icon" aria-hidden="true">
                {icon("camera-outline")}
            </span>
            <span>
                <strong>
                    {move || {
                        s
                            .read(|d| {
                                if d.food_image_loading {
                                    "Đang phân tích ảnh…"
                                } else {
                                    "Phân tích ảnh món ăn"
                                }
                            })
                    }}
                </strong>
                <small>
                    {move || {
                        s
                            .read(|d| {
                                d
                                    .photo_issue
                                    .as_deref()
                                    .filter(|i| !i.is_empty())
                                    .unwrap_or("Chụp hoặc chọn ảnh để gửi tới Groq.")
                                    .to_owned()
                            })
                    }}
                </small>
            </span>
        </button>
    }
}

pub(crate) fn review(s: Screen) -> impl IntoView {
    let selection = Memo::new(move |_| s.read(|d| d.photo_draft.as_ref().map(|p| p.meal_type)));
    let warning = Memo::new(move |_| {
        s.read(|d| {
            d.photo_draft
                .as_ref()
                .and_then(|p| p.image_quality_warning.clone())
                .filter(|w| !w.is_empty())
        })
    });
    view! {
        <section class="dashboard-card photo-card" aria-labelledby="photo-analysis-title">
            <header>
                <h2 id="photo-analysis-title" tabindex="-1">
                    "Kiểm tra món và khẩu phần"
                </h2>
                <p>
                    "Dinh dưỡng là ước tính từ ảnh. Đổi tên chỉ sửa nhãn. Nếu AI nhận sai món, bỏ mục đó rồi ghi tay."
                </p>
                {move || warning.get().map(|w| view! { <p>{format!("AI báo: {w}")}</p> })}
                <ion-button
                    class="photo-card__manual"
                    fill="clear"
                    disabled=move || s.read(|d| d.photo_saving)
                    prop:disabled=move || s.read(|d| d.photo_saving)
                    on:click=move |_| {
                        if s.read(|d| !d.photo_saving) {
                            s.action(Action::EnterPhotoMealManually)
                        }
                    }
                >
                    "Bỏ kết quả và ghi tay"
                </ion-button>
            </header>
            <div class="apple-field">
                <label class="apple-field__label" for="photo-meal-type">
                    {move || {
                        s
                            .read(|d| {
                                format!(
                                    "Bữa ăn · {}",
                                    d
                                        .photo_draft
                                        .as_ref()
                                        .map(|p| p.date_label.as_str())
                                        .unwrap_or_default(),
                                )
                            })
                    }}
                </label>
                <select
                    id="photo-meal-type"
                    class="apple-field__input"
                    disabled=move || s.read(|d| d.photo_saving)
                    prop:value=move || selection.get().map(Meal::key).unwrap_or_default()
                    on:change=move |e| {
                        let v = event_target::<HtmlSelectElement>(&e).value();
                        if let Some(value) = Meal::ALL.into_iter().find(|m| m.key() == v) {
                            s.action(Action::SelectPhotoMeal { value });
                        }
                    }
                >
                    {Meal::ALL
                        .into_iter()
                        .map(|m| {
                            view! {
                                <option value=m.key() selected=move || selection.get() == Some(m)>
                                    {m.label()}
                                </option>
                            }
                        })
                        .collect_view()}
                </select>
            </div>
            <ul class="photo-card__list">
                <For
                    each=move || {
                        s
                            .read(|d| {
                                d
                                    .photo_draft
                                    .as_ref()
                                    .map(|p| {
                                        (0..p.portions.len())
                                            .map(|i| (p.capture_id.clone(), i))
                                            .collect::<Vec<_>>()
                                    })
                                    .unwrap_or_default()
                            })
                    }
                    key=|key| key.clone()
                    children=move |(id, index)| portion(s, id, index)
                />
            </ul>
        </section>
    }
}

fn portion(s: Screen, id: String, index: usize) -> impl IntoView {
    let data = Memo::new(move |_| {
        s.read(|d| {
            d.photo_draft
                .as_ref()
                .filter(|p| p.capture_id == id)
                .and_then(|p| p.portions.get(index))
                .cloned()
        })
    });
    let name =
        Memo::new(move |_| data.with(|v| v.as_ref().map(|p| p.name.clone()).unwrap_or_default()));
    let grams = Memo::new(move |_| {
        data.with(|v| {
            v.as_ref()
                .and_then(|p| p.grams)
                .map(|g| g.to_string())
                .unwrap_or_default()
        })
    });
    let display =
        Memo::new(move |_| data.with(|v| v.as_ref().map_or("", Portion::display_name).to_owned()));
    let good_name = move || data.with(|v| v.as_ref().is_some_and(Portion::valid_name));
    let good_grams = move || data.with(|v| v.as_ref().is_some_and(Portion::valid_grams));
    let included = move || data.with(|v| v.as_ref().is_some_and(|p| p.included));
    let editing = move || data.with(Option::is_some) && s.read(|d| !d.photo_saving);
    let saving = move || s.read(|d| d.photo_saving);
    let warn = Memo::new(move |_| {
        data.with(|p| {
            p.as_ref()
                .and_then(|p| p.warning.clone())
                .filter(|w| !w.is_empty())
        })
    });
    view! {
        <li>
            <ion-checkbox
                justify="space-between"
                label-placement="start"
                prop:checked=included
                checked=included
                disabled=saving
                prop:disabled=saving
                aria-label=move || format!("Giữ {} khi lưu", display.get())
                on:ionChange=move |e: CustomEvent| {
                    if !editing() {
                        return;
                    }
                    let Ok(raw) = js_sys::Reflect::get(&e.detail(), &"checked".into()) else {
                        return
                    };
                    if let Some(checked) = raw.as_bool() {
                        s.action(Action::SetPhotoIncluded {
                            index,
                            checked,
                        });
                    }
                }
            >
                "Giữ mục này"
            </ion-checkbox>
            <Show
                when=included
                fallback=move || {
                    view! {
                        <strong>{move || display.get()}</strong>
                        <span>"Bỏ qua khi lưu"</span>
                    }
                }
            >
                <app-form-field>
                    <div class="form-field">
                        <div class="input-wrapper" class:invalid=move || !good_name()>
                            <label
                                class="input-label"
                                class:invalid=move || !good_name()
                                for=format!("photo-name-{index}")
                            >
                                "Tên món"
                            </label>
                            <input
                                class="input-native"
                                type="text"
                                enterkeyhint="next"
                                id=format!("photo-name-{index}")
                                maxlength="80"
                                prop:value=move || name.get()
                                disabled=saving
                                aria-invalid=move || (!good_name()).to_string()
                                aria-describedby=move || {
                                    (!good_name()).then(|| format!("photo-name-error-{index}"))
                                }
                                on:input=move |e| {
                                    if editing() {
                                        s.action(Action::SetPhotoName {
                                            index,
                                            value: event_target::<HtmlInputElement>(&e).value(),
                                        })
                                    }
                                }
                            />
                        </div>
                        <Show when=move || !good_name()>
                            <div
                                class="field-error"
                                id=format!("photo-name-error-{index}")
                                role="alert"
                            >
                                "Nhập tên món từ 1 đến 80 ký tự."
                            </div>
                        </Show>
                    </div>
                </app-form-field>
                <div class="apple-field">
                    <label class="apple-field__label" for=format!("photo-grams-{index}")>
                        "Khối lượng (g)"
                    </label>
                    <input
                        class="apple-field__input"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        max="2000"
                        step="any"
                        id=format!("photo-grams-{index}")
                        aria-label=move || format!("Khối lượng {} (g)", display.get())
                        prop:value=move || grams.get()
                        disabled=saving
                        aria-invalid=move || (!good_grams()).to_string()
                        aria-describedby=format!("photo-hint-{index}")
                        on:input=move |e| {
                            if editing() {
                                let n = event_target::<HtmlInputElement>(&e).value_as_number();
                                s.action(Action::SetPhotoGrams {
                                    index,
                                    value: n.is_finite().then_some(n),
                                });
                            }
                        }
                    />
                </div>
                <span
                    id=format!("photo-hint-{index}")
                    class:photo-card__error=move || !good_grams()
                >
                    {move || {
                        if good_grams() {
                            data.with(|v| {
                                v.as_ref().map(|p| p.nutrition_label.clone()).unwrap_or_default()
                            })
                        } else {
                            "Nhập khối lượng lớn hơn 0 và tối đa 2.000 g.".into()
                        }
                    }}
                </span>
                {move || warn.get().map(|w| view! { <span>{format!("AI báo: {w}")}</span> })}
                <Show when=move || data.with(|v| v.as_ref().is_some_and(|p| p.confidence == "low"))>
                    <span>
                        "AI chưa chắc về mục này. Hãy đối chiếu trước khi lưu."
                    </span>
                </Show>
            </Show>
        </li>
    }
}

pub(crate) fn footer(s: Screen) -> impl IntoView {
    view! {
        <Show when=move || s.read(|d| d.photo_draft.is_some())>
            <div
                class="photo-card__actions"
                role="group"
                aria-label="Xác nhận khẩu phần từ ảnh"
            >
                <ion-button
                    fill="clear"
                    disabled=move || s.read(|d| d.photo_saving)
                    prop:disabled=move || s.read(|d| d.photo_saving)
                    on:click=move |_| {
                        if s.read(|d| !d.photo_saving) {
                            s.action(Action::CancelPhoto)
                        }
                    }
                >
                    "Hủy"
                </ion-button>
                <ion-button
                    disabled=move || s.read(|d| !d.can_save_photo)
                    prop:disabled=move || s.read(|d| !d.can_save_photo)
                    on:click=move |_| {
                        if s.read(|d| d.can_save_photo) {
                            s.action(Action::SavePhoto)
                        }
                    }
                >
                    {move || {
                        s
                            .read(|d| {
                                if d.photo_saving {
                                    "Đang lưu…"
                                } else {
                                    "Lưu vào nhật ký"
                                }
                            })
                    }}
                </ion-button>
            </div>
        </Show>
    }
}
