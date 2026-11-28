use super::{
    catalog, dish, ingredient,
    model::{Catalog, Dish, Ingredient},
};
use crate::region::{RegionHandle, mount};
use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

#[wasm_bindgen(js_name=mountManagement)]
pub fn mount_management(
    root: HtmlElement,
    kind: &str,
    json: &str,
    callback: js_sys::Function,
) -> Result<RegionHandle, JsValue> {
    match kind {
        "catalog" => mount::<Catalog, _>(root, json, callback, catalog::view),
        "ingredient" => mount::<Ingredient, _>(root, json, callback, ingredient::view),
        "dishNutrition" => mount::<Dish, _>(root, json, callback, |d, _| dish::hero(d)),
        "dishItems" => mount::<Dish, _>(root, json, callback, dish::items),
        _ => Err(js_sys::Error::new("Unknown management view").into()),
    }
}
