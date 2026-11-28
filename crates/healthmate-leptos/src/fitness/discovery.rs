use healthmate_domain::recommendation::expand_equipment;
use serde::Deserialize;
use std::collections::HashSet;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    id: String,
    primary: Vec<String>,
    secondary: Vec<String>,
    required: Option<Vec<String>>,
    equipment: Vec<String>,
    search_terms: Vec<String>,
}
#[derive(Deserialize)]
pub struct Filters {
    query: String,
    muscle: Option<String>,
    pub(super) gear: Option<String>,
    pub(super) available: Option<Vec<String>>,
}
pub fn select(rows: &[Entry], filters: &Filters) -> Vec<(usize, Option<&'static str>)> {
    let available = filters.available.as_deref().map(expand_equipment);
    let mut included = HashSet::new();
    let mut primary = vec![];
    let mut secondary = vec![];
    for (idx, row) in rows.iter().enumerate() {
        if included.contains(row.id.as_str())
            || (!filters.query.is_empty()
                && !row
                    .search_terms
                    .iter()
                    .any(|term| term.contains(&filters.query)))
            || filters
                .gear
                .as_ref()
                .is_some_and(|key| !row.equipment.contains(key))
            || available.as_ref().is_some_and(|inventory| {
                row.required
                    .as_ref()
                    .is_none_or(|need| !need.iter().all(|key| inventory.contains(key.as_str())))
            })
        {
            continue;
        }
        let group = filters.muscle.as_ref();
        let main = group.is_some_and(|key| row.primary.contains(key));
        if group.is_some_and(|key| !main && !row.secondary.contains(key)) {
            continue;
        }
        included.insert(row.id.as_str());
        if group.is_some() && !main {
            secondary.push((idx, Some("secondary")));
        } else {
            primary.push((idx, group.map(|_| "primary")));
        }
    }
    primary.extend(secondary);
    primary
}
#[cfg(target_arch = "wasm32")]
mod browser {
    use super::*;
    use wasm_bindgen::prelude::*;
    #[wasm_bindgen]
    pub struct FitnessIndex(Vec<Entry>);
    #[wasm_bindgen(js_name=createFitnessIndex)]
    pub fn create_index(json: &str) -> Result<FitnessIndex, JsValue> {
        serde_json::from_str(json)
            .map(FitnessIndex)
            .map_err(|_| js_sys::Error::new("Invalid workout catalog").into())
    }
    #[wasm_bindgen]
    impl FitnessIndex {
        pub fn query(&self, json: &str) -> Result<String, JsValue> {
            let f = serde_json::from_str(json)
                .map_err(|_| js_sys::Error::new("Invalid workout filters"))?;
            serde_json::to_string(&select(&self.0, &f))
                .map_err(|_| js_sys::Error::new("Invalid workout matches").into())
        }
    }
}
