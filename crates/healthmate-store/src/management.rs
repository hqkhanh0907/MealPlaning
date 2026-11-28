use crate::{Error, Result, query::rows, write};
use rusqlite::{Connection, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use uuid::Uuid;

const INGREDIENT: &[&str] = &[
    "name", "category", "calories", "protein", "carbs", "fat", "fiber", "source",
];
const DISH: &[&str] = &[
    "name",
    "description",
    "type",
    "source",
    "servings",
    "image_url",
    "meal_tag",
];
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Portion {
    pub ingredient_id: String,
    pub gram_weight: f64,
}

pub fn save_ingredient(db: &Connection, id: Option<&str>, input: &Value) -> Result<String> {
    let mut fields = write::fields(input, INGREDIENT)?;
    if let Some(name) = fields.get("name")
        && name.as_str().is_none_or(|s| s.trim().is_empty())
    {
        return Err(Error::InvalidInput(
            "Tên nguyên liệu không được trống.".into(),
        ));
    }
    for field in ["calories", "protein", "carbs", "fat", "fiber"] {
        if let Some(v) = fields.get(field)
            && !v.as_f64().is_some_and(|n| n.is_finite() && n >= 0.)
        {
            return Err(Error::InvalidInput(
                "Giá trị dinh dưỡng không hợp lệ.".into(),
            ));
        }
    }
    if let Some(id) = id {
        fields.insert("source".into(), json!("manual"));
        write::update(db, "ingredient", id, &fields)?;
        return Ok(id.into());
    }
    let id = Uuid::new_v4().to_string();
    fields.insert("id".into(), json!(id));
    fields.entry("source").or_insert(json!("manual"));
    write::insert(db, "ingredient", &fields)?;
    Ok(id)
}

pub fn save_dish(
    db: &mut Connection,
    id: Option<&str>,
    input: &Value,
    ingredients: &[Portion],
) -> Result<String> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let id = save_dish_in(&tx, id, input, ingredients)?;
    tx.commit()?;
    Ok(id)
}

pub fn save_dish_in(
    db: &Connection,
    id: Option<&str>,
    input: &Value,
    ingredients: &[Portion],
) -> Result<String> {
    if ingredients.is_empty() {
        return Err(Error::InvalidInput(
            "Món ăn phải có ít nhất một nguyên liệu.".into(),
        ));
    }
    let mut fields = write::fields(input, DISH)?;
    if fields
        .get("name")
        .and_then(Value::as_str)
        .is_none_or(|s| s.trim().is_empty())
        || fields
            .get("servings")
            .and_then(Value::as_f64)
            .is_none_or(|n| !n.is_finite() || n <= 0.)
    {
        return Err(Error::InvalidInput(
            "Tên hoặc số khẩu phần không hợp lệ.".into(),
        ));
    }
    if db.is_autocommit() {
        return Err(Error::InvalidInput(
            "An active recipe transaction is required.".into(),
        ));
    }
    let tx = db;
    let id = if let Some(id) = id {
        let source: String =
            tx.query_row("SELECT source FROM dish WHERE id=?1", [id], |r| r.get(0))?;
        fields.insert(
            "source".into(),
            json!(if source == "db" { "custom" } else { &source }),
        );
        write::update(tx, "dish", id, &fields)?;
        tx.execute("DELETE FROM dish_ingredient WHERE dish_id=?1", [id])?;
        id.to_owned()
    } else {
        let id = Uuid::new_v4().to_string();
        fields.insert("id".into(), json!(id));
        fields.entry("source").or_insert(json!("custom"));
        fields.entry("type").or_insert(json!("ingredient_based"));
        write::insert(tx, "dish", &fields)?;
        id
    };
    for (i, part) in ingredients.iter().enumerate() {
        tx.execute(
            "INSERT INTO dish_ingredient(id,dish_id,ingredient_id,gram_weight,sort_order)
            VALUES (?1,?2,?3,?4,?5)",
            params![
                Uuid::new_v4().to_string(),
                id,
                part.ingredient_id,
                part.gram_weight,
                i as i64
            ],
        )?;
    }
    Ok(id)
}

pub fn delete_ingredient(db: &Connection, id: &str) -> Result<()> {
    db.execute("DELETE FROM ingredient WHERE id=?1", [id])?;
    Ok(())
}
pub fn delete_dish(db: &Connection, id: &str) -> Result<()> {
    db.execute("DELETE FROM dish WHERE id=?1", [id])?;
    Ok(())
}
pub fn dishes_using(db: &Connection, id: &str) -> Result<Vec<Value>> {
    rows(
        db,
        "SELECT d.id,d.name FROM dish d JOIN dish_ingredient di ON di.dish_id=d.id WHERE di.ingredient_id=?1 ORDER BY d.name COLLATE NOCASE",
        [id],
    )
}
