use super::{
    state::Wizard,
    view::{self, Screen},
};
use healthmate_domain::dates::{NaiveDate, parse_local_date};
use leptos::{mount::mount_to, prelude::*};
use std::{cell::Cell, rc::Rc};
use wasm_bindgen::{JsCast, prelude::*};
use wasm_bindgen_futures::{JsFuture, spawn_local};
use web_sys::{HtmlElement, ScrollIntoViewOptions, ScrollLogicalPosition};

fn day(iso: &str) -> Result<NaiveDate, JsValue> {
    parse_local_date(iso).ok_or_else(|| js_sys::Error::new("Invalid local day").into())
}

#[wasm_bindgen]
pub struct OnboardingHandle {
    screen: Screen,
    alive: Rc<Cell<bool>>,
    unmount: Option<Box<dyn FnOnce()>>,
    owner: Owner,
}

#[wasm_bindgen(js_name=mountOnboarding)]
pub fn mount(
    host: HtmlElement,
    iso: &str,
    save: js_sys::Function,
) -> Result<OnboardingHandle, JsValue> {
    let initial = Wizard::new(day(iso)?);
    let owner = Owner::new();
    let alive = Rc::new(Cell::new(true));
    let screen = owner.with(|| {
        let data = RwSignal::new(initial);
        let root = host.clone();
        let active = alive.clone();
        let focus = UnsyncCallback::new(move |selector: &'static str| {
            let root = root.clone();
            let active = active.clone();
            spawn_local(async move {
                if !active.get() {
                    return;
                }
                if let Ok(Some(el)) = root.query_selector(selector) {
                    if selector == "h1" {
                        if let Ok(heading) = el.dyn_into::<HtmlElement>() {
                            let _ = heading.focus();
                        }
                    } else {
                        let scroll = ScrollIntoViewOptions::new();
                        scroll.set_block(ScrollLogicalPosition::Center);
                        let _ = js_sys::Reflect::set(
                            scroll.as_ref(),
                            &"behavior".into(),
                            &"smooth".into(),
                        );
                        el.scroll_into_view_with_scroll_into_view_options(&scroll);
                    }
                }
            });
        });
        let active = alive.clone();
        let commit = UnsyncCallback::new(move |profile: serde_json::Value| {
            let payload = js_sys::JSON::parse(&profile.to_string()).unwrap_throw();
            let result = save.call1(&JsValue::UNDEFINED, &payload);
            let active = active.clone();
            spawn_local(async move {
                let success = match result {
                    Ok(promise) => JsFuture::from(js_sys::Promise::resolve(&promise))
                        .await
                        .is_ok(),
                    Err(_) => false,
                };
                if active.get() {
                    data.update(|s| {
                        s.saving = false;
                        s.saved = success;
                        s.save_error = !success;
                    });
                }
            });
        });
        Screen {
            data,
            focus,
            commit,
        }
    });
    let page = mount_to(host, move || view::page(screen));
    Ok(OnboardingHandle {
        screen,
        alive,
        unmount: Some(Box::new(move || drop(page))),
        owner,
    })
}
#[wasm_bindgen]
impl OnboardingHandle {
    #[wasm_bindgen(js_name=setDay)]
    pub fn set_day(&self, iso: &str) -> Result<(), JsValue> {
        let day = day(iso)?;
        self.screen.data.update(|state| state.day = day);
        Ok(())
    }
    pub fn back(&self) -> bool {
        self.screen.back()
    }
}
impl Drop for OnboardingHandle {
    fn drop(&mut self) {
        self.alive.set(false);
        if let Some(unmount) = self.unmount.take() {
            unmount();
        }
        self.owner.cleanup();
    }
}
