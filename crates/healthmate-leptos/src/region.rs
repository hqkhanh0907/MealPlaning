use leptos::{mount::mount_to, prelude::*};
use serde::de::DeserializeOwned;
use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

type Update = Box<dyn Fn(&str) -> Result<(), JsValue>>;
#[wasm_bindgen]
pub struct RegionHandle {
    update_state: Option<Update>,
    cleanup: Option<Box<dyn FnOnce()>>,
}
#[wasm_bindgen]
impl RegionHandle {
    pub fn update(&self, json: &str) -> Result<(), JsValue> {
        self.update_state
            .as_ref()
            .ok_or_else(|| js_sys::Error::new("View disposed"))?(json)
    }
    pub fn dispose(&mut self) {
        self.update_state = None;
        if let Some(cleanup) = self.cleanup.take() {
            cleanup()
        }
    }
}
impl Drop for RegionHandle {
    fn drop(&mut self) {
        self.dispose();
    }
}

fn parse<T: DeserializeOwned>(json: &str) -> Result<T, JsValue> {
    serde_json::from_str(json)
        .map_err(|e| js_sys::Error::new(&format!("Invalid view snapshot: {e}")).into())
}
pub(crate) fn mount<
    T: Clone + PartialEq + Send + Sync + DeserializeOwned + 'static,
    V: IntoView + 'static,
>(
    root: HtmlElement,
    json: &str,
    callback: js_sys::Function,
    render: impl FnOnce(ReadSignal<T>, UnsyncCallback<(&'static str, String)>) -> V + 'static,
) -> Result<RegionHandle, JsValue> {
    let initial = parse::<T>(json)?;
    let owner = Owner::new();
    let (data, set) = owner.with(|| signal(initial));
    let action = owner.with(|| {
        UnsyncCallback::new(move |(kind, value): (&'static str, String)| {
            let event = js_sys::Object::new();
            js_sys::Reflect::set(&event, &"type".into(), &kind.into()).unwrap_throw();
            js_sys::Reflect::set(&event, &"value".into(), &value.into()).unwrap_throw();
            callback.call1(&JsValue::UNDEFINED, &event).unwrap_throw();
        })
    });
    let mount = mount_to(root, move || render(data, action));
    Ok(RegionHandle {
        update_state: Some(Box::new(move |json| {
            let new = parse(json)?;
            if data.with_untracked(|v| *v != new) {
                set.set(new);
            }
            Ok(())
        })),
        cleanup: Some(Box::new(move || {
            drop(mount);
            owner.cleanup();
        })),
    })
}
