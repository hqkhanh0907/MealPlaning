use super::{Action, Calendar, Meal, Screen, meals, summary, week};
use healthmate_domain::dates::parse_local_date;
use leptos::prelude::*;

fn icon(name: &'static str) -> impl IntoView {
    view! {<ion-icon name=name aria-hidden="true"></ion-icon>}
}

fn relative_date(c: &Calendar) -> String {
    let (Some(day), Some(today)) = (parse_local_date(&c.date), parse_local_date(&c.today)) else {
        return c.date.clone();
    };
    match (day - today).num_days() {
        -1 => "Hôm qua".into(),
        0 => "Hôm nay".into(),
        1 => "Ngày mai".into(),
        _ => {
            let weekday = match day.format("%u").to_string().as_str() {
                "7" => "Chủ Nhật",
                "1" => "Thứ 2",
                "2" => "Thứ 3",
                "3" => "Thứ 4",
                "4" => "Thứ 5",
                "5" => "Thứ 6",
                _ => "Thứ 7",
            };
            let year = day.format("%-Y").to_string();
            format!(
                "{weekday}, {}/{}",
                day.format("%d/%m"),
                &year[year.len().saturating_sub(2)..]
            )
        }
    }
}

pub(super) fn controls(s: Screen) -> impl IntoView {
    let week = move || s.data.with(|c| c.view == "week");
    view! {
        <button type="button" class="calendar-date-chip" aria-label="Chọn ngày" on:click=move |_|s.send.run(Action::DatePicker)>
            <span>{move ||s.data.with(relative_date)}</span>{icon("chevron-down")}
        </button>
        <button type="button" class="calendar-view-toggle" aria-label=move ||if week(){"Chuyển sang Ngày"}else{"Chuyển sang Tuần"} on:click=move |_|s.send.run(Action::ToggleView)>
            {icon("calendar-outline")}<span>{move ||if week(){"Ngày"}else{"Tuần"}}</span>
        </button>
    }
}

fn ai_label(c: &Calendar) -> String {
    if !c.online {
        "Cần kết nối mạng để AI chọn món".into()
    } else if c.ai_planning {
        "AI đang chọn món…".into()
    } else {
        c.ai_issue
            .as_deref()
            .filter(|t| !t.is_empty())
            .unwrap_or("AI chọn món hôm nay")
            .into()
    }
}

fn empty(s: Screen) -> impl IntoView {
    view! {<app-empty-day-state><section class="empty-day" aria-label="Ngày trống — gợi ý lên kế hoạch">
        <ion-icon class="empty-day__icon" name="calendar-clear-outline" aria-hidden="true"></ion-icon>
        <h2 class="empty-day__title">"Ngày này chưa có món nào"</h2>
        <p class="empty-day__subtitle">"Bắt đầu lên kế hoạch hoặc sao chép từ hôm qua."</p>
        <div class="empty-day__actions">
            <button type="button" class="empty-day__btn empty-day__btn--primary" on:click=move |_|s.send.run(Action::Plan)>
                {icon("add-circle-outline")}<span>"Lên kế hoạch"</span></button>
            <button type="button" class="empty-day__btn" disabled=move ||s.data.with(|c|c.copying_yesterday)
                on:click=move |_|s.send.run(Action::CopyYesterday)>{icon("copy-outline")}
                <span>{move ||s.data.with(|c|if c.copying_yesterday{"Đang sao chép…"}else{"Sao chép từ hôm qua"})}</span>
            </button>
            <button type="button" class="empty-day__btn empty-day__btn--ghost"
                disabled=move ||s.data.with(|c| !c.online || c.ai_planning || c.ai_issue.as_deref().is_some_and(|t|!t.is_empty()))
                on:click=move |_|s.send.run(Action::Ai)>
                {icon("sparkles-outline")}<span>{move ||s.data.with(ai_label)}</span>
            </button>
        </div>
    </section></app-empty-day-state>}
}

fn planned(s: Screen) -> impl IntoView {
    let slots = move || {
        s.data.with(|c| {
            Meal::ALL
                .iter()
                .filter_map(|meal| {
                    c.plan
                        .as_ref()?
                        .meal_slots
                        .iter()
                        .rev()
                        .find(|slot| slot.meal_type == *meal)
                        .cloned()
                })
                .collect::<Vec<_>>()
        })
    };
    view! {
        <For each=slots key=|slot|slot.meal_type.key() children=move |slot|meals::slot(s,slot)/>
        <button type="button" class="calendar-ai-cta"
            disabled=move ||s.data.with(|c|c.ai_planning || c.ai_issue.as_deref().is_some_and(|t|!t.is_empty()))
            on:click=move |_|s.send.run(Action::Ai)>
            {icon("sparkles-outline")}<span>{move ||s.data.with(ai_label)}</span>
        </button>
    }
}
#[derive(Clone, Copy, PartialEq)]
enum DayContent {
    Loading,
    Empty,
    Planned,
}
fn day(s: Screen) -> impl IntoView {
    let section = Memo::new(move |_| {
        s.data.with(|c| match &c.plan {
            Some(p) if p.date == c.date => {
                if p.meal_slots
                    .iter()
                    .all(|slot| slot.planned_dishes.is_empty())
                {
                    DayContent::Empty
                } else {
                    DayContent::Planned
                }
            }
            _ => DayContent::Loading,
        })
    });
    view! {<div class="calendar-swipe-area">
        {summary::summary(s)}
        {move ||match section.get(){
            DayContent::Loading=>view!{<p class="calendar-loading" role="status">"Đang tải kế hoạch ngày…"</p>}.into_any(),
            DayContent::Empty=>empty(s).into_any(),
            DayContent::Planned=>planned(s).into_any(),
        }}
    </div>}
}
pub(super) fn body(s: Screen) -> impl IntoView {
    let is_week = Memo::new(move |_| s.data.with(|c| c.view == "week"));
    view! {<Show when=move ||is_week.get() fallback=move ||day(s)>{week::week(s)}</Show>}
}
pub(super) fn undo(s: Screen) -> impl IntoView {
    view! {<Show when=move ||s.data.with(|c|c.undo.is_some())>
        <output class="undo-toast__msg" aria-live="polite">{move ||s.data.with(|c|c.undo.clone())}</output>
        <button type="button" class="undo-toast__btn" on:click=move |_|s.send.run(Action::Undo)>"Hoàn tác"</button>
        <button type="button" class="undo-toast__close" aria-label="Đóng" on:click=move |_|s.send.run(Action::DismissUndo)>{icon("close")}</button>
    </Show>}
}
