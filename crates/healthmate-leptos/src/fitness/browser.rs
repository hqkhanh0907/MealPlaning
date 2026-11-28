use super::{
    history, library, logger,
    model::{History, Logger, Today, Week},
    schedule, trend,
};
use crate::region::{RegionHandle, mount};
use wasm_bindgen::prelude::*;
#[wasm_bindgen(js_name=mountFitness)]
pub fn mount_fitness(
    root: web_sys::HtmlElement,
    kind: &str,
    json: &str,
    callback: js_sys::Function,
) -> Result<RegionHandle, JsValue> {
    match kind {
        "today" => mount::<Today, _>(root, json, callback, schedule::today),
        "week" => mount::<Week, _>(root, json, callback, schedule::week),
        "entry" => mount::<Logger, _>(root, json, callback, logger::entry),
        "effort" => mount::<Logger, _>(root, json, callback, logger::effort),
        "rows" => mount::<Logger, _>(root, json, callback, logger::rows),
        "summary" => mount::<History, _>(root, json, callback, history::summary),
        "replay" => mount::<History, _>(root, json, callback, history::replay),
        "exercises" => mount::<library::Results, _>(root, json, callback, library::view),
        "trend" => mount::<trend::Trend, _>(root, json, callback, trend::view),
        "actions" => mount::<Logger, _>(root, json, callback, logger::actions),
        "tabs" => mount::<logger::Tabs, _>(root, json, callback, logger::tabs),
        "details" => mount::<History, _>(root, json, callback, history::details),
        _ => Err(js_sys::Error::new("Unknown workout view").into()),
    }
}
