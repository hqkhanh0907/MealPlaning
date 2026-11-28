use super::{Action, model::Ingredient};
use leptos::prelude::*;

pub(super) const FIELDS: [(&str, &str); 5] = [
    ("calories", "Calories (kcal)"),
    ("protein", "Protein (g)"),
    ("carbs", "Carbs (g)"),
    ("fat", "Fat (g)"),
    ("fiber", "Fiber (g)"),
];

pub(super) fn view(data: ReadSignal<Ingredient>, send: Action) -> impl IntoView {
    let invalid = move || data.with(|d| !d.error(0).is_empty());
    view! {
        <app-form-field>
            <div class="form-field">
                <div class="input-wrapper" class:invalid=invalid>
                    <label for="ingr-field-category" class="input-label" class:invalid=invalid>
                        "Nhóm"
                    </label>
                    <button
                        type="button"
                        id="ingr-field-category"
                        class="picker-trigger--floating"
                        aria-invalid=move || invalid().then_some("true")
                        aria-describedby=move || invalid().then_some("err-ingr-category")
                        on:click=move |_| send.run(("category", String::new()))
                    >
                        <span>
                            {move || {
                                data
                                    .with(|d| {
                                        if d.category.is_empty() {
                                            "Chọn nhóm nguyên liệu".into()
                                        } else {
                                            d.category.clone()
                                        }
                                    })
                            }}
                        </span>
                        <ion-icon name="chevron-down-outline" aria-hidden="true"></ion-icon>
                    </button>
                </div>
                {move || data.with(|d| error("err-ingr-category", &d.error(0)))}
            </div>
        </app-form-field>
        <div class="section-label">"Dinh dưỡng trong 100 g"</div>
        {numeric(data, send, 0)}
        <div class="nutrition-grid">{(1..5).map(|i| numeric(data, send, i)).collect_view()}</div>
    }
}
fn error(id: &str, message: &str) -> Option<impl IntoView + use<>> {
    (!message.is_empty()).then(|| {
        view! {
            <div class="field-error" id=id.to_owned() role="alert">
                {message.to_owned()}
            </div>
        }
    })
}
fn numeric(data: ReadSignal<Ingredient>, send: Action, index: usize) -> impl IntoView {
    let (field, label) = FIELDS[index];
    let id = format!("ingr-field-{field}");
    let err = format!("err-ingr-{field}");
    let invalid = move || data.with(|d| !d.error(index + 1).is_empty());
    let described = err.clone();
    let value = Memo::new(move |_| {
        data.with(|d| d.values[index].map(|v| v.to_string()).unwrap_or_default())
    });
    view! {
        <app-form-field>
            <div class="form-field">
                <div class="input-wrapper" class:invalid=invalid>
                    <label class="input-label" class:invalid=invalid for=id.clone()>
                        {label}
                    </label>
                    <input
                        id=id
                        class="input-native"
                        type="number"
                        inputmode="decimal"
                        step="0.1"
                        prop:value=move || value.get()
                        aria-invalid=move || invalid().then_some("true")
                        aria-describedby=move || invalid().then(|| described.clone())
                        on:input=move |event| send.run((field, event_target_value(&event)))
                    />
                </div>
                {move || data.with(|d| error(&err, &d.error(index + 1)))}
            </div>
        </app-form-field>
    }
}
