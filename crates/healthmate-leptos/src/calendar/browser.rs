use super::{Calendar, Screen, view};
use leptos::{mount::mount_to, prelude::*};
use wasm_bindgen::{JsCast, prelude::*};
use web_sys::HtmlElement;

fn parse(json: &str) -> Result<Calendar, JsValue> {
    serde_json::from_str(json)
        .map_err(|err| js_sys::Error::new(&format!("Invalid calendar data: {err}")).into())
}

fn find_child(
    parent: &web_sys::Element,
    class: &str,
    attribute: &str,
    value: &str,
) -> Option<web_sys::Element> {
    let elements = parent.get_elements_by_class_name(class);
    (0..elements.length())
        .filter_map(|index| elements.item(index))
        .find(|element| element.get_attribute(attribute).as_deref() == Some(value))
}

#[wasm_bindgen]
pub struct CalendarHandle {
    data: RwSignal<Calendar>,
    body: HtmlElement,
    unmount: Option<Box<dyn FnOnce()>>,
    owner: Owner,
}

#[wasm_bindgen(js_name=mountCalendar)]
pub fn mount(
    controls: HtmlElement,
    body: HtmlElement,
    undo: HtmlElement,
    json: &str,
    dispatch: js_sys::Function,
) -> Result<CalendarHandle, JsValue> {
    let snapshot = parse(json)?;
    let owner = Owner::new();
    let screen = owner.with(|| Screen {
        data: RwSignal::new(snapshot),
        send: UnsyncCallback::new(move |action| {
            let serialized =
                serde_json::to_string(&action).expect("calendar action is serializable");
            let value = js_sys::JSON::parse(&serialized).unwrap_throw();
            dispatch.call1(&JsValue::UNDEFINED, &value).unwrap_throw();
        }),
    });
    let header_mount = mount_to(controls, move || view::controls(screen));
    let body_mount = mount_to(body.clone(), move || view::body(screen));
    let undo_mount = mount_to(undo, move || view::undo(screen));
    Ok(CalendarHandle {
        data: screen.data,
        body,
        owner,
        unmount: Some(Box::new(move || {
            drop((header_mount, body_mount, undo_mount))
        })),
    })
}

#[wasm_bindgen]
impl CalendarHandle {
    pub fn update(&self, json: &str) -> Result<(), JsValue> {
        let updated = parse(json)?;
        if self.data.with_untracked(|current| current != &updated) {
            self.data.set(updated);
        }
        Ok(())
    }

    #[wasm_bindgen(js_name=focusPending)]
    pub fn focus_pending(&self, meal: &str, id: &str) -> bool {
        let Some(slot) = find_child(&self.body, "meal-slot", "data-meal", meal) else {
            return false;
        };
        let Some(element) = find_child(&slot, "meal-slot__action", "data-planned-dish-action", id)
        else {
            return false;
        };
        let Ok(button) = element.dyn_into::<HtmlElement>() else {
            return false;
        };
        let scroll = web_sys::ScrollIntoViewOptions::new();
        scroll.set_block(web_sys::ScrollLogicalPosition::Center);
        let _ = js_sys::Reflect::set(scroll.as_ref(), &"behavior".into(), &"instant".into());
        button.scroll_into_view_with_scroll_into_view_options(&scroll);
        let focus = web_sys::FocusOptions::new();
        focus.set_prevent_scroll(true);
        button.focus_with_options(&focus).is_ok()
    }
}
impl Drop for CalendarHandle {
    fn drop(&mut self) {
        if let Some(unmount) = self.unmount.take() {
            unmount();
        }
        self.owner.cleanup();
    }
}
