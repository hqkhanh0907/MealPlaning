use crate::{Error, Result, calendar, management, meals};
use healthmate_domain::nutrition::{NutritionTotals, portion_nutrition, valid_photo_grams};
use rusqlite::{Connection, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct FoodItem {
    pub name: String,
    #[serde(rename = "estimatedGrams")]
    pub estimated_grams: f64,
    #[serde(flatten)]
    pub nutrition: NutritionTotals,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PhotoPortion {
    pub item: FoodItem,
    pub grams: f64,
}

pub fn log(
    db: &mut Connection,
    capture_id: &str,
    date: &str,
    meal: &str,
    portions: &[PhotoPortion],
) -> Result<()> {
    if capture_id.is_empty()
        || portions.is_empty()
        || portions.iter().any(|p| {
            p.item.name.trim().is_empty()
                || !valid_photo_grams(p.grams)
                || !valid_photo_grams(p.item.estimated_grams)
        })
    {
        return Err(Error::InvalidInput(
            "Khẩu phần trong ảnh không hợp lệ.".into(),
        ));
    }
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let saved: bool = tx.query_row(
        "SELECT EXISTS(SELECT 1 FROM dish WHERE id=?1)",
        [capture_id],
        |r| r.get(0),
    )?;
    if saved {
        return Ok(());
    }
    let title = portions
        .iter()
        .map(|p| format!("{} ({} g)", p.item.name, p.grams))
        .collect::<Vec<_>>()
        .join(", ");
    let meal_tag = (meal != "snack").then_some(meal);
    tx.execute(
        "INSERT INTO dish(id,name,description,type,source,servings,meal_tag) VALUES
        (?1,?2,'Ước tính dinh dưỡng từ ảnh bữa ăn.','ai_autofill','ai',1,?3)",
        params![capture_id, title, meal_tag],
    )?;
    for (idx, p) in portions.iter().enumerate() {
        let n = portion_nutrition(p.item.nutrition, p.item.estimated_grams, 100.);
        let id = management::save_ingredient(
            &tx,
            None,
            &json!({"name":p.item.name,"category":"Khác","source":"ai","calories":n.calories,
            "protein":n.protein,"carbs":n.carbs,"fat":n.fat,"fiber":n.fiber}),
        )?;
        tx.execute("INSERT INTO dish_ingredient(id,dish_id,ingredient_id,gram_weight,sort_order) VALUES(?1,?2,?3,?4,?5)",
            params![Uuid::new_v4().to_string(),capture_id,id,p.grams,idx as i64])?;
    }
    let slot = meals::slot(&tx, date, meal)?;
    let entry = calendar::append(&tx, &slot, capture_id, 1.)?;
    meals::snapshot(&tx, &entry, 1.)?;
    tx.commit()?;
    Ok(())
}
