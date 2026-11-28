#[cfg(target_arch = "wasm32")]
mod browser;
#[cfg(any(test, target_arch = "wasm32"))]
mod catalog;
#[cfg(any(test, target_arch = "wasm32"))]
mod controls;
#[cfg(any(test, target_arch = "wasm32"))]
mod dish;
#[cfg(any(test, target_arch = "wasm32"))]
mod ingredient;
#[cfg(any(test, target_arch = "wasm32"))]
mod model;
#[cfg(any(test, target_arch = "wasm32"))]
type Action = leptos::prelude::UnsyncCallback<(&'static str, String)>;
#[cfg(test)]
mod tests;
