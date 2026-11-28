#[cfg(target_arch = "wasm32")]
mod browser;
#[cfg(any(test, target_arch = "wasm32"))]
mod discovery;
#[cfg(any(test, target_arch = "wasm32"))]
mod history;
#[cfg(any(test, target_arch = "wasm32"))]
mod library;
#[cfg(any(test, target_arch = "wasm32"))]
mod logger;
#[cfg(any(test, target_arch = "wasm32"))]
mod model;
#[cfg(any(test, target_arch = "wasm32"))]
mod schedule;
#[cfg(any(test, target_arch = "wasm32"))]
mod trend;
#[cfg(any(test, target_arch = "wasm32"))]
type Action = leptos::prelude::UnsyncCallback<(&'static str, String)>;
#[cfg(test)]
mod tests;
