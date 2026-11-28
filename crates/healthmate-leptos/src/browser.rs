use crate::{
    model::Dashboard,
    photo,
    view::{Screen, body},
};
use leptos::{mount::mount_to, prelude::*};
use std::{cell::Cell, rc::Rc};
use wasm_bindgen::{JsCast, prelude::*};
use web_sys::HtmlElement;

#[wasm_bindgen]
pub struct DashboardHandle {
    alive: Rc<Cell<bool>>,
    state: Option<RwSignal<Dashboard>>,
    targets: Option<(HtmlElement, HtmlElement)>,
    mounts: Option<Box<dyn FnOnce()>>,
    owner: Option<Owner>,
}
fn parse(data: &str) -> Result<Dashboard, JsValue> {
    serde_json::from_str(data)
        .map_err(|e| js_sys::Error::new(&format!("Invalid dashboard state: {e}")).into())
}
#[wasm_bindgen(js_name=mountDashboard)]
pub fn mount_dashboard(
    body_root: HtmlElement,
    footer_root: HtmlElement,
    json: &str,
    dispatch: js_sys::Function,
) -> Result<DashboardHandle, JsValue> {
    let data = parse(json)?;
    let owner = Owner::new();
    let screen = owner.with(|| Screen {
        data: RwSignal::new(data),
        send: UnsyncCallback::new(move |action| {
            let serialized =
                serde_json::to_string(&action).expect("dashboard action is serializable");
            let object = js_sys::JSON::parse(&serialized).unwrap_throw();
            dispatch.call1(&JsValue::UNDEFINED, &object).unwrap_throw();
        }),
    });
    let page = mount_to(body_root.clone(), move || body(screen));
    let footer = mount_to(footer_root.clone(), move || photo::footer(screen));
    Ok(DashboardHandle {
        alive: Rc::new(Cell::new(true)),
        state: Some(screen.data),
        targets: Some((body_root, footer_root)),
        mounts: Some(Box::new(move || drop((page, footer)))),
        owner: Some(owner),
    })
}
#[wasm_bindgen]
impl DashboardHandle {
    pub fn update(&self, json: &str) -> Result<(), JsValue> {
        let state = self
            .state
            .ok_or_else(|| js_sys::Error::new("Dashboard is disposed"))?;
        let data = parse(json)?;
        if state.with_untracked(|old| old != &data) {
            state.set(data);
        }
        Ok(())
    }
    #[wasm_bindgen(js_name=focusResult)]
    pub fn focus_result(&self, kind: &str) {
        let Some((root, _)) = &self.targets else {
            return;
        };
        let selector = match kind {
            "insight" => "#ai-insight-title[tabindex]",
            "photo" => "#photo-analysis-title",
            _ => return,
        };
        let root = root.clone();
        let alive = Rc::clone(&self.alive);
        wasm_bindgen_futures::spawn_local(async move {
            if !alive.get() || !root.is_connected() {
                return;
            }
            let Ok(Some(node)) = root.query_selector(selector) else {
                return;
            };
            if let Ok(heading) = node.dyn_into::<HtmlElement>() {
                let scroll = web_sys::ScrollIntoViewOptions::new();
                scroll.set_block(web_sys::ScrollLogicalPosition::Start);
                heading.scroll_into_view_with_scroll_into_view_options(&scroll);
                let focus = web_sys::FocusOptions::new();
                focus.set_prevent_scroll(true);
                let _ = heading.focus_with_options(&focus);
            }
        });
    }
    pub fn dispose(&mut self) {
        self.alive.set(false);
        if let Some(drop_mounts) = self.mounts.take() {
            drop_mounts();
        }
        self.state = None;
        self.targets = None;
        if let Some(owner) = self.owner.take() {
            owner.cleanup();
        }
    }
}
impl Drop for DashboardHandle {
    fn drop(&mut self) {
        self.dispose();
    }
}
