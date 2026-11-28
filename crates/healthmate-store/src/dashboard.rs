use crate::{Error, Result, meals, query::rows};
use healthmate_domain::dates::{NaiveDate, add_calendar_days, parse_local_date};
use rusqlite::{Connection, params};
use serde_json::{Value, json};
use std::collections::BTreeMap;

const NUTRIENTS: [&str; 5] = ["calories", "protein", "carbs", "fat", "fiber"];

pub fn forecast(db: &Connection, date: &str) -> Result<Value> {
    let select=NUTRIENTS.iter().map(|n|format!("COALESCE(sum(CASE WHEN p.is_completed=1 THEN COALESCE(p.{n},0) ELSE d.total_{n}*p.servings END),0) AS {n}")).collect::<Vec<_>>().join(",");
    let sql = format!(
        "SELECT {select} FROM planned_dish p JOIN meal_slot m ON m.id=p.meal_slot_id
        JOIN day_plan a ON a.id=m.day_plan_id JOIN ({}) d ON d.id=p.dish_id WHERE a.date=?1",
        meals::PER_SERVING
    );
    Ok(rows(db, &sql, [date])?.remove(0))
}

pub fn logged_range(db: &Connection, start: NaiveDate, end: NaiveDate) -> Result<Vec<Value>> {
    if start > end {
        return Ok(vec![]);
    }
    let records = rows(
        db,
        "SELECT d.date AS date, COALESCE(sum(p.calories),0) AS calories,
        COALESCE(sum(p.protein),0) AS protein, COALESCE(sum(p.carbs),0) AS carbs,
        COALESCE(sum(p.fat),0) AS fat, COALESCE(sum(p.fiber),0) AS fiber
        FROM day_plan d JOIN meal_slot m ON m.day_plan_id=d.id
        JOIN planned_dish p ON p.meal_slot_id=m.id WHERE d.date BETWEEN ?1 AND ?2
        AND p.is_completed=1 AND p.completed_at IS NOT NULL GROUP BY d.date ORDER BY d.date",
        params![start.to_string(), end.to_string()],
    )?;
    let mut by_date = BTreeMap::new();
    for r in records {
        by_date.insert(
            r["date"]
                .as_str()
                .ok_or(rusqlite::Error::InvalidQuery)?
                .to_owned(),
            r,
        );
    }
    let mut result = vec![];
    let mut date = start;
    loop {
        let iso = date.to_string();
        result.push(by_date.remove(&iso).unwrap_or_else(
            || json!({"date":iso,"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0}),
        ));
        if date == end {
            break;
        }
        date = add_calendar_days(date, 1)
            .ok_or_else(|| Error::InvalidInput("Ngày kết thúc không hợp lệ.".into()))?;
    }
    Ok(result)
}

pub fn nutrition_streak(db: &Connection, today: NaiveDate, target: f64) -> Result<Option<usize>> {
    if !target.is_finite() || target <= 0. {
        return Ok(None);
    }
    let Some(start) = add_calendar_days(today, -30) else {
        return Ok(Some(0));
    };
    let Some(yesterday) = add_calendar_days(today, -1) else {
        return Ok(Some(0));
    };
    let days = logged_range(db, start, yesterday)?;
    Ok(Some(
        days.iter()
            .rev()
            .take_while(|r| {
                r["calories"]
                    .as_f64()
                    .is_some_and(|n| (80.0..=120.0).contains(&(n / target * 100.)))
            })
            .count(),
    ))
}

pub fn summary(db: &Connection, date: &str) -> Result<Value> {
    let today =
        parse_local_date(date).ok_or_else(|| Error::InvalidInput("Ngày không hợp lệ.".into()))?;
    if db.is_autocommit() {
        let read = db.unchecked_transaction()?;
        let value = summary_in(&read, today, date)?;
        read.commit()?;
        Ok(value)
    } else {
        summary_in(db, today, date)
    }
}

fn summary_in(db: &Connection, today: NaiveDate, date: &str) -> Result<Value> {
    let profile = crate::profile::get(db)?;
    let weight_rows = rows(
        db,
        "SELECT date,weight_kg FROM weight_log ORDER BY date DESC LIMIT 2",
        [],
    )?;
    let weight = if let Some(row) = weight_rows.first() {
        let current = row["weight_kg"].as_f64();
        let delta = weight_rows.get(1).and_then(|r| {
            Some((((current? - r["weight_kg"].as_f64()?) * 10.) + 0.5).floor() / 10.)
        });
        json!({"currentKg":current,"source":"weight_log","date":row["date"],"deltaKg":delta})
    } else {
        json!({"currentKg":profile.as_ref().map(|v|&v["weight_kg"]), "source":profile.as_ref().map(|_|"profile"),"date":null,"deltaKg":null})
    };
    let pending=rows(db,"SELECT m.meal_type AS mealType,p.id AS plannedDishId,d.date FROM planned_dish p
        JOIN meal_slot m ON m.id=p.meal_slot_id JOIN day_plan d ON d.id=m.day_plan_id
        WHERE d.date=?1 AND p.is_completed=0 ORDER BY m.position,p.sort_order,p.created_at,p.rowid LIMIT 1",[date])?.pop();
    let target = profile
        .as_ref()
        .and_then(|v| v["target_calories"].as_f64())
        .unwrap_or(0.);
    Ok(
        json!({"date":date,"profile":profile,"totals":forecast(db,date)?,"loggedTotals":meals::totals(db,date)?,
        "streakDays":nutrition_streak(db,today,target)?,"weight":weight,"pendingMeal":pending,
        "day":meals::day(db,date)?,"workout":crate::fitness::progress_summary(db,date)?}),
    )
}
