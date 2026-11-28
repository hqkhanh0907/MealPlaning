use super::{
    Action,
    model::{EFFORTS, Logger, amount_label},
};
use healthmate_domain::fitness::{is_timed_exercise, load_factor, load_label};
use leptos::prelude::*;

pub(super) fn entry(d: ReadSignal<Logger>, send: Action) -> impl IntoView {
    let weight = Memo::new(move |_| d.with(|s| s.draft.weight.clone()));
    let reps = Memo::new(move |_| d.with(|s| s.draft.reps.clone()));
    let rest = Memo::new(move |_| d.with(|s| s.draft.rest.clone()));
    let id = Memo::new(move |_| d.with(|s| s.exercise.clone()));
    view! {
        <h3 class="set-number">"Hiệp "{move || d.with(|s| s.rows.len() + 1)}</h3>
        <div class="set-grid" on:focusin=move |_| send.run(("reveal", String::new()))>
            <div class="input-wrapper">
                <label class="input-label" for="weight-kg">
                    {move || id.with(|s| load_label(s))}
                </label>
                <input
                    id="weight-kg"
                    class="input-native"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    max=move || id.with(|s| 500 / u16::from(load_factor(s)))
                    step="any"
                    prop:value=move || weight.get()
                    on:input=move |e| send.run(("weight", event_target_value(&e)))
                />
                <Show when=move || !weight.get().is_empty()>
                    <button
                        type="button"
                        class="clear-load"
                        aria-label="Xóa mức tạ"
                        on:click=move |_| send.run(("weight", String::new()))
                    >
                        "Xóa"
                    </button>
                </Show>
            </div>
            <div class="input-wrapper">
                <label class="input-label" for="reps">
                    {move || id.with(|s| amount_label(s))}
                </label>
                <input
                    id="reps"
                    class="input-native"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    max=move || id.with(|s| if is_timed_exercise(s) { 86400 } else { 100 })
                    step="1"
                    prop:value=move || reps.get()
                    on:input=move |e| send.run(("reps", event_target_value(&e)))
                />
            </div>
            <div class="input-wrapper">
                <label class="input-label" for="rest-seconds">
                    "Nghỉ (giây)"
                </label>
                <input
                    id="rest-seconds"
                    class="input-native"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    max="600"
                    step="15"
                    prop:value=move || rest.get()
                    on:input=move |e| send.run(("rest", event_target_value(&e)))
                />
            </div>
        </div>
        <ion-button
            class="log-set"
            fill="solid"
            expand="block"
            disabled=move || d.with(|s| s.busy)
            on:click=move |_| send.run(("logSet", String::new()))
        >
            <ion-icon slot="start" name="add-outline"></ion-icon>
            "Ghi hiệp"
        </ion-button>
    }
}
pub(super) fn effort(d: ReadSignal<Logger>, send: Action) -> impl IntoView {
    let notes = Memo::new(move |_| d.with(|s| s.draft.notes.clone()));
    view! {
        <div class="effort-row" role="group" aria-label="Mức gắng sức, tùy chọn">
            {EFFORTS
                .into_iter()
                .map(|(key, label)| {
                    view! {
                        <button
                            type="button"
                            class="effort-chip"
                            aria-pressed=move || {
                                d.with(|s| (s.draft.effort.as_deref() == Some(key)).to_string())
                            }
                            on:click=move |_| send.run(("effort", key.into()))
                        >
                            {label}
                        </button>
                    }
                })
                .collect_view()}
        </div>
        <div class="input-wrapper">
            <label class="input-label" for="set-notes">
                "Ghi chú hiệp"
            </label>
            <input
                id="set-notes"
                class="input-native"
                type="text"
                prop:value=move || notes.get()
                on:input=move |e| send.run(("notes", event_target_value(&e)))
                autocomplete="off"
            />
        </div>
    }
}
pub(super) fn rows(d: ReadSignal<Logger>, send: Action) -> impl IntoView {
    let rows = Memo::new(move |_| d.with(|s| (s.exercise.clone(), s.rows.clone())));
    move || {
        let (exercise, sets) = rows.get();
        (!sets.is_empty()).then(||view! {
        <div class="set-history" role="group" aria-label="Các hiệp trong bài">
            {sets
                .into_iter()
                .map(|set| {
                    let skipped = set.status == "skipped";
                    let value = set.value(&exercise);
                    let label = EFFORTS
                        .iter()
                        .find(|(key, _)| Some(*key) == set.effort.as_deref())
                        .map(|(_, s)| *s);
                    view! {
                        <article class:set-history__item--skipped=skipped>
                            <div class="set-history__main">
                                <strong>"Hiệp "{set.set_number}</strong>
                                {if skipped {
                                    view! {
                                        <span class="set-history__skipped-label">
                                            "Đã bỏ qua"
                                        </span>
                                    }
                                        .into_any()
                                } else {
                                    view! {
                                        <span>{value}</span>
                                        {label.map(|s| view! { <small>{s}</small> })}
                                    }
                                        .into_any()
                                }}
                            </div>
                            <button
                                type="button"
                                class="set-history__delete"
                                aria-label=format!("Xóa hiệp {}", set.set_number)
                                on:click=move |_| send.run(("deleteSet", set.id.clone()))
                            >
                                <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                            </button>
                        </article>
                    }
                })
                .collect_view()}
        </div>
    })
    }
}

pub(super) fn actions(d: ReadSignal<Logger>, send: Action) -> impl IntoView {
    let busy = Memo::new(move |_| d.with(|s| s.busy));
    let can_repeat = Memo::new(move |_| {
        d.with(|s| {
            s.rows
                .iter()
                .any(|r| r.status == "logged" && r.legacy_unit_unknown == 0)
        })
    });
    view! {
        <ion-button
            fill="outline"
            color="medium"
            aria-label="Bỏ qua hiệp này"
            disabled=move || busy.get()
            on:click=move |_| send.run(("skipSet", String::new()))
        >
            "Bỏ qua"
        </ion-button>
        <Show when=move || can_repeat.get()>
            <button
                type="button"
                class="repeat-set"
                aria-label="Lặp lại hiệp vừa ghi"
                disabled=move || busy.get()
                on:click=move |_| send.run(("repeatLastSet", String::new()))
            >
                "Lặp hiệp"
            </button>
        </Show>
    }
}
#[derive(serde::Deserialize, Clone, PartialEq)]
pub struct Tab {
    id: String,
    name: String,
    states: Vec<String>,
}
#[derive(serde::Deserialize, Clone, PartialEq)]
pub struct Tabs {
    selected: Option<String>,
    rows: Vec<Tab>,
}
pub(super) fn tabs(d: ReadSignal<Tabs>, send: Action) -> impl IntoView {
    let rows = Memo::new(move |_| d.with(|v| v.rows.clone()));
    let active = Memo::new(move |_| d.with(|v| v.selected.clone()));
    move || {
        let rows = rows.get();
        view! {
            <div class="workout-exercise-tabs" aria-label="Bài trong buổi tập">
                {rows
                    .into_iter()
                    .map(|row| {
                        let id = row.id.clone();
                        let pressed = move || active.with(|s| s.as_ref() == Some(&id));
                        let logged = row
                            .states
                            .iter()
                            .filter(|status| status.as_str() == "logged")
                            .count();
                        let skipped = row.states.len() - logged;
                        let hint = if skipped == 0 {
                            format!("{logged} hiệp đã ghi")
                        } else {
                            format!("{logged} hiệp đã ghi · {skipped} bỏ qua")
                        };
                        view! {
                            <button
                                type="button"
                                class="workout-tab"
                                aria-pressed=move || pressed().to_string()
                                on:click=move |_| send.run(("selectExercise", row.id.clone()))
                            >
                                {row.name}
                                " "
                                <small>{hint}</small>
                            </button>
                        }
                    })
                    .collect_view()}
            </div>
        }
    }
}
