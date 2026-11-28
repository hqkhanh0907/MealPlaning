use super::{Action, Meal, MealSlot, PlannedDish, Screen};
use leptos::prelude::*;
use std::time::Duration;
use wasm_bindgen::JsValue;

fn number(value: f64) -> String {
    ryu_js::Buffer::new().format(value).to_owned()
}

fn logged_at(iso: Option<&str>) -> String {
    let time = iso.and_then(|raw| {
        let sqlite = js_sys::RegExp::new(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$", "");
        let timestamp = if sqlite.test(raw) {
            format!("{}Z", raw.replace(' ', "T"))
        } else {
            raw.to_owned()
        };
        let date = js_sys::Date::new(&JsValue::from_str(&timestamp));
        if !date.get_time().is_finite() {
            return None;
        }
        let options = js_sys::Object::new();
        for key in ["hour", "minute"] {
            let _ = js_sys::Reflect::set(&options, &key.into(), &"2-digit".into());
        }
        let _ = js_sys::Reflect::set(&options, &"hour12".into(), &false.into());
        Some(String::from(date.to_locale_time_string_with_options(
            "vi-VN",
            options.as_ref(),
        )))
    });
    time.map_or_else(|| "Đã ăn".into(), |v| format!("Đã ăn lúc {v}"))
}

#[derive(Clone, Copy)]
struct Press {
    timeout: StoredValue<Option<TimeoutHandle>>,
    triggered: StoredValue<bool>,
}
impl Press {
    fn new() -> Self {
        let press = Self {
            timeout: StoredValue::new(None),
            triggered: StoredValue::new(false),
        };
        on_cleanup(move || press.cancel());
        press
    }
    fn cancel(self) {
        if let Some(Some(timer)) = self.timeout.try_get_value() {
            timer.clear();
        }
    }
    fn arm(self, screen: Screen, id: String, meal: Meal) {
        self.cancel();
        self.triggered.set_value(false);
        let timer = set_timeout_with_handle(
            move || {
                self.triggered.set_value(true);
                screen.send.run(Action::Options { id, meal });
            },
            Duration::from_millis(500),
        );
        self.timeout.set_value(timer.ok());
    }
    fn allow_click(self) -> bool {
        let allowed = !self.triggered.get_value();
        self.triggered.set_value(false);
        allowed
    }
}

fn dish_row(
    screen: Screen,
    slot: Memo<MealSlot>,
    initial: PlannedDish,
    press: Press,
) -> impl IntoView {
    let meal = slot.with_untracked(|s| s.meal_type);
    let id = StoredValue::new(initial.id.clone());
    let row = Memo::new(move |_| {
        slot.with(|s| {
            s.planned_dishes
                .iter()
                .find(|d| d.id == initial.id)
                .cloned()
        })
        .unwrap_or_else(|| initial.clone())
    });
    let done = move || row.with(|d| d.is_completed == 1);
    let options = move || Action::Options {
        id: id.get_value(),
        meal,
    };
    let kcal = move || row.with(|d| number(js_sys::Math::round(d.effective_calories)));
    view! {
        <li class="meal-slot__row" class:meal-slot__row--planned=move || !done()
            on:pointerdown=move |_|press.arm(screen,id.get_value(),meal)
            on:pointerup=move |_|press.cancel() on:pointerleave=move |_|press.cancel()
            on:pointermove=move |_|press.cancel() on:pointercancel=move |_|press.cancel()>
            <div class="meal-slot__details">
                <span class="meal-slot__name">{move || row.with(|d|d.dish_name.clone())}</span>
                <div class="meal-slot__meta">
                    <Show when=done><app-status-pill><output class="status-pill status-pill--logged">
                        <ion-icon class="status-pill__icon" name="lock-closed-outline" aria-hidden="true"></ion-icon>
                        <span class="status-pill__label">{move ||row.with(|d|logged_at(d.completed_at.as_deref()))}</span>
                    </output></app-status-pill></Show>
                    <span class="meal-slot__cal">{kcal}{move ||if done(){" kcal"}else{" kcal dự kiến"}}</span>
                    <span class="meal-slot__servings">{move ||row.with(|d|number(d.servings))}" phần"</span>
                </div>
            </div>
            <button type="button" class="meal-slot__action" data-planned-dish-action=id.get_value()
                class:meal-slot__action--logged=done on:click=move |_| {
                    if press.allow_click() {
                        let id=id.get_value();
                        screen.send.run(if done(){ Action::Unmark{id} }else{ Action::Mark{id} });
                    }
                }>{move || if done(){"Bỏ đánh dấu"}else{"Ghi đã ăn"}}</button>
            <button type="button" class="meal-slot__options" aria-haspopup="dialog"
                aria-label=move ||row.with(|d|format!("Tùy chọn cho {}",d.dish_name))
                on:click=move |_|if press.allow_click(){screen.send.run(options());}>
                <ion-icon name="ellipsis-horizontal" aria-hidden="true"></ion-icon>
            </button>
        </li>
    }
}

pub(super) fn slot(screen: Screen, initial: MealSlot) -> impl IntoView {
    let meal = initial.meal_type;
    let slot = Memo::new(move |_| {
        screen
            .data
            .with(|c| {
                c.plan
                    .as_ref()
                    .and_then(|p| p.meal_slots.iter().rev().find(|s| s.meal_type == meal))
                    .cloned()
            })
            .unwrap_or_else(|| initial.clone())
    });
    let total = move || {
        slot.with(|s| {
            number(js_sys::Math::round(
                s.planned_dishes.iter().map(|d| d.effective_calories).sum(),
            ))
        })
    };
    let press = Press::new();
    view! {
        <app-meal-slot-card><section class="meal-slot" data-meal=meal.key()>
            <header class="meal-slot__header"><span class="meal-slot__accent" aria-hidden="true"></span>
                <h3 class="meal-slot__label">{meal.label()}</h3><span class="meal-slot__total">{total}" kcal"</span>
                <button type="button" class="meal-slot__add" aria-label=format!("Thêm món vào {}",meal.label())
                    on:click=move |_|screen.send.run(Action::Add{meal})>"+"</button>
            </header>
            <Show when=move ||!slot.with(|s|s.planned_dishes.is_empty()) fallback=||view!{<p class="meal-slot__empty">"Chưa có món nào trong bữa này."</p>}>
                <ul class="meal-slot__list"><For each=move ||slot.with(|s|s.planned_dishes.clone()) key=|d|d.id.clone()
                    children=move |d|dish_row(screen,slot,d,press)/></ul>
            </Show>
        </section></app-meal-slot-card>
    }
}
