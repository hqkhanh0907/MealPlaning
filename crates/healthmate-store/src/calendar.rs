use crate::{Error, Result, meals, query::rows, write};
use healthmate_domain::dates::week_dates;
use rusqlite::{Connection, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub meal_type: String,
    pub dish_id: String,
    pub servings: f64,
}

pub(crate) fn append(db: &Connection, slot: &str, dish: &str, servings: f64) -> Result<String> {
    let id = Uuid::new_v4().to_string();
    db.execute(
        "INSERT INTO planned_dish(id,meal_slot_id,dish_id,servings,sort_order)
        SELECT ?1,?2,?3,?4,COALESCE(MAX(sort_order),-1)+1 FROM planned_dish WHERE meal_slot_id=?2",
        params![id, slot, dish, servings],
    )?;
    Ok(id)
}

pub fn delete(db: &mut Connection, id: &str) -> Result<Option<Value>> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let Some(mut saved) = rows(&tx, "SELECT * FROM planned_dish WHERE id=?1", [id])?.pop() else {
        return Ok(None);
    };
    let start = saved["sort_order"]
        .as_i64()
        .ok_or(rusqlite::Error::InvalidQuery)?;
    let records = rows(
        &tx,
        "SELECT id,sort_order FROM planned_dish WHERE meal_slot_id=?1 AND sort_order>=?2
        ORDER BY sort_order,created_at,rowid",
        params![saved["meal_slot_id"].as_str(), start],
    )?;
    let mut next = start;
    for row in records {
        let order = row["sort_order"]
            .as_i64()
            .ok_or(rusqlite::Error::InvalidQuery)?;
        let actual = order.max(next);
        if row["id"] == id {
            saved["sort_order"] = json!(actual);
        } else if actual != order {
            tx.execute(
                "UPDATE planned_dish SET sort_order=?1 WHERE id=?2",
                params![actual, row["id"].as_str()],
            )?;
        }
        next = actual + 1;
    }
    tx.execute("DELETE FROM planned_dish WHERE id=?1", [id])?;
    tx.commit()?;
    Ok(Some(saved))
}

pub fn restore_deleted(db: &mut Connection, record: &Value) -> Result<()> {
    let fields = write::fields(
        record,
        &[
            "id",
            "meal_slot_id",
            "dish_id",
            "servings",
            "sort_order",
            "is_completed",
            "completed_at",
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "created_at",
        ],
    )?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let slot = record["meal_slot_id"]
        .as_str()
        .ok_or(rusqlite::Error::InvalidQuery)?;
    let order = record["sort_order"]
        .as_i64()
        .ok_or(rusqlite::Error::InvalidQuery)?;
    tx.execute("UPDATE planned_dish SET sort_order=sort_order+1 WHERE meal_slot_id=?1 AND sort_order>=?2 AND
        EXISTS(SELECT 1 FROM planned_dish WHERE meal_slot_id=?1 AND sort_order=?2)",params![slot,order])?;
    write::insert(&tx, "planned_dish", &fields)?;
    tx.commit()?;
    Ok(())
}

pub fn move_to_slot(db: &Connection, id: &str, to: &str) -> Result<()> {
    db.execute("UPDATE planned_dish SET meal_slot_id=?1,sort_order=(SELECT COALESCE(MAX(sort_order),-1)+1 FROM planned_dish WHERE meal_slot_id=?1) WHERE id=?2",params![to,id])?;
    Ok(())
}

pub fn copy_to_date(
    db: &mut Connection,
    id: &str,
    target_date: &str,
    meal: &str,
) -> Result<String> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let (dish, servings): (String, f64) = tx.query_row(
        "SELECT dish_id,servings FROM planned_dish WHERE id=?1",
        [id],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    let slot = meals::slot(&tx, target_date, meal)?;
    let result = append(&tx, &slot, &dish, servings)?;
    tx.commit()?;
    Ok(result)
}

fn replace(db: &Connection, date: &str, items: &[Item], only_empty: bool) -> Result<usize> {
    if items.is_empty() {
        return Ok(0);
    }
    let slots =
        "SELECT ms.id FROM meal_slot ms JOIN day_plan dp ON dp.id=ms.day_plan_id WHERE dp.date=?1";
    if only_empty {
        let occupied: bool = db.query_row(
            &format!("SELECT EXISTS(SELECT 1 FROM planned_dish WHERE meal_slot_id IN ({slots}))"),
            [date],
            |r| r.get(0),
        )?;
        if occupied {
            return Ok(0);
        }
    } else {
        db.execute(
            &format!("DELETE FROM planned_dish WHERE is_completed=0 AND meal_slot_id IN ({slots})"),
            [date],
        )?;
    }
    for item in items {
        let slot = meals::slot(db, date, &item.meal_type)?;
        append(db, &slot, &item.dish_id, item.servings)?;
    }
    Ok(items.len())
}

pub fn replace_plan_in(db: &Connection, date: &str, items: &[Item]) -> Result<usize> {
    if db.is_autocommit() {
        return Err(Error::InvalidInput(
            "An active meal-plan transaction is required.".into(),
        ));
    }
    replace(db, date, items, false)
}

pub fn replace_plan(db: &mut Connection, date: &str, items: &[Item]) -> Result<usize> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let count = replace_plan_in(&tx, date, items)?;
    tx.commit()?;
    Ok(count)
}

fn items_for(db: &Connection, date: &str) -> Result<Vec<Item>> {
    let mut q = db.prepare(
        "SELECT ms.meal_type,pd.dish_id,pd.servings FROM planned_dish pd
        JOIN meal_slot ms ON ms.id=pd.meal_slot_id JOIN day_plan dp ON dp.id=ms.day_plan_id
        WHERE dp.date=?1 ORDER BY ms.position,pd.sort_order,pd.created_at,pd.rowid",
    )?;
    let items = q
        .query_map([date], |r| {
            Ok(Item {
                meal_type: r.get(0)?,
                dish_id: r.get(1)?,
                servings: r.get(2)?,
            })
        })?
        .collect::<rusqlite::Result<_>>()?;
    Ok(items)
}

pub fn copy_to_empty_day(db: &mut Connection, from: &str, to: &str) -> Result<usize> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let count = replace(&tx, to, &items_for(&tx, from)?, true)?;
    tx.commit()?;
    Ok(count)
}

pub fn copy_week(db: &mut Connection, from: &str, to: &str) -> Result<(usize, usize)> {
    let source = week_dates(from);
    let target = week_dates(to);
    if source.len() != 7 || target.len() != 7 {
        return Err(Error::InvalidInput(
            "Ngày bắt đầu tuần không hợp lệ.".into(),
        ));
    }
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let originals = source
        .iter()
        .map(|d| items_for(&tx, &d.to_string()))
        .collect::<Result<Vec<_>>>()?;
    let mut copied = 0;
    let mut days = 0;
    for (d, items) in target.iter().zip(originals) {
        let count = replace(&tx, &d.to_string(), &items, false)?;
        copied += count;
        days += usize::from(count > 0);
    }
    tx.commit()?;
    Ok((copied, days))
}

pub fn recent_dishes(db: &Connection, limit: u32) -> Result<Vec<Value>> {
    rows(
        db,
        &format!(
            "SELECT d.* FROM ({}) d JOIN (
        SELECT dish_id,MAX(completed_at) AS last_logged FROM planned_dish
        WHERE is_completed=1 AND completed_at IS NOT NULL GROUP BY dish_id
        ) h ON h.dish_id=d.id ORDER BY h.last_logged DESC,d.name COLLATE NOCASE LIMIT ?1",
            meals::PER_SERVING
        ),
        [limit],
    )
}
