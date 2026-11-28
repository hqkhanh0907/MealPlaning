mod browser;
mod meals;
mod picker;
mod summary;
mod view;
mod week;

use crate::model::Meal;
use leptos::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Deserialize)]
struct PlannedDish {
    id: String,
    dish_name: String,
    servings: f64,
    is_completed: u8,
    completed_at: Option<String>,
    effective_calories: f64,
}

#[derive(Clone, PartialEq, Deserialize)]
struct MealSlot {
    meal_type: Meal,
    planned_dishes: Vec<PlannedDish>,
}

#[derive(Clone, PartialEq, Deserialize)]
struct Plan {
    date: String,
    meal_slots: Vec<MealSlot>,
}

#[derive(Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Calendar {
    date: String,
    today: String,
    view: String,
    locale: String,
    week_days: Vec<String>,
    week: Option<Vec<week::WeekDay>>,
    summary: summary::Summary,
    plan: Option<Plan>,
    online: bool,
    ai_issue: Option<String>,
    ai_planning: bool,
    copying_yesterday: bool,
    copying_week: bool,
    undo: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum Action {
    DatePicker,
    ToggleView,
    WeekNav { delta: i8 },
    WeekDay { date: String },
    CopyWeek,
    Plan,
    CopyYesterday,
    Ai,
    Add { meal: Meal },
    Mark { id: String },
    Unmark { id: String },
    Options { id: String, meal: Meal },
    Undo,
    DismissUndo,
}

#[derive(Clone, Copy)]
struct Screen {
    data: RwSignal<Calendar>,
    send: UnsyncCallback<Action>,
}
