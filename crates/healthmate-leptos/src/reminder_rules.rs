use healthmate_domain::reminders::{Input, plan};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name=reminderPlan)]
pub fn reminder_plan(input: &str) -> Result<String, JsValue> {
    let policy: Input =
        serde_json::from_str(input).map_err(|_| js_sys::Error::new("Invalid reminder policy"))?;
    serde_json::to_string(&plan(&policy))
        .map_err(|_| js_sys::Error::new("Could not encode reminders").into())
}
