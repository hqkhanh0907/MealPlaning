use crate::{Error, Result};
use rusqlite::{Connection, OptionalExtension, Transaction, TransactionBehavior, params};
use serde::Deserialize;
use serde_json::Value;
use sha2::{Digest, Sha256};
use uuid::Uuid;

const VERSION: &str = "1.3.0";
const INGREDIENTS: &str = include_str!("../../../src/assets/seed/ingredients.json");
const COMPOSITES: &str = include_str!("../../../src/assets/seed/composites.json");
const DISHES: &str = include_str!("../../../src/assets/seed/dishes.json");

#[derive(Deserialize)]
struct Ingredient {
    id: String,
    name_vi: String,
    category: String,
    calories: f64,
    protein: f64,
    carbs: f64,
    fat: f64,
    fiber: f64,
}

#[derive(Deserialize)]
struct Recipe {
    id: String,
    name_vi: String,
    meal_tag: String,
    servings: f64,
    is_favorite: bool,
    ingredients: Vec<Portion>,
}

#[derive(Deserialize)]
struct Portion {
    ingredient_id: String,
    gram_weight: f64,
}

fn category(key: &str) -> &'static str {
    match key {
        "meat" => "Thịt",
        "seafood" => "Cá & Hải sản",
        "vegetable" => "Rau củ",
        "fruit" => "Trái cây",
        "grain" => "Ngũ cốc & Tinh bột",
        "dairy" | "egg" => "Trứng & Sữa",
        "condiment" | "spice" => "Gia vị",
        "composite" => "Nước dùng & Nước chấm",
        _ => "Khác",
    }
}

fn previous_macros(id: &str, version: &str) -> Option<([f64; 5], Option<&'static str>)> {
    if !matches!(version, "1.1.0" | "1.2.0") {
        return None;
    }
    if version == "1.1.0" && id == "7c4e8b1a-0002-4000-8000-000000000101" {
        return Some(([165., 31., 0., 3.6, 0.], Some("ức gà")));
    }
    let values = match id {
        "7c4e8b1a-0002-4000-8000-000000000001" => [29.17, 4.25, 3.0, 0.0, 0.0],
        "c0114c01-0001-4000-8000-000000000001" => [88.04, 1.45, 21.28, 0.03, 0.11],
        "c0114c01-0001-4000-8000-000000000002" => [28.32, 2.73, 0.81, 1.48, 0.13],
        "c0114c01-0001-4000-8000-000000000003" => [30.92, 2.78, 1.53, 1.49, 0.09],
        "c0114c01-0001-4000-8000-000000000004" => [73.3, 4.85, 1.52, 5.25, 0.19],
        "c0114c01-0001-4000-8000-000000000005" => [18.06, 0.29, 4.56, 0.04, 0.35],
        "c0114c01-0001-4000-8000-000000000006" => [20.01, 0.36, 4.96, 0.06, 0.19],
        "c0114c01-0001-4000-8000-000000000007" => [20.66, 2.97, 1.23, 0.49, 0.22],
        _ => return None,
    };
    Some((values, None))
}

fn fingerprint(value: &Value) -> Result<String> {
    let mut keys: Vec<_> = value
        .as_object()
        .ok_or_else(|| Error::InvalidInput("Expected a seed object".into()))?
        .keys()
        .collect();
    keys.sort_unstable();
    fn encode(value: &Value, keys: &[&String]) -> String {
        match value {
            Value::Object(map) => {
                let fields = keys.iter().filter_map(|key| {
                    map.get(*key)
                        .map(|v| format!("{}:{}", Value::String((**key).clone()), encode(v, keys)))
                });
                format!("{{{}}}", fields.collect::<Vec<_>>().join(","))
            }
            Value::Array(items) => format!(
                "[{}]",
                items
                    .iter()
                    .map(|v| encode(v, keys))
                    .collect::<Vec<_>>()
                    .join(",")
            ),
            Value::Number(n) => ryu_js::Buffer::new()
                .format(n.as_f64().expect("JSON number"))
                .to_owned(),
            _ => value.to_string(),
        }
    }
    Ok(format!(
        "{:x}",
        Sha256::digest(encode(value, &keys).as_bytes())
    ))
}

fn seeded(tx: &Transaction<'_>, id: &str) -> Result<Option<String>> {
    Ok(tx
        .query_row(
            "SELECT seed_version FROM seed_artifact WHERE artifact_id = ?1",
            [id],
            |r| r.get(0),
        )
        .optional()?)
}

fn ingredient(tx: &Transaction<'_>, raw: &Value) -> Result<usize> {
    let item: Ingredient = serde_json::from_value(raw.clone())?;
    let Ingredient {
        id,
        name_vi,
        category: key,
        calories,
        protein,
        carbs,
        fat,
        fiber,
    } = item;
    let group = category(&key);
    if let Some(version) = seeded(tx, &id)? {
        let Some(([old_cal, old_pro, old_carbs, old_fat, old_fiber], old_name)) =
            previous_macros(&id, &version)
        else {
            return Ok(0);
        };
        let changed = tx.execute(
            "UPDATE ingredient SET name=?1, calories=?2, protein=?3, carbs=?4, fat=?5, fiber=?6
            WHERE id=?7 AND source='db' AND updated_at IS NULL AND name=?8 AND category=?9
            AND calories=?10 AND protein=?11 AND carbs=?12 AND fat=?13 AND fiber=?14",
            params![
                name_vi,
                calories,
                protein,
                carbs,
                fat,
                fiber,
                id,
                old_name.unwrap_or(&name_vi),
                group,
                old_cal,
                old_pro,
                old_carbs,
                old_fat,
                old_fiber
            ],
        )?;
        tx.execute(
            "UPDATE seed_artifact SET seed_version=?1, fingerprint_hash=?2 WHERE artifact_id=?3",
            params![VERSION, fingerprint(raw)?, id],
        )?;
        return Ok(changed);
    }
    tx.execute(
        "INSERT INTO ingredient (id,name,category,calories,protein,carbs,fat,fiber,source)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'db')",
        params![id, name_vi, group, calories, protein, carbs, fat, fiber],
    )?;
    tx.execute(
        "INSERT INTO seed_artifact (artifact_id,artifact_type,seed_version,fingerprint_hash)
        VALUES (?1,'ingredient',?2,?3)",
        params![id, VERSION, fingerprint(raw)?],
    )?;
    Ok(1)
}

fn dish(tx: &Transaction<'_>, raw: &Value) -> Result<usize> {
    let item: Recipe = serde_json::from_value(raw.clone())?;
    if seeded(tx, &item.id)?.is_some() {
        return Ok(0);
    }
    tx.execute("INSERT INTO dish (id,name,type,servings,source,meal_tag,is_favorite) VALUES (?1,?2,'ingredient_based',?3,'db',?4,?5)",
        params![item.id,item.name_vi,item.servings,item.meal_tag,item.is_favorite])?;
    for (position, portion) in item.ingredients.iter().enumerate() {
        tx.execute(
            "INSERT INTO dish_ingredient (id,dish_id,ingredient_id,gram_weight,sort_order)
            VALUES (?1,?2,?3,?4,?5)",
            params![
                Uuid::new_v4().to_string(),
                item.id,
                portion.ingredient_id,
                portion.gram_weight,
                position as i64
            ],
        )?;
    }
    tx.execute(
        "INSERT INTO seed_artifact (artifact_id,artifact_type,seed_version,fingerprint_hash)
        VALUES (?1,'dish',?2,?3)",
        params![item.id, VERSION, fingerprint(raw)?],
    )?;
    Ok(1)
}

pub fn seed_catalog(db: &mut Connection) -> Result<(usize, usize)> {
    let ingredients: Vec<Value> = serde_json::from_str(INGREDIENTS)?;
    let composites: Vec<Value> = serde_json::from_str(COMPOSITES)?;
    let dishes: Vec<Value> = serde_json::from_str(DISHES)?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let mut counts = (0, 0);
    for v in ingredients.iter().chain(&composites) {
        counts.0 += ingredient(&tx, v)?;
    }
    for v in &dishes {
        counts.1 += dish(&tx, v)?;
    }
    tx.commit()?;
    Ok(counts)
}
