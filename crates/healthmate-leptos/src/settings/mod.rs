mod editor;
mod home;
mod panels;

use leptos::{mount::mount_to, prelude::*};
use serde_json::{Value, json};
use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

#[derive(Clone, Copy)]
struct Screen {
    state: RwSignal<Value>,
    send: UnsyncCallback<Value>,
}
impl Screen {
    fn action(self, kind: &str) {
        self.send.run(json!({"type":kind}));
    }
    fn get<T>(self, f: impl FnOnce(&Value) -> T) -> T {
        self.state.with(f)
    }
}
fn parse(input: &str) -> Result<Value, JsValue> {
    serde_json::from_str(input)
        .map_err(|e| js_sys::Error::new(&format!("Invalid settings data: {e}")).into())
}
fn string(data: &Value, key: &str) -> String {
    data[key].as_str().unwrap_or_default().to_owned()
}
fn flag(data: &Value, key: &str) -> bool {
    data[key].as_bool().unwrap_or_default()
}
fn number(input: f64) -> String {
    ryu_js::Buffer::new().format(input).to_owned()
}
fn date_time(raw: &str) -> String {
    if raw.is_empty() {
        return String::new();
    }
    let date = js_sys::Date::new(&raw.into());
    let opts = js_sys::Object::new();
    for key in ["dateStyle", "timeStyle"] {
        let _ = js_sys::Reflect::set(&opts, &key.into(), &"short".into());
    }
    date.to_locale_string("vi-VN", &opts).into()
}
fn dispatch(callback: js_sys::Function, state: RwSignal<Value>) -> UnsyncCallback<Value> {
    UnsyncCallback::new(move |mut action: Value| {
        action["ownerId"] = state.with_untracked(|data| data["account"]["id"].clone());
        let js = js_sys::JSON::parse(&action.to_string()).unwrap_throw();
        callback.call1(&JsValue::UNDEFINED, &js).unwrap_throw();
    })
}
#[wasm_bindgen]
pub struct SettingsHandle {
    screen: Screen,
    mount: Option<Box<dyn FnOnce()>>,
    owner: Owner,
}
#[wasm_bindgen(js_name=mountSettings)]
pub fn mount(
    root: HtmlElement,
    kind: &str,
    raw: &str,
    callback: js_sys::Function,
) -> Result<SettingsHandle, JsValue> {
    let value = parse(raw)?;
    let owner = Owner::new();
    let screen = owner.with(|| {
        let state = RwSignal::new(value);
        Screen {
            state,
            send: dispatch(callback, state),
        }
    });
    let handle = match kind {
        "account" => mount_to(root, move || home::account(screen).into_any()),
        "preferences" => mount_to(root, move || home::preferences(screen).into_any()),
        "devices" => mount_to(root, move || panels::devices(screen).into_any()),
        _ => return Err(js_sys::Error::new("Unknown settings section").into()),
    };
    Ok(SettingsHandle {
        screen,
        owner,
        mount: Some(Box::new(move || drop(handle))),
    })
}
#[wasm_bindgen]
impl SettingsHandle {
    pub fn update(&self, raw: &str) -> Result<(), JsValue> {
        let v = parse(raw)?;
        self.screen.state.maybe_update(|old| {
            if *old == v {
                false
            } else {
                *old = v;
                true
            }
        });
        Ok(())
    }
}
impl Drop for SettingsHandle {
    fn drop(&mut self) {
        if let Some(unmount) = self.mount.take() {
            unmount();
        }
        self.owner.cleanup();
    }
}
