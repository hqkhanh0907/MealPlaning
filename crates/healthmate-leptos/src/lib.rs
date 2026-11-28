#[cfg(target_arch = "wasm32")]
mod account;
#[cfg(target_arch = "wasm32")]
mod browser;
#[cfg(target_arch = "wasm32")]
mod calendar;
mod fitness;
mod management;
mod model;
#[cfg(target_arch = "wasm32")]
mod onboarding;
mod photo;
#[cfg(target_arch = "wasm32")]
mod region;
#[cfg(target_arch = "wasm32")]
mod settings;
mod view;
#[cfg(target_arch = "wasm32")]
pub use browser::{DashboardHandle, mount_dashboard};

#[cfg(not(target_arch = "wasm32"))]
pub fn render_snapshot(json: &str) -> Result<(String, String), serde_json::Error> {
    use leptos::prelude::*;
    let d = serde_json::from_str(json)?;
    Ok(Owner::new().with(|| {
        let screen = view::Screen {
            data: RwSignal::new(d),
            send: UnsyncCallback::new(|_| {}),
        };
        (
            view::body(screen).to_html(),
            photo::footer(screen).to_html(),
        )
    }))
}
#[cfg(test)]
mod characterization;
