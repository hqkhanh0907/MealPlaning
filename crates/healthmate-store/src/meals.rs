use crate::{Error, Result, query::rows};
use rusqlite::{Connection, TransactionBehavior, params};
use serde_json::Value;
use uuid::Uuid;

const MEAL_TYPES: [&str; 4] = ["breakfast", "lunch", "dinner", "snack"];
pub(crate) const PER_SERVING: &str = include_str!("per-serving.sql");

pub fn ingredients(db: &Connection, query: &str) -> Result<Vec<Value>> {
    rows(
        db,
        "SELECT * FROM ingredient WHERE name LIKE ?1 ORDER BY name COLLATE NOCASE",
        [format!("%{query}%")],
    )
}

pub fn dishes(db: &Connection, query: &str) -> Result<Vec<Value>> {
    rows(
        db,
        &format!("SELECT * FROM ({PER_SERVING}) WHERE name LIKE ?1 ORDER BY name COLLATE NOCASE"),
        [format!("%{query}%")],
    )
}

pub fn dish(db: &Connection, id: &str) -> Result<Option<Value>> {
    let result = rows(
        db,
        &format!("SELECT * FROM ({PER_SERVING}) WHERE id=?1"),
        [id],
    )?
    .pop();
    let Some(mut value) = result else {
        return Ok(None);
    };
    value["ingredients"] = rows(
        db,
        "SELECT di.*,i.name AS ingredient_name,i.calories,i.protein,i.carbs,i.fat,i.fiber
        FROM dish_ingredient di JOIN ingredient i ON i.id=di.ingredient_id
        WHERE di.dish_id=?1 ORDER BY di.sort_order,di.rowid",
        [id],
    )?
    .into();
    Ok(Some(value))
}

fn day_record(db: &Connection, date: &str) -> Result<Option<Value>> {
    let Some(mut day) = rows(db, "SELECT * FROM day_plan WHERE date=?1", [date])?.pop() else {
        return Ok(None);
    };
    let mut slots = rows(
        db,
        "SELECT * FROM meal_slot WHERE day_plan_id=?1 ORDER BY position",
        [day["id"].as_str()],
    )?;
    let sql=format!("SELECT pd.*,d.name AS dish_name,
        CASE WHEN pd.is_completed=1 THEN pd.calories ELSE d.total_calories*pd.servings END AS effective_calories,
        CASE WHEN pd.is_completed=1 THEN pd.protein ELSE d.total_protein*pd.servings END AS effective_protein,
        CASE WHEN pd.is_completed=1 THEN pd.carbs ELSE d.total_carbs*pd.servings END AS effective_carbs,
        CASE WHEN pd.is_completed=1 THEN pd.fat ELSE d.total_fat*pd.servings END AS effective_fat,
        CASE WHEN pd.is_completed=1 THEN COALESCE(pd.fiber,0) ELSE d.total_fiber*pd.servings END AS effective_fiber
        FROM planned_dish pd JOIN ({PER_SERVING}) d ON d.id=pd.dish_id
        WHERE pd.meal_slot_id=?1 ORDER BY pd.sort_order,pd.created_at,pd.rowid");
    for slot in &mut slots {
        slot["planned_dishes"] = rows(db, &sql, [slot["id"].as_str()])?.into();
    }
    day["meal_slots"] = slots.into();
    Ok(Some(day))
}

pub fn day(db: &Connection, date: &str) -> Result<Option<Value>> {
    if !db.is_autocommit() {
        return day_record(db, date);
    }
    let read = db.unchecked_transaction()?;
    let data = day_record(&read, date)?;
    read.commit()?;
    Ok(data)
}

pub(crate) fn slot(db: &Connection, date: &str, meal: &str) -> Result<String> {
    if !MEAL_TYPES.contains(&meal) {
        return Err(Error::InvalidInput("Unknown meal".into()));
    }
    let valid: bool = db.query_row(
        "SELECT ?1 GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(?1,'+0 days') IS ?1",
        [date],
        |r| r.get(0),
    )?;
    if !valid {
        return Err(Error::InvalidInput("Invalid calendar date".into()));
    }
    db.execute("INSERT INTO day_plan(id,date,target_calories,target_protein) VALUES(?1,?2,0,0) ON CONFLICT(date) DO NOTHING",params![Uuid::new_v4().to_string(),date])?;
    let day_id: String = db.query_row("SELECT id FROM day_plan WHERE date=?1", [date], |r| {
        r.get(0)
    })?;
    for (i, kind) in MEAL_TYPES.iter().enumerate() {
        db.execute(
            "INSERT INTO meal_slot(id,day_plan_id,meal_type,position) VALUES(?1,?2,?3,?4)
            ON CONFLICT(day_plan_id,meal_type) DO NOTHING",
            params![Uuid::new_v4().to_string(), day_id, kind, i as i64],
        )?;
    }
    Ok(db.query_row(
        "SELECT id FROM meal_slot WHERE day_plan_id=?1 AND meal_type=?2",
        params![day_id, meal],
        |r| r.get(0),
    )?)
}

pub fn plan(
    db: &mut Connection,
    date: &str,
    meal: &str,
    dish_id: &str,
    servings: f64,
) -> Result<String> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let meal_slot = slot(&tx, date, meal)?;
    let id = crate::calendar::append(&tx, &meal_slot, dish_id, servings)?;
    tx.commit()?;
    Ok(id)
}

pub(crate) fn snapshot(db: &Connection, id: &str, servings: f64) -> Result<()> {
    db.execute(&format!("UPDATE planned_dish SET servings=?2,
        (calories,protein,carbs,fat,fiber)=(SELECT total_calories*?2,total_protein*?2,total_carbs*?2,total_fat*?2,total_fiber*?2
        FROM ({PER_SERVING}) WHERE id=planned_dish.dish_id),
        completed_at=COALESCE(completed_at,datetime('now')),is_completed=1 WHERE id=?1"),
        params![id,servings])?;
    Ok(())
}

pub fn set_completed(db: &mut Connection, id: &str, done: bool) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let (already, servings): (bool, f64) = tx.query_row(
        "SELECT is_completed,servings FROM planned_dish WHERE id=?1",
        [id],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    if done != already {
        if done {
            snapshot(&tx, id, servings)?;
        } else {
            tx.execute(
                "UPDATE planned_dish SET is_completed=0,completed_at=NULL,
                calories=NULL,protein=NULL,carbs=NULL,fat=NULL,fiber=NULL WHERE id=?1",
                [id],
            )?;
        }
    }
    tx.commit()?;
    Ok(())
}

pub fn set_servings(db: &mut Connection, id: &str, servings: f64) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let completed: bool = tx.query_row(
        "SELECT is_completed FROM planned_dish WHERE id=?1",
        [id],
        |r| r.get(0),
    )?;
    if completed {
        snapshot(&tx, id, servings)?;
    } else {
        tx.execute(
            "UPDATE planned_dish SET servings=?2 WHERE id=?1",
            params![id, servings],
        )?;
    }
    tx.commit()?;
    Ok(())
}

pub fn remove(db: &mut Connection, id: &str) -> Result<()> {
    crate::calendar::delete(db, id)?;
    Ok(())
}

pub fn totals(db: &Connection, date: &str) -> Result<Value> {
    let mut results=rows(db,"SELECT COALESCE(sum(pd.calories),0) AS calories,COALESCE(sum(pd.protein),0) AS protein,
        COALESCE(sum(pd.carbs),0) AS carbs,COALESCE(sum(pd.fat),0) AS fat,COALESCE(sum(pd.fiber),0) AS fiber
        FROM planned_dish pd JOIN meal_slot ms ON ms.id=pd.meal_slot_id JOIN day_plan dp ON dp.id=ms.day_plan_id
        WHERE dp.date=?1 AND pd.is_completed=1 AND pd.completed_at IS NOT NULL",[date])?;
    results
        .pop()
        .ok_or_else(|| Error::Sql(rusqlite::Error::QueryReturnedNoRows))
}

pub fn set_favorite(db: &Connection, id: &str, favorite: bool) -> Result<()> {
    db.execute(
        "UPDATE dish SET is_favorite=?2 WHERE id=?1",
        params![id, favorite],
    )?;
    Ok(())
}
